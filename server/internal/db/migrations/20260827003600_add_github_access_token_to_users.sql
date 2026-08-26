-- +goose Up
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_access_token TEXT;

-- +goose Down
ALTER TABLE users DROP COLUMN IF EXISTS github_access_token;
