package app

import (
	"fmt"
	"strings"
)

// New runs opt in; existing plans keep their dependency and evidence fingerprints.
func validateProductionStageBarriers(plan map[string]any, steps []ProductionStepInput) error {
	spec := productionRecord(plan["productionSpec"])
	manifest := productionRecord(plan["executionManifest"])
	if spec["stageGateVersion"] == nil && manifest["stageGateVersion"] == nil {
		return nil
	}
	if int64Value(spec["stageGateVersion"]) != 1 || int64Value(manifest["stageGateVersion"]) != 1 ||
		int64Value(spec["workflowVersion"]) != 2 || int64Value(manifest["workflowVersion"]) != 2 ||
		int64Value(spec["selfCheckVersion"]) != 1 || int64Value(manifest["selfCheckVersion"]) != 1 {
		return fmt.Errorf("阶段门必须在 ProductionSpec/manifest 同时启用 stageGateVersion=1、workflowVersion=2 和逐资源自检")
	}
	byKey := make(map[string]ProductionStepInput, len(steps))
	for _, step := range steps {
		byKey[step.StepKey] = step
	}
	if err := requireProductionDependencies(byKey, "stage:rough_storyboard", []string{"stage:visual_design"}); err != nil {
		return err
	}
	if err := requireProductionDependencies(byKey, "stage:sound_plan", []string{"stage:asset_package"}); err != nil {
		return err
	}

	assets := productionManifestRecords(spec["sharedAssets"])
	assetByID := make(map[string]map[string]any, len(assets))
	var assetResources, assetSources []string
	for _, asset := range assets {
		id := strings.TrimSpace(stringValue(asset["assetId"]))
		assetByID[id] = asset
		if boolValue(asset["generate"]) {
			assetSources = append(assetSources, "asset:"+productionSafePlanKey(id))
		} else {
			assetResources = append(assetResources, stringValue(asset["resourceId"]))
		}
	}
	if err := requireProductionPictureContract(manifest, "stage:asset_package", assetResources, assetSources, []string{"visual_content", "reference_continuity"}); err != nil {
		return err
	}

	rows := productionManifestRecords(spec["storyboardRows"])
	rowIDs := make(map[string]bool, len(rows))
	var openingResources, openingSources []string
	pictureGate, ok := byKey["pictures:all-ready"]
	if !ok || pictureGate.Kind != "check" {
		return fmt.Errorf("制作计划缺少全部图片验收与关联的完成门槛")
	}
	if err := requireProductionDependencies(byKey, pictureGate.StepKey, []string{"stage:locked_storyboard"}); err != nil {
		return err
	}
	for _, row := range rows {
		rowID := stringValue(row["rowId"])
		rowIDs[rowID] = true
		if stringValue(spec["keyframeWorkflow"]) == "four_panel" {
			cuts := productionManifestStrings(row["keyframeAssetIds"])
			sheet := strings.TrimSpace(stringValue(row["keyframeSheetAssetId"]))
			if len(cuts) != 4 || len(uniqueProductionStrings(cuts)) != 4 || sheet == "" || containsString(cuts, sheet) || stringValue(row["firstFrameAssetId"]) != cuts[0] {
				return fmt.Errorf("分镜 %s 必须登记母图和按时间排序的四张独立切图，首帧为本镜切图1", rowID)
			}
			bound := productionManifestStrings(row["sharedAssetIds"])
			if containsString(bound, sheet) {
				return fmt.Errorf("分镜 %s 的视频引用不能用四宫格母图代替独立切图", rowID)
			}
			pictureResources := []string{}
			for _, id := range append([]string{sheet}, cuts...) {
				asset, found := assetByID[id]
				resource := strings.TrimSpace(stringValue(asset["resourceId"]))
				if !found || boolValue(asset["generate"]) || resource == "" || (id != sheet && !containsString(bound, id)) {
					return fmt.Errorf("分镜 %s 的母图/切图 %s 缺少真实复用资源或关联", rowID, id)
				}
				pictureResources = append(pictureResources, resource)
			}
			if len(uniqueProductionStrings(pictureResources)) != 5 {
				return fmt.Errorf("分镜 %s 的母图和四张切图不能复用同一图片冒充不同状态", rowID)
			}
			openingResources = append(openingResources, pictureResources...)
			rowResources, rowSources := []string{}, []string{}
			for _, id := range uniqueProductionStrings(append(bound, cuts[0])) {
				asset, found := assetByID[id]
				if !found {
					return fmt.Errorf("分镜 %s 的关联资产 %s 未登记", rowID, id)
				}
				if boolValue(asset["generate"]) {
					rowSources = append(rowSources, "asset:"+productionSafePlanKey(id))
				} else if resource := stringValue(asset["resourceId"]); resource != "" {
					rowResources = append(rowResources, resource)
				} else {
					return fmt.Errorf("分镜 %s 的关联资产 %s 无资源", rowID, id)
				}
			}
			if err := requireProductionPictureContract(manifest, "storyboard:"+productionSafePlanKey(rowID), rowResources, rowSources, []string{"visual_content", "reference_continuity", "keyframe_action"}); err != nil {
				return err
			}
		}
		if err := requireProductionDependencies(byKey, pictureGate.StepKey, []string{"storyboard:" + productionSafePlanKey(rowID)}); err != nil {
			return err
		}
		assetID := strings.TrimSpace(stringValue(row["firstFrameAssetId"]))
		if assetID != "" {
			asset := assetByID[assetID]
			if asset == nil {
				return fmt.Errorf("分镜 %s 的首帧资产 %s 未登记，不能跳过图片验收", rowID, assetID)
			}
			if boolValue(asset["generate"]) {
				openingSources = append(openingSources, "asset:"+productionSafePlanKey(assetID))
			} else {
				openingResources = append(openingResources, stringValue(asset["resourceId"]))
			}
		} else if boolValue(row["generateFirstFrame"]) && stringValue(row["videoOperation"]) != "text_to_video" {
			for _, step := range steps {
				if step.Kind == "video" && step.StoryboardRowID == rowID {
					key := "first-frame:" + productionSafePlanKey(rowID)
					frame, ok := byKey[key]
					if !ok || frame.Kind != "image" || frame.StoryboardRowID != rowID {
						return fmt.Errorf("分镜 %s 缺少必需的实际首帧生成步骤", rowID)
					}
					break
				}
			}
		}
	}
	for _, step := range steps {
		if step.Kind == "video" || step.Kind == "reuse_media" {
			if err := requireProductionDependencies(byKey, step.StepKey, []string{pictureGate.StepKey}); err != nil {
				return err
			}
		}
		if step.Kind != "image" || !strings.HasPrefix(step.StepKey, "first-frame:") {
			continue
		}
		if !rowIDs[step.StoryboardRowID] || step.StepKey != "first-frame:"+productionSafePlanKey(step.StoryboardRowID) {
			return fmt.Errorf("首帧步骤 %s 没有对应的正式分镜行", step.StepKey)
		}
		if err := requireProductionDependencies(byKey, step.StepKey, []string{"stage:asset_package", "stage:sound_plan"}); err != nil {
			return err
		}
		if err := requireProductionDependencies(byKey, "stage:locked_storyboard", []string{step.StepKey}); err != nil {
			return err
		}
		if err := requireProductionDependencies(byKey, "storyboard:"+productionSafePlanKey(step.StoryboardRowID), []string{step.StepKey}); err != nil {
			return err
		}
		openingSources = append(openingSources, step.StepKey)
	}
	checks := []string{"visual_content", "reference_continuity", "keyframe_action"}
	if stringValue(spec["keyframeWorkflow"]) == "four_panel" {
		checks = append(checks, "grid_cells_and_cut_edges")
	}
	return requireProductionPictureContract(manifest, "stage:locked_storyboard", openingResources, openingSources, checks)
}

func requireProductionPictureContract(manifest map[string]any, key string, resources, sources, checks []string) error {
	var contract map[string]any
	for _, item := range productionManifestRecords(manifest["selfCheckContracts"]) {
		if stringValue(item["stepKey"]) != key {
			continue
		}
		if contract != nil {
			return fmt.Errorf("图片自检阶段 %s 的合同重复", key)
		}
		contract = item
	}
	if contract == nil || !sameStringSet(productionManifestStrings(contract["resourceIds"]), uniqueProductionStrings(resources)) ||
		!sameStringSet(productionManifestStrings(contract["sourceStepKeys"]), uniqueProductionStrings(sources)) {
		return fmt.Errorf("图片自检阶段 %s 必须覆盖全部必需的实际资源和输出步骤", key)
	}
	if int64Value(contract["minSamples"]) < 1 || int64Value(contract["minSamples"]) > 200 {
		return fmt.Errorf("图片自检阶段 %s 缺少有效样本要求", key)
	}
	for _, check := range checks {
		if !containsString(productionManifestStrings(contract["requiredChecks"]), check) {
			return fmt.Errorf("图片自检阶段 %s 缺少必需检查 %s", key, check)
		}
	}
	return nil
}
