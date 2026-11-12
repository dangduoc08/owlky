/**
 * <script> / CDN entry (IIFE): `owlky-editor.js`, a shim since ADR-0068 (ADR-0023). `owlky.js` loads
 * `modules/editor.js` by itself when the page holds the component; this script only loads it
 * ahead of use, like `data-ok-preload="editor"` on `owlky.js`. Load it after `owlky.js`.
 */
import { loadShim } from "./loader/shim.js";

loadShim("editor", "owlky-editor.js");
