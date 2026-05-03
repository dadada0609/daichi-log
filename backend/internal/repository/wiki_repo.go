package repository

import (
	"github.com/daichi-log/backend/internal/models"
)

func GetAllWikiPages() ([]models.WikiPage, error) {
	var pages []models.WikiPage
	result := DB.Order("updated_at desc").Find(&pages)
	return pages, result.Error
}

func GetWikiPageByID(pageID string) (*models.WikiPage, error) {
	var page models.WikiPage
	result := DB.Where("page_id = ?", pageID).First(&page)
	if result.Error != nil {
		return nil, result.Error
	}
	return &page, nil
}

func CreateOrUpdateWikiPage(page *models.WikiPage) error {
	result := DB.Save(page)
	return result.Error
}
