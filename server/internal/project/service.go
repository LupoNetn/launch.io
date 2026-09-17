package project

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/luponetn/launch.io/internal/auth"
	build "github.com/luponetn/launch.io/internal/buildEngine"
	"github.com/luponetn/launch.io/internal/db"
	"github.com/luponetn/launch.io/internal/orchestrator"
	"github.com/luponetn/launch.io/internal/utils"
)

type Service interface {
	ListProjects(ctx context.Context, userID string) ([]db.Project, error)
	ListRepo(ctx context.Context, userID string) ([]GitHubRepo, error)
	SelectRepo(ctx context.Context, userID string, req SelectProjectRequest) (string, error)
	DeployRepo(ctx context.Context, projectID string, userID string) (string, error)
}

type service struct {
	query  *db.Queries
	auth   auth.Service
	build  build.BuildEngine
	run    orchestrator.Orchestrator
	client http.Client
}

func NewService(query *db.Queries, authService auth.Service, buildEngine build.BuildEngine, containerOrchestrator orchestrator.Orchestrator) Service {
	return &service{
		query:  query,
		auth:   authService,
		build:  buildEngine,
		run:    containerOrchestrator,
		client: http.Client{Timeout: 25 * time.Second},
	}
}

func (s *service) ListProjects(ctx context.Context, userID string) ([]db.Project, error) {
	userUUID := pgtype.UUID{}
	if err := userUUID.Scan(userID); err != nil {
		return nil, fmt.Errorf("invalid user id: %w", err)
	}
	return s.query.ListProjectsByUserID(ctx, userUUID)
}

func (s *service) ListRepo(ctx context.Context, userID string) ([]GitHubRepo, error) {
	token, err := s.auth.GetValidGitHubToken(ctx, userID)
	if err != nil {
		return []GitHubRepo{}, err
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://api.github.com/user/repos?per_page=100", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "launch.io-server")

	resp, err := s.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch user repos from github: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("github api returned status %d", resp.StatusCode)
	}

	var repos []GitHubRepo
	if err := json.NewDecoder(resp.Body).Decode(&repos); err != nil {
		return nil, fmt.Errorf("failed to parse github repos: %w", err)
	}
	return repos, nil
}

func (s *service) SelectRepo(ctx context.Context, userID string, req SelectProjectRequest) (string, error) {
	token, err := s.auth.GetValidGitHubToken(ctx, userID)
	if err != nil {
		return "", err
	}

	githubReq, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://api.github.com/repos/"+req.GithubFullName, nil)
	if err != nil {
		return "", err
	}
	githubReq.Header.Set("Authorization", "Bearer "+token)
	githubReq.Header.Set("Accept", "application/json")
	githubReq.Header.Set("User-Agent", "launch.io-server")

	resp, err := s.client.Do(githubReq)
	if err != nil {
		return "", fmt.Errorf("failed to fetch repo from github: %w", err)
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("repo not found or not accessible: status %d", resp.StatusCode)
	}

	var repo GitHubRepo
	if err := json.NewDecoder(resp.Body).Decode(&repo); err != nil {
		return "", fmt.Errorf("failed to parse github repo: %w", err)
	}

	userUUID := pgtype.UUID{}
	if err := userUUID.Scan(userID); err != nil {
		return "", fmt.Errorf("invalid user id: %w", err)
	}
	name := req.Name
	if name == "" {
		name = repo.Name
	}
	projectRecord, err := s.query.CreateProject(ctx, db.CreateProjectParams{
		UserID: userUUID, Name: pgtype.Text{String: name, Valid: true},
		GithubFullName: repo.FullName, GithubCloneUrl: repo.CloneURL, DefaultBranch: repo.DefaultBranch,
	})
	if err != nil {
		return "", fmt.Errorf("failed to create project: %w", err)
	}

	subdomain := utils.GenerateSubdomain(projectRecord.GithubFullName)
	hostname := subdomain + ".launch.io"

	_, err = s.query.CreateDomain(ctx, db.CreateDomainParams{
		ProjectID:  projectRecord.ID,
		DomainName: hostname,
		Type:       db.DomainNameTypeSystemGenerated,
	})
	if err != nil {
		slog.Error("failed to create domain", "err", err)
		return "", fmt.Errorf("failed to create domain: %w", err)
	}

	return projectRecord.ID.String(), nil
}

func (s *service) DeployRepo(ctx context.Context, projectID, userID string) (string, error) {
	var projectUUID, userUUID pgtype.UUID
	if err := projectUUID.Scan(projectID); err != nil {
		return "", fmt.Errorf("invalid project id: %w", err)
	}
	if err := userUUID.Scan(userID); err != nil {
		return "", fmt.Errorf("invalid user id: %w", err)
	}
	projectRecord, err := s.query.SelectProjectByID(ctx, projectUUID)
	if err != nil {
		return "", err
	}
	if projectRecord.UserID.Bytes != userUUID.Bytes {
		return "", ErrForbidden
	}

	hostname := utils.GenerateSubdomain(projectRecord.GithubFullName) + ".launch.io"
	if _, err := s.query.GetDomainByHostname(ctx, hostname); err != nil {
		if !errors.Is(err, pgx.ErrNoRows) {
			return "", fmt.Errorf("failed to look up project domain: %w", err)
		}
		if _, err := s.query.CreateDomain(ctx, db.CreateDomainParams{ProjectID: projectRecord.ID, DomainName: hostname, Type: db.DomainNameTypeSystemGenerated}); err != nil {
			return "", fmt.Errorf("failed to create project domain: %w", err)
		}
	}

	deployment, err := s.query.CreateDeployment(ctx, db.CreateDeploymentParams{ProjectID: projectUUID, Status: db.DeploymentStatusQueued})
	if err != nil {
		return "", err
	}
	if err := s.query.UpdateDeploymentStatus(ctx, db.UpdateDeploymentStatusParams{ID: deployment.ID, Status: db.DeploymentStatusBuilding}); err != nil {
		return deployment.ID.String(), fmt.Errorf("failed to mark deployment as building: %w", err)
	}
	imageTag, err := s.build.Build(ctx, deployment.ID.String(), projectRecord.GithubCloneUrl, projectRecord.DefaultBranch, func(line string) {
		if logErr := s.query.AddDeploymentLogLine(ctx, db.AddDeploymentLogLineParams{DeploymentID: deployment.ID, Line: line}); logErr != nil {
			slog.Error("failed to add deployment log line", "err", logErr)
		}
	})
	if err != nil {
		_ = s.query.UpdateDeploymentStatus(ctx, db.UpdateDeploymentStatusParams{ID: deployment.ID, Status: db.DeploymentStatusFailed})
		return deployment.ID.String(), fmt.Errorf("build failed: %w", err)
	}
	if err := s.query.SetDeploymentImageTag(ctx, db.SetDeploymentImageTagParams{ID: deployment.ID, ImageTag: pgtype.Text{String: imageTag, Valid: true}}); err != nil {
		_ = s.query.UpdateDeploymentStatus(ctx, db.UpdateDeploymentStatusParams{ID: deployment.ID, Status: db.DeploymentStatusFailed})
		return deployment.ID.String(), fmt.Errorf("failed to set deployment image tag: %w", err)
	}
	containerID, hostPort, err := s.run.Run(ctx, projectRecord.ID.String(), deployment.ID.String(), imageTag)
	if err != nil {
		_ = s.query.UpdateDeploymentStatus(ctx, db.UpdateDeploymentStatusParams{ID: deployment.ID, Status: db.DeploymentStatusFailed})
		return deployment.ID.String(), fmt.Errorf("failed to start deployment container: %w", err)
	}
	if err := s.query.UpdateDeploymentStatus(ctx, db.UpdateDeploymentStatusParams{ID: deployment.ID, Status: db.DeploymentStatusRunning}); err != nil {
		return deployment.ID.String(), fmt.Errorf("failed to mark deployment as running: %w", err)
	}
	if _, err := s.query.CreateProxyMapping(ctx, db.CreateProxyMappingParams{
		ProjectID:    projectRecord.ID,
		ContainerID:  pgtype.Text{String: containerID, Valid: true},
		AssignedPort: pgtype.Text{String: fmt.Sprintf("%d", hostPort), Valid: true},
		HealthStatus: db.NullHealthStatus{HealthStatus: db.HealthStatusActive, Valid: true},
	}); err != nil {
		_ = s.query.UpdateDeploymentStatus(ctx, db.UpdateDeploymentStatusParams{ID: deployment.ID, Status: db.DeploymentStatusFailed})
		return deployment.ID.String(), fmt.Errorf("failed to create proxy mapping: %w", err)
	}
	return deployment.ID.String(), nil
}
