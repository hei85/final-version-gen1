package protocol

import (
	"context"
	"os"
	"path/filepath"
	"testing"
)

func TestInstalledXAIVideoPluginMapsReferenceVideo(t *testing.T) {
	path := filepath.Join("..", "..", "..", "..", "plugin-packages", "xai-video.yingce-plugin")
	raw, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		t.Skip("portable xAI Video package is not present")
	}
	if err != nil {
		t.Fatal(err)
	}
	pkg, err := ParsePluginPackage(raw)
	if err != nil {
		t.Fatal(err)
	}
	providers, err := LoadInstalledProviders(pkg.ManifestRaw, nil)
	if err != nil {
		t.Fatal(err)
	}
	for _, adapter := range providers {
		if adapter.Metadata().ID != "xai-video" {
			continue
		}
		spec, err := adapter.BuildCreate(context.Background(), RequestContext{Request: GenerationRequest{
			Model: "Minimax-H3", Prompt: "follow motion",
			Videos: []MediaReference{{URL: "https://cdn.example/reference.mp4", Role: "reference_video"}},
		}})
		if err != nil {
			t.Fatal(err)
		}
		body, ok := spec.Body.(map[string]any)
		if !ok {
			t.Fatalf("body = %#v", spec.Body)
		}
		video, ok := body["video"].(map[string]any)
		if !ok || video["url"] != "https://cdn.example/reference.mp4" {
			t.Fatalf("video reference = %#v", body["video"])
		}
		return
	}
	t.Fatal("xai-video provider not found")
}

func TestInstalledXAIVideoPluginMapsMultipleReferenceVideos(t *testing.T) {
	path := filepath.Join("..", "..", "..", "..", "plugin-packages", "xai-video.yingce-plugin")
	raw, err := os.ReadFile(path)
	if os.IsNotExist(err) {
		t.Skip("portable xAI Video package is not present")
	}
	if err != nil {
		t.Fatal(err)
	}
	pkg, err := ParsePluginPackage(raw)
	if err != nil {
		t.Fatal(err)
	}
	providers, err := LoadInstalledProviders(pkg.ManifestRaw, nil)
	if err != nil {
		t.Fatal(err)
	}
	for _, adapter := range providers {
		if adapter.Metadata().ID != "xai-video" {
			continue
		}
		spec, err := adapter.BuildCreate(context.Background(), RequestContext{Request: GenerationRequest{
			Model: "Minimax-H3", Prompt: "follow motion",
			Videos: []MediaReference{
				{URL: "https://cdn.example/reference-1.mp4", Role: "reference_video"},
				{URL: "https://cdn.example/reference-2.mp4", Role: "reference_video"},
			},
		}})
		if err != nil {
			t.Fatal(err)
		}
		body, ok := spec.Body.(map[string]any)
		if !ok {
			t.Fatalf("body = %#v", spec.Body)
		}
		refs, ok := body["reference_videos"].([]any)
		if !ok || len(refs) != 2 {
			t.Fatalf("video references = %#v", body["reference_videos"])
		}
		return
	}
	t.Fatal("xai-video provider not found")
}
