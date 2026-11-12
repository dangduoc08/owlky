import {
  type DataAttributes,
  defineOptions,
  flag,
  number,
  optionAttributes,
  style,
} from "../options/define.js";
import { type Orientation, orientations } from "./button-group.js";

// --- Stepper ------------------------------------------------------------------------------------

export const stepperVariants = ["standard", "dot", "circle"] as const;
export const mobileStepperVariants = ["text", "dots", "progress"] as const;
export const mobileStepperPositions = ["bottom", "top", "static"] as const;

export type StepperVariant = (typeof stepperVariants)[number];
export type MobileStepperVariant = (typeof mobileStepperVariants)[number];
export type MobileStepperPosition = (typeof mobileStepperPositions)[number];

export const stepperOptions = defineOptions("stepper", "data-ok-stepper", {
  orientation: style("data-ok-orientation", orientations, "horizontal", "Row or column of steps."),
  alternativeLabel: flag(
    "data-ok-alternative-label",
    "Horizontal: labels below the icons, steps share the width.",
  ),
  variant: style(
    "data-ok-variant",
    stepperVariants,
    "standard",
    "`standard` numbered icons; `dot` small dots; `circle` large icon circles. Thicker lines with `dot` / `circle`.",
  ),
  activeStep: number(
    "data-ok-active-step",
    0,
    "Index of the current step; earlier steps are completed.",
    { min: 0 },
  ),
  nonLinear: flag(
    "data-ok-non-linear",
    "Steps can be visited in any order: only the active step is derived, completed and disabled steps are yours to set.",
  ),
});

export interface StepperAnatomyOptions {
  orientation?: Orientation | undefined;
  alternativeLabel?: boolean | undefined;
  variant?: StepperVariant | undefined;
  activeStep?: number | undefined;
  nonLinear?: boolean | undefined;
}

/** `data-ok-*` attributes of a stepper (`ol`). */
export const stepperAttributes = (options: StepperAnatomyOptions = {}): DataAttributes =>
  optionAttributes(stepperOptions, { ...options });

export const stepOptions = defineOptions("step", "data-ok-step", {
  active: flag("data-ok-active", 'The current step (`aria-current="step"` on its label).'),
  completed: flag("data-ok-completed", "Done: the icon shows a check."),
  disabled: flag("data-ok-disabled", "Not reached yet (dimmed)."),
  expanded: flag(
    "data-ok-expanded",
    "Vertical steppers: the step's content stays shown, also when it isn't active.",
  ),
  last: flag(
    "data-ok-last",
    "The last step (no line below its content), when it isn't the list's last element.",
  ),
});

export interface StepAnatomyOptions {
  active?: boolean | undefined;
  completed?: boolean | undefined;
  disabled?: boolean | undefined;
  expanded?: boolean | undefined;
  last?: boolean | undefined;
}

/** `data-ok-*` attributes of a step (`li`); written by the stepper (React) or the runtime (HTML). */
export const stepAttributes = (options: StepAnatomyOptions = {}): DataAttributes =>
  optionAttributes(stepOptions, { ...options });

export const stepLabelOptions = defineOptions("step-label", "data-ok-step-label", {
  error: flag("data-ok-error", "The step failed: error color and icon."),
});

/** `data-ok-*` attributes of a step label. */
export const stepLabelAttributes = (
  options: { error?: boolean | undefined } = {},
): DataAttributes => optionAttributes(stepLabelOptions, { ...options });

export const mobileStepperOptions = defineOptions("mobile-stepper", "data-ok-mobile-stepper", {
  variant: style(
    "data-ok-variant",
    mobileStepperVariants,
    "dots",
    "How progress shows: `text` (2 / 3), `dots`, or a `progress` bar.",
  ),
  position: style(
    "data-ok-position",
    mobileStepperPositions,
    "bottom",
    "`bottom` / `top`: fixed to the viewport edge; `static`: in the flow.",
  ),
  steps: number("data-ok-steps", undefined, "Number of steps.", { min: 1 }),
  activeStep: number("data-ok-active-step", 0, "Index of the current step.", { min: 0 }),
});

export interface MobileStepperAnatomyOptions {
  variant?: MobileStepperVariant | undefined;
  position?: MobileStepperPosition | undefined;
  steps?: number | undefined;
  activeStep?: number | undefined;
}

/** `data-ok-*` attributes of a mobile stepper. */
export const mobileStepperAttributes = (
  options: MobileStepperAnatomyOptions = {},
): DataAttributes => optionAttributes(mobileStepperOptions, { ...options });
