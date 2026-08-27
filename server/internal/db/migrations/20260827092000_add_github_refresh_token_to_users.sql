-- +goose Up
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_refresh_token TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_token_expires_at TIMESTAMPTZ;

-- +goose Down
ALTER TABLE users DROP COLUMN IF EXISTS github_token_expires_at;
ALTER TABLE users DROP COLUMN IF EXISTS github_refresh_token;
