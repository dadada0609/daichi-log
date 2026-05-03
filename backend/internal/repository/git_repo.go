package repository

import (
	"github.com/daichi-log/backend/internal/models"
)

func CreateCommit(commit *models.GitCommit) error {
	result := DB.Create(commit)
	return result.Error
}

func GetCommitsByIssueKey(issueKey string) ([]models.GitCommit, error) {
	var commits []models.GitCommit
	query := "%" + issueKey + "%"
	result := DB.Where("message LIKE ?", query).Order("timestamp desc").Find(&commits)
	return commits, result.Error
}
