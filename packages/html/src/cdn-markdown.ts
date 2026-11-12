/**
 * <script> / CDN entry (IIFE): `owlky-markdown.js`, a shim since ADR-0068 (ADR-0035). `owlky.js` loads
 * `modules/markdown.js` by itself when the page holds the component; this script only loads it
 * ahead of use, like `data-ok-preload="markdown"` on `owlky.js`. Load it after `owlky.js`.
 */
import { loadShim } from "./loader/shim.js";

loadShim("markdown", "owlky-markdown.js");
