package deploy

import (
	"github.com/gin-gonic/gin"
	"github.com/luponetn/launch.io/internal/middleware"
)

func RegisterRoutes(router *gin.Engine, h *Handler, jwtSecret string) {
	deployGroup := router.Group("/deploy")

	deployGroup.GET("/pick-repo", middleware.AuthMiddleware(jwtSecret), h.ListRepo)
}
