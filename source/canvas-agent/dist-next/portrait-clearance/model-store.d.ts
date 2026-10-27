declare const MODEL_PACK = "buffalo_l";
export type PortraitModelStatus = {
    modelPack: typeof MODEL_PACK;
    root: string;
    detector: {
        fileName: string;
        installed: boolean;
        sha256: string;
    };
    embedding: {
        fileName: string;
        installed: boolean;
        sha256: string;
    };
    ready: boolean;
};
export declare function portraitModelDirectory(root: string): string;
export declare function portraitModelStatus(root: string): Promise<PortraitModelStatus>;
export declare function installPortraitModels(root: string, options?: {
    signal?: AbortSignal;
    fetch?: typeof fetch;
}): Promise<{
    modelPack: typeof MODEL_PACK;
    root: string;
    detector: {
        fileName: string;
        installed: boolean;
        sha256: string;
    };
    embedding: {
        fileName: string;
        installed: boolean;
        sha256: string;
    };
    ready: boolean;
    downloaded: boolean;
}>;
export declare function defaultPortraitModelRoot(configDir: string): string;
export declare function defaultPortraitConfigRoot(): string;
export {};
