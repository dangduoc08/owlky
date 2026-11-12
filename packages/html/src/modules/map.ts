/**
 * Lazy module `modules/map.js` (ADR-0068, ADR-0025): registers the Map on the page's runtime.
 * MapLibre's worker is `owlky-map-worker.js`, in the folder above this module.
 */
import { setMapWorkerUrl } from "@owlky/core/map";
import { map } from "../components/map/map.js";
import { getRuntime } from "../runtime/global.js";

setMapWorkerUrl(new URL(/* @vite-ignore */ "../owlky-map-worker.js", import.meta.url).href);
getRuntime().register(map).start();
