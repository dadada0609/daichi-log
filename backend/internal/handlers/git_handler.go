package handlers

import (
	"net/http"

	"github.com/daichi-log/backend/internal/models"
	"github.com/daichi-log/backend/internal/repository"
	"github.com/gin-gonic/gin"
)

func HandleGitWebhook(c *gin.Context) {
	var commit models.GitCommit
	if err := c.ShouldBindJSON(&commit); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := repository.CreateCommit(&commit); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"status": "Commit recorded"})
}

func GetCommitsByIssue(c *gin.Context) {
	issueKey := c.Param("issue_key")
	commits, err := repository.GetCommitsByIssueKey(issueKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, commits)
}
