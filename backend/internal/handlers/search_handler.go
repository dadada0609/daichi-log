package handlers

import (
	"net/http"
	"strings"

	"github.com/daichi-log/backend/internal/repository"
	"github.com/gin-gonic/gin"
)

func SearchAll(c *gin.Context) {
	query := c.Query("q")
	if strings.TrimSpace(query) == "" {
		c.JSON(http.StatusOK, []repository.SearchResult{})
		return
	}

	results, err := repository.SearchAll(query)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to search"})
		return
	}

	c.JSON(http.StatusOK, results)
}
