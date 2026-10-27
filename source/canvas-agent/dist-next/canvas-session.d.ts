import type { ServerResponse } from "node:http";
import type { CanvasNodeType, CanvasSnapshot } from "./types.js";
export declare class CanvasSession {
    private clients;
    private pending;
    private localFileTransfers;
    private statesByClientId;
    private revisionFloorByCanvasId;
    private clientContext;
    private get canvasState();
    health(): {
        ok: boolean;
        hasCanvas: boolean;
        clients: number;
    };
    openEvents(url: URL, res: ServerResponse, runtimeSessionId?: string): void;
    closeRuntimeSession(runtimeSessionId: string): void;
    streamLocalUpload(id: string, clientId: string, runtimeSessionId: string, res: ServerResponse): void;
    updateState(body: unknown, clientId?: string): {
        accepted: boolean;
        revision: number;
        stateHash: string;
        reason: "ambiguous_client";
        idempotent?: undefined;
    } | {
        accepted: boolean;
        revision: number;
        stateHash: string;
        reason: "unknown_client";
        idempotent?: undefined;
    } | {
        accepted: boolean;
        revision: number;
        stateHash: string;
        reason: "missing_canvas_id";
        idempotent?: undefined;
    } | {
        accepted: boolean;
        revision: number;
        stateHash: string;
        reason: "state_hash_mismatch";
        idempotent?: undefined;
    } | {
        accepted: boolean;
        revision: number;
        stateHash: string;
        reason: "stale_revision";
        idempotent?: undefined;
    } | {
        accepted: boolean;
        revision: number;
        stateHash: string;
        reason: "revision_conflict";
        idempotent?: undefined;
    } | {
        reason?: undefined;
        accepted: boolean;
        idempotent: boolean;
        revision: number;
        stateHash: string;
    };
    resolveResult(body: {
        requestId?: string;
        error?: string;
        result?: unknown;
    }, clientId: string): boolean;
    emitAll(type: string, payload: unknown): void;
    dispose(): void;
    callTool(name: unknown, rawInput: unknown): Promise<unknown>;
    private resolveClientForTool;
    private callToolScoped;
    private requestCanvasTool;
    private rejectPendingClient;
    private removeClient;
    private pruneClosedClients;
}
export declare function generationFlowOps(input: Record<string, unknown>, state: CanvasSnapshot | null): ({
    type: string;
    id: string | undefined;
    nodeType: string;
    title: string | undefined;
    position: {
        x: number;
        y: number;
    };
    width: number | undefined;
    height: number | undefined;
    metadata: {
        content: string;
        status: string;
        fontSize: number;
    };
} | {
    type: string;
    id: string;
    nodeType: CanvasNodeType;
    title: string;
    position: {
        x: number;
        y: number;
    };
    width: number | undefined;
    height: number | undefined;
    metadata: {
        [k: string]: unknown;
    };
} | {
    type: string;
    fromNodeId: string;
    toNodeId: string;
    ids?: undefined;
} | {
    fromNodeId?: undefined;
    toNodeId?: undefined;
    type: string;
    ids: string[];
} | {
    type: string;
    nodeId: string;
    mode: "audio" | "image" | "text" | "video";
    prompt: string | undefined;
    retry?: boolean | undefined;
    clientOperationId?: string | undefined;
})[];
export declare function resolveGenerationPlacement(input: Record<string, unknown>, state: CanvasSnapshot | null, referenceNodeIds: string[]): {
    x: number;
    y: number;
};
