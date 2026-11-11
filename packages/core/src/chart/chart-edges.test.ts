import { describe, expect, it } from "vitest";
import { renderChart } from "./chart.js";
import {
  chartAnnotationKey,
  chartAnnotationText,
  chartAnnotationX,
  chartMeasureActive,
  chartMeasureAt,
  chartMeasureBetween,
  chartMeasureNodes,
  chartMeasureText,
  dragChartAnnotation,
  moveChartAnnotation,
} from "./chart-measure.js";
import { chartData } from "./chart-model.js";
import { chartReduceRuns } from "./chart-reducer.js";
import { chartFixedWindow } from "./chart-xaxis.js";

/* Edge cases of the 4.18.65, .66 and .20 helpers: numeric and date axes, charts without axes. */

const size = { width: 640, height: 320, idPrefix: "t" };
const scatter = renderChart({
  ...size,
  type: "scatter",
  series: [
    {
      name: "A",
      data: [
        [0, 1],
        [10, 5],
        [20, 3],
      ],
    },
  ],
});
const dates = renderChart({
  ...size,
  xType: "datetime",
  categories: ["2025-01-01", "2025-02-01", "2025-03-01"],
  series: [{ name: "A", data: [1, 2, 3] }],
});
const pie = renderChart({
  ...size,
  type: "pie",
  categories: ["A"],
  series: [{ name: "A", data: [1] }],
});

describe("measure helpers on other axes", () => {
  it("keeps numeric x positions and falls back to the given values", () => {
    const point = chartMeasureAt(scatter.layout, scatter.layout.plot.x + 10, scatter.layout.plot.y);
    expect(Number.isInteger(point?.x)).toBe(false);
    const empty = renderChart({
      ...size,
      categories: ["A", "B"],
      series: [{ name: "A", data: [null, null] }],
    });
    expect(chartMeasureBetween(empty.layout, "span", { x: 0, y: 3 }, { x: 1, y: 4 })).toEqual({
      x1: 0,
      y1: 3,
      x2: 1,
      y2: 4,
    });
    expect(chartMeasureActive(empty.layout, { kind: "index", index: 0 })).toBeNull();
    expect(chartMeasureActive(pie.layout, { kind: "index", index: 0 })).toBeNull();
  });

  it("writes dates and missing categories, and draws falling rulers", () => {
    expect(chartMeasureText(dates.data, dates.format, { x1: 0, y1: 2, x2: 2, y2: 1 })).toMatch(
      /→ .*: -1 \(-50%\)$/,
    );
    const nameless = chartData({ series: [{ name: "A", data: [1, 2] }] });
    expect(chartMeasureText(nameless, scatter.format, { x1: 0, y1: 1, x2: 1, y2: 1 })).toBe(
      "1 → 2: 0 (0%)",
    );
    const nodes = chartMeasureNodes(scatter.layout, scatter.data, scatter.format, "span", [
      { x1: 10, y1: 5, x2: 0, y2: 1 },
    ]);
    expect(JSON.stringify(nodes)).toContain('"data-ok-trend":"down"');
    expect(
      chartMeasureNodes(pie.layout, pie.data, pie.format, "span", [{ x1: 0, y1: 0, x2: 1, y2: 1 }]),
    ).toEqual([]);
  });
});

describe("annotation helpers on other axes", () => {
  it("moves on numeric and date axes and leaves charts without axes alone", () => {
    expect(chartAnnotationX(scatter.data, "12")).toBe(12);
    expect(chartAnnotationX(dates.data, "2030-01-01")).toBeUndefined();
    expect(chartAnnotationX(chartData({ categories: ["A"], series: [] }), "nope")).toBeUndefined();
    const band = { axis: "y" as const, y: 1, y2: 2 };
    expect(moveChartAnnotation(scatter.data, band, 0, 1)).toEqual({ axis: "y", y: 2, y2: 3 });
    expect(moveChartAnnotation(scatter.data, { axis: "point", y: 1 }, 1, 0)).toEqual({
      axis: "point",
      x: undefined,
      y: 1,
    });
    const empty = chartData({ xType: "datetime", series: [] });
    expect(moveChartAnnotation(empty, { axis: "x", x: "2025-01-01" }, 1, 0).x).toBe("2025-01-01");
    const datesMoved = moveChartAnnotation(dates.data, { axis: "x", x: "2025-01-01" }, 5, 0);
    expect(datesMoved.x).toBe("2025-03-01");
    const note = { axis: "point" as const, x: 10, y: 3, draggable: true };
    expect(
      dragChartAnnotation(pie.layout, pie.data, note, { px: 0, py: 0 }, { px: 9, py: 9 }),
    ).toBe(note);
    expect(chartAnnotationKey(pie.layout, pie.data, note, "ArrowUp")).toBeUndefined();
    expect(chartAnnotationKey(scatter.layout, scatter.data, note, "ArrowRight")?.x).toBe(12);
    expect(
      dragChartAnnotation(
        scatter.layout,
        scatter.data,
        note,
        { px: 100, py: 100 },
        { px: 150, py: 100 },
      ).x,
    ).not.toBe(10);
    expect(chartAnnotationText({ axis: "x", x: "A", x2: "B", label: "Band" })).toBe("Band: A, B");
    expect(chartAnnotationText({ axis: "y", y: 1, y2: 2 })).toBe("Annotation: 1, 2");
  });
});

describe("reducer and window edges", () => {
  it("reduces runs that end with a gap", () => {
    const points = Array.from({ length: 300 }, (_, i) => (i > 280 ? null : ([i, i % 7] as const)));
    const kept = chartReduceRuns(points, { target: 20, threshold: 50 });
    expect(kept.has(299)).toBe(false);
    expect(kept.size).toBeLessThan(40);
  });

  it("handles one-sided and empty windows", () => {
    const single = chartData({ categories: ["A"], series: [{ name: "A", data: [1] }] });
    expect(chartFixedWindow(single, { xMin: 0 })).toBeNull();
    const points = chartData({ type: "scatter", series: [] });
    expect(chartFixedWindow(points, { xRange: 5 })).toBeNull();
    const data = chartData({
      xType: "datetime",
      categories: ["2025-01-01", "2025-02-01", "2025-03-01"],
      series: [{ name: "A", data: [1, 2, 3] }],
    });
    // A start after the data keeps the last two categories.
    expect(chartFixedWindow(data, { xMin: Date.UTC(2026, 0, 1) })).toEqual({ min: 1, max: 2 });
    expect(chartFixedWindow(data, { xMax: Date.UTC(2025, 1, 1), xRange: 31 * 86_400_000 })).toEqual(
      {
        min: 0,
        max: 1,
      },
    );
    const categories = chartData({
      categories: ["A", "B", "C", "D"],
      series: [{ name: "A", data: [1, 2, 3, 4] }],
    });
    expect(chartFixedWindow(categories, { xMax: 2, xRange: 1 })).toEqual({ min: 1, max: 2 });
    expect(chartFixedWindow(categories, { xMax: 2 })).toEqual({ min: 0, max: 2 });
  });
});
