import { expect, test } from "bun:test";
import { skillPackageReferences, skillRouterTarget } from "@/lib/skill-package-references";
import { beginSkillPreparation, recordSkillRead, skillReadProgress } from "@/lib/skill-read-receipts";
import { parseSkillPhasePolicy, requestsWholeFilm, skillPhaseRequirements } from "@/lib/skill-phase-policy";
test("Markdown relative links, literal package paths, missing guides and escape boundaries", () => {
    const files = [{ path: "references/core.md" }, { path: "docs/nested.md" }, { path: "docs/local.md" }];
    expect(skillPackageReferences("[Core](../references/core.md) `docs/nested.md` [Local](local.md) [Missing](missing.md) [Escape](../../outside.md) [Web](https://example.com/doc.md)", files, "docs/guide.md"))
        .toEqual(["references/core.md", "docs/local.md", "docs/missing.md", "docs/nested.md"]);
    expect(skillRouterTarget("---\nname: film-production\n---\nRead ../yingce-film-production/SKILL.md")).toBe("yingce-film-production");
});
test("paged reads accumulate in one versioned session, reject stale identity and wrong user", () => {
    const scope = "fixture-user", id = beginSkillPreparation(scope), identity = { skillId: "skill", versionId: "v1", contentHash: "hash1" };
    recordSkillRead(scope, id, identity, "SKILL.md", "sha", 5, 0, 2);
    expect(skillReadProgress(scope, id, identity, "SKILL.md", "sha", 5)).toEqual({ complete: false, nextOffset: 2 });
    recordSkillRead(scope, id, identity, "SKILL.md", "sha", 5, 3, 2);
    expect(skillReadProgress(scope, id, identity, "SKILL.md", "sha", 5).complete).toBe(false);
    recordSkillRead(scope, id, identity, "SKILL.md", "sha", 5, 2, 1);
    expect(skillReadProgress(scope, id, identity, "SKILL.md", "sha", 5).complete).toBe(true);
    expect(skillReadProgress(scope, id, { ...identity, versionId: "v2" }, "SKILL.md", "sha", 5).complete).toBe(false);
    expect(() => beginSkillPreparation("other-user", id)).toThrow();
});
test("phase policy loads relevant rules and rejects unsafe paths", () => {
    const source = { version: 1, commonReads: ["references/core.md"], commonTools: ["film_get_run"], phaseReads: { planning: ["references/plan.md"], video: ["references/video.md"] }, phaseTools: { video: ["film_wait_task"] } };
    expect(skillPhaseRequirements(parseSkillPhasePolicy(JSON.stringify(source)), "video")).toEqual({ paths: ["references/core.md", "references/video.md"], tools: ["film_get_run", "film_wait_task"] });
    expect(() => parseSkillPhasePolicy(JSON.stringify({ ...source, commonReads: ["references/../../private.md"] }))).toThrow();
    expect(requestsWholeFilm("请写剧本并制作漫剧")).toBe(true);
    expect(requestsWholeFilm("按这个剧本自动完成")).toBe(true);
    expect(requestsWholeFilm("请自动写一个剧本")).toBe(false);
    expect(requestsWholeFilm("帮我修一张照片")).toBe(false);
});
