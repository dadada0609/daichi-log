package repository

import (
	"log"
	"net/url"
	"os"
	"strings"

	"github.com/daichi-log/backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	var db *gorm.DB
	var err error

	dbType := os.Getenv("DB_TYPE")
	dsn := os.Getenv("DATABASE_URL")

	if dbType == "postgres" && dsn != "" {
		// PostgreSQL モード
		// 見えない改行コードや空白を徹底除去
		dsn = strings.TrimSpace(strings.ReplaceAll(strings.ReplaceAll(dsn, "\r", ""), "\n", ""))
		
		// DSNがURL形式の場合、パースできるか検証する
		if strings.HasPrefix(dsn, "postgres://") || strings.HasPrefix(dsn, "postgresql://") {
			_, parseErr := url.Parse(dsn)
			if parseErr != nil {
				log.Printf("Warning: Failed to parse DATABASE_URL: %v", parseErr)
			}
		}

		log.Printf("Using PostgreSQL")
		db, err = gorm.Open(postgres.New(postgres.Config{
			DSN:                  dsn,
			PreferSimpleProtocol: true, // Render pgBouncer (コネクションプーラー) 対策として Prepared Statement を無効化
		}), &gorm.Config{})
		if err != nil {
			log.Printf("Error: Failed to connect to PostgreSQL: %v", err)
		}
	} else {
		// SQLite モード（デフォルト）
		dbPath := strings.TrimSpace(os.Getenv("SQLITE_PATH"))
		if dbPath == "" {
			dbPath = "daichi_log.db"
		}
		log.Printf("Using SQLite: %s", dbPath)
		db, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
		if err != nil {
			log.Printf("Error: Failed to connect to SQLite: %v", err)
		}
	}

	DB = db
	if DB != nil {
		log.Println("Database connection established")
	} else {
		log.Println("Warning: Database connection is nil. The application may not function correctly.")
	}

	// マイグレーションの完全な非同期化（サーバー起動をブロックさせないため）
	go func(database *gorm.DB) {
		if database == nil {
			log.Println("Skipping auto-migration: database connection is nil")
			return
		}
		log.Println("Starting background auto-migration...")
		migErr := database.AutoMigrate(&models.Issue{}, &models.WikiPage{}, &models.GitCommit{})
		if migErr != nil {
			log.Printf("Error: Failed to auto-migrate database in background: %v", migErr)
		} else {
			log.Println("Background auto-migration completed successfully")
		}
	}(db)
}
