import type { LocalRuntimeModule } from "../local-runtime.js";
export type DepthRuntimePaths = {
    pythonPath: string;
    scriptPath: string;
    hfHome: string;
    modelId: string;
    configured: boolean;
    modelCached: boolean;
    reason?: "python_missing" | "worker_missing";
};
export type DepthRuntimeStatus = {
    configured: boolean;
    modelCached: boolean;
    loaded: boolean;
    device: "cpu";
    modelId: string;
    reason?: string;
};
type DepthWorkerSuccess = {
    ok: true;
    requestId: string;
    mimeType: "image/png";
    width: number;
    height: number;
    modelId: string;
    device: "cpu";
    pngBase64: string;
};
export declare class DepthRuntimeError extends Error {
    readonly code: string;
    readonly statusCode: number;
    constructor(code: string, message: string, statusCode?: number);
}
export declare function createDepthEstimationHttpModule(): LocalRuntimeModule;
export declare function resolveDepthRuntimePaths(env?: NodeJS.ProcessEnv): DepthRuntimePaths;
export declare class DepthEstimationWorker {
    private paths;
    private child?;
    private stdoutBuffer;
    private stderrBuffer;
    private requestCounter;
    private loaded;
    private readonly pending;
    status(): DepthRuntimeStatus;
    run(input: {
        dataUrl: string;
    }): Promise<DepthWorkerSuccess>;
    dispose(): void;
    private ensureChild;
    private refreshPaths;
    private consumeStdout;
    private handleChildExit;
    private rejectPending;
}
export declare function validateDepthDataUrl(value: string): void;
export {};
