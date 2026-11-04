const FOCUSABLE = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "summary",
  "audio[controls]",
  "video[controls]",
  '[contenteditable]:not([contenteditable="false"])',
  "[tabindex]",
].join(",");

const isVisible = (element: HTMLElement) =>
  typeof element.checkVisibility === "function"
    ? element.checkVisibility({ visibilityProperty: true })
    : element.getClientRects().length > 0;

/** Elements reachable with Tab, in DOM order (positive tabindex ordering is not supported). */
export function getTabbables(container: ParentNode): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (element) => element.tabIndex >= 0 && !element.closest("[inert]") && isVisible(element),
  );
}

export function isFocusable(element: Element | null | undefined): element is HTMLElement {
  return (
    element instanceof HTMLElement &&
    element.isConnected &&
    !element.closest("[inert]") &&
    (element.matches(FOCUSABLE) || element.tabIndex >= 0) &&
    !(element as HTMLButtonElement).disabled &&
    isVisible(element)
  );
}

/**
 * Initial focus inside an overlay: `[autofocus]` first, then the first tabbable element, then
 * the fallback element itself (made programmatically focusable).
 */
export function focusInitial(container: HTMLElement, fallback: HTMLElement = container): void {
  const target =
    container.querySelector<HTMLElement>("[autofocus]") ?? getTabbables(container)[0] ?? null;
  if (target) {
    target.focus();
    return;
  }
  if (!fallback.hasAttribute("tabindex")) fallback.setAttribute("tabindex", "-1");
  fallback.focus();
}

/** Keeps Tab / Shift+Tab inside `container`. Used only where the platform doesn't (fallbacks). */
export function trapTab(container: HTMLElement, event: KeyboardEvent): void {
  if (event.key !== "Tab") return;
  const tabbables = getTabbables(container);
  const first = tabbables[0];
  const last = tabbables[tabbables.length - 1];
  if (!first || !last) {
    event.preventDefault();
    return;
  }
  const active = container.ownerDocument.activeElement;
  if (event.shiftKey && (active === first || !container.contains(active))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && (active === last || !container.contains(active))) {
    event.preventDefault();
    first.focus();
  }
}
