/** Test helpers (not published): Monaco's workers through Vite, and waiting for a status. */
import { loader, workerFile } from "@owlky/core/code-editor";
import EditorWorker from "monaco-editor/editor/editor.worker.js?worker";
import CssWorker from "monaco-editor/language/css/css.worker.js?worker";
import HtmlWorker from "monaco-editor/language/html/html.worker.js?worker";
import JsonWorker from "monaco-editor/language/json/json.worker.js?worker";
import TsWorker from "monaco-editor/language/typescript/ts.worker.js?worker";

const WORKERS = {
  "editor.worker.js": EditorWorker,
  "json.worker.js": JsonWorker,
  "css.worker.js": CssWorker,
  "html.worker.js": HtmlWorker,
  "typescript.worker.js": TsWorker,
} as const;

/** Monaco from the package, its workers from Vite's `?worker` imports. */
export const useTestWorkers = () =>
  loader.config({ getWorker: (label) => new WORKERS[workerFile(label)]() });

/** Resolves once `element[name]` is `value` (a MutationObserver, never polling). */
export function whenAttribute(element: Element, name: string, value: string): Promise<void> {
  if (element.getAttribute(name) === value) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      observer.disconnect();
      reject(new Error(`${name} never became ${value} (is ${element.getAttribute(name)})`));
    }, 20_000);
    const observer = new MutationObserver(() => {
      if (element.getAttribute(name) !== value) return;
      clearTimeout(timer);
      observer.disconnect();
      resolve();
    });
    observer.observe(element, { attributes: true, attributeFilter: [name] });
  });
}
