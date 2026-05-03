package main

import (
	"log"
	"net/http"
	"os"

	"github.com/daichi-log/backend/internal/handlers"
	"github.com/daichi-log/backend/internal/repository"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	repository.InitDB()

	r := gin.Default()

	// CORS Setup
	config := cors.DefaultConfig()
	config.AllowAllOrigins = true
	config.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	config.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	r.Use(cors.New(config))

	// Serve uploaded files
	r.Static("/uploads", "./uploads")

	// Health Check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	api := r.Group("/api/v1")
	{
		// Global Search
		api.GET("/search", handlers.SearchAll)

		// Issues
		api.GET("/issues", handlers.GetIssues)
		api.POST("/issues", handlers.CreateIssue)
		api.PUT("/issues/:issue_key", handlers.UpdateIssue)
		api.POST("/issues/:issue_key/wiki_link", handlers.LinkWikiToIssue)

		// Wiki
		api.GET("/wiki", handlers.GetWikiPages)
		api.GET("/wiki/:page_id", handlers.GetWikiPage)
		api.POST("/wiki", handlers.CreateOrUpdateWikiPage)

		// Git
		api.POST("/webhooks/git", handlers.HandleGitWebhook)
		api.GET("/issues/:issue_key/commits", handlers.GetCommitsByIssue)

		// Files
		api.POST("/files", handlers.UploadFile)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Println("Server is running on port " + port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to run server: %v", err)
	}
}
