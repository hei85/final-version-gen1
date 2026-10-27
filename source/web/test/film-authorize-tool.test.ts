import { expect, spyOn, test } from "bun:test";
import { productionRuns, type ProductionRun } from "@/services/api/production-runs";
import { runFilmAgentTool, isFilmAgentReadTool } from "@/services/api/film-agent-tools";
test("MCP authorization uses fresh persisted state and preserves budget/model/concurrency scope", async () => {
    const run = { id: "fixture-run", revision: 3, status: "planning", policy: { budgetPolicy: "bounded", videoModelFamily: "minimax_h3", maxParallelSteps: 5 }, steps: [], attempts: [] } as unknown as ProductionRun;
    const read = spyOn(productionRuns, "get").mockResolvedValue(run);
    const authorize = spyOn(productionRuns, "authorize").mockImplementation(async (_id, input) => ({ ...run, status: "running", revision: 4, policy: { ...input.policy, authorizationStatus: "authorized" } }));
    try {
        expect(isFilmAgentReadTool("film_authorize_run")).toBe(false);
        const result = await runFilmAgentTool("film_authorize_run", { runId: run.id, expectedRevision: 3 });
        expect(authorize).toHaveBeenCalledWith(run.id, { expectedRevision: 3, policy: run.policy });
        expect((result as ProductionRun).revision).toBe(4);
        await expect(runFilmAgentTool("film_authorize_run", { runId: run.id, expectedRevision: 2 })).rejects.toThrow("状态已变化");
        expect(authorize).toHaveBeenCalledTimes(1);
    } finally { read.mockRestore(); authorize.mockRestore(); }
});
