package orchestrator

import (
	"context"
	"fmt"
	"log/slog"
	"net/netip"
	"strconv"

	"github.com/moby/moby/api/types/container"
	"github.com/moby/moby/api/types/network"
	"github.com/moby/moby/client"
)

type Orchestrator interface {
	Run(ctx context.Context, projectID, deploymentID, buildImage string) (string, int, error)
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

func (o *orchestrator) Run(ctx context.Context, projectID, deploymentID, buildImage string) (string, int, error) {
	containerName := fmt.Sprintf("launchio-%s", projectID)
	containers, err := o.client.ContainerList(ctx, client.ContainerListOptions{
		All:     true,
		Filters: client.Filters{}.Add("name", containerName),
	})
	if err != nil {
		return "", 0, fmt.Errorf("unable to find existing project container: %w", err)
	}

	for _, existing := range containers.Items {
		if _, err := o.client.ContainerRemove(ctx, existing.ID, client.ContainerRemoveOptions{Force: true}); err != nil {
			return "", 0, fmt.Errorf("unable to remove existing project container: %w", err)
		}
	}

	hostPort := network.MustParsePort("3000/tcp")
	createResp, err := o.client.ContainerCreate(ctx, client.ContainerCreateOptions{
		Name: containerName,
		Config: &container.Config{
			Image:        buildImage,
			Env:          []string{"PORT=3000"},
			ExposedPorts: network.PortSet{hostPort: struct{}{}},
			Labels: map[string]string{
				"launchio.project_id":    projectID,
				"launchio.deployment_id": deploymentID,
			},
		},
		HostConfig: &container.HostConfig{
			PortBindings: network.PortMap{
				hostPort: []network.PortBinding{{HostIP: netip.MustParseAddr("0.0.0.0"), HostPort: ""}},
			},
		},
	})
	if err != nil {
		return "", 0, fmt.Errorf("unable to create container: %w", err)
	}

	if _, err := o.client.ContainerStart(ctx, createResp.ID, client.ContainerStartOptions{}); err != nil {
		_, _ = o.client.ContainerRemove(ctx, createResp.ID, client.ContainerRemoveOptions{Force: true})
		return "", 0, fmt.Errorf("unable to start container: %w", err)
	}

	inspectResult, err := o.client.ContainerInspect(ctx, createResp.ID, client.ContainerInspectOptions{})
	if err != nil {
		return "", 0, fmt.Errorf("unable to inspect container: %w", err)
	}

	bindings, ok := inspectResult.Container.NetworkSettings.Ports[hostPort]
	if !ok || len(bindings) == 0 || bindings[0].HostPort == "" {
		return "", 0, fmt.Errorf("container port %s is not bound", hostPort)
	}
	hostPortNumber, err := strconv.Atoi(bindings[0].HostPort)
	if err != nil {
		return "", 0, fmt.Errorf("unable to parse container host port %q: %w", bindings[0].HostPort, err)
	}

	slog.Info(
		"container started",
		"id", createResp.ID,
		"project_id", projectID,
		"deployment_id", deploymentID,
	)

	return createResp.ID, hostPortNumber, nil
}
