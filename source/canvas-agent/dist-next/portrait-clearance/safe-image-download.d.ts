import { type DecodedPortraitImage } from "./image-metrics.js";
export declare class PortraitCandidateDownloadError extends Error {
    readonly code: "portrait_candidate_download_blocked" | "portrait_candidate_invalid";
    constructor(code: "portrait_candidate_download_blocked" | "portrait_candidate_invalid", message: string);
}
export declare function downloadPortraitCandidate(url: string, options?: {
    signal?: AbortSignal;
    fetch?: typeof fetch;
}): Promise<{
    url: string;
    contentType: "image/jpeg" | "image/png" | "image/webp";
    bytes: Buffer<ArrayBuffer>;
    decoded: DecodedPortraitImage;
}>;
export declare function validatePublicUrl(value: string): string;
export declare function assertPublicImageHost(value: string): Promise<URL>;
