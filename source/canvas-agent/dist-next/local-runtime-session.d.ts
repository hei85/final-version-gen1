import { type LocalRuntimeScope } from "./local-runtime-contract.js";
export declare const LOCAL_RUNTIME_DEFAULT_SCOPES: readonly LocalRuntimeScope[];
export type RuntimeBrowserRegistration = {
    keyId: string;
    origin: string;
    publicKeyJwk: JsonWebKey;
    fingerprint: string;
    createdAt: string;
};
export type RuntimePublicSession = {
    sessionId: string;
    keyId: string;
    scopes: readonly LocalRuntimeScope[];
    expiresAt: string;
};
export type RuntimeChallengeResponse = {
    state: "challenge";
    challengeId: string;
    nonce: string;
    runtimeInstanceId: string;
    expiresAt: string;
    keyId: string;
};
export type RuntimeRequestVerification = {
    sessionId: string;
    origin: string;
    method: string;
    pathAndQuery: string;
    body: Uint8Array;
    lastEventId: string | null;
    requestNonce: string;
    timestamp: number;
    proof: string;
    scope: LocalRuntimeScope;
};
export type LocalRuntimeSessionManagerOptions = {
    endpoint: string;
    runtimeInstanceId?: string;
    trustedOrigins: readonly string[];
    registrations: RuntimeBrowserRegistration[];
    persistRegistrations?: (registrations: readonly RuntimeBrowserRegistration[]) => void;
    now?: () => number;
    scopes?: readonly LocalRuntimeScope[];
    onSessionRevoked?: (sessionId: string) => void;
    timers?: {
        setTimeout(callback: () => void, delayMs: number): unknown;
        clearTimeout(handle: unknown): void;
    };
};
export declare class LocalRuntimeSessionError extends Error {
    readonly code: string;
    readonly statusCode: number;
    constructor(code: string, message?: string, statusCode?: number);
}
export declare class LocalRuntimeSessionManager {
    readonly runtimeInstanceId: string;
    private readonly endpoint;
    private readonly trustedOrigins;
    private readonly registrations;
    private readonly persistRegistrations;
    private readonly now;
    private readonly scopes;
    private readonly onSessionRevoked?;
    private readonly timers;
    private readonly challenges;
    private readonly sessions;
    private readonly sessionExpiryTimers;
    constructor(options: LocalRuntimeSessionManagerOptions);
    isTrustedOrigin(origin: string): boolean;
    createChallenge(originValue: string, input: {
        publicKeyJwk: JsonWebKey;
        keyId?: never;
    } | {
        keyId: string;
        publicKeyJwk?: never;
    }): RuntimeChallengeResponse;
    exchange(originValue: string, input: {
        challengeId: string;
        signature: string;
    }): RuntimePublicSession;
    verifyRequest(input: RuntimeRequestVerification): RuntimePublicSession;
    revokeSession(sessionId: string): void;
    revokeRegistration(sessionId: string): void;
    dispose(): void;
    private createRegisteredChallenge;
    private createSignedChallenge;
    private publicChallenge;
    private createSession;
    private requireTrustedOrigin;
    private requireChallenge;
    private findRegistration;
    private removeSession;
    private pruneExpired;
}
export declare function runtimeBrowserKeyId(value: JsonWebKey): string;
