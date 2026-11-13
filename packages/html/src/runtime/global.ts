import { createRuntime } from "./runtime.js";
import { runtimeFromSlot } from "./slot.js";
import type { Runtime } from "./types.js";

/** Returns the page-wide runtime (ADR-0007), creating it on first call: see `runtimeFromSlot`. */
export const getRuntime = (): Runtime => runtimeFromSlot(createRuntime);
