"use client";

import {
  type AccordionVariant,
  accordionActionsAttributes,
  accordionAttributes,
  closeOtherDetails,
} from "@owlky/core";
import {
  type ComponentPropsWithoutRef,
  createContext,
  forwardRef,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
  useContext,
  useLayoutEffect,
  useReducer,
  useRef,
} from "react";
import { useMergedRefs } from "../utils/refs.js";
import { useControllableState } from "../utils/use-controllable-state.js";

interface AccordionContextValue {
  expanded: boolean;
  disabled: boolean;
  toggle(): void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

function useAccordionContext(component: string): AccordionContextValue {
  const context = useContext(AccordionContext);
  if (!context) throw new Error(`[owlky] <${component}> must be used inside <Accordion>.`);
  return context;
}

export interface AccordionProps
  extends Omit<ComponentPropsWithoutRef<"details">, "onChange" | "open" | "onToggle"> {
  /** Controlled open state. */
  expanded?: boolean | undefined;
  /** Initial open state when uncontrolled. Default `false`. */
  defaultExpanded?: boolean | undefined;
  /** Called with the requested open state (summary click, keyboard, find-in-page, exclusive group). */
  onChange?: ((expanded: boolean) => void) | undefined;
  /** Default `"default"`. */
  variant?: AccordionVariant | undefined;
  /** No margin around the open item. */
  disableGutters?: boolean | undefined;
  /** Can't be toggled; the summary leaves the tab order. */
  disabled?: boolean | undefined;
  /** Same name = one open at a time (native `<details name>`, with a fallback). */
  name?: string | undefined;
  children?: ReactNode;
}

/**
 * Accordion — spec: specs/components/accordion.md. A native `<details>`: opening, keyboard and
 * find-in-page work natively; React keeps the open state (controlled or uncontrolled).
 */
export const Accordion = forwardRef<HTMLDetailsElement, AccordionProps>(function Accordion(
  {
    expanded,
    defaultExpanded = false,
    onChange,
    variant,
    disableGutters,
    disabled = false,
    children,
    ...props
  },
  forwardedRef,
) {
  const elementRef = useRef<HTMLDetailsElement>(null);
  const ref = useMergedRefs(elementRef, forwardedRef);
  const [open, setOpen] = useControllableState({
    value: expanded,
    defaultValue: defaultExpanded,
    onChange,
  });

  const context: AccordionContextValue = {
    expanded: open,
    disabled,
    toggle: () => setOpen(!open),
  };

  // The browser can open or close the element by itself (find-in-page, an exclusive group):
  // report it, and close the other members where `<details name>` isn't supported. A refused
  // change (controlled owner, disabled) is reverted by the layout effect after the re-render.
  const [, rerender] = useReducer((count: number) => count + 1, 0);
  const handleToggle = (event: SyntheticEvent<HTMLDetailsElement>) => {
    const element = event.currentTarget;
    if (event.target !== element) return; // a nested accordion's toggle
    if (element.open) closeOtherDetails(element);
    if (element.open === open) return;
    if (!disabled) setOpen(element.open);
    rerender();
  };
  useLayoutEffect(() => {
    const element = elementRef.current;
    if (element && element.open !== open) element.open = open;
  });

  return (
    <details
      ref={ref}
      {...accordionAttributes({ variant, disableGutters, disabled })}
      data-ok-runtime="off"
      {...props}
      open={open}
      onToggle={handleToggle}
    >
      <AccordionContext.Provider value={context}>{children}</AccordionContext.Provider>
    </details>
  );
});

/** The default expand icon: a plus that becomes a minus (decorative). */
function PlusIcon() {
  return (
    <svg
      data-ok-accordion-plus=""
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

export interface AccordionSummaryProps extends ComponentPropsWithoutRef<"summary"> {
  /** Replaces the plus / minus; rotated 180° while open. `null` hides it. */
  expandIcon?: ReactNode;
}

/** The header: a native `<summary>`. Put a heading (`<h3>`) inside for the page outline. */
export const AccordionSummary = forwardRef<HTMLElement, AccordionSummaryProps>(
  function AccordionSummary({ expandIcon, onClick, children, ...props }, ref) {
    const { disabled, toggle } = useAccordionContext("AccordionSummary");
    const handleClick = (event: MouseEvent<HTMLElement>) => {
      onClick?.(event);
      const cancelled = event.defaultPrevented;
      // React owns the state: the native toggle is replaced by a state change (controlled refusal).
      event.preventDefault();
      if (!disabled && !cancelled) toggle();
    };
    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: <summary> is the native, interactive disclosure control.
      <summary
        ref={ref}
        data-ok-accordion-summary=""
        aria-disabled={disabled ? true : undefined}
        tabIndex={disabled ? -1 : undefined}
        {...props}
        onClick={handleClick}
      >
        {children}
        {expandIcon !== null && (
          <span data-ok-accordion-icon="" aria-hidden="true">
            {expandIcon ?? <PlusIcon />}
          </span>
        )}
      </summary>
    );
  },
);

/** The content. */
export const AccordionDetails = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<"div">>(
  function AccordionDetails(props, ref) {
    return <div ref={ref} data-ok-accordion-details="" {...props} />;
  },
);

export interface AccordionActionsProps extends ComponentPropsWithoutRef<"div"> {
  /** Removes the space between the actions. */
  disableSpacing?: boolean | undefined;
}

/** Buttons at the end of the content. */
export const AccordionActions = forwardRef<HTMLDivElement, AccordionActionsProps>(
  function AccordionActions({ disableSpacing, ...props }, ref) {
    return <div ref={ref} {...accordionActionsAttributes({ disableSpacing })} {...props} />;
  },
);
