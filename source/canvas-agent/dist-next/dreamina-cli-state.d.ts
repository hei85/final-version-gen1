import { DreaminaCliError } from "./dreamina-cli-process.js";
import type { DreaminaProviderObservation, DreaminaRuntimeJournalState, DreaminaTaskContext } from "./dreamina-task-contract.js";
export type RuntimePollLease = {
    leaseId: string;
    ownerId: string;
    expiresAt: string;
};
export type RuntimeProviderOutput = {
    outputIndex: number;
    mediaType: "image" | "video";
    providerArtifactRef: string;
};
export type RuntimeRecord = {
    ownerId: string;
    idempotencyKey: string;
    clientOperationId?: string;
    context?: DreaminaTaskContext;
    requestHash: string;
    state: DreaminaRuntimeJournalState;
    journalVersion?: number;
    fenceEpoch?: number;
    accountBinding?: string;
    sessionEpoch?: number;
    reservationId?: string;
    reservationOwnerId?: string;
    reservationExpiresAt?: string;
    submissionPhase?: "reserved" | "spawn_permitted";
    queueOwnerId?: string;
    queueExpiresAt?: string;
    queueTicket?: number;
    updatedAt: string;
    submitId?: string;
    taskVersion?: 1;
    operation?: string;
    mode?: "image" | "video";
    model?: string;
    createdAt?: string;
    errorCode?: string;
    officialStatus?: DreaminaProviderObservation["status"];
    nextPollAt?: string;
    pollLease?: RuntimePollLease;
    retryCount?: number;
    lastObservedAt?: string;
    providerOutputs?: RuntimeProviderOutput[];
    hidden?: true;
};
export type RuntimeDiskState = {
    version: 1;
    records: RuntimeRecord[];
    nextQueueTicket?: number;
};
export type StateLockLease = (() => Promise<void>) & {
    assertOwned: () => Promise<void>;
};
export declare function persistRuntimeDiskState(stateFile: string, ownerId: string, payload: RuntimeDiskState, lease: StateLockLease): Promise<void>;
export declare function recoverStateReplacement(stateFile: string, ownerId: string, lease: StateLockLease): Promise<void>;
export declare function readRuntimeDiskState(stateFile: string, ownerId: string): Promise<RuntimeDiskState | undefined>;
export declare function recordKey(ownerId: string, idempotencyKey: string): string;
export declare function stateInvalid(): DreaminaCliError;
export declare function stateRank(state: RuntimeRecord["state"]): 0 | 1 | 2 | 3;
export declare function acquireStateLock(stateFile: string, signal?: AbortSignal): Promise<(() => Promise<void>) & {
    assertOwned: () => Promise<void>;
}>;
