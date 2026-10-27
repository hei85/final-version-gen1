const FORWARD_TRANSITIONS = {
    QUEUED_LOCAL: ["SUBMITTING"],
    SUBMITTING: ["ACCEPTED", "SUBMISSION_UNCERTAIN", "TERMINAL"],
    SUBMISSION_UNCERTAIN: ["ACCEPTED", "TERMINAL"],
    ACCEPTED: ["RUNNING", "TERMINAL"],
    RUNNING: ["TERMINAL"],
    TERMINAL: [],
};
export class DreaminaTaskTransitionError extends Error {
    constructor(message) {
        super(message);
        this.name = "DreaminaTaskTransitionError";
    }
}
export function reduceDreaminaTask(state, event) {
    if (event.type === "transition")
        return transitionLifecycle(state, event.lifecycle, event.terminalOutcome);
    if (event.type === "provider_observation")
        return applyProviderObservation(state, event.observation);
    if (event.type === "sync_error") {
        assertSafeErrorCode(event.code);
        return {
            ...state,
            syncState: event.errorKind === "account" ? "SYNC_BLOCKED_ACCOUNT" : "SYNC_RETRY_WAIT",
            lastSyncErrorCode: event.code,
        };
    }
    if (event.type === "sync_recovered") {
        if (state.syncState === "SYNC_CONFLICT")
            return state;
        return { ...state, syncState: "SYNC_OK", lastSyncErrorCode: undefined };
    }
    return bindContext(state, event);
}
export function dreaminaTaskFromRuntimeJournal(input) {
    const base = {
        lifecycle: "QUEUED_LOCAL",
        syncState: "SYNC_OK",
        resultState: "NOT_AVAILABLE",
        outputs: [],
        context: { scope: "legacy_unscoped" },
    };
    if (input.state === "queued")
        return base;
    if (input.state === "pending")
        return { ...base, lifecycle: "SUBMITTING" };
    if (input.state === "unknown") {
        return {
            ...base,
            lifecycle: "SUBMISSION_UNCERTAIN",
            syncState: "SYNC_UNCERTAIN",
            ...(input.errorCode ? { lastSyncErrorCode: input.errorCode } : {}),
        };
    }
    if (input.state === "accepted") {
        return {
            ...base,
            lifecycle: input.officialStatus === "processing" ? "RUNNING" : "ACCEPTED",
            ...(input.errorCode === "dreamina_account_session_changed"
                ? { syncState: "SYNC_BLOCKED_ACCOUNT", lastSyncErrorCode: input.errorCode }
                : input.errorCode && isLocalSyncErrorCode(input.errorCode)
                    ? { syncState: "SYNC_RETRY_WAIT", lastSyncErrorCode: input.errorCode }
                    : {}),
        };
    }
    if (input.state === "succeeded") {
        return {
            ...base,
            lifecycle: "TERMINAL",
            terminalOutcome: "SUCCEEDED",
            resultState: "PENDING_MATERIALIZATION",
            ...(input.errorCode === "dreamina_account_session_changed"
                ? { syncState: "SYNC_BLOCKED_ACCOUNT", lastSyncErrorCode: input.errorCode }
                : {}),
        };
    }
    if (input.state === "cancelled") {
        if (hasProviderTask(input) && input.errorCode === "dreamina_local_wait_stopped") {
            return { ...base, lifecycle: "ACCEPTED" };
        }
        return { ...base, lifecycle: "TERMINAL", terminalOutcome: "CANCELLED" };
    }
    if (input.state === "failed") {
        if (hasProviderTask(input) && input.errorCode && isLocalSyncErrorCode(input.errorCode)) {
            return {
                ...base,
                lifecycle: "ACCEPTED",
                syncState: "SYNC_RETRY_WAIT",
                lastSyncErrorCode: input.errorCode,
            };
        }
        return {
            ...base,
            lifecycle: "TERMINAL",
            terminalOutcome: isAmbiguousOfficialFailure(input) ? "FAILED_OR_CANCELLED" : "FAILED",
        };
    }
    return { ...base, lifecycle: "TERMINAL", terminalOutcome: "FAILED" };
}
function transitionLifecycle(state, lifecycle, terminalOutcome) {
    if (lifecycle === state.lifecycle) {
        if (lifecycle !== "TERMINAL") {
            if (terminalOutcome !== undefined)
                throw lifecycleError(state.lifecycle, lifecycle);
            return state;
        }
        if (!terminalOutcome || terminalOutcome !== state.terminalOutcome)
            throw lifecycleError(state.lifecycle, lifecycle);
        return state;
    }
    if (!FORWARD_TRANSITIONS[state.lifecycle].includes(lifecycle))
        throw lifecycleError(state.lifecycle, lifecycle);
    if (lifecycle === "TERMINAL" && !terminalOutcome)
        throw lifecycleError(state.lifecycle, lifecycle);
    if (lifecycle !== "TERMINAL" && terminalOutcome !== undefined)
        throw lifecycleError(state.lifecycle, lifecycle);
    if (state.lifecycle === "SUBMITTING" && lifecycle === "TERMINAL" && terminalOutcome !== "REJECTED") {
        throw lifecycleError(state.lifecycle, lifecycle);
    }
    if (state.lifecycle === "SUBMISSION_UNCERTAIN" && lifecycle === "TERMINAL") {
        throw lifecycleError(state.lifecycle, lifecycle);
    }
    const next = {
        ...state,
        lifecycle,
        terminalOutcome: lifecycle === "TERMINAL" ? terminalOutcome : undefined,
    };
    if (lifecycle === "SUBMISSION_UNCERTAIN") {
        next.syncState = "SYNC_UNCERTAIN";
    }
    else if (state.lifecycle === "SUBMISSION_UNCERTAIN" && lifecycle === "ACCEPTED") {
        next.syncState = "SYNC_OK";
        next.lastSyncErrorCode = undefined;
    }
    if (lifecycle === "TERMINAL" && terminalOutcome === "SUCCEEDED" && next.resultState === "NOT_AVAILABLE") {
        next.resultState = "PENDING_MATERIALIZATION";
    }
    return next;
}
function applyProviderObservation(state, observation) {
    assertObservation(observation);
    if (state.accountBinding && observation.accountBinding && state.accountBinding !== observation.accountBinding) {
        return { ...state, syncState: "SYNC_CONFLICT" };
    }
    const withObservation = {
        ...state,
        ...(state.accountBinding || !observation.accountBinding ? {} : { accountBinding: observation.accountBinding }),
        providerObservation: observation,
        syncState: state.syncState === "SYNC_CONFLICT" ? "SYNC_CONFLICT" : "SYNC_OK",
        lastSyncErrorCode: undefined,
    };
    const observedOutcome = terminalOutcomeForObservation(observation.status);
    if (state.lifecycle === "TERMINAL") {
        if (!observedOutcome || observedOutcome === state.terminalOutcome)
            return withObservation;
        return { ...withObservation, syncState: "SYNC_CONFLICT", terminalOutcome: state.terminalOutcome };
    }
    if (observedOutcome) {
        return transitionLifecycleFromObservation(withObservation, observedOutcome);
    }
    if (observation.status === "processing") {
        if (state.lifecycle === "RUNNING")
            return withObservation;
        return { ...withObservation, lifecycle: "RUNNING", terminalOutcome: undefined };
    }
    if (state.lifecycle === "RUNNING")
        return withObservation;
    if (state.lifecycle === "ACCEPTED")
        return withObservation;
    return { ...withObservation, lifecycle: "ACCEPTED", terminalOutcome: undefined };
}
function transitionLifecycleFromObservation(state, outcome) {
    const next = {
        ...state,
        lifecycle: "TERMINAL",
        terminalOutcome: outcome,
    };
    if (outcome === "SUCCEEDED" && next.resultState === "NOT_AVAILABLE")
        next.resultState = "PENDING_MATERIALIZATION";
    return next;
}
function bindContext(state, event) {
    if (state.context.scope === "legacy_unscoped")
        return state;
    if (event.accountBinding && state.accountBinding && event.accountBinding !== state.accountBinding) {
        return { ...state, syncState: "SYNC_CONFLICT" };
    }
    const context = { ...state.context };
    for (const key of ["projectId", "nodeId", "conversationId", "messageId", "batchIndex", "batchCount", "retryOf", "attemptGroupId"]) {
        const incoming = event.context[key];
        const current = context[key];
        if (incoming === undefined)
            continue;
        if (current !== undefined && current !== incoming)
            return { ...state, syncState: "SYNC_CONFLICT" };
        Object.assign(context, { [key]: incoming });
    }
    return {
        ...state,
        context,
        ...(state.accountBinding || !event.accountBinding ? {} : { accountBinding: event.accountBinding }),
    };
}
function terminalOutcomeForObservation(status) {
    if (status === "completed")
        return "SUCCEEDED";
    if (status === "cancelled")
        return "CANCELLED";
    if (status === "failed")
        return "FAILED_OR_CANCELLED";
    return undefined;
}
function hasProviderTask(input) {
    return Boolean(input.submitId) || input.receiptRecorded === true;
}
function isAmbiguousOfficialFailure(input) {
    return input.officialStatus === "failed"
        || input.errorCode === "dreamina_official_failed"
        || input.errorCode === "dreamina_official_incomplete";
}
function isLocalSyncErrorCode(code) {
    return /(?:query|transport|parse|state_busy|state_fenced|login|session|unknown|origin_not_trusted)/.test(code)
        && !/^dreamina_official_/.test(code);
}
function assertObservation(observation) {
    if (!Number.isFinite(Date.parse(observation.observedAt)))
        throw new DreaminaTaskTransitionError("Dreamina provider observation timestamp is invalid");
    if (observation.fenceEpoch !== undefined && (!Number.isSafeInteger(observation.fenceEpoch) || observation.fenceEpoch < 0)) {
        throw new DreaminaTaskTransitionError("Dreamina provider observation fence epoch is invalid");
    }
}
function assertSafeErrorCode(code) {
    if (!/^[a-z][a-z0-9_]{2,80}$/.test(code))
        throw new DreaminaTaskTransitionError("Dreamina sync error code is invalid");
}
function lifecycleError(from, to) {
    return new DreaminaTaskTransitionError(`Dreamina task lifecycle transition ${from} -> ${to} is forbidden`);
}
