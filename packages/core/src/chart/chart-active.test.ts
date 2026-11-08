import { describe, expect, it } from "vitest";
import { renderChart } from "./chart.js";
import {
  type ChartActive,
  chartActiveAt,
  chartActiveNodes,
  chartTooltip,
  nextChartActive,
  placeChartTooltip,
  sameChartActive,
} from "./chart-active.js";

const base = { width: 400, height: 240, idPrefix: "t" };
const line = renderChart({
  ...base,
  categories: ["Jan", "Feb", "Mar"],
  series: [
    { name: "A", data: [10, 40, 20] },
    { name: "B", data: [5, null, 30] },
  ],
});
const bars = renderChart({
  ...base,
  type: "bar",
  categories: ["Jan", "Feb"],
  series: [{ name: "A", data: [10, 40] }],
});
const rows = renderChart({
  ...base,
  type: "bar",
  horizontal: true,
  categories: ["a", "b"],
  series: [{ name: "A", data: [1, 2] }],
});
const scatter = renderChart({
  ...base,
  type: "scatter",
  series: [
    {
      name: "A",
      data: [
        [1, 1],
        [3, 3],
      ],
    },
    { name: "B", data: [[2, 2]], color: "info" },
  ],
});

describe("chartActiveAt", () => {
  it("index charts: the nearest category, nothing outside the plot", () => {
    const { plot, slots } = line.layout;
    expect(chartActiveAt(line.layout, (slots[1]?.pos ?? 0) + 3, plot.y + 10)).toEqual({
      kind: "index",
      index: 1,
    });
    expect(chartActiveAt(line.layout, plot.x - 20, plot.y)).toBeNull();
    expect(chartActiveAt(line.layout, plot.x, plot.y + plot.height + 20)).toBeNull();
    const { plot: p, slots: s } = rows.layout;
    expect(chartActiveAt(rows.layout, p.x + 5, s[1]?.pos ?? 0)).toEqual({
      kind: "index",
      index: 1,
    });
  });

  it("scatter: the nearest point within 24px", () => {
    const mark = scatter.layout.marks[2];
    expect(chartActiveAt(scatter.layout, (mark?.px ?? 0) + 3, (mark?.py ?? 0) - 3)).toEqual({
      kind: "mark",
      mark: 2,
    });
    const { plot } = scatter.layout;
    expect(chartActiveAt(scatter.layout, plot.x + plot.width / 2, plot.y + 2)).toBeNull();
  });

  it("an empty index chart has nothing to activate", () => {
    const empty = renderChart({ ...base, series: [] });
    expect(
      chartActiveAt(empty.layout, empty.layout.plot.x + 1, empty.layout.plot.y + 1),
    ).toBeNull();
    expect(nextChartActive(empty.layout, null, "ArrowRight")).toBeNull();
    const none = renderChart({ ...base, type: "scatter", series: [{ name: "A", data: [] }] });
    expect(nextChartActive(none.layout, null, "Home")).toBeNull();
  });
});

describe("nextChartActive", () => {
  it("arrows, Home and End move between categories, clamped", () => {
    const at = (active: ChartActive | null, key: string) =>
      nextChartActive(line.layout, active, key);
    expect(at(null, "ArrowRight")).toEqual({ kind: "index", index: 0 });
    expect(at({ kind: "index", index: 0 }, "ArrowDown")).toEqual({ kind: "index", index: 1 });
    expect(at({ kind: "index", index: 0 }, "ArrowLeft")).toEqual({ kind: "index", index: 0 });
    expect(at({ kind: "index", index: 2 }, "ArrowRight")).toEqual({ kind: "index", index: 2 });
    expect(at({ kind: "index", index: 1 }, "ArrowUp")).toEqual({ kind: "index", index: 0 });
    expect(at({ kind: "index", index: 1 }, "Home")).toEqual({ kind: "index", index: 0 });
    expect(at(null, "End")).toEqual({ kind: "index", index: 2 });
    expect(at(null, "Enter")).toBeUndefined();
  });

  it("scatter: points in reading order", () => {
    const at = (active: ChartActive | null, key: string) =>
      nextChartActive(scatter.layout, active, key);
    expect(at(null, "ArrowRight")).toEqual({ kind: "mark", mark: 0 });
    expect(at({ kind: "mark", mark: 0 }, "ArrowRight")).toEqual({ kind: "mark", mark: 2 });
    expect(at({ kind: "mark", mark: 2 }, "ArrowRight")).toEqual({ kind: "mark", mark: 1 });
    expect(at({ kind: "mark", mark: 2 }, "ArrowLeft")).toEqual({ kind: "mark", mark: 0 });
    expect(at({ kind: "mark", mark: 1 }, "Home")).toEqual({ kind: "mark", mark: 0 });
    expect(at(null, "End")).toEqual({ kind: "mark", mark: 1 });
  });

  it("scatter: points on the same x go top to bottom", () => {
    const column = renderChart({
      ...base,
      type: "scatter",
      series: [
        {
          name: "A",
          data: [
            [1, 1],
            [1, 3],
          ],
        },
      ],
    });
    expect(nextChartActive(column.layout, null, "Home")).toEqual({ kind: "mark", mark: 1 });
  });
});

describe("chartActiveNodes", () => {
  it("lines: a dashed crosshair under, bigger markers over (gaps skipped)", () => {
    const { under, over } = chartActiveNodes(line.layout, { kind: "index", index: 1 });
    expect(under).toHaveLength(1);
    expect(under[0]?.attrs).toHaveProperty("data-ok-chart-crosshair-line");
    expect(over).toHaveLength(1);
    expect(over[0]?.attrs).toMatchObject({ r: "5", "data-ok-color": "primary-dark" });
  });

  it("bars: the band under, no markers; horizontal bands run across", () => {
    const vertical = chartActiveNodes(bars.layout, { kind: "index", index: 0 });
    expect(vertical.under[0]?.attrs).toMatchObject({
      height: String(bars.layout.plot.height),
      "data-ok-chart-band": "",
    });
    expect(vertical.over).toEqual([]);
    const horizontal = chartActiveNodes(rows.layout, { kind: "index", index: 0 });
    expect(horizontal.under[0]?.attrs["width"]).toBe(String(rows.layout.plot.width));
  });

  it("scatter: one big marker; nothing for missing items", () => {
    expect(
      chartActiveNodes(scatter.layout, { kind: "mark", mark: 2 }).over[0]?.attrs,
    ).toMatchObject({ r: "7", "data-ok-color": "info" });
    expect(chartActiveNodes(scatter.layout, { kind: "mark", mark: 99 })).toEqual({
      under: [],
      over: [],
    });
    expect(chartActiveNodes(line.layout, { kind: "index", index: 99 })).toEqual({
      under: [],
      over: [],
    });
    expect(chartActiveNodes(line.layout, null)).toEqual({ under: [], over: [] });
  });
});

describe("chartTooltip", () => {
  it("index: the category and every visible value", () => {
    const tip = chartTooltip(line.data, line.layout, line.format, { kind: "index", index: 2 });
    expect(tip).toMatchObject({
      title: "Mar",
      rows: [
        { name: "A", value: "20", color: "primary-dark" },
        { name: "B", value: "30", color: "warning" },
      ],
      x: line.layout.slots[2]?.pos,
    });
    expect(tip?.y).toBe(
      Math.min(...line.layout.marks.filter((m) => m.index === 2).map((m) => m.py)),
    );
  });

  it("horizontal bars point at the bar end; empty categories at the plot top", () => {
    const tip = chartTooltip(rows.data, rows.layout, rows.format, { kind: "index", index: 1 });
    expect(tip).toMatchObject({ x: rows.layout.marks[1]?.px, y: rows.layout.slots[1]?.pos });
    const gap = renderChart({
      ...base,
      categories: ["a", "b"],
      series: [{ name: "A", data: [null, 1] }],
    });
    expect(
      chartTooltip(gap.data, gap.layout, gap.format, { kind: "index", index: 0 }),
    ).toMatchObject({ rows: [], y: gap.layout.plot.y });
  });

  it("scatter: the point's x as the title; datetime titles are dates", () => {
    expect(
      chartTooltip(scatter.data, scatter.layout, scatter.format, { kind: "mark", mark: 2 }),
    ).toMatchObject({
      title: "2",
      rows: [{ name: "B", value: "2", color: "info" }],
    });
    const dates = renderChart({
      ...base,
      xType: "datetime",
      categories: ["2011-01-01", "2011-02-01"],
      series: [{ name: "A", data: [1, 2] }],
    });
    expect(
      chartTooltip(dates.data, dates.layout, dates.format, { kind: "index", index: 1 })?.title,
    ).toBe("Feb 2011");
    const unnamed = renderChart({ ...base, series: [{ name: "A", data: [1, 2] }] });
    expect(
      chartTooltip(unnamed.data, unnamed.layout, unnamed.format, { kind: "index", index: 1 })
        ?.title,
    ).toBe("2");
  });

  it("nothing for null or missing items", () => {
    expect(chartTooltip(line.data, line.layout, line.format, null)).toBeNull();
    expect(
      chartTooltip(line.data, line.layout, line.format, { kind: "index", index: 9 }),
    ).toBeNull();
    expect(
      chartTooltip(scatter.data, scatter.layout, scatter.format, { kind: "mark", mark: 9 }),
    ).toBeNull();
  });
});

describe("sameChartActive", () => {
  it("compares categories and points", () => {
    expect(sameChartActive(null, null)).toBe(true);
    expect(sameChartActive(null, { kind: "index", index: 0 })).toBe(false);
    expect(sameChartActive({ kind: "index", index: 1 }, { kind: "index", index: 1 })).toBe(true);
    expect(sameChartActive({ kind: "index", index: 1 }, { kind: "index", index: 2 })).toBe(false);
    expect(sameChartActive({ kind: "index", index: 1 }, { kind: "mark", mark: 1 })).toBe(false);
    expect(sameChartActive({ kind: "mark", mark: 1 }, { kind: "mark", mark: 1 })).toBe(true);
    expect(sameChartActive({ kind: "mark", mark: 1 }, { kind: "index", index: 1 })).toBe(false);
  });
});

describe("placeChartTooltip", () => {
  const box = { width: 400, height: 200 };
  it("right of the anchor, else left; kept inside the box", () => {
    expect(placeChartTooltip({ x: 100, y: 100 }, { width: 120, height: 60 }, box)).toEqual({
      left: 116,
      top: 70,
    });
    expect(placeChartTooltip({ x: 350, y: 10 }, { width: 120, height: 60 }, box)).toEqual({
      left: 214,
      top: 0,
    });
    expect(placeChartTooltip({ x: 50, y: 190 }, { width: 500, height: 60 }, box)).toEqual({
      left: 0,
      top: 140,
    });
  });
});
