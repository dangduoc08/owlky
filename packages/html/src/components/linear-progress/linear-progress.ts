import {
  linearProgressOptions,
  linearProgressStyle,
  progressFraction,
  readNumber,
  readStyle,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";

const { options } = linearProgressOptions;
/** Attributes that move the bars; the runtime redraws when one of them changes. */
const OBSERVED = [
  options.variant.attr,
  options.value.attr,
  options.min.attr,
  options.max.attr,
  options.valueBuffer.attr,
];

const numberOf = (element: Element, key: "value" | "min" | "max" | "valueBuffer") => {
  const value = readNumber(element, options[key]);
  return typeof value === "number" ? value : undefined;
};

/**
 * Linear progress — spec: specs/components/linear-progress.md
 *
 * Markup:  <span role="progressbar" aria-label="Loading" data-ok-linear-progress
 *                data-ok-variant="indeterminate" data-ok-color="primary">
 *            <span data-ok-linear-progress-bar="1"></span><span data-ok-linear-progress-bar="2"></span>
 *          </span>
 * Determinate: one bar + aria-valuenow / -valuemin / -valuemax. Buffer: a
 * `data-ok-linear-progress-dashed` span first, both bars and data-ok-value-buffer.
 * The runtime turns the values into private custom properties (CSSOM) and redraws when those
 * attributes change: update `aria-valuenow` to show progress.
 */
export const linearProgress = defineComponent({
  name: "linear-progress",
  selector: "[data-ok-linear-progress]",

  setup(element) {
    let written: string[] = [];
    const draw = () => {
      const variant = readStyle(element, options.variant);
      const min = numberOf(element, "min");
      const max = numberOf(element, "max");
      written = syncCustomProperties(
        element,
        linearProgressStyle({
          fraction:
            variant === "determinate" || variant === "buffer"
              ? progressFraction(numberOf(element, "value"), min, max)
              : undefined,
          buffer:
            variant === "buffer"
              ? progressFraction(numberOf(element, "valueBuffer"), min, max)
              : undefined,
        }),
        written,
      );
    };
    draw();
    const observer = new MutationObserver(draw);
    observer.observe(element, { attributes: true, attributeFilter: OBSERVED });
    return {
      destroy() {
        observer.disconnect();
        syncCustomProperties(element, {}, written);
      },
    };
  },
});
