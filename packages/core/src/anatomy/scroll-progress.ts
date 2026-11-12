import type { SpringOptions } from "../motion/animate.js";
import type { ScrollOffset } from "../motion/scroll.js";
import { type DataAttributes, defineOptions, optionAttributes, style } from "../options/define.js";

// --- Scroll progress (ADR-0062, 5.2) ---------------------------------------------------------

export const scrollAxes = ["y", "x"] as const;

export const scrollProgressOptions = defineOptions("scroll-progress", "data-ok-scroll-progress", {
  axis: style(
    "data-ok-scroll-axis",
    scrollAxes,
    "y",
    "Scroll direction followed: `y` (vertical) or `x` (horizontal).",
    { optional: true },
  ),
});

export interface ScrollProgressAnatomyOptions {
  axis?: (typeof scrollAxes)[number] | undefined;
  /** Id of the scroll container (absent: the page). */
  container?: string | undefined;
  /** Id of the element whose way through the container is measured. */
  target?: string | undefined;
  /** Two intersections, such as `["start end", "end start"]` or `"start end, end start"`. */
  offset?: ScrollOffset | string | undefined;
  /** Follows the scroll with a spring: `true` (empty attribute) or spring options (JSON). */
  smooth?: boolean | SpringOptions | undefined;
}

/**
 * `data-ok-*` attributes of a progress that follows a scroll position (Linear or Circular
 * progress): the axis, and the container, target, offset and smoothing as written.
 */
export const scrollProgressAttributes = (
  options: ScrollProgressAnatomyOptions = {},
): DataAttributes => {
  const attributes = optionAttributes(scrollProgressOptions, { ...options });
  if (options.container) attributes["data-ok-scroll-container"] = options.container;
  if (options.target) attributes["data-ok-scroll-target"] = options.target;
  if (options.offset !== undefined) {
    attributes["data-ok-scroll-offset"] =
      typeof options.offset === "string"
        ? options.offset
        : options.offset
            .map((entry) => (typeof entry === "object" ? entry.join(" ") : String(entry)))
            .join(", ");
  }
  if (options.smooth === true) attributes["data-ok-scroll-smooth"] = "";
  else if (options.smooth && typeof options.smooth === "object")
    attributes["data-ok-scroll-smooth"] = JSON.stringify(options.smooth);
  return attributes;
};
