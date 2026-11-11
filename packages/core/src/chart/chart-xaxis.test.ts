import { describe, expect, it } from "vitest";
import { type ChartRenderInput, renderChart } from "./chart.js";
import {
  type ChartAnnotation,
  chartAnnotationItems,
  chartAnnotations,
} from "./chart-annotations.js";
import type { ChartNode } from "./chart-layout.js";
import { linkChart } from "./chart-link.js";
import { chartData } from "./chart-model.js";
import { chartTextAttributes } from "./chart-text.js";
import {
  chartFixedWindow,
  chartXGroupAt,
  chartXGroups,
  chartXGroupsText,
  parseChartXGroups,
} from "./chart-xaxis.js";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const base: ChartRenderInput = {
  type: "line",
  categories: MONTHS,
  series: [{ name: "A", data: [1, 2, 3, 4, 5, 6] }],
  width: 640,
  height: 320,
  idPrefix: "t",
};
const all = (nodes: readonly ChartNode[]): ChartNode[] =>
  nodes.flatMap((item) => [item, ...all(item.children ?? [])]);
const withAttr = (input: ChartRenderInput, name: string) =>
  all(renderChart(input).layout.nodes).filter((item) => item.attrs[name] !== undefined);

describe("x axis groups", () => {
  it("validates, writes and reads the groups", () => {
    expect(
      chartXGroups([
        { title: "A", cols: 2.9 },
        { title: "", cols: 2 },
        { title: "B", cols: 0 },
      ]),
    ).toEqual([{ title: "A", cols: 2 }]);
    expect(chartXGroupsText([{ title: "Half; one", cols: 3 }])).toBe("3 Half one");
    expect(parseChartXGroups("3 First half; 3 Second half; nope")).toEqual([
      { title: "First half", cols: 3 },
      { title: "Second half", cols: 3 },
    ]);
    expect(parseChartXGroups(null)).toEqual([]);
    expect(parseChartXGroups("x".repeat(5000))).toEqual([]);
    expect(chartXGroupAt([{ title: "H", cols: 2 }], 1)).toBe("H");
    expect(chartXGroupAt([{ title: "H", cols: 2 }], 2)).toBeUndefined();
  });

  it("draws a row of titles, ticks between them and more room under the plot", () => {
    const plain = renderChart(base);
    const input = {
      ...base,
      xaxisGroups: [
        { title: "First", cols: 3 },
        { title: "Second", cols: 3 },
      ],
    };
    const titles = withAttr(input, "data-ok-chart-axis-group");
    expect(titles.map((item) => item.text)).toEqual(["First", "Second"]);
    expect(withAttr(input, "data-ok-chart-axis-group-tick")).toHaveLength(1);
    expect(renderChart(input).layout.plot.height).toBe(plain.layout.plot.height - 20);
  });

  it("clips groups to the zoom window and leaves out groups outside it", () => {
    const input = {
      ...base,
      zoom: { min: 0, max: 2 },
      xaxisGroups: [
        { title: "First", cols: 3 },
        { title: "Second", cols: 3 },
      ],
    };
    expect(withAttr(input, "data-ok-chart-axis-group").map((item) => item.text)).toEqual(["First"]);
    expect(withAttr(input, "data-ok-chart-axis-group-tick")).toHaveLength(0);
  });

  it("names the group in the row header's accessible name", () => {
    const { table } = renderChart({ ...base, xaxisGroups: [{ title: "H1", cols: 3 }] });
    expect(table.rows[0]?.header.attrs["aria-label"]).toBe("H1, Jan");
    expect(table.rows[3]?.header.attrs["aria-label"]).toBeUndefined();
  });

  it("ignores groups on horizontal and numeric charts", () => {
    const groups = [{ title: "G", cols: 2 }];
    expect(
      withAttr(
        { ...base, type: "bar", horizontal: true, xaxisGroups: groups },
        "data-ok-chart-axis-group",
      ),
    ).toHaveLength(0);
    expect(
      withAttr(
        {
          ...base,
          type: "scatter",
          categories: undefined,
          series: [{ name: "A", data: [[1, 2]] }],
          xaxisGroups: groups,
        },
        "data-ok-chart-axis-group",
      ),
    ).toHaveLength(0);
  });
});

describe("x label rotation", () => {
  const long = Array.from({ length: 8 }, (_, i) => `A long category label ${i}`);
  const wide = {
    ...base,
    categories: long,
    series: [{ name: "A", data: [1, 2, 3, 4, 5, 6, 7, 8] }],
  };
  const ticks = (input: ChartRenderInput) =>
    withAttr(input, "data-ok-chart-tick").filter((item) => item.attrs["dy"] !== undefined);

  it("rotates labels that don't fit flat", () => {
    const labels = ticks({ ...wide, xLabelRotate: -45 }).filter((t) => t.attrs["transform"]);
    expect(labels.length).toBeGreaterThan(0);
    expect(labels[0]?.attrs["transform"]).toMatch(/^rotate\(-45 /);
    expect(labels[0]?.attrs["text-anchor"]).toBe("end");
  });

  it("keeps flat labels that fit, unless always", () => {
    expect(ticks({ ...base, xLabelRotate: -45 }).some((t) => t.attrs["transform"])).toBe(false);
    const always = ticks({ ...base, xLabelRotate: 30, xLabelRotateAlways: true }).filter(
      (t) => t.attrs["transform"],
    );
    expect(always.length).toBeGreaterThan(0);
    expect(always[0]?.attrs["text-anchor"]).toBe("start");
  });

  it("cuts labels to a third of the height and takes the room from the plot", () => {
    const short = renderChart({ ...wide, height: 120, xLabelRotate: -90 });
    const texts = all(short.layout.nodes).filter(
      (n) => n.attrs["data-ok-chart-tick"] !== undefined && n.attrs["transform"],
    );
    expect(texts.some((t) => t.text?.endsWith("…"))).toBe(true);
    expect(short.layout.plot.height).toBeLessThan(
      renderChart({ ...wide, height: 120 }).layout.plot.height,
    );
  });

  it("doesn't rotate numeric axes or without the option", () => {
    expect(ticks(wide).some((t) => t.attrs["transform"])).toBe(false);
    const scatter = {
      ...base,
      type: "scatter" as const,
      categories: undefined,
      series: [
        {
          name: "A",
          data: [
            [1, 2],
            [5, 6],
          ] as const,
        },
      ],
    };
    expect(
      ticks({ ...scatter, xLabelRotate: -45, xLabelRotateAlways: true }).some(
        (t) => t.attrs["transform"],
      ),
    ).toBe(false);
  });
});

describe("fixed x window", () => {
  const data = chartData({
    type: "line",
    categories: MONTHS,
    series: [{ name: "A", data: [1, 2, 3, 4, 5, 6] }],
  });
  const dates = chartData({
    type: "line",
    xType: "datetime",
    categories: ["2025-01-01", "2025-02-01", "2025-03-01", "2025-04-01"],
    series: [{ name: "A", data: [1, 2, 3, 4] }],
  });
  const points = chartData({
    type: "scatter",
    series: [
      {
        name: "A",
        data: [
          [10, 1],
          [20, 2],
          [30, 3],
        ],
      },
    ],
  });

  it("reads category indexes, a range from the end and whole axes", () => {
    expect(chartFixedWindow(data, {})).toBeNull();
    expect(chartFixedWindow(data, { xMin: 1, xMax: 3 })).toEqual({ min: 1, max: 3 });
    expect(chartFixedWindow(data, { xRange: 2 })).toEqual({ min: 3, max: 5 });
    expect(chartFixedWindow(data, { xMin: 0, xMax: 5 })).toBeNull();
  });

  it("turns timestamps into the categories they reach on date axes", () => {
    expect(
      chartFixedWindow(dates, { xMin: Date.UTC(2025, 1, 15), xMax: Date.UTC(2025, 2, 15) }),
    ).toEqual({ min: 2, max: 3 });
    expect(chartFixedWindow(dates, { xRange: 40 * 86_400_000 })).toEqual({ min: 2, max: 3 });
  });

  it("keeps numeric windows, even beyond the data", () => {
    expect(chartFixedWindow(points, { xMin: 0, xMax: 100 })).toEqual({ min: 0, max: 100 });
    expect(chartFixedWindow(points, { xRange: 10 })).toEqual({ min: 20, max: 30 });
    expect(chartFixedWindow(points, { xMin: 40 })).toBeNull();
  });

  it("draws the window without reporting a zoom, so reset returns to it", () => {
    const render = renderChart({ ...base, xMin: 1, xMax: 3 });
    expect(render.layout.slots.map((slot) => slot.index)).toEqual([1, 2, 3]);
    expect(render.zoom).toBeNull();
    expect(render.extent).toEqual({ min: 0, max: 5 });
    const zoomed = renderChart({ ...base, xMin: 1, xMax: 3, zoom: { min: 2, max: 5 } });
    expect(zoomed.layout.slots.map((slot) => slot.index)).toEqual([2, 3, 4, 5]);
    expect(zoomed.zoom).toEqual({ min: 2, max: 5 });
  });
});

describe("forecast tails", () => {
  it("dashes the last points of a line from the last real point on", () => {
    const input = { ...base, forecastCount: 2 };
    const lines = withAttr(input, "data-ok-chart-line");
    expect(lines).toHaveLength(2);
    const dashed = lines.filter((l) => l.attrs["data-ok-chart-forecast"] !== undefined);
    expect(dashed).toHaveLength(1);
    expect(dashed[0]?.attrs["stroke-dasharray"]).toBe("4");
    // The tail starts where the solid line ends: no hole.
    const solid = lines.find((l) => l.attrs["data-ok-chart-forecast"] === undefined) as ChartNode;
    const end = solid.attrs["d"]?.split(" ").pop();
    expect(end && dashed[0]?.attrs["d"]?.startsWith(`M${end}`)).toBe(true);
  });

  it("uses the given dash and width", () => {
    const [dashed] = withAttr(
      { ...base, forecastCount: 1, forecastDashArray: 7, forecastStrokeWidth: 3 },
      "data-ok-chart-forecast",
    );
    expect(dashed?.attrs["stroke-dasharray"]).toBe("7");
    expect(dashed?.attrs["stroke-width"]).toBe("3");
  });

  it("makes forecast areas and bars faint", () => {
    const area = withAttr(
      { ...base, type: "area", forecastCount: 2, forecastFillOpacity: 0.3 },
      "data-ok-chart-forecast",
    ).find((n) => n.attrs["data-ok-chart-area"] !== undefined);
    expect(area?.attrs["fill-opacity"]).toBe("0.3");
    const solid = withAttr(
      { ...base, type: "area", fill: "solid", forecastCount: 2 },
      "data-ok-chart-forecast",
    ).find((n) => n.attrs["data-ok-chart-area"] !== undefined);
    expect(solid?.attrs["fill-opacity"]).toBe("0.12");
    const bars = withAttr({ ...base, type: "bar", forecastCount: 1 }, "data-ok-chart-forecast");
    expect(bars).toHaveLength(1);
    expect(bars[0]?.attrs["fill-opacity"]).toBe("0.5");
  });

  it("breaks at gaps and leaves other types alone", () => {
    const gaps = {
      ...base,
      forecastCount: 3,
      series: [{ name: "A", data: [1, 2, 3, null, 5, 6] }],
    };
    expect(withAttr(gaps, "data-ok-chart-forecast").length).toBeGreaterThan(0);
    expect(withAttr({ ...base, forecastCount: 0 }, "data-ok-chart-forecast")).toHaveLength(0);
    expect(
      withAttr(
        {
          ...base,
          type: "rangeArea",
          forecastCount: 1,
          series: [{ name: "A", data: [{ y: [1, 2] }] }],
        },
        "data-ok-chart-forecast",
      ),
    ).toHaveLength(0);
  });

  it("marks forecast cells and tooltip rows", () => {
    const render = renderChart({ ...base, forecastCount: 1 });
    expect(render.table.rows[5]?.cells[0]?.attrs["aria-label"]).toBe("6, Forecast");
    expect(render.table.rows[4]?.cells[0]?.attrs["aria-label"]).toBeUndefined();
    expect(render.layout.marks.at(-1)?.forecast).toBe(true);
    expect(render.layout.marks[0]?.forecast).toBeUndefined();
  });
});

describe("no data", () => {
  const empty = {
    ...base,
    categories: [],
    series: [{ name: "A", data: [] }],
    noDataText: "Nothing yet",
  };

  it("draws the message only when nothing can be drawn", () => {
    expect(renderChart(empty).noData).toBe("Nothing yet");
    expect(withAttr(empty, "data-ok-chart-no-data")[0]?.text).toBe("Nothing yet");
    expect(renderChart({ ...base, noDataText: "Nothing yet" }).noData).toBeUndefined();
    expect(renderChart({ ...empty, noDataText: undefined }).noData).toBeUndefined();
  });

  it("aligns it", () => {
    const place = (
      noDataAlign: "left" | "right" | "center",
      noDataVerticalAlign: "top" | "bottom" | "middle",
    ) =>
      withAttr({ ...empty, noDataAlign, noDataVerticalAlign }, "data-ok-chart-no-data")[0]?.attrs;
    const { plot } = renderChart(empty).layout;
    expect(place("left", "top")?.["text-anchor"]).toBe("start");
    expect(place("left", "top")?.y).toBe(String(plot.y + 12));
    expect(place("right", "bottom")?.["text-anchor"]).toBe("end");
    expect(place("right", "bottom")?.y).toBe(String(plot.y + plot.height - 12));
    expect(place("center", "middle")?.["text-anchor"]).toBe("middle");
  });

  it("works on charts without series", () => {
    expect(
      renderChart({
        width: 300,
        height: 200,
        idPrefix: "t",
        type: "sankey",
        edges: [],
        noDataText: "None",
      }).noData,
    ).toBe("None");
    expect(
      renderChart({
        width: 300,
        height: 200,
        idPrefix: "t",
        type: "donut",
        series: [],
        noDataText: "None",
      }).noData,
    ).toBe("None");
  });
});

describe("text annotations", () => {
  const notes: ChartAnnotation[] = [
    { axis: "text", x: "Mar", y: 2, label: "Note", textAnchor: "end", color: "error" },
  ];

  it("validates them", () => {
    expect(chartAnnotations([{ axis: "text", x: "Mar", y: 2 }])).toEqual([]);
    expect(chartAnnotations([{ axis: "text", y: 2, label: "A" }])).toEqual([]);
    const [one] = chartAnnotations([
      { axis: "text", x: "Mar", y: 2, label: "A", textAnchor: "bad" as "start" },
    ]);
    expect(one?.textAnchor).toBeUndefined();
    expect(chartAnnotationItems(notes)[0]?.attrs).toEqual({
      "data-ok-annotation": "text",
      "data-ok-x": "Mar",
      "data-ok-y": "2",
      "data-ok-color": "error",
      "data-ok-text-anchor": "end",
    });
  });

  it("draws the label alone at its data position", () => {
    const render = renderChart({ ...base, annotations: notes });
    const [text] = all(render.layout.nodes).filter(
      (n) => n.attrs["data-ok-chart-annotation-text"] !== undefined,
    );
    expect(text?.text).toBe("Note");
    expect(text?.attrs["text-anchor"]).toBe("end");
    expect(
      all(render.layout.nodes).some((n) => n.attrs["data-ok-chart-annotation-tag"] !== undefined),
    ).toBe(false);
  });
});

describe("several brush targets", () => {
  it("writes a list as one attribute and zooms every target", () => {
    expect(chartTextAttributes({ brushTarget: ["a", "", "b"] })).toEqual({
      "data-ok-brush-target": "a b",
    });
    expect(chartTextAttributes({ brushTarget: [] })).toEqual({});
    const applied: string[] = [];
    const member = (id: string) => ({
      id,
      zoom: () => null,
      showIndex: () => {},
      applyZoom: () => applied.push(id),
      select: () => {},
    });
    const a = linkChart(member("a"));
    const b = linkChart(member("b"));
    const selected: unknown[] = [];
    const brush = linkChart({
      brushTarget: "a b",
      zoom: () => null,
      showIndex: () => {},
      applyZoom: () => {},
      select: (range) => selected.push(range),
    });
    brush.brush({ min: 1, max: 2 });
    expect(applied).toEqual(["a", "b"]);
    expect(selected.at(-1)).toEqual({ min: 1, max: 2 });
    a.unlink();
    b.unlink();
    brush.unlink();
  });
});
