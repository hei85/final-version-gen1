export type DreaminaCliSessionSnapshot = {
    sessionEpoch: number;
    accountBinding?: string;
};
export type DreaminaCliInvocationLease = {
    fenceEpoch: number;
    session: DreaminaCliSessionSnapshot;
    assertCurrent(expectedSession?: DreaminaCliSessionSnapshot): Promise<void>;
    release(): Promise<void>;
};
export type DreaminaCliArbiterOptions = {
    stateFile: string;
    now?: () => number;
    leaseMs?: number;
    waitTimeoutMs?: number;
    pollMs?: number;
    heartbeatMs?: number;
};
export declare class DreaminaCliArbiter {
    private readonly stateFile;
    private readonly now;
    private readonly leaseMs;
    private readonly waitTimeoutMs;
    private readonly pollMs;
    private readonly heartbeatMs;
    constructor(options: DreaminaCliArbiterOptions);
    acquire(options?: {
        signal?: AbortSignal;
        expectedSession?: DreaminaCliSessionSnapshot;
    }): Promise<DreaminaCliInvocationLease>;
    readSession(signal?: AbortSignal): Promise<DreaminaCliSessionSnapshot>;
    commitSession(lease: DreaminaCliInvocationLease, accountBinding: string | undefined): Promise<DreaminaCliSessionSnapshot>;
    advanceSession(lease: DreaminaCliInvocationLease): Promise<DreaminaCliSessionSnapshot>;
    private createLease;
    private removeQueued;
    private inspect;
    private mutate;
}
