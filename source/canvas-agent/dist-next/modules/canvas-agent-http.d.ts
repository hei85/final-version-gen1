import { CanvasSession } from "../canvas-session.js";
import type { LocalRuntimeConfig } from "../config.js";
import type { LocalRuntimeModule } from "../local-runtime.js";
export type CanvasAgentSession = Pick<CanvasSession, "health" | "openEvents" | "updateState" | "resolveResult" | "streamLocalUpload" | "emitAll" | "callTool" | "closeRuntimeSession" | "dispose">;
export declare function createCanvasAgentHttpModule(config: LocalRuntimeConfig, session?: CanvasAgentSession): LocalRuntimeModule;
