import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
export const LOCAL_RUNTIME_DEFAULT_PORT = 17371;
/** @deprecated Use LOCAL_RUNTIME_DEFAULT_PORT. */
export const DEFAULT_PORT = LOCAL_RUNTIME_DEFAULT_PORT;
export const CONFIG_DIR = startupConfigDirectory();
export const CONFIG_FILE = path.join(CONFIG_DIR, "canvas-agent.json");
export const VERSION = readPackageVersion();
// MCP Agent 行为规则已按用户要求清空，等待重新设定（工具接口与工具说明保持不变）。
export const AGENT_PROMPT = "";
export function loadConfig(create = false) {
    try {
        const config = normalizeLocalRuntimeConfig(JSON.parse(fs.readFileSync(CONFIG_FILE, "utf8")));
        if (create)
            saveConfig(config);
        return config;
    }
    catch (error) {
        if (error.code !== "ENOENT")
            throw error;
        const config = normalizeLocalRuntimeConfig({
            url: `http://127.0.0.1:${Number(process.env.PORT) || DEFAULT_PORT}`,
            token: crypto.randomBytes(18).toString("hex"),
            trustedWebOrigins: configuredTrustedOrigins(),
            browserRegistrations: [],
        });
        if (create)
            saveConfig(config);
        return config;
    }
}
export function normalizeLocalRuntimeConfig(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new Error("Local Runtime config is invalid");
    }
    const input = value;
    if (typeof input.url !== "string" || !isLoopbackRuntimeUrl(input.url)) {
        throw new Error("Local Runtime URL must use 127.0.0.1");
    }
    if (typeof input.token !== "string" || !input.token) {
        throw new Error("Local Runtime master token is invalid");
    }
    const trustedWebOrigins = process.env.FRAMEFIELD_TRUSTED_WEB_ORIGINS === undefined
        ? input.trustedWebOrigins ?? configuredTrustedOrigins()
        : configuredTrustedOrigins();
    if (!Array.isArray(trustedWebOrigins))
        throw new Error("Trusted Web origins are invalid");
    const normalizedOrigins = trustedWebOrigins.map(exactWebOrigin);
    if (new Set(normalizedOrigins).size !== normalizedOrigins.length) {
        throw new Error("Trusted Web origins must be unique");
    }
    if (input.browserRegistrations !== undefined && !Array.isArray(input.browserRegistrations)) {
        throw new Error("Browser registrations are invalid");
    }
    const config = {
        url: new URL(input.url).origin,
        token: input.token,
        trustedWebOrigins: normalizedOrigins,
        browserRegistrations: [...(input.browserRegistrations ?? [])],
        ...(Array.isArray(input.origins) ? { origins: [...input.origins] } : {}),
        ...(input.legacyBootstrap === true ? { legacyBootstrap: true } : {}),
        ...(input.canvases && typeof input.canvases === "object" ? { canvases: input.canvases } : {}),
        ...(typeof input.ownerId === "string" ? { ownerId: input.ownerId } : {}),
    };
    ensureRuntimeOwnerId(config);
    return config;
}
// Runtime ownership stays in Runtime state and never selects a CLI account/home.
export function ensureRuntimeOwnerId(config) {
    if (!config.ownerId || !/^[A-Za-z0-9_-]{24}$/.test(config.ownerId)) {
        config.ownerId = crypto.randomBytes(18).toString("base64url");
    }
    return config.ownerId;
}
/** @deprecated Use ensureRuntimeOwnerId. */
export const ensureOwnerId = ensureRuntimeOwnerId;
export function saveConfig(config) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}
export function ensureCanvasWorkspace(config, canvasId) {
    const id = safeSegment(canvasId || "default");
    config.canvases ||= {};
    const current = config.canvases[id];
    if (current?.workspacePath) {
        fs.mkdirSync(resolveWorkspacePath(current.workspacePath), { recursive: true });
        return { canvasId: id, ...current, workspacePath: resolveWorkspacePath(current.workspacePath) };
    }
    const workspacePath = path.join(CONFIG_DIR, "codex-workspaces", id);
    config.canvases[id] = { workspacePath };
    fs.mkdirSync(workspacePath, { recursive: true });
    saveConfig(config);
    return { canvasId: id, workspacePath };
}
export function updateCanvasWorkspace(config, canvasId, patch) {
    const current = ensureCanvasWorkspace(config, canvasId);
    const workspacePath = patch.workspacePath ? resolveWorkspacePath(patch.workspacePath) : current.workspacePath;
    const next = { ...current, ...patch, workspacePath };
    config.canvases ||= {};
    config.canvases[current.canvasId] = { workspacePath: next.workspacePath, activeThreadId: next.activeThreadId, pinnedThreadIds: next.pinnedThreadIds };
    fs.mkdirSync(workspacePath, { recursive: true });
    saveConfig(config);
    return { canvasId: current.canvasId, ...config.canvases[current.canvasId] };
}
function resolveWorkspacePath(value) {
    if (value === "~")
        return os.homedir();
    if (value.startsWith("~/"))
        return path.join(os.homedir(), value.slice(2));
    return path.resolve(value);
}
function safeSegment(value) {
    return value.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "default";
}
function isLoopbackRuntimeUrl(value) {
    try {
        const url = new URL(value);
        return url.protocol === "http:"
            && url.hostname === "127.0.0.1"
            && Boolean(url.port)
            && url.pathname === "/"
            && !url.username
            && !url.password
            && !url.search
            && !url.hash;
    }
    catch {
        return false;
    }
}
function exactWebOrigin(value) {
    if (typeof value !== "string" || value.includes(",") || value === "null") {
        throw new Error("Trusted Web origin is invalid");
    }
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)
        || url.username
        || url.password
        || url.pathname !== "/"
        || url.search
        || url.hash
        || url.origin !== value) {
        throw new Error("Trusted Web origin is invalid");
    }
    return url.origin;
}
function configuredTrustedOrigins() {
    const configured = process.env.FRAMEFIELD_TRUSTED_WEB_ORIGINS;
    if (!configured)
        return ["http://127.0.0.1:3000", "http://localhost:3000"];
    return configured.split(",").map((value) => value.trim());
}
function startupConfigDirectory() {
    const configured = process.env.FRAMEFIELD_LOCAL_RUNTIME_CONFIG_DIR;
    if (configured === undefined)
        return path.join(os.homedir(), ".infinite-canvas");
    if (!configured
        || configured !== configured.trim()
        || configured.length > 2_048
        || !path.isAbsolute(configured)) {
        throw new Error("Local Runtime config directory override must be absolute");
    }
    const resolved = path.resolve(configured);
    if (resolved === path.parse(resolved).root) {
        throw new Error("Local Runtime config directory override cannot be a filesystem root");
    }
    return resolved;
}
function readPackageVersion() {
    try {
        const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));
        return pkg.version || "0.0.0";
    }
    catch {
        return "0.0.0";
    }
}
