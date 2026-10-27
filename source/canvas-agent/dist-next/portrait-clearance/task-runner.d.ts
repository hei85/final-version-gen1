import { type PortraitTaskRecord, type PortraitTaskStore } from "./task-store.js";
import { PortraitFaceEngine } from "./face-engine.js";
export declare class PortraitTaskRunner {
    private readonly store;
    private readonly faceEngine;
    constructor(store: PortraitTaskStore, faceEngine: PortraitFaceEngine);
    start(record: PortraitTaskRecord): void;
    recover(owner: {
        keyId: string;
        origin: string;
    }): Promise<void>;
    private run;
    private runDirect;
    private runNetwork;
    private persistResult;
    private readManualCandidates;
    private readInputBytes;
    private readInputImage;
    private cancelled;
}
