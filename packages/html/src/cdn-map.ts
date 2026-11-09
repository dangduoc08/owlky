/**
 * <script> / CDN entry (IIFE): `owlky-map.js`. Load it after `owlky.js`: it registers the Map on
 * the same page-wide runtime (ADR-0007 slot) and adds no global of its own. MapLibre's worker
 * is `owlky-map-worker.js`, next to this file.
 */
import { setMapWorkerUrl } from "@owlky/core/map";
import { map } from "./components/map/map.js";
import { getRuntime } from "./runtime/global.js";

const script = document.currentScript;
if (script instanceof HTMLScriptElement && script.src)
  setMapWorkerUrl(new URL("owlky-map-worker.js", script.src).href);
getRuntime().register(map).start();
