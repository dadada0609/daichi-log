package models

import "time"

type WikiPage struct {
	PageID    string    `gorm:"primaryKey;column:page_id" json:"pageId"`
	Title     string    `gorm:"column:title;not null" json:"title"`
	Content   string    `gorm:"column:content" json:"content"`
	Version   int       `gorm:"column:version;default:1" json:"version"`
	CreatedBy string    `gorm:"column:created_by" json:"createdBy"`
	UpdatedAt time.Time `gorm:"column:updated_at;autoUpdateTime" json:"updatedAt"`
}

func (WikiPage) TableName() string {
	return "wiki_pages"
}
