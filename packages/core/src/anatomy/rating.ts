import { type PaletteColorName, paletteColorNames } from "@owlky/tokens";
import {
  type DataAttributes,
  defineOptions,
  flag,
  optionAttributes,
  state,
  style,
} from "../options/define.js";

// --- Rating -------------------------------------------------------------------------------------

export const ratingSizes = ["xxSmall", "xSmall", "small", "medium", "large"] as const;
export type RatingSize = (typeof ratingSizes)[number];

export const ratingOptions = defineOptions("rating", "data-ok-rating", {
  size: style("data-ok-size", ratingSizes, "medium", "Icon size: 12 / 16 / 20 / 24 / 28px."),
  color: style("data-ok-color", paletteColorNames, "warning", "Color of the filled icons."),
  highlightSelectedOnly: flag(
    "data-ok-highlight-selected-only",
    "Only the selected icon is filled (icons that differ per value).",
  ),
  readOnly: flag("data-ok-read-only", 'Shows the value without inputs (`role="img"`).'),
  disabled: flag("data-ok-disabled", "Can't be changed (inputs disabled, dimmed)."),
  value: state("checked", "Selected value (`value` / `defaultValue`).", "change"),
});

export interface RatingAnatomyOptions {
  size?: RatingSize | undefined;
  color?: PaletteColorName | undefined;
  highlightSelectedOnly?: boolean | undefined;
  readOnly?: boolean | undefined;
  disabled?: boolean | undefined;
}

/** `data-ok-*` attributes of a rating. */
export const ratingAttributes = (options: RatingAnatomyOptions = {}): DataAttributes =>
  optionAttributes(ratingOptions, { ...options });
