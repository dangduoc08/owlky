import { focusInitial, isFocusable, trapTab } from "../dom/focus.js";
import { supports } from "../dom/support.js";
import { type ExitHandle, playExit } from "../motion/presence.js";
import { inertOutside } from "../overlay/inert-outside.js";
import { layerStack } from "../overlay/layer-stack.js";
import { lockScroll } from "../overlay/scroll-lock.js";

/** Why a close was requested by the user (the owner decides whether to honor it). */
export type ModalDismissReason = "escape" | "backdrop";

export interface ModalControllerOptions {
  /** Close when Escape is pressed. Default `true`. */
  closeOnEscape?: boolean | undefined;
  /** Close when clicking outside the content (on the backdrop). Default `true`. */
  closeOnBackdrop?: boolean | undefined;
  /**
   * The user asked to close (Escape or backdrop). The controller does NOT close by itself:
   * the owner (React state, HTML instance) calls `close()` if it agrees. This keeps controlled
   * React dialogs and cancelable HTML events working the same way.
   */
  onDismiss?: ((reason: ModalDismissReason) => void) | undefined;
  /**
   * The browser closed the dialog on its own (e.g. `<form method="dialog">`, or a platform close
   * request that could not be canceled). Cleanup has already run; sync your state.
   */
  onExternalClose?: (() => void) | undefined;
  /**
   * The visible panel inside the transparent `<dialog>` (initial focus falls back to it; a click
   * outside it is a backdrop click). Default: the element itself.
   */
  contentSelector?: string | undefined;
  /** Move focus back to where it was on close (MUI `disableRestoreFocus` = false). Default `true`. */
  restoreFocus?: boolean | undefined;
  /** Stop the page from scrolling while open (MUI `disableScrollLock` = false). Default `true`. */
  lockScroll?: boolean | undefined;
  /**
   * Play the exit before closing (ADR-0062): the element gets `data-ok-state="exiting"` (and a
   * Motion content its exit) and the dialog closes when those animations end. Default `true`;
   * `false` closes at once.
   */
  exit?: boolean | undefined;
  /** Force the non-native fallback. For tests and diagnostics; normally auto-detected. */
  forceFallback?: boolean | undefined;
}

export interface ModalController {
  /** Open, and not closing. */
  readonly isOpen: boolean;
  /** Playing its exit: still modal on screen, but `isOpen` is already `false`. */
  readonly isClosing: boolean;
  /** `true` when running without `showModal()` (ADR-0006). */
  readonly isFallback: boolean;
  /** Opens modally. Focus returns to `returnFocusTo` (default: the focused element) on close. */
  open(returnFocusTo?: HTMLElement | null): void;
  /**
   * Closes after the exit animation. Resolves `true` once closed (focus restored), `false` when
   * `open()` or `destroy()` interrupted the exit. Calls during an exit share its promise.
   */
  close(): Promise<boolean>;
  setOptions(options: ModalControllerOptions): void;
  /** Closes without restoring focus and removes every listener. Idempotent. */
  destroy(): void;
}

/**
 * Modal behavior on top of a `<dialog>` element, shared by modal components (Drawer; Dialog).
 *
 * Native path: `showModal()` (top layer, inert page, Escape → `cancel` event).
 * Fallback path (no `showModal`): `open` attribute + `data-ok-fallback`, siblings made inert,
 * Tab trapped and Escape handled manually. Both paths share focus, scroll-lock, stacking and
 * backdrop logic, so behavior is identical.
 */
export function createModalController(
  element: HTMLElement,
  initialOptions: ModalControllerOptions = {},
): ModalController {
  let options = initialOptions;
  const fallback = options.forceFallback === true || !supports.dialog;
  const nativeDialog = fallback ? null : (element as HTMLDialogElement);
  const listeners = new AbortController();
  const { signal } = listeners;

  let isOpen = false;
  let returnFocus: HTMLElement | null = null;
  let releaseScroll: (() => void) | null = null;
  let releaseInert: (() => void) | null = null;
  let pointerDownOnBackdrop = false;
  /** The running exit: its handles and how to settle the promise `close()` returned. */
  let closing: {
    exits: ExitHandle[];
    promise: Promise<boolean>;
    settle(closed: boolean): void;
  } | null = null;

  const doc = element.ownerDocument;

  function cleanup(restoreFocus: boolean) {
    isOpen = false;
    layerStack.remove(element);
    releaseScroll?.();
    releaseScroll = null;
    releaseInert?.();
    releaseInert = null;
    if (fallback) {
      element.removeAttribute("open");
      element.removeAttribute("data-ok-fallback");
      element.removeAttribute("aria-modal");
    }
    const target = returnFocus;
    returnFocus = null;
    const focusLost =
      !doc.activeElement || doc.activeElement === doc.body || element.contains(doc.activeElement);
    if (restoreFocus && options.restoreFocus !== false && focusLost && isFocusable(target))
      target.focus();
  }

  const dismiss = (reason: ModalDismissReason) => {
    const allowed = reason === "escape" ? options.closeOnEscape : options.closeOnBackdrop;
    if (allowed !== false) options.onDismiss?.(reason);
  };

  // Native Escape: always cancel the browser's own close so the owner decides (controlled state).
  element.addEventListener(
    "cancel",
    (event) => {
      if (event.target !== element) return;
      event.preventDefault();
      if (isOpen) dismiss("escape");
    },
    { signal },
  );

  // The browser closed the dialog itself (form[method=dialog], uncancelable close request).
  element.addEventListener(
    "close",
    (event) => {
      if (event.target !== element) return;
      if (closing) {
        // Closed by the browser during the exit: finish now.
        finish(closing);
        return;
      }
      if (!isOpen) return;
      cleanup(true);
      options.onExternalClose?.();
    },
    { signal },
  );

  // Backdrop click: the press must start AND end on the dialog itself (outside the content),
  // so a text selection dragged out of the content doesn't close it.
  element.addEventListener(
    "pointerdown",
    (event) => {
      pointerDownOnBackdrop = event.target === element;
    },
    { signal },
  );
  element.addEventListener(
    "click",
    (event) => {
      const onBackdrop = pointerDownOnBackdrop && event.target === element;
      pointerDownOnBackdrop = false;
      if (onBackdrop && isOpen && layerStack.isTop(element)) dismiss("backdrop");
    },
    { signal },
  );

  if (fallback) {
    doc.addEventListener(
      "keydown",
      (event) => {
        if ((!isOpen && !closing) || !layerStack.isTop(element)) return;
        if (event.key === "Escape") {
          event.preventDefault();
          if (closing) return;
          dismiss("escape");
        } else {
          trapTab(element, event);
        }
      },
      { signal },
    );
  }

  /** Removes the exit states written by `playExit`. */
  const restore = (exits: ExitHandle[]) => {
    for (const exit of exits) exit.restore();
  };

  /** Closes the dialog for good (after the exit, or at once). */
  function shut() {
    const keep = options.restoreFocus === false;
    const active = doc.activeElement;
    nativeDialog?.close();
    // The browser moves focus back itself when a modal dialog closes: undo it.
    const moved = doc.activeElement;
    if (keep && moved !== active && moved instanceof HTMLElement && moved !== doc.body)
      moved.blur();
    cleanup(true);
  }

  function finish(current: NonNullable<typeof closing>) {
    if (closing !== current) return;
    closing = null;
    shut();
    restore(current.exits);
    current.settle(true);
  }

  /** Ends a running exit without closing (`open()`) or closes at once (`destroy()`). */
  function interrupt(): void {
    const current = closing;
    if (!current) return;
    closing = null;
    for (const exit of current.exits) exit.cancel();
    current.settle(false);
  }

  return {
    get isOpen() {
      return isOpen;
    },
    get isClosing() {
      return closing !== null;
    },
    isFallback: fallback,

    open(returnFocusTo) {
      if (signal.aborted) return;
      if (closing) {
        // Interrupted exit: stay open, keep the focus and the return target.
        interrupt();
        isOpen = true;
        return;
      }
      if (isOpen) return;
      if (!element.isConnected) throw new Error("[owlky] Cannot open a detached modal.");
      const active = doc.activeElement;
      returnFocus = returnFocusTo ?? (active instanceof HTMLElement ? active : null);

      if (nativeDialog) {
        // A dialog opened non-modally via the `open` attribute must be closed first.
        if (nativeDialog.open) nativeDialog.close();
        nativeDialog.showModal();
      } else {
        element.setAttribute("open", "");
        element.setAttribute("data-ok-fallback", "");
        element.setAttribute("aria-modal", "true");
        if (!element.hasAttribute("role")) element.setAttribute("role", "dialog");
        releaseInert = inertOutside(element);
      }
      isOpen = true;
      layerStack.push(element);
      if (options.lockScroll !== false) releaseScroll = lockScroll(doc);
      const selector = options.contentSelector;
      const content = (selector && element.querySelector<HTMLElement>(selector)) || element;
      focusInitial(element, content);
    },

    close() {
      if (closing) return closing.promise;
      if (!isOpen) return Promise.resolve(true);
      // Mark closed before calling dialog.close(): its `close` event is then ignored.
      isOpen = false;
      const selector = options.contentSelector;
      const content = selector ? element.querySelector<HTMLElement>(selector) : null;
      const exits =
        options.exit === false
          ? []
          : [
              playExit(element),
              ...(content?.matches("[data-ok-motion]") ? [playExit(content)] : []),
            ];
      if (!exits.some((exit) => exit.running)) {
        shut();
        restore(exits);
        return Promise.resolve(true);
      }
      let settle!: (closed: boolean) => void;
      const promise = new Promise<boolean>((resolve) => {
        settle = resolve;
      });
      const current = { exits, promise, settle };
      closing = current;
      Promise.all(exits.map((exit) => exit.finished)).then((ended) => {
        if (ended.every(Boolean)) finish(current);
      });
      return promise;
    },

    setOptions(next) {
      options = { ...next, forceFallback: options.forceFallback };
    },

    destroy() {
      if (signal.aborted) return;
      if (closing) {
        const current = closing;
        interrupt();
        restore(current.exits);
        isOpen = true;
      }
      if (isOpen) {
        isOpen = false;
        nativeDialog?.close();
        cleanup(false);
      }
      listeners.abort();
    },
  };
}
