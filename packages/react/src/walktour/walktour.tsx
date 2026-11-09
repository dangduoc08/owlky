"use client";

import {
  createWalktourController,
  defaultWalktourLocale,
  formatWalktour,
  initialWalktourState,
  type WalktourAction,
  type WalktourAnatomyOptions,
  type WalktourApi,
  type WalktourController,
  type WalktourEventData,
  type WalktourEventType,
  type WalktourLifecycle,
  type WalktourLocale,
  type WalktourOrigin,
  type WalktourPlacement,
  type WalktourState,
  type WalktourStatus,
  type WalktourStepOverride,
  walktourAttributes,
  walktourEvents,
  walktourStepAttributes,
  walktourStepOverrides,
  walktourTransition,
} from "@owlky/core";
import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  type RefObject,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Backdrop } from "../backdrop/backdrop.js";
import { Button } from "../button/button.js";
import { IconButton } from "../icon-button/icon-button.js";
import { LinearProgress } from "../linear-progress/linear-progress.js";
import { useMergedRefs } from "../utils/refs.js";

/** A CSS selector, an element, a ref, or a function returning the element (read when shown). */
export type WalktourTarget =
  | string
  | Element
  | null
  | RefObject<Element | null>
  | (() => Element | null | undefined);

/** One step of the tour (react-joyride's `Step`). */
export interface WalktourStep extends Partial<Record<WalktourStepOverride, boolean>> {
  /** The element the step points at. `"body"` (or placement `center`) centers the step. */
  target: WalktourTarget;
  /** The tooltip's body. */
  content: ReactNode;
  /** The tooltip's title (also its accessible name). */
  title?: ReactNode;
  /** Side of the target, `auto` or `center`. Default `"bottom"`. */
  placement?: WalktourPlacement | undefined;
  /** This step's spotlight padding (px). */
  spotlightPadding?: number | undefined;
  /** Tooltip width (px). Default 360. */
  width?: number | undefined;
  /** This step's texts. */
  locale?: Partial<WalktourLocale> | undefined;
  /** Attributes for the step's element (for example `data-ok-theme="dark"` or a `className`). */
  stepProps?: HTMLAttributes<HTMLDivElement> | undefined;
}

export interface WalktourChangeDetails {
  action: WalktourAction;
  origin: WalktourOrigin;
  status: WalktourStatus;
  lifecycle: WalktourLifecycle;
}

export interface WalktourProps
  extends WalktourAnatomyOptions,
    Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** The tour's steps. */
  steps: readonly WalktourStep[];
  /** Runs the tour: `true` starts (or resumes) it, `false` pauses it. Default `false`. */
  run?: boolean | undefined;
  /** Controlled current step: change it from `onStepChange`. */
  stepIndex?: number | undefined;
  /** The first step of an uncontrolled tour. Default 0. */
  initialStepIndex?: number | undefined;
  /** Button, beacon and live-region texts. */
  locale?: Partial<WalktourLocale> | undefined;
  /** The step changed (or, controlled, should change) to `index`. */
  onStepChange?: ((index: number, details: WalktourChangeDetails) => void) | undefined;
  /** The tour started, paused, finished or was skipped. */
  onStatusChange?:
    | ((status: WalktourStatus, details: { action: WalktourAction; index: number }) => void)
    | undefined;
  /** Every tour event, in order (react-joyride's `callback`). */
  onEvent?: ((type: WalktourEventType, data: WalktourEventData) => void) | undefined;
  /** Receives the tour's API: `start`, `stop`, `reset`, `next`, `prev`, `go`, `skip`… */
  apiRef?: RefObject<WalktourApi | null> | undefined;
}

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
    <path
      fill="currentColor"
      d="m12 13.41 5.66 5.66a1 1 0 0 0 1.41-1.41L13.41 12l5.66-5.66a1 1 0 0 0-1.41-1.41L12 10.59 6.34 4.93a1 1 0 0 0-1.41 1.41L10.59 12l-5.66 5.66a1 1 0 1 0 1.41 1.41z"
    />
  </svg>
);

function resolveTarget(target: WalktourTarget): Element | null | undefined {
  if (typeof target === "string") return undefined;
  if (typeof target === "function") return target() ?? null;
  if (target && "current" in target) return target.current;
  return target;
}

/**
 * Walktour — spec: specs/components/walktour.md (ADR-0039). A guided tour: each step is a dialog
 * next to its target (a Popover), over an overlay with a spotlight cut-out around the target (a
 * Backdrop), or a beacon to open it. The core walktour controller renders the state this component
 * keeps; `run` starts it, `stepIndex` + `onStepChange` control the step.
 */
export const Walktour = forwardRef<HTMLDivElement, WalktourProps>(function Walktour(
  {
    steps,
    run = false,
    stepIndex,
    initialStepIndex = 0,
    locale: localeProp,
    onStepChange,
    onStatusChange,
    onEvent,
    apiRef,
    continuous,
    showProgress,
    showSkipButton,
    hideBackButton,
    hideCloseButton,
    disableBeacon,
    disableCloseOnEsc,
    disableOverlay,
    disableOverlayClose,
    spotlightClicks,
    disableScrolling,
    scrollToFirstStep,
    spotlightPadding,
    spotlightRadius,
    scrollOffset,
    id: idProp,
    ...props
  },
  forwardedRef,
) {
  const rootRef = useRef<HTMLDivElement>(null);
  const ref = useMergedRefs(rootRef, forwardedRef);
  const controllerRef = useRef<WalktourController | null>(null);
  const reactId = useId();
  const baseId = idProp ?? reactId;
  const locale = { ...defaultWalktourLocale, ...localeProp };
  const controlled = stepIndex !== undefined;
  const [state, setState] = useState<WalktourState>(() =>
    initialWalktourState(stepIndex ?? initialStepIndex),
  );
  const current: WalktourState = controlled ? { ...state, index: stepIndex } : state;

  // The latest values for the controller's callbacks and the API.
  const latest = useRef({ current, steps, onStepChange, onStatusChange, onEvent, controlled });
  latest.current = { current, steps, onStepChange, onStatusChange, onEvent, controlled };

  const dispatch = useRef(
    (action: WalktourAction, origin: WalktourOrigin = "api", index?: number) => {
      // Always set: the layout effect creates it before any effect or the API can dispatch.
      const controller = controllerRef.current as WalktourController;
      const { current: from, onStepChange, onStatusChange, onEvent } = latest.current;
      const context = controller.context();
      const { state: next, notFound } = walktourTransition(from, action, context, {
        index,
        origin,
      });
      if (next === from) return;
      latest.current.current = latest.current.controlled ? { ...next, index: from.index } : next;
      setState(next);
      if (next.index !== from.index)
        onStepChange?.(next.index, {
          action,
          origin,
          status: next.status,
          lifecycle: next.lifecycle,
        });
      if (next.status !== from.status) onStatusChange?.(next.status, { action, index: next.index });
      for (const event of walktourEvents(from, next, context.size, notFound))
        onEvent?.(event.type, event);
    },
  ).current;

  useLayoutEffect(() => {
    const controller = createWalktourController(rootRef.current as HTMLDivElement, {
      onIntent: (intent, origin) => dispatch(intent, origin),
      // The controller asks only for steps it renders (one element per step).
      resolveTarget: (_, index) =>
        resolveTarget((latest.current.steps[index] as WalktourStep).target),
    });
    controllerRef.current = controller;
    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, [dispatch]);

  // `run` starts and pauses the tour.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when `run` changes.
  useEffect(() => {
    if (run) dispatch("start", "api", latest.current.controlled ? stepIndex : undefined);
    else dispatch("stop");
  }, [run, dispatch]);

  // A controlled step changed from outside: show it.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when `stepIndex` changes.
  useEffect(() => {
    if (stepIndex === undefined || stepIndex === state.index) return;
    if (state.status !== "running") {
      setState((previous) => ({ ...previous, index: stepIndex }));
      return;
    }
    const controller = controllerRef.current as WalktourController;
    const context = controller.context();
    const from = { ...state, index: state.index };
    const { state: next, notFound } = walktourTransition(from, "go", context, {
      index: stepIndex,
    });
    setState(next === from ? { ...state, index: stepIndex } : next);
    for (const event of walktourEvents(from, next, context.size, notFound))
      latest.current.onEvent?.(event.type, event);
  }, [stepIndex]);

  // Render the state (after React has written the steps).
  useEffect(() => {
    controllerRef.current?.render(current);
  });

  useLayoutEffect(() => {
    if (!apiRef) return;
    const api: WalktourApi = {
      get state() {
        return latest.current.current;
      },
      start: (index) => dispatch("start", "api", index),
      stop: () => dispatch("stop"),
      reset: (restart) => {
        dispatch("reset");
        if (restart) dispatch("start", "api", 0);
      },
      next: () => dispatch("next"),
      prev: () => dispatch("prev"),
      go: (index) => dispatch("go", "api", index),
      close: () => dispatch("close"),
      skip: () => dispatch("skip"),
      open: () => dispatch("open"),
    };
    (apiRef as { current: WalktourApi | null }).current = api;
    return () => {
      (apiRef as { current: WalktourApi | null }).current = null;
    };
  }, [apiRef, dispatch]);

  const size = steps.length;
  const tourContinuous = continuous === true;

  return (
    <div
      ref={ref}
      id={idProp}
      {...walktourAttributes({
        continuous,
        showProgress,
        showSkipButton,
        hideBackButton,
        hideCloseButton,
        disableBeacon,
        disableCloseOnEsc,
        disableOverlay,
        disableOverlayClose,
        spotlightClicks,
        disableScrolling,
        scrollToFirstStep,
        spotlightPadding,
        spotlightRadius,
        scrollOffset,
      })}
      {...(run ? { "data-ok-run": "" } : {})}
      data-ok-runtime="off"
      {...props}
    >
      <Backdrop
        open={false}
        invisible
        data-ok-walktour-overlay=""
        popover="manual"
        aria-hidden="true"
      >
        <svg data-ok-walktour-spotlight="" aria-hidden="true" focusable="false">
          <path data-ok-walktour-mask="" fillRule="evenodd" />
          <path data-ok-walktour-hole="" />
        </svg>
      </Backdrop>
      <button
        type="button"
        data-ok-walktour-beacon=""
        aria-label={locale.open}
        aria-haspopup="dialog"
        hidden
      >
        <span data-ok-walktour-beacon-inner="" />
      </button>
      {steps.map((step, index) => {
        const text = { ...locale, ...step.locale };
        const last = index === size - 1;
        const stepContinuous = step.continuous ?? tourContinuous;
        const titleId = `${baseId}-step-${index + 1}-title`;
        const contentId = `${baseId}-step-${index + 1}-content`;
        const overrides = Object.fromEntries(walktourStepOverrides.map((key) => [key, step[key]]));
        return (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: steps are positional.
            key={index}
            popover="manual"
            data-ok-popover=""
            data-ok-arrow=""
            {...walktourStepAttributes({
              ...overrides,
              placement: step.placement,
              spotlightPadding: step.spotlightPadding,
              width: step.width,
              target: typeof step.target === "string" ? step.target : undefined,
            })}
            role="dialog"
            {...(step.title !== undefined
              ? { "aria-labelledby": titleId }
              : { "aria-label": formatWalktour(text.stepOf, index, size) })}
            aria-describedby={contentId}
            {...step.stepProps}
          >
            <span data-ok-popover-arrow="" aria-hidden="true" />
            <div data-ok-walktour-header="">
              {step.title !== undefined && (
                <h2 data-ok-walktour-title="" id={titleId}>
                  {step.title}
                </h2>
              )}
              <IconButton size="sm" data-ok-walktour-action="close" aria-label={text.close}>
                <CloseIcon />
              </IconButton>
            </div>
            <div data-ok-walktour-content="" id={contentId}>
              {step.content}
            </div>
            <LinearProgress
              variant="determinate"
              value={Math.round(((index + 1) / size) * 100)}
              aria-hidden="true"
            />
            <div data-ok-walktour-footer="">
              <Button variant="text" data-ok-walktour-action="skip">
                {text.skip}
              </Button>
              <Button variant="outlined" data-ok-walktour-action="back">
                {text.back}
              </Button>
              <Button
                variant="contained"
                color={last ? "primary" : "inherit"}
                data-ok-walktour-action="primary"
              >
                {last ? text.last : stepContinuous ? text.next : text.close}
                {!last && (
                  <span data-ok-walktour-progress="">
                    {` ${formatWalktour(text.progress, index, size)}`}
                  </span>
                )}
              </Button>
            </div>
          </div>
        );
      })}
      <span
        data-ok-walktour-live=""
        aria-live="polite"
        aria-atomic="true"
        data-ok-format={locale.stepOf}
      />
    </div>
  );
});
