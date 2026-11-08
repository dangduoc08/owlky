/**
 * Side-effect entry: registers the Editor (ADR-0023, loads Tiptap) on the page-wide runtime and
 * starts it. Kept out of `@owlky/html/auto` and `owlky.js` so pages without an editor don't load
 * ProseMirror. With syntax highlighting, register `createEditor({ highlighter })` instead.
 */
import { editor } from "./components/editor/editor.js";
import { getRuntime } from "./runtime/global.js";
import type { Runtime } from "./runtime/types.js";

export const runtime: Runtime = getRuntime().register(editor).start();
