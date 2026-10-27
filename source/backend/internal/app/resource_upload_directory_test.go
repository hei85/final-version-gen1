package app

import (
	"os"
	"path/filepath"
	"testing"
)

func TestResourceUploadDirectoryUsesDataVolume(t *testing.T) {
	data := t.TempDir()
	svc := &Service{dataDir: data}
	dir, err := svc.NewResourceUploadDirectory()
	if err != nil {
		t.Fatal(err)
	}
	if filepath.Dir(dir) != filepath.Join(data, "upload-staging") {
		t.Fatalf("upload directory outside data volume: %s", dir)
	}
	if err := os.WriteFile(filepath.Join(dir, "chunk-0"), []byte("media"), 0o600); err != nil {
		t.Fatal(err)
	}
}
