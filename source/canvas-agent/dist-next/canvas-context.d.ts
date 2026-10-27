import type { CanvasNode, CanvasSnapshot } from "./types.js";
export type CanvasResourceSummary = {
    nodeId: string;
    nodeTitle: string;
    nodeType: CanvasNode["type"];
    status?: string;
    resourceId?: string;
    storageKey?: string;
    assetId?: string;
    assetCategory?: string;
    mimeType?: string;
    bytes?: number;
    width?: number;
    height?: number;
    durationMs?: number;
    isReady: boolean;
};
export type CanvasGenerationTaskSummary = {
    taskId: string;
    nodeId: string;
    nodeTitle: string;
    mode?: string;
    nodeStatus: string;
    status: string;
    progress?: number;
    stage?: string;
    provider?: string;
    errorCode?: string;
    officialStatus?: string;
    resourceReady: boolean;
};
export type CanvasContext = {
    schemaVersion: 1;
    revision: number;
    stateHash: string;
    canvas: {
        projectId?: string;
        domainProjectId?: string;
        title?: string;
        viewport?: CanvasSnapshot["viewport"];
        nodeCount: number;
        connectionCount: number;
        selectedNodeCount: number;
        nodeTypeCounts: Record<string, number>;
    };
    selection: ReturnType<typeof compactContextNode>[];
    nodes: ReturnType<typeof compactContextNode>[];
    connections: Array<{
        id: string;
        fromNodeId: string;
        fromTitle: string;
        toNodeId: string;
        toTitle: string;
        fromHandleId?: string;
        toHandleId?: string;
    }>;
    resources: CanvasResourceSummary[];
    warnings: string[];
};
export declare function buildCanvasContext(state: CanvasSnapshot | null): CanvasContext;
export declare function findCanvasNodes(state: CanvasSnapshot | null, input: {
    query?: string;
    ids?: string[];
    types?: string[];
    statuses?: string[];
    resourceOnly?: boolean;
    limit?: number;
}): {
    query: string;
    total: number;
    truncated: boolean;
    nodes: {
        id: string;
        type: import("./types.js").CanvasNodeType;
        title: string;
        position: import("./types.js").Position;
        size: {
            width: number;
            height: number;
        };
        parentId: string | undefined;
        status: string;
        content: string | undefined;
        prompt: string | undefined;
        generation: {
            mode: unknown;
            model: unknown;
            workflowKind: unknown;
            workflowTitle: unknown;
            taskId: unknown;
            status: unknown;
            progress: number | undefined;
            stage: unknown;
            provider: unknown;
            errorCode: unknown;
        } | undefined;
        error: string | undefined;
        asset: {
            assetId: unknown;
            versionId: unknown;
            category: unknown;
            tags: unknown;
            characterName: unknown;
        } | undefined;
        resource: {
            resourceId: string | undefined;
            storageKey: string | undefined;
            mimeType: string | undefined;
            bytes: number | undefined;
            width: number | undefined;
            height: number | undefined;
            durationMs: number | undefined;
            ready: boolean;
        } | undefined;
    }[];
};
export declare function getCanvasNode(state: CanvasSnapshot | null, input: {
    id: string;
}): {
    found: boolean;
    id: string;
    node: null;
    connections: never[];
    resource?: undefined;
    revision?: undefined;
    stateHash?: undefined;
} | {
    found: boolean;
    id: string;
    node: {
        metadata?: {
            storyboard: object;
        } | undefined;
        id: string;
        type: import("./types.js").CanvasNodeType;
        title: string;
        position: import("./types.js").Position;
        size: {
            width: number;
            height: number;
        };
        parentId: string | undefined;
        status: string;
        content: string | undefined;
        prompt: string | undefined;
        generation: {
            mode: unknown;
            model: unknown;
            workflowKind: unknown;
            workflowTitle: unknown;
            taskId: unknown;
            status: unknown;
            progress: number | undefined;
            stage: unknown;
            provider: unknown;
            errorCode: unknown;
        } | undefined;
        error: string | undefined;
        asset: {
            assetId: unknown;
            versionId: unknown;
            category: unknown;
            tags: unknown;
            characterName: unknown;
        } | undefined;
        resource: {
            resourceId: string | undefined;
            storageKey: string | undefined;
            mimeType: string | undefined;
            bytes: number | undefined;
            width: number | undefined;
            height: number | undefined;
            durationMs: number | undefined;
            ready: boolean;
        } | undefined;
    };
    resource: CanvasResourceSummary | null;
    connections: {
        id: string;
        fromNodeId: string;
        fromTitle: string;
        toNodeId: string;
        toTitle: string;
        fromHandleId: string | undefined;
        toHandleId: string | undefined;
        relation: "batch-output" | "storyboard-asset-reference" | "storyboard-output" | undefined;
        storyboardRowId: string | undefined;
    }[];
    revision: number;
    stateHash: string;
};
export declare function getCanvasConnection(state: CanvasSnapshot | null, input: {
    id: string;
}): {
    found: boolean;
    id: string;
    connection: null;
    fromNode?: undefined;
    toNode?: undefined;
} | {
    found: boolean;
    id: string;
    connection: {
        id: string;
        fromNodeId: string;
        fromTitle: string;
        toNodeId: string;
        toTitle: string;
        fromHandleId: string | undefined;
        toHandleId: string | undefined;
        relation: "batch-output" | "storyboard-asset-reference" | "storyboard-output" | undefined;
        storyboardRowId: string | undefined;
    };
    fromNode: {
        id: string;
        type: import("./types.js").CanvasNodeType;
        title: string;
        position: import("./types.js").Position;
        size: {
            width: number;
            height: number;
        };
        parentId: string | undefined;
        status: string;
        content: string | undefined;
        prompt: string | undefined;
        generation: {
            mode: unknown;
            model: unknown;
            workflowKind: unknown;
            workflowTitle: unknown;
            taskId: unknown;
            status: unknown;
            progress: number | undefined;
            stage: unknown;
            provider: unknown;
            errorCode: unknown;
        } | undefined;
        error: string | undefined;
        asset: {
            assetId: unknown;
            versionId: unknown;
            category: unknown;
            tags: unknown;
            characterName: unknown;
        } | undefined;
        resource: {
            resourceId: string | undefined;
            storageKey: string | undefined;
            mimeType: string | undefined;
            bytes: number | undefined;
            width: number | undefined;
            height: number | undefined;
            durationMs: number | undefined;
            ready: boolean;
        } | undefined;
    } | null;
    toNode: {
        id: string;
        type: import("./types.js").CanvasNodeType;
        title: string;
        position: import("./types.js").Position;
        size: {
            width: number;
            height: number;
        };
        parentId: string | undefined;
        status: string;
        content: string | undefined;
        prompt: string | undefined;
        generation: {
            mode: unknown;
            model: unknown;
            workflowKind: unknown;
            workflowTitle: unknown;
            taskId: unknown;
            status: unknown;
            progress: number | undefined;
            stage: unknown;
            provider: unknown;
            errorCode: unknown;
        } | undefined;
        error: string | undefined;
        asset: {
            assetId: unknown;
            versionId: unknown;
            category: unknown;
            tags: unknown;
            characterName: unknown;
        } | undefined;
        resource: {
            resourceId: string | undefined;
            storageKey: string | undefined;
            mimeType: string | undefined;
            bytes: number | undefined;
            width: number | undefined;
            height: number | undefined;
            durationMs: number | undefined;
            ready: boolean;
        } | undefined;
    } | null;
};
export declare function getCanvasGenerationTasks(state: CanvasSnapshot | null, input: {
    status?: string;
    nodeIds?: string[];
    limit?: number;
}): {
    total: number;
    truncated: boolean;
    tasks: CanvasGenerationTaskSummary[];
};
export declare function getCanvasResources(state: CanvasSnapshot | null, input: {
    nodeIds?: string[];
    status?: string;
    limit?: number;
}): {
    total: number;
    truncated: boolean;
    resources: CanvasResourceSummary[];
};
export declare function validateCanvasOps(state: CanvasSnapshot | null, ops: unknown[]): {
    ok: boolean;
    issues: {
        index: number;
        severity: "error" | "warning";
        message: string;
    }[];
    operationCount: number;
    currentStateHash: string;
};
export declare function hashState(state: CanvasSnapshot): string;
declare function compactContextNode(node: CanvasNode): {
    id: string;
    type: import("./types.js").CanvasNodeType;
    title: string;
    position: import("./types.js").Position;
    size: {
        width: number;
        height: number;
    };
    parentId: string | undefined;
    status: string;
    content: string | undefined;
    prompt: string | undefined;
    generation: {
        mode: unknown;
        model: unknown;
        workflowKind: unknown;
        workflowTitle: unknown;
        taskId: unknown;
        status: unknown;
        progress: number | undefined;
        stage: unknown;
        provider: unknown;
        errorCode: unknown;
    } | undefined;
    error: string | undefined;
    asset: {
        assetId: unknown;
        versionId: unknown;
        category: unknown;
        tags: unknown;
        characterName: unknown;
    } | undefined;
    resource: {
        resourceId: string | undefined;
        storageKey: string | undefined;
        mimeType: string | undefined;
        bytes: number | undefined;
        width: number | undefined;
        height: number | undefined;
        durationMs: number | undefined;
        ready: boolean;
    } | undefined;
};
export {};
