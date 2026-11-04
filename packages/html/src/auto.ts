/**
 * Side-effect entry: registers every component on the page-wide runtime and starts it.
 * Safe to import or load any number of times (ADR-0005).
 */
import { components } from "./components/index.js";
import { getRuntime } from "./runtime/global.js";
import type { Runtime } from "./runtime/types.js";

export const runtime: Runtime = getRuntime()
  .register(...components)
  .start();
