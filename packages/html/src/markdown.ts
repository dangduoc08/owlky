/**
 * Side-effect entry: registers Markdown (ADR-0035, loads unified) on the page-wide runtime and
 * starts it. Kept out of `@owlky/html/auto` and `owlky.js` so pages without Markdown don't load
 * the pipeline. With plugins or syntax highlighting, register `createMarkdown({ … })` instead.
 */
import { markdown } from "./components/markdown/markdown.js";
import { getRuntime } from "./runtime/global.js";
import type { Runtime } from "./runtime/types.js";

export const runtime: Runtime = getRuntime().register(markdown).start();
