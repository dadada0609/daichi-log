package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type WikiLinkRequest struct {
	WikiPageID string `json:"wikiPageId"`
}

func LinkWikiToIssue(c *gin.Context) {
	issueKey := c.Param("issue_key")
	var req WikiLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}
	
	// TODO: Save the many-to-many relationship in the database.
	// For now, we mock the successful linkage to allow the frontend to proceed.
	
	c.JSON(http.StatusOK, gin.H{
		"status": "success", 
		"issueKey": issueKey, 
		"wikiPageId": req.WikiPageID,
	})
}
