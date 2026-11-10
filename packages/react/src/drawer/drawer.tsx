"use client";

import {
  createModalController,
  type DrawerAnchor,
  type DrawerCloseReason,
  type DrawerVariant,
  drawerAttributes,
  drawerStyle,
  type ModalController,
} from "@owlky/core";
import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  createContext,
  forwardRef,
  type MouseEvent,
  type ReactNode,
  type Ref,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button, type ButtonAsButtonProps } from "../button/button.js";
import { useMergedRefs } from "../utils/refs.js";

interface DrawerContextValue {
  open: boolean;
  setOpen(open: boolean, reason?: DrawerCloseReason): void;
  variant: DrawerVariant;
  contentId: string;
  /** Last trigger used, so focus returns to it even where clicks don't focus buttons (Safari). */
  triggerRef: { current: HTMLElement | null };
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

function useDrawerContext(component: string): DrawerContextValue {
  const context = useContext(DrawerContext);
  if (!context) throw new Error(`[owlky] <${component}> must be used inside <Drawer>.`);
  return context;
}

export interface DrawerProps {
  /** Controlled open state (ignored by `permanent` drawers, always shown). */
  open?: boolean | undefined;
  /** Initial open state when uncontrolled. Default `false`. */
  defaultOpen?: boolean | undefined;
  /**
   * Called whenever the drawer asks to open or close, with the reason for closing: `"escape"`,
   * `"backdrop"` or `"close"` (a trigger or DrawerClose). Controlled drawers may refuse.
   */
  onOpenChange?: ((open: boolean, reason?: DrawerCloseReason) => void) | undefined;
  /**
   * `temporary` (default): modal, over the page. `persistent`: docked in the layout, opened and
   * closed by its trigger. `permanent`: docked and always shown.
   */
  variant?: DrawerVariant | undefined;
  children?: ReactNode;
}

/** Drawer root — spec: specs/components/drawer.md. Provides state; renders no DOM. */
export function Drawer({
  open,
  defaultOpen = false,
  onOpenChange,
  variant = "temporary",
  children,
}: DrawerProps) {
  const [internal, setInternal] = useState(defaultOpen);
  const controlled = open !== undefined;
  const isOpen = variant === "permanent" || (controlled ? open : internal);
  const onChangeRef = useRef(onOpenChange);
  onChangeRef.current = onOpenChange;
  const setOpen = useCallback(
    (next: boolean, reason?: DrawerCloseReason) => {
      if (!controlled) setInternal(next);
      if (next) onChangeRef.current?.(true);
      else onChangeRef.current?.(false, reason);
    },
    [controlled],
  );
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentId = useId();
  const value = useMemo<DrawerContextValue>(
    () => ({ open: isOpen, setOpen, variant, contentId, triggerRef }),
    [isOpen, setOpen, variant, contentId],
  );
  return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>;
}

/**
 * A `Button` that opens the drawer (temporary: `aria-haspopup="dialog"`) or toggles it (persistent:
 * `aria-expanded` + `aria-controls`).
 */
export const DrawerTrigger = forwardRef<HTMLButtonElement, ButtonAsButtonProps>(
  function DrawerTrigger({ onClick, ...props }, ref) {
    const context = useDrawerContext("DrawerTrigger");
    const docked = context.variant !== "temporary";
    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      context.triggerRef.current = event.currentTarget;
      if (docked && context.open) context.setOpen(false, "close");
      else context.setOpen(true);
    };
    const aria = docked
      ? { "aria-expanded": context.open, "aria-controls": context.contentId }
      : { "aria-haspopup": "dialog" as const };
    return <Button ref={ref} {...aria} onClick={handleClick} {...props} />;
  },
);

export interface DrawerContentProps extends ComponentPropsWithoutRef<"dialog"> {
  /** Edge the drawer is attached to. Default `"left"`. */
  anchor?: DrawerAnchor | undefined;
  /** Temporary only: transparent backdrop (still modal; a click outside still closes it). */
  hideBackdrop?: boolean | undefined;
  /** Temporary only: Escape doesn't ask to close. */
  disableEscapeKeyDown?: boolean | undefined;
  /** Temporary only: focus isn't moved back to the trigger on close. */
  disableRestoreFocus?: boolean | undefined;
  /** Temporary only: the page behind can still scroll while the drawer is open. */
  disableScrollLock?: boolean | undefined;
  /**
   * Keeps the children rendered while the drawer is closed (MUI `ModalProps.keepMounted`).
   * Default `true` (the HTML markup is always there too); `false` renders them only while open.
   */
  keepMounted?: boolean | undefined;
  /** Shadow depth of the panel, 0–24. Default: each edge's own shadow (docked drawers: none). */
  elevation?: number | undefined;
  /** Length of the slide in and out, in ms. Default: the theme's short duration. */
  transitionDuration?: number | undefined;
}

/**
 * The panel: a modal `<dialog data-ok-drawer>` (temporary) or a docked `<aside>` (persistent,
 * permanent), with the content paper. Always rendered, so its markup is SSR-safe and matches the
 * HTML implementation. Name it with `aria-label` or `aria-labelledby`.
 */
export const DrawerContent = forwardRef<HTMLDialogElement | HTMLElement, DrawerContentProps>(
  function DrawerContent(
    {
      anchor,
      hideBackdrop,
      disableEscapeKeyDown,
      disableRestoreFocus,
      disableScrollLock,
      keepMounted = true,
      elevation,
      transitionDuration,
      children,
      style,
      ...props
    },
    forwardedRef,
  ) {
    const { open, setOpen, triggerRef, variant, contentId } = useDrawerContext("DrawerContent");
    const elementRef = useRef<HTMLDialogElement>(null);
    const ref = useMergedRefs(elementRef, forwardedRef as Ref<HTMLDialogElement>);
    const controllerRef = useRef<ModalController | null>(null);
    const temporary = variant === "temporary";
    const attributes = drawerAttributes({
      anchor,
      variant,
      hideBackdrop,
      disableEscapeKeyDown,
      disableRestoreFocus,
      disableScrollLock,
      elevation,
      transitionDuration,
    });
    const custom = drawerStyle({ elevation, transitionDuration });
    const merged =
      Object.keys(custom).length > 0 ? ({ ...custom, ...style } as CSSProperties) : style;
    const content = <div data-ok-drawer-content="">{keepMounted || open ? children : null}</div>;

    // Effects run in declaration order: create the controller, sync options, then open/close.
    useEffect(() => {
      if (!temporary) return;
      const element = elementRef.current as HTMLDialogElement;
      const controller = createModalController(element, {
        contentSelector: "[data-ok-drawer-content]",
      });
      controllerRef.current = controller;
      return () => {
        controller.destroy();
        controllerRef.current = null;
      };
    }, [temporary]);

    useEffect(() => {
      controllerRef.current?.setOptions({
        contentSelector: "[data-ok-drawer-content]",
        closeOnEscape: disableEscapeKeyDown !== true,
        restoreFocus: disableRestoreFocus !== true,
        lockScroll: disableScrollLock !== true,
        onDismiss: (reason) => setOpen(false, reason),
        onExternalClose: () => setOpen(false, "close"),
      });
    });

    useEffect(() => {
      const controller = controllerRef.current;
      if (!controller) return;
      if (open) controller.open(triggerRef.current);
      else controller.close();
    }, [open, triggerRef]);

    if (!temporary) {
      const { id = contentId, ...rest } = props as ComponentPropsWithoutRef<"aside">;
      return (
        <aside
          ref={ref as Ref<HTMLElement>}
          id={id}
          {...attributes}
          data-ok-runtime="off"
          hidden={!open}
          style={merged}
          {...rest}
        >
          {content}
        </aside>
      );
    }
    return (
      <dialog ref={ref} {...attributes} data-ok-runtime="off" style={merged} {...props}>
        {content}
      </dialog>
    );
  },
);

/** A `Button` that closes the drawer. */
export const DrawerClose = forwardRef<HTMLButtonElement, ButtonAsButtonProps>(function DrawerClose(
  { onClick, ...props },
  ref,
) {
  const { setOpen } = useDrawerContext("DrawerClose");
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented) setOpen(false, "close");
  };
  return <Button ref={ref} onClick={handleClick} {...props} />;
});
