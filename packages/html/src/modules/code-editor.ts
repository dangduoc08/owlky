/**
 * Lazy module `modules/code-editor.js` (ADR-0068, ADR-0034): registers the Code editor and the
 * Diff editor on the page's runtime. Monaco loads on demand from the `monaco/` folder above this
 * module, or from the folder in a script's `data-ok-monaco-path` attribute (your own copy).
 */
import { loader } from "@owlky/core/code-editor";
import { codeEditor } from "../components/code-editor/code-editor.js";
import { diffEditor } from "../components/diff-editor/diff-editor.js";
import { getRuntime } from "../runtime/global.js";

const custom = document
  .querySelector("script[data-ok-monaco-path]")
  ?.getAttribute("data-ok-monaco-path");
loader.config({
  paths: { vs: custom ?? new URL(/* @vite-ignore */ "../monaco/", import.meta.url).href },
});
getRuntime().register(codeEditor, diffEditor).start();
