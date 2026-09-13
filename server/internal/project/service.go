package project

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/luponetn/launch.io/internal/auth"
	"github.com/luponetn/launch.io/internal/buildEngine"
	"github.com/luponetn/launch.io/internal/db"
)

type Service interface {
	ListRepo(ctx context.Context, userID string) ([]GitHubRepo, error)
	SelectRepo(ctx context.Context, userID string, req SelectProjectRequest) (string, error)
	DeployRepo(ctx context.Context, projectID string, userID string) (string, error)
}

type service struct {
	query  *db.Queries
	auth   auth.Service
	build  build.BuildEngine
	client http.Client
}

func NewService(query *db.Queries, auth auth.Service, build build.BuildEngine) Service {
	return &service{
		query: query,
		auth:  auth,
		build: build,
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

	repoReq, err := http.NewRequestWithContext(ctx, "GET", "https://api.github.com/user/repos?per_page=100", nil)
	if err != nil {
		slog.Error("unable to initialize github request:", "err", err)
		return []GitHubRepo{}, err
	}

	repoReq.Header.Set("Authorization", "Bearer "+ghAccessToken)
	repoReq.Header.Set("Accept", "application/json")
	repoReq.Header.Set("User-Agent", "launch.io-server")

	repoResp, err := s.client.Do(repoReq)
	if err != nil {
		slog.Error("unable to fetch user github repos:", "err", err)
		return nil, fmt.Errorf("failed to fetch user repo from github: %w", err)
	}
	if repoResp.StatusCode != http.StatusOK {
		slog.Error("github returned non-200 for repo list", "status", repoResp.StatusCode)
		return nil, fmt.Errorf("github api returned status %d", repoResp.StatusCode)
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

func (s *service) SelectRepo(ctx context.Context, userID string, req SelectProjectRequest) (string, error) {
	ghAccessToken, err := s.auth.GetValidGitHubToken(ctx, userID)
	if err != nil {
		slog.Error("unable to retrieve github access token", "err", err)
		return "", err
	}

	url := fmt.Sprintf("https://api.github.com/repos/%s", req.GithubFullName)
	repoReq, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		slog.Error("unable to initialize github request", "err", err)
		return "", err
	}

	repoReq.Header.Set("Authorization", "Bearer "+ghAccessToken)
	repoReq.Header.Set("Accept", "application/json")
	repoReq.Header.Set("User-Agent", "launch.io-server")

	repoResp, err := s.client.Do(repoReq)
	if err != nil {
		slog.Error("unable to fetch github repo", "err", err)
		return "", fmt.Errorf("failed to fetch repo from github: %w", err)
	}
	defer repoResp.Body.Close()

	if repoResp.StatusCode != http.StatusOK {
		slog.Error("github returned non-200 for repo lookup", "status", repoResp.StatusCode)
		return "", fmt.Errorf("repo not found or not accessible: status %d", repoResp.StatusCode)
	}

	repoBytes, err := io.ReadAll(repoResp.Body)
	if err != nil {
		slog.Error("could not read github repo response body", "err", err)
		return "", fmt.Errorf("failed to read github repo response: %w", err)
	}

	var ghRepo GitHubRepo
	if err := json.Unmarshal(repoBytes, &ghRepo); err != nil {
		slog.Error("failed to parse github repo response", "err", err)
		return "", fmt.Errorf("failed to parse github repo: %w", err)
	}

	name := req.Name
	if name == "" {
		name = ghRepo.Name
	}

	var userUUID pgtype.UUID
	if err := userUUID.Scan(userID); err != nil {
		slog.Error("invalid user id", "err", err)
		return "", fmt.Errorf("invalid user id: %w", err)
	}

	project, err := s.query.CreateProject(ctx, db.CreateProjectParams{
		UserID:         userUUID,
		Name:           pgtype.Text{String: name, Valid: true},
		GithubFullName: ghRepo.FullName,
		GithubCloneUrl: ghRepo.CloneURL,
		DefaultBranch:  ghRepo.DefaultBranch,
	})
	if err != nil {
		slog.Error("failed to create project", "err", err)
		return "", fmt.Errorf("failed to create project: %w", err)
	}

	return project.ID.String(), nil
}

func (s *service) DeployRepo(ctx context.Context, projectID string, userID string) (string, error) {
	var projectIDUUID pgtype.UUID
	if err := projectIDUUID.Scan(projectID); err != nil {
		slog.Error("invalid project id", "err", err)
		return "", fmt.Errorf("invalid project id: %w", err)
	}

	var userIDUUID pgtype.UUID
	if err := userIDUUID.Scan(userID); err != nil {
		slog.Error("invalid user id", "err", err)
		return "", fmt.Errorf("invalid user id: %w", err)
	}

	projectRecord, err := s.query.SelectProjectByID(ctx, projectIDUUID)
	if err != nil {
		slog.Error("unable to fetch project record by id", "err", err)
		return "", err
	}

	if projectRecord.UserID.Bytes != userIDUUID.Bytes {
		slog.Error("user does not own this project", "project_id", projectID, "user_id", userID)
		return "", ErrForbidden
	}

	//create deployment record
	deploymentRecord, err := s.query.CreateDeployment(ctx, db.CreateDeploymentParams{
		ProjectID: projectIDUUID,
		Status:    "queued",
	})
	if err != nil {
		slog.Error("something went wrong", "err", err)
		return "", err
	}

	_, err = s.build.Build(ctx, deploymentRecord.ID.String(), projectRecord.GithubCloneUrl, projectRecord.DefaultBranch, func(line string) {
		slog.Info("build output", "deployment_id", deploymentRecord.ID.String(), "line", line)
	})
	if err != nil {
		slog.Error("failed to build deployment", "deployment_id", deploymentRecord.ID.String(), "err", err)
		return "", err
	}

	return deploymentRecord.ID.String(), nil
}
