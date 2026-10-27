import { writeFileSync } from "node:fs";
import { expect, test } from "bun:test";
import { buildFilmProductionPlan } from "@/services/api/production-plan";
import { fourPanelSpec } from "./fixtures/four-panel-spec";

test("four-panel workflow covers all sheets/cuts, binds six unique inputs and gates every video", () => {
    const spec = fourPanelSpec(), built = buildFilmProductionPlan(spec);
    const contracts = built.manifest.selfCheckContracts;
    const locked = contracts?.find(contract => contract.stepKey === "stage:locked_storyboard");
    expect(locked?.resourceIds.length).toBe(10);
    expect(locked?.requiredChecks).toContain("grid_cells_and_cut_edges");
    const row = contracts?.find(contract => contract.stepKey === "storyboard:two");
    expect(row?.resourceIds.length).toBe(6);
    expect(row?.resourceIds).toContain("fixture-resource-two-cut4");
    expect(row?.resourceIds).not.toContain("fixture-resource-two-sheet");
    for (const step of built.steps.filter(step => step.kind === "video")) expect(step.dependsOn).toContain("pictures:all-ready");
    expect(built.steps.find(step => step.stepKey === "pictures:all-ready")?.dependsOn).toEqual(["stage:locked_storyboard", "storyboard:one", "storyboard:two"]);
    if (process.env.WORKFLOW_VERIFICATION_PLAN_OUTPUT) writeFileSync(process.env.WORKFLOW_VERIFICATION_PLAN_OUTPUT, JSON.stringify({ plan: { productionSpec: built.persistedSpec, executionManifest: built.manifest }, steps: built.steps }));
});
for (const [name, modify] of [
    ["missing cut", (spec: ReturnType<typeof fourPanelSpec>) => spec.storyboardRows[0].keyframeAssetIds!.pop()],
    ["duplicated cut", (spec: ReturnType<typeof fourPanelSpec>) => spec.storyboardRows[0].keyframeAssetIds![3] = "one-cut1"],
    ["previous ending as opening", (spec: ReturnType<typeof fourPanelSpec>) => spec.storyboardRows[1].firstFrameAssetId = "one-cut4"],
    ["unbound cut", (spec: ReturnType<typeof fourPanelSpec>) => spec.storyboardRows[0].sharedAssetIds!.splice(3, 1)],
    ["sheet video input", (spec: ReturnType<typeof fourPanelSpec>) => spec.storyboardRows[0].sharedAssetIds!.push("one-sheet")],
    ["same resource under two names", (spec: ReturnType<typeof fourPanelSpec>) => spec.sharedAssets!.find(a => a.assetId === "one-cut4")!.resourceId = "fixture-resource-one-cut1"],
] as const) test(`rejects ${name} before any paid submission`, () => { const spec = fourPanelSpec(); modify(spec); expect(() => buildFilmProductionPlan(spec)).toThrow(); });
