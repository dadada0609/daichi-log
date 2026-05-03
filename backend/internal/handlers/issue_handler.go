package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/daichi-log/backend/internal/models"
	"github.com/daichi-log/backend/internal/repository"
	"github.com/gin-gonic/gin"
)

func GetIssues(c *gin.Context) {
	issues, err := repository.GetAllIssues()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, issues)
}

func CreateIssue(c *gin.Context) {
	var issue models.Issue
	if err := c.ShouldBindJSON(&issue); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON: " + err.Error()})
		return
	}

	// バリデーション
	if issue.Title == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title is required"})
		return
	}

	// IssueKey が未設定の場合、バックエンドで自動採番する
	if issue.IssueKey == "" {
		issue.IssueKey = fmt.Sprintf("ISSUE-%d", time.Now().UnixMilli())
	}

	// 配列フィールドのnilガード
	if issue.CategoryIDs == nil {
		issue.CategoryIDs = models.StringSlice{}
	}
	if issue.MilestoneIDs == nil {
		issue.MilestoneIDs = models.StringSlice{}
	}
	if issue.VersionIDs == nil {
		issue.VersionIDs = models.StringSlice{}
	}

	if err := repository.CreateIssue(&issue); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "DB error: " + err.Error()})
		return
	}
	c.JSON(http.StatusCreated, issue)
}

func UpdateIssue(c *gin.Context) {
	issueKey := c.Param("issue_key")
	var updatedData models.Issue
	if err := c.ShouldBindJSON(&updatedData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	issue, err := repository.GetIssueByKey(issueKey)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Issue not found"})
		return
	}

	issue.Title = updatedData.Title
	issue.Description = updatedData.Description
	issue.Status = updatedData.Status
	issue.Priority = updatedData.Priority
	issue.Assignee = updatedData.Assignee
	issue.StartDate = updatedData.StartDate
	issue.DueDate = updatedData.DueDate
	issue.EstimatedHours = updatedData.EstimatedHours
	issue.ActualHours = updatedData.ActualHours
	issue.CategoryIDs = updatedData.CategoryIDs
	issue.MilestoneIDs = updatedData.MilestoneIDs
	issue.VersionIDs = updatedData.VersionIDs

	if err := repository.UpdateIssue(issue); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, issue)
}
