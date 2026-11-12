import {
  behavior,
  type DataAttributes,
  defineOptions,
  flag,
  number,
  optionAttributes,
  state,
  style,
} from "../options/define.js";

// --- Motion (Animate) -------------------------------------------------------------------------

/** Entrance / exit animations: `<family><In|Out>[<direction>]` (the reference's 48). */
export const motionEntranceVariants = [
  "slideInUp",
  "slideInDown",
  "slideInLeft",
  "slideInRight",
  "slideOutUp",
  "slideOutDown",
  "slideOutLeft",
  "slideOutRight",
  "fadeIn",
  "fadeInUp",
  "fadeInDown",
  "fadeInLeft",
  "fadeInRight",
  "fadeOut",
  "fadeOutUp",
  "fadeOutDown",
  "fadeOutLeft",
  "fadeOutRight",
  "zoomIn",
  "zoomInUp",
  "zoomInDown",
  "zoomInLeft",
  "zoomInRight",
  "zoomOut",
  "zoomOutUp",
  "zoomOutDown",
  "zoomOutLeft",
  "zoomOutRight",
  "bounceIn",
  "bounceInUp",
  "bounceInDown",
  "bounceInLeft",
  "bounceInRight",
  "bounceOut",
  "bounceOutUp",
  "bounceOutDown",
  "bounceOutLeft",
  "bounceOutRight",
  "flipInX",
  "flipInY",
  "flipOutX",
  "flipOutY",
  "scaleInX",
  "scaleInY",
  "scaleOutX",
  "scaleOutY",
  "rotateIn",
  "rotateOut",
] as const;

/** Looping background animations: Ken Burns (images), pan and color change (gradients). */
export const motionBackgroundVariants = [
  "kenburnsTop",
  "kenburnsBottom",
  "kenburnsLeft",
  "kenburnsRight",
  "panTop",
  "panBottom",
  "panLeft",
  "panRight",
  "color2x",
  "color3x",
  "color4x",
  "color5x",
] as const;

/**
 * Effects: `draw` traces the strokes of an SVG (paths with `pathLength="1"`) then fills it;
 * `interactive` scales up on hover and down while pressed (the reference's "Tap & hover").
 */
export const motionEffectVariants = ["draw", "interactive"] as const;

// `concat`, not a spread: minifiers inline a pure IIFE and then keep its spread (ADR-0068 §1).
export type MotionVariant =
  | (typeof motionEntranceVariants)[number]
  | (typeof motionBackgroundVariants)[number]
  | (typeof motionEffectVariants)[number];
export const motionVariants: readonly MotionVariant[] = /* @__PURE__ */ (
  [] as MotionVariant[]
).concat(motionEntranceVariants, motionBackgroundVariants, motionEffectVariants);
export const motionTriggers = ["inView", "mount", "manual"] as const;
export type MotionTrigger = (typeof motionTriggers)[number];

export const motionTriggerOptions = {
  trigger: style(
    "data-ok-trigger",
    motionTriggers,
    "inView",
    "`inView`: plays when the element scrolls into view; `mount`: right away; `manual`: follows `in`.",
  ),
  once: behavior(
    "data-ok-once",
    true,
    "In view: plays only the first time; `false` also plays the exit when it leaves the view.",
  ),
  amount: number(
    "data-ok-amount",
    0.3,
    "In view: the visible fraction (0 to 1) that starts the animation.",
    { min: 0 },
  ),
  in: state(
    "data-ok-in",
    "Manual trigger: shown (`in`; HTML: the `data-ok-in` attribute). Turning it off plays the exit.",
  ),
  delay: number("data-ok-delay", undefined, "Wait before the entrance, in milliseconds.", {
    min: 0,
  }),
};

const motionLookOptions = {
  variant: style(
    "data-ok-variant",
    motionVariants,
    "fadeIn",
    "Animation: entrances and exits (`fadeInUp`, `zoomOut`…) or looping backgrounds (`kenburnsTop`, `panLeft`, `color3x`…).",
  ),
  duration: number(
    "data-ok-duration",
    undefined,
    "Entrance length in milliseconds (default 640; loops have their own).",
    { min: 0 },
  ),
  distance: number(
    "data-ok-distance",
    undefined,
    "How far directional variants travel, in pixels (default 160 for slides, 120 for fades).",
    { min: 0 },
  ),
};

// A pure IIFE: bundlers keep the spreads of a bare call's arguments (ADR-0068 §1).
export const motionOptions = /* @__PURE__ */ (() =>
  defineOptions("motion", "data-ok-motion", {
    ...motionLookOptions,
    ...motionTriggerOptions,
    paused: flag(
      "data-ok-paused",
      "Pauses the animation (looping variants need a pause control: WCAG 2.2.2).",
    ),
    initial: behavior(
      "data-ok-initial",
      true,
      "`false` skips the entrance: the content shows as it is; later exits and entrances play (a shared `layoutId` element).",
    ),
  }))();

// A pure IIFE: bundlers keep the spreads of a bare call's arguments (ADR-0068 §1).
export const motionGroupOptions = /* @__PURE__ */ (() =>
  defineOptions("motion-group", "data-ok-motion-group", {
    ...motionTriggerOptions,
    stagger: number(
      "data-ok-stagger",
      50,
      "Milliseconds between the entrances of the direct child Motions.",
      { min: 0 },
    ),
  }))();

// A pure IIFE: bundlers keep the spreads of a bare call's arguments (ADR-0068 §1).
export const motionTextOptions = /* @__PURE__ */ (() =>
  defineOptions("motion-text", "data-ok-motion-text", {
    ...motionLookOptions,
    ...motionTriggerOptions,
    stagger: number("data-ok-stagger", 25, "Milliseconds between the entrances of the letters.", {
      min: 0,
    }),
  }))();

export interface MotionTriggerAnatomyOptions {
  trigger?: MotionTrigger | undefined;
  once?: boolean | undefined;
  amount?: number | undefined;
  delay?: number | undefined;
}

export interface MotionAnatomyOptions extends MotionTriggerAnatomyOptions {
  variant?: MotionVariant | undefined;
  duration?: number | undefined;
  distance?: number | undefined;
  paused?: boolean | undefined;
  initial?: boolean | undefined;
}

export const onceAttribute = (once: boolean | undefined, attr: string): DataAttributes =>
  once === false ? { [attr]: "false" } : {};

/** `data-ok-*` attributes of a Motion (the state, `data-ok-state`, is written by its owner). */
export const motionAttributes = (options: MotionAnatomyOptions = {}): DataAttributes => ({
  ...optionAttributes(motionOptions, { ...options }),
  ...onceAttribute(options.once, motionOptions.options.once.attr),
  ...onceAttribute(options.initial, motionOptions.options.initial.attr),
});

/** `data-ok-*` attributes of a MotionGroup. */
export const motionGroupAttributes = (
  options: MotionTriggerAnatomyOptions & { stagger?: number | undefined } = {},
): DataAttributes => ({
  ...optionAttributes(motionGroupOptions, { ...options }),
  ...onceAttribute(options.once, motionGroupOptions.options.once.attr),
});

/** `data-ok-*` attributes of a MotionText. */
export const motionTextAttributes = (
  options: Omit<MotionAnatomyOptions, "paused"> & { stagger?: number | undefined } = {},
): DataAttributes => ({
  ...optionAttributes(motionTextOptions, { ...options }),
  ...onceAttribute(options.once, motionTextOptions.options.once.attr),
});
