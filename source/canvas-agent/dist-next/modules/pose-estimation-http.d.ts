import type { LocalRuntimeModule } from "../local-runtime.js";
declare const DEFAULT_BACKEND: "openpose-body";
export type PoseRuntimePaths = {
    pythonPath: string;
    scriptPath: string;
    hfHome: string;
    modelId: string;
    configured: boolean;
    modelCached: boolean;
    reason?: "python_missing" | "worker_missing";
};
export type PoseRuntimeStatus = {
    configured: boolean;
    modelCached: boolean;
    loaded: boolean;
    device: "cpu";
    modelId: string;
    backend: typeof DEFAULT_BACKEND;
    reason?: string;
};
type PoseWorkerSuccess = {
    ok: true;
    requestId: string;
    mimeType: "image/png";
    width: number;
    height: number;
    modelId: string;
    device: "cpu";
    backend: typeof DEFAULT_BACKEND;
    personCount: number;
    people?: unknown[];
    pngBase64: string;
};
export declare class PoseRuntimeError extends Error {
    readonly code: string;
    readonly statusCode: number;
    constructor(code: string, message: string, statusCode?: number);
}
export declare function createPoseEstimationHttpModule(): LocalRuntimeModule;
export declare function resolvePoseRuntimePaths(env?: NodeJS.ProcessEnv): PoseRuntimePaths;
export declare function findCachedModelFile(modelCacheDir: string, filename: string): boolean;
export declare class PoseEstimationWorker {
    private paths;
    private child?;
    private stdoutBuffer;
    private stderrBuffer;
    private requestCounter;
    private loaded;
    private readonly pending;
    status(): PoseRuntimeStatus;
    run(input: {
        dataUrl: string;
    }): Promise<PoseWorkerSuccess>;
    dispose(): void;
    private ensureChild;
    private refreshPaths;
    private consumeStdout;
    private handleChildExit;
    private rejectPending;
}
export declare function validatePoseDataUrl(value: string): void;
export {};
