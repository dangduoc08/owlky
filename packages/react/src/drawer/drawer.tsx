"use client";

import {
  createDrawerSwipe,
  createModalController,
  type DrawerAnchor,
  type DrawerCloseReason,
  type DrawerSwipe,
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
   * Called whenever the drawer asks to open or close, with the reason: `"escape"`, `"backdrop"`,
   * `"close"` (a trigger or DrawerClose) or `"swipe"` (a swipeable drawer, opening or closing).
   * Controlled drawers may refuse.
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
      if (next) {
        if (reason === undefined) onChangeRef.current?.(true);
        else onChangeRef.current?.(true, reason);
      } else onChangeRef.current?.(false, reason);
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
  /**
   * Temporary only: a touch or pen swipe towards the edge closes the drawer, and one from a strip
   * along the edge of the screen opens it (`onOpenChange(open, "swipe")`). Keep a button that opens
   * and closes it too: a swipe is a pointer gesture.
   */
  swipeable?: boolean | undefined;
  /** Swipeable: width of the strip along the edge of the screen where a swipe opens it, px. Default 20. */
  swipeAreaWidth?: number | undefined;
  /** Swipeable: how far the panel must be pulled to open or close, as a share of its size (0 to 1). Default 0.52. */
  hysteresis?: number | undefined;
  /** Swipeable: speed from which a shorter swipe still opens or closes it, px per second. Default 450. */
  minFlingVelocity?: number | undefined;
  /** Swipeable: no strip along the edge, so a swipe only closes the drawer. */
  disableSwipeToOpen?: boolean | undefined;
  /** Swipeable: touching the edge strip doesn't slide a sliver of the panel in. */
  disableDiscovery?: boolean | undefined;
  /** Swipeable: the backdrop doesn't fade with the panel while it is swiped (less work on slow devices). */
  disableBackdropTransition?: boolean | undefined;
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
      swipeable,
      swipeAreaWidth,
      hysteresis,
      minFlingVelocity,
      disableSwipeToOpen,
      disableDiscovery,
      disableBackdropTransition,
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
      swipeable: temporary && swipeable === true,
      swipeAreaWidth,
      hysteresis,
      minFlingVelocity,
      disableSwipeToOpen,
      disableDiscovery,
      disableBackdropTransition,
    });
    const custom = drawerStyle({ elevation, transitionDuration });
    const merged =
      Object.keys(custom).length > 0 ? ({ ...custom, ...style } as CSSProperties) : style;
    // Children stay rendered until the exit has played (`keepMounted={false}`).
    const [shown, setShown] = useState(open);
    if (open && !shown) setShown(true);
    const content = (
      <div data-ok-drawer-content="" data-ok-paper="">
        {keepMounted || open || shown ? children : null}
      </div>
    );

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

    // Swipeable (core createDrawerSwipe): after the controller, before the open / close sync.
    const swiping = temporary && swipeable === true;
    const swipeRef = useRef<DrawerSwipe | null>(null);
    const openRef = useRef(open);
    openRef.current = open;
    const swipeOptions = {
      anchor: attributes["data-ok-anchor"] as DrawerAnchor,
      swipeAreaWidth,
      hysteresis,
      minFlingVelocity,
      disableSwipeToOpen,
      disableDiscovery,
      disableBackdropTransition,
      isOpen: () => openRef.current,
      onOpen: () => setOpen(true, "swipe"),
      onClose: () => setOpen(false, "swipe"),
    };
    const latestSwipe = useRef(swipeOptions);
    latestSwipe.current = swipeOptions;
    useEffect(() => {
      const element = elementRef.current;
      const controller = controllerRef.current;
      if (!swiping || !element || !controller) return;
      const next = element.nextElementSibling;
      const area = next?.matches("[data-ok-drawer-swipe-area]") ? (next as HTMLElement) : null;
      const swipe = createDrawerSwipe(element, controller, area, latestSwipe.current);
      swipeRef.current = swipe;
      return () => {
        swipe.destroy();
        swipeRef.current = null;
      };
    }, [swiping]);
    useEffect(() => {
      swipeRef.current?.setOptions(latestSwipe.current);
    });

    useEffect(() => {
      const controller = controllerRef.current;
      if (!controller) {
        if (!open) setShown(false);
        return;
      }
      if (open) {
        controller.open(triggerRef.current);
        return;
      }
      let alive = true;
      controller.close().then((closed) => {
        if (closed && alive) setShown(false);
      });
      return () => {
        alive = false;
      };
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
    const dialog = (
      <dialog ref={ref} {...attributes} data-ok-runtime="off" style={merged} {...props}>
        {content}
      </dialog>
    );
    if (!swiping) return dialog;
    return (
      <>
        {dialog}
        <div data-ok-drawer-swipe-area="" aria-hidden="true" />
      </>
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
