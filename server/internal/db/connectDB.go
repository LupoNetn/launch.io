package db

import (
	"context"
	"errors"
	"log/slog"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

func ConnectDB(databaseURL string) (*pgxpool.Pool, error) {
	config, err := pgxpool.ParseConfig(databaseURL)
	if err != nil {
		slog.Error(
			"could not parse database url with pgxpool",
			"err", err,
		)

		return nil, errors.New("could not parse database url with pgxpool")
	}

	// Connection pool configuration.
	config.MaxConns = 10
	config.MinConns = 2
	config.MaxConnLifetime = time.Hour
	config.MaxConnIdleTime = 30 * time.Minute
	config.HealthCheckPeriod = time.Minute

	// Create the connection pool.
	pool, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		slog.Error(
			"could not create database connection pool",
			"err", err,
		)

		return nil, errors.New("could not create database connection pool")
	}

	// Verify that we can actually communicate with PostgreSQL.
	ctx, cancel := context.WithTimeout(
		context.Background(),
		5*time.Second,
	)
	defer cancel()

	if err := pool.Ping(ctx); err != nil {
		slog.Error(
			"could not ping database",
			"err", err,
		)

		// Important: don't leave a pool running if startup failed.
		pool.Close()

		return nil, errors.New("could not ping database")
	}

	slog.Info("database connection established")

	return pool, nil
}