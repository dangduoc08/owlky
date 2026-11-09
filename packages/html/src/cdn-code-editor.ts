/**
 * <script> / CDN entry (IIFE): `owlky-code-editor.js`. Load it after `owlky.js`: it registers the
 * Code editor and the Diff editor on the same page-wide runtime (ADR-0007 slot) and adds no global
 * of its own. Monaco is loaded on demand from the `monaco/` folder next to this file (ADR-0034),
 * or from the folder in the script's `data-ok-monaco-path` attribute (your own copy).
 */
import { loader } from "@owlky/core/code-editor";
import { codeEditor } from "./components/code-editor/code-editor.js";
import { diffEditor } from "./components/diff-editor/diff-editor.js";
import { getRuntime } from "./runtime/global.js";

const script = document.currentScript;
const base = script instanceof HTMLScriptElement ? script.src : document.baseURI;
loader.config({
  paths: { vs: script?.getAttribute("data-ok-monaco-path") ?? new URL("monaco/", base).href },
});
getRuntime().register(codeEditor, diffEditor).start();
