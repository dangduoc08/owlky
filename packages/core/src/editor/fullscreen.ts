import { getTabbables } from "../dom/focus.js";
import { lockScroll } from "../overlay/scroll-lock.js";

/**
 * While an editor is fullscreen (it covers the page, over a Backdrop): the page doesn't scroll and
 * Tab stays in the editor (WCAG 2.4.11: focus never goes to controls hidden behind it). Focus that
 * leaves for the page wraps to the editor's first tab stop (Tab) or its last one (Shift+Tab);
 * focus that leaves for the browser's UI (`relatedTarget` null) is let go. Returns the release.
 */
export function holdEditorFullscreen(root: HTMLElement): () => void {
  const release = lockScroll(root.ownerDocument);
  let backward = false;
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Tab") backward = event.shiftKey;
  };
  const onFocusOut = (event: FocusEvent) => {
    const next = event.relatedTarget as Node | null;
    if (!next || root.contains(next)) return;
    // Links and controls inside the content aren't stops of their own: the textbox is.
    const stops = getTabbables(root).filter(
      (item) =>
        item.matches("[data-ok-editor-content]") ||
        item.closest("[data-ok-editor-content]") === null,
    );
    const target = backward ? stops[stops.length - 1] : stops[0];
    target?.focus();
  };
  root.addEventListener("keydown", onKeyDown);
  root.addEventListener("focusout", onFocusOut);
  let held = true;
  return () => {
    if (!held) return;
    held = false;
    release();
    root.removeEventListener("keydown", onKeyDown);
    root.removeEventListener("focusout", onFocusOut);
  };
}
