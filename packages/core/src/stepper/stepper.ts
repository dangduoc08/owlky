/*
 * Stepper state rules (MUI Stepper / MobileStepper), shared by React and the HTML runtime.
 * Pure: the owner writes the attributes.
 */

export interface StepState {
  active: boolean;
  completed: boolean;
  disabled: boolean;
}

/**
 * A linear step's state from its index: the active step, completed steps before it, disabled
 * (not reached) steps after it. Non-linear steppers (`nonLinear`) only derive the active step:
 * completion and availability are the app's. Explicit values (a step's own `completed`, …) win.
 */
export function stepState(
  index: number,
  activeStep: number,
  overrides: Partial<Record<keyof StepState, boolean | undefined>> = {},
  nonLinear = false,
): StepState {
  return {
    active: overrides.active ?? index === activeStep,
    completed: overrides.completed ?? (!nonLinear && index < activeStep),
    disabled: overrides.disabled ?? (!nonLinear && index > activeStep),
  };
}

/** `value` as a step index in `[0, max]`; anything invalid → 0. */
export function clampStep(value: unknown, max: number): number {
  const number = typeof value === "number" ? value : Number.NaN;
  if (!Number.isInteger(number) || number < 0) return 0;
  return Math.min(number, Math.max(0, max));
}

/** MobileStepper progress: the share of steps done, in percent (0 on the first step). */
export function mobileStepperProgress(activeStep: number, steps: number): number {
  if (steps <= 1) return 100;
  return Math.ceil((clampStep(activeStep, steps - 1) / (steps - 1)) * 100);
}

/** MobileStepper text: `"2 / 3"`. */
export const mobileStepperText = (activeStep: number, steps: number): string =>
  `${clampStep(activeStep, steps - 1) + 1} / ${steps}`;
