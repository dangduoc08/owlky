import { type MotionState, motionGroupOptions, motionStyle, readNumber } from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";
import type { ComponentInstance } from "../../runtime/types.js";
import { driveMotion, STATE } from "../motion/drive.js";

export interface MotionGroupInstance extends ComponentInstance {
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
 */
export const motionGroup = defineComponent<MotionGroupInstance>({
  name: "motion-group",
  selector: GROUP,

  setup(element) {
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
    const driver = driveMotion(element, write);
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
