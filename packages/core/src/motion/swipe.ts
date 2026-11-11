/*
 * Swipe — spec: specs/components/motion.md (Gestures), ADR-0062 (5.3). A swipe is a pan
 * (`trackPan`, the drag gesture's pointer layer) along one axis: the first 3 px of movement pick
 * the axis, a press that moves along an axis with no allowed direction is let go (the page can
 * scroll), and the release counts as a swipe when it went far enough (`threshold`) or fast enough
 * (`velocity`) in an allowed direction. Owners draw the movement (`onMove`) and decide what a
 * swipe does. Used by the swipeable Drawer.
 */
import { type PanInfo, trackPan } from "./drag.js";

export type { SwipeDirection } from "../toast/toaster-controller.js";

import type { SwipeDirection } from "../toast/toaster-controller.js";

/** A pan, along the swipe's axis. */
export interface SwipeInfo extends PanInfo {
  /** The axis picked by the first movement. */
  axis: "x" | "y";
  /** Where the movement points now along that axis (`null`: back at the start). */
  direction: SwipeDirection | null;
  /** Movement along the axis, px: positive towards `direction`. */
  distance: number;
  /** Speed along the axis towards `direction`, px/s (negative: moving back). */
  speed: number;
}

export interface SwipeOptions {
  /** Directions that count, such as `["right"]` (`top`, `right`, `bottom`, `left`). Read on every press. */
  directions: readonly SwipeDirection[] | (() => readonly SwipeDirection[]);
  /** Distance (px) that makes a swipe; a function is read at the release. Default 50. */
  threshold?: number | (() => number) | undefined;
  /** Speed (px/s) towards the direction that makes a swipe however short. Default 450. */
  velocity?: number | (() => number) | undefined;
  /** Only these pointer types, such as `["touch", "pen"]`. Default: every type. */
  pointerTypes?: readonly string[] | undefined;
  /** Whether a press may start a swipe. */
  filter?: ((event: PointerEvent) => boolean) | undefined;
  /** A press was accepted (before any movement). */
  onPress?: ((event: PointerEvent) => void) | undefined;
  /** The movement picked an axis with an allowed direction. `onMove` follows. */
  onStart?: ((info: SwipeInfo, event: PointerEvent) => void) | undefined;
  onMove?: ((info: SwipeInfo, event: PointerEvent) => void) | undefined;
  /** Released past the threshold (or fast enough) in an allowed direction. */
  onSwipe?: ((info: SwipeInfo, event: PointerEvent) => void) | undefined;
  /**
   * The press ended without a swipe: released short or back, moved along the other axis, or
   * cancelled. `info` is `null` when no swipe had started.
   */
  onCancel?: ((info: SwipeInfo | null) => void) | undefined;
}

export interface SwipeHandle {
  /** A swipe is in progress. */
  readonly swiping: boolean;
  /** Ends the current press as cancelled. */
  cancel(): void;
  destroy(): void;
}

const along = (axis: "x" | "y", info: PanInfo, directions: readonly SwipeDirection[]) => {
  const raw = info.offset[axis];
  const [negative, positive]: [SwipeDirection, SwipeDirection] =
    axis === "x" ? ["left", "right"] : ["top", "bottom"];
  // An axis with one allowed direction measures towards it (moving back is negative).
  const sign =
    directions.includes(positive) && !directions.includes(negative)
      ? 1
      : directions.includes(negative) && !directions.includes(positive)
        ? -1
        : Math.sign(raw) || 1;
  const direction: SwipeDirection | null = raw === 0 ? null : raw > 0 ? positive : negative;
  return {
    axis,
    direction,
    // `|| 0`: no negative zero.
    distance: raw * sign || 0,
    speed: info.velocity[axis] * sign || 0,
  };
};

/** Swipes on `element` (see the file comment). */
export function createSwipe(element: HTMLElement, options: SwipeOptions): SwipeHandle {
  let axis: "x" | "y" | null = null;
  let swiping = false;
  let directions: readonly SwipeDirection[] = [];

  const list = () =>
    typeof options.directions === "function" ? options.directions() : options.directions;
  const swipeInfo = (info: PanInfo): SwipeInfo => ({
    ...info,
    ...along(axis as "x" | "y", info, directions),
  });
  const reset = () => {
    axis = null;
    swiping = false;
  };

  const pan = trackPan(element, {
    pointerTypes: options.pointerTypes,
    filter: (event) => {
      directions = list();
      return directions.length > 0 && (!options.filter || options.filter(event));
    },
    onPress: (event) => options.onPress?.(event),
    onStart: (info, event) => {
      axis = Math.abs(info.offset.x) >= Math.abs(info.offset.y) ? "x" : "y";
      const allowed =
        axis === "x"
          ? directions.includes("left") || directions.includes("right")
          : directions.includes("top") || directions.includes("bottom");
      if (!allowed) {
        pan.cancel();
        return;
      }
      swiping = true;
      options.onStart?.(swipeInfo(info), event);
    },
    onMove: (info, event) => {
      if (swiping) options.onMove?.(swipeInfo(info), event);
    },
    onEnd: (info, event) => {
      const result = swipeInfo(info);
      reset();
      const threshold =
        typeof options.threshold === "function" ? options.threshold() : (options.threshold ?? 50);
      const allowed = result.direction !== null && directions.includes(result.direction);
      const far = result.distance >= threshold;
      const velocity =
        typeof options.velocity === "function" ? options.velocity() : (options.velocity ?? 450);
      const fast = result.speed >= velocity;
      if (allowed && result.distance > 0 && (far || fast)) options.onSwipe?.(result, event);
      else options.onCancel?.(result);
    },
    onCancel: (started, info) => {
      const result = started && info && axis && swiping ? swipeInfo(info) : null;
      reset();
      options.onCancel?.(result);
    },
  });

  return {
    get swiping() {
      return swiping;
    },
    cancel() {
      pan.cancel();
    },
    destroy() {
      pan.destroy();
      reset();
    },
  };
}
