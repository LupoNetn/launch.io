-- name: CreateProxyMapping :one
INSERT INTO proxy_mappings (project_id, container_id, assigned_port, health_status) 
VALUES ($1,$2,$3,$4)
RETURNING *;

-- name: GetActiveProxyMappingByProjectID :one
SELECT * FROM proxy_mappings
WHERE project_id = $1 AND health_status = 'active'
ORDER BY created_at DESC LIMIT 1;