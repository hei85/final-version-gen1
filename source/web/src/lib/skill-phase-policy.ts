type PhasePolicy = { version: 1; commonReads: string[]; phaseReads: Record<string, string[]>; commonTools: string[]; phaseTools: Record<string, string[]> };

/** Explicit package policy keeps conditional guides out of the mandatory read/dependency graph. */
export function parseSkillPhasePolicy(content: string): PhasePolicy {
    const raw = JSON.parse(content) as Partial<PhasePolicy>;
    if (raw.version !== 1) throw new Error("不支持的技能阶段读取规则版本");
    const list = (value: unknown, tool: boolean) => {
        if (!Array.isArray(value) || value.some(item => typeof item !== "string" || (tool
            ? !/^(?:canvas|film|project|skill|runtime)_[a-z0-9_]+$/.test(item)
            : !/^(?:references|agents|scripts)\/[a-zA-Z0-9_./-]+$/.test(item) || item.split("/").some(part => part === ".." || part === "")))) throw new Error("技能阶段读取规则包含非法路径或工具名");
        return [...new Set(value)] as string[];
    };
    const phases = (value: unknown, tool: boolean) => {
        if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("技能阶段读取规则缺少阶段表");
        return Object.fromEntries(Object.entries(value).map(([phase, reads]) => [phase, list(reads, tool)]));
    };
    return { version: 1, commonReads: list(raw.commonReads, false), commonTools: list(raw.commonTools, true), phaseReads: phases(raw.phaseReads, false), phaseTools: phases(raw.phaseTools, true) };
}

export function skillPhaseRequirements(policy: PhasePolicy, phase: string) {
    const normalized = phase.trim().toLowerCase();
    const key = normalized in policy.phaseReads ? normalized : "planning";
    return { paths: [...new Set([...policy.commonReads, ...(policy.phaseReads[key] || [])])], tools: [...new Set([...policy.commonTools, ...(policy.phaseTools[key] || [])])] };
}

export function requestsWholeFilm(prompt: string) {
    return /(?:剧本|script|故事|漫剧|短片|短剧)/i.test(prompt)
        && /(?:剧本.*(?:全自动|自动完成|自动制作|自动生成)(?:[。！!\s]|$)|制作(?:成)?片|制作(?:漫剧|短片|短剧|视频)|生成(?:漫剧|短片|短剧|视频)|拍成|做(?:成)?(?:片|视频)|完成.*(?:成片|短片|漫剧)|produce.*(?:film|video)|make.*(?:film|video)|script.to.(?:film|video))/i.test(prompt);
}
