package orchestrator

import (
	"context"
	"fmt"
	"log/slog"

	"github.com/moby/moby/api/types/container"
	"github.com/moby/moby/client"
)

type Orchestrator interface {
	Run(ctx context.Context, projectID, deploymentID, buildImage string) (string, error)
}

type orchestrator struct {
	client *client.Client
}

func NewOrchestrator(ctx context.Context) (Orchestrator, error) {
	cli, err := client.New(client.FromEnv)
	if err != nil {
		return nil, fmt.Errorf("unable to create docker client: %w", err)
	}
	if _, err := cli.Ping(ctx, client.PingOptions{}); err != nil {
		return nil, fmt.Errorf("unable to ping docker daemon: %w", err)
	}
	return &orchestrator{
		client: cli,
	}, nil
}

func (o *orchestrator) Run(ctx context.Context, projectID, deploymentID, buildImage string) (string, error) {
	containerName := fmt.Sprintf("launchio-%s", projectID)
	containers, err := o.client.ContainerList(ctx, client.ContainerListOptions{
		All:     true,
		Filters: client.Filters{}.Add("name", containerName),
	})
	if err != nil {
		return "", fmt.Errorf("unable to find existing project container: %w", err)
	}

	for _, existing := range containers.Items {
		if _, err := o.client.ContainerRemove(ctx, existing.ID, client.ContainerRemoveOptions{Force: true}); err != nil {
			return "", fmt.Errorf("unable to remove existing project container: %w", err)
		}
	}

	createResp, err := o.client.ContainerCreate(ctx, client.ContainerCreateOptions{
		Name: containerName,
		Config: &container.Config{
			Image: buildImage,
			Labels: map[string]string{
				"launchio.project_id":    projectID,
				"launchio.deployment_id": deploymentID,
			},
		},
	})
	if err != nil {
		return "", fmt.Errorf("unable to create container: %w", err)
	}

	if _, err := o.client.ContainerStart(ctx, createResp.ID, client.ContainerStartOptions{}); err != nil {
		_, _ = o.client.ContainerRemove(ctx, createResp.ID, client.ContainerRemoveOptions{Force: true})
		return "", fmt.Errorf("unable to start container: %w", err)
	}
	slog.Info(
		"container started",
		"id", createResp.ID,
		"project_id", projectID,
		"deployment_id", deploymentID,
	)
	return createResp.ID, nil
}
