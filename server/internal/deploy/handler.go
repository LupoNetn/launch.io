package deploy

import (
	"log/slog"
	"net/http"

	"github.com/gin-gonic/gin"
)

//need pick/listrepo
//deployrepo - deploy on new branch or existing branch
//listrepoDeployments - list all deployments
//listrepoDeploymentLogs - list all deployments logs
//deployments - get deployment by id

type Handler struct {
	service Service
}

func NewHandler(service Service) *Handler {
	return &Handler{
		service: service,
	}
}

func (h *Handler) ListRepo(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		slog.Error("unauthorized request")
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	uid, ok := userID.(string)
    if !ok {
	   slog.Error("user_id in context is not a string")
	   c.JSON(http.StatusInternalServerError, gin.H{"error": "something went wrong"})
	   return
    }

	userRepos, err := h.service.ListRepo(c.Request.Context(),uid)
	if err != nil {
		slog.Error("failed to list user github repo's", "err", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "something went wrong, try again later"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status": "successful",
		"data": userRepos,
	})
}
