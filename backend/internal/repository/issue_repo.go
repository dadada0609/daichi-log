package repository

import (
	"github.com/daichi-log/backend/internal/models"
)

func GetAllIssues() ([]models.Issue, error) {
	var issues []models.Issue
	result := DB.Find(&issues)
	return issues, result.Error
}

func GetIssueByKey(key string) (*models.Issue, error) {
	var issue models.Issue
	result := DB.Where("issue_key = ?", key).First(&issue)
	if result.Error != nil {
		return nil, result.Error
	}
	return &issue, nil
}

func CreateIssue(issue *models.Issue) error {
	result := DB.Create(issue)
	return result.Error
}

func UpdateIssue(issue *models.Issue) error {
	result := DB.Save(issue)
	return result.Error
}
