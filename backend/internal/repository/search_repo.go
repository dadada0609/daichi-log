package repository

import (
	"github.com/daichi-log/backend/internal/models"
)

type SearchResult struct {
	Type  string `json:"type"`  // "issue", "wiki"
	ID    string `json:"id"`    // issue_key or page_id
	Title string `json:"title"`
	Match string `json:"match"` // Highlight or matched text summary
}

func SearchAll(query string) ([]SearchResult, error) {
	var results []SearchResult

	// Search Issues (Title or Description using regex/ILIKE)
	var issues []models.Issue
	searchPattern := "%" + query + "%"
	err := DB.Where("title ILIKE ? OR description ILIKE ?", searchPattern, searchPattern).Find(&issues).Error
	if err == nil {
		for _, issue := range issues {
			results = append(results, SearchResult{
				Type:  "issue",
				ID:    issue.IssueKey,
				Title: issue.Title,
				Match: "課題: " + issue.Title,
			})
		}
	}

	// Search Wiki (Title or Content)
	var wikis []models.WikiPage
	err = DB.Where("title ILIKE ? OR content ILIKE ?", searchPattern, searchPattern).Find(&wikis).Error
	if err == nil {
		for _, wiki := range wikis {
			results = append(results, SearchResult{
				Type:  "wiki",
				ID:    wiki.PageID,
				Title: wiki.Title,
				Match: "Wiki: " + wiki.Title,
			})
		}
	}

	return results, nil
}
