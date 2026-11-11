/*
 * Shared values — spec: specs/components/motion.md (Shared values), ADR-0062 (5.4). Framer
 * Motion's motion values as a small store without a framework: `motionValue()` (get, set, `on
 * ("change")`, velocity), `transformValue()` (`useTransform`: a function of other values, or a
 * mapping of ranges), `springValue()` (`useSpring`: follows its target with a spring, simulated
 * on animation frames) and `bindStyle()` (writes a value to a CSS property through CSSOM, as
 * Framer's `style` does). React wraps them in hooks; HTML pages call them from a script.
 * Instance-scoped state only (ADR-0007).
 */
import { type SpringOptions, springParameters } from "./animate.js";
import { prefersReducedMotion } from "./count-up.js";
import { type EasingFunction, easingFunction } from "./easing.js";

/** Renamed from Framer's `MotionValue` (in Owlky, `MotionValue` is a keyframe value). */
export interface SharedValue<T> {
  /** The current value. */
  get(): T;
  /** Sets the value (a spring value animates to it). Listeners hear the change. */
  set(value: T): void;
  /** Sets the value at once, without animating, and stops a running spring. */
  jump(value: T): void;
  /** Change per second of a number value (0 for other values or when it rests). */
  getVelocity(): number;
  /** Calls `callback` after each change. Returns the function that stops listening. */
  on(event: "change", callback: (value: T) => void): () => void;
  /** Stops a running spring (the value stays where it is). */
  stop(): void;
  /** Stops it and drops every listener and the values it follows. */
  destroy(): void;
}

/** Whether `input` is a shared value (any object with `get` and `on`). */
export const isSharedValue = (input: unknown): input is SharedValue<unknown> =>
  typeof input === "object" &&
  input !== null &&
  typeof (input as SharedValue<unknown>).get === "function" &&
  typeof (input as SharedValue<unknown>).on === "function";

const time = () => performance.now();

/** Framer's `motionValue(initial)`: a value that tells its listeners when it changes. */
export function motionValue<T>(initial: T): SharedValue<T> {
  let current = initial;
  let previous = initial;
  let changedAt = time();
  let previousAt = changedAt;
  const listeners = new Set<(value: T) => void>();
  const write = (next: T) => {
    if (Object.is(next, current)) return;
    previous = current;
    previousAt = changedAt;
    current = next;
    changedAt = time();
    for (const listener of [...listeners]) listener(current);
  };
  return {
    get: () => current,
    set: write,
    jump: write,
    getVelocity() {
      if (typeof current !== "number" || typeof previous !== "number") return 0;
      const elapsed = changedAt - previousAt;
      // A value that hasn't changed for a few frames rests.
      if (elapsed <= 0 || time() - changedAt > 50) return 0;
      return ((current - previous) / elapsed) * 1000;
    },
    on(_event, callback) {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    stop() {},
    destroy() {
      listeners.clear();
    },
  };
}

/** Values a derived value reads (one or several). */
type Sources = SharedValue<number> | readonly SharedValue<unknown>[];

export interface InterpolateOptions {
  /** Keeps the result inside the output range. Default `true`. */
  clamp?: boolean | undefined;
  /** A CSS easing (or one per segment) applied inside each segment. */
  ease?: string | readonly string[] | undefined;
}

/**
 * Framer's `transform(input, output)`: maps a number from the input range onto the output
 * range, segment by segment (both ranges as long, the input increasing).
 */
export function interpolate(
  input: readonly number[],
  output: readonly number[],
  { clamp = true, ease }: InterpolateOptions = {},
): (value: number) => number {
  const length = Math.min(input.length, output.length);
  const easings: EasingFunction[] = Array.from({ length: Math.max(length - 1, 1) }, (_, index) =>
    easingFunction(
      typeof ease === "string" ? ease : (((ease?.[index] ?? ease?.at(-1)) as string) ?? "linear"),
    ),
  );
  return (value) => {
    if (length === 0) return value;
    if (length === 1) return output[0] as number;
    let index = 1;
    while (index < length - 1 && value > (input[index] as number)) index++;
    const a = input[index - 1] as number;
    const b = input[index] as number;
    let progress = b === a ? 1 : (value - a) / (b - a);
    if (clamp) progress = Math.min(Math.max(progress, 0), 1);
    const eased = (easings[index - 1] as EasingFunction)(progress);
    const from = output[index - 1] as number;
    const to = output[index] as number;
    return from + (to - from) * eased;
  };
}

/**
 * Framer's `useTransform` without React: a value computed from others, updated when one of them
 * changes. `transformValue(value, fn)`, `transformValue([a, b], ([a, b]) => …)` or
 * `transformValue(value, inputRange, outputRange, options)`.
 */
export function transformValue<T>(
  source: SharedValue<number>,
  transform: (value: number) => T,
): SharedValue<T>;
export function transformValue<T>(
  sources: readonly SharedValue<unknown>[],
  transform: (values: unknown[]) => T,
): SharedValue<T>;
export function transformValue(
  source: SharedValue<number>,
  input: readonly number[],
  output: readonly number[],
  options?: InterpolateOptions,
): SharedValue<number>;
export function transformValue(
  sources: Sources,
  transform: ((value: never) => unknown) | readonly number[],
  output?: readonly number[],
  options?: InterpolateOptions,
): SharedValue<unknown> {
  const list = (Array.isArray(sources) ? sources : [sources]) as SharedValue<unknown>[];
  const compute = (): unknown => {
    if (typeof transform === "function") {
      return Array.isArray(sources)
        ? (transform as (values: unknown[]) => unknown)(list.map((value) => value.get()))
        : (transform as (value: unknown) => unknown)(list[0]?.get());
    }
    return interpolate(transform, output as readonly number[], options)(Number(list[0]?.get()));
  };
  const derived = motionValue(compute());
  const offs = list.map((value) => value.on("change", () => derived.set(compute())));
  return {
    ...derived,
    destroy() {
      for (const off of offs) off();
      derived.destroy();
    },
  };
}

export interface SpringValueOptions extends SpringOptions {
  /** `user` (default): follow `prefers-reduced-motion` (jump to the target); `always`: jump; `never`: animate. */
  reducedMotion?: "user" | "always" | "never" | undefined;
}

/**
 * Framer's `useSpring` without React: a number that follows its target with a spring. `set()`
 * moves the target; with a shared value as `source`, the target follows it. The spring keeps its
 * velocity when the target moves mid-flight. Defaults: stiffness 100, damping 10, mass 1;
 * reduced motion jumps.
 */
export function springValue(
  source: number | SharedValue<number>,
  options: SpringValueOptions = {},
): SharedValue<number> {
  const followed = typeof source === "number" ? undefined : source;
  const value = motionValue(typeof source === "number" ? source : source.get());
  const params = springParameters(options);
  let target = value.get();
  let velocity = 0;
  let frame = 0;
  let last = 0;
  const reduced = () =>
    options.reducedMotion === "always" ||
    (options.reducedMotion !== "never" && prefersReducedMotion());
  // Rest thresholds scale with the distance (Framer's granular values below 5).
  const rest = () => {
    const small = Math.abs(target - value.get()) < 5 && Math.abs(velocity) < 5;
    return {
      delta: options.restDelta ?? (small ? 0.005 : 0.5),
      speed: options.restSpeed ?? (small ? 0.01 : 2),
    };
  };
  const cancel = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  };
  const step = (now: number) => {
    // At most 4 frames at a time (a background tab), in 1 ms steps.
    const elapsed = Math.min(Math.max(now - last, 0), 64);
    last = now;
    let position = value.get();
    const { stiffness, damping, mass } = params;
    for (let t = 0; t < elapsed; t++) {
      const force = -stiffness * (position - target) - damping * velocity;
      velocity += (force / mass) * 0.001;
      position += velocity * 0.001;
    }
    const { delta, speed } = rest();
    if (Math.abs(position - target) < delta && Math.abs(velocity) < speed) {
      velocity = 0;
      frame = 0;
      value.set(target);
      return;
    }
    value.set(position);
    frame = requestAnimationFrame(step);
  };
  const to = (next: number) => {
    target = next;
    if (reduced() || typeof requestAnimationFrame !== "function") {
      cancel();
      velocity = 0;
      value.set(next);
      return;
    }
    if (frame === 0 && next !== value.get()) {
      last = time();
      frame = requestAnimationFrame(step);
    }
  };
  const off = followed?.on("change", to);
  return {
    get: value.get,
    on: value.on,
    set: to,
    jump(next) {
      cancel();
      target = next;
      velocity = 0;
      value.set(next);
    },
    getVelocity: () => (frame ? velocity : 0),
    stop() {
      cancel();
      velocity = 0;
      target = value.get();
    },
    destroy() {
      cancel();
      off?.();
      value.destroy();
    },
  };
}

/** Shorthands of Framer's `style` (individual transform properties) and their units. */
const TRANSFORMS: Record<string, [property: "translate" | "scale" | "rotate", part: 0 | 1 | -1]> = {
  x: ["translate", 0],
  y: ["translate", 1],
  scale: ["scale", -1],
  scaleX: ["scale", 0],
  scaleY: ["scale", 1],
  rotate: ["rotate", -1],
};

const PX =
  /^(?:width|height|(?:min|max)(?:Width|Height)|top|right|bottom|left|inset|gap|fontSize|letterSpacing|borderRadius|(?:margin|padding)(?:Top|Right|Bottom|Left)?)$/;

const kebab = (name: string) =>
  name.startsWith("--") ? name : name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);

/** Transform parts written per element (`x` and `y` share `translate`). */
const parts = new WeakMap<Element, Record<string, unknown>>();

const unit = (name: string, value: unknown): string =>
  typeof value === "number"
    ? `${value}${name === "x" || name === "y" || PX.test(name) ? "px" : name === "rotate" ? "deg" : ""}`
    : String(value);

/**
 * The CSS declarations of Framer-style entries (`x`, `y`, `scale`, `scaleX`, `scaleY`, `rotate`
 * and any CSS property; numbers get px on lengths and deg on `rotate`), as camelCase properties
 * for a style object. `values` holds the current parts of the transforms.
 */
export function sharedStyle(values: Record<string, unknown>): Record<string, string> {
  const style: Record<string, string> = {};
  const translate = ["0px", "0px"];
  const scale = ["1", "1"];
  let hasTranslate = false;
  let hasScale = false;
  for (const [name, value] of Object.entries(values)) {
    const transform = TRANSFORMS[name];
    if (!transform) {
      style[name] = unit(name, value);
      continue;
    }
    const [property, part] = transform;
    if (property === "rotate") style["rotate"] = unit("rotate", value);
    else if (property === "translate") {
      hasTranslate = true;
      translate[part] = unit(name, value);
    } else {
      hasScale = true;
      if (part === -1) {
        scale[0] = String(value);
        scale[1] = String(value);
      } else scale[part] = String(value);
    }
  }
  if (hasTranslate) style["translate"] = translate.join(" ");
  if (hasScale) style["scale"] = scale.join(" ");
  return style;
}

/**
 * Writes `value` to `property` of `element` now and after each change, through CSSOM (Framer's
 * `style={{ x }}`; no `style` attribute in the markup). `property` is a CSS property (camelCase or
 * kebab-case) or a transform shorthand. Returns the function that stops it.
 */
export function bindStyle(
  element: HTMLElement | SVGElement,
  property: string,
  value: SharedValue<unknown>,
): () => void {
  const own = parts.get(element) ?? {};
  parts.set(element, own);
  const write = (next: unknown) => {
    const transform = TRANSFORMS[property];
    const entries: Record<string, unknown> = {};
    if (transform) {
      own[property] = next;
      for (const [name, [group]] of Object.entries(TRANSFORMS))
        if (group === transform[0] && name in own) entries[name] = own[name];
    } else entries[property] = next;
    for (const [name, text] of Object.entries(sharedStyle(entries)))
      element.style.setProperty(kebab(name), text);
  };
  write(value.get());
  const off = value.on("change", write);
  return () => {
    off();
    if (TRANSFORMS[property]) delete own[property];
  };
}
