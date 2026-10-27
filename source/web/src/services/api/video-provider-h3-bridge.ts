import { imageToDataUrl } from "@/services/image-storage";
import { modelOptionName } from "@/stores/use-config-store";
import type { ReferenceImage } from "@/types/image";
import type { ApiVideoResponse, RequestOptions, ResolvedAiConfig, VideoGenerationTask } from "./video-contracts";
import type { VideoProviderDeps } from "./video-provider-deps";
import { resolveVideoImageReferences } from "./video-reference-roles";
import { normalizeVideoAspectRatio, normalizeVideoSeconds } from "./video-validation";

export async function createH3BridgeVideoTask(deps: VideoProviderDeps, config: ResolvedAiConfig, model: string, prompt: string, images: ReferenceImage[], options?: RequestOptions): Promise<VideoGenerationTask> {
    if (images.length > 9) throw new Error("H3 当前配置最多接收 9 张图片，已停止提交，不会截断");
    const explicit = options?.videoStartFrameNodeId || options?.videoEndFrameNodeId;
    const refs = resolveVideoImageReferences(images, options).map(item => ({ ...item,
        role: !explicit && images.length > 1 ? "reference_image" as const : item.role }));
    if (refs.some(item => item.role === "last_frame")) throw new Error("当前 H3 桥接未确认严格尾帧，请将结束状态图片作为普通参考");
    const reference_images = await Promise.all(refs.map(async ({ image, role }) => {
        const url = await imageToDataUrl(image);
        if (!url) throw new Error("参考图片读取失败，已停止提交全部图片");
        return { url, role };
    }));
    const bridge_reference_hashes = await Promise.all(reference_images.map(async image => {
        const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(image.url));
        return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, "0")).join("");
    }));
    const body = { model: modelOptionName(model), prompt, duration: Number(normalizeVideoSeconds(config.videoSeconds)),
        aspect_ratio: normalizeVideoAspectRatio(config.size), resolution: config.vquality,
        bridge_reference_count: reference_images.length, bridge_reference_hashes,
        bridge_image_roles: reference_images.map(image => image.role), reference_images };
    const response = deps.response.unwrapVideoResponse(await deps.transport.post<ApiVideoResponse>(deps.transport.apiUrl("/videos/generations"), body, options));
    const id = deps.response.videoTaskId(response);
    if (!id) throw new Error("H3 桥接没有返回任务 ID");
    return { id, provider: "openai", model };
}
