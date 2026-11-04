/**
 * <script> / CDN entry (IIFE): `owlky.js`. Exposes exactly one global,
 * `window.Owlky`, and only when this copy owns the page runtime.
 */
import { runtime } from "./auto.js";
import type { Runtime } from "./runtime/types.js";

declare global {
  var Owlky: Runtime | undefined;
}

if (runtime.active && globalThis.Owlky === undefined) {
  globalThis.Owlky = runtime;
}
