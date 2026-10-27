package app

import (
	"bytes"
	"context"
	"encoding/base64"
	"image"
	"image/color"
	"image/png"
	"os"
	"path/filepath"
	"testing"
)

// Explicit local diagnostic only; reads original approved fixtures and sends no
// HTTP requests. Normal test runs do not depend on the operator's media files.
func TestOriginalThreeReferenceUploadDiagnostic(t *testing.T) {
	directory := os.Getenv("CANVAS_UPLOAD_DIAGNOSTIC_DIR")
	if directory == "" {
		t.Skip("opt-in real input diagnostic")
	}
	profile := DefaultImageCapabilityConfig("openai-image", "gpt-image-2-turbo")
	profile.References.UploadMaxEdge = 1280
	profile.References.UploadMaxTotalBytes = 6 << 20
	input := canvasGenerationInput{Mode: "image", ImageCapability: profile, Config: providerConfig{Size: "3840x2160"}}
	for _, name := range []string{"character-a3.png", "scene-a1.png", "phone-a1.png"} {
		raw, err := os.ReadFile(filepath.Join(directory, name))
		if err != nil {
			t.Fatal(err)
		}
		input.ReferenceImages = append(input.ReferenceImages, providerMedia{ID: name, StorageKey: name, Bytes: int64(len(raw)), DataURL: "data:image/png;base64," + base64.StdEncoding.EncodeToString(raw)})
	}
	result, err := prepareOpenAIImageReferenceUploads(context.Background(), input)
	if err != nil {
		t.Fatal(err)
	}
	var total int64
	for index, media := range result.ReferenceImages {
		if media.ID != input.ReferenceImages[index].ID || media.Width != 1280 || media.Height != 720 {
			t.Fatal("identity/geometry changed")
		}
		total += media.Bytes
		t.Logf("reference%d copied bytes=%d dimensions=%dx%d", index+1, media.Bytes, media.Width, media.Height)
	}
	if len(result.ReferenceImages) != 3 || result.Config.Size != "3840x2160" {
		t.Fatal("reference count/output size changed")
	}
	t.Logf("Actual original27MB inputs prepared locally:3 copies, total%dbytes, output size%s preserved; no paid generation", total, result.Config.Size)
}

func uploadFixture(t *testing.T, id string) providerMedia {
	t.Helper()
	i := image.NewNRGBA(image.Rect(0, 0, 1600, 900))
	for y := 0; y < 900; y++ {
		for x := 0; x < 1600; x++ {
			i.SetNRGBA(x, y, color.NRGBA{R: byte(x), G: byte(y), B: 100, A: 180})
		}
	}
	var b bytes.Buffer
	if err := png.Encode(&b, i); err != nil {
		t.Fatal(err)
	}
	return providerMedia{ID: id, Name: id, StorageKey: "resource:" + id, DataURL: "data:image/png;base64," + base64.StdEncoding.EncodeToString(b.Bytes()), Bytes: int64(b.Len()), Width: 1600, Height: 900}
}

func TestImageUploadCopiesPreserveOriginalsAndOutputSettings(t *testing.T) {
	profile := DefaultImageCapabilityConfig("openai-image", "gpt-image-2-turbo")
	profile.References.UploadMaxEdge, profile.References.UploadMaxTotalBytes = 1280, 6<<20
	input := canvasGenerationInput{Mode: "image", Prompt: "same prompt", Config: providerConfig{Size: "3840x2160", Model: "example"}, ReferenceImages: []providerMedia{uploadFixture(t, "a"), uploadFixture(t, "b")}, ImageCapability: profile}
	original := append([]providerMedia(nil), input.ReferenceImages...)
	result, err := prepareOpenAIImageReferenceUploads(context.Background(), input)
	if err != nil {
		t.Fatal(err)
	}
	if input.ReferenceImages[0] != original[0] || input.ReferenceImages[1] != original[1] {
		t.Fatal("original resource changed")
	}
	if result.Config.Size != "3840x2160" || result.Prompt != input.Prompt {
		t.Fatal("output settings/prompt changed")
	}
	for index, value := range result.ReferenceImages {
		if value.ID != original[index].ID || value.StorageKey != original[index].StorageKey {
			t.Fatal("reference identity/order changed")
		}
		if value.Width != 1280 || value.Height != 720 {
			t.Fatalf("dimensions %d x %d", value.Width, value.Height)
		}
		raw, mime, err := mediaBytes(value)
		if err != nil || mime != "image/png" {
			t.Fatal("upload encoding invalid")
		}
		decoded, err := png.Decode(bytes.NewReader(raw))
		if err != nil {
			t.Fatal(err)
		}
		_, _, _, alpha := decoded.At(20, 20).RGBA()
		if alpha >= 65535 {
			t.Fatal("alpha discarded")
		}
	}
}

func TestImageUploadPolicyDoesNotChangeMasksSinglesOrDefaultModels(t *testing.T) {
	a := uploadFixture(t, "a")
	profile := DefaultImageCapabilityConfig("openai-image", "gpt-image-2-turbo")
	profile.References.UploadMaxEdge = 1280
	for _, input := range []canvasGenerationInput{
		{ReferenceImages: []providerMedia{a}, ImageCapability: profile},
		{ReferenceImages: []providerMedia{a, a}, ImageCapability: profile, Mask: &a},
		{ReferenceImages: []providerMedia{a, a}, ImageCapability: DefaultImageCapabilityConfig("openai-image", "gpt-image-2-turbo")},
	} {
		r, err := prepareOpenAIImageReferenceUploads(context.Background(), input)
		if err != nil || r.ReferenceImages[0] != a {
			t.Fatal("unconfigured/mask/single input changed")
		}
	}
}

func TestImageUploadTotalLimitAndCancellationFailBeforeSubmission(t *testing.T) {
	a := uploadFixture(t, "a")
	profile := DefaultImageCapabilityConfig("openai-image", "gpt-image-2-turbo")
	profile.References.UploadMaxTotalBytes = 1
	input := canvasGenerationInput{ReferenceImages: []providerMedia{a, a}, ImageCapability: profile}
	if _, err := prepareOpenAIImageReferenceUploads(context.Background(), input); err == nil {
		t.Fatal("total limit ignored")
	}
	ctx, cancel := context.WithCancel(context.Background())
	cancel()
	if _, err := prepareOpenAIImageReferenceUploads(ctx, input); err == nil {
		t.Fatal("cancelled request processed")
	}
	profile.References.UploadMaxEdge = 16
	if err := validateImageCapabilityConfig(profile); err == nil {
		t.Fatal("unsafe pixel limit accepted")
	}
}
