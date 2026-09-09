package build

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/luponetn/launch.io/internal/db"
)

type BuildEngine interface {
	Build(ctx context.Context, deploymentID, cloneURL, branch string) (string, error)
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

func (b *buildEngine) Build(ctx context.Context, deploymentID, cloneURL, branch string) (string, error) {
	//get a temp directory
	//clone project into it
	//run railpack build
	//handover to orchestrator

	clonePath := filepath.Join(os.TempDir(), "launchio-builds", deploymentID)

	if err := os.MkdirAll(clonePath, 0755); err != nil {
		return " ", fmt.Errorf("failed to create clone dir: %w", err)
	}
	defer os.RemoveAll(clonePath) // cleanup happens no matter how this function returns

	if err := b.CloneRepo(ctx, cloneURL, branch, clonePath); err != nil {
		return " ", fmt.Errorf("failed to clone repo: %w", err)
	}

}
