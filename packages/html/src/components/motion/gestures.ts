import {
  createMotionGestures,
  GESTURE_ATTR_NAMES,
  hasMotionGestures,
  type MotionGestureOptions,
  type MotionGestures,
  type PanAxis,
  type PanInfo,
  readMotionGestures,
  type TapInfo,
} from "@owlky/core";

/** What the motion runtime emits for gestures (`ok:motion:<name>`). */
export interface GestureEmitter {
  (type: "dragstart" | "drag" | "dragend", detail: PanInfo): void;
  (type: "directionlock", detail: { axis: PanAxis }): void;
  (type: "dragtransitionend" | "hoverstart" | "hoverend", detail: undefined): void;
  (type: "tapstart" | "tap" | "tapcancel", detail: TapInfo): void;
}

/**
 * Gestures of a Motion (ADR-0062, 5.3): reads `data-ok-drag*` and `data-ok-while-*` (and the
 * element's `data-ok-transition`), runs core `createMotionGestures`, follows attribute changes and
 * reports the gestures as events. Starts only once a gesture attribute is present.
 */
export function driveGestures(element: HTMLElement, emit: GestureEmitter): { destroy(): void } {
  let gestures: MotionGestures | undefined;
  const options = (): MotionGestureOptions => ({
    ...readMotionGestures(element),
    onDragStart: (info) => emit("dragstart", info),
    onDrag: (info) => emit("drag", info),
    onDragEnd: (info) => emit("dragend", info),
    onDirectionLock: (axis) => emit("directionlock", { axis }),
    onDragTransitionEnd: () => emit("dragtransitionend", undefined),
    onHoverStart: () => emit("hoverstart", undefined),
    onHoverEnd: () => emit("hoverend", undefined),
    onTapStart: (_event, info) => emit("tapstart", info),
    onTap: (_event, info) => emit("tap", info),
    onTapCancel: (_event, info) => emit("tapcancel", info),
  });
  const sync = () => {
    if (gestures) gestures.setOptions(options());
    else if (hasMotionGestures(element)) gestures = createMotionGestures(element, options());
  };
  sync();
  const observer = new MutationObserver(sync);
  observer.observe(element, {
    attributes: true,
    attributeFilter: [...GESTURE_ATTR_NAMES, "data-ok-transition"],
  });
  return {
    destroy() {
      observer.disconnect();
      gestures?.destroy();
      gestures = undefined;
    },
  };
}
