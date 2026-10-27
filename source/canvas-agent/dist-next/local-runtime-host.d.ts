import { type Server } from "node:http";
import type { Express } from "express";
import { type LocalRuntimeConfig } from "./config.js";
import { type LocalRuntimeModule } from "./local-runtime.js";
import { LocalRuntimeSessionManager } from "./local-runtime-session.js";
export type StartLocalRuntimeOptions = {
    config?: LocalRuntimeConfig;
    modules?: readonly LocalRuntimeModule[];
    port?: number;
    log?: (line: string) => void;
    persistConfig?: (config: LocalRuntimeConfig) => void;
};
export type LocalRuntimeHandle = {
    app: Express;
    server: Server;
    sessions: LocalRuntimeSessionManager;
    ready: Promise<void>;
    close: () => Promise<void>;
};
export declare function createDefaultLocalRuntimeModules(config: LocalRuntimeConfig): LocalRuntimeModule[];
export declare function startLocalRuntime(options?: StartLocalRuntimeOptions): LocalRuntimeHandle;
