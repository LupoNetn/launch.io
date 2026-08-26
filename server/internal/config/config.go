package config

import (
	"errors"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port               string
	DatabaseURL        string
	JWTAccessSecret    string
	JWTRefreshSecret   string
	GitHubClientID     string
	GitHubClientSecret string
	GitHubRedirectURI  string
}

func LoadConfig() (*Config, error) {
	// Load .env (ignore error if file is missing in production environments)
	_ = godotenv.Load()

	cfg := &Config{
		Port:               extractKey("PORT", "8080"),
		DatabaseURL:        extractKey("DATABASE_URL", ""),
		JWTAccessSecret:    extractKey("JWT_ACCESS_SECRET", ""),
		JWTRefreshSecret:   extractKey("JWT_REFRESH_SECRET", ""),
		GitHubClientID:     extractKey("GITHUB_CLIENT_ID", ""),
		GitHubClientSecret: extractKey("GITHUB_CLIENT_SECRET", ""),
		GitHubRedirectURI:  extractKey("GITHUB_REDIRECT_URI", "http://localhost:8080/auth/github/callback"),
	}

	// Validate required configuration
	if err := validate(cfg); err != nil {
		return nil, err
	}

	return cfg, nil
}

func extractKey(key, fallback string) string {
	value := os.Getenv(key)

	if value == "" {
		return fallback
	}

	return value
}

func validate(cfg *Config) error {
	if cfg.DatabaseURL == "" {
		return errors.New("DATABASE_URL is required")
	}

	if cfg.JWTAccessSecret == "" {
		return errors.New("JWT_ACCESS_SECRET is required")
	}

	if cfg.JWTRefreshSecret == "" {
		return errors.New("JWT_REFRESH_SECRET is required")
	}

	if cfg.GitHubClientID == "" {
		return errors.New("GITHUB_CLIENT_ID is required")
	}

	if cfg.GitHubClientSecret == "" {
		return errors.New("GITHUB_CLIENT_SECRET is required")
	}

	return nil
}