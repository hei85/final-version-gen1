export type CliChildEnvironmentErrorReason = "conflict" | "proxy" | "no_proxy";
export declare class CliChildEnvironmentError extends Error {
    readonly reason: CliChildEnvironmentErrorReason;
    readonly code = "cli_environment_invalid";
    constructor(reason: CliChildEnvironmentErrorReason);
}
export declare function buildCliChildEnvironment(source: Record<string, string | undefined>): Record<string, string>;
