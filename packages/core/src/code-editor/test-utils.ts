/** Test helpers (not exported): Monaco's workers through Vite's `?worker` imports. */

import EditorWorker from "monaco-editor/editor/editor.worker.js?worker";
import CssWorker from "monaco-editor/language/css/css.worker.js?worker";
import HtmlWorker from "monaco-editor/language/html/html.worker.js?worker";
import JsonWorker from "monaco-editor/language/json/json.worker.js?worker";
import TsWorker from "monaco-editor/language/typescript/ts.worker.js?worker";
import { workerFile } from "./loader.js";

const WORKERS = {
  "editor.worker.js": EditorWorker,
  "json.worker.js": JsonWorker,
  "css.worker.js": CssWorker,
  "html.worker.js": HtmlWorker,
  "typescript.worker.js": TsWorker,
} as const;

/** `loader.config({ getWorker })` for tests: the worker for a Monaco label. */
export const testWorker = (label: string): Worker => new WORKERS[workerFile(label)]();

/** Resolves once `element` matches `selector`-free `test` (a MutationObserver, never polling). */
export function whenAttribute(
  element: Element,
  name: string,
  value: string,
  timeout = 20_000,
): Promise<void> {
  if (element.getAttribute(name) === value) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`${name} never became ${value} (is ${element.getAttribute(name)})`));
    }, timeout);
    const observer = new MutationObserver(() => {
      if (element.getAttribute(name) !== value) return;
      clearTimeout(timer);
      observer.disconnect();
      resolve();
    });
    observer.observe(element, { attributes: true, attributeFilter: [name] });
  });
}
