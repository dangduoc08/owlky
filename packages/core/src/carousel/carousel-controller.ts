/*
 * Carousel behavior (ADR-0033), shared by React and the HTML runtime. The viewport is a native
 * scroll container with CSS scroll snapping; this controller reads the options from the root's
 * attributes, measures, computes the snaps (Embla's align / containScroll / slidesToScroll) and
 * writes what follows from the scroll position: the selected snap on slides, dots, thumbnails,
 * arrows, counter, live region and progress (attributes React never renders after the first
 * render). It adds what the browser lacks: animated scrolls, mouse dragging, wheel gestures,
 * keys, loop (by reordering, no clones), fade, tween effects, auto height, autoplay and auto
 * scroll. App state stays with the owner: the controller only reports changes through callbacks.
 */

import { carouselOptions } from "../anatomy/anatomy.js";
import { readBehavior, readNumber, readStyle } from "../options/define.js";
import {
  type CarouselAlign,
  type CarouselSettings,
  canLoop,
  containSnaps,
  defaultCarouselSettings,
  durationMs,
  easeOut,
  groupSlides,
  loopFirst,
  loopOrder,
  nearestSnap,
  parseAlign,
  parseBreakpoints,
  parseSlidesToScroll,
  rawSnaps,
  type SlideBox,
  scrollProgress,
  slideTween,
} from "./carousel-model.js";

export interface CarouselControllerOptions {
  /** React: a function `align` (overrides the attribute). */
  align?: (() => CarouselAlign | undefined) | undefined;
  /** The selected snap changed (scroll, swipe, buttons, keys, autoplay). */
  onSelect?(index: number, previous: number): void;
  /** Scrolling came to rest. */
  onSettle?(index: number): void;
  /** Scroll progress 0–1 (once per frame while scrolling). */
  onScroll?(progress: number): void;
  /** Slides in view changed. */
  onSlidesInView?(indexes: number[]): void;
  /** The carousel measured again (size, slides or options changed): the number of snaps. */
  onReInit?(snapCount: number): void;
  /** Autoplay started or stopped. */
  onAutoplay?(playing: boolean): void;
  /** Auto scroll started or stopped. */
  onAutoScroll?(playing: boolean): void;
  /** An element inside slide `index` got focus. */
  onSlideFocus?(index: number): void;
  /** A pointer went down on / up from the viewport. */
  onPointerDown?(): void;
  onPointerUp?(): void;
}

/** Autoplay methods (Embla Autoplay plugin). */
export interface CarouselAutoplayApi {
  play(jump?: boolean): void;
  stop(): void;
  reset(): void;
  isPlaying(): boolean;
  /** Milliseconds until the next snap, or `null` when not playing. */
  timeUntilNext(): number | null;
}

/** Auto scroll methods (Embla Auto Scroll plugin). */
export interface CarouselAutoScrollApi {
  play(startDelay?: number): void;
  stop(): void;
  reset(): void;
  isPlaying(): boolean;
}

/** The carousel API (Embla's methods, v8 names). */
export interface CarouselApi {
  scrollNext(jump?: boolean): void;
  scrollPrev(jump?: boolean): void;
  scrollTo(index: number, jump?: boolean): void;
  canScrollNext(): boolean;
  canScrollPrev(): boolean;
  selectedScrollSnap(): number;
  previousScrollSnap(): number;
  /** Progress 0–1 of every snap. */
  scrollSnapList(): number[];
  scrollProgress(): number;
  slidesInView(): number[];
  slidesNotInView(): number[];
  slideNodes(): HTMLElement[];
  rootNode(): HTMLElement;
  containerNode(): HTMLElement | null;
  /** Measures again and re-reads the options. */
  reInit(): void;
  autoplay: CarouselAutoplayApi;
  autoScroll: CarouselAutoScrollApi;
}

export interface CarouselController extends CarouselApi {
  destroy(): void;
}

const ROOT = "[data-ok-carousel]";
const SLIDE = "[data-ok-carousel-slide]";
const FORM_FIELD = "input, textarea, select, [contenteditable]:not([contenteditable='false'])";
/** Root flags written by the controller. */
export const CAROUSEL_FLAGS = {
  ready: "data-ok-ready",
  looping: "data-ok-looping",
  dragging: "data-ok-dragging",
  pointerDown: "data-ok-pointer-down",
  scrolling: "data-ok-scrolling",
  autoScrolling: "data-ok-auto-scrolling",
  playing: "data-ok-playing",
} as const;
/** Root attributes that re-initialize the carousel when they change. */
export const CAROUSEL_OBSERVED = [
  ...Object.values(carouselOptions.options)
    .map((option) => option.attr)
    .filter((attr) => attr.startsWith("data-ok-") && attr !== "data-ok-snapped"),
  "data-ok-breakpoints",
  "data-ok-slides-to-show-sm",
  "data-ok-slides-to-show-md",
  "data-ok-slides-to-show-lg",
  "data-ok-slides-to-show-xl",
  "dir",
];

const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Writes the text of a counter / live region in place (React keeps its text node). */
function writeText(element: Element, text: string) {
  const first = element.firstChild;
  if (first && first.nodeType === 3 && element.childNodes.length === 1) {
    if (first.nodeValue !== text) first.nodeValue = text;
  } else if (element.textContent !== text) element.textContent = text;
}

const toggle = (element: Element, name: string, on: boolean, value = "") => {
  if (on) {
    if (element.getAttribute(name) !== value) element.setAttribute(name, value);
  } else if (element.hasAttribute(name)) element.removeAttribute(name);
};

/** Reads the behavior settings of a carousel root, then applies matching `breakpoints`. */
export function readCarouselSettings(root: Element): CarouselSettings {
  const o = carouselOptions.options;
  const flag = (attr: string) => root.hasAttribute(attr);
  // These number options have numeric defaults and no units: the value is always a number.
  const num = (spec: Parameters<typeof readNumber>[1]) => Number(readNumber(root, spec));
  const d = defaultCarouselSettings;
  const settings: CarouselSettings = {
    active: readBehavior(root, o.active),
    align: parseAlign(root.getAttribute(o.align.attr)) ?? d.align,
    axis: readStyle(root, o.axis),
    loop: flag(o.loop.attr),
    dragFree: flag(o.dragFree.attr),
    draggable: readBehavior(root, o.draggable),
    dragThreshold: num(o.dragThreshold),
    skipSnaps: flag(o.skipSnaps.attr),
    containScroll: readStyle(root, o.containScroll),
    slidesToScroll: parseSlidesToScroll(root.getAttribute(o.slidesToScroll.attr)) ?? 1,
    duration: num(o.duration),
    startIndex: Math.floor(num(o.startIndex)),
    inViewThreshold: Math.min(num(o.inViewThreshold), 1),
    focus: readBehavior(root, o.focus),
    effect: readStyle(root, o.effect),
    autoHeight: flag(o.autoHeight.attr),
    heightEvent: readStyle(root, o.heightEvent),
    wheelGestures: flag(o.wheelGestures.attr),
    forceWheelAxis: root.hasAttribute(o.forceWheelAxis.attr)
      ? readStyle(root, o.forceWheelAxis)
      : undefined,
    autoplay: flag(o.autoplay.attr),
    autoplayDelay: num(o.autoplayDelay),
    autoplayJump: flag(o.autoplayJump.attr),
    autoScroll: flag(o.autoScroll.attr),
    autoScrollSpeed: num(o.autoScrollSpeed),
    autoScrollStartDelay: num(o.autoScrollStartDelay),
    autoScrollDirection: readStyle(root, o.autoScrollDirection),
    playOnInit: readBehavior(root, o.playOnInit),
    stopOnInteraction: readBehavior(root, o.stopOnInteraction),
    stopOnMouseEnter: readBehavior(root, o.stopOnMouseEnter),
    stopOnFocusIn: readBehavior(root, o.stopOnFocusIn),
    stopOnLastSnap: flag(o.stopOnLastSnap.attr),
  };
  const breakpoints = parseBreakpoints(root.getAttribute("data-ok-breakpoints"));
  for (const [query, overrides] of Object.entries(breakpoints)) {
    if (matchMedia(query).matches) Object.assign(settings, overrides);
  }
  return settings;
}

/**
 * Connects the carousel `root` (`[data-ok-carousel]`): its viewport (`[data-ok-carousel-viewport]`),
 * container and slides, and every control inside the root — prev / next buttons, dots,
 * thumbnails, counter, progress bars, live region and the play button.
 */
export function createCarouselController(
  root: HTMLElement,
  options: CarouselControllerOptions = {},
): CarouselController {
  const abort = new AbortController();
  const { signal } = abort;
  const own = <E extends Element>(element: E | null): E | null =>
    element && element.closest(ROOT) === root ? element : null;
  const all = <E extends Element = HTMLElement>(selector: string): E[] =>
    [...root.querySelectorAll<E>(selector)].filter((element) => own(element) === element);
  // The parts are found once; a carousel without them works on detached stand-ins (no slides).
  const foundContainer = all("[data-ok-carousel-container]")[0] ?? null;
  const area = all("[data-ok-carousel-viewport]")[0] ?? document.createElement("div");
  const box = foundContainer ?? document.createElement("div");
  const slides = () => [...box.children].filter((child) => child.matches(SLIDE)) as HTMLElement[];

  let settings = readCarouselSettings(root);
  let slideList: HTMLElement[] = [];
  let boxes: SlideBox[] = [];
  let groups: number[][] = [];
  /** Group index of each slide. */
  let groupOf: number[] = [];
  let groupSnap: number[] = [];
  let positions: number[] = [];
  let snapOfSlide: number[] = [];
  let looping = false;
  let firstSlide = 0;
  let gap = 0;
  let viewSize = 0;
  let maxScroll = 0;
  let selected = 0;
  let previous = 0;
  let snapCount = -1;
  let inView = new Set<number>();
  let userMove = false;
  let initialized = false;

  // --- Geometry ------------------------------------------------------------------------------

  const vertical = () => settings.axis === "y";
  const rtl = () => !vertical() && getComputedStyle(root).direction === "rtl";
  const getScroll = () =>
    vertical() ? area.scrollTop : rtl() ? -area.scrollLeft : area.scrollLeft;
  const setScroll = (value: number) => {
    if (vertical()) area.scrollTop = value;
    else area.scrollLeft = rtl() ? -value : value;
  };
  const measureBoxes = (): SlideBox[] => {
    const view = area.getBoundingClientRect();
    const scroll = getScroll();
    const isRtl = rtl();
    return slideList.map((slide) => {
      const box = slide.getBoundingClientRect();
      if (vertical())
        return { start: box.top - view.top - area.clientTop + scroll, size: box.height };
      if (isRtl) {
        const right = view.left + area.clientLeft + area.clientWidth;
        return { start: right - box.right + scroll, size: box.width };
      }
      return { start: box.left - view.left - area.clientLeft + scroll, size: box.width };
    });
  };
  const alignSetting = (): CarouselAlign => options.align?.() ?? settings.align;
  const fade = () => settings.effect === "fade";

  /** Writes each slide's snap alignment so the browser's snaps equal the computed ones. */
  const writeSnapAreas = () => {
    const align = alignSetting();
    slideList.forEach((slide, i) => {
      const group = groupOf[i] as number;
      const items = groups[group] as number[];
      const first = items[0] === i;
      const last = items[items.length - 1] === i;
      let value = "none";
      let startMargin = 0;
      let endMargin = 0;
      const span = () => {
        const a = boxes[items[0] as number] as SlideBox;
        const b = boxes[items[items.length - 1] as number] as SlideBox;
        return b.start + b.size - a.start;
      };
      if (typeof align === "number" || typeof align === "function") {
        if (first) {
          value = "start";
          startMargin = alignOffsetValue(align, span(), group);
        }
      } else if (align === "start" && first) value = "start";
      else if (align === "end" && last) value = "end";
      else if (align === "center" && first) {
        value = "center";
        endMargin = span() - (boxes[i] as SlideBox).size;
      }
      slide.style.setProperty("--_ok-carousel-snap-align", value);
      slide.style.setProperty("--_ok-carousel-snap-start", `${startMargin}px`);
      slide.style.setProperty("--_ok-carousel-snap-end", `${endMargin}px`);
    });
  };
  const alignOffsetValue = (align: CarouselAlign, span: number, index: number) => {
    if (typeof align === "function") return align(viewSize, span, index);
    if (typeof align === "number") return viewSize * align;
    return 0;
  };

  /** Measures and computes groups and snaps (no scrolling). */
  const measureMax = () =>
    vertical() ? area.scrollHeight - area.clientHeight : area.scrollWidth - area.clientWidth;
  const layout = () => {
    slideList = slides();
    const style = getComputedStyle(box);
    gap = Number.parseFloat(vertical() ? style.rowGap : style.columnGap) || 0;
    viewSize = vertical() ? area.clientHeight : area.clientWidth;
    box.style.setProperty("--_ok-carousel-lead", "0px");
    box.style.setProperty("--_ok-carousel-trail", "0px");
    boxes = measureBoxes();
    const sizes = boxes.map((b) => b.size);
    groups = fade()
      ? slideList.map((_, i) => [i])
      : groupSlides(sizes, gap, viewSize, settings.slidesToScroll);
    groupOf = [];
    groups.forEach((items, g) => {
      for (const i of items) groupOf[i] = g;
    });
    looping = settings.loop && !fade() && canLoop(sizes, gap, viewSize, groups);
    toggle(root, CAROUSEL_FLAGS.looping, looping);
    if (!looping) {
      firstSlide = 0;
      for (const slide of slideList) slide.style.removeProperty("--_ok-carousel-order");
      boxes = measureBoxes();
    }
    writeSnapAreas();
    computeSnaps();
  };

  const computeSnaps = () => {
    maxScroll = measureMax();
    if (fade() || slideList.length === 0) {
      positions = groups.map(() => 0);
      groupSnap = groups.map((_, i) => i);
    } else {
      const raw = rawSnaps(boxes, groups, viewSize, alignSetting());
      if (looping) {
        positions = raw;
        groupSnap = raw.map((_, i) => i);
      } else if (settings.containScroll === "false") {
        const lead = Math.max(0, -Math.min(...raw));
        const trail = Math.max(0, Math.max(...raw) - maxScroll);
        box.style.setProperty("--_ok-carousel-lead", `${lead}px`);
        box.style.setProperty("--_ok-carousel-trail", `${trail}px`);
        boxes = measureBoxes();
        maxScroll = measureMax();
        const contained = containSnaps(
          rawSnaps(boxes, groups, viewSize, alignSetting()),
          maxScroll,
          "false",
        );
        positions = contained.positions;
        groupSnap = contained.groupSnap;
      } else {
        const contained = containSnaps(raw, maxScroll, settings.containScroll);
        positions = contained.positions;
        groupSnap = contained.groupSnap;
      }
    }
    snapOfSlide = slideList.map((_, i) => groupSnap[groupOf[i] as number] as number);
  };

  /** Loop: rotates the visual order around `center` and keeps the view where it was. */
  const recenter = (center = selected) => {
    if (!looping) return;
    // While looping every group is its own snap.
    const first = loopFirst(groups, center);
    if (first === firstSlide) return;
    const anchor = (groups[center] as number[])[0] as number;
    const before = (boxes[anchor] as SlideBox).start;
    const scroll = getScroll();
    firstSlide = first;
    loopOrder(slideList.length, first).forEach((order, i) => {
      (slideList[i] as HTMLElement).style.setProperty("--_ok-carousel-order", String(order));
    });
    boxes = measureBoxes();
    const after = (boxes[anchor] as SlideBox).start;
    setScroll(scroll + after - before);
    if (drag) drag.startScroll += after - before;
    computeSnaps();
  };
  /** Loop: recenters when the view comes within one step of an edge. */
  const recenterNearEdge = () => {
    if (!looping) return;
    const scroll = getScroll();
    const step = Math.max(...groups.map((g) => groupSpan(g)), 1);
    if (scroll < step || scroll > maxScroll - step) {
      recenter(nearestSnap(positions, scroll, selected));
    }
  };
  const groupSpan = (group: readonly number[]) =>
    group.reduce((sum, i) => sum + (boxes[i] as SlideBox).size + gap, 0);

  // --- Selection and DOM state ---------------------------------------------------------------

  const count = () => positions.length;
  /** The dots / thumbnails of one group, in order. */
  const itemsOf = (group: Element, selector: string) =>
    [...group.querySelectorAll<HTMLElement>(selector)].filter((item) => own(item) === item);
  const snappedSlides = () => slideList.flatMap((_, i) => (snapOfSlide[i] === selected ? [i] : []));
  const canNext = () => settings.active && count() > 1 && (looping || selected < count() - 1);
  const canPrev = () => settings.active && count() > 1 && (looping || selected > 0);

  const sync = () => {
    const total = count();
    slideList.forEach((slide, i) => {
      toggle(slide, "data-ok-snapped", snapOfSlide[i] === selected);
      toggle(slide, "data-ok-in-view", inView.has(i));
    });
    for (const group of all("[data-ok-carousel-dots]")) {
      itemsOf(group, "[data-ok-carousel-dot]").forEach((dot, i) => {
        toggle(dot, "aria-current", i === selected, "true");
      });
    }
    for (const group of all("[data-ok-carousel-thumbs]")) {
      itemsOf(group, "[data-ok-carousel-thumb]").forEach((thumb, i) => {
        toggle(thumb, "aria-current", snapOfSlide[i] === selected, "true");
      });
    }
    for (const button of all("[data-ok-carousel-prev]"))
      toggle(button, "aria-disabled", !canPrev(), "true");
    for (const button of all("[data-ok-carousel-next]"))
      toggle(button, "aria-disabled", !canNext(), "true");
    for (const counter of all("[data-ok-carousel-counter]"))
      writeText(counter, total > 0 ? `${selected + 1}/${total}` : "");
    revealThumb();
    syncProgress();
  };

  const revealThumb = () => {
    for (const list of all("[data-ok-carousel-thumbs]")) {
      const thumb = [...list.querySelectorAll<HTMLElement>("[data-ok-carousel-thumb]")].find(
        (item) => item.getAttribute("aria-current") === "true",
      );
      if (!thumb) continue;
      const column = list.getAttribute("data-ok-orientation") === "vertical";
      const a = list.getBoundingClientRect();
      const b = thumb.getBoundingClientRect();
      const behavior: ScrollBehavior = reducedMotion() || !initialized ? "auto" : "smooth";
      if (column) {
        if (b.top < a.top) list.scrollBy({ top: b.top - a.top, behavior });
        else if (b.bottom > a.bottom) list.scrollBy({ top: b.bottom - a.bottom, behavior });
      } else if (b.left < a.left) list.scrollBy({ left: b.left - a.left, behavior });
      else if (b.right > a.right) list.scrollBy({ left: b.right - a.right, behavior });
    }
  };

  const progressValue = () => {
    if (fade()) return selected / Math.max(count() - 1, 1);
    if (looping) {
      const length = slideList.reduce((sum, _, i) => sum + (boxes[i] as SlideBox).size + gap, 0);
      return scrollProgress(getScroll(), maxScroll, { origin: positions[0] as number, length });
    }
    return scrollProgress(getScroll(), maxScroll);
  };
  const syncProgress = () => {
    const value = progressValue();
    for (const bar of all("[data-ok-carousel-progress]")) {
      if (bar.getAttribute("data-ok-variant") === "autoplay") continue;
      bar.style.setProperty("--_ok-carousel-progress", value.toFixed(4));
    }
  };

  const announce = () => {
    const live = all("[data-ok-carousel-live]");
    if (live.length === 0 || !userMove) return;
    const slide = slideList[snappedSlides()[0] as number] as HTMLElement;
    const text = [slide.getAttribute("aria-roledescription"), slide.getAttribute("aria-label")]
      .filter(Boolean)
      .join(" ");
    for (const region of live) writeText(region, text);
  };

  const select = (index: number) => {
    if (index === selected) return;
    previous = selected;
    selected = index;
    if (fade()) setInView(new Set(snappedSlides()));
    sync();
    announce();
    syncHeight();
    options.onSelect?.(selected, previous);
    if (autoplayState.playing && !autoplayState.paused) scheduleAutoplay(settings.autoplayDelay);
  };

  // --- Scrolling -----------------------------------------------------------------------------

  let animation = 0;
  let animating = false;
  const cancelAnimation = () => {
    if (animation) cancelAnimationFrame(animation);
    animation = 0;
    if (animating) {
      animating = false;
      root.removeAttribute(CAROUSEL_FLAGS.scrolling);
    }
  };

  const animateTo = (target: number, jump: boolean) => {
    cancelAnimation();
    const from = getScroll();
    const ms = durationMs(settings.duration);
    if (jump || ms === 0 || reducedMotion() || Math.abs(target - from) < 1) {
      setScroll(target);
      onScrollFrame();
      settle();
      return;
    }
    animating = true;
    root.setAttribute(CAROUSEL_FLAGS.scrolling, "");
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      setScroll(from + (target - from) * easeOut(t));
      onScrollFrame();
      if (t < 1) animation = requestAnimationFrame(step);
      else {
        animation = 0;
        animating = false;
        root.removeAttribute(CAROUSEL_FLAGS.scrolling);
        settle();
      }
    };
    animation = requestAnimationFrame(step);
  };

  const scrollTo = (index: number, jump = false) => {
    if (!settings.active || count() === 0) return;
    const total = count();
    const target = looping
      ? ((index % total) + total) % total
      : Math.min(Math.max(Math.trunc(index), 0), total - 1);
    if (fade()) {
      select(target);
      settle();
      return;
    }
    if (looping) recenter(selected);
    select(target);
    animateTo(positions[target] as number, jump);
  };

  let frame = 0;
  const onScrollFrame = () => {
    if (!animating && count() > 0 && !fade()) select(nearestSnap(positions, getScroll(), selected));
    syncProgress();
    writeTweens();
    options.onScroll?.(progressValue());
  };
  const onScroll = () => {
    scheduleSettle();
    if (frame || animating) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      onScrollFrame();
      if (!autoScrollState.running) recenterNearEdge();
    });
  };

  /*
   * Settling: 120 ms after the last scroll event (the same in every engine; Safari 17 has no
   * `scrollend`). Our own animations settle when they end; the scroll event their last frame
   * fires doesn't settle again at the same place.
   */
  let settleTimer = 0;
  let settledAt = Number.NaN;
  const scheduleSettle = () => {
    clearTimeout(settleTimer);
    settleTimer = window.setTimeout(() => {
      if (!(Math.abs(getScroll() - settledAt) < 1)) settle();
    }, 120);
  };
  const settle = () => {
    if (drag || animating) return;
    settledAt = getScroll();
    if (looping && !autoScrollState.running) recenter(selected);
    userMove = false;
    syncHeight();
    options.onSettle?.(selected);
    if (autoplayState.interactionPaused) {
      autoplayState.interactionPaused = false;
      resumeAutoplay();
    }
  };

  const writeTweens = () => {
    const effect = settings.effect;
    if (effect !== "opacity" && effect !== "scale" && effect !== "parallax") return;
    const scroll = getScroll();
    slideList.forEach((slide, i) => {
      const snap = positions[snapOfSlide[i] as number] as number;
      const own = rawSnaps(boxes, [[i]], viewSize, alignSetting())[0] as number;
      const position = looping ? own : snap;
      const step = (boxes[i] as SlideBox).size + gap;
      const { tween, parallax } = slideTween(position, scroll, step);
      slide.style.setProperty("--_ok-carousel-tween", tween.toFixed(3));
      slide.style.setProperty("--_ok-carousel-parallax", parallax.toFixed(3));
    });
  };

  // --- Height and in view ---------------------------------------------------------------------

  const syncHeight = () => {
    if (!settings.autoHeight || vertical()) {
      area.style.removeProperty("--_ok-carousel-height");
      return;
    }
    const heights = slideList
      .filter((_, i) =>
        settings.heightEvent === "slidesInView" && inView.size > 0
          ? inView.has(i)
          : snapOfSlide[i] === selected,
      )
      .map((slide) => slide.offsetHeight);
    if (heights.length > 0)
      area.style.setProperty("--_ok-carousel-height", `${Math.max(...heights)}px`);
  };

  let intersection: IntersectionObserver | null = null;
  const observeInView = () => {
    intersection?.disconnect();
    intersection = null;
    if (fade()) {
      setInView(new Set(snappedSlides()));
      return;
    }
    // The first state is measured at once (the observer reports later, then every change).
    const scroll = getScroll();
    const visible = new Set<number>(
      boxes.flatMap((box, i) => {
        const shown =
          Math.min(box.start + box.size, scroll + viewSize) - Math.max(box.start, scroll);
        const ratio = shown / box.size;
        return ratio > 0 && ratio >= settings.inViewThreshold ? [i] : [];
      }),
    );
    setInView(new Set(visible));
    intersection = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = slideList.indexOf(entry.target as HTMLElement);
          const threshold = settings.inViewThreshold;
          const shown = entry.isIntersecting && entry.intersectionRatio >= threshold;
          // Threshold 0: a slide that only touches the edge isn't in view.
          if (shown && (threshold > 0 || entry.intersectionRatio > 0)) visible.add(index);
          else visible.delete(index);
        }
        setInView(new Set(visible));
      },
      {
        root: area,
        threshold: settings.inViewThreshold > 0 ? settings.inViewThreshold : [0, 0.01],
      },
    );
    for (const slide of slideList) intersection.observe(slide);
  };
  const setInView = (next: Set<number>) => {
    const same = next.size === inView.size && [...next].every((i) => inView.has(i));
    inView = next;
    if (same) return;
    slideList.forEach((slide, i) => {
      toggle(slide, "data-ok-in-view", inView.has(i));
    });
    if (settings.heightEvent === "slidesInView") syncHeight();
    options.onSlidesInView?.([...inView].sort((a, b) => a - b));
  };

  // --- Pointer: mouse drag, fade swipes, interactions -----------------------------------------

  interface DragState {
    pointer: number;
    start: number;
    startScroll: number;
    startSnap: number;
    moved: number;
    points: { t: number; p: number }[];
    native: boolean;
  }
  let drag: DragState | null = null;
  const axisPoint = (event: PointerEvent) => (vertical() ? event.clientY : event.clientX);

  const onPointerDown = (event: PointerEvent) => {
    if (!settings.active || event.button !== 0) return;
    if ((event.target as Element).closest(FORM_FIELD)) return;
    root.setAttribute(CAROUSEL_FLAGS.pointerDown, "");
    options.onPointerDown?.();
    interaction("pointerdown");
    if (!settings.draggable) return;
    const native = event.pointerType !== "mouse" && !fade();
    cancelAnimation();
    drag = {
      pointer: event.pointerId,
      start: axisPoint(event),
      startScroll: getScroll(),
      startSnap: selected,
      moved: 0,
      points: [{ t: event.timeStamp, p: axisPoint(event) }],
      native,
    };
    if (!native) {
      if (event.pointerType === "mouse") event.preventDefault();
      try {
        area.setPointerCapture(event.pointerId);
      } catch {
        // A pointer that is already gone (or synthetic) can't be captured; dragging still works.
      }
    }
  };
  const onPointerMove = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.pointer || drag.native) return;
    const point = axisPoint(event);
    const delta = point - drag.start;
    drag.moved = Math.max(drag.moved, Math.abs(delta));
    drag.points.push({ t: event.timeStamp, p: point });
    if (drag.points.length > 6) drag.points.shift();
    if (fade()) return;
    if (drag.moved > 2) root.setAttribute(CAROUSEL_FLAGS.dragging, "");
    const sign = rtl() ? 1 : -1;
    setScroll(drag.startScroll + sign * delta);
    recenterNearEdge();
    onScrollFrame();
  };
  const onPointerUp = (event: PointerEvent) => {
    if (root.hasAttribute(CAROUSEL_FLAGS.pointerDown)) {
      root.removeAttribute(CAROUSEL_FLAGS.pointerDown);
      options.onPointerUp?.();
    }
    if (!drag || event.pointerId !== drag.pointer) return;
    const state = drag;
    drag = null;
    root.removeAttribute(CAROUSEL_FLAGS.dragging);
    if (state.native) return;
    const first = state.points[0] as { t: number; p: number };
    const last = state.points[state.points.length - 1] as { t: number; p: number };
    const dt = Math.max(last.t - first.t, 16);
    const sign = rtl() ? 1 : -1;
    const velocity = (sign * (last.p - first.p)) / dt; // scroll px per ms
    const delta = sign * (axisPoint(event) - state.start);
    if (state.moved > settings.dragThreshold) suppressClick();
    userMove = true;
    if (fade()) {
      const threshold = Math.max(settings.dragThreshold, 0.1 * viewSize, 20);
      // scrollTo clamps: a swipe past either end stays.
      if (delta > threshold) scrollTo(selected + 1);
      else if (delta < -threshold) scrollTo(selected - 1);
      return;
    }
    const scroll = getScroll();
    if (settings.dragFree) {
      const target = Math.min(Math.max(scroll + velocity * 300, 0), maxScroll);
      animateTo(target, false);
      return;
    }
    if (settings.skipSnaps) {
      scrollTo(nearestSnap(positions, scroll + velocity * 250, selected));
      return;
    }
    // Steps from the snap where the drag began (shortest way round a loop), at most one.
    const total = count();
    let step = nearestSnap(positions, scroll, selected) - state.startSnap;
    if (looping)
      step = ((((step + Math.floor(total / 2)) % total) + total) % total) - Math.floor(total / 2);
    const force =
      Math.abs(delta) > 20 ||
      (Math.abs(velocity) > 0.3 && Math.abs(delta) > settings.dragThreshold);
    if (force && step === 0) step = delta > 0 ? 1 : -1;
    scrollTo(state.startSnap + Math.min(Math.max(step, -1), 1));
  };
  const suppressClick = () => {
    const swallow = (event: Event) => event.preventDefault();
    root.addEventListener("click", swallow, { capture: true, once: true, signal });
    setTimeout(() => root.removeEventListener("click", swallow, { capture: true }), 0);
  };

  // --- Autoplay ------------------------------------------------------------------------------

  const autoplayState = {
    playing: false,
    paused: false,
    hoverPaused: false,
    interactionPaused: false,
    timer: 0,
    started: 0,
    remaining: 0,
    delay: 0,
    jump: false,
    frame: 0,
  };
  const playingFlag = () => {
    const on = autoplayState.playing || autoScrollState.playing;
    toggle(root, CAROUSEL_FLAGS.playing, on);
    for (const live of all("[data-ok-carousel-live]"))
      live.setAttribute("aria-live", on ? "off" : "polite");
  };
  const scheduleAutoplay = (ms: number) => {
    clearTimeout(autoplayState.timer);
    autoplayState.delay = settings.autoplayDelay;
    autoplayState.remaining = ms;
    autoplayState.started = performance.now();
    autoplayState.timer = window.setTimeout(autoplayTick, ms);
    drawAutoplayProgress();
  };
  // Stopping and pausing clear the timer, so a tick always plays.
  const autoplayTick = () => {
    if (settings.stopOnLastSnap && !canNext()) {
      autoplay.stop();
      return;
    }
    const jump = autoplayState.jump || settings.autoplayJump;
    if (canNext()) scrollTo(selected + 1, jump);
    else scrollTo(0, jump);
    scheduleAutoplay(settings.autoplayDelay);
  };
  const pauseAutoplay = () => {
    if (autoplayState.paused) return;
    autoplayState.paused = true;
    clearTimeout(autoplayState.timer);
    autoplayState.remaining = Math.max(
      0,
      autoplayState.remaining - (performance.now() - autoplayState.started),
    );
  };
  /** Callers only resume a paused autoplay; it waits until hover and interaction both ended. */
  const resumeAutoplay = () => {
    if (autoplayState.hoverPaused || autoplayState.interactionPaused) return;
    autoplayState.paused = false;
    scheduleAutoplay(autoplayState.remaining);
  };
  const drawAutoplayProgress = () => {
    cancelAnimationFrame(autoplayState.frame);
    const bars = all("[data-ok-carousel-progress]").filter(
      (bar) => bar.getAttribute("data-ok-variant") === "autoplay",
    );
    if (bars.length === 0) return;
    const draw = () => {
      const left = autoplay.timeUntilNext();
      const value = left === null || autoplayState.delay <= 0 ? 0 : 1 - left / autoplayState.delay;
      for (const bar of bars) bar.style.setProperty("--_ok-carousel-progress", value.toFixed(4));
      if (autoplayState.playing && !autoplayState.paused)
        autoplayState.frame = requestAnimationFrame(draw);
    };
    draw();
  };
  const autoplay: CarouselAutoplayApi = {
    play(jump) {
      if (autoScrollState.playing) autoScroll.stop();
      autoplayState.jump = jump ?? false;
      const was = autoplayState.playing;
      autoplayState.playing = true;
      autoplayState.paused = false;
      autoplayState.hoverPaused = false;
      autoplayState.interactionPaused = false;
      scheduleAutoplay(settings.autoplayDelay);
      playingFlag();
      if (!was) options.onAutoplay?.(true);
    },
    stop() {
      clearTimeout(autoplayState.timer);
      cancelAnimationFrame(autoplayState.frame);
      const was = autoplayState.playing;
      autoplayState.playing = false;
      autoplayState.paused = false;
      autoplayState.hoverPaused = false;
      autoplayState.interactionPaused = false;
      drawAutoplayProgress();
      playingFlag();
      if (was) options.onAutoplay?.(false);
    },
    reset() {
      if (autoplayState.playing && !autoplayState.paused) scheduleAutoplay(settings.autoplayDelay);
    },
    isPlaying: () => autoplayState.playing,
    timeUntilNext() {
      if (!autoplayState.playing) return null;
      if (autoplayState.paused) return autoplayState.remaining;
      return Math.max(0, autoplayState.remaining - (performance.now() - autoplayState.started));
    },
  };

  // --- Auto scroll ---------------------------------------------------------------------------

  const autoScrollState = { playing: false, running: false, paused: false, timer: 0, frame: 0 };
  const stopFrames = () => {
    cancelAnimationFrame(autoScrollState.frame);
    clearTimeout(autoScrollState.timer);
    autoScrollState.frame = 0;
    if (autoScrollState.running) {
      autoScrollState.running = false;
      root.removeAttribute(CAROUSEL_FLAGS.autoScrolling);
    }
  };
  const startFrames = (delay: number) => {
    stopFrames();
    // Stopping and pausing clear this timer.
    autoScrollState.timer = window.setTimeout(() => {
      cancelAnimation();
      autoScrollState.running = true;
      root.setAttribute(CAROUSEL_FLAGS.autoScrolling, "");
      const step = () => {
        const sign = settings.autoScrollDirection === "backward" ? -1 : 1;
        const next = getScroll() + sign * settings.autoScrollSpeed;
        if (!looping && (next >= maxScroll || next <= 0)) {
          setScroll(Math.min(Math.max(next, 0), maxScroll));
          onScrollFrame();
          autoScroll.stop();
          return;
        }
        setScroll(next);
        recenterNearEdge();
        onScrollFrame();
        autoScrollState.frame = requestAnimationFrame(step);
      };
      autoScrollState.frame = requestAnimationFrame(step);
    }, delay);
  };
  const autoScroll: CarouselAutoScrollApi = {
    play(startDelay) {
      if (autoplayState.playing) autoplay.stop();
      const was = autoScrollState.playing;
      autoScrollState.playing = true;
      autoScrollState.paused = false;
      startFrames(startDelay ?? settings.autoScrollStartDelay);
      playingFlag();
      if (!was) options.onAutoScroll?.(true);
    },
    stop() {
      stopFrames();
      const was = autoScrollState.playing;
      autoScrollState.playing = false;
      autoScrollState.paused = false;
      playingFlag();
      if (was) {
        options.onAutoScroll?.(false);
        settle();
      }
    },
    reset() {
      if (autoScrollState.playing) startFrames(settings.autoScrollStartDelay);
    },
    isPlaying: () => autoScrollState.playing,
  };
  const pauseAutoScroll = () => {
    if (!autoScrollState.playing) return;
    autoScrollState.paused = true;
    stopFrames();
  };
  const resumeAutoScroll = () => {
    if (!autoScrollState.playing || !autoScrollState.paused) return;
    autoScrollState.paused = false;
    startFrames(settings.autoScrollStartDelay);
  };

  /** Embla's default interactions for autoplay and auto scroll. */
  const interaction = (kind: "pointerdown" | "mouseenter" | "mouseleave" | "focusin") => {
    if (kind === "pointerdown") {
      if (settings.stopOnInteraction) {
        if (autoplayState.playing) autoplay.stop();
        if (autoScrollState.playing) autoScroll.stop();
      } else {
        if (autoplayState.playing) {
          autoplayState.interactionPaused = true;
          pauseAutoplay();
        }
        pauseAutoScroll();
      }
    } else if (kind === "focusin") {
      if (settings.stopOnFocusIn) {
        if (autoplayState.playing) autoplay.stop();
        if (autoScrollState.playing) autoScroll.stop();
      }
    } else if (kind === "mouseenter") {
      if (!settings.stopOnMouseEnter) return;
      if (autoplayState.playing) {
        autoplayState.hoverPaused = true;
        pauseAutoplay();
      }
      pauseAutoScroll();
    } else {
      if (autoplayState.hoverPaused) {
        autoplayState.hoverPaused = false;
        resumeAutoplay();
      }
      if (!drag) resumeAutoScroll();
    }
  };

  // --- Wheel and keys ------------------------------------------------------------------------

  let wheelLocked = false;
  let wheelAmount = 0;
  let wheelTimer = 0;
  const onWheel = (event: WheelEvent) => {
    if (!settings.wheelGestures || !settings.active || !settings.draggable) return;
    const axis = settings.forceWheelAxis ?? settings.axis;
    const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
    const delta = axis === "x" ? (horizontal ? event.deltaX : 0) : horizontal ? 0 : event.deltaY;
    if (delta === 0) return;
    event.preventDefault();
    clearTimeout(wheelTimer);
    wheelTimer = window.setTimeout(() => {
      wheelLocked = false;
      wheelAmount = 0;
    }, 160);
    interaction("pointerdown");
    userMove = true;
    if (settings.dragFree && !fade()) {
      cancelAnimation();
      setScroll(
        Math.min(Math.max(getScroll() + delta * (rtl() && axis === "x" ? -1 : 1), 0), maxScroll),
      );
      return;
    }
    if (wheelLocked) return;
    wheelAmount += delta;
    if (Math.abs(wheelAmount) < 30) return;
    wheelLocked = true;
    const forward = wheelAmount > 0 !== (rtl() && axis === "x");
    if (forward) api.scrollNext();
    else api.scrollPrev();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.target !== area || event.altKey || event.ctrlKey || event.metaKey) return;
    const next = vertical() ? "ArrowDown" : rtl() ? "ArrowLeft" : "ArrowRight";
    const prev = vertical() ? "ArrowUp" : rtl() ? "ArrowRight" : "ArrowLeft";
    const actions: Record<string, () => void> = {
      [next]: () => api.scrollNext(),
      [prev]: () => api.scrollPrev(),
      Home: () => scrollTo(0),
      End: () => scrollTo(count() - 1),
    };
    const action = actions[event.key];
    if (!action) return;
    event.preventDefault();
    userMove = true;
    action();
  };

  // --- Listeners -----------------------------------------------------------------------------

  root.addEventListener(
    "click",
    (event) => {
      if (event.defaultPrevented) return;
      const target = event.target as Element;
      const control = own(
        target.closest(
          "[data-ok-carousel-prev], [data-ok-carousel-next], [data-ok-carousel-dot], [data-ok-carousel-thumb], [data-ok-carousel-play]",
        ),
      );
      if (!control) return;
      if (control.hasAttribute("data-ok-carousel-play")) {
        const autoScrolls = settings.autoScroll && !settings.autoplay;
        if (autoScrolls) {
          if (autoScrollState.playing) autoScroll.stop();
          else autoScroll.play(0);
        } else if (autoplayState.playing) autoplay.stop();
        else autoplay.play();
        return;
      }
      userMove = true;
      if (control.hasAttribute("data-ok-carousel-prev")) {
        if (control.getAttribute("aria-disabled") !== "true") api.scrollPrev();
      } else if (control.hasAttribute("data-ok-carousel-next")) {
        if (control.getAttribute("aria-disabled") !== "true") api.scrollNext();
      } else if (control.hasAttribute("data-ok-carousel-dot")) {
        // Dots and thumbnails are the children of their group (anatomy).
        scrollTo(
          itemsOf(control.parentElement as Element, "[data-ok-carousel-dot]").indexOf(
            control as HTMLElement,
          ),
        );
      } else {
        const thumbs = itemsOf(control.parentElement as Element, "[data-ok-carousel-thumb]");
        scrollTo(snapOfSlide[thumbs.indexOf(control as HTMLElement)] as number);
      }
      if (autoplayState.playing && !autoplayState.paused) autoplay.reset();
    },
    { signal },
  );
  root.addEventListener("keydown", onKeyDown, { signal });
  root.addEventListener(
    "pointerdown",
    (event) => {
      if (own((event.target as Element).closest("[data-ok-carousel-viewport]")))
        onPointerDown(event);
    },
    { signal },
  );
  root.addEventListener("pointermove", onPointerMove, { signal });
  root.addEventListener("pointerup", onPointerUp, { signal });
  root.addEventListener("pointercancel", onPointerUp, { signal });
  root.addEventListener("lostpointercapture", (event) => onPointerUp(event as PointerEvent), {
    signal,
  });
  root.addEventListener(
    "dragstart",
    (event) => {
      if (own((event.target as Element).closest("[data-ok-carousel-viewport]")))
        event.preventDefault();
    },
    { signal },
  );
  root.addEventListener("mouseenter", () => interaction("mouseenter"), { signal });
  root.addEventListener("mouseleave", () => interaction("mouseleave"), { signal });
  root.addEventListener(
    "focusin",
    (event) => {
      const target = event.target as Element;
      if (target.closest("[data-ok-carousel-play]")) return;
      if (!target.matches(":focus-visible")) return;
      interaction("focusin");
      const slide = own(target.closest<HTMLElement>(SLIDE));
      const index = slide ? slideList.indexOf(slide) : -1;
      if (index < 0) return;
      options.onSlideFocus?.(index);
      if (!settings.focus || fade()) return;
      const snap = snapOfSlide[index] as number;
      if (snap !== selected) {
        userMove = true;
        scrollTo(snap);
      }
    },
    { signal },
  );

  const bindViewport = () => {
    area.addEventListener("scroll", onScroll, { signal, passive: true });
    area.addEventListener("wheel", onWheel, { signal, passive: false });
    area.addEventListener(
      "touchstart",
      () => {
        cancelAnimation();
        userMove = true;
      },
      { signal, passive: true },
    );
  };

  /** Writes the settings that CSS needs (breakpoints may override the attributes). */
  const writeCssSettings = () => {
    const axis = vertical() ? "y" : "x";
    const snap = !settings.active || settings.dragFree || fade() ? "none" : `${axis} mandatory`;
    area.style.setProperty("--_ok-carousel-snap", snap);
    area.style.setProperty("--_ok-carousel-snap-stop", settings.skipSnaps ? "normal" : "always");
    area.style.setProperty(
      "--_ok-carousel-overflow",
      settings.active && settings.draggable && !fade() ? "auto" : "hidden",
    );
    root.style.setProperty("--_ok-carousel-duration", `${durationMs(settings.duration)}ms`);
  };

  // --- Init / reInit --------------------------------------------------------------------------

  const reInit = () => {
    settings = readCarouselSettings(root);
    writeCssSettings();
    const keep = initialized ? selected : settings.startIndex;
    layout();
    const total = count();
    selected =
      total === 0 ? 0 : looping ? ((keep % total) + total) % total : Math.min(keep, total - 1);
    if (looping) {
      firstSlide = -1;
      recenter(selected);
    }
    if (!fade() && total > 0 && settings.active) setScroll(positions[selected] as number);
    observeInView();
    sync();
    syncHeight();
    writeTweens();
    playingFlag();
    if (total !== snapCount) {
      snapCount = total;
      options.onReInit?.(total);
    }
  };

  const resizeObserver = new ResizeObserver(() => {
    requestAnimationFrame(() => {
      if (!signal.aborted && !drag && !animating) reInit();
    });
  });
  const observeSizes = () => {
    resizeObserver.disconnect();
    resizeObserver.observe(area);
    for (const slide of slideList) resizeObserver.observe(slide);
  };

  const mutations = new MutationObserver((records) => {
    let structure = false;
    let options_ = false;
    for (const record of records) {
      if (record.type === "attributes") options_ ||= record.target === root;
      else if (record.target === box) structure = true;
    }
    if (options_) watchBreakpoints();
    if (structure || options_) {
      reInit();
      observeSizes();
    } else sync();
  });
  mutations.observe(root, {
    attributes: true,
    attributeFilter: CAROUSEL_OBSERVED,
    childList: true,
    subtree: true,
  });

  const media: MediaQueryList[] = [];
  const watchBreakpoints = () => {
    for (const list of media.splice(0)) list.removeEventListener("change", reInit);
    for (const query of Object.keys(parseBreakpoints(root.getAttribute("data-ok-breakpoints")))) {
      const list = matchMedia(query);
      list.addEventListener("change", reInit);
      media.push(list);
    }
  };

  const api: CarouselController = {
    scrollNext(jump) {
      if (canNext()) scrollTo(selected + 1, jump);
    },
    scrollPrev(jump) {
      if (canPrev()) scrollTo(selected - 1, jump);
    },
    scrollTo: (index, jump) => scrollTo(index, jump),
    canScrollNext: canNext,
    canScrollPrev: canPrev,
    selectedScrollSnap: () => selected,
    previousScrollSnap: () => previous,
    scrollSnapList: () => {
      if (fade() || looping) return positions.map((_, i) => i / Math.max(count() - 1, 1));
      return positions.map((position) => scrollProgress(position, maxScroll));
    },
    scrollProgress: progressValue,
    slidesInView: () => [...inView].sort((a, b) => a - b),
    slidesNotInView: () => slideList.map((_, i) => i).filter((i) => !inView.has(i)),
    slideNodes: () => [...slideList],
    rootNode: () => root,
    containerNode: () => foundContainer,
    reInit,
    autoplay,
    autoScroll,
    destroy() {
      abort.abort();
      cancelAnimation();
      cancelAnimationFrame(frame);
      clearTimeout(settleTimer);
      clearTimeout(wheelTimer);
      autoplay.stop();
      autoScroll.stop();
      intersection?.disconnect();
      resizeObserver.disconnect();
      mutations.disconnect();
      for (const list of media.splice(0)) list.removeEventListener("change", reInit);
      for (const flag of Object.values(CAROUSEL_FLAGS)) root.removeAttribute(flag);
      for (const slide of slideList) slide.style.removeProperty("--_ok-carousel-order");
    },
  };

  bindViewport();
  reInit();
  observeSizes();
  watchBreakpoints();
  initialized = true;
  root.setAttribute(CAROUSEL_FLAGS.ready, "");
  if (settings.playOnInit && !reducedMotion()) {
    if (settings.autoplay) autoplay.play();
    else if (settings.autoScroll) autoScroll.play();
  }
  // Web fonts and images change slide sizes once they load.
  document.fonts?.ready.then(() => {
    if (!signal.aborted) reInit();
  });
  return api;
}
