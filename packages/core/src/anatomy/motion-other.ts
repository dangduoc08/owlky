import { paletteColorNames } from "@owlky/tokens";
import { type CountdownUnit, countdownUnits } from "../motion/countdown.js";
import {
  type DataAttributes,
  defineOptions,
  flag,
  number,
  optionAttributes,
  style,
} from "../options/define.js";
import { type MotionTrigger, motionTriggerOptions, onceAttribute } from "./motion.js";

// --- CountUp and MotionBorder (Animate "Other") ----------------------------------------------

export const countUpOptions = defineOptions("count-up", "data-ok-count-up", {
  start: number("data-ok-start", 0, "First value shown.", {}),
  end: number("data-ok-end", 0, "Value reached at the end (also what screen readers read)."),
  decimals: number("data-ok-decimals", 0, "Digits after the decimal point.", { min: 0 }),
  duration: number("data-ok-duration", 2000, "Length of the count, in milliseconds.", { min: 0 }),
  trigger: motionTriggerOptions.trigger,
  once: motionTriggerOptions.once,
  amount: motionTriggerOptions.amount,
  in: motionTriggerOptions.in,
});

export interface CountUpAnatomyOptions {
  start?: number | undefined;
  end?: number | undefined;
  decimals?: number | undefined;
  duration?: number | undefined;
  trigger?: MotionTrigger | undefined;
  once?: boolean | undefined;
  amount?: number | undefined;
}

/** `data-ok-*` attributes of a CountUp. */
export const countUpAttributes = (options: CountUpAnatomyOptions = {}): DataAttributes => ({
  ...optionAttributes(countUpOptions, { ...options }),
  ...onceAttribute(options.once, countUpOptions.options.once.attr),
});

export const countdownOptions = defineOptions("countdown", "data-ok-countdown", {
  seconds: number(
    "data-ok-seconds",
    undefined,
    "Counts down from this many seconds (when there is no `date`).",
    { min: 0 },
  ),
  largestUnit: style(
    "data-ok-largest-unit",
    countdownUnits,
    "days",
    "The largest unit shown: larger ones fold into it (`minutes`: 90 minutes, not 1 hour 30).",
  ),
  paused: flag(
    "data-ok-paused",
    "Stops the countdown (WCAG 2.2.2). Seconds keep their time left; a date shows the real time left when it resumes.",
  ),
});

export interface CountdownAnatomyOptions {
  seconds?: number | undefined;
  largestUnit?: CountdownUnit | undefined;
  paused?: boolean | undefined;
}

/** `data-ok-*` attributes of a Countdown (`date`, `now` and the labels are written by the owner). */
export const countdownAttributes = (options: CountdownAnatomyOptions = {}): DataAttributes =>
  optionAttributes(countdownOptions, { ...options });

export const motionBorderShapes = ["rounded", "circle"] as const;
export type MotionBorderShape = (typeof motionBorderShapes)[number];
export const motionBorderColors = ["multi", "inherit", ...paletteColorNames] as const;
export type MotionBorderColor = (typeof motionBorderColors)[number];
export const motionBorderSecondaryColors = ["inherit", ...paletteColorNames] as const;
export type MotionBorderSecondaryColor = (typeof motionBorderSecondaryColors)[number];

export const motionBorderOptions = defineOptions("motion-border", "data-ok-motion-border", {
  shape: style("data-ok-shape", motionBorderShapes, "rounded", "`rounded` corners or a `circle`."),
  color: style(
    "data-ok-color",
    motionBorderColors,
    "multi",
    "`multi`: several brand colors all around; `inherit` (the text color) or a palette color: a light running along the border.",
  ),
  secondaryColor: style(
    "data-ok-secondary-color",
    motionBorderSecondaryColors,
    "inherit",
    "A second light in this color, starting on the opposite side (not with `multi`; absent by default).",
    { optional: true },
  ),
  width: number("data-ok-width", 2, "Border width in pixels.", { min: 0 }),
  duration: number(
    "data-ok-duration",
    undefined,
    "One turn, in milliseconds (default about 5 s).",
    {
      min: 0,
    },
  ),
  paused: flag(
    "data-ok-paused",
    "Stops the turning border (a looping animation needs a pause control: WCAG 2.2.2).",
  ),
});

export interface MotionBorderAnatomyOptions {
  shape?: MotionBorderShape | undefined;
  color?: MotionBorderColor | undefined;
  secondaryColor?: MotionBorderSecondaryColor | undefined;
  width?: number | undefined;
  duration?: number | undefined;
  paused?: boolean | undefined;
}

/** `data-ok-*` attributes of a MotionBorder (width and duration also go to private properties). */
export const motionBorderAttributes = (options: MotionBorderAnatomyOptions = {}): DataAttributes =>
  optionAttributes(motionBorderOptions, { ...options });
