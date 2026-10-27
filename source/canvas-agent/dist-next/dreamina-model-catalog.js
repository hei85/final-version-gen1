import { z } from "zod";
import { dreaminaGenerationSchemas, dreaminaMaxReferenceImages, dreaminaVideoModelCapability, } from "./dreamina-cli-contract.js";
// Dreamina has no safe discovery command: publish only capabilities enforced by run's Zod contract.
export function projectDreaminaModelCatalog(schemas = dreaminaGenerationSchemas) {
    const entries = new Map();
    for (const schema of schemas) {
        const operation = literalString(schema.shape.operation);
        const catalogOperation = operation ? catalogOperationFor(operation) : undefined;
        const models = enumOptions(schema.shape.modelVersion);
        if (!operation || !catalogOperation || !models)
            continue;
        const modality = catalogOperation.includes("image") && !catalogOperation.includes("video") ? "image" : "video";
        const aspects = enumOptions(schema.shape.ratio) ?? [];
        const tiers = enumOptions(schema.shape.resolutionType) ?? enumOptions(schema.shape.videoResolution) ?? [];
        for (const id of models) {
            const key = `${modality}:${id}`;
            const entry = entries.get(key) ?? { id, modality, operations: new Set(), aspects: new Set(), maxReferenceImages: 0, tiers: new Set() };
            entry.operations.add(catalogOperation);
            aspects.forEach((aspect) => entry.aspects.add(aspect));
            const capability = modality === "video" ? dreaminaVideoModelCapability(id) : undefined;
            tiers.filter((tier) => !capability || capability.videoResolutions.includes(tier)).forEach((tier) => entry.tiers.add(tier));
            entry.maxReferenceImages = Math.max(entry.maxReferenceImages, dreaminaMaxReferenceImages(operation, id));
            if (capability) {
                entry.minDuration = capability.minDuration;
                entry.maxDuration = capability.maxDuration;
            }
            entries.set(key, entry);
        }
    }
    return [...entries.values()].map((entry) => ({
        provider: "dreamina-cli",
        id: entry.id,
        displayName: entry.id,
        modality: entry.modality,
        adapterSupported: true,
        accountEntitlement: "unknown",
        currentlyObservedAvailable: "unknown",
        operations: [...entry.operations],
        settings: {
            aliases: [],
            aspects: [...entry.aspects],
            maxReferenceImages: entry.maxReferenceImages,
            ...(entry.minDuration === undefined ? {} : { minDuration: entry.minDuration }),
            ...(entry.maxDuration === undefined ? {} : { maxDuration: entry.maxDuration }),
            ...(entry.tiers.size ? { tiers: [...entry.tiers] } : {}),
        },
        source: "runtime-execution-contract",
    }));
}
function catalogOperationFor(operation) {
    switch (operation) {
        case "text2image": return "text-to-image";
        case "image2image": return "image-to-image";
        case "text2video": return "text-to-video";
        case "image2video": return "image-to-video";
        case "frames2video":
        case "multimodal2video": return "reference-to-video";
        default: return undefined;
    }
}
function literalString(value) {
    return value instanceof z.ZodLiteral && typeof value.value === "string" ? value.value : undefined;
}
function enumOptions(value) {
    const schema = value instanceof z.ZodOptional ? value.unwrap() : value;
    return schema instanceof z.ZodEnum ? schema.options : undefined;
}
