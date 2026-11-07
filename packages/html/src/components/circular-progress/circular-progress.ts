import {
  circularProgressGeometry,
  circularProgressOptions,
  circularProgressStyle,
  parseNumber,
  progressFraction,
  progressSize,
  readNumber,
  readStyle,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";

const { options } = circularProgressOptions;
/** Attributes that change the drawing; the runtime redraws when one of them changes. */
const OBSERVED = [
  options.variant.attr,
  options.value.attr,
  options.min.attr,
  options.max.attr,
  options.size.attr,
  options.thickness.attr,
];

const numberOf = (element: Element, key: "value" | "min" | "max") => {
  const value = readNumber(element, options[key]);
  return typeof value === "number" ? value : undefined;
};

/**
 * Circular progress — spec: specs/components/circular-progress.md
 *
 * Markup:  <span role="progressbar" aria-label="Loading" data-ok-circular-progress
 *                data-ok-variant="indeterminate" data-ok-color="primary">
 *            <svg data-ok-circular-progress-svg aria-hidden="true" viewBox="22 22 44 44">
 *              <circle data-ok-circular-progress-circle cx="44" cy="44" r="20.2" stroke-width="3.6" />
 *            </svg>
 *          </span>
 * Determinate: data-ok-variant="determinate" aria-valuenow aria-valuemin aria-valuemax.
 * The runtime turns size, thickness and the value into private custom properties (CSSOM) and
 * redraws when those attributes change: update `aria-valuenow` to show progress.
 */
export const circularProgress = defineComponent({
  name: "circular-progress",
  selector: "[data-ok-circular-progress]",

  setup(element) {
    let written: string[] = [];
    const draw = () => {
      const thickness = parseNumber(
        options.thickness,
        element.getAttribute(options.thickness.attr),
      );
      const size = parseNumber(options.size, element.getAttribute(options.size.attr));
      const determinate = readStyle(element, options.variant) === "determinate";
      written = syncCustomProperties(
        element,
        circularProgressStyle({
          size: progressSize(size),
          thickness,
          fraction: determinate
            ? progressFraction(
                numberOf(element, "value"),
                numberOf(element, "min"),
                numberOf(element, "max"),
              )
            : undefined,
        }),
        written,
      );
      const { r, strokeWidth } = circularProgressGeometry(thickness);
      const circle = element.querySelector("[data-ok-circular-progress-circle]");
      circle?.setAttribute("r", String(r));
      circle?.setAttribute("stroke-width", String(strokeWidth));
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
