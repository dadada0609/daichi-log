package models

import "time"

type GitCommit struct {
	CommitHash string    `gorm:"primaryKey;column:commit_hash" json:"commitHash"`
	Author     string    `gorm:"column:author;not null" json:"author"`
	Message    string    `gorm:"column:message;not null" json:"message"`
	Timestamp  time.Time `gorm:"column:timestamp;not null" json:"timestamp"`
}

func (GitCommit) TableName() string {
	return "git_commits"
}
