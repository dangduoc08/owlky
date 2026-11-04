"use client";

import {
  createDialogController,
  type DialogController,
  type DialogSize,
  dialogAttributes,
} from "@minimal-tailwind/core";
import {
  type ComponentPropsWithoutRef,
  createContext,
  forwardRef,
  type MouseEvent,
  type ReactNode,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button, type ButtonProps } from "../button/button.js";
import { useMergedRefs } from "../utils/refs.js";
import { useControllableState } from "../utils/use-controllable-state.js";
import { useIsomorphicLayoutEffect } from "../utils/use-isomorphic-layout-effect.js";

interface DialogContextValue {
  open: boolean;
  setOpen(open: boolean): void;
  titleId: string;
  descriptionId: string;
  hasTitle: boolean;
  hasDescription: boolean;
  setHasTitle(value: boolean): void;
  setHasDescription(value: boolean): void;
  /** Last trigger used, so focus returns to it even where clicks don't focus buttons (Safari). */
  triggerRef: { current: HTMLElement | null };
}

const DialogContext = createContext<DialogContextValue | null>(null);

function useDialogContext(component: string): DialogContextValue {
  const context = useContext(DialogContext);
  if (!context) throw new Error(`[minimal-tailwind] <${component}> must be used inside <Dialog>.`);
  return context;
}

export interface DialogProps {
  /** Controlled open state. */
  open?: boolean | undefined;
  /** Initial open state when uncontrolled. Default `false`. */
  defaultOpen?: boolean | undefined;
  /** Called whenever the dialog asks to open or close (trigger, close button, Escape, backdrop). */
  onOpenChange?: ((open: boolean) => void) | undefined;
  children?: ReactNode;
}

/** Dialog root — spec: specs/components/dialog.md. Provides state; renders no DOM. */
export function Dialog({ open, defaultOpen = false, onOpenChange, children }: DialogProps) {
  const [isOpen, setOpen] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const [hasTitle, setHasTitle] = useState(false);
  const [hasDescription, setHasDescription] = useState(false);
  const id = useId();
  const triggerRef = useRef<HTMLElement | null>(null);

  const value = useMemo<DialogContextValue>(
    () => ({
      open: isOpen,
      setOpen,
      titleId: `${id}-title`,
      descriptionId: `${id}-description`,
      hasTitle,
      hasDescription,
      setHasTitle,
      setHasDescription,
      triggerRef,
    }),
    [isOpen, setOpen, id, hasTitle, hasDescription],
  );
  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>;
}

/** A `Button` that opens the dialog. */
export const DialogTrigger = forwardRef<HTMLButtonElement, ButtonProps>(function DialogTrigger(
  { onClick, ...props },
  ref,
) {
  const context = useDialogContext("DialogTrigger");
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    context.triggerRef.current = event.currentTarget;
    context.setOpen(true);
  };
  return <Button ref={ref} aria-haspopup="dialog" onClick={handleClick} {...props} />;
});

export interface DialogContentProps extends ComponentPropsWithoutRef<"dialog"> {
  /** Maximum width. Default `"sm"` (600px). */
  size?: DialogSize | undefined;
  /** Default `true`. */
  closeOnEscape?: boolean | undefined;
  /** Default `true`. */
  closeOnBackdropClick?: boolean | undefined;
}

/**
 * The modal itself: `<dialog data-mt-dialog>` + the content paper. Always rendered (hidden while
 * closed), so its markup is SSR-safe and matches the HTML implementation.
 */
export const DialogContent = forwardRef<HTMLDialogElement, DialogContentProps>(
  function DialogContent(
    { size, closeOnEscape = true, closeOnBackdropClick = true, children, ...props },
    forwardedRef,
  ) {
    const context = useDialogContext("DialogContent");
    const elementRef = useRef<HTMLDialogElement>(null);
    const ref = useMergedRefs(elementRef, forwardedRef);
    const controllerRef = useRef<DialogController | null>(null);

    useIsomorphicLayoutEffect(() => {
      const element = elementRef.current;
      if (!element) return;
      const controller = createDialogController(element);
      controllerRef.current = controller;
      return () => {
        controller.destroy();
        controllerRef.current = null;
      };
    }, []);

    const { setOpen, open, triggerRef } = context;
    useIsomorphicLayoutEffect(() => {
      controllerRef.current?.setOptions({
        closeOnEscape,
        closeOnBackdrop: closeOnBackdropClick,
        onDismiss: () => setOpen(false),
        onExternalClose: () => setOpen(false),
      });
    });

    useEffect(() => {
      const controller = controllerRef.current;
      if (!controller) return;
      if (open) controller.open(triggerRef.current);
      else controller.close();
    }, [open, triggerRef]);

    return (
      <dialog
        ref={ref}
        {...dialogAttributes({ size })}
        data-mt-runtime="off"
        aria-labelledby={context.hasTitle ? context.titleId : undefined}
        aria-describedby={context.hasDescription ? context.descriptionId : undefined}
        {...props}
      >
        <div data-mt-dialog-content="">{children}</div>
      </dialog>
    );
  },
);

export interface DialogTitleProps extends ComponentPropsWithoutRef<"h2"> {}

/** The accessible name of the dialog (`aria-labelledby`). */
export const DialogTitle = forwardRef<HTMLHeadingElement, DialogTitleProps>(
  function DialogTitle(props, ref) {
    const { titleId, setHasTitle } = useDialogContext("DialogTitle");
    useIsomorphicLayoutEffect(() => {
      setHasTitle(true);
      return () => setHasTitle(false);
    }, [setHasTitle]);
    return <h2 ref={ref} id={titleId} data-mt-dialog-title="" {...props} />;
  },
);

export interface DialogDescriptionProps extends ComponentPropsWithoutRef<"p"> {}

/** Supporting text announced with the dialog (`aria-describedby`). */
export const DialogDescription = forwardRef<HTMLParagraphElement, DialogDescriptionProps>(
  function DialogDescription(props, ref) {
    const { descriptionId, setHasDescription } = useDialogContext("DialogDescription");
    useIsomorphicLayoutEffect(() => {
      setHasDescription(true);
      return () => setHasDescription(false);
    }, [setHasDescription]);
    return <p ref={ref} id={descriptionId} {...props} />;
  },
);

export interface DialogBodyProps extends ComponentPropsWithoutRef<"div"> {}

/** Scrollable main content. */
export const DialogBody = forwardRef<HTMLDivElement, DialogBodyProps>(
  function DialogBody(props, ref) {
    return <div ref={ref} data-mt-dialog-body="" {...props} />;
  },
);

export interface DialogActionsProps extends ComponentPropsWithoutRef<"div"> {}

/** Footer with the dialog's buttons, aligned to the end. */
export const DialogActions = forwardRef<HTMLDivElement, DialogActionsProps>(
  function DialogActions(props, ref) {
    return <div ref={ref} data-mt-dialog-actions="" {...props} />;
  },
);

/** A `Button` that closes the dialog. */
export const DialogClose = forwardRef<HTMLButtonElement, ButtonProps>(function DialogClose(
  { onClick, ...props },
  ref,
) {
  const { setOpen } = useDialogContext("DialogClose");
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented) setOpen(false);
  };
  return <Button ref={ref} onClick={handleClick} {...props} />;
});
