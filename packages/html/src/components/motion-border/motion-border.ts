import { motionBorderOptions, readNumber } from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";

const { width, duration } = motionBorderOptions.options;

/**
 * MotionBorder — spec: specs/components/motion.md
 *
 * Markup:  <div data-ok-motion-border [data-ok-shape="circle"] [data-ok-color="primary"]
 *               [data-ok-width="3"] [data-ok-duration="4000"] [data-ok-paused]>…</div>
 * Behavior: CSS turns the border; the runtime only writes the width and the duration as private
 *          properties (CSSOM), again when those attributes change.
 */
export const motionBorder = defineComponent({
  name: "motion-border",
  selector: "[data-ok-motion-border]",

  setup(element) {
    let written: string[] = [];
    const tune = () => {
      const px = readNumber(element, width);
      const ms = readNumber(element, duration);
      written = syncCustomProperties(
        element,
        {
          "--_ok-motion-border-width": `${px}px`,
          ...(ms !== undefined ? { "--_ok-motion-border-duration": `${ms}ms` } : {}),
        },
        written,
      );
    };
    tune();
    const observer = new MutationObserver(tune);
    observer.observe(element, { attributes: true, attributeFilter: [width.attr, duration.attr] });
    return {
      destroy() {
        observer.disconnect();
        syncCustomProperties(element, {}, written);
      },
    };
  },
});
