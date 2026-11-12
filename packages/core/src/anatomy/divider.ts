import {
  type DataAttributes,
  defineOptions,
  flag,
  optionAttributes,
  style,
} from "../options/define.js";
import { type Orientation, orientations } from "./button-group.js";

// --- Divider ----------------------------------------------------------------------------------

export const dividerVariants = ["fullWidth", "inset", "middle"] as const;
export const dividerTextAligns = ["center", "left", "right"] as const;
export type DividerVariant = (typeof dividerVariants)[number];
export type DividerTextAlign = (typeof dividerTextAligns)[number];

export const dividerOptions = defineOptions("divider", "data-ok-divider", {
  variant: style(
    "data-ok-variant",
    dividerVariants,
    "fullWidth",
    "`inset` starts 72px in (after an avatar or icon); `middle` leaves 16px on both sides.",
  ),
  orientation: style(
    "data-ok-orientation",
    orientations,
    "horizontal",
    "A line across, or a line up and down (also `aria-orientation`).",
  ),
  textAlign: style(
    "data-ok-text-align",
    dividerTextAligns,
    "center",
    "With text: where the text sits on the line.",
    { optional: true },
  ),
  flexItem: flag("data-ok-flex-item", "Vertical, in a flex row: stretch to the row's height."),
  absolute: flag("data-ok-absolute", "Pinned to the bottom of the positioned parent."),
});

export interface DividerAnatomyOptions {
  variant?: DividerVariant | undefined;
  orientation?: Orientation | undefined;
  textAlign?: DividerTextAlign | undefined;
  flexItem?: boolean | undefined;
  absolute?: boolean | undefined;
}

/** `data-ok-*` attributes of a divider (`textAlign` only when given). */
export const dividerAttributes = (options: DividerAnatomyOptions = {}): DataAttributes =>
  optionAttributes(dividerOptions, { ...options });
