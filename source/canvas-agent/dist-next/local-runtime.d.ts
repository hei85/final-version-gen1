import type { Express, RequestHandler } from "express";
import { type LocalRuntimeModuleDescriptor, type LocalRuntimeScope } from "./local-runtime-contract.js";
import { type LocalRuntimeSessionManager } from "./local-runtime-session.js";
export type LocalRuntimeProtectedRoute = {
    method: "GET" | "POST";
    path: string;
    scope: LocalRuntimeScope;
    handler: RequestHandler;
    lastEventId?: boolean;
    queryKeys?: readonly string[];
    legacy?: boolean;
};
export type LocalRuntimeModule = {
    descriptor: LocalRuntimeModuleDescriptor;
    routes: readonly LocalRuntimeProtectedRoute[];
    start?: () => void | Promise<void>;
    onRuntimeSessionRevoked?: (sessionId: string) => void;
    dispose?: () => void | Promise<void>;
    publicHealth?: () => Record<string, string | number | boolean>;
};
export type CreateLocalRuntimeAppOptions = {
    authority: string;
    endpoint: string;
    version: string;
    sessionManager: LocalRuntimeSessionManager;
    modules: readonly LocalRuntimeModule[];
    legacyMasterToken?: string;
    legacyOrigins?: readonly string[];
};
export declare function createLocalRuntimeApp(options: CreateLocalRuntimeAppOptions): Express;
