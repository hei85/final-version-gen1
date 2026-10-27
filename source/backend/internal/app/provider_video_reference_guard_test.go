package app

import (
	"strings"
	"testing"

	"infinite-canvas/backend/internal/protocol"
)

func TestAxonMetaH3PreservesExplicitFirstFrame(t *testing.T) {
	input := canvasGenerationInput{
		Config:          providerConfig{BaseURL: "https://zh.heihan.dpdns.org/v1", Model: "MiniMax H3-1", Size: "16:9"},
		ReferenceImages: []providerMedia{{ID: "opening", URL: "https://media.example/frame.png"}},
		Metadata:        map[string]interface{}{"videoEditOperation": "image_to_video", "videoStartFrameNodeId": "opening"},
	}
	spec := protocol.RequestSpec{Body: map[string]interface{}{}}
	if err := applyAxonH3VideoCreateFields(input, &spec); err != nil {
		t.Fatal(err)
	}
	fields := spec.Body.(map[string]interface{})
	if fields["first_frame"] != "https://media.example/frame.png" || fields["ref_image_0"] != nil {
		t.Fatalf("explicit first-frame role was lost: %#v", fields)
	}
}

func TestAxonMetaH3RejectsMixedFrameAndReferenceBeforeSubmission(t *testing.T) {
	input := canvasGenerationInput{
		Config:          providerConfig{BaseURL: "https://zh.heihan.dpdns.org/v1", Model: "MiniMax H3-1", Size: "16:9"},
		ReferenceImages: []providerMedia{{ID: "opening", URL: "https://media.example/frame.png"}, {ID: "identity", URL: "https://media.example/person.png"}},
		Metadata:        map[string]interface{}{"videoEditOperation": "image_to_video", "videoStartFrameNodeId": "opening"},
	}
	spec := protocol.RequestSpec{Body: map[string]interface{}{}}
	if err := applyAxonH3VideoCreateFields(input, &spec); err == nil {
		t.Fatal("mixed reference and exact frame inputs would be submitted")
	}
}

func TestAxonMetaH3MissingExplicitFrameIsRejected(t *testing.T) {
	input := canvasGenerationInput{
		Config:          providerConfig{BaseURL: "https://zh.heihan.dpdns.org/v1", Model: "MiniMax H3-1", Size: "16:9"},
		ReferenceImages: []providerMedia{{ID: "other", URL: "https://media.example/person.png"}},
		Metadata:        map[string]interface{}{"videoEditOperation": "image_to_video", "videoStartFrameNodeId": "missing"},
	}
	spec := protocol.RequestSpec{Body: map[string]interface{}{}}
	if err := applyAxonH3VideoCreateFields(input, &spec); err == nil || !strings.Contains(err.Error(), "首帧") {
		t.Fatalf("missing explicit frame should be rejected: %v", err)
	}
}

func TestAxonMetaH3SameImageCanAnchorBothEnds(t *testing.T) {
	input := canvasGenerationInput{
		Config:          providerConfig{BaseURL: "https://zh.heihan.dpdns.org/v1", Model: "MiniMax H3-1", Size: "16:9"},
		ReferenceImages: []providerMedia{{ID: "opening", URL: "https://media.example/frame.png"}},
		Metadata:        map[string]interface{}{"videoEditOperation": "image_to_video", "videoStartFrameNodeId": "opening", "videoEndFrameNodeId": "opening"},
	}
	spec := protocol.RequestSpec{Body: map[string]interface{}{}}
	if err := applyAxonH3VideoCreateFields(input, &spec); err != nil {
		t.Fatal(err)
	}
	fields := spec.Body.(map[string]interface{})
	if fields["first_frame"] != "https://media.example/frame.png" || fields["last_frame"] != fields["first_frame"] {
		t.Fatalf("same image lost a frame role: %#v", fields)
	}
}

func TestAxonMetaH3ReferenceAcceptanceUsesActualUsage(t *testing.T) {
	input := canvasGenerationInput{
		Config:          providerConfig{BaseURL: "https://zh.heihan.dpdns.org/v1", Model: "MiniMax H3-1"},
		ReferenceImages: []providerMedia{{URL: "https://media.example/person.png"}},
	}
	for _, tc := range []struct {
		name      string
		body      string
		wantError bool
	}{
		{"lost image", `{"data":{"task":{"usage":{"input_image_count":0}}}}`, true},
		{"accepted image", `{"task":{"usage":{"input_image_count":1}}}`, false},
		{"string count", `{"usage":{"input_image_count":"0"}}`, true},
		{"no evidence", `{"task":{"status":"succeeded"}}`, false},
		{"malformed count", `{"usage":{"input_image_count":"unknown"}}`, false},
	} {
		t.Run(tc.name, func(t *testing.T) {
			err := validateAxonH3ReferenceAcceptanceJSON(input, []byte(tc.body))
			if (err != nil) != tc.wantError {
				t.Fatalf("guard result = %v, wantError=%v", err, tc.wantError)
			}
		})
	}
	input.Config.BaseURL = "https://other-relay.example/v1"
	if err := validateAxonH3ReferenceAcceptanceJSON(input, []byte(`{"usage":{"input_image_count":0}}`)); err != nil {
		t.Fatal("another provider's usage contract was changed")
	}
}
