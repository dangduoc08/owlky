import {
  type MotionState,
  motionOptions,
  motionStyle,
  readNumber,
  replayMotion,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";
import { driveMotion, type MotionViewportDetail, STATE } from "./drive.js";

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
}

export interface MotionInstance extends ComponentInstance {
  /** `initial`, `enter` or `exit`. */
  readonly state: MotionState;
  /** Plays the entrance again. */
  replay(): void;
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
 *          `createMotionTrigger`); the CSS plays the animation. Without the runtime nothing is
 *          hidden. A Motion inside a MotionGroup is driven by the group.
 * Events:  ok:motion:end (`{ state }`) when its animation ends; ok:motion:enter / leave
 *          (`{ ratio }`) when an in-view Motion enters or leaves the viewport.
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

    return {
      get state() {
        return driver ? driver.state : (element.getAttribute(STATE) as MotionState);
      },
      replay() {
        if (driver) driver.replay();
        else replayMotion(element, write);
      },
      destroy() {
        driver?.destroy();
        tuning.disconnect();
        syncCustomProperties(element, {}, written);
      },
    };
  },
});
