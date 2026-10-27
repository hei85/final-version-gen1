import { DreaminaCliArbiter, type DreaminaCliSessionSnapshot } from "./dreamina-cli-arbiter.js";
import { type DreaminaProcessRequest, type DreaminaProcessResult } from "./dreamina-cli-process.js";
export type { DreaminaProcessRequest, DreaminaProcessResult } from "./dreamina-cli-process.js";
type DreaminaInstallation = {
    installed: true;
    executable: string;
} | {
    installed: false;
};
type DreaminaState = "missing" | "installed" | "login_pending" | "authenticated" | "error";
export type DreaminaPublicStatus = {
    provider: "dreamina-cli";
    state: DreaminaState;
    installed: boolean;
    authenticated: boolean;
    version?: string;
    totalCredit?: number;
    accountBinding?: string;
    sessionEpoch?: number;
    creditObservedAt?: string;
    code?: string;
    message: string;
    verificationUri?: string;
    userCode?: string;
    expiresAt?: string;
};
export type DreaminaCliServiceOptions = {
    ownerId: string;
    env?: Record<string, string | undefined>;
    discover?: (signal?: AbortSignal) => Promise<DreaminaInstallation>;
    runProcess?: (request: DreaminaProcessRequest) => Promise<DreaminaProcessResult>;
    now?: () => Date;
    arbiter?: DreaminaCliArbiter;
    arbiterStateFile?: string;
};
export type DreaminaLifecycleOptions = {
    signal?: AbortSignal;
};
export declare class DreaminaCliService {
    private readonly env;
    private readonly discover;
    private readonly runProcess;
    private readonly now;
    private readonly arbiter;
    private flow?;
    private epoch;
    private readonly activeControllers;
    constructor(options: DreaminaCliServiceOptions);
    status(options?: DreaminaLifecycleOptions): Promise<DreaminaPublicStatus>;
    statusWithSession(options?: DreaminaLifecycleOptions): Promise<{
        status: DreaminaPublicStatus;
        session: DreaminaCliSessionSnapshot;
    }>;
    login(options?: DreaminaLifecycleOptions): Promise<DreaminaPublicStatus>;
    logout(options?: DreaminaLifecycleOptions): Promise<DreaminaPublicStatus>;
    private readStatus;
    private finishLogout;
    private startLogin;
    private prepare;
    private executeInvocation;
    private ensureAuthenticatedSession;
    private assertEpoch;
    private publicFlow;
}
