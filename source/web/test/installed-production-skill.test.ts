import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, spyOn, test } from "bun:test";
import * as skillsApi from "@/services/api/skills";
import { runAgentRuntimeTool, getPreparedFilmSkillEvidence } from "@/services/api/agent-runtime-tools";
import { toolNames } from "../../canvas-agent/src/schemas";

test("portable full skill routes, paginates to ready, and loads only the current phase", async () => {
    const root = resolve(import.meta.dir, "../../plugins/yingce/skills/yingce-film-production");
    const paths = (dir: string, prefix = ""): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(item => item.isDirectory() ? paths(resolve(dir, item.name), prefix + item.name + "/") : [prefix + item.name]);
    const content = new Map(paths(root).map(path => [path, readFileSync(resolve(root, path), "utf8")]));
    const file = (path: string) => ({ path, kind: "markdown", mimeType: "text/plain", size: content.get(path)?.length || 0, sha256: createHash("sha256").update(content.get(path) || "").digest("hex") });
    const skill = { skillId: "portable-full-fixture", skillName: "衍图整片制作", description: "剧本自动制作", versionId: "fixture-v163", version: "1.6.3", contentHash: "fixture-package", sourceType: "zip", isAdded: true, updatedAt: "2026-10-09" };
    const router = { ...skill, skillId: "portable-router-fixture", skillName: "film-production" };
    const originalNow = Date.now();
    const time = spyOn(Date, "now").mockReturnValue(originalNow + 20000);
    const list = spyOn(skillsApi, "listAddedSkills").mockResolvedValue({ skills: [skill, router] } as never);
    const files = spyOn(skillsApi, "listSkillFiles").mockResolvedValue({ files: [...content.keys()].map(file) } as never);
    const reads = spyOn(skillsApi, "getSkillFile").mockImplementation(async (id, path) => {
        if (id === router.skillId) return { file: { file: file("SKILL.md"), content: "---\nname: film-production\n---\nRead ../yingce-film-production/SKILL.md", binary: false } };
        if (!content.has(path)) throw new Error("missing fixture path");
        return { file: { file: file(path), content: content.get(path)!, binary: false } };
    });
    try {
        const input = { prompt: "按这个剧本自动完成", phase: "planning", selectedSkillIds: [router.skillId], availableToolNames: [...toolNames], maxCharsPerSkill: 1024 };
        let result = await runAgentRuntimeTool("skill_prepare", input);
        expect(result.routing).toEqual([{ fromSkillId: router.skillId, toSkillId: skill.skillId, name: skill.skillName }]);
        expect(result.readyForUse).toBe(false);
        for (let n = 0; n < 100 && !result.readyForUse; n++) {
            expect(result.continuationReads.length).toBeGreaterThan(0);
            for (const read of result.continuationReads) await runAgentRuntimeTool("skill_read", { ...read, maxChars: 200000 });
            result = await runAgentRuntimeTool("skill_prepare", { ...input, preparationId: result.preparationId });
        }
        expect(result.readyForUse).toBe(true);
        expect(result.selected[0].requiredReads).toContain("agents/runtime.json");
        expect(result.selected[0].requiredReads).not.toContain("references/fixed-space-workflow.md");
        expect(getPreparedFilmSkillEvidence().some(e => e.skillId === skill.skillId && e.versionId === skill.versionId)).toBe(true);
        const missing = await runAgentRuntimeTool("skill_prepare", { ...input, maxCharsPerSkill: 200000, availableToolNames: toolNames.filter(tool => tool !== "film_authorize_run") });
        expect(missing.readyForUse).toBe(false);
        expect(missing.toolDependencyHealth.missingToolNames).toContain("film_authorize_run");
        const edited = await runAgentRuntimeTool("skill_prepare", { ...input, phase: "editing", selectedSkillIds: [skill.skillId], maxCharsPerSkill: 200000 });
        expect(edited.readyForUse).toBe(true);
        expect(edited.selected[0].requiredReads).toContain("references/edit-deliver.md");
        expect(edited.selected[0].requiredReads).not.toContain("references/fixed-space-workflow.md");
        const automatic = await runAgentRuntimeTool("skill_prepare", { ...input, selectedSkillIds: undefined, maxCharsPerSkill: 200000 });
        expect(automatic.selected.map((entry: { skillId: string }) => entry.skillId)).toEqual([skill.skillId]);
        list.mockResolvedValue({ skills: [{ ...skill, versionId: "changed", contentHash: "new" }] } as never);
        await expect(runAgentRuntimeTool("skill_read", { skillId: skill.skillId, path: "SKILL.md", preparationId: automatic.preparationId })).rejects.toThrow("版本已变化");
    } finally { list.mockRestore(); files.mockRestore(); reads.mockRestore(); time.mockRestore(); }
});
