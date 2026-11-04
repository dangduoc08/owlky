import { supports } from "../dom/support.js";

/**
 * Exclusive accordions (`<details name>`): browsers that support the `name` attribute close the
 * other members of the group natively. Elsewhere (ADR-0006 fallback) this closes them, so React and
 * the HTML runtime behave the same. Call it after `details` opened.
 */
export function closeOtherDetails(
  details: HTMLDetailsElement,
  options: { forceFallback?: boolean } = {},
): void {
  const name = details.getAttribute("name");
  if (!name || !details.open) return;
  if (supports.detailsName && options.forceFallback !== true) return;
  const root = details.getRootNode() as Document | ShadowRoot;
  for (const other of root.querySelectorAll<HTMLDetailsElement>("details[name]")) {
    if (other !== details && other.getAttribute("name") === name && other.open) other.open = false;
  }
}
