import type { PortraitClearanceDedupMode } from "./contracts.js";
export type PortraitDedupCandidate = {
    id: string;
    byteHash: string;
    phash: string;
    byteSize: number;
    pixelArea: number;
    embedding?: ArrayLike<number>;
};
export type PortraitDedupGroup = {
    id: string;
    keptId: string;
    removedIds: string[];
    reason: "byte-hash" | "phash" | "phash-and-arcface";
};
export type PortraitDedupResult = {
    kept: PortraitDedupCandidate[];
    groups: PortraitDedupGroup[];
    inputCount: number;
    outputCount: number;
    byteDeduplicatedCount: number;
    visualDeduplicatedCount: number;
    phashDistance: number;
    arcfaceThreshold?: number;
};
export declare function deduplicatePortraitCandidates(candidates: readonly PortraitDedupCandidate[], mode: PortraitClearanceDedupMode): PortraitDedupResult;
