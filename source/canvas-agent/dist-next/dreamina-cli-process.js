import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { buildCliChildEnvironment, CliChildEnvironmentError } from "./cli-child-environment.js";
const OUTPUT_LIMIT_BYTES = 2 * 1024 * 1024;
const CLEANUP_DEADLINE_MS = 5_000;
export class DreaminaCliError extends Error {
    code;
    statusCode;
    constructor(code, message, statusCode = 500) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = "DreaminaCliError";
    }
}
const STABLE_DREAMINA_ERROR_CODES = new Set([
    "dreamina_cancelled",
    "dreamina_cleanup_failed",
    "dreamina_command_invalid",
    "dreamina_command_timeout",
    "dreamina_environment_invalid",
    "dreamina_generation_failed",
    "dreamina_idempotency_conflict",
    "dreamina_internal_error",
    "dreamina_interrupted_before_submission",
    "dreamina_login_failed",
    "dreamina_login_pending",
    "dreamina_login_required",
    "dreamina_login_response_invalid",
    "dreamina_logout_failed",
    "dreamina_missing",
    "dreamina_official_incomplete",
    "dreamina_output_too_large",
    "dreamina_query_failed",
    "dreamina_query_response_invalid",
    "dreamina_reference_budget_exceeded",
    "dreamina_reference_cleanup_failed",
    "dreamina_reference_invalid",
    "dreamina_request_invalid",
    "dreamina_spawn_failed",
    "dreamina_state_busy",
    "dreamina_state_fenced",
    "dreamina_state_invalid",
    "dreamina_submit_exit_nonzero",
    "dreamina_submit_receipt_missing",
    "dreamina_submit_spawn_failed",
    "dreamina_submit_timeout",
    "dreamina_submission_unknown",
    "dreamina_task_not_found",
    "dreamina_version_failed",
]);
export function isStableDreaminaErrorCode(value) {
    return STABLE_DREAMINA_ERROR_CODES.has(value);
}
export async function runDreaminaProcess(request, dependencies = {}) {
    validateInvocation(request);
    const environment = safeEnvironment(request.env ?? process.env);
    const cleanupTimeoutMs = Number.isFinite(dependencies.cleanupTimeoutMs)
        ? Math.max(1, Math.min(dependencies.cleanupTimeoutMs, CLEANUP_DEADLINE_MS))
        : CLEANUP_DEADLINE_MS;
    const terminateProcessTree = dependencies.terminateProcessTree ?? terminateExactProcessTree;
    if (request.signal?.aborted) {
        throw new DreaminaCliError("dreamina_cancelled", "Dreamina 操作已取消", 499);
    }
    return new Promise((resolve, reject) => {
        let child;
        let settled = false;
        let stopping = false;
        let totalBytes = 0;
        const stdout = [];
        const stderr = [];
        let timer;
        let childClosed = false;
        let resolveChildClosed;
        const childClosedPromise = new Promise((resolve) => { resolveChildClosed = resolve; });
        const finish = (error, result) => {
            if (settled)
                return;
            settled = true;
            if (timer)
                clearTimeout(timer);
            request.signal?.removeEventListener("abort", onAbort);
            if (error)
                reject(error);
            else
                resolve(result);
        };
        const stop = (error) => {
            if (settled || stopping)
                return;
            stopping = true;
            if (timer)
                clearTimeout(timer);
            request.signal?.removeEventListener("abort", onAbort);
            void terminateWithDeadline(child, terminateProcessTree, childClosedPromise, () => childClosed, cleanupTimeoutMs).then(() => finish(error), () => finish(new DreaminaCliError("dreamina_cleanup_failed", "Dreamina 进程清理失败，请检查本机进程状态", 500)));
        };
        const onAbort = () => stop(new DreaminaCliError("dreamina_cancelled", "Dreamina 操作已取消", 499));
        const completeFromOutput = () => {
            if (settled || stopping || !request.completeOnJsonOutput)
                return;
            const value = acceptedJsonOutput(Buffer.concat(stdout).toString("utf8"), request.completeOnJsonOutput);
            if (!value)
                return;
            stopping = true;
            if (timer)
                clearTimeout(timer);
            request.signal?.removeEventListener("abort", onAbort);
            void terminateWithDeadline(child, terminateProcessTree, childClosedPromise, () => childClosed, cleanupTimeoutMs).then(() => finish(undefined, {
                exitCode: 0,
                stdout: value,
                stderr: Buffer.concat(stderr).toString("utf8"),
            }), () => finish(new DreaminaCliError("dreamina_cleanup_failed", "Dreamina 进程清理失败，请检查本机进程状态", 500)));
        };
        const collect = (target, onCollected) => (chunk) => {
            const value = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            totalBytes += value.byteLength;
            if (totalBytes > OUTPUT_LIMIT_BYTES) {
                stop(new DreaminaCliError("dreamina_output_too_large", "Dreamina 返回内容超过安全上限", 502));
                return;
            }
            target.push(value);
            onCollected?.();
        };
        try {
            child = spawn(request.executable, request.args, {
                detached: process.platform !== "win32",
                shell: false,
                windowsHide: true,
                stdio: ["ignore", "pipe", "pipe"],
                env: environment,
            });
        }
        catch {
            finish(new DreaminaCliError("dreamina_spawn_failed", "无法启动 Dreamina CLI", 503));
            return;
        }
        child.stdout.on("data", collect(stdout, completeFromOutput));
        child.stderr.on("data", collect(stderr));
        child.once("error", () => {
            if (!stopping) {
                finish(new DreaminaCliError("dreamina_spawn_failed", "无法启动 Dreamina CLI", 503));
            }
        });
        child.once("close", (exitCode) => {
            childClosed = true;
            resolveChildClosed();
            if (!stopping) {
                finish(undefined, {
                    exitCode,
                    stdout: Buffer.concat(stdout).toString("utf8"),
                    stderr: Buffer.concat(stderr).toString("utf8"),
                });
            }
        });
        request.signal?.addEventListener("abort", onAbort, { once: true });
        timer = setTimeout(() => stop(new DreaminaCliError("dreamina_command_timeout", "Dreamina 操作超时，相关进程已清理", 504)), request.timeoutMs);
        timer.unref();
        if (child.pid)
            request.onSpawn?.(child.pid);
        if (request.signal?.aborted)
            onAbort();
    });
}
function acceptedJsonOutput(value, accepts) {
    const trimmed = value.trim();
    const candidates = [trimmed, ...trimmed.split(/\r?\n/).map((line) => line.trim())];
    for (const candidate of new Set(candidates)) {
        if (!candidate)
            continue;
        try {
            const parsed = JSON.parse(candidate);
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && accepts(parsed))
                return candidate;
        }
        catch {
            // A later chunk or line may complete the bounded JSON response.
        }
    }
    return "";
}
export function sanitizeDreaminaDiagnostic(value) {
    return String(value || "")
        .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
        .replace(/(api[_-]?key|access[_-]?token|refresh[_-]?token|authorization|cookie|device[_-]?code|token|secret|password)\s*[:=]\s*["']?[^\s,"'}]+/gi, "$1=[redacted]")
        .replace(/https?:\/\/[^\s"']+/gi, "[redacted-url]")
        .replace(/(?:[A-Za-z]:[\\/][^\s"']+|\/(?:Users|home|root|var|tmp)\/[^\s"']+)/gi, "[redacted-path]")
        .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, "[redacted-account]")
        .replace(/\b[A-Za-z0-9_-]{40,}\b/g, "[redacted]")
        .slice(0, 240);
}
export async function discoverDreaminaExecutable(env = process.env, signal) {
    const explicit = env.DREAMINA_CLI_PATH?.trim();
    if (explicit) {
        if (!path.isAbsolute(explicit) || explicit.includes("\0"))
            return { installed: false };
        return fs.existsSync(explicit)
            ? { installed: true, executable: explicit }
            : { installed: false };
    }
    const finder = process.platform === "win32" ? "where.exe" : "which";
    try {
        const result = await runDreaminaProcess({
            executable: finder,
            args: ["dreamina"],
            timeoutMs: 1_500,
            env,
            signal,
        });
        const executable = result.stdout.split(/\r?\n/).map((line) => line.trim()).find(Boolean);
        return result.exitCode === 0 && executable
            ? { installed: true, executable }
            : { installed: false };
    }
    catch (error) {
        if (error instanceof DreaminaCliError && error.code === "dreamina_cancelled")
            throw error;
        return { installed: false };
    }
}
function validateInvocation(request) {
    if (!request.executable.trim()
        || request.executable.length > 1_024
        || request.executable.includes("\0")) {
        throw new DreaminaCliError("dreamina_command_invalid", "Dreamina 可执行文件无效", 400);
    }
    if (!Array.isArray(request.args)
        || request.args.some((value) => typeof value !== "string"
            || value.includes("\0")
            || value.length > 32_768)) {
        throw new DreaminaCliError("dreamina_command_invalid", "Dreamina 参数无效", 400);
    }
    if (!Number.isFinite(request.timeoutMs)
        || request.timeoutMs < 1
        || request.timeoutMs > 10 * 60_000) {
        throw new DreaminaCliError("dreamina_command_invalid", "Dreamina 超时参数无效", 400);
    }
}
function safeEnvironment(source) {
    try {
        return buildCliChildEnvironment(source);
    }
    catch (error) {
        if (!(error instanceof CliChildEnvironmentError))
            throw error;
        const message = error.reason === "conflict"
            ? "Dreamina 环境变量存在冲突"
            : error.reason === "proxy"
                ? "Dreamina 代理环境变量无效"
                : "Dreamina 代理绕过列表无效";
        throw new DreaminaCliError("dreamina_environment_invalid", message, 500);
    }
}
async function terminateWithDeadline(child, terminateProcessTree, childClosedPromise, isChildClosed, timeoutMs) {
    let timer;
    try {
        await Promise.race([
            (async () => {
                await terminateProcessTree(child);
                if (!isChildClosed())
                    await childClosedPromise;
            })(),
            new Promise((_resolve, reject) => {
                timer = setTimeout(() => reject(new Error("cleanup deadline exceeded")), timeoutMs);
                timer.unref();
            }),
        ]);
    }
    finally {
        if (timer)
            clearTimeout(timer);
    }
}
async function terminateExactProcessTree(child) {
    if (!child.pid)
        return;
    if (process.platform === "win32") {
        await new Promise((resolve, reject) => {
            const killer = spawn("taskkill.exe", ["/pid", String(child.pid), "/t", "/f"], {
                shell: false,
                windowsHide: true,
                stdio: "ignore",
            });
            killer.once("error", reject);
            killer.once("close", (code) => {
                if (code === 0 || child.exitCode !== null)
                    resolve();
                else
                    reject(new Error("taskkill failed"));
            });
        });
        return;
    }
    if (child.exitCode !== null || child.signalCode !== null)
        return;
    const closed = new Promise((resolve) => child.once("close", () => resolve()));
    try {
        process.kill(-child.pid, "SIGKILL");
    }
    catch (error) {
        if (error.code !== "ESRCH")
            throw error;
    }
    await closed;
}
