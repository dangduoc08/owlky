import { describe, expect, it } from "vitest";
import { chartAttributes } from "../anatomy/anatomy.js";
import { type ChartRenderInput, renderChart } from "./chart.js";
import { chartActiveNodes, chartTooltip } from "./chart-active.js";
import {
  chartDiscreteMarkers,
  chartDiscreteMarkersText,
  chartMarkerNode,
  chartMarkerShapes,
  chartPatternAt,
  chartPatterns,
  parseChartDiscreteMarkers,
} from "./chart-cues.js";
import type { ChartNode } from "./chart-layout.js";
import { chartData, chartTable, readChartTable } from "./chart-model.js";
import { chartTextAttributes } from "./chart-text.js";

/* Non-color series cues (4.18.62): marker shapes, discrete markers, patterns, dashes, widths. */

const base = { width: 640, height: 320, idPrefix: "t" };
const LINES: Omit<ChartRenderInput, "width" | "height" | "idPrefix"> = {
  type: "line",
  categories: ["A", "B", "C"],
  series: [
    { name: "One", data: [3, 5, 4] },
    { name: "Two", data: [1, 2, 6] },
    { name: "Three", data: [2, 4, 3] },
  ],
};
const draw = (input: Partial<ChartRenderInput> = {}) =>
  renderChart({ ...base, ...LINES, ...input } as ChartRenderInput);

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
const markers = (input: Partial<ChartRenderInput>) =>
  find(draw(input).layout.nodes, "data-ok-chart-marker");

describe("marker shapes", () => {
  it("draws every shape as a circle or a path", () => {
    for (const shape of chartMarkerShapes) {
      const node = chartMarkerNode(shape, 10, 10, 4, { "data-ok-chart-marker": "" });
      expect(node.tag).toBe(shape === "circle" ? "circle" : "path");
      if (shape !== "circle") {
        expect(node.attrs["data-ok-shape"]).toBe(shape);
        expect(node.attrs["d"]).toMatch(/^M/);
      }
    }
    expect(chartMarkerNode(undefined, 1, 2, 3, {}).attrs).toEqual({ cx: "1", cy: "2", r: "3" });
  });

  it("uses the chart's shape, a series' own, and keeps circles as before", () => {
    expect(markers({ markerSize: 4 }).every((node) => node.tag === "circle")).toBe(true);
    const shaped = markers({
      markerSize: 4,
      markerShape: "square",
      series: [
        { name: "One", markerShape: "triangle", data: [3, 5, 4] },
        { name: "Two", data: [1, 2, 6] },
      ],
    });
    expect(shaped.map((node) => node.attrs["data-ok-shape"])).toEqual([
      "triangle",
      "triangle",
      "triangle",
      "square",
      "square",
      "square",
    ]);
    // No markers without a size (shapes alone draw none on lines).
    expect(markers({ markerShape: "square" })).toEqual([]);
  });

  it("shapes the hover marker, the legend and the tooltip", () => {
    const render = draw({ markerSize: 4, markerShape: "diamond" });
    const active = chartActiveNodes(render.layout, { kind: "index", index: 0 });
    expect(active.over.map((node) => node.attrs["data-ok-shape"])).toEqual([
      "diamond",
      "diamond",
      "diamond",
    ]);
    expect(render.legend?.map((item) => item.shape)).toEqual(["diamond", "diamond", "diamond"]);
    const tip = chartTooltip(render.data, render.layout, render.format, {
      kind: "index",
      index: 0,
    });
    expect(tip?.rows[0]?.shape).toBe("diamond");
  });

  it("shapes scatter points and their discrete markers", () => {
    const render = renderChart({
      ...base,
      type: "scatter",
      markerShape: "cross",
      discreteMarkers: [
        { seriesIndex: 0, dataPointIndex: 1, color: "error", size: 9, shape: "star" },
      ],
      series: [
        {
          name: "One",
          data: [
            [1, 2],
            [2, 3],
            [3, 1],
          ],
        },
      ],
    });
    const nodes = find(render.layout.nodes, "data-ok-chart-marker");
    expect(nodes.map((node) => node.attrs["data-ok-shape"])).toEqual(["cross", "star", "cross"]);
    expect(nodes[1]?.attrs["data-ok-color"]).toBe("error");
  });
});

describe("discrete markers", () => {
  it("marks single points, also on series without markers", () => {
    const nodes = markers({
      discreteMarkers: [
        { seriesIndex: 1, dataPointIndex: 2, color: "warning" },
        { seriesIndex: 9, dataPointIndex: 0 },
      ],
    });
    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.attrs["r"]).toBe("5");
    expect(nodes[0]?.attrs["data-ok-color"]).toBe("warning");
  });

  it("validates, writes and reads them", () => {
    expect(
      chartDiscreteMarkers([
        {
          seriesIndex: 0,
          dataPointIndex: 1,
          size: 99,
          shape: "nope" as "star",
          color: "bad" as "info",
        },
        { seriesIndex: -1, dataPointIndex: 0 },
        { seriesIndex: 1.5, dataPointIndex: 0 },
      ]),
    ).toEqual([{ seriesIndex: 0, dataPointIndex: 1 }]);
    const list = [
      {
        seriesIndex: 0,
        dataPointIndex: 3,
        color: "error" as const,
        shape: "square" as const,
        size: 6,
      },
      { seriesIndex: 1, dataPointIndex: 2 },
    ];
    const text = chartDiscreteMarkersText(list);
    expect(text).toBe("0 3 error square 6; 1 2");
    expect(parseChartDiscreteMarkers(text)).toEqual(list);
    expect(parseChartDiscreteMarkers("x 1; 2; 3 4 6 star")).toEqual([
      { seriesIndex: 3, dataPointIndex: 4, size: 6, shape: "star" },
    ]);
    expect(parseChartDiscreteMarkers(null)).toEqual([]);
    expect(chartTextAttributes({ discreteMarkers: list })["data-ok-discrete-markers"]).toBe(text);
  });
});

describe("patterns", () => {
  const bars: Partial<ChartRenderInput> = { type: "bar", fill: "pattern" };

  it("fills bars with a pattern per series, defined once per pattern and color", () => {
    const render = draw(bars);
    const defs = find(render.layout.nodes, "data-ok-chart-pattern");
    expect(defs.map((node) => node.attrs["data-ok-chart-pattern"])).toEqual(
      chartPatterns.slice(0, 3),
    );
    expect(defs[0]?.tag).toBe("pattern");
    expect(defs[0]?.attrs["id"]).toBe("t-pattern-slantedLines-primary-dark");
    expect(defs[0]?.attrs["patternUnits"]).toBe("userSpaceOnUse");
    const fills = find(render.layout.nodes, "data-ok-chart-bar").map((node) => node.attrs["fill"]);
    expect(fills[0]).toBe("url(#t-pattern-slantedLines-primary-dark)");
    expect(new Set(fills).size).toBe(3);
    expect(render.legend?.map((item) => item.pattern)).toEqual(chartPatterns.slice(0, 3));
    const tip = chartTooltip(render.data, render.layout, render.format, {
      kind: "index",
      index: 0,
    });
    expect(tip?.rows.map((row) => row.pattern)).toEqual(chartPatterns.slice(0, 3));
  });

  it("one fillPattern for every series; series patterns without fill", () => {
    const all = draw({ type: "bar", fillPattern: "circles" });
    expect(
      find(all.layout.nodes, "data-ok-chart-pattern").map((n) => n.attrs["data-ok-chart-pattern"]),
    ).toEqual(["circles", "circles", "circles"]);
    const own = draw({
      type: "area",
      series: [
        { name: "One", fillPattern: "verticalLines", data: [1, 2, 3] },
        { name: "Two", data: [2, 3, 1] },
      ],
    });
    const areas = find(own.layout.nodes, "data-ok-chart-area");
    expect(areas[0]?.attrs["fill"]).toBe("url(#t-pattern-verticalLines-primary-dark)");
    // The other area keeps its gradient.
    expect(areas[1]?.attrs["fill"]).toBe("url(#t-area-1)");
    expect(draw({ type: "bar" }).layout.nodes.some((n) => n.tag === "defs")).toBe(false);
  });

  it("fills slices per category and leaves radial bars alone", () => {
    const pie = renderChart({
      ...base,
      type: "pie",
      fill: "pattern",
      categories: ["A", "B"],
      series: [{ name: "One", data: [1, 2] }],
    });
    const slices = find(pie.layout.nodes, "data-ok-chart-slice");
    expect(slices.map((node) => node.attrs["fill"])).toEqual([
      "url(#t-pattern-slantedLines-primary-dark)",
      "url(#t-pattern-squares-warning)",
    ]);
    expect(pie.legend?.map((item) => item.pattern)).toEqual(["slantedLines", "squares"]);
    const tip = chartTooltip(pie.data, pie.layout, pie.format, { kind: "index", index: 1 });
    expect(tip?.rows[0]?.pattern).toBe("squares");
    const radial = renderChart({
      ...base,
      type: "radialBar",
      fill: "pattern",
      categories: ["A", "B"],
      series: [{ name: "One", data: [10, 20] }],
    });
    expect(find(radial.layout.nodes, "data-ok-chart-pattern")).toEqual([]);
    expect(radial.legend?.[0]?.pattern).toBeUndefined();
    const polar = renderChart({
      ...base,
      type: "polarArea",
      fillPattern: "squares",
      categories: ["A", "B"],
      series: [{ name: "One", data: [10, 20] }],
    });
    expect(find(polar.layout.nodes, "data-ok-chart-slice")[0]?.attrs["fill"]).toBe(
      "url(#t-pattern-squares-primary-dark)",
    );
  });

  it("chartPatternAt cycles the patterns", () => {
    expect(chartPatternAt({}, 0)).toBeUndefined();
    expect(chartPatternAt({ fill: "pattern" }, 6)).toBe(chartPatterns[1]);
    expect(chartPatternAt({ colorBlindMode: true, fillPattern: "squares" }, 3)).toBe("squares");
  });
});

describe("strokes and color blind mode", () => {
  it("draws widths and dashes per series", () => {
    const render = draw({
      strokeWidth: 3,
      dashArray: 2,
      series: [
        { name: "One", strokeWidth: 5, dashArray: 8, data: [1, 2, 3] },
        { name: "Two", data: [2, 3, 1] },
      ],
    });
    const lines = find(render.layout.nodes, "data-ok-chart-line");
    expect(lines.map((n) => [n.attrs["stroke-width"], n.attrs["stroke-dasharray"]])).toEqual([
      ["5", "8"],
      ["3", "2"],
    ]);
    // Without options: no attributes (CSS draws 2.5px solid lines).
    const plain = find(draw().layout.nodes, "data-ok-chart-line")[0];
    expect(plain?.attrs["stroke-width"]).toBeUndefined();
  });

  it("colorBlindMode gives each series a shape, a dash and a pattern", () => {
    const render = draw({ colorBlindMode: true });
    const lines = find(render.layout.nodes, "data-ok-chart-line");
    expect(lines.map((n) => n.attrs["stroke-dasharray"])).toEqual([undefined, "6 4", "2 3"]);
    const nodes = find(render.layout.nodes, "data-ok-chart-marker");
    expect(nodes).toHaveLength(9);
    expect(nodes[0]?.attrs["r"]).toBe("4");
    expect(render.legend?.map((item) => item.shape)).toEqual([undefined, "square", "triangle"]);
    const bars = draw({ type: "bar", colorBlindMode: true });
    expect(bars.legend?.map((item) => item.pattern)).toEqual(chartPatterns.slice(0, 3));
    // A chart-wide dash keeps every series on it.
    const dashed = find(
      draw({ colorBlindMode: true, dashArray: 3 }).layout.nodes,
      "data-ok-chart-line",
    );
    expect(dashed.map((n) => n.attrs["stroke-dasharray"])).toEqual(["3", "3", "3"]);
  });

  it("keeps series cues on the table and reads them back", () => {
    const data = chartData({
      series: [
        {
          name: "One",
          markerShape: "star",
          fillPattern: "squares",
          strokeWidth: 4,
          dashArray: 6,
          data: [1],
        },
        { name: "Two", markerShape: "bad" as "star", strokeWidth: -1, data: [2] },
      ],
      categories: ["A"],
    });
    const table = chartTable(data, { xLabel: "X", formatX: String, formatValue: String });
    expect(table.head[1]?.attrs).toMatchObject({
      "data-ok-marker-shape": "star",
      "data-ok-fill-pattern": "squares",
      "data-ok-stroke-width": "4",
      "data-ok-dash-array": "6",
    });
    expect(table.head[2]?.attrs["data-ok-marker-shape"]).toBeUndefined();
    expect(table.head[2]?.attrs["data-ok-stroke-width"]).toBeUndefined();
    const element = document.createElement("table");
    element.innerHTML =
      '<thead><tr><th>X</th><th data-ok-marker-shape="star" data-ok-fill-pattern="squares" data-ok-stroke-width="4" data-ok-dash-array="6">One</th></tr></thead><tbody><tr><th>A</th><td>1</td></tr></tbody>';
    expect(readChartTable(element, "category").series[0]).toMatchObject({
      markerShape: "star",
      fillPattern: "squares",
      strokeWidth: 4,
      dashArray: 6,
    });
  });

  it("writes the options", () => {
    expect(
      chartAttributes({
        markerShape: "star",
        fillPattern: "circles",
        strokeWidth: 3,
        colorBlindMode: true,
        fill: "pattern",
      }),
    ).toMatchObject({
      "data-ok-fill": "pattern",
      "data-ok-marker-shape": "star",
      "data-ok-fill-pattern": "circles",
      "data-ok-stroke-width": "3",
      "data-ok-color-blind-mode": "",
    });
    expect(chartAttributes({})["data-ok-marker-shape"]).toBeUndefined();
  });

  it("Sankey charts treat a pattern fill as a gradient", () => {
    const render = renderChart({
      ...base,
      type: "sankey",
      fill: "pattern",
      edges: [{ source: "a", target: "b", value: 1 }],
    });
    expect(find(render.layout.nodes, "data-ok-chart-pattern")).toEqual([]);
  });
});
