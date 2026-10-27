import type { FilmProductionPlanSpec } from "@/services/api/production-plan";
export function fourPanelSpec(): FilmProductionPlanSpec {
    const ref = (name: string) => ({ artifactId: `fixture-${name}`, versionId: "v1", inputFingerprint: `in-${name}`, outputFingerprint: `out-${name}` });
    const rows = ["one", "two"];
    const assets = ["identity", "environment", ...rows.flatMap(row => [`${row}-sheet`, ...[1, 2, 3, 4].map(n => `${row}-cut${n}`)])].map(assetId => ({ assetId, category: "scene" as const, generate: false, assetVersionId: `fixture-version-${assetId}`, resourceId: `fixture-resource-${assetId}` }));
    return { version: 1, workflowVersion: 2, selfCheckVersion: 1, stageGateVersion: 1, keyframeWorkflow: "four_panel", targetDurationMs: 10000, targetAspectRatio: "16:9", audioMode: "NATIVE_AUDIO", requireAudio: false,
        preproduction: { sourceScript: ref("source"), brief: ref("brief"), scriptBreakdown: ref("breakdown"), visualDesign: ref("visual"),
            roughStoryboard: { ...ref("rough"), rowIds: rows }, assetPackage: { ...ref("assets"), assetIds: assets.map(asset => asset.assetId) },
            soundPlan: { ...ref("sound"), voiceVersionIds: [] }, lockedStoryboard: { ...ref("locked"), rowIds: rows, durationFrames: 300 }, pilot: { ...ref("pilot"), sampleRowIds: ["one"] } },
        sharedAssets: assets, videoModels: [{ value: "fixture-video", supports: { capabilityRevision: "fixture-model:1", operations: ["image_to_video"], duration: { mode: "enum", values: [5], default: 5 }, ratios: ["16:9"], resolutions: ["1080p"], maxReferenceImages: 6, maxReferenceVideos: 0, maxReferenceAudios: 0, generateAudio: false } }],
        storyboardRows: rows.map((rowId, index) => ({ rowId, durationMs: 5000, videoOperation: "image_to_video", keyframeSheetAssetId: `${rowId}-sheet`, keyframeAssetIds: [1, 2, 3, 4].map(n => `${rowId}-cut${n}`), firstFrameAssetId: `${rowId}-cut1`, sharedAssetIds: [...[1, 2, 3, 4].map(n => `${rowId}-cut${n}`), "identity", index === 0 ? "environment" : "one-cut4"], segments: [{ segmentId: `${rowId}-clip`, order: 0, durationSeconds: 5, estimatedCostMicros: 100 }] })) };
}
