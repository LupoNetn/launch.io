-- name: CreateUser :one
INSERT INTO users (name, email, password, github_id, github_access_token, github_refresh_token, github_token_expires_at)
VALUES ($1, $2, $3, $4, $5, $6, $7)
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
    github_refresh_token = COALESCE(NULLIF(sqlc.arg(github_refresh_token)::text, ''), github_refresh_token),
    github_token_expires_at = COALESCE(sqlc.narg('github_token_expires_at')::timestamptz, github_token_expires_at),
    updated_at = NOW()
WHERE id = sqlc.arg(id)
RETURNING *;

-- name: UpdateUserGitHubTokens :one
UPDATE users
SET github_access_token = $1,
    github_refresh_token = $2,
    github_token_expires_at = $3,
    updated_at = NOW()
WHERE id = $4
RETURNING *;
