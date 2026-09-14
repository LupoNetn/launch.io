-- name: CreateDeployment :one
INSERT INTO deployments (project_id,status) VALUES ($1,$2)
RETURNING *;

-- name: UpdateDeploymentStatus :exec
UPDATE deployments
SET status = $2, updated_at = now()
WHERE id = $1;

-- name: SetDeploymentImageTag :exec
UPDATE deployments
SET image_tag = $2, updated_at = now()
WHERE id = $1;

-- name: AddDeploymentLogLine :exec
INSERT INTO deployment_logs (deployment_id, line) VALUES ($1, $2);

-- name: GetDeploymentLogLines :many
SELECT * FROM deployment_logs WHERE deployment_id = $1 ORDER BY created_at ASC;