import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type CanvasAgentConfig } from "./config.js";
export declare function startMcpServer(): Promise<void>;
export declare function registerMcpTools(server: McpServer, config: CanvasAgentConfig): void;
