package app

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"infinite-canvas/backend/internal/protocol"
	"strings"
)

// Check the actual plugin payload before any paid create request.
func validateVideoReferenceTransport(mode, adapterID string, request protocol.GenerationRequest, spec protocol.RequestSpec) error {
	if mode != "video" || (adapterID != "xai-video" && adapterID != "yingce-h3-bridge-video") {
		return nil
	}
	expected := map[string]bool{}
	for _, image := range request.Images {
		value := strings.TrimSpace(image.URL)
		if value == "" {
			value = strings.TrimSpace(image.DataURL)
		}
		if value != "" {
			expected[value] = false
		}
	}
	if len(expected) == 0 {
		return nil
	}
	raw, err := json.Marshal(spec.Body)
	if err != nil {
		return err
	}
	var body map[string]any
	if err = json.Unmarshal(raw, &body); err != nil {
		return fmt.Errorf("视频图片输入无法检查：%w", err)
	}
	var visit func(any)
	visit = func(value any) {
		switch v := value.(type) {
		case string:
			if _, ok := expected[v]; ok {
				expected[v] = true
			}
		case []any:
			for _, item := range v {
				visit(item)
			}
		case map[string]any:
			for _, item := range v {
				visit(item)
			}
		}
	}
	for _, key := range []string{"image", "images", "reference_images", "first_frame", "last_frame", "first_frame_image", "last_frame_image"} {
		visit(body[key])
	}
	missing := 0
	for _, present := range expected {
		if !present {
			missing++
		}
	}
	if missing > 0 {
		return fmt.Errorf("参考图片传输不完整：%d 张输入中有 %d 张未写入视频请求，已停止提交，不会只发送部分图片", len(expected), missing)
	}
	if adapterID == "yingce-h3-bridge-video" {
		// These fields survive the existing relay. The bridge checks them before
		// dispatch, so partial, reordered or replaced inputs fail without billing.
		refs, _ := body["reference_images"].([]any)
		hashes := make([]string, 0, len(refs))
		roles := make([]string, 0, len(refs))
		for _, item := range refs {
			media, _ := item.(map[string]any)
			value, _ := media["url"].(string)
			role, _ := media["role"].(string)
			hash := sha256.Sum256([]byte(value))
			hashes = append(hashes, hex.EncodeToString(hash[:]))
			roles = append(roles, role)
		}
		if actual, ok := spec.Body.(map[string]any); ok {
			actual["bridge_reference_count"] = len(refs)
			actual["bridge_reference_hashes"] = hashes
			actual["bridge_image_roles"] = roles
		}
	}
	return nil
}
