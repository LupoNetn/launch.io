-- +goose Up
CREATE TYPE health_status AS ENUM (
    'active', 'inactive'
);

CREATE TABLE IF NOT EXISTS proxy_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    container_id TEXT,
    internal_ip TEXT,
    assigned_port TEXT,
    health_status health_status,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- +goose Down
DROP TABLE IF EXISTS proxy_mappings;

DROP TYPE IF EXISTS health_status
