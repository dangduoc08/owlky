/**
 * Side-effect entry: registers the Code editor and the Diff editor (ADR-0034, Monaco) on the
 * page-wide runtime and starts it. Kept out of `@owlky/html/auto` and `owlky.js`: pages without a
 * code editor never load Monaco. Monaco comes from the `monaco-editor` package (your bundler emits
 * it as a lazy chunk); `loader.config()` changes that (`paths.vs`, `getWorker`, `monaco`) before
 * the first editor mounts.
 */
import { codeEditor } from "./components/code-editor/code-editor.js";
import { diffEditor } from "./components/diff-editor/diff-editor.js";
import { getRuntime } from "./runtime/global.js";
import type { Runtime } from "./runtime/types.js";

export { type LoaderConfig, loader } from "@owlky/core/code-editor";
export const runtime: Runtime = getRuntime().register(codeEditor, diffEditor).start();
