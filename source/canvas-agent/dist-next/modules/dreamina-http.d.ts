import { DreaminaCliArbiter } from "../dreamina-cli-arbiter.js";
import { type DreaminaGenerationResult } from "../dreamina-generation.js";
import { type DreaminaCliRuntimeOptions, type DreaminaPublicGenerationTask, type DreaminaRuntimeResult } from "../dreamina-cli-runtime.js";
import { DreaminaCliService } from "../dreamina-cli.js";
import type { LocalRuntimeModule } from "../local-runtime.js";
export type DreaminaHttpModuleOptions = {
    ownerId: string;
    dreamina?: Pick<DreaminaCliService, "status" | "login" | "logout"> & Partial<Pick<DreaminaCliService, "statusWithSession">>;
    dreaminaRuntime?: {
        run(input: unknown, options?: {
            signal?: AbortSignal;
        }): Promise<DreaminaRuntimeResult>;
        generateToResult(input: unknown, options?: {
            signal?: AbortSignal;
            requestFingerprint?: string;
        }): Promise<DreaminaGenerationResult>;
        resumeToResult(idempotencyKey: string, mode: "image" | "video", options?: {
            signal?: AbortSignal;
        }): Promise<DreaminaGenerationResult>;
        getTask(idempotencyKey: string, options?: {
            signal?: AbortSignal;
        }): Promise<DreaminaPublicGenerationTask>;
        waitForTask(idempotencyKey: string, mode: "image" | "video", options?: {
            signal?: AbortSignal;
        }): Promise<DreaminaGenerationResult>;
        refreshTask(idempotencyKey: string, options?: {
            signal?: AbortSignal;
        }): Promise<DreaminaPublicGenerationTask>;
        listTasks(options?: {
            signal?: AbortSignal;
        }): Promise<DreaminaPublicGenerationTask[]>;
        listTaskPage?(options?: {
            limit?: number;
            cursor?: string;
            projectId?: string;
            activeOnly?: boolean;
            signal?: AbortSignal;
        }): Promise<{
            tasks: DreaminaPublicGenerationTask[];
            nextCursor?: string;
        }>;
        cancelTask(idempotencyKey: string): Promise<DreaminaPublicGenerationTask>;
        deleteTask(idempotencyKey: string): Promise<{
            deleted: true;
        }>;
        enqueue(input: unknown, options?: {
            signal?: AbortSignal;
            requestFingerprint?: string;
        }): Promise<DreaminaPublicGenerationTask>;
        start?(): Promise<void>;
        dispose?(): Promise<void>;
    };
    generation?: {
        run(input: unknown, options?: {
            signal?: AbortSignal;
        }): Promise<DreaminaGenerationResult>;
        submit(input: unknown, options?: {
            signal?: AbortSignal;
        }): Promise<DreaminaPublicGenerationTask>;
    };
    configDir?: string;
    referenceRoots?: () => readonly string[];
    runtimeDependencies?: Partial<Pick<DreaminaCliRuntimeOptions, "discover" | "runProcess" | "now" | "sleep" | "maxPollAttempts" | "pollIntervalMs">>;
    arbiter?: DreaminaCliArbiter;
};
export declare function createDreaminaHttpModule(options: DreaminaHttpModuleOptions): LocalRuntimeModule;
