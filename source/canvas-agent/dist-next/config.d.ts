import type { RuntimeBrowserRegistration } from "./local-runtime-session.js";
export declare const LOCAL_RUNTIME_DEFAULT_PORT = 17371;
/** @deprecated Use LOCAL_RUNTIME_DEFAULT_PORT. */
export declare const DEFAULT_PORT = 17371;
export declare const CONFIG_DIR: string;
export declare const CONFIG_FILE: string;
export declare const VERSION: string;
export declare const AGENT_PROMPT = "";
export type CanvasWorkspaceConfig = {
    workspacePath: string;
    activeThreadId?: string;
    pinnedThreadIds?: string[];
};
export type LocalRuntimeConfig = {
    url: string;
    token: string;
    ownerId?: string;
    origins?: string[];
    trustedWebOrigins: string[];
    browserRegistrations: RuntimeBrowserRegistration[];
    legacyBootstrap?: boolean;
    canvases?: Record<string, CanvasWorkspaceConfig>;
};
/** @deprecated Use LocalRuntimeConfig. */
export type CanvasAgentConfig = LocalRuntimeConfig;
export declare function loadConfig(create?: boolean): LocalRuntimeConfig;
export declare function normalizeLocalRuntimeConfig(value: unknown): LocalRuntimeConfig;
export declare function ensureRuntimeOwnerId(config: LocalRuntimeConfig): string;
/** @deprecated Use ensureRuntimeOwnerId. */
export declare const ensureOwnerId: typeof ensureRuntimeOwnerId;
export declare function saveConfig(config: LocalRuntimeConfig): void;
export declare function ensureCanvasWorkspace(config: LocalRuntimeConfig, canvasId: string): {
    activeThreadId?: string;
    pinnedThreadIds?: string[];
    canvasId: string;
    workspacePath: string;
};
export declare function updateCanvasWorkspace(config: LocalRuntimeConfig, canvasId: string, patch: Partial<CanvasWorkspaceConfig>): {
    workspacePath: string;
    activeThreadId?: string;
    pinnedThreadIds?: string[];
    canvasId: string;
};
