import { describe, expect, it } from "vitest";
import {
  compareCellValues,
  defaultLabelDisplayedRows,
  defaultPaginationLabel,
  lastPage,
  nextSortDirection,
  pageRange,
  selectAllState,
} from "./table.js";

describe("compareCellValues", () => {
  it("compares numbers numerically, with thousands separators and decimals", () => {
    expect(compareCellValues("9", "10")).toBeLessThan(0);
    expect(compareCellValues("1,324,171,354", "60,483,973")).toBeGreaterThan(0);
    expect(compareCellValues("-3.5", "0.2")).toBeLessThan(0);
    expect(compareCellValues(" 4 ", "4")).toBe(0);
  });

  it("compares text case-insensitively and numeric-aware", () => {
    expect(compareCellValues("eclair", "Donut")).toBeGreaterThan(0);
    expect(compareCellValues("item 2", "item 10")).toBeLessThan(0);
    expect(compareCellValues("10 kg", "9 kg")).toBeGreaterThan(0);
    expect(compareCellValues("", "a")).toBeLessThan(0);
  });
});

describe("table helpers", () => {
  it("nextSortDirection: an active ascending column flips, anything else starts ascending", () => {
    expect(nextSortDirection(true, "asc")).toBe("desc");
    expect(nextSortDirection(true, "desc")).toBe("asc");
    expect(nextSortDirection(false, "desc")).toBe("asc");
  });

  it("pageRange / lastPage / defaultLabelDisplayedRows", () => {
    expect(pageRange(0, 5, 12)).toEqual({ from: 1, to: 5, count: 12, page: 0 });
    expect(pageRange(2, 5, 12)).toEqual({ from: 11, to: 12, count: 12, page: 2 });
    expect(pageRange(0, 5, 0)).toEqual({ from: 0, to: 0, count: 0, page: 0 });
    expect(pageRange(3, -1, 12)).toEqual({ from: 1, to: 12, count: 12, page: 0 });
    expect(pageRange(0, -1, 0).from).toBe(0);
    expect(pageRange(1, 5, -1)).toEqual({ from: 6, to: 10, count: -1, page: 1 });
    expect(lastPage(5, 12)).toBe(2);
    expect(lastPage(5, 0)).toBe(0);
    expect(lastPage(5, -1)).toBe(Number.POSITIVE_INFINITY);
    expect(defaultLabelDisplayedRows(pageRange(0, 5, 12))).toBe("1–5 of 12");
    expect(defaultLabelDisplayedRows(pageRange(1, 5, -1))).toBe("6–10 of more than 10");
    expect(defaultPaginationLabel("next")).toBe("Go to next page");
  });

  it("selectAllState", () => {
    expect(selectAllState(0, 3)).toEqual({ checked: false, indeterminate: false });
    expect(selectAllState(1, 3)).toEqual({ checked: false, indeterminate: true });
    expect(selectAllState(3, 3)).toEqual({ checked: true, indeterminate: false });
    expect(selectAllState(0, 0)).toEqual({ checked: false, indeterminate: false });
  });
});
