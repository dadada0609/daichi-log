package handlers

import (
	"net/http"

	"github.com/daichi-log/backend/internal/models"
	"github.com/daichi-log/backend/internal/repository"
	"github.com/gin-gonic/gin"
)

// GET /api/v1/wiki — 全ページ一覧
func GetWikiPages(c *gin.Context) {
	pages, err := repository.GetAllWikiPages()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, pages)
}

// GET /api/v1/wiki/:page_id — 個別ページ取得
func GetWikiPage(c *gin.Context) {
	pageID := c.Param("page_id")
	page, err := repository.GetWikiPageByID(pageID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Wiki page not found"})
		return
	}
	c.JSON(http.StatusOK, page)
}

// POST /api/v1/wiki — 作成または更新
func CreateOrUpdateWikiPage(c *gin.Context) {
	var page models.WikiPage
	if err := c.ShouldBindJSON(&page); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := repository.CreateOrUpdateWikiPage(&page); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, page)
}
