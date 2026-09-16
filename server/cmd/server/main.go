package main

import (
	"log/slog"
	"net/http"
	"os"

	"github.com/luponetn/launch.io/internal/config"
	"github.com/luponetn/launch.io/internal/db"
	"github.com/luponetn/launch.io/internal/logger"
	"github.com/luponetn/launch.io/internal/proxy"
	"github.com/jackc/pgx/v5/pgxpool"
)

type App struct {
	Config *config.Config
	DB     *pgxpool.Pool
}

func main() {
	logger.Init()

	cfg, err := config.LoadConfig()
	if err != nil {
		slog.Error("failed to load configuration", "error", err)
		os.Exit(1)
	}

	slog.Info("configuration loaded", "port", cfg.Port)

	pool, err := db.ConnectDB(cfg.DatabaseURL)
	if err != nil {
		slog.Error("failed to connect to database", "error", err)
		os.Exit(1)
	}
	defer pool.Close()

	query := db.New(pool)

	slog.Info("database connected")

	// Start the reverse proxy on its own port, alongside the main API
	reverseProxy := proxy.NewReverseProxy(query)
	go func() {
		slog.Info("reverse proxy listening", "port", 8000)
		if err := http.ListenAndServe(":8000", reverseProxy); err != nil {
			slog.Error("reverse proxy failed", "error", err)
		}
	}()

	app := &App{
		Config: cfg,
		DB:     pool,
	}

	_ = app

	router := app.CreateRouter()

	if err := app.StartServer(router, query); err != nil {
		slog.Error("application stopped with error", "error", err)
		os.Exit(1)
	}
}