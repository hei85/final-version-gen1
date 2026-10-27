import { writeFileSync } from "node:fs";
import { expect, test } from "bun:test";
import { buildFilmProductionPlan } from "@/services/api/production-plan";
import { fourPanelSpec } from "./fixtures/four-panel-spec";
test("unmodified legacy plan fingerprints match the preserved original builder", async () => {
    const path = process.env.WORKFLOW_BASELINE_PLAN_MODULE || "./fixtures/legacy-plan-baseline-20261009/production-plan.ts";
    const original = await import(path);
    const spec = fourPanelSpec();
    delete spec.stageGateVersion; delete spec.keyframeWorkflow; delete spec.selfCheckVersion;
    spec.videoModels[0].supports.maxReferenceImages = 8;
    for (const workflowVersion of [1, 2] as const) {
        spec.workflowVersion = workflowVersion;
        const before = original.buildFilmProductionPlan(spec), after = buildFilmProductionPlan(spec);
        expect(after.steps).toEqual(before.steps);
        expect(after.manifest).toEqual(before.manifest);
        if (process.env.WORKFLOW_FINGERPRINT_OUTPUT) writeFileSync(process.env.WORKFLOW_FINGERPRINT_OUTPUT, JSON.stringify({ verifiedWorkflowVersions: [1, 2], comparedSteps: after.steps.length, fingerprints: after.steps.map(step => ({ stepKey: step.stepKey, inputFingerprint: step.inputFingerprint })), unchanged: true }));
    }
});
