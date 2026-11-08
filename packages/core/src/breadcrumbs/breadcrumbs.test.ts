import { describe, expect, it } from "vitest";
import { BREADCRUMBS_EXPAND_TEXT, breadcrumbsCollapse } from "./breadcrumbs.js";

describe("breadcrumbsCollapse", () => {
  it("keeps every item up to maxItems (default 8)", () => {
    expect(breadcrumbsCollapse(0)).toBeNull();
    expect(breadcrumbsCollapse(8)).toBeNull();
    expect(breadcrumbsCollapse(3, { maxItems: 3 })).toBeNull();
  });

  it("hides the middle items: one before and one after by default", () => {
    expect(breadcrumbsCollapse(9)).toEqual({ start: 1, end: 8 });
    expect(breadcrumbsCollapse(5, { maxItems: 3 })).toEqual({ start: 1, end: 4 });
  });

  it("honors itemsBeforeCollapse and itemsAfterCollapse", () => {
    expect(
      breadcrumbsCollapse(6, { maxItems: 2, itemsBeforeCollapse: 2, itemsAfterCollapse: 2 }),
    ).toEqual({ start: 2, end: 4 });
    expect(
      breadcrumbsCollapse(4, { maxItems: 2, itemsBeforeCollapse: 0, itemsAfterCollapse: 1 }),
    ).toEqual({ start: 0, end: 3 });
  });

  it("shows everything when the kept items would cover the trail", () => {
    expect(
      breadcrumbsCollapse(4, { maxItems: 2, itemsBeforeCollapse: 2, itemsAfterCollapse: 2 }),
    ).toBeNull();
  });

  it("invalid values fall back to the defaults", () => {
    const hostile = { maxItems: -1, itemsBeforeCollapse: 1.5, itemsAfterCollapse: Number.NaN };
    expect(breadcrumbsCollapse(9, hostile)).toEqual({ start: 1, end: 8 });
    expect(breadcrumbsCollapse(8, { maxItems: 0 })).toBeNull();
  });

  it("names the expand button like MUI", () => {
    expect(BREADCRUMBS_EXPAND_TEXT).toBe("Show path");
  });
});
