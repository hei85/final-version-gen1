import { type CreatePortraitClearanceTaskRequest, type PortraitClearanceInputRole, type PortraitClearanceTaskStatus, type PortraitModelJob, type PortraitTaskSummary } from "./contracts.js";
export type PortraitTaskInputFile = {
    id: string;
    nodeId: string;
    role: PortraitClearanceInputRole;
    fileName: string;
    mimeType: "image/jpeg" | "image/png" | "image/webp";
    relativePath: string;
};
export type PortraitTaskRecord = PortraitTaskSummary & {
    schemaVersion: 1;
    ownerId: string;
    keyId: string;
    origin: string;
    ownerScopeHash: string;
    settings: CreatePortraitClearanceTaskRequest["settings"];
    inputs: PortraitTaskInputFile[];
    resultRelativePath?: string;
    reportRelativePaths?: Partial<Record<"md" | "html" | "docx", string>>;
    modelJobs?: PortraitModelJob[];
    cancelRequested?: boolean;
};
export type PortraitTaskEvent = {
    id: string;
    taskId: string;
    type: "state" | "candidate" | "error";
    at: string;
    summary: PortraitTaskSummary;
};
export declare class PortraitTaskStoreError extends Error {
    readonly code: "portrait_task_not_found" | "portrait_task_forbidden" | "portrait_idempotency_conflict" | "portrait_input_invalid" | "portrait_task_delete_failed" | "portrait_model_job_not_found" | "portrait_model_job_conflict" | "portrait_artifact_not_found";
    readonly status: number;
    constructor(code: "portrait_task_not_found" | "portrait_task_forbidden" | "portrait_idempotency_conflict" | "portrait_input_invalid" | "portrait_task_delete_failed" | "portrait_model_job_not_found" | "portrait_model_job_conflict" | "portrait_artifact_not_found", message: string, status?: number);
}
export declare class PortraitTaskStore {
    private readonly root;
    private readonly runtimeOwnerId;
    private readonly active;
    private readonly activeControllers;
    private readonly taskLocks;
    private readonly deleting;
    constructor(root: string, runtimeOwnerId: string);
    create(request: CreatePortraitClearanceTaskRequest, owner: {
        keyId: string;
        origin: string;
    }): Promise<{
        record: PortraitTaskRecord;
        created: boolean;
    }>;
    get(taskId: string, owner: {
        keyId: string;
        origin: string;
    }): Promise<PortraitTaskRecord>;
    list(query: {
        projectId?: string;
        nodeId?: string;
        ownerScopeHash?: string;
        limit: number;
        cursor?: string;
    }, owner: {
        keyId: string;
        origin: string;
    }): Promise<{
        tasks: {
            taskId: string;
            clientOperationId: string;
            ownerScopeHash: string;
            projectId: string;
            nodeId: string;
            mode: "direct-compare" | "network-search";
            analysisMode: "local-only" | "local-plus-vision";
            modelRef?: string | undefined;
            status: "cancelled" | "completed" | "failed" | "partial" | "queued" | "running" | "waiting_model";
            stage: "building-report" | "checking-model-resources" | "deduplicating" | "done" | "downloading-candidates" | "local-comparing" | "model-comparing" | "preparing-query" | "searching" | "validating-inputs" | "waiting-for-model";
            progress: number;
            processedCandidates: number;
            totalCandidates?: number | undefined;
            errorCode?: string | undefined;
            errorMessage?: string | undefined;
            createdAt: string;
            updatedAt: string;
            completedAt?: string | undefined;
            detailsAvailable: boolean;
        }[];
        nextCursor?: string | undefined;
    }>;
    counts(owner: {
        keyId: string;
        origin: string;
    }): Promise<{
        active: number;
        recoverable: number;
    }>;
    recoverableRecords(): Promise<PortraitTaskRecord[]>;
    update(taskId: string, owner: {
        keyId: string;
        origin: string;
    }, patch: Partial<Pick<PortraitTaskRecord, "status" | "stage" | "progress" | "processedCandidates" | "totalCandidates" | "errorCode" | "errorMessage" | "completedAt" | "detailsAvailable" | "resultRelativePath" | "reportRelativePaths" | "modelJobs" | "cancelRequested">>): Promise<PortraitTaskRecord>;
    private updateUnlocked;
    prepareRetry(taskId: string, owner: {
        keyId: string;
        origin: string;
    }): Promise<PortraitTaskRecord>;
    writeResult(taskId: string, owner: {
        keyId: string;
        origin: string;
    }, result: unknown): Promise<PortraitTaskRecord>;
    readResult(taskId: string, owner: {
        keyId: string;
        origin: string;
    }): Promise<unknown>;
    private readStoredResult;
    private syncFailedModelPairs;
    writeReports(taskId: string, owner: {
        keyId: string;
        origin: string;
    }, reports: {
        markdown: string;
        html: string;
        docx: Uint8Array;
    }): Promise<PortraitTaskRecord>;
    private writeReportsUnlocked;
    readReport(taskId: string, owner: {
        keyId: string;
        origin: string;
    }, artifactId: string): Promise<{
        mimeType: string;
        bytes: NonSharedBuffer;
    }>;
    ensureModelJobs(taskId: string, owner: {
        keyId: string;
        origin: string;
    }): Promise<{
        jobId: string;
        taskId: string;
        pairId: string;
        queryImageId: string;
        comparisonImageId: string;
        status: "completed" | "failed" | "leased" | "pending";
        attempt: number;
        leaseToken?: string | undefined;
        leaseExpiresAt?: string | undefined;
        errorCode?: string | undefined;
        errorMessage?: string | undefined;
    }[]>;
    private ensureModelJobsUnlocked;
    claimModelJob(taskId: string, owner: {
        keyId: string;
        origin: string;
    }): Promise<PortraitModelJob | undefined>;
    private claimModelJobUnlocked;
    completeModelJob(taskId: string, owner: {
        keyId: string;
        origin: string;
    }, jobId: string, request: unknown): Promise<{
        record: PortraitTaskRecord;
        result: unknown;
        job: {
            jobId: string;
            taskId: string;
            pairId: string;
            queryImageId: string;
            comparisonImageId: string;
            status: "completed" | "failed" | "leased" | "pending";
            attempt: number;
            leaseToken?: string | undefined;
            leaseExpiresAt?: string | undefined;
            errorCode?: string | undefined;
            errorMessage?: string | undefined;
        };
    }>;
    private completeModelJobUnlocked;
    failModelJob(taskId: string, owner: {
        keyId: string;
        origin: string;
    }, jobId: string, request: unknown): Promise<{
        record: PortraitTaskRecord;
        job: {
            jobId: string;
            taskId: string;
            pairId: string;
            queryImageId: string;
            comparisonImageId: string;
            status: "completed" | "failed" | "leased" | "pending";
            attempt: number;
            leaseToken?: string | undefined;
            leaseExpiresAt?: string | undefined;
            errorCode?: string | undefined;
            errorMessage?: string | undefined;
        };
    }>;
    private failModelJobUnlocked;
    readInput(taskId: string, owner: {
        keyId: string;
        origin: string;
    }, inputId: string): Promise<{
        input: PortraitTaskInputFile;
        bytes: NonSharedBuffer;
    }>;
    writeCandidate(taskId: string, owner: {
        keyId: string;
        origin: string;
    }, artifactId: string, extension: "jpg" | "png" | "webp", bytes: Uint8Array): Promise<{
        relativePath: string;
    }>;
    readImageArtifact(taskId: string, owner: {
        keyId: string;
        origin: string;
    }, artifactId: string): Promise<{
        mimeType: string;
        bytes: NonSharedBuffer;
    }>;
    requestCancel(taskId: string, owner: {
        keyId: string;
        origin: string;
    }): Promise<PortraitTaskRecord>;
    delete(taskId: string, owner: {
        keyId: string;
        origin: string;
    }): Promise<{
        deleted: true;
    }>;
    events(taskId: string, owner: {
        keyId: string;
        origin: string;
    }, afterId?: string): Promise<PortraitTaskEvent[]>;
    inputPath(taskId: string, owner: {
        keyId: string;
        origin: string;
    }, inputId: string): Promise<string>;
    writeModelInput(taskId: string, owner: {
        keyId: string;
        origin: string;
    }, name: "query-search.jpg", bytes: Uint8Array): Promise<string>;
    start(taskId: string, runner: (record: PortraitTaskRecord, signal: AbortSignal) => Promise<void>): void;
    isRunning(taskId: string): boolean;
    private findByOperation;
    private listAll;
    private withTaskLock;
    private readRecord;
    private assertOwner;
    private tasksRoot;
    private taskRoot;
    private writeRecord;
    private appendEvent;
    private saveModelJobs;
    private refreshReports;
}
export declare function toSummary(record: PortraitTaskRecord): PortraitTaskSummary;
export declare function isTerminal(status: PortraitClearanceTaskStatus): status is "cancelled" | "completed" | "failed" | "partial";
export declare function decodePortraitDataUrl(value: string, expectedMime: PortraitTaskInputFile["mimeType"]): Buffer<ArrayBuffer>;
