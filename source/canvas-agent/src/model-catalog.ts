const audioCapabilityFields = [
    "tts",
    "voiceDesign",
    "voiceReference",
    "ambientSound",
    "soundEffects",
    "music",
    "speechRecognition",
    "alignment",
] as const;

const audioCapabilityStatuses = new Set(["configured", "unsupported", "unknown"]);

export function normalizeFilmModelCatalog(value: unknown, request?: { model?: unknown; capability?: unknown }) {
    if (!isRecord(value) || !Array.isArray(value.models)) return value;
    const normalized: Record<string, unknown> = {
        ...value,
        models: value.models.map((candidate) => {
            if (!isRecord(candidate) || candidate.capability !== "audio") return candidate;
            const supports = isRecord(candidate.supports) ? candidate.supports : {};
            const capabilities = isRecord(supports.audioCapabilities) ? supports.audioCapabilities : {};
            const audioCapabilities = { ...capabilities };
            for (const field of audioCapabilityFields) {
                if (!audioCapabilityStatuses.has(String(audioCapabilities[field] ?? ""))) audioCapabilities[field] = "unknown";
            }
            return { ...candidate, supports: { ...supports, audioCapabilities } };
        }),
    };
    const requestedModel = typeof request?.model === "string" ? request.model.trim() : "";
    const requestedCapability = typeof request?.capability === "string" ? request.capability.trim() : "";
    if (requestedModel && requestedCapability) {
        const compatible = modelCatalogModelSupportsCapability(normalized, requestedModel, requestedCapability);
        if (compatible !== undefined) {
            normalized.requestedCompatible = compatible;
            normalized.requestedSubmissionReady = compatible && normalized.requestedSubmissionReady !== false;
        }
    }
    return normalized;
}

/** Return false when a known catalog entry cannot serve the requested mode. */
export function modelCatalogModelSupportsCapability(value: unknown, requestedModel: string, capability: string) {
    if (!isRecord(value) || !Array.isArray(value.models)) return undefined;
    const requested = canonicalModelName(requestedModel);
    const entry = value.models.find((candidate) => isRecord(candidate) && modelCandidateMatches(candidate, requested));
    if (!entry) return undefined;
    if (String(entry.capability || "").toLowerCase() !== capability.toLowerCase()) return false;
    if (!Array.isArray(value.compatible)) return true;
    return value.compatible.some((candidate) => isRecord(candidate) && modelCandidateMatches(candidate, requested));
}

function modelCandidateMatches(candidate: Record<string, unknown>, requested: string) {
    return [candidate.value, candidate.name, candidate.modelKey, candidate.model]
        .filter((value): value is string => typeof value === "string")
        .some((value) => canonicalModelName(value) === requested);
}

function canonicalModelName(value: string) {
    const trimmed = value.trim().toLowerCase();
    const separator = trimmed.lastIndexOf("::");
    return separator >= 0 ? trimmed.slice(separator + 2) : trimmed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
