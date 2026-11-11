import { describe, expect, it } from "vitest";
import { chartAttributes } from "../anatomy/anatomy.js";
import { type ChartRenderInput, renderChart } from "./chart.js";
import { chartActiveNodes, chartTooltip, nextChartActive } from "./chart-active.js";
import type { ChartNode } from "./chart-layout.js";
import { chartStreamBands, chartStreamBaseline, chartStreamOrder } from "./chart-stream.js";

/* Streamgraphs (roadmap 4.18.21): baselines, stacking order, bands, labels and tooltips. */

const base = { width: 400, height: 300, idPrefix: "t", type: "streamgraph" as const };
const SERIES = [
  { name: "A", data: [10, 20, 30, 20, 10] },
  { name: "B", data: [30, 20, 10, 20, 30] },
  { name: "C", data: [5, 5, 5, 5, 5] },
];
const CATEGORIES = ["Q1", "Q2", "Q3", "Q4", "Q5"];
const draw = (input: Partial<ChartRenderInput> = {}) =>
  renderChart({ ...base, series: SERIES, categories: CATEGORIES, ...input });

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

const VALUES = [
  [10, 20, 30],
  [30, 20, 10],
];

describe("stream math", () => {
  it("orders series inside out, by order given or reversed", () => {
    expect(chartStreamOrder(VALUES, "none")).toEqual([0, 1]);
    expect(chartStreamOrder(VALUES, "inverse")).toEqual([1, 0]);
    // B peaks first (top side holds less so far), A goes under it.
    expect(chartStreamOrder(VALUES, "inside-out")).toEqual([0, 1]);
    expect(
      chartStreamOrder(
        [
          [0, 9, 0, 0],
          [9, 0, 0, 0],
          [0, 0, 9, 0],
          [0, 0, 0, 9],
        ],
        "inside-out",
      ),
    ).toEqual([3, 0, 1, 2]);
  });

  it("computes each baseline", () => {
    expect(chartStreamBaseline(VALUES, "zero")).toEqual([0, 0, 0]);
    expect(chartStreamBaseline(VALUES, "silhouette")).toEqual([-20, -20, -20]);
    const wiggle = chartStreamBaseline(VALUES, "wiggle");
    expect(wiggle).toHaveLength(3);
    // Centered on the stream's extent.
    const top = wiggle.map((value) => value + 40);
    expect(Math.min(...wiggle) + Math.max(...top)).toBeCloseTo(0);
    // Empty columns keep the baseline.
    expect(chartStreamBaseline([[0, 0]], "wiggle")).toEqual([0, 0]);
    expect(chartStreamBaseline([], "silhouette")).toEqual([]);
  });

  it("stacks edges; expand fills 100 per column and leaves empty columns at 0", () => {
    const bands = chartStreamBands(VALUES, { offset: "zero", order: "none" });
    expect(bands[0]).toEqual({ series: 0, y0: [0, 0, 0], y1: [10, 20, 30] });
    expect(bands[1]).toEqual({ series: 1, y0: [10, 20, 30], y1: [40, 40, 40] });
    const expand = chartStreamBands(
      [
        [1, 0],
        [3, 0],
      ],
      { offset: "expand", order: "none" },
    );
    expect(expand[0]?.y1).toEqual([25, 0]);
    expect(expand[1]?.y1).toEqual([100, 0]);
  });
});

describe("streamgraph layout", () => {
  it("draws one band per visible series, hides the y axis and the grid", () => {
    const { layout, table, legend } = draw();
    expect(find(layout.nodes, "data-ok-chart-stream-band")).toHaveLength(3);
    expect(
      find(layout.nodes, "data-ok-chart-series").every(
        (group) => group.attrs["data-ok-type"] === "streamgraph",
      ),
    ).toBe(true);
    expect(find(layout.nodes, "data-ok-chart-grid-line")).toHaveLength(0);
    expect(find(layout.nodes, "data-ok-chart-axis")[1]?.children ?? []).toHaveLength(0);
    expect(table.rows).toHaveLength(5);
    expect(legend?.map((item) => item.name)).toEqual(["A", "B", "C"]);
    // Columns carry each band's supplied value, not the stacked edges.
    expect(layout.marks.filter((mark) => mark.index === 1).map((mark) => mark.value)).toEqual(
      expect.arrayContaining([20, 20, 5]),
    );
  });

  it("uses the y axis and grid when asked", () => {
    const { layout } = draw({ yaxis: { show: true }, grid: "y" });
    expect(find(layout.nodes, "data-ok-chart-grid-line").length).toBeGreaterThan(0);
    expect(find(layout.nodes, "data-ok-chart-tick").length).toBeGreaterThan(5);
  });

  it("names a band only where it fits; series hidden through the legend reflow", () => {
    expect(find(draw().layout.nodes, "data-ok-chart-data-label").length).toBeGreaterThan(0);
    expect(find(draw({ hideStreamLabels: true }).layout.nodes, "data-ok-chart-data-label")).toEqual(
      [],
    );
    expect(
      find(draw({ streamLabelMinWidth: 10_000 }).layout.nodes, "data-ok-chart-data-label"),
    ).toEqual([]);
    // Too little width for a long name.
    expect(
      find(
        draw({
          series: [{ name: "A very long series name indeed", data: [10, 10] }],
          categories: ["a", "b"],
          width: 80,
        }).layout.nodes,
        "data-ok-chart-data-label",
      ),
    ).toEqual([]);
    // Light colors get dark labels.
    const light = draw({
      colors: ["info-lighter", "success", "warning-light"],
      height: 900,
    });
    const places = find(light.layout.nodes, "data-ok-chart-data-label").map(
      (label) => label.attrs["data-ok-chart-data-label"],
    );
    expect(places).toContain("plain");
    expect(places).toContain("inside");
    const { layout } = draw({ hidden: [0] });
    expect(find(layout.nodes, "data-ok-chart-stream-band")).toHaveLength(2);
    expect(new Set(layout.marks.map((mark) => mark.series))).toEqual(new Set([1, 2]));
    expect(
      find(layout.nodes, "data-ok-chart-series")
        .map((group) => group.attrs["data-ok-index"])
        .sort(),
    ).toEqual(["1", "2"]);
  });

  it("joins series on x; missing and negative values are zero", () => {
    const { layout } = draw({
      categories: undefined,
      series: [
        {
          name: "A",
          data: [
            { x: "a", y: -4 },
            { x: "b", y: 2 },
          ],
        },
        { name: "B", data: [{ x: "b", y: 3 }] },
      ],
    });
    expect(layout.marks.map((mark) => mark.value).sort()).toEqual([-4, 2, 3]);
  });

  it("numeric x values become labels in order of first use", () => {
    const { data, layout } = draw({
      xType: "numeric",
      categories: undefined,
      series: [
        {
          name: "A",
          data: [
            [2020, 1],
            [2021, 2],
          ],
        },
      ],
    });
    expect(data.xType).toBe("category");
    expect(data.categories).toEqual(["2020", "2021"]);
    expect(layout.slots).toHaveLength(2);
  });

  it("offset, order and curve change the bands", () => {
    const d = (input: Partial<ChartRenderInput>) =>
      find(draw(input).layout.nodes, "data-ok-chart-stream-band").map((band) => band.attrs["d"]);
    expect(d({ streamOffset: "silhouette" })).not.toEqual(d({ streamOffset: "wiggle" }));
    expect(d({ streamOffset: "zero" })).not.toEqual(d({ streamOffset: "expand" }));
    expect(d({ streamOrder: "none" })).not.toEqual(d({ streamOrder: "inverse" }));
    expect(d({ curve: "straight" })[0]).toContain("L");
  });

  it("patterns tell bands apart with colorBlindMode", () => {
    const { layout, legend } = draw({ colorBlindMode: true });
    expect(
      find(layout.nodes, "data-ok-chart-stream-band").every((band) =>
        band.attrs["fill"]?.startsWith("url(#t-pattern-"),
      ),
    ).toBe(true);
    expect(legend?.every((item) => item.pattern)).toBe(true);
  });

  it("a whole type ignores series types, and writes the option attributes", () => {
    const { data } = draw({ series: [{ name: "A", type: "line", data: [1, 2] }] });
    expect(data.series[0]?.type).toBe("streamgraph");
    expect(
      chartAttributes({
        streamOffset: "expand",
        streamOrder: "none",
        hideStreamLabels: true,
        streamLabelMinWidth: 30,
        streamHoverOpacity: 0.5,
      }),
    ).toMatchObject({
      "data-ok-stream-offset": "expand",
      "data-ok-stream-order": "none",
      "data-ok-hide-stream-labels": "",
      "data-ok-stream-label-min-width": "30",
      "data-ok-stream-hover-opacity": "0.5",
    });
  });
});

describe("streamgraph keyboard and tooltip", () => {
  it("moves by x value and lists the bands top-down with the total", () => {
    const { data, layout, format } = draw({ streamOrder: "none", streamOffset: "zero" });
    const active = nextChartActive(layout, null, "ArrowRight");
    expect(active).toEqual({ kind: "index", index: 0 });
    const next = nextChartActive(layout, active ?? null, "ArrowRight");
    const tip = chartTooltip(data, layout, format, next ?? null);
    expect(tip?.title).toBe("Q2");
    expect(tip?.rows.map((row) => `${row.name}:${row.value}`)).toEqual([
      "C:5",
      "B:20",
      "A:20",
      "Total:45",
    ]);
    // A crosshair line and a marker on each band.
    const nodes = chartActiveNodes(layout, next ?? null);
    expect(nodes.under[0]?.attrs["data-ok-chart-crosshair-line"]).toBe("");
    expect(nodes.over).toHaveLength(3);
  });

  it("drops the total with expand", () => {
    const { data, layout, format } = draw({ streamOffset: "expand" });
    const tip = chartTooltip(data, layout, format, { kind: "index", index: 2 });
    expect(tip?.rows).toHaveLength(3);
  });

  it("per-point tooltips fade the other bands, unless the opacity is 1", () => {
    const { data, layout, format } = draw({ tooltip: "point" });
    expect(layout.mode).toBe("point");
    const active = { kind: "mark", mark: 0 } as const;
    const tip = chartTooltip(data, layout, format, active);
    expect(tip?.rows).toHaveLength(1);
    const { over } = chartActiveNodes(layout, active);
    expect(over[0]?.attrs["data-ok-chart-stream-veil"]).toBe("");
    expect(over[0]?.attrs["fill-opacity"]).toBe("0.65");
    expect(over[1]?.attrs["data-ok-chart-stream-band"]).toBe("");
    const unnamed = layout.marks.findIndex((mark) => !mark.stream?.label);
    expect(chartActiveNodes(layout, { kind: "mark", mark: unnamed }).over).toHaveLength(3);
    const named = layout.marks.findIndex((mark) => mark.stream?.label);
    expect(chartActiveNodes(layout, { kind: "mark", mark: named }).over).toHaveLength(4);
    const opaque = draw({ tooltip: "point", streamHoverOpacity: 1 });
    expect(chartActiveNodes(opaque.layout, active).over).toHaveLength(1);
  });
});
