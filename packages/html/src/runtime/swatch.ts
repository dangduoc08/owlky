import { swatchStyle } from "@owlky/core";
import { syncCustomProperties } from "./style.js";

/** The attribute that holds a swatch's color (Radio, Checkbox, Avatar; roadmap 4.23). */
export const SWATCH = "data-ok-swatch";

/**
 * Writes a swatch's color and mark (`--_ok-swatch`, `--_ok-swatch-mark`) from `data-ok-swatch`
 * through CSSOM, removing them for an invalid or missing color. Returns the names now written.
 */
export function syncSwatch(element: HTMLElement, previous: readonly string[]): string[] {
  return syncCustomProperties(
    element,
    element.hasAttribute(SWATCH) ? swatchStyle(element.getAttribute(SWATCH)) : {},
    previous,
  );
}
