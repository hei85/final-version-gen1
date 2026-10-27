package app

import (
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"reflect"
	"testing"

	"infinite-canvas/backend/internal/protocol"
)

func TestOpenAIImageMultipartOrderedReferences(t *testing.T) {
	for _, declarative := range []bool{false, true} {
		for _, count := range []int{1, 3} {
			t.Run(fmt.Sprintf("declarative=%v/count=%d", declarative, count), func(t *testing.T) {
				allowLoopbackProviderTest(t)
				var want []string
				input := canvasGenerationInput{Mode: "image", Prompt: "ordered reference test", Config: providerConfig{InterfaceType: "openai-image", Model: "gpt-image-2-turbo", Size: "3840x2160", Quality: "high"}}
				for index := 0; index < count; index++ {
					value := fmt.Sprintf("reference-%d", index+1)
					want = append(want, value)
					input.ReferenceImages = append(input.ReferenceImages, providerMedia{ID: value, Name: value + ".png", DataURL: "data:image/png;base64," + base64.StdEncoding.EncodeToString([]byte(value))})
				}
				if count == 1 {
					input.Mask = &providerMedia{ID: "mask", DataURL: "data:image/png;base64,bWFzaw=="}
				}
				calls := 0
				server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
					calls++
					if r.URL.Path != "/v1/images/edits" {
						t.Errorf("path = %s", r.URL.Path)
					}
					reader, err := r.MultipartReader()
					if err != nil {
						t.Error(err)
						w.WriteHeader(400)
						return
					}
					var got []string
					maskCount := 0
					for {
						part, err := reader.NextPart()
						if err == io.EOF {
							break
						}
						if err != nil {
							t.Error(err)
							break
						}
						data, _ := io.ReadAll(part)
						if part.FileName() == "" {
							continue
						}
						if part.FormName() == "mask" {
							maskCount++
							continue
						}
						if part.FormName() != openAIImageEditFileField(count) {
							t.Errorf("image part name = %s", part.FormName())
						}
						got = append(got, string(data))
					}
					if !reflect.DeepEqual(got, want) {
						t.Errorf("ordered files = %v, want %v", got, want)
					}
					if (count == 1 && maskCount != 1) || (count > 1 && maskCount != 0) {
						t.Errorf("mask count = %d", maskCount)
					}
					w.Header().Set("Content-Type", "application/json")
					_, _ = w.Write([]byte(`{"data":[{"b64_json":"aGVsbG8="}]}`))
				}))
				defer server.Close()
				input.Config.BaseURL = server.URL + "/v1"
				ctx := context.Background()
				if declarative {
					ctx = withProtocolRegistry(ctx, loadOfficialFallbackRegistry())
					if _, ok := declarativeProtocolAdapterForContext(ctx, "openai-image"); !ok {
						t.Fatal("official adapter missing")
					}
				} else {
					ctx = withProtocolRegistry(ctx, emptyProtocolRegistry)
				}
				if _, err := runImageTask(ctx, input); err != nil {
					t.Fatal(err)
				}
				if calls != 1 {
					t.Fatalf("create calls = %d", calls)
				}
			})
		}
	}
}

func TestOpenAIImageMultipartRejectsMissingReferences(t *testing.T) {
	input := canvasGenerationInput{Mode: "image", Config: providerConfig{InterfaceType: "openai-image"}, ReferenceImages: []providerMedia{{ID: "one"}, {ID: "two"}}}
	spec := protocol.RequestSpec{Path: "/v1/images/edits", ContentType: "multipart/form-data", Files: []protocol.RequestFilePart{{Name: "image"}}}
	if normalizeOpenAIImageEditFiles(input, &spec) == nil {
		t.Fatal("missing reference must block submission")
	}
	input.Config.InterfaceType = "another-provider"
	if err := normalizeOpenAIImageEditFiles(input, &spec); err != nil || spec.Files[0].Name != "image" {
		t.Fatal("other protocols must keep their contract")
	}
}
