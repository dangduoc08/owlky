import {
  type MotionState,
  motionStyle,
  motionTextOptions,
  readNumber,
  replayMotion,
  splitMotionText,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";
import type { ComponentInstance } from "../../runtime/types.js";
import { driveMotion, STATE } from "../motion/drive.js";

export interface MotionTextInstance extends ComponentInstance {
  /** The motion's state (`initial`, `animate` or `exit`). */
  readonly state: MotionState;
  /** Plays the entrance again. */
  replay(): void;
}

const { variant, duration, delay, distance, stagger } = motionTextOptions.options;
const TUNING = [duration.attr, delay.attr, distance.attr, stagger.attr];
const LOOK = [variant.attr, duration.attr, distance.attr];
const CHAR = "[data-ok-motion-char]";

/** Hand-written markup holds plain text: build the label and the letters (no HTML parsing). */
function split(element: HTMLElement): void {
  const text = (element.textContent as string).trim();
  const label = document.createElement("span");
  label.setAttribute("data-ok-motion-text-label", "");
  label.textContent = text;
  const letters = document.createElement("span");
  letters.setAttribute("aria-hidden", "true");
  splitMotionText(text).forEach((word, w) => {
    if (w > 0) letters.append(" ");
    const box = document.createElement("span");
    box.setAttribute("data-ok-motion-text-word", "");
    for (const letter of word.letters) {
      const char = document.createElement("span");
      char.setAttribute("data-ok-motion-char", "");
      char.textContent = letter;
      box.append(char);
    }
    letters.append(box);
  });
  element.replaceChildren(label, letters);
}

/**
 * MotionText — spec: specs/components/motion.md
 *
 * Markup:  <span data-ok-motion-text data-ok-variant="fadeInUp" [trigger options]
 *                [data-ok-stagger="25"]>
 *            <span data-ok-motion-text-label>Text</span>
 *            <span aria-hidden="true"><span data-ok-motion-text-word><span data-ok-motion-char>T</span>…
 *          </span>   (or just the text: the runtime builds the rest)
 * Behavior: letters enter one after the other (`--_ok-motion-index` through CSSOM); assistive
 *          technologies read the visually hidden label.
 */
export const motionText = defineComponent<MotionTextInstance>({
  name: "motion-text",
  selector: "[data-ok-motion-text]",

  setup(element) {
    if (!element.querySelector(CHAR)) split(element);
    let written: string[] = [];
    const tune = () => {
      written = syncCustomProperties(
        element,
        motionStyle({
          duration: readNumber(element, duration),
          delay: readNumber(element, delay),
          distance: readNumber(element, distance),
          stagger: readNumber(element, stagger),
        }),
        written,
      );
    };
    tune();
    element.querySelectorAll<HTMLElement>(CHAR).forEach((char, index) => {
      syncCustomProperties(char, motionStyle({ index }), []);
    });
    const write = (state: MotionState | null) => {
      if (state === null) element.removeAttribute(STATE);
      else element.setAttribute(STATE, state);
    };
    const driver = driveMotion(element, write);
    const tuning = new MutationObserver((records) => {
      tune();
      const looks = records.some((record) => LOOK.includes(record.attributeName as string));
      if (looks && element.getAttribute(STATE) === "enter") replayMotion(element, write);
    });
    tuning.observe(element, { attributes: true, attributeFilter: [...TUNING, variant.attr] });
    return {
      get state() {
        return driver.state;
      },
      replay() {
        driver.replay();
      },
      destroy() {
        driver.destroy();
        tuning.disconnect();
        syncCustomProperties(element, {}, written);
      },
    };
  },
});
