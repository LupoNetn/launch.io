-- name: CreateProject :one
INSERT INTO projects (
    user_id,
    name,
    github_full_name,
    github_clone_url,
    default_branch
) VALUES (
    $1, $2, $3, $4, $5
)
RETURNING *;