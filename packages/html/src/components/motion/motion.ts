import {
  createMotionKeyframes,
  type MotionState,
  motionOptions,
  motionStyle,
  type PanAxis,
  type PanInfo,
  playExit,
  readNumber,
  replayMotion,
  type TapInfo,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";
import { driveMotion, type MotionViewportDetail, STATE } from "./drive.js";
import { driveGestures, type GestureEmitter } from "./gestures.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface MotionEvents {
  /** After the root's own animation ended. `state` is its `data-ok-state`. */
  end: EventSpec<{ state: string | null }>;
  /**
   * In view trigger: the element entered the viewport (the `data-ok-amount` fraction is visible).
   * `ratio` is the visible fraction. With `once` (the default) it fires the first time only.
   */
  enter: EventSpec<MotionViewportDetail>;
  /** In view trigger with `data-ok-once="false"`: the element left the viewport (nothing visible). */
  leave: EventSpec<MotionViewportDetail>;
  /**
   * A drag started (`data-ok-drag`): the pointer moved 3 px, or an arrow key moved the focused
   * element. `point` is the pointer on the page, `delta` the movement since the last event,
   * `offset` since the press, `velocity` in px per second.
   */
  dragstart: EventSpec<PanInfo>;
  /** The dragged element moved. Same detail as `dragstart`. */
  drag: EventSpec<PanInfo>;
  /** The pointer was released (or an arrow key's move ended). `velocity` is the release speed. */
  dragend: EventSpec<PanInfo>;
  /** With `data-ok-drag-direction-lock`: the axis the drag locked to (`x` or `y`). */
  directionlock: EventSpec<{ axis: PanAxis }>;
  /** The glide or spring after a release came to rest. */
  dragtransitionend: EventSpec;
  /** A mouse or pen pointer entered the element. */
  hoverstart: EventSpec;
  /** The pointer left the element. */
  hoverend: EventSpec;
  /** A press started: a primary pointer, or Enter or Space on the focused element. `point` is on the page. */
  tapstart: EventSpec<TapInfo>;
  /** The press ended on the element (a tap). */
  tap: EventSpec<TapInfo>;
  /** The press ended outside the element, was cancelled or turned into a drag. */
  tapcancel: EventSpec<TapInfo>;
}

export interface MotionInstance extends ComponentInstance {
  /** `initial`, `enter` or `exit`. */
  readonly state: MotionState;
  /** Plays the entrance again. */
  replay(): void;
  /** Plays the exit. Resolves `true` when it ended, `false` when `replay()` interrupted it. */
  exit(): Promise<boolean>;
  /** Plays the exit, then hides the element (`hidden`). Resolves `false` when interrupted. */
  hide(): Promise<boolean>;
  /** Plays the exit, then removes the element from the page. Resolves `false` when interrupted. */
  remove(): Promise<boolean>;
}

const { duration, delay, distance } = motionOptions.options;
const { variant } = motionOptions.options;
const TUNING = [duration.attr, delay.attr, distance.attr];
/** Attributes that change how it looks: an entered Motion replays. */
const LOOK = [variant.attr, duration.attr, distance.attr];

/**
 * Motion — spec: specs/components/motion.md
 *
 * Markup:  <div data-ok-motion data-ok-variant="fadeInUp" [data-ok-trigger="inView|mount|manual"]
 *               [data-ok-once="false"] [data-ok-amount="0.3"] [data-ok-in] [data-ok-duration]
 *               [data-ok-delay] [data-ok-distance] [data-ok-paused]
 *               [data-ok-viewport-margin="0px 0px -100px"] [data-ok-viewport-root="<id>"]>…</div>
 *          (any element, not only a `div`)
 * Behavior: writes `data-ok-state` (initial → enter, exit) from its trigger (core
 *          `createMotionTrigger`); the CSS plays the animation, or core `createMotionKeyframes`
 *          plays `data-ok-keyframes` / `data-ok-transition` (JSON). Without the runtime nothing
 *          is hidden. A Motion inside a MotionGroup is driven by the group. `exit()`, `hide()`
 *          and `remove()` play the exit before acting (core `playExit`).
 * Events:  ok:motion:end (`{ state }`) when its animation ends; ok:motion:enter / leave
 *          (`{ ratio }`) when an in-view Motion enters or leaves the viewport. Gestures
 *          (`data-ok-drag*`, `data-ok-while-*`, core `createMotionGestures`): dragstart, drag,
 *          dragend, directionlock, dragtransitionend, hoverstart, hoverend, tapstart, tap,
 *          tapcancel.
 */
export const motion = defineComponent<MotionInstance, MotionEvents>({
  name: "motion",
  selector: "[data-ok-motion]",

  setup(element, { emit, signal }) {
    let written: string[] = [];
    const tune = () => {
      written = syncCustomProperties(
        element,
        motionStyle({
          duration: readNumber(element, duration),
          delay: readNumber(element, delay),
          distance: readNumber(element, distance),
        }),
        written,
      );
    };
    tune();
    element.addEventListener(
      "animationend",
      (event) => {
        if (event.target === element) emit("end", { state: element.getAttribute(STATE) });
      },
      { signal },
    );
    const write = (state: MotionState | null) => {
      if (state === null) element.removeAttribute(STATE);
      else element.setAttribute(STATE, state);
    };
    // The enclosing group writes the state.
    const driver = element.parentElement?.closest("[data-ok-motion-group]")
      ? undefined
      : driveMotion(element, write, (inView, detail) => emit(inView ? "enter" : "leave", detail));
    const tuning = new MutationObserver((records) => {
      tune();
      const looks = records.some((record) => LOOK.includes(record.attributeName as string));
      if (looks && element.getAttribute(STATE) === "enter") replayMotion(element, write);
    });
    tuning.observe(element, { attributes: true, attributeFilter: [...TUNING, variant.attr] });
    const keyframes = createMotionKeyframes(element);
    const gestures = driveGestures(element, emit as GestureEmitter);

    let leaving: ReturnType<typeof playExit> | undefined;
    const leave = async (after?: () => void) => {
      leaving?.cancel();
      const current = playExit(element);
      leaving = current;
      const ended = await current.finished;
      if (leaving === current) leaving = undefined;
      if (ended) after?.();
      return ended;
    };

    return {
      get state() {
        return driver ? driver.state : (element.getAttribute(STATE) as MotionState);
      },
      replay() {
        leaving?.cancel();
        leaving = undefined;
        if (driver) driver.replay();
        else replayMotion(element, write);
      },
      exit() {
        return leave();
      },
      hide() {
        return leave(() => {
          element.hidden = true;
        });
      },
      remove() {
        return leave(() => element.remove());
      },
      destroy() {
        driver?.destroy();
        tuning.disconnect();
        keyframes.destroy();
        gestures.destroy();
        syncCustomProperties(element, {}, written);
      },
    };
  },
});
