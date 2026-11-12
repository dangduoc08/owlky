import {
  type DataAttributes,
  defineOptions,
  flag,
  native,
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
import { type TextFieldVariant, textFieldVariants } from "./text-field.js";

// --- Select, InputLabel -----------------------------------------------------------------------

const SELECT_DISPLAY = ":scope > [data-ok-select-display]";

export const selectOptions = defineOptions("select", "data-ok-select", {
  variant: style(
    "data-ok-variant",
    textFieldVariants,
    "outlined",
    "Outline, tinted fill or underline (default: the form control's).",
  ),
  size: style(
    "data-ok-size",
    selectionControlSizes,
    "medium",
    "Height 56 / 40px (outlined; default: the form control's).",
  ),
  color: style(
    "data-ok-color",
    selectionControlColors,
    "default",
    "Focus color (`default` = text color; default: the form control's).",
  ),
  error: flag("data-ok-error", "Error colors; the trigger gets `aria-invalid`."),
  fullWidth: flag("data-ok-full-width", "Stretch to the container width."),
  multiple: flag("data-ok-multiple", "Several values: options toggle and the list stays open."),
  autoWidth: flag(
    "data-ok-auto-width",
    "The list takes its options' width instead of at least the field's.",
  ),
  displayEmpty: flag(
    "data-ok-display-empty",
    "Show the empty value (its option, or the placeholder template) instead of nothing.",
  ),
  disabled: native(
    "aria-disabled",
    '`aria-disabled="true"` on the trigger and `disabled` on the hidden input: it doesn\'t open.',
    { children: SELECT_DISPLAY },
  ),
  readOnly: native("aria-readonly", '`aria-readonly="true"` on the trigger: it doesn\'t open.', {
    children: SELECT_DISPLAY,
  }),
  value: state(
    "aria-selected",
    "Chosen option(s) (`value` / `defaultValue` + `onChange(value)`).",
    "change",
  ),
  open: state(
    "aria-expanded",
    "Open state (`open` / `defaultOpen` + `onOpenChange(open, reason)`).",
    "open",
  ),
});

export interface SelectAnatomyOptions {
  variant?: TextFieldVariant | undefined;
  size?: SelectionControlSize | undefined;
  color?: SelectionControlColor | undefined;
  error?: boolean | undefined;
  fullWidth?: boolean | undefined;
  multiple?: boolean | undefined;
  autoWidth?: boolean | undefined;
  displayEmpty?: boolean | undefined;
}

/** `data-ok-*` attributes of a select's root (the field box). */
export const selectAttributes = (options: SelectAnatomyOptions = {}): DataAttributes =>
  optionAttributes(selectOptions, { ...options });

/**
 * Behavior attributes only (`data-ok-select` + flags), for a select composed inside another
 * field's box, such as TextField's control (which styles the box itself).
 */
export const selectBehaviorAttributes = (
  options: Pick<SelectAnatomyOptions, "multiple" | "autoWidth" | "displayEmpty"> = {},
): DataAttributes => {
  const all = selectAttributes(options);
  const kept: DataAttributes = { "data-ok-select": "" };
  for (const key of ["multiple", "autoWidth", "displayEmpty"] as const) {
    const attr = selectOptions.options[key].attr;
    if (all[attr] !== undefined) kept[attr] = all[attr];
  }
  return kept;
};

export const inputLabelOptions = defineOptions("input-label", "data-ok-input-label", {
  shrink: flag("data-ok-shrink", "Keep the label above the field even when it is empty."),
  disableAnimation: flag("data-ok-disable-animation", "The label moves without a transition."),
});

/** `data-ok-*` attributes of an input label (a form label that floats in a Select's field). */
export const inputLabelAttributes = (
  options: { shrink?: boolean | undefined; disableAnimation?: boolean | undefined } = {},
): DataAttributes => optionAttributes(inputLabelOptions, { ...options });
