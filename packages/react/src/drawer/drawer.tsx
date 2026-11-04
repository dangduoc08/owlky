"use client";

import {
  createModalController,
  type DrawerAnchor,
  drawerAttributes,
  type ModalController,
} from "@minimal-tailwind/core";
import {
  type ComponentPropsWithoutRef,
  createContext,
  forwardRef,
  type MouseEvent,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { Button, type ButtonAsButtonProps } from "../button/button.js";
import { useMergedRefs } from "../utils/refs.js";
import { useControllableState } from "../utils/use-controllable-state.js";

interface DrawerContextValue {
  open: boolean;
  setOpen(open: boolean): void;
  /** Last trigger used, so focus returns to it even where clicks don't focus buttons (Safari). */
  triggerRef: { current: HTMLElement | null };
}

const DrawerContext = createContext<DrawerContextValue | null>(null);

function useDrawerContext(component: string): DrawerContextValue {
  const context = useContext(DrawerContext);
  if (!context) throw new Error(`[minimal-tailwind] <${component}> must be used inside <Drawer>.`);
  return context;
}

export interface DrawerProps {
  /** Controlled open state. */
  open?: boolean | undefined;
  /** Initial open state when uncontrolled. Default `false`. */
  defaultOpen?: boolean | undefined;
  /** Called whenever the drawer asks to open or close (trigger, close button, Escape, backdrop). */
  onOpenChange?: ((open: boolean) => void) | undefined;
  children?: ReactNode;
}

/** Drawer root — spec: specs/components/drawer.md. Provides state; renders no DOM. */
export function Drawer({ open, defaultOpen = false, onOpenChange, children }: DrawerProps) {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const triggerRef = useRef<HTMLElement | null>(null);
  const value = useMemo<DrawerContextValue>(
    () => ({ open: isOpen, setOpen, triggerRef }),
    [isOpen, setOpen],
  );
  return <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>;
}

/** A `Button` that opens the drawer. */
export const DrawerTrigger = forwardRef<HTMLButtonElement, ButtonAsButtonProps>(
  function DrawerTrigger({ onClick, ...props }, ref) {
    const context = useDrawerContext("DrawerTrigger");
    const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
      onClick?.(event);
      if (event.defaultPrevented) return;
      context.triggerRef.current = event.currentTarget;
      context.setOpen(true);
    };
    return <Button ref={ref} aria-haspopup="dialog" onClick={handleClick} {...props} />;
  },
);

export interface DrawerContentProps extends ComponentPropsWithoutRef<"dialog"> {
  /** Edge the drawer slides in from. Default `"left"`. */
  anchor?: DrawerAnchor | undefined;
  /** Default `true`. */
  closeOnEscape?: boolean | undefined;
  /** Default `true`. */
  closeOnBackdropClick?: boolean | undefined;
}

/**
 * The modal panel: `<dialog data-mt-drawer>` + the content paper. Always rendered (hidden while
 * closed), so its markup is SSR-safe and matches the HTML implementation. Name it with
 * `aria-label` or `aria-labelledby`.
 */
export const DrawerContent = forwardRef<HTMLDialogElement, DrawerContentProps>(
  function DrawerContent(
    { anchor, closeOnEscape = true, closeOnBackdropClick = true, children, ...props },
    forwardedRef,
  ) {
    const { open, setOpen, triggerRef } = useDrawerContext("DrawerContent");
    const elementRef = useRef<HTMLDialogElement>(null);
    const ref = useMergedRefs(elementRef, forwardedRef);
    const controllerRef = useRef<ModalController | null>(null);

    // Effects run in declaration order: create the controller, sync options, then open/close.
    useEffect(() => {
      const element = elementRef.current as HTMLDialogElement;
      const controller = createModalController(element, {
        contentSelector: "[data-mt-drawer-content]",
      });
      controllerRef.current = controller;
      return () => {
        controller.destroy();
        controllerRef.current = null;
      };
    }, []);

    useEffect(() => {
      controllerRef.current?.setOptions({
        contentSelector: "[data-mt-drawer-content]",
        closeOnEscape,
        closeOnBackdrop: closeOnBackdropClick,
        onDismiss: () => setOpen(false),
        onExternalClose: () => setOpen(false),
      });
    });

    useEffect(() => {
      const controller = controllerRef.current as ModalController;
      if (open) controller.open(triggerRef.current);
      else controller.close();
    }, [open, triggerRef]);

    return (
      <dialog ref={ref} {...drawerAttributes({ anchor })} data-mt-runtime="off" {...props}>
        <div data-mt-drawer-content="">{children}</div>
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
    if (!event.defaultPrevented) setOpen(false);
  };
  return <Button ref={ref} onClick={handleClick} {...props} />;
});
