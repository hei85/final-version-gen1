import type { LocalRuntimeModule } from "../local-runtime.js";
export type PortraitClearanceHttpModuleOptions = {
    ownerId: string;
    configDir?: string;
    fetch?: typeof fetch;
};
export declare function createPortraitClearanceHttpModule(options?: PortraitClearanceHttpModuleOptions): LocalRuntimeModule;
