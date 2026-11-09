/**
 * Side-effect entry: registers the Illustration runtime with every illustration (ADR-0041) on the
 * page-wide runtime and starts it. Kept out of `@owlky/html/auto` and `owlky.js` so pages without
 * illustrations don't download the artwork. For a few pictures only, register
 * `createIllustration([error404, …])` with imports from `@owlky/core/illustrations` instead.
 */
import { illustration } from "./components/illustration/illustration.js";
import { getRuntime } from "./runtime/global.js";
import type { Runtime } from "./runtime/types.js";

export const runtime: Runtime = getRuntime().register(illustration).start();
