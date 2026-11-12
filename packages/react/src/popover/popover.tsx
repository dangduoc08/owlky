"use client";

import {
  createPopoverController,
  type Placement,
  type PopoverAnchorPosition,
  type PopoverAnchorReference,
  type PopoverAnchorTarget,
  type PopoverController,
  type PopoverDismissReason,
  type PopoverVirtualAnchor,
  popoverAttributes,
} from "@owlky/core";
import { forwardRef, type HTMLAttributes, type ReactNode, useEffect, useRef } from "react";
import { useMergedRefs } from "../utils/refs.js";

/**
 * An element or a virtual anchor (anything with `getBoundingClientRect()`, such as a text
 * selection), or a function returning one (read when the popover opens).
 */
export type PopoverAnchor =
  | PopoverAnchorTarget
  | null
  | undefined
  | (() => PopoverAnchorTarget | null | undefined);

export const resolveAnchor = (anchor: PopoverAnchor): PopoverAnchorTarget | null =>
  (typeof anchor === "function" ? anchor() : anchor) ?? null;

/** Stands in for a missing `anchorEl` when a point or the author's CSS positions the popover. */
const NO_ANCHOR: PopoverVirtualAnchor = { getBoundingClientRect: () => new DOMRect() };

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
  /**
   * What positions the popover: `"anchorEl"` (default), `"anchorPosition"` (the point in
   * `anchorPosition`; `anchorEl` may then be left out) or `"none"` (your own CSS).
   */
  anchorReference?: PopoverAnchorReference | undefined;
  /** The point, in px from the viewport's top left corner, used with `anchorReference="anchorPosition"`. */
  anchorPosition?: PopoverAnchorPosition | undefined;
  /** Minimum distance to the viewport edges, in px. Default 16. */
  marginThreshold?: number | undefined;
  /** Length of the opening animation, in ms. Default: the theme's shorter duration. */
  transitionDuration?: number | undefined;
  /** Draws an arrow pointing at the anchor. */
  arrow?: boolean | undefined;
  /**
   * Shadow depth of the paper, 0–24 (`--ok-elevation-<n>`). Default: the theme's dropdown
   * shadow. The popover is a Paper.
   */
  elevation?: number | undefined;
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
 * Popover — spec: specs/components/popover.md. A `div[popover=manual]` in the top layer (a
 * Paper: `data-ok-paper`, ADR-0066),
 * positioned next to `anchorEl` by the core popover controller. Controlled, like MUI: keep `open`
 * in state and set it from `onOpenChange`.
 */
export const Popover = forwardRef<HTMLDivElement, PopoverProps>(function Popover(
  {
    open,
    anchorEl,
    onOpenChange,
    placement,
    anchorReference,
    anchorPosition,
    marginThreshold,
    transitionDuration,
    arrow,
    elevation,
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
      anchorReference,
      anchorPosition,
      marginThreshold,
      transitionDuration,
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
    const anchor =
      resolveAnchor(anchorEl) ??
      (anchorReference === "anchorPosition" || anchorReference === "none" ? NO_ANCHOR : null);
    if (open && anchor) controller.open(anchor);
    else controller.close();
  }, [open, anchorEl, anchorReference]);

  return (
    <div
      ref={ref}
      popover="manual"
      {...popoverAttributes({
        placement,
        anchorReference,
        marginThreshold,
        transitionDuration,
        arrow,
        elevation,
        disableEscapeKeyDown,
        disableAutoFocus,
        disableRestoreFocus,
      })}
      data-ok-anchor-position={
        anchorPosition ? `${anchorPosition.top},${anchorPosition.left}` : undefined
      }
      data-ok-runtime="off"
      {...props}
    >
      <span data-ok-popover-arrow="" aria-hidden="true" />
      {children}
    </div>
  );
});
