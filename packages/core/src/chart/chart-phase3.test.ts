import { describe, expect, it } from "vitest";
import { chartAttributes } from "../anatomy/anatomy.js";
import { type ChartRenderInput, renderChart } from "./chart.js";
import { chartActiveAt, chartActiveNodes, chartTooltip, nextChartActive } from "./chart-active.js";
import { squarify } from "./chart-cells.js";
import type { ChartLayout, ChartNode } from "./chart-layout.js";
import {
  type ChartSeries,
  chartData,
  chartParts,
  isWholeChart,
  readChartTable,
} from "./chart-model.js";

/*
 * Phase 3 (ADR-0027, ADR-0029): box plots, heatmaps, treemaps, bubbles, range areas, funnels,
 * slopes, sparklines and the multi-value data table.
 */

const base = { width: 400, height: 240, idPrefix: "t" };
const draw = (input: Omit<ChartRenderInput, "width" | "height" | "idPrefix">, extra = {}) =>
  renderChart({ ...base, ...input, ...extra });

/** Every node with `attr` (and `value`), depth first. */
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
const center = (layout: ChartLayout, i: number) => layout.marks[i] as (typeof layout.marks)[0];

const BOX: ChartSeries[] = [
  {
    name: "Scores",
    data: [{ y: [54, 66, 69, 75, 88] }, { y: [88, 31, 59, 45, 39] }, { y: [1, 2] }, null],
  },
];
const HEAT: ChartSeries[] = [
  { name: "M1", data: [10, 20, null] },
  { name: "M2", data: [30, 40, 50] },
];
const TREE: ChartSeries[] = [
  {
    name: "Desktops",
    data: [
      { x: "ABC", y: 10 },
      { x: "DEF", y: 60 },
      { x: "XYZ", y: 41 },
    ],
  },
  {
    name: "Mobile",
    data: [
      { x: "ABCD", y: 10 },
      { x: "WXYZ", y: 51, color: "error" },
      { x: "NONE", y: 0 },
    ],
  },
];

describe("data model (phase 3)", () => {
  it("parts per type; whole charts and mixed series", () => {
    expect(chartParts("boxPlot")).toHaveLength(5);
    expect(chartParts("rangeArea")).toEqual(["low", "high"]);
    expect(chartParts("bubble")).toEqual(["y", "z"]);
    expect(chartParts("line")).toEqual([]);
    expect(isWholeChart("heatmap")).toBe(true);
    expect(isWholeChart("bubble")).toBe(false);
    const data = chartData({
      type: "rangeArea",
      series: [
        { name: "A", data: [{ y: [3, 1] }] },
        { name: "B", type: "heatmap", data: [1] },
        { name: "C", type: "line", data: [2] },
      ],
    });
    expect(data.series.map((s) => s.type)).toEqual(["rangeArea", "rangeArea", "line"]);
    // Values are sorted; a wrong count or a bad value is a gap.
    expect(data.series[0]?.points[0]).toEqual({ x: 0, y: 3, range: [1, 3] });
    const box = chartData({ type: "boxPlot", series: BOX });
    expect(box.series[0]?.points.map((p) => p.y)).toEqual([69, 45, null, null]);
    expect(box.series[0]?.points[1]?.range).toEqual([31, 39, 45, 59, 88]);
    expect(
      chartData({ type: "rangeArea", series: [{ name: "A", data: [{ y: [1, "x" as never] }] }] })
        .series[0]?.points[0]?.y,
    ).toBeNull();
    // A single value can't be an array.
    expect(
      chartData({ series: [{ name: "A", data: [{ y: [1] }] }] }).series[0]?.points[0]?.y,
    ).toBeNull();
  });

  it("bubbles: numeric x, sizes from triples and objects", () => {
    const data = chartData({
      type: "bubble",
      series: [{ name: "A", data: [[1, 2, 3], { x: 4, y: 5, z: 6 }, [7, 8], { x: "no", y: 1 }] }],
    });
    expect(data.xType).toBe("numeric");
    expect(data.series[0]?.points).toEqual([
      { x: 1, y: 2, z: 3 },
      { x: 4, y: 5, z: 6 },
      { x: 7, y: 8 },
    ]);
  });

  it("text x names categories when none are given; dates too", () => {
    const data = chartData({ type: "treemap", series: TREE });
    expect(data.categories).toEqual(["ABC", "DEF", "XYZ", "ABCD", "WXYZ", "NONE"]);
    expect(data.series[1]?.points[1]).toEqual({ x: 4, y: 51, color: "error" });
    const dates = chartData({
      xType: "datetime",
      series: [
        {
          name: "A",
          data: [{ x: "2024-01-01", y: 1 }, { x: "nope", y: 2 }, [Date.UTC(2024, 1, 1), 3]],
        },
      ],
    });
    expect(dates.categories).toEqual([Date.UTC(2024, 0, 1), Date.UTC(2024, 1, 1)]);
    expect(dates.series[0]?.points.map((p) => p.x)).toEqual([0, 1]);
    // Given categories win: points stay positional.
    expect(
      chartData({ categories: ["a", "b"], series: [{ name: "A", data: [{ x: "b", y: 1 }] }] })
        .series[0]?.points[0]?.x,
    ).toBe(0);
  });
});

describe("data table with several values per point", () => {
  it("two header rows: spans, parts, raw values and sizes", () => {
    const { table } = draw({
      type: "boxPlot",
      categories: ["2015", "2016", "2017", "2018"],
      series: [...BOX, { name: "Mean", type: "line", data: [70, 50, 1, 2] }],
      valueSuffix: "%",
    });
    expect(table.head[0]).toMatchObject({ text: "Category", rowSpan: 2 });
    expect(table.head[1]).toMatchObject({ text: "Scores", colSpan: 5 });
    expect(table.head[2]).toMatchObject({ text: "Mean", rowSpan: 2 });
    expect(table.parts.map((p) => p.text)).toEqual(["Minimum", "Q1", "Median", "Q3", "Maximum"]);
    expect(table.rows[0]?.cells.map((c) => c.text)).toEqual([
      "54%",
      "66%",
      "69%",
      "75%",
      "88%",
      "70%",
    ]);
    expect(table.rows[0]?.cells[0]?.attrs).toEqual({ "data-ok-value": "54" });
    expect(table.rows[2]?.cells.map((c) => c.text)).toEqual(["", "", "", "", "", "1%"]);
    const bubble = draw({
      type: "bubble",
      series: [
        {
          name: "A",
          data: [
            [1, 2, 3000],
            [2, 3],
          ],
        },
      ],
    }).table;
    expect(bubble.parts.map((p) => p.attrs["data-ok-part"])).toEqual(["y", "z"]);
    expect(bubble.rows[0]?.cells.map((c) => c.text)).toEqual(["2", "3,000"]);
    expect(bubble.rows[1]?.cells.map((c) => c.text)).toEqual(["3", ""]);
    // One value per series: one header row, as before.
    expect(draw({ series: HEAT, categories: ["a", "b", "c"] }).table.parts).toEqual([]);
  });

  it("reads two header rows back (box plots, ranges, bubbles) and ignores bad parts", () => {
    const table = document.createElement("table");
    table.innerHTML = `<thead>
      <tr><th rowspan="2">Day</th><th colspan="2" data-ok-color="info" data-ok-type="rangeArea">Range</th><th rowspan="2">Avg</th></tr>
      <tr><th data-ok-part="low">Low</th><th data-ok-part="high">High</th></tr></thead>
      <tbody><tr><th>Mon</th><td data-ok-color="error">1</td><td>3</td><td>2</td></tr>
      <tr><th>Tue</th><td></td><td>4</td><td>3</td></tr></tbody>`;
    const read = readChartTable(table, "category");
    expect(read.categories).toEqual(["Mon", "Tue"]);
    expect(read.series).toEqual([
      {
        name: "Range",
        type: "rangeArea",
        color: "info",
        data: [{ y: [1, 3], color: "error" }, null],
      },
      { name: "Avg", data: [2, 3] },
    ]);
    const bubbles = document.createElement("table");
    bubbles.innerHTML = `<thead><tr><th rowspan="2">X</th><th colspan="2">A</th></tr>
      <tr><th data-ok-part="y">Value</th><th data-ok-part="z">Size</th></tr></thead>
      <tbody><tr><th>1</th><td>2</td><td>30</td></tr><tr><th>2</th><td></td><td>1</td></tr><tr><th>3</th><td>4</td><td></td></tr></tbody>`;
    expect(readChartTable(bubbles, "numeric").series[0]?.data).toEqual([
      ["1", 2, 30],
      ["3", 4],
    ]);
    const round = renderChart({ ...base, type: "bubble", ...readChartTable(bubbles, "numeric") });
    expect(round.data.series[0]?.points).toEqual([
      { x: 1, y: 2, z: 30 },
      { x: 3, y: 4 },
    ]);
  });
});

describe("box plots, range areas and bubbles", () => {
  it("box plots: whiskers, two boxes, a band and five tooltip rows", () => {
    const { layout, data, format } = draw(
      { type: "boxPlot", categories: ["a", "b", "c", "d"], series: BOX },
      { boxUpperColor: "info", boxLowerColor: "error" },
    );
    expect(find(layout.nodes, "data-ok-chart-whisker")).toHaveLength(8);
    expect(find(layout.nodes, "data-ok-chart-box", "upper")[0]?.attrs["data-ok-color"]).toBe(
      "info",
    );
    expect(find(layout.nodes, "data-ok-chart-box", "lower")[0]?.attrs["data-ok-color"]).toBe(
      "error",
    );
    expect(layout.banded).toBe(true);
    expect(layout.activeRadius).toBe(0);
    // The scale fits the data instead of starting at zero.
    const ticks = find(layout.nodes, "data-ok-chart-axis", "y")[0]?.children ?? [];
    expect(Number(ticks[0]?.text)).toBeGreaterThan(0);
    const tip = chartTooltip(data, layout, format, { kind: "index", index: 0 });
    expect(tip?.rows.map((r) => `${r.name} ${r.value}`)).toEqual([
      "Minimum 54",
      "Q1 66",
      "Median 69",
      "Q3 75",
      "Maximum 88",
    ]);
    expect(tip?.rows[0]?.color).toBe("info");
    expect(chartActiveNodes(layout, { kind: "index", index: 0 }).over).toEqual([]);
    // Default colors: the series color above, its lighter tone below; two series name their rows.
    const two = draw({
      type: "boxPlot",
      categories: ["a"],
      series: [BOX[0] as ChartSeries, { ...(BOX[0] as ChartSeries), name: "B" }],
    });
    expect(find(two.layout.nodes, "data-ok-chart-box", "lower")[0]?.attrs["data-ok-color"]).toBe(
      "primary-main",
    );
    expect(
      chartTooltip(two.data, two.layout, two.format, { kind: "index", index: 0 })?.rows[0]?.name,
    ).toBe("Scores (Minimum)");
  });

  it("range areas: a closed band, two edges, a low – high tooltip, gaps", () => {
    const { layout, data, format } = draw({
      type: "rangeArea",
      categories: ["a", "b", "c", "d"],
      series: [
        { name: "R", data: [{ y: [1, 3] }, { y: [2, 5] }, null, { y: [2, 4] }] },
        { name: "Avg", type: "line", data: [2, 3, 3, 3] },
      ],
    });
    const series = find(layout.nodes, "data-ok-type", "rangeArea")[0];
    expect(find([series as ChartNode], "data-ok-chart-area")).toHaveLength(2);
    expect(find([series as ChartNode], "data-ok-chart-line")).toHaveLength(4);
    expect(find([series as ChartNode], "data-ok-chart-area")[0]?.attrs["d"]).toMatch(/Z$/);
    const tip = chartTooltip(data, layout, format, { kind: "index", index: 1 });
    expect(tip?.rows.map((r) => r.value)).toEqual(["2 – 5", "3"]);
    // Bars or areas next to ranges keep zero in the scale.
    const withBars = draw({
      type: "rangeArea",
      categories: ["a"],
      series: [
        { name: "R", data: [{ y: [10, 20] }] },
        { name: "B", type: "bar", data: [15] },
      ],
    });
    expect(find(withBars.layout.nodes, "data-ok-chart-axis", "y")[0]?.children?.[0]?.text).toBe(
      "0",
    );
  });

  it("bubbles: radius by size, hit inside a bubble, a size row", () => {
    const { layout, data, format } = draw({
      type: "bubble",
      series: [
        {
          name: "A",
          data: [
            [1, 10, 100],
            [5, 20, 25],
            [9, 15],
          ],
        },
        { name: "B", data: [[3, 12, 0]], color: "error" },
      ],
    });
    expect(layout.mode).toBe("point");
    const radii = layout.marks.map((m) => m.r);
    expect(radii[0]).toBeGreaterThan(radii[1] as number);
    expect(radii[2]).toBe(4);
    expect(radii[3]).toBe(4);
    const big = center(layout, 0);
    const r = big.r as number;
    expect(chartActiveAt(layout, big.px + r - 1, big.py)).toEqual({ kind: "mark", mark: 0 });
    expect(chartActiveNodes(layout, { kind: "mark", mark: 0 }).over[0]?.attrs["r"]).toBe(
      String(r + 2),
    );
    expect(
      chartTooltip(data, layout, format, { kind: "mark", mark: 0 })?.rows.map(
        (row) => `${row.name} ${row.value}`,
      ),
    ).toEqual(["A 10", "Size 100"]);
    // No sizes at all: every bubble is the smallest.
    expect(
      draw({ type: "bubble", series: [{ name: "A", data: [[1, 1]] }] }).layout.marks[0]?.r,
    ).toBe(4);
  });
});

describe("heatmaps and treemaps", () => {
  it("heatmap: rows of shaded cells, labels that fit, the cell under the pointer", () => {
    const { layout, data, format } = draw(
      { type: "heatmap", categories: ["a", "b", "c"], series: HEAT },
      { dataLabels: true },
    );
    expect(layout.mode).toBe("cell");
    const cells = find(layout.nodes, "data-ok-chart-cell");
    expect(cells).toHaveLength(5);
    expect(cells.map((c) => c.attrs["fill-opacity"])).toEqual([
      "0.12",
      "0.34",
      "0.56",
      "0.78",
      "1",
    ]);
    // The first series is the bottom row.
    expect(center(layout, 0).py).toBeGreaterThan(center(layout, 2).py);
    expect(find(layout.nodes, "data-ok-chart-data-label", "plain")).toHaveLength(3);
    expect(find(layout.nodes, "data-ok-chart-data-label", "inside")).toHaveLength(2);
    const at = center(layout, 3);
    expect(chartActiveAt(layout, at.px, at.py)).toEqual({ kind: "mark", mark: 3 });
    expect(chartActiveAt(layout, 1, 1)).toBeNull();
    expect(chartActiveNodes(layout, { kind: "mark", mark: 3 }).over[0]?.attrs).toMatchObject({
      rx: "2",
      "data-ok-chart-active-cell": "",
    });
    expect(chartTooltip(data, layout, format, { kind: "mark", mark: 3 })).toMatchObject({
      title: "b",
      rows: [{ name: "M2", value: "40" }],
    });
    // Hidden rows leave; one value shades fully; tiny cells drop their labels.
    const hidden = draw(
      {
        type: "heatmap",
        categories: ["a"],
        series: [{ name: "M", data: [7] }, ...HEAT],
        hidden: [1, 2],
      },
      { dataLabels: true, width: 60 },
    );
    expect(find(hidden.layout.nodes, "data-ok-chart-cell")[0]?.attrs["fill-opacity"]).toBe("1");
    expect(find(hidden.layout.nodes, "data-ok-chart-data-label")).toHaveLength(0);
    const dates = draw({
      type: "heatmap",
      xType: "datetime",
      categories: ["2024-01-01", "2024-01-02"],
      series: HEAT,
    });
    expect(find(dates.layout.nodes, "data-ok-chart-axis", "x")[0]?.children?.[0]?.text).toBe(
      "Jan '24",
    );
  });

  it("heatmap keyboard: arrows move in their direction, Home / End", () => {
    const { layout } = draw({ type: "heatmap", categories: ["a", "b", "c"], series: HEAT });
    // Marks: M1 a, M1 b (bottom row), M2 a, M2 b, M2 c (top row).
    expect(nextChartActive(layout, null, "ArrowRight")).toEqual({ kind: "mark", mark: 2 });
    expect(nextChartActive(layout, null, "End")).toEqual({ kind: "mark", mark: 1 });
    const from = { kind: "mark", mark: 0 } as const;
    expect(nextChartActive(layout, from, "ArrowRight")).toEqual({ kind: "mark", mark: 1 });
    expect(nextChartActive(layout, from, "ArrowUp")).toEqual({ kind: "mark", mark: 2 });
    expect(nextChartActive(layout, from, "ArrowLeft")).toEqual(from);
    expect(nextChartActive(layout, { kind: "mark", mark: 2 }, "ArrowDown")).toEqual(from);
    expect(nextChartActive(layout, from, "Home")).toEqual({ kind: "mark", mark: 2 });
    expect(nextChartActive(layout, from, "Enter")).toBeUndefined();
    const empty = draw({ type: "heatmap", series: [] });
    expect(nextChartActive(empty.layout, null, "Home")).toBeNull();
  });

  it("squarify: areas proportional to values, inside the box, nothing for no area", () => {
    const rects = squarify(
      [
        { key: 0, value: 6 },
        { key: 1, value: 6 },
        { key: 2, value: 4 },
        { key: 3, value: 3 },
        { key: 4, value: 2 },
        { key: 5, value: 2 },
        { key: 6, value: 1 },
      ],
      { x: 0, y: 0, width: 600, height: 400 },
    );
    expect(rects.size).toBe(7);
    for (const [key, r] of rects) {
      expect(r.x).toBeGreaterThanOrEqual(-1e-6);
      expect(r.x + r.width).toBeLessThanOrEqual(600 + 1e-6);
      expect(r.y + r.height).toBeLessThanOrEqual(400 + 1e-6);
      expect(r.width * r.height).toBeCloseTo(
        (240000 * ([6, 6, 4, 3, 2, 2, 1][key] as number)) / 24,
        3,
      );
    }
    expect(squarify([{ key: 0, value: 0 }], { x: 0, y: 0, width: 10, height: 10 }).size).toBe(0);
  });

  it("treemap: groups per series, names that fit, tags, cells under the pointer", () => {
    const { layout, data, format } = draw({ type: "treemap", series: TREE }, { dataLabels: true });
    const cells = find(layout.nodes, "data-ok-chart-cell");
    expect(cells).toHaveLength(5);
    expect(cells.find((c) => c.attrs["data-ok-color"])?.attrs["data-ok-color"]).toBe("error");
    expect(find(layout.nodes, "data-ok-chart-tag")).toHaveLength(2);
    expect(find(layout.nodes, "data-ok-chart-tag-label").map((n) => n.text)).toEqual([
      "Desktops",
      "Mobile",
    ]);
    expect(find(layout.nodes, "data-ok-chart-cell-label").map((n) => n.text)).toContain("DEF");
    expect(find(layout.nodes, "data-ok-chart-data-label").length).toBeGreaterThan(0);
    const def = layout.marks.findIndex((m) => m.value === 60);
    const at = center(layout, def);
    expect(chartActiveAt(layout, at.px, at.py)).toEqual({ kind: "mark", mark: def });
    expect(chartActiveNodes(layout, { kind: "mark", mark: def }).over[0]?.attrs["rx"]).toBe("4");
    expect(chartTooltip(data, layout, format, { kind: "mark", mark: def })).toMatchObject({
      title: "DEF",
      rows: [{ name: "Desktops", value: "60" }],
    });
    // One series: no tags; tiny boxes: no names.
    const one = draw(
      { type: "treemap", series: [TREE[0] as ChartSeries] },
      { width: 60, height: 40 },
    );
    expect(find(one.layout.nodes, "data-ok-chart-tag")).toHaveLength(0);
    expect(find(one.layout.nodes, "data-ok-chart-cell-label")).toHaveLength(0);
    expect(draw({ type: "treemap", series: TREE, hidden: [0, 1] }).layout.marks).toEqual([]);
  });
});

describe("funnels and slopes", () => {
  it("funnel: centered bars by share of the largest, labels, a band", () => {
    const { layout, data, format } = draw(
      {
        type: "funnel",
        categories: ["a", "b", "c"],
        series: [{ name: "N", data: [100, 50, { y: 2, color: "error" }] }],
      },
      { dataLabels: true },
    );
    const bars = find(layout.nodes, "data-ok-chart-bar");
    expect(bars).toHaveLength(3);
    const width = (i: number) => Number(bars[i]?.attrs["width"]);
    expect(width(1)).toBeCloseTo(width(0) / 2, 1);
    // Centered: the same middle.
    expect(Number(bars[0]?.attrs["x"]) + width(0) / 2).toBeCloseTo(
      Number(bars[1]?.attrs["x"]) + width(1) / 2,
      1,
    );
    expect(bars[2]?.attrs["data-ok-color"]).toBe("error");
    expect(find(layout.nodes, "data-ok-chart-data-label").map((n) => n.text)).toEqual([
      "100",
      "50",
    ]);
    expect(layout).toMatchObject({ horizontal: true, banded: true, mode: "index" });
    expect(chartTooltip(data, layout, format, { kind: "index", index: 2 })?.rows[0]?.color).toBe(
      "error",
    );
    expect(
      chartActiveNodes(layout, { kind: "index", index: 0 }).under[0]?.attrs["data-ok-chart-band"],
    ).toBe("");
    // `barHeight` sets the thickness; a hidden series leaves an empty funnel.
    const thin = draw(
      { type: "funnel", categories: ["a"], series: [{ name: "N", data: [1] }] },
      { barHeight: 10 },
    );
    expect(Number(find(thin.layout.nodes, "data-ok-chart-bar")[0]?.attrs["height"])).toBeCloseTo(
      ((240 / 1) * 10) / 100,
      1,
    );
    expect(
      draw({ type: "funnel", series: [{ name: "N", data: [1] }], hidden: [0] }).layout.marks,
    ).toEqual([]);
  });

  it("slope: straight lines, values beside the ends, gaps", () => {
    const { layout } = draw({
      type: "slope",
      categories: ["2025", "mid", "2026"],
      series: [
        { name: "A", data: [43, 30, 28] },
        { name: "B", data: [36, null, 41] },
      ],
      valueSuffix: " min",
    });
    const labels = find(layout.nodes, "data-ok-chart-data-label");
    expect(labels.map((n) => n.attrs["text-anchor"])).toEqual([
      "end",
      "middle",
      "start",
      "end",
      "start",
    ]);
    expect(labels[0]?.text).toBe("43 min");
    expect(
      find(layout.nodes, "data-ok-type", "slope")[1]?.children?.filter((c) => c.tag === "path"),
    ).toHaveLength(2);
    expect(find(layout.nodes, "data-ok-chart-line")[0]?.attrs["d"]).not.toContain("C");
    expect(find(layout.nodes, "data-ok-chart-grid-line")).toHaveLength(3);
    expect(layout.activeRadius).toBe(6);
    const one = draw(
      { type: "slope", categories: ["a"], series: [{ name: "A", data: [1] }], yMin: 0, yMax: 2 },
      { markerSize: 0, dashArray: 3 },
    );
    expect(find(one.layout.nodes, "data-ok-chart-marker")).toHaveLength(0);
    expect(find(one.layout.nodes, "data-ok-chart-line")[0]?.attrs["stroke-dasharray"]).toBe("3");
    expect(draw({ type: "slope", series: [] }).layout.marks).toEqual([]);
  });
});

describe("label thinning (phase 3 layouts)", () => {
  const many = Array.from({ length: 40 }, (_, i) => `Category ${i + 1}`);
  const values = many.map((_, i) => i + 1);
  const labels = (layout: ChartLayout) => find(layout.nodes, "data-ok-chart-tick").length;
  it("funnels, slopes and heatmaps drop labels that would overlap", () => {
    const funnel = draw(
      { type: "funnel", categories: many, series: [{ name: "N", data: values }] },
      { height: 120 },
    );
    expect(labels(funnel.layout)).toBeLessThan(40);
    const slope = draw(
      { type: "slope", categories: many, series: [{ name: "N", data: values }] },
      { width: 300 },
    );
    expect(labels(slope.layout)).toBeLessThan(40);
    const heat = draw(
      { type: "heatmap", categories: many, series: [{ name: "N", data: values }] },
      { width: 300 },
    );
    expect(labels(heat.layout)).toBeLessThan(41);
    const dates = draw({
      type: "funnel",
      xType: "datetime",
      categories: ["2024-01-01"],
      series: [{ name: "N", data: [1] }],
    });
    expect(find(dates.layout.nodes, "data-ok-chart-tick")[0]?.text).toBe("Jan '24");
  });
});

describe("sparklines", () => {
  it("no axes, grid or legend; the scale fits the data; bars keep zero", () => {
    const line = draw(
      { series: HEAT, categories: ["a", "b", "c"] },
      { sparkline: true, legend: "top" },
    );
    expect(line.legend).toBeNull();
    expect(find(line.layout.nodes, "data-ok-chart-axis")).toHaveLength(0);
    expect(find(line.layout.nodes, "data-ok-chart-grid")).toHaveLength(0);
    expect(line.layout.plot).toEqual({ x: 3, y: 3, width: 394, height: 234 });
    const ys = line.layout.marks.map((m) => m.py);
    expect(Math.max(...ys)).toBeCloseTo(237, 0);
    expect(Math.min(...ys)).toBeCloseTo(3, 0);
    const bars = draw({ type: "bar", series: [{ name: "A", data: [5, 10] }] }, { sparkline: true });
    expect(bars.layout.plot.x).toBe(1);
    expect(find(bars.layout.nodes, "data-ok-chart-bar")).toHaveLength(2);
    const rows = draw(
      { type: "bar", horizontal: true, series: [{ name: "A", data: [5, 10] }] },
      { sparkline: true },
    );
    expect(rows.layout.marks[1]?.px).toBeCloseTo(399, 0);
    const flat = draw({ series: [{ name: "A", data: [5] }] }, { sparkline: true });
    expect(flat.layout.marks[0]?.px).toBeCloseTo(200, 0);
    const points = draw(
      {
        type: "scatter",
        series: [
          {
            name: "A",
            data: [
              [1, 1],
              [3, 2],
            ],
          },
        ],
      },
      { sparkline: true },
    );
    expect(points.layout.marks.map((m) => m.px)).toEqual([3, 397]);
    expect(
      draw({ type: "scatter", series: [{ name: "A", data: [] }] }, { sparkline: true }).layout
        .marks,
    ).toEqual([]);
  });
});

describe("chartAttributes (phase 3)", () => {
  it("writes the sparkline flag and valid box colors only", () => {
    expect(
      chartAttributes({
        type: "boxPlot",
        sparkline: true,
        boxUpperColor: "info",
        boxLowerColor: "nope" as never,
      }),
    ).toMatchObject({
      "data-ok-type": "boxPlot",
      "data-ok-sparkline": "",
      "data-ok-box-upper-color": "info",
    });
    expect(chartAttributes({ boxLowerColor: "nope" as never })).not.toHaveProperty(
      "data-ok-box-lower-color",
    );
    expect(chartAttributes()).not.toHaveProperty("data-ok-bar-height");
  });
});
