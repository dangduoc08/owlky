import {
  type DataAttributes,
  defineOptions,
  flag,
  number,
  optionAttributes,
  parseNumber,
  state,
  style,
} from "../options/define.js";

// --- Collapse ---------------------------------------------------------------------------------

export const collapseOptions = defineOptions("collapse", "data-ok-collapse", {
  orientation: style(
    "data-ok-orientation",
    ["vertical", "horizontal"],
    "vertical",
    "`vertical` animates the height, `horizontal` the width.",
    { optional: true },
  ),
  collapsedSize: number(
    "data-ok-collapsed-size",
    0,
    "Size kept while closed (height, or width when horizontal): a number in px, or a CSS length.",
    { min: 0, units: ["px", "rem", "em", "%"] },
  ),
  timeout: number(
    "data-ok-timeout",
    undefined,
    "Duration in ms (default `--ok-duration-standard`), or `auto`: from the distance travelled.",
    { min: 0 },
  ),
  disablePrefersReducedMotion: flag(
    "data-ok-disable-prefers-reduced-motion",
    "Animates even when the user prefers reduced motion.",
  ),
  in: state(
    "hidden",
    "Open while the element has no `hidden` (React `in`; HTML: `hidden`, a trigger or `show()` / `hide()`).",
    "entered",
  ),
});

export type CollapseOrientation = "vertical" | "horizontal";
/** A duration in ms, `"auto"` (from the distance), or separate enter / exit durations. */
export type CollapseTimeout = number | "auto" | { appear?: number; enter?: number; exit?: number };
/** A CSS easing (`var(--ok-easing-*)` included), or separate enter / exit easings. */
export type CollapseEasing = string | { enter?: string; exit?: string };

export interface CollapseAnatomyOptions {
  orientation?: CollapseOrientation | undefined;
  collapsedSize?: number | string | undefined;
  timeout?: CollapseTimeout | undefined;
  easing?: CollapseEasing | undefined;
  disablePrefersReducedMotion?: boolean | undefined;
}

/** Keywords and functions such as `cubic-bezier(…)`, `steps(…)`, `linear(…)`, `var(--ok-…)`. */
const EASING = /^[a-z-]+(?:\([0-9a-z.,%\s-]*\))?$/i;

/** A CSS easing that is safe to write, or `undefined` (untrusted input never reaches the DOM). */
export const parseCollapseEasing = (value: unknown): string | undefined =>
  typeof value === "string" && value.length <= 160 && EASING.test(value.trim())
    ? value.trim()
    : undefined;

const timeoutValue = (value: unknown): string | undefined => {
  if (value === "auto") return "auto";
  const parsed = parseNumber(collapseOptions.options.timeout, value);
  return parsed === undefined ? undefined : String(parsed);
};

/**
 * `data-ok-*` attributes of a collapse (`hidden` is the state, written by the owner). A collapsed
 * size of 0 is the default and isn't written; `timeout` / `easing` objects write their exit value
 * to `data-ok-timeout-exit` / `data-ok-easing-exit`.
 */
export function collapseAttributes(options: CollapseAnatomyOptions = {}): DataAttributes {
  const { timeout, easing, collapsedSize, ...rest } = options;
  const size = parseNumber(collapseOptions.options.collapsedSize, collapsedSize);
  const attributes = optionAttributes(collapseOptions, {
    ...rest,
    collapsedSize:
      size === 0 || (typeof size === "string" && parseFloat(size) === 0) ? undefined : size,
  });
  const enter = typeof timeout === "object" ? timeout.enter : timeout;
  const exit = typeof timeout === "object" ? timeout.exit : undefined;
  const enterValue = timeoutValue(enter);
  const exitValue = timeoutValue(exit);
  if (enterValue !== undefined) attributes["data-ok-timeout"] = enterValue;
  if (exitValue !== undefined) attributes["data-ok-timeout-exit"] = exitValue;
  const easeIn = parseCollapseEasing(typeof easing === "object" ? easing.enter : easing);
  const easeOut = parseCollapseEasing(typeof easing === "object" ? easing.exit : undefined);
  if (easeIn !== undefined) attributes["data-ok-easing"] = easeIn;
  if (easeOut !== undefined) attributes["data-ok-easing-exit"] = easeOut;
  return attributes;
}
