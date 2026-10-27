import type { PortraitImageQuality } from "./contracts.js";
export type DecodedPortraitImage = {
    width: number;
    height: number;
    channels: 3;
    rgb: Uint8Array;
    gray: Float32Array;
    byteHash: string;
    phash: string;
    quality: PortraitImageQuality;
};
export type GrayImage = {
    width: number;
    height: number;
    values: ArrayLike<number>;
};
export declare function cosineSimilarity(a: ArrayLike<number>, b: ArrayLike<number>): number;
export declare function imageQuality(width: number, height: number, gray: ArrayLike<number>): PortraitImageQuality;
export declare function laplacianVariance(width: number, height: number, gray: ArrayLike<number>): number;
export declare function structuralSimilarity(a: GrayImage, b: GrayImage): number;
export declare function colorHistogramCorrelation(a: Uint8Array, b: Uint8Array): number;
export declare function computePHash(gray: GrayImage): string;
export declare function hammingDistance(left: string, right: string): number;
export declare function sha256Hex(value: Uint8Array | Buffer): string;
export declare function decodePortraitImage(input: Uint8Array | Buffer): Promise<DecodedPortraitImage>;
export declare function cropPortraitSearchImage(input: Uint8Array | Buffer, image: DecodedPortraitImage, bbox?: readonly [number, number, number, number]): Promise<Buffer<ArrayBufferLike>>;
