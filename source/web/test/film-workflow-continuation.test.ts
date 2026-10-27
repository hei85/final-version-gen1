import { expect, test } from "bun:test";
import { filmProductionContinuation } from "@/lib/film-production-continuation";
import type { ProductionRun } from "@/services/api/production-runs";

function run(status = "running") {
    return { id: "fixture-run", revision: 9, status, policy: { authorizationStatus: "authorized" }, attempts: [], steps: [
        { id: "asset", stepKey: "asset:hero", kind: "image", status: "succeeded", dependsOn: [] },
        { id: "check", stepKey: "stage:asset_package", kind: "check", status: "ready", dependsOn: ["asset:hero"] },
        { id: "video", stepKey: "video:shot:s1", kind: "video", status: "pending", dependsOn: ["stage:asset_package"] },
    ] } as unknown as ProductionRun;
}
test("durable media success offers inspection before dependent video, with fresh revision", () => {
    const r = run();
    const c = filmProductionContinuation(r);
    expect(c.action).toBe("continue_ready_steps");
    expect(c.readySteps.map(step => step.stepId)).toEqual(["check"]);
    expect(c.readySteps[0].nextTool).toBe("film_record_step_result");
    expect(c.readySteps[0].arguments.expectedRevision).toBe(9);
    expect(c.blockedSteps[0].unmetDependencies).toEqual(["stage:asset_package"]);
    r.steps[1].status = "succeeded";
    r.revision++;
    const next = filmProductionContinuation(r);
    expect(next.readySteps.map(step => step.stepId)).toEqual(["video"]);
    expect(next.readySteps[0].arguments.expectedRevision).toBe(10);
    expect(filmProductionContinuation(JSON.parse(JSON.stringify(r)))).toEqual(next);
});
test("uncertain or failed review blocks video and requests actual self-check", () => {
    for (const status of ["uncertain", "failed"]) {
        const r = run(); r.steps[1].status = status;
        const c = filmProductionContinuation(r);
        expect(c.action).toBe("repair_or_finish_review");
        expect(c.readySteps).toEqual([]);
        expect(c.repairSteps[0].stepId).toBe("check");
        expect(c.nextTool).toBe("film_self_check");
    }
});
test("running or unknown original attempt is queried and cannot become a new submission", () => {
    const r = run(); r.steps[0].status = "running"; r.steps[1].status = "pending";
    r.attempts = [{ id: "old", stepId: "asset", attemptNumber: 1, updatedAt: "1", state: "failed", generationTaskId: "old-task" }, { id: "current", stepId: "asset", attemptNumber: 2, updatedAt: "2", state: "uncertain", generationTaskId: "original-task" }] as never;
    const c = filmProductionContinuation(r);
    expect(c.action).toBe("poll_original_tasks");
    expect(c.waitingTasks[0].arguments).toEqual({ taskId: "original-task" });
    expect(c.readySteps).toEqual([]);
    r.steps[0].status = "uncertain";
    expect(filmProductionContinuation(r).repairSteps).toEqual([]);
});
test("planning has a real authorization tool and pause/cancel never silently resume", () => {
    expect(filmProductionContinuation(run("planning")).nextTool).toBe("film_authorize_run");
    for (const status of ["paused", "cancelled"]) {
        const c = filmProductionContinuation(run(status));
        expect(c.action).toBe("stopped_by_user"); expect(c.nextTool).toBeNull(); expect(c.readySteps).toEqual([]);
    }
});
test("completed status without real final resource is not delivery", () => {
    const r = run("completed");
    expect(filmProductionContinuation(r).action).toBe("reconcile_missing_delivery");
    r.finalResourceId = "actual-resource";
    expect(filmProductionContinuation(r).action).toBe("deliver_verified_result");
});
