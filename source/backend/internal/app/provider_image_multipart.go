package app

import (
	"fmt"
	"strings"

	"infinite-canvas/backend/internal/model"
	"infinite-canvas/backend/internal/protocol"
)

// OpenAI's multipart contract uses image[] for multiple files. A repeated
// singular image field is rejected or reduced to one image by some relays.
// Keep the proven single-image/mask format and the input order unchanged.
func openAIImageEditFileField(count int) string {
	if count > 1 {
		return "image[]"
	}
	return "image"
}

func normalizeOpenAIImageEditFiles(input canvasGenerationInput, spec *protocol.RequestSpec) error {
	if input.Mode != "image" || input.Config.InterfaceType != string(model.ChannelInterfaceOpenAIImage) ||
		!strings.HasSuffix(strings.SplitN(spec.Path, "?", 2)[0], "/images/edits") ||
		!strings.EqualFold(strings.TrimSpace(strings.SplitN(spec.ContentType, ";", 2)[0]), "multipart/form-data") {
		return nil
	}
	count := 0
	for _, file := range spec.Files {
		if file.Name == "image" || file.Name == "image[]" {
			count++
		}
	}
	if count != len(input.ReferenceImages) {
		return fmt.Errorf("OpenAI 图片编辑文件数量与参考图不一致：%d / %d，已阻止提交", count, len(input.ReferenceImages))
	}
	for index := range spec.Files {
		if spec.Files[index].Name == "image" || spec.Files[index].Name == "image[]" {
			spec.Files[index].Name = openAIImageEditFileField(count)
		}
	}
	return nil
}
