import { describe, expect, it } from "vitest";
import { chartAttributes } from "../anatomy/anatomy.js";
import { type ChartRenderInput, renderChart } from "./chart.js";
import type { ChartNode } from "./chart-layout.js";
import { chartTextAttributes, parseChartStripeColors } from "./chart-text.js";

/* Legend and grid options (4.18.64). */

const base = { width: 640, height: 320, idPrefix: "t" };
const LINES: Omit<ChartRenderInput, "width" | "height" | "idPrefix"> = {
  type: "line",
  categories: ["A", "B", "C", "D"],
  series: [
    { name: "One", data: [3, 5, 4, 6] },
    { name: "Two", data: [1, 2, 6, 3] },
  ],
};
const draw = (input: Partial<ChartRenderInput> = {}) =>
  renderChart({ ...base, ...LINES, ...input } as ChartRenderInput);

const gridOf = (input: Partial<ChartRenderInput>) =>
  (draw(input).layout.nodes.find((n) => n.attrs["data-ok-chart-grid"] !== undefined)?.children ??
    []) as ChartNode[];
const lines = (nodes: readonly ChartNode[], vertical: boolean) =>
  nodes.filter(
    (n) =>
      n.attrs["data-ok-chart-grid-line"] !== undefined &&
      (n.attrs["x1"] === n.attrs["x2"]) === vertical,
  );

describe("legend", () => {
  it("shows a single series with showForSingleSeries", () => {
    const one = { series: [{ name: "One", data: [1, 2] }] };
    expect(draw(one).legend).toBeNull();
    expect(draw({ ...one, showForSingleSeries: true }).legend?.map((item) => item.name)).toEqual([
      "One",
    ]);
    expect(draw({ ...one, showForSingleSeries: true, legend: "none" }).legend).toBeNull();
  });

  it("names items from customLegendItems, extra items get the default colors", () => {
    const legend = draw({ customLegendItems: ["First", "Second", "Third"], hidden: [2] }).legend;
    expect(legend?.map((item) => [item.index, item.name, item.color, item.hidden])).toEqual([
      [0, "First", "primary-dark", false],
      [1, "Second", "warning", false],
      [2, "Third", "info", true],
    ]);
    expect(
      draw({ series: [{ name: "One", data: [1] }], customLegendItems: ["Only"] }).legend,
    ).toBeNull();
  });
});

describe("grid", () => {
  it("draws horizontal lines by default, vertical ones on request", () => {
    expect(lines(gridOf({}), true)).toHaveLength(0);
    expect(lines(gridOf({}), false).length).toBeGreaterThan(1);
    expect(gridOf({ grid: "y" })).toEqual(gridOf({}));
    expect(lines(gridOf({ grid: "x" }), true)).toHaveLength(4);
    expect(lines(gridOf({ grid: "x" }), false)).toHaveLength(0);
    expect(lines(gridOf({ grid: "both" }), true)).toHaveLength(4);
    expect(gridOf({ grid: "none" })).toEqual([]);
    // Bars: lines between the bands; numeric axes: through the x ticks.
    expect(lines(gridOf({ type: "bar", grid: "x" }), true)).toHaveLength(5);
    const scatter = renderChart({
      ...base,
      type: "scatter",
      grid: "x",
      series: [
        {
          name: "S",
          data: [
            [1, 2],
            [5, 3],
            [9, 1],
          ],
        },
      ],
    });
    const grid = scatter.layout.nodes.find((n) => n.attrs["data-ok-chart-grid"] !== undefined);
    expect(lines(grid?.children ?? [], true).length).toBeGreaterThan(1);
  });

  it("horizontal bars: lines between categories by default, along the values with x", () => {
    const bars = { type: "bar" as const, horizontal: true };
    expect(lines(gridOf(bars), false)).toHaveLength(5);
    expect(lines(gridOf({ ...bars, grid: "x" }), false)).toHaveLength(0);
    expect(lines(gridOf({ ...bars, grid: "x" }), true).length).toBeGreaterThan(1);
  });

  it("draws stripes in turn under the lines", () => {
    const nodes = gridOf({ gridRowColors: ["grey", "transparent", "info"], gridRowOpacity: 2 });
    const stripes = nodes.filter((n) => n.attrs["data-ok-chart-stripe"] === "row");
    expect(stripes.length).toBeGreaterThan(0);
    expect(nodes[0]?.attrs["data-ok-chart-stripe"]).toBe("row");
    expect(stripes[0]?.attrs["data-ok-color"]).toBeUndefined();
    expect(stripes[0]?.attrs["fill-opacity"]).toBe("1");
    expect(stripes[1]?.attrs["data-ok-color"]).toBe("info");
    const columns = gridOf({ type: "bar", gridColumnColors: ["warning"] }).filter(
      (n) => n.attrs["data-ok-chart-stripe"] === "column",
    );
    expect(columns).toHaveLength(4);
    expect(columns[0]?.attrs["fill-opacity"]).toBe("0.5");
  });

  it("writes and reads the options", () => {
    expect(
      chartAttributes({
        legendAlign: "left",
        showForSingleSeries: true,
        disableLegendToggle: true,
        grid: "both",
        gridRowOpacity: 0.2,
        gridColumnOpacity: 0.3,
      }),
    ).toMatchObject({
      "data-ok-legend-align": "left",
      "data-ok-show-for-single-series": "",
      "data-ok-disable-legend-toggle": "",
      "data-ok-grid": "both",
      "data-ok-grid-row-opacity": "0.2",
      "data-ok-grid-column-opacity": "0.3",
    });
    expect(chartAttributes({})["data-ok-grid"]).toBeUndefined();
    expect(
      chartTextAttributes({
        customLegendItems: ["A; B", "C"],
        gridRowColors: ["grey", "bad" as "grey", "transparent"],
        gridColumnColors: ["info"],
      }),
    ).toEqual({
      "data-ok-custom-legend-items": "A B; C",
      "data-ok-grid-row-colors": "grey transparent",
      "data-ok-grid-column-colors": "info",
    });
    expect(parseChartStripeColors("grey nope transparent error-light")).toEqual([
      "grey",
      "transparent",
      "error-light",
    ]);
    expect(parseChartStripeColors(null)).toEqual([]);
  });
});
