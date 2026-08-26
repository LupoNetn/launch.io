-- name: CreateUser :one
INSERT INTO users (name, email, password, github_id)
VALUES ($1, $2, $3, $4)
RETURNING *;