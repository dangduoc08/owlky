import { afterEach, describe, expect, it, vi } from "vitest";
import { chartAttributes, chartOptions } from "../anatomy/anatomy.js";
import { type ChartRenderInput, renderChart } from "./chart.js";
import { chartActiveAt, chartActiveNodes, chartTooltip, nextChartActive } from "./chart-active.js";
import {
  chartAnnotationItems,
  chartAnnotationNodes,
  chartAnnotations,
  readChartAnnotations,
} from "./chart-annotations.js";
import { chartCsv, chartFileName, chartSvgText, exportChart } from "./chart-export.js";
import { createChartGestures } from "./chart-gestures.js";
import type { ChartNode } from "./chart-layout.js";
import { linkChart } from "./chart-link.js";
import { chartData, chartParts, chartTable, readChartTable } from "./chart-model.js";
import {
  CHART_TEXT_ATTRIBUTES,
  chartColorRangesText,
  chartTextAttributes,
  parseChartColorRanges,
} from "./chart-text.js";
import { timeTickLabel, timeTicks, timeUnit, timeValueLabel } from "./chart-time.js";
import { chartToolbar } from "./chart-toolbar.js";
import {
  type ChartZoom,
  chartPxOf,
  chartSelectionNodes,
  chartSelectionPx,
  chartXAt,
  chartZoomBetween,
  chartZoomExtent,
  chartZoomKey,
  clampChartZoom,
  followChartZoom,
  panChart,
  zoomChartBy,
} from "./chart-zoom.js";

/*
 * Phase 4 (ADR-0027, ADR-0031): candlesticks, range bars, timelines, polar areas, zoom, brush,
 * synchronized charts, annotations, export, toolbar, data label formatters and badges, legend
 * values, donut sizes, color ranges, horizontal box plots and localized part labels.
 */

const base = { width: 400, height: 240, idPrefix: "t" };
const draw = (input: Omit<ChartRenderInput, "width" | "height" | "idPrefix">, extra = {}) =>
  renderChart({ ...base, ...input, ...extra });

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

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug"];
const LINE = {
  type: "line" as const,
  categories: MONTHS,
  series: [{ name: "A", data: [1, 4, 2, 8, 5, 7, 3, 6] }],
};

describe("candlestick", () => {
  const candles = {
    type: "candlestick" as const,
    categories: ["Mon", "Tue", "Wed"],
    series: [
      {
        name: "Price",
        data: [{ y: [10, 14, 8, 12] }, { y: [12, 13, 7, 9] }, { y: [9, 9, 9, 9] }],
      },
    ],
  };

  it("keeps open, high, low and close in order; y is the close", () => {
    const data = chartData(candles);
    expect(data.series[0]?.points[1]).toEqual({ x: 1, y: 9, range: [12, 13, 7, 9] });
    expect(chartParts("candlestick")).toEqual(["open", "high", "low", "close"]);
  });

  it("draws wicks and bodies colored by direction; a doji is 1px tall", () => {
    const { layout } = draw(candles);
    const bodies = find(layout.nodes, "data-ok-chart-candle");
    expect(bodies.map((b) => b.attrs["data-ok-chart-candle"])).toEqual(["up", "down", "up"]);
    expect(bodies.map((b) => b.attrs["data-ok-color"])).toEqual(["success", "error", "success"]);
    expect(bodies[2]?.attrs["height"]).toBe("1");
    expect(find(layout.nodes, "data-ok-chart-wick")).toHaveLength(3);
    expect(layout.banded).toBe(true);
    expect(layout.activeRadius).toBe(0);
  });

  it("takes custom colors and lists the four values in the tooltip", () => {
    const render = draw({ ...candles, candleUpColor: "info", candleDownColor: "warning" });
    expect(find(render.layout.nodes, "data-ok-chart-candle")[1]?.attrs["data-ok-color"]).toBe(
      "warning",
    );
    const tip = chartTooltip(render.data, render.layout, render.format, {
      kind: "index",
      index: 0,
    });
    expect(tip?.rows.map((r) => `${r.name} ${r.value}`)).toEqual([
      "Open 10",
      "High 14",
      "Low 8",
      "Close 12",
    ]);
    expect(tip?.rows[0]?.color).toBe("info");
    expect(chartActiveNodes(render.layout, { kind: "index", index: 0 }).over).toEqual([]);
  });

  it("names several candle series in the tooltip and writes four table columns", () => {
    const render = draw({
      ...candles,
      series: [candles.series[0], { ...candles.series[0], name: "B" }] as never,
    });
    const tip = chartTooltip(render.data, render.layout, render.format, {
      kind: "index",
      index: 0,
    });
    expect(tip?.rows[0]?.name).toBe("Price (Open)");
    expect(render.table.parts.map((p) => p.text)).toEqual([
      "Open",
      "High",
      "Low",
      "Close",
      "Open",
      "High",
      "Low",
      "Close",
    ]);
  });

  it("skips incomplete candles", () => {
    const { layout } = draw({
      ...candles,
      series: [{ name: "P", data: [{ y: [1, 2, 3] }, null, { y: [1, 2, 0, 1] }] }],
    });
    expect(find(layout.nodes, "data-ok-chart-candle")).toHaveLength(1);
  });

  it("mixes with a line", () => {
    const render = draw({
      ...candles,
      series: [...candles.series, { name: "Avg", type: "line", data: [11, 10, 9] }],
    });
    expect(find(render.layout.nodes, "data-ok-chart-line")).toHaveLength(1);
    const over = chartActiveNodes(render.layout, { kind: "index", index: 0 }).over;
    expect(over).toHaveLength(1);
  });
});

describe("range bars and timelines", () => {
  it("draws vertical range bars side by side, rounded, with data labels that fit", () => {
    const render = draw(
      {
        type: "rangeBar",
        dataLabels: true,
        dataLabelFormatter: (value) => `${value}`,
        categories: ["A", "B"],
        series: [
          { name: "S1", data: [{ y: [10, 40] }, { y: [60, 20] }] },
          { name: "S2", data: [{ y: [5, 30], color: "error" }, null] },
        ],
      },
      { width: 600 },
    );
    const bars = find(render.layout.nodes, "data-ok-chart-bar");
    expect(bars).toHaveLength(3);
    expect(Number(bars[0]?.attrs["rx"])).toBeGreaterThan(0);
    expect(bars[2]?.attrs["data-ok-color"]).toBe("error");
    expect(render.data.series[0]?.points[1]?.range).toEqual([20, 60]);
    expect(find(render.layout.nodes, "data-ok-chart-data-label").map((n) => n.text)).toContain(
      "30",
    );
    const tip = chartTooltip(render.data, render.layout, render.format, {
      kind: "index",
      index: 0,
    });
    expect(tip?.rows.map((r) => r.value)).toEqual(["10 – 40", "5 – 30"]);
    expect(tip?.rows[1]?.color).toBe("error");
  });

  it("turns range bars and box plots horizontal", () => {
    const range = draw({
      type: "rangeBar",
      horizontal: true,
      categories: ["A"],
      series: [{ name: "S", data: [{ y: [10, 40] }] }],
    });
    expect(range.layout.horizontal).toBe(true);
    expect(range.layout.x).toBeUndefined();
    const box = draw({
      type: "boxPlot",
      horizontal: true,
      categories: ["A", "B"],
      series: [{ name: "S", data: [{ y: [1, 2, 3, 4, 5] }, { y: [2, 3, 4, 5, 6] }] }],
    });
    expect(box.layout.horizontal).toBe(true);
    const [upper] = find(box.layout.nodes, "data-ok-chart-box", "upper");
    // Values run along x: the box is wider than it is tall for a short value span.
    expect(Number(upper?.attrs["width"])).toBeGreaterThan(0);
    const whisker = find(box.layout.nodes, "data-ok-chart-whisker")[0];
    expect(whisker?.attrs["y1"]).toBe(whisker?.attrs["y2"]);
    const mark = box.layout.marks[0];
    expect(mark?.px).toBeGreaterThan(mark?.py ?? 0);
  });

  const timeline = {
    type: "timeline" as const,
    dataLabels: true,
    series: [
      {
        name: "Plan",
        data: [
          { x: "Design", y: ["2026-03-02", "2026-03-13"], color: "info" as const },
          { x: "Build", y: [Date.UTC(2026, 2, 9), new Date(Date.UTC(2026, 3, 3))] },
          { x: "Bad", y: ["nope", "2026-03-01"] },
        ],
      },
    ],
  };

  it("draws horizontal bars on a date axis; values are dates in tooltips and tables", () => {
    const render = draw(timeline, { width: 800 });
    expect(render.layout.horizontal).toBe(true);
    expect(render.data.categories).toEqual(["Design", "Build", "Bad"]);
    expect(find(render.layout.nodes, "data-ok-chart-bar")).toHaveLength(2);
    const ticks = find(render.layout.nodes, "data-ok-chart-tick").map((t) => t.text);
    expect(ticks).toContain("09 Mar");
    expect(render.format.timeUnit).toBe("day");
    const tip = chartTooltip(render.data, render.layout, render.format, {
      kind: "index",
      index: 0,
    });
    expect(tip?.rows[0]?.value).toBe("02 Mar 2026 – 13 Mar 2026");
    expect(render.table.rows[0]?.cells[0]).toEqual({
      text: "02 Mar 2026",
      attrs: { "data-ok-value": "2026-03-02", "data-ok-color": "info" },
    });
    // Labels too long for the bars are left out.
    expect(find(render.layout.nodes, "data-ok-chart-data-label")).toHaveLength(2);
  });

  it("reads timeline tables back (dates in data-ok-value)", () => {
    const render = draw(timeline);
    const table = document.createElement("table");
    const head = table.createTHead();
    const top = head.insertRow();
    for (const cell of render.table.head) {
      const th = document.createElement("th");
      th.textContent = cell.text;
      if (cell.colSpan) th.colSpan = cell.colSpan;
      if (cell.rowSpan) th.rowSpan = cell.rowSpan;
      top.append(th);
    }
    const parts = head.insertRow();
    for (const cell of render.table.parts) {
      const th = document.createElement("th");
      th.textContent = cell.text === "Start" ? "Bắt đầu" : cell.text;
      th.setAttribute("data-ok-part", cell.attrs["data-ok-part"] as string);
      parts.append(th);
    }
    const body = table.createTBody();
    for (const row of render.table.rows) {
      const tr = body.insertRow();
      const th = document.createElement("th");
      th.textContent = row.header.text;
      tr.append(th);
      for (const cell of row.cells) {
        const td = tr.insertCell();
        td.textContent = cell.text;
        for (const [name, value] of Object.entries(cell.attrs)) td.setAttribute(name, value);
      }
    }
    const read = readChartTable(table, "category", "timeline");
    expect(read.partLabels).toEqual({ start: "Bắt đầu", end: "End" });
    const again = chartData({ type: "timeline", ...read });
    expect(again.series[0]?.points[0]?.range).toEqual([
      Date.UTC(2026, 2, 2),
      Date.UTC(2026, 2, 13),
    ]);
    expect(again.series[0]?.points[0]?.color).toBe("info");
  });

  it("time ticks and labels by unit", () => {
    const day = 86_400_000;
    expect(timeUnit(0, 2 * 3_600_000)).toBe("minute");
    expect(timeUnit(0, day)).toBe("hour");
    expect(timeUnit(0, 30 * day)).toBe("day");
    expect(timeUnit(0, 365 * day)).toBe("month");
    expect(timeUnit(0, 3650 * day)).toBe("year");
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const t = Date.UTC(2026, 0, 1);
    expect(timeTickLabel(t, "hour", months)).toEqual({ text: "01 Jan", major: true });
    expect(timeTickLabel(t + 5_400_000, "minute", months).text).toBe("01:30");
    expect(timeTickLabel(t, "day", months)).toEqual({ text: "01 Jan", major: true });
    expect(timeTickLabel(t, "month", months)).toEqual({ text: "2026", major: true });
    expect(timeTickLabel(Date.UTC(2026, 4, 1), "month", months).text).toBe("May '26");
    expect(timeTickLabel(t, "year", months).text).toBe("2026");
    expect(timeValueLabel(t + 5_400_000, "minute", months)).toBe("01 Jan 2026 01:30");
    expect(timeTicks(t, t + 10 * day, 4, "day")).toEqual([t + 4 * day]);
    expect(timeTicks(t, Date.UTC(2026, 11, 31), 5, "month")).toHaveLength(4);
    expect(timeTicks(t, Date.UTC(2040, 0, 1), 3, "year").length).toBeLessThanOrEqual(3);
    expect(timeTicks(t, Date.UTC(2600, 0, 1), 2, "year").length).toBeLessThanOrEqual(3);
    expect(timeTicks(t + 1, t + 2, 4, "minute")).toEqual([]);
  });

  it("an empty or one-day timeline still lays out", () => {
    const empty = draw({ type: "timeline", series: [{ name: "P", data: [] }] });
    expect(empty.format.timeUnit).toBe("day");
    const flat = draw({
      type: "timeline",
      series: [{ name: "P", data: [{ x: "A", y: ["2026-01-01", "2026-01-01"] }] }],
    });
    expect(find(flat.layout.nodes, "data-ok-chart-bar")).toHaveLength(1);
  });
});

describe("polar area", () => {
  const polar = {
    type: "polarArea" as const,
    categories: ["A", "B", "C", "D"],
    series: [{ name: "S", data: [10, 40, 0, 25] }],
  };

  it("draws equal slices sized by value, rings and ticks", () => {
    const render = draw(polar, { dataLabels: true });
    const slices = find(render.layout.nodes, "data-ok-chart-slice");
    expect(slices).toHaveLength(3);
    expect(render.layout.mode).toBe("slice");
    expect(find(render.layout.nodes, "data-ok-chart-web").length).toBeGreaterThan(1);
    expect(find(render.layout.nodes, "data-ok-chart-tick")[0]?.text).toBe("10");
    expect(render.legend).toHaveLength(4);
    const arcs = render.layout.marks.map((m) => m.arc);
    expect(arcs[1]?.outer).toBeGreaterThan(arcs[0]?.outer ?? 0);
    expect((arcs[1]?.end ?? 0) - (arcs[1]?.start ?? 0)).toBe(90);
    expect(find(render.layout.nodes, "data-ok-chart-data-label").length).toBeGreaterThan(0);
  });

  it("hits slices, shows a halo and skips hidden ones", () => {
    const render = draw(polar);
    const mark = render.layout.marks[1];
    const active = chartActiveAt(render.layout, mark?.px ?? 0, mark?.py ?? 0);
    expect(active).toEqual({ kind: "index", index: 1 });
    expect(chartActiveNodes(render.layout, active).under[0]?.attrs).toHaveProperty(
      "data-ok-chart-active-slice",
    );
    const hidden = draw(polar, { hidden: [1] });
    expect(hidden.layout.marks.map((m) => m.index)).toEqual([0, 2, 3]);
  });

  it("all zero values draw nothing", () => {
    const render = draw({ ...polar, series: [{ name: "S", data: [0, 0] }] });
    expect(find(render.layout.nodes, "data-ok-chart-slice")).toEqual([]);
  });
});

describe("donut size, legend values, data labels", () => {
  it("sizes the donut hole within 10–95 %", () => {
    const at = (donutSize?: number) =>
      draw({ type: "donut", categories: ["a"], series: [{ name: "S", data: [1] }], donutSize })
        .layout.marks[0]?.arc;
    const outer = at()?.outer ?? 0;
    expect(at()?.inner).toBeCloseTo(outer * 0.72, 1);
    expect(at(50)?.inner).toBeCloseTo(outer * 0.5, 1);
    expect(at(1)?.inner).toBeCloseTo(outer * 0.1, 1);
    expect(at(100)?.inner).toBeCloseTo(outer * 0.95, 1);
    expect(chartAttributes({ donutSize: 60 })["data-ok-donut-size"]).toBe("60");
    expect(chartAttributes({ donutSize: 2 })["data-ok-donut-size"]).toBeUndefined();
  });

  it("legend items carry values: slices, or the last value of a series", () => {
    const pie = draw({
      type: "pie",
      legendValues: true,
      valueSuffix: " GB",
      categories: ["a", "b"],
      series: [{ name: "S", data: [3, null] }],
    });
    expect(pie.legend?.map((item) => item.value)).toEqual(["3 GB", undefined]);
    const lines = draw({
      legendValues: true,
      series: [
        { name: "A", data: [1, 2, null] },
        { name: "B", data: [null] },
      ],
    });
    expect(lines.legend?.map((item) => item.value)).toEqual(["2", undefined]);
    expect(draw(LINE).legend).toBeNull();
  });

  it("formats data labels (pie labels get the percentage) and puts outside ones on badges", () => {
    const formatter = vi.fn(
      (value: number, series: number, index: number) => `${series}:${index}:${Math.round(value)}`,
    );
    const pie = draw({
      type: "pie",
      dataLabels: true,
      dataLabelFormatter: formatter,
      categories: ["a", "b"],
      series: [{ name: "S", data: [1, 3] }],
    });
    expect(find(pie.layout.nodes, "data-ok-chart-data-label").map((n) => n.text)).toEqual([
      "0:0:25",
      "0:1:75",
    ]);
    const line = draw({ ...LINE, dataLabels: true, dataLabelBackground: true });
    const badges = find(line.layout.nodes, "data-ok-chart-data-label-badge");
    expect(badges).toHaveLength(8);
    const slope = draw(
      {
        type: "slope",
        dataLabelBackground: true,
        categories: ["a", "b"],
        series: [{ name: "S", data: [1, 2] }],
      },
      {},
    );
    const [first, second] = find(slope.layout.nodes, "data-ok-chart-data-label-badge");
    expect(Number(first?.attrs["x"])).toBeLessThan(Number(second?.attrs["x"]));
    // Labels inside bars stay plain.
    const bars = draw({
      type: "bar",
      dataLabels: true,
      dataLabelBackground: true,
      categories: ["a"],
      series: [{ name: "S", data: [50] }],
    });
    expect(find(bars.layout.nodes, "data-ok-chart-data-label-badge")).toEqual([]);
    // A formatter that returns a number is printed as text.
    const odd = draw({ ...LINE, dataLabels: true, dataLabelFormatter: (() => 7) as never });
    expect(find(odd.layout.nodes, "data-ok-chart-data-label")[0]?.text).toBe("7");
  });

  it("formats labels of every layout", () => {
    const f = () => "x";
    const of = (input: Omit<ChartRenderInput, "width" | "height" | "idPrefix">) =>
      find(
        draw({ ...input, dataLabels: true, dataLabelFormatter: f }).layout.nodes,
        "data-ok-chart-data-label",
      ).map((n) => n.text);
    expect(
      of({ type: "radar", categories: ["a", "b", "c"], series: [{ name: "S", data: [1, 2, 3] }] }),
    ).toEqual(["x", "x", "x"]);
    expect(of({ type: "funnel", categories: ["a"], series: [{ name: "S", data: [100] }] })).toEqual(
      ["x"],
    );
    expect(
      of({ type: "heatmap", categories: ["a"], series: [{ name: "S", data: [100] }] }),
    ).toEqual(["x"]);
  });
});

describe("color ranges", () => {
  it("parses, serializes and validates ranges", () => {
    const ranges = parseChartColorRanges("-30 0 info Cold air; 20 0 success; bad; 1 2 nope");
    expect(ranges).toEqual([
      { from: -30, to: 0, color: "info", name: "Cold air" },
      { from: 0, to: 20, color: "success" },
    ]);
    expect(chartColorRangesText(ranges)).toBe("-30 0 info Cold air; 0 20 success");
    expect(chartColorRangesText([{ from: 1, to: 2, color: "x" as never }])).toBe("");
    expect(chartColorRangesText([{ from: 0, to: 1, color: "info", name: "a;b  c" }])).toBe(
      "0 1 info a b c",
    );
    expect(parseChartColorRanges(null)).toEqual([]);
    expect(parseChartColorRanges("1".repeat(2001))).toEqual([]);
  });

  it("paints heatmap and treemap cells in range at full strength", () => {
    const colorRanges = parseChartColorRanges("0 10 info; 11 100 error");
    const heat = draw({
      type: "heatmap",
      colorRanges,
      categories: ["a", "b", "c"],
      series: [{ name: "S", data: [5, 50, 200] }],
    });
    const cells = find(heat.layout.nodes, "data-ok-chart-cell");
    expect(cells.map((c) => c.attrs["data-ok-color"])).toEqual(["info", "error", undefined]);
    expect(cells.map((c) => c.attrs["fill-opacity"])).toEqual(["1", "1", "1"]);
    expect(heat.layout.marks.map((m) => m.color)).toEqual(["info", "error", "primary-dark"]);
    const tree = draw({
      type: "treemap",
      colorRanges,
      categories: ["a", "b"],
      series: [{ name: "S", data: [5, 50] }],
    });
    expect(
      find(tree.layout.nodes, "data-ok-chart-cell")
        .map((c) => c.attrs["data-ok-color"])
        .sort(),
    ).toEqual(["error", "info"]);
  });
});

describe("text attributes", () => {
  it("writes only the texts given, color ranges as text", () => {
    expect(
      chartTextAttributes({
        yTitle: "Y",
        group: "g",
        brushTarget: "",
        colorRanges: [{ from: 0, to: 1, color: "info" }],
      }),
    ).toEqual({
      [CHART_TEXT_ATTRIBUTES.yTitle]: "Y",
      [CHART_TEXT_ATTRIBUTES.group]: "g",
      [CHART_TEXT_ATTRIBUTES.colorRanges]: "0 1 info",
    });
    expect(chartTextAttributes({ colorRanges: [] })).toEqual({});
  });
});

describe("localized part labels", () => {
  it("labels tables and tooltips", () => {
    const render = draw({
      type: "bubble",
      partLabels: { y: "Giá trị", z: "Cỡ" },
      series: [{ name: "S", data: [[1, 2, 3]] }],
    });
    expect(render.table.parts.map((p) => p.text)).toEqual(["Giá trị", "Cỡ"]);
    const tip = chartTooltip(render.data, render.layout, render.format, { kind: "mark", mark: 0 });
    expect(tip?.rows[1]?.name).toBe("Cỡ");
    const box = draw({
      type: "boxPlot",
      partLabels: { median: "Trung vị" },
      categories: ["a"],
      series: [{ name: "S", data: [{ y: [1, 2, 3, 4, 5] }] }],
    });
    const rows = chartTooltip(box.data, box.layout, box.format, { kind: "index", index: 0 })?.rows;
    expect(rows?.[2]?.name).toBe("Trung vị");
    expect(
      chartTable(box.data, {
        xLabel: "x",
        formatX: String,
        formatValue: String,
        partLabels: { min: "Min" },
      }).parts[0]?.text,
    ).toBe("Min");
  });
});

describe("zoom math", () => {
  const extent = { min: 0, max: 9 };

  it("finds the x extent of the data", () => {
    expect(chartZoomExtent(chartData(LINE))).toEqual({ min: 0, max: 7 });
    expect(chartZoomExtent(chartData({ series: [{ name: "a", data: [1] }] }))).toBeNull();
    expect(
      chartZoomExtent(
        chartData({
          type: "scatter",
          series: [
            {
              name: "a",
              data: [
                [2, 1],
                [5, 1],
              ],
            },
          ],
        }),
      ),
    ).toEqual({ min: 2, max: 5 });
    expect(
      chartZoomExtent(chartData({ type: "scatter", series: [{ name: "a", data: [[2, 1]] }] })),
    ).toBeNull();
  });

  it("clamps ranges: whole categories, at least two, inside the axis, whole axis → null", () => {
    expect(clampChartZoom({ min: 2.4, max: 5.6 }, extent, "index")).toEqual({ min: 2, max: 6 });
    expect(clampChartZoom({ min: 6, max: 3 }, extent, "index")).toEqual({ min: 3, max: 6 });
    expect(clampChartZoom({ min: 4, max: 4 }, extent, "index")).toEqual({ min: 4, max: 5 });
    expect(clampChartZoom({ min: -3, max: 2 }, extent, "index")).toEqual({ min: 0, max: 5 });
    expect(clampChartZoom({ min: 7, max: 12 }, extent, "index")).toEqual({ min: 4, max: 9 });
    expect(clampChartZoom({ min: -1, max: 20 }, extent, "index")).toBeNull();
    expect(clampChartZoom(null, extent, "index")).toBeNull();
    expect(clampChartZoom({ min: 1, max: 2 }, null, "index")).toBeNull();
    expect(clampChartZoom({ min: Number.NaN, max: 2 }, extent, "index")).toBeNull();
    expect(clampChartZoom({ min: 1, max: 1 }, { min: 0, max: 10 }, "value")).toEqual({
      min: 1,
      max: 1.01,
    });
    expect(clampChartZoom({ min: 1.234, max: 4.567 }, { min: 0, max: 10 }, "value")).toEqual({
      min: 1.23,
      max: 4.57,
    });
  });

  it("zooms around a center, pans, follows live data", () => {
    expect(zoomChartBy(null, extent, "index", 0.5)).toEqual({ min: 2, max: 7 });
    expect(zoomChartBy({ min: 2, max: 6 }, extent, "index", 2, 2)).toEqual({ min: 1, max: 9 });
    expect(zoomChartBy({ min: 2, max: 6 }, extent, "index", 4)).toBeNull();
    expect(zoomChartBy(null, null, "index", 0.5)).toBeNull();
    expect(zoomChartBy({ min: 3, max: 3 } as ChartZoom, extent, "index", 0.5)).toEqual({
      min: 3,
      max: 4,
    });
    expect(panChart({ min: 2, max: 4 }, extent, "index", 3)).toEqual({ min: 5, max: 7 });
    expect(panChart(null, extent, "index", 3)).toBeNull();
    expect(panChart({ min: 2, max: 4 }, null, "index", 3)).toEqual({ min: 2, max: 4 });
    // A range at the end follows the end; others keep their place.
    expect(followChartZoom({ min: 6, max: 9 }, extent, { min: 0, max: 12 }, "index")).toEqual({
      min: 9,
      max: 12,
    });
    expect(followChartZoom({ min: 2, max: 5 }, extent, { min: 0, max: 12 }, "index")).toEqual({
      min: 2,
      max: 5,
    });
    expect(followChartZoom({ min: 2, max: 5 }, null, extent, "index")).toEqual({ min: 2, max: 5 });
    expect(followChartZoom(null, extent, extent, "index")).toBeNull();
    expect(followChartZoom({ min: 1, max: 2 }, extent, null, "index")).toBeNull();
  });

  it("maps keys", () => {
    expect(chartZoomKey("+", false, null, extent, "index")).toEqual({ min: 2, max: 7 });
    expect(chartZoomKey("=", false, null, extent, "index")).toEqual({ min: 2, max: 7 });
    expect(chartZoomKey("-", false, { min: 2, max: 4 }, extent, "index")).toEqual({
      min: 1,
      max: 5,
    });
    expect(chartZoomKey("_", false, { min: 2, max: 4 }, extent, "index")).toEqual({
      min: 1,
      max: 5,
    });
    expect(chartZoomKey("0", false, { min: 2, max: 4 }, extent, "index")).toBeNull();
    expect(chartZoomKey("ArrowRight", true, { min: 2, max: 4 }, extent, "index")).toEqual({
      min: 3,
      max: 5,
    });
    expect(
      chartZoomKey("ArrowLeft", true, { min: 2, max: 4 }, { min: 0, max: 40 }, "value"),
    ).toEqual({ min: 1.8, max: 3.8 });
    expect(chartZoomKey("ArrowLeft", true, null, null, "index")).toBeNull();
    expect(chartZoomKey("ArrowLeft", false, null, extent, "index")).toBeUndefined();
    expect(chartZoomKey("a", false, null, extent, "index")).toBeUndefined();
  });

  it("maps px and x on axis maps", () => {
    const map = { kind: "index" as const, min: 0, max: 4, from: 100, to: 500 };
    expect(chartXAt(map, 300)).toBe(2);
    expect(chartPxOf(map, 1)).toBe(200);
    expect(chartXAt({ ...map, to: 100 }, 300)).toBe(0);
    expect(chartPxOf({ ...map, max: 0 }, 3)).toBe(100);
  });
});

describe("zoomed layouts", () => {
  it("draws the window of categories and keeps the value scale", () => {
    const whole = draw(LINE);
    const zoomed = draw(LINE, { zoom: { min: 2, max: 5 } });
    expect(zoomed.zoom).toEqual({ min: 2, max: 5 });
    expect(zoomed.zoomable).toBe(true);
    expect(zoomed.layout.slots.map((s) => s.index)).toEqual([2, 3, 4, 5]);
    expect(zoomed.layout.marks.map((m) => m.index)).toEqual([2, 3, 4, 5]);
    expect(find(zoomed.layout.nodes, "data-ok-chart-tick").map((t) => t.text)).toEqual(
      expect.arrayContaining(["Mar", "Jun"]),
    );
    expect(find(zoomed.layout.nodes, "data-ok-chart-tick").map((t) => t.text)).not.toContain("Jan");
    expect(zoomed.layout.y).toEqual(whole.layout.y);
    expect(zoomed.layout.x).toMatchObject({ kind: "index", min: 2, max: 5 });
    // Keyboard navigation stays in the window.
    expect(nextChartActive(zoomed.layout, null, "Home")).toEqual({ kind: "index", index: 2 });
    // An active category outside the window has no tooltip.
    expect(
      chartTooltip(zoomed.data, zoomed.layout, zoomed.format, { kind: "index", index: 0 }),
    ).toBeNull();
  });

  it("zooms bars and numeric axes", () => {
    const bars = draw({ ...LINE, type: "bar" }, { zoom: { min: 0, max: 1 } });
    expect(find(bars.layout.nodes, "data-ok-chart-bar")).toHaveLength(2);
    expect(bars.layout.x?.band).toBeGreaterThan(0);
    const scatter = draw(
      {
        type: "scatter",
        series: [
          {
            name: "S",
            data: [
              [1, 1],
              [5, 2],
              [9, 3],
            ],
          },
        ],
      },
      { zoom: { min: 4, max: 6 } },
    );
    expect(scatter.layout.marks).toHaveLength(1);
    expect(scatter.layout.x).toMatchObject({ kind: "value", min: 4, max: 6 });
    const spark = draw({ ...LINE, sparkline: true }, { zoom: { min: 1, max: 3 } });
    expect(spark.layout.marks).toHaveLength(3);
    expect(spark.zoomable).toBe(false);
    const sparkScatter = draw(
      {
        type: "scatter",
        sparkline: true,
        series: [
          {
            name: "S",
            data: [
              [1, 1],
              [5, 2],
            ],
          },
        ],
      },
      { zoom: { min: 1, max: 3 } },
    );
    expect(sparkScatter.layout.marks).toHaveLength(1);
  });

  it("follows the end with zoomFrom", () => {
    const render = draw(LINE, { zoom: { min: 3, max: 5 }, zoomFrom: { min: 0, max: 5 } });
    expect(render.zoom).toEqual({ min: 5, max: 7 });
  });

  it("charts without an x axis don't zoom", () => {
    const pie = draw(
      { type: "pie", categories: ["a", "b"], series: [{ name: "S", data: [1, 2] }] },
      { zoom: { min: 0, max: 0 } },
    );
    expect(pie.zoomable).toBe(false);
    expect(pie.zoom).toBeNull();
    const bar = draw({ ...LINE, type: "bar", horizontal: true }, { zoom: { min: 1, max: 2 } });
    expect(bar.layout.slots).toHaveLength(8);
  });

  it("draws a brush selection with handles, or a drag selection without", () => {
    const brush = draw(LINE, { brush: true });
    const [group] = find(brush.layout.nodes, "data-ok-chart-brush");
    expect(find([group as ChartNode], "data-ok-chart-handle")).toHaveLength(2);
    const sel = find(brush.layout.nodes, "data-ok-chart-selection")[0];
    expect(Number(sel?.attrs["x"])).toBeCloseTo(brush.layout.plot.x, 0);
    const drag = draw(LINE, { selection: { min: 2, max: 4 } });
    expect(find(drag.layout.nodes, "data-ok-chart-handle")).toEqual([]);
    expect(find(drag.layout.nodes, "data-ok-chart-selection")).toHaveLength(1);
    expect(draw(LINE, { selection: { min: -5, max: 50 } }).layout.nodes).toEqual(
      draw(LINE).layout.nodes,
    );
    // The selection sits before the active group.
    const names = brush.layout.nodes.map((n) => Object.keys(n.attrs)[0]);
    expect(names.indexOf("data-ok-chart-brush")).toBe(names.indexOf("data-ok-chart-active") - 1);
    expect(
      chartSelectionNodes({ ...brush.layout, x: undefined }, { min: 0, max: 1 }, true),
    ).toEqual([]);
    expect(chartSelectionPx({ ...brush.layout, x: undefined }, { min: 0, max: 1 })).toBeNull();
    const bars = draw({ ...LINE, type: "bar" }, { brush: true, selection: { min: 1, max: 2 } });
    const px = chartSelectionPx(bars.layout, { min: 1, max: 2 }) as [number, number];
    expect(px[1] - px[0]).toBeCloseTo((bars.layout.x?.band ?? 0) * 2, 0);
  });

  it("finds the range between two drag positions", () => {
    const render = draw(LINE);
    const { from, to } = render.layout.x as { from: number; to: number };
    expect(
      chartZoomBetween(render.layout, render.extent, to, from + (to - from) * (2 / 7)),
    ).toEqual({
      min: 2,
      max: 7,
    });
    expect(chartZoomBetween({ ...render.layout, x: undefined }, render.extent, 0, 1)).toBeNull();
  });
});

describe("annotations", () => {
  it("validates annotations and round-trips the list", () => {
    const list = chartAnnotations([
      { axis: "x", x: "Mar", label: "Deploy", color: "warning", y: 3 },
      { axis: "x", x: new Date(Date.UTC(2026, 0, 2)), x2: 4 },
      { axis: "y", y: 4, y2: "6" as never, label: "Band", x: "Jan" },
      { axis: "point", x: 2, y: 5, color: "nope" as never },
      { axis: "point", x: 2 } as never,
      { axis: "x" } as never,
      { axis: "z" } as never,
      null as never,
      { axis: "x", x: new Date(Number.NaN) },
    ]);
    expect(list).toEqual([
      { axis: "x", x: "Mar", label: "Deploy", color: "warning" },
      { axis: "x", x: "2026-01-02T00:00:00.000Z", x2: "4" },
      { axis: "y", y: 4, y2: 6, label: "Band" },
      { axis: "point", x: "2", y: 5 },
    ]);
    const items = chartAnnotationItems(list);
    expect(items[0]).toEqual({
      attrs: { "data-ok-annotation": "x", "data-ok-x": "Mar", "data-ok-color": "warning" },
      text: "Deploy",
    });
    const ul = document.createElement("ul");
    for (const item of items) {
      const li = document.createElement("li");
      for (const [name, value] of Object.entries(item.attrs)) li.setAttribute(name, value);
      li.textContent = item.text;
      ul.append(li);
    }
    expect(readChartAnnotations(ul)).toEqual(list);
    expect(readChartAnnotations(null)).toEqual([]);
    expect(chartAnnotations(undefined)).toEqual([]);
  });

  it("draws lines, bands, points and labels inside the plot", () => {
    const render = draw(
      {
        ...LINE,
        annotations: [
          { axis: "x", x: "Mar", label: "Deploy" },
          { axis: "x", x: "Aug", label: "At the right edge with a long label" },
          { axis: "x", x: 1, x2: "Apr", label: "Band", color: "error" },
          { axis: "x", x: "Mar", x2: "Mar" },
          { axis: "y", y: 4, label: "Line" },
          { axis: "y", y: 2, y2: 6, label: "Band" },
          { axis: "y", y: 1000 },
          { axis: "y", y: 1000, y2: 2000 },
          { axis: "point", x: "Apr", y: 8, label: "Peak" },
          { axis: "point", x: "Nope", y: 8 },
          { axis: "x", x: "Nope" },
        ],
      },
      { dataLabels: true },
    );
    const groups = find(render.layout.nodes, "data-ok-chart-annotation");
    expect(groups.map((g) => g.attrs["data-ok-chart-annotation"])).toEqual([
      "x",
      "x",
      "x",
      "y",
      "y",
      "point",
    ]);
    expect(groups[2]?.attrs["data-ok-color"]).toBe("error");
    expect(groups[0]?.attrs["data-ok-color"]).toBe("info");
    for (const tag of find(render.layout.nodes, "data-ok-chart-annotation-tag")) {
      expect(Number(tag.attrs["x"])).toBeGreaterThanOrEqual(0);
      expect(Number(tag.attrs["x"]) + Number(tag.attrs["width"])).toBeLessThanOrEqual(
        render.layout.width,
      );
    }
    const labels = find(render.layout.nodes, "data-ok-chart-annotation-label").map((n) => n.text);
    expect(labels).toContain("Peak");
    // Annotations sit before the data labels.
    const names = render.layout.nodes.map((n) => Object.keys(n.attrs)[0]);
    expect(names.indexOf("data-ok-chart-annotation-layer")).toBe(
      names.indexOf("data-ok-chart-data-labels") - 1,
    );
  });

  it("places dates between categories and numbers on numeric axes", () => {
    const dates = chartData({
      xType: "datetime",
      categories: ["2026-01-01", "2026-01-03"],
      series: [{ name: "S", data: [1, 2] }],
    });
    const layout = draw({
      xType: "datetime",
      categories: ["2026-01-01", "2026-01-03"],
      series: [{ name: "S", data: [1, 2] }],
    }).layout;
    const [line] = find(
      chartAnnotationNodes(dates, layout, [{ axis: "x", x: "2026-01-02" }]),
      "data-ok-chart-annotation-line",
    );
    expect(Number(line?.attrs["x1"])).toBeCloseTo(
      ((layout.x?.from ?? 0) + (layout.x?.to ?? 0)) / 2,
      0,
    );
    expect(chartAnnotationNodes(dates, layout, [{ axis: "x", x: "2025-01-01" }])).toEqual([]);
    expect(chartAnnotationNodes(dates, layout, [{ axis: "x", x: "2027-01-01" }])).toEqual([]);
    expect(chartAnnotationNodes(dates, layout, [{ axis: "x", x: "bad" }])).toEqual([]);
    const flat = chartData({
      xType: "datetime",
      categories: ["2026-01-01", "2026-01-01"],
      series: [],
    });
    expect(chartAnnotationNodes(flat, layout, [{ axis: "x", x: "2026-01-01" }])).toHaveLength(1);
    const none = chartData({ xType: "datetime", categories: [], series: [] });
    expect(chartAnnotationNodes(none, layout, [{ axis: "x", x: "2026-01-01" }])).toEqual([]);
    const scatter = draw({
      type: "scatter",
      series: [
        {
          name: "S",
          data: [
            [0, 1],
            [10, 5],
          ],
        },
      ],
      annotations: [
        { axis: "point", x: 5, y: 3, label: "Mid" },
        { axis: "x", x: "bad" },
      ],
    });
    expect(find(scatter.layout.nodes, "data-ok-chart-annotation-marker")).toHaveLength(1);
    // Charts without an x axis draw no annotations.
    const pie = draw({
      type: "pie",
      categories: ["a"],
      series: [{ name: "S", data: [1] }],
      annotations: [{ axis: "y", y: 1 }],
    });
    expect(find(pie.layout.nodes, "data-ok-chart-annotation-layer")).toEqual([]);
    // Without data labels, annotations go before the active group.
    const plain = draw({ ...LINE, annotations: [{ axis: "y", y: 3 }] });
    const names = plain.layout.nodes.map((n) => Object.keys(n.attrs)[0]);
    expect(names.indexOf("data-ok-chart-annotation-layer")).toBe(
      names.indexOf("data-ok-chart-active") - 1,
    );
  });
});

describe("toolbar", () => {
  it("lists zoom tools (with zoom) and downloads, localized", () => {
    const tools = chartToolbar({
      zoom: true,
      zoomed: false,
      pan: true,
      text: { zoomIn: "Phóng to" },
    });
    expect(tools.map((t) => t.tool)).toEqual([
      "zoomIn",
      "zoomOut",
      "reset",
      "pan",
      "svg",
      "png",
      "csv",
    ]);
    expect(tools[0]?.label).toBe("Phóng to");
    expect(tools[1]?.disabled).toBe(true);
    expect(tools[3]?.pressed).toBe(true);
    expect(tools[4]?.text).toBe("SVG");
    expect(tools[0]?.icon?.tag).toBe("svg");
    expect(chartToolbar({ zoom: false, zoomed: false, pan: false }).map((t) => t.tool)).toEqual([
      "svg",
      "png",
      "csv",
    ]);
  });
});

describe("option schema", () => {
  it("writes phase 4 options", () => {
    expect(
      chartAttributes({
        type: "candlestick",
        candleUpColor: "info",
        candleDownColor: "nope" as never,
        zoom: true,
        toolbar: true,
        animations: true,
        legendValues: true,
        dataLabelBackground: true,
      }),
    ).toMatchObject({
      "data-ok-type": "candlestick",
      "data-ok-candle-up-color": "info",
      "data-ok-zoom": "",
      "data-ok-toolbar": "",
      "data-ok-animations": "",
      "data-ok-legend-values": "",
      "data-ok-data-label-background": "",
    });
    expect(chartAttributes({ candleDownColor: "nope" as never })).not.toHaveProperty(
      "data-ok-candle-down-color",
    );
    expect(chartOptions.options.zoomRange.event).toBe("zoom");
  });
});

describe("linked charts", () => {
  const member = (extra: Partial<Parameters<typeof linkChart>[0]> = {}) => {
    const state = {
      zoom: null as ChartZoom | null,
      shown: [] as (number | null)[],
      applied: [] as unknown[],
      selected: [] as unknown[],
    };
    const link = linkChart({
      zoom: () => state.zoom,
      showIndex: (index) => state.shown.push(index),
      applyZoom: (range, reason) => {
        state.zoom = range;
        state.applied.push([range, reason]);
      },
      select: (range) => state.selected.push(range),
      ...extra,
    });
    return { state, link };
  };

  it("shares the active category and zoom within a group", () => {
    const a = member({ group: "g", id: "a" });
    const b = member({ group: "g" });
    const c = member({ group: "other" });
    a.link.shown(3);
    expect(b.state.shown).toEqual([3]);
    expect(c.state.shown).toEqual([]);
    a.link.zoomed({ min: 1, max: 2 });
    expect(b.state.applied).toEqual([[{ min: 1, max: 2 }, "group"]]);
    expect(a.state.applied).toEqual([]);
    for (const m of [a, b, c]) m.link.unlink();
    const lone = member();
    lone.link.shown(1);
    lone.link.zoomed(null);
    lone.link.unlink();
  });

  it("brushes zoom their target (and its group); targets update their brushes", () => {
    const target = member({ id: "t", group: "g2" });
    target.state.zoom = { min: 1, max: 3 };
    const mate = member({ group: "g2" });
    const brush = member({ brushTarget: "t" });
    expect(brush.state.selected).toEqual([{ min: 1, max: 3 }]);
    brush.link.brush({ min: 2, max: 4 });
    expect(target.state.applied).toEqual([[{ min: 2, max: 4 }, "brush"]]);
    expect(mate.state.applied).toEqual([[{ min: 2, max: 4 }, "group"]]);
    expect(brush.state.selected.at(-1)).toEqual({ min: 2, max: 4 });
    target.link.zoomed(null);
    expect(brush.state.selected.at(-1)).toBeNull();
    target.link.drawn({ min: 5, max: 6 });
    expect(brush.state.selected.at(-1)).toEqual({ min: 5, max: 6 });
    mate.link.zoomed({ min: 0, max: 1 });
    expect(brush.state.selected.at(-1)).toEqual({ min: 0, max: 1 });
    target.link.unlink();
    // Without a target, a brush only keeps its own selection.
    brush.link.brush({ min: 0, max: 1 });
    expect(target.state.applied).toHaveLength(2);
    const late = member({ id: "t" });
    expect(brush.state.selected.at(-1)).toBeNull();
    const orphan = member({ brushTarget: "missing" });
    expect(orphan.state.selected).toEqual([null]);
    const plain = member();
    plain.link.drawn(null);
    for (const m of [mate, brush, late, orphan, plain]) m.link.unlink();
  });
});

describe("export", () => {
  const figure = () => {
    const root = document.createElement("figure");
    root.innerHTML = `<div data-ok-chart-plot><svg data-ok-chart-svg aria-hidden="true" viewBox="0 0 300 150"><g><rect width="10" height="10" style="fill: rgb(255, 0, 0)"></rect></g></svg></div>
      <table data-ok-chart-data><caption>Monthly sales: 2026!</caption>
        <thead><tr><th rowspan="2">Month</th><th colspan="2">Scores</th><th rowspan="2">Note</th></tr><tr><th>Q1</th><th>Q3</th></tr></thead>
        <tbody><tr><th>Jan</th><td data-ok-value="1200">1,200</td><td>-5</td><td>=SUM(A1)</td></tr><tr><th>"Feb"</th><td>a,b</td><td></td><td>+1x</td></tr></tbody>
      </table>`;
    root.style.setProperty("--ok-bg-paper", "#112233");
    document.body.append(root);
    return root;
  };
  afterEach(() => {
    document.body.replaceChildren();
    vi.restoreAllMocks();
  });

  it("names files", () => {
    expect(chartFileName("Monthly sales: 2026!")).toBe("monthly-sales-2026");
    expect(chartFileName("Ứng dụng")).toBe("ung-dung");
    expect(chartFileName("!!!")).toBe("chart");
  });

  it("writes CSV with combined headers, raw values and formula guards", () => {
    const table = figure().querySelector("table") as HTMLTableElement;
    expect(chartCsv(table).split("\r\n")).toEqual([
      "Month,Scores (Q1),Scores (Q3),Note",
      "Jan,1200,-5,'=SUM(A1)",
      '"""Feb""","a,b",,\'+1x',
    ]);
    const plain = document.createElement("table");
    plain.innerHTML = "<tr><th>X</th></tr><tr><td>1</td></tr>";
    expect(chartCsv(plain)).toBe("X\r\n1");
  });

  it("inlines paints into the SVG and adds the paper background", () => {
    const text = chartSvgText(figure());
    expect(text).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(text).toContain('width="300"');
    expect(text).toMatch(/fill="rgb\(255, 0, 0\)"/);
    expect(text).toMatch(/<rect width="100%" height="100%" fill="#112233"/);
    expect(text).not.toContain("aria-hidden");
    expect(() => chartSvgText(document.createElement("figure"))).toThrow();
  });

  it("downloads only during a user gesture", async () => {
    const root = figure();
    const activation = { isActive: false };
    vi.spyOn(navigator, "userActivation", "get").mockReturnValue(activation as UserActivation);
    await expect(exportChart(root, "csv")).rejects.toThrow(/gesture/);
    activation.isActive = true;
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    const clicks: string[] = [];
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicks.push(this.download);
    });
    await exportChart(root, "csv");
    await exportChart(root, "svg");
    await exportChart(root, "png");
    // The download URLs are revoked a second later.
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    vi.runAllTimers();
    vi.useRealTimers();
    expect(revoke).toHaveBeenCalledTimes(3);
    expect(clicks).toEqual([
      "monthly-sales-2026.csv",
      "monthly-sales-2026.svg",
      "monthly-sales-2026.png",
    ]);
    expect(document.querySelector("a")).toBeNull();
    await expect(exportChart(root, "gif" as never)).rejects.toThrow(TypeError);
    await expect(exportChart(document.createElement("figure"), "csv")).rejects.toThrow(/table/);
  });

  it("reports a PNG the browser can't make", async () => {
    const root = figure();
    vi.spyOn(navigator, "userActivation", "get").mockReturnValue({
      isActive: true,
    } as UserActivation);
    const context = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    await expect(exportChart(root, "png")).rejects.toThrow(/canvas/);
    context.mockRestore();
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) =>
      callback(null),
    );
    await expect(exportChart(root, "png")).rejects.toThrow(/PNG/);
  });

  it("works without the user activation API", async () => {
    const root = figure();
    vi.spyOn(navigator, "userActivation", "get").mockReturnValue(undefined as never);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    await expect(exportChart(root, "csv")).resolves.toBeUndefined();
  });
});

describe("gestures", () => {
  const setup = (mode: "zoom" | "pan" | "brush" | "none", range: ChartZoom | null = null) => {
    const plot = document.createElement("div");
    plot.style.width = "400px";
    plot.style.height = "240px";
    document.body.append(plot);
    const render = draw(LINE);
    const state = {
      range,
      previews: [] as (ChartZoom | null)[],
      commits: [] as (ChartZoom | null)[],
    };
    const gestures = createChartGestures(plot, {
      layout: () => render.layout,
      mode: () => mode,
      range: () => state.range,
      extent: () => render.extent,
      preview: (r) => state.previews.push(r),
      commit: (r) => {
        state.commits.push(r);
        state.range = r;
      },
    });
    const box = plot.getBoundingClientRect();
    const map = render.layout.x as { from: number; to: number };
    /** Client x of category `i`. */
    const at = (i: number) => box.left + map.from + ((map.to - map.from) * i) / 7;
    const fire = (type: string, x: number, init: PointerEventInit = {}) =>
      plot.dispatchEvent(
        new PointerEvent(type, {
          clientX: x,
          clientY: box.top + 100,
          bubbles: true,
          pointerId: 1,
          pointerType: "mouse",
          button: 0,
          ...init,
        }),
      );
    return { plot, state, gestures, at, fire, render };
  };
  afterEach(() => document.body.replaceChildren());

  it("a mouse drag previews then zooms; a click does nothing", () => {
    const { state, gestures, at, fire } = setup("zoom");
    fire("pointerdown", at(2));
    fire("pointermove", at(2) + 1);
    expect(gestures.dragging).toBe(false);
    fire("pointermove", at(5));
    expect(gestures.dragging).toBe(true);
    expect(state.previews.at(-1)).toEqual({ min: 2, max: 5 });
    fire("pointerup", at(5));
    expect(state.previews.at(-1)).toBeNull();
    expect(state.commits).toEqual([{ min: 2, max: 5 }]);
    fire("pointerdown", at(1));
    fire("pointerup", at(1));
    expect(state.commits).toHaveLength(1);
    fire("pointermove", at(3));
    fire("pointerup", at(3));
    gestures.destroy();
  });

  it("right clicks, mode none and a cancel do nothing", () => {
    const zoom = setup("zoom");
    zoom.fire("pointerdown", zoom.at(1), { button: 2 });
    zoom.fire("pointermove", zoom.at(4));
    zoom.fire("pointerdown", zoom.at(1));
    zoom.fire("pointermove", zoom.at(4));
    zoom.fire("pointercancel", zoom.at(4));
    expect(zoom.state.previews.at(-1)).toBeNull();
    zoom.fire("pointercancel", zoom.at(4));
    zoom.fire("pointerdown", zoom.at(1));
    zoom.fire("pointercancel", zoom.at(1));
    expect(zoom.state.commits).toEqual([]);
    const none = setup("none");
    none.fire("pointerdown", none.at(1));
    none.fire("pointermove", none.at(4));
    expect(none.state.previews).toEqual([]);
  });

  it("touch drags pan a zoomed chart; two fingers pinch", () => {
    const { state, at, fire } = setup("zoom", { min: 2, max: 5 });
    fire("pointerdown", at(3), { pointerType: "touch" });
    fire("pointermove", at(2), { pointerType: "touch" });
    expect(state.commits.at(-1)).toEqual({ min: 3, max: 6 });
    fire("pointerup", at(2), { pointerType: "touch" });
    // Pinch: two pointers moving apart zoom in.
    state.range = { min: 1, max: 7 };
    fire("pointerdown", at(3), { pointerType: "touch", pointerId: 1 });
    fire("pointerdown", at(5), { pointerType: "touch", pointerId: 2 });
    fire("pointermove", at(6), { pointerType: "touch", pointerId: 2 });
    const pinched = state.commits.at(-1) as ChartZoom;
    expect(pinched.max - pinched.min).toBeLessThan(6);
    fire("pointerdown", at(6), { pointerType: "touch", pointerId: 3 });
    fire("pointerup", at(6), { pointerType: "touch", pointerId: 2 });
    fire("pointerup", at(6), { pointerType: "touch", pointerId: 1 });
    fire("pointerup", at(6), { pointerType: "touch", pointerId: 3 });
    // A touch on a whole chart leaves the tap to the tooltip.
    const whole = setup("zoom");
    whole.fire("pointerdown", whole.at(3), { pointerType: "touch" });
    whole.fire("pointermove", whole.at(1), { pointerType: "touch" });
    expect(whole.state.commits).toEqual([]);
  });

  it("the pan tool pans with the mouse", () => {
    const { state, at, fire } = setup("pan", { min: 2, max: 4 });
    fire("pointerdown", at(4));
    fire("pointermove", at(3));
    expect(state.commits.at(-1)).toEqual({ min: 3, max: 5 });
    fire("pointerup", at(3));
  });

  it("brushes move, resize and redraw their selection", () => {
    const { state, at, fire, render } = setup("brush", { min: 2, max: 4 });
    const [left, right] = chartSelectionPx(render.layout, { min: 2, max: 4 }) as [number, number];
    const box = document.body.lastElementChild?.getBoundingClientRect() as DOMRect;
    fire("pointerdown", at(3));
    fire("pointermove", at(4));
    expect(state.commits.at(-1)).toEqual({ min: 3, max: 5 });
    fire("pointerup", at(4));
    state.range = { min: 2, max: 4 };
    fire("pointerdown", box.left + right);
    fire("pointermove", at(6));
    expect(state.commits.at(-1)).toEqual({ min: 2, max: 6 });
    fire("pointerup", at(6));
    state.range = { min: 2, max: 4 };
    fire("pointerdown", box.left + left);
    fire("pointermove", at(0));
    expect(state.commits.at(-1)).toEqual({ min: 0, max: 4 });
    fire("pointerup", at(0));
    // Outside the selection: a new one, committed while dragging.
    fire("pointerdown", at(6));
    fire("pointermove", at(7));
    expect(state.commits.at(-1)).toEqual({ min: 6, max: 7 });
    fire("pointerup", at(7));
    expect(state.previews).toEqual([]);
    // Two pointers on a brush don't pinch.
    fire("pointerdown", at(1), { pointerId: 1, pointerType: "touch" });
    fire("pointerdown", at(2), { pointerId: 2, pointerType: "touch" });
    fire("pointerup", at(2), { pointerId: 2, pointerType: "touch" });
    fire("pointerup", at(2), { pointerId: 1, pointerType: "touch" });
  });

  it("a whole-axis brush draws a new selection anywhere", () => {
    const { state, at, fire } = setup("brush", null);
    fire("pointerdown", at(3));
    fire("pointermove", at(5));
    expect(state.commits.at(-1)).toEqual({ min: 3, max: 5 });
  });

  it("Ctrl + wheel zooms around the pointer; a plain wheel doesn't", () => {
    const { plot, state, at } = setup("zoom");
    const wheel = (init: WheelEventInit) => {
      const event = new WheelEvent("wheel", { clientX: at(2), cancelable: true, ...init });
      plot.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(wheel({ deltaY: -100 })).toBe(false);
    expect(wheel({ deltaY: 0, ctrlKey: true })).toBe(false);
    expect(wheel({ deltaY: -100, ctrlKey: true })).toBe(true);
    expect(state.commits.at(-1)).toEqual({ min: 0, max: 6 });
    expect(wheel({ deltaY: 100, metaKey: true })).toBe(true);
    const none = setup("none");
    none.plot.dispatchEvent(new WheelEvent("wheel", { deltaY: 1, ctrlKey: true }));
    expect(none.state.commits).toEqual([]);
  });

  it("works before a layout exists", () => {
    const plot = document.createElement("div");
    document.body.append(plot);
    const commits: unknown[] = [];
    const gestures = createChartGestures(plot, {
      layout: () => undefined,
      mode: () => "zoom",
      range: () => null,
      extent: () => null,
      preview: () => {},
      commit: (r) => commits.push(r),
    });
    plot.dispatchEvent(new PointerEvent("pointerdown", { pointerId: 1, pointerType: "mouse" }));
    plot.dispatchEvent(new PointerEvent("pointermove", { pointerId: 1, pointerType: "mouse" }));
    expect(commits).toEqual([]);
    gestures.destroy();
  });
});
