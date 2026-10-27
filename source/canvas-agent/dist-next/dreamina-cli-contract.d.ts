import { z } from "zod";
export declare const dreaminaGenerationOperations: readonly ["text2image", "image2image", "image_upscale", "text2video", "image2video", "frames2video", "multiframe2video", "multimodal2video"];
export declare const dreaminaSubmitIdSchema: z.ZodString;
declare const videoResolution: z.ZodEnum<["480p", "720p", "1080p", "4k"]>;
export declare const dreaminaImageModelSchema: z.ZodEnum<["3.0", "3.1", "4.0", "4.1", "4.5", "4.6", "4.7", "5.0", "5.0Pro"]>;
type DreaminaVideoModelCapability = {
    videoResolutions: readonly z.infer<typeof videoResolution>[];
    minDuration: number;
    maxDuration: number;
};
export declare const dreaminaVideoModelCapabilityOverrides: {
    readonly "seedance1.0fast": {
        readonly videoResolutions: readonly ["720p"];
        readonly minDuration: 5;
        readonly maxDuration: 10;
    };
    readonly "seedance1.5pro": {
        readonly videoResolutions: readonly ["720p"];
        readonly minDuration: 5;
        readonly maxDuration: 12;
    };
    readonly "seedance2.0_vip": {
        readonly videoResolutions: readonly ["720p", "1080p", "4k"];
        readonly minDuration: 4;
        readonly maxDuration: 15;
    };
    readonly "seedance2.5": {
        readonly videoResolutions: readonly ["480p", "720p"];
        readonly minDuration: 4;
        readonly maxDuration: 30;
    };
};
export declare const dreaminaGenerationCapabilityMetadata: {
    readonly image2image: {
        readonly maxReferenceImages: 10;
    };
    readonly image2video: {
        readonly maxReferenceImages: 1;
    };
    readonly frames2video: {
        readonly maxReferenceImages: 2;
    };
    readonly multiframe2video: {
        readonly minReferenceImages: 2;
        readonly maxReferenceImages: 20;
        readonly minDuration: 1;
        readonly maxDuration: 8;
    };
    readonly multimodal2video: {
        readonly default: {
            readonly maxReferenceImages: 9;
            readonly maxReferenceVideos: 3;
            readonly maxReferenceAudios: 3;
            readonly maxReferences: 12;
            readonly requiresVisualReference: true;
        };
        readonly "seedance2.5": {
            readonly maxReferenceImages: 30;
            readonly maxReferenceVideos: 10;
            readonly maxReferenceAudios: 10;
            readonly maxReferences: 50;
            readonly requiresVisualReference: false;
        };
    };
};
export declare function dreaminaVideoModelCapability(model: string): DreaminaVideoModelCapability;
export declare function dreaminaMaxReferenceImages(operation: string, model: string): 0 | 1 | 2 | 9 | 10 | 30;
export declare const dreaminaGenerationSchemas: readonly [z.ZodObject<{
    operation: z.ZodLiteral<"text2image">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodString;
    modelVersion: z.ZodOptional<z.ZodEnum<["3.0", "3.1", "4.0", "4.1", "4.5", "4.6", "4.7", "5.0", "5.0Pro"]>>;
    ratio: z.ZodOptional<z.ZodEnum<["21:9", "16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16"]>>;
    resolutionType: z.ZodOptional<z.ZodEnum<["1k", "2k", "4k"]>>;
    generateNum: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    operation: "text2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "3.0" | "3.1" | "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
}, {
    operation: "text2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "3.0" | "3.1" | "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
}>, z.ZodObject<{
    operation: z.ZodLiteral<"image2image">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodString;
    modelVersion: z.ZodOptional<z.ZodEnum<["4.0", "4.1", "4.5", "4.6", "4.7", "5.0", "5.0Pro"]>>;
    ratio: z.ZodOptional<z.ZodEnum<["21:9", "16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16"]>>;
    resolutionType: z.ZodOptional<z.ZodEnum<["1k", "2k", "4k"]>>;
    generateNum: z.ZodOptional<z.ZodNumber>;
    referenceImages: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    operation: "image2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
    referenceImages: string[];
}, {
    operation: "image2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
    referenceImages: string[];
}>, z.ZodObject<{
    operation: z.ZodLiteral<"image_upscale">;
    idempotencyKey: z.ZodString;
    resolutionType: z.ZodEnum<["2k", "4k", "8k"]>;
    referenceImages: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    operation: "image_upscale";
    idempotencyKey: string;
    resolutionType: "2k" | "4k" | "8k";
    referenceImages: string[];
}, {
    operation: "image_upscale";
    idempotencyKey: string;
    resolutionType: "2k" | "4k" | "8k";
    referenceImages: string[];
}>, z.ZodObject<{
    operation: z.ZodLiteral<"text2video">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodString;
    modelVersion: z.ZodOptional<z.ZodEnum<["seedance2.0", "seedance2.0fast", "seedance2.0_vip", "seedance2.0fast_vip", "seedance2.0mini", "seedance2.5"]>>;
    ratio: z.ZodOptional<z.ZodEnum<["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"]>>;
    videoResolution: z.ZodEnum<["480p", "720p", "1080p", "4k"]>;
    duration: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    operation: "text2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
}, {
    operation: "text2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
}>, z.ZodObject<{
    operation: z.ZodLiteral<"image2video">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodString;
    modelVersion: z.ZodOptional<z.ZodEnum<["seedance1.0fast", "seedance1.5pro", "seedance2.0", "seedance2.0fast", "seedance2.0_vip", "seedance2.0fast_vip", "seedance2.0mini", "seedance2.5"]>>;
    videoResolution: z.ZodEnum<["480p", "720p", "1080p", "4k"]>;
    duration: z.ZodOptional<z.ZodNumber>;
    referenceImages: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    operation: "image2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.0fast" | "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
}, {
    operation: "image2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.0fast" | "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
}>, z.ZodObject<{
    operation: z.ZodLiteral<"frames2video">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodString;
    modelVersion: z.ZodOptional<z.ZodEnum<["seedance1.5pro", "seedance2.0", "seedance2.0fast", "seedance2.0_vip", "seedance2.0fast_vip", "seedance2.0mini", "seedance2.5"]>>;
    videoResolution: z.ZodEnum<["480p", "720p", "1080p", "4k"]>;
    duration: z.ZodOptional<z.ZodNumber>;
    referenceImages: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    operation: "frames2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
}, {
    operation: "frames2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
}>, z.ZodObject<{
    operation: z.ZodLiteral<"multiframe2video">;
    idempotencyKey: z.ZodString;
    videoResolution: z.ZodEnum<["720p", "1080p"]>;
    referenceImages: z.ZodArray<z.ZodString, "many">;
    prompt: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodNumber>;
    transitionPrompts: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    transitionDurations: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strict", z.ZodTypeAny, {
    operation: "multiframe2video";
    idempotencyKey: string;
    videoResolution: "1080p" | "720p";
    referenceImages: string[];
    prompt?: string | undefined;
    duration?: number | undefined;
    transitionPrompts?: string[] | undefined;
    transitionDurations?: number[] | undefined;
}, {
    operation: "multiframe2video";
    idempotencyKey: string;
    videoResolution: "1080p" | "720p";
    referenceImages: string[];
    prompt?: string | undefined;
    duration?: number | undefined;
    transitionPrompts?: string[] | undefined;
    transitionDurations?: number[] | undefined;
}>, z.ZodObject<{
    operation: z.ZodLiteral<"multimodal2video">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodOptional<z.ZodString>;
    modelVersion: z.ZodOptional<z.ZodEnum<["seedance2.0", "seedance2.0fast", "seedance2.0_vip", "seedance2.0fast_vip", "seedance2.0mini", "seedance2.5"]>>;
    ratio: z.ZodOptional<z.ZodEnum<["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"]>>;
    videoResolution: z.ZodEnum<["480p", "720p", "1080p", "4k"]>;
    duration: z.ZodOptional<z.ZodNumber>;
    referenceImages: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    referenceVideos: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    referenceAudios: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strict", z.ZodTypeAny, {
    operation: "multimodal2video";
    idempotencyKey: string;
    prompt?: string | undefined;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages?: string[] | undefined;
    referenceVideos?: string[] | undefined;
    referenceAudios?: string[] | undefined;
}, {
    operation: "multimodal2video";
    idempotencyKey: string;
    prompt?: string | undefined;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages?: string[] | undefined;
    referenceVideos?: string[] | undefined;
    referenceAudios?: string[] | undefined;
}>];
declare const generationDiscriminatedSchema: z.ZodDiscriminatedUnion<"operation", readonly [z.ZodObject<{
    operation: z.ZodLiteral<"text2image">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodString;
    modelVersion: z.ZodOptional<z.ZodEnum<["3.0", "3.1", "4.0", "4.1", "4.5", "4.6", "4.7", "5.0", "5.0Pro"]>>;
    ratio: z.ZodOptional<z.ZodEnum<["21:9", "16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16"]>>;
    resolutionType: z.ZodOptional<z.ZodEnum<["1k", "2k", "4k"]>>;
    generateNum: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    operation: "text2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "3.0" | "3.1" | "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
}, {
    operation: "text2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "3.0" | "3.1" | "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
}>, z.ZodObject<{
    operation: z.ZodLiteral<"image2image">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodString;
    modelVersion: z.ZodOptional<z.ZodEnum<["4.0", "4.1", "4.5", "4.6", "4.7", "5.0", "5.0Pro"]>>;
    ratio: z.ZodOptional<z.ZodEnum<["21:9", "16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16"]>>;
    resolutionType: z.ZodOptional<z.ZodEnum<["1k", "2k", "4k"]>>;
    generateNum: z.ZodOptional<z.ZodNumber>;
    referenceImages: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    operation: "image2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
    referenceImages: string[];
}, {
    operation: "image2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
    referenceImages: string[];
}>, z.ZodObject<{
    operation: z.ZodLiteral<"image_upscale">;
    idempotencyKey: z.ZodString;
    resolutionType: z.ZodEnum<["2k", "4k", "8k"]>;
    referenceImages: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    operation: "image_upscale";
    idempotencyKey: string;
    resolutionType: "2k" | "4k" | "8k";
    referenceImages: string[];
}, {
    operation: "image_upscale";
    idempotencyKey: string;
    resolutionType: "2k" | "4k" | "8k";
    referenceImages: string[];
}>, z.ZodObject<{
    operation: z.ZodLiteral<"text2video">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodString;
    modelVersion: z.ZodOptional<z.ZodEnum<["seedance2.0", "seedance2.0fast", "seedance2.0_vip", "seedance2.0fast_vip", "seedance2.0mini", "seedance2.5"]>>;
    ratio: z.ZodOptional<z.ZodEnum<["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"]>>;
    videoResolution: z.ZodEnum<["480p", "720p", "1080p", "4k"]>;
    duration: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    operation: "text2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
}, {
    operation: "text2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
}>, z.ZodObject<{
    operation: z.ZodLiteral<"image2video">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodString;
    modelVersion: z.ZodOptional<z.ZodEnum<["seedance1.0fast", "seedance1.5pro", "seedance2.0", "seedance2.0fast", "seedance2.0_vip", "seedance2.0fast_vip", "seedance2.0mini", "seedance2.5"]>>;
    videoResolution: z.ZodEnum<["480p", "720p", "1080p", "4k"]>;
    duration: z.ZodOptional<z.ZodNumber>;
    referenceImages: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    operation: "image2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.0fast" | "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
}, {
    operation: "image2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.0fast" | "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
}>, z.ZodObject<{
    operation: z.ZodLiteral<"frames2video">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodString;
    modelVersion: z.ZodOptional<z.ZodEnum<["seedance1.5pro", "seedance2.0", "seedance2.0fast", "seedance2.0_vip", "seedance2.0fast_vip", "seedance2.0mini", "seedance2.5"]>>;
    videoResolution: z.ZodEnum<["480p", "720p", "1080p", "4k"]>;
    duration: z.ZodOptional<z.ZodNumber>;
    referenceImages: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    operation: "frames2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
}, {
    operation: "frames2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
}>, z.ZodObject<{
    operation: z.ZodLiteral<"multiframe2video">;
    idempotencyKey: z.ZodString;
    videoResolution: z.ZodEnum<["720p", "1080p"]>;
    referenceImages: z.ZodArray<z.ZodString, "many">;
    prompt: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodNumber>;
    transitionPrompts: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    transitionDurations: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strict", z.ZodTypeAny, {
    operation: "multiframe2video";
    idempotencyKey: string;
    videoResolution: "1080p" | "720p";
    referenceImages: string[];
    prompt?: string | undefined;
    duration?: number | undefined;
    transitionPrompts?: string[] | undefined;
    transitionDurations?: number[] | undefined;
}, {
    operation: "multiframe2video";
    idempotencyKey: string;
    videoResolution: "1080p" | "720p";
    referenceImages: string[];
    prompt?: string | undefined;
    duration?: number | undefined;
    transitionPrompts?: string[] | undefined;
    transitionDurations?: number[] | undefined;
}>, z.ZodObject<{
    operation: z.ZodLiteral<"multimodal2video">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodOptional<z.ZodString>;
    modelVersion: z.ZodOptional<z.ZodEnum<["seedance2.0", "seedance2.0fast", "seedance2.0_vip", "seedance2.0fast_vip", "seedance2.0mini", "seedance2.5"]>>;
    ratio: z.ZodOptional<z.ZodEnum<["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"]>>;
    videoResolution: z.ZodEnum<["480p", "720p", "1080p", "4k"]>;
    duration: z.ZodOptional<z.ZodNumber>;
    referenceImages: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    referenceVideos: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    referenceAudios: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strict", z.ZodTypeAny, {
    operation: "multimodal2video";
    idempotencyKey: string;
    prompt?: string | undefined;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages?: string[] | undefined;
    referenceVideos?: string[] | undefined;
    referenceAudios?: string[] | undefined;
}, {
    operation: "multimodal2video";
    idempotencyKey: string;
    prompt?: string | undefined;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages?: string[] | undefined;
    referenceVideos?: string[] | undefined;
    referenceAudios?: string[] | undefined;
}>]>;
declare const discriminatedSchema: z.ZodDiscriminatedUnion<"operation", readonly [z.ZodObject<{
    operation: z.ZodLiteral<"text2image">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodString;
    modelVersion: z.ZodOptional<z.ZodEnum<["3.0", "3.1", "4.0", "4.1", "4.5", "4.6", "4.7", "5.0", "5.0Pro"]>>;
    ratio: z.ZodOptional<z.ZodEnum<["21:9", "16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16"]>>;
    resolutionType: z.ZodOptional<z.ZodEnum<["1k", "2k", "4k"]>>;
    generateNum: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    operation: "text2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "3.0" | "3.1" | "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
}, {
    operation: "text2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "3.0" | "3.1" | "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
}>, z.ZodObject<{
    operation: z.ZodLiteral<"image2image">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodString;
    modelVersion: z.ZodOptional<z.ZodEnum<["4.0", "4.1", "4.5", "4.6", "4.7", "5.0", "5.0Pro"]>>;
    ratio: z.ZodOptional<z.ZodEnum<["21:9", "16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16"]>>;
    resolutionType: z.ZodOptional<z.ZodEnum<["1k", "2k", "4k"]>>;
    generateNum: z.ZodOptional<z.ZodNumber>;
    referenceImages: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    operation: "image2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
    referenceImages: string[];
}, {
    operation: "image2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
    referenceImages: string[];
}>, z.ZodObject<{
    operation: z.ZodLiteral<"image_upscale">;
    idempotencyKey: z.ZodString;
    resolutionType: z.ZodEnum<["2k", "4k", "8k"]>;
    referenceImages: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    operation: "image_upscale";
    idempotencyKey: string;
    resolutionType: "2k" | "4k" | "8k";
    referenceImages: string[];
}, {
    operation: "image_upscale";
    idempotencyKey: string;
    resolutionType: "2k" | "4k" | "8k";
    referenceImages: string[];
}>, z.ZodObject<{
    operation: z.ZodLiteral<"text2video">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodString;
    modelVersion: z.ZodOptional<z.ZodEnum<["seedance2.0", "seedance2.0fast", "seedance2.0_vip", "seedance2.0fast_vip", "seedance2.0mini", "seedance2.5"]>>;
    ratio: z.ZodOptional<z.ZodEnum<["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"]>>;
    videoResolution: z.ZodEnum<["480p", "720p", "1080p", "4k"]>;
    duration: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    operation: "text2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
}, {
    operation: "text2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
}>, z.ZodObject<{
    operation: z.ZodLiteral<"image2video">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodString;
    modelVersion: z.ZodOptional<z.ZodEnum<["seedance1.0fast", "seedance1.5pro", "seedance2.0", "seedance2.0fast", "seedance2.0_vip", "seedance2.0fast_vip", "seedance2.0mini", "seedance2.5"]>>;
    videoResolution: z.ZodEnum<["480p", "720p", "1080p", "4k"]>;
    duration: z.ZodOptional<z.ZodNumber>;
    referenceImages: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    operation: "image2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.0fast" | "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
}, {
    operation: "image2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.0fast" | "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
}>, z.ZodObject<{
    operation: z.ZodLiteral<"frames2video">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodString;
    modelVersion: z.ZodOptional<z.ZodEnum<["seedance1.5pro", "seedance2.0", "seedance2.0fast", "seedance2.0_vip", "seedance2.0fast_vip", "seedance2.0mini", "seedance2.5"]>>;
    videoResolution: z.ZodEnum<["480p", "720p", "1080p", "4k"]>;
    duration: z.ZodOptional<z.ZodNumber>;
    referenceImages: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    operation: "frames2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
}, {
    operation: "frames2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
}>, z.ZodObject<{
    operation: z.ZodLiteral<"multiframe2video">;
    idempotencyKey: z.ZodString;
    videoResolution: z.ZodEnum<["720p", "1080p"]>;
    referenceImages: z.ZodArray<z.ZodString, "many">;
    prompt: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodNumber>;
    transitionPrompts: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    transitionDurations: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strict", z.ZodTypeAny, {
    operation: "multiframe2video";
    idempotencyKey: string;
    videoResolution: "1080p" | "720p";
    referenceImages: string[];
    prompt?: string | undefined;
    duration?: number | undefined;
    transitionPrompts?: string[] | undefined;
    transitionDurations?: number[] | undefined;
}, {
    operation: "multiframe2video";
    idempotencyKey: string;
    videoResolution: "1080p" | "720p";
    referenceImages: string[];
    prompt?: string | undefined;
    duration?: number | undefined;
    transitionPrompts?: string[] | undefined;
    transitionDurations?: number[] | undefined;
}>, z.ZodObject<{
    operation: z.ZodLiteral<"multimodal2video">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodOptional<z.ZodString>;
    modelVersion: z.ZodOptional<z.ZodEnum<["seedance2.0", "seedance2.0fast", "seedance2.0_vip", "seedance2.0fast_vip", "seedance2.0mini", "seedance2.5"]>>;
    ratio: z.ZodOptional<z.ZodEnum<["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"]>>;
    videoResolution: z.ZodEnum<["480p", "720p", "1080p", "4k"]>;
    duration: z.ZodOptional<z.ZodNumber>;
    referenceImages: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    referenceVideos: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    referenceAudios: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strict", z.ZodTypeAny, {
    operation: "multimodal2video";
    idempotencyKey: string;
    prompt?: string | undefined;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages?: string[] | undefined;
    referenceVideos?: string[] | undefined;
    referenceAudios?: string[] | undefined;
}, {
    operation: "multimodal2video";
    idempotencyKey: string;
    prompt?: string | undefined;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages?: string[] | undefined;
    referenceVideos?: string[] | undefined;
    referenceAudios?: string[] | undefined;
}>, z.ZodObject<{
    operation: z.ZodLiteral<"query_result">;
    submitId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    operation: "query_result";
    submitId: string;
}, {
    operation: "query_result";
    submitId: string;
}>]>;
export type DreaminaCliInput = z.infer<typeof discriminatedSchema>;
export type DreaminaGenerationInput = z.infer<typeof generationDiscriminatedSchema>;
export declare const dreaminaGenerationInputSchema: z.ZodEffects<z.ZodDiscriminatedUnion<"operation", readonly [z.ZodObject<{
    operation: z.ZodLiteral<"text2image">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodString;
    modelVersion: z.ZodOptional<z.ZodEnum<["3.0", "3.1", "4.0", "4.1", "4.5", "4.6", "4.7", "5.0", "5.0Pro"]>>;
    ratio: z.ZodOptional<z.ZodEnum<["21:9", "16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16"]>>;
    resolutionType: z.ZodOptional<z.ZodEnum<["1k", "2k", "4k"]>>;
    generateNum: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    operation: "text2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "3.0" | "3.1" | "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
}, {
    operation: "text2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "3.0" | "3.1" | "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
}>, z.ZodObject<{
    operation: z.ZodLiteral<"image2image">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodString;
    modelVersion: z.ZodOptional<z.ZodEnum<["4.0", "4.1", "4.5", "4.6", "4.7", "5.0", "5.0Pro"]>>;
    ratio: z.ZodOptional<z.ZodEnum<["21:9", "16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16"]>>;
    resolutionType: z.ZodOptional<z.ZodEnum<["1k", "2k", "4k"]>>;
    generateNum: z.ZodOptional<z.ZodNumber>;
    referenceImages: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    operation: "image2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
    referenceImages: string[];
}, {
    operation: "image2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
    referenceImages: string[];
}>, z.ZodObject<{
    operation: z.ZodLiteral<"image_upscale">;
    idempotencyKey: z.ZodString;
    resolutionType: z.ZodEnum<["2k", "4k", "8k"]>;
    referenceImages: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    operation: "image_upscale";
    idempotencyKey: string;
    resolutionType: "2k" | "4k" | "8k";
    referenceImages: string[];
}, {
    operation: "image_upscale";
    idempotencyKey: string;
    resolutionType: "2k" | "4k" | "8k";
    referenceImages: string[];
}>, z.ZodObject<{
    operation: z.ZodLiteral<"text2video">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodString;
    modelVersion: z.ZodOptional<z.ZodEnum<["seedance2.0", "seedance2.0fast", "seedance2.0_vip", "seedance2.0fast_vip", "seedance2.0mini", "seedance2.5"]>>;
    ratio: z.ZodOptional<z.ZodEnum<["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"]>>;
    videoResolution: z.ZodEnum<["480p", "720p", "1080p", "4k"]>;
    duration: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    operation: "text2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
}, {
    operation: "text2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
}>, z.ZodObject<{
    operation: z.ZodLiteral<"image2video">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodString;
    modelVersion: z.ZodOptional<z.ZodEnum<["seedance1.0fast", "seedance1.5pro", "seedance2.0", "seedance2.0fast", "seedance2.0_vip", "seedance2.0fast_vip", "seedance2.0mini", "seedance2.5"]>>;
    videoResolution: z.ZodEnum<["480p", "720p", "1080p", "4k"]>;
    duration: z.ZodOptional<z.ZodNumber>;
    referenceImages: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    operation: "image2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.0fast" | "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
}, {
    operation: "image2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.0fast" | "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
}>, z.ZodObject<{
    operation: z.ZodLiteral<"frames2video">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodString;
    modelVersion: z.ZodOptional<z.ZodEnum<["seedance1.5pro", "seedance2.0", "seedance2.0fast", "seedance2.0_vip", "seedance2.0fast_vip", "seedance2.0mini", "seedance2.5"]>>;
    videoResolution: z.ZodEnum<["480p", "720p", "1080p", "4k"]>;
    duration: z.ZodOptional<z.ZodNumber>;
    referenceImages: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    operation: "frames2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
}, {
    operation: "frames2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
}>, z.ZodObject<{
    operation: z.ZodLiteral<"multiframe2video">;
    idempotencyKey: z.ZodString;
    videoResolution: z.ZodEnum<["720p", "1080p"]>;
    referenceImages: z.ZodArray<z.ZodString, "many">;
    prompt: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodNumber>;
    transitionPrompts: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    transitionDurations: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strict", z.ZodTypeAny, {
    operation: "multiframe2video";
    idempotencyKey: string;
    videoResolution: "1080p" | "720p";
    referenceImages: string[];
    prompt?: string | undefined;
    duration?: number | undefined;
    transitionPrompts?: string[] | undefined;
    transitionDurations?: number[] | undefined;
}, {
    operation: "multiframe2video";
    idempotencyKey: string;
    videoResolution: "1080p" | "720p";
    referenceImages: string[];
    prompt?: string | undefined;
    duration?: number | undefined;
    transitionPrompts?: string[] | undefined;
    transitionDurations?: number[] | undefined;
}>, z.ZodObject<{
    operation: z.ZodLiteral<"multimodal2video">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodOptional<z.ZodString>;
    modelVersion: z.ZodOptional<z.ZodEnum<["seedance2.0", "seedance2.0fast", "seedance2.0_vip", "seedance2.0fast_vip", "seedance2.0mini", "seedance2.5"]>>;
    ratio: z.ZodOptional<z.ZodEnum<["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"]>>;
    videoResolution: z.ZodEnum<["480p", "720p", "1080p", "4k"]>;
    duration: z.ZodOptional<z.ZodNumber>;
    referenceImages: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    referenceVideos: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    referenceAudios: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strict", z.ZodTypeAny, {
    operation: "multimodal2video";
    idempotencyKey: string;
    prompt?: string | undefined;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages?: string[] | undefined;
    referenceVideos?: string[] | undefined;
    referenceAudios?: string[] | undefined;
}, {
    operation: "multimodal2video";
    idempotencyKey: string;
    prompt?: string | undefined;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages?: string[] | undefined;
    referenceVideos?: string[] | undefined;
    referenceAudios?: string[] | undefined;
}>]>, {
    operation: "text2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "3.0" | "3.1" | "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
} | {
    operation: "image2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
    referenceImages: string[];
} | {
    operation: "image_upscale";
    idempotencyKey: string;
    resolutionType: "2k" | "4k" | "8k";
    referenceImages: string[];
} | {
    operation: "text2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
} | {
    operation: "image2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.0fast" | "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
} | {
    operation: "frames2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
} | {
    operation: "multiframe2video";
    idempotencyKey: string;
    videoResolution: "1080p" | "720p";
    referenceImages: string[];
    prompt?: string | undefined;
    duration?: number | undefined;
    transitionPrompts?: string[] | undefined;
    transitionDurations?: number[] | undefined;
} | {
    operation: "multimodal2video";
    idempotencyKey: string;
    prompt?: string | undefined;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages?: string[] | undefined;
    referenceVideos?: string[] | undefined;
    referenceAudios?: string[] | undefined;
}, {
    operation: "text2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "3.0" | "3.1" | "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
} | {
    operation: "image2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
    referenceImages: string[];
} | {
    operation: "image_upscale";
    idempotencyKey: string;
    resolutionType: "2k" | "4k" | "8k";
    referenceImages: string[];
} | {
    operation: "text2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
} | {
    operation: "image2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.0fast" | "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
} | {
    operation: "frames2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
} | {
    operation: "multiframe2video";
    idempotencyKey: string;
    videoResolution: "1080p" | "720p";
    referenceImages: string[];
    prompt?: string | undefined;
    duration?: number | undefined;
    transitionPrompts?: string[] | undefined;
    transitionDurations?: number[] | undefined;
} | {
    operation: "multimodal2video";
    idempotencyKey: string;
    prompt?: string | undefined;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages?: string[] | undefined;
    referenceVideos?: string[] | undefined;
    referenceAudios?: string[] | undefined;
}>;
export declare const dreaminaCliInputSchema: z.ZodEffects<z.ZodDiscriminatedUnion<"operation", readonly [z.ZodObject<{
    operation: z.ZodLiteral<"text2image">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodString;
    modelVersion: z.ZodOptional<z.ZodEnum<["3.0", "3.1", "4.0", "4.1", "4.5", "4.6", "4.7", "5.0", "5.0Pro"]>>;
    ratio: z.ZodOptional<z.ZodEnum<["21:9", "16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16"]>>;
    resolutionType: z.ZodOptional<z.ZodEnum<["1k", "2k", "4k"]>>;
    generateNum: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    operation: "text2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "3.0" | "3.1" | "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
}, {
    operation: "text2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "3.0" | "3.1" | "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
}>, z.ZodObject<{
    operation: z.ZodLiteral<"image2image">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodString;
    modelVersion: z.ZodOptional<z.ZodEnum<["4.0", "4.1", "4.5", "4.6", "4.7", "5.0", "5.0Pro"]>>;
    ratio: z.ZodOptional<z.ZodEnum<["21:9", "16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16"]>>;
    resolutionType: z.ZodOptional<z.ZodEnum<["1k", "2k", "4k"]>>;
    generateNum: z.ZodOptional<z.ZodNumber>;
    referenceImages: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    operation: "image2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
    referenceImages: string[];
}, {
    operation: "image2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
    referenceImages: string[];
}>, z.ZodObject<{
    operation: z.ZodLiteral<"image_upscale">;
    idempotencyKey: z.ZodString;
    resolutionType: z.ZodEnum<["2k", "4k", "8k"]>;
    referenceImages: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    operation: "image_upscale";
    idempotencyKey: string;
    resolutionType: "2k" | "4k" | "8k";
    referenceImages: string[];
}, {
    operation: "image_upscale";
    idempotencyKey: string;
    resolutionType: "2k" | "4k" | "8k";
    referenceImages: string[];
}>, z.ZodObject<{
    operation: z.ZodLiteral<"text2video">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodString;
    modelVersion: z.ZodOptional<z.ZodEnum<["seedance2.0", "seedance2.0fast", "seedance2.0_vip", "seedance2.0fast_vip", "seedance2.0mini", "seedance2.5"]>>;
    ratio: z.ZodOptional<z.ZodEnum<["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"]>>;
    videoResolution: z.ZodEnum<["480p", "720p", "1080p", "4k"]>;
    duration: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    operation: "text2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
}, {
    operation: "text2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
}>, z.ZodObject<{
    operation: z.ZodLiteral<"image2video">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodString;
    modelVersion: z.ZodOptional<z.ZodEnum<["seedance1.0fast", "seedance1.5pro", "seedance2.0", "seedance2.0fast", "seedance2.0_vip", "seedance2.0fast_vip", "seedance2.0mini", "seedance2.5"]>>;
    videoResolution: z.ZodEnum<["480p", "720p", "1080p", "4k"]>;
    duration: z.ZodOptional<z.ZodNumber>;
    referenceImages: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    operation: "image2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.0fast" | "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
}, {
    operation: "image2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.0fast" | "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
}>, z.ZodObject<{
    operation: z.ZodLiteral<"frames2video">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodString;
    modelVersion: z.ZodOptional<z.ZodEnum<["seedance1.5pro", "seedance2.0", "seedance2.0fast", "seedance2.0_vip", "seedance2.0fast_vip", "seedance2.0mini", "seedance2.5"]>>;
    videoResolution: z.ZodEnum<["480p", "720p", "1080p", "4k"]>;
    duration: z.ZodOptional<z.ZodNumber>;
    referenceImages: z.ZodArray<z.ZodString, "many">;
}, "strict", z.ZodTypeAny, {
    operation: "frames2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
}, {
    operation: "frames2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
}>, z.ZodObject<{
    operation: z.ZodLiteral<"multiframe2video">;
    idempotencyKey: z.ZodString;
    videoResolution: z.ZodEnum<["720p", "1080p"]>;
    referenceImages: z.ZodArray<z.ZodString, "many">;
    prompt: z.ZodOptional<z.ZodString>;
    duration: z.ZodOptional<z.ZodNumber>;
    transitionPrompts: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    transitionDurations: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strict", z.ZodTypeAny, {
    operation: "multiframe2video";
    idempotencyKey: string;
    videoResolution: "1080p" | "720p";
    referenceImages: string[];
    prompt?: string | undefined;
    duration?: number | undefined;
    transitionPrompts?: string[] | undefined;
    transitionDurations?: number[] | undefined;
}, {
    operation: "multiframe2video";
    idempotencyKey: string;
    videoResolution: "1080p" | "720p";
    referenceImages: string[];
    prompt?: string | undefined;
    duration?: number | undefined;
    transitionPrompts?: string[] | undefined;
    transitionDurations?: number[] | undefined;
}>, z.ZodObject<{
    operation: z.ZodLiteral<"multimodal2video">;
    idempotencyKey: z.ZodString;
    prompt: z.ZodOptional<z.ZodString>;
    modelVersion: z.ZodOptional<z.ZodEnum<["seedance2.0", "seedance2.0fast", "seedance2.0_vip", "seedance2.0fast_vip", "seedance2.0mini", "seedance2.5"]>>;
    ratio: z.ZodOptional<z.ZodEnum<["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"]>>;
    videoResolution: z.ZodEnum<["480p", "720p", "1080p", "4k"]>;
    duration: z.ZodOptional<z.ZodNumber>;
    referenceImages: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    referenceVideos: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    referenceAudios: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strict", z.ZodTypeAny, {
    operation: "multimodal2video";
    idempotencyKey: string;
    prompt?: string | undefined;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages?: string[] | undefined;
    referenceVideos?: string[] | undefined;
    referenceAudios?: string[] | undefined;
}, {
    operation: "multimodal2video";
    idempotencyKey: string;
    prompt?: string | undefined;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages?: string[] | undefined;
    referenceVideos?: string[] | undefined;
    referenceAudios?: string[] | undefined;
}>, z.ZodObject<{
    operation: z.ZodLiteral<"query_result">;
    submitId: z.ZodString;
}, "strict", z.ZodTypeAny, {
    operation: "query_result";
    submitId: string;
}, {
    operation: "query_result";
    submitId: string;
}>]>, {
    operation: "text2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "3.0" | "3.1" | "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
} | {
    operation: "image2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
    referenceImages: string[];
} | {
    operation: "image_upscale";
    idempotencyKey: string;
    resolutionType: "2k" | "4k" | "8k";
    referenceImages: string[];
} | {
    operation: "text2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
} | {
    operation: "image2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.0fast" | "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
} | {
    operation: "frames2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
} | {
    operation: "multiframe2video";
    idempotencyKey: string;
    videoResolution: "1080p" | "720p";
    referenceImages: string[];
    prompt?: string | undefined;
    duration?: number | undefined;
    transitionPrompts?: string[] | undefined;
    transitionDurations?: number[] | undefined;
} | {
    operation: "multimodal2video";
    idempotencyKey: string;
    prompt?: string | undefined;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages?: string[] | undefined;
    referenceVideos?: string[] | undefined;
    referenceAudios?: string[] | undefined;
} | {
    operation: "query_result";
    submitId: string;
}, {
    operation: "text2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "3.0" | "3.1" | "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
} | {
    operation: "image2image";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | undefined;
    generateNum?: number | undefined;
    referenceImages: string[];
} | {
    operation: "image_upscale";
    idempotencyKey: string;
    resolutionType: "2k" | "4k" | "8k";
    referenceImages: string[];
} | {
    operation: "text2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
} | {
    operation: "image2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.0fast" | "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
} | {
    operation: "frames2video";
    idempotencyKey: string;
    prompt: string;
    modelVersion?: "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages: string[];
} | {
    operation: "multiframe2video";
    idempotencyKey: string;
    videoResolution: "1080p" | "720p";
    referenceImages: string[];
    prompt?: string | undefined;
    duration?: number | undefined;
    transitionPrompts?: string[] | undefined;
    transitionDurations?: number[] | undefined;
} | {
    operation: "multimodal2video";
    idempotencyKey: string;
    prompt?: string | undefined;
    modelVersion?: "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "3:4" | "4:3" | "9:16" | undefined;
    videoResolution: "1080p" | "480p" | "4k" | "720p";
    duration?: number | undefined;
    referenceImages?: string[] | undefined;
    referenceVideos?: string[] | undefined;
    referenceAudios?: string[] | undefined;
} | {
    operation: "query_result";
    submitId: string;
}>;
export declare const dreaminaMcpToolShape: z.ZodObject<{
    operation: z.ZodEnum<["text2image", "image2image", "image_upscale", "text2video", "image2video", "frames2video", "multiframe2video", "multimodal2video"]>;
    idempotencyKey: z.ZodString;
    prompt: z.ZodOptional<z.ZodString>;
    modelVersion: z.ZodOptional<z.ZodUnion<[z.ZodEnum<["3.0", "3.1", "4.0", "4.1", "4.5", "4.6", "4.7", "5.0", "5.0Pro"]>, z.ZodEnum<["seedance1.0fast", "seedance1.5pro", "seedance2.0", "seedance2.0fast", "seedance2.0_vip", "seedance2.0fast_vip", "seedance2.0mini", "seedance2.5"]>]>>;
    ratio: z.ZodOptional<z.ZodEnum<["21:9", "16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16"]>>;
    resolutionType: z.ZodOptional<z.ZodEnum<["1k", "2k", "4k", "8k"]>>;
    videoResolution: z.ZodOptional<z.ZodEnum<["480p", "720p", "1080p", "4k"]>>;
    duration: z.ZodOptional<z.ZodNumber>;
    generateNum: z.ZodOptional<z.ZodNumber>;
    referenceImages: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    referenceVideos: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    referenceAudios: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    transitionPrompts: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    transitionDurations: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
}, "strict", z.ZodTypeAny, {
    operation: "frames2video" | "image2image" | "image2video" | "image_upscale" | "multiframe2video" | "multimodal2video" | "text2image" | "text2video";
    idempotencyKey: string;
    prompt?: string | undefined;
    modelVersion?: "3.0" | "3.1" | "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | "seedance1.0fast" | "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | "8k" | undefined;
    videoResolution?: "1080p" | "480p" | "4k" | "720p" | undefined;
    duration?: number | undefined;
    generateNum?: number | undefined;
    referenceImages?: string[] | undefined;
    referenceVideos?: string[] | undefined;
    referenceAudios?: string[] | undefined;
    transitionPrompts?: string[] | undefined;
    transitionDurations?: number[] | undefined;
}, {
    operation: "frames2video" | "image2image" | "image2video" | "image_upscale" | "multiframe2video" | "multimodal2video" | "text2image" | "text2video";
    idempotencyKey: string;
    prompt?: string | undefined;
    modelVersion?: "3.0" | "3.1" | "4.0" | "4.1" | "4.5" | "4.6" | "4.7" | "5.0" | "5.0Pro" | "seedance1.0fast" | "seedance1.5pro" | "seedance2.0" | "seedance2.0_vip" | "seedance2.0fast" | "seedance2.0fast_vip" | "seedance2.0mini" | "seedance2.5" | undefined;
    ratio?: "16:9" | "1:1" | "21:9" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | undefined;
    resolutionType?: "1k" | "2k" | "4k" | "8k" | undefined;
    videoResolution?: "1080p" | "480p" | "4k" | "720p" | undefined;
    duration?: number | undefined;
    generateNum?: number | undefined;
    referenceImages?: string[] | undefined;
    referenceVideos?: string[] | undefined;
    referenceAudios?: string[] | undefined;
    transitionPrompts?: string[] | undefined;
    transitionDurations?: number[] | undefined;
}>;
export {};
