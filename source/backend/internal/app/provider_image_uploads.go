package app

import (
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"image"
	_ "image/jpeg"
	_ "image/png"
	"os/exec"
	"time"
)

// Compact only the copies sent to a channel that explicitly opts in. Original
// resources, reference IDs/order, prompts and requested output size stay intact.
// Mask edits retain exact original source/mask geometry.
func prepareOpenAIImageReferenceUploads(ctx context.Context, input canvasGenerationInput) (canvasGenerationInput, error) {
	if input.ImageCapability == nil || input.Mask != nil || len(input.ReferenceImages) < 2 {
		return input, nil
	}
	policy := input.ImageCapability.References
	if policy.UploadMaxEdge == 0 && policy.UploadMaxTotalBytes == 0 {
		return input, nil
	}
	result := input
	result.ReferenceImages = append([]providerMedia(nil), input.ReferenceImages...)
	var total int64
	for index, media := range input.ReferenceImages {
		if err := ctx.Err(); err != nil {
			return input, err
		}
		raw, mimeType, err := mediaBytes(media)
		if err != nil {
			return input, fmt.Errorf("参考图%d读取失败：%w", index+1, err)
		}
		if policy.UploadMaxEdge > 0 {
			config, _, err := image.DecodeConfig(bytes.NewReader(raw))
			if err != nil || config.Width < 1 || config.Height < 1 || int64(config.Width)*int64(config.Height) > 80_000_000 {
				return input, fmt.Errorf("参考图%d无法安全读取尺寸；已阻止提交", index+1)
			}
			if max(config.Width, config.Height) > policy.UploadMaxEdge {
				encoded, err := compactImageUpload(ctx, raw, policy.UploadMaxEdge)
				if err != nil {
					return input, fmt.Errorf("参考图%d上传副本处理失败：%w", index+1, err)
				}
				decoded, _, err := image.DecodeConfig(bytes.NewReader(encoded))
				if err != nil || max(decoded.Width, decoded.Height) > policy.UploadMaxEdge || decoded.Width < 1 || decoded.Height < 1 {
					return input, fmt.Errorf("参考图%d上传副本尺寸校验失败", index+1)
				}
				media.Width, media.Height = decoded.Width, decoded.Height
				raw, mimeType = encoded, "image/png"
			}
		}
		total += int64(len(raw))
		if policy.UploadMaxTotalBytes > 0 && total > policy.UploadMaxTotalBytes {
			return input, fmt.Errorf("参考图上传副本合计超过本渠道配置的%.1fMB；请精简引用或调整渠道限制，未提交生成", float64(policy.UploadMaxTotalBytes)/(1<<20))
		}
		media.DataURL = "data:" + mimeType + ";base64," + base64.StdEncoding.EncodeToString(raw)
		media.URL = ""
		media.MimeType, media.Type, media.Bytes = mimeType, mimeType, int64(len(raw))
		result.ReferenceImages[index] = media
	}
	return result, nil
}

func compactImageUpload(ctx context.Context, raw []byte, edge int) ([]byte, error) {
	ffmpeg, err := renderFfmpegBinary()
	if err != nil {
		return nil, err
	}
	workCtx, cancel := context.WithTimeout(ctx, 20*time.Second)
	defer cancel()
	cmd := exec.CommandContext(workCtx, ffmpeg, "-hide_banner", "-loglevel", "error", "-threads", "1", "-i", "pipe:0", "-vf", fmt.Sprintf("scale=%d:%d:force_original_aspect_ratio=decrease:flags=lanczos", edge, edge), "-frames:v", "1", "-threads", "1", "-c:v", "png", "-pix_fmt", "rgba", "-f", "image2pipe", "pipe:1")
	cmd.Stdin = bytes.NewReader(raw)
	var output, diagnostics bytes.Buffer
	cmd.Stdout, cmd.Stderr = &output, &diagnostics
	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("本地图片处理失败（未向上游提交）：%w", err)
	}
	if output.Len() == 0 || output.Len() > 30<<20 {
		return nil, fmt.Errorf("本地图片处理返回无效副本")
	}
	return output.Bytes(), nil
}
