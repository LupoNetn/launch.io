-- +goose Up

CREATE TYPE domain_name_type AS ENUM (
    'system_generated',
    'custom'
);

CREATE TABLE IF NOT EXISTS domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    project_id UUID NOT NULL
        REFERENCES projects(id)
        ON DELETE CASCADE,

    domain_name TEXT NOT NULL,

    type domain_name_type NOT NULL DEFAULT 'system_generated',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- +goose Down

DROP TABLE IF EXISTS domains;

DROP TYPE IF EXISTS domain_name_type;