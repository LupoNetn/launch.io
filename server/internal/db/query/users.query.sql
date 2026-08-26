-- name: CreateUser :one
INSERT INTO users (name, email, password, github_id, github_access_token)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: GetUserByGithubID :one
SELECT * FROM users
WHERE github_id = $1 LIMIT 1;

-- name: GetUserByEmail :one
SELECT * FROM users
WHERE email = $1 LIMIT 1;

-- name: GetUserByID :one
SELECT * FROM users
WHERE id = $1 LIMIT 1;

-- name: UpdateUserGithub :one
UPDATE users
SET name = COALESCE(NULLIF(sqlc.arg(name)::text, ''), name),
    email = COALESCE(NULLIF(sqlc.arg(email)::text, ''), email),
    github_id = COALESCE(NULLIF(sqlc.arg(github_id)::text, ''), github_id),
    github_access_token = COALESCE(NULLIF(sqlc.arg(github_access_token)::text, ''), github_access_token),
    updated_at = NOW()
WHERE id = sqlc.arg(id)
RETURNING *;