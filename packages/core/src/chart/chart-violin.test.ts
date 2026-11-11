import { describe, expect, it } from "vitest";
import { chartAttributes } from "../anatomy/anatomy.js";
import { type ChartRenderInput, renderChart } from "./chart.js";
import { chartActiveNodes, chartTooltip, nextChartActive } from "./chart-active.js";
import type { ChartNode } from "./chart-layout.js";
import { chartData, chartTable, readChartTable } from "./chart-model.js";
import {
  chartBandwidth,
  chartKernelDensity,
  chartQuantile,
  chartTukeyEnds,
  chartViolinStats,
  parseChartViolinCell,
} from "./chart-stats.js";
import { chartViolinCurve } from "./chart-violin.js";

/* Violin charts (roadmap 4.18.21): statistics, curves, boxes, dots, table and tooltips. */

const base = { width: 500, height: 300, idPrefix: "t", type: "violin" as const };
const OBS = [10, 12, 14, 15, 16, 18, 20, 21, 24, 30];
const draw = (input: Partial<ChartRenderInput> = {}) =>
  renderChart({
    ...base,
    categories: ["A", "B"],
    series: [{ name: "Time", data: [{ y: OBS }, { y: [40, 42, 44, 46, 50] }] }],
    ...input,
  });

function find(nodes: readonly ChartNode[], attr: string): ChartNode[] {
  const found: ChartNode[] = [];
  const walk = (list: readonly ChartNode[]) => {
    for (const node of list) {
      if (node.attrs[attr] !== undefined) found.push(node);
      if (node.children) walk(node.children);
    }
  };
  walk(nodes);
  return found;
}

describe("statistics", () => {
  it("interpolates quantiles and finds Tukey's whisker ends", () => {
    expect(chartQuantile([1, 2, 3, 4], 0.5)).toBe(2.5);
    expect(chartQuantile([1, 2, 3, 4], 0)).toBe(1);
    expect(chartTukeyEnds([1, 2, 3, 4, 100])).toEqual([1, 4]);
  });

  it("parses points from a list, an object and a curve", () => {
    expect(chartViolinStats([3, 1, 2], undefined)?.five).toEqual([1, 1.5, 2, 2.5, 3]);
    expect(chartViolinStats({ points: ["2", "1", "x"] }, undefined)?.samples).toEqual([1, 2]);
    expect(chartViolinStats(null, [5, 7])?.count).toBe(2);
    expect(chartViolinStats([], undefined)).toBeNull();
    expect(chartViolinStats("text", undefined)).toBeNull();
    const curve = chartViolinStats(
      {
        density: [[4, 1], [2, 1], [3, 2], ["x", 1], [1, -1], "bad"],
      },
      undefined,
    );
    expect(curve?.density?.map(([v]) => v)).toEqual([2, 3, 4]);
    expect(curve?.count).toBe(4);
    expect(curve?.samples).toEqual([]);
    expect(curve?.five[2]).toBe(3);
  });

  it("estimates a density and a bandwidth, with zero spread handled", () => {
    const band = chartBandwidth(OBS);
    expect(band).toBeGreaterThan(0);
    expect(chartBandwidth([5, 5, 5])).toBeGreaterThan(0);
    expect(chartBandwidth([0, 0, 0])).toBeGreaterThan(0);
    const curve = chartKernelDensity(OBS, band, 32);
    expect(curve).toHaveLength(32);
    expect(curve[0]?.[0]).toBeCloseTo(10 - 3 * band);
    const stats = chartViolinStats(OBS, undefined);
    expect(stats && chartViolinCurve(stats, { kdeBandwidth: 2, kdeResolution: 8 })).toHaveLength(8);
    // Resolution is clamped.
    expect(chartKernelDensity(OBS, band, 1)).toHaveLength(4);
    expect(chartKernelDensity(OBS, band, 9999)).toHaveLength(256);
  });

  it("round-trips the attribute text of a cell", () => {
    expect(parseChartViolinCell("1 2 x 3", null)).toEqual({ points: [1, 2, 3] });
    expect(parseChartViolinCell(null, "1:2 x:y 3:4")).toEqual({
      density: [
        [1, 2],
        [3, 4],
      ],
    });
    expect(parseChartViolinCell("", "")).toBeNull();
    expect(parseChartViolinCell("1 ".repeat(250_000), null)).toBeNull();
  });
});

describe("violin layout", () => {
  it("draws a curve and dots per category, a band highlight and a legend per series", () => {
    const { layout, legend } = draw();
    expect(find(layout.nodes, "data-ok-chart-violin")).toHaveLength(2);
    expect(find(layout.nodes, "data-ok-chart-violin-point")).toHaveLength(15);
    expect(find(layout.nodes, "data-ok-chart-violin-box")).toHaveLength(0);
    expect(layout.mode).toBe("index");
    expect(layout.banded).toBe(true);
    expect(legend).toBeNull();
  });

  it("adds a box, whiskers and a median; tukey moves the whiskers", () => {
    const whiskerEnd = (input: Partial<ChartRenderInput>) =>
      find(draw({ violinBox: true, ...input }).layout.nodes, "data-ok-chart-violin-whisker").map(
        (line) => line.attrs["y2"],
      );
    const { layout } = draw({ violinBox: true });
    expect(find(layout.nodes, "data-ok-chart-violin-box")).toHaveLength(2);
    expect(find(layout.nodes, "data-ok-chart-violin-median")).toHaveLength(2);
    expect(find(layout.nodes, "data-ok-chart-violin-whisker")).toHaveLength(4);
    const outlier = {
      series: [{ name: "Time", data: [{ y: [10, 11, 12, 13, 14, 100] }] }],
      categories: ["A"],
    };
    expect(whiskerEnd({ ...outlier, violinWhiskers: "tukey" })).not.toEqual(whiskerEnd(outlier));
  });

  it("turns horizontal, half a violin, scales and thins", () => {
    const horizontal = draw({ horizontal: true, violinSide: "right" });
    expect(horizontal.layout.horizontal).toBe(true);
    const a = find(draw({ violinSide: "left" }).layout.nodes, "data-ok-chart-violin")[0];
    const b = find(draw({ violinSide: "right" }).layout.nodes, "data-ok-chart-violin")[0];
    const c = find(draw({ violinSide: "both" }).layout.nodes, "data-ok-chart-violin")[0];
    expect(a?.attrs["d"]).not.toEqual(b?.attrs["d"]);
    expect(b?.attrs["d"]).not.toEqual(c?.attrs["d"]);
    const scaled = find(draw({ bandwidthScale: 2 }).layout.nodes, "data-ok-chart-violin")[0];
    expect(scaled?.attrs["d"]).not.toEqual(c?.attrs["d"]);
    expect(
      find(draw({ violinMaxPoints: 3 }).layout.nodes, "data-ok-chart-violin-point"),
    ).toHaveLength(6);
    expect(
      find(draw({ hideViolinPoints: true }).layout.nodes, "data-ok-chart-violin-point"),
    ).toEqual([]);
    const loose = find(
      draw({ unconstrainedViolinPoints: true, violinJitter: 1, violinPointSize: 5 }).layout.nodes,
      "data-ok-chart-violin-point",
    );
    const tight = find(draw().layout.nodes, "data-ok-chart-violin-point");
    expect(loose[1]?.attrs["cx"]).not.toEqual(tight[1]?.attrs["cx"]);
    expect(loose[0]?.attrs["r"]).toBe("5");
  });

  it("group normalization shares one scale across violins", () => {
    const series = [
      {
        name: "S",
        data: [
          {
            y: {
              density: [
                [1, 1],
                [2, 5],
                [3, 1],
              ] as [number, number][],
            },
          },
          {
            y: {
              density: [
                [1, 1],
                [2, 1],
                [3, 1],
              ] as [number, number][],
            },
          },
        ],
      },
    ];
    const curve = (norm: "individual" | "group") =>
      find(draw({ series, violinNormalize: norm }).layout.nodes, "data-ok-chart-violin");
    expect(curve("group")[1]?.attrs["d"]).not.toEqual(curve("individual")[1]?.attrs["d"]);
    // A precomputed curve without points draws no dots, and keeps a blank count in the table.
    const { table, layout } = draw({ series, violinNormalize: "group" });
    expect(table.rows[0]?.cells[0]?.text).toBe("");
    expect(table.rows[0]?.cells[0]?.attrs["data-ok-density"]).toBe("1:1 2:5 3:1");
    expect(find(layout.nodes, "data-ok-chart-violin-point")).toEqual([]);
  });

  it("hidden series leave their slot; empty points draw nothing", () => {
    const series = [
      { name: "A", data: [{ y: OBS }] },
      { name: "B", data: [{ y: OBS }, { y: null }] },
    ];
    const { layout } = draw({ series, hidden: [0], categories: ["X", "Y"] });
    expect(find(layout.nodes, "data-ok-chart-violin")).toHaveLength(1);
    expect(find(draw({ series }).layout.nodes, "data-ok-chart-violin")).toHaveLength(2);
    expect(draw({ series: [{ name: "A", data: [null] }] }).layout.marks).toEqual([]);
  });

  it("patterns and marker shapes from colorBlindMode, and option attributes", () => {
    const { layout, legend } = draw({
      colorBlindMode: true,
      series: [
        { name: "A", data: [{ y: OBS }] },
        { name: "B", data: [{ y: OBS }] },
      ],
    });
    expect(find(layout.nodes, "data-ok-chart-violin")[0]?.attrs["fill"]).toContain("url(#");
    expect(find(layout.nodes, "data-ok-chart-violin-point")[0]?.tag).toBe("circle");
    expect(legend?.[1]?.pattern).toBeDefined();
    expect(
      chartAttributes({
        violinNormalize: "group",
        violinSide: "left",
        bandwidthScale: 1.5,
        kdeBandwidth: 2,
        kdeResolution: 32,
        violinBox: true,
        violinWhiskers: "tukey",
        hideViolinPoints: true,
        violinPointSize: 3,
        violinJitter: 0.2,
        unconstrainedViolinPoints: true,
        violinMaxPoints: 100,
      }),
    ).toMatchObject({
      "data-ok-violin-normalize": "group",
      "data-ok-violin-side": "left",
      "data-ok-bandwidth-scale": "1.5",
      "data-ok-kde-bandwidth": "2",
      "data-ok-kde-resolution": "32",
      "data-ok-violin-box": "",
      "data-ok-violin-whiskers": "tukey",
      "data-ok-hide-violin-points": "",
      "data-ok-violin-point-size": "3",
      "data-ok-violin-jitter": "0.2",
      "data-ok-unconstrained-violin-points": "",
      "data-ok-violin-max-points": "100",
    });
  });
});

describe("violin data and tooltip", () => {
  it("keeps the median and five numbers in the model and writes the table", () => {
    const { data, table } = draw();
    expect(data.series[0]?.points[0]?.y).toBe(17);
    expect(table.parts.map((p) => p.attrs["data-ok-part"])).toEqual([
      "count",
      "min",
      "q1",
      "median",
      "q3",
      "max",
    ]);
    const first = table.rows[0];
    expect(first?.cells.map((c) => c.text)).toEqual(["10", "10", "14.25", "17", "20.75", "30"]);
    expect(first?.cells[0]?.attrs["data-ok-samples"]).toBe(OBS.join(" "));
    expect(chartData({ type: "violin", xType: "numeric", series: [] }).xType).toBe("category");
  });

  it("reads observations and curves back from the table", () => {
    const table = document.createElement("table");
    const { table: model } = draw();
    const head = table.createTHead().insertRow();
    head.insertCell().textContent = "Plan";
    head.insertCell().textContent = "Time";
    const part = table.tHead?.insertRow() as HTMLTableRowElement;
    for (const p of model.parts) {
      const th = part.insertCell();
      th.setAttribute("data-ok-part", p.attrs["data-ok-part"] as string);
      th.textContent = p.text;
    }
    (head.cells[1] as HTMLTableCellElement).colSpan = 6;
    const body = table.createTBody();
    const row = body.insertRow();
    row.insertCell().textContent = "A";
    const cell = row.insertCell();
    cell.setAttribute("data-ok-samples", "1 2 3");
    const row2 = body.insertRow();
    row2.insertCell().textContent = "B";
    row2.insertCell().setAttribute("data-ok-density", "1:1 2:2");
    const row3 = body.insertRow();
    row3.insertCell().textContent = "C";
    row3.insertCell();
    const read = readChartTable(table, "category", "violin");
    const data = chartData({ ...read, type: "violin" });
    expect(data.series[0]?.points.map((p) => p.y)).toEqual([2, 2, null]);
    expect(data.series[0]?.points[1]?.violin?.density).toHaveLength(2);
    const round = chartTable(data, {
      xLabel: "x",
      formatX: String,
      formatValue: (v) => String(v),
    });
    expect(round.rows[0]?.cells[0]?.text).toBe("3");
  });

  it("moves by category and reads the five numbers and the count", () => {
    const { data, layout, format } = draw({
      series: [
        { name: "A", data: [{ y: OBS }] },
        { name: "B", data: [{ y: OBS }] },
      ],
      categories: ["X"],
    });
    const active = nextChartActive(layout, null, "Home") ?? null;
    const tip = chartTooltip(data, layout, format, active);
    expect(tip?.title).toBe("X");
    expect(tip?.rows.map((row) => row.name)).toContain("A (Median)");
    expect(tip?.rows.map((row) => row.name)).toContain("B (Count)");
    expect(tip?.rows.at(-1)?.value).toBe("10");
    expect(chartActiveNodes(layout, active).over).toEqual([]);
    expect(chartActiveNodes(layout, active).under[0]?.attrs["data-ok-chart-band"]).toBe("");
  });

  it("a single series has plain part names and a whole type ignores series types", () => {
    const { data, layout, format } = draw({
      series: [{ name: "A", type: "line", data: [{ y: OBS }] }],
      categories: ["X"],
    });
    expect(data.series[0]?.type).toBe("violin");
    const tip = chartTooltip(data, layout, format, { kind: "index", index: 0 });
    expect(tip?.rows.map((row) => row.name)).toEqual([
      "Minimum",
      "Q1",
      "Median",
      "Q3",
      "Maximum",
      "Count",
    ]);
  });
});
