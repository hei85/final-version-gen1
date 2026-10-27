const audioCapabilityFields = [
    "tts",
    "voiceDesign",
    "voiceReference",
    "ambientSound",
    "soundEffects",
    "music",
    "speechRecognition",
    "alignment",
];
const audioCapabilityStatuses = new Set(["configured", "unsupported", "unknown"]);
export function normalizeFilmModelCatalog(value) {
    if (!isRecord(value) || !Array.isArray(value.models))
        return value;
    return {
        ...value,
        models: value.models.map((candidate) => {
            if (!isRecord(candidate) || candidate.capability !== "audio")
                return candidate;
            const supports = isRecord(candidate.supports) ? candidate.supports : {};
            const capabilities = isRecord(supports.audioCapabilities) ? supports.audioCapabilities : {};
            const audioCapabilities = { ...capabilities };
            for (const field of audioCapabilityFields) {
                if (!audioCapabilityStatuses.has(String(audioCapabilities[field] ?? "")))
                    audioCapabilities[field] = "unknown";
            }
            return { ...candidate, supports: { ...supports, audioCapabilities } };
        }),
    };
}
function isRecord(value) {
    return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
