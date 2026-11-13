"use client";

import {
  checkLinear,
  dangerLinear,
  type MobileStepperPosition,
  type MobileStepperVariant,
  mobileStepperAttributes,
  mobileStepperProgress,
  mobileStepperText,
  type Orientation,
  type StepperVariant,
  stepAttributes,
  stepLabelAttributes,
  stepperAttributes,
  stepState,
} from "@owlky/core";
import {
  type ButtonHTMLAttributes,
  Children,
  cloneElement,
  createContext,
  forwardRef,
  type HTMLAttributes,
  isValidElement,
  type ReactNode,
  useContext,
} from "react";
import { Collapse } from "../collapse/collapse.js";
import { LinearProgress } from "../linear-progress/linear-progress.js";
import { Icon } from "../utils/icon.js";

interface StepperContextValue {
  activeStep: number;
  connector: ReactNode;
  nonLinear: boolean;
}

interface StepContextValue {
  index: number;
  active: boolean;
  completed: boolean;
  disabled: boolean;
  expanded: boolean;
}

const StepperContext = createContext<StepperContextValue>({
  activeStep: 0,
  connector: null,
  nonLinear: false,
});
const StepContext = createContext<StepContextValue>({
  index: 0,
  active: false,
  completed: false,
  disabled: false,
  expanded: false,
});

export interface StepperProps extends HTMLAttributes<HTMLOListElement> {
  /** Index of the current step (0-based). Earlier steps are completed. Default 0. */
  activeStep?: number | undefined;
  /** Default `"horizontal"`. */
  orientation?: Orientation | undefined;
  /** Horizontal: labels below the icons; the steps share the width. */
  alternativeLabel?: boolean | undefined;
  /** `"standard"` (default) numbered icons, `"dot"` small dots, `"circle"` large icon circles. */
  variant?: StepperVariant | undefined;
  /** The line between steps. Default `<StepConnector />`; `null` draws none. */
  connector?: ReactNode;
  /**
   * Steps can be visited in any order (with `StepButton`): only the active step is derived;
   * set `completed` and `disabled` on the steps yourself.
   */
  nonLinear?: boolean | undefined;
  /** `Step` elements. */
  children?: ReactNode;
}

/**
 * Stepper — spec: specs/components/stepper.md. An ordered list of steps; each `Step` gets its
 * index and its state (active, completed, not reached) from `activeStep`. The app owns
 * `activeStep` (Back / Next buttons).
 */
export const Stepper = forwardRef<HTMLOListElement, StepperProps>(function Stepper(
  {
    activeStep = 0,
    orientation,
    alternativeLabel,
    variant,
    connector = <StepConnector />,
    nonLinear,
    children,
    ...props
  },
  ref,
) {
  let index = 0;
  const steps = Children.map(children, (child) =>
    isValidElement<StepProps>(child) ? cloneElement(child, { index: index++ }) : child,
  );
  return (
    <ol
      ref={ref}
      {...stepperAttributes({ orientation, alternativeLabel, variant, activeStep, nonLinear })}
      {...props}
    >
      <StepperContext.Provider value={{ activeStep, connector, nonLinear: nonLinear === true }}>
        {steps}
      </StepperContext.Provider>
    </ol>
  );
});

export interface StepProps extends HTMLAttributes<HTMLLIElement> {
  /** Set by the `Stepper` (its position). */
  index?: number | undefined;
  /** Overrides the state the stepper computes: the current step. */
  active?: boolean | undefined;
  /** Overrides the state the stepper computes: done (a check icon). */
  completed?: boolean | undefined;
  /** Overrides the state the stepper computes: not reachable (dimmed; its `StepButton` is disabled). */
  disabled?: boolean | undefined;
  /** Vertical steppers: the step's `StepContent` stays shown, also when it isn't active. */
  expanded?: boolean | undefined;
  /** The last step (no line below its content), when it isn't the list's last element. */
  last?: boolean | undefined;
  /** `StepLabel` and, in a vertical stepper, `StepContent`. */
  children?: ReactNode;
}

/** Step — spec: specs/components/stepper.md. One `li` of a `Stepper`. */
export const Step = forwardRef<HTMLLIElement, StepProps>(function Step(
  { index = 0, active, completed, disabled, expanded, last, children, ...props },
  ref,
) {
  const stepper = useContext(StepperContext);
  const state = stepState(
    index,
    stepper.activeStep,
    { active, completed, disabled },
    stepper.nonLinear,
  );
  return (
    <li
      ref={ref}
      {...stepAttributes({ ...state, expanded, last })}
      aria-current={state.active ? "step" : undefined}
      {...props}
    >
      {index > 0 && stepper.connector}
      <StepContext.Provider value={{ index, ...state, expanded: expanded === true }}>
        {children}
      </StepContext.Provider>
    </li>
  );
});

function CheckIcon() {
  return <Icon icon={checkLinear} data-ok-step-icon-check="" />;
}

function ErrorIcon() {
  return <Icon icon={dangerLinear} data-ok-step-icon-error="" />;
}

export interface StepLabelProps extends HTMLAttributes<HTMLSpanElement> {
  /** The step failed: error color and icon. */
  error?: boolean | undefined;
  /** A second line, such as "Optional". */
  optional?: ReactNode;
  /** Replaces the step number: a number or text, or any node (a decorative `svg`). */
  icon?: ReactNode;
  /** The step's title. */
  children?: ReactNode;
}

/** StepLabel — spec: specs/components/stepper.md. The icon and the title of a step. */
export const StepLabel = forwardRef<HTMLSpanElement, StepLabelProps>(function StepLabel(
  { error, optional, icon, children, ...props },
  ref,
) {
  const step = useContext(StepContext);
  const custom = icon != null && typeof icon !== "string" && typeof icon !== "number";
  return (
    <span ref={ref} {...stepLabelAttributes({ error })} {...props}>
      <span data-ok-step-icon="" {...(custom ? { "data-ok-custom": "" } : {})} aria-hidden="true">
        {custom ? (
          icon
        ) : (
          <>
            <span data-ok-step-icon-text="">{icon ?? step.index + 1}</span>
            <CheckIcon />
            <ErrorIcon />
          </>
        )}
      </span>
      <span data-ok-step-label-text="">
        <span data-ok-step-label-title="">{children}</span>
        {optional != null && <span data-ok-step-label-optional="">{optional}</span>}
      </span>
    </span>
  );
});

/** StepConnector — spec: specs/components/stepper.md. The line drawn before a step. */
export function StepConnector() {
  return (
    <div data-ok-step-connector="" aria-hidden="true">
      <span data-ok-step-connector-line="" />
    </div>
  );
}

export interface StepContentProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Length of the open and close animation: ms, or `"auto"` (default: from the height, as MUI).
   * The Collapse's `timeout`.
   */
  transitionDuration?: number | "auto" | undefined;
}

/**
 * StepContent — spec: specs/components/stepper.md. Vertical steppers: what the active (or
 * `expanded`) step shows below its label. A Collapse: `hidden` on the other steps.
 */
export const StepContent = forwardRef<HTMLDivElement, StepContentProps>(function StepContent(
  { transitionDuration = "auto", ...props },
  ref,
) {
  const step = useContext(StepContext);
  return (
    <Collapse
      ref={ref}
      in={step.active || step.expanded}
      timeout={transitionDuration}
      data-ok-step-content=""
      {...props}
    />
  );
});

export interface StepButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Replaces the step number: a number or text, or any node (a decorative `svg`). */
  icon?: ReactNode;
  /** A second line, such as "Optional". */
  optional?: ReactNode;
  /** The step's title. */
  children?: ReactNode;
}

/**
 * StepButton — spec: specs/components/stepper.md. A step's label as a button, to move to that
 * step in a `nonLinear` stepper (set `activeStep` in `onClick`). Disabled with its step.
 */
export const StepButton = forwardRef<HTMLButtonElement, StepButtonProps>(function StepButton(
  { icon, optional, children, ...props },
  ref,
) {
  const step = useContext(StepContext);
  return (
    <button ref={ref} type="button" data-ok-step-button="" disabled={step.disabled} {...props}>
      <StepLabel icon={icon} optional={optional}>
        {children}
      </StepLabel>
    </button>
  );
});

export interface MobileStepperProps extends HTMLAttributes<HTMLDivElement> {
  /** Number of steps. */
  steps: number;
  /** Index of the current step (0-based). Default 0. */
  activeStep?: number | undefined;
  /** `"dots"` (default), `"text"` ("2 / 3") or a `"progress"` bar. */
  variant?: MobileStepperVariant | undefined;
  /** `"bottom"` (default) / `"top"`: fixed to the viewport edge; `"static"`: in the flow. */
  position?: MobileStepperPosition | undefined;
  /** The Back control (a `Button`). */
  backButton?: ReactNode;
  /** The Next control (a `Button`). */
  nextButton?: ReactNode;
  /** Accessible name of the dots and the progress bar. Default "Step 2 of 3". */
  getStepLabel?: ((step: number, steps: number) => string) | undefined;
}

const defaultStepLabel = (step: number, steps: number) => `Step ${step} of ${steps}`;

/**
 * MobileStepper — spec: specs/components/stepper.md. A compact bar: Back, the progress (text,
 * dots or a bar), Next.
 */
export const MobileStepper = forwardRef<HTMLDivElement, MobileStepperProps>(function MobileStepper(
  {
    steps,
    activeStep = 0,
    variant = "dots",
    position,
    backButton,
    nextButton,
    getStepLabel = defaultStepLabel,
    ...props
  },
  ref,
) {
  const count = Math.max(1, Math.floor(steps) || 1);
  const step = Math.min(Math.max(0, Math.floor(activeStep) || 0), count - 1);
  const label = getStepLabel(step + 1, count);
  return (
    <div
      ref={ref}
      {...mobileStepperAttributes({ variant, position, steps: count, activeStep: step })}
      data-ok-runtime="off"
      {...props}
    >
      {backButton}
      {variant === "text" && (
        <span data-ok-mobile-stepper-text="">{mobileStepperText(step, count)}</span>
      )}
      {variant === "dots" && (
        <span data-ok-mobile-stepper-dots="" role="img" aria-label={label}>
          {Array.from({ length: count }, (_, index) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: the dots are positions.
              key={index}
              data-ok-mobile-stepper-dot=""
              {...(index === step ? { "data-ok-active": "" } : {})}
            />
          ))}
        </span>
      )}
      {variant === "progress" && (
        <LinearProgress
          data-ok-mobile-stepper-progress=""
          variant="determinate"
          color="inherit"
          value={mobileStepperProgress(step, count)}
          aria-label={label}
        />
      )}
      {nextButton}
    </div>
  );
});
