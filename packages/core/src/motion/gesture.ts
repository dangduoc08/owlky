/*
 * Gesture states — spec: specs/components/motion.md (Gestures), ADR-0062 (5.3). Framer Motion's
 * `whileHover`, `whileTap`, `whileFocus` and `whileDrag`: while a gesture is active the element
 * animates to that state's keyframes through `animate()` (springs for transforms by default),
 * and back to its own style when it ends. States layer in Framer's order (focus < hover < tap <
 * drag): a property follows the highest active state that names it. Tap also answers Enter and
 * Space on a focusable element (or a button inside it); hover ignores touch. `drag` adds the drag
 * gesture (`drag.ts`). Owners (React, the HTML runtime) pass the options and hear the callbacks.
 */
import { type AnimateOptions, animate, type MotionKeyframes, motionTracks } from "./animate.js";
import {
  createDrag,
  type DragConstraints,
  type DragController,
  type DragElastic,
  type DragOptions,
  type DragTransition,
  type PanAxis,
  type PanInfo,
  type Point,
} from "./drag.js";
import { parseMotionKeyframes } from "./keyframes.js";

/** A gesture state: keyframes (as `keyframes`) and, optionally, a `transition` of its own. */
export interface GestureTarget {
  [property: string]: MotionKeyframes[string] | AnimateOptions | undefined;
  transition?: AnimateOptions | undefined;
}

export type GestureState = "focus" | "hover" | "tap" | "drag";

/** Lowest to highest priority (Framer). */
const ORDER: readonly GestureState[] = ["focus", "hover", "tap", "drag"];
const KEY = {
  focus: "whileFocus",
  hover: "whileHover",
  tap: "whileTap",
  drag: "whileDrag",
} as const;

/** Where a tap happened. */
export interface TapInfo {
  /** The pointer on the page (keyboard taps: the element's center). */
  point: Point;
}

export interface MotionGestureOptions {
  /** Axes it can be dragged on: `true`, `"x"` or `"y"`. */
  drag?: boolean | "x" | "y" | undefined;
  /**
   * A box (px from where it sits), an element to stay inside while dragged, or that element's
   * `id` (looked up when a drag starts).
   */
  dragConstraints?: DragConstraints | Element | string | null | undefined;
  /** Pull past the constraints, 0–1 (per side). Default 0.5. */
  dragElastic?: DragElastic | undefined;
  /** Glides on after a release. Default `true`. */
  dragMomentum?: boolean | undefined;
  /** Springs back to its origin on release. */
  dragSnapToOrigin?: boolean | undefined;
  /** Moves only along the first axis the pointer moves on. */
  dragDirectionLock?: boolean | undefined;
  /** Tunes the glide after a release. */
  dragTransition?: DragTransition | undefined;
  whileHover?: GestureTarget | undefined;
  whileTap?: GestureTarget | undefined;
  whileFocus?: GestureTarget | undefined;
  whileDrag?: GestureTarget | undefined;
  /** The element's transition: used by states that have none of their own. */
  transition?: AnimateOptions | undefined;
  /** `user` (default) follows `prefers-reduced-motion`; `always` / `never` force it. */
  reducedMotion?: "user" | "always" | "never" | undefined;
  onDragStart?: DragOptions["onDragStart"];
  onDrag?: DragOptions["onDrag"];
  onDragEnd?: DragOptions["onDragEnd"];
  onDirectionLock?: ((axis: PanAxis) => void) | undefined;
  onDragTransitionEnd?: (() => void) | undefined;
  onHoverStart?: ((event: PointerEvent) => void) | undefined;
  onHoverEnd?: ((event: PointerEvent) => void) | undefined;
  onTapStart?: ((event: PointerEvent | KeyboardEvent, info: TapInfo) => void) | undefined;
  onTap?: ((event: PointerEvent | KeyboardEvent, info: TapInfo) => void) | undefined;
  onTapCancel?: ((event: Event, info: TapInfo) => void) | undefined;
}

export interface MotionGestures {
  /** The gesture states active now. */
  readonly active: ReadonlySet<GestureState>;
  setOptions(options: MotionGestureOptions): void;
  destroy(): void;
}

const SPRING_MOVE: AnimateOptions = { type: "spring", stiffness: 500, damping: 25 };
const SPRING_SCALE: AnimateOptions = { type: "spring", stiffness: 550, damping: 30 };
const TWEEN: AnimateOptions = { duration: 300, ease: [0.25, 0.1, 0.35, 1] };

/** Framer's defaults: springs for moves and scales, a short tween for everything else. */
export const gestureTransition = (property: string): AnimateOptions =>
  property === "translate" || property === "rotate"
    ? SPRING_MOVE
    : property === "scale"
      ? SPRING_SCALE
      : TWEEN;

/** Keyboard taps: on the element itself or a control inside it. */
const PRESSABLE = 'button, a[href], [role="button"], summary';

const kebab = (name: string) =>
  name.startsWith("--") ? name : name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);

/** A state's keyframes (filtered like `data-ok-keyframes`) and its own transition. */
export function splitGestureTarget(
  target: GestureTarget | undefined,
): { keyframes: MotionKeyframes; transition: AnimateOptions | undefined } | undefined {
  if (!target) return undefined;
  const { transition, ...rest } = target;
  const keyframes = parseMotionKeyframes(rest);
  return keyframes ? { keyframes, transition } : undefined;
}

/**
 * Hover, tap, focus and drag on `element`, each animating to its `while…` state. Returns a
 * handle whose `setOptions` takes the owner's latest options (callbacks included).
 */
export function createMotionGestures(
  element: HTMLElement,
  initial: MotionGestureOptions,
): MotionGestures {
  let options = initial;
  const active = new Set<GestureState>();
  /** What each property looked like before a state took it: computed and inline values. */
  const base = new Map<string, { computed: string; inline: string }>();
  /** The values each targeted property is animating to (serialized). */
  const targets = new Map<string, string>();
  const generation = new Map<string, number>();
  const listeners = new AbortController();
  const { signal } = listeners;
  let tapping: { key: string | null; events: AbortController } | null = null;
  let drag: DragController | undefined;

  const play = (property: string, values: (string | null)[], transition: AnimateOptions) => {
    const own = (generation.get(property) ?? 0) + 1;
    generation.set(property, own);
    const reducedMotion = options.reducedMotion ?? transition.reducedMotion;
    const controls = animate(element, { [property]: values }, { ...transition, reducedMotion });
    return { own, controls };
  };

  const update = () => {
    const desired = new Map<
      string,
      { values: (string | null)[]; transition: AnimateOptions | undefined }
    >();
    for (const state of ORDER) {
      if (!active.has(state)) continue;
      const target = splitGestureTarget(options[KEY[state]]);
      if (!target) continue;
      for (const { property, values } of motionTracks(element, target.keyframes))
        desired.set(property, { values, transition: target.transition });
    }
    const css = getComputedStyle(element);
    for (const [property, { values, transition }] of desired) {
      const key = JSON.stringify(values);
      if (targets.get(property) === key) continue;
      if (!base.has(property))
        base.set(property, {
          computed: css.getPropertyValue(kebab(property)).trim(),
          inline: element.style.getPropertyValue(kebab(property)),
        });
      targets.set(property, key);
      play(property, values, transition ?? options.transition ?? gestureTransition(property));
    }
    for (const property of [...targets.keys()]) {
      if (desired.has(property)) continue;
      targets.delete(property);
      // A targeted property always has its base (set when it was first targeted).
      const before = base.get(property) as { computed: string; inline: string };
      const { own, controls } = play(
        property,
        [null, before.computed],
        options.transition ?? gestureTransition(property),
      );
      // Back at rest: the element's own style again (no inline value left behind).
      controls.finished.then(() => {
        if (generation.get(property) !== own || targets.has(property)) return;
        base.delete(property);
        if (before.inline) element.style.setProperty(kebab(property), before.inline);
        else element.style.removeProperty(kebab(property));
      });
    }
  };

  const set = (state: GestureState, on: boolean) => {
    if (active.has(state) === on) return;
    if (on) active.add(state);
    else active.delete(state);
    update();
  };

  const center = (): Point => {
    const rect = element.getBoundingClientRect();
    return { x: rect.left + rect.width / 2 + scrollX, y: rect.top + rect.height / 2 + scrollY };
  };

  const endTap = (tap: boolean, event: Event, info: TapInfo) => {
    // Only called while a press is tracked (its listeners go with it).
    const current = tapping as NonNullable<typeof tapping>;
    tapping = null;
    current.events.abort();
    set("tap", false);
    if (tap) options.onTap?.(event as PointerEvent | KeyboardEvent, info);
    else options.onTapCancel?.(event, info);
  };

  // Hover: mouse and pen only (a touch "hover" would stick after the finger lifts).
  element.addEventListener(
    "pointerenter",
    (event) => {
      if (event.pointerType === "touch") return;
      options.onHoverStart?.(event);
      set("hover", true);
    },
    { signal },
  );
  element.addEventListener(
    "pointerleave",
    (event) => {
      if (event.pointerType === "touch" || !active.has("hover")) return;
      options.onHoverEnd?.(event);
      set("hover", false);
    },
    { signal },
  );

  element.addEventListener(
    "pointerdown",
    (event) => {
      if (tapping || !event.isPrimary || event.button !== 0) return;
      const events = new AbortController();
      tapping = { key: null, events };
      const view = element.ownerDocument.defaultView ?? window;
      const info = (from: PointerEvent): TapInfo => ({
        point: { x: from.clientX + scrollX, y: from.clientY + scrollY },
      });
      view.addEventListener(
        "pointerup",
        (up) => {
          if (up.pointerId !== event.pointerId) return;
          const rect = element.getBoundingClientRect();
          const inside =
            up.clientX >= rect.left &&
            up.clientX <= rect.right &&
            up.clientY >= rect.top &&
            up.clientY <= rect.bottom;
          endTap(inside, up, info(up));
        },
        { signal: events.signal },
      );
      view.addEventListener(
        "pointercancel",
        (cancel) => {
          if (cancel.pointerId === event.pointerId) endTap(false, cancel, info(cancel));
        },
        { signal: events.signal },
      );
      options.onTapStart?.(event, info(event));
      set("tap", true);
    },
    { signal },
  );

  const tapKey = (event: KeyboardEvent) => event.key === "Enter" || event.key === " ";
  const pressable = (target: EventTarget | null) =>
    target === element ||
    (target instanceof Element && element.contains(target) && target.closest(PRESSABLE) !== null);

  element.addEventListener(
    "keydown",
    (event) => {
      if (!tapKey(event) || event.repeat || tapping || !pressable(event.target)) return;
      const events = new AbortController();
      tapping = { key: event.key, events };
      options.onTapStart?.(event, { point: center() });
      set("tap", true);
    },
    { signal },
  );
  element.addEventListener(
    "keyup",
    (event) => {
      if (tapping?.key === event.key) endTap(true, event, { point: center() });
    },
    { signal },
  );

  // Focus: only a visible focus ring counts (Framer's `:focus-visible` rule).
  element.addEventListener(
    "focusin",
    (event) => {
      let visible = false;
      try {
        visible = (event.target as Element).matches(":focus-visible");
      } catch {
        visible = true;
      }
      if (visible) set("focus", true);
    },
    { signal },
  );
  element.addEventListener(
    "focusout",
    (event) => {
      const next = event.relatedTarget;
      if (next instanceof Node && element.contains(next)) return;
      if (tapping?.key) endTap(false, event, { point: center() });
      set("focus", false);
    },
    { signal },
  );

  const dragOptions = (): DragOptions => ({
    drag: options.drag,
    constraints:
      typeof options.dragConstraints === "string"
        ? () =>
            (element.getRootNode() as Document | ShadowRoot).getElementById(
              options.dragConstraints as string,
            )
        : options.dragConstraints,
    elastic: options.dragElastic,
    momentum: options.dragMomentum,
    snapToOrigin: options.dragSnapToOrigin,
    directionLock: options.dragDirectionLock,
    transition: options.dragTransition,
    reducedMotion: options.reducedMotion,
    onDragStart: (info: PanInfo, event) => options.onDragStart?.(info, event),
    onDrag: (info: PanInfo, event) => options.onDrag?.(info, event),
    onDragEnd: (info: PanInfo, event) => options.onDragEnd?.(info, event),
    onDirectionLock: (axis) => options.onDirectionLock?.(axis),
    onDragTransitionEnd: () => options.onDragTransitionEnd?.(),
    onDraggingChange: (dragging) => {
      // A drag is not a tap: the press is cancelled once the element moves.
      if (dragging && tapping && !tapping.key)
        endTap(false, new Event("pointercancel"), { point: center() });
      set("drag", dragging);
    },
  });

  const syncDrag = () => {
    if (options.drag && !drag) drag = createDrag(element, dragOptions());
    else if (!options.drag && drag) {
      drag.destroy();
      drag = undefined;
    } else drag?.setOptions(dragOptions());
  };
  syncDrag();

  return {
    active,
    setOptions(next) {
      options = next;
      syncDrag();
      if (active.size > 0 || targets.size > 0) update();
    },
    destroy() {
      listeners.abort();
      tapping?.events.abort();
      tapping = null;
      drag?.destroy();
      drag = undefined;
      active.clear();
    },
  };
}
