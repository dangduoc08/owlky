import { illustrations } from "@owlky/core/illustrations";
import { createIllustration } from "./create-illustration.js";

export { createIllustration, type IllustrationInstance } from "./create-illustration.js";

/** The runtime definition with every illustration of `@owlky/core/illustrations`. */
export const illustration = /* @__PURE__ */ createIllustration(illustrations);
