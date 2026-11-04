import { describe, expect, it } from "vitest";
import { paginationAttributes } from "../anatomy/anatomy.js";
import { defaultPaginationItemLabel, paginationItems } from "./pagination.js";

/** Compact form: numbers for pages (`*` = current), `…` for ellipses, names for buttons. */
const compact = (options?: Parameters<typeof paginationItems>[0]) =>
  paginationItems(options).map((item) =>
    item.type === "page"
      ? `${item.page}${item.selected ? "*" : ""}`
      : item.type.endsWith("ellipsis")
        ? "…"
        : item.type,
  );

describe("paginationItems", () => {
  it("matches the reference ranges (count 11, page 6)", () => {
    const base = { count: 11, page: 6, hidePrevButton: true, hideNextButton: true };
    expect(compact({ ...base, siblingCount: 0 })).toEqual(["1", "…", "6*", "…", "11"]);
    expect(compact(base)).toEqual(["1", "…", "5", "6*", "7", "…", "11"]);
    expect(compact({ ...base, siblingCount: 0, boundaryCount: 2 })).toEqual([
      "1",
      "2",
      "…",
      "6*",
      "…",
      "10",
      "11",
    ]);
    expect(compact({ ...base, boundaryCount: 2 })).toEqual([
      "1",
      "2",
      "…",
      "5",
      "6*",
      "7",
      "…",
      "10",
      "11",
    ]);
  });

  it("shows a page instead of an ellipsis that would hide a single page", () => {
    expect(compact({ count: 10 })).toEqual([
      "previous",
      "1*",
      "2",
      "3",
      "4",
      "5",
      "…",
      "10",
      "next",
    ]);
    expect(compact({ count: 8, page: 4 })).toEqual([
      "previous",
      "1",
      "2",
      "3",
      "4*",
      "5",
      "…",
      "8",
      "next",
    ]);
    expect(compact({ count: 7, page: 4 })).toEqual([
      "previous",
      "1",
      "2",
      "3",
      "4*",
      "5",
      "6",
      "7",
      "next",
    ]);
    expect(compact({ count: 10, page: 10 })).toEqual([
      "previous",
      "1",
      "…",
      "6",
      "7",
      "8",
      "9",
      "10*",
      "next",
    ]);
  });

  it("first / last buttons, hidden previous / next, their targets and disabled states", () => {
    const items = paginationItems({
      count: 5,
      page: 1,
      showFirstButton: true,
      showLastButton: true,
    });
    expect(items.map((i) => i.type)).toEqual([
      "first",
      "previous",
      "page",
      "page",
      "page",
      "page",
      "page",
      "next",
      "last",
    ]);
    expect(items.filter((i) => i.disabled).map((i) => i.type)).toEqual(["first", "previous"]);
    expect(items.find((i) => i.type === "last")?.page).toBe(5);
    const end = paginationItems({ count: 5, page: 5, showFirstButton: true, showLastButton: true });
    expect(end.filter((i) => i.disabled).map((i) => i.type)).toEqual(["next", "last"]);
    expect(end.find((i) => i.type === "previous")?.page).toBe(4);
    expect(paginationItems({ count: 5, disabled: true }).every((i) => i.disabled)).toBe(true);
  });

  it("handles 0 / 1 pages and invalid input (untrusted attributes)", () => {
    expect(compact({ count: 0 })).toEqual(["previous", "next"]);
    expect(compact({ count: 1 })).toEqual(["previous", "1*", "next"]);
    expect(compact({ count: 3, page: 99 })).toEqual(["previous", "1", "2", "3*", "next"]);
    expect(compact({ count: Number.NaN, page: -4, siblingCount: 1.5, boundaryCount: -1 })).toEqual([
      "previous",
      "1*",
      "next",
    ]);
    expect(compact({ count: 3, boundaryCount: 0, siblingCount: 0, page: 2 })).toEqual([
      "previous",
      "1",
      "2*",
      "3",
      "next",
    ]);
    expect(compact()).toEqual(["previous", "1*", "next"]);
  });

  it("default labels and attributes", () => {
    expect(defaultPaginationItemLabel("page", 3, false)).toBe("Go to page 3");
    expect(defaultPaginationItemLabel("page", 2, true)).toBe("page 2");
    expect(defaultPaginationItemLabel("next", 3, false)).toBe("Go to next page");
    expect(paginationAttributes()).toEqual({
      "data-ok-pagination": "",
      "data-ok-variant": "text",
      "data-ok-color": "standard",
      "data-ok-shape": "circular",
      "data-ok-size": "md",
    });
    expect(
      paginationAttributes({
        variant: "soft",
        color: "info",
        shape: "rounded",
        size: "lg",
        disabled: true,
      }),
    ).toMatchObject({ "data-ok-variant": "soft", "data-ok-color": "info", "data-ok-disabled": "" });
    expect(paginationAttributes({ color: '"><x>' as never })["data-ok-color"]).toBe("standard");
  });
});
