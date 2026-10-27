package handler

import (
	"os"
	"path/filepath"
	"testing"

	"infinite-canvas/backend/internal/service"

	"github.com/gin-gonic/gin"
)

func TestChunkUploadCleanupRemovesClosedMergedFile(t *testing.T) {
	dir := t.TempDir()
	id := "cleanup-test"
	file, err := os.Create(filepath.Join(dir, "merged"))
	if err != nil {
		t.Fatal(err)
	}
	chunkUploadSessions.Lock()
	chunkUploadSessions.m[id] = &chunkedUploadSession{ID: id, Dir: dir}
	chunkUploadSessions.Unlock()
	func() {
		defer dropChunkSession(id)
		defer file.Close()
		_, _ = file.WriteString("uploaded-media")
	}()
	if _, err := os.Stat(dir); !os.IsNotExist(err) {
		t.Fatalf("completed session leaked merged file: %v", err)
	}
}

func TestChunkedUploadRoutesAreRegistered(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	group := router.Group("/api")
	RegisterChunkedUploadRoutes(group, &service.Service{})
	wanted := map[string]bool{
		"POST /api/resources/uploads":                  false,
		"PUT /api/resources/uploads/:id/chunks/:index": false,
		"POST /api/resources/uploads/:id/complete":     false,
	}
	for _, route := range router.Routes() {
		key := route.Method + " " + route.Path
		if _, exists := wanted[key]; exists {
			wanted[key] = true
		}
	}
	for route, found := range wanted {
		if !found {
			t.Errorf("route %s is not registered", route)
		}
	}
}
