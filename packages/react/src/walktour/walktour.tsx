"use client";

import {
  createWalktourController,
  createWalktourFlow,
  defaultWalktourLocale,
  formatWalktour,
  initialWalktourState,
  type Placement,
  type WalktourAction,
  type WalktourAnatomyOptions,
  type WalktourApi,
  type WalktourBeaconTrigger,
  type WalktourCloseButtonAction,
  type WalktourController,
  type WalktourEventData,
  type WalktourEventType,
  type WalktourFlow,
  type WalktourLifecycle,
  type WalktourLocale,
  type WalktourOrigin,
  type WalktourPlacement,
  type WalktourState,
  type WalktourStatus,
  type WalktourStepOverride,
  walktourAttributes,
  walktourStepAttributes,
  walktourStepOverrides,
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
  /** This step's distance between the spotlight and the tooltip (px). Default: the tour's `offset`. */
  offset?: number | undefined;
  /** A unique identifier of the step, passed in events and hooks as `step.id`. */
  id?: string | undefined;
  /** Your data for the step, passed in events and hooks as `step.data`. */
  data?: unknown;
  /** This step's texts. */
  locale?: Partial<WalktourLocale> | undefined;
  /** Attributes for the step's element (for example `data-ok-theme="dark"` or a `className`). */
  stepProps?: HTMLAttributes<HTMLDivElement> | undefined;
  /** Scroll to this element instead of the target (the tooltip and the spotlight stay on the target). */
  scrollTarget?: WalktourTarget | undefined;
  /** Put this element in the spotlight instead of the target (the tooltip stays on the target). */
  spotlightTarget?: WalktourTarget | undefined;
  /** The target doesn't move when the page scrolls: don't scroll to it. Found on its own for fixed elements. */
  isFixed?: boolean | undefined;
  /** Side and alignment of the beacon. Default: `placement`. */
  beaconPlacement?: Placement | undefined;
  /** What opens this step from its beacon. Default: the tour's `beaconTrigger`. */
  beaconTrigger?: WalktourBeaconTrigger | undefined;
  /** What this step's close button does. Default: the tour's `closeButtonAction`. */
  closeButtonAction?: WalktourCloseButtonAction | undefined;
  /** This step's scroll duration (ms). Default: the tour's `scrollDuration`. */
  scrollDuration?: number | undefined;
  /** How long this step waits for its target (ms). Default: the tour's `targetWaitTimeout`. */
  targetWaitTimeout?: number | undefined;
  /** How long the tour waits for this step's `before` (ms). Default: the tour's `beforeTimeout`. */
  beforeTimeout?: number | undefined;
  /** Runs before the step shows; the tour waits for a returned promise. Replaces the tour's `before`. */
  before?: ((data: WalktourEventData) => Promise<unknown> | void) | undefined;
  /** Runs after the step ended (not awaited). Replaces the tour's `after`. */
  after?: ((data: WalktourEventData) => void) | undefined;
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
  /**
   * Runs before each step shows (react-joyride's `before`), for example to open a menu the
   * target is in. The tour waits for a returned promise, up to `beforeTimeout`.
   */
  before?: ((data: WalktourEventData) => Promise<unknown> | void) | undefined;
  /** Runs after each step ended (react-joyride's `after`), for example to close that menu. Not awaited. */
  after?: ((data: WalktourEventData) => void) | undefined;
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
    offset,
    scrollOffset,
    scrollDuration,
    beaconTrigger,
    closeButtonAction,
    disableFocusTrap,
    targetWaitTimeout,
    beforeTimeout,
    before,
    after,
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
  const latest = useRef({
    current,
    steps,
    onStepChange,
    onStatusChange,
    onEvent,
    controlled,
    before,
    after,
  });
  latest.current = {
    current,
    steps,
    onStepChange,
    onStatusChange,
    onEvent,
    controlled,
    before,
    after,
  };

  const flowRef = useRef<WalktourFlow | null>(null);
  flowRef.current ??= createWalktourFlow({
    state: () => latest.current.current,
    // Always set: the layout effect creates it before any effect or the API can dispatch.
    context: () => (controllerRef.current as WalktourController).context(),
    commit(next, from, { action, origin, external }) {
      const { onStepChange, onStatusChange, controlled } = latest.current;
      setState(next);
      if (external) {
        latest.current.current = next;
        return;
      }
      latest.current.current = controlled ? { ...next, index: from.index } : next;
      if (next.index !== from.index)
        onStepChange?.(next.index, {
          action,
          origin,
          status: next.status,
          lifecycle: next.lifecycle,
        });
      if (next.status !== from.status) onStatusChange?.(next.status, { action, index: next.index });
    },
    wait(next) {
      latest.current.current = next;
      setState(next);
    },
    emit: (event) => latest.current.onEvent?.(event.type, event),
    step(index) {
      const step = latest.current.steps[index];
      if (!step || (step.id === undefined && step.data === undefined)) return undefined;
      return { id: step.id, data: step.data };
    },
    before(data) {
      const step = latest.current.steps[data.index];
      return (step?.before ?? latest.current.before)?.(data);
    },
    after(data) {
      const step = latest.current.steps[data.index];
      const hook = step?.after ?? latest.current.after;
      if (!hook) return false;
      try {
        hook(data);
      } catch {
        // Not awaited, never breaks the tour (react-joyride).
      }
      return true;
    },
  });
  const flow = flowRef.current;
  const dispatch = flow.dispatch;

  useLayoutEffect(() => {
    const controller = createWalktourController(rootRef.current as HTMLDivElement, {
      onIntent: (intent, origin) => dispatch(intent, origin),
      // The controller asks only for steps it renders (one element per step).
      resolveTarget: (_, index, kind) => {
        const step = latest.current.steps[index] as WalktourStep;
        if (kind === "target") return resolveTarget(step.target);
        const other = kind === "scroll" ? step.scrollTarget : step.spotlightTarget;
        return other === undefined ? null : resolveTarget(other);
      },
    });
    controllerRef.current = controller;
    return () => {
      flow.cancel();
      controller.destroy();
      controllerRef.current = null;
    };
  }, [dispatch, flow]);

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
    if (!dispatch("go", "api", stepIndex, { from: state, external: true }))
      setState({ ...state, index: stepIndex });
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
        offset,
        scrollOffset,
        scrollDuration,
        beaconTrigger,
        closeButtonAction,
        disableFocusTrap,
        targetWaitTimeout,
        beforeTimeout,
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
            data-ok-paper=""
            data-ok-arrow=""
            {...walktourStepAttributes({
              ...overrides,
              placement: step.placement,
              spotlightPadding: step.spotlightPadding,
              width: step.width,
              offset: step.offset,
              id: step.id,
              beaconPlacement: step.beaconPlacement,
              isFixed: step.isFixed,
              beaconTrigger: step.beaconTrigger,
              closeButtonAction: step.closeButtonAction,
              scrollDuration: step.scrollDuration,
              targetWaitTimeout: step.targetWaitTimeout,
              beforeTimeout: step.beforeTimeout,
              target: typeof step.target === "string" ? step.target : undefined,
              scrollTarget: typeof step.scrollTarget === "string" ? step.scrollTarget : undefined,
              spotlightTarget:
                typeof step.spotlightTarget === "string" ? step.spotlightTarget : undefined,
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
