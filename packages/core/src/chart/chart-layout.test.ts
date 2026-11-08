import { describe, expect, it } from "vitest";
import { chartFormat } from "./chart-format.js";
import { barPath, type ChartNode, chartTextWidth, layoutChart, linePath } from "./chart-layout.js";
import { type ChartSeries, chartData } from "./chart-model.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr"];

function layout(
  input: { type?: string; xType?: string; series: ChartSeries[]; categories?: (string | number)[] },
  options: Partial<Parameters<typeof layoutChart>[1]> = {},
) {
  const data = chartData(input);
  return layoutChart(data, {
    width: 400,
    height: 280,
    format: chartFormat(data),
    idPrefix: "t",
    ...options,
  });
}

/** Every node matching `attr` (and `value` when given), depth first. */
function find(nodes: readonly ChartNode[], attr: string, value?: string): ChartNode[] {
  const found: ChartNode[] = [];
  const walk = (list: readonly ChartNode[]) => {
    for (const node of list) {
      if (node.attrs[attr] !== undefined && (value === undefined || node.attrs[attr] === value))
        found.push(node);
      if (node.children) walk(node.children);
    }
  };
  walk(nodes);
  return found;
}
const texts = (nodes: readonly ChartNode[], axis: string) =>
  (find(nodes, "data-ok-chart-axis", axis)[0]?.children ?? []).map((node) => node.text);

describe("chartTextWidth", () => {
  it("estimates by glyph class, wide enough for percent and minus signs", () => {
    expect(chartTextWidth("-60%")).toBe(Math.ceil((0.45 + 0.6 + 0.6 + 0.9) * 12));
    expect(chartTextWidth("Jul '11")).toBe(
      Math.ceil((0.66 + 0.56 + 0.32 + 0.32 + 0.32 + 0.32 + 0.32) * 12),
    );
    expect(chartTextWidth("ab", 10)).toBe(12);
  });
});

describe("paths", () => {
  const points = [
    [0, 10],
    [10, 0],
    [20, 5],
  ] as const;

  it("smooth curves keep horizontal tangents (no overshoot)", () => {
    expect(linePath(points)).toBe("M0,10C3.5,10 6.5,0 10,0C13.5,0 16.5,5 20,5");
    expect(linePath(points, "smooth", true)).toBe("M0,10C0,6.5 10,3.5 10,0C10,1.75 20,3.25 20,5");
  });

  it("straight and stepped lines", () => {
    expect(linePath(points, "straight")).toBe("M0,10L10,0L20,5");
    expect(linePath(points, "stepline")).toBe("M0,10L10,10L10,0L20,0L20,5");
    expect(linePath(points, "stepline", true)).toBe("M0,10L0,0L10,0L10,5L20,5");
    expect(linePath([])).toBe("");
  });

  it("bars round their value end only", () => {
    expect(barPath(0, 10, 100, 50, 4, false)).toBe(
      "M0,100V54A4,4 0 0 1 4,50H6A4,4 0 0 1 10,54V100Z",
    );
    expect(barPath(0, 10, 50, 100, 4, false)).toBe(
      "M0,50V96A4,4 0 0 0 4,100H6A4,4 0 0 0 10,96V50Z",
    );
    expect(barPath(0, 10, 0, 50, 4, true)).toBe("M0,0H46A4,4 0 0 1 50,4V6A4,4 0 0 1 46,10H0Z");
    expect(barPath(0, 10, 50, 0, 4, true)).toBe("M50,0H4A4,4 0 0 0 0,4V6A4,4 0 0 0 4,10H50Z");
    expect(barPath(0, 10, 100, 50, 0, false)).toBe("M0,100V50H10V100Z");
    expect(barPath(0, 10, 0, 50, 0, true)).toBe("M0,0H50V10H0Z");
    // The radius never exceeds half the width or the length.
    expect(barPath(0, 4, 10, 9, 4, false)).toContain("A1,1");
  });
});

describe("layoutChart", () => {
  it("line: points span the plot, grid per tick, labels on both axes", () => {
    const result = layout(
      { series: [{ name: "A", data: [10, 40, 20, 100] }], categories: MONTHS },
      { markerSize: 4 },
    );
    expect(result).toMatchObject({
      width: 400,
      height: 280,
      mode: "index",
      horizontal: false,
      banded: false,
    });
    expect(texts(result.nodes, "y")).toEqual(["0", "20", "40", "60", "80", "100"]);
    expect(texts(result.nodes, "x")).toEqual(MONTHS);
    expect(find(result.nodes, "data-ok-chart-grid-line")).toHaveLength(6);
    expect(result.slots[0]?.pos).toBe(result.plot.x);
    expect(result.slots[3]?.pos).toBe(result.plot.x + result.plot.width);
    expect(find(result.nodes, "data-ok-chart-marker")).toHaveLength(4);
    expect(result.activeRadius).toBe(6);
    expect(result.marks[3]).toMatchObject({
      series: 0,
      type: "line",
      index: 3,
      value: 100,
      py: result.plot.y,
    });
  });

  it("gaps break lines; hidden series are left out of the scale", () => {
    const result = layout(
      {
        series: [
          { name: "A", data: [10, null, 20, 30] },
          { name: "B", data: [500, 500, 500, 500] },
        ],
        categories: MONTHS,
      },
      { hidden: [1], curve: "straight" },
    );
    expect(find(result.nodes, "data-ok-chart-line")).toHaveLength(2);
    expect(find(result.nodes, "data-ok-chart-series")).toHaveLength(1);
    expect(texts(result.nodes, "y").at(-1)).toBe("30");
  });

  it("area: a gradient per series, or a solid tint", () => {
    const input = {
      type: "area",
      series: [{ name: "A", data: [1, 2, 3, 4], color: "info" as const }],
      categories: MONTHS,
    };
    const gradient = layout(input);
    const [def] = find(gradient.nodes, "id");
    expect(def).toMatchObject({
      tag: "linearGradient",
      attrs: { id: "t-area-0", "data-ok-color": "info" },
    });
    expect(find(gradient.nodes, "data-ok-chart-area")[0]?.attrs["fill"]).toBe("url(#t-area-0)");
    const solid = layout(input, { fill: "solid" });
    expect(find(solid.nodes, "id")).toHaveLength(0);
    expect(find(solid.nodes, "data-ok-chart-area")[0]?.attrs["fill"]).toBeUndefined();
    expect(solid.activeRadius).toBe(5);
  });

  it("columns: bands, grouped bars, per-point colors, zero bars skipped", () => {
    const result = layout(
      {
        type: "bar",
        series: [
          { name: "A", data: [10, { y: -5, color: "error" }, 0, null] },
          { name: "B", data: [20, 5, 5, 5] },
        ],
        categories: MONTHS,
      },
      { columnWidth: 50 },
    );
    expect(result).toMatchObject({ banded: true, activeRadius: 0 });
    expect(result.band).toBeCloseTo(result.plot.width / 4, 1);
    const bars = find(result.nodes, "data-ok-chart-bar");
    expect(bars).toHaveLength(6);
    expect(bars[1]?.attrs["data-ok-color"]).toBe("error");
    expect(result.slots[0]?.pos).toBeCloseTo(result.plot.x + result.band / 2, 1);
    expect(result.marks.filter((mark) => mark.series === 0)).toHaveLength(3);
    expect(texts(result.nodes, "y")[0]).toBe("-5");
  });

  it("stacked columns: running totals, only the stack end is rounded", () => {
    const result = layout(
      {
        type: "bar",
        series: [
          { name: "A", data: [10, -4, 0] },
          { name: "B", data: [20, -6, null] },
        ],
        categories: ["Jan", "Feb", "Mar"],
      },
      { stacked: true },
    );
    const [a, b] = find(result.nodes, "data-ok-chart-series").map((group) => group.children ?? []);
    expect(a?.[0]?.attrs["d"]).not.toContain("A");
    expect(b?.[0]?.attrs["d"]).toContain("A");
    expect(a?.[1]?.attrs["d"]).not.toContain("A");
    expect(b?.[1]?.attrs["d"]).toContain("A");
    expect(texts(result.nodes, "y").at(-1)).toBe("30");
    expect(texts(result.nodes, "y")[0]).toBe("-10");
  });

  it("stacked lines use the running totals too", () => {
    const result = layout(
      {
        series: [
          { name: "A", data: [10, 10] },
          { name: "B", data: [10, 10] },
        ],
        categories: ["a", "b"],
      },
      { stacked: true },
    );
    expect(result.marks.find((mark) => mark.series === 1)?.py).toBe(result.plot.y);
  });

  it("horizontal bars: categories down the side, value ticks along the bottom", () => {
    const result = layout(
      {
        type: "bar",
        series: [{ name: "A", data: [400, 1380] }],
        categories: ["Italy", "United Kingdom"],
      },
      { horizontal: true, barHeight: 30, width: 760 },
    );
    expect(result).toMatchObject({ horizontal: true, banded: true });
    expect(texts(result.nodes, "y")).toEqual(["Italy", "United Kingdom"]);
    expect(texts(result.nodes, "x")).toEqual(["0", "500", "1000", "1500"]);
    expect(find(result.nodes, "data-ok-chart-grid-line")).toHaveLength(3);
    expect(result.plot.x).toBe(chartTextWidth("United Kingdom") + 16);
    expect(result.marks[1]?.px).toBeGreaterThan(result.marks[0]?.px ?? 0);
  });

  it("horizontal: category labels thin out when rows are too short; no categories still lays out", () => {
    const many = layout(
      {
        type: "bar",
        series: [{ name: "A", data: Array.from({ length: 40 }, (_, i) => i) }],
        categories: Array.from({ length: 40 }, (_, i) => `C${i}`),
      },
      { horizontal: true },
    );
    expect(texts(many.nodes, "y").length).toBeLessThan(40);
    const empty = layout({ type: "bar", series: [] }, { horizontal: true });
    expect(empty.band).toBe(empty.plot.height);
  });

  it("horizontal needs every visible series to be a bar", () => {
    const result = layout(
      {
        type: "bar",
        series: [
          { name: "A", data: [1, 2] },
          { name: "B", data: [1, 2], type: "line" },
        ],
        categories: ["a", "b"],
      },
      { horizontal: true },
    );
    expect(result.horizontal).toBe(false);
    expect(result.activeRadius).toBe(5);
  });

  it("mixed: lines sit on the band centers; a y title moves the plot", () => {
    const result = layout(
      {
        type: "bar",
        series: [
          { name: "A", data: [1, 2], type: "bar" },
          { name: "B", data: [3, 4], type: "area" },
          { name: "C", data: [2, 3], type: "line" },
        ],
        categories: ["a", "b"],
      },
      { yTitle: "Points" },
    );
    const line = result.marks.find((mark) => mark.series === 2);
    expect(line?.px).toBe(result.slots[0]?.pos);
    expect(find(result.nodes, "data-ok-chart-axis-title")[0]?.text).toBe("Points");
    const order = (find(result.nodes, "data-ok-chart-series-group")[0]?.children ?? []).map(
      (g) => g.attrs["data-ok-type"],
    );
    expect(order).toEqual(["area", "bar", "line"]);
  });

  it("scatter: numeric x ticks, point mode, markers default to 5px", () => {
    const result = layout({
      type: "scatter",
      series: [{ name: "A", data: [[0.9, 0], [36.4, 20], { x: 10, y: 5, color: "info" }] }],
    });
    expect(result.mode).toBe("point");
    expect(texts(result.nodes, "x")).toEqual(["0", "10", "20", "30", "40"]);
    const markers = find(result.nodes, "data-ok-chart-marker");
    expect(markers.map((m) => m.attrs["r"])).toEqual(["5", "5", "5"]);
    expect(markers[2]?.attrs["data-ok-color"]).toBe("info");
  });

  it("scatter with decimals and no points", () => {
    const small = layout({
      type: "scatter",
      series: [
        {
          name: "A",
          data: [
            [0.1, 1],
            [0.4, 2],
          ],
        },
      ],
    });
    expect(texts(small.nodes, "x")).toContain("0.1");
    const empty = layout({ type: "scatter", series: [{ name: "A", data: [] }] });
    expect(texts(empty.nodes, "x").at(0)).toMatch(/^0(\.0+)?$/);
    expect(texts(empty.nodes, "x").at(-1)).toMatch(/^1(\.0+)?$/);
  });

  it("datetime: thins labels to whole units, majors are bold", () => {
    const categories = Array.from({ length: 36 }, (_, i) => Date.UTC(2011, i, 1));
    const result = layout(
      {
        type: "bar",
        xType: "datetime",
        series: [{ name: "A", data: categories.map((_, i) => i - 18) }],
        categories,
      },
      { width: 760 },
    );
    const labels = find(result.nodes, "data-ok-chart-axis", "x")[0]?.children ?? [];
    expect(labels.length).toBeLessThan(36);
    expect(
      labels.some((label) => label.text === "2012" && label.attrs["data-ok-major"] === ""),
    ).toBe(true);
  });

  it("categories wider than their slots are thinned; one category sits in the middle", () => {
    const many = layout({
      series: [{ name: "A", data: Array.from({ length: 60 }, (_, i) => i) }],
      categories: Array.from({ length: 60 }, (_, i) => `Label ${i}`),
    });
    expect(texts(many.nodes, "x").length).toBeLessThan(20);
    const one = layout({ series: [{ name: "A", data: [5] }], categories: ["Only"] });
    expect(one.slots[0]?.pos).toBe(one.plot.x + one.plot.width / 2);
    const huge = layout(
      {
        series: [{ name: "A", data: Array.from({ length: 3 }, (_, i) => i) }],
        categories: ["a", "b", "c"],
      },
      { width: 40 },
    );
    expect(huge.width).toBe(40);
    // Very wide labels in tiny plots fall back to a computed step.
    const tiny = layout({
      series: [{ name: "A", data: [1, 2, 3, 4, 5] }],
      categories: ["a".repeat(80), "b", "c", "d", "e"],
    });
    expect(texts(tiny.nodes, "x")).toHaveLength(1);
  });

  it("no data: a 0–1 scale; no categories: numbered slots", () => {
    const result = layout({ series: [{ name: "A", data: [null, null] }] });
    expect(texts(result.nodes, "y")).toEqual(["0.0", "0.2", "0.4", "0.6", "0.8", "1.0"]);
    expect(texts(result.nodes, "x")).toEqual(["1", "2"]);
  });

  it("fixed value range", () => {
    const result = layout(
      { series: [{ name: "A", data: [5, 50] }], categories: ["a", "b"] },
      { yMin: 0, yMax: 100 },
    );
    expect(texts(result.nodes, "y")).toEqual(["0", "20", "40", "60", "80", "100"]);
  });

  it("draws in a fixed order: grid, axes, crosshair, series, active", () => {
    const result = layout(
      { type: "area", series: [{ name: "A", data: [1, 2] }], categories: ["a", "b"] },
      { yTitle: "Y" },
    );
    expect(result.nodes.map((node) => Object.keys(node.attrs)[0] ?? node.tag)).toEqual([
      "defs",
      "data-ok-chart-grid",
      "x",
      "data-ok-chart-axis",
      "data-ok-chart-axis",
      "data-ok-chart-crosshair",
      "data-ok-chart-series-group",
      "data-ok-chart-active",
    ]);
  });
});
