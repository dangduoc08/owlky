import {
  type AnimateOptions,
  type AnimationControls,
  animate,
  type MotionKeyframes,
  type MotionValue,
  motionTracks,
} from "./animate.js";

/*
 * Declarative keyframes on a Motion — spec: specs/components/motion.md, ADR-0062 (7).
 * `data-ok-keyframes` (Framer's `animate` object, JSON) and `data-ok-transition` (its
 * `transition`, JSON, ms). The player watches `data-ok-state` (written by the owner): `enter`
 * plays the keyframes, `exit` plays them backwards, `data-ok-paused` pauses them. React writes
 * the same attributes, so both owners share this player.
 */

export const KEYFRAMES_ATTR = "data-ok-keyframes";
export const TRANSITION_ATTR = "data-ok-transition";
const REDUCE = "(prefers-reduced-motion: reduce)";

const PROPERTY = /^(?:--[a-zA-Z0-9-]+|[a-zA-Z]+)$/;
const MAX_TEXT = 200;
const MAX_FRAMES = 64;

const value = (input: unknown): MotionValue | null | undefined => {
  if (input === null) return null;
  if (typeof input === "number") return Number.isFinite(input) ? input : undefined;
  if (typeof input === "string" && input.length <= MAX_TEXT && !/[;{}<>]|url\(/i.test(input))
    return input;
  return undefined;
};

/** The keyframes of a JSON text or object, keeping only safe properties and values; invalid → `undefined`. */
export function parseMotionKeyframes(input: unknown): MotionKeyframes | undefined {
  let data = input;
  if (typeof input === "string") {
    try {
      data = JSON.parse(input);
    } catch {
      return undefined;
    }
  }
  if (data === null || typeof data !== "object" || Array.isArray(data)) return undefined;
  const result: MotionKeyframes = {};
  for (const [name, raw] of Object.entries(data as Record<string, unknown>)) {
    if (!PROPERTY.test(name)) continue;
    if (Array.isArray(raw)) {
      const frames = raw.slice(0, MAX_FRAMES).map(value);
      if (frames.length > 0 && frames.every((frame) => frame !== undefined))
        result[name] = frames as (MotionValue | null)[];
    } else {
      const single = value(raw);
      if (single !== undefined && single !== null) result[name] = single;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

const NUMBERS = [
  "duration",
  "delay",
  "repeatDelay",
  "stiffness",
  "damping",
  "mass",
  "velocity",
  "bounce",
  "visualDuration",
  "restDelta",
  "restSpeed",
] as const;

/**
 * The transition of a JSON text or object (Framer's `transition`, ms). `repeat` takes a number,
 * `Infinity` or `"Infinity"` (JSON has no infinity); unknown keys and values are dropped.
 */
export function parseMotionTransition(input: unknown): AnimateOptions {
  let data = input;
  if (typeof input === "string") {
    try {
      data = JSON.parse(input);
    } catch {
      return {};
    }
  }
  if (data === null || typeof data !== "object" || Array.isArray(data)) return {};
  const source = data as Partial<
    Record<
      | (typeof NUMBERS)[number]
      | "repeat"
      | "type"
      | "repeatType"
      | "reducedMotion"
      | "ease"
      | "times",
      unknown
    >
  >;
  const result: AnimateOptions = {};
  for (const key of NUMBERS) {
    const raw = source[key];
    if (typeof raw === "number" && Number.isFinite(raw)) result[key] = raw;
  }
  if (source.repeat === Infinity || source.repeat === "Infinity") result.repeat = Infinity;
  else if (
    typeof source.repeat === "number" &&
    Number.isFinite(source.repeat) &&
    source.repeat >= 0
  )
    result.repeat = source.repeat;
  if (source.type === "spring" || source.type === "tween") result.type = source.type;
  if (
    source.repeatType === "loop" ||
    source.repeatType === "reverse" ||
    source.repeatType === "mirror"
  )
    result.repeatType = source.repeatType;
  if (
    source.reducedMotion === "user" ||
    source.reducedMotion === "always" ||
    source.reducedMotion === "never"
  )
    result.reducedMotion = source.reducedMotion;
  const ease = source.ease;
  const easing = (item: unknown) => typeof item === "string" && item.length <= MAX_TEXT;
  if (easing(ease)) result.ease = ease as string;
  else if (Array.isArray(ease)) {
    if (
      ease.length === 4 &&
      ease.every((item) => typeof item === "number" && Number.isFinite(item))
    )
      result.ease = ease as unknown as [number, number, number, number];
    else if (ease.length > 0 && ease.every(easing)) result.ease = ease as string[];
  }
  if (Array.isArray(source.times) && source.times.every((item) => typeof item === "number"))
    result.times = source.times as number[];
  return result;
}

export interface MotionKeyframesPlayer {
  /** Stops watching and drops a running animation. */
  destroy(): void;
}

/**
 * Plays the element's `data-ok-keyframes` when its `data-ok-state` is `enter` and backwards when
 * it is `exit`. Values given as a single target return to what the element showed before its
 * first entrance. Does nothing while the element has no keyframes.
 */
export function createMotionKeyframes(element: HTMLElement): MotionKeyframesPlayer {
  let controls: AnimationControls | undefined;
  let before: Map<string, string> | undefined;
  let shown: string | null = null;

  const read = () => parseMotionKeyframes(element.getAttribute(KEYFRAMES_ATTR));
  const options = () => parseMotionTransition(element.getAttribute(TRANSITION_ATTR));
  const pause = () => {
    if (element.hasAttribute("data-ok-paused")) controls?.pause();
    else controls?.play();
  };

  const enter = (keyframes: MotionKeyframes) => {
    if (!before) {
      before = new Map();
      const css = getComputedStyle(element);
      for (const { property } of motionTracks(element, keyframes))
        before.set(property, css.getPropertyValue(kebab(property)).trim());
    }
    controls?.stop();
    controls = animate(element, keyframes, options());
    pause();
  };

  const exit = (keyframes: MotionKeyframes) => {
    if (!before) return;
    const back: MotionKeyframes = {};
    for (const { property, values } of motionTracks(element, keyframes)) {
      back[property] =
        values[0] === null && values.length === 2
          ? [null, before.get(property) ?? (values[1] as string)]
          : [...values].reverse();
    }
    controls?.stop();
    const { repeat: _repeat, repeatDelay: _delay, delay: _wait, ...rest } = options();
    controls = animate(element, back, rest);
    pause();
  };

  const sync = () => {
    const keyframes = read();
    const state = element.getAttribute("data-ok-state");
    if (!keyframes) {
      controls?.cancel();
      controls = undefined;
      shown = state;
      return;
    }
    if (state === shown) return;
    shown = state;
    if (state === "enter") enter(keyframes);
    else if (state === "exit") exit(keyframes);
  };

  const observer = new MutationObserver((records) => {
    if (records.some((record) => record.attributeName === "data-ok-paused")) pause();
    if (
      records.some(
        (record) =>
          record.attributeName === KEYFRAMES_ATTR || record.attributeName === TRANSITION_ATTR,
      )
    )
      shown = null;
    sync();
  });
  observer.observe(element, {
    attributes: true,
    attributeFilter: ["data-ok-state", KEYFRAMES_ATTR, TRANSITION_ATTR, "data-ok-paused"],
  });
  // The user turns reduced motion on or off: play the current state again under the new rule
  // (loops stop or start).
  const media = typeof matchMedia === "function" ? matchMedia(REDUCE) : undefined;
  const onMedia = () => {
    controls?.cancel();
    controls = undefined;
    shown = null;
    sync();
  };
  media?.addEventListener("change", onMedia);
  sync();

  return {
    destroy() {
      media?.removeEventListener("change", onMedia);
      observer.disconnect();
      controls?.cancel();
      controls = undefined;
    },
  };
}

const kebab = (name: string) =>
  name.startsWith("--") ? name : name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);

/**
 * The attributes of declarative keyframes (React writes them as the HTML markup has them):
 * `data-ok-keyframes` and `data-ok-transition` as JSON (`Infinity` as `"Infinity"`). Invalid or
 * absent keyframes → none.
 */
export function motionKeyframesAttributes(
  keyframes: MotionKeyframes | undefined,
  transition?: AnimateOptions | undefined,
): Partial<Record<typeof KEYFRAMES_ATTR | typeof TRANSITION_ATTR, string>> {
  const parsed = keyframes === undefined ? undefined : parseMotionKeyframes(keyframes);
  if (!parsed) return {};
  const attributes: Partial<Record<typeof KEYFRAMES_ATTR | typeof TRANSITION_ATTR, string>> = {
    [KEYFRAMES_ATTR]: JSON.stringify(parsed),
  };
  if (transition) {
    const options = parseMotionTransition(transition);
    if (Object.keys(options).length > 0)
      attributes[TRANSITION_ATTR] = JSON.stringify(options, (_key, value) =>
        value === Infinity ? "Infinity" : value,
      );
  }
  return attributes;
}
