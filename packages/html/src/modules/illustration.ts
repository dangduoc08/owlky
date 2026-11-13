/**
 * Lazy module `modules/illustration.js` (ADR-0068): registers its components on the page's runtime.
 * The pictures' data is a chunk of its own (S5): a page whose SVGs carry their shapes only loads
 * the sizing code.
 */
import { createIllustration } from "../components/illustration/create-illustration.js";
import { getRuntime } from "../runtime/global.js";

getRuntime()
  .register(
    createIllustration(() =>
      import("@owlky/core/illustrations").then((module) => module.illustrations),
    ),
  )
  .start();
