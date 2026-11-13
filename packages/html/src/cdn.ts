/**
 * <script> / CDN entry (IIFE): `owlky.js`. Registers the light components, installs the loader of
 * the lazy modules (`modules/<name>.js` next to this file, ADR-0068) and starts the runtime.
 * Exposes exactly one global, `window.Owlky`, and only when this copy owns the page runtime.
 *
 * Script attributes: `data-ok-preload="chart data-grid"` loads modules ahead of use;
 * `data-ok-modules="/path/"` serves the modules from another folder; `data-ok-styles="/path/"`
 * serves the design style sheets from another folder, `data-ok-styles="none"` never adds them.
 */
import { lightComponents } from "./components/light.js";
import { installLoader, moduleBase, preloadNames, styleBase } from "./loader/loader.js";
import { getRuntime } from "./runtime/global.js";
import type { Runtime } from "./runtime/types.js";

declare global {
  var Owlky: Runtime | undefined;
}

const script = document.currentScript;
const runtime = getRuntime();
if (runtime.active) {
  runtime.register(...lightComponents);
  installLoader(runtime, {
    base: moduleBase(script),
    preload: preloadNames(script?.getAttribute("data-ok-preload")),
    styles: styleBase(script),
  });
  runtime.start();
  if (globalThis.Owlky === undefined) globalThis.Owlky = runtime;
}
