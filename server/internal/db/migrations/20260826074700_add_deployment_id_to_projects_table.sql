-- +goose Up

ALTER TABLE projects
ADD CONSTRAINT fk_projects_active_deployment
FOREIGN KEY (active_deployment_id)
REFERENCES deployments(id)
ON DELETE SET NULL;

-- +goose Down

ALTER TABLE projects
DROP CONSTRAINT IF EXISTS fk_projects_active_deployment;