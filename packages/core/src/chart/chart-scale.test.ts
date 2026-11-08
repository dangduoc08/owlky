import { describe, expect, it } from "vitest";
import {
  chartMonthNames,
  dateAxisLabel,
  dateTooltipLabel,
  dateUnit,
  niceScale,
  niceStep,
  scaleLinear,
  stepDecimals,
  toTimestamp,
  unitIndex,
} from "./chart-scale.js";

const utc = (y: number, m: number, d = 1) => Date.UTC(y, m, d);

describe("niceStep", () => {
  it.each([
    [0.7, 1],
    [1, 1],
    [1.3, 2],
    [2.2, 2.5],
    [3, 5],
    [7, 10],
    [21, 25],
    [466, 500],
    [0.013, 0.02],
  ])("%d → %d", (raw, nice) => {
    expect(niceStep(raw)).toBeCloseTo(nice, 10);
  });

  it("invalid steps fall back to 1", () => {
    expect(niceStep(0)).toBe(1);
    expect(niceStep(-3)).toBe(1);
    expect(niceStep(Number.NaN)).toBe(1);
    expect(niceStep(Number.POSITIVE_INFINITY)).toBe(1);
  });
});

describe("niceScale", () => {
  it("widens to whole steps (the reference's 0–100 by 20)", () => {
    expect(niceScale(0, 100, 5)).toEqual({
      min: 0,
      max: 100,
      step: 20,
      ticks: [0, 20, 40, 60, 80, 100],
    });
    expect(niceScale(-54.4, 19.8, 4).ticks).toEqual([-60, -40, -20, 0, 20]);
    expect(niceScale(0, 1380, 3).ticks).toEqual([0, 500, 1000, 1500]);
  });

  it("removes floating point noise", () => {
    expect(niceScale(0, 0.3, 3).ticks).toEqual([0, 0.1, 0.2, 0.3]);
  });

  it("keeps fixed ends, adding the fixed max when it isn't a step", () => {
    expect(niceScale(3, 50, 5, { min: 0, max: 100 }).ticks).toEqual([0, 20, 40, 60, 80, 100]);
    expect(niceScale(0, 10, 2, { max: 12 }).ticks).toEqual([0, 10, 12]);
  });

  it("handles flat, reversed and invalid domains", () => {
    expect(niceScale(0, 0, 4).ticks).toEqual([0, 0.25, 0.5, 0.75, 1]);
    expect(niceScale(10, 10, 2)).toMatchObject({ min: 5, max: 15 });
    expect(niceScale(10, 10, 2, { min: 10 })).toMatchObject({ min: 10, max: 15 });
    expect(niceScale(10, 10, 2, { max: 10 })).toMatchObject({ min: 5, max: 10 });
    expect(niceScale(5, 1, 4)).toMatchObject({ min: 1, max: 5 });
    expect(niceScale(Number.NaN, 4, 2)).toMatchObject({ min: 0, max: 1 });
    expect(niceScale(0, 10, 0).step).toBe(10);
  });
});

describe("scaleLinear / stepDecimals", () => {
  it("maps domains to ranges; a flat domain maps to the middle", () => {
    expect(scaleLinear(5, 0, 10, 100, 0)).toBe(50);
    expect(scaleLinear(3, 3, 3, 0, 10)).toBe(5);
  });

  it("counts the decimals of a step", () => {
    expect(stepDecimals(50)).toBe(0);
    expect(stepDecimals(2.5)).toBe(1);
    expect(stepDecimals(0.25)).toBe(2);
    expect(stepDecimals(0)).toBe(0);
    expect(stepDecimals(Number.NaN)).toBe(0);
    expect(stepDecimals(Math.PI)).toBe(10);
  });
});

describe("dates", () => {
  it("reads Dates, ms and ISO 8601 text; rejects the rest", () => {
    expect(toTimestamp(new Date(utc(2011, 0)))).toBe(utc(2011, 0));
    expect(toTimestamp(utc(2012, 5))).toBe(utc(2012, 5));
    expect(toTimestamp("2011-01-02")).toBe(utc(2011, 0, 2));
    expect(toTimestamp("2011-03")).toBe(utc(2011, 2));
    expect(toTimestamp("2011-01-02T10:30")).toBe(Date.UTC(2011, 0, 2, 10, 30));
    expect(toTimestamp("2011-01-02T10:30:00Z")).toBe(Date.UTC(2011, 0, 2, 10, 30));
    for (const bad of [
      new Date(Number.NaN),
      Number.NaN,
      "Jan 2011",
      "2011-13-45",
      "",
      null,
      {},
      `${"9".repeat(50)}`,
    ]) {
      expect(toTimestamp(bad)).toBeUndefined();
    }
  });

  it("finds the unit of the spacing", () => {
    expect(dateUnit([])).toBe("day");
    expect(dateUnit([utc(2011, 0, 1), utc(2011, 0, 2), utc(2011, 0, 3)])).toBe("day");
    expect(dateUnit([utc(2011, 0), utc(2011, 1), utc(2011, 2)])).toBe("month");
    expect(dateUnit([utc(2011, 0), utc(2012, 0), utc(2013, 0)])).toBe("year");
  });

  it("labels axes like the reference", () => {
    const months = chartMonthNames();
    expect(dateAxisLabel(utc(2012, 0), "month", months)).toEqual({ text: "2012", major: true });
    expect(dateAxisLabel(utc(2011, 6), "month", months)).toEqual({ text: "Jul '11", major: false });
    expect(dateAxisLabel(utc(2011, 0, 1), "day", months)).toEqual({ text: "Jan '11", major: true });
    expect(dateAxisLabel(utc(2011, 0, 2), "day", months)).toEqual({ text: "02 Jan", major: false });
    expect(dateAxisLabel(utc(2015, 0), "year", months)).toEqual({ text: "2015", major: false });
    expect(dateTooltipLabel(utc(2011, 6), "month", months)).toBe("Jul 2011");
    expect(dateTooltipLabel(utc(2011, 0, 2), "day", months)).toBe("02 Jan 2011");
    expect(dateTooltipLabel(utc(2015, 0), "year", months)).toBe("2015");
  });

  it("indexes units for even label spacing", () => {
    expect(unitIndex(utc(2011, 6), "month") % 6).toBe(0);
    expect(unitIndex(utc(2011, 6), "year")).toBe(2011);
    expect(unitIndex(utc(1970, 0, 3), "day")).toBe(2);
  });

  it("names months in the locale; unknown locales fall back to English", () => {
    expect(chartMonthNames("vi-VN")[0]).not.toBe("Jan");
    expect(chartMonthNames("not a locale!")[0]).toBe("Jan");
  });
});
