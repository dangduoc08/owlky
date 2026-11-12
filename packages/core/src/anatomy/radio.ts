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
  CONTROL_INPUT,
  type SelectionControlColor,
  type SelectionControlSize,
  type SwatchShape,
  selectionControlColors,
  selectionControlSizes,
  swatchShape,
} from "./checkbox.js";

// --- Radio, RadioGroup -----------------------------------------------------------------------

export const radioOptions = defineOptions("radio", "data-ok-radio", {
  color: style(
    "data-ok-color",
    selectionControlColors,
    "primary",
    "Color when selected (`default` = text color).",
  ),
  size: style("data-ok-size", selectionControlSizes, "medium", "Target 40 / 36px, icon 24 / 20px."),
  shape: swatchShape("circular"),
  disabled: native("disabled", "Native `disabled` on the input.", { children: CONTROL_INPUT }),
  checked: state("checked", "Native `checked` (in a group: the group's `value`).", "change"),
});

export interface RadioAnatomyOptions {
  color?: SelectionControlColor | undefined;
  size?: SelectionControlSize | undefined;
  shape?: SwatchShape | undefined;
}

/** `data-ok-*` attributes of a radio's root span. */
export const radioAttributes = (options: RadioAnatomyOptions = {}): DataAttributes =>
  optionAttributes(radioOptions, { ...options });

export const radioGroupOptions = defineOptions("radio-group", "data-ok-radio-group", {
  row: flag("data-ok-row", "Radios side by side instead of a column."),
  value: state(
    "checked",
    "Selected radio (`value` / `defaultValue` + `onChange(value)`; HTML: the checked input).",
    "change",
  ),
});

/** `data-ok-*` attributes of a radio group. */
export const radioGroupAttributes = (options: { row?: boolean | undefined } = {}): DataAttributes =>
  optionAttributes(radioGroupOptions, { ...options });
