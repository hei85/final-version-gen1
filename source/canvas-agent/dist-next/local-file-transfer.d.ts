import type { ServerResponse } from "node:http";
type UploadBinding = {
    clientId: string;
    runtimeSessionId: string;
    canvasId: string;
};
export declare class LocalCanvasFileTransfers {
    private readonly root;
    private readonly records;
    create(sourcePath: string, binding: UploadBinding): Promise<{
        uploadId: `${string}-${string}-${string}-${string}-${string}`;
        fileName: string;
        mimeType: string;
        size: number;
        sha256: string;
    }>;
    streamOnce(id: string, clientId: string, runtimeSessionId: string, res: ServerResponse): void;
    discard(id: string): void;
    removeForRuntimeSession(runtimeSessionId: string): void;
    dispose(): void;
    private remove;
    private removePath;
}
export {};
