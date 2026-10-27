import { z } from "zod";
export declare const PORTRAIT_CLEARANCE_SCHEMA_VERSION: 1;
export declare const PORTRAIT_CLEARANCE_MODULE_ID: "portrait-clearance";
export declare const portraitRiskLevelSchema: z.ZodEnum<["high", "medium", "low_to_medium", "low", "unable_to_determine"]>;
export type PortraitRiskLevel = z.infer<typeof portraitRiskLevelSchema>;
export declare const portraitClearanceModeSchema: z.ZodEnum<["direct-compare", "network-search"]>;
export type PortraitClearanceMode = z.infer<typeof portraitClearanceModeSchema>;
export declare const portraitClearanceAnalysisModeSchema: z.ZodEnum<["local-plus-vision", "local-only"]>;
export type PortraitClearanceAnalysisMode = z.infer<typeof portraitClearanceAnalysisModeSchema>;
export declare const portraitClearanceDedupModeSchema: z.ZodEnum<["phash", "arcface"]>;
export type PortraitClearanceDedupMode = z.infer<typeof portraitClearanceDedupModeSchema>;
export declare const portraitClearanceInputRoleSchema: z.ZodEnum<["query", "reference", "candidate"]>;
export type PortraitClearanceInputRole = z.infer<typeof portraitClearanceInputRoleSchema>;
export declare const portraitClearanceTaskStatusSchema: z.ZodEnum<["queued", "running", "waiting_model", "partial", "completed", "failed", "cancelled"]>;
export type PortraitClearanceTaskStatus = z.infer<typeof portraitClearanceTaskStatusSchema>;
export declare const portraitClearanceTaskStageSchema: z.ZodEnum<["validating-inputs", "checking-model-resources", "preparing-query", "searching", "downloading-candidates", "deduplicating", "local-comparing", "waiting-for-model", "model-comparing", "building-report", "done"]>;
export type PortraitClearanceTaskStage = z.infer<typeof portraitClearanceTaskStageSchema>;
export declare const portraitClearanceSettingsSchema: z.ZodObject<{
    maxCandidates: z.ZodNumber;
    searchScrolls: z.ZodNumber;
    dedupMode: z.ZodEnum<["phash", "arcface"]>;
    modelConcurrency: z.ZodNumber;
    showBrowserForDebug: z.ZodBoolean;
}, "strict", z.ZodTypeAny, {
    maxCandidates: number;
    searchScrolls: number;
    dedupMode: "arcface" | "phash";
    modelConcurrency: number;
    showBrowserForDebug: boolean;
}, {
    maxCandidates: number;
    searchScrolls: number;
    dedupMode: "arcface" | "phash";
    modelConcurrency: number;
    showBrowserForDebug: boolean;
}>;
export type PortraitClearanceSettings = z.infer<typeof portraitClearanceSettingsSchema>;
export declare const portraitClearanceInputSchema: z.ZodObject<{
    nodeId: z.ZodString;
    role: z.ZodEnum<["query", "reference", "candidate"]>;
    fileName: z.ZodString;
    mimeType: z.ZodEnum<["image/jpeg", "image/png", "image/webp"]>;
    dataUrl: z.ZodString;
}, "strict", z.ZodTypeAny, {
    nodeId: string;
    role: "candidate" | "query" | "reference";
    fileName: string;
    mimeType: "image/jpeg" | "image/png" | "image/webp";
    dataUrl: string;
}, {
    nodeId: string;
    role: "candidate" | "query" | "reference";
    fileName: string;
    mimeType: "image/jpeg" | "image/png" | "image/webp";
    dataUrl: string;
}>;
export type PortraitClearanceInput = z.infer<typeof portraitClearanceInputSchema>;
export declare const createPortraitClearanceTaskRequestSchema: z.ZodObject<{
    schemaVersion: z.ZodLiteral<1>;
    clientOperationId: z.ZodString;
    ownerScopeHash: z.ZodString;
    projectId: z.ZodString;
    nodeId: z.ZodString;
    mode: z.ZodEnum<["direct-compare", "network-search"]>;
    analysisMode: z.ZodEnum<["local-plus-vision", "local-only"]>;
    modelRef: z.ZodOptional<z.ZodString>;
    inputs: z.ZodArray<z.ZodObject<{
        nodeId: z.ZodString;
        role: z.ZodEnum<["query", "reference", "candidate"]>;
        fileName: z.ZodString;
        mimeType: z.ZodEnum<["image/jpeg", "image/png", "image/webp"]>;
        dataUrl: z.ZodString;
    }, "strict", z.ZodTypeAny, {
        nodeId: string;
        role: "candidate" | "query" | "reference";
        fileName: string;
        mimeType: "image/jpeg" | "image/png" | "image/webp";
        dataUrl: string;
    }, {
        nodeId: string;
        role: "candidate" | "query" | "reference";
        fileName: string;
        mimeType: "image/jpeg" | "image/png" | "image/webp";
        dataUrl: string;
    }>, "many">;
    settings: z.ZodObject<{
        maxCandidates: z.ZodNumber;
        searchScrolls: z.ZodNumber;
        dedupMode: z.ZodEnum<["phash", "arcface"]>;
        modelConcurrency: z.ZodNumber;
        showBrowserForDebug: z.ZodBoolean;
    }, "strict", z.ZodTypeAny, {
        maxCandidates: number;
        searchScrolls: number;
        dedupMode: "arcface" | "phash";
        modelConcurrency: number;
        showBrowserForDebug: boolean;
    }, {
        maxCandidates: number;
        searchScrolls: number;
        dedupMode: "arcface" | "phash";
        modelConcurrency: number;
        showBrowserForDebug: boolean;
    }>;
}, "strict", z.ZodTypeAny, {
    schemaVersion: 1;
    clientOperationId: string;
    ownerScopeHash: string;
    projectId: string;
    nodeId: string;
    mode: "direct-compare" | "network-search";
    analysisMode: "local-only" | "local-plus-vision";
    modelRef?: string | undefined;
    inputs: {
        nodeId: string;
        role: "candidate" | "query" | "reference";
        fileName: string;
        mimeType: "image/jpeg" | "image/png" | "image/webp";
        dataUrl: string;
    }[];
    settings: {
        maxCandidates: number;
        searchScrolls: number;
        dedupMode: "arcface" | "phash";
        modelConcurrency: number;
        showBrowserForDebug: boolean;
    };
}, {
    schemaVersion: 1;
    clientOperationId: string;
    ownerScopeHash: string;
    projectId: string;
    nodeId: string;
    mode: "direct-compare" | "network-search";
    analysisMode: "local-only" | "local-plus-vision";
    modelRef?: string | undefined;
    inputs: {
        nodeId: string;
        role: "candidate" | "query" | "reference";
        fileName: string;
        mimeType: "image/jpeg" | "image/png" | "image/webp";
        dataUrl: string;
    }[];
    settings: {
        maxCandidates: number;
        searchScrolls: number;
        dedupMode: "arcface" | "phash";
        modelConcurrency: number;
        showBrowserForDebug: boolean;
    };
}>;
export type CreatePortraitClearanceTaskRequest = z.infer<typeof createPortraitClearanceTaskRequestSchema>;
export declare const portraitImageQualitySchema: z.ZodObject<{
    width: z.ZodNumber;
    height: z.ZodNumber;
    sharpness: z.ZodNumber;
    brightness: z.ZodNumber;
    contrast: z.ZodNumber;
    grade: z.ZodEnum<["good", "usable", "poor"]>;
}, "strict", z.ZodTypeAny, {
    width: number;
    height: number;
    sharpness: number;
    brightness: number;
    contrast: number;
    grade: "good" | "poor" | "usable";
}, {
    width: number;
    height: number;
    sharpness: number;
    brightness: number;
    contrast: number;
    grade: "good" | "poor" | "usable";
}>;
export type PortraitImageQuality = z.infer<typeof portraitImageQualitySchema>;
export declare const portraitFaceSchema: z.ZodObject<{
    bbox: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
    detScore: z.ZodNumber;
    areaRatio: z.ZodNumber;
}, "strict", z.ZodTypeAny, {
    bbox: [number, number, number, number];
    detScore: number;
    areaRatio: number;
}, {
    bbox: [number, number, number, number];
    detScore: number;
    areaRatio: number;
}>;
export declare const portraitLocalPrecheckSchema: z.ZodObject<{
    qualityA: z.ZodObject<{
        width: z.ZodNumber;
        height: z.ZodNumber;
        sharpness: z.ZodNumber;
        brightness: z.ZodNumber;
        contrast: z.ZodNumber;
        grade: z.ZodEnum<["good", "usable", "poor"]>;
    }, "strict", z.ZodTypeAny, {
        width: number;
        height: number;
        sharpness: number;
        brightness: number;
        contrast: number;
        grade: "good" | "poor" | "usable";
    }, {
        width: number;
        height: number;
        sharpness: number;
        brightness: number;
        contrast: number;
        grade: "good" | "poor" | "usable";
    }>;
    qualityB: z.ZodObject<{
        width: z.ZodNumber;
        height: z.ZodNumber;
        sharpness: z.ZodNumber;
        brightness: z.ZodNumber;
        contrast: z.ZodNumber;
        grade: z.ZodEnum<["good", "usable", "poor"]>;
    }, "strict", z.ZodTypeAny, {
        width: number;
        height: number;
        sharpness: number;
        brightness: number;
        contrast: number;
        grade: "good" | "poor" | "usable";
    }, {
        width: number;
        height: number;
        sharpness: number;
        brightness: number;
        contrast: number;
        grade: "good" | "poor" | "usable";
    }>;
    facesA: z.ZodNumber;
    facesB: z.ZodNumber;
    selectedFaceA: z.ZodOptional<z.ZodObject<{
        bbox: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
        detScore: z.ZodNumber;
        areaRatio: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        bbox: [number, number, number, number];
        detScore: number;
        areaRatio: number;
    }, {
        bbox: [number, number, number, number];
        detScore: number;
        areaRatio: number;
    }>>;
    selectedFaceB: z.ZodOptional<z.ZodObject<{
        bbox: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
        detScore: z.ZodNumber;
        areaRatio: z.ZodNumber;
    }, "strict", z.ZodTypeAny, {
        bbox: [number, number, number, number];
        detScore: number;
        areaRatio: number;
    }, {
        bbox: [number, number, number, number];
        detScore: number;
        areaRatio: number;
    }>>;
    faceSimilarity: z.ZodOptional<z.ZodNumber>;
    ssim: z.ZodNumber;
    colorHistogramCorrelation: z.ZodNumber;
    canExtractEmbedding: z.ZodBoolean;
    reliabilityIssues: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    qualityA: {
        width: number;
        height: number;
        sharpness: number;
        brightness: number;
        contrast: number;
        grade: "good" | "poor" | "usable";
    };
    qualityB: {
        width: number;
        height: number;
        sharpness: number;
        brightness: number;
        contrast: number;
        grade: "good" | "poor" | "usable";
    };
    facesA: number;
    facesB: number;
    selectedFaceA?: {
        bbox: [number, number, number, number];
        detScore: number;
        areaRatio: number;
    } | undefined;
    selectedFaceB?: {
        bbox: [number, number, number, number];
        detScore: number;
        areaRatio: number;
    } | undefined;
    faceSimilarity?: number | undefined;
    ssim: number;
    colorHistogramCorrelation: number;
    canExtractEmbedding: boolean;
    reliabilityIssues: string[];
}, {
    qualityA: {
        width: number;
        height: number;
        sharpness: number;
        brightness: number;
        contrast: number;
        grade: "good" | "poor" | "usable";
    };
    qualityB: {
        width: number;
        height: number;
        sharpness: number;
        brightness: number;
        contrast: number;
        grade: "good" | "poor" | "usable";
    };
    facesA: number;
    facesB: number;
    selectedFaceA?: {
        bbox: [number, number, number, number];
        detScore: number;
        areaRatio: number;
    } | undefined;
    selectedFaceB?: {
        bbox: [number, number, number, number];
        detScore: number;
        areaRatio: number;
    } | undefined;
    faceSimilarity?: number | undefined;
    ssim: number;
    colorHistogramCorrelation: number;
    canExtractEmbedding: boolean;
    reliabilityIssues: string[];
}>;
export type PortraitLocalPrecheck = z.infer<typeof portraitLocalPrecheckSchema>;
export declare const portraitFeatureKeySchema: z.ZodEnum<["face_shape", "facial_layout", "eyes_brows", "nose_mouth", "hair_hairline", "distinctive_features"]>;
export type PortraitFeatureKey = z.infer<typeof portraitFeatureKeySchema>;
export declare const portraitVisionComparisonSchema: z.ZodObject<{
    imageAType: z.ZodEnum<["realistic", "stylized"]>;
    imageBType: z.ZodEnum<["realistic", "stylized"]>;
    analysisPath: z.ZodEnum<["A", "B"]>;
    status: z.ZodEnum<["success", "unable_to_determine"]>;
    riskLevel: z.ZodEnum<["high", "medium", "low_to_medium", "low", "unable_to_determine"]>;
    overallSimilarity: z.ZodNumber;
    featureComparison: z.ZodObject<{
        face_shape: z.ZodObject<{
            similarity: z.ZodEnum<["high", "medium", "low", "none"]>;
            note: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        }, {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        }>;
        facial_layout: z.ZodObject<{
            similarity: z.ZodEnum<["high", "medium", "low", "none"]>;
            note: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        }, {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        }>;
        eyes_brows: z.ZodObject<{
            similarity: z.ZodEnum<["high", "medium", "low", "none"]>;
            note: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        }, {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        }>;
        nose_mouth: z.ZodObject<{
            similarity: z.ZodEnum<["high", "medium", "low", "none"]>;
            note: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        }, {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        }>;
        hair_hairline: z.ZodObject<{
            similarity: z.ZodEnum<["high", "medium", "low", "none"]>;
            note: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        }, {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        }>;
        distinctive_features: z.ZodObject<{
            similarity: z.ZodEnum<["high", "medium", "low", "none"]>;
            note: z.ZodString;
        }, "strict", z.ZodTypeAny, {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        }, {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        }>;
    }, "strict", z.ZodTypeAny, {
        face_shape: {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        };
        facial_layout: {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        };
        eyes_brows: {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        };
        nose_mouth: {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        };
        hair_hairline: {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        };
        distinctive_features: {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        };
    }, {
        face_shape: {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        };
        facial_layout: {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        };
        eyes_brows: {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        };
        nose_mouth: {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        };
        hair_hairline: {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        };
        distinctive_features: {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        };
    }>;
    basis: z.ZodArray<z.ZodString, "many">;
    limitations: z.ZodArray<z.ZodString, "many">;
    modificationSuggestions: z.ZodArray<z.ZodString, "many">;
    insightfaceFusionNote: z.ZodString;
    manualReviewRecommended: z.ZodBoolean;
}, "strict", z.ZodTypeAny, {
    imageAType: "realistic" | "stylized";
    imageBType: "realistic" | "stylized";
    analysisPath: "A" | "B";
    status: "success" | "unable_to_determine";
    riskLevel: "high" | "low" | "low_to_medium" | "medium" | "unable_to_determine";
    overallSimilarity: number;
    featureComparison: {
        face_shape: {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        };
        facial_layout: {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        };
        eyes_brows: {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        };
        nose_mouth: {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        };
        hair_hairline: {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        };
        distinctive_features: {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        };
    };
    basis: string[];
    limitations: string[];
    modificationSuggestions: string[];
    insightfaceFusionNote: string;
    manualReviewRecommended: boolean;
}, {
    imageAType: "realistic" | "stylized";
    imageBType: "realistic" | "stylized";
    analysisPath: "A" | "B";
    status: "success" | "unable_to_determine";
    riskLevel: "high" | "low" | "low_to_medium" | "medium" | "unable_to_determine";
    overallSimilarity: number;
    featureComparison: {
        face_shape: {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        };
        facial_layout: {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        };
        eyes_brows: {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        };
        nose_mouth: {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        };
        hair_hairline: {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        };
        distinctive_features: {
            similarity: "high" | "low" | "medium" | "none";
            note: string;
        };
    };
    basis: string[];
    limitations: string[];
    modificationSuggestions: string[];
    insightfaceFusionNote: string;
    manualReviewRecommended: boolean;
}>;
export type PortraitVisionComparison = z.infer<typeof portraitVisionComparisonSchema>;
export declare const portraitPairResultSchema: z.ZodObject<{
    id: z.ZodString;
    queryImageId: z.ZodString;
    comparisonImageId: z.ZodString;
    candidateId: z.ZodOptional<z.ZodString>;
    source: z.ZodEnum<["connected-reference", "connected-candidate", "baidu"]>;
    status: z.ZodEnum<["success", "partial", "failed"]>;
    riskLevel: z.ZodEnum<["high", "medium", "low_to_medium", "low", "unable_to_determine"]>;
    overallSimilarity: z.ZodOptional<z.ZodNumber>;
    analysisPath: z.ZodEnum<["A", "B", "unable"]>;
    localPrecheck: z.ZodObject<{
        qualityA: z.ZodObject<{
            width: z.ZodNumber;
            height: z.ZodNumber;
            sharpness: z.ZodNumber;
            brightness: z.ZodNumber;
            contrast: z.ZodNumber;
            grade: z.ZodEnum<["good", "usable", "poor"]>;
        }, "strict", z.ZodTypeAny, {
            width: number;
            height: number;
            sharpness: number;
            brightness: number;
            contrast: number;
            grade: "good" | "poor" | "usable";
        }, {
            width: number;
            height: number;
            sharpness: number;
            brightness: number;
            contrast: number;
            grade: "good" | "poor" | "usable";
        }>;
        qualityB: z.ZodObject<{
            width: z.ZodNumber;
            height: z.ZodNumber;
            sharpness: z.ZodNumber;
            brightness: z.ZodNumber;
            contrast: z.ZodNumber;
            grade: z.ZodEnum<["good", "usable", "poor"]>;
        }, "strict", z.ZodTypeAny, {
            width: number;
            height: number;
            sharpness: number;
            brightness: number;
            contrast: number;
            grade: "good" | "poor" | "usable";
        }, {
            width: number;
            height: number;
            sharpness: number;
            brightness: number;
            contrast: number;
            grade: "good" | "poor" | "usable";
        }>;
        facesA: z.ZodNumber;
        facesB: z.ZodNumber;
        selectedFaceA: z.ZodOptional<z.ZodObject<{
            bbox: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
            detScore: z.ZodNumber;
            areaRatio: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            bbox: [number, number, number, number];
            detScore: number;
            areaRatio: number;
        }, {
            bbox: [number, number, number, number];
            detScore: number;
            areaRatio: number;
        }>>;
        selectedFaceB: z.ZodOptional<z.ZodObject<{
            bbox: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
            detScore: z.ZodNumber;
            areaRatio: z.ZodNumber;
        }, "strict", z.ZodTypeAny, {
            bbox: [number, number, number, number];
            detScore: number;
            areaRatio: number;
        }, {
            bbox: [number, number, number, number];
            detScore: number;
            areaRatio: number;
        }>>;
        faceSimilarity: z.ZodOptional<z.ZodNumber>;
        ssim: z.ZodNumber;
        colorHistogramCorrelation: z.ZodNumber;
        canExtractEmbedding: z.ZodBoolean;
        reliabilityIssues: z.ZodArray<z.ZodString, "many">;
    }, "strict", z.ZodTypeAny, {
        qualityA: {
            width: number;
            height: number;
            sharpness: number;
            brightness: number;
            contrast: number;
            grade: "good" | "poor" | "usable";
        };
        qualityB: {
            width: number;
            height: number;
            sharpness: number;
            brightness: number;
            contrast: number;
            grade: "good" | "poor" | "usable";
        };
        facesA: number;
        facesB: number;
        selectedFaceA?: {
            bbox: [number, number, number, number];
            detScore: number;
            areaRatio: number;
        } | undefined;
        selectedFaceB?: {
            bbox: [number, number, number, number];
            detScore: number;
            areaRatio: number;
        } | undefined;
        faceSimilarity?: number | undefined;
        ssim: number;
        colorHistogramCorrelation: number;
        canExtractEmbedding: boolean;
        reliabilityIssues: string[];
    }, {
        qualityA: {
            width: number;
            height: number;
            sharpness: number;
            brightness: number;
            contrast: number;
            grade: "good" | "poor" | "usable";
        };
        qualityB: {
            width: number;
            height: number;
            sharpness: number;
            brightness: number;
            contrast: number;
            grade: "good" | "poor" | "usable";
        };
        facesA: number;
        facesB: number;
        selectedFaceA?: {
            bbox: [number, number, number, number];
            detScore: number;
            areaRatio: number;
        } | undefined;
        selectedFaceB?: {
            bbox: [number, number, number, number];
            detScore: number;
            areaRatio: number;
        } | undefined;
        faceSimilarity?: number | undefined;
        ssim: number;
        colorHistogramCorrelation: number;
        canExtractEmbedding: boolean;
        reliabilityIssues: string[];
    }>;
    visionComparison: z.ZodOptional<z.ZodObject<{
        imageAType: z.ZodEnum<["realistic", "stylized"]>;
        imageBType: z.ZodEnum<["realistic", "stylized"]>;
        analysisPath: z.ZodEnum<["A", "B"]>;
        status: z.ZodEnum<["success", "unable_to_determine"]>;
        riskLevel: z.ZodEnum<["high", "medium", "low_to_medium", "low", "unable_to_determine"]>;
        overallSimilarity: z.ZodNumber;
        featureComparison: z.ZodObject<{
            face_shape: z.ZodObject<{
                similarity: z.ZodEnum<["high", "medium", "low", "none"]>;
                note: z.ZodString;
            }, "strict", z.ZodTypeAny, {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            }, {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            }>;
            facial_layout: z.ZodObject<{
                similarity: z.ZodEnum<["high", "medium", "low", "none"]>;
                note: z.ZodString;
            }, "strict", z.ZodTypeAny, {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            }, {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            }>;
            eyes_brows: z.ZodObject<{
                similarity: z.ZodEnum<["high", "medium", "low", "none"]>;
                note: z.ZodString;
            }, "strict", z.ZodTypeAny, {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            }, {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            }>;
            nose_mouth: z.ZodObject<{
                similarity: z.ZodEnum<["high", "medium", "low", "none"]>;
                note: z.ZodString;
            }, "strict", z.ZodTypeAny, {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            }, {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            }>;
            hair_hairline: z.ZodObject<{
                similarity: z.ZodEnum<["high", "medium", "low", "none"]>;
                note: z.ZodString;
            }, "strict", z.ZodTypeAny, {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            }, {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            }>;
            distinctive_features: z.ZodObject<{
                similarity: z.ZodEnum<["high", "medium", "low", "none"]>;
                note: z.ZodString;
            }, "strict", z.ZodTypeAny, {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            }, {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            }>;
        }, "strict", z.ZodTypeAny, {
            face_shape: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            facial_layout: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            eyes_brows: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            nose_mouth: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            hair_hairline: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            distinctive_features: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
        }, {
            face_shape: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            facial_layout: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            eyes_brows: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            nose_mouth: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            hair_hairline: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            distinctive_features: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
        }>;
        basis: z.ZodArray<z.ZodString, "many">;
        limitations: z.ZodArray<z.ZodString, "many">;
        modificationSuggestions: z.ZodArray<z.ZodString, "many">;
        insightfaceFusionNote: z.ZodString;
        manualReviewRecommended: z.ZodBoolean;
    }, "strict", z.ZodTypeAny, {
        imageAType: "realistic" | "stylized";
        imageBType: "realistic" | "stylized";
        analysisPath: "A" | "B";
        status: "success" | "unable_to_determine";
        riskLevel: "high" | "low" | "low_to_medium" | "medium" | "unable_to_determine";
        overallSimilarity: number;
        featureComparison: {
            face_shape: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            facial_layout: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            eyes_brows: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            nose_mouth: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            hair_hairline: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            distinctive_features: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
        };
        basis: string[];
        limitations: string[];
        modificationSuggestions: string[];
        insightfaceFusionNote: string;
        manualReviewRecommended: boolean;
    }, {
        imageAType: "realistic" | "stylized";
        imageBType: "realistic" | "stylized";
        analysisPath: "A" | "B";
        status: "success" | "unable_to_determine";
        riskLevel: "high" | "low" | "low_to_medium" | "medium" | "unable_to_determine";
        overallSimilarity: number;
        featureComparison: {
            face_shape: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            facial_layout: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            eyes_brows: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            nose_mouth: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            hair_hairline: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            distinctive_features: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
        };
        basis: string[];
        limitations: string[];
        modificationSuggestions: string[];
        insightfaceFusionNote: string;
        manualReviewRecommended: boolean;
    }>>;
    basis: z.ZodArray<z.ZodString, "many">;
    limitations: z.ZodArray<z.ZodString, "many">;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodString;
        message: z.ZodString;
        retryable: z.ZodBoolean;
    }, "strict", z.ZodTypeAny, {
        code: string;
        message: string;
        retryable: boolean;
    }, {
        code: string;
        message: string;
        retryable: boolean;
    }>>;
}, "strict", z.ZodTypeAny, {
    id: string;
    queryImageId: string;
    comparisonImageId: string;
    candidateId?: string | undefined;
    source: "baidu" | "connected-candidate" | "connected-reference";
    status: "failed" | "partial" | "success";
    riskLevel: "high" | "low" | "low_to_medium" | "medium" | "unable_to_determine";
    overallSimilarity?: number | undefined;
    analysisPath: "A" | "B" | "unable";
    localPrecheck: {
        qualityA: {
            width: number;
            height: number;
            sharpness: number;
            brightness: number;
            contrast: number;
            grade: "good" | "poor" | "usable";
        };
        qualityB: {
            width: number;
            height: number;
            sharpness: number;
            brightness: number;
            contrast: number;
            grade: "good" | "poor" | "usable";
        };
        facesA: number;
        facesB: number;
        selectedFaceA?: {
            bbox: [number, number, number, number];
            detScore: number;
            areaRatio: number;
        } | undefined;
        selectedFaceB?: {
            bbox: [number, number, number, number];
            detScore: number;
            areaRatio: number;
        } | undefined;
        faceSimilarity?: number | undefined;
        ssim: number;
        colorHistogramCorrelation: number;
        canExtractEmbedding: boolean;
        reliabilityIssues: string[];
    };
    visionComparison?: {
        imageAType: "realistic" | "stylized";
        imageBType: "realistic" | "stylized";
        analysisPath: "A" | "B";
        status: "success" | "unable_to_determine";
        riskLevel: "high" | "low" | "low_to_medium" | "medium" | "unable_to_determine";
        overallSimilarity: number;
        featureComparison: {
            face_shape: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            facial_layout: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            eyes_brows: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            nose_mouth: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            hair_hairline: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            distinctive_features: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
        };
        basis: string[];
        limitations: string[];
        modificationSuggestions: string[];
        insightfaceFusionNote: string;
        manualReviewRecommended: boolean;
    } | undefined;
    basis: string[];
    limitations: string[];
    error?: {
        code: string;
        message: string;
        retryable: boolean;
    } | undefined;
}, {
    id: string;
    queryImageId: string;
    comparisonImageId: string;
    candidateId?: string | undefined;
    source: "baidu" | "connected-candidate" | "connected-reference";
    status: "failed" | "partial" | "success";
    riskLevel: "high" | "low" | "low_to_medium" | "medium" | "unable_to_determine";
    overallSimilarity?: number | undefined;
    analysisPath: "A" | "B" | "unable";
    localPrecheck: {
        qualityA: {
            width: number;
            height: number;
            sharpness: number;
            brightness: number;
            contrast: number;
            grade: "good" | "poor" | "usable";
        };
        qualityB: {
            width: number;
            height: number;
            sharpness: number;
            brightness: number;
            contrast: number;
            grade: "good" | "poor" | "usable";
        };
        facesA: number;
        facesB: number;
        selectedFaceA?: {
            bbox: [number, number, number, number];
            detScore: number;
            areaRatio: number;
        } | undefined;
        selectedFaceB?: {
            bbox: [number, number, number, number];
            detScore: number;
            areaRatio: number;
        } | undefined;
        faceSimilarity?: number | undefined;
        ssim: number;
        colorHistogramCorrelation: number;
        canExtractEmbedding: boolean;
        reliabilityIssues: string[];
    };
    visionComparison?: {
        imageAType: "realistic" | "stylized";
        imageBType: "realistic" | "stylized";
        analysisPath: "A" | "B";
        status: "success" | "unable_to_determine";
        riskLevel: "high" | "low" | "low_to_medium" | "medium" | "unable_to_determine";
        overallSimilarity: number;
        featureComparison: {
            face_shape: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            facial_layout: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            eyes_brows: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            nose_mouth: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            hair_hairline: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            distinctive_features: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
        };
        basis: string[];
        limitations: string[];
        modificationSuggestions: string[];
        insightfaceFusionNote: string;
        manualReviewRecommended: boolean;
    } | undefined;
    basis: string[];
    limitations: string[];
    error?: {
        code: string;
        message: string;
        retryable: boolean;
    } | undefined;
}>;
export type PortraitPairResult = z.infer<typeof portraitPairResultSchema>;
export declare const portraitCandidateSchema: z.ZodObject<{
    id: z.ZodString;
    originalRank: z.ZodNumber;
    title: z.ZodString;
    imageArtifactId: z.ZodString;
    imageUrl: z.ZodOptional<z.ZodString>;
    sourcePageUrl: z.ZodOptional<z.ZodString>;
    sourceDomain: z.ZodOptional<z.ZodString>;
    source: z.ZodEnum<["connected", "baidu"]>;
    byteSize: z.ZodNumber;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
    dedupGroupId: z.ZodOptional<z.ZodString>;
    resultId: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    id: string;
    originalRank: number;
    title: string;
    imageArtifactId: string;
    imageUrl?: string | undefined;
    sourcePageUrl?: string | undefined;
    sourceDomain?: string | undefined;
    source: "baidu" | "connected";
    byteSize: number;
    width?: number | undefined;
    height?: number | undefined;
    dedupGroupId?: string | undefined;
    resultId?: string | undefined;
}, {
    id: string;
    originalRank: number;
    title: string;
    imageArtifactId: string;
    imageUrl?: string | undefined;
    sourcePageUrl?: string | undefined;
    sourceDomain?: string | undefined;
    source: "baidu" | "connected";
    byteSize: number;
    width?: number | undefined;
    height?: number | undefined;
    dedupGroupId?: string | undefined;
    resultId?: string | undefined;
}>;
export type PortraitCandidate = z.infer<typeof portraitCandidateSchema>;
export declare const portraitClearanceResultSchema: z.ZodObject<{
    schemaVersion: z.ZodLiteral<1>;
    taskId: z.ZodString;
    mode: z.ZodEnum<["direct-compare", "network-search"]>;
    queryImageId: z.ZodString;
    highestRisk: z.ZodEnum<["high", "medium", "low_to_medium", "low", "unable_to_determine"]>;
    riskCounts: z.ZodRecord<z.ZodEnum<["high", "medium", "low_to_medium", "low", "unable_to_determine"]>, z.ZodNumber>;
    candidateCount: z.ZodNumber;
    comparedCount: z.ZodNumber;
    candidates: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        originalRank: z.ZodNumber;
        title: z.ZodString;
        imageArtifactId: z.ZodString;
        imageUrl: z.ZodOptional<z.ZodString>;
        sourcePageUrl: z.ZodOptional<z.ZodString>;
        sourceDomain: z.ZodOptional<z.ZodString>;
        source: z.ZodEnum<["connected", "baidu"]>;
        byteSize: z.ZodNumber;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
        dedupGroupId: z.ZodOptional<z.ZodString>;
        resultId: z.ZodOptional<z.ZodString>;
    }, "strict", z.ZodTypeAny, {
        id: string;
        originalRank: number;
        title: string;
        imageArtifactId: string;
        imageUrl?: string | undefined;
        sourcePageUrl?: string | undefined;
        sourceDomain?: string | undefined;
        source: "baidu" | "connected";
        byteSize: number;
        width?: number | undefined;
        height?: number | undefined;
        dedupGroupId?: string | undefined;
        resultId?: string | undefined;
    }, {
        id: string;
        originalRank: number;
        title: string;
        imageArtifactId: string;
        imageUrl?: string | undefined;
        sourcePageUrl?: string | undefined;
        sourceDomain?: string | undefined;
        source: "baidu" | "connected";
        byteSize: number;
        width?: number | undefined;
        height?: number | undefined;
        dedupGroupId?: string | undefined;
        resultId?: string | undefined;
    }>, "many">;
    pairs: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        queryImageId: z.ZodString;
        comparisonImageId: z.ZodString;
        candidateId: z.ZodOptional<z.ZodString>;
        source: z.ZodEnum<["connected-reference", "connected-candidate", "baidu"]>;
        status: z.ZodEnum<["success", "partial", "failed"]>;
        riskLevel: z.ZodEnum<["high", "medium", "low_to_medium", "low", "unable_to_determine"]>;
        overallSimilarity: z.ZodOptional<z.ZodNumber>;
        analysisPath: z.ZodEnum<["A", "B", "unable"]>;
        localPrecheck: z.ZodObject<{
            qualityA: z.ZodObject<{
                width: z.ZodNumber;
                height: z.ZodNumber;
                sharpness: z.ZodNumber;
                brightness: z.ZodNumber;
                contrast: z.ZodNumber;
                grade: z.ZodEnum<["good", "usable", "poor"]>;
            }, "strict", z.ZodTypeAny, {
                width: number;
                height: number;
                sharpness: number;
                brightness: number;
                contrast: number;
                grade: "good" | "poor" | "usable";
            }, {
                width: number;
                height: number;
                sharpness: number;
                brightness: number;
                contrast: number;
                grade: "good" | "poor" | "usable";
            }>;
            qualityB: z.ZodObject<{
                width: z.ZodNumber;
                height: z.ZodNumber;
                sharpness: z.ZodNumber;
                brightness: z.ZodNumber;
                contrast: z.ZodNumber;
                grade: z.ZodEnum<["good", "usable", "poor"]>;
            }, "strict", z.ZodTypeAny, {
                width: number;
                height: number;
                sharpness: number;
                brightness: number;
                contrast: number;
                grade: "good" | "poor" | "usable";
            }, {
                width: number;
                height: number;
                sharpness: number;
                brightness: number;
                contrast: number;
                grade: "good" | "poor" | "usable";
            }>;
            facesA: z.ZodNumber;
            facesB: z.ZodNumber;
            selectedFaceA: z.ZodOptional<z.ZodObject<{
                bbox: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
                detScore: z.ZodNumber;
                areaRatio: z.ZodNumber;
            }, "strict", z.ZodTypeAny, {
                bbox: [number, number, number, number];
                detScore: number;
                areaRatio: number;
            }, {
                bbox: [number, number, number, number];
                detScore: number;
                areaRatio: number;
            }>>;
            selectedFaceB: z.ZodOptional<z.ZodObject<{
                bbox: z.ZodTuple<[z.ZodNumber, z.ZodNumber, z.ZodNumber, z.ZodNumber], null>;
                detScore: z.ZodNumber;
                areaRatio: z.ZodNumber;
            }, "strict", z.ZodTypeAny, {
                bbox: [number, number, number, number];
                detScore: number;
                areaRatio: number;
            }, {
                bbox: [number, number, number, number];
                detScore: number;
                areaRatio: number;
            }>>;
            faceSimilarity: z.ZodOptional<z.ZodNumber>;
            ssim: z.ZodNumber;
            colorHistogramCorrelation: z.ZodNumber;
            canExtractEmbedding: z.ZodBoolean;
            reliabilityIssues: z.ZodArray<z.ZodString, "many">;
        }, "strict", z.ZodTypeAny, {
            qualityA: {
                width: number;
                height: number;
                sharpness: number;
                brightness: number;
                contrast: number;
                grade: "good" | "poor" | "usable";
            };
            qualityB: {
                width: number;
                height: number;
                sharpness: number;
                brightness: number;
                contrast: number;
                grade: "good" | "poor" | "usable";
            };
            facesA: number;
            facesB: number;
            selectedFaceA?: {
                bbox: [number, number, number, number];
                detScore: number;
                areaRatio: number;
            } | undefined;
            selectedFaceB?: {
                bbox: [number, number, number, number];
                detScore: number;
                areaRatio: number;
            } | undefined;
            faceSimilarity?: number | undefined;
            ssim: number;
            colorHistogramCorrelation: number;
            canExtractEmbedding: boolean;
            reliabilityIssues: string[];
        }, {
            qualityA: {
                width: number;
                height: number;
                sharpness: number;
                brightness: number;
                contrast: number;
                grade: "good" | "poor" | "usable";
            };
            qualityB: {
                width: number;
                height: number;
                sharpness: number;
                brightness: number;
                contrast: number;
                grade: "good" | "poor" | "usable";
            };
            facesA: number;
            facesB: number;
            selectedFaceA?: {
                bbox: [number, number, number, number];
                detScore: number;
                areaRatio: number;
            } | undefined;
            selectedFaceB?: {
                bbox: [number, number, number, number];
                detScore: number;
                areaRatio: number;
            } | undefined;
            faceSimilarity?: number | undefined;
            ssim: number;
            colorHistogramCorrelation: number;
            canExtractEmbedding: boolean;
            reliabilityIssues: string[];
        }>;
        visionComparison: z.ZodOptional<z.ZodObject<{
            imageAType: z.ZodEnum<["realistic", "stylized"]>;
            imageBType: z.ZodEnum<["realistic", "stylized"]>;
            analysisPath: z.ZodEnum<["A", "B"]>;
            status: z.ZodEnum<["success", "unable_to_determine"]>;
            riskLevel: z.ZodEnum<["high", "medium", "low_to_medium", "low", "unable_to_determine"]>;
            overallSimilarity: z.ZodNumber;
            featureComparison: z.ZodObject<{
                face_shape: z.ZodObject<{
                    similarity: z.ZodEnum<["high", "medium", "low", "none"]>;
                    note: z.ZodString;
                }, "strict", z.ZodTypeAny, {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                }, {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                }>;
                facial_layout: z.ZodObject<{
                    similarity: z.ZodEnum<["high", "medium", "low", "none"]>;
                    note: z.ZodString;
                }, "strict", z.ZodTypeAny, {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                }, {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                }>;
                eyes_brows: z.ZodObject<{
                    similarity: z.ZodEnum<["high", "medium", "low", "none"]>;
                    note: z.ZodString;
                }, "strict", z.ZodTypeAny, {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                }, {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                }>;
                nose_mouth: z.ZodObject<{
                    similarity: z.ZodEnum<["high", "medium", "low", "none"]>;
                    note: z.ZodString;
                }, "strict", z.ZodTypeAny, {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                }, {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                }>;
                hair_hairline: z.ZodObject<{
                    similarity: z.ZodEnum<["high", "medium", "low", "none"]>;
                    note: z.ZodString;
                }, "strict", z.ZodTypeAny, {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                }, {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                }>;
                distinctive_features: z.ZodObject<{
                    similarity: z.ZodEnum<["high", "medium", "low", "none"]>;
                    note: z.ZodString;
                }, "strict", z.ZodTypeAny, {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                }, {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                }>;
            }, "strict", z.ZodTypeAny, {
                face_shape: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                facial_layout: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                eyes_brows: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                nose_mouth: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                hair_hairline: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                distinctive_features: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
            }, {
                face_shape: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                facial_layout: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                eyes_brows: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                nose_mouth: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                hair_hairline: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                distinctive_features: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
            }>;
            basis: z.ZodArray<z.ZodString, "many">;
            limitations: z.ZodArray<z.ZodString, "many">;
            modificationSuggestions: z.ZodArray<z.ZodString, "many">;
            insightfaceFusionNote: z.ZodString;
            manualReviewRecommended: z.ZodBoolean;
        }, "strict", z.ZodTypeAny, {
            imageAType: "realistic" | "stylized";
            imageBType: "realistic" | "stylized";
            analysisPath: "A" | "B";
            status: "success" | "unable_to_determine";
            riskLevel: "high" | "low" | "low_to_medium" | "medium" | "unable_to_determine";
            overallSimilarity: number;
            featureComparison: {
                face_shape: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                facial_layout: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                eyes_brows: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                nose_mouth: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                hair_hairline: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                distinctive_features: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
            };
            basis: string[];
            limitations: string[];
            modificationSuggestions: string[];
            insightfaceFusionNote: string;
            manualReviewRecommended: boolean;
        }, {
            imageAType: "realistic" | "stylized";
            imageBType: "realistic" | "stylized";
            analysisPath: "A" | "B";
            status: "success" | "unable_to_determine";
            riskLevel: "high" | "low" | "low_to_medium" | "medium" | "unable_to_determine";
            overallSimilarity: number;
            featureComparison: {
                face_shape: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                facial_layout: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                eyes_brows: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                nose_mouth: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                hair_hairline: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                distinctive_features: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
            };
            basis: string[];
            limitations: string[];
            modificationSuggestions: string[];
            insightfaceFusionNote: string;
            manualReviewRecommended: boolean;
        }>>;
        basis: z.ZodArray<z.ZodString, "many">;
        limitations: z.ZodArray<z.ZodString, "many">;
        error: z.ZodOptional<z.ZodObject<{
            code: z.ZodString;
            message: z.ZodString;
            retryable: z.ZodBoolean;
        }, "strict", z.ZodTypeAny, {
            code: string;
            message: string;
            retryable: boolean;
        }, {
            code: string;
            message: string;
            retryable: boolean;
        }>>;
    }, "strict", z.ZodTypeAny, {
        id: string;
        queryImageId: string;
        comparisonImageId: string;
        candidateId?: string | undefined;
        source: "baidu" | "connected-candidate" | "connected-reference";
        status: "failed" | "partial" | "success";
        riskLevel: "high" | "low" | "low_to_medium" | "medium" | "unable_to_determine";
        overallSimilarity?: number | undefined;
        analysisPath: "A" | "B" | "unable";
        localPrecheck: {
            qualityA: {
                width: number;
                height: number;
                sharpness: number;
                brightness: number;
                contrast: number;
                grade: "good" | "poor" | "usable";
            };
            qualityB: {
                width: number;
                height: number;
                sharpness: number;
                brightness: number;
                contrast: number;
                grade: "good" | "poor" | "usable";
            };
            facesA: number;
            facesB: number;
            selectedFaceA?: {
                bbox: [number, number, number, number];
                detScore: number;
                areaRatio: number;
            } | undefined;
            selectedFaceB?: {
                bbox: [number, number, number, number];
                detScore: number;
                areaRatio: number;
            } | undefined;
            faceSimilarity?: number | undefined;
            ssim: number;
            colorHistogramCorrelation: number;
            canExtractEmbedding: boolean;
            reliabilityIssues: string[];
        };
        visionComparison?: {
            imageAType: "realistic" | "stylized";
            imageBType: "realistic" | "stylized";
            analysisPath: "A" | "B";
            status: "success" | "unable_to_determine";
            riskLevel: "high" | "low" | "low_to_medium" | "medium" | "unable_to_determine";
            overallSimilarity: number;
            featureComparison: {
                face_shape: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                facial_layout: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                eyes_brows: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                nose_mouth: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                hair_hairline: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                distinctive_features: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
            };
            basis: string[];
            limitations: string[];
            modificationSuggestions: string[];
            insightfaceFusionNote: string;
            manualReviewRecommended: boolean;
        } | undefined;
        basis: string[];
        limitations: string[];
        error?: {
            code: string;
            message: string;
            retryable: boolean;
        } | undefined;
    }, {
        id: string;
        queryImageId: string;
        comparisonImageId: string;
        candidateId?: string | undefined;
        source: "baidu" | "connected-candidate" | "connected-reference";
        status: "failed" | "partial" | "success";
        riskLevel: "high" | "low" | "low_to_medium" | "medium" | "unable_to_determine";
        overallSimilarity?: number | undefined;
        analysisPath: "A" | "B" | "unable";
        localPrecheck: {
            qualityA: {
                width: number;
                height: number;
                sharpness: number;
                brightness: number;
                contrast: number;
                grade: "good" | "poor" | "usable";
            };
            qualityB: {
                width: number;
                height: number;
                sharpness: number;
                brightness: number;
                contrast: number;
                grade: "good" | "poor" | "usable";
            };
            facesA: number;
            facesB: number;
            selectedFaceA?: {
                bbox: [number, number, number, number];
                detScore: number;
                areaRatio: number;
            } | undefined;
            selectedFaceB?: {
                bbox: [number, number, number, number];
                detScore: number;
                areaRatio: number;
            } | undefined;
            faceSimilarity?: number | undefined;
            ssim: number;
            colorHistogramCorrelation: number;
            canExtractEmbedding: boolean;
            reliabilityIssues: string[];
        };
        visionComparison?: {
            imageAType: "realistic" | "stylized";
            imageBType: "realistic" | "stylized";
            analysisPath: "A" | "B";
            status: "success" | "unable_to_determine";
            riskLevel: "high" | "low" | "low_to_medium" | "medium" | "unable_to_determine";
            overallSimilarity: number;
            featureComparison: {
                face_shape: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                facial_layout: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                eyes_brows: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                nose_mouth: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                hair_hairline: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                distinctive_features: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
            };
            basis: string[];
            limitations: string[];
            modificationSuggestions: string[];
            insightfaceFusionNote: string;
            manualReviewRecommended: boolean;
        } | undefined;
        basis: string[];
        limitations: string[];
        error?: {
            code: string;
            message: string;
            retryable: boolean;
        } | undefined;
    }>, "many">;
    limitations: z.ZodArray<z.ZodString, "many">;
    createdAt: z.ZodString;
    completedAt: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    schemaVersion: 1;
    taskId: string;
    mode: "direct-compare" | "network-search";
    queryImageId: string;
    highestRisk: "high" | "low" | "low_to_medium" | "medium" | "unable_to_determine";
    riskCounts: Partial<Record<"high" | "low" | "low_to_medium" | "medium" | "unable_to_determine", number>>;
    candidateCount: number;
    comparedCount: number;
    candidates: {
        id: string;
        originalRank: number;
        title: string;
        imageArtifactId: string;
        imageUrl?: string | undefined;
        sourcePageUrl?: string | undefined;
        sourceDomain?: string | undefined;
        source: "baidu" | "connected";
        byteSize: number;
        width?: number | undefined;
        height?: number | undefined;
        dedupGroupId?: string | undefined;
        resultId?: string | undefined;
    }[];
    pairs: {
        id: string;
        queryImageId: string;
        comparisonImageId: string;
        candidateId?: string | undefined;
        source: "baidu" | "connected-candidate" | "connected-reference";
        status: "failed" | "partial" | "success";
        riskLevel: "high" | "low" | "low_to_medium" | "medium" | "unable_to_determine";
        overallSimilarity?: number | undefined;
        analysisPath: "A" | "B" | "unable";
        localPrecheck: {
            qualityA: {
                width: number;
                height: number;
                sharpness: number;
                brightness: number;
                contrast: number;
                grade: "good" | "poor" | "usable";
            };
            qualityB: {
                width: number;
                height: number;
                sharpness: number;
                brightness: number;
                contrast: number;
                grade: "good" | "poor" | "usable";
            };
            facesA: number;
            facesB: number;
            selectedFaceA?: {
                bbox: [number, number, number, number];
                detScore: number;
                areaRatio: number;
            } | undefined;
            selectedFaceB?: {
                bbox: [number, number, number, number];
                detScore: number;
                areaRatio: number;
            } | undefined;
            faceSimilarity?: number | undefined;
            ssim: number;
            colorHistogramCorrelation: number;
            canExtractEmbedding: boolean;
            reliabilityIssues: string[];
        };
        visionComparison?: {
            imageAType: "realistic" | "stylized";
            imageBType: "realistic" | "stylized";
            analysisPath: "A" | "B";
            status: "success" | "unable_to_determine";
            riskLevel: "high" | "low" | "low_to_medium" | "medium" | "unable_to_determine";
            overallSimilarity: number;
            featureComparison: {
                face_shape: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                facial_layout: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                eyes_brows: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                nose_mouth: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                hair_hairline: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                distinctive_features: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
            };
            basis: string[];
            limitations: string[];
            modificationSuggestions: string[];
            insightfaceFusionNote: string;
            manualReviewRecommended: boolean;
        } | undefined;
        basis: string[];
        limitations: string[];
        error?: {
            code: string;
            message: string;
            retryable: boolean;
        } | undefined;
    }[];
    limitations: string[];
    createdAt: string;
    completedAt?: string | undefined;
}, {
    schemaVersion: 1;
    taskId: string;
    mode: "direct-compare" | "network-search";
    queryImageId: string;
    highestRisk: "high" | "low" | "low_to_medium" | "medium" | "unable_to_determine";
    riskCounts: Partial<Record<"high" | "low" | "low_to_medium" | "medium" | "unable_to_determine", number>>;
    candidateCount: number;
    comparedCount: number;
    candidates: {
        id: string;
        originalRank: number;
        title: string;
        imageArtifactId: string;
        imageUrl?: string | undefined;
        sourcePageUrl?: string | undefined;
        sourceDomain?: string | undefined;
        source: "baidu" | "connected";
        byteSize: number;
        width?: number | undefined;
        height?: number | undefined;
        dedupGroupId?: string | undefined;
        resultId?: string | undefined;
    }[];
    pairs: {
        id: string;
        queryImageId: string;
        comparisonImageId: string;
        candidateId?: string | undefined;
        source: "baidu" | "connected-candidate" | "connected-reference";
        status: "failed" | "partial" | "success";
        riskLevel: "high" | "low" | "low_to_medium" | "medium" | "unable_to_determine";
        overallSimilarity?: number | undefined;
        analysisPath: "A" | "B" | "unable";
        localPrecheck: {
            qualityA: {
                width: number;
                height: number;
                sharpness: number;
                brightness: number;
                contrast: number;
                grade: "good" | "poor" | "usable";
            };
            qualityB: {
                width: number;
                height: number;
                sharpness: number;
                brightness: number;
                contrast: number;
                grade: "good" | "poor" | "usable";
            };
            facesA: number;
            facesB: number;
            selectedFaceA?: {
                bbox: [number, number, number, number];
                detScore: number;
                areaRatio: number;
            } | undefined;
            selectedFaceB?: {
                bbox: [number, number, number, number];
                detScore: number;
                areaRatio: number;
            } | undefined;
            faceSimilarity?: number | undefined;
            ssim: number;
            colorHistogramCorrelation: number;
            canExtractEmbedding: boolean;
            reliabilityIssues: string[];
        };
        visionComparison?: {
            imageAType: "realistic" | "stylized";
            imageBType: "realistic" | "stylized";
            analysisPath: "A" | "B";
            status: "success" | "unable_to_determine";
            riskLevel: "high" | "low" | "low_to_medium" | "medium" | "unable_to_determine";
            overallSimilarity: number;
            featureComparison: {
                face_shape: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                facial_layout: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                eyes_brows: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                nose_mouth: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                hair_hairline: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
                distinctive_features: {
                    similarity: "high" | "low" | "medium" | "none";
                    note: string;
                };
            };
            basis: string[];
            limitations: string[];
            modificationSuggestions: string[];
            insightfaceFusionNote: string;
            manualReviewRecommended: boolean;
        } | undefined;
        basis: string[];
        limitations: string[];
        error?: {
            code: string;
            message: string;
            retryable: boolean;
        } | undefined;
    }[];
    limitations: string[];
    createdAt: string;
    completedAt?: string | undefined;
}>;
export type PortraitClearanceResult = z.infer<typeof portraitClearanceResultSchema>;
export declare const portraitModelJobStatusSchema: z.ZodEnum<["pending", "leased", "completed", "failed"]>;
export type PortraitModelJobStatus = z.infer<typeof portraitModelJobStatusSchema>;
export declare const portraitModelJobSchema: z.ZodObject<{
    jobId: z.ZodString;
    taskId: z.ZodString;
    pairId: z.ZodString;
    queryImageId: z.ZodString;
    comparisonImageId: z.ZodString;
    status: z.ZodEnum<["pending", "leased", "completed", "failed"]>;
    attempt: z.ZodNumber;
    leaseToken: z.ZodOptional<z.ZodString>;
    leaseExpiresAt: z.ZodOptional<z.ZodString>;
    errorCode: z.ZodOptional<z.ZodString>;
    errorMessage: z.ZodOptional<z.ZodString>;
}, "strict", z.ZodTypeAny, {
    jobId: string;
    taskId: string;
    pairId: string;
    queryImageId: string;
    comparisonImageId: string;
    status: "completed" | "failed" | "leased" | "pending";
    attempt: number;
    leaseToken?: string | undefined;
    leaseExpiresAt?: string | undefined;
    errorCode?: string | undefined;
    errorMessage?: string | undefined;
}, {
    jobId: string;
    taskId: string;
    pairId: string;
    queryImageId: string;
    comparisonImageId: string;
    status: "completed" | "failed" | "leased" | "pending";
    attempt: number;
    leaseToken?: string | undefined;
    leaseExpiresAt?: string | undefined;
    errorCode?: string | undefined;
    errorMessage?: string | undefined;
}>;
export type PortraitModelJob = z.infer<typeof portraitModelJobSchema>;
export declare const portraitModelJobCompleteRequestSchema: z.ZodObject<{
    attempt: z.ZodNumber;
    leaseToken: z.ZodString;
    visionComparison: z.ZodObject<{
        imageAType: z.ZodEnum<["realistic", "stylized"]>;
        imageBType: z.ZodEnum<["realistic", "stylized"]>;
        analysisPath: z.ZodEnum<["A", "B"]>;
        status: z.ZodEnum<["success", "unable_to_determine"]>;
        riskLevel: z.ZodEnum<["high", "medium", "low_to_medium", "low", "unable_to_determine"]>;
        overallSimilarity: z.ZodNumber;
        featureComparison: z.ZodObject<{
            face_shape: z.ZodObject<{
                similarity: z.ZodEnum<["high", "medium", "low", "none"]>;
                note: z.ZodString;
            }, "strict", z.ZodTypeAny, {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            }, {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            }>;
            facial_layout: z.ZodObject<{
                similarity: z.ZodEnum<["high", "medium", "low", "none"]>;
                note: z.ZodString;
            }, "strict", z.ZodTypeAny, {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            }, {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            }>;
            eyes_brows: z.ZodObject<{
                similarity: z.ZodEnum<["high", "medium", "low", "none"]>;
                note: z.ZodString;
            }, "strict", z.ZodTypeAny, {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            }, {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            }>;
            nose_mouth: z.ZodObject<{
                similarity: z.ZodEnum<["high", "medium", "low", "none"]>;
                note: z.ZodString;
            }, "strict", z.ZodTypeAny, {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            }, {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            }>;
            hair_hairline: z.ZodObject<{
                similarity: z.ZodEnum<["high", "medium", "low", "none"]>;
                note: z.ZodString;
            }, "strict", z.ZodTypeAny, {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            }, {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            }>;
            distinctive_features: z.ZodObject<{
                similarity: z.ZodEnum<["high", "medium", "low", "none"]>;
                note: z.ZodString;
            }, "strict", z.ZodTypeAny, {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            }, {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            }>;
        }, "strict", z.ZodTypeAny, {
            face_shape: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            facial_layout: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            eyes_brows: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            nose_mouth: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            hair_hairline: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            distinctive_features: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
        }, {
            face_shape: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            facial_layout: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            eyes_brows: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            nose_mouth: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            hair_hairline: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            distinctive_features: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
        }>;
        basis: z.ZodArray<z.ZodString, "many">;
        limitations: z.ZodArray<z.ZodString, "many">;
        modificationSuggestions: z.ZodArray<z.ZodString, "many">;
        insightfaceFusionNote: z.ZodString;
        manualReviewRecommended: z.ZodBoolean;
    }, "strict", z.ZodTypeAny, {
        imageAType: "realistic" | "stylized";
        imageBType: "realistic" | "stylized";
        analysisPath: "A" | "B";
        status: "success" | "unable_to_determine";
        riskLevel: "high" | "low" | "low_to_medium" | "medium" | "unable_to_determine";
        overallSimilarity: number;
        featureComparison: {
            face_shape: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            facial_layout: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            eyes_brows: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            nose_mouth: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            hair_hairline: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            distinctive_features: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
        };
        basis: string[];
        limitations: string[];
        modificationSuggestions: string[];
        insightfaceFusionNote: string;
        manualReviewRecommended: boolean;
    }, {
        imageAType: "realistic" | "stylized";
        imageBType: "realistic" | "stylized";
        analysisPath: "A" | "B";
        status: "success" | "unable_to_determine";
        riskLevel: "high" | "low" | "low_to_medium" | "medium" | "unable_to_determine";
        overallSimilarity: number;
        featureComparison: {
            face_shape: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            facial_layout: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            eyes_brows: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            nose_mouth: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            hair_hairline: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            distinctive_features: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
        };
        basis: string[];
        limitations: string[];
        modificationSuggestions: string[];
        insightfaceFusionNote: string;
        manualReviewRecommended: boolean;
    }>;
}, "strict", z.ZodTypeAny, {
    attempt: number;
    leaseToken: string;
    visionComparison: {
        imageAType: "realistic" | "stylized";
        imageBType: "realistic" | "stylized";
        analysisPath: "A" | "B";
        status: "success" | "unable_to_determine";
        riskLevel: "high" | "low" | "low_to_medium" | "medium" | "unable_to_determine";
        overallSimilarity: number;
        featureComparison: {
            face_shape: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            facial_layout: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            eyes_brows: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            nose_mouth: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            hair_hairline: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            distinctive_features: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
        };
        basis: string[];
        limitations: string[];
        modificationSuggestions: string[];
        insightfaceFusionNote: string;
        manualReviewRecommended: boolean;
    };
}, {
    attempt: number;
    leaseToken: string;
    visionComparison: {
        imageAType: "realistic" | "stylized";
        imageBType: "realistic" | "stylized";
        analysisPath: "A" | "B";
        status: "success" | "unable_to_determine";
        riskLevel: "high" | "low" | "low_to_medium" | "medium" | "unable_to_determine";
        overallSimilarity: number;
        featureComparison: {
            face_shape: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            facial_layout: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            eyes_brows: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            nose_mouth: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            hair_hairline: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
            distinctive_features: {
                similarity: "high" | "low" | "medium" | "none";
                note: string;
            };
        };
        basis: string[];
        limitations: string[];
        modificationSuggestions: string[];
        insightfaceFusionNote: string;
        manualReviewRecommended: boolean;
    };
}>;
export type PortraitModelJobCompleteRequest = z.infer<typeof portraitModelJobCompleteRequestSchema>;
export declare const portraitModelJobFailRequestSchema: z.ZodObject<{
    attempt: z.ZodNumber;
    leaseToken: z.ZodString;
    errorCode: z.ZodString;
    errorMessage: z.ZodString;
    retryable: z.ZodBoolean;
}, "strict", z.ZodTypeAny, {
    attempt: number;
    leaseToken: string;
    errorCode: string;
    errorMessage: string;
    retryable: boolean;
}, {
    attempt: number;
    leaseToken: string;
    errorCode: string;
    errorMessage: string;
    retryable: boolean;
}>;
export type PortraitModelJobFailRequest = z.infer<typeof portraitModelJobFailRequestSchema>;
export declare const portraitTaskSummarySchema: z.ZodObject<{
    taskId: z.ZodString;
    clientOperationId: z.ZodString;
    ownerScopeHash: z.ZodString;
    projectId: z.ZodString;
    nodeId: z.ZodString;
    mode: z.ZodEnum<["direct-compare", "network-search"]>;
    analysisMode: z.ZodEnum<["local-plus-vision", "local-only"]>;
    modelRef: z.ZodOptional<z.ZodString>;
    status: z.ZodEnum<["queued", "running", "waiting_model", "partial", "completed", "failed", "cancelled"]>;
    stage: z.ZodEnum<["validating-inputs", "checking-model-resources", "preparing-query", "searching", "downloading-candidates", "deduplicating", "local-comparing", "waiting-for-model", "model-comparing", "building-report", "done"]>;
    progress: z.ZodNumber;
    processedCandidates: z.ZodNumber;
    totalCandidates: z.ZodOptional<z.ZodNumber>;
    errorCode: z.ZodOptional<z.ZodString>;
    errorMessage: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    completedAt: z.ZodOptional<z.ZodString>;
    detailsAvailable: z.ZodBoolean;
}, "strict", z.ZodTypeAny, {
    taskId: string;
    clientOperationId: string;
    ownerScopeHash: string;
    projectId: string;
    nodeId: string;
    mode: "direct-compare" | "network-search";
    analysisMode: "local-only" | "local-plus-vision";
    modelRef?: string | undefined;
    status: "cancelled" | "completed" | "failed" | "partial" | "queued" | "running" | "waiting_model";
    stage: "building-report" | "checking-model-resources" | "deduplicating" | "done" | "downloading-candidates" | "local-comparing" | "model-comparing" | "preparing-query" | "searching" | "validating-inputs" | "waiting-for-model";
    progress: number;
    processedCandidates: number;
    totalCandidates?: number | undefined;
    errorCode?: string | undefined;
    errorMessage?: string | undefined;
    createdAt: string;
    updatedAt: string;
    completedAt?: string | undefined;
    detailsAvailable: boolean;
}, {
    taskId: string;
    clientOperationId: string;
    ownerScopeHash: string;
    projectId: string;
    nodeId: string;
    mode: "direct-compare" | "network-search";
    analysisMode: "local-only" | "local-plus-vision";
    modelRef?: string | undefined;
    status: "cancelled" | "completed" | "failed" | "partial" | "queued" | "running" | "waiting_model";
    stage: "building-report" | "checking-model-resources" | "deduplicating" | "done" | "downloading-candidates" | "local-comparing" | "model-comparing" | "preparing-query" | "searching" | "validating-inputs" | "waiting-for-model";
    progress: number;
    processedCandidates: number;
    totalCandidates?: number | undefined;
    errorCode?: string | undefined;
    errorMessage?: string | undefined;
    createdAt: string;
    updatedAt: string;
    completedAt?: string | undefined;
    detailsAvailable: boolean;
}>;
export type PortraitTaskSummary = z.infer<typeof portraitTaskSummarySchema>;
export declare const PORTRAIT_ERROR_MESSAGES: Record<string, string>;
export declare function riskFromFaceSimilarity(similarity: number | undefined): PortraitRiskLevel;
export declare function riskScore(level: PortraitRiskLevel): 0 | 0.2 | 0.5 | 0.66 | 1;
export declare function highestRisk(levels: readonly PortraitRiskLevel[]): PortraitRiskLevel;
