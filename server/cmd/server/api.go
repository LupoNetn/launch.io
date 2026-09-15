package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/luponetn/launch.io/internal/auth"
	build "github.com/luponetn/launch.io/internal/buildEngine"
	"github.com/luponetn/launch.io/internal/db"
	"github.com/luponetn/launch.io/internal/orchestrator"
	project "github.com/luponetn/launch.io/internal/project"
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

func (a *App) SetupRoutes(router *gin.Engine, query *db.Queries) error {
	authService := auth.NewService(query, a.Config)
	authHandler := auth.NewHandler(authService)
	auth.RegisterRoutes(router, authHandler, a.Config.JWTAccessSecret)

	buildEngine := build.NewBuildEngine(query)
	containerOrchestrator, err := orchestrator.NewOrchestrator(context.Background())
	if err != nil {
		return err
	}
	projectService := project.NewService(query, authService, buildEngine, containerOrchestrator)
	projectHandler := project.NewHandler(projectService)
	project.RegisterRoutes(router, projectHandler, a.Config.JWTAccessSecret)
	return nil
}

func (a *App) StartServer(router *gin.Engine, query *db.Queries) error {
	server := &http.Server{
		Addr:         ":" + a.Config.Port,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  10 * time.Second,
	}

	if err := a.SetupRoutes(router, query); err != nil {
		return fmt.Errorf("failed to set up routes: %w", err)
	}

	startErr := make(chan error, 1)
	slog.Info("server starting", "port", a.Config.Port)

	go func() {
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			startErr <- err
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-startErr:
		return err
	case sig := <-quit:
		slog.Info("shutdown signal received", "signal", sig)
	}

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer shutdownCancel()
	return server.Shutdown(shutdownCtx)
}
