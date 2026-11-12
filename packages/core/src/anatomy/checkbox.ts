import { paletteColorNames } from "@owlky/tokens";
import {
  type DataAttributes,
  defineOptions,
  flag,
  native,
  optionAttributes,
  state,
  style,
} from "../options/define.js";

// --- Checkbox, Switch, FormControlLabel -------------------------------------------------------

export const selectionControlColors = ["default", ...paletteColorNames] as const;
export const selectionControlSizes = ["medium", "small"] as const;
export const switchEdges = ["start", "end"] as const;
export const labelPlacements = ["end", "start", "top", "bottom"] as const;
export type SelectionControlColor = (typeof selectionControlColors)[number];
export type SelectionControlSize = (typeof selectionControlSizes)[number];
export type SwitchEdge = (typeof switchEdges)[number];
export type LabelPlacement = (typeof labelPlacements)[number];

export const CONTROL_INPUT = ":scope > input";

/** Shapes of a color swatch (Radio, Checkbox with `swatch`). */
export const swatchShapes = ["circular", "rounded"] as const;
export type SwatchShape = (typeof swatchShapes)[number];
export const swatchShape = (fallback: SwatchShape) =>
  style(
    "data-ok-shape",
    swatchShapes,
    fallback,
    "Color swatches only (`swatch`): a circle or a square with rounded corners.",
    { optional: true },
  );

export const checkboxOptions = defineOptions("checkbox", "data-ok-checkbox", {
  color: style(
    "data-ok-color",
    selectionControlColors,
    "primary",
    "Color when checked or indeterminate (`default` = text color).",
  ),
  size: style("data-ok-size", selectionControlSizes, "medium", "Target 40 / 36px, icon 24 / 20px."),
  indeterminate: flag(
    "data-ok-indeterminate",
    "Mixed state: shows a dash and sets the input's `indeterminate` (`aria-checked=mixed`).",
  ),
  shape: swatchShape("rounded"),
  disabled: native("disabled", "Native `disabled` on the input.", { children: CONTROL_INPUT }),
  checked: state(
    "checked",
    "Native `checked` (`checked` / `defaultChecked` + `onChange(checked)`).",
    "change",
  ),
});

export interface CheckboxAnatomyOptions {
  color?: SelectionControlColor | undefined;
  size?: SelectionControlSize | undefined;
  indeterminate?: boolean | undefined;
  shape?: SwatchShape | undefined;
}

/** `data-ok-*` attributes of a checkbox's root span. */
export const checkboxAttributes = (options: CheckboxAnatomyOptions = {}): DataAttributes =>
  optionAttributes(checkboxOptions, { ...options });

export const switchOptions = defineOptions("switch", "data-ok-switch", {
  color: style(
    "data-ok-color",
    selectionControlColors,
    "primary",
    "Track color when on (`default` = text color).",
  ),
  size: style("data-ok-size", selectionControlSizes, "medium", "Track 34 × 20 / 26 × 16px."),
  edge: style(
    "data-ok-edge",
    switchEdges,
    "start",
    "Negative margin on that side, to align the track with content.",
    { optional: true },
  ),
  disabled: native("disabled", "Native `disabled` on the input.", { children: CONTROL_INPUT }),
  checked: state(
    "checked",
    "Native `checked` (`checked` / `defaultChecked` + `onChange(checked)`).",
    "change",
  ),
});

export interface SwitchAnatomyOptions {
  color?: SelectionControlColor | undefined;
  size?: SelectionControlSize | undefined;
  edge?: SwitchEdge | false | undefined;
}

/** `data-ok-*` attributes of a switch's root span (`edge` only when set). */
export const switchAttributes = (options: SwitchAnatomyOptions = {}): DataAttributes =>
  optionAttributes(switchOptions, { ...options });

export const formControlLabelOptions = defineOptions(
  "form-control-label",
  "data-ok-form-control-label",
  {
    labelPlacement: style(
      "data-ok-label-placement",
      labelPlacements,
      "end",
      "Where the text sits around the control.",
    ),
    required: flag("data-ok-required", "Shows an asterisk; the control gets `required`."),
  },
);

export interface FormControlLabelAnatomyOptions {
  labelPlacement?: LabelPlacement | undefined;
  required?: boolean | undefined;
}

/** `data-ok-*` attributes of a control's `<label>`. */
export const formControlLabelAttributes = (
  options: FormControlLabelAnatomyOptions = {},
): DataAttributes => optionAttributes(formControlLabelOptions, { ...options });
