import { paletteColorNames } from "@owlky/tokens";
import {
  type DataAttributes,
  defineOptions,
  flag,
  number,
  optionAttributes,
  style,
} from "../options/define.js";

// --- Progress ---------------------------------------------------------------------------------

export const progressColors = ["inherit", ...paletteColorNames] as const;
export const circularProgressVariants = ["indeterminate", "determinate"] as const;
export const linearProgressVariants = ["indeterminate", "determinate", "buffer", "query"] as const;
export type ProgressColor = (typeof progressColors)[number];
export type CircularProgressVariant = (typeof circularProgressVariants)[number];
export type LinearProgressVariant = (typeof linearProgressVariants)[number];

const progressValueOptions = {
  value: number(
    "aria-valuenow",
    undefined,
    "Progress between `min` and `max` (determinate and buffer variants; default `min`).",
  ),
  min: number("aria-valuemin", 0, "Lowest value."),
  max: number("aria-valuemax", 100, "Highest value (above `min`, otherwise `min` + 100)."),
};

export const circularProgressOptions = defineOptions(
  "circular-progress",
  "data-ok-circular-progress",
  {
    variant: style(
      "data-ok-variant",
      circularProgressVariants,
      "indeterminate",
      "`indeterminate` spins while the duration is unknown; `determinate` shows `value`.",
    ),
    color: style(
      "data-ok-color",
      progressColors,
      "primary",
      "Palette color, or `inherit` (text color).",
    ),
    ...progressValueOptions,
    size: number("data-ok-size", 40, "Width and height: a number in px, or a CSS length.", {
      min: 0,
      units: ["px", "rem", "em"],
    }),
    thickness: number("data-ok-thickness", 3.6, "Stroke width, in 1/44 of the size.", { min: 0 }),
    disableShrink: flag(
      "data-ok-disable-shrink",
      "Indeterminate: a fixed arc that only spins (lighter under heavy load).",
    ),
    enableTrackSlot: flag("data-ok-track-slot", "Shows the faint full circle behind the arc."),
  },
);

export interface CircularProgressAnatomyOptions {
  variant?: CircularProgressVariant | undefined;
  color?: ProgressColor | undefined;
  size?: number | string | undefined;
  thickness?: number | undefined;
  disableShrink?: boolean | undefined;
  enableTrackSlot?: boolean | undefined;
}

/** `data-ok-*` attributes of a circular progress (`size` / `thickness` only when given). */
export const circularProgressAttributes = (
  options: CircularProgressAnatomyOptions = {},
): DataAttributes => optionAttributes(circularProgressOptions, { ...options });

export const linearProgressOptions = defineOptions("linear-progress", "data-ok-linear-progress", {
  variant: style(
    "data-ok-variant",
    linearProgressVariants,
    "indeterminate",
    "`indeterminate` / `query` while the duration is unknown; `determinate` / `buffer` show `value`.",
  ),
  color: style(
    "data-ok-color",
    progressColors,
    "primary",
    "Palette color, or `inherit` (text color).",
  ),
  ...progressValueOptions,
  valueBuffer: number(
    "data-ok-value-buffer",
    undefined,
    "Buffer variant: how far loading has got, between `value` and `max`.",
  ),
});

export interface LinearProgressAnatomyOptions {
  variant?: LinearProgressVariant | undefined;
  color?: ProgressColor | undefined;
}

/** `data-ok-*` attributes of a linear progress (the buffer value is written by the component). */
export const linearProgressAttributes = (
  options: LinearProgressAnatomyOptions = {},
): DataAttributes => optionAttributes(linearProgressOptions, { ...options });
