import { type ToolName } from "./schemas.js";
import type { CanvasNode, CanvasSnapshot } from "./types.js";
export declare function isToolName(name: unknown): name is ToolName;
export declare function parseToolInput(name: ToolName, input: unknown): {
    [x: string]: any;
};
export declare function compactCanvasState(state: CanvasSnapshot | null): {
    projectId?: string;
    domainProjectId?: string;
    title?: string;
    connections?: import("./types.js").CanvasConnection[];
    selectedNodeIds?: string[];
    viewport?: import("./types.js").Viewport;
    clientId?: string;
    revision?: number;
    nodes: {
        id: string;
        type: import("./types.js").CanvasNodeType;
        title: string | undefined;
        position: import("./types.js").Position;
        width: number;
        height: number;
        parentId: string | undefined;
        metadata: {
            [x: string]: unknown;
        };
    }[];
};
export declare function compactNode(node: CanvasNode): {
    id: string;
    type: import("./types.js").CanvasNodeType;
    title: string | undefined;
    position: import("./types.js").Position;
    width: number;
    height: number;
    parentId: string | undefined;
    metadata: {
        [x: string]: unknown;
    };
};
export declare function nextCanvasX(state: CanvasSnapshot | null): number;
