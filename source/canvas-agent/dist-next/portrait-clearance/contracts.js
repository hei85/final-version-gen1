import { z } from "zod";
export const PORTRAIT_CLEARANCE_SCHEMA_VERSION = 1;
export const PORTRAIT_CLEARANCE_MODULE_ID = "portrait-clearance";
export const portraitRiskLevelSchema = z.enum(["high", "medium", "low_to_medium", "low", "unable_to_determine"]);
export const portraitClearanceModeSchema = z.enum(["direct-compare", "network-search"]);
export const portraitClearanceAnalysisModeSchema = z.enum(["local-plus-vision", "local-only"]);
export const portraitClearanceDedupModeSchema = z.enum(["phash", "arcface"]);
export const portraitClearanceInputRoleSchema = z.enum(["query", "reference", "candidate"]);
export const portraitClearanceTaskStatusSchema = z.enum(["queued", "running", "waiting_model", "partial", "completed", "failed", "cancelled"]);
export const portraitClearanceTaskStageSchema = z.enum([
    "validating-inputs",
    "checking-model-resources",
    "preparing-query",
    "searching",
    "downloading-candidates",
    "deduplicating",
    "local-comparing",
    "waiting-for-model",
    "model-comparing",
    "building-report",
    "done",
]);
export const portraitClearanceSettingsSchema = z.object({
    maxCandidates: z.number().int().min(1).max(60),
    searchScrolls: z.number().int().min(0).max(20),
    dedupMode: portraitClearanceDedupModeSchema,
    modelConcurrency: z.number().int().min(1).max(10),
    showBrowserForDebug: z.boolean(),
}).strict();
export const portraitClearanceInputSchema = z.object({
    nodeId: z.string().min(1).max(160),
    role: portraitClearanceInputRoleSchema,
    fileName: z.string().min(1).max(240),
    mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
    dataUrl: z.string().regex(/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/=_-]+$/),
}).strict();
export const createPortraitClearanceTaskRequestSchema = z.object({
    schemaVersion: z.literal(PORTRAIT_CLEARANCE_SCHEMA_VERSION),
    clientOperationId: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9._:-]{7,159}$/),
    ownerScopeHash: z.string().regex(/^[a-f0-9]{64}$/),
    projectId: z.string().min(1).max(160),
    nodeId: z.string().min(1).max(160),
    mode: portraitClearanceModeSchema,
    analysisMode: portraitClearanceAnalysisModeSchema,
    modelRef: z.string().min(1).max(240).optional(),
    inputs: z.array(portraitClearanceInputSchema).min(1).max(61),
    settings: portraitClearanceSettingsSchema,
}).strict();
export const portraitImageQualitySchema = z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    sharpness: z.number().finite().nonnegative(),
    brightness: z.number().finite().min(0).max(255),
    contrast: z.number().finite().nonnegative(),
    grade: z.enum(["good", "usable", "poor"]),
}).strict();
export const portraitFaceSchema = z.object({
    bbox: z.tuple([z.number().finite(), z.number().finite(), z.number().finite(), z.number().finite()]),
    detScore: z.number().finite().min(0).max(1),
    areaRatio: z.number().finite().min(0).max(1),
}).strict();
export const portraitLocalPrecheckSchema = z.object({
    qualityA: portraitImageQualitySchema,
    qualityB: portraitImageQualitySchema,
    facesA: z.number().int().nonnegative(),
    facesB: z.number().int().nonnegative(),
    selectedFaceA: portraitFaceSchema.optional(),
    selectedFaceB: portraitFaceSchema.optional(),
    faceSimilarity: z.number().finite().min(-1).max(1).optional(),
    ssim: z.number().finite().min(-1).max(1),
    colorHistogramCorrelation: z.number().finite().min(-1).max(1),
    canExtractEmbedding: z.boolean(),
    reliabilityIssues: z.array(z.string().min(1).max(500)).max(32),
}).strict();
export const portraitFeatureKeySchema = z.enum(["face_shape", "facial_layout", "eyes_brows", "nose_mouth", "hair_hairline", "distinctive_features"]);
const portraitFeatureComparisonSchema = z.object({
    similarity: z.enum(["high", "medium", "low", "none"]),
    note: z.string().max(1_000),
}).strict();
export const portraitVisionComparisonSchema = z.object({
    imageAType: z.enum(["realistic", "stylized"]),
    imageBType: z.enum(["realistic", "stylized"]),
    analysisPath: z.enum(["A", "B"]),
    status: z.enum(["success", "unable_to_determine"]),
    riskLevel: portraitRiskLevelSchema,
    overallSimilarity: z.number().finite().min(0).max(1),
    featureComparison: z.object({
        face_shape: portraitFeatureComparisonSchema,
        facial_layout: portraitFeatureComparisonSchema,
        eyes_brows: portraitFeatureComparisonSchema,
        nose_mouth: portraitFeatureComparisonSchema,
        hair_hairline: portraitFeatureComparisonSchema,
        distinctive_features: portraitFeatureComparisonSchema,
    }).strict(),
    basis: z.array(z.string().min(1).max(1_000)).max(16),
    limitations: z.array(z.string().min(1).max(1_000)).max(16),
    modificationSuggestions: z.array(z.string().min(1).max(1_000)).max(16),
    insightfaceFusionNote: z.string().max(1_000),
    manualReviewRecommended: z.boolean(),
}).strict();
export const portraitPairResultSchema = z.object({
    id: z.string().min(1).max(160),
    queryImageId: z.string().min(1).max(160),
    comparisonImageId: z.string().min(1).max(160),
    candidateId: z.string().min(1).max(160).optional(),
    source: z.enum(["connected-reference", "connected-candidate", "baidu"]),
    status: z.enum(["success", "partial", "failed"]),
    riskLevel: portraitRiskLevelSchema,
    overallSimilarity: z.number().finite().min(0).max(1).optional(),
    analysisPath: z.enum(["A", "B", "unable"]),
    localPrecheck: portraitLocalPrecheckSchema,
    visionComparison: portraitVisionComparisonSchema.optional(),
    basis: z.array(z.string().min(1).max(1_000)).max(32),
    limitations: z.array(z.string().min(1).max(1_000)).max(32),
    error: z.object({ code: z.string().min(1).max(120), message: z.string().min(1).max(1_000), retryable: z.boolean() }).strict().optional(),
}).strict();
export const portraitCandidateSchema = z.object({
    id: z.string().min(1).max(160),
    originalRank: z.number().int().nonnegative(),
    title: z.string().max(500),
    imageArtifactId: z.string().min(1).max(160),
    imageUrl: z.string().url().max(4_000).optional(),
    sourcePageUrl: z.string().url().max(4_000).optional(),
    sourceDomain: z.string().max(255).optional(),
    source: z.enum(["connected", "baidu"]),
    byteSize: z.number().int().nonnegative(),
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
    dedupGroupId: z.string().min(1).max(160).optional(),
    resultId: z.string().min(1).max(160).optional(),
}).strict();
export const portraitClearanceResultSchema = z.object({
    schemaVersion: z.literal(PORTRAIT_CLEARANCE_SCHEMA_VERSION),
    taskId: z.string().min(1).max(160),
    mode: portraitClearanceModeSchema,
    queryImageId: z.string().min(1).max(160),
    highestRisk: portraitRiskLevelSchema,
    riskCounts: z.record(portraitRiskLevelSchema, z.number().int().nonnegative()),
    candidateCount: z.number().int().nonnegative(),
    comparedCount: z.number().int().nonnegative(),
    candidates: z.array(portraitCandidateSchema).max(60),
    pairs: z.array(portraitPairResultSchema).max(60),
    limitations: z.array(z.string().min(1).max(1_000)).max(32),
    createdAt: z.string().datetime(),
    completedAt: z.string().datetime().optional(),
}).strict();
export const portraitModelJobStatusSchema = z.enum(["pending", "leased", "completed", "failed"]);
export const portraitModelJobSchema = z.object({
    jobId: z.string().regex(/^portrait-job-[a-f0-9]{16,80}$/),
    taskId: z.string().min(1).max(160),
    pairId: z.string().min(1).max(160),
    queryImageId: z.string().min(1).max(160),
    comparisonImageId: z.string().min(1).max(160),
    status: portraitModelJobStatusSchema,
    attempt: z.number().int().nonnegative(),
    leaseToken: z.string().regex(/^[A-Za-z0-9_-]{16,160}$/).optional(),
    leaseExpiresAt: z.string().datetime().optional(),
    errorCode: z.string().min(1).max(120).optional(),
    errorMessage: z.string().min(1).max(1_000).optional(),
}).strict();
export const portraitModelJobCompleteRequestSchema = z.object({
    attempt: z.number().int().nonnegative(),
    leaseToken: z.string().regex(/^[A-Za-z0-9_-]{16,160}$/),
    visionComparison: portraitVisionComparisonSchema,
}).strict();
export const portraitModelJobFailRequestSchema = z.object({
    attempt: z.number().int().nonnegative(),
    leaseToken: z.string().regex(/^[A-Za-z0-9_-]{16,160}$/),
    errorCode: z.string().min(1).max(120),
    errorMessage: z.string().min(1).max(1_000),
    retryable: z.boolean(),
}).strict();
export const portraitTaskSummarySchema = z.object({
    taskId: z.string().min(1).max(160),
    clientOperationId: z.string().min(1).max(160),
    ownerScopeHash: z.string().regex(/^[a-f0-9]{64}$/),
    projectId: z.string().min(1).max(160),
    nodeId: z.string().min(1).max(160),
    mode: portraitClearanceModeSchema,
    analysisMode: portraitClearanceAnalysisModeSchema,
    modelRef: z.string().min(1).max(240).optional(),
    status: portraitClearanceTaskStatusSchema,
    stage: portraitClearanceTaskStageSchema,
    progress: z.number().finite().min(0).max(1),
    processedCandidates: z.number().int().nonnegative(),
    totalCandidates: z.number().int().nonnegative().optional(),
    errorCode: z.string().min(1).max(120).optional(),
    errorMessage: z.string().min(1).max(1_000).optional(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    completedAt: z.string().datetime().optional(),
    detailsAvailable: z.boolean(),
}).strict();
export const PORTRAIT_ERROR_MESSAGES = {
    portrait_plugin_disabled: "请先在插件中心启用肖像排查",
    portrait_runtime_unavailable: "肖像排查本机引擎不可用",
    portrait_module_unavailable: "当前 Canvas Agent 不包含肖像排查模块",
    portrait_model_missing: "请先安装并校验本地肖像模型",
    portrait_input_missing: "请连接所需的图片节点",
    portrait_input_invalid: "输入图片损坏、过大或格式不受支持",
    portrait_multiple_faces: "图片包含多张人脸，请先裁剪到单一目标后重试",
    portrait_search_captcha: "搜索服务需要验证码，请使用可见浏览器重试或连接手动候选",
    portrait_candidate_download_blocked: "候选图片下载被安全策略阻止",
    portrait_task_cancelled: "任务已停止，已完成阶段仍可查看",
    portrait_model_job_not_found: "视觉模型作业不存在",
    portrait_model_job_conflict: "视觉模型作业已失效，请重新打开任务",
    portrait_artifact_not_found: "排查报告不存在",
};
export function riskFromFaceSimilarity(similarity) {
    if (similarity === undefined || !Number.isFinite(similarity))
        return "unable_to_determine";
    if (similarity >= 0.65)
        return "high";
    if (similarity >= 0.5)
        return "medium";
    if (similarity >= 0.35)
        return "low_to_medium";
    return "low";
}
export function riskScore(level) {
    return { high: 1, medium: 0.66, low_to_medium: 0.5, low: 0.2, unable_to_determine: 0 }[level];
}
export function highestRisk(levels) {
    return levels.reduce((highest, current) => riskScore(current) > riskScore(highest) ? current : highest, "unable_to_determine");
}
