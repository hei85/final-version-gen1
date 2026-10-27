import { DreaminaCliError } from "./dreamina-cli-process.js";
declare const PUBLIC_RUN_ERRORS: {
    readonly dreamina_request_invalid: {
        readonly message: "Dreamina 请求参数无效";
        readonly statusCode: 400;
    };
    readonly dreamina_idempotency_conflict: {
        readonly message: "同一幂等键不能用于不同 Dreamina 请求";
        readonly statusCode: 409;
    };
    readonly dreamina_login_required: {
        readonly message: "Dreamina CLI 需要先登录";
        readonly statusCode: 401;
    };
    readonly dreamina_missing: {
        readonly message: "未检测到 Dreamina CLI";
        readonly statusCode: 404;
    };
    readonly dreamina_reference_invalid: {
        readonly message: "Dreamina 参考素材无效或不受信任";
        readonly statusCode: 400;
    };
    readonly dreamina_reference_budget_exceeded: {
        readonly message: "Dreamina 参考素材超出大小限制";
        readonly statusCode: 413;
    };
    readonly dreamina_generation_capacity_full: {
        readonly message: "Dreamina 官方生成名额已满";
        readonly statusCode: 409;
    };
    readonly dreamina_submit_spawn_failed: {
        readonly message: "无法启动 Dreamina CLI 提交进程";
        readonly statusCode: 503;
    };
    readonly dreamina_submission_unknown: {
        readonly message: "Dreamina 提交结果不确定，已禁止自动重试；请按 receipt 查询或人工确认";
        readonly statusCode: 409;
    };
};
export type DreaminaPublicRunErrorCode = keyof typeof PUBLIC_RUN_ERRORS;
export declare function projectDreaminaPublicRuntimeResult(result: unknown): {
    state: "accepted";
    receiptRecorded: true;
};
export declare function parseDreaminaPublicRuntimeResult(result: unknown): {
    state: "accepted";
    receiptRecorded: true;
};
export declare function projectDreaminaPublicRunError(error: unknown): DreaminaCliError;
export declare function parseDreaminaPublicRunError(code: unknown, message: unknown): DreaminaCliError;
export {};
