/**
 * Side-effect entry: registers the Map (ADR-0025, loads MapLibre GL JS) on the page-wide runtime
 * and starts it. Kept out of `@owlky/html/auto` and `owlky.js` so pages without a map don't load
 * MapLibre. Bundlers: point `setMapWorkerUrl()` (from `@owlky/core/map`) at
 * `@owlky/core/map-worker.js` before the first map mounts.
 */
import { map } from "./components/map/map.js";
import { getRuntime } from "./runtime/global.js";
import type { Runtime } from "./runtime/types.js";

export const runtime: Runtime = getRuntime().register(map).start();
