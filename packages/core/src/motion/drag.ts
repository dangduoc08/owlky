/*
 * Drag gesture — spec: specs/components/motion.md (Gestures), ADR-0062 (5.3). Two layers:
 * - `trackPan`: Pointer Events from a press to a release — a start threshold, the offset, the
 *   velocity over the last 100 ms, an optional direction lock and cancellation. The swipe helper
 *   (`swipe.ts`) and `createDrag` build on it.
 * - `createDrag` (Framer Motion's `drag` props): the element follows the pointer through its
 *   `translate`, inside optional constraints with elastic overdrag, and on release glides on
 *   (inertia from the release velocity) or springs back to its constraints or origin. The glide is
 *   simulated per axis and played by `animate()` as sampled keyframes. Arrow keys move a focused
 *   draggable element (the keyboard alternative, WCAG 2.1.1 / 2.5.7). Reduced motion: positions
 *   still follow the pointer, the release settles at once (no inertia, no overshoot).
 * Instance-scoped state only (ADR-0007).
 */
import { type AnimationControls, animate } from "./animate.js";
import { prefersReducedMotion } from "./count-up.js";

/** A position or a movement, px (velocity: px per second). */
export interface Point {
  x: number;
  y: number;
}

/** What a pan or drag event reports (Framer's `PanInfo`). */
export interface PanInfo {
  /** The pointer on the page (`pageX` / `pageY`). */
  point: Point;
  /** Movement since the previous event. */
  delta: Point;
  /** Movement since the press. */
  offset: Point;
  /** Speed over the last 100 ms, px per second. */
  velocity: Point;
}

export type PanAxis = "x" | "y";

/** A position of the pointer at a time (ms). */
export interface PanSample extends Point {
  t: number;
}

const ZERO: Point = { x: 0, y: 0 };
/** Velocity is measured over this window, ms (Framer). */
const VELOCITY_WINDOW = 100;

/**
 * The velocity (px/s) of the last sample, measured against the first sample more than 100 ms
 * older (or the oldest one). Fewer than two samples, or no time between them → 0.
 */
export function panVelocity(history: readonly PanSample[]): Point {
  const last = history.at(-1);
  if (!last || history.length < 2) return ZERO;
  let from = history[0] as PanSample;
  for (let i = history.length - 2; i >= 0; i--) {
    from = history[i] as PanSample;
    if (last.t - from.t > VELOCITY_WINDOW) break;
  }
  const seconds = (last.t - from.t) / 1000;
  if (seconds <= 0) return ZERO;
  return { x: (last.x - from.x) / seconds, y: (last.y - from.y) / seconds };
}

/**
 * The axis a movement locks to once it is longer than `threshold` on one axis (Framer's
 * direction lock): `y` when the vertical movement is past it, else `x`, else none yet.
 */
export function lockDirection(offset: Point, threshold = 10): PanAxis | null {
  if (Math.abs(offset.y) > threshold) return "y";
  if (Math.abs(offset.x) > threshold) return "x";
  return null;
}

export interface PanOptions {
  /** Movement (px) before the gesture starts; a shorter press is a click. Default 3. */
  threshold?: number | undefined;
  /** Only presses of these pointer types count, such as `["touch", "pen"]`. Default: every type. */
  pointerTypes?: readonly string[] | undefined;
  /** Whether a press may start the gesture (after the primary-button check). */
  filter?: ((event: PointerEvent) => boolean) | undefined;
  /** Captures the pointer once the gesture starts. Default `true`. */
  capture?: boolean | undefined;
  /** A press was accepted (before the threshold). */
  onPress?: ((event: PointerEvent) => void) | undefined;
  /** The movement passed the threshold. `onMove` follows with the same event. */
  onStart?: ((info: PanInfo, event: PointerEvent) => void) | undefined;
  onMove?: ((info: PanInfo, event: PointerEvent) => void) | undefined;
  /** Released after the gesture started. */
  onEnd?: ((info: PanInfo, event: PointerEvent) => void) | undefined;
  /**
   * The press ended without a gesture (`started: false`: released before the threshold), or the
   * gesture was cancelled (`pointercancel`, `cancel()`, `destroy()`).
   */
  onCancel?: ((started: boolean, info: PanInfo | null) => void) | undefined;
}

export interface PanHandle {
  /** A press is being tracked. */
  readonly pressed: boolean;
  /** The movement passed the threshold. */
  readonly started: boolean;
  /** Ends the current press as cancelled. */
  cancel(): void;
  destroy(): void;
}

const now = () => performance.now();

/**
 * Follows one pointer from a primary press on `element` to its release. Moves and releases are
 * heard on the window, so a pointer that leaves the element (or an element that moves away from
 * it) is still followed.
 */
export function trackPan(element: HTMLElement, options: PanOptions): PanHandle {
  let session: {
    id: number;
    start: PanSample;
    last: PanSample;
    history: PanSample[];
    started: boolean;
    listeners: AbortController;
  } | null = null;

  const info = (current: NonNullable<typeof session>, sample: PanSample): PanInfo => ({
    point: { x: sample.x + scrollX, y: sample.y + scrollY },
    delta: { x: sample.x - current.last.x, y: sample.y - current.last.y },
    offset: { x: sample.x - current.start.x, y: sample.y - current.start.y },
    velocity: panVelocity(current.history),
  });

  const sampleOf = (event: PointerEvent): PanSample => ({
    x: event.clientX,
    y: event.clientY,
    t: now(),
  });

  const record = (current: NonNullable<typeof session>, sample: PanSample) => {
    current.history.push(sample);
    // Older samples than the velocity window (plus the one just before it) aren't needed.
    while (current.history.length > 2 && sample.t - (current.history[1] as PanSample).t > 200)
      current.history.shift();
  };

  const end = (cancelled: boolean, event?: PointerEvent) => {
    const current = session;
    if (!current) return;
    session = null;
    current.listeners.abort();
    if (!cancelled && event && current.started) {
      const sample = sampleOf(event);
      record(current, sample);
      const result = info(current, sample);
      current.last = sample;
      options.onEnd?.(result, event);
      return;
    }
    options.onCancel?.(current.started, current.started ? info(current, current.last) : null);
  };

  const down = (event: PointerEvent) => {
    if (session || !event.isPrimary || event.button !== 0) return;
    if (options.pointerTypes && !options.pointerTypes.includes(event.pointerType)) return;
    if (options.filter && !options.filter(event)) return;
    const sample = sampleOf(event);
    const listeners = new AbortController();
    const current = {
      id: event.pointerId,
      start: sample,
      last: sample,
      history: [sample],
      started: false,
      listeners,
    };
    session = current;
    const view = element.ownerDocument.defaultView ?? window;
    const { signal } = listeners;
    view.addEventListener(
      "pointermove",
      (move) => {
        if (move.pointerId !== current.id) return;
        const next = sampleOf(move);
        record(current, next);
        if (!current.started) {
          const dx = next.x - current.start.x;
          const dy = next.y - current.start.y;
          if (Math.hypot(dx, dy) < (options.threshold ?? 3)) return;
          current.started = true;
          if (options.capture !== false) {
            try {
              element.setPointerCapture(move.pointerId);
            } catch {
              // Synthetic pointers can't be captured; the window still hears them.
            }
          }
          options.onStart?.(info(current, next), move);
          if (session !== current) return;
        }
        const result = info(current, next);
        current.last = next;
        options.onMove?.(result, move);
      },
      { signal },
    );
    view.addEventListener(
      "pointerup",
      (up) => {
        if (up.pointerId === current.id) end(false, up);
      },
      { signal },
    );
    view.addEventListener(
      "pointercancel",
      (cancel) => {
        if (cancel.pointerId === current.id) end(true);
      },
      { signal },
    );
    options.onPress?.(event);
  };

  element.addEventListener("pointerdown", down);
  return {
    get pressed() {
      return session !== null;
    },
    get started() {
      return session?.started === true;
    },
    cancel() {
      end(true);
    },
    destroy() {
      end(true);
      element.removeEventListener("pointerdown", down);
    },
  };
}

/** Bounds in px, relative to where the element sits without its `translate`. */
export interface DragConstraints {
  top?: number | undefined;
  right?: number | undefined;
  bottom?: number | undefined;
  left?: number | undefined;
}

/** How far the element may be pulled past its constraints: 0 (not at all) to 1 (freely), per side. */
export type DragElastic = number | boolean | DragConstraints;

/** The glide after a release (Framer's `dragTransition`, an inertia animation; times in ms). */
export interface DragTransition {
  /** Share of the release velocity turned into distance (px per px/s). Default 0.8. */
  power?: number | undefined;
  /** How quickly the glide slows down, ms (larger: a longer glide). Default 750. */
  timeConstant?: number | undefined;
  /** Stiffness of the spring that pulls the element back to a constraint. Default 200 (500 without `dragElastic`: a hard stop). */
  bounceStiffness?: number | undefined;
  /** Damping of that spring. Default 40. */
  bounceDamping?: number | undefined;
  /** Distance (px) under which the glide rests. Default 1. */
  restDelta?: number | undefined;
  /** Speed (px/s) under which the spring rests. Default 10. */
  restSpeed?: number | undefined;
  /** Changes where the glide stops, such as snapping to a grid: `(target) => Math.round(target / 50) * 50`. */
  modifyTarget?: ((target: number, axis: PanAxis) => number) | undefined;
}

/** One axis of a glide (`inertiaPath`). */
export interface InertiaOptions extends Omit<DragTransition, "modifyTarget"> {
  from: number;
  /** px per second. */
  velocity: number;
  min?: number | undefined;
  max?: number | undefined;
  /** No spring at the bounds: the glide stops on them. */
  hardStop?: boolean | undefined;
  modifyTarget?: ((target: number) => number) | undefined;
}

const FRAME = 1000 / 60;
const MAX_GLIDE = 10_000;

/**
 * Positions every 1/60 s (the first is `from`) of an inertia glide (Framer's `inertia`): an
 * exponential slow-down from the release velocity towards `from + power × velocity`; a spring
 * pulls it back once it crosses `min` / `max` (or at once when it starts outside them). Ends
 * when it rests, at most 10 s.
 */
export function inertiaPath(options: InertiaOptions): number[] {
  const {
    from,
    min,
    max,
    power = 0.8,
    timeConstant = 750,
    bounceStiffness = 200,
    bounceDamping = 40,
    restDelta = 1,
    restSpeed = 10,
    hardStop = false,
  } = options;
  const velocity = Number.isFinite(options.velocity) ? options.velocity : 0;
  const below = (value: number) => min !== undefined && value < min;
  const above = (value: number) => max !== undefined && value > max;
  const nearest = (value: number) =>
    min === undefined
      ? (max as number)
      : max === undefined
        ? min
        : Math.abs(min - value) < Math.abs(max - value)
          ? min
          : max;
  const path = [from];
  let x = from;
  let v = velocity;
  let t = 0;
  let next = FRAME;
  const push = (value: number) => {
    while (t >= next) {
      path.push(value);
      next += FRAME;
    }
  };
  const tau = Math.max(timeConstant, 1);
  let mode: "decay" | "spring" = below(from) || above(from) ? "spring" : "decay";
  let target = 0;
  let amplitude = power * velocity;
  if (mode === "decay") {
    const ideal = from + amplitude;
    target = options.modifyTarget ? options.modifyTarget(ideal) : ideal;
    amplitude = target - from;
    if (Math.abs(amplitude) <= restDelta && !below(target) && !above(target)) {
      if (target !== from) path.push(target);
      return path;
    }
  }
  let bound = mode === "spring" ? nearest(from) : 0;
  if (mode === "spring" && hardStop) return [from, bound];
  const dt = 1;
  while (t < MAX_GLIDE) {
    t += dt;
    if (mode === "decay") {
      const delta = amplitude * Math.exp(-t / tau);
      x = target - delta;
      v = (delta / tau) * 1000;
      if (below(x) || above(x)) {
        bound = nearest(x);
        if (hardStop) {
          push(bound);
          if (path.at(-1) !== bound) path.push(bound);
          return path;
        }
        mode = "spring";
      } else if (Math.abs(delta) <= restDelta) {
        push(target);
        if (path.at(-1) !== target) path.push(target);
        return path;
      }
    } else {
      // Semi-implicit Euler, 1 ms steps (stable for the stiffness range of drag springs).
      const a = -bounceStiffness * (x - bound) - bounceDamping * v;
      v += (a * dt) / 1000;
      x += (v * dt) / 1000;
      if (Math.abs(v) < restSpeed && Math.abs(x - bound) < restDelta) {
        push(bound);
        if (path.at(-1) !== bound) path.push(bound);
        return path;
      }
    }
    push(x);
  }
  const last = mode === "spring" ? bound : target;
  if (path.at(-1) !== last) path.push(last);
  return path;
}

/** Ranges of `translate` per axis (`null`: unbounded). */
export interface DragRanges {
  x: [number, number] | null;
  y: [number, number] | null;
}

/** The element's translate in px (`none` → 0). */
export function readTranslate(element: Element): Point {
  const value = getComputedStyle(element).getPropertyValue("translate").trim();
  if (!value || value === "none") return { x: 0, y: 0 };
  const [x = "0", y = "0"] = value.split(/\s+/);
  const number = (text: string) => {
    const parsed = Number.parseFloat(text);
    return Number.isFinite(parsed) ? parsed : 0;
  };
  return { x: number(x), y: number(y) };
}

const isElement = (value: unknown): value is Element =>
  typeof Element !== "undefined" && value instanceof Element;

/**
 * Translate ranges that keep the element inside `constraints`: a box (px from where the element
 * sits without its translate) or an element whose box it must stay in. An element larger than
 * its constraints element may move as long as it covers it (Framer). `at` is the current translate.
 */
export function dragRanges(
  element: Element,
  constraints: DragConstraints | Element | null | undefined,
  at: Point,
): DragRanges {
  if (!constraints) return { x: null, y: null };
  if (isElement(constraints)) {
    const rect = element.getBoundingClientRect();
    const html = element as HTMLElement;
    // The layout box: the rect's center without the translate, the untransformed size (a scale
    // from a gesture state doesn't change the range).
    const width = html.offsetWidth ?? rect.width;
    const height = html.offsetHeight ?? rect.height;
    const cx = rect.left + rect.width / 2 - at.x;
    const cy = rect.top + rect.height / 2 - at.y;
    const box = constraints.getBoundingClientRect();
    const range = (min: number, max: number): [number, number] =>
      min > max ? [max, min] : [min, max];
    return {
      x: range(box.left - (cx - width / 2), box.right - (cx + width / 2)),
      y: range(box.top - (cy - height / 2), box.bottom - (cy + height / 2)),
    };
  }
  const side = (value: number | undefined, fallback: number) =>
    typeof value === "number" && Number.isFinite(value) ? value : fallback;
  return {
    x: [side(constraints.left, -Infinity), side(constraints.right, Infinity)],
    y: [side(constraints.top, -Infinity), side(constraints.bottom, Infinity)],
  };
}

/** Elastic factors per side (default 0.5, Framer; `true` → 0.5, `false` → 0). */
export function dragElastic(elastic: DragElastic | undefined): DragConstraints & {
  top: number;
  right: number;
  bottom: number;
  left: number;
} {
  const clamp = (value: unknown, fallback: number) =>
    typeof value === "number" && Number.isFinite(value)
      ? Math.min(Math.max(value, 0), 1)
      : fallback;
  if (elastic === undefined || elastic === true)
    return { top: 0.5, right: 0.5, bottom: 0.5, left: 0.5 };
  if (elastic === false) return { top: 0, right: 0, bottom: 0, left: 0 };
  if (typeof elastic === "number") {
    const value = clamp(elastic, 0.5);
    return { top: value, right: value, bottom: value, left: value };
  }
  return {
    top: clamp(elastic.top, 0),
    right: clamp(elastic.right, 0),
    bottom: clamp(elastic.bottom, 0),
    left: clamp(elastic.left, 0),
  };
}

/** A position inside `range`, or pulled past it by `elastic` (0: stops at the bound). */
export function applyElastic(
  value: number,
  range: [number, number] | null,
  elasticMin: number,
  elasticMax: number,
): number {
  if (!range) return value;
  const [min, max] = range;
  if (value < min) return min + (value - min) * elasticMin;
  if (value > max) return max + (value - max) * elasticMax;
  return value;
}

export interface DragOptions {
  /** Axes the element moves on: `true` / `"both"`, `"x"` or `"y"`; `false` turns dragging off. */
  drag?: boolean | "x" | "y" | "both" | undefined;
  /**
   * A box (px from where the element sits without dragging), an element to stay inside, or a
   * function returning that element (called when a drag starts).
   */
  constraints?: DragConstraints | Element | (() => Element | null) | null | undefined;
  /** How far it may be pulled past its constraints (0–1, per side). Default 0.5. */
  elastic?: DragElastic | undefined;
  /** Glides on after a release, from the release velocity. Default `true`. */
  momentum?: boolean | undefined;
  /** Springs back to where it started (no translate) on release. */
  snapToOrigin?: boolean | undefined;
  /** Moves only along the first axis the pointer moves 10 px on. */
  directionLock?: boolean | undefined;
  /** Tunes the glide (inertia). */
  transition?: DragTransition | undefined;
  /** Arrow keys move the focused element (10 px, 50 px with Shift). Default `true`. */
  keyboard?: boolean | undefined;
  /** `user` (default) follows `prefers-reduced-motion`; `always` / `never` force it. */
  reducedMotion?: "user" | "always" | "never" | undefined;
  onDragStart?: ((info: PanInfo, event: PointerEvent | KeyboardEvent) => void) | undefined;
  onDrag?: ((info: PanInfo, event: PointerEvent | KeyboardEvent) => void) | undefined;
  onDragEnd?: ((info: PanInfo, event: PointerEvent | KeyboardEvent | null) => void) | undefined;
  /** The direction lock chose an axis. */
  onDirectionLock?: ((axis: PanAxis) => void) | undefined;
  /** The glide or spring after a release came to rest. */
  onDragTransitionEnd?: (() => void) | undefined;
  /** Dragging started (`true`) or ended (`false`): drives `whileDrag`. */
  onDraggingChange?: ((dragging: boolean) => void) | undefined;
}

export interface DragController {
  /** Following a pointer. */
  readonly dragging: boolean;
  setOptions(options: DragOptions): void;
  /** Stops a running glide where it is. */
  stop(): void;
  destroy(): void;
}

export const DRAGGING_ATTR = "data-ok-dragging";
/** Elements with a drag controller: a press inside a nested one drags only that one (Framer). */
const draggables = new WeakSet<Element>();
const STEP = 10;
const SHIFT_STEP = 50;

const axesOf = (drag: DragOptions["drag"]) => ({
  x: drag === true || drag === "both" || drag === "x",
  y: drag === true || drag === "both" || drag === "y",
});

/** Writes the translate (px) through CSSOM. */
const place = (element: HTMLElement, at: Point) => {
  element.style.translate = `${at.x}px ${at.y}px`;
};

/**
 * Makes `element` draggable (Framer's `drag` props): it follows a primary pointer through its
 * `translate` once the pointer moved 3 px, within its constraints (with `elastic` overdrag), and
 * glides or springs on release. Owners pass the options and hear the events.
 */
export function createDrag(element: HTMLElement, initial: DragOptions): DragController {
  let options = initial;
  let glide: AnimationControls | undefined;
  let dragging = false;
  let origin: Point = { x: 0, y: 0 };
  let at: Point = { x: 0, y: 0 };
  let ranges: DragRanges = { x: null, y: null };
  let lock: PanAxis | null = null;
  let locked = false;

  const reduced = () =>
    options.reducedMotion === "always" ||
    (options.reducedMotion !== "never" && prefersReducedMotion());

  const stop = () => {
    if (!glide) return;
    const current = glide;
    glide = undefined;
    current.stop();
  };

  const begin = () => {
    stop();
    origin = readTranslate(element);
    at = origin;
    const { constraints } = options;
    ranges = dragRanges(
      element,
      typeof constraints === "function" ? constraints() : constraints,
      origin,
    );
  };

  const target = (offset: Point): Point => {
    const axes = axesOf(options.drag);
    const elastic = dragElastic(options.elastic);
    const free = (axis: PanAxis) => axes[axis] && (!locked || lock === axis);
    return {
      x: free("x")
        ? applyElastic(origin.x + offset.x, ranges.x, elastic.left, elastic.right)
        : at.x,
      y: free("y")
        ? applyElastic(origin.y + offset.y, ranges.y, elastic.top, elastic.bottom)
        : at.y,
    };
  };

  const setDragging = (value: boolean) => {
    if (dragging === value) return;
    dragging = value;
    if (value) element.setAttribute(DRAGGING_ATTR, "");
    else element.removeAttribute(DRAGGING_ATTR);
    options.onDraggingChange?.(value);
  };

  /** After a release: glide, spring back or settle at once (reduced motion). */
  const settle = (velocity: Point) => {
    const axes = axesOf(options.drag);
    const transition = options.transition ?? {};
    const elastic = dragElastic(options.elastic);
    const momentum = options.momentum !== false;
    const snap = options.snapToOrigin === true;
    const path = (axis: PanAxis): number[] => {
      const from = at[axis];
      if (!axes[axis] && !snap) return [from];
      const range = snap ? ([0, 0] as [number, number]) : ranges[axis];
      const [lowSide, highSide] =
        axis === "x" ? (["left", "right"] as const) : (["top", "bottom"] as const);
      const hard = elastic[lowSide] === 0 && elastic[highSide] === 0;
      if (reduced()) {
        if (!range) return [from];
        return [from, Math.min(Math.max(from, range[0]), range[1])];
      }
      const modify = transition.modifyTarget;
      return inertiaPath({
        ...transition,
        from,
        velocity: momentum && !snap && (!locked || lock === axis) ? velocity[axis] : 0,
        min: range?.[0],
        max: range?.[1],
        hardStop: hard && !snap,
        bounceStiffness: transition.bounceStiffness ?? 200,
        bounceDamping: transition.bounceDamping ?? 40,
        modifyTarget: modify && !snap ? (value) => modify(value, axis) : undefined,
      });
    };
    const xs = path("x");
    const ys = path("y");
    const frames = Math.max(xs.length, ys.length);
    const end: Point = { x: xs.at(-1) as number, y: ys.at(-1) as number };
    if (frames <= 2 && (reduced() || frames === 1)) {
      at = end;
      place(element, end);
      options.onDragTransitionEnd?.();
      return;
    }
    const keyframes: Keyframe[] = Array.from({ length: frames }, (_, i) => ({
      translate: `${xs[Math.min(i, xs.length - 1)]}px ${ys[Math.min(i, ys.length - 1)]}px`,
    }));
    const controls = animate(element, keyframes, {
      duration: (frames - 1) * FRAME,
      ease: "linear",
      reducedMotion: "never",
    });
    glide = controls;
    at = end;
    controls.finished.then(() => {
      if (glide !== controls) return;
      glide = undefined;
      options.onDragTransitionEnd?.();
    });
  };

  const pan = trackPan(element, {
    filter: (event) => {
      if (options.drag === false || options.drag === undefined) return false;
      for (
        let node = event.target as Element | null;
        node && node !== element;
        node = node.parentElement
      )
        if (draggables.has(node)) return false;
      return true;
    },
    onPress: () => {
      // A press stops a glide where it is (the element is caught).
      stop();
    },
    onStart: (info, event) => {
      begin();
      lock = null;
      locked = false;
      setDragging(true);
      options.onDragStart?.(info, event);
    },
    onMove: (info, event) => {
      if (options.directionLock && !locked) {
        const axis = lockDirection(info.offset);
        if (axis === null) return;
        lock = axis;
        locked = true;
        options.onDirectionLock?.(axis);
      }
      at = target(info.offset);
      place(element, at);
      options.onDrag?.(info, event);
    },
    onEnd: (info, event) => {
      setDragging(false);
      options.onDragEnd?.(info, event);
      settle(info.velocity);
    },
    onCancel: (started, info) => {
      if (!started || !info) return;
      setDragging(false);
      options.onDragEnd?.({ ...info, velocity: ZERO }, null);
      settle(ZERO);
    },
  });

  // Native HTML drag and drop (images, links) would take the pointer away.
  const dragstart = (event: DragEvent) => {
    if (options.drag) event.preventDefault();
  };

  const keydown = (event: KeyboardEvent) => {
    if (!options.drag || options.keyboard === false || event.target !== element) return;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const axes = axesOf(options.drag);
    const step = event.shiftKey ? SHIFT_STEP : STEP;
    const move: Point | null =
      event.key === "ArrowLeft" && axes.x
        ? { x: -step, y: 0 }
        : event.key === "ArrowRight" && axes.x
          ? { x: step, y: 0 }
          : event.key === "ArrowUp" && axes.y
            ? { x: 0, y: -step }
            : event.key === "ArrowDown" && axes.y
              ? { x: 0, y: step }
              : null;
    if (!move) return;
    event.preventDefault();
    begin();
    const clamp = (value: number, range: [number, number] | null) =>
      range ? Math.min(Math.max(value, range[0]), range[1]) : value;
    const next = {
      x: clamp(origin.x + move.x, ranges.x),
      y: clamp(origin.y + move.y, ranges.y),
    };
    const rect = element.getBoundingClientRect();
    const info: PanInfo = {
      point: { x: rect.left + rect.width / 2 + scrollX, y: rect.top + rect.height / 2 + scrollY },
      delta: { x: next.x - origin.x, y: next.y - origin.y },
      offset: { x: next.x - origin.x, y: next.y - origin.y },
      velocity: ZERO,
    };
    options.onDragStart?.(info, event);
    at = next;
    place(element, next);
    options.onDrag?.(info, event);
    options.onDragEnd?.(info, event);
  };

  element.addEventListener("dragstart", dragstart);
  element.addEventListener("keydown", keydown);
  draggables.add(element);

  return {
    get dragging() {
      return dragging;
    },
    setOptions(next) {
      options = next;
      if (!next.drag && pan.started) pan.cancel();
    },
    stop,
    destroy() {
      draggables.delete(element);
      pan.destroy();
      stop();
      setDragging(false);
      element.removeEventListener("dragstart", dragstart);
      element.removeEventListener("keydown", keydown);
    },
  };
}
