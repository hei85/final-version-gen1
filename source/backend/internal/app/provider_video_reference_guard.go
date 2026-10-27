package app

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
)

// This exact relay alias uses MiniMax's mutually exclusive frame/reference modes.
// Legacy AutoDL H3 workflows keep their own existing field contracts.
func isAxonMetaH3Model(name string) bool {
	name = strings.NewReplacer("_", "-", " ", "-").Replace(strings.ToLower(strings.TrimSpace(name)))
	return name == "minimax-h3-1"
}

func validateAxonH3ReferenceAcceptanceJSON(input canvasGenerationInput, body []byte) error {
	if !isHeihanAxonH3Video(input.Config.BaseURL, input.Config.Model) || !isAxonMetaH3Model(input.Config.Model) || len(input.ReferenceImages) == 0 {
		return nil
	}
	var payload map[string]interface{}
	if json.Unmarshal(body, &payload) != nil {
		return nil
	}
	return validateAxonH3ReferenceAcceptance(input, payload)
}

func validateAxonH3ReferenceAcceptance(input canvasGenerationInput, payload map[string]interface{}) error {
	if !isHeihanAxonH3Video(input.Config.BaseURL, input.Config.Model) || !isAxonMetaH3Model(input.Config.Model) || len(input.ReferenceImages) == 0 {
		return nil
	}
	actual, known := h3ObservedInputImageCount(payload, 0)
	if !known {
		return nil // Missing upstream usage is not proof of accepted or lost references.
	}
	values, _, err := axonH3MediaValues(input.ReferenceImages, "image")
	if err != nil {
		return err
	}
	unique := make(map[string]struct{}, len(values))
	for _, value := range values {
		unique[value] = struct{}{}
	}
	if actual < len(unique) {
		return fmt.Errorf("上游参考图接收不一致：请求 %d 张，上游实际记录 %d 张；当前结果不能作为带图生成成功，请核对中转站转发。原任务已保留，不会自动重发", len(unique), actual)
	}
	return nil
}

func h3ObservedInputImageCount(payload map[string]interface{}, depth int) (int, bool) {
	if depth > 6 {
		return 0, false
	}
	if usage, ok := payload["usage"].(map[string]interface{}); ok {
		value, exists := usage["input_image_count"]
		if exists {
			count, err := strconv.Atoi(fmt.Sprint(value))
			if err == nil && count >= 0 {
				return count, true
			}
		}
	}
	for _, key := range []string{"task", "data", "result"} {
		if nested, ok := payload[key].(map[string]interface{}); ok {
			if count, known := h3ObservedInputImageCount(nested, depth+1); known {
				return count, true
			}
		}
	}
	return 0, false
}
