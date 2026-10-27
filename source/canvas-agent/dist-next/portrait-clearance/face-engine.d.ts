import type { DecodedPortraitImage } from "./image-metrics.js";
export type PortraitFace = {
    bbox: [number, number, number, number];
    detScore: number;
    keypoints: Array<[number, number]>;
    areaRatio: number;
    embedding?: Float32Array;
};
export type PortraitFaceAnalysis = {
    faces: PortraitFace[];
    selectedFace?: PortraitFace;
    embedding?: Float32Array;
};
export declare class PortraitFaceEngineError extends Error {
    readonly code: "portrait_model_missing" | "portrait_face_engine_failed";
    constructor(code: "portrait_model_missing" | "portrait_face_engine_failed", message: string);
}
type FaceEngineOptions = {
    modelRoot: string;
    detectorSize?: number;
    threshold?: number;
};
export declare class PortraitFaceEngine {
    private readonly options;
    private detector?;
    private embedding?;
    private readonly detectorSize;
    private readonly threshold;
    constructor(options: FaceEngineOptions);
    status(): Promise<import("./model-store.js").PortraitModelStatus>;
    analyze(image: DecodedPortraitImage): Promise<PortraitFaceAnalysis>;
    compare(left: DecodedPortraitImage, right: DecodedPortraitImage): Promise<{
        left: PortraitFaceAnalysis;
        right: PortraitFaceAnalysis;
        similarity: number | undefined;
    }>;
    private detect;
    private embed;
    private getDetectorSession;
    private getEmbeddingSession;
    private loadDetector;
    private loadEmbedding;
}
export {};
