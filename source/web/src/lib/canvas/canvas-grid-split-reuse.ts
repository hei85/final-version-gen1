import type { CanvasNodeData } from "@/types/canvas";
export function gridSplitVersionKey(node: CanvasNodeData, rows: number, columns: number) {
    return JSON.stringify([node.id, node.metadata?.storageKey || node.metadata?.content, rows, columns]);
}
export function existingGridSplit(nodes: CanvasNodeData[], source: CanvasNodeData, rows: number, columns: number) {
    const key = gridSplitVersionKey(source, rows, columns);
    const cells = nodes.filter((n) => n.metadata?.gridSplit?.key === key && n.metadata?.content && n.metadata?.storageKey);
    if (!cells.length) return [];
    const ordered = Array.from({ length: rows * columns }, (_, index) => cells.find((n) => n.metadata?.gridSplit?.index === index));
    if (ordered.some((n) => !n)) throw new Error("这张母图已部分切分；请恢复缺失切图或清理旧切图后再切分，避免重复创建");
    return ordered as CanvasNodeData[];
}
