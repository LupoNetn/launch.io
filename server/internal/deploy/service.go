package deploy

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"time"

	"github.com/luponetn/launch.io/internal/auth"
	"github.com/luponetn/launch.io/internal/db"
)

type Service interface {
	ListRepo(ctx context.Context, userID string) ([]GitHubRepo, error)
}

type service struct {
	query *db.Queries
	auth  auth.Service
	client http.Client
}

func NewService(query *db.Queries, auth auth.Service) Service {
	return &service{
		query: query,
		auth:  auth,
		client: http.Client{
			Timeout: time.Second * 25,
		},
	}
}

func (s *service) ListRepo(ctx context.Context, userID string) ([]GitHubRepo, error) {
	//get user github access token
	//list user repo's
	ghAccessToken, err := s.auth.GetValidGitHubToken(ctx, userID)
	if err != nil {
		slog.Error("unable to retrieve github access token:", "err", err)
		return []GitHubRepo{}, err
	}

	repoReq, err := http.NewRequestWithContext(ctx,"GET", "https://api.github.com/user/repos?per_page=100", nil)
	if err != nil {
		slog.Error("unable to initialize github request:", "err", err)
		return []GitHubRepo{}, err
	}

	repoReq.Header.Set("Authorization", "Bearer "+ghAccessToken)
	repoReq.Header.Set("Accept", "application/json")
	repoReq.Header.Set("User-Agent", "launch.io-server")
    
	repoResp, err := s.client.Do(repoReq)
	if repoResp.StatusCode != http.StatusOK {
	   slog.Error("github returned non-200 for repo list", "status", repoResp.StatusCode)
	   return nil, fmt.Errorf("github api returned status %d", repoResp.StatusCode)
    }
	if err != nil {
		slog.Error("unable to fetch user github repos:", "err", err)
		return nil, fmt.Errorf("failed to fetch user repo from github: %w", err)
	}
	defer repoResp.Body.Close()

	repoBytes, err := io.ReadAll(repoResp.Body)
	if err != nil {
		slog.Error("could not read github user repo response body", "err", err)
		return nil, fmt.Errorf("failed to read github repo response: %w", err)
	}


	var ghRepos []GitHubRepo
	if err := json.Unmarshal(repoBytes, &ghRepos); err != nil {
		slog.Error("failed to parse user github repo's", "err", err)
		return nil, fmt.Errorf("failed to parse github user profile: %w", err)
	}


	return ghRepos, nil

}
