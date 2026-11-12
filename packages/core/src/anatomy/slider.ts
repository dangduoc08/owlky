import { paletteColorNames } from "@owlky/tokens";
import {
  type DataAttributes,
  defineOptions,
  flag,
  number,
  optionAttributes,
  state,
  style,
} from "../options/define.js";
import { type Orientation, orientations } from "./button-group.js";

// --- Slider -------------------------------------------------------------------------------------

export const sliderColors = ["inherit", ...paletteColorNames] as const;
export const sliderSizes = ["medium", "small"] as const;
export const sliderTracks = ["normal", "inverted", "false"] as const;
export const sliderValueLabelDisplays = ["off", "auto", "on"] as const;

export type SliderColor = (typeof sliderColors)[number];
export type SliderSize = (typeof sliderSizes)[number];
export type SliderTrack = (typeof sliderTracks)[number];
export type SliderValueLabelDisplay = (typeof sliderValueLabelDisplays)[number];

export const sliderOptions = defineOptions("slider", "data-ok-slider", {
  color: style("data-ok-color", sliderColors, "primary", "Palette color, or `inherit` (text)."),
  size: style("data-ok-size", sliderSizes, "medium", "Rail 10 / 6px, thumb 20 / 16px."),
  orientation: style(
    "data-ok-orientation",
    orientations,
    "horizontal",
    "A horizontal or a vertical slider (vertical fills its container's height).",
  ),
  track: style(
    "data-ok-track",
    sliderTracks,
    "normal",
    "`normal` fills up to the value, `inverted` from the value, `false` draws no track.",
  ),
  valueLabelDisplay: style(
    "data-ok-value-label-display",
    sliderValueLabelDisplays,
    "off",
    "Value bubble above the thumb: never, on hover / focus / drag (`auto`), or always.",
  ),
  disabled: flag("data-ok-disabled", "Can't be changed (inputs disabled, grey)."),
  disableSwap: flag("data-ok-disable-swap", "Range: thumbs can't cross each other."),
  min: number("data-ok-min", 0, "Lowest value."),
  max: number("data-ok-max", 100, "Highest value."),
  step: number("data-ok-step", 1, "Step between values (HTML `marks`: only the marks).", {
    min: 0,
  }),
  shiftStep: number(
    "data-ok-shift-step",
    10,
    "How far Page Up / Page Down and Shift + arrow keys move the thumb.",
    { min: 0 },
  ),
  value: state("value", "Value of each thumb (`value` / `defaultValue`).", "change"),
});

export interface SliderAnatomyOptions {
  color?: SliderColor | undefined;
  size?: SliderSize | undefined;
  orientation?: Orientation | undefined;
  track?: SliderTrack | undefined;
  valueLabelDisplay?: SliderValueLabelDisplay | undefined;
  disabled?: boolean | undefined;
  disableSwap?: boolean | undefined;
  min?: number | undefined;
  max?: number | undefined;
  step?: number | undefined;
  shiftStep?: number | undefined;
}

/** `data-ok-*` attributes of a slider root. */
export const sliderAttributes = (options: SliderAnatomyOptions = {}): DataAttributes =>
  optionAttributes(sliderOptions, { ...options });
