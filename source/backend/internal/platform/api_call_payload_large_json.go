package platform

import (
	"encoding/json"
	"fmt"
	"io"
	"strings"
)

// Parse large JSON one value at a time, replacing inline media immediately.
// This retains reference fields/roles and generation options in diagnostics,
// without keeping Base64 images or credentials in the log database.
func sanitizeLargeAPICallJSON(source io.Reader) string {
	decoder := json.NewDecoder(io.LimitReader(source, (128<<20)+1))
	decoder.UseNumber()
	value, err := readSanitizedAPICallJSON(decoder, "", 0)
	if err != nil || decoder.InputOffset() > 128<<20 {
		return "[大型 JSON 报文无法完整解析，未记录正文]"
	}
	if _, err := decoder.Token(); err != io.EOF {
		return "[大型 JSON 报文格式无效，未记录正文]"
	}
	formatted, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		return "[大型 JSON 报文无法脱敏，未记录正文]"
	}
	return truncateAPICallPayload(string(formatted))
}

func readSanitizedAPICallJSON(decoder *json.Decoder, key string, depth int) (any, error) {
	if depth > 64 {
		return nil, fmt.Errorf("JSON nesting limit")
	}
	token, err := decoder.Token()
	if err != nil {
		return nil, err
	}
	if delimiter, ok := token.(json.Delim); ok {
		switch delimiter {
		case '{':
			result := make(map[string]any)
			for decoder.More() {
				if len(result) >= 4096 {
					return nil, fmt.Errorf("JSON object field limit")
				}
				name, err := decoder.Token()
				if err != nil {
					return nil, err
				}
				field, ok := name.(string)
				if !ok || len(field) > 8192 {
					return nil, fmt.Errorf("JSON field name limit")
				}
				value, err := readSanitizedAPICallJSON(decoder, field, depth+1)
				if err != nil {
					return nil, err
				}
				result[field] = value
			}
			if _, err := decoder.Token(); err != nil {
				return nil, err
			}
			return sanitizeAPICallJSON(result, key), nil
		case '[':
			result := make([]any, 0)
			for decoder.More() {
				if len(result) >= 4096 {
					return nil, fmt.Errorf("JSON array item limit")
				}
				value, err := readSanitizedAPICallJSON(decoder, key, depth+1)
				if err != nil {
					return nil, err
				}
				result = append(result, value)
			}
			if _, err := decoder.Token(); err != nil {
				return nil, err
			}
			return sanitizeAPICallJSON(result, key), nil
		default:
			return nil, fmt.Errorf("unexpected JSON delimiter")
		}
	}
	value := sanitizeAPICallJSON(token, key)
	if text, ok := value.(string); ok && len(text) > 8192 {
		// Do not split a UTF-8 code point when keeping a long prompt excerpt.
		value = strings.ToValidUTF8(text[:8192], "") + fmt.Sprintf(" [字符串已截断，原始长度 %d 字节]", len(text))
	}
	return value, nil
}
