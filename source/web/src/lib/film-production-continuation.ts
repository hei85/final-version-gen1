import type { ProductionRun, ProductionStep } from "@/services/api/production-runs";

/** Derive the next work from durable state; this is guidance, never a quality verdict or a scheduler. */
export function filmProductionContinuation(run: ProductionRun) {
    if (!Array.isArray(run.steps) || !Array.isArray(run.attempts)) return {
        runId: run.id, expectedRevision: run.revision, completedSteps: 0, totalSteps: 0,
        action: "reconcile_run", nextTool: "film_get_run", arguments: { runId: run.id },
        readySteps: [], repairSteps: [], waitingTasks: [], blockedSteps: [],
        guidance: "制作状态缺少完整步骤/attempt 快照；重新读取，不能把缺失状态当作空清单完成。",
    };
    const steps = run.steps.filter(step => step.status !== "superseded");
    const byKey = new Map(steps.map(step => [step.stepKey, step]));
    const latest = new Map(run.attempts.slice().sort((a, b) => a.attemptNumber - b.attemptNumber || a.updatedAt.localeCompare(b.updatedAt)).map(attempt => [attempt.stepId, attempt]));
    const blockedSteps = steps.filter(step => step.status !== "succeeded").flatMap(step => {
        const unmet = (step.dependsOn || []).filter(key => byKey.get(key)?.status !== "succeeded");
        return unmet.length ? [{ stepId: step.id, stepKey: step.stepKey, unmetDependencies: unmet }] : [];
    });
    const eligible = steps.filter(step => !["succeeded", "running", "submitting", "superseded"].includes(step.status)
        && (step.dependsOn || []).every(key => byKey.get(key)?.status === "succeeded"));
    const waitingTasks = steps.flatMap(step => {
        const attempt = latest.get(step.id);
        if (!attempt || !(step.status === "running" || step.status === "submitting" || ["running", "submitting", "uncertain"].includes(attempt.state))) return [];
        return [{ stepId: step.id, stepKey: step.stepKey, attemptId: attempt.id, taskId: attempt.generationTaskId || null,
            nextTool: attempt.generationTaskId ? "film_wait_task" : "film_get_tasks",
            arguments: attempt.generationTaskId ? { taskId: attempt.generationTaskId } : { runId: run.id } }];
    });
    const waitingIds = new Set(waitingTasks.map(task => task.stepId));
    const descriptor = (step: ProductionStep) => ({ stepId: step.id, stepKey: step.stepKey, kind: step.kind,
        status: step.status, inputFingerprint: step.inputFingerprint || "", outputArtifactIds: step.outputArtifactIds || [],
        nextTool: step.kind === "render" ? "film_render_timeline" : step.kind === "delivery_check" ? "film_verify_delivery"
            : ["check", "verify", "reuse_media"].includes(step.kind) ? "film_record_step_result" : "film_submit_step",
        arguments: { runId: run.id, stepId: step.id, expectedRevision: run.revision },
    });
    const repairSteps = eligible.filter(step => !waitingIds.has(step.id) && ["failed", "uncertain"].includes(step.status)).map(step => ({
        ...descriptor(step), retryOf: latest.get(step.id)?.id || null,
        guidance: "先核对真实失败/未审原因，保存修正与证据。生成重试仅在原任务明确终止后按既有授权提交；复核步骤不能伪造通过。",
    }));
    const readySteps = eligible.filter(step => !waitingIds.has(step.id) && !["failed", "uncertain"].includes(step.status)).map(descriptor);
    const base = { runId: run.id, expectedRevision: run.revision, completedSteps: steps.filter(step => step.status === "succeeded").length,
        totalSteps: steps.length, readySteps, repairSteps, waitingTasks, blockedSteps,
        guidance: "检查步骤先读取真实产物并按当前合同逐项审看/听审；证据通过后登记。每次修改后读取新 revision，依赖全部 succeeded 才推进。" };
    if (["paused", "cancelled"].includes(run.status)) return { ...base, action: "stopped_by_user", nextTool: null, readySteps: [], repairSteps: [] };
    if (run.status === "completed") return { ...base, action: run.finalResourceId ? "deliver_verified_result" : "reconcile_missing_delivery", nextTool: run.finalResourceId ? null : "film_get_run", resourceId: run.finalResourceId || null, readySteps: [], repairSteps: [] };
    if (run.status === "planning" || run.policy?.authorizationStatus !== "authorized") return { ...base, action: "register_existing_authorization", nextTool: "film_authorize_run", arguments: { runId: run.id, expectedRevision: run.revision }, readySteps: [], repairSteps: [], guidance: "检查当前计划与已有用户授权，使用 film_authorize_run 登记同一范围；不扩大预算、模型或并发授权。授权确实缺失时再向用户请求。" };
    if (repairSteps.length) return { ...base, action: "repair_or_finish_review", nextTool: "film_self_check", arguments: { runId: run.id } };
    if (readySteps.length) return { ...base, action: "continue_ready_steps", nextTool: readySteps[0].nextTool, arguments: readySteps[0].arguments };
    if (waitingTasks.length) return { ...base, action: "poll_original_tasks", nextTool: waitingTasks[0].nextTool, arguments: waitingTasks[0].arguments };
    return { ...base, action: "reconcile_run", nextTool: "film_self_check", arguments: { runId: run.id }, guidance: "没有可执行步骤。核对真实缺项、失败原因与交付状态；不能跳过阻断项或把任务全部成功当作成片完成。" };
}

export function withFilmContinuation(run: ProductionRun) {
    return { ...run, continuation: filmProductionContinuation(run) };
}
