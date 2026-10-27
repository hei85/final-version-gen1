import { type DreaminaGenerationInput } from "./dreamina-cli-contract.js";
import type { DreaminaPublicGenerationTask } from "./dreamina-cli-runtime.js";
import type { DreaminaTaskContext } from "./dreamina-task-contract.js";
import type { DreaminaModelDescriptor, DreaminaModelOperation } from "./local-runtime-contract.js";
export type DreaminaGenerationRequest = {
    idempotencyKey: string;
    clientOperationId: string;
    context: DreaminaTaskContext;
    operation: DreaminaModelOperation;
    model: string;
    prompt: string;
    settings: {
        aspect?: string;
        resolution?: string;
        duration?: number;
        count?: number;
    };
    references: unknown[];
};
export type DreaminaGenerationResult = {
    mode: "image" | "video";
    images?: Array<{
        dataUrl: string;
        mimeType: string;
        bytes: number;
    }>;
    video?: {
        dataUrl: string;
        mimeType: string;
        bytes: number;
    };
};
export declare class LocalDreaminaGenerationError extends Error {
    readonly code: string;
    readonly statusCode: number;
    constructor(code: string, message: string, statusCode?: number);
}
type DreaminaGenerationAdapterOptions = {
    root: string;
    models: readonly DreaminaModelDescriptor[];
    coordinator?: DreaminaGenerationCoordinator;
    runtime: {
        generateToResult(input: DreaminaGenerationInput, options?: {
            signal?: AbortSignal;
            requestFingerprint?: string;
            clientOperationId?: string;
            taskContext?: DreaminaTaskContext;
        }): Promise<DreaminaGenerationResult>;
        enqueue?(input: DreaminaGenerationInput, options?: {
            signal?: AbortSignal;
            requestFingerprint?: string;
            clientOperationId?: string;
            taskContext?: DreaminaTaskContext;
        }): Promise<DreaminaPublicGenerationTask>;
        waitForTask?(idempotencyKey: string, mode: "image" | "video", options?: {
            signal?: AbortSignal;
        }): Promise<DreaminaGenerationResult>;
    };
};
export declare class DreaminaGenerationCoordinator {
    private readonly limit;
    private active;
    private readonly waiting;
    constructor(limit?: number);
    run<T>(action: () => Promise<T>, signal?: AbortSignal): Promise<T>;
    private acquire;
    private drain;
}
export declare class DreaminaGenerationAdapter {
    private readonly root;
    private readonly models;
    private readonly runtime;
    private readonly coordinator;
    private readonly inFlight;
    constructor(options: DreaminaGenerationAdapterOptions);
    run(value: unknown, options?: {
        signal?: AbortSignal;
    }): Promise<DreaminaGenerationResult>;
    submit(value: unknown, options?: {
        signal?: AbortSignal;
    }): Promise<DreaminaPublicGenerationTask>;
    private execute;
}
export declare function collectDreaminaGenerationResult(root: string, mode: "image" | "video"): Promise<DreaminaGenerationResult>;
export declare function unknownGenerationResult(): LocalDreaminaGenerationError;
export {};
