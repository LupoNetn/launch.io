package build

import (
	"bufio"
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/luponetn/launch.io/internal/db"
)

type BuildEngine interface {
	Build(ctx context.Context, deploymentID, cloneURL, branch string, onLogLine func(string)) (string, error)
	CloneRepo(ctx context.Context, cloneURL, branch, clonePath string) error
}

type buildEngine struct {
	query *db.Queries
}

func NewBuildEngine(query *db.Queries) BuildEngine {
	return &buildEngine{
		query: query,
	}
}

func (b *buildEngine) CloneRepo(ctx context.Context, cloneURL, branch, clonePath string) error {
	var stdErr bytes.Buffer
	cmd := exec.CommandContext(ctx, "git", "clone", "--branch", branch, "--single-branch", "--depth", "1", cloneURL, clonePath)
	cmd.Stderr = &stdErr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("git clone failed: %w\n%s", err, stdErr.String())
	}
	return nil
}

func ensureBuildkit(ctx context.Context) error {
	inspect := exec.CommandContext(ctx, "docker", "container", "inspect", "--format", "{{.State.Running}}", "buildkit")
	inspectOutput, inspectErr := inspect.Output()
	if inspectErr == nil && strings.TrimSpace(string(inspectOutput)) == "true" {
		return nil
	}
	if inspectErr == nil {
		start := exec.CommandContext(ctx, "docker", "start", "buildkit")
		if out, err := start.CombinedOutput(); err != nil {
			return fmt.Errorf("failed to start existing buildkit container: %w: %s", err, strings.TrimSpace(string(out)))
		}
		return nil
	}

	run := exec.CommandContext(ctx, "docker", "run", "--rm", "--privileged", "-d", "--name", "buildkit", "moby/buildkit")
	out, err := run.CombinedOutput()
	if err != nil {
		return fmt.Errorf("failed to start buildkit container: %w: %s", err, strings.TrimSpace(string(out)))
	}
	if len(strings.TrimSpace(string(out))) == 0 {
		return fmt.Errorf("buildkit container started without a container id")
	}
	return nil
}

func (b *buildEngine) runRailpackBuild(ctx context.Context, clonePath, imageTag string, onLogLine func(string)) error {
	if err := ensureBuildkit(ctx); err != nil {
		return err
	}

	cmd := exec.CommandContext(ctx, "railpack", "build", clonePath, "--name", imageTag, "--progress", "plain")
	cmd.Env = append(os.Environ(), "BUILDKIT_HOST=docker-container://buildkit")

	stdOut, err := cmd.StdoutPipe()
	if err != nil {
		return fmt.Errorf("failed to attach stdout pipe: %w", err)
	}
	cmd.Stderr = cmd.Stdout

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start railpack build: %w", err)
	}

	scanner := bufio.NewScanner(stdOut)
	for scanner.Scan() {
		if onLogLine != nil {
			onLogLine(scanner.Text())
		}
	}
	if err := scanner.Err(); err != nil {
		return fmt.Errorf("error reading railpack output: %w", err)
	}

	if err := cmd.Wait(); err != nil {
		return fmt.Errorf("railpack exited with error: %w", err)
	}

	return nil
}

func (b *buildEngine) runDockerBuild(ctx context.Context, clonePath, imageTag string, onLogLine func(string)) error {
	cmd := exec.CommandContext(ctx, "docker", "build", "-t", imageTag, clonePath)

	stdOut, err := cmd.StdoutPipe()
	if err != nil {
		return fmt.Errorf("failed to attach stdout pipe: %w", err)
	}
	cmd.Stderr = cmd.Stdout

	if err := cmd.Start(); err != nil {
		return fmt.Errorf("failed to start docker build: %w", err)
	}

	scanner := bufio.NewScanner(stdOut)
	for scanner.Scan() {
		if onLogLine != nil {
			onLogLine(scanner.Text())
		}
	}
	if err := scanner.Err(); err != nil {
		return fmt.Errorf("error reading docker build output: %w", err)
	}

	if err := cmd.Wait(); err != nil {
		return fmt.Errorf("docker build exited with error: %w", err)
	}

	return nil
}

func (b *buildEngine) Build(ctx context.Context, deploymentID, cloneURL, branch string, onLogLine func(string)) (string, error) {
	log := func(msg string) {
		if onLogLine != nil {
			onLogLine(msg)
		}
	}

	log(fmt.Sprintf("[launch.io] Starting deployment build for ID: %s", deploymentID))
	log(fmt.Sprintf("[launch.io] Fetching source code from %s (branch: %s)...", cloneURL, branch))

	clonePath := filepath.Join(os.TempDir(), "launchio-builds", deploymentID)

	if err := os.RemoveAll(clonePath); err != nil {
		log(fmt.Sprintf("[launch.io] ERROR: Failed to clean build workspace: %v", err))
		return "", fmt.Errorf("failed to clean clone dir: %w", err)
	}
	if err := os.MkdirAll(clonePath, 0755); err != nil {
		log(fmt.Sprintf("[launch.io] ERROR: Failed to create build workspace: %v", err))
		return "", fmt.Errorf("failed to create clone dir: %w", err)
	}
	defer os.RemoveAll(clonePath)

	if err := b.CloneRepo(ctx, cloneURL, branch, clonePath); err != nil {
		log(fmt.Sprintf("[launch.io] ERROR: Repository clone failed: %v", err))
		return "", fmt.Errorf("failed to clone repo: %w", err)
	}

	log("[launch.io] Source code cloned successfully.")
	imageTag := fmt.Sprintf("launchio-%s:latest", deploymentID)

	// Check if railpack executable exists on system PATH
	_, railpackErr := exec.LookPath("railpack")
	if railpackErr == nil {
		log("[launch.io] Using Railpack build engine...")
		if err := b.runRailpackBuild(ctx, clonePath, imageTag, log); err != nil {
			log(fmt.Sprintf("[launch.io] ERROR: Railpack build failed: %v", err))
			return "", fmt.Errorf("railpack build failed: %w", err)
		}
	} else {
		// Railpack not found — check if Dockerfile exists in repo
		dockerfilePath := filepath.Join(clonePath, "Dockerfile")
		if _, err := os.Stat(dockerfilePath); err == nil {
			log("[launch.io] 'railpack' binary not found on PATH. Dockerfile detected — falling back to Docker build...")
			if err := b.runDockerBuild(ctx, clonePath, imageTag, log); err != nil {
				log(fmt.Sprintf("[launch.io] ERROR: Docker build failed: %v", err))
				return "", fmt.Errorf("docker build failed: %w", err)
			}
		} else {
			errMsg := "'railpack' binary is not installed on system PATH and no Dockerfile was found in repository root"
			log(fmt.Sprintf("[launch.io] ERROR: %s.", errMsg))
			log("[launch.io] Resolution: Install Railpack CLI or add a Dockerfile to your repository root.")
			return "", fmt.Errorf("%s", errMsg)
		}
	}

	log(fmt.Sprintf("[launch.io] Build completed successfully. Image tag: %s", imageTag))
	return imageTag, nil
}
