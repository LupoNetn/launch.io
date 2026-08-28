package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/luponetn/launch.io/internal/auth"
	"github.com/luponetn/launch.io/internal/db"
	"github.com/luponetn/launch.io/internal/deploy"
)

func (a *App) CreateRouter() *gin.Engine {
	router := gin.Default()

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"message": "Launch.io Server is running",
		})
	})

	return router
}

func (a *App) SetupRoutes(router *gin.Engine, query *db.Queries) {
	authService := auth.NewService(query, a.Config)
	authHandler := auth.NewHandler(authService)
	auth.RegisterRoutes(router, authHandler, a.Config.JWTAccessSecret)

	deployService := deploy.NewService(query, authService)
	deployHandler := deploy.NewHandler(deployService)
	deploy.RegisterRoutes(router, deployHandler, a.Config.JWTAccessSecret)
}

func (a *App) StartServer(router *gin.Engine, query *db.Queries) error {
	server := &http.Server{
		Addr:         ":" + a.Config.Port,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  10 * time.Second,
	}

	a.SetupRoutes(router, query)

	// Start server in a separate goroutine so
	// we can listen for shutdown signals.
	startErr := make(chan error, 1)

	slog.Info(
		"server starting",
		"port", a.Config.Port,
	)

	go func() {
		if err := server.ListenAndServe(); err != nil &&
			err != http.ErrServerClosed {
			startErr <- err
		}
	}()

	// Listen for OS shutdown signals.
	quit := make(chan os.Signal, 1)

	signal.Notify(
		quit,
		syscall.SIGINT,
		syscall.SIGTERM,
	)

	select {
	case err := <-startErr:
		slog.Error(
			"server failed",
			"error", err,
		)

		return err

	case sig := <-quit:
		slog.Info(
			"shutdown signal received",
			"signal", sig,
		)
	}

	// Give existing requests time to finish.
	shutdownCtx, shutdownCancel := context.WithTimeout(
		context.Background(),
		5*time.Second,
	)
	defer shutdownCancel()

	slog.Info("shutting down server gracefully")

	if err := server.Shutdown(shutdownCtx); err != nil {
		slog.Error(
			"server forced to shutdown",
			"error", err,
		)

		return err
	}

	slog.Info("server gracefully exited")

	return nil
}
