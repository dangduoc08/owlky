/*
 * Motion engine — spec: specs/components/motion.md, ADR-0062. `animate()` plays keyframes with the
 * Web Animations API (Framer Motion's `animate()` / `transition`, in milliseconds), turns springs
 * into `linear()` easing, starts an interrupted property from its current value and commits the
 * end state to the inline style. Module-scoped state only (the running animation per element and
 * property), no globals (ADR-0007).
 */
import { prefersReducedMotion } from "./count-up.js";

/** A value of a property: a number (units added for lengths and angles) or a CSS string. */
export type MotionValue = number | string;

/**
 * Framer's object form: a target or a list of keyframes per property (`null` = the current
 * value). Shorthands: `x` / `y` (translate, px), `scale` / `scaleX` / `scaleY`, `rotate` (deg).
 */
export type MotionKeyframes = Record<string, MotionValue | readonly (MotionValue | null)[]>;

/** Named easings: the theme's tokens (`--ok-easing-*`) and Framer's common names. */
export type MotionEasingName =
  | "standard"
  | "decelerate"
  | "accelerate"
  | "expressive"
  | "linear"
  | "easeIn"
  | "easeOut"
  | "easeInOut"
  | "backIn"
  | "backOut"
  | "backInOut";

/** A CSS easing, a named easing or cubic-bezier control points. */
export type MotionEasing =
  | MotionEasingName
  | (string & {})
  | readonly [number, number, number, number];

export interface SpringOptions {
  /** Spring strength. Default 100 (without `visualDuration` / `bounce`). */
  stiffness?: number | undefined;
  /** Opposing force; 0 never stops (capped at 10 s). Default 10. */
  damping?: number | undefined;
  /** Mass of the moving object. Default 1. */
  mass?: number | undefined;
  /** Start velocity, in distances per second (1 = the whole distance in one second). Default 0. */
  velocity?: number | undefined;
  /** 0 (no bounce) to 1 (very bouncy), with `visualDuration` or `duration`. Default 0.25. */
  bounce?: number | undefined;
  /** Time (ms) to visually reach the target; the bounce settles after it. */
  visualDuration?: number | undefined;
  /** Distance from the target under which the spring rests (0–1). Default 0.001. */
  restDelta?: number | undefined;
  /** Speed under which the spring rests (distances per second). Default 0.01. */
  restSpeed?: number | undefined;
}

export interface AnimateOptions extends SpringOptions {
  /** `tween` (default) or `spring` (physics; a spring needs exactly two keyframes). */
  type?: "tween" | "spring" | undefined;
  /** Length in ms. Default `--ok-duration-standard`. With a spring and `bounce`, the visual duration. */
  duration?: number | undefined;
  /** Wait before starting, ms. */
  delay?: number | undefined;
  /** Easing of each segment between keyframes (or one per segment). Default `--ok-easing-standard`. */
  ease?: MotionEasing | readonly MotionEasing[] | undefined;
  /** Position (0–1) of each keyframe. Default: evenly spaced. */
  times?: readonly number[] | undefined;
  /** Repeats after the first play (`Infinity`: loops). */
  repeat?: number | undefined;
  /** `loop` restarts; `reverse` and `mirror` play back and forth. Default `loop`. */
  repeatType?: "loop" | "reverse" | "mirror" | undefined;
  /** Pause between repeats, ms. */
  repeatDelay?: number | undefined;
  /**
   * `user` (default): follow `prefers-reduced-motion` (jump to the end; loops don't start);
   * `always`: always jump; `never`: always animate.
   */
  reducedMotion?: "user" | "always" | "never" | undefined;
}

export interface AnimationControls {
  /** Resolves when every animation ended, was stopped, completed or cancelled. Never rejects. */
  readonly finished: Promise<void>;
  /** The Web Animations started (one per property). */
  readonly animations: readonly Animation[];
  /** Drops the animations: the elements return to their own style. */
  cancel(): void;
  /** Ends here: the current values stay. */
  stop(): void;
  /** Jumps to the end state. */
  complete(): void;
  pause(): void;
  play(): void;
}

const SHORTHAND_UNITS: Record<string, string> = { x: "px", y: "px", rotate: "deg" };

/** Properties whose bare numbers are px. */
const PX = new Set([
  "width",
  "height",
  "minWidth",
  "minHeight",
  "maxWidth",
  "maxHeight",
  "top",
  "right",
  "bottom",
  "left",
  "inset",
  "borderRadius",
  "borderWidth",
  "outlineWidth",
  "outlineOffset",
  "margin",
  "marginTop",
  "marginRight",
  "marginBottom",
  "marginLeft",
  "padding",
  "paddingTop",
  "paddingRight",
  "paddingBottom",
  "paddingLeft",
  "gap",
  "fontSize",
  "letterSpacing",
  "strokeWidth",
  "translate",
]);

const NAMED: Record<string, string> = {
  linear: "linear",
  easeIn: "cubic-bezier(0.42, 0, 1, 1)",
  easeOut: "cubic-bezier(0, 0, 0.58, 1)",
  easeInOut: "cubic-bezier(0.42, 0, 0.58, 1)",
  backIn: "cubic-bezier(0.31, 0.01, 0.66, -0.59)",
  backOut: "cubic-bezier(0.33, 1.53, 0.69, 0.99)",
  backInOut: "cubic-bezier(0.68, -0.6, 0.32, 1.6)",
};

/** Token fallbacks when the stylesheet isn't loaded (values of the default theme). */
const TOKENS = {
  "--ok-easing-standard": "cubic-bezier(0.4, 0, 0.2, 1)",
  "--ok-easing-decelerate": "cubic-bezier(0, 0, 0.2, 1)",
  "--ok-easing-accelerate": "cubic-bezier(0.4, 0, 1, 1)",
  "--ok-easing-expressive": "cubic-bezier(0.43, 0.13, 0.23, 0.96)",
  "--ok-duration-standard": "300ms",
} as const;

/** Overshoot used for bouncy springs where `linear()` isn't supported. */
const OVERSHOOT = "cubic-bezier(0.34, 1.56, 0.64, 1)";

const token = (name: keyof typeof TOKENS): string => {
  if (typeof document !== "undefined") {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (value) return value;
  }
  return TOKENS[name];
};

/** A CSS time (`300ms`, `0.3s`) in ms, or `undefined`. */
export const parseTime = (value: string): number | undefined => {
  const match = /^(-?[\d.]+)(ms|s)$/.exec(value.trim());
  if (!match) return undefined;
  const amount = Number(match[1]) * (match[2] === "s" ? 1000 : 1);
  return Number.isFinite(amount) ? amount : undefined;
};

let linearOverride: boolean | undefined;

/** Tests only: pretend `linear()` easing is (`true`) or isn't (`false`) supported; `undefined` resets. */
export function setLinearEasingSupport(value: boolean | undefined): void {
  linearOverride = value;
}

/** Whether the engine accepts `linear()` easing (Safari 17.2+, Chrome 113+, Firefox 112+). */
export function supportsLinearEasing(): boolean {
  if (linearOverride !== undefined) return linearOverride;
  return (
    typeof CSS !== "undefined" &&
    typeof CSS.supports === "function" &&
    CSS.supports("animation-timing-function", "linear(0, 1)")
  );
}

const finite = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

interface SpringParameters {
  stiffness: number;
  damping: number;
  mass: number;
  velocity: number;
}

/** Stiffness and damping from the spring options (`visualDuration` / `bounce` win, as in Motion). */
function springParameters(options: SpringOptions & { duration?: number | undefined }) {
  const visual =
    options.visualDuration ?? (options.bounce !== undefined ? options.duration : undefined);
  const velocity = finite(options.velocity, 0);
  if (visual !== undefined && options.stiffness === undefined && options.damping === undefined) {
    const seconds = Math.max(finite(visual, 300), 1) / 1000;
    const bounce = Math.min(Math.max(finite(options.bounce, 0.25), 0), 1);
    const root = (2 * Math.PI) / (seconds * 1.2);
    const stiffness = root * root;
    return {
      stiffness,
      damping: 2 * Math.min(Math.max(1 - bounce, 0.05), 1) * Math.sqrt(stiffness),
      mass: 1,
      velocity,
    };
  }
  return {
    stiffness: Math.max(finite(options.stiffness, 100), 0.01),
    damping: Math.max(finite(options.damping, 10), 0),
    mass: Math.max(finite(options.mass, 1), 0.01),
    velocity,
  };
}

/** Position (0 → 1) of a spring at `t` seconds: closed forms of the damped harmonic oscillator. */
function springPosition({ stiffness, damping, mass, velocity }: SpringParameters, t: number) {
  const w0 = Math.sqrt(stiffness / mass);
  const zeta = damping / (2 * Math.sqrt(stiffness * mass));
  if (zeta < 1) {
    const wd = w0 * Math.sqrt(1 - zeta * zeta);
    const envelope = Math.exp(-zeta * w0 * t);
    return 1 - envelope * (Math.cos(wd * t) + ((zeta * w0 - velocity) / wd) * Math.sin(wd * t));
  }
  if (zeta === 1) return 1 - Math.exp(-w0 * t) * (1 + (w0 - velocity) * t);
  const root = Math.sqrt(zeta * zeta - 1);
  const r1 = -w0 * (zeta - root);
  const r2 = -w0 * (zeta + root);
  const a = (velocity + r2) / (r1 - r2);
  return 1 + a * Math.exp(r1 * t) + (-1 - a) * Math.exp(r2 * t);
}

export interface SpringEasing {
  /** A `linear(…)` easing, or the fallback curve where `linear()` isn't supported. */
  easing: string;
  /** Time until the spring rests, ms. */
  duration: number;
  /** Whether the spring overshoots its target. */
  bounces: boolean;
}

const MAX_SPRING = 10_000;
const round = (value: number) => Math.round(value * 10_000) / 10_000;

/**
 * A spring from 0 to 1 sampled into a `linear()` easing and the time it takes to rest (at most
 * 10 s). Without `linear()` support (`linear: false`, or detected): an overshooting cubic-bezier
 * for bouncy springs, `--ok-easing-decelerate` otherwise, with the same duration.
 */
export function springEasing(
  options: SpringOptions & { duration?: number | undefined } = {},
  { linear = supportsLinearEasing() }: { linear?: boolean } = {},
): SpringEasing {
  const params = springParameters(options);
  const restDelta = finite(options.restDelta, 0.001);
  const restSpeed = finite(options.restSpeed, 0.01);
  const step = 1 / 120;
  let t = 0;
  let previous = 0;
  let bounces = false;
  // Rest: close to the target and slow, checked over a step.
  for (; t < MAX_SPRING / 1000; t += step) {
    const value = springPosition(params, t + step);
    if (value > 1 + restDelta) bounces = true;
    const speed = Math.abs(value - previous) / step;
    previous = value;
    if (t > 0 && Math.abs(1 - value) < restDelta && speed < restSpeed) break;
  }
  const seconds = Math.min(t + step, MAX_SPRING / 1000);
  const duration = Math.round(seconds * 1000);
  if (!linear) {
    return { easing: bounces ? OVERSHOOT : token("--ok-easing-decelerate"), duration, bounces };
  }
  const count = Math.min(Math.max(Math.round(seconds * 60), 8), 120);
  const points: string[] = [];
  for (let i = 0; i <= count; i++) {
    const value = i === count ? 1 : round(springPosition(params, (seconds * i) / count));
    points.push(String(value));
  }
  return { easing: `linear(${points.join(", ")})`, duration, bounces };
}

/** A CSS easing from an option value (unknown strings fall back to the default). */
export function resolveEasing(ease: MotionEasing | undefined): string {
  if (ease === undefined) return token("--ok-easing-standard");
  if (Array.isArray(ease)) {
    const [a, b, c, d] = (ease as readonly number[]).map((value) => finite(value, 0));
    return `cubic-bezier(${a}, ${b}, ${c}, ${d})`;
  }
  const name = ease as string;
  if (
    name === "standard" ||
    name === "decelerate" ||
    name === "accelerate" ||
    name === "expressive"
  )
    return token(`--ok-easing-${name}`);
  const value = NAMED[name] ?? name;
  if (typeof CSS !== "undefined" && typeof CSS.supports === "function")
    return CSS.supports("animation-timing-function", value) ? value : token("--ok-easing-standard");
  return value;
}

const kebab = (name: string) =>
  name.startsWith("--") ? name : name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);

/** A keyframe value with its unit (numbers on lengths get px, angles deg). */
const withUnit = (property: string, value: MotionValue): string =>
  typeof value === "number"
    ? `${value}${SHORTHAND_UNITS[property] ?? (PX.has(property) ? "px" : "")}`
    : value;

const list = (value: MotionValue | readonly (MotionValue | null)[]): (MotionValue | null)[] =>
  Array.isArray(value) ? [...(value as (MotionValue | null)[])] : [null, value as MotionValue];

/** The two parts of a computed `translate` / `scale` (`none` → the identity). */
function pair(element: Element, property: "translate" | "scale"): [string, string] {
  const value = getComputedStyle(element).getPropertyValue(property).trim();
  const identity = property === "translate" ? "0px" : "1";
  if (!value || value === "none") return [identity, identity];
  // `split` always returns the first part; a lone scale applies to both axes.
  const [first, second] = value.split(/\s+/) as [string, string | undefined];
  return [first, second ?? (property === "scale" ? first : identity)];
}

export interface MotionTrack {
  /** The CSS property animated (camelCase for Web Animations). */
  property: string;
  values: (string | null)[];
}

/**
 * Framer's object as one track per CSS property (shorthands merged, units added; `null` = the
 * current value).
 */
export function motionTracks(element: Element, keyframes: MotionKeyframes): MotionTrack[] {
  const result: MotionTrack[] = [];
  const entries = Object.entries(keyframes);
  const take = (name: string) => entries.find(([key]) => key === name)?.[1];
  const merge = (
    property: "translate" | "scale",
    first: MotionKeyframes[string] | undefined,
    second: MotionKeyframes[string] | undefined,
    names: [string, string],
  ) => {
    if (first === undefined && second === undefined) return;
    const a = first === undefined ? undefined : list(first);
    const b = second === undefined ? undefined : list(second);
    const length = Math.max(a?.length ?? 0, b?.length ?? 0);
    const current = pair(element, property);
    const at = (values: (MotionValue | null)[] | undefined, index: number, axis: 0 | 1) => {
      if (values === undefined) return current[axis];
      const value = values[Math.min(index, values.length - 1)] ?? null;
      return value === null ? current[axis] : withUnit(names[axis], value);
    };
    const values: (string | null)[] = [];
    for (let i = 0; i < length; i++) {
      const ownA = a?.[Math.min(i, a.length - 1)];
      const ownB = b?.[Math.min(i, b.length - 1)];
      values.push(
        ownA === null && (b === undefined || ownB === null)
          ? null
          : `${at(a, i, 0)} ${at(b, i, 1)}`,
      );
    }
    result.push({ property, values });
  };
  merge("translate", take("x"), take("y"), ["x", "y"]);
  const scale = take("scale");
  if (scale !== undefined) {
    result.push({
      property: "scale",
      values: list(scale).map((v) => (v === null ? null : String(v))),
    });
  } else merge("scale", take("scaleX"), take("scaleY"), ["scaleX", "scaleY"]);
  for (const [name, value] of entries) {
    if (name === "x" || name === "y" || name === "scale" || name === "scaleX" || name === "scaleY")
      continue;
    result.push({
      property: name,
      values: list(value).map((v) => (v === null ? null : withUnit(name, v))),
    });
  }
  return result;
}

type Running = Map<string, Animation>;
const running = new WeakMap<Element, Running>();

const reduced = (options: AnimateOptions) =>
  options.reducedMotion === "always" ||
  (options.reducedMotion !== "never" && prefersReducedMotion());

const settle = (animation: Animation) =>
  animation.finished.then(
    () => true,
    () => false,
  );

/** Commits the current values to the inline style, then drops the animation. */
function commit(animation: Animation): void {
  try {
    animation.commitStyles();
  } catch {
    // Not rendered (display: none): nothing to keep.
  }
  animation.cancel();
}

/**
 * Animates `target` (an element or a list of them) to `keyframes` with the Web Animations API.
 * Interrupted properties start from their current value; the end state is committed to the
 * inline style. See ADR-0062 for the options (Framer Motion's `transition`, in ms).
 */
export function animate(
  target: Element | Iterable<Element> | null | undefined,
  keyframes: MotionKeyframes | Keyframe[],
  options: AnimateOptions = {},
): AnimationControls {
  const elements =
    target == null
      ? []
      : target instanceof Element
        ? [target]
        : Array.from(target as Iterable<Element>);
  const animations: Animation[] = [];
  const loops = options.repeat === Infinity;
  const skip = reduced(options);
  const done: Promise<boolean>[] = [];
  for (const element of elements) {
    if (skip && loops) continue;
    const own = running.get(element) ?? new Map<string, Animation>();
    running.set(element, own);
    if (Array.isArray(keyframes)) {
      const spring = options.type === "spring" ? springEasing(options) : undefined;
      const base = timing(options, skip);
      const animation = element.animate(keyframes as Keyframe[], {
        ...base,
        duration: spring && !skip ? spring.duration : base.duration,
        easing:
          spring?.easing ??
          resolveEasing(
            Array.isArray(options.ease) && typeof options.ease[0] !== "number"
              ? undefined
              : (options.ease as MotionEasing | undefined),
          ),
      });
      animations.push(animation);
      done.push(track(element, own, "*", animation, loops));
      continue;
    }
    for (const { property, values } of motionTracks(element, keyframes as MotionKeyframes)) {
      const css = kebab(property);
      const previous = own.get(property);
      // Mid-flight value of an interrupted property (computed style includes the animation).
      const current = getComputedStyle(element).getPropertyValue(css).trim();
      if (previous) {
        previous.cancel();
        own.delete(property);
      }
      const resolved = values.map((value) => value ?? current);
      const frames = frameList(property, resolved, options, skip);
      const animation = element.animate(frames.keyframes, frames.timing);
      animations.push(animation);
      done.push(track(element, own, property, animation, loops));
    }
  }
  let state: "running" | "stopped" | "cancelled" = "running";
  const finished = Promise.all(done).then(() => undefined);
  return {
    finished,
    animations,
    cancel() {
      state = "cancelled";
      for (const animation of animations) animation.cancel();
    },
    stop() {
      if (state !== "running") return;
      state = "stopped";
      for (const animation of animations) if (animation.playState !== "idle") commit(animation);
    },
    complete() {
      for (const animation of animations) {
        if (animation.playState === "idle") continue;
        if (animation.effect?.getComputedTiming().endTime === Infinity) commit(animation);
        else animation.finish();
      }
    },
    pause() {
      for (const animation of animations) if (animation.playState === "running") animation.pause();
    },
    play() {
      for (const animation of animations) if (animation.playState === "paused") animation.play();
    },
  };
}

/** Registers an animation as the property's current one and commits its end when it finishes. */
function track(
  element: Element,
  own: Running,
  property: string,
  animation: Animation,
  loops: boolean,
): Promise<boolean> {
  if (property !== "*") own.set(property, animation);
  return settle(animation).then((ended) => {
    if (own.get(property) === animation) own.delete(property);
    if (ended && !loops) commit(animation);
    if (own.size === 0) running.delete(element);
    return ended;
  });
}

function timing(
  options: AnimateOptions,
  skip: boolean,
): KeyframeAnimationOptions & { duration: number } {
  const duration = skip
    ? 0
    : Math.max(finite(options.duration, parseTime(token("--ok-duration-standard")) ?? 300), 0);
  const repeat = Math.max(finite(options.repeat, 0), 0);
  const iterations = options.repeat === Infinity ? Infinity : repeat + 1;
  return {
    duration,
    delay: skip ? 0 : Math.max(finite(options.delay, 0), 0),
    iterations: skip ? 1 : iterations,
    direction:
      options.repeatType === "reverse" || options.repeatType === "mirror" ? "alternate" : "normal",
    fill: "both",
    easing: "linear",
  };
}

/** Keyframes and timing of one property: easing per segment (Framer), repeat delay as a hold. */
function frameList(
  property: string,
  values: string[],
  options: AnimateOptions,
  skip: boolean,
): { keyframes: Keyframe[]; timing: KeyframeAnimationOptions } {
  const base = timing(options, skip);
  let duration = base.duration;
  let easings: string[];
  if (options.type === "spring" && values.length === 2) {
    const spring = springEasing(options);
    easings = [spring.easing];
    // A spring's own length, unless `duration` is its visual duration (with `bounce`).
    if (!skip) duration = spring.duration;
  } else {
    const ease = options.ease;
    const segments = values.length - 1;
    easings = Array.from({ length: Math.max(segments, 1) }, (_, i) =>
      resolveEasing(
        Array.isArray(ease) && typeof ease[0] !== "number"
          ? ((ease as readonly MotionEasing[])[i] ?? (ease as readonly MotionEasing[]).at(-1))
          : (ease as MotionEasing | undefined),
      ),
    );
  }
  const times = options.times;
  const offset = (i: number) => {
    const given = times?.[i];
    return typeof given === "number" && given >= 0 && given <= 1
      ? given
      : values.length === 1
        ? 1
        : i / (values.length - 1);
  };
  const hold = skip ? 0 : Math.max(finite(options.repeatDelay, 0), 0);
  const total = duration + hold;
  const scale = total > 0 ? duration / total : 1;
  const keyframes: Keyframe[] = values.map((value, i) => ({
    [property]: value,
    offset: offset(i) * scale,
    easing: easings[Math.min(i, easings.length - 1)] as string,
  }));
  if (hold > 0) keyframes.push({ [property]: values.at(-1) as string, offset: 1 });
  return { keyframes, timing: { ...base, duration: total } };
}
