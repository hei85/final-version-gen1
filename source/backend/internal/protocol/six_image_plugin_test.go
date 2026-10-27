package protocol

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"testing"
)

func multiImagePlugin(t *testing.T, id string) Adapter {
	t.Helper()
	directory := os.Getenv("YINGCE_MULTI_IMAGE_PLUGIN_DIR")
	if directory == "" {
		directory = filepath.Join("..", "..", "..", "..", "plugin-packages")
	}
	raw, err := os.ReadFile(filepath.Join(directory, id+".yingce-plugin"))
	if err != nil {
		t.Fatal(err)
	}
	pkg, err := ParsePluginPackage(raw)
	if err != nil {
		t.Fatal(err)
	}
	adapters, err := LoadInstalledProviders(pkg.ManifestRaw, nil)
	if err != nil {
		t.Fatal(err)
	}
	return adapters[0]
}

func TestSixImagesAreNotReducedToOneByInstalledPlugin(t *testing.T) {
	for _, id := range []string{"xai-video", "yingce-h3-bridge-video"} {
		t.Run(id, func(t *testing.T) {
			request := GenerationRequest{Model: "Minimax-H3", Prompt: "six references", Duration: 8}
			for i := 0; i < 6; i++ {
				request.Images = append(request.Images, MediaReference{URL: fmt.Sprintf("https://example.test/%d.png", i), Order: i})
			}
			spec, err := multiImagePlugin(t, id).BuildCreate(context.Background(), RequestContext{Request: request})
			if err != nil {
				t.Fatal(err)
			}
			body := spec.Body.(map[string]any)
			refs, ok := body["reference_images"].([]any)
			if !ok || len(refs) != 6 {
				t.Fatalf("six inputs became %#v", body["reference_images"])
			}
			if body["image"] != nil {
				t.Fatalf("multi-reference request also contains a first-frame input: %#v", body["image"])
			}
			for i, item := range refs {
				if item.(map[string]any)["url"] != request.Images[i].URL {
					t.Fatalf("reference %d changed order or value", i)
				}
			}
		})
	}
}

func TestH3BridgePreservesOneFirstFrameAndFiveReferences(t *testing.T) {
	request := GenerationRequest{Model: "Minimax-H3", Prompt: "mixed roles", Duration: 8}
	for i := 0; i < 6; i++ {
		role := "reference_image"
		if i == 0 {
			role = "first_frame"
		}
		request.Images = append(request.Images, MediaReference{URL: fmt.Sprintf("https://example.test/%d.png", i), Role: role, Order: i})
	}
	spec, err := multiImagePlugin(t, "yingce-h3-bridge-video").BuildCreate(context.Background(), RequestContext{Request: request})
	if err != nil {
		t.Fatal(err)
	}
	body := spec.Body.(map[string]any)
	refs := body["reference_images"].([]any)
	if len(refs) != 6 {
		t.Fatalf("refs=%#v", refs)
	}
	for i, item := range refs {
		if item.(map[string]any)["role"] != request.Images[i].Role {
			t.Fatalf("role %d lost", i)
		}
	}
}

func TestH3BridgeRejectsTooManyImagesBeforeSubmission(t *testing.T) {
	request := GenerationRequest{Model: "Minimax-H3", Prompt: "oversized", Duration: 8}
	for i := 0; i < 10; i++ {
		request.Images = append(request.Images, MediaReference{URL: fmt.Sprintf("https://example.test/%d.png", i), Order: i})
	}
	if _, err := multiImagePlugin(t, "yingce-h3-bridge-video").BuildCreate(context.Background(), RequestContext{Request: request}); err == nil {
		t.Fatal("silently accepted oversized input")
	}
}
