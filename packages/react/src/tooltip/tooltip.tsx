"use client";

import {
  createHoverIntent,
  createPopoverController,
  type HoverIntent,
  type Placement,
  type PopoverController,
  type TooltipTransition,
  tooltipAttributes,
} from "@owlky/core";
import {
  cloneElement,
  type FocusEvent,
  type HTMLAttributes,
  isValidElement,
  type PointerEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { useMergedRefs } from "../utils/refs.js";

/** Arrow size in px (`--_ok-arrow-size` in tooltip.css: 10px). */
const TOOLTIP_ARROW = 10;

type TriggerProps = {
  ref?: Ref<HTMLElement>;
  onPointerEnter?: (event: PointerEvent<HTMLElement>) => void;
  onPointerLeave?: (event: PointerEvent<HTMLElement>) => void;
  onPointerDown?: (event: PointerEvent<HTMLElement>) => void;
  onPointerUp?: (event: PointerEvent<HTMLElement>) => void;
  onPointerCancel?: (event: PointerEvent<HTMLElement>) => void;
  onFocus?: (event: FocusEvent<HTMLElement>) => void;
  onBlur?: (event: FocusEvent<HTMLElement>) => void;
  "aria-describedby"?: string;
  "aria-labelledby"?: string;
};

export interface TooltipProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "title" | "children" | "popover"> {
  /** The text. An empty title renders no tooltip. */
  title: ReactNode;
  /** One element that takes focus and pointer events (a button, a link, a focusable span). */
  children: ReactElement;
  /** Default `"bottom"`. */
  placement?: Placement | undefined;
  /** Draws an arrow pointing at the trigger. */
  arrow?: boolean | undefined;
  /** Opening animation. Default `"grow"`. */
  transition?: TooltipTransition | undefined;
  /** Default 100 ms. */
  enterDelay?: number | undefined;
  /** Default 0 ms. */
  leaveDelay?: number | undefined;
  /** Default 700 ms (touch: a long press opens the tooltip). */
  enterTouchDelay?: number | undefined;
  /** Default 1500 ms. */
  leaveTouchDelay?: number | undefined;
  /** Controlled open state. */
  open?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  /**
   * The tooltip describes its trigger (`aria-describedby`) instead of naming it
   * (`aria-labelledby`, the default: use it for icon-only buttons).
   */
  describeChild?: boolean | undefined;
  disableHoverListener?: boolean | undefined;
  disableFocusListener?: boolean | undefined;
  disableTouchListener?: boolean | undefined;
}

/**
 * Tooltip — spec: specs/components/tooltip.md. Wraps one trigger element and renders a
 * `div[role=tooltip][popover=manual]` after it. Hover (with delays), keyboard focus and a touch
 * long press open it; Escape, blur and leaving close it. The tooltip itself is hoverable.
 */
export function Tooltip({
  title,
  children,
  placement,
  arrow,
  transition,
  enterDelay,
  leaveDelay,
  enterTouchDelay,
  leaveTouchDelay,
  open: controlledOpen,
  onOpenChange,
  describeChild,
  disableHoverListener,
  disableFocusListener,
  disableTouchListener,
  id: idProp,
  ...props
}: TooltipProps) {
  const generated = useId();
  const id = idProp ?? generated;
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const [internal, setInternal] = useState(false);
  const open = controlledOpen ?? internal;
  const changeRef = useRef(onOpenChange);
  changeRef.current = onOpenChange;
  const controlled = controlledOpen !== undefined;
  const controllerRef = useRef<PopoverController | null>(null);
  const intentRef = useRef<HoverIntent | null>(null);
  const empty = title == null || title === "" || title === false;

  const intentOptions = {
    enterDelay,
    leaveDelay,
    enterTouchDelay,
    leaveTouchDelay,
    onOpenChange: (next: boolean) => {
      if (!controlled) setInternal(next);
      changeRef.current?.(next);
    },
  };
  if (!intentRef.current) intentRef.current = createHoverIntent(intentOptions);
  intentRef.current.setOptions(intentOptions);
  const intent = intentRef.current;

  // biome-ignore lint/correctness/useExhaustiveDependencies: the tooltip element exists only with a title.
  useEffect(() => {
    const element = tooltipRef.current;
    if (!element) return;
    const controller = createPopoverController(element, {
      autoFocus: false,
      restoreFocus: false,
      closeOnOutside: false,
    });
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [empty]);

  useEffect(() => () => intentRef.current?.destroy(), []);

  useEffect(() => {
    controllerRef.current?.setOptions({
      placement,
      arrow: arrow ? TOOLTIP_ARROW : 0,
      offset: arrow ? 10 : 8,
      autoFocus: false,
      restoreFocus: false,
      closeOnOutside: false,
      onDismiss: () => intent.hide(),
    });
  });

  useEffect(() => {
    const controller = controllerRef.current;
    if (!controller) return;
    if (open && triggerRef.current) controller.open(triggerRef.current);
    else controller.close();
  }, [open]);

  const child = isValidElement(children) ? (children as ReactElement<TriggerProps>) : null;
  const childProps = (child?.props ?? {}) as TriggerProps;
  const mergedRef = useMergedRefs<HTMLElement>(triggerRef, childProps.ref);
  if (!child) return children;
  if (empty) return child;

  const chain =
    <E,>(own: ((event: E) => void) | undefined, theirs: ((event: E) => void) | undefined) =>
    (event: E) => {
      theirs?.(event);
      own?.(event);
    };
  const ids = (existing: string | undefined) => (existing ? `${existing} ${id}` : id);
  const relation = describeChild ? "aria-describedby" : "aria-labelledby";

  const trigger = cloneElement(child, {
    ref: mergedRef,
    [relation]: ids(childProps[relation]),
    onPointerEnter: chain(
      disableHoverListener
        ? undefined
        : (event: PointerEvent<HTMLElement>) => intent.enter(event.pointerType),
      childProps.onPointerEnter,
    ),
    onPointerLeave: chain(
      disableHoverListener ? undefined : () => intent.leave(),
      childProps.onPointerLeave,
    ),
    onPointerDown: chain(
      disableTouchListener
        ? undefined
        : (event: PointerEvent<HTMLElement>) => {
            if (event.pointerType === "touch") intent.touchStart();
          },
      childProps.onPointerDown,
    ),
    onPointerUp: chain(
      disableTouchListener ? undefined : () => intent.touchEnd(),
      childProps.onPointerUp,
    ),
    onPointerCancel: chain(
      disableTouchListener ? undefined : () => intent.touchEnd(),
      childProps.onPointerCancel,
    ),
    onFocus: chain(
      disableFocusListener
        ? undefined
        : (event: FocusEvent<HTMLElement>) => {
            if (event.currentTarget.matches(":focus-visible")) intent.focus();
          },
      childProps.onFocus,
    ),
    onBlur: chain(disableFocusListener ? undefined : () => intent.blur(), childProps.onBlur),
  } as TriggerProps);

  return (
    <>
      {trigger}
      <div
        ref={tooltipRef}
        id={id}
        role="tooltip"
        popover="manual"
        {...tooltipAttributes({ placement, arrow, transition, enterDelay, leaveDelay })}
        data-ok-runtime="off"
        onPointerEnter={() => intent.enterTooltip()}
        onPointerLeave={() => intent.leave()}
        {...props}
      >
        <span data-ok-tooltip-arrow="" aria-hidden="true" />
        {title}
      </div>
    </>
  );
}
