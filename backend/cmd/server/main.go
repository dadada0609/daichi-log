package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/daichi-log/backend/internal/handlers"
	"github.com/daichi-log/backend/internal/repository"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	_ = godotenv.Load()

	repository.InitDB()

	// ── 認証情報を環境変数から取得 ───────────────────────────────────
	appUser := os.Getenv("APP_USER")
	appPassword := os.Getenv("APP_PASSWORD")
	useAuth := appUser != "" && appPassword != ""

	// ── Gin エンジン ─────────────────────────────────────────────────
	r := gin.Default()

	// CORS（開発時や外部クライアントからのアクセスを許可）
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowAllOrigins = true
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	corsConfig.AllowHeaders = []string{"Origin", "Content-Type", "Accept", "Authorization"}
	r.Use(cors.New(corsConfig))

	// Health Check（認証なし — Render のヘルスチェックに対応）
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// ── Basic 認証グループを構築 ─────────────────────────────────────
	// APP_USER / APP_PASSWORD が未設定の場合は認証なしで動作（ローカル開発用）
	var protected gin.IRoutes
	if useAuth {
		accounts := gin.Accounts{appUser: appPassword}
		protected = r.Group("/", gin.BasicAuth(accounts))
		log.Printf("Basic Auth enabled for user: %s", appUser)
	} else {
		protected = r.Group("/")
		log.Println("Basic Auth disabled (APP_USER / APP_PASSWORD not set)")
	}

	// ── アップロードファイル配信（認証内） ───────────────────────────
	protected.(*gin.RouterGroup).Static("/uploads", "./uploads")

	// ── API ルート（認証内） ─────────────────────────────────────────
	api := protected.(*gin.RouterGroup).Group("/api/v1")
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

	// ── フロントエンド静的配信（認証内） ─────────────────────────────
	// バイナリ実行ディレクトリと同じ場所にある ./dist を参照する。
	// Render Build Command で: cp -r frontend/dist ./dist として配置。
	distDir := os.Getenv("FRONTEND_DIST")
	if distDir == "" {
		distDir = "./dist"
	}
	assetsDir := filepath.Join(distDir, "assets")

	// /assets/* → dist/assets/
	protected.(*gin.RouterGroup).Static("/assets", assetsDir)

	// SPA フォールバック: /api・/uploads・/assets 以外はすべて index.html を返す
	r.NoRoute(func(c *gin.Context) {
		// BasicAuth が有効な場合はここでも認証を検証する
		if useAuth {
			user, password, ok := c.Request.BasicAuth()
			if !ok || user != appUser || password != appPassword {
				c.Header("WWW-Authenticate", `Basic realm="daichi-log"`)
				c.AbortWithStatus(http.StatusUnauthorized)
				return
			}
		}

		indexPath := filepath.Join(distDir, "index.html")
		if _, err := os.Stat(indexPath); err == nil {
			c.File(indexPath)
		} else {
			c.JSON(http.StatusNotFound, gin.H{
				"error":   "frontend not built",
				"message": "Run: cd frontend && npm run build && cp -r dist ../dist",
			})
		}
	})

	// ── 起動 ─────────────────────────────────────────────────────────
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Starting server on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to run server: %v\n", err)
	}
}
