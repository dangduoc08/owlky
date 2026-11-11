/*
 * Gesture attributes — spec: specs/components/motion.md (Gestures), ADR-0062 (5.3). The drag
 * and `while…` props are free values (JSON, element ids), so they aren't schema options (like
 * `data-ok-keyframes`): React writes them with `motionGestureAttributes`, the HTML runtime reads
 * them with `readMotionGestures`, and both hand the result to `createMotionGestures`.
 */
import type { AnimateOptions } from "./animate.js";
import type { DragConstraints, DragElastic, DragTransition } from "./drag.js";
import { type GestureTarget, type MotionGestureOptions, splitGestureTarget } from "./gesture.js";
import { parseMotionTransition } from "./keyframes.js";

export const GESTURE_ATTRS = {
  drag: "data-ok-drag",
  dragConstraints: "data-ok-drag-constraints",
  dragElastic: "data-ok-drag-elastic",
  dragMomentum: "data-ok-drag-momentum",
  dragSnapToOrigin: "data-ok-drag-snap-to-origin",
  dragDirectionLock: "data-ok-drag-direction-lock",
  dragTransition: "data-ok-drag-transition",
  whileHover: "data-ok-while-hover",
  whileTap: "data-ok-while-tap",
  whileFocus: "data-ok-while-focus",
  whileDrag: "data-ok-while-drag",
} as const;

type GestureAttribute = (typeof GESTURE_ATTRS)[keyof typeof GESTURE_ATTRS];

/** Every gesture attribute (for MutationObserver filters). */
export const GESTURE_ATTR_NAMES: readonly string[] = Object.values(GESTURE_ATTRS);

/** The serializable gesture props (React writes them as attributes). */
export interface MotionGestureValues {
  drag?: boolean | "x" | "y" | undefined;
  /** A box, or the id of the element to stay inside (an element or ref writes nothing). */
  dragConstraints?: DragConstraints | string | object | null | undefined;
  dragElastic?: DragElastic | undefined;
  dragMomentum?: boolean | undefined;
  dragSnapToOrigin?: boolean | undefined;
  dragDirectionLock?: boolean | undefined;
  dragTransition?: DragTransition | undefined;
  whileHover?: GestureTarget | undefined;
  whileTap?: GestureTarget | undefined;
  whileFocus?: GestureTarget | undefined;
  whileDrag?: GestureTarget | undefined;
  /** The element's transition: written as `data-ok-transition` along with any gesture. */
  transition?: AnimateOptions | undefined;
}

const SIDES = ["top", "right", "bottom", "left"] as const;
const TRANSITION_KEYS = [
  "power",
  "timeConstant",
  "bounceStiffness",
  "bounceDamping",
  "restDelta",
  "restSpeed",
] as const;

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

const json = (text: string | null): unknown => {
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/** A box of finite numbers (unknown keys dropped); nothing valid → `undefined`. */
export function parseDragBox(input: unknown): DragConstraints | undefined {
  if (!isObject(input)) return undefined;
  const box: DragConstraints = {};
  for (const side of SIDES) if (finite(input[side])) box[side] = input[side];
  return Object.keys(box).length > 0 ? box : undefined;
}

/** The glide options among numbers (`modifyTarget` is a function: React only). */
export function parseDragTransition(input: unknown): DragTransition | undefined {
  if (!isObject(input)) return undefined;
  const result: DragTransition = {};
  for (const key of TRANSITION_KEYS) if (finite(input[key])) result[key] = input[key];
  return Object.keys(result).length > 0 ? result : undefined;
}

/** `dragElastic` from its attribute: a number, `true` / `false` or a JSON box. */
export function parseDragElastic(text: string | null): DragElastic | undefined {
  if (text === null) return undefined;
  const value = text.trim();
  if (value === "true") return true;
  if (value === "false") return false;
  if (value.startsWith("{")) return parseDragBox(json(value));
  const number = Number(value);
  return value !== "" && Number.isFinite(number) ? number : undefined;
}

/** A gesture state from JSON text or an object: its keyframes and its own transition. */
export function parseGestureTarget(input: unknown): GestureTarget | undefined {
  const data = typeof input === "string" ? json(input) : input;
  if (!isObject(data)) return undefined;
  const split = splitGestureTarget(data as GestureTarget);
  if (!split) return undefined;
  const transition = isObject(data["transition"])
    ? parseMotionTransition(data["transition"])
    : undefined;
  return transition && Object.keys(transition).length > 0
    ? { ...split.keyframes, transition }
    : { ...split.keyframes };
}

const stringify = (value: unknown) =>
  JSON.stringify(value, (_key, item) => (item === Infinity ? "Infinity" : item));

/**
 * The attributes of the serializable gesture props, as the HTML markup writes them. Functions,
 * refs and elements write nothing (React passes them to the controller directly).
 */
export function motionGestureAttributes(
  values: MotionGestureValues,
): Partial<Record<GestureAttribute | "data-ok-transition", string>> {
  const attributes: Partial<Record<GestureAttribute | "data-ok-transition", string>> = {};
  const { drag } = values;
  if (drag === true) attributes[GESTURE_ATTRS.drag] = "";
  else if (drag === "x" || drag === "y") attributes[GESTURE_ATTRS.drag] = drag;
  if (drag) {
    const constraints = values.dragConstraints;
    if (typeof constraints === "string" && constraints.trim())
      attributes[GESTURE_ATTRS.dragConstraints] = constraints.trim();
    else {
      const box = parseDragBox(constraints);
      if (box) attributes[GESTURE_ATTRS.dragConstraints] = JSON.stringify(box);
    }
    const elastic = values.dragElastic;
    if (typeof elastic === "boolean" || finite(elastic))
      attributes[GESTURE_ATTRS.dragElastic] = String(elastic);
    else {
      const box = parseDragBox(elastic);
      if (box) attributes[GESTURE_ATTRS.dragElastic] = JSON.stringify(box);
    }
    if (values.dragMomentum === false) attributes[GESTURE_ATTRS.dragMomentum] = "false";
    if (values.dragSnapToOrigin) attributes[GESTURE_ATTRS.dragSnapToOrigin] = "";
    if (values.dragDirectionLock) attributes[GESTURE_ATTRS.dragDirectionLock] = "";
    const transition = parseDragTransition(values.dragTransition);
    if (transition) attributes[GESTURE_ATTRS.dragTransition] = JSON.stringify(transition);
  }
  for (const key of ["whileHover", "whileTap", "whileFocus", "whileDrag"] as const) {
    const target = parseGestureTarget(values[key]);
    if (target) attributes[GESTURE_ATTRS[key]] = stringify(target);
  }
  if (values.transition && Object.keys(attributes).length > 0) {
    const transition = parseMotionTransition(values.transition);
    if (Object.keys(transition).length > 0)
      attributes["data-ok-transition"] = stringify(transition);
  }
  return attributes;
}

/** Whether `element` carries any gesture attribute. */
export const hasMotionGestures = (element: Element): boolean =>
  GESTURE_ATTR_NAMES.some((name) => element.hasAttribute(name));

/**
 * The gesture options written on `element` (HTML): drag and its tuning, the `while…` states.
 * `data-ok-drag-constraints` is a JSON box or the id of an element (looked up when a drag starts).
 */
export function readMotionGestures(element: Element): MotionGestureOptions {
  const read = (name: string) => element.getAttribute(name);
  const dragText = read(GESTURE_ATTRS.drag);
  const drag =
    dragText === null
      ? undefined
      : dragText === "x" || dragText === "y"
        ? dragText
        : dragText === "" || dragText === "true" || dragText === "both";
  const constraintsText = read(GESTURE_ATTRS.dragConstraints)?.trim();
  const options: MotionGestureOptions = {
    drag,
    dragConstraints: constraintsText
      ? constraintsText.startsWith("{")
        ? parseDragBox(json(constraintsText))
        : constraintsText
      : undefined,
    dragElastic: parseDragElastic(read(GESTURE_ATTRS.dragElastic)),
    dragMomentum: read(GESTURE_ATTRS.dragMomentum) !== "false",
    dragSnapToOrigin: element.hasAttribute(GESTURE_ATTRS.dragSnapToOrigin),
    dragDirectionLock: element.hasAttribute(GESTURE_ATTRS.dragDirectionLock),
    dragTransition: parseDragTransition(json(read(GESTURE_ATTRS.dragTransition))),
    whileHover: parseGestureTarget(read(GESTURE_ATTRS.whileHover)),
    whileTap: parseGestureTarget(read(GESTURE_ATTRS.whileTap)),
    whileFocus: parseGestureTarget(read(GESTURE_ATTRS.whileFocus)),
    whileDrag: parseGestureTarget(read(GESTURE_ATTRS.whileDrag)),
  };
  const transition = read("data-ok-transition");
  if (transition) options.transition = parseMotionTransition(transition) as AnimateOptions;
  return options;
}
