import { type MotionState, motionGroupOptions, motionStyle, readNumber } from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";
import { driveMotion, type MotionViewportDetail, STATE } from "../motion/drive.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface MotionGroupEvents {
  /** In view trigger: the group entered the viewport. `ratio` is its visible fraction. */
  enter: EventSpec<MotionViewportDetail>;
  /** In view trigger with `data-ok-once="false"`: the group left the viewport. */
  leave: EventSpec<MotionViewportDetail>;
}

export interface MotionGroupInstance extends ComponentInstance {
  /** The motion's state (`initial`, `animate` or `exit`). */
  readonly state: MotionState;
  /** Plays the entrances again. */
  replay(): void;
}

const { delay, stagger } = motionGroupOptions.options;
const GROUP = "[data-ok-motion-group]";

/**
 * MotionGroup — spec: specs/components/motion.md
 *
 * Markup:  <div data-ok-motion-group [data-ok-stagger="50"] [trigger options]>
 *            <div data-ok-motion data-ok-variant="fadeInUp">…</div> …
 *          </div>
 * Behavior: its trigger drives every Motion inside it (whose closest group it is); direct
 *          children are staggered in order (`--_ok-motion-index` through CSSOM).
 * Events:  ok:motion-group:enter / leave (`{ ratio }`) with the in-view trigger.
 */
export const motionGroup = defineComponent<MotionGroupInstance, MotionGroupEvents>({
  name: "motion-group",
  selector: GROUP,

  setup(element, { emit }) {
    let written = syncCustomProperties(
      element,
      motionStyle({ delay: readNumber(element, delay), stagger: readNumber(element, stagger) }),
      [],
    );
    const indexed = new Map<HTMLElement, string[]>();
    // Every direct child takes a position, as in React (SVG children have a `style` too).
    [...(element.children as HTMLCollectionOf<HTMLElement>)].forEach((child, index) => {
      indexed.set(child, syncCustomProperties(child, motionStyle({ index }), []));
    });
    const items = () =>
      [...element.querySelectorAll<HTMLElement>("[data-ok-motion]")].filter(
        (item) => item.parentElement?.closest(GROUP) === element,
      );
    const write = (state: MotionState | null) => {
      for (const item of items()) {
        if (state === null) item.removeAttribute(STATE);
        else item.setAttribute(STATE, state);
      }
      if (state === null) element.removeAttribute(STATE);
      else element.setAttribute(STATE, state);
    };
    const driver = driveMotion(element, write, (inView, detail) =>
      emit(inView ? "enter" : "leave", detail),
    );
    return {
      get state() {
        return driver.state;
      },
      replay() {
        driver.replay();
      },
      destroy() {
        driver.destroy();
        written = syncCustomProperties(element, {}, written);
        for (const [child, names] of indexed) syncCustomProperties(child, {}, names);
      },
    };
  },
});
