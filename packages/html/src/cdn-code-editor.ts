/**
 * <script> / CDN entry (IIFE): `owlky-code-editor.js`, a shim since ADR-0068 (ADR-0034). `owlky.js` loads
 * `modules/code-editor.js` by itself when the page holds the component; this script only loads it
 * ahead of use, like `data-ok-preload="code-editor"` on `owlky.js`. Load it after `owlky.js`.
 */
import { loadShim } from "./loader/shim.js";

loadShim("code-editor", "owlky-code-editor.js");
