/*
 * Breadcrumbs collapse rule (MUI `maxItems` / `itemsBeforeCollapse` / `itemsAfterCollapse`),
 * shared by React and the HTML runtime. Pure: the owner hides the items and inserts the button.
 */

export interface BreadcrumbsCollapseOptions {
  maxItems?: number | undefined;
  itemsBeforeCollapse?: number | undefined;
  itemsAfterCollapse?: number | undefined;
}

/** Items `[start, end)` that collapse into the expand button. */
export interface BreadcrumbsCollapse {
  readonly start: number;
  readonly end: number;
}

const whole = (value: number | undefined, fallback: number, min: number) =>
  value !== undefined && Number.isInteger(value) && value >= min ? value : fallback;

/**
 * The items hidden behind the expand button, or `null` when every item shows: at most `maxItems`
 * items (default 8), or the kept items (default 1 before + 1 after) would cover them all anyway.
 */
export function breadcrumbsCollapse(
  count: number,
  options: BreadcrumbsCollapseOptions = {},
): BreadcrumbsCollapse | null {
  const max = whole(options.maxItems, 8, 1);
  const before = whole(options.itemsBeforeCollapse, 1, 0);
  const after = whole(options.itemsAfterCollapse, 1, 0);
  if (count <= max || before + after >= count) return null;
  return { start: before, end: count - after };
}

/** Default accessible name of the expand button (MUI `expandText`). */
export const BREADCRUMBS_EXPAND_TEXT = "Show path";
