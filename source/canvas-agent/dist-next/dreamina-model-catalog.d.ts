import { z } from "zod";
import type { DreaminaModelDescriptor } from "./local-runtime-contract.js";
export declare function projectDreaminaModelCatalog(schemas?: readonly z.AnyZodObject[]): DreaminaModelDescriptor[];
