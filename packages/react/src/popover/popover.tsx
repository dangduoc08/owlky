"use client";

import {
  createPopoverController,
  type Placement,
  type PopoverController,
  type PopoverDismissReason,
  popoverAttributes,
} from "@owlky/core";
import { forwardRef, type HTMLAttributes, type ReactNode, useEffect, useRef } from "react";
import { useMergedRefs } from "../utils/refs.js";

/** An element, or a function returning one (read when the popover opens). */
export type PopoverAnchor = Element | null | undefined | (() => Element | null | undefined);

export const resolveAnchor = (anchor: PopoverAnchor): Element | null =>
  (typeof anchor === "function" ? anchor() : anchor) ?? null;

/** Arrow size in px (`--_ok-arrow-size` in popover.css: 24px). */
export const POPOVER_ARROW = 24;

export interface PopoverProps extends Omit<HTMLAttributes<HTMLDivElement>, "popover"> {
  /** Controlled open state (needs `anchorEl`). */
  open: boolean;
  /** The element the popover points at. */
  anchorEl: PopoverAnchor;
  /** Called when the user asks to close: `"escape"` or `"backdrop"` (a press outside). */
  onOpenChange?: ((open: boolean, reason?: PopoverDismissReason) => void) | undefined;
  /** Side of the anchor and alignment. Default `"bottom"`. Flips when there is no room. */
  placement?: Placement | undefined;
  /** Draws an arrow pointing at the anchor. */
  arrow?: boolean | undefined;
  /** Escape doesn't ask to close. */
  disableEscapeKeyDown?: boolean | undefined;
  /** Focus stays on the anchor when the popover opens (hover popovers). */
  disableAutoFocus?: boolean | undefined;
  /** Focus isn't moved back to the anchor on close. */
  disableRestoreFocus?: boolean | undefined;
  /** Where focus goes on open; default: the first focusable element, else the popover. */
  initialFocus?: (() => HTMLElement | null | undefined) | undefined;
  children?: ReactNode;
}

/**
 * Popover — spec: specs/components/popover.md. A `div[popover=manual]` in the top layer,
 * positioned next to `anchorEl` by the core popover controller. Controlled, like MUI: keep `open`
 * in state and set it from `onOpenChange`.
 */
export const Popover = forwardRef<HTMLDivElement, PopoverProps>(function Popover(
  {
    open,
    anchorEl,
    onOpenChange,
    placement,
    arrow,
    disableEscapeKeyDown,
    disableAutoFocus,
    disableRestoreFocus,
    initialFocus,
    children,
    ...props
  },
  forwardedRef,
) {
  const elementRef = useRef<HTMLDivElement>(null);
  const ref = useMergedRefs(elementRef, forwardedRef);
  const controllerRef = useRef<PopoverController | null>(null);

  useEffect(() => {
    const controller = createPopoverController(elementRef.current as HTMLDivElement);
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    controllerRef.current?.setOptions({
      placement,
      arrow: arrow ? POPOVER_ARROW : 0,
      offset: arrow ? 14 : 8,
      closeOnEscape: disableEscapeKeyDown !== true,
      autoFocus: disableAutoFocus !== true,
      restoreFocus: disableRestoreFocus !== true,
      initialFocus,
      onDismiss: (reason) => onOpenChange?.(false, reason),
    });
  });

  useEffect(() => {
    const controller = controllerRef.current as PopoverController;
    const anchor = resolveAnchor(anchorEl);
    if (open && anchor) controller.open(anchor);
    else controller.close();
  }, [open, anchorEl]);

  return (
    <div
      ref={ref}
      popover="manual"
      {...popoverAttributes({
        placement,
        arrow,
        disableEscapeKeyDown,
        disableAutoFocus,
        disableRestoreFocus,
      })}
      data-ok-runtime="off"
      {...props}
    >
      <span data-ok-popover-arrow="" aria-hidden="true" />
      {children}
    </div>
  );
});
