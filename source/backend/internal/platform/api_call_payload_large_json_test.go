package platform

import (
	"bytes"
	"encoding/json"
	"net/http"
	"strings"
	"testing"
)

func TestLargeJSONRequestRetainsReferenceContractWithoutMediaOrSecrets(t *testing.T) {
	inline := "data:image/png;base64," + strings.Repeat("A", (2<<20))
	payload := map[string]any{
		"model": "MiniMax H3-1", "seconds": "4", "resolution_name": "2K", "aspect_ratio": "16:9",
		"ref_image_0": inline, "ref_image_1": "https://media.example/image.png?signature=private-signature",
		"api_key": "private-api-key", "metadata": map[string]any{"authorization": "private-auth"},
	}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest(http.MethodPost, "https://relay.example/v1/videos", bytes.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	for _, logged := range []string{RequestPayloadForLog(req), SanitizeAPICallPayload(body, "application/json")} {
		var actual map[string]any
		if err := json.Unmarshal([]byte(logged), &actual); err != nil {
			t.Fatalf("large reference request has no structured audit: %s", logged)
		}
		if actual["model"] != payload["model"] || actual["resolution_name"] != "2K" || actual["ref_image_0"] == nil || actual["ref_image_1"] == nil {
			t.Fatalf("reference/options contract was lost: %#v", actual)
		}
		for _, secret := range []string{"private-api-key", "private-auth", "private-signature", strings.Repeat("A", 100)} {
			if strings.Contains(logged, secret) {
				t.Fatal("private request data entered logs")
			}
		}
		if len(logged) > 8192 {
			t.Fatal("inline media was not compacted")
		}
	}
	// Logging must not consume or alter the outgoing request body.
	reader, _ := req.GetBody()
	defer reader.Close()
	if req.ContentLength != int64(len(body)) {
		t.Fatal("request body changed while logging")
	}
}

func TestLargeJSONAuditRetainsContentRolesAndRejectsMalformedJSON(t *testing.T) {
	inline := "data:image/jpeg;base64," + strings.Repeat("A", (2<<20))
	body, _ := json.Marshal(map[string]any{"content": []any{map[string]any{"type": "image_url", "role": "first_frame", "image_url": map[string]any{"url": inline}}}})
	logged := SanitizeAPICallPayload(body, "application/json")
	if !strings.Contains(logged, "first_frame") || !strings.Contains(logged, "image_url") {
		t.Fatal("media role was lost")
	}
	broken := append(body, []byte(" trailing-private-data")...)
	if logged := SanitizeAPICallPayload(broken, "application/json"); strings.Contains(logged, "trailing-private-data") || json.Valid([]byte(logged)) {
		t.Fatal("malformed private payload was logged")
	}
}
