package app

import (
	"encoding/json"
	"infinite-canvas/backend/internal/model"
	"os"
	"testing"
)

func frontendBarrierFixture(t *testing.T) (map[string]any, []ProductionStepInput) {
	t.Helper()
	path := os.Getenv("WORKFLOW_VERIFICATION_PLAN_OUTPUT")
	if path == "" {
		t.Skip("cross-language fixture is supplied by the workflow verification script")
	}
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var fixture struct {
		Plan  map[string]any        `json:"plan"`
		Steps []ProductionStepInput `json:"steps"`
	}
	if err := json.Unmarshal(data, &fixture); err != nil {
		t.Fatal(err)
	}
	return fixture.Plan, fixture.Steps
}

func TestProductionStageBarriersFrontendPlan(t *testing.T) {
	plan, steps := frontendBarrierFixture(t)
	if err := validateProductionWorkflowPlan(plan, steps, 10000, 30, 1); err != nil {
		t.Fatalf("actual frontend builder rejected by backend: %v", err)
	}
	cases := map[string]func(map[string]any, []ProductionStepInput){
		"missing picture gate": func(_ map[string]any, s []ProductionStepInput) {
			for i := range s {
				if s[i].StepKey == "pictures:all-ready" {
					s[i].Kind = "image"
				}
			}
		},
		"video bypass": func(_ map[string]any, s []ProductionStepInput) {
			for i := range s {
				if s[i].Kind == "video" {
					s[i].DependsOn = []string{"stage:asset_package", "stage:sound_plan", "stage:locked_storyboard", "stage:pilot"}
				}
			}
		},
		"missing fourth cut": func(p map[string]any, _ []ProductionStepInput) {
			productionManifestRecords(productionRecord(p["productionSpec"])["storyboardRows"])[0]["keyframeAssetIds"] = []any{"one-cut1", "one-cut2", "one-cut3"}
		},
		"wrong opening": func(p map[string]any, _ []ProductionStepInput) {
			productionManifestRecords(productionRecord(p["productionSpec"])["storyboardRows"])[1]["firstFrameAssetId"] = "one-cut4"
		},
		"missing locked resources": func(p map[string]any, _ []ProductionStepInput) {
			for _, c := range productionManifestRecords(productionRecord(p["executionManifest"])["selfCheckContracts"]) {
				if stringValue(c["stepKey"]) == "stage:locked_storyboard" {
					c["resourceIds"] = []any{"fixture-resource-one-cut1"}
				}
			}
		},
		"missing row coverage": func(p map[string]any, _ []ProductionStepInput) {
			for _, c := range productionManifestRecords(productionRecord(p["executionManifest"])["selfCheckContracts"]) {
				if stringValue(c["stepKey"]) == "storyboard:one" {
					c["resourceIds"] = []any{}
				}
			}
		},
	}
	for name, modify := range cases {
		t.Run(name, func(t *testing.T) {
			p, s := frontendBarrierFixture(t)
			modify(p, s)
			if err := validateProductionWorkflowPlan(p, s, 10000, 30, 1); err == nil {
				t.Fatal("incomplete/bypassed phase contract accepted")
			}
		})
	}
}

func TestProductionAuthorizationCannotReviveStoppedRun(t *testing.T) {
	for _, status := range []string{"completed", "cancelled", "paused"} {
		t.Run(status, func(t *testing.T) {
			svc, db := newTimelineTaskTestService(t)
			run := model.ProductionRun{ID: "fixture-stopped-" + status, UserID: "usr-production", Status: status, Revision: 1, PlanJSON: "{}", PolicyJSON: "{}"}
			if err := db.Create(&run).Error; err != nil {
				t.Fatal(err)
			}
			if _, err := svc.AuthorizeProductionRun("usr-production", run.ID, ProductionAuthorizeRequest{ExpectedRevision: 1, Policy: map[string]any{"budgetPolicy": "bounded"}}); err == nil {
				t.Fatal("authorization revived a stopped run")
			}
		})
	}
}
