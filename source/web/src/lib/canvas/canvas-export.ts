import { saveAs } from "file-saver";

import { createCanvasArchive } from "@/lib/canvas/canvas-archive-zip";
import { getMediaBlob } from "@/services/file-storage";
import { getImageBlob } from "@/services/image-storage";
import type { CanvasExportAsset, CanvasExportFile } from "@/types/canvas-export";
import type { CanvasProject } from "@/stores/canvas/use-canvas-store";
import { loadCanvasDrawing, loadCanvasDrawingPreview, loadCanvasDrawingRender, waitForCanvasDrawingInitialization } from "@/lib/canvas/canvas-drawing-storage";
import type { CanvasDrawingExport } from "@/types/canvas-export";

async function mapArchiveItems<T, R>(items: T[], map: (item: T, index: number) => Promise<R>): Promise<R[]> {
    const result = new Array<R>(items.length);
    let next = 0;
    const results = await Promise.allSettled(
        Array.from({ length: Math.min(2, items.length) }, async () => {
            while (next < items.length) {
                const index = next++;
                result[index] = await map(items[index], index);
            }
        }),
    );
    const failed = results.find((item): item is PromiseRejectedResult => item.status === "rejected");
    if (failed) throw failed.reason;
    return result;
}

export async function buildCanvasProjectsZip(projects: CanvasProject[]) {
    const zipFiles: { name: string; data: BlobPart }[] = [];
    const exportedProjects = await mapArchiveItems(projects, async (project) => {
        const files: CanvasExportAsset[] = [];
        await mapArchiveItems(collectCanvasStorageKeys(project), async (storageKey, index) => {
            const blob = storageKey.startsWith("image:") ? await getImageBlob(storageKey) : await getMediaBlob(storageKey);
            if (!blob) throw new Error(`画布「${project.title}」的媒体文件不可读取：${storageKey}`);
            const path = `projects/${project.id}/files/${safeFileName(storageKey)}-${index}.${fileExtension(blob.type, storageKey)}`;
            files.push({ storageKey, path, mimeType: blob.type || "application/octet-stream", bytes: blob.size });
            zipFiles.push({ name: path, data: blob });
        });
        const drawingDocuments = (
            await mapArchiveItems(
                project.nodes.filter((node) => node.type === "drawing" && node.metadata?.drawingId),
                async (node): Promise<CanvasDrawingExport | null> => {
                    const drawingId = node.metadata?.drawingId;
                    if (!drawingId) return null;
                    await waitForCanvasDrawingInitialization(project.id, drawingId);
                    const [saved, preview, render] = await Promise.all([loadCanvasDrawing(project.id, drawingId), loadCanvasDrawingPreview(project.id, drawingId), loadCanvasDrawingRender(project.id, drawingId)]);
                    if (!saved) throw new Error(`画布「${project.title}」的绘图文件不可读取：${drawingId}`);
                    const previewPath = preview ? `projects/${project.id}/drawings/${safeFileName(drawingId)}.png` : undefined;
                    if (preview && previewPath) zipFiles.push({ name: previewPath, data: preview });
                    const generationRenderPath = render ? `projects/${project.id}/drawings/${safeFileName(drawingId)}.generation.png` : undefined;
                    if (render && generationRenderPath) zipFiles.push({ name: generationRenderPath, data: render.blob });
                    return {
                        drawingId,
                        ...saved,
                        previewPath,
                        generationRender: render && generationRenderPath ? { path: generationRenderPath, pageId: render.pageId, width: render.width, height: render.height, mimeType: render.mimeType, background: render.background } : undefined,
                    } satisfies CanvasDrawingExport;
                },
            )
        ).filter((item): item is CanvasDrawingExport => item !== null);
        drawingDocuments.forEach((document) => zipFiles.push({ name: `projects/${project.id}/drawings/${safeFileName(document.drawingId)}.json`, data: JSON.stringify(document) }));
        return { project, files, drawingDocuments };
    });

    const data: CanvasExportFile = { app: "infinite-canvas", version: 4, exportedAt: new Date().toISOString(), projects: exportedProjects };
    return await createCanvasArchive([{ name: "projects.json", data: JSON.stringify(data, null, 2) }, ...zipFiles]);
}

export async function exportCanvasProjects(projects: CanvasProject[], fileName = "画布") {
    const zip = await buildCanvasProjectsZip(projects);
    saveAs(zip, `${safeFileName(fileName)}.zip`);
}

export function collectCanvasStorageKeys(value: unknown, keys = new Set<string>()): string[] {
    if (!value || typeof value !== "object") return [...keys];
    if ("storageKey" in value && typeof value.storageKey === "string" && value.storageKey.includes(":")) keys.add(value.storageKey);
    Object.values(value).forEach((item) => (Array.isArray(item) ? item.forEach((child) => collectCanvasStorageKeys(child, keys)) : collectCanvasStorageKeys(item, keys)));
    return [...keys];
}

function safeFileName(value: string) {
    return value.replace(/[\\/:*?"<>|]/g, "_");
}

function fileExtension(mimeType: string, storageKey: string) {
    if (mimeType.includes("png")) return "png";
    if (mimeType.includes("jpeg")) return "jpg";
    if (mimeType.includes("webp")) return "webp";
    if (mimeType.includes("gif")) return "gif";
    if (mimeType.includes("mp4")) return "mp4";
    if (mimeType.includes("webm")) return "webm";
    if (mimeType.includes("gltf-binary")) return "glb";
    if (mimeType.includes("gltf+json")) return "gltf";
    return storageKey.startsWith("image:") ? "png" : "bin";
}
