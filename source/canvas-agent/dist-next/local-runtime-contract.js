import crypto from "node:crypto";
import { canonicalize } from "json-canonicalize";
export const LOCAL_RUNTIME_ENDPOINT = "http://127.0.0.1:17371";
export const LOCAL_RUNTIME_ID = "framefield-local-runtime";
export const LOCAL_RUNTIME_API_VERSION = 2;
export function canonicalRuntimeJson(value) {
    return canonicalize(value);
}
export function sha256Base64Url(value) {
    return crypto.createHash("sha256").update(value).digest("base64url");
}
export function createRuntimeRequestPayload(value) {
    return { protocol: "framefield-runtime-request-v1", ...value };
}
