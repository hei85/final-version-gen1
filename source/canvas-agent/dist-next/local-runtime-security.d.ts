import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { LocalRuntimeScope } from "./local-runtime-contract.js";
import { type LocalRuntimeSessionManager } from "./local-runtime-session.js";
export type RuntimeCorsPolicy = {
    methods: readonly string[];
    headers: readonly string[];
    publicInfo?: boolean;
    trustedOrigin?: boolean;
    legacyOrigins?: readonly string[];
    legacyHeaders?: readonly string[];
};
export declare function exactAuthorityGuard(authority: string): RequestHandler;
export declare function noStore(_req: Request, res: Response, next: NextFunction): void;
export declare function runtimeCors(policies: ReadonlyMap<string, RuntimeCorsPolicy>, sessions: LocalRuntimeSessionManager): RequestHandler;
export declare function trustedOriginGuard(sessions: LocalRuntimeSessionManager): RequestHandler;
export declare function signedRuntimeGuard(sessions: LocalRuntimeSessionManager, scope: LocalRuntimeScope, options?: {
    queryKeys?: readonly string[];
}): RequestHandler;
export declare function legacyOrSignedRuntimeGuard(sessions: LocalRuntimeSessionManager, scope: LocalRuntimeScope, options: {
    queryKeys?: readonly string[];
    masterToken?: string;
    origins?: readonly string[];
}): RequestHandler;
export declare function strictJsonObject(req: Request): Record<string, unknown>;
export declare function assertExactKeys(value: Record<string, unknown>, keys: readonly string[]): void;
export declare function runtimeErrorHandler(error: unknown, _req: Request, res: Response, next: NextFunction): void;
export declare function protectedCorsHeaders(method: "GET" | "POST", lastEventId?: boolean): string[];
