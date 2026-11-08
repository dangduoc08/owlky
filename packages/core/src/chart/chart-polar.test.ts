import { describe, expect, it } from "vitest";
import { chartAttributes } from "../anatomy/anatomy.js";
import { renderChart } from "./chart.js";
import { chartActiveAt, chartActiveNodes, chartTooltip, nextChartActive } from "./chart-active.js";
import { chartFormat } from "./chart-format.js";
import { type ChartLayout, type ChartNode, layoutChart } from "./chart-layout.js";
import { chartData, chartTable, isCircularChart, isPolarChart } from "./chart-model.js";
import {
  arcPath,
  layoutCircular,
  layoutRadar,
  lighterTone,
  polarPoint,
  slicePath,
} from "./chart-polar.js";

const base = { width: 300, height: 240, idPrefix: "t" };
const SLICES = ["A", "B", "C", "D"];
const pie = (extra: Record<string, unknown> = {}) =>
  renderChart({
    ...base,
    type: "pie",
    categories: SLICES,
    series: [{ name: "Value", data: [44, 55, 13, 43] }],
    ...extra,
  });

/** Every node of a tree, depth first. */
const all = (nodes: readonly ChartNode[]): ChartNode[] =>
  nodes.flatMap((node) => [node, ...all(node.children ?? [])]);
const find = (layout: ChartLayout, attr: string) =>
  all(layout.nodes).filter((node) => node.attrs[attr] !== undefined);
const texts = (layout: ChartLayout, attr: string) => find(layout, attr).map((node) => node.text);

describe("chart types", () => {
  it("knows circular and polar types", () => {
    expect(isCircularChart("pie")).toBe(true);
    expect(isCircularChart("radialBar")).toBe(true);
    expect(isCircularChart("radar")).toBe(false);
    expect(isPolarChart("radar")).toBe(true);
    expect(isPolarChart("donut")).toBe(true);
    expect(isPolarChart("bar")).toBe(false);
  });

  it("colors slices in order and draws every series as the chart type", () => {
    const data = chartData({
      type: "donut",
      colors: ["info"],
      categories: ["A", "B", "C"],
      series: [{ name: "V", type: "bar", data: [1, { y: 2, color: "error" }, 3] }],
    });
    expect(data.series[0]?.type).toBe("donut");
    expect(data.series[0]?.points.map((point) => point.color)).toEqual(["info", "error", "info"]);
    const radar = chartData({ type: "radar", series: [{ name: "A", type: "line", data: [1] }] });
    expect(radar.series[0]?.type).toBe("radar");
  });

  it("writes slice colors into the data table", () => {
    const data = chartData({
      type: "pie",
      categories: ["A", "B"],
      series: [{ name: "V", data: [1, 2] }],
    });
    const table = chartTable(data, { xLabel: "X", formatX: String, formatValue: String });
    expect(table.rows.map((row) => row.cells[0]?.attrs["data-ok-color"])).toEqual([
      "primary-dark",
      "warning",
    ]);
  });

  it("writes the new options as attributes", () => {
    expect(
      chartAttributes({
        type: "radialBar",
        dataLabels: true,
        startAngle: -90,
        endAngle: 90,
        dashArray: 4,
        trackWidth: 100,
        total: 2324,
      }),
    ).toMatchObject({
      "data-ok-type": "radialBar",
      "data-ok-data-labels": "",
      "data-ok-start-angle": "-90",
      "data-ok-end-angle": "90",
      "data-ok-dash-array": "4",
      "data-ok-track-width": "100",
      "data-ok-total": "2324",
    });
    const invalid = chartAttributes({ dashArray: -1, trackWidth: -5 });
    expect(invalid).not.toHaveProperty("data-ok-dash-array");
    expect(invalid).not.toHaveProperty("data-ok-track-width");
  });
});

describe("geometry", () => {
  it("places points clockwise from 12 o'clock", () => {
    const [x, y] = polarPoint(100, 100, 50, 90);
    expect(x).toBeCloseTo(150);
    expect(y).toBeCloseTo(100);
    expect(polarPoint(100, 100, 50, 0)[1]).toBeCloseTo(50);
  });

  it("draws slices, donut segments and full turns", () => {
    expect(slicePath(100, 100, 0, 50, 0, 90)).toBe("M100,50A50,50 0 0 1 150,100L100,100Z");
    expect(slicePath(100, 100, 20, 50, 0, 270)).toBe(
      "M100,50A50,50 0 1 1 50,100L80,100A20,20 0 1 0 100,80Z",
    );
    // A full turn is two half circles; a donut ring adds a counterclockwise hole.
    expect(slicePath(100, 100, 0, 50, 0, 360)).toBe(
      "M100,50A50,50 0 0 1 100,150A50,50 0 0 1 100,50Z",
    );
    expect(slicePath(100, 100, 20, 50, 0, 360)).toBe(
      "M100,50A50,50 0 0 1 100,150A50,50 0 0 1 100,50ZM100,80A20,20 0 0 0 100,120A20,20 0 0 0 100,80Z",
    );
  });

  it("draws open arcs, splitting full turns", () => {
    expect(arcPath(100, 100, 50, -90, 90)).toBe("M50,100A50,50 0 0 1 150,100");
    expect(arcPath(100, 100, 50, 0, 360).match(/A/g)).toHaveLength(2);
  });

  it("finds the lighter tone of a color", () => {
    expect(lighterTone("secondary")).toBe("secondary-light");
    expect(lighterTone("secondary-main")).toBe("secondary-light");
    expect(lighterTone("error-dark")).toBe("error-main");
    expect(lighterTone("info-lighter")).toBe("info-lighter");
  });
});

describe("pie and donut", () => {
  it("draws one slice per category, sized by value, in slot order", () => {
    const { layout, legend } = pie();
    expect(layout.mode).toBe("slice");
    const slices = find(layout, "data-ok-chart-slice");
    expect(slices.map((node) => node.attrs["data-ok-color"])).toEqual([
      "primary-dark",
      "warning",
      "info",
      "error",
    ]);
    expect(layout.marks.map((mark) => mark.arc?.end)).toEqual([102.19, 229.94, 260.13, 360]);
    expect(layout.slots.map((slot) => slot.index)).toEqual([0, 1, 2, 3]);
    // The legend lists the categories.
    expect(legend?.map((item) => [item.name, item.color])).toEqual([
      ["A", "primary-dark"],
      ["B", "warning"],
      ["C", "info"],
      ["D", "error"],
    ]);
    expect(find(layout, "data-ok-chart-data-labels")).toHaveLength(0);
    expect(find(layout, "data-ok-chart-center")).toHaveLength(0);
  });

  it("prints percentages on slices wide enough when data labels are on", () => {
    const { layout } = pie({ dataLabels: true });
    expect(texts(layout, "data-ok-chart-data-label")).toEqual(["28.4%", "35.5%", "8.4%", "27.7%"]);
    const thin = renderChart({
      ...base,
      type: "pie",
      dataLabels: true,
      categories: ["A", "B"],
      series: [{ name: "V", data: [100, 1] }],
    });
    expect(texts(thin.layout, "data-ok-chart-data-label")).toEqual(["99.0%"]);
  });

  it("leaves hidden, empty and negative slices out", () => {
    const { layout, legend } = pie({ hidden: [1] });
    expect(find(layout, "data-ok-chart-slice")).toHaveLength(3);
    expect(layout.slots.map((slot) => slot.index)).toEqual([0, 2, 3]);
    expect(legend?.[1]?.hidden).toBe(true);
    const odd = renderChart({
      ...base,
      type: "pie",
      categories: ["A", "B", "C", "D"],
      series: [{ name: "V", data: [0, -3, null, 5] }],
    });
    expect(find(odd.layout, "data-ok-chart-slice")).toHaveLength(1);
    expect(find(odd.layout, "data-ok-chart-slice")[0]?.attrs["d"]).toContain("A");
    const none = renderChart({ ...base, type: "pie", series: [] });
    expect(none.layout.marks).toEqual([]);
    expect(none.legend).toBeNull();
  });

  it("donuts have a hole and an optional total in the center", () => {
    const plain = renderChart({
      ...base,
      type: "donut",
      categories: SLICES,
      series: [{ name: "V", data: [44, 55, 13, 43] }],
    });
    expect(plain.layout.marks[0]?.arc?.inner).toBeGreaterThan(0);
    expect(find(plain.layout, "data-ok-chart-center")).toHaveLength(0);
    const total = renderChart({
      ...base,
      type: "donut",
      totalLabel: "Total",
      valuePrefix: "$",
      categories: SLICES,
      series: [{ name: "V", data: [44, 55, 13, 43] }],
    });
    expect(texts(total.layout, "data-ok-chart-center-label")).toEqual(["Total"]);
    expect(texts(total.layout, "data-ok-chart-center-value")).toEqual(["$155"]);
    const fixed = renderChart({
      ...base,
      type: "donut",
      totalLabel: "Total",
      total: 2324,
      categories: SLICES,
      series: [{ name: "V", data: [44, 55, 13, 43] }],
    });
    expect(texts(fixed.layout, "data-ok-chart-center-value")).toEqual(["2,324"]);
  });

  it("follows the start and end angles", () => {
    const half = pie({ startAngle: -90, endAngle: 90 });
    expect(half.layout.marks[0]?.arc?.start).toBe(-90);
    expect(half.layout.marks.at(-1)?.arc?.end).toBe(90);
    // At most one turn; an end before the start draws nothing.
    expect(pie({ endAngle: 720 }).layout.marks.at(-1)?.arc?.end).toBe(360);
    expect(pie({ startAngle: 90, endAngle: 0 }).layout.marks).toEqual([]);
  });
});

describe("radial bar", () => {
  const radial = (extra: Record<string, unknown> = {}) =>
    renderChart({
      ...base,
      type: "radialBar",
      categories: ["Apples", "Oranges"],
      colors: ["secondary", "warning"],
      series: [{ name: "Share", data: [24, 50] }],
      ...extra,
    });

  it("draws a track and a gradient bar per category, outermost first", () => {
    const { layout, table } = radial();
    const tracks = find(layout, "data-ok-chart-track");
    const bars = find(layout, "data-ok-chart-radial");
    expect(tracks).toHaveLength(2);
    expect(bars.map((bar) => bar.attrs["stroke"])).toEqual([
      "url(#t-radial-0)",
      "url(#t-radial-1)",
    ]);
    const outer = layout.marks[0]?.arc?.outer as number;
    expect(outer).toBeGreaterThan(layout.marks[1]?.arc?.outer as number);
    // The track is half as thick as the bar by default.
    expect(Number(tracks[0]?.attrs["stroke-width"]) * 2).toBeCloseTo(
      Number(bars[0]?.attrs["stroke-width"]),
    );
    const stops = find(layout, "data-ok-chart-stop").map((stop) => stop.attrs["data-ok-color"]);
    expect(stops).toEqual(["secondary-light", "secondary", "warning-light", "warning"]);
    // Values are percentages.
    expect(table.rows[0]?.cells[0]?.text).toBe("24%");
    // Several rings and no total label: nothing in the center.
    expect(find(layout, "data-ok-chart-center")).toHaveLength(0);
  });

  it("shows the total (average by default) under its label", () => {
    expect(texts(radial({ totalLabel: "Total" }).layout, "data-ok-chart-center-value")).toEqual([
      "37%",
    ]);
    expect(
      texts(radial({ totalLabel: "Total", total: 2324 }).layout, "data-ok-chart-center-value"),
    ).toEqual(["2,324"]);
  });

  it("a single ring is a gauge with its value and name in the center", () => {
    const gauge = renderChart({
      ...base,
      type: "radialBar",
      startAngle: -135,
      endAngle: 135,
      dashArray: 4,
      trackWidth: 100,
      fill: "solid",
      categories: ["Median ratio"],
      series: [{ name: "Ratio", data: [75] }],
    });
    expect(texts(gauge.layout, "data-ok-chart-center-value")).toEqual(["75%"]);
    expect(texts(gauge.layout, "data-ok-chart-center-label")).toEqual(["Median ratio"]);
    const [bar] = find(gauge.layout, "data-ok-chart-radial");
    const [track] = find(gauge.layout, "data-ok-chart-track");
    expect(bar?.attrs["stroke"]).toBeUndefined();
    expect(bar?.attrs["stroke-dasharray"]).toBe("4");
    expect(track?.attrs["stroke-width"]).toBe(bar?.attrs["stroke-width"]);
    expect(find(gauge.layout, "data-ok-dashed")).toHaveLength(1);
    expect(find(gauge.layout, "linearGradient")).toHaveLength(0);
    expect(gauge.legend).toBeNull();
    // 75 % of 270 degrees from -135.
    expect(gauge.layout.marks[0]?.arc).toMatchObject({ start: -135, end: 135 });
  });

  it("clamps values to the full ring (yMax) and skips empty bars", () => {
    const { layout } = renderChart({
      ...base,
      type: "radialBar",
      yMax: 50,
      valueSuffix: " pts",
      categories: ["A", "B", "C"],
      series: [{ name: "V", data: [80, 0, 25] }],
    });
    expect(find(layout, "data-ok-chart-track")).toHaveLength(3);
    expect(find(layout, "data-ok-chart-radial")).toHaveLength(2);
    const [first] = layout.marks;
    expect(first?.px).toBeCloseTo(150, 0);
    expect(layout.marks[2]?.py).toBeGreaterThan(120);
    const big = renderChart({
      ...base,
      type: "radialBar",
      trackWidth: 500,
      series: [{ name: "V", data: [10] }],
    });
    const [track] = find(big.layout, "data-ok-chart-track");
    const [bar] = find(big.layout, "data-ok-chart-radial");
    expect(track?.attrs["stroke-width"]).toBe(bar?.attrs["stroke-width"]);
    expect(texts(big.layout, "data-ok-chart-center-label")).toEqual(["1"]);
  });
});

describe("radar", () => {
  const radar = (extra: Record<string, unknown> = {}) =>
    renderChart({
      ...base,
      width: 400,
      type: "radar",
      categories: ["2011", "2012", "2013", "2014", "2015", "2016"],
      series: [
        { name: "A", data: [80, 50, 30, 40, 100, 20] },
        { name: "B", data: [20, 30, null, 80, 20, 80] },
      ],
      ...extra,
    });

  it("draws a web, labels around it and one closed shape per series", () => {
    const { layout, legend } = radar();
    expect(layout.mode).toBe("index");
    expect(layout.polar).toBeDefined();
    const web = find(layout, "data-ok-chart-web");
    expect(web.filter((node) => node.tag === "line")).toHaveLength(6);
    expect(web.filter((node) => node.tag === "path").length).toBeGreaterThan(2);
    const labels = find(layout, "data-ok-chart-tick").filter(
      (node) => node.attrs["dy"] !== "0.35em" || node.attrs["text-anchor"] !== "start",
    );
    expect(labels.map((node) => [node.text, node.attrs["text-anchor"]])).toEqual([
      ["2011", "middle"],
      ["2012", "start"],
      ["2013", "start"],
      ["2014", "middle"],
      ["2015", "end"],
      ["2016", "end"],
    ]);
    expect(labels[0]?.attrs["dy"]).toBe("0");
    expect(labels[3]?.attrs["dy"]).toBe("0.71em");
    expect(texts(layout, "data-ok-chart-axis").length).toBe(2);
    const shapes = find(layout, "data-ok-chart-series");
    expect(shapes).toHaveLength(2);
    expect(shapes[0]?.children?.[0]?.attrs["d"]).toMatch(/Z$/);
    // Gaps sit at the center and have no mark.
    expect(layout.marks.filter((mark) => mark.series === 1)).toHaveLength(5);
    expect(legend).toHaveLength(2);
  });

  it("hides series, adds markers, dashes and data labels", () => {
    const { layout } = radar({ hidden: [0], markerSize: 3, dashArray: 5, dataLabels: true });
    expect(find(layout, "data-ok-chart-series")).toHaveLength(1);
    expect(find(layout, "data-ok-chart-marker")).toHaveLength(6);
    expect(find(layout, "data-ok-chart-line")[0]?.attrs["stroke-dasharray"]).toBe("5");
    expect(texts(layout, "data-ok-chart-data-label")).toEqual(["20", "30", "80", "20", "80"]);
    expect(layout.activeRadius).toBe(5);
  });

  it("numbers the axes when there are no categories", () => {
    const { layout } = renderChart({
      ...base,
      type: "radar",
      series: [{ name: "A", data: [1, 2, 3] }],
    });
    const [axisX] = find(layout, "data-ok-chart-axis");
    expect(axisX?.children?.map((node) => node.text)).toEqual(["1", "2", "3"]);
  });

  it("survives no data", () => {
    const { layout } = renderChart({ ...base, type: "radar", series: [] });
    expect(layout.slots).toEqual([]);
    expect(find(layout, "data-ok-chart-web")).toEqual([]);
    expect(chartActiveAt(layout, 150, 120)).toBeNull();
    const format = chartFormat(chartData({ series: [] }));
    const direct = layoutRadar(
      chartData({ type: "radar", series: [{ name: "A", data: [] }] }),
      { ...base, format },
      format,
    );
    expect(direct.marks).toEqual([]);
  });
});

describe("polar interaction", () => {
  it("a pointer over a slice activates it; outside the radius nothing", () => {
    const { layout } = pie();
    const [cx, cy] = [150, 120];
    expect(chartActiveAt(layout, cx + 40, cy - 40)).toEqual({ kind: "index", index: 0 });
    expect(chartActiveAt(layout, cx - 40, cy - 40)).toEqual({ kind: "index", index: 3 });
    expect(chartActiveAt(layout, cx, cy + 40)).toEqual({ kind: "index", index: 1 });
    expect(chartActiveAt(layout, 2, 2)).toBeNull();
  });

  it("rings are hit along their whole track", () => {
    const { layout } = renderChart({
      ...base,
      type: "radialBar",
      categories: ["A", "B"],
      series: [{ name: "V", data: [10, 10] }],
    });
    const outer = layout.marks[0]?.arc;
    const r = ((outer?.inner as number) + (outer?.outer as number)) / 2;
    // Left of the center: the bar doesn't reach it, its track does.
    expect(chartActiveAt(layout, 150 - r, 120)).toEqual({ kind: "index", index: 0 });
    expect(chartActiveAt(layout, 150, 120)).toBeNull();
    const half = renderChart({
      ...base,
      type: "radialBar",
      startAngle: -90,
      endAngle: 90,
      series: [{ name: "V", data: [10] }],
    });
    const arc = half.layout.marks[0]?.arc;
    const mid = ((arc?.inner as number) + (arc?.outer as number)) / 2;
    expect(chartActiveAt(half.layout, 150, 120 - mid)).toEqual({ kind: "index", index: 0 });
    expect(chartActiveAt(half.layout, 150, 120 + mid)).toBeNull();
  });

  it("radar: the nearest axis inside the web", () => {
    const { layout } = renderChart({
      ...base,
      type: "radar",
      categories: ["A", "B", "C", "D"],
      series: [{ name: "S", data: [1, 2, 3, 4] }],
    });
    const { cx, cy, r } = layout.polar as { cx: number; cy: number; r: number };
    expect(chartActiveAt(layout, cx + 10, cy - 30)).toEqual({ kind: "index", index: 0 });
    expect(chartActiveAt(layout, cx + 30, cy)).toEqual({ kind: "index", index: 1 });
    expect(chartActiveAt(layout, cx - 30, cy - 2)).toEqual({ kind: "index", index: 3 });
    expect(chartActiveAt(layout, cx, cy - r - 40)).toBeNull();
  });

  it("keys move through visible slices only", () => {
    const { layout } = pie({ hidden: [1] });
    expect(nextChartActive(layout, null, "ArrowRight")).toEqual({ kind: "index", index: 0 });
    expect(nextChartActive(layout, { kind: "index", index: 0 }, "ArrowRight")).toEqual({
      kind: "index",
      index: 2,
    });
    expect(nextChartActive(layout, { kind: "index", index: 2 }, "ArrowLeft")).toEqual({
      kind: "index",
      index: 0,
    });
    expect(nextChartActive(layout, null, "End")).toEqual({ kind: "index", index: 3 });
  });

  it("an active slice gets a halo behind it, rings only a tooltip", () => {
    const { layout, data, format } = pie();
    const nodes = chartActiveNodes(layout, { kind: "index", index: 1 });
    expect(nodes.over).toEqual([]);
    expect(nodes.under[0]?.attrs).toMatchObject({
      "data-ok-chart-active-slice": "",
      "data-ok-color": "warning",
    });
    expect(chartActiveNodes(layout, { kind: "index", index: 9 })).toEqual({
      under: [],
      over: [],
    });
    const tip = chartTooltip(data, layout, format, { kind: "index", index: 1 });
    expect(tip).toMatchObject({
      title: "B",
      rows: [{ name: "Value", value: "55", color: "warning" }],
    });
    const radial = renderChart({ ...base, type: "radialBar", series: [{ name: "V", data: [10] }] });
    expect(chartActiveNodes(radial.layout, { kind: "index", index: 0 })).toEqual({
      under: [],
      over: [],
    });
    // A category without a mark (hidden) has no tooltip.
    const hidden = pie({ hidden: [1] });
    expect(
      chartTooltip(hidden.data, hidden.layout, hidden.format, { kind: "index", index: 1 }),
    ).toBeNull();
    // A slot without a mark (a direct layout) has none either.
    const empty = { ...layout, marks: [] };
    expect(chartTooltip(data, empty, format, { kind: "index", index: 1 })).toBeNull();
  });

  it("radar: a spoke under the series, markers over them, the tooltip at the outermost value", () => {
    const { layout, data, format } = renderChart({
      ...base,
      type: "radar",
      categories: ["A", "B", "C"],
      series: [
        { name: "S", data: [1, 2, 3] },
        { name: "T", data: [3, 1, null] },
      ],
    });
    const nodes = chartActiveNodes(layout, { kind: "index", index: 0 });
    expect(nodes.under[0]?.attrs["data-ok-chart-crosshair-line"]).toBe("");
    expect(nodes.over).toHaveLength(2);
    const tip = chartTooltip(data, layout, format, { kind: "index", index: 0 });
    const t = layout.marks.find((mark) => mark.series === 1 && mark.index === 0);
    expect(tip).toMatchObject({ title: "A", x: t?.px, y: t?.py });
    expect(tip?.rows).toHaveLength(2);
    const second = chartTooltip(data, layout, format, { kind: "index", index: 1 });
    const s1 = layout.marks.find((mark) => mark.series === 0 && mark.index === 1);
    expect(second).toMatchObject({ x: s1?.px, y: s1?.py });
    const lone = chartTooltip(data, { ...layout, marks: [] }, format, { kind: "index", index: 2 });
    expect(lone).toMatchObject({ rows: [], x: layout.polar?.cx, y: layout.polar?.cy });
  });

  it("layoutCircular direct call with no series", () => {
    const data = chartData({ type: "pie", series: [] });
    const layout = layoutCircular(data, { ...base, format: chartFormat(data) }, chartFormat(data));
    expect(layout.marks).toEqual([]);
  });
});

describe("data labels on cartesian charts", () => {
  it("prints values inside bars that fit them and above line points", () => {
    const bars = layoutChart(
      chartData({
        type: "bar",
        categories: ["A", "B"],
        series: [{ name: "S", data: [100, 1] }],
      }),
      { ...base, dataLabels: true, format: chartFormat(chartData({ series: [] })) },
    );
    expect(texts(bars, "data-ok-chart-data-label")).toEqual(["100"]);
    expect(find(bars, "data-ok-chart-data-label")[0]?.attrs["data-ok-chart-data-label"]).toBe(
      "inside",
    );
    const rows = renderChart({
      ...base,
      type: "bar",
      horizontal: true,
      dataLabels: true,
      categories: ["A", "B"],
      series: [{ name: "S", data: [100, 1] }],
    });
    expect(texts(rows.layout, "data-ok-chart-data-label")).toEqual(["100"]);
    const lines = renderChart({
      ...base,
      dataLabels: true,
      dashArray: 3,
      categories: ["A", "B"],
      series: [
        { name: "S", data: [10, 20] },
        { name: "P", type: "scatter", data: [5, 6] },
      ],
    });
    expect(texts(lines.layout, "data-ok-chart-data-label")).toEqual(["10", "20"]);
    expect(find(lines.layout, "data-ok-chart-line")[0]?.attrs["stroke-dasharray"]).toBe("3");
    // Off: no group, so phase 1 charts draw exactly as before.
    expect(
      find(
        renderChart({ ...base, series: [{ name: "S", data: [1] }] }).layout,
        "data-ok-chart-data-labels",
      ),
    ).toEqual([]);
  });
});
