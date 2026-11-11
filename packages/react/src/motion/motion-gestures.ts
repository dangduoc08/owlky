"use client";

import {
  type AnimateOptions,
  createMotionGestures,
  type DragConstraints,
  type DragElastic,
  type DragTransition,
  type GestureTarget,
  type MotionGestureOptions,
  type MotionGestures,
  motionGestureAttributes,
  type PanAxis,
  type PanInfo,
  type TapInfo,
} from "@owlky/core";
import { type RefObject, useEffect, useRef } from "react";

/** Gesture props of Motion (Framer Motion's names, ADR-0062 5.3). */
export interface MotionGestureProps {
  /** Makes it draggable: `true` on both axes, `"x"` or `"y"` on one (the page still scrolls on the other). */
  drag?: boolean | "x" | "y" | undefined;
  /**
   * Where it may be dragged: a box in px from where it sits, such as `{ left: -100, right: 100 }`,
   * a ref to an element to stay inside, or that element's `id`.
   */
  dragConstraints?: DragConstraints | RefObject<Element | null> | string | undefined;
  /** How far it may be pulled past its constraints: 0 (not at all) to 1 (freely), or per side. Default 0.5. */
  dragElastic?: DragElastic | undefined;
  /** Glides on after a release, from the release velocity. Default `true`. */
  dragMomentum?: boolean | undefined;
  /** Springs back to where it started when released. */
  dragSnapToOrigin?: boolean | undefined;
  /** Moves only along the first axis the pointer moves on. */
  dragDirectionLock?: boolean | undefined;
  /**
   * Tunes the glide after a release (times in ms): `power`, `timeConstant`, `bounceStiffness`,
   * `bounceDamping`, `restDelta`, `restSpeed`, `modifyTarget(target, axis)`.
   */
  dragTransition?: DragTransition | undefined;
  /** Keyframes while a mouse or pen pointer is over it, such as `{ scale: 1.05 }` (a `transition` key tunes them). */
  whileHover?: GestureTarget | undefined;
  /** Keyframes while it is pressed (a pointer, or Enter or Space on it or on a button inside it). */
  whileTap?: GestureTarget | undefined;
  /** Keyframes while it, or something inside it, shows a keyboard focus ring. */
  whileFocus?: GestureTarget | undefined;
  /** Keyframes while it is dragged. */
  whileDrag?: GestureTarget | undefined;
  /** A drag started: the pointer moved 3 px, or an arrow key moved it. */
  onDragStart?: ((event: PointerEvent | KeyboardEvent, info: PanInfo) => void) | undefined;
  /** It moved while dragged. `info` has `point`, `delta`, `offset` and `velocity` (px per second). */
  onDrag?: ((event: PointerEvent | KeyboardEvent, info: PanInfo) => void) | undefined;
  /** The drag ended (`event` is `null` when the browser cancelled the pointer). */
  onDragEnd?: ((event: PointerEvent | KeyboardEvent | null, info: PanInfo) => void) | undefined;
  /** With `dragDirectionLock`: the axis the drag locked to. */
  onDirectionLock?: ((axis: PanAxis) => void) | undefined;
  /** The glide or spring after a release came to rest. */
  onDragTransitionEnd?: (() => void) | undefined;
  /** A mouse or pen pointer entered it. */
  onHoverStart?: ((event: PointerEvent) => void) | undefined;
  /** The pointer left it. */
  onHoverEnd?: ((event: PointerEvent) => void) | undefined;
  /** A press started. `info.point` is on the page. */
  onTapStart?: ((event: PointerEvent | KeyboardEvent, info: TapInfo) => void) | undefined;
  /** A press ended on it. */
  onTap?: ((event: PointerEvent | KeyboardEvent, info: TapInfo) => void) | undefined;
  /** A press ended outside it, was cancelled or became a drag. */
  onTapCancel?: ((event: Event, info: TapInfo) => void) | undefined;
}

/** The gesture props, split from the rest. */
export const GESTURE_PROPS = [
  "drag",
  "dragConstraints",
  "dragElastic",
  "dragMomentum",
  "dragSnapToOrigin",
  "dragDirectionLock",
  "dragTransition",
  "whileHover",
  "whileTap",
  "whileFocus",
  "whileDrag",
  "onDragStart",
  "onDrag",
  "onDragEnd",
  "onDirectionLock",
  "onDragTransitionEnd",
  "onHoverStart",
  "onHoverEnd",
  "onTapStart",
  "onTap",
  "onTapCancel",
] as const satisfies readonly (keyof MotionGestureProps)[];

const isRef = (value: unknown): value is RefObject<Element | null> =>
  typeof value === "object" && value !== null && "current" in value;

/** Splits `props` into the gesture props and the others. */
export function splitGestureProps<P extends MotionGestureProps>(
  props: P,
): [MotionGestureProps, Omit<P, (typeof GESTURE_PROPS)[number]>] {
  const gestures: Record<string, unknown> = {};
  const rest = { ...props } as Record<string, unknown>;
  for (const key of GESTURE_PROPS) {
    if (key in rest) {
      gestures[key] = rest[key];
      delete rest[key];
    }
  }
  return [gestures as MotionGestureProps, rest as Omit<P, (typeof GESTURE_PROPS)[number]>];
}

const used = (props: MotionGestureProps) =>
  GESTURE_PROPS.some((key) => props[key] !== undefined && props[key] !== false);

/**
 * Runs core `createMotionGestures` on `ref` while any gesture prop is set, with the latest props
 * on every render, and returns the attributes the HTML markup carries for them.
 */
export function useMotionGestures(
  ref: RefObject<HTMLElement | null>,
  props: MotionGestureProps,
  transition: AnimateOptions | undefined,
): ReturnType<typeof motionGestureAttributes> {
  const latest = useRef({ props, transition });
  latest.current = { props, transition };
  const handle = useRef<MotionGestures | null>(null);
  const active = used(props);

  const options = (): MotionGestureOptions => {
    const { props: p, transition: t } = latest.current;
    const constraints = p.dragConstraints;
    return {
      drag: p.drag,
      dragConstraints: isRef(constraints) ? constraints.current : constraints,
      dragElastic: p.dragElastic,
      dragMomentum: p.dragMomentum,
      dragSnapToOrigin: p.dragSnapToOrigin,
      dragDirectionLock: p.dragDirectionLock,
      dragTransition: p.dragTransition,
      whileHover: p.whileHover,
      whileTap: p.whileTap,
      whileFocus: p.whileFocus,
      whileDrag: p.whileDrag,
      transition: t,
      onDragStart: (info, event) => latest.current.props.onDragStart?.(event, info),
      onDrag: (info, event) => latest.current.props.onDrag?.(event, info),
      onDragEnd: (info, event) => latest.current.props.onDragEnd?.(event, info),
      onDirectionLock: (axis) => latest.current.props.onDirectionLock?.(axis),
      onDragTransitionEnd: () => latest.current.props.onDragTransitionEnd?.(),
      onHoverStart: (event) => latest.current.props.onHoverStart?.(event),
      onHoverEnd: (event) => latest.current.props.onHoverEnd?.(event),
      onTapStart: (event, info) => latest.current.props.onTapStart?.(event, info),
      onTap: (event, info) => latest.current.props.onTap?.(event, info),
      onTapCancel: (event, info) => latest.current.props.onTapCancel?.(event, info),
    };
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: options() reads the latest props.
  useEffect(() => {
    const element = ref.current;
    if (!active || !element) return;
    const gestures = createMotionGestures(element, options());
    handle.current = gestures;
    return () => {
      gestures.destroy();
      handle.current = null;
    };
  }, [ref, active]);

  // The latest props after every render (a ref's element, new callbacks, new states).
  useEffect(() => {
    handle.current?.setOptions(options());
  });

  const constraints = props.dragConstraints;
  return motionGestureAttributes({
    ...props,
    dragConstraints: isRef(constraints) ? undefined : constraints,
    transition,
  });
}
