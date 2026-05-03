package repository

import (
	"log"
	"os"

	"github.com/daichi-log/backend/internal/models"
	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() {
	var db *gorm.DB
	var err error

	dbType := os.Getenv("DB_TYPE") // "sqlite" または省略時は PostgreSQL

	if dbType == "sqlite" {
		// SQLite モード
		dbPath := os.Getenv("SQLITE_PATH")
		if dbPath == "" {
			dbPath = "daichi_log.db"
		}
		log.Printf("Using SQLite: %s", dbPath)
		db, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
		if err != nil {
			log.Fatalf("Failed to connect to SQLite: %v", err)
		}
	} else {
		// PostgreSQL モード（デフォルト）
		dsn := os.Getenv("DATABASE_URL")
		if dsn == "" {
			dsn = "host=localhost user=postgres password=postgrespassword dbname=daichi_log port=5432 sslmode=disable TimeZone=Asia/Tokyo"
		}
		log.Printf("Using PostgreSQL")
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
		if err != nil {
			log.Fatalf("Failed to connect to PostgreSQL: %v", err)
		}
	}

	err = db.AutoMigrate(&models.Issue{}, &models.WikiPage{}, &models.GitCommit{})
	if err != nil {
		log.Fatalf("Failed to auto-migrate database: %v", err)
	}

	DB = db
	log.Println("Database connection and migration established")
}
