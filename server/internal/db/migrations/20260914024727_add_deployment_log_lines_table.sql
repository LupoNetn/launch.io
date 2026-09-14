-- +goose Up
CREATE TABLE deployment_logs (
    id BIGSERIAL PRIMARY KEY,
    deployment_id UUID NOT NULL REFERENCES deployments(id) ON DELETE CASCADE,
    line TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_deployment_logs_deployment_id ON deployment_logs(deployment_id);

-- +goose Down
DROP TABLE deployment_logs;