import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { DreaminaCliError } from "./dreamina-cli-process.js";
import { acquireStateLock } from "./dreamina-cli-state.js";
const DEFAULT_LEASE_MS = 30_000;
const DEFAULT_WAIT_TIMEOUT_MS = 70_000;
const DEFAULT_POLL_MS = 10;
const MAX_QUEUE = 1_000;
const BACKUP_SUFFIX = ".replace-backup";
const REPLACE_DENIED_CODES = new Set(["EACCES", "EEXIST", "ENOTEMPTY", "EPERM"]);
const TEMP_UUID = "[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}";
export class DreaminaCliArbiter {
    stateFile;
    now;
    leaseMs;
    waitTimeoutMs;
    pollMs;
    heartbeatMs;
    constructor(options) {
        this.stateFile = path.resolve(options.stateFile);
        this.now = options.now ?? (() => Date.now());
        this.leaseMs = bounded(options.leaseMs, 100, 300_000, DEFAULT_LEASE_MS);
        this.waitTimeoutMs = bounded(options.waitTimeoutMs, 100, 300_000, DEFAULT_WAIT_TIMEOUT_MS);
        this.pollMs = bounded(options.pollMs, 1, 1_000, DEFAULT_POLL_MS);
        this.heartbeatMs = options.heartbeatMs === 0
            ? 0
            : bounded(options.heartbeatMs, 25, this.leaseMs, Math.max(25, Math.floor(this.leaseMs / 3)));
    }
    async acquire(options = {}) {
        throwIfCancelled(options.signal);
        const requestId = crypto.randomUUID();
        const deadline = this.now() + this.waitTimeoutMs;
        const ticket = await this.mutate((state) => {
            pruneExpired(state, this.now());
            if (state.queue.length >= MAX_QUEUE)
                throw busy();
            const next = state.nextTicket;
            state.nextTicket += 1;
            state.queue.push({ requestId, ticket: next, expiresAt: deadline });
            return next;
        }, options.signal);
        try {
            while (true) {
                throwIfCancelled(options.signal);
                const granted = await this.mutate((state) => {
                    const now = this.now();
                    pruneExpired(state, now);
                    const queued = state.queue.find((entry) => entry.requestId === requestId && entry.ticket === ticket);
                    if (!queued)
                        throw busy();
                    const first = state.queue.reduce((best, entry) => (!best || entry.ticket < best.ticket ? entry : best), undefined);
                    if (state.active || first?.requestId !== requestId)
                        return undefined;
                    assertExpectedSession(state, options.expectedSession);
                    const fenceEpoch = state.nextFenceEpoch;
                    state.nextFenceEpoch += 1;
                    state.queue = state.queue.filter((entry) => entry.requestId !== requestId);
                    state.active = { requestId, fenceEpoch, expiresAt: now + this.leaseMs };
                    return {
                        fenceEpoch,
                        session: snapshotSession(state),
                    };
                }, options.signal);
                if (granted)
                    return this.createLease(requestId, granted.fenceEpoch, granted.session, options.expectedSession);
                if (this.now() >= deadline)
                    throw busy();
                await delay(this.pollMs, options.signal);
            }
        }
        catch (error) {
            await this.removeQueued(requestId).catch(() => undefined);
            throw error;
        }
    }
    async readSession(signal) {
        return this.inspect((state) => snapshotSession(state), signal);
    }
    async commitSession(lease, accountBinding) {
        validateBinding(accountBinding);
        return this.mutate((state) => {
            assertLeaseState(state, lease.fenceEpoch, this.now());
            if (state.accountBinding !== accountBinding) {
                state.sessionEpoch += 1;
                if (accountBinding === undefined)
                    delete state.accountBinding;
                else
                    state.accountBinding = accountBinding;
            }
            return snapshotSession(state);
        });
    }
    async advanceSession(lease) {
        return this.mutate((state) => {
            assertLeaseState(state, lease.fenceEpoch, this.now());
            state.sessionEpoch += 1;
            delete state.accountBinding;
            return snapshotSession(state);
        });
    }
    createLease(requestId, fenceEpoch, session, expectedSession) {
        let released = false;
        let lost = false;
        let refresh = Promise.resolve();
        let timer;
        const refreshLease = async () => {
            if (released || lost)
                return;
            await this.mutate((state) => {
                const active = state.active;
                if (!active || active.requestId !== requestId || active.fenceEpoch !== fenceEpoch) {
                    throw fenced();
                }
                assertExpectedSession(state, expectedSession);
                active.expiresAt = this.now() + this.leaseMs;
            });
        };
        if (this.heartbeatMs > 0) {
            timer = setInterval(() => {
                refresh = refresh.then(refreshLease).catch(() => {
                    lost = true;
                    if (timer)
                        clearInterval(timer);
                });
            }, this.heartbeatMs);
            timer.unref();
        }
        const assertCurrent = async (expected = expectedSession) => {
            await refresh;
            if (released || lost)
                throw fenced();
            await this.inspect((state) => {
                const active = state.active;
                if (!active || active.requestId !== requestId || active.fenceEpoch !== fenceEpoch || active.expiresAt <= this.now()) {
                    throw fenced();
                }
                assertExpectedSession(state, expected);
            });
        };
        const release = async () => {
            if (released)
                return;
            released = true;
            if (timer)
                clearInterval(timer);
            await refresh;
            await this.mutate((state) => {
                if (state.active?.requestId === requestId && state.active.fenceEpoch === fenceEpoch)
                    delete state.active;
            });
        };
        return { fenceEpoch, session, assertCurrent, release };
    }
    async removeQueued(requestId) {
        await this.mutate((state) => {
            state.queue = state.queue.filter((entry) => entry.requestId !== requestId);
        });
    }
    async inspect(read, signal) {
        const release = await acquireStateLock(this.stateFile, signal);
        try {
            await recoverArbiterReplacement(this.stateFile);
            await scavengeArbiterTemporaries(this.stateFile);
            const state = await readState(this.stateFile);
            return read(state);
        }
        finally {
            await release();
        }
    }
    async mutate(update, signal) {
        const release = await acquireStateLock(this.stateFile, signal);
        try {
            await recoverArbiterReplacement(this.stateFile);
            await scavengeArbiterTemporaries(this.stateFile);
            const state = await readState(this.stateFile);
            const result = update(state);
            state.revision += 1;
            await persistState(this.stateFile, state);
            return result;
        }
        finally {
            await release();
        }
    }
}
function emptyState() {
    return { version: 1, revision: 0, nextTicket: 1, nextFenceEpoch: 1, sessionEpoch: 0, queue: [] };
}
async function readState(stateFile) {
    let value;
    try {
        value = JSON.parse(await fs.readFile(stateFile, "utf8"));
    }
    catch (error) {
        if (error.code === "ENOENT")
            return emptyState();
        throw invalid();
    }
    if (!value || typeof value !== "object" || Array.isArray(value))
        throw invalid();
    const normalized = { revision: 0, ...value };
    if (!validState(normalized))
        throw invalid();
    return normalized;
}
async function persistState(stateFile, state) {
    if (!validState(state))
        throw invalid();
    await fs.mkdir(path.dirname(stateFile), { recursive: true, mode: 0o700 });
    const temporary = `${stateFile}.${process.pid}.${crypto.randomUUID()}.tmp`;
    let handle;
    try {
        handle = await fs.open(temporary, "wx", 0o600);
        await handle.writeFile(JSON.stringify(state), "utf8");
        await handle.sync();
        await handle.close();
        handle = undefined;
        await replaceArbiterState(temporary, stateFile);
    }
    catch (error) {
        await handle?.close().catch(() => undefined);
        await fs.rm(temporary, { force: true }).catch(() => undefined);
        if (error instanceof DreaminaCliError)
            throw error;
        throw invalid();
    }
}
async function replaceArbiterState(temporary, stateFile) {
    try {
        await fs.rename(temporary, stateFile);
        await syncParentDirectory(stateFile);
        return;
    }
    catch (error) {
        if (!REPLACE_DENIED_CODES.has(error.code ?? ""))
            throw error;
    }
    const backup = `${stateFile}${BACKUP_SUFFIX}`;
    if (await isRegularFile(backup))
        throw invalid();
    try {
        if (await isRegularFile(stateFile)) {
            await fs.rename(stateFile, backup);
            await syncParentDirectory(stateFile);
        }
        await fs.rename(temporary, stateFile);
        await syncParentDirectory(stateFile);
    }
    catch (error) {
        await restoreArbiterBackup(stateFile, backup);
        throw error;
    }
    try {
        await fs.rm(backup, { force: true });
        await syncParentDirectory(stateFile);
    }
    catch {
        // The new primary is already durable. Keep the older backup as recovery evidence;
        // the next state-lock owner will validate revision progression and clean it safely.
    }
}
async function recoverArbiterReplacement(stateFile) {
    const backup = `${stateFile}${BACKUP_SUFFIX}`;
    if (!(await isRegularFile(backup)))
        return;
    const previous = await readState(backup);
    if (!(await isRegularFile(stateFile))) {
        await fs.rename(backup, stateFile);
        await syncParentDirectory(stateFile);
        return;
    }
    const current = await readState(stateFile);
    if (current.revision < previous.revision)
        throw invalid();
    if (current.revision === previous.revision) {
        if (!sameArbiterState(previous, current))
            throw invalid();
    }
    else {
        assertArbiterProgression(previous, current);
    }
    await fs.rm(backup, { force: true });
    await syncParentDirectory(stateFile);
}
function assertArbiterProgression(previous, current) {
    if (current.nextTicket < previous.nextTicket
        || current.nextFenceEpoch < previous.nextFenceEpoch
        || current.sessionEpoch < previous.sessionEpoch
        || (current.sessionEpoch === previous.sessionEpoch && current.accountBinding !== previous.accountBinding))
        throw invalid();
}
function sameArbiterState(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
}
async function scavengeArbiterTemporaries(stateFile) {
    const directory = path.dirname(stateFile);
    const pattern = new RegExp(`^${escapeRegExp(path.basename(stateFile))}\\.[0-9]+\\.${TEMP_UUID}\\.tmp$`);
    let entries;
    try {
        entries = await fs.readdir(directory, { withFileTypes: true });
    }
    catch (error) {
        if (error.code === "ENOENT")
            return;
        throw invalid();
    }
    for (const entry of entries) {
        if (!entry.isFile() || !pattern.test(entry.name))
            continue;
        try {
            await fs.rm(path.join(directory, entry.name), { force: true });
        }
        catch {
            throw invalid();
        }
    }
}
async function restoreArbiterBackup(stateFile, backup) {
    try {
        if (await isRegularFile(stateFile))
            return;
        if (!(await isRegularFile(backup)))
            return;
        await fs.rename(backup, stateFile);
        await syncParentDirectory(stateFile);
    }
    catch {
        // Keep the recoverable backup for the next state-lock owner.
    }
}
async function isRegularFile(candidate) {
    try {
        const stats = await fs.lstat(candidate);
        if (!stats.isFile() || stats.isSymbolicLink())
            throw invalid();
        return true;
    }
    catch (error) {
        if (error.code === "ENOENT")
            return false;
        throw error;
    }
}
async function syncParentDirectory(stateFile) {
    if (process.platform === "win32")
        return;
    const directory = await fs.open(path.dirname(stateFile), "r");
    try {
        await directory.sync();
    }
    finally {
        await directory.close();
    }
}
function validState(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        return false;
    const state = value;
    if (Object.keys(value).some((key) => !["version", "revision", "nextTicket", "nextFenceEpoch", "sessionEpoch", "accountBinding", "queue", "active"].includes(key)))
        return false;
    if (state.version !== 1
        || !nonNegativeInteger(state.revision)
        || !positiveInteger(state.nextTicket)
        || !positiveInteger(state.nextFenceEpoch)
        || !nonNegativeInteger(state.sessionEpoch)
        || !Array.isArray(state.queue)
        || state.queue.length > MAX_QUEUE)
        return false;
    if (state.accountBinding !== undefined && !safeBinding(state.accountBinding))
        return false;
    const requestIds = new Set();
    const tickets = new Set();
    for (const entry of state.queue) {
        if (!validQueueEntry(entry) || requestIds.has(entry.requestId) || tickets.has(entry.ticket))
            return false;
        requestIds.add(entry.requestId);
        tickets.add(entry.ticket);
    }
    return state.active === undefined || validActive(state.active);
}
function validQueueEntry(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        return false;
    const entry = value;
    return Object.keys(value).every((key) => ["requestId", "ticket", "expiresAt"].includes(key))
        && uuid(entry.requestId)
        && positiveInteger(entry.ticket)
        && Number.isFinite(entry.expiresAt);
}
function validActive(value) {
    if (!value || typeof value !== "object" || Array.isArray(value))
        return false;
    const active = value;
    return Object.keys(value).every((key) => ["requestId", "fenceEpoch", "expiresAt"].includes(key))
        && uuid(active.requestId)
        && positiveInteger(active.fenceEpoch)
        && Number.isFinite(active.expiresAt);
}
function pruneExpired(state, now) {
    state.queue = state.queue.filter((entry) => entry.expiresAt > now);
    if (state.active && state.active.expiresAt <= now)
        delete state.active;
}
function assertExpectedSession(state, expected) {
    if (!expected)
        return;
    if (state.sessionEpoch !== expected.sessionEpoch || state.accountBinding !== expected.accountBinding)
        throw accountChanged();
}
function assertLeaseState(state, fenceEpoch, now) {
    if (!state.active || state.active.fenceEpoch !== fenceEpoch || state.active.expiresAt <= now)
        throw fenced();
}
function snapshotSession(state) {
    return {
        sessionEpoch: state.sessionEpoch,
        ...(state.accountBinding ? { accountBinding: state.accountBinding } : {}),
    };
}
function validateBinding(value) {
    if (value !== undefined && !safeBinding(value))
        throw invalid();
}
function safeBinding(value) { return /^[a-f0-9]{64}$/.test(value); }
function uuid(value) { return typeof value === "string" && /^[a-f0-9-]{36}$/.test(value); }
function positiveInteger(value) { return Number.isSafeInteger(value) && value >= 1; }
function nonNegativeInteger(value) { return Number.isSafeInteger(value) && value >= 0; }
function escapeRegExp(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function bounded(value, min, max, fallback) {
    return value === undefined ? fallback : Math.min(max, Math.max(min, Math.trunc(value)));
}
function delay(ms, signal) {
    if (!signal)
        return new Promise((resolve) => setTimeout(resolve, ms));
    throwIfCancelled(signal);
    return new Promise((resolve, reject) => {
        const onAbort = () => { clearTimeout(timer); reject(cancelled()); };
        const timer = setTimeout(() => { signal.removeEventListener("abort", onAbort); resolve(); }, ms);
        signal.addEventListener("abort", onAbort, { once: true });
        if (signal.aborted)
            onAbort();
    });
}
function throwIfCancelled(signal) { if (signal?.aborted)
    throw cancelled(); }
function cancelled() { return new DreaminaCliError("dreamina_cancelled", "Dreamina 操作已取消", 499); }
function busy() { return new DreaminaCliError("dreamina_cli_busy", "Dreamina CLI 正在由另一个本机进程使用", 503); }
function fenced() { return new DreaminaCliError("dreamina_cli_fenced", "Dreamina CLI invocation lease 已失效", 409); }
function accountChanged() { return new DreaminaCliError("dreamina_account_session_changed", "Dreamina 账号会话已变化", 409); }
function invalid() { return new DreaminaCliError("dreamina_arbiter_state_invalid", "Dreamina CLI arbiter 状态无效", 503); }
