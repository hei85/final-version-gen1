/** Resolve only files inside a skill package. External URLs and sibling skills are separate. */
export function skillPackageReferences(content: string, files: readonly { path: string }[], sourcePath = "SKILL.md") {
    const known = new Set(files.map((file) => file.path.replace(/\\/g, "/")));
    const candidates = [
        ...Array.from(content.matchAll(/(?<!!)\[[^\]\n]*\]\(\s*(?:<([^>\n]+)>|([^\s)]+))(?:\s+["'][^\n]*?["'])?\s*\)/g), (match) => ({ value: match[1] || match[2], literal: false })),
        ...Array.from(content.matchAll(/^\s*\[[^\]\n]+\]:\s*<?([^\s>]+)>?/gm), (match) => ({ value: match[1], literal: false })),
        ...Array.from(content.matchAll(/`([^`\n]+)`/g), (match) => ({ value: match[1], literal: true })),
    ];
    return [...new Set(candidates.flatMap((candidate) => {
        const path = resolveSkillPackagePath(candidate.value, sourcePath);
        if (!path || path === "SKILL.md") return [];
        if (known.has(path)) return [path];
        // Existing skills write package-root file names in backticks inside nested guides.
        const rootPath = candidate.literal ? resolveSkillPackagePath(candidate.value, "SKILL.md") : null;
        if (rootPath && known.has(rootPath)) return [rootPath];
        // A missing explicit Markdown guide is a dependency error, not silently optional.
        return !candidate.literal && /\.(?:md|txt|json|yaml|yml)$/i.test(path) ? [path] : [];
    }))];
}

function resolveSkillPackagePath(value: string, sourcePath: string) {
    let relative = value.trim().replace(/\\/g, "/");
    if (!relative || relative.startsWith("/") || relative.startsWith("#") || /^[a-z][a-z\d+.-]*:/i.test(relative)) return null;
    relative = relative.split(/[?#]/, 1)[0];
    try { relative = decodeURIComponent(relative); } catch { return null; }
    if (!relative || relative.startsWith("/") || /[:\0]/.test(relative)) return null;
    const parts = sourcePath.replace(/\\/g, "/").split("/").slice(0, -1);
    for (const segment of relative.split("/")) {
        if (!segment || segment === ".") continue;
        if (segment === "..") {
            if (!parts.length) return null;
            parts.pop();
        } else parts.push(segment);
    }
    return parts.join("/");
}

/** A short router may point to one sibling package instead of containing the workflow itself. */
export function skillRouterTarget(entry: string) {
    const body = entry.replace(/^---\r?\n[\s\S]*?\r?\n---/, "").trim();
    if (body.length > 600) return undefined;
    const targets = [...new Set(Array.from(body.matchAll(/\.\.\/([a-z\d_-]+)\/SKILL\.md\b/gi), (match) => match[1]))];
    return targets.length === 1 ? targets[0] : undefined;
}
