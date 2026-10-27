package app

import (
	"fmt"
	"infinite-canvas/backend/internal/protocol"
	"testing"
)

func TestVideoReferenceTransportBlocksDroppedImages(t *testing.T) {
	request := protocol.GenerationRequest{}
	refs := []any{}
	for i := 0; i < 6; i++ {
		url := fmt.Sprintf("https://example.test/%d.png", i)
		request.Images = append(request.Images, protocol.MediaReference{URL: url})
		refs = append(refs, map[string]any{"url": url})
	}
	partial := protocol.RequestSpec{Body: map[string]any{"image": refs[0]}}
	if err := validateVideoReferenceTransport("video", "xai-video", request, partial); err == nil {
		t.Fatal("silently allowed five missing references")
	}
	if err := validateVideoReferenceTransport("video", "yingce-h3-bridge-video", request, protocol.RequestSpec{Body: map[string]any{"reference_images": refs}}); err != nil {
		t.Fatal(err)
	}
	if err := validateVideoReferenceTransport("video", "xai-video", request, protocol.RequestSpec{Body: map[string]any{"image": refs[0], "prompt": request.Images[1].URL}}); err == nil {
		t.Fatal("a URL mentioned in prompt text is not a real image input")
	}
}
