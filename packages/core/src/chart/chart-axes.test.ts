import { describe, expect, it } from "vitest";
import { type ChartRenderInput, renderChart } from "./chart.js";
import {
  axisScale,
  chartSeriesAxes,
  chartYAxes,
  chartYAxesText,
  countScale,
  logScale,
  parseChartYAxes,
  scaleValue,
  withChartAxes,
} from "./chart-axes.js";
import type { ChartNode } from "./chart-layout.js";
import { chartData, readChartTable } from "./chart-model.js";
import { chartTextAttributes } from "./chart-text.js";
import { chartPxOf } from "./chart-zoom.js";

/* Value axes (4.18.59): several axes, logarithmic, reversed, tick counts and an x axis title. */

const base = { width: 640, height: 320, idPrefix: "t" };
const MONTHS = ["Jan", "Feb", "Mar", "Apr"];
const TWO: Omit<ChartRenderInput, "width" | "height" | "idPrefix"> = {
  type: "line",
  categories: MONTHS,
  series: [
    { name: "Revenue", type: "bar", data: [100, 240, 180, 320] },
    { name: "Visits", data: [1200, 5400, 800, 3000] },
  ],
};
const draw = (input: Partial<ChartRenderInput> = {}) =>
  renderChart({ ...base, ...TWO, ...input } as ChartRenderInput);

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
const texts = (node: ChartNode | undefined) => (node?.children ?? []).map((child) => child.text);
const ys = (node: ChartNode | undefined) =>
  (node?.children ?? []).map((child) => Number(child.attrs["y"]));

describe("chartYAxes", () => {
  it("validates one axis or a list", () => {
    expect(chartYAxes(undefined)).toEqual([]);
    expect(chartYAxes({ opposite: true })).toEqual([
      {
        seriesName: [],
        opposite: true,
        logarithmic: false,
        logBase: 10,
        reversed: false,
        show: true,
      },
    ]);
    const [axis] = chartYAxes([
      {
        seriesName: ["A", 3 as unknown as string],
        logarithmic: true,
        logBase: 2,
        tickAmount: 4.4,
        min: 1,
        max: "8" as unknown as number,
        title: "  Size ",
        show: false,
      },
    ]);
    expect(axis).toMatchObject({
      seriesName: ["A"],
      logBase: 2,
      tickAmount: 4,
      min: 1,
      max: 8,
      title: "  Size ",
      show: false,
    });
    // Untrusted values fall back.
    const [bad] = chartYAxes([
      null as unknown as object,
      { logBase: 1, tickAmount: 0, min: Number.NaN, title: " " },
    ]);
    expect(bad).toMatchObject({ logBase: 10, show: true });
    const [, second] = chartYAxes([{}, { logBase: 1, tickAmount: 0, min: Number.NaN, title: " " }]);
    expect(second?.tickAmount).toBeUndefined();
    expect(second?.min).toBeUndefined();
    expect(second?.title).toBeUndefined();
    expect(chartYAxes({ seriesName: "Visits" })[0]?.seriesName).toEqual(["Visits"]);
    expect(chartYAxes(Array.from({ length: 20 }, () => ({})))).toHaveLength(10);
  });

  it("round-trips through the attribute text", () => {
    const axes = [
      { min: 0, title: "Revenue; USD" },
      {
        seriesName: "Visits",
        opposite: true,
        logarithmic: true,
        logBase: 2,
        reversed: true,
        tickAmount: 5,
        max: 100,
        show: false,
      },
    ];
    const text = chartYAxesText(axes);
    expect(text).toBe(
      "min 0 title Revenue USD; opposite logarithmic log-base 2 reversed hidden tick-amount 5 max 100",
    );
    const parsed = parseChartYAxes(text);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({ min: 0, title: "Revenue USD" });
    // Series names stay in the table, not in the text.
    expect(parsed[1]).toMatchObject({
      seriesName: [],
      opposite: true,
      logarithmic: true,
      logBase: 2,
      reversed: true,
      tickAmount: 5,
      max: 100,
      show: false,
    });
    expect(chartYAxesText([{}, { opposite: true }])).toBe("; opposite");
    expect(parseChartYAxes("; opposite")).toHaveLength(2);
    expect(chartYAxesText(undefined)).toBe("");
    expect(parseChartYAxes(null)).toEqual([]);
    expect(parseChartYAxes("  ")).toEqual([]);
    expect(parseChartYAxes("x".repeat(2001))).toEqual([]);
    expect(parseChartYAxes("min nope logarithmic log-base 10")[0]).toMatchObject({
      logarithmic: true,
      logBase: 10,
    });
    expect(parseChartYAxes("min nope")[0]?.min).toBeUndefined();
  });

  it("writes the text attribute and the x title", () => {
    expect(chartTextAttributes({ yaxis: [{}, { opposite: true }], xTitle: "Month" })).toEqual({
      "data-ok-yaxis": "; opposite",
      "data-ok-x-title": "Month",
    });
    expect(chartTextAttributes({ yaxis: {} })).toEqual({});
  });
});

describe("series axes", () => {
  const axes = chartYAxes([{}, { seriesName: "B" }, {}]);
  it("follows the series' own axis, then names, then positions", () => {
    expect(
      chartSeriesAxes(
        [
          { name: "A" },
          { name: "B" },
          { name: "C" },
          { name: "D", axis: 2 },
          { name: "E", axis: 7 },
        ],
        axes,
      ),
    ).toEqual([0, 1, 2, 2, 0]);
    // An axis that names a series isn't taken by position.
    expect(chartSeriesAxes([{ name: "X" }, { name: "Y" }], axes)).toEqual([0, 0]);
  });

  it("drops axes on charts with one", () => {
    const data = chartData({ series: [{ name: "A", data: [1], yAxis: 1 }] });
    expect(data.series[0]?.axis).toBe(1);
    expect(withChartAxes(data, []).series[0]?.axis).toBeUndefined();
    const plain = chartData({ series: [{ name: "A", data: [1] }] });
    expect(withChartAxes(plain, [])).toBe(plain);
    expect(withChartAxes(plain, axes).series[0]?.axis).toBe(0);
    expect(chartData({ series: [{ name: "A", data: [1], yAxis: -1 }] }).series[0]?.axis).toBe(
      undefined,
    );
  });
});

describe("scales", () => {
  it("logarithmic: whole powers of the base", () => {
    const scale = logScale(3, 4500, 10);
    expect(scale).toMatchObject({ min: 1, max: 10_000, log: 10 });
    expect(scale.ticks).toEqual([1, 10, 100, 1000, 10_000]);
    expect(logScale(2, 30, 2).ticks).toEqual([2, 4, 8, 16, 32]);
    // One decade still has two ticks; fixed ends are kept; empty data falls back.
    expect(logScale(10, 10, 10).ticks).toEqual([10, 100]);
    expect(logScale(5, 50, 10, { min: 2, max: 500 })).toMatchObject({ min: 2, max: 500 });
    expect(logScale(5, 50, 10, { min: 2, max: 500 }).ticks).toEqual([10, 100]);
    expect(logScale(-1, -1, 10).ticks).toEqual([1, 10]);
    expect(scaleValue(scale, 100, 0, 400)).toBe(200);
    expect(scaleValue(scale, 0, 0, 400)).toBeNaN();
    expect(scaleValue({ min: 0, max: 10, step: 1, ticks: [] }, 5, 0, 100)).toBe(50);
  });

  it("a fixed number of intervals on nice steps", () => {
    expect(countScale(0, 37, 5).ticks).toEqual([0, 10, 20, 30, 40, 50]);
    expect(countScale(0, 100, 4).ticks).toEqual([0, 25, 50, 75, 100]);
    expect(countScale(-3, 7, 2).ticks).toEqual([-10, 0, 10]);
    // Fixed ends divide the range evenly.
    expect(countScale(0, 50, 3, { min: 0, max: 90 }).ticks).toEqual([0, 30, 60, 90]);
    expect(countScale(0, 50, 4, { max: 90 }).ticks).toEqual([0, 22.5, 45, 67.5, 90]);
    expect(countScale(5, 5, 2).ticks).toHaveLength(3);
    expect(countScale(Number.NaN, 1, 2).ticks).toEqual([0, 0.5, 1]);
    expect(countScale(9, 1, 2).min).toBeLessThanOrEqual(1);
    expect(countScale(0, 0, 2).max).toBeGreaterThan(0);
    expect(axisScale(0, 37, 5, undefined, {}).ticks.length).toBeGreaterThan(2);
    expect(axisScale(1, 900, 5, { logarithmic: true, logBase: 10 }, {}).log).toBe(10);
    expect(
      axisScale(0, 37, 5, { logarithmic: false, logBase: 10, tickAmount: 3 }, {}).ticks,
    ).toHaveLength(4);
  });
});

describe("layout", () => {
  it("draws one axis per side, aligned on the primary's grid", () => {
    const { layout } = draw({
      yaxis: [{ title: "Revenue" }, { seriesName: "Visits", opposite: true, title: "Visits" }],
      xTitle: "Month",
    });
    const groups = find(layout.nodes, "data-ok-chart-axis", "y");
    expect(groups.map((g) => g.attrs)).toEqual([
      { "data-ok-chart-axis": "y", "data-ok-index": "0" },
      { "data-ok-chart-axis": "y", "data-ok-index": "1", "data-ok-opposite": "" },
    ]);
    // Same number of ticks on both: labels sit on the grid lines.
    expect(ys(groups[1])).toEqual(ys(groups[0]));
    const grid = find(layout.nodes, "data-ok-chart-grid-line").map((line) =>
      Number(line.attrs["y1"]),
    );
    expect(grid).toEqual(ys(groups[0]));
    expect(texts(groups[1])).toEqual(["0", "2000", "4000", "6000", "8000"]);
    expect(groups[1]?.children?.[0]?.attrs["text-anchor"]).toBe("start");
    const titles = find(layout.nodes, "data-ok-chart-axis-title");
    expect(titles.map((t) => [t.text, t.attrs["transform"]?.split(" ")[0]])).toEqual([
      ["Revenue", "rotate(-90"],
      ["Visits", "rotate(90"],
      ["Month", undefined],
    ]);
    expect(titles[2]?.attrs["data-ok-chart-axis-title"]).toBe("x");
    // The right axis takes room on the right; the x title under the labels.
    expect(layout.plot.x + layout.plot.width).toBeLessThan(640 - 40);
    expect(Number(titles[2]?.attrs["y"])).toBeGreaterThan(layout.plot.y + layout.plot.height + 20);
    // Each series on its own scale: the visits line reaches the top at 6000.
    const visits = layout.marks.filter((mark) => mark.series === 1);
    expect(Math.min(...visits.map((m) => m.py))).toBeGreaterThan(layout.plot.y);
  });

  it("several axes on one side stack outward; titles of inner axes sit beside them", () => {
    const { layout } = renderChart({
      ...base,
      type: "line",
      categories: MONTHS,
      series: [
        { name: "A", data: [1, 2, 3, 4] },
        { name: "B", data: [10, 20, 30, 40] },
        { name: "C", data: [5, 6, 7, 8] },
      ],
      yaxis: [{ title: "A" }, { title: "B" }, { opposite: true }, { opposite: true }],
    });
    const groups = find(layout.nodes, "data-ok-chart-axis", "y");
    // Axis 3 has no series: not drawn.
    expect(groups.map((g) => g.attrs["data-ok-index"])).toEqual(["0", "1", "2"]);
    const x0 = Number(groups[0]?.children?.[0]?.attrs["x"]);
    const x1 = Number(groups[1]?.children?.[0]?.attrs["x"]);
    expect(x1).toBeLessThan(x0);
    // The outermost title at the edge, the inner one beside its own labels.
    const titles = find(layout.nodes, "data-ok-chart-axis-title");
    expect(titles.map((t) => t.text)).toEqual(["A", "B"]);
    expect(Number(titles[0]?.attrs["x"])).toBeGreaterThan(x1);
    expect(Number(titles[0]?.attrs["x"])).toBeLessThan(x0);
    expect(titles[1]?.attrs["x"]).toBe("12");
  });

  it("hidden axes keep their scale; an axis without visible series isn't drawn", () => {
    const hiddenAxis = draw({ yaxis: [{}, { show: false }] });
    expect(find(hiddenAxis.layout.nodes, "data-ok-chart-axis", "y")).toHaveLength(1);
    const legendHidden = draw({ yaxis: [{}, {}], hidden: [0] });
    const groups = find(legendHidden.layout.nodes, "data-ok-chart-axis", "y");
    expect(groups.map((g) => g.attrs["data-ok-index"])).toEqual(["1"]);
    // The first drawn axis gives the grid.
    expect(
      find(legendHidden.layout.nodes, "data-ok-chart-grid-line").map((l) => Number(l.attrs["y1"])),
    ).toEqual(ys(groups[0]));
    // Nothing drawn: one empty axis group stays.
    const none = draw({ yaxis: { show: false } });
    expect(find(none.layout.nodes, "data-ok-chart-axis", "y")).toEqual([
      { tag: "g", attrs: { "data-ok-chart-axis": "y" }, children: [] },
    ]);
    expect(none.layout.plot.x).toBe(8);
  });

  it("logarithmic axes skip values they can't draw and map annotations", () => {
    const { layout } = renderChart({
      ...base,
      type: "bar",
      categories: MONTHS,
      series: [{ name: "Cases", data: [5, 0, 500, 50_000] }],
      yaxis: { logarithmic: true },
      annotations: [
        { axis: "y", y: 1000, label: "Goal" },
        { axis: "y", y: -1 },
      ],
    });
    expect(texts(find(layout.nodes, "data-ok-chart-axis", "y")[0])).toEqual([
      "1",
      "10",
      "100",
      "1000",
      "10000",
      "100000",
    ]);
    expect(layout.marks.map((mark) => mark.index)).toEqual([0, 2, 3]);
    expect(layout.y?.log).toBe(10);
    const line = find(layout.nodes, "data-ok-chart-annotation-line");
    expect(line).toHaveLength(1);
    expect(Number(line[0]?.attrs["y1"])).toBeCloseTo(
      chartPxOf(layout.y as NonNullable<typeof layout.y>, 1000),
      1,
    );
    // Bars grow from the bottom of the scale.
    const bar = find(layout.nodes, "data-ok-chart-bar")[0];
    expect(bar?.attrs["d"]).toContain(`${layout.plot.y + layout.plot.height}`);
  });

  it("log axes don't stack, and keep lines and ranges apart from zero", () => {
    const { layout } = renderChart({
      ...base,
      type: "area",
      stacked: true,
      categories: MONTHS,
      series: [
        { name: "A", data: [1, 10, 100, -5] },
        {
          name: "B",
          type: "rangeArea",
          data: [{ y: [2, 20] }, { y: [0, 5] }, null, { y: [3, 30] }],
        },
      ],
      yaxis: { logarithmic: true, logBase: 10 },
    });
    expect(layout.marks.filter((m) => m.series === 0).map((m) => m.index)).toEqual([0, 1, 2]);
    expect(layout.marks.filter((m) => m.series === 1).map((m) => m.index)).toEqual([0, 3]);
    const empty = renderChart({
      ...base,
      categories: MONTHS,
      series: [{ name: "A", data: [0, -1] }],
      yaxis: { logarithmic: true },
    });
    expect(texts(find(empty.layout.nodes, "data-ok-chart-axis", "y")[0])).toEqual(["1", "10"]);
  });

  it("reversed axes put the highest value at the bottom (or the left)", () => {
    const { layout } = renderChart({
      ...base,
      type: "line",
      categories: MONTHS,
      series: [{ name: "Rank", data: [1, 4, 2, 8] }],
      yaxis: { reversed: true, tickAmount: 4, min: 0 },
    });
    const ticks = find(layout.nodes, "data-ok-chart-axis", "y")[0];
    expect(texts(ticks)).toEqual(["0", "2", "4", "6", "8"]);
    expect(ys(ticks)[0]).toBe(layout.plot.y);
    expect(layout.y?.from).toBe(layout.plot.y);
    const low = layout.marks.find((mark) => mark.value === 1);
    const high = layout.marks.find((mark) => mark.value === 8);
    expect((low?.py as number) < (high?.py as number)).toBe(true);
    const bars = renderChart({
      ...base,
      type: "bar",
      horizontal: true,
      categories: MONTHS,
      series: [{ name: "A", data: [1, 2, 3, 4] }],
      yaxis: { reversed: true, title: "Score" },
      xTitle: "Score",
    });
    const values = bars.layout.marks.map((mark) => mark.px);
    expect(values[3]).toBeLessThan(values[0] as number);
    expect(find(bars.layout.nodes, "data-ok-chart-axis-title")).toHaveLength(2);
  });

  it("tick amounts round to the step's decimals", () => {
    const { layout } = renderChart({
      ...base,
      categories: MONTHS,
      series: [{ name: "A", data: [0, 1, 2, 3] }],
      yaxis: { tickAmount: 3, min: 0, max: 1 },
    });
    expect(texts(find(layout.nodes, "data-ok-chart-axis", "y")[0])).toEqual([
      "0.00",
      "0.33",
      "0.67",
      "1.00",
    ]);
  });

  it("stacks per axis", () => {
    const { layout } = renderChart({
      ...base,
      type: "bar",
      stacked: true,
      categories: MONTHS,
      series: [
        { name: "A", data: [1, 2, 3, 4] },
        { name: "B", data: [1, 2, 3, 4] },
        { name: "C", data: [100, 200, -300, 400] },
      ],
      yaxis: [{ seriesName: ["A", "B"] }, { seriesName: "C", opposite: true }],
    });
    const groups = find(layout.nodes, "data-ok-chart-axis", "y");
    expect(texts(groups[0]).at(-1)).toBe("8");
    expect(texts(groups[1])).toEqual(["-400", "-200", "0", "200", "400"]);
    // Every stack is rounded at its own end.
    const rounded = find(layout.nodes, "data-ok-chart-bar").filter((bar) =>
      bar.attrs["d"]?.includes("A"),
    );
    expect(rounded.length).toBe(8);
  });

  it("the data table carries each series' axis and the x title", () => {
    const render = draw({ yaxis: [{}, { opposite: true }], xTitle: "Month" });
    expect(render.table.head.map((cell) => cell.attrs["data-ok-y-axis"])).toEqual([
      undefined,
      "0",
      "1",
    ]);
    expect(render.table.head[0]?.text).toBe("Month");
    expect(draw({ yaxis: [{}, {}], xTitle: "Month", xLabel: "When" }).table.head[0]?.text).toBe(
      "When",
    );
    const table = document.createElement("table");
    const head = table.createTHead().insertRow();
    for (const [text, axis] of [
      ["Month", null],
      ["Revenue", "0"],
      ["Visits", "1"],
      ["Bad", "x"],
    ] as const) {
      const th = document.createElement("th");
      th.textContent = text;
      if (axis) th.setAttribute("data-ok-y-axis", axis);
      head.append(th);
    }
    const read = readChartTable(table, "category");
    expect(read.series.map((series) => series.yAxis)).toEqual([0, 1, undefined]);
  });

  it("stock charts keep several axes in the price pane", () => {
    const days = Array.from({ length: 20 }, (_, i) =>
      new Date(Date.UTC(2025, 0, 1 + i)).toISOString().slice(0, 10),
    );
    const { layout, data } = renderChart({
      ...base,
      type: "line",
      xType: "datetime",
      categories: days,
      series: [
        { name: "Price", data: days.map((_, i) => 100 + i) },
        { name: "Volume", type: "bar", data: days.map((_, i) => 10_000 + i * 100) },
      ],
      yaxis: [{}, { opposite: true, seriesName: "Volume" }],
      indicators: [
        { type: "sma", period: 3 },
        { type: "rsi", period: 5 },
      ],
      xTitle: "Day",
    });
    expect(data.series.map((s) => s.axis)).toEqual([0, 1, 0, undefined]);
    const panes = find(layout.nodes, "data-ok-chart-pane");
    expect(find(panes[0]?.children ?? [], "data-ok-chart-axis", "y")).toHaveLength(2);
    expect(find(panes[1]?.children ?? [], "data-ok-chart-axis", "y")).toHaveLength(1);
    // Every pane ends at the same right edge (the price's opposite axis).
    const right = (pane: ChartNode | undefined) =>
      find(pane?.children ?? [], "data-ok-chart-grid-line").map((line) => line.attrs["x2"]);
    expect(new Set([...right(panes[0]), ...right(panes[1])]).size).toBe(1);
    // The x title once, under the last pane.
    expect(find(panes[0]?.children ?? [], "data-ok-chart-axis-title", "x")).toHaveLength(0);
    expect(find(panes[1]?.children ?? [], "data-ok-chart-axis-title", "x")).toHaveLength(1);
  });

  it("charts without value axes ignore the options", () => {
    const spark = renderChart({
      ...base,
      sparkline: true,
      categories: MONTHS,
      series: [{ name: "A", data: [1, 2, 3, 4] }],
      yaxis: [{}, { opposite: true }],
      xTitle: "Month",
    });
    expect(find(spark.layout.nodes, "data-ok-chart-axis-title")).toHaveLength(0);
    const pie = renderChart({
      ...base,
      type: "pie",
      categories: MONTHS,
      series: [{ name: "A", data: [1, 2, 3, 4] }],
      yaxis: [{}, { opposite: true }],
    });
    expect(pie.table.head.map((cell) => cell.attrs["data-ok-y-axis"])).toEqual([undefined, "0"]);
  });
});
