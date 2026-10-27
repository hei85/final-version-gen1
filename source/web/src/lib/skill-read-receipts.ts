type Identity = { skillId: string; versionId: string; contentHash: string };
type FileReceipt = { sha256: string; total: number; ranges: Array<[number, number]> };
type Preparation = { scope: string; updatedAt: number; files: Map<string, FileReceipt> };

const preparations = new Map<string, Preparation>();
const ttlMs = 30 * 60_000;
const maxPreparations = 64;
const maxFiles = 2048;

function prune(scope: string) {
    const now = Date.now();
    for (const [id, receipt] of preparations) {
        if (receipt.scope !== scope || now - receipt.updatedAt > ttlMs) preparations.delete(id);
    }
}

export function beginSkillPreparation(scope: string, requested?: string) {
    prune(scope);
    if (requested) {
        const receipt = preparations.get(requested);
        if (!receipt) throw new Error("技能读取会话已过期或不属于当前用户；请重新调用 skill_prepare，不要复用旧读取证据");
        receipt.updatedAt = Date.now();
        return requested;
    }
    if (preparations.size >= maxPreparations) {
        const oldest = [...preparations.entries()].sort((a, b) => a[1].updatedAt - b[1].updatedAt)[0];
        preparations.delete(oldest[0]);
    }
    const id = crypto.randomUUID();
    preparations.set(id, { scope, updatedAt: Date.now(), files: new Map() });
    return id;
}

function fileKey(identity: Identity, path: string) {
    return JSON.stringify([identity.skillId, identity.versionId, identity.contentHash, path]);
}

function preparation(scope: string, id: string) {
    prune(scope);
    const result = preparations.get(id);
    if (!result) throw new Error("技能读取会话已过期；重新调用 skill_prepare 后从新会话读取");
    result.updatedAt = Date.now();
    return result;
}

/** Receipt of characters returned by tools; it does not claim the Agent evaluated them. */
export function recordSkillRead(scope: string, id: string, identity: Identity, path: string, sha256: string, total: number, offset: number, count: number) {
    const context = preparation(scope, id);
    const key = fileKey(identity, path);
    let file = context.files.get(key);
    if (!file || file.sha256 !== sha256 || file.total !== total) {
        if (!context.files.has(key) && context.files.size >= maxFiles) throw new Error("当前技能读取会话文件过多；请按阶段拆分准备");
        file = { sha256, total, ranges: [] };
        context.files.set(key, file);
    }
    if (count > 0 && offset < total) {
        const ordered = [...file.ranges, [offset, Math.min(total, offset + count)] as [number, number]].sort((a, b) => a[0] - b[0]);
        const merged: Array<[number, number]> = [];
        for (const range of ordered) {
            const last = merged[merged.length - 1];
            if (last && range[0] <= last[1]) last[1] = Math.max(last[1], range[1]);
            else merged.push(range);
        }
        file.ranges = merged;
    }
}

export function skillReadProgress(scope: string, id: string, identity: Identity, path: string, sha256: string, total: number) {
    const file = preparation(scope, id).files.get(fileKey(identity, path));
    let nextOffset = 0;
    if (file && file.sha256 === sha256 && file.total === total) {
        for (const [start, end] of file.ranges) {
            if (start > nextOffset) break;
            nextOffset = Math.max(nextOffset, end);
        }
    }
    return { complete: nextOffset >= total, nextOffset: nextOffset >= total ? null : nextOffset };
}
