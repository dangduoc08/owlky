import { describe, expect, it } from "vitest";
import { type ChartRenderInput, renderChart } from "./chart.js";
import type { ChartNode } from "./chart-layout.js";
import { type ChartSeries, readChartTable } from "./chart-model.js";

const rows: ChartSeries[] = [
  {
    name: "Design",
    data: [
      { x: "A", y: ["2025-01-01", "2025-01-20"] },
      { x: "B", y: ["2025-01-10", "2025-01-30"] },
    ],
  },
  { name: "Build", data: [{ x: "A", y: ["2025-01-12", "2025-02-05"] }] },
];
const base: ChartRenderInput = {
  type: "timeline",
  xType: "category",
  series: rows,
  width: 640,
  height: 320,
  idPrefix: "t",
};
const all = (nodes: readonly ChartNode[]): ChartNode[] =>
  nodes.flatMap((item) => [item, ...all(item.children ?? [])]);
const bars = (input: ChartRenderInput) =>
  all(renderChart(input).layout.nodes).filter((n) => n.attrs["data-ok-chart-bar"] !== undefined);
const ys = (input: ChartRenderInput) => bars(input).map((bar) => Number(bar.attrs["y"]));
const hs = (input: ChartRenderInput) => bars(input).map((bar) => Number(bar.attrs["height"]));

describe("timeline rows (4.18.67)", () => {
  it("gives each series a lane by default and one lane per row with group rows", () => {
    const [a, , c] = ys(base);
    expect(a).not.toBe(c);
    const [ga, , gc] = ys({ ...base, rangeBarGroupRows: true });
    expect(ga).toBe(gc);
    expect(hs({ ...base, rangeBarGroupRows: true })[0]).toBeGreaterThan(hs(base)[0] as number);
  });

  it("moves overlapping bars to their own lanes", () => {
    const input = { ...base, rangeBarGroupRows: true, disableRangeBarOverlap: true };
    const [a, b, c] = ys(input);
    const [ha, hb] = hs(input);
    expect(a).not.toBe(c);
    expect(ha).toBeLessThan(hs({ ...base, rangeBarGroupRows: true })[0] as number);
    // Team B has a single bar: the whole lane.
    expect(hb).toBeGreaterThan(ha as number);
    expect(b).toBeDefined();
  });

  it("keeps a free lane free: bars that don't overlap stay in one lane", () => {
    const series: ChartSeries[] = [
      {
        name: "Work",
        data: [
          { x: "A", y: ["2025-01-01", "2025-01-10"] },
          { x: "A", y: ["2025-01-10", "2025-01-20"] },
        ],
      },
    ];
    const [a, b] = ys({ ...base, series, disableRangeBarOverlap: true });
    expect(a).toBe(b);
  });

  it("reads tables with repeated row headers (bars sharing a row)", () => {
    const table = document.createElement("table");
    const write = renderChart(base).table;
    table.innerHTML = `<thead><tr><th>${write.head[0]?.text}</th></tr></thead><tbody></tbody>`;
    const head = table.tHead?.rows[0] as HTMLTableRowElement;
    head.insertAdjacentHTML("beforeend", `<th colspan="2">Design</th><th colspan="2">Build</th>`);
    table
      .querySelector("thead")
      ?.insertAdjacentHTML(
        "beforeend",
        `<tr><th data-ok-part="start">s</th><th data-ok-part="end">e</th><th data-ok-part="start">s</th><th data-ok-part="end">e</th></tr>`,
      );
    table.tBodies[0]?.insertAdjacentHTML(
      "beforeend",
      `<tr><th>A</th><td data-ok-value="2025-01-01">a</td><td data-ok-value="2025-01-20">b</td><td data-ok-value="2025-01-12">c</td><td data-ok-value="2025-02-05">d</td></tr>
       <tr><th>A</th><td data-ok-value="2025-01-02">a</td><td data-ok-value="2025-01-21">b</td><td></td><td></td></tr>`,
    );
    const read = readChartTable(table, "category", "timeline");
    expect(read.categories).toBeUndefined();
    expect(read.series[0]?.data).toHaveLength(2);
    expect(read.series[1]?.data).toHaveLength(1);
    expect((read.series[0]?.data[0] as { x: string } | undefined)?.x).toBe("A");
  });

  it("keeps the categories of tables without repeats", () => {
    const table = document.createElement("table");
    table.innerHTML =
      "<thead><tr><th>x</th><th>A</th></tr></thead><tbody><tr><th>a</th><td>1</td></tr><tr><th>b</th><td>2</td></tr></tbody>";
    expect(readChartTable(table, "category", "line").categories).toEqual(["a", "b"]);
  });
});

describe("hideZeroBarsWhenGrouped (4.18.67)", () => {
  const input: ChartRenderInput = {
    type: "bar",
    categories: ["A", "B"],
    series: [
      { name: "X", data: [10, 0] },
      { name: "Y", data: [0, 8] },
      { name: "Z", data: [5, null] },
    ],
    width: 640,
    height: 320,
    idPrefix: "t",
  };
  const firstX = (nodes: ChartNode[]) =>
    nodes.map((bar) => Number(/^M([\d.]+)/.exec(bar.attrs["d"] ?? "")?.[1]));

  it("closes up the other bars around the category's center", () => {
    const flat = firstX(bars(input));
    const closed = firstX(bars({ ...input, hideZeroBarsWhenGrouped: true }));
    expect(closed[0]).toBeGreaterThan(flat[0] as number);
    // Two bars left in A: they meet in the middle of the band.
    const layout = renderChart({ ...input, hideZeroBarsWhenGrouped: true }).layout;
    const center = layout.slots[0]?.pos as number;
    const width = layout.band * 0.4 * (1 / 3);
    expect(closed[0]).toBeCloseTo(center - width, 1);
  });

  it("leaves stacked charts and the off state alone", () => {
    expect(firstX(bars({ ...input, stacked: true, hideZeroBarsWhenGrouped: true }))).toEqual(
      firstX(bars({ ...input, stacked: true })),
    );
  });
});
