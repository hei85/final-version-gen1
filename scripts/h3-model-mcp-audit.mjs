import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_MATRIX = path.join(ROOT, "logs", "h3-model-audit", "matrix.json");
const DEFAULT_REFERENCES = path.join(ROOT, "logs", "h3-model-audit", "references.json");
const DEFAULT_OUTPUT = path.join(ROOT, "logs", "h3-model-audit", "results");
const DEFAULT_CANVAS_ID = "TOxiSTBief7THFb58rzSU";
const VIDEO_OPERATIONS = new Set(["text_to_video", "image_to_video", "reference_to_video", "audio_to_video", "extend"]);
const TERMINAL_OK = new Set(["success", "succeeded", "completed", "complete"]);
const TERMINAL_BAD = new Set(["failed", "error", "cancelled", "canceled"]);
// Reuse the two existing landscape references; this does not generate new images.
const MAX_REFERENCE_IMAGES = 2;
const MAX_REFERENCE_AUDIOS = 1;

export function chooseReferences(references, ratio, imageCount = 0, audioCount = 0) {
  const images = Array.isArray(references?.images) ? references.images : [];
  const audios = Array.isArray(references?.audios) ? references.audios : [];
  const ordered = images.filter((item) => item.ratio === ratio);
  const seen = new Set();
  const uniqueImages = ordered.filter((item) => {
    const key = item.resourceId || item.nodeId;
    if (!item.nodeId || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const uniqueAudios = [];
  for (const item of audios) {
    const key = item.resourceId || item.nodeId;
    if (item.nodeId && !seen.has(key)) {
      seen.add(key);
      uniqueAudios.push(item);
    }
  }
  return { images: uniqueImages.slice(0, Math.min(imageCount, MAX_REFERENCE_IMAGES)), audios: uniqueAudios.slice(0, Math.min(audioCount, MAX_REFERENCE_AUDIOS)) };
}

export function taskOperationIds(caseId) {
  const token = String(caseId).trim();
  if (!token || token.length > 54) throw new Error(`caseId 长度必须为 1–54：${token}`);
  return { create: `h3audit:create:${token}`, run: `h3audit:run:${token}` };
}

export function extractTaskId(value) {
  if (!value || typeof value !== "object") return "";
  if (typeof value.taskId === "string" && value.taskId) return value.taskId;
  for (const child of Object.values(value)) {
    if (child && typeof child === "object") {
      const found = extractTaskId(child);
      if (found) return found;
    }
  }
  return "";
}

export function extractDurationMs(value) {
  if (!value || typeof value !== "object") return undefined;
  const keys = ["durationMs", "duration_ms"];
  for (const key of keys) if (Number.isFinite(value[key])) return Number(value[key]);
  for (const key of ["durationSeconds", "duration_seconds", "duration"]) {
    if (Number.isFinite(value[key])) return Number(value[key]) * 1000;
  }
  for (const child of Object.values(value)) {
    if (child && typeof child === "object") {
      const found = extractDurationMs(child);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

export function withinHardDurationLimit(durationMs) {
  return Number.isFinite(durationMs) && durationMs > 0 && durationMs <= 3000;
}

export async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await fn(items[index], index);
    }
  }));
  return results;
}

function parseArgs(argv) {
  const options = { matrix: DEFAULT_MATRIX, references: DEFAULT_REFERENCES, output: DEFAULT_OUTPUT, canvasId: "", concurrency: 6, execute: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--execute") options.execute = true;
    else if (arg === "--help" || arg === "-h") options.help = true;
    else if (["--matrix", "--references", "--output", "--canvas-id", "--concurrency"].includes(arg)) {
      const value = argv[++i];
      if (!value) throw new Error(`${arg} 缺少参数`);
      if (arg === "--matrix") options.matrix = path.resolve(value);
      if (arg === "--references") options.references = path.resolve(value);
      if (arg === "--output") options.output = path.resolve(value);
      if (arg === "--canvas-id") options.canvasId = value;
      if (arg === "--concurrency") options.concurrency = Number(value);
    } else throw new Error(`未知参数：${arg}`);
  }
  if (!Number.isInteger(options.concurrency) || options.concurrency < 1 || options.concurrency > 8) throw new Error("并发数必须是 1–8 的整数");
  return options;
}

function showHelp() {
  console.log(`H3 model MCP audit runner\n\n默认空跑：bun scripts/h3-model-mcp-audit.mjs\n真实提交：bun scripts/h3-model-mcp-audit.mjs --execute\n参数：--matrix PATH --references PATH --output DIR --canvas-id ID --concurrency N\n\nmatrix.json: {"canvasId":"...","cases":[{"caseId":"h3-a","model":"实际型号","videoOperation":"text_to_video","ratio":"16:9","resolution":"720P","prompt":"...","imageCount":0,"audioCount":0}]}\nreferences.json: {"canvasId":"...","images":[{"nodeId":"...","resourceId":"可选","path":"可选","ratio":"16:9"}],"audios":[{"nodeId":"...","resourceId":"可选","path":"可选","expectedPhrase":"可选"}]}\n只调用本地 Canvas Agent /api/tools；不向输出写入 token。生成请求固定 2 秒，实际媒体超过 3 秒标为失败。`);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function readJsonOr(file, fallback) {
  return fs.existsSync(file) ? readJson(file) : fallback;
}

function atomicJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(temp, file);
}

function configPath() {
  const folder = process.env.FRAMEFIELD_LOCAL_RUNTIME_CONFIG_DIR || path.join(os.homedir(), ".infinite-canvas");
  return path.join(folder, "canvas-agent.json");
}

function loadRuntimeConfig() {
  const raw = readJson(configPath());
  const url = new URL(raw.url);
  if (!new Set(["127.0.0.1", "localhost", "[::1]"]).has(url.hostname)) throw new Error("拒绝访问非本机 Canvas Agent URL");
  if (typeof raw.token !== "string" || !raw.token) throw new Error("本地 Canvas Agent 配置缺少 token");
  return { url: url.origin, token: raw.token };
}

function scrub(value, token) {
  return String(value ?? "").replaceAll(token, "[REDACTED]");
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function callError(payload) {
  if (!isRecord(payload)) return `Canvas Agent 返回无效响应：${String(payload)}`;
  if (payload.ok === false) return scrub(payload.error || payload.message || JSON.stringify(payload), "");
  return "";
}

function createToolCaller(config) {
  return async (name, input) => {
    const response = await fetch(`${config.url}/api/tools`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-canvas-agent-token": config.token },
      body: JSON.stringify({ name, input }),
      signal: AbortSignal.timeout(35_000),
    });
    const text = await response.text();
    let payload;
    try { payload = JSON.parse(text); } catch { throw new Error(scrub(`HTTP ${response.status}: ${text}`, config.token)); }
    if (!response.ok || payload?.ok === false) {
      const durableTaskId = extractTaskId(payload);
      const verification = payload?.data?.verification || payload?.result?.data?.verification || {};
      const changed = verification?.changed === true || verification?.ranGeneration === true || payload?.data?.ranGeneration === true;
      if (durableTaskId || changed) return { ...payload, __mcpToolError: scrub(callError(payload) || `HTTP ${response.status}`, config.token), __submissionEvidence: true };
      throw new Error(scrub(callError(payload) || `HTTP ${response.status}`, config.token));
    }
    return payload?.result;
  };
}

function validateInputs(matrix, references, options) {
  const canvasId = options.canvasId || matrix.canvasId || references.canvasId || DEFAULT_CANVAS_ID;
  if (!canvasId || (matrix.canvasId && matrix.canvasId !== canvasId) || (references.canvasId && references.canvasId !== canvasId)) {
    throw new Error("matrix/references/canvasId 必须一致");
  }
  if (!Array.isArray(matrix.cases) || !matrix.cases.length) throw new Error("matrix.cases 必须是非空数组");
  const ids = new Set();
  for (const item of matrix.cases) {
    if (!isRecord(item)) throw new Error("每个 case 必须是对象");
    const { caseId, model, ratio, resolution, prompt } = item;
    const videoOperation = item.videoOperation || item.operation;
    taskOperationIds(caseId);
    if (ids.has(caseId)) throw new Error(`重复 caseId：${caseId}`);
    ids.add(caseId);
    if (typeof model !== "string" || !model.trim()) throw new Error(`${caseId}: 缺少明确的 model`);
    if (!VIDEO_OPERATIONS.has(videoOperation)) throw new Error(`${caseId}: videoOperation 必须是显式支持的操作`);
    if (typeof ratio !== "string" || !ratio.trim() || typeof resolution !== "string" || !resolution.trim()) throw new Error(`${caseId}: ratio/resolution 必须显式填写`);
    if (typeof prompt !== "string" || !prompt.trim()) throw new Error(`${caseId}: 缺少 prompt`);
    for (const count of [item.imageCount ?? 0, item.audioCount ?? 0]) if (!Number.isInteger(count) || count < 0) throw new Error(`${caseId}: imageCount/audioCount 必须是非负整数`);
  }
  if (!Array.isArray(references.images)) references.images = [];
  if (!Array.isArray(references.audios)) references.audios = [];
  return canvasId;
}

function stateFile(outputDir, caseId) {
  return path.join(outputDir, "cases", `${caseId.replace(/[^A-Za-z0-9_-]/g, "_")}.json`);
}

function saveCase(outputDir, state) {
  atomicJson(stateFile(outputDir, state.caseId), state);
}

function saveErrorState(outputDir, item, error, token) {
  const file = stateFile(outputDir, item.caseId);
  const saved = fs.existsSync(file) ? readJson(file) : { caseId: item.caseId, model: item.model };
  const message = scrub(error?.stack || error?.message || error, token);
  if (saved.taskId) {
    saved.status = "audit_failed";
    saved.auditError = message;
  } else if (saved.runStartedAt) {
    saved.status = "needs_manual_task_reconciliation";
    saved.error = message;
  } else {
    saved.status = message.includes("用户当前限制") || message.includes("用户限制") ? "pending_user_limit" : "failed";
    saved.error = message;
  }
  saved.updatedAt = new Date().toISOString();
  saveCase(outputDir, saved);
  return saved;
}

function currentNode(context, id) {
  return context?.nodes?.find((node) => node.id === id);
}

function generationModeData(contextNode) {
  return contextNode?.generation || {};
}

function exactModelFromCatalog(catalog, model) {
  const candidates = Array.isArray(catalog?.models) ? catalog.models : [];
  return candidates.find((entry) => [entry?.model, entry?.value, entry?.modelId, entry?.logicalModelId, entry?.name].some((value) => value === model));
}

function validateModelCapacity(modelEntry, item, chosen) {
  const supports = modelEntry?.supports;
  if (!isRecord(supports)) return;
  if (Array.isArray(supports.operations) && !supports.operations.includes(item.videoOperation)) throw new Error(`${item.caseId}: 当前目录不支持型号 ${item.model} 的 ${item.videoOperation}`);
  for (const [kind, actual] of [["ReferenceImages", chosen.images.length], ["ReferenceAudios", chosen.audios.length]]) {
    const min = Number(supports[`min${kind}`]);
    const max = Number(supports[`max${kind}`]);
    if (Number.isFinite(min) && actual < min) throw new Error(`${item.caseId}: 当前目录要求 ${kind} 至少 ${min}，实际 ${actual}`);
    if (Number.isFinite(max) && actual > max) throw new Error(`${item.caseId}: 当前目录最多接受 ${max} 个 ${kind}，实际 ${actual}`);
  }
}

function classifyTask(result) {
  const statuses = [];
  const visit = (value) => {
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (key === "status" && typeof child === "string") statuses.push(child.toLowerCase());
      else if (child && typeof child === "object") visit(child);
    }
  };
  visit(result);
  if (statuses.some((status) => TERMINAL_OK.has(status))) return "success";
  if (statuses.some((status) => TERMINAL_BAD.has(status))) return "failure";
  return "pending";
}

function delayForTask(result) {
  const next = Date.parse(result?.nextPollAt || result?.task?.nextPollAt || "");
  if (Number.isFinite(next)) return Math.max(500, Math.min(10_000, next - Date.now()));
  const retry = Number(result?.retryAfterMs || result?.task?.retryAfterMs || result?.queryError?.retryAfterMs);
  return Number.isFinite(retry) ? Math.max(500, Math.min(10_000, retry)) : 2_000;
}

function getResource(context, nodeId) {
  return context?.resources?.find((resource) => resource.nodeId === nodeId && resource.isReady && resource.resourceId)
    || context?.resources?.find((resource) => resource.nodeId === nodeId && resource.resourceId);
}

function validateReferenceNodes(references, context, chosen) {
  const byId = new Map(context.nodes.map((node) => [node.id, node]));
  const all = [...chosen.images, ...chosen.audios];
  for (const ref of all) {
    const node = byId.get(ref.nodeId);
    const resource = context.resources.find((entry) => entry.nodeId === ref.nodeId);
    if (!node) throw new Error(`参考节点不存在于当前 canvas_get_context：${ref.nodeId}`);
    if (!resource?.isReady || !resource.resourceId) throw new Error(`参考节点没有已就绪资源：${ref.nodeId}`);
    if (ref.resourceId && ref.resourceId !== resource.resourceId) throw new Error(`references.json resourceId 与画布不一致：${ref.nodeId}`);
  }
  return all.map((ref) => ({ ...ref, observedResource: context.resources.find((item) => item.nodeId === ref.nodeId) }));
}

function validateOperationReferences(item, chosen) {
  if (item.videoOperation === "text_to_video" && (chosen.images.length || chosen.audios.length)) throw new Error(`${item.caseId}: text_to_video case 不应连接媒体参考`);
  if (item.videoOperation === "image_to_video" && chosen.images.length < 1) throw new Error(`${item.caseId}: image_to_video 需要至少一张参考图`);
  if (item.imageCount !== undefined && chosen.images.length !== item.imageCount) throw new Error(`${item.caseId}: 已选图片数 ${chosen.images.length} 与 case.imageCount=${item.imageCount} 不符`);
  if (item.videoOperation === "audio_to_video" && chosen.audios.length < 1) throw new Error(`${item.caseId}: audio_to_video 至少需要一个音频参考`);
  if (item.videoOperation === "reference_to_video" && chosen.images.length + chosen.audios.length < 1) throw new Error(`${item.caseId}: reference_to_video 需要参考媒体`);
}

function extractNodeId(result) {
  if (typeof result?.nodeId === "string") return result.nodeId;
  if (Array.isArray(result?.nodes)) return result.nodes.find((node) => node?.type === "video")?.id || "";
  if (Array.isArray(result?.createdNodes)) return result.createdNodes.find((node) => node?.type === "video")?.id || "";
  return "";
}

function deriveVideoNodeId(createOperationId) {
  return `video-${crypto.createHash("sha256").update(createOperationId).digest("hex").slice(0, 16)}`;
}

async function runCase(item, deps) {
  const { callTool, outputDir, canvasId, references, write, execute } = deps;
  const file = stateFile(outputDir, item.caseId);
  const prior = fs.existsSync(file) ? readJson(file) : null;
  item = { ...item, videoOperation: item.videoOperation || item.operation };
  const opIds = taskOperationIds(item.caseId);
  const state = prior || { caseId: item.caseId, model: item.model, status: "planned", events: [], startedAt: new Date().toISOString() };
  const hasDurableSideEffect = Boolean(prior && (prior.createOperationId || prior.runOperationId || prior.nodeId || prior.taskId || prior.runStartedAt));
  if (hasDurableSideEffect && (prior.model !== item.model || (prior.videoOperation || prior.operation) !== item.videoOperation || prior.ratio !== item.ratio || prior.resolution !== item.resolution || prior.prompt !== item.prompt)) {
    throw new Error(`${item.caseId}: 与已保存 case 定义不同；请更换 caseId，避免幂等 ID 指向不同请求`);
  }
  if (state.taskId) return state;
  if (state.status === "run_submitting" || state.status === "submission_uncertain") {
    state.status = "needs_manual_task_reconciliation";
    state.error = "先前运行器可能已发起生成但尚未持久化 taskId；为避免重复收费，不自动重提。请按已保存 nodeId/clientOperationId 查询任务。";
    saveCase(outputDir, state);
    return state;
  }
  Object.assign(state, { videoOperation: item.videoOperation, ratio: item.ratio, resolution: item.resolution, prompt: item.prompt, imageCount: item.imageCount || 0, audioCount: item.audioCount || 0, requestedSeconds: 2 });
  state.events ||= [];
  saveCase(outputDir, state);

  const chosen = chooseReferences(references, item.ratio, item.imageCount ?? 0, item.audioCount ?? 0);
  if ((item.imageCount ?? 0) > MAX_REFERENCE_IMAGES || (item.audioCount ?? 0) > MAX_REFERENCE_AUDIOS) {
    state.status = "pending_user_limit";
    state.error = `用户当前限制参考图片最多 ${MAX_REFERENCE_IMAGES} 张、参考音频最多 ${MAX_REFERENCE_AUDIOS} 段；该矩阵项超限，保留为未测试，不生成额外素材或复用重复资源`;
    saveCase(outputDir, state);
    return state;
  }
  if (chosen.images.length < (item.imageCount ?? 0) || chosen.audios.length < (item.audioCount ?? 0)) {
    state.status = "pending_fixture";
    state.error = `等待参考资源：需要 images=${item.imageCount ?? 0}, audios=${item.audioCount ?? 0}; 可用 images=${chosen.images.length}, audios=${chosen.audios.length}`;
    saveCase(outputDir, state);
    return state;
  }
  validateOperationReferences(item, chosen);
  state.references = chosen;
  const context = await callTool("canvas_get_context", { canvasId });
  if (context?.canvas?.projectId !== canvasId) throw new Error(`活动画布不匹配：期望 ${canvasId}，得到 ${context?.canvas?.projectId}`);
  state.before = { revision: context.revision, stateHash: context.stateHash };
  const verifiedRefs = validateReferenceNodes(references, context, chosen);
  state.referenceEvidence = verifiedRefs;
  const catalog = await callTool("film_list_models", {
    canvasId, capability: "video", model: item.model,
    input: { textCount: 1, imageCount: chosen.images.length, audioCount: chosen.audios.length, videoCount: 0 },
    videoSeconds: 2, videoOperation: item.videoOperation, videoRatio: item.ratio, videoResolution: item.resolution,
  });
  state.catalogQuery = { capability: "video", model: item.model, videoOperation: item.videoOperation, videoRatio: item.ratio, videoResolution: item.resolution, videoSeconds: 2 };
  state.catalogResult = catalog;
  const modelEntry = exactModelFromCatalog(catalog, item.model);
  if (!modelEntry) throw new Error(`film_list_models 未返回精确型号 ${item.model}；拒绝自动替换型号`);
  validateModelCapacity(modelEntry, item, chosen);
  state.selectedCatalogModel = modelEntry;
  if (!execute) {
    state.status = "dry_run_ready";
    state.updatedAt = new Date().toISOString();
    saveCase(outputDir, state);
    return state;
  }

  const existingNodeId = state.nodeId || deriveVideoNodeId(opIds.create);
  const latest = await callTool("canvas_get_context", { canvasId });
  const existingNode = currentNode(latest, existingNodeId);
  if (!existingNode) {
    const refs = [...chosen.images, ...chosen.audios].map((reference) => reference.nodeId);
    const createInput = {
      canvasId,
      expectedCanvasId: canvasId,
      expectedRevision: latest.revision,
      expectedStateHash: latest.stateHash,
      clientOperationId: opIds.create,
      prompt: item.prompt,
      title: `H3 ${item.kind || item.videoOperation} ${String(item.model).split("::").at(-1).replace(/^minimax_h3_/, "")}`,
      mode: "video", autoRun: false,
      model: item.model,
      videoOperation: item.videoOperation,
      videoSeconds: 2,
      videoRatio: item.ratio,
      videoResolution: item.resolution,
      referenceNodeIds: refs,
      ...(typeof item.x === "number" ? { x: item.x } : {}),
      ...(typeof item.y === "number" ? { y: item.y } : {}),
    };
    state.status = "creating_flow";
    state.createOperationId = opIds.create;
    saveCase(outputDir, state);
    const created = await write("canvas_create_generation_flow", createInput);
    const nodeId = extractNodeId(created) || existingNodeId;
    const readback = await callTool("canvas_get_context", { canvasId });
    const createdNode = currentNode(readback, nodeId);
    if (!createdNode || createdNode.type !== "video") throw new Error(`流程创建后没有在 context 回读到视频节点：${nodeId}`);
    state.nodeId = nodeId;
    state.createdFlow = created;
    state.flowReadback = { nodeId, revision: readback.revision, stateHash: readback.stateHash };
  } else {
    state.nodeId = existingNodeId;
  }
  const beforeRun = await callTool("canvas_get_context", { canvasId });
  const videoNode = currentNode(beforeRun, state.nodeId);
  if (!videoNode) throw new Error(`待运行的视频节点已不存在：${state.nodeId}`);
  const persistedTaskId = generationModeData(videoNode).taskId;
  if (persistedTaskId) {
    state.taskId = persistedTaskId;
    state.status = "task_recovered_from_canvas";
    saveCase(outputDir, state);
    return state;
  }
  if (state.runStartedAt || state.status === "run_submitting") {
    state.status = "needs_manual_task_reconciliation";
    state.error = "节点已存在但未回读 taskId；为避免重复收费，停止自动提交。";
    saveCase(outputDir, state);
    return state;
  }
  state.runOperationId = opIds.run;
  state.runStartedAt = new Date().toISOString();
  state.status = "run_submitting";
  saveCase(outputDir, state);
  const runResult = await write("canvas_run_generation", {
    canvasId,
    expectedCanvasId: canvasId,
    expectedRevision: beforeRun.revision,
    expectedStateHash: beforeRun.stateHash,
    nodeId: state.nodeId,
    mode: "video",
    prompt: item.prompt,
    clientOperationId: opIds.run,
  });
  state.runReceipt = runResult;
  const taskId = extractTaskId(runResult);
  if (taskId) state.taskId = taskId;
  const afterRun = await callTool("canvas_get_context", { canvasId });
  const taskFromCanvas = generationModeData(currentNode(afterRun, state.nodeId)).taskId;
  if (taskFromCanvas) state.taskId ||= taskFromCanvas;
  if (!state.taskId) {
    state.status = "submission_uncertain";
    state.error = "工具调用返回后未能取得持久 taskId；不会重提。请使用 nodeId/clientOperationId 核对。";
  } else state.status = "submitted";
  state.updatedAt = new Date().toISOString();
  saveCase(outputDir, state);
  return state;
}

async function finishCase(state, deps) {
  const { callTool, outputDir, canvasId, write } = deps;
  if (!state.taskId || state.status === "needs_manual_task_reconciliation") return state;
  if (state.status === "success") {
    if (!state.recordResult) {
      const current = await callTool("canvas_get_context", { canvasId });
      state.recordResult = await write("film_record_model_outputs", { canvasId, taskIds: [state.taskId], expectedCanvasId: canvasId, expectedRevision: current.revision, expectedStateHash: current.stateHash });
      saveCase(outputDir, state);
    }
    return state;
  }
  if (state.status === "failed" || state.status === "upstream_duration_mismatch") return state;
  let taskResult = state.taskResult;
  const pollStarted = Date.now();
  for (let attempt = 0; attempt < 180 && Date.now() - pollStarted < 120_000; attempt++) {
    if (taskResult && classifyTask(taskResult) === "success") break;
    if (taskResult && classifyTask(taskResult) === "failure") break;
    if (attempt > 0) await new Promise((resolve) => setTimeout(resolve, delayForTask(taskResult)));
    taskResult = await callTool("film_wait_task", { canvasId, taskId: state.taskId, timeoutMs: 10_000, pollMs: 2_000 });
    state.taskResult = taskResult;
    state.updatedAt = new Date().toISOString();
    saveCase(outputDir, state);
  }
  const outcome = classifyTask(taskResult);
  if (outcome === "pending") {
    state.status = "still_running";
    saveCase(outputDir, state);
    return state;
  }
  if (outcome === "failure") {
    state.status = "failed";
    state.error = taskResult?.error || taskResult?.errorMessage || taskResult?.queryError || "任务以失败状态终止";
    saveCase(outputDir, state);
    return state;
  }
  state.task = await callTool("film_get_tasks", { canvasId, taskIds: [state.taskId], waitMs: 0 });
  saveCase(outputDir, state);
  const context = await callTool("canvas_get_context", { canvasId });
  const resource = getResource(context, state.nodeId);
  if (!resource) {
    state.status = "success_missing_resource";
    state.error = "任务成功但 canvas_get_context 未提供可探测资源";
    saveCase(outputDir, state);
    return state;
  }
  state.resourceEvidence = { ...resource, localPath: state.taskResult?.localPath || state.taskResult?.resource?.path || state.task?.localPath || null };
  saveCase(outputDir, state);
  const probeContext = await callTool("canvas_get_context", { canvasId });
  state.probeResult = await write("film_probe_media", { resourceId: resource.resourceId, fullDecode: true, canvasId, expectedCanvasId: canvasId, expectedRevision: probeContext.revision, expectedStateHash: probeContext.stateHash });
  state.media = extractMediaEvidence(state.probeResult);
  saveCase(outputDir, state);
  const durationMs = extractDurationMs(state.probeResult);
  if (!withinHardDurationLimit(durationMs)) {
    state.status = "upstream_duration_mismatch";
    state.error = `2 秒请求的实际媒体时长必须大于 0 且不超过 3000ms；探测值=${durationMs ?? "缺失"}`;
    saveCase(outputDir, state);
    return state;
  }
  const recordContext = await callTool("canvas_get_context", { canvasId });
  state.recordResult = await write("film_record_model_outputs", { taskIds: [state.taskId], canvasId, expectedCanvasId: canvasId, expectedRevision: recordContext.revision, expectedStateHash: recordContext.stateHash });
  state.status = "success";
  state.actualDurationMs = durationMs;
  state.completedAt = new Date().toISOString();
  saveCase(outputDir, state);
  return state;
}

function extractMediaEvidence(probe) {
  const find = (object, names) => {
    if (!object || typeof object !== "object") return undefined;
    for (const name of names) if (object[name] !== undefined) return object[name];
    for (const child of Object.values(object)) if (child && typeof child === "object") {
      const found = find(child, names);
      if (found !== undefined) return found;
    }
  };
  return {
    width: find(probe, ["width", "videoWidth"]),
    height: find(probe, ["height", "videoHeight"]),
    durationMs: extractDurationMs(probe),
    audioTracks: find(probe, ["audioTracks", "audioStreams", "audioTrackCount", "hasAudio", "audio"]),
    localPath: find(probe, ["localPath", "filePath", "path"]),
  };
}

async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) return showHelp();
  const matrix = readJson(options.matrix);
  const references = readJsonOr(options.references, { canvasId: "", images: [], audios: [] });
  const canvasId = validateInputs(matrix, references, options);
  fs.mkdirSync(options.output, { recursive: true });
  const summaryPath = path.join(options.output, "run.json");
  const run = { canvasId, matrixPath: options.matrix, referencesPath: options.references, mode: options.execute ? "execute" : "dry_run", concurrency: options.concurrency, startedAt: new Date().toISOString(), cases: [] };
  atomicJson(summaryPath, run);
  const config = loadRuntimeConfig();
  const callTool = createToolCaller(config);
  let lock = Promise.resolve();
  const write = async (tool, input) => {
    if (tool === "film_probe_media" || tool === "film_record_model_outputs") {
      const { expectedCanvasId, expectedRevision, expectedStateHash, ...request } = input;
      return callTool(tool, { ...request, canvasId });
    }
    const operation = lock.then(async () => {
      for (let attempt = 0; attempt < 8; attempt++) {
        const fresh = await callTool("canvas_get_context", { canvasId });
        if (fresh?.canvas?.projectId !== canvasId) throw new Error(`每次写操作前画布状态校验失败：${fresh?.canvas?.projectId || "无 projectId"}`);
        const { canvasId: ignoredCanvasId, ...request } = input;
        const scopedInput = { ...request, expectedCanvasId: canvasId, expectedRevision: fresh.revision, expectedStateHash: fresh.stateHash };
        try { return await callTool(tool, scopedInput); }
        catch (error) {
          const message = String(error?.message || error);
          const stale = /画布状态已变化|revision 已从|请重新读取 canvas_get_context 后再执行|stale|state hash/i.test(message);
          if (!stale || attempt === 7) throw error;
          await new Promise((resolve) => setTimeout(resolve, Math.min(850, 120 * 2 ** attempt)));
        }
      }
      throw new Error("画布写操作因状态持续变化而停止");
    });
    lock = operation.catch(() => {});
    return operation;
  };
  const deps = { callTool, outputDir: options.output, canvasId, references, write, execute: options.execute };
  if (options.execute) {
    const initial = await callTool("canvas_get_context", { canvasId });
    if (initial?.canvas?.projectId !== canvasId) throw new Error(`没有连接指定 QA 画布 ${canvasId}`);
  }
  const baselineFile = path.join(path.dirname(options.matrix), "fast-baseline.json");
  const fastResultsFile = path.join(path.dirname(options.matrix), "fast-results.json");
  const fastResults = readJsonOr(fastResultsFile, { cases: [] }).cases || [];
  const baselineCases = fastResults.length ? fastResults : (readJsonOr(baselineFile, { cases: [] }).cases || []);
  const normalizedCases = matrix.cases.map((item) => ({ ...item, videoOperation: item.videoOperation || item.operation }));
  const byModel = new Map();
  for (const item of normalizedCases) {
    if (!byModel.has(item.model)) byModel.set(item.model, []);
    byModel.get(item.model).push(item);
  }
  const modelGroups = [...byModel.entries()];
  const states = (await mapLimit(modelGroups, options.concurrency, async ([model, cases]) => {
    const modelStates = [];
    const inScope = cases.filter((item) => item.ratio === "16:9" && (item.imageCount || 0) <= MAX_REFERENCE_IMAGES && (item.audioCount || 0) <= MAX_REFERENCE_AUDIOS);
    const noRefT2v = inScope.filter((item) => item.videoOperation === "text_to_video" && (item.imageCount || 0) === 0 && (item.audioCount || 0) === 0);
    const baselineRows = baselineCases.filter((row) => row.model === model && row.operation === "text_to_video" && row.ratio === "16:9");
    const adopted = baselineRows.find((row) => noRefT2v.some((item) => item.ratio === row.ratio && item.resolution === row.resolution && item.kind === "single_speech"));
    const baselineItem = adopted
      ? noRefT2v.find((item) => item.ratio === adopted.ratio && item.resolution === adopted.resolution && item.kind === "single_speech")
      : noRefT2v.filter((item) => item.ratio === "16:9" && item.kind === "single_speech").sort((a, b) => resolutionRank(a.resolution) - resolutionRank(b.resolution))[0]
        || inScope.filter((item) => item.ratio === "16:9" && item.kind === "single_speech" && (item.audioCount || 0) === 0)
          .sort((a, b) => (a.imageCount || 0) - (b.imageCount || 0) || resolutionRank(a.resolution) - resolutionRank(b.resolution))[0];
    let baselineState;
    if (baselineItem) {
      try {
        if (adopted) {
          const priorBaseline = fs.existsSync(stateFile(options.output, baselineItem.caseId)) ? readJson(stateFile(options.output, baselineItem.caseId)) : null;
          const adoptedProbe = adopted.probe;
          const adoptedDuration = adoptedProbe ? extractDurationMs(adoptedProbe) : undefined;
          const adoptedSucceeded = TERMINAL_OK.has(String(adopted.task?.status || "").toLowerCase());
          const adoptedStatus = adoptedProbe && adoptedSucceeded
            ? (withinHardDurationLimit(adoptedDuration) ? "success" : "upstream_duration_mismatch")
            : "adopted_existing_task";
          const freshAdopted = {
            caseId: baselineItem.caseId, model, videoOperation: "text_to_video", ratio: adopted.ratio,
            resolution: adopted.resolution, prompt: baselineItem.prompt, nodeId: adopted.nodeId,
            taskId: adopted.taskId, status: adoptedStatus, requestedSeconds: 2,
            adoptedFrom: adopted.probe ? fastResultsFile : baselineFile,
            task: adopted.task, taskResult: adopted.task, probeResult: adoptedProbe,
            media: adoptedProbe ? extractMediaEvidence(adoptedProbe) : undefined,
            actualDurationMs: adoptedDuration,
            resourceEvidence: adopted.task?.result?.video ? { ...adopted.task.result.video, localPath: adopted.task.result.video.path || null } : undefined,
            error: adoptedProbe && !withinHardDurationLimit(adoptedDuration) ? `existing baseline duration ${adoptedDuration}ms exceeds 3000ms` : undefined,
          };
          baselineState = priorBaseline ? { ...freshAdopted, ...priorBaseline, task: priorBaseline.task || freshAdopted.task, taskResult: priorBaseline.taskResult || freshAdopted.taskResult, probeResult: priorBaseline.probeResult || freshAdopted.probeResult, media: priorBaseline.media || freshAdopted.media, actualDurationMs: priorBaseline.actualDurationMs ?? freshAdopted.actualDurationMs, status: priorBaseline.recordResult ? priorBaseline.status : adoptedStatus } : freshAdopted;
          saveCase(options.output, baselineState);
        } else baselineState = await runCase(baselineItem, deps);
        if (options.execute && baselineState.taskId && baselineState.status !== "needs_manual_task_reconciliation") baselineState = await finishCase(baselineState, deps);
        modelStates.push(baselineState);
      } catch (error) {
        baselineState = { caseId: baselineItem.caseId, model, status: "failed", error: scrub(error?.stack || error?.message || error, config.token) };
        saveCase(options.output, baselineState);
        modelStates.push(baselineState);
      }
    }
    let gateOpen = baselineState?.status === "success" && Number(baselineState.actualDurationMs) <= 3000;
    const rest = cases.filter((item) => item !== baselineItem);
    for (const item of rest) {
      if (item.ratio !== "16:9") {
        const state = { caseId: item.caseId, model, status: "out_of_scope_user_limit", operation: item.videoOperation, ratio: item.ratio, resolution: item.resolution, error: "本轮仅测 16:9 视频" };
        saveCase(options.output, state); modelStates.push(state); continue;
      }
      if ((item.imageCount || 0) > MAX_REFERENCE_IMAGES) {
        const state = { caseId: item.caseId, model, status: "pending_user_limit", operation: item.videoOperation, ratio: item.ratio, resolution: item.resolution, error: `矩阵请求 ${item.imageCount} 张图，当前限制最多 ${MAX_REFERENCE_IMAGES} 张；不生成额外图片` };
        saveCase(options.output, state); modelStates.push(state); continue;
      }
      if ((item.audioCount || 0) > MAX_REFERENCE_AUDIOS) {
        const state = { caseId: item.caseId, model, status: "pending_user_limit", operation: item.videoOperation, ratio: item.ratio, resolution: item.resolution, error: `矩阵请求 ${item.audioCount} 段参考音频，当前限制最多 ${MAX_REFERENCE_AUDIOS} 段` };
        saveCase(options.output, state); modelStates.push(state); continue;
      }
      if ((item.imageCount || 0) > 0 && chooseReferences(references, item.ratio, item.imageCount, item.audioCount || 0).images.length < item.imageCount
          || (item.audioCount || 0) > 0 && chooseReferences(references, item.ratio, item.imageCount || 0, item.audioCount).audios.length < item.audioCount) {
        const state = { caseId: item.caseId, model, status: "pending_fixture", operation: item.videoOperation, ratio: item.ratio, resolution: item.resolution, error: "等待所需参考图片/音频资源" };
        saveCase(options.output, state); modelStates.push(state); continue;
      }
      if (!gateOpen) {
        const state = { caseId: item.caseId, model, status: "baseline_gate_pending", operation: item.videoOperation, ratio: item.ratio, resolution: item.resolution, error: baselineState?.status === "upstream_duration_mismatch" ? "该型号探测到实际时长超过 3 秒，已暂停后续提交" : "该型号 baseline 尚未 fullDecode/probe 确认实际时长 ≤3 秒；暂不生成后续 case" };
        saveCase(options.output, state); modelStates.push(state); continue;
      }
      if (!options.execute) {
        const state = { caseId: item.caseId, model, status: "prepared_only", operation: item.videoOperation, ratio: item.ratio, resolution: item.resolution };
        saveCase(options.output, state); modelStates.push(state); continue;
      }
      try {
        let state = await runCase(item, deps);
        if (state.taskId && state.status !== "needs_manual_task_reconciliation") state = await finishCase(state, deps);
        modelStates.push(state);
        if (state.status === "upstream_duration_mismatch") gateOpen = false;
      } catch (error) {
        const state = { caseId: item.caseId, model, status: "failed", error: scrub(error?.stack || error?.message || error, config.token) };
        saveCase(options.output, state); modelStates.push(state);
      }
    }
    return modelStates;
  })).flat();
  run.cases = states.map((state) => ({ caseId: state.caseId, model: state.model, status: state.status, taskId: state.taskId || null, error: state.error || null }));
  run.completedAt = new Date().toISOString();
  atomicJson(summaryPath, run);
  console.log(`Saved ${states.length} case record(s) to ${options.output}`);
  for (const state of states) console.log(`${state.caseId}: ${state.status}${state.taskId ? ` task=${state.taskId}` : ""}${state.error ? ` — ${String(state.error).replace(/\s+/g, " ").slice(0, 260)}` : ""}`);
  if (options.execute && states.some((state) => !["success", "needs_manual_task_reconciliation", "still_running", "pending_fixture", "pending_user_limit", "baseline_gate_pending", "prepared_only", "adopted_existing_task"].includes(state.status))) process.exitCode = 1;
}

function resolutionRank(value) {
  const number = Number(String(value || "").match(/\d+/)?.[0]);
  return Number.isFinite(number) ? number : Number.MAX_SAFE_INTEGER;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error?.message || String(error));
    process.exitCode = 1;
  });
}
