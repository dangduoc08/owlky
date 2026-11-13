/**
 * <script type="module"> / CDN entry (ES module): `owlky.mjs`, the ES module twin of `owlky.js`
 * (ADR-0068 §2). It registers the same light components, installs the same loader and starts the
 * runtime, and loads the same lazy modules (`modules/<name>.js` next to it). Like `owlky.js`, it is
 * built on its own (vite.config.ts) and exposes `window.Owlky` only when this copy owns the page
 * runtime.
 *
 * Script attributes (on the `<script type="module">` that loads this file): `data-ok-preload`
 * and `data-ok-modules`, as on `owlky.js`. Without that script (an `import` from another module),
 * the modules come from `modules/` next to this file.
 */
import { lightComponents } from "./components/light.js";
import { installLoader, moduleBase, preloadNames } from "./loader/loader.js";
import { getRuntime } from "./runtime/global.js";
import type { Runtime } from "./runtime/types.js";

declare global {
  var Owlky: Runtime | undefined;
}

const script = [...document.scripts].find((element) => element.src === import.meta.url) ?? null;
const runtime = getRuntime();
if (runtime.active) {
  runtime.register(...lightComponents);
  installLoader(runtime, {
    base: script
      ? moduleBase(script)
      : new URL(/* @vite-ignore */ "modules/", import.meta.url).href,
    preload: preloadNames(script?.getAttribute("data-ok-preload")),
  });
  runtime.start();
  if (globalThis.Owlky === undefined) globalThis.Owlky = runtime;
}
