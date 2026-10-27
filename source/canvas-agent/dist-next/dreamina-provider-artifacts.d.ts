import fs from "node:fs/promises";
import type { DreaminaGenerationResult } from "./dreamina-generation.js";
import type { RuntimeProviderOutput } from "./dreamina-cli-state.js";
type ArtifactBinding = {
    ownerId: string;
    idempotencyKey: string;
    accountBinding?: string;
    fenceEpoch?: number;
    mode: "image" | "video";
};
export declare class DreaminaProviderArtifactStore {
    private readonly root;
    private readonly now;
    private readonly statScavengeCandidate;
    constructor(options: {
        root: string;
        now?: () => Date;
        statScavengeCandidate?: (target: string) => ReturnType<typeof fs.lstat>;
    });
    persistResult(result: DreaminaGenerationResult, binding: ArtifactBinding): Promise<RuntimeProviderOutput[]>;
    readResult(outputs: readonly RuntimeProviderOutput[], binding: ArtifactBinding): Promise<DreaminaGenerationResult>;
    scavenge(liveOutputs: readonly RuntimeProviderOutput[]): Promise<void>;
}
export {};
