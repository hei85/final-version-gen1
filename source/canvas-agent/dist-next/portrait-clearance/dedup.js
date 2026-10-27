import { cosineSimilarity, hammingDistance } from "./image-metrics.js";
export function deduplicatePortraitCandidates(candidates, mode) {
    const groups = [];
    const removed = new Set();
    const kept = new Map();
    const hashOwner = new Map();
    let byteDeduplicatedCount = 0;
    let visualDeduplicatedCount = 0;
    for (const candidate of candidates) {
        const previous = hashOwner.get(candidate.byteHash);
        if (previous) {
            const winner = preferredCandidate(previous, candidate);
            const loser = winner.id === previous.id ? candidate : previous;
            kept.set(winner.id, winner);
            removed.add(loser.id);
            hashOwner.set(candidate.byteHash, winner);
            byteDeduplicatedCount += 1;
            addGroup(groups, winner, loser, "byte-hash");
            continue;
        }
        hashOwner.set(candidate.byteHash, candidate);
        kept.set(candidate.id, candidate);
    }
    const active = [...kept.values()].filter((candidate) => !removed.has(candidate.id));
    for (let index = 0; index < active.length; index += 1) {
        const left = active[index];
        if (removed.has(left.id))
            continue;
        for (let nextIndex = index + 1; nextIndex < active.length; nextIndex += 1) {
            const right = active[nextIndex];
            if (removed.has(right.id) || hammingDistance(left.phash, right.phash) > 5)
                continue;
            const similarity = left.embedding && right.embedding ? cosineSimilarity(left.embedding, right.embedding) : undefined;
            if (mode === "arcface" && similarity !== undefined && similarity < 0.9)
                continue;
            const winner = preferredCandidate(left, right);
            const loser = winner.id === left.id ? right : left;
            removed.add(loser.id);
            kept.set(winner.id, winner);
            visualDeduplicatedCount += 1;
            addGroup(groups, winner, loser, mode === "arcface" && similarity !== undefined ? "phash-and-arcface" : "phash");
        }
    }
    const output = candidates.filter((candidate) => !removed.has(candidate.id));
    return {
        kept: output,
        groups,
        inputCount: candidates.length,
        outputCount: output.length,
        byteDeduplicatedCount,
        visualDeduplicatedCount,
        phashDistance: 5,
        ...(mode === "arcface" ? { arcfaceThreshold: 0.9 } : {}),
    };
}
function preferredCandidate(left, right) {
    return left.pixelArea > right.pixelArea || (left.pixelArea === right.pixelArea && left.byteSize >= right.byteSize) ? left : right;
}
function addGroup(groups, kept, removed, reason) {
    const existing = groups.find((group) => group.keptId === kept.id && group.reason === reason);
    if (existing)
        existing.removedIds.push(removed.id);
    else
        groups.push({ id: `dedup-${groups.length + 1}`, keptId: kept.id, removedIds: [removed.id], reason });
}
