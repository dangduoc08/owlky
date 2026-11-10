/**
 * Stands in for `@floating-ui/dom` in `owlky-editor.js` (vite.config.ts, ADR-0050). Tiptap's
 * Suggestion utility builds Floating UI middleware when it starts and positions with it only in
 * its `mount` helper, which the editor's mention list doesn't use (Owlky's popover controller
 * places the list). The middleware factories return placeholders; positioning fails loudly.
 */
export const offset = (options?: unknown) => ({ name: "offset", options });
export const flip = (options?: unknown) => ({ name: "flip", options });

const unused = (): never => {
  throw new Error("owlky-editor.js positions suggestions itself (Floating UI isn't bundled).");
};
export const computePosition = unused;
export const autoUpdate = unused;
