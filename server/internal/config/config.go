package config

import (
	"errors"
	"fmt"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port             string
	DatabaseURL      string
	JWTAccessSecret  string
	JWTRefreshSecret string
}

func LoadConfig() (*Config, error) {
	// Load .env
	if err := godotenv.Load(); err != nil {
		return nil, fmt.Errorf("failed to load .env: %w", err)
	}

	cfg := &Config{
		Port:             extractKey("PORT", "8080"),
		DatabaseURL:      extractKey("DATABASE_URL", ""),
		JWTAccessSecret:  extractKey("JWT_ACCESS_SECRET", ""),
		JWTRefreshSecret: extractKey("JWT_REFRESH_SECRET", ""),
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

	return nil
}