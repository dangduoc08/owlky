import { describe, expect, it } from "vitest";
import { type ChartRenderInput, renderChart } from "./chart.js";
import {
  chartDrilldownActive,
  chartDrilldownLevels,
  chartDrilldownPath,
  chartDrilldownTarget,
  chartTrellisPanels,
  readChartDrilldownTables,
} from "./chart-drilldown.js";
import { readChartTable } from "./chart-model.js";
import { chartTextAttributes } from "./chart-text.js";

const levels = [
  {
    id: "q1",
    name: "Q1",
    categories: ["Jan", "Feb"],
    series: [{ name: "S", data: [{ y: 3, drilldown: "jan" }, 4] }],
  },
  {
    id: "q2",
    type: "line" as const,
    categories: ["Apr", "May"],
    series: [{ name: "S", data: [5, 6] }],
  },
  { id: "jan", name: "January", categories: ["W1", "W2"], series: [{ name: "S", data: [1, 2] }] },
];
const base: ChartRenderInput = {
  type: "bar",
  categories: ["Q1", "Q2"],
  series: [
    {
      name: "S",
      data: [
        { y: 7, drilldown: "q1" },
        { y: 11, drilldown: "q2" },
      ],
    },
  ],
  drilldown: levels,
  width: 640,
  height: 320,
  idPrefix: "t",
};

describe("drilldown levels", () => {
  it("validates levels and paths", () => {
    expect(
      chartDrilldownLevels([
        { id: "a", series: [] },
        { id: "a", series: [] },
        { id: " ", series: [] },
        { id: "b", series: undefined as never },
        { id: "c", type: "nope" as never, series: [] },
      ]).map((level) => level.id),
    ).toEqual(["a", "c"]);
    expect(
      chartDrilldownLevels([{ id: "c", type: "nope" as never, series: [] }])[0]?.type,
    ).toBeUndefined();
    expect(chartDrilldownPath(levels, ["q1", "jan", "bad", "q2"])).toEqual(["q1", "jan"]);
    expect(chartDrilldownPath(levels, undefined)).toEqual([]);
  });

  it("marks points that open a level and writes it in the table", () => {
    const render = renderChart(base);
    expect(render.layout.marks.map((mark) => mark.drilldown)).toEqual(["q1", "q2"]);
    expect(render.table.rows[0]?.cells[0]?.attrs["data-ok-drilldown"]).toBe("q1");
    expect(render.drilldown?.path).toEqual([]);
    expect(render.drilldown?.text).toBe("");
    expect(render.drilldown?.tables.map((t) => [t.id, t.name, t.type])).toEqual([
      ["q1", "Q1", undefined],
      ["q2", "q2", "line"],
      ["jan", "January", undefined],
    ]);
    expect(chartDrilldownTarget(render.layout, [1])).toBe("q2");
    expect(chartDrilldownTarget(render.layout, [])).toBeUndefined();
    expect(chartDrilldownActive(render.layout, { kind: "index", index: 0 })).toBe("q1");
    expect(chartDrilldownActive(render.layout, { kind: "mark", mark: 1 })).toBe("q2");
    expect(chartDrilldownActive(render.layout, null)).toBeUndefined();
  });

  it("draws the last level of the path with its own type; the table stays the root's", () => {
    const render = renderChart({ ...base, drilldownPath: ["q2"], partLabels: {} });
    expect(render.data.type).toBe("line");
    expect(render.data.categories).toEqual(["Apr", "May"]);
    expect(render.table.rows.map((row) => row.header.text)).toEqual(["Q1", "Q2"]);
    expect(render.drilldown?.text).toBe("All › q2");
    const deep = renderChart({ ...base, drilldownPath: ["q1", "jan"] });
    expect(deep.data.categories).toEqual(["W1", "W2"]);
    expect(deep.drilldown?.text).toBe("All › Q1 › January");
    const named = renderChart({
      ...base,
      drilldownPath: ["q1"],
      partLabels: { drilldownRoot: "Year" } as never,
    });
    expect(named.drilldown?.text).toBe("Year › Q1");
  });

  it("writes the path as a root attribute and reads level tables back", () => {
    expect(chartTextAttributes({ drilldownPath: ["q1", "jan"] })).toEqual({
      "data-ok-drilldown-path": "q1; jan",
    });
    const root = document.createElement("figure");
    root.innerHTML = `<table data-ok-chart-data><caption>Main</caption><thead><tr><th>x</th><th>S</th></tr></thead><tbody><tr><th>Q1</th><td data-ok-drilldown="q1">7</td></tr></tbody></table>
      <table data-ok-chart-drilldown="q1" data-ok-type="line"><caption>Quarter one</caption><thead><tr><th>x</th><th>S</th></tr></thead><tbody><tr><th>Jan</th><td>3</td></tr></tbody></table>`;
    const read = readChartTable(root.querySelector("table") as HTMLTableElement, "category", "bar");
    expect(read.series[0]?.data[0]).toEqual({ y: 7, drilldown: "q1" });
    const tables = readChartDrilldownTables(root, "category", "bar");
    expect(tables).toEqual([
      {
        id: "q1",
        name: "Quarter one",
        type: "line",
        categories: ["Jan"],
        series: [{ name: "S", data: [3] }],
      },
    ]);
  });
});

describe("trellis panels", () => {
  const series = [
    { name: "North", data: [10, 40] },
    { name: "South", data: [5, 15] },
  ];

  it("splits by series on one nice shared domain, keeping series colors", () => {
    const panels = chartTrellisPanels({ series, categories: ["Jan", "Feb"] });
    expect(panels.map((panel) => panel.title)).toEqual(["North", "South"]);
    expect(panels[0]?.yMax).toBe(panels[1]?.yMax);
    expect(panels[0]?.yMin).toBe(0);
    expect(panels[0]?.yMax).toBeGreaterThanOrEqual(40);
    expect(panels[1]?.series[0]?.color).toBe("warning");
    expect(chartTrellisPanels({ series, colors: ["info", "error"] })[1]?.series[0]?.color).toBe(
      "error",
    );
  });

  it("splits by category and lets scales be independent", () => {
    const panels = chartTrellisPanels({
      series,
      categories: ["Jan", "Feb"],
      by: "category",
      scaleY: "independent",
    });
    expect(panels.map((panel) => panel.title)).toEqual(["Jan", "Feb"]);
    expect(panels[1]?.categories).toEqual(["North", "South"]);
    expect(panels[1]?.series[0]?.data).toEqual([40, 15]);
    expect(panels[0]?.yMax).toBeUndefined();
    expect(
      chartTrellisPanels({ series: [{ name: "Empty", data: [null] }] })[0]?.yMax,
    ).toBeUndefined();
    const dates = chartTrellisPanels({
      series,
      categories: [new Date(Date.UTC(2025, 0, 1))],
      by: "category",
    });
    expect(dates[0]?.title).toBe("2025-01-01");
  });
});

describe("drilldown and trellis edge cases", () => {
  it("drops levels whose id isn't a string", () => {
    expect(
      chartDrilldownLevels([
        { id: 7 as never, series: [] },
        null as never,
        { id: "ok", series: [] },
      ]).map((level) => level.id),
    ).toEqual(["ok"]);
  });

  it("reads level tables: no caption, no own type, the chart's type, an unknown type, shared rows", () => {
    const root = document.createElement("figure");
    const table = (attrs: string, caption = "") =>
      `<table data-ok-chart-drilldown${attrs}>${caption}<thead><tr><th>x</th><th>S</th></tr></thead><tbody><tr><th>1</th><td>1</td></tr></tbody></table>`;
    root.innerHTML = [
      table('="plain"'),
      table('="same" data-ok-type="bar"', "<caption>  </caption>"),
      table('="odd" data-ok-type="nope"'),
      table('="area" data-ok-type="area"', "<caption>Area</caption>"),
    ].join("");
    const tables = readChartDrilldownTables(root, "category", "bar");
    expect(tables.map((level) => [level.id, level.name, level.type])).toEqual([
      ["plain", undefined, undefined],
      ["same", undefined, undefined],
      ["odd", undefined, undefined],
      ["area", "Area", "area"],
    ]);
    expect(tables[0]?.categories).toEqual(["1"]);
    // Timeline rows sharing a category: the level has no categories, its points carry x.
    const timeline = document.createElement("figure");
    timeline.innerHTML = `<table data-ok-chart-drilldown="t"><thead><tr><th>Task</th><th colspan="2">Design</th></tr><tr><th data-ok-part="start">s</th><th data-ok-part="end">e</th></tr></thead><tbody><tr><th>A</th><td data-ok-value="2025-01-01">a</td><td data-ok-value="2025-01-20">b</td></tr><tr><th>A</th><td data-ok-value="2025-01-22">a</td><td data-ok-value="2025-01-30">b</td></tr></tbody></table>`;
    const shared = readChartDrilldownTables(timeline, "category", "timeline");
    expect(shared[0]?.categories).toBeUndefined();
    expect((shared[0]?.series[0]?.data[1] as { x: string } | undefined)?.x).toBe("A");
  });

  it("trellis by category reads [x, y] pairs, objects and ranges; gaps and short series are null", () => {
    const panels = chartTrellisPanels({
      series: [
        { name: "Pairs", data: [[0, 4] as never, [1, 8] as never] },
        { name: "Objects", data: [{ y: 6 } as never, { x: 1 } as never] },
        { name: "Ranges", data: [{ y: [2, 9] } as never] },
      ],
      categories: ["Jan", "Feb"],
      by: "category",
    });
    expect(panels[0]?.series[0]?.data).toEqual([4, 6, 2]);
    expect(panels[1]?.series[0]?.data).toEqual([8, null, null]);
    // By series, a range's high end counts toward the shared domain.
    const ranges = chartTrellisPanels({ series: [{ name: "R", data: [{ y: [2, 9] } as never] }] });
    expect(ranges[0]?.yMax).toBeGreaterThanOrEqual(9);
    // No categories: no panels.
    expect(chartTrellisPanels({ series: [{ name: "S", data: [1] }], by: "category" })).toEqual([]);
  });

  it("an all-zero shared domain still has a height", () => {
    const panels = chartTrellisPanels({ series: [{ name: "Flat", data: [0, 0] }] });
    expect(panels[0]?.yMin).toBe(0);
    expect(panels[0]?.yMax).toBeGreaterThan(0);
  });
});
