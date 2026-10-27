package platform

import (
	"bytes"
	"encoding/json"
	"mime/multipart"
	"strings"
	"testing"
)

func TestMultipartPayloadRetainsRepeatedPartsWithoutBytes(t *testing.T) {
	var body bytes.Buffer
	w := multipart.NewWriter(&body)
	for _, name := range []string{"character.png", "scene.png", "phone.png"} {
		part, _ := w.CreateFormFile("image[]", name)
		_, _ = part.Write([]byte("private-image-bytes"))
	}
	_ = w.WriteField("api_key", "private-test-key")
	_ = w.Close()
	logged := SanitizeAPICallPayload(body.Bytes(), w.FormDataContentType())
	var result map[string]any
	if err := json.Unmarshal([]byte(logged), &result); err != nil {
		t.Fatal(err)
	}
	files, ok := result["image[]"].([]any)
	if !ok || len(files) != 3 {
		t.Fatalf("file summaries = %#v", result["image[]"])
	}
	for index, name := range []string{"character.png", "scene.png", "phone.png"} {
		if files[index].(map[string]any)["fileName"] != name {
			t.Fatal("reference order changed")
		}
	}
	if strings.Contains(logged, "private-test-key") || strings.Contains(logged, "private-image-bytes") {
		t.Fatal("private data leaked")
	}
}
