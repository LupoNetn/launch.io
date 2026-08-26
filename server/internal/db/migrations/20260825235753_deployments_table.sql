-- +goose Up

CREATE TYPE deployment_status AS ENUM (
    'building',
    'running',
    'deploying',
    'failed',
    'queued'
);

CREATE TABLE IF NOT EXISTS deployments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL
        REFERENCES projects(id)
        ON DELETE CASCADE,

    status deployment_status NOT NULL DEFAULT 'queued',

    git_branch TEXT,
    image_tag TEXT,
    log_store_path TEXT,
    artifact_path TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- +goose Down

DROP TABLE IF EXISTS deployments;

DROP TYPE IF EXISTS deployment_status;