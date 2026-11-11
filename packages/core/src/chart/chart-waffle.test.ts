import { describe, expect, it } from "vitest";
import { chartAttributes } from "../anatomy/anatomy.js";
import { type ChartRenderInput, renderChart } from "./chart.js";
import { chartActiveAt, chartActiveNodes, chartTooltip, nextChartActive } from "./chart-active.js";
import type { ChartNode } from "./chart-layout.js";
import { chartMarkAt, chartSelectedNodes } from "./chart-select.js";
import { chartUnitAt, chartUnitCounts, placeUnitGrid } from "./chart-unit.js";

/* Waffle charts (roadmap 4.18.21): cell counts, the lattice, split tiles, cues and tooltips. */

const base = { width: 400, height: 300, idPrefix: "t", type: "waffle" as const };
const draw = (input: Partial<ChartRenderInput> = {}) =>
  renderChart({
    ...base,
    categories: ["A", "B", "C", "D"],
    series: [{ name: "Budget", data: [38, 27, 21, 14] }],
    total: 100,
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
const cellsOf = (layout: ReturnType<typeof draw>["layout"]) =>
  find(layout.nodes, "data-ok-chart-unit-cell");

describe("unit counts", () => {
  it("shares a total by the largest remainder, summing exactly", () => {
    expect(chartUnitCounts([1, 1, 1], { total: 10 })).toEqual([4, 3, 3]);
    expect(chartUnitCounts([38, 27, 21, 14], { total: 100 })).toEqual([38, 27, 21, 14]);
    const shares = chartUnitCounts([33, 33, 34], { total: 7 });
    expect(shares.reduce((sum, n) => sum + n, 0)).toBe(7);
    expect(chartUnitCounts([0, 0], { total: 10 })).toEqual([0, 0]);
  });

  it("divides by unitValue and caps at maxUnits", () => {
    expect(chartUnitCounts([12_000, 3000], { unitValue: 1000 })).toEqual([12, 3]);
    const capped = chartUnitCounts([100, 100], { maxUnits: 5 });
    expect(capped.reduce((sum, n) => sum + n, 0)).toBe(5);
    expect(chartUnitCounts([-5, 2], {})).toEqual([0, 2]);
  });
});

describe("waffle layout", () => {
  it("draws 100 square cells in rows from the bottom, each category in turn", () => {
    const { layout, legend, table } = draw();
    expect(layout.mode).toBe("unit");
    expect(cellsOf(layout)).toHaveLength(100);
    expect(find(layout.nodes, "data-ok-chart-unit-group")).toHaveLength(4);
    expect(cellsOf(layout)[0]?.tag).toBe("rect");
    expect(cellsOf(layout)[0]?.attrs["rx"]).toBe("2");
    const first = cellsOf(layout)[0] as ChartNode;
    const last = cellsOf(layout).at(-1) as ChartNode;
    expect(Number(first.attrs["y"])).toBeGreaterThan(Number(last.attrs["y"]));
    expect(legend?.map((item) => item.name)).toEqual(["A", "B", "C", "D"]);
    expect(table.rows[0]?.cells[0]?.attrs["data-ok-color"]).toBeDefined();
  });

  it("fills from the top, columns and cell options", () => {
    const top = draw({ fillFrom: "top" }).layout;
    const first = cellsOf(top)[0] as ChartNode;
    const last = cellsOf(top).at(-1) as ChartNode;
    expect(Number(first.attrs["y"])).toBeLessThan(Number(last.attrs["y"]));
    expect(
      new Set(cellsOf(draw({ columns: 20, cellRadius: 0 }).layout).map((c) => c.attrs["x"])).size,
    ).toBe(20);
    expect(cellsOf(draw({ cellRadius: 0 }).layout)[0]?.attrs["rx"]).toBe("0");
    const sized = placeUnitGrid([2], { width: 100, height: 100 }, { size: 3, spacing: 1 });
    expect(sized.cells[0]?.side).toBe(6);
  });

  it("without total, one cell per unit (or unitValue, capped by maxUnits)", () => {
    expect(
      cellsOf(draw({ total: undefined, series: [{ name: "x", data: [5, 3] }] }).layout),
    ).toHaveLength(8);
    expect(
      cellsOf(
        draw({ total: undefined, unitValue: 2, series: [{ name: "x", data: [5, 3] }] }).layout,
      ),
    ).toHaveLength(4);
    expect(
      cellsOf(
        draw({ total: undefined, maxUnits: 2, series: [{ name: "x", data: [5, 3] }] }).layout,
      ),
    ).toHaveLength(2);
  });

  it("split: one tile per category with track cells", () => {
    const { layout } = draw({
      split: true,
      total: 10,
      splitMax: 10,
      columns: 5,
      tileColumns: 2,
      trackColor: "info-light",
      categories: ["A", "B"],
      series: [{ name: "x", data: [3, 7] }],
    });
    expect(cellsOf(layout)).toHaveLength(10);
    const tracks = find(layout.nodes, "data-ok-chart-unit-track");
    expect(tracks).toHaveLength(10);
    expect(tracks[0]?.attrs["data-ok-color"]).toBe("info-light");
    expect(find(layout.nodes, "data-ok-chart-unit-title").map((t) => t.text)).toEqual(["A", "B"]);
    const auto = draw({
      split: true,
      series: [{ name: "x", data: [2, 4, 1, 3, 5] }],
      categories: ["a", "b", "c", "d", "e"],
    });
    expect(find(auto.layout.nodes, "data-ok-chart-unit-track").length).toBeGreaterThan(0);
  });

  it("hides categories and reshares the cells; shapes tell them apart", () => {
    const { layout, legend } = draw({ hidden: [1] });
    expect(cellsOf(layout)).toHaveLength(100);
    expect(find(layout.nodes, "data-ok-chart-unit-group")).toHaveLength(3);
    expect(legend?.[1]?.hidden).toBe(true);
    const cued = draw({ colorBlindMode: true });
    expect(cued.legend?.map((item) => item.shape)).toEqual([
      "circle",
      "square",
      "triangle",
      "diamond",
    ]);
    const group = find(cued.layout.nodes, "data-ok-chart-unit-group")[2];
    expect(group?.children?.[0]?.attrs["data-ok-shape"]).toBe("triangle");
    expect(
      find(draw({ markerShape: "circle" }).layout.nodes, "data-ok-chart-unit-cell")[0]?.tag,
    ).toBe("circle");
  });

  it("writes the options as attributes", () => {
    expect(
      chartAttributes({
        columns: 8,
        fillFrom: "top",
        split: true,
        tileColumns: 2,
        splitMax: 50,
        trackColor: "info",
        unitValue: 10,
        maxUnits: 200,
        cellRadius: 1,
      }),
    ).toMatchObject({
      "data-ok-columns": "8",
      "data-ok-fill-from": "top",
      "data-ok-split": "",
      "data-ok-tile-columns": "2",
      "data-ok-split-max": "50",
      "data-ok-track-color": "info",
      "data-ok-unit-value": "10",
      "data-ok-max-units": "200",
      "data-ok-cell-radius": "1",
    });
  });
});

describe("waffle keyboard, pointer and tooltip", () => {
  it("moves by category, the pointer finds the category, and it reads one row", () => {
    const { data, layout, format } = draw();
    const active = nextChartActive(layout, null, "ArrowRight");
    expect(active).toEqual({ kind: "index", index: 0 });
    const tip = chartTooltip(data, layout, format, active ?? null);
    expect(tip?.title).toBe("A");
    expect(tip?.rows).toEqual([{ name: "Budget", value: "38", color: "primary-dark" }]);
    const nodes = chartActiveNodes(layout, active ?? null);
    expect(nodes.under).toEqual([]);
    expect(nodes.over[0]?.attrs["data-ok-chart-active-node"]).toBe("");
    const [cell] = find(layout.nodes, "data-ok-chart-unit-group")[3]?.children ?? [];
    const x = Number(cell?.attrs["x"]) + 2;
    const y = Number(cell?.attrs["y"]) + 2;
    expect(chartActiveAt(layout, x, y)).toEqual({ kind: "index", index: 3 });
    expect(chartActiveAt(layout, 1, 1)).toBeNull();
  });

  it("selects by click and draws the category's outline", () => {
    const { layout } = draw();
    const [cell] = find(layout.nodes, "data-ok-chart-unit-group")[2]?.children ?? [];
    expect(chartMarkAt(layout, Number(cell?.attrs["x"]) + 1, Number(cell?.attrs["y"]) + 1)).toBe(2);
    const selected = chartSelectedNodes(layout, [{ seriesIndex: 0, dataPointIndex: 2 }]);
    expect(selected[0]?.children?.[0]?.attrs["d"]).toContain("h");
  });

  it("hit-tests rounds, squares, tracks and nothing", () => {
    expect(chartUnitAt([{ x: 10, y: 10, r: 3, category: 2 }], 11, 11)).toBe(2);
    expect(chartUnitAt([{ x: 10, y: 10, r: 3, category: 2 }], 20, 20)).toBeNull();
    expect(
      chartUnitAt([{ x: 10, y: 10, r: 3, side: 6, category: 1, track: true }], 10, 10),
    ).toBeNull();
    expect(chartUnitAt(undefined, 10, 10)).toBeNull();
    const { layout } = draw({ series: [{ name: "x", data: [0, 0, 0, 0] }] });
    expect(layout.marks[0]?.px).toBe(200);
    expect(chartActiveNodes(layout, { kind: "index", index: 9 }).over).toEqual([]);
  });
});
