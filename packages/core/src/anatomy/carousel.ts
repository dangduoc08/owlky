import { type ColorName, componentColorNames } from "@owlky/tokens";
import {
  type CarouselArrowsVariant,
  type CarouselAutoScrollDirection,
  type CarouselAxis,
  type CarouselBreakpoint,
  type CarouselBreakpointOptions,
  type CarouselContainScroll,
  type CarouselDotsVariant,
  type CarouselEffect,
  type CarouselHeightEvent,
  type CarouselPlacement,
  type CarouselProgressVariant,
  type CarouselResponsive,
  type CarouselSlidesToShow,
  carouselAligns,
  carouselArrowsVariants,
  carouselAutoScrollDirections,
  carouselAxes,
  carouselBreakpoints,
  carouselContainScrolls,
  carouselDotsVariants,
  carouselEffects,
  carouselHeightEvents,
  carouselPlacements,
  carouselProgressVariants,
  parseAlign,
  parseSlidesToScroll,
  parseSlidesToShow,
  responsiveValues,
  slidesToShowAttr,
} from "../carousel/carousel-model.js";
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
import { type Orientation, orientations } from "./button-group.js";

// --- Carousel (ADR-0033) ------------------------------------------------------------------------

export const carouselColors = [
  "inherit",
  ...componentColorNames,
] as const satisfies readonly ColorName[];
export type CarouselColor = (typeof carouselColors)[number];
type CarouselAlignName = (typeof carouselAligns)[number];

export const carouselOptions = defineOptions("carousel", "data-ok-carousel", {
  align: style(
    "data-ok-align",
    carouselAligns,
    "center",
    "Where the selected slides sit: `start`, `center`, `end` (or a fraction 0–1 of the viewport).",
  ),
  axis: style(
    "data-ok-axis",
    carouselAxes,
    "x",
    "Scroll direction: horizontal `x` or vertical `y`.",
  ),
  containScroll: style(
    "data-ok-contain-scroll",
    carouselContainScrolls,
    "trimSnaps",
    "Edges: `trimSnaps` merges the snaps clamped at the ends, `keepSnaps` keeps them, `false` leaves space.",
  ),
  effect: style(
    "data-ok-effect",
    carouselEffects,
    "none",
    "Transition between slides: `fade`, or `opacity` / `scale` / `parallax` while scrolling.",
  ),
  loop: flag("data-ok-loop", "Endless: the first slide follows the last one."),
  dragFree: flag("data-ok-drag-free", "Free scrolling with momentum, without snapping."),
  skipSnaps: flag("data-ok-skip-snaps", "A strong swipe may pass several snaps."),
  autoHeight: flag("data-ok-auto-height", "The height follows the selected slides."),
  heightEvent: style(
    "data-ok-height-event",
    carouselHeightEvents,
    "select",
    "Auto height from the selected slides, or from every slide in view.",
    { when: "autoHeight" },
  ),
  wheelGestures: flag(
    "data-ok-wheel-gestures",
    "The mouse wheel and the trackpad move one snap per gesture.",
  ),
  forceWheelAxis: style(
    "data-ok-force-wheel-axis",
    carouselAxes,
    "x",
    "Wheel axis that moves the carousel (`y`: the vertical wheel moves a horizontal carousel).",
    { optional: true, when: "wheelGestures" },
  ),
  draggable: behavior(
    "data-ok-draggable",
    true,
    "Swipe and drag the slides; `false` turns it off.",
  ),
  focus: behavior(
    "data-ok-focus",
    true,
    "Focusing an element in a slide scrolls to that slide; `false` turns it off.",
  ),
  active: behavior(
    "data-ok-active",
    true,
    "`false` turns the carousel off (for example at a breakpoint).",
  ),
  startIndex: number("data-ok-start-index", 0, "Snap selected at first.", { min: 0 }),
  slidesToScroll: number(
    "data-ok-slides-to-scroll",
    1,
    "Slides per step, or `auto` (as many as fit).",
    { min: 1 },
  ),
  slidesToShow: number(
    "data-ok-slides-to-show",
    undefined,
    "Slides in view: a count, a percentage or `auto`; per breakpoint with `-sm`, `-md`, `-lg`, `-xl`.",
    { min: 0, units: ["%"] },
  ),
  slideSpacing: number("data-ok-slide-spacing", undefined, "Gap between slides (px).", {
    min: 0,
    units: ["px", "rem", "em"],
  }),
  duration: number(
    "data-ok-duration",
    25,
    "Speed of animated scrolls, in Embla units (25 is about 500 ms).",
    { min: 0 },
  ),
  dragThreshold: number(
    "data-ok-drag-threshold",
    10,
    "Pixels a mouse drag moves before clicks are ignored.",
    { min: 0 },
  ),
  inViewThreshold: number(
    "data-ok-in-view-threshold",
    0,
    "Share of a slide (0–1) that must show for it to count as in view.",
    { min: 0 },
  ),
  autoplay: flag("data-ok-autoplay", "Moves to the next snap every `autoplayDelay`."),
  autoplayDelay: number("data-ok-autoplay-delay", 4000, "Autoplay: milliseconds per snap.", {
    min: 0,
  }),
  autoplayJump: flag("data-ok-autoplay-jump", "Autoplay: change snaps without animation.", {
    when: "autoplay",
  }),
  autoScroll: flag("data-ok-auto-scroll", "Scrolls continuously."),
  autoScrollSpeed: number("data-ok-auto-scroll-speed", 2, "Auto scroll: pixels per frame.", {
    min: 0,
  }),
  autoScrollStartDelay: number(
    "data-ok-auto-scroll-start-delay",
    1000,
    "Auto scroll: milliseconds before it starts.",
    { min: 0 },
  ),
  autoScrollDirection: style(
    "data-ok-auto-scroll-direction",
    carouselAutoScrollDirections,
    "forward",
    "Auto scroll: `forward` or `backward`.",
    { when: "autoScroll" },
  ),
  playOnInit: behavior(
    "data-ok-play-on-init",
    true,
    "Autoplay and auto scroll start on their own (never with reduced motion); `false` waits for play.",
  ),
  stopOnInteraction: behavior(
    "data-ok-stop-on-interaction",
    true,
    "Swipes and drags stop autoplay; `false` pauses it until the carousel settles.",
  ),
  stopOnMouseEnter: behavior(
    "data-ok-stop-on-mouse-enter",
    true,
    "Hovering pauses autoplay until the pointer leaves; `false` keeps playing.",
  ),
  stopOnFocusIn: behavior(
    "data-ok-stop-on-focus-in",
    true,
    "Focus inside the carousel stops autoplay; `false` keeps playing.",
  ),
  stopOnLastSnap: flag("data-ok-stop-on-last-snap", "Autoplay stops at the last snap."),
  selected: state(
    "data-ok-snapped",
    "Selected snap: its slides carry `data-ok-snapped` (written by the controller).",
    "select",
  ),
});

export interface CarouselAnatomyOptions {
  align?: CarouselAlignName | number | undefined;
  axis?: CarouselAxis | undefined;
  containScroll?: CarouselContainScroll | false | undefined;
  effect?: CarouselEffect | undefined;
  loop?: boolean | undefined;
  dragFree?: boolean | undefined;
  skipSnaps?: boolean | undefined;
  autoHeight?: boolean | undefined;
  heightEvent?: CarouselHeightEvent | undefined;
  wheelGestures?: boolean | undefined;
  forceWheelAxis?: CarouselAxis | undefined;
  draggable?: boolean | undefined;
  focus?: boolean | undefined;
  active?: boolean | undefined;
  startIndex?: number | undefined;
  slidesToScroll?: number | "auto" | undefined;
  slidesToShow?: CarouselResponsive<CarouselSlidesToShow> | undefined;
  slideSpacing?: number | string | undefined;
  duration?: number | undefined;
  dragThreshold?: number | undefined;
  inViewThreshold?: number | undefined;
  autoplay?: boolean | undefined;
  autoplayDelay?: number | undefined;
  autoplayJump?: boolean | undefined;
  autoScroll?: boolean | undefined;
  autoScrollSpeed?: number | undefined;
  autoScrollStartDelay?: number | undefined;
  autoScrollDirection?: CarouselAutoScrollDirection | undefined;
  playOnInit?: boolean | undefined;
  stopOnInteraction?: boolean | undefined;
  stopOnMouseEnter?: boolean | undefined;
  stopOnFocusIn?: boolean | undefined;
  stopOnLastSnap?: boolean | undefined;
  /** Embla `breakpoints`: media query → behavior options (written as JSON). */
  breakpoints?: Record<string, CarouselBreakpointOptions> | undefined;
}

const CAROUSEL_BEHAVIORS = [
  "draggable",
  "focus",
  "active",
  "playOnInit",
  "stopOnInteraction",
  "stopOnMouseEnter",
  "stopOnFocusIn",
] as const;

/**
 * `data-ok-*` attributes of a carousel root. Behaviors are written only when turned off,
 * `slidesToShow` once per breakpoint (`data-ok-slides-to-show-md`), a numeric `align` and
 * `slidesToScroll="auto"` as given, and `breakpoints` as JSON.
 */
export function carouselAttributes(options: CarouselAnatomyOptions = {}): DataAttributes {
  const { align, containScroll, slidesToScroll, slidesToShow, breakpoints, ...rest } = options;
  const { options: spec } = carouselOptions;
  const attributes = optionAttributes(carouselOptions, {
    ...rest,
    align,
    containScroll: containScroll === false ? "false" : containScroll,
    slidesToScroll: slidesToScroll === "auto" ? undefined : slidesToScroll,
  });
  const numericAlign = typeof align === "number" ? parseAlign(align) : undefined;
  if (typeof numericAlign === "number") attributes[spec.align.attr] = String(numericAlign);
  if (slidesToScroll !== undefined && parseSlidesToScroll(slidesToScroll) === "auto")
    attributes["data-ok-slides-to-scroll"] = "auto";
  const shown = responsiveValues(slidesToShow);
  for (const breakpoint of carouselBreakpoints) {
    const value = parseSlidesToShow(shown[breakpoint]);
    if (value !== undefined) attributes[slidesToShowAttr(breakpoint)] = String(value);
  }
  for (const key of CAROUSEL_BEHAVIORS) {
    if (options[key] === false) attributes[spec[key].attr] = "false";
  }
  if (breakpoints && Object.keys(breakpoints).length > 0) {
    attributes["data-ok-breakpoints"] = JSON.stringify(breakpoints);
  }
  return attributes;
}

/** Reads the `slidesToShow` attributes of a carousel root, per breakpoint (HTML runtime). */
export function readSlidesToShow(element: Element): Partial<Record<CarouselBreakpoint, string>> {
  const out: Partial<Record<CarouselBreakpoint, string>> = {};
  for (const breakpoint of carouselBreakpoints) {
    const value = element.getAttribute(slidesToShowAttr(breakpoint));
    if (value !== null) out[breakpoint] = value;
  }
  return out;
}

export const carouselArrowsOptions = defineOptions("carousel-arrows", "data-ok-carousel-arrows", {
  variant: style(
    "data-ok-variant",
    carouselArrowsVariants,
    "basic",
    "`basic` icon buttons, `floating` on the sides of the slides, or `number` with a counter.",
  ),
  color: style(
    "data-ok-color",
    carouselColors,
    "inherit",
    "`inherit` (neutral) or a palette color.",
  ),
  placement: style(
    "data-ok-placement",
    carouselPlacements,
    "bottom-end",
    "Overlays the slides at that corner or side (absent: in the flow).",
    { optional: true },
  ),
});

export interface CarouselArrowsAnatomyOptions {
  variant?: CarouselArrowsVariant | undefined;
  color?: CarouselColor | undefined;
  placement?: CarouselPlacement | undefined;
}

/** `data-ok-*` attributes of the arrows group. */
export const carouselArrowsAttributes = (
  options: CarouselArrowsAnatomyOptions = {},
): DataAttributes => optionAttributes(carouselArrowsOptions, { ...options });

export const carouselDotsOptions = defineOptions("carousel-dots", "data-ok-carousel-dots", {
  variant: style(
    "data-ok-variant",
    carouselDotsVariants,
    "circular",
    "`circular` dots, `rounded` (the selected dot is a bar) or `number` buttons.",
  ),
  color: style(
    "data-ok-color",
    carouselColors,
    "inherit",
    "`inherit` (neutral) or a palette color.",
  ),
  placement: style(
    "data-ok-placement",
    carouselPlacements,
    "bottom",
    "Overlays the slides at that corner or side (absent: in the flow).",
    { optional: true },
  ),
});

export interface CarouselDotsAnatomyOptions {
  variant?: CarouselDotsVariant | undefined;
  color?: CarouselColor | undefined;
  placement?: CarouselPlacement | undefined;
}

/** `data-ok-*` attributes of the dots group. */
export const carouselDotsAttributes = (options: CarouselDotsAnatomyOptions = {}): DataAttributes =>
  optionAttributes(carouselDotsOptions, { ...options });

export const carouselProgressOptions = defineOptions(
  "carousel-progress",
  "data-ok-carousel-progress",
  {
    variant: style(
      "data-ok-variant",
      carouselProgressVariants,
      "scroll",
      "`scroll` shows the scroll position, `autoplay` the time until the next snap.",
    ),
    color: style(
      "data-ok-color",
      carouselColors,
      "inherit",
      "`inherit` (neutral) or a palette color.",
    ),
    placement: style(
      "data-ok-placement",
      carouselPlacements,
      "top-end",
      "Overlays the slides at that corner or side (absent: in the flow).",
      { optional: true },
    ),
  },
);

export interface CarouselProgressAnatomyOptions {
  variant?: CarouselProgressVariant | undefined;
  color?: CarouselColor | undefined;
  placement?: CarouselPlacement | undefined;
}

/** `data-ok-*` attributes of a progress bar. */
export const carouselProgressAttributes = (
  options: CarouselProgressAnatomyOptions = {},
): DataAttributes => optionAttributes(carouselProgressOptions, { ...options });

export const carouselThumbsOptions = defineOptions("carousel-thumbs", "data-ok-carousel-thumbs", {
  orientation: style(
    "data-ok-orientation",
    orientations,
    "horizontal",
    "A row of thumbnails, or a column.",
  ),
  placement: style(
    "data-ok-placement",
    carouselPlacements,
    "end",
    "Overlays the slides at that corner or side (absent: in the flow).",
    { optional: true },
  ),
});

export interface CarouselThumbsAnatomyOptions {
  orientation?: Orientation | undefined;
  placement?: CarouselPlacement | undefined;
}

/** `data-ok-*` attributes of the thumbnails group. */
export const carouselThumbsAttributes = (
  options: CarouselThumbsAnatomyOptions = {},
): DataAttributes => optionAttributes(carouselThumbsOptions, { ...options });
