package build

import (
	"context"

	"github.com/luponetn/launch.io/internal/db"
)

type BuildEngine interface {
	Build(ctx context.Context, deploymentID string) (string, error)
}

type buildEngine struct {
	query *db.Queries
}

func NewBuildEngine(query *db.Queries) BuildEngine {
	return &buildEngine{
		query: query,
	}
}

func (b *buildEngine) Build(ctx context.Context, deploymentID string) (string, error) {
	//get a temp directory
	//clone project into it
	//run railpack build
	//handover to orchestrator
}
