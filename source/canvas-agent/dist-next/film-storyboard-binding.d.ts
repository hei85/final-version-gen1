import type { CanvasSnapshot } from "./types.js";
type RecordValue = Record<string, unknown>;
/**
 * Resolve ProductionRun media reuse against the MCP runtime's current canvas snapshot.
 * The canvas Script row is the authoritative source for task, node and resource bindings.
 */
export declare function hydrateFilmPlanFromCanvasStoryboard(input: RecordValue, canvasState: CanvasSnapshot | null): RecordValue;
export declare function filmBindingResolutionHint(input: RecordValue, canvasState: CanvasSnapshot | null): string;
export {};
