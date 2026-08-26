package auth

import (
	"github.com/gin-gonic/gin"
	"github.com/luponetn/launch.io/internal/middleware"
)

func RegisterRoutes(router *gin.Engine, h *Handler, jwtAccessSecret string) {
	authGroup := router.Group("/auth")
	{
		authGroup.GET("/github/login", h.GitHubLogin)
		authGroup.GET("/github/callback", h.GitHubCallback)
		authGroup.POST("/refresh", h.Refresh)
		authGroup.GET("/me", middleware.AuthMiddleware(jwtAccessSecret), h.GetMe)
	}
}
