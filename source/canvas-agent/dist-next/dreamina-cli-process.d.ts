import { type ChildProcess } from "node:child_process";
export type DreaminaProcessRequest = {
    executable: string;
    args: string[];
    timeoutMs: number;
    completeOnJsonOutput?: (value: unknown) => boolean;
    signal?: AbortSignal;
    env?: Record<string, string | undefined>;
    onSpawn?: (pid: number) => void;
};
export type DreaminaProcessResult = {
    exitCode: number | null;
    stdout: string;
    stderr: string;
};
export type DreaminaProcessDependencies = {
    terminateProcessTree?: (child: ChildProcess) => Promise<void>;
    cleanupTimeoutMs?: number;
};
export declare class DreaminaCliError extends Error {
    readonly code: string;
    readonly statusCode: number;
    constructor(code: string, message: string, statusCode?: number);
}
export declare function isStableDreaminaErrorCode(value: string): boolean;
export declare function runDreaminaProcess(request: DreaminaProcessRequest, dependencies?: DreaminaProcessDependencies): Promise<DreaminaProcessResult>;
export declare function sanitizeDreaminaDiagnostic(value: string): string;
export declare function discoverDreaminaExecutable(env?: Record<string, string | undefined>, signal?: AbortSignal): Promise<{
    installed: false;
    executable?: undefined;
} | {
    installed: true;
    executable: string;
}>;
