package auth

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/luponetn/launch.io/internal/config"
	"github.com/luponetn/launch.io/internal/db"
	"github.com/luponetn/launch.io/internal/jwt"
)

type Service interface {
	GetGitHubLoginURL(state string) string
	HandleGitHubCallback(ctx context.Context, code string) (*AuthResponse, error)
	RefreshToken(ctx context.Context, refreshToken string) (*AuthResponse, error)
	GetUserByID(ctx context.Context, userID string) (*UserDTO, error)
	GetValidGitHubToken(ctx context.Context, userID string) (string, error)
}

type service struct {
	query  *db.Queries
	config *config.Config
	client *http.Client
}

func NewService(query *db.Queries, cfg *config.Config) Service {
	return &service{
		query:  query,
		config: cfg,
		client: &http.Client{},
	}
}

func (s *service) GetGitHubLoginURL(state string) string {
	baseURL := "https://github.com/login/oauth/authorize"
	params := url.Values{}
	params.Add("client_id", s.config.GitHubClientID)
	if s.config.GitHubRedirectURI != "" {
		params.Add("redirect_uri", s.config.GitHubRedirectURI)
	}
	params.Add("scope", "repo,admin:repo_hook,user:email")
	if state != "" {
		params.Add("state", state)
	}
	return fmt.Sprintf("%s?%s", baseURL, params.Encode())
}

func (s *service) HandleGitHubCallback(ctx context.Context, code string) (*AuthResponse, error) {
	if code == "" {
		return nil, errors.New("authorization code is required")
	}

	// 1. Exchange authorization code for access token
	tokenPayload := map[string]string{
		"client_id":     s.config.GitHubClientID,
		"client_secret": s.config.GitHubClientSecret,
		"code":          code,
	}
	if s.config.GitHubRedirectURI != "" {
		tokenPayload["redirect_uri"] = s.config.GitHubRedirectURI
	}

	tokenReqBody, _ := json.Marshal(tokenPayload)

	req, err := http.NewRequestWithContext(ctx, "POST", "https://github.com/login/oauth/access_token", bytes.NewBuffer(tokenReqBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create token request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to exchange code with github: %w", err)
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read github token response: %w", err)
	}

	var tokenResp GitHubOAuthTokenResponse
	if err := json.Unmarshal(bodyBytes, &tokenResp); err != nil {
		return nil, fmt.Errorf("failed to parse github token response: %w", err)
	}

	if tokenResp.Error != "" {
		return nil, fmt.Errorf("github oauth error: %s (%s)", tokenResp.Error, tokenResp.ErrorDesc)
	}

	if tokenResp.AccessToken == "" {
		return nil, errors.New("github returned an empty access token")
	}

	// 2. Fetch GitHub User profile
	userReq, err := http.NewRequestWithContext(ctx, "GET", "https://api.github.com/user", nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create user request: %w", err)
	}
	userReq.Header.Set("Authorization", "Bearer "+tokenResp.AccessToken)
	userReq.Header.Set("Accept", "application/json")
	userReq.Header.Set("User-Agent", "launch.io-server")

	userResp, err := s.client.Do(userReq)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user profile from github: %w", err)
	}
	defer userResp.Body.Close()

	userBodyBytes, err := io.ReadAll(userResp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read github user response: %w", err)
	}

	var ghUser GitHubUser
	if err := json.Unmarshal(userBodyBytes, &ghUser); err != nil {
		return nil, fmt.Errorf("failed to parse github user profile: %w", err)
	}

	// 3. If primary email is empty, fetch user emails
	email := ghUser.Email
	if email == "" {
		emailReq, err := http.NewRequestWithContext(ctx, "GET", "https://api.github.com/user/emails", nil)
		if err == nil {
			emailReq.Header.Set("Authorization", "Bearer "+tokenResp.AccessToken)
			emailReq.Header.Set("Accept", "application/json")
			emailReq.Header.Set("User-Agent", "launch.io-server")

			emailResp, err := s.client.Do(emailReq)
			if err == nil {
				defer emailResp.Body.Close()
				emailBodyBytes, err := io.ReadAll(emailResp.Body)
				if err == nil {
					var emails []GitHubEmail
					if err := json.Unmarshal(emailBodyBytes, &emails); err == nil {
						for _, e := range emails {
							if e.Primary && e.Verified {
								email = e.Email
								break
							}
						}
						if email == "" && len(emails) > 0 {
							email = emails[0].Email
						}
					}
				}
			}
		}
	}

	if email == "" {
		return nil, errors.New("unable to retrieve a valid email from GitHub profile")
	}

	name := ghUser.Name
	if name == "" {
		name = ghUser.Login
	}

	githubIDStr := strconv.FormatInt(ghUser.ID, 10)
	githubIDPg := pgtype.Text{String: githubIDStr, Valid: true}

	var refreshTokenPg pgtype.Text
	if tokenResp.RefreshToken != "" {
		refreshTokenPg = pgtype.Text{String: tokenResp.RefreshToken, Valid: true}
	}

	var expiresAtPg pgtype.Timestamptz
	if tokenResp.ExpiresIn > 0 {
		expiresAtPg = pgtype.Timestamptz{Time: time.Now().Add(time.Duration(tokenResp.ExpiresIn) * time.Second), Valid: true}
	}

	// 4. Database user lookup or creation
	var userRecord db.User
	userRecord, err = s.query.GetUserByGithubID(ctx, githubIDPg)
	if err == nil {
		// Existing user: update token, refresh token, and profile
		userRecord, err = s.query.UpdateUserGithub(ctx, db.UpdateUserGithubParams{
			ID:                   userRecord.ID,
			Name:                 name,
			Email:                email,
			GithubID:             githubIDStr,
			GithubAccessToken:    tokenResp.AccessToken,
			GithubRefreshToken:   tokenResp.RefreshToken,
			GithubTokenExpiresAt: expiresAtPg,
		})
		if err != nil {
			return nil, fmt.Errorf("failed to update user github token: %w", err)
		}
	} else if errors.Is(err, pgx.ErrNoRows) {
		// Check if user exists by email
		existingUser, emailErr := s.query.GetUserByEmail(ctx, email)
		if emailErr == nil {
			// Update existing user with GitHub ID and Token
			userRecord, err = s.query.UpdateUserGithub(ctx, db.UpdateUserGithubParams{
				ID:                   existingUser.ID,
				Name:                 name,
				Email:                email,
				GithubID:             githubIDStr,
				GithubAccessToken:    tokenResp.AccessToken,
				GithubRefreshToken:   tokenResp.RefreshToken,
				GithubTokenExpiresAt: expiresAtPg,
			})
			if err != nil {
				return nil, fmt.Errorf("failed to update user with github id: %w", err)
			}
		} else if errors.Is(emailErr, pgx.ErrNoRows) {
			// Create new user
			userRecord, err = s.query.CreateUser(ctx, db.CreateUserParams{
				Name:                 name,
				Email:                email,
				Password:             pgtype.Text{Valid: false},
				GithubID:             githubIDPg,
				GithubAccessToken:    pgtype.Text{String: tokenResp.AccessToken, Valid: true},
				GithubRefreshToken:   refreshTokenPg,
				GithubTokenExpiresAt: expiresAtPg,
			})
			if err != nil {
				return nil, fmt.Errorf("failed to create user in database: %w", err)
			}
		} else {
			return nil, fmt.Errorf("failed to query user by email: %w", emailErr)
		}
	} else {
		return nil, fmt.Errorf("failed to query user by github id: %w", err)
	}

	userDTO := userToDTO(userRecord)

	// 5. Generate JWT tokens
	accessToken, err := jwt.GenerateAccessToken(userDTO.ID, userDTO.Email, s.config.JWTAccessSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken, err := jwt.GenerateRefreshToken(userDTO.ID, userDTO.Email, s.config.JWTRefreshSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User:         userDTO,
	}, nil
}

func (s *service) RefreshToken(ctx context.Context, refreshToken string) (*AuthResponse, error) {
	claims, err := jwt.ValidateToken(refreshToken, s.config.JWTRefreshSecret)
	if err != nil {
		return nil, fmt.Errorf("invalid refresh token: %w", err)
	}

	var uuidPg pgtype.UUID
	if err := uuidPg.Scan(claims.UserID); err != nil {
		return nil, fmt.Errorf("invalid user id in token claims: %w", err)
	}

	userRecord, err := s.query.GetUserByID(ctx, uuidPg)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}

	userDTO := userToDTO(userRecord)

	newAccessToken, err := jwt.GenerateAccessToken(userDTO.ID, userDTO.Email, s.config.JWTAccessSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	newRefreshToken, err := jwt.GenerateRefreshToken(userDTO.ID, userDTO.Email, s.config.JWTRefreshSecret)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	return &AuthResponse{
		AccessToken:  newAccessToken,
		RefreshToken: newRefreshToken,
		User:         userDTO,
	}, nil
}

func (s *service) GetUserByID(ctx context.Context, userID string) (*UserDTO, error) {
	var uuidPg pgtype.UUID
	if err := uuidPg.Scan(userID); err != nil {
		return nil, fmt.Errorf("invalid user id: %w", err)
	}

	userRecord, err := s.query.GetUserByID(ctx, uuidPg)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user: %w", err)
	}

	dto := userToDTO(userRecord)
	return &dto, nil
}

func (s *service) GetValidGitHubToken(ctx context.Context, userID string) (string, error) {
	var uuidPg pgtype.UUID
	if err := uuidPg.Scan(userID); err != nil {
		return "", fmt.Errorf("invalid user id: %w", err)
	}

	userRecord, err := s.query.GetUserByID(ctx, uuidPg)
	if err != nil {
		return "", fmt.Errorf("user not found: %w", err)
	}

	if !userRecord.GithubAccessToken.Valid || userRecord.GithubAccessToken.String == "" {
		return "", errors.New("user has no github access token stored")
	}

	// Check if token is expiring within 5 minutes or already expired
	isExpiringSoon := userRecord.GithubTokenExpiresAt.Valid && time.Now().Add(5*time.Minute).After(userRecord.GithubTokenExpiresAt.Time)
	hasRefreshToken := userRecord.GithubRefreshToken.Valid && userRecord.GithubRefreshToken.String != ""

	if isExpiringSoon && hasRefreshToken {
		// Refresh GitHub access token with GitHub API
		tokenPayload := map[string]string{
			"client_id":     s.config.GitHubClientID,
			"client_secret": s.config.GitHubClientSecret,
			"grant_type":    "refresh_token",
			"refresh_token": userRecord.GithubRefreshToken.String,
		}

		bodyBytesJson, _ := json.Marshal(tokenPayload)
		req, err := http.NewRequestWithContext(ctx, "POST", "https://github.com/login/oauth/access_token", bytes.NewBuffer(bodyBytesJson))
		if err != nil {
			return "", fmt.Errorf("failed to create refresh token request: %w", err)
		}
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Accept", "application/json")

		resp, err := s.client.Do(req)
		if err != nil {
			return "", fmt.Errorf("failed to refresh github token: %w", err)
		}
		defer resp.Body.Close()

		respBody, err := io.ReadAll(resp.Body)
		if err != nil {
			return "", fmt.Errorf("failed to read refresh response: %w", err)
		}

		var tokenResp GitHubOAuthTokenResponse
		if err := json.Unmarshal(respBody, &tokenResp); err != nil {
			return "", fmt.Errorf("failed to parse refresh token response: %w", err)
		}

		if tokenResp.Error != "" || tokenResp.AccessToken == "" {
			return "", fmt.Errorf("github token refresh failed: %s (%s)", tokenResp.Error, tokenResp.ErrorDesc)
		}

		var newExpiresAtPg pgtype.Timestamptz
		if tokenResp.ExpiresIn > 0 {
			newExpiresAtPg = pgtype.Timestamptz{Time: time.Now().Add(time.Duration(tokenResp.ExpiresIn) * time.Second), Valid: true}
		}

		var newRefreshTokenPg pgtype.Text
		if tokenResp.RefreshToken != "" {
			newRefreshTokenPg = pgtype.Text{String: tokenResp.RefreshToken, Valid: true}
		} else {
			newRefreshTokenPg = userRecord.GithubRefreshToken
		}

		// Update database with refreshed tokens
		userRecord, err = s.query.UpdateUserGitHubTokens(ctx, db.UpdateUserGitHubTokensParams{
			ID:                   userRecord.ID,
			GithubAccessToken:    pgtype.Text{String: tokenResp.AccessToken, Valid: true},
			GithubRefreshToken:   newRefreshTokenPg,
			GithubTokenExpiresAt: newExpiresAtPg,
		})
		if err != nil {
			return "", fmt.Errorf("failed to update user tokens in database: %w", err)
		}

		return tokenResp.AccessToken, nil
	}

	return userRecord.GithubAccessToken.String, nil
}

func userToDTO(u db.User) UserDTO {
	var idStr string
	if u.ID.Valid {
		b := u.ID.Bytes
		idStr = fmt.Sprintf("%08x-%04x-%04x-%04x-%012x", b[0:4], b[4:6], b[6:8], b[8:10], b[10:16])
	}

	var githubIDStr string
	if u.GithubID.Valid {
		githubIDStr = u.GithubID.String
	}

	return UserDTO{
		ID:        idStr,
		GithubID:  githubIDStr,
		Name:      u.Name,
		Email:     u.Email,
		CreatedAt: u.CreatedAt.Time,
		UpdatedAt: u.UpdatedAt.Time,
	}
}
