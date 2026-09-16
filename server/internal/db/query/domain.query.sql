-- name: CreateDomain :one
INSERT INTO domains (project_id, domain_name, type)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetDomainByHostname :one
SELECT * FROM domains WHERE domain_name = $1;