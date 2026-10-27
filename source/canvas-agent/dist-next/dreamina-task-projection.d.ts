import { type RuntimeRecord } from "./dreamina-cli-state.js";
import { type DreaminaTaskContext } from "./dreamina-task-contract.js";
import { DreaminaTaskStore, type DreaminaStoredTask } from "./dreamina-task-store.js";
export type DreaminaProjectableJournalRecord = {
    recordId: string;
    journalVersion: number;
    requestHash: string;
    clientOperationId?: string;
    context?: DreaminaTaskContext;
    state: RuntimeRecord["state"];
    hasProviderTask: boolean;
    taskVersion?: 1;
    operation?: string;
    mode?: "image" | "video";
    model?: string;
    createdAt?: string;
    updatedAt: string;
    errorCode?: string;
    officialStatus?: RuntimeRecord["officialStatus"];
    accountBinding?: string;
    fenceEpoch?: number;
    providerOutputs?: RuntimeRecord["providerOutputs"];
    hidden?: true;
};
export type DreaminaTaskProjectorOptions = {
    store: DreaminaTaskStore;
    ownerId: string;
    journalFile: string;
    readJournal?: () => Promise<DreaminaProjectableJournalRecord[]>;
};
export declare class DreaminaTaskProjector {
    private readonly store;
    private readonly ownerId;
    private readonly journalFile;
    private readonly readJournal;
    constructor(options: DreaminaTaskProjectorOptions);
    recover(): Promise<void>;
    projectJournalVersion(recordId: string, journalVersion: number, supplied?: DreaminaProjectableJournalRecord): Promise<DreaminaStoredTask | undefined>;
}
export declare function readSafeJournal(journalFile: string, ownerId: string): Promise<DreaminaProjectableJournalRecord[]>;
