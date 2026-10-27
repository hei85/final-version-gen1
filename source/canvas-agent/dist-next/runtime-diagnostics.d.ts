import type { LocalRuntimeConfig } from "./config.js";
import type { CanvasSnapshot } from "./types.js";
export declare function runtimeDiagnostics(config: LocalRuntimeConfig | undefined, state: CanvasSnapshot | null, connection: {
    clients: number;
    hasCanvas: boolean;
}): {
    ok: boolean;
    buildId: string;
    version: string;
    toolsetVersion: string;
    schemaVersion: number;
    process: {
        node: string;
        platform: NodeJS.Platform;
        arch: NodeJS.Architecture;
        pid: number;
    };
    runtime: {
        url: string;
        connected: boolean;
        clients: number;
        hasCanvas: boolean;
    };
    binding: {
        canvasId: string;
        domainProjectId: string;
        revision: number;
        stateHash: string;
        selectedNodeIds: string[];
    } | null;
    capabilities: {
        canvas: boolean;
        skills: boolean;
        modelProfiles: boolean;
        shortTaskPolling: boolean;
        mediaProbe: boolean;
        serverTimelineRender: boolean;
    };
};
