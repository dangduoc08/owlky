import {
  type DataAttributes,
  defineOptions,
  flag,
  native,
  number,
  optionAttributes,
  state,
} from "../options/define.js";

// --- Number field (a text field with a spin button, roadmap 4.24) -------------------------------

const NUMBER_INPUT = ":scope > [data-ok-text-field-control] > [data-ok-text-field-input]";

// `data-ok-step` is the Stepper's step root (stepper.css loads after text-field.css): the step
// options are `data-ok-step-size`, `data-ok-small-step` and `data-ok-large-step`.
export const numberFieldOptions = defineOptions("number-field", "data-ok-number-field", {
  min: number("data-ok-min", undefined, "Lowest value (none by default)."),
  max: number("data-ok-max", undefined, "Highest value (none by default)."),
  step: number(
    "data-ok-step-size",
    1,
    "How much the buttons and Arrow Up / Arrow Down change the value.",
    { min: 0 },
  ),
  smallStep: number("data-ok-small-step", 0.1, "Step with Alt + Arrow Up / Arrow Down.", {
    min: 0,
  }),
  largeStep: number(
    "data-ok-large-step",
    10,
    "Step of Page Up / Page Down and Shift + Arrow Up / Arrow Down.",
    { min: 0 },
  ),
  snapOnStep: flag(
    "data-ok-snap-on-step",
    "A step lands on a multiple of the step (counted from `min`), such as 1.5 → 2.",
  ),
  allowOutOfRange: flag(
    "data-ok-allow-out-of-range",
    "Typed values outside `min` / `max` stay as typed (steps still stop at the bounds).",
  ),
  disabled: native("disabled", "Native `disabled` on the input; the buttons are disabled too.", {
    children: NUMBER_INPUT,
  }),
  readOnly: native(
    "readonly",
    "Native `readonly` on the input: it can be focused and copied, not changed.",
    { children: NUMBER_INPUT },
  ),
  value: state(
    "value",
    "The number (`value` / `defaultValue` + `onValueChange(value, details)`).",
    "change",
  ),
});

export interface NumberFieldAnatomyOptions {
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;
  smallStep?: number | undefined;
  largeStep?: number | undefined;
  snapOnStep?: boolean | undefined;
  allowOutOfRange?: boolean | undefined;
}

/** `data-ok-*` attributes a number field adds to its text field root. */
export const numberFieldAttributes = (options: NumberFieldAnatomyOptions = {}): DataAttributes =>
  optionAttributes(numberFieldOptions, { ...options });
