export type DreaminaTaskLifecycle = "QUEUED_LOCAL" | "SUBMITTING" | "SUBMISSION_UNCERTAIN" | "ACCEPTED" | "RUNNING" | "TERMINAL";
export type DreaminaTerminalOutcome = "SUCCEEDED" | "REJECTED" | "FAILED" | "CANCELLED" | "FAILED_OR_CANCELLED";
export type DreaminaTaskSyncState = "SYNC_OK" | "SYNC_RETRY_WAIT" | "SYNC_BLOCKED_ACCOUNT" | "SYNC_UNCERTAIN" | "SYNC_CONFLICT";
export type DreaminaTaskResultState = "NOT_AVAILABLE" | "PENDING_MATERIALIZATION" | "MATERIALIZING" | "READY" | "FAILED_RETRYABLE" | "FAILED_PERMANENT";
export type DreaminaTaskMediaType = "image" | "video" | "audio";
export type DreaminaAvailability = "yes" | "no" | "unknown";
export type DreaminaTaskOutput = {
    outputIndex: number;
    mediaType: DreaminaTaskMediaType;
    providerArtifactRef?: string;
    materializedAssetId?: string;
    materializationErrorCode?: string;
};
export type DreaminaScopedTaskContext = {
    scope: "scoped";
    projectId?: string;
    nodeId?: string;
    conversationId?: string;
    messageId?: string;
    batchIndex?: number;
    batchCount?: number;
    retryOf?: string;
    attemptGroupId?: string;
};
export type DreaminaTaskContext = DreaminaScopedTaskContext | {
    scope: "legacy_unscoped";
};
export type DreaminaProviderObservation = {
    source: "submit_receipt" | "query_result" | "list_task";
    observedAt: string;
    accountBinding?: string;
    fenceEpoch?: number;
    status: "pending" | "processing" | "completed" | "failed" | "cancelled";
};
export type DreaminaProviderCapability = {
    adapterSupported: boolean;
    cancelSupported: boolean;
    pushStatusSupported: boolean;
    statusConsistency: "eventual_polling";
    accountEntitlement: DreaminaAvailability;
    currentlyObservedAvailable: DreaminaAvailability;
    references: {
        images: boolean;
        videos: boolean;
        audios: boolean;
        firstLastFrames: boolean;
    };
};
export type DreaminaGenerationTaskContract = {
    taskId: string;
    clientOperationId: string;
    provider: "dreamina-cli";
    accountBinding?: string;
    lifecycle: DreaminaTaskLifecycle;
    terminalOutcome?: DreaminaTerminalOutcome;
    syncState: DreaminaTaskSyncState;
    resultState: DreaminaTaskResultState;
    projectId?: string;
    nodeId?: string;
    conversationId?: string;
    messageId?: string;
    batchIndex?: number;
    batchCount?: number;
    retryOf?: string;
    attemptGroupId?: string;
    requestHash: string;
    providerTaskId?: string;
    officialStatus?: DreaminaProviderObservation["status"];
    lastObservedAt?: string;
    lastSyncErrorCode?: string;
    nextPollAt?: string;
    version: number;
    outputs: DreaminaTaskOutput[];
};
export type DreaminaTaskState = {
    lifecycle: DreaminaTaskLifecycle;
    terminalOutcome?: DreaminaTerminalOutcome;
    syncState: DreaminaTaskSyncState;
    resultState: DreaminaTaskResultState;
    outputs: DreaminaTaskOutput[];
    accountBinding?: string;
    context: DreaminaTaskContext;
    providerObservation?: DreaminaProviderObservation;
    lastSyncErrorCode?: string;
};
export type DreaminaLocalSyncErrorKind = "query" | "transport" | "parse" | "lock" | "login" | "account";
export type DreaminaTaskEvent = {
    type: "transition";
    lifecycle: DreaminaTaskLifecycle;
    terminalOutcome?: DreaminaTerminalOutcome;
} | {
    type: "provider_observation";
    observation: DreaminaProviderObservation;
} | {
    type: "sync_error";
    errorKind: DreaminaLocalSyncErrorKind;
    code: string;
} | {
    type: "sync_recovered";
} | {
    type: "bind_context";
    accountBinding?: string;
    context: DreaminaScopedTaskContext;
};
export type DreaminaRuntimeJournalState = "queued" | "pending" | "accepted" | "succeeded" | "failed" | "cancelled" | "unknown" | "deleted";
export type DreaminaRuntimeJournalSnapshot = {
    state: DreaminaRuntimeJournalState;
    submitId?: string;
    receiptRecorded?: boolean;
    errorCode?: string;
    officialStatus?: DreaminaProviderObservation["status"];
};
export declare class DreaminaTaskTransitionError extends Error {
    constructor(message: string);
}
export declare function reduceDreaminaTask(state: DreaminaTaskState, event: DreaminaTaskEvent): DreaminaTaskState;
export declare function dreaminaTaskFromRuntimeJournal(input: DreaminaRuntimeJournalSnapshot): DreaminaTaskState;
