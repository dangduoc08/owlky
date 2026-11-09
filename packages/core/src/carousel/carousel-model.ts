/*
 * Carousel model (ADR-0033): pure functions shared by the controller, React and the HTML runtime —
 * option values, slide sizes, groups, snap positions, loop order, progress and tween values. No
 * DOM access here, so every function is unit-tested with numbers.
 */

export const carouselAligns = ["start", "center", "end"] as const;
export const carouselAxes = ["x", "y"] as const;
export const carouselContainScrolls = ["trimSnaps", "keepSnaps", "false"] as const;
export const carouselEffects = ["none", "fade", "opacity", "scale", "parallax"] as const;
export const carouselHeightEvents = ["select", "slidesInView"] as const;
export const carouselAutoScrollDirections = ["forward", "backward"] as const;
export const carouselArrowsVariants = ["basic", "floating", "number"] as const;
export const carouselDotsVariants = ["circular", "rounded", "number"] as const;
export const carouselProgressVariants = ["scroll", "autoplay"] as const;
export const carouselPlacements = [
  "top-start",
  "top",
  "top-end",
  "start",
  "end",
  "bottom-start",
  "bottom",
  "bottom-end",
] as const;
/** Breakpoints of `slidesToShow` (the `--ok-breakpoint-*` tokens). */
export const carouselBreakpoints = ["xs", "sm", "md", "lg", "xl"] as const;

export type CarouselAlignName = (typeof carouselAligns)[number];
/** `start | center | end`, a fraction of the viewport (0–1) from its start, or (React) a function. */
export type CarouselAlign =
  | CarouselAlignName
  | number
  | ((viewSize: number, snapSize: number, index: number) => number);
export type CarouselAxis = (typeof carouselAxes)[number];
export type CarouselContainScroll = (typeof carouselContainScrolls)[number];
export type CarouselEffect = (typeof carouselEffects)[number];
export type CarouselHeightEvent = (typeof carouselHeightEvents)[number];
export type CarouselAutoScrollDirection = (typeof carouselAutoScrollDirections)[number];
export type CarouselArrowsVariant = (typeof carouselArrowsVariants)[number];
export type CarouselDotsVariant = (typeof carouselDotsVariants)[number];
export type CarouselProgressVariant = (typeof carouselProgressVariants)[number];
export type CarouselPlacement = (typeof carouselPlacements)[number];
export type CarouselBreakpoint = (typeof carouselBreakpoints)[number];

/** Slides in view: a count (`2`, `1.5`), a share of the viewport (`"70%"`) or `"auto"` (own size). */
export type CarouselSlidesToShow = number | `${number}%` | "auto";
/** One value, or one per breakpoint (`{ xs: 1, sm: 2, md: 3 }`, mobile first). */
export type CarouselResponsive<T> = T | Partial<Record<CarouselBreakpoint, T>>;

/** A valid `slidesToShow` value, or `undefined` (absent or invalid: one slide per view). */
export function parseSlidesToShow(value: unknown): CarouselSlidesToShow | undefined {
  if (value === "auto") return "auto";
  if (typeof value === "number") return Number.isFinite(value) && value > 0 ? value : undefined;
  if (typeof value !== "string" || value.length > 12) return undefined;
  const text = value.trim();
  const percent = /^(\d+(?:\.\d+)?)%$/.exec(text);
  if (percent) {
    const amount = Number(percent[1]);
    return amount > 0 && amount <= 100 ? (`${amount}%` as `${number}%`) : undefined;
  }
  if (!/^\d+(?:\.\d+)?$/.test(text)) return undefined;
  const count = Number(text);
  return count > 0 ? count : undefined;
}

/** The flex basis of a slide for `slidesToShow` (the gap is `--_ok-carousel-spacing`). */
export function slideBasis(value: CarouselSlidesToShow): string {
  if (value === "auto") return "auto";
  if (typeof value === "string") return value;
  if (value === 1) return "100%";
  return `calc((100% - ${value - 1} * var(--_ok-carousel-spacing, 0px)) / ${value})`;
}

/** A valid `slideSpacing` (px number or a px / rem / em length), or `undefined`. */
export function parseSlideSpacing(value: unknown): string | undefined {
  if (typeof value === "number")
    return Number.isFinite(value) && value >= 0 ? `${value}px` : undefined;
  if (typeof value !== "string" || value.length > 12) return undefined;
  const match = /^(\d+(?:\.\d+)?)(px|rem|em)?$/.exec(value.trim());
  return match ? `${Number(match[1])}${match[2] ?? "px"}` : undefined;
}

/** `slidesToShow` per breakpoint: a single value is the `xs` value. */
export function responsiveValues<T>(
  value: CarouselResponsive<T> | undefined,
): Partial<Record<CarouselBreakpoint, T>> {
  if (value === undefined || value === null) return {};
  if (typeof value === "object" && !Array.isArray(value)) {
    const out: Partial<Record<CarouselBreakpoint, T>> = {};
    for (const key of carouselBreakpoints) {
      const item = (value as Partial<Record<CarouselBreakpoint, T>>)[key];
      if (item !== undefined) out[key] = item;
    }
    return out;
  }
  return { xs: value as T };
}

/** Attribute of `slidesToShow` at a breakpoint: `data-ok-slides-to-show` (xs), `…-sm`, `…-md`… */
export const slidesToShowAttr = (breakpoint: CarouselBreakpoint): `data-ok-${string}` =>
  breakpoint === "xs" ? "data-ok-slides-to-show" : `data-ok-slides-to-show-${breakpoint}`;

/**
 * Private custom properties of a carousel root for its slide sizes: one basis per breakpoint
 * (`--_ok-carousel-basis-sm`…, read by the CSS media queries) and the gap. React passes them in
 * `style`; the HTML runtime writes the same through CSSOM from the attributes.
 */
export function carouselStyle(
  slidesToShow: Partial<Record<CarouselBreakpoint, unknown>>,
  slideSpacing: unknown,
): Record<`--_ok-${string}`, string> {
  const style: Record<`--_ok-${string}`, string> = {};
  for (const breakpoint of carouselBreakpoints) {
    const value = parseSlidesToShow(slidesToShow[breakpoint]);
    if (value !== undefined) style[`--_ok-carousel-basis-${breakpoint}`] = slideBasis(value);
  }
  const spacing = parseSlideSpacing(slideSpacing);
  if (spacing !== undefined) style["--_ok-carousel-spacing"] = spacing;
  return style;
}

// --- Behavior settings ---------------------------------------------------------------------------

/** Behavior options the controller reads (root attributes, then matching `breakpoints`). */
export interface CarouselSettings {
  active: boolean;
  align: CarouselAlignName | number;
  axis: CarouselAxis;
  loop: boolean;
  dragFree: boolean;
  draggable: boolean;
  dragThreshold: number;
  skipSnaps: boolean;
  containScroll: CarouselContainScroll;
  slidesToScroll: number | "auto";
  duration: number;
  startIndex: number;
  inViewThreshold: number;
  focus: boolean;
  effect: CarouselEffect;
  autoHeight: boolean;
  heightEvent: CarouselHeightEvent;
  wheelGestures: boolean;
  forceWheelAxis: CarouselAxis | undefined;
  autoplay: boolean;
  autoplayDelay: number;
  autoplayJump: boolean;
  autoScroll: boolean;
  autoScrollSpeed: number;
  autoScrollStartDelay: number;
  autoScrollDirection: CarouselAutoScrollDirection;
  playOnInit: boolean;
  stopOnInteraction: boolean;
  stopOnMouseEnter: boolean;
  stopOnFocusIn: boolean;
  stopOnLastSnap: boolean;
}

export const defaultCarouselSettings: Readonly<CarouselSettings> = {
  active: true,
  align: "center",
  axis: "x",
  loop: false,
  dragFree: false,
  draggable: true,
  dragThreshold: 10,
  skipSnaps: false,
  containScroll: "trimSnaps",
  slidesToScroll: 1,
  duration: 25,
  startIndex: 0,
  inViewThreshold: 0,
  focus: true,
  effect: "none",
  autoHeight: false,
  heightEvent: "select",
  wheelGestures: false,
  forceWheelAxis: undefined,
  autoplay: false,
  autoplayDelay: 4000,
  autoplayJump: false,
  autoScroll: false,
  autoScrollSpeed: 2,
  autoScrollStartDelay: 1000,
  autoScrollDirection: "forward",
  playOnInit: true,
  stopOnInteraction: true,
  stopOnMouseEnter: true,
  stopOnFocusIn: true,
  stopOnLastSnap: false,
};

/** `align` from an attribute or prop: a name, or a fraction 0–1 of the viewport. */
export function parseAlign(value: unknown): CarouselAlignName | number | undefined {
  if (carouselAligns.includes(value as CarouselAlignName)) return value as CarouselAlignName;
  const number = typeof value === "string" && /^\d*\.?\d+$/.test(value) ? Number(value) : value;
  return typeof number === "number" && number >= 0 && number <= 1 ? number : undefined;
}

/** `slidesToScroll`: a whole number ≥ 1 or `"auto"` (as many as fit), else `undefined`. */
export function parseSlidesToScroll(value: unknown): number | "auto" | undefined {
  if (value === "auto") return "auto";
  const number = typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
  return typeof number === "number" && Number.isInteger(number) && number >= 1 ? number : undefined;
}

/** Settings a `breakpoints` entry may override (the others need CSS that media queries can't reach). */
const bool = (v: unknown) => (typeof v === "boolean" ? v : undefined);
const upTo = (max: number) => (v: unknown) =>
  typeof v === "number" && v >= 0 && v <= max ? v : undefined;
const containScroll = (v: unknown) =>
  v === false ? "false" : carouselContainScrolls.find((mode) => mode === v);
const OVERRIDABLE: Record<string, (value: unknown) => unknown> = {
  active: bool,
  align: parseAlign,
  loop: bool,
  dragFree: bool,
  draggable: bool,
  dragThreshold: upTo(1e4),
  skipSnaps: bool,
  containScroll,
  slidesToScroll: parseSlidesToScroll,
  duration: upTo(1e4),
  inViewThreshold: upTo(1),
  autoplay: bool,
  autoScroll: bool,
  wheelGestures: bool,
};

export type CarouselBreakpointOptions = Partial<
  Pick<
    CarouselSettings,
    | "active"
    | "align"
    | "loop"
    | "dragFree"
    | "draggable"
    | "dragThreshold"
    | "skipSnaps"
    | "slidesToScroll"
    | "duration"
    | "inViewThreshold"
    | "autoplay"
    | "autoScroll"
    | "wheelGestures"
  > & { containScroll: CarouselContainScroll | false }
>;

/**
 * Embla's `breakpoints` (media query → options), validated: an object or its JSON (the HTML
 * attribute `data-ok-breakpoints`). Unknown keys, invalid values, long queries and prototype keys
 * are dropped; anything malformed gives `{}`.
 */
export function parseBreakpoints(value: unknown): Record<string, Partial<CarouselSettings>> {
  let source = value;
  if (typeof value === "string") {
    if (value.length > 4000) return {};
    try {
      source = JSON.parse(value);
    } catch {
      return {};
    }
  }
  const out: Record<string, Partial<CarouselSettings>> = Object.create(null);
  if (!source || typeof source !== "object" || Array.isArray(source)) return out;
  for (const [query, options] of Object.entries(source)) {
    if (query.length > 200 || !options || typeof options !== "object") continue;
    const entry: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(options)) {
      const parse = Object.hasOwn(OVERRIDABLE, key) ? OVERRIDABLE[key] : undefined;
      const parsed = parse?.(raw);
      if (parsed !== undefined) entry[key] = parsed;
    }
    out[query] = entry as Partial<CarouselSettings>;
  }
  return out;
}

// --- Snaps ----------------------------------------------------------------------------------------

/** A slide's box along the scroll axis, in scroll coordinates (0 = scrolled to the start). */
export interface SlideBox {
  start: number;
  size: number;
}

/** Slide indexes per scroll step: `slidesToScroll` at a time, or (`auto`) as many as fit. */
export function groupSlides(
  sizes: readonly number[],
  gap: number,
  viewSize: number,
  slidesToScroll: number | "auto",
): number[][] {
  const groups: number[][] = [];
  if (slidesToScroll !== "auto") {
    for (let i = 0; i < sizes.length; i += slidesToScroll) {
      groups.push(sizes.slice(i, i + slidesToScroll).map((_, j) => i + j));
    }
    return groups;
  }
  let current: number[] = [];
  let span = 0;
  sizes.forEach((size, i) => {
    const next = current.length === 0 ? size : span + gap + size;
    if (current.length > 0 && next > viewSize + 0.5) {
      groups.push(current);
      current = [i];
      span = size;
    } else {
      current.push(i);
      span = next;
    }
  });
  if (current.length > 0) groups.push(current);
  return groups;
}

/** Where a group of slides sits in the viewport for an alignment: offset of its start (px). */
export function alignOffset(
  align: CarouselAlign,
  viewSize: number,
  groupSize: number,
  index: number,
): number {
  if (typeof align === "function") return align(viewSize, groupSize, index);
  if (typeof align === "number") return viewSize * align;
  if (align === "start") return 0;
  if (align === "end") return viewSize - groupSize;
  return (viewSize - groupSize) / 2;
}

/** Raw scroll positions of the groups (before containment): `start - alignOffset`. */
export function rawSnaps(
  boxes: readonly SlideBox[],
  groups: readonly (readonly number[])[],
  viewSize: number,
  align: CarouselAlign,
): number[] {
  return groups.map((group, index) => {
    const start = Math.min(...group.map((i) => (boxes[i] as SlideBox).start));
    const end = Math.max(
      ...group.map((i) => (boxes[i] as SlideBox).start + (boxes[i] as SlideBox).size),
    );
    return start - alignOffset(align, viewSize, end - start, index);
  });
}

export interface ContainedSnaps {
  /** Scroll position of each snap. */
  positions: number[];
  /** Snap index of each group. */
  groupSnap: number[];
}

/**
 * Embla's `containScroll`: `trimSnaps` clamps the positions into the scroll range and merges the
 * ones that became equal; `keepSnaps` clamps and keeps them; `false` keeps the raw positions
 * (the controller adds leading / trailing space so they can be reached).
 */
export function containSnaps(
  raw: readonly number[],
  maxScroll: number,
  mode: CarouselContainScroll,
): ContainedSnaps {
  if (mode === "false") return { positions: [...raw], groupSnap: raw.map((_, i) => i) };
  const clamped = raw.map((position) => Math.min(Math.max(position, 0), Math.max(maxScroll, 0)));
  if (mode === "keepSnaps") return { positions: clamped, groupSnap: clamped.map((_, i) => i) };
  const positions: number[] = [];
  const groupSnap = clamped.map((position) => {
    const last = positions[positions.length - 1];
    if (last === undefined || Math.abs(position - last) > 1) positions.push(position);
    return positions.length - 1;
  });
  return { positions, groupSnap };
}

/** The snap nearest to `scroll`; `preferred` wins ties (equal positions with `keepSnaps`). */
export function nearestSnap(positions: readonly number[], scroll: number, preferred = -1): number {
  let best = 0;
  let distance = Number.POSITIVE_INFINITY;
  positions.forEach((position, i) => {
    const d = Math.abs(position - scroll);
    if (d < distance - 0.5) {
      best = i;
      distance = d;
    }
  });
  const kept = positions[preferred];
  if (kept !== undefined && Math.abs(kept - (positions[best] as number)) <= 0.5) return preferred;
  return best;
}

/** Scroll progress 0–1 (bounded) or the wrapped position along the loop (`length` = loop size). */
export function scrollProgress(
  scroll: number,
  maxScroll: number,
  loop?: { origin: number; length: number },
): number {
  if (loop && loop.length > 0) {
    const offset = (((scroll - loop.origin) % loop.length) + loop.length) % loop.length;
    return offset / loop.length;
  }
  if (maxScroll <= 0) return 0;
  return Math.min(Math.max(scroll / maxScroll, 0), 1);
}

/**
 * Visual order of the slides for a loop (CSS `order` values, by slide index): the slides rotate
 * so that `center` (the first slide of the selected group) has about half the others before it.
 * `first` is the slide that comes first.
 */
export function loopOrder(count: number, first: number): number[] {
  return Array.from({ length: count }, (_, i) => (i - first + count) % count);
}

/**
 * The first slide of a loop that centers group `center` (always a group's first slide).
 *
 * Without geometry, half the groups go before it. With `spans` (each group's length, gaps
 * included) and `offset` (the content length that should come before it: the middle of the
 * scroll range plus the group's align offset), the number of groups before it is the one whose
 * length is nearest to `offset`, so the group's snap sits mid-range with room on both sides: a
 * count-based split puts it out of reach when the loop is barely long enough (ADR-0033).
 */
export function loopFirst(
  groups: readonly (readonly number[])[],
  center: number,
  spans?: readonly number[],
  offset = 0,
): number {
  const total = groups.length;
  const half = Math.floor((total - 1) / 2);
  let before = half;
  if (spans) {
    let length = 0;
    let best = Number.POSITIVE_INFINITY;
    for (let count = 0; count < total; count++) {
      if (count > 0) length += spans[(center - count + total * 2) % total] as number;
      const distance = Math.abs(length - offset);
      // Ties keep the count-based split (the same order as without geometry).
      if (
        distance < best - 0.5 ||
        (Math.abs(distance - best) <= 0.5 && Math.abs(count - half) < Math.abs(before - half))
      ) {
        best = Math.min(best, distance);
        before = count;
      }
    }
  }
  const index = (center - before + total * 2) % total;
  return (groups[index] as readonly number[])[0] as number;
}

/** Loop needs content one viewport plus two steps long (ADR-0033). */
export function canLoop(
  sizes: readonly number[],
  gap: number,
  viewSize: number,
  groups: readonly (readonly number[])[],
): boolean {
  if (groups.length < 3) return false;
  const length = sizes.reduce((sum, size) => sum + size + gap, 0);
  const step = Math.max(
    ...groups.map((group) => group.reduce((sum, i) => sum + (sizes[i] as number) + gap, 0)),
  );
  return length - viewSize >= 2 * step - 0.5;
}

/**
 * Tween values of a slide for the opacity / scale / parallax effects: `tween` is 1 at its snap and
 * falls to 0 one step away; `parallax` is the signed distance (−1…1) in steps.
 */
export function slideTween(
  snap: number,
  scroll: number,
  step: number,
): { tween: number; parallax: number } {
  if (step <= 0) return { tween: 1, parallax: 0 };
  const diff = (snap - scroll) / step;
  return {
    tween: Math.min(Math.max(1 - Math.abs(diff), 0), 1),
    parallax: Math.min(Math.max(diff, -1), 1),
  };
}

/** Milliseconds of an animated scroll for Embla's unitless `duration` (25 → 500 ms). */
export const durationMs = (duration: number): number => Math.max(0, duration) * 20;

/** Ease-out (quartic) used by animated scrolls. */
export const easeOut = (t: number): number => 1 - (1 - t) ** 4;

/**
 * Snaps before the first measure (server rendering, snippets): one per group of
 * `slidesToScroll`, trimmed for `slidesToShow` whole slides unless looping or `containScroll` keeps
 * them. The controller reports the measured count once it runs.
 */
export function estimateSnapCount(
  slides: number,
  options: {
    slidesToShow?: unknown;
    slidesToScroll?: unknown;
    loop?: boolean | undefined;
    containScroll?: CarouselContainScroll | undefined;
    effect?: CarouselEffect | undefined;
  } = {},
): number {
  if (slides <= 0) return 0;
  const step = parseSlidesToScroll(options.slidesToScroll);
  const by = typeof step === "number" ? step : 1;
  const show = parseSlidesToShow(options.slidesToShow);
  const visible = typeof show === "number" ? show : 1;
  if (options.effect === "fade") return slides;
  if (options.loop || options.containScroll === "false" || options.containScroll === "keepSnaps") {
    return Math.ceil(slides / by);
  }
  return Math.ceil(Math.max(0, slides - visible) / by) + 1;
}
