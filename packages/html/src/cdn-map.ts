/**
 * <script> / CDN entry (IIFE): `owlky-map.js`, a shim since ADR-0068 (ADR-0025). `owlky.js` loads
 * `modules/map.js` by itself when the page holds the component; this script only loads it
 * ahead of use, like `data-ok-preload="map"` on `owlky.js`. Load it after `owlky.js`.
 */
import { loadShim } from "./loader/shim.js";

loadShim("map", "owlky-map.js");
