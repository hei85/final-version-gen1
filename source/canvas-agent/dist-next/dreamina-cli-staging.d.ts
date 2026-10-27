import type { DreaminaGenerationInput } from "./dreamina-cli-contract.js";
import type { StateLockLease } from "./dreamina-cli-state.js";
export declare function stageReferences(input: DreaminaGenerationInput, roots: readonly string[], ownerStateDirectory: string, signal?: AbortSignal): Promise<{
    input: DreaminaGenerationInput;
    cleanup: () => Promise<void>;
}>;
export declare function scavengeStaleStagingDirectories(directory: string, lease: StateLockLease): Promise<void>;
