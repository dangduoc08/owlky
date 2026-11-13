import { runtimeFromSlot } from "./slot.js";
import type { Runtime } from "./types.js";

/**
 * `getRuntime` of the lazy modules (ADR-0068 S5): `owlky.js` loads them once it owns the page, so
 * they join its runtime and never bundle a second copy of `createRuntime`. The modules build
 * aliases `runtime/global.js` to this file.
 */
export const getRuntime = (): Runtime => runtimeFromSlot(undefined);
