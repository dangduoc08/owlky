/**
 * <script> / CDN entry (IIFE): `owlky-illustrations.js`, a shim since ADR-0068 (ADR-0041). `owlky.js` loads
 * `modules/illustration.js` by itself when the page holds the component; this script only loads it
 * ahead of use, like `data-ok-preload="illustration"` on `owlky.js`. Load it after `owlky.js`.
 */
import { loadShim } from "./loader/shim.js";

loadShim("illustration", "owlky-illustrations.js");
