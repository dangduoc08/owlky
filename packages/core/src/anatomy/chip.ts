import { componentColorNames } from "@owlky/tokens";
import {
  type DataAttributes,
  defineOptions,
  native,
  optionAttributes,
  style,
} from "../options/define.js";
import { type SelectionControlSize, selectionControlSizes } from "./checkbox.js";

// --- Chip -------------------------------------------------------------------------------------

export const chipVariants = ["filled", "outlined", "soft"] as const;
export const chipColors = ["default", ...componentColorNames] as const;
export type ChipVariant = (typeof chipVariants)[number];
export type ChipColor = (typeof chipColors)[number];

export const chipOptions = defineOptions("chip", "data-ok-chip", {
  variant: style("data-ok-variant", chipVariants, "filled", "Fill, outline or tint."),
  color: style(
    "data-ok-color",
    chipColors,
    "default",
    "`default` (neutral), palette, `black` / `white`.",
  ),
  size: style("data-ok-size", selectionControlSizes, "medium", "Height 32 / 24px."),
  disabled: native("disabled", "Native `disabled` on the chip's buttons.", {
    children: ":scope > button",
  }),
});

export interface ChipAnatomyOptions {
  variant?: ChipVariant | undefined;
  color?: ChipColor | undefined;
  size?: SelectionControlSize | undefined;
}

/** `data-ok-*` attributes of a chip's root. */
export const chipAttributes = (options: ChipAnatomyOptions = {}): DataAttributes =>
  optionAttributes(chipOptions, { ...options });
