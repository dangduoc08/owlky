import { focusInitial, isFocusable } from "../dom/focus.js";
import { supports } from "../dom/support.js";
import { layerStack } from "../overlay/layer-stack.js";
import { computePosition, type Placement, parsePlacement } from "./position.js";

/** Why a close was requested: Escape, or a press outside the popover and its anchor. */
export type PopoverDismissReason = "escape" | "backdrop";

export interface PopoverControllerOptions {
  /** Requested side and alignment. Default `"bottom"`. */
  placement?: Placement | undefined;
  /** Gap to the anchor in px. Default 8. */
  offset?: number | undefined;
  /** Arrow size in px when the popover draws one (`[data-ok-popover-arrow]`); 0 = none. */
  arrow?: number | undefined;
  /** Move focus into the popover on open (MUI `disableAutoFocus` = false). Default `true`. */
  autoFocus?: boolean | undefined;
  /** Return focus to the anchor on close (MUI `disableRestoreFocus` = false). Default `true`. */
  restoreFocus?: boolean | undefined;
  /** Where focus goes on open (with `autoFocus`); default: the first tabbable, else the popover. */
  initialFocus?: (() => HTMLElement | null | undefined) | undefined;
  /** Ask to close on a press outside the popover and its anchor. Default `true`. */
  closeOnOutside?: boolean | undefined;
  /** Ask to close on Escape. Default `true`. */
  closeOnEscape?: boolean | undefined;
  /**
   * The user asked to close. The controller does NOT close by itself: the owner calls `close()`
   * if it agrees (controlled React state, cancelable HTML events).
   */
  onDismiss?: ((reason: PopoverDismissReason) => void) | undefined;
  /** Force the non-native fallback (tests, diagnostics); normally auto-detected. */
  forceFallback?: boolean | undefined;
}

export interface PopoverController {
  readonly isOpen: boolean;
  /** `true` without the Popover API (ADR-0006): `data-ok-fallback`, fixed + z-index. */
  readonly isFallback: boolean;
  /** Shows the popover next to `anchor`. */
  open(anchor: Element): void;
  close(): void;
  /** Recomputes the position (called automatically on scroll, resize and size changes). */
  update(): void;
  setOptions(options: PopoverControllerOptions): void;
  /** Closes without restoring focus and removes every listener. Idempotent. */
  destroy(): void;
}

/** Attribute the controller writes while open (both paths): CSS shows the popover with it. */
export const POPOVER_OPEN_ATTRIBUTE = "data-ok-open";
/** Attribute with the placement actually used (after a flip): CSS turns the arrow with it. */
export const POPOVER_PLACEMENT_ATTRIBUTE = "data-ok-current-placement";

const px = (value: number) => `${value}px`;

/**
 * Anchored, non-modal overlay behavior shared by Popover, Menu and Tooltip.
 *
 * Native path: `popover="manual"` + `showPopover()` (top layer, nothing clips it). Fallback (no
 * Popover API): `data-ok-fallback`, CSS `position: fixed` + `--ok-z-*`. Both paths position the
 * element through CSSOM custom properties (`--_ok-popover-x|y|w|h|arrow`), report Escape and outside
 * presses through `onDismiss`, and join the page-wide layer stack so nested overlays close one at
 * a time.
 */
export function createPopoverController(
  element: HTMLElement,
  initialOptions: PopoverControllerOptions = {},
): PopoverController {
  let options = initialOptions;
  const fallback = options.forceFallback === true || !supports.popover;
  const doc = element.ownerDocument;
  const win = doc.defaultView as Window;
  const listeners = new AbortController();
  let openListeners: AbortController | null = null;
  let resize: ResizeObserver | null = null;
  let anchor: Element | null = null;
  let isOpen = false;
  let frame = 0;
  let returnFocus: HTMLElement | null = null;

  function update() {
    if (!isOpen || !anchor) return;
    const rect = anchor.getBoundingClientRect();
    const position = computePosition({
      anchor: rect,
      floating: { width: element.offsetWidth, height: element.offsetHeight },
      viewport: { width: doc.documentElement.clientWidth, height: win.innerHeight },
      placement: parsePlacement(
        options.placement ?? element.getAttribute("data-ok-placement"),
        "bottom",
      ),
      offset: options.offset,
      arrow: options.arrow,
    });
    element.style.setProperty("--_ok-popover-w", px(element.offsetWidth));
    element.style.setProperty("--_ok-popover-h", px(element.offsetHeight));
    element.style.setProperty("--_ok-popover-x", px(position.x));
    element.style.setProperty("--_ok-popover-y", px(position.y));
    if (position.arrow === undefined) element.style.removeProperty("--_ok-popover-arrow");
    else element.style.setProperty("--_ok-popover-arrow", px(position.arrow));
    element.setAttribute(POPOVER_PLACEMENT_ATTRIBUTE, position.placement);
  }

  const schedule = () => {
    if (frame) return;
    frame = win.requestAnimationFrame(() => {
      frame = 0;
      update();
    });
  };

  const dismiss = (reason: PopoverDismissReason) => {
    const allowed = reason === "escape" ? options.closeOnEscape : options.closeOnOutside;
    if (allowed !== false) options.onDismiss?.(reason);
  };

  function cleanup(restoreFocus: boolean) {
    isOpen = false;
    layerStack.remove(element);
    openListeners?.abort();
    openListeners = null;
    resize?.disconnect();
    resize = null;
    if (frame) win.cancelAnimationFrame(frame);
    frame = 0;
    element.removeAttribute(POPOVER_OPEN_ATTRIBUTE);
    element.removeAttribute(POPOVER_PLACEMENT_ATTRIBUTE);
    if (fallback) element.removeAttribute("data-ok-fallback");
    const target = returnFocus;
    returnFocus = null;
    anchor = null;
    const focusInside = element.contains(doc.activeElement);
    const focusLost = !doc.activeElement || doc.activeElement === doc.body || focusInside;
    if (restoreFocus && focusLost && isFocusable(target)) target.focus();
  }

  return {
    get isOpen() {
      return isOpen;
    },
    isFallback: fallback,

    open(target) {
      if (listeners.signal.aborted) return;
      if (!element.isConnected) throw new Error("[owlky] Cannot open a detached popover.");
      if (isOpen) {
        anchor = target;
        update();
        return;
      }
      anchor = target;
      isOpen = true;
      const autoFocus = options.autoFocus !== false;
      returnFocus =
        options.restoreFocus !== false
          ? target instanceof HTMLElement
            ? target
            : doc.activeElement instanceof HTMLElement
              ? doc.activeElement
              : null
          : null;
      element.setAttribute(POPOVER_OPEN_ATTRIBUTE, "");
      if (fallback) element.setAttribute("data-ok-fallback", "");
      else {
        if (!element.hasAttribute("popover")) element.setAttribute("popover", "manual");
        if (!element.matches(":popover-open")) element.showPopover();
      }
      layerStack.push(element);
      update();

      openListeners = new AbortController();
      const signal = openListeners.signal;
      win.addEventListener("resize", schedule, { signal });
      win.addEventListener("scroll", schedule, { signal, capture: true, passive: true });
      resize = new ResizeObserver(schedule);
      resize.observe(element);
      resize.observe(target);
      // Outside press: in the capture phase, so content that stops propagation can't hide it.
      doc.addEventListener(
        "pointerdown",
        (event) => {
          const node = event.target as Node | null;
          if (!node || element.contains(node) || anchor?.contains(node)) return;
          if (layerStack.isTop(element)) dismiss("backdrop");
        },
        { signal, capture: true },
      );
      doc.addEventListener(
        "keydown",
        (event) => {
          if (event.key !== "Escape" || !layerStack.isTop(element)) return;
          event.preventDefault();
          dismiss("escape");
        },
        { signal },
      );
      if (autoFocus) {
        const first = options.initialFocus?.();
        if (first) first.focus();
        else focusInitial(element);
      }
    },

    close() {
      if (!isOpen) return;
      if (!fallback && element.matches(":popover-open")) element.hidePopover();
      cleanup(true);
    },

    update,

    setOptions(next) {
      options = { ...next, forceFallback: options.forceFallback };
      if (isOpen) update();
    },

    destroy() {
      if (listeners.signal.aborted) return;
      if (isOpen) {
        if (!fallback && element.matches(":popover-open")) element.hidePopover();
        cleanup(false);
      }
      listeners.abort();
    },
  };
}
