import {
  countUpOptions,
  createCountUp,
  createMotionTrigger,
  readBehavior,
  readNumber,
  readStyle,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";

export interface CountUpInstance extends ComponentInstance {
  /** Counts again from the start. */
  replay(): void;
}

const { start, end, decimals, duration, trigger, once, amount } = countUpOptions.options;
const IN = "data-ok-in";

/**
 * CountUp — spec: specs/components/motion.md
 *
 * Markup:  <span data-ok-count-up data-ok-end="200" [data-ok-start] [data-ok-decimals]
 *                [data-ok-duration] [trigger options]>
 *            <span data-ok-count-up-label>200k</span>
 *            <span aria-hidden="true"><span data-ok-count-up-value>0</span>k</span>
 *          </span>
 * Behavior: counts the value from start to end (core `createCountUp`) when its trigger fires;
 *          assistive technologies read the label. Reduced motion shows the end at once.
 */
export const countUp = defineComponent<CountUpInstance>({
  name: "count-up",
  selector: "[data-ok-count-up]",

  setup(element) {
    const value = element.querySelector<HTMLElement>("[data-ok-count-up-value]");
    const counter = createCountUp({
      start: readNumber(element, start) as number,
      end: readNumber(element, end) as number,
      decimals: Math.round(readNumber(element, decimals) as number),
      duration: readNumber(element, duration) as number,
      onUpdate(text) {
        if (value) value.textContent = text;
      },
    });
    const handle = createMotionTrigger(element, {
      trigger: readStyle(element, trigger),
      once: readBehavior(element, once),
      amount: readNumber(element, amount) as number,
      in: element.hasAttribute(IN),
      onChange: (active) => {
        if (active) counter.run();
      },
    });
    const observer = new MutationObserver(() => handle.update(element.hasAttribute(IN)));
    observer.observe(element, { attributes: true, attributeFilter: [IN] });
    return {
      replay() {
        counter.run();
      },
      destroy() {
        handle.destroy();
        counter.destroy();
        observer.disconnect();
      },
    };
  },
});
