/*
 * Scroll progress — spec: specs/components/scroll-progress.md, ADR-0062 (5.2). Framer Motion's
 * `useScroll` (`container`, `target`, `axis`, `offset`) measured here once for every owner, and
 * a controller that shows it on an element through `--_ok-scroll-progress` (0–1):
 *   1. CSS: the stylesheet's `animation-timeline: scroll(root)` (page, no target or offset);
 *   2. native: the engine's `animate()` on a `ScrollTimeline` / `ViewTimeline`;
 *   3. fallback: the same animation paused, its `currentTime` set from a passive, rAF-throttled
 *      scroll listener (Firefox, Safari before 26, offsets no timeline range expresses).
 * Module-scoped state only (ADR-0007).
 */
import { animate, type SpringOptions } from "./animate.js";
import { springValue } from "./values.js";

/** Scroll direction: `y` (vertical, default) or `x` (horizontal). */
export type ScrollAxis = "x" | "y";

/** One edge: `start`, `center`, `end`, a number (0–1 of the size), `<n>px`, `<n>%`, `<n>vw`, `<n>vh`. */
export type ScrollEdgeValue = number | string;

/** Where the target meets the container: `"<target> <container>"` or `[target, container]`. */
export type ScrollIntersection = string | number | readonly [ScrollEdgeValue, ScrollEdgeValue];

/** The intersections at progress 0 and 1. Default `["start start", "end end"]`. */
export type ScrollOffset = readonly [ScrollIntersection, ScrollIntersection];

export interface ScrollOptions {
  /** The scroll container. Default (`null` / absent): the page. */
  container?: Element | null | undefined;
  /** The element whose way through the container is measured. Default: the whole content. */
  target?: Element | null | undefined;
  /** Default `y`. */
  axis?: ScrollAxis | undefined;
  /** Two intersections (an array, or a string with a comma between them). */
  offset?: ScrollOffset | string | undefined;
  /**
   * The progress shown follows the scroll with a spring (Framer's `useSpring` smoothing, 5.4):
   * `true` (stiffness 100, damping 30) or spring options. Only `createScrollProgress` reads it.
   */
  smooth?: boolean | SpringOptions | undefined;
}

/** The spring of `smooth: true` (Framer's documented `useSpring(scrollYProgress)` smoothing). */
export const SCROLL_SMOOTH: SpringOptions = { stiffness: 100, damping: 30, restDelta: 0.001 };

const SPRING_KEYS = [
  "stiffness",
  "damping",
  "mass",
  "bounce",
  "visualDuration",
  "restDelta",
  "restSpeed",
] as const;

/** `data-ok-scroll-smooth`: empty or `true` → on; a JSON object of spring options; else off. */
export function parseScrollSmooth(text: string | null): boolean | SpringOptions | undefined {
  if (text === null) return undefined;
  const value = text.trim();
  if (value === "" || value === "true") return true;
  if (!value.startsWith("{")) return undefined;
  try {
    const data = JSON.parse(value) as Record<string, unknown>;
    const options: SpringOptions = {};
    for (const key of SPRING_KEYS) {
      const item = data[key];
      if (typeof item === "number" && Number.isFinite(item)) options[key] = item;
    }
    return Object.keys(options).length > 0 ? options : true;
  } catch {
    return undefined;
  }
}

/** Framer's `useScroll` values: positions in px and progress (0–1) per axis. */
export interface ScrollInfo {
  scrollX: number;
  scrollY: number;
  scrollXProgress: number;
  scrollYProgress: number;
}

/** `px` + `fraction` × the size + `vw` / `vh` × the viewport (in hundredths). */
interface Edge {
  fraction: number;
  px: number;
  vw: number;
  vh: number;
}

type Intersection = readonly [Edge, Edge];

export interface ParsedScrollOffset {
  intersections: readonly [Intersection, Intersection];
  /** `"<target> <container>"` per intersection when both edges are names, for timeline ranges. */
  names: readonly [string | undefined, string | undefined];
  /** Whether it is the default (`start start, end end`). */
  isDefault: boolean;
}

const NAMED: Record<string, number> = { start: 0, center: 0.5, end: 1 };

const edge = (value: ScrollEdgeValue): Edge | undefined => {
  const empty = { fraction: 0, px: 0, vw: 0, vh: 0 };
  if (typeof value === "number")
    return Number.isFinite(value) ? { ...empty, fraction: value } : undefined;
  const text = value.trim();
  if (text in NAMED) return { ...empty, fraction: NAMED[text] as number };
  const match = /^(-?\d*\.?\d+(?:e-?\d+)?)(px|%|vw|vh)?$/.exec(text);
  if (!match) return undefined;
  const amount = Number(match[1]);
  switch (match[2]) {
    case "px":
      return { ...empty, px: amount };
    case "%":
      return { ...empty, fraction: amount / 100 };
    case "vw":
      return { ...empty, vw: amount };
    case "vh":
      return { ...empty, vh: amount };
    default:
      return { ...empty, fraction: amount };
  }
};

const intersection = (
  input: ScrollIntersection,
): { value: Intersection; name: string | undefined } | undefined => {
  const parts =
    typeof input === "string"
      ? input.trim().split(/\s+/)
      : typeof input === "number"
        ? [input]
        : ([...input] as ScrollEdgeValue[]);
  if (parts.length < 1 || parts.length > 2) return undefined;
  const target = parts[0] as ScrollEdgeValue;
  const container = (parts[1] ?? target) as ScrollEdgeValue;
  const a = edge(target);
  const b = edge(container);
  if (!a || !b) return undefined;
  const named = typeof target === "string" && typeof container === "string";
  const name =
    named && target in NAMED && container in NAMED ? `${target} ${container}` : undefined;
  return { value: [a, b], name };
};

const DEFAULT_OFFSET: ScrollOffset = ["start start", "end end"];

/** Parses an offset (array, or a string with a comma); anything invalid → the default. */
export function parseScrollOffset(input?: ScrollOffset | string | null): ParsedScrollOffset {
  const entries =
    typeof input === "string"
      ? input.split(",").map((part) => part.trim())
      : input
        ? [...input]
        : undefined;
  const parsed = entries?.length === 2 ? entries.map(intersection) : undefined;
  if (!parsed || parsed.some((entry) => entry === undefined))
    return parseScrollOffset(DEFAULT_OFFSET);
  const [first, second] = parsed as [
    NonNullable<(typeof parsed)[0]>,
    NonNullable<(typeof parsed)[0]>,
  ];
  return {
    intersections: [first.value, second.value],
    names: [first.name, second.name],
    isDefault: first.name === "start start" && second.name === "end end",
  };
}

const page = (container: Element | null | undefined): boolean =>
  !container ||
  container === document.documentElement ||
  container === document.scrollingElement ||
  container === document.body;

/** The page's scrolling element (`<html>` in standards mode). */
const pageScroller = () => document.scrollingElement as Element;

const resolveEdge = (edge: Edge, size: number) =>
  edge.px +
  edge.fraction * size +
  (edge.vw * document.documentElement.clientWidth) / 100 +
  (edge.vh * document.documentElement.clientHeight) / 100;

/** Position (px) and progress (0–1) along one axis, as Framer's `useScroll` measures them. */
export function measureScroll(
  options: ScrollOptions & { axis?: ScrollAxis | undefined },
  parsed: ParsedScrollOffset = parseScrollOffset(options.offset),
): { current: number; progress: number } {
  const vertical = options.axis !== "x";
  const isPage = page(options.container);
  const root = isPage ? pageScroller() : (options.container as Element);
  // Right to left: `scrollLeft` runs from 0 to negative values; the progress follows the inline
  // direction, as scroll timelines do.
  const current = Math.abs(vertical ? root.scrollTop : root.scrollLeft);
  const size = vertical ? root.clientHeight : root.clientWidth;
  let start = 0;
  let length = vertical ? root.scrollHeight : root.scrollWidth;
  if (options.target) {
    const box = options.target.getBoundingClientRect();
    const frame = isPage ? undefined : root.getBoundingClientRect();
    const origin = frame
      ? vertical
        ? frame.top + root.clientTop
        : frame.left + root.clientLeft
      : 0;
    start = (vertical ? box.top : box.left) - origin + current;
    length = vertical ? box.height : box.width;
  }
  const at = ([target, container]: Intersection) =>
    start + resolveEdge(target, length) - resolveEdge(container, size);
  const from = at(parsed.intersections[0]);
  const to = at(parsed.intersections[1]);
  // An empty range (nothing to scroll) shows nothing, as an inactive scroll timeline does.
  const progress = to === from ? 0 : Math.min(Math.max((current - from) / (to - from), 0), 1);
  return { current, progress };
}

/**
 * Calls `callback` with both axes now and after each scroll or resize (passive listener, at most
 * once a frame). Returns the function that stops it.
 */
export function observeScroll(
  options: ScrollOptions,
  callback: (info: ScrollInfo) => void,
): () => void {
  const parsed = parseScrollOffset(options.offset);
  const read = () => {
    const x = measureScroll({ ...options, axis: "x" }, parsed);
    const y = measureScroll({ ...options, axis: "y" }, parsed);
    callback({
      scrollX: x.current,
      scrollY: y.current,
      scrollXProgress: x.progress,
      scrollYProgress: y.progress,
    });
  };
  return listen(options, read);
}

/** A passive scroll listener and a ResizeObserver that run `read` at most once a frame. */
function listen(options: ScrollOptions, read: () => void): () => void {
  let frame = 0;
  const schedule = () => {
    if (frame === 0) {
      frame = requestAnimationFrame(() => {
        frame = 0;
        read();
      });
    }
  };
  const source: EventTarget = page(options.container) ? window : (options.container as Element);
  source.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  const resize = new ResizeObserver(schedule);
  resize.observe(
    page(options.container) ? document.documentElement : (options.container as Element),
  );
  if (options.target) resize.observe(options.target);
  read();
  return () => {
    cancelAnimationFrame(frame);
    frame = 0;
    source.removeEventListener("scroll", schedule);
    window.removeEventListener("resize", schedule);
    resize.disconnect();
  };
}

interface TimelineConstructors {
  ScrollTimeline?: new (options: { source: Element; axis: ScrollAxis }) => AnimationTimeline;
  ViewTimeline?: new (options: { subject: Element; axis: ScrollAxis }) => AnimationTimeline;
}

const constructors = () => globalThis as unknown as TimelineConstructors;

/**
 * Whether scroll-driven animations run natively (`ScrollTimeline`, `ViewTimeline` and CSS
 * `animation-timeline`: Chrome 115+, Safari 26+; not Firefox).
 */
export function supportsScrollTimeline(): boolean {
  const { ScrollTimeline, ViewTimeline } = constructors();
  return (
    typeof ScrollTimeline === "function" &&
    typeof ViewTimeline === "function" &&
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("animation-timeline", "scroll()")
  );
}

/** Named intersections that a view timeline range expresses exactly. */
const RANGES: Record<string, string> = {
  "start end": "cover 0%",
  "end end": "entry-crossing 100%",
  "start start": "exit-crossing 0%",
  "end start": "cover 100%",
};

/** The element that scrolls `element` (the page's scroller when none of its ancestors does). */
function scrollParent(element: Element): Element {
  for (let node = element.parentElement; node; node = node.parentElement) {
    if (node === document.body || node === document.documentElement) break;
    const style = getComputedStyle(node);
    if (/(auto|scroll|hidden)/.test(`${style.overflowX} ${style.overflowY}`)) return node;
  }
  return pageScroller();
}

/** The attribute names (HTML) of the scroll options. */
export const SCROLL_ATTRIBUTES = {
  root: "data-ok-scroll-progress",
  axis: "data-ok-scroll-axis",
  container: "data-ok-scroll-container",
  target: "data-ok-scroll-target",
  offset: "data-ok-scroll-offset",
  smooth: "data-ok-scroll-smooth",
} as const;

/** HTML: the scroll options of an element (ids → elements; unknown ids → absent). */
export function readScrollProgress(element: Element): ScrollOptions {
  const byId = (attribute: string) => {
    const id = element.getAttribute(attribute);
    return id ? element.ownerDocument.getElementById(id) : null;
  };
  return {
    container: byId(SCROLL_ATTRIBUTES.container),
    target: byId(SCROLL_ATTRIBUTES.target),
    axis: element.getAttribute(SCROLL_ATTRIBUTES.axis) === "x" ? "x" : "y",
    offset: element.getAttribute(SCROLL_ATTRIBUTES.offset) ?? undefined,
    smooth: parseScrollSmooth(element.getAttribute(SCROLL_ATTRIBUTES.smooth)),
  };
}

export type ScrollProgressMode = "css" | "native" | "fallback";

export interface ScrollProgressController {
  /** How the progress is drawn: the stylesheet, a native timeline or the script fallback. */
  readonly mode: ScrollProgressMode;
  /** The progress now (0–1), measured. */
  readonly progress: number;
  /** Fallback: measures and redraws now (the controller also does it on scroll and resize). */
  update(): void;
  /** Stops following the scroll and removes what the controller wrote. */
  destroy(): void;
}

const PROPERTY = "--_ok-scroll-progress";
/** The fallback's paused animation: its `currentTime` is the progress × this. */
const LENGTH = 1000;
const KEYFRAMES: Keyframe[] = [{ [PROPERTY]: "0" }, { [PROPERTY]: "1" }];

/**
 * Shows the scroll progress of `options` on `element` through `--_ok-scroll-progress` (the
 * scroll-progress stylesheet feeds it to Linear and Circular progress). See the spec for the
 * three paths.
 */
export function createScrollProgress(
  element: HTMLElement,
  options: ScrollOptions = {},
): ScrollProgressController {
  const axis: ScrollAxis = options.axis === "x" ? "x" : "y";
  const parsed = parseScrollOffset(options.offset);
  const isPage = page(options.container);
  const scroller = isPage ? pageScroller() : (options.container as Element);
  // Smoothing runs a spring in script on every scroll: neither the stylesheet nor a timeline.
  const smooth = options.smooth
    ? options.smooth === true
      ? SCROLL_SMOOTH
      : options.smooth
    : undefined;
  const native = supportsScrollTimeline() && !smooth;
  const measure = () => measureScroll({ ...options, axis }, parsed).progress;

  const plain =
    isPage &&
    !options.target &&
    parsed.isDefault &&
    element.hasAttribute(SCROLL_ATTRIBUTES.root) &&
    !element.hasAttribute(SCROLL_ATTRIBUTES.container) &&
    !element.hasAttribute(SCROLL_ATTRIBUTES.target) &&
    !element.hasAttribute(SCROLL_ATTRIBUTES.offset) &&
    !element.hasAttribute(SCROLL_ATTRIBUTES.smooth);
  if (native && plain) {
    return {
      mode: "css",
      get progress() {
        return measure();
      },
      update() {},
      destroy() {},
    };
  }

  const { ScrollTimeline, ViewTimeline } = constructors();
  let timeline: AnimationTimeline | undefined;
  let range: { rangeStart: string; rangeEnd: string } | undefined;
  if (native && ScrollTimeline && ViewTimeline) {
    if (!options.target && parsed.isDefault) {
      timeline = new ScrollTimeline({ source: scroller, axis });
    } else if (options.target) {
      const [first, second] = parsed.names;
      const rangeStart = first ? RANGES[first] : undefined;
      const rangeEnd = second ? RANGES[second] : undefined;
      if (rangeStart && rangeEnd && scrollParent(options.target) === scroller) {
        timeline = new ViewTimeline({ subject: options.target, axis });
        range = { rangeStart, rangeEnd };
      }
    }
  }

  const controls = animate(element, KEYFRAMES, {
    duration: LENGTH,
    ease: "linear",
    reducedMotion: "never",
    ...(timeline ? { timeline, ...range } : {}),
  });
  if (timeline) {
    return {
      mode: "native",
      get progress() {
        return measure();
      },
      update() {},
      destroy() {
        controls.cancel();
      },
    };
  }

  controls.pause();
  element.setAttribute("data-ok-fallback", "");
  let progress = 0;
  const show = (value: number) => {
    for (const animation of controls.animations) animation.currentTime = value * LENGTH;
  };
  // Smooth: the bar follows a spring whose target is the measured progress (reduced motion: none).
  const spring = smooth ? springValue(measure(), smooth) : undefined;
  spring?.on("change", show);
  const draw = () => {
    progress = measure();
    if (spring) spring.set(progress);
    else show(progress);
  };
  if (spring) show(spring.get());
  const stop = listen(options, draw);
  return {
    mode: "fallback",
    get progress() {
      return progress;
    },
    update: draw,
    destroy() {
      stop();
      spring?.destroy();
      controls.cancel();
      element.removeAttribute("data-ok-fallback");
    },
  };
}
