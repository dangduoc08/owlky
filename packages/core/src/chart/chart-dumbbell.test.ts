import { describe, expect, it } from "vitest";
import { type ChartRenderInput, renderChart } from "./chart.js";
import { chartActiveNodes, chartTooltip } from "./chart-active.js";
import type { ChartNode } from "./chart-layout.js";
import { chartData, readChartTable } from "./chart-model.js";
import { chartMarkAt } from "./chart-select.js";
import {
  CHART_TEXT_ATTRIBUTES,
  chartDumbbellColorsText,
  chartTextAttributes,
  parseChartDumbbellColors,
} from "./chart-text.js";

/* Dumbbell charts (4.18.21, ApexCharts `isDumbbell`, `dumbbellColors`). */

const base = { width: 640, height: 320, idPrefix: "t" };
const LOADS: Omit<ChartRenderInput, "width" | "height" | "idPrefix"> = {
  type: "dumbbell",
  categories: ["Home", "Search", "Cart"],
  series: [{ name: "Load", data: [{ y: [3.2, 1.8] }, { y: [1.9, 2.3] }, { y: [2, 2] }] }],
};
const draw = (input: Partial<ChartRenderInput> = {}) =>
  renderChart({ ...base, ...LOADS, ...input } as ChartRenderInput);

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

describe("dumbbell data", () => {
  it("keeps the two values in the order given, as start and end columns", () => {
    const data = chartData({ ...LOADS, series: LOADS.series ?? [] });
    expect(data.series[0]?.points.map((point) => [point.y, point.range])).toEqual([
      [1.8, [3.2, 1.8]],
      [2.3, [1.9, 2.3]],
      [2, [2, 2]],
    ]);
    const render = draw({ partLabels: { start: "Before", end: "After" } });
    expect(render.table.parts.map((cell) => [cell.text, cell.attrs["data-ok-part"]])).toEqual([
      ["Before", "start"],
      ["After", "end"],
    ]);
    expect(render.table.rows[0]?.cells.map((cell) => cell.text)).toEqual(["3.2", "1.8"]);
  });

  it("reads the table back in the same order", () => {
    const table = document.createElement("table");
    const head = table.createTHead();
    const top = head.insertRow();
    const x = document.createElement("th");
    x.rowSpan = 2;
    const series = document.createElement("th");
    series.colSpan = 2;
    series.textContent = "Load";
    top.append(x, series);
    const parts = head.insertRow();
    for (const part of ["start", "end"]) {
      const th = document.createElement("th");
      th.setAttribute("data-ok-part", part);
      th.textContent = part;
      parts.append(th);
    }
    const row = table.createTBody().insertRow();
    const th = document.createElement("th");
    th.textContent = "Home";
    row.append(th);
    for (const value of ["3.2", "1.8"]) row.insertCell().textContent = value;
    const read = readChartTable(table, "category", "dumbbell");
    expect(read.series[0]?.data).toEqual([{ y: [3.2, 1.8] }]);
    expect(chartData({ type: "dumbbell", ...read }).series[0]?.points[0]?.range).toEqual([
      3.2, 1.8,
    ]);
  });

  it("parses and writes dumbbell colors", () => {
    expect(parseChartDumbbellColors("info success; warning; nope error-dark")).toEqual([
      ["info", "success"],
      ["warning", "warning"],
      ["error-dark", "error-dark"],
    ]);
    expect(parseChartDumbbellColors("")).toEqual([]);
    expect(parseChartDumbbellColors("x".repeat(2001))).toEqual([]);
    expect(chartDumbbellColorsText([["info", "success"], ["warning"]])).toBe(
      "info success; warning",
    );
    expect(chartTextAttributes({ dumbbellColors: [["info", "success"]] })).toEqual({
      [CHART_TEXT_ATTRIBUTES.dumbbellColors]: "info success",
    });
  });
});

describe("dumbbell layout", () => {
  it("draws a line, a start ring and an end disc per point inside a padded scale", () => {
    const render = draw();
    expect(find(render.layout.nodes, "data-ok-chart-dumbbell-line")).toHaveLength(3);
    const ends = find(render.layout.nodes, "data-ok-chart-dumbbell");
    expect(ends.map((end) => end.attrs["data-ok-chart-dumbbell"])).toEqual([
      "start",
      "end",
      "start",
      "end",
      "start",
      "end",
    ]);
    expect(ends[0]?.attrs["r"]).toBe("6");
    // Every marker sits inside the plot, past its edge by less than its radius.
    const { plot } = render.layout;
    for (const end of ends) {
      expect(Number(end.attrs["cy"])).toBeGreaterThan(plot.y + 6);
      expect(Number(end.attrs["cy"])).toBeLessThan(plot.y + plot.height - 6);
    }
    expect(render.layout.y?.min).toBeGreaterThan(0);
    expect(render.layout.banded).toBe(true);
    expect(render.layout.activeRadius).toBe(0);
  });

  it("colors the ends per series, by point, and sizes them", () => {
    const render = draw({
      markerSize: 8,
      dumbbellColors: [["warning", "info"]],
      series: [
        { name: "A", data: [{ y: [1, 2] }, { y: [2, 3], color: "error" }, { y: [3, 1] }] },
        { name: "B", data: [{ y: [2, 4] }, null, { y: [1, 2] }] },
      ],
    });
    const ends = find(render.layout.nodes, "data-ok-chart-dumbbell");
    expect(ends.map((end) => end.attrs["data-ok-color"])).toEqual([
      "warning",
      "info",
      "error",
      "error",
      "warning",
      "info",
      // Series B takes the first pair.
      "warning",
      "info",
      "warning",
      "info",
    ]);
    expect(ends[0]?.attrs["r"]).toBe("8");
    // Without colors, the ends take the series color (no attribute).
    expect(find(draw().layout.nodes, "data-ok-chart-dumbbell")[0]?.attrs["data-ok-color"]).toBe(
      undefined,
    );
    // Two series sit side by side in each band.
    const lines = find(render.layout.nodes, "data-ok-chart-dumbbell-line");
    expect(lines[0]?.attrs["x1"]).not.toBe(lines[3]?.attrs["x1"]);
  });

  it("turns horizontal and prints the values outside the markers", () => {
    const render = draw({ horizontal: true, dataLabels: true });
    expect(render.layout.horizontal).toBe(true);
    const line = find(render.layout.nodes, "data-ok-chart-dumbbell-line")[0];
    expect(line?.attrs["y1"]).toBe(line?.attrs["y2"]);
    const labels = find(render.layout.nodes, "data-ok-chart-data-label");
    expect(labels.map((label) => [label.text, label.attrs["text-anchor"]])).toEqual([
      ["3.2", "start"],
      ["1.8", "end"],
      ["1.9", "end"],
      ["2.3", "start"],
      // Equal values: one label.
      ["2", "start"],
    ]);
    const vertical = find(draw({ dataLabels: true }).layout.nodes, "data-ok-chart-data-label");
    // Vertical: the higher value above its marker.
    expect(Number(vertical[0]?.attrs["y"])).toBeLessThan(Number(vertical[1]?.attrs["y"]));
  });
});

describe("dumbbell interaction", () => {
  it("lists the start and the end with their colors; several series name them", () => {
    const render = draw({ dumbbellColors: [["warning", "info"]] });
    const tip = chartTooltip(render.data, render.layout, render.format, {
      kind: "index",
      index: 0,
    });
    expect(tip?.rows.map((row) => [row.name, row.value, row.color])).toEqual([
      ["Start", "3.2", "warning"],
      ["End", "1.8", "info"],
    ]);
    const two = draw({
      series: [
        { name: "A", data: [{ y: [1, 2] }] },
        { name: "B", data: [{ y: [3, 4] }] },
      ],
    });
    expect(
      chartTooltip(two.data, two.layout, two.format, { kind: "index", index: 0 })?.rows.map(
        (row) => row.name,
      ),
    ).toEqual(["A (Start)", "A (End)", "B (Start)", "B (End)"]);
    const hover = chartActiveNodes(render.layout, { kind: "index", index: 0 });
    expect(hover.under[0]?.attrs["data-ok-chart-band"]).toBe("");
  });

  it("selects a dumbbell by a click on its line or markers, and zooms", () => {
    const render = draw();
    const mark = render.layout.marks[1];
    const box = mark?.box as NonNullable<typeof mark>["box"] & object;
    expect(chartMarkAt(render.layout, box.x + box.width / 2, box.y + 1)).toBe(1);
    expect(render.zoomable).toBe(true);
    expect(
      find(draw({ zoom: { min: 1, max: 2 } }).layout.nodes, "data-ok-chart-dumbbell-line"),
    ).toHaveLength(2);
  });
});
