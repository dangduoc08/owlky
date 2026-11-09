import { loader, workerFile } from "@owlky/core/code-editor";
import EditorWorker from "monaco-editor/editor/editor.worker.js?worker";
import CssWorker from "monaco-editor/language/css/css.worker.js?worker";
import HtmlWorker from "monaco-editor/language/html/html.worker.js?worker";
import JsonWorker from "monaco-editor/language/json/json.worker.js?worker";
import TsWorker from "monaco-editor/language/typescript/ts.worker.js?worker";

/*
 * Storybook bundles Monaco with Vite: its workers come from Vite's `?worker` imports, given to
 * the loader once (the same recipe as the docs page's "Bundlers" section). React and HTML stories
 * share this loader (both run from the package sources).
 */
const WORKERS = {
  "editor.worker.js": EditorWorker,
  "json.worker.js": JsonWorker,
  "css.worker.js": CssWorker,
  "html.worker.js": HtmlWorker,
  "typescript.worker.js": TsWorker,
} as const;

loader.config({ getWorker: (label) => new WORKERS[workerFile(label)]() });
