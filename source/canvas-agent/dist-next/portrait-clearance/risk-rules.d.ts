import { type PortraitImageQuality, type PortraitLocalPrecheck, type PortraitRiskLevel, type PortraitVisionComparison } from "./contracts.js";
import { type DecodedPortraitImage } from "./image-metrics.js";
import type { PortraitFaceAnalysis } from "./face-engine.js";
export declare function buildLocalPrecheck(imageA: DecodedPortraitImage, imageB: DecodedPortraitImage, facesA?: PortraitFaceAnalysis, facesB?: PortraitFaceAnalysis, extraIssues?: string[]): PortraitLocalPrecheck;
export declare function localRisk(precheck: PortraitLocalPrecheck): PortraitRiskLevel;
export declare function applyStylizedRiskFloor(comparison: PortraitVisionComparison): PortraitVisionComparison;
export declare function summarizeRisk(pairs: Array<{
    riskLevel: PortraitRiskLevel;
}>): {
    highestRisk: "high" | "low" | "low_to_medium" | "medium" | "unable_to_determine";
    riskCounts: Partial<Record<"high" | "low" | "low_to_medium" | "medium" | "unable_to_determine", number>>;
};
export declare function buildReliabilityIssues(quality: PortraitImageQuality, faces: number): string[];
