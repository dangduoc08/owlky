"use client";

import {
  createModalController,
  type DialogCloseReason,
  type DialogMaxWidth,
  type DialogScroll,
  type DialogTransition,
  dialogAttributes,
  type ModalController,
  motionAttributes,
} from "@owlky/core";
import {
  type ComponentPropsWithoutRef,
  createContext,
  forwardRef,
  type HTMLAttributes,
  useContext,
  useEffect,
  useId,
  useRef,
} from "react";
import { useMergedRefs } from "../utils/refs.js";

const TitleIdContext = createContext<string | undefined>(undefined);

export interface DialogProps extends Omit<ComponentPropsWithoutRef<"dialog">, "open"> {
  /** Controlled open state. */
  open: boolean;
  /**
   * Called when the dialog asks to close: `"escape"`, `"backdrop"` (a click outside the paper)
   * or `"close"` (the browser closed it, for example a `form[method=dialog]`).
   */
  onOpenChange?: ((open: boolean, reason?: DialogCloseReason) => void) | undefined;
  /** Default `"sm"` (600px). */
  maxWidth?: DialogMaxWidth | undefined;
  /** Takes the whole `maxWidth`. */
  fullWidth?: boolean | undefined;
  /** Covers the viewport. */
  fullScreen?: boolean | undefined;
  /** `paper` (default): the content scrolls; `body`: the whole dialog scrolls. */
  scroll?: DialogScroll | undefined;
  /** Transparent backdrop (still modal). */
  hideBackdrop?: boolean | undefined;
  /** Escape doesn't ask to close. */
  disableEscapeKeyDown?: boolean | undefined;
  /** Focus isn't moved back to the element focused before the dialog opened. */
  disableRestoreFocus?: boolean | undefined;
  /** The page behind can still scroll while the dialog is open. */
  disableScrollLock?: boolean | undefined;
  /**
   * Keeps the children rendered while the dialog is closed. Default `true` (the HTML markup is
   * always there too); `false` renders them only while it is open (MUI's default), which
   * resets their state on every opening.
   */
  keepMounted?: boolean | undefined;
  /**
   * Entrance of the paper: a Motion entrance (`slideInUp`, `zoomIn`…). Without it, the paper fades
   * and scales in briefly.
   */
  transition?: DialogTransition | undefined;
  /** Props of the paper (`className`, `style`, …). */
  paperProps?: HTMLAttributes<HTMLDivElement> | undefined;
}

/**
 * Dialog — spec: specs/components/dialog.md. A modal `<dialog data-ok-dialog>` (native top layer,
 * inert page, focus trap; fallback without `showModal()`) with the paper inside. Controlled, like
 * MUI: keep `open` in state. Named by its `DialogTitle` (automatic `aria-labelledby`). Focus
 * returns to the element focused before it opened.
 */
export const Dialog = forwardRef<HTMLDialogElement, DialogProps>(function Dialog(
  {
    open,
    onOpenChange,
    maxWidth,
    fullWidth,
    fullScreen,
    scroll,
    hideBackdrop,
    disableEscapeKeyDown,
    disableRestoreFocus,
    disableScrollLock,
    keepMounted = true,
    transition,
    paperProps,
    children,
    ...props
  },
  forwardedRef,
) {
  const elementRef = useRef<HTMLDialogElement>(null);
  const ref = useMergedRefs(elementRef, forwardedRef);
  const controllerRef = useRef<ModalController | null>(null);
  const titleId = useId();

  useEffect(() => {
    const controller = createModalController(elementRef.current as HTMLDialogElement, {
      contentSelector: "[data-ok-dialog-paper]",
    });
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    controllerRef.current?.setOptions({
      contentSelector: "[data-ok-dialog-paper]",
      closeOnEscape: disableEscapeKeyDown !== true,
      restoreFocus: disableRestoreFocus !== true,
      lockScroll: disableScrollLock !== true,
      onDismiss: (reason) => onOpenChange?.(false, reason),
      onExternalClose: () => onOpenChange?.(false, "close"),
    });
  });

  useEffect(() => {
    const controller = controllerRef.current as ModalController;
    if (open) controller.open();
    else controller.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      {...dialogAttributes({
        maxWidth,
        fullWidth,
        fullScreen,
        scroll,
        hideBackdrop,
        disableEscapeKeyDown,
        disableRestoreFocus,
        disableScrollLock,
      })}
      data-ok-runtime="off"
      aria-labelledby={props["aria-label"] ? undefined : titleId}
      {...props}
    >
      <TitleIdContext.Provider value={titleId}>
        <div
          data-ok-dialog-paper=""
          {...(transition
            ? {
                ...motionAttributes({ variant: transition, trigger: "mount" }),
                "data-ok-state": "enter",
              }
            : {})}
          {...paperProps}
        >
          {keepMounted || open ? children : null}
        </div>
      </TitleIdContext.Provider>
    </dialog>
  );
});

/** The dialog's heading (`h2`); it names the dialog. */
export const DialogTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  function DialogTitle({ id, ...props }, ref) {
    const titleId = useContext(TitleIdContext);
    return <h2 ref={ref} id={id ?? titleId} data-ok-dialog-title="" {...props} />;
  },
);

export interface DialogContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Lines above and below the content (and 16px padding). */
  dividers?: boolean | undefined;
}

/** The scrollable body of the dialog. */
export const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(function DialogContent(
  { dividers, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-ok-dialog-content=""
      {...(dividers ? { "data-ok-dividers": "" } : {})}
      {...props}
    />
  );
});

/** Secondary text in the content (`p`). */
export const DialogContentText = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(function DialogContentText(props, ref) {
  return <p ref={ref} data-ok-dialog-content-text="" {...props} />;
});

export interface DialogActionsProps extends HTMLAttributes<HTMLDivElement> {
  /** No 12px gap between the actions. */
  disableSpacing?: boolean | undefined;
}

/** The row of buttons at the end of the dialog. */
export const DialogActions = forwardRef<HTMLDivElement, DialogActionsProps>(function DialogActions(
  { disableSpacing, ...props },
  ref,
) {
  return (
    <div
      ref={ref}
      data-ok-dialog-actions=""
      {...(disableSpacing ? { "data-ok-disable-spacing": "" } : {})}
      {...props}
    />
  );
});
