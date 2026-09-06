package project

import (
	"github.com/gin-gonic/gin"
	"github.com/luponetn/launch.io/internal/middleware"
)

func RegisterRoutes(router *gin.Engine, h *Handler, jwtSecret string) {
	projectGroup := router.Group("/projects")

	projectGroup.GET("/list-repo", middleware.AuthMiddleware(jwtSecret), h.ListRepo)
	projectGroup.POST("/", middleware.AuthMiddleware(jwtSecret), h.SelectRepo)
	projectGroup.POST("/:id/deploy", middleware.AuthMiddleware(jwtSecret), h.DeployRepo)
}
