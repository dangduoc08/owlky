/**
 * <script> / CDN entry (IIFE): `minimal-tailwind.js`. Exposes exactly one global,
 * `window.MinimalTailwind`, and only when this copy owns the page runtime.
 */
import { runtime } from "./auto.js";
import type { Runtime } from "./runtime/types.js";

declare global {
  var MinimalTailwind: Runtime | undefined;
}

if (runtime.active && globalThis.MinimalTailwind === undefined) {
  globalThis.MinimalTailwind = runtime;
}
