import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { LocalRuntimeConfig } from "../config.js";
import { type DreaminaGenerationInput } from "../dreamina-cli-contract.js";
type RuntimeConfig = Pick<LocalRuntimeConfig, "url" | "token">;
type DreaminaMcpRequestOptions = {
    signal?: AbortSignal;
    timeoutMs?: number;
};
export type DreaminaMcpDependencies = {
    postPublicTool?: typeof postDreaminaCliTool;
};
export declare function registerDreaminaMcp(server: McpServer, config: RuntimeConfig, dependencies?: DreaminaMcpDependencies): void;
export declare function postDreaminaCliTool(config: RuntimeConfig, input: DreaminaGenerationInput, options?: DreaminaMcpRequestOptions): Promise<{
    state: "accepted";
    receiptRecorded: true;
}>;
export {};
