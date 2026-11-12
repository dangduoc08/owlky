import {
  type DataAttributes,
  defineOptions,
  flag,
  optionAttributes,
  style,
} from "../options/define.js";
import { type ChipColor, chipColors } from "./chip.js";

// --- Label ------------------------------------------------------------------------------------

export const labelVariants = ["filled", "outlined", "soft", "inverted"] as const;
export type LabelVariant = (typeof labelVariants)[number];

export const labelOptions = defineOptions("label", "data-ok-label", {
  variant: style("data-ok-variant", labelVariants, "soft", "Fill, outline, tint or inverted tint."),
  color: style(
    "data-ok-color",
    chipColors,
    "default",
    "`default` (neutral), palette, `black` / `white`.",
  ),
  disabled: flag("data-ok-disabled", "Dimmed and ignores the pointer, for an inactive status."),
});

export interface LabelAnatomyOptions {
  variant?: LabelVariant | undefined;
  color?: ChipColor | undefined;
  disabled?: boolean | undefined;
}

/** `data-ok-*` attributes of a label. */
export const labelAttributes = (options: LabelAnatomyOptions = {}): DataAttributes =>
  optionAttributes(labelOptions, { ...options });
