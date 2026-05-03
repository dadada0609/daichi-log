package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"
)

// StringSlice は []string を PostgreSQL の TEXT カラムに JSON 形式で保存するカスタム型
type StringSlice []string

func (s StringSlice) Value() (driver.Value, error) {
	if s == nil {
		return "[]", nil
	}
	b, err := json.Marshal(s)
	if err != nil {
		return nil, err
	}
	return string(b), nil
}

func (s *StringSlice) Scan(value interface{}) error {
	if value == nil {
		*s = StringSlice{}
		return nil
	}
	var bytes []byte
	switch v := value.(type) {
	case string:
		bytes = []byte(v)
	case []byte:
		bytes = v
	default:
		return fmt.Errorf("unsupported type: %T", v)
	}
	return json.Unmarshal(bytes, s)
}

type Issue struct {
	IssueKey       string      `gorm:"primaryKey;column:issue_key"          json:"issueKey"`
	Title          string      `gorm:"column:title;not null"                json:"title"`
	Description    string      `gorm:"column:description"                   json:"description"`
	Status         string      `gorm:"column:status;not null;default:'OPEN'" json:"status"`
	Priority       string      `gorm:"column:priority;not null;default:'MEDIUM'" json:"priority"`
	Assignee       *string     `gorm:"column:assignee"                      json:"assignee"`
	StartDate      *string     `gorm:"column:start_date;type:date"          json:"startDate"`
	DueDate        *string     `gorm:"column:due_date;type:date"            json:"dueDate"`
	EstimatedHours *float64    `gorm:"column:estimated_hours"               json:"estimatedHours"`
	ActualHours    *float64    `gorm:"column:actual_hours"                  json:"actualHours"`
	CategoryIDs    StringSlice `gorm:"column:category_ids;type:text"        json:"categoryIds"`
	MilestoneIDs   StringSlice `gorm:"column:milestone_ids;type:text"       json:"milestoneIds"`
	VersionIDs     StringSlice `gorm:"column:version_ids;type:text"         json:"versionIds"`
	CreatedAt      time.Time   `gorm:"column:created_at;autoCreateTime"     json:"createdAt"`
	UpdatedAt      time.Time   `gorm:"column:updated_at;autoUpdateTime"     json:"updatedAt"`
}

func (Issue) TableName() string {
	return "issues"
}
