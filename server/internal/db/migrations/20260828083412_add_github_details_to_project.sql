-- +goose Up
ALTER TABLE projects ADD COLUMN github_full_name TEXT NOT NULL;
ALTER TABLE projects ADD COLUMN github_clone_url TEXT NOT NULL;
ALTER TABLE projects ADD COLUMN default_branch TEXT NOT NULL DEFAULT 'main';

-- +goose Down
ALTER TABLE projects DROP COLUMN github_full_name;
ALTER TABLE projects DROP COLUMN github_clone_url;
ALTER TABLE projects DROP COLUMN default_branch;
