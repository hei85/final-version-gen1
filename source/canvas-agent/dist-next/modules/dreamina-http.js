import path from "node:path";
import { CONFIG_DIR } from "../config.js";
import { DreaminaCliArbiter } from "../dreamina-cli-arbiter.js";
import { dreaminaCliInputSchema } from "../dreamina-cli-contract.js";
import { DreaminaGenerationAdapter, LocalDreaminaGenerationError, } from "../dreamina-generation.js";
import { projectDreaminaModelCatalog } from "../dreamina-model-catalog.js";
import { DreaminaProviderArtifactStore } from "../dreamina-provider-artifacts.js";
import { projectDreaminaPublicRunError, projectDreaminaPublicRuntimeResult } from "../dreamina-public-result.js";
import { DreaminaCliError, isStableDreaminaErrorCode } from "../dreamina-cli-process.js";
import { DreaminaTaskProjector, readSafeJournal } from "../dreamina-task-projection.js";
import { DreaminaTaskStore } from "../dreamina-task-store.js";
import { DreaminaCliRuntime, } from "../dreamina-cli-runtime.js";
import { DreaminaCliService } from "../dreamina-cli.js";
export function createDreaminaHttpModule(options) {
    const configDir = options.configDir ?? CONFIG_DIR;
    const arbiter = options.arbiter ?? new DreaminaCliArbiter({
        stateFile: path.join(configDir, "dreamina-cli-arbiter.json"),
    });
    const dreamina = options.dreamina ?? new DreaminaCliService({ ownerId: options.ownerId, arbiter });
    const generationRoot = path.join(configDir, "dreamina-generation-inputs");
    const journalFile = path.join(configDir, "dreamina-runtime-state.json");
    const taskStore = new DreaminaTaskStore({ stateFile: path.join(configDir, "dreamina-generation-task-store.json") });
    const taskProjector = new DreaminaTaskProjector({ store: taskStore, ownerId: options.ownerId, journalFile });
    const artifactStore = new DreaminaProviderArtifactStore({ root: path.join(configDir, "dreamina-provider-artifacts") });
    let projectionTail = Promise.resolve();
    const recoverTaskProjection = () => {
        const next = projectionTail.catch(() => undefined).then(() => taskProjector.recover());
        projectionTail = next;
        return next;
    };
    const withTaskProjection = async (action) => {
        // Recovery before the action is a hard gate. Once the action succeeds, its provider
        // journal is the durable recovery fact; a projection-only failure must not turn that
        // success into a retry-looking HTTP failure or replay a paid mutation.
        await recoverTaskProjection();
        const result = await action();
        try {
            await recoverTaskProjection();
        }
        catch {
            // Keep the failed projection tail durable in memory; the next task read retries
            // recovery from the provider journal before returning task state.
        }
        return result;
    };
    const dreaminaRuntime = options.dreaminaRuntime ?? new DreaminaCliRuntime({
        ...options.runtimeDependencies,
        ownerId: options.ownerId,
        arbiter,
        stateFile: journalFile,
        taskStore,
        taskProjector,
        artifactStore,
        referenceRoots: () => [
            generationRoot,
            ...(options.referenceRoots?.() ?? [path.join(configDir, "codex-workspaces")]),
        ],
        ensureReady: async (signal) => {
            if (signal?.aborted)
                throw cancelled();
            const observed = dreamina.statusWithSession
                ? await dreamina.statusWithSession({ signal })
                : { status: await dreamina.status({ signal }), session: await arbiter.readSession(signal) };
            if (signal?.aborted)
                throw cancelled();
            if (!observed.status.authenticated) {
                throw new DreaminaCliError("dreamina_login_required", "Dreamina CLI 需要先登录", 401);
            }
            return observed.session;
        },
    });
    const generation = options.generation ?? new DreaminaGenerationAdapter({
        root: generationRoot,
        models: projectDreaminaModelCatalog(),
        runtime: dreaminaRuntime,
    });
    const providerMetadata = async (idempotencyKey) => {
        const record = (await readSafeJournal(journalFile, options.ownerId)).find((candidate) => candidate.recordId === idempotencyKey);
        return record ? {
            receiptRecorded: record.hasProviderTask,
            ...(record.fenceEpoch ? { fenceEpoch: record.fenceEpoch } : {}),
        } : undefined;
    };
    const publicTask = async (idempotencyKey, metadata) => {
        const task = await taskStore.getTask(`dreamina:${idempotencyKey}`);
        if (!task || task.visibility === "deleted")
            throw taskNotFound();
        return projectPublicTask(task, metadata ?? await providerMetadata(idempotencyKey), artifactStore, options.ownerId);
    };
    const publicTaskPage = async (query) => {
        const visible = (await taskStore.listTasks())
            .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt)
            || right.journalRecordId.localeCompare(left.journalRecordId))
            .filter((task) => !query.projectId || (task.context.scope === "scoped" && task.context.projectId === query.projectId))
            .filter((task) => !query.activeOnly || task.lifecycle !== "TERMINAL");
        const cursor = query.cursor ? decodeStoreTaskCursor(query.cursor) : undefined;
        const afterCursor = visible.filter((task) => !cursor || task.updatedAt < cursor.updatedAt
            || (task.updatedAt === cursor.updatedAt && task.journalRecordId < cursor.id));
        const selected = afterCursor.slice(0, query.limit);
        const metadata = new Map((await readSafeJournal(journalFile, options.ownerId)).map((record) => [record.recordId, {
                receiptRecorded: record.hasProviderTask,
                ...(record.fenceEpoch ? { fenceEpoch: record.fenceEpoch } : {}),
            }]));
        const tasks = await Promise.all(selected.map((task) => projectPublicTask(task, metadata.get(task.journalRecordId), artifactStore, options.ownerId, false)));
        const last = selected.at(-1);
        return {
            tasks,
            ...(last && afterCursor.length > selected.length ? { nextCursor: encodeStoreTaskCursor(last.updatedAt, last.journalRecordId) } : {}),
        };
    };
    const withProjectedTaskAction = async (idempotencyKey, action) => {
        await recoverTaskProjection();
        const metadata = await action();
        await recoverTaskProjection();
        return publicTask(idempotencyKey, await providerMetadata(idempotencyKey) ?? metadata);
    };
    const submitProductTask = async (input, signal) => {
        await recoverTaskProjection();
        const metadata = await generation.submit(input, { signal });
        try {
            await recoverTaskProjection();
        }
        catch {
            // The paid boundary may already have been crossed. Preserve the provider action
            // response so callers never interpret a projection-only failure as permission to retry.
            return metadata;
        }
        // Artifact binding and Store projection errors are not projection-tail failures and must
        // never be hidden by falling back to a provider-journal DTO.
        return publicTask(metadata.id, await providerMetadata(metadata.id) ?? metadata);
    };
    return {
        descriptor: {
            id: "dreamina",
            displayName: "Dreamina CLI",
            apiVersion: 1,
            scopes: ["dreamina:status", "dreamina:login", "dreamina:logout", "dreamina:run", "dreamina:models", "dreamina:generate"],
        },
        routes: [
            {
                method: "GET",
                path: "/dreamina/status",
                scope: "dreamina:status",
                handler: lifecycleHandler((signal) => dreamina.status({ signal })),
            },
            {
                method: "POST",
                path: "/dreamina/login",
                scope: "dreamina:login",
                handler: lifecycleHandler((signal) => dreamina.login({ signal }), true),
            },
            {
                method: "POST",
                path: "/dreamina/logout",
                scope: "dreamina:logout",
                handler: lifecycleHandler((signal) => dreamina.logout({ signal }), true),
            },
            {
                method: "POST",
                path: "/dreamina/run",
                scope: "dreamina:run",
                legacy: true,
                handler: runHandler((input, signal) => withTaskProjection(() => dreaminaRuntime.run(input, { signal }))),
            },
            {
                method: "GET",
                path: "/dreamina/models",
                scope: "dreamina:models",
                handler: modelsHandler((signal) => arbiter.readSession(signal)),
            },
            {
                method: "POST",
                path: "/dreamina/generate",
                scope: "dreamina:generate",
                handler: generationHandler((input, signal) => submitProductTask(input, signal)),
            },
            {
                method: "GET",
                path: "/dreamina/generate/tasks",
                scope: "dreamina:generate",
                queryKeys: ["activeOnly", "cursor", "limit", "projectId"],
                handler: generationListHandler(async (query, signal) => {
                    await recoverTaskProjection();
                    if (signal.aborted)
                        throw cancelled();
                    return publicTaskPage(query);
                }),
            },
            {
                method: "POST",
                path: "/dreamina/generate/query",
                scope: "dreamina:generate",
                handler: generationHandler((input, signal) => {
                    const recovery = parseGenerationRecovery(input);
                    return withProjectedTaskAction(recovery.idempotencyKey, () => (dreaminaRuntime.getTask(recovery.idempotencyKey, { signal })));
                }),
            },
            {
                method: "POST",
                path: "/dreamina/generate/wait",
                scope: "dreamina:generate",
                handler: generationHandler((input, signal) => {
                    const recovery = parseGenerationRecovery(input);
                    return withProjectedTaskAction(recovery.idempotencyKey, async () => {
                        const current = await dreaminaRuntime.getTask(recovery.idempotencyKey, { signal });
                        await dreaminaRuntime.waitForTask(recovery.idempotencyKey, recovery.mode ?? current.mode, { signal });
                        return dreaminaRuntime.getTask(recovery.idempotencyKey, { signal });
                    });
                }),
            },
            {
                method: "POST",
                path: "/dreamina/generate/refresh",
                scope: "dreamina:generate",
                handler: generationHandler((input, signal) => (withProjectedTaskAction(parseGenerationTaskId(input), () => (dreaminaRuntime.refreshTask(parseGenerationTaskId(input), { signal }))))),
            },
            {
                method: "POST",
                path: "/dreamina/generate/cancel",
                scope: "dreamina:generate",
                handler: generationHandler((input) => withProjectedTaskAction(parseGenerationTaskId(input), () => (dreaminaRuntime.cancelTask(parseGenerationTaskId(input))))),
            },
            {
                method: "POST",
                path: "/dreamina/generate/delete",
                scope: "dreamina:generate",
                handler: generationHandler((input) => withTaskProjection(() => dreaminaRuntime.deleteTask(parseGenerationTaskId(input)))),
            },
            {
                method: "POST",
                path: "/dreamina/generate/effects/claim",
                scope: "dreamina:generate",
                handler: generationHandler((input) => withTaskProjection(() => (taskStore.claimProductEffect(parseProductEffectClaim(input))))),
            },
            {
                method: "POST",
                path: "/dreamina/generate/effects/renew",
                scope: "dreamina:generate",
                handler: generationHandler((input) => taskStore.renewProductEffect(parseProductEffectRenewal(input))),
            },
            {
                method: "POST",
                path: "/dreamina/generate/effects/complete",
                scope: "dreamina:generate",
                handler: generationHandler(async (input) => ({
                    completed: await taskStore.completeProductEffect(parseProductEffectCompletion(input)),
                })),
            },
            {
                method: "POST",
                path: "/dreamina/generate/effects/release",
                scope: "dreamina:generate",
                handler: generationHandler(async (input) => ({
                    released: await taskStore.releaseProductEffect(parseProductEffectRelease(input)),
                })),
            },
        ],
        start: () => dreaminaRuntime.start?.(),
        dispose: () => dreaminaRuntime.dispose?.(),
    };
}
async function projectPublicTask(task, metadata, artifactStore, ownerId, includeResult = true) {
    if (!task.mode || !task.operation || !task.model || !task.createdAt)
        throw new Error("Dreamina product task is incomplete");
    const state = productPublicState(task);
    const result = includeResult && task.terminalOutcome === "SUCCEEDED" && task.outputs.length > 0
        ? await artifactStore.readResult(task.outputs.map((output) => {
            if ((output.mediaType !== "image" && output.mediaType !== "video") || !output.providerArtifactRef) {
                throw new Error("Dreamina product artifact metadata is invalid");
            }
            return { outputIndex: output.outputIndex, mediaType: output.mediaType, providerArtifactRef: output.providerArtifactRef };
        }), {
            ownerId,
            idempotencyKey: task.journalRecordId,
            ...(task.accountBinding ? { accountBinding: task.accountBinding } : {}),
            ...(metadata?.fenceEpoch ? { fenceEpoch: metadata.fenceEpoch } : {}),
            mode: task.mode,
        })
        : undefined;
    return {
        id: task.journalRecordId,
        ...(task.clientOperationId !== task.journalRecordId ? { clientOperationId: task.clientOperationId } : {}),
        context: task.context,
        provider: "dreamina-cli",
        mode: task.mode,
        operation: task.operation,
        model: task.model,
        ...state,
        receiptRecorded: metadata?.receiptRecorded ?? (task.lifecycle === "ACCEPTED" || task.lifecycle === "RUNNING" || task.lifecycle === "TERMINAL"),
        ...(task.lastSyncErrorCode ? { errorCode: task.lastSyncErrorCode } : {}),
        ...(task.officialStatus ? { officialStatus: task.officialStatus } : {}),
        lifecycle: task.lifecycle,
        ...(task.terminalOutcome ? { terminalOutcome: task.terminalOutcome } : {}),
        syncState: task.syncState,
        resultState: task.resultState,
        outputs: task.outputs.map((output) => ({ ...output })),
        ...(task.accountBinding ? { accountBinding: task.accountBinding } : {}),
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        ...(result ? { result } : {}),
    };
}
function productPublicState(task) {
    if (task.lifecycle === "QUEUED_LOCAL")
        return { status: "queued", stage: "queued", progress: 0 };
    if (task.lifecycle === "SUBMITTING")
        return { status: "running", stage: "submitting" };
    if (task.lifecycle === "SUBMISSION_UNCERTAIN")
        return { status: "failed", stage: "submission_unknown" };
    if (task.lifecycle === "ACCEPTED")
        return { status: "running", stage: "submitted" };
    if (task.lifecycle === "RUNNING")
        return { status: "running", stage: "generating" };
    if (task.terminalOutcome === "SUCCEEDED")
        return { status: "succeeded", stage: "succeeded", progress: 100 };
    if (task.terminalOutcome === "CANCELLED")
        return { status: "cancelled", stage: "cancelled" };
    return { status: "failed", stage: "failed" };
}
function encodeStoreTaskCursor(updatedAt, id) {
    return Buffer.from(JSON.stringify([updatedAt, id]), "utf8").toString("base64url");
}
function decodeStoreTaskCursor(cursor) {
    try {
        if (!/^[A-Za-z0-9_-]{1,512}$/.test(cursor))
            throw new Error("invalid cursor");
        const value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
        if (!Array.isArray(value) || value.length !== 2 || typeof value[0] !== "string" || typeof value[1] !== "string"
            || !Number.isFinite(Date.parse(value[0])) || !/^[A-Za-z0-9._:-]{8,160}$/.test(value[1]))
            throw new Error("invalid cursor");
        return { updatedAt: value[0], id: value[1] };
    }
    catch {
        throw requestInvalid();
    }
}
function modelsHandler(session) {
    return (req, res) => { void runModels(req, res, session); };
}
async function runModels(req, res, session) {
    const controller = requestController(req, res);
    try {
        const result = await session(controller.signal);
        if (!result.accountBinding)
            throw loginRequired();
        if (!cannotRespond(controller, res)) {
            res.json({
                ok: true,
                provider: "dreamina-cli",
                accountBinding: result.accountBinding,
                sessionEpoch: result.sessionEpoch,
                models: projectDreaminaModelCatalog(),
            });
        }
    }
    catch (error) {
        if (!cannotRespond(controller, res))
            sendDreaminaError(res, error);
    }
    finally {
        removeRequestController(req, res, controller);
    }
}
function lifecycleHandler(action, mutation = false) {
    return (req, res) => { void runLifecycle(req, res, action, mutation); };
}
function runHandler(action) {
    return (req, res) => { void runDreamina(req, res, action); };
}
function generationHandler(action) {
    return (req, res) => { void runGeneration(req, res, action); };
}
function generationListHandler(action) {
    return (req, res) => { void runGenerationList(req, res, action); };
}
async function runGenerationList(req, res, action) {
    const controller = requestController(req, res);
    try {
        const result = await action(parseGenerationListQuery(req.query), controller.signal);
        if (!cannotRespond(controller, res))
            res.json({ ok: true, result });
    }
    catch (error) {
        if (!cannotRespond(controller, res))
            sendDreaminaError(res, error);
    }
    finally {
        removeRequestController(req, res, controller);
    }
}
function parseGenerationListQuery(value) {
    const query = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    const limit = Number(typeof query.limit === "string" ? query.limit : "50");
    const cursor = typeof query.cursor === "string" && query.cursor ? query.cursor : undefined;
    const projectId = typeof query.projectId === "string" && query.projectId.trim() ? query.projectId.trim() : undefined;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100 || (cursor && cursor.length > 512) || (projectId && projectId.length > 160)) {
        throw new DreaminaCliError("dreamina_request_invalid", "Dreamina 请求参数无效", 400);
    }
    return {
        limit,
        ...(cursor ? { cursor } : {}),
        ...(projectId ? { projectId } : {}),
        ...(query.activeOnly === "true" ? { activeOnly: true } : {}),
    };
}
async function runLifecycle(req, res, action, mutation) {
    const controller = requestController(req, res);
    try {
        if (mutation)
            assertEmptyJsonBody(req.body);
        const status = await action(controller.signal);
        if (cannotRespond(controller, res))
            return;
        res.json({ ok: true, status });
    }
    catch (error) {
        if (!cannotRespond(controller, res))
            sendDreaminaError(res, error);
    }
    finally {
        removeRequestController(req, res, controller);
    }
}
async function runDreamina(req, res, action) {
    const controller = requestController(req, res);
    try {
        const result = await action(parseRunBody(req.body), controller.signal);
        if (cannotRespond(controller, res))
            return;
        res.json({ ok: true, result: projectDreaminaPublicRuntimeResult(result) });
    }
    catch (error) {
        if (!cannotRespond(controller, res))
            sendDreaminaPublicRunError(res, error);
    }
    finally {
        removeRequestController(req, res, controller);
    }
}
async function runGeneration(req, res, action) {
    const controller = requestController(req, res);
    try {
        const result = await action(parseJsonBody(req.body), controller.signal);
        if (!cannotRespond(controller, res))
            res.json({ ok: true, result });
    }
    catch (error) {
        if (!cannotRespond(controller, res))
            sendDreaminaError(res, error);
    }
    finally {
        removeRequestController(req, res, controller);
    }
}
function parseGenerationTaskId(value) {
    const source = record(value);
    if (Object.keys(source).length !== 1
        || typeof source.idempotencyKey !== "string"
        || !/^[A-Za-z0-9._:-]{16,120}$/.test(source.idempotencyKey))
        throw requestInvalid();
    return source.idempotencyKey;
}
function parseProductEffectClaim(value) {
    const source = record(value);
    if (Object.keys(source).some((key) => !["consumerId", "taskId", "effectKey", "leaseMs"].includes(key))
        || typeof source.consumerId !== "string"
        || typeof source.taskId !== "string"
        || typeof source.effectKey !== "string"
        || (source.leaseMs !== undefined && !Number.isSafeInteger(source.leaseMs)))
        throw requestInvalid();
    return {
        consumerId: source.consumerId,
        taskId: source.taskId,
        effectKey: source.effectKey,
        ...(typeof source.leaseMs === "number" ? { leaseMs: source.leaseMs } : {}),
    };
}
function parseProductEffectRenewal(value) {
    const source = record(value);
    if (Object.keys(source).some((key) => !["consumerId", "taskId", "effectKey", "leaseToken", "fence", "leaseMs"].includes(key))
        || typeof source.consumerId !== "string"
        || typeof source.taskId !== "string"
        || typeof source.effectKey !== "string"
        || typeof source.leaseToken !== "string"
        || !Number.isSafeInteger(source.fence)
        || (source.leaseMs !== undefined && !Number.isSafeInteger(source.leaseMs)))
        throw requestInvalid();
    return {
        consumerId: source.consumerId,
        taskId: source.taskId,
        effectKey: source.effectKey,
        leaseToken: source.leaseToken,
        fence: source.fence,
        ...(typeof source.leaseMs === "number" ? { leaseMs: source.leaseMs } : {}),
    };
}
function parseProductEffectCompletion(value) {
    const source = record(value);
    const result = record(source.result);
    if (Object.keys(source).some((key) => !["consumerId", "taskId", "effectKey", "leaseToken", "fence", "result"].includes(key))
        || Object.keys(result).some((key) => key !== "materializedAssetId")
        || typeof source.consumerId !== "string"
        || typeof source.taskId !== "string"
        || typeof source.effectKey !== "string"
        || typeof source.leaseToken !== "string"
        || !Number.isSafeInteger(source.fence)
        || (result.materializedAssetId !== undefined && typeof result.materializedAssetId !== "string"))
        throw requestInvalid();
    return {
        consumerId: source.consumerId,
        taskId: source.taskId,
        effectKey: source.effectKey,
        leaseToken: source.leaseToken,
        fence: source.fence,
        result: {
            ...(typeof result.materializedAssetId === "string"
                ? { materializedAssetId: result.materializedAssetId }
                : {}),
        },
    };
}
function parseProductEffectRelease(value) {
    const source = record(value);
    if (Object.keys(source).some((key) => !["consumerId", "taskId", "effectKey", "leaseToken", "fence"].includes(key))
        || typeof source.consumerId !== "string"
        || typeof source.taskId !== "string"
        || typeof source.effectKey !== "string"
        || typeof source.leaseToken !== "string"
        || !Number.isSafeInteger(source.fence))
        throw requestInvalid();
    return {
        consumerId: source.consumerId,
        taskId: source.taskId,
        effectKey: source.effectKey,
        leaseToken: source.leaseToken,
        fence: source.fence,
    };
}
function requestController(req, res) {
    const controller = new AbortController();
    controller.cancel = () => controller.abort();
    req.once("aborted", controller.cancel);
    res.once("close", controller.cancel);
    return controller;
}
function removeRequestController(req, res, controller) {
    req.removeListener("aborted", controller.cancel);
    res.removeListener("close", controller.cancel);
}
function cannotRespond(controller, res) {
    return controller.signal.aborted || res.destroyed || res.writableEnded;
}
function assertEmptyJsonBody(value) {
    if (Buffer.isBuffer(value)) {
        try {
            const body = JSON.parse(value.toString("utf8"));
            if (body && typeof body === "object" && !Array.isArray(body) && Object.keys(body).length === 0)
                return;
        }
        catch {
            // Use one stable public error for malformed and non-empty lifecycle bodies.
        }
    }
    throw requestInvalid();
}
function parseRunBody(value) {
    if (!Buffer.isBuffer(value))
        throw requestInvalid();
    let parsed;
    try {
        parsed = JSON.parse(value.toString("utf8"));
    }
    catch {
        throw requestInvalid();
    }
    const result = dreaminaCliInputSchema.safeParse(parsed);
    if (!result.success || result.data.operation === "query_result")
        throw requestInvalid();
    return result.data;
}
function parseJsonBody(value) {
    if (!Buffer.isBuffer(value))
        throw requestInvalid();
    try {
        return JSON.parse(value.toString("utf8"));
    }
    catch {
        throw requestInvalid();
    }
}
function parseGenerationRecovery(value) {
    const source = record(value);
    const mode = source.mode;
    if (!([1, 2].includes(Object.keys(source).length))
        || typeof source.idempotencyKey !== "string"
        || !/^[A-Za-z0-9._:-]{16,120}$/.test(source.idempotencyKey)
        || (mode !== undefined && mode !== "image" && mode !== "video")
        || Object.keys(source).some((key) => key !== "idempotencyKey" && key !== "mode"))
        throw requestInvalid();
    return { idempotencyKey: source.idempotencyKey, ...(mode ? { mode } : {}) };
}
function record(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        throw requestInvalid();
    return value;
}
function sendDreaminaPublicRunError(res, error) {
    const projected = projectDreaminaPublicRunError(error);
    res.status(projected.statusCode).json({
        ok: false,
        code: projected.code,
        message: projected.message,
    });
}
function sendDreaminaError(res, error) {
    const stable = (error instanceof DreaminaCliError && isStableDreaminaErrorCode(error.code))
        || error instanceof LocalDreaminaGenerationError;
    res.status(stable ? error.statusCode : 500).json({
        ok: false,
        code: stable ? error.code : "dreamina_internal_error",
        message: stable ? error.message : "Dreamina CLI 请求失败",
    });
}
function requestInvalid() {
    return new DreaminaCliError("dreamina_request_invalid", "Dreamina 请求参数无效", 400);
}
function taskNotFound() {
    return new DreaminaCliError("dreamina_task_not_found", "Dreamina generation task was not found", 404);
}
function loginRequired() {
    return new DreaminaCliError("dreamina_login_required", "Dreamina CLI 需要先登录", 401);
}
function cancelled() {
    return new DreaminaCliError("dreamina_cancelled", "Dreamina 操作已取消", 499);
}
