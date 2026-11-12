/**
 * The old opt-in scripts (`owlky-map.js`, `owlky-editor.js`…) as one-line shims (ADR-0068 §8):
 * `owlky.js` now loads those components by itself when the page holds one, so a shim only asks
 * the page's runtime to load its module ahead of use, like `data-ok-preload`. It reads the
 * ADR-0007 runtime slot and imports nothing else, so it stays a few hundred bytes.
 */
interface SlotRuntime {
  load?(name: string): Promise<void>;
}

const RUNTIME_SLOT = Symbol.for("owlky.runtime");

export function loadShim(module: string, file: string): void {
  const run = () => {
    const slot = (globalThis as { [RUNTIME_SLOT]?: { runtime?: SlotRuntime } })[RUNTIME_SLOT];
    const runtime = slot?.runtime;
    if (runtime?.load) void runtime.load(module).catch(() => {});
    else console.error(`[owlky] ${file} needs owlky.js on the page.`);
  };
  // `owlky.js` runs first when both scripts are `defer` (document order); otherwise wait for it.
  if (
    (globalThis as { [RUNTIME_SLOT]?: unknown })[RUNTIME_SLOT] ||
    document.readyState !== "loading"
  )
    run();
  else document.addEventListener("DOMContentLoaded", run, { once: true });
}
