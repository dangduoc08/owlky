import {
  type DataAttributes,
  defineOptions,
  flag,
  native,
  number,
  optionAttributes,
  state,
  style,
} from "../options/define.js";
import {
  type SelectionControlColor,
  type SelectionControlSize,
  selectionControlColors,
  selectionControlSizes,
} from "./checkbox.js";
import {
  type TextFieldMargin,
  type TextFieldVariant,
  textFieldMargins,
  textFieldVariants,
} from "./text-field.js";

// --- FormControl, FormLabel, FormGroup, FormHelperText ----------------------------------------

/** States a FormControl shares with its label and helper text (spec: form-control.md). */
const formStates = (owner: string) => ({
  disabled: flag("data-ok-disabled", `Disabled colors for ${owner}.`),
  error: flag("data-ok-error", `Error colors for ${owner}.`),
  required: flag("data-ok-required", `Marks ${owner} as required.`),
  focused: flag("data-ok-focused", `Focused colors for ${owner}.`),
});

export const formControlOptions = defineOptions("form-control", "data-ok-form-control", {
  color: style(
    "data-ok-color",
    selectionControlColors,
    "default",
    "Color of a focused label (`default` = text color, as on the reference; MUI's default is `primary`).",
    { optional: true },
  ),
  size: style(
    "data-ok-size",
    selectionControlSizes,
    "medium",
    "Size shared with the composed input.",
    { optional: true },
  ),
  variant: style(
    "data-ok-variant",
    textFieldVariants,
    "outlined",
    "Variant shared with the composed input; `outlined` and `filled` indent the helper text.",
    { optional: true },
  ),
  margin: style(
    "data-ok-margin",
    textFieldMargins,
    "none",
    "Vertical margin: 0, 8 / 4px or 16 / 8px.",
    { optional: true },
  ),
  fullWidth: flag("data-ok-full-width", "Stretch to the container width."),
  ...formStates("the label and the helper text"),
  hiddenLabel: flag(
    "data-ok-hidden-label",
    "A filled Select without a label: less padding above the value.",
  ),
});

export interface FormControlAnatomyOptions {
  color?: SelectionControlColor | undefined;
  size?: SelectionControlSize | undefined;
  variant?: TextFieldVariant | undefined;
  margin?: TextFieldMargin | undefined;
  fullWidth?: boolean | undefined;
  hiddenLabel?: boolean | undefined;
  disabled?: boolean | undefined;
  error?: boolean | undefined;
  required?: boolean | undefined;
  focused?: boolean | undefined;
}

/** `data-ok-*` attributes of a form control's root (style options only when given). */
export const formControlAttributes = (options: FormControlAnatomyOptions = {}): DataAttributes =>
  optionAttributes(formControlOptions, { ...options });

export const formLabelOptions = defineOptions("form-label", "data-ok-form-label", {
  color: style(
    "data-ok-color",
    selectionControlColors,
    "default",
    "Color when focused; default: the form control's.",
    { optional: true },
  ),
  ...formStates("the label"),
  filled: flag("data-ok-filled", "Marks the label of an input that has a value (no style)."),
});

export interface FormLabelAnatomyOptions {
  color?: SelectionControlColor | undefined;
  disabled?: boolean | undefined;
  error?: boolean | undefined;
  required?: boolean | undefined;
  focused?: boolean | undefined;
  filled?: boolean | undefined;
}

/** `data-ok-*` attributes of a form label (its own states; the form control's come from CSS). */
export const formLabelAttributes = (options: FormLabelAnatomyOptions = {}): DataAttributes =>
  optionAttributes(formLabelOptions, { ...options });

export const formGroupOptions = defineOptions("form-group", "data-ok-form-group", {
  row: flag("data-ok-row", "Controls side by side instead of a column."),
});

/** `data-ok-*` attributes of a form group. */
export const formGroupAttributes = (options: { row?: boolean | undefined } = {}): DataAttributes =>
  optionAttributes(formGroupOptions, { ...options });

export const formHelperTextMargins = ["dense"] as const;
export type FormHelperTextMargin = (typeof formHelperTextMargins)[number];

export const formHelperTextOptions = defineOptions("form-helper-text", "data-ok-form-helper-text", {
  margin: style(
    "data-ok-margin",
    formHelperTextMargins,
    "dense",
    "`dense`: 4px above instead of 6px; default: the form control's.",
    { optional: true },
  ),
  variant: style(
    "data-ok-variant",
    textFieldVariants,
    "outlined",
    "`outlined` and `filled` indent the text; default: the form control's.",
    { optional: true },
  ),
  ...formStates("the helper text"),
  filled: flag("data-ok-filled", "Marks the helper text of an input that has a value (no style)."),
});

export interface FormHelperTextAnatomyOptions {
  margin?: FormHelperTextMargin | undefined;
  variant?: TextFieldVariant | undefined;
  disabled?: boolean | undefined;
  error?: boolean | undefined;
  required?: boolean | undefined;
  focused?: boolean | undefined;
  filled?: boolean | undefined;
}

/** `data-ok-*` attributes of a form helper text (its own states). */
export const formHelperTextAttributes = (
  options: FormHelperTextAnatomyOptions = {},
): DataAttributes => optionAttributes(formHelperTextOptions, { ...options });

// A listbox Select's trigger is a `div`: its native states live on the hidden input (the `select`
// runtime mirrors `disabled` onto the trigger's `aria-disabled`).
const FIELD_INPUT =
  ":scope > [data-ok-text-field-control] > :is([data-ok-text-field-input]:not([data-ok-select-display]), [data-ok-select-input])";

export const textFieldOptions = defineOptions("text-field", "data-ok-text-field", {
  variant: style(
    "data-ok-variant",
    textFieldVariants,
    "outlined",
    "Outline, tinted fill or underline.",
  ),
  size: style("data-ok-size", selectionControlSizes, "medium", "Height 56 / 40px (outlined)."),
  color: style(
    "data-ok-color",
    selectionControlColors,
    "default",
    "Focus color (`default` = text color, as on the reference; MUI's default is `primary`).",
  ),
  error: flag("data-ok-error", "Error colors; the input gets `aria-invalid`."),
  fullWidth: flag("data-ok-full-width", "Stretch to the container width."),
  margin: style(
    "data-ok-margin",
    textFieldMargins,
    "none",
    "Vertical margin: 0, 8 / 4px or 16 / 8px.",
  ),
  shrink: flag("data-ok-shrink", "Keep the label above the value even when empty."),
  hiddenLabel: flag(
    "data-ok-hidden-label",
    "Hide the label visually (it still names the input); the field gets the padding of a field without a label.",
  ),
  focused: flag("data-ok-focused", "Show the focus colors even when the field doesn't have focus."),
  notched: flag(
    "data-ok-notched",
    "Outlined: keep the notch in the outline open (OutlinedInput: room for its `label`).",
  ),
  disableUnderline: flag(
    "data-ok-disable-underline",
    "Standard: no underline (give the field another focus style).",
  ),
  minRows: number("data-ok-min-rows", undefined, "Multiline: rows shown at least.", { min: 1 }),
  maxRows: number("data-ok-max-rows", undefined, "Multiline: rows before it scrolls.", { min: 1 }),
  disabled: native("disabled", "Native `disabled` on the input.", { children: FIELD_INPUT }),
  required: native("required", "Native `required`; the label gets an asterisk.", {
    children: FIELD_INPUT,
  }),
  value: state(
    "value",
    "The input's value (`value` / `defaultValue` + `onChange(value)`).",
    "input",
  ),
});

export interface TextFieldAnatomyOptions {
  variant?: TextFieldVariant | undefined;
  size?: SelectionControlSize | undefined;
  color?: SelectionControlColor | undefined;
  error?: boolean | undefined;
  fullWidth?: boolean | undefined;
  margin?: TextFieldMargin | undefined;
  shrink?: boolean | undefined;
  hiddenLabel?: boolean | undefined;
  focused?: boolean | undefined;
  notched?: boolean | undefined;
  disableUnderline?: boolean | undefined;
  minRows?: number | undefined;
  maxRows?: number | undefined;
}

/** `data-ok-*` attributes of a text field's root. */
export const textFieldAttributes = (options: TextFieldAnatomyOptions = {}): DataAttributes =>
  optionAttributes(textFieldOptions, { ...options });
