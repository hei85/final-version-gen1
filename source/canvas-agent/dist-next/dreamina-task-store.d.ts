import { type DreaminaProviderObservation, type DreaminaTaskContext, type DreaminaTaskEvent, type DreaminaTaskLifecycle, type DreaminaTaskOutput, type DreaminaTaskResultState, type DreaminaTaskSyncState, type DreaminaTerminalOutcome } from "./dreamina-task-contract.js";
export type DreaminaStoredTask = {
    taskId: string;
    visibility?: "visible" | "hidden" | "deleted";
    clientOperationId: string;
    provider: "dreamina-cli";
    lifecycle: DreaminaTaskLifecycle;
    terminalOutcome?: DreaminaTerminalOutcome;
    syncState: DreaminaTaskSyncState;
    resultState: DreaminaTaskResultState;
    requestHash: string;
    version: number;
    outputs: DreaminaTaskOutput[];
    context: DreaminaTaskContext;
    accountBinding?: string;
    officialStatus?: DreaminaProviderObservation["status"];
    lastSyncErrorCode?: string;
    mode?: "image" | "video";
    operation?: string;
    model?: string;
    createdAt?: string;
    updatedAt: string;
    journalRecordId: string;
    projectedJournalVersion: number;
};
export type DreaminaTaskOutboxEffect = {
    effectKey: string;
    kind: "task.projected" | "task.mutated" | "product.effect";
    taskId: string;
    journalVersion?: number;
    taskVersion: number;
    createdAt: string;
};
export type DreaminaTaskEffectResult = {
    materializedAssetId?: string;
};
export type DreaminaTaskInboxRecord = {
    consumerId: string;
    taskId: string;
    effectKey: string;
    state: "pending" | "completed" | "released";
    fence: number;
    leaseToken?: string;
    leaseExpiresAt?: string;
    completedAt?: string;
    releasedAt?: string;
    result?: DreaminaTaskEffectResult;
};
type EffectInput = Pick<DreaminaTaskOutboxEffect, "effectKey" | "kind" | "taskId" | "journalVersion">;
type DreaminaProductTaskEvent = Exclude<DreaminaTaskEvent, {
    type: "provider_observation";
} | {
    type: "transition";
}>;
export type DreaminaProductTaskMutation = {
    type: "event";
    event: DreaminaProductTaskEvent;
    updatedAt: string;
} | {
    type: "materialization";
    resultState: DreaminaTaskResultState;
    outputs: DreaminaTaskOutput[];
    updatedAt: string;
};
export declare class DreaminaTaskStoreConflictError extends Error {
    constructor();
}
export declare class DreaminaTaskStore {
    private readonly stateFile;
    private readonly now;
    private readonly capacity;
    constructor(options: {
        stateFile: string;
        now?: () => Date;
        maxTasks?: number;
        maxEffects?: number;
    });
    getTask(taskId: string): Promise<DreaminaStoredTask | undefined>;
    listTasks(): Promise<DreaminaStoredTask[]>;
    listOutbox(): Promise<DreaminaTaskOutboxEffect[]>;
    listInbox(): Promise<Array<Pick<DreaminaTaskInboxRecord, "consumerId" | "taskId" | "effectKey" | "state">>>;
    compareAndSwapTask(input: {
        taskId: string;
        expectedVersion: number;
        task: Record<string, unknown>;
        effect: EffectInput;
    }): Promise<DreaminaStoredTask>;
    mutateTask(input: {
        taskId: string;
        expectedVersion: number;
        mutation: unknown;
        effectKey: string;
    }): Promise<DreaminaStoredTask>;
    claimOutboxEffect(consumerId: string, effectKey: string, leaseMs?: number): Promise<{
        leaseToken: string;
        leaseExpiresAt: string;
    } | undefined>;
    claimProductEffect(input: {
        consumerId: string;
        taskId: string;
        effectKey: string;
        leaseMs?: number;
    }): Promise<{
        status: "claimed";
        leaseToken: string;
        leaseExpiresAt: string;
        fence: number;
    } | {
        status: "busy";
        retryAt: string;
    } | {
        status: "completed";
        result: DreaminaTaskEffectResult;
    }>;
    renewProductEffect(input: {
        consumerId: string;
        taskId: string;
        effectKey: string;
        leaseToken: string;
        fence: number;
        leaseMs?: number;
    }): Promise<{
        leaseExpiresAt: string;
        fence: number;
    } | undefined>;
    completeProductEffect(input: {
        consumerId: string;
        taskId: string;
        effectKey: string;
        leaseToken: string;
        fence: number;
        result: DreaminaTaskEffectResult;
    }): Promise<boolean>;
    releaseProductEffect(input: {
        consumerId: string;
        taskId: string;
        effectKey: string;
        leaseToken: string;
        fence: number;
    }): Promise<boolean>;
    private finishProductEffect;
    completeOutboxEffect(consumerId: string, effectKey: string, leaseToken: string): Promise<boolean>;
    private withDisk;
    private withExclusiveDisk;
    private persist;
}
export {};
