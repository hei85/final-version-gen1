import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { AGENT_PROMPT, loadConfig, VERSION } from "./config.js";
import { toolDescriptions, toolInputSchemas, toolNames } from "./schemas.js";
export async function startMcpServer() {
    const config = loadConfig(true);
    const server = new McpServer({ name: "canvas-agent", version: VERSION }, { instructions: AGENT_PROMPT });
    registerMcpTools(server, config);
    await server.connect(new StdioServerTransport());
}
export function registerMcpTools(server, config) {
    toolNames.forEach((name) => registerCanvasTool(server, config, name));
}
function registerCanvasTool(server, config, name) {
    const schema = toolInputSchemas[name];
    server.registerTool(name, { description: toolDescriptions[name], inputSchema: schema.shape }, async (input) => {
        const result = await postCanvasAgentTool(config, name, schema.parse(input));
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    });
}
async function postCanvasAgentTool(config, name, input) {
    const res = await fetch(`${config.url}/api/tools`, { method: "POST", headers: { "content-type": "application/json", "x-canvas-agent-token": config.token }, body: JSON.stringify({ name, input }) });
    const body = (await res.json());
    if (!body.ok)
        throw new Error(body.error || "tool call failed");
    return body.result;
}
