import type { LocalRuntimeModule } from "../local-runtime.js";
export type LineartRuntimePaths = {
    pythonPath: string;
    scriptPath: string;
    hfHome: string;
    modelId: string;
    configured: boolean;
    modelCached: boolean;
    reason?: "python_missing" | "worker_missing";
};
export type LineartRuntimeStatus = {
    configured: boolean;
    modelCached: boolean;
    loaded: boolean;
    device: "cpu";
    modelId: string;
    reason?: string;
};
type LineartWorkerSuccess = {
    ok: true;
    requestId: string;
    mimeType: "image/png";
    width: number;
    height: number;
    modelId: string;
    device: "cpu";
    pngBase64: string;
};
export declare class LineartRuntimeError extends Error {
    readonly code: string;
    readonly statusCode: number;
    constructor(code: string, message: string, statusCode?: number);
}
export declare function createLineartEstimationHttpModule(): LocalRuntimeModule;
export declare function resolveLineartRuntimePaths(env?: NodeJS.ProcessEnv): LineartRuntimePaths;
export declare class LineartEstimationWorker {
    private paths;
    private child?;
    private stdoutBuffer;
    private stderrBuffer;
    private requestCounter;
    private loaded;
    private readonly pending;
    status(): LineartRuntimeStatus;
    run(input: {
        dataUrl: string;
    }): Promise<LineartWorkerSuccess>;
    dispose(): void;
    private ensureChild;
    private refreshPaths;
    private consumeStdout;
    private handleChildExit;
    private rejectPending;
}
export declare function validateLineartDataUrl(value: string): void;
export {};
