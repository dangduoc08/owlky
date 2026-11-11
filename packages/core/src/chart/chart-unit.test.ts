import { describe, expect, it } from "vitest";
import { chartAttributes } from "../anatomy/anatomy.js";
import { type ChartRenderInput, renderChart } from "./chart.js";
import { chartTooltip, nextChartActive } from "./chart-active.js";
import type { ChartNode } from "./chart-layout.js";
import {
  chartUnitPlacer,
  isChartUnitLayout,
  placeArc,
  placeColumns,
  placeGrouped,
  placePacked,
} from "./chart-unit-layouts.js";

/* Unit charts (roadmap 4.18.21): grouped, packed, columns, grid and arc placements. */

const base = { width: 400, height: 300, idPrefix: "t", type: "unit" as const };
const draw = (input: Partial<ChartRenderInput> = {}) =>
  renderChart({
    ...base,
    categories: ["A", "B"],
    series: [{ name: "Seats", data: [12, 6] }],
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
const BOX = { width: 400, height: 300 };

describe("unit placements", () => {
  it("groups blobs in columns, centered, with labels when asked", () => {
    const placed = placeGrouped([7, 3], ["A", "B"], BOX, {});
    expect(placed.cells).toHaveLength(10);
    expect(placed.titles).toBeUndefined();
    const [a] = placed.cells;
    expect(a?.x).toBeGreaterThan(0);
    expect(placed.cells.filter((cell) => cell.category === 1).every((c) => c.x > 200)).toBe(true);
    expect(placeGrouped([1, 1], ["A", "B"], BOX, { clusterLabels: true }).titles).toHaveLength(2);
    const sized = placeGrouped([3], ["A"], BOX, { size: 7 });
    expect(sized.cells[0]?.r).toBe(7);
    const spaced = placeGrouped([3], ["A"], BOX, { spacing: 4 });
    expect(spaced.cells[1]?.x).not.toEqual(placeGrouped([3], ["A"], BOX, {}).cells[1]?.x);
  });

  it("packs one blob, the smallest group first unless told otherwise", () => {
    const sorted = placePacked([5, 1], BOX, {});
    expect(sorted.cells[0]?.category).toBe(1);
    const plain = placePacked([5, 1], BOX, { disableSortByGroup: true });
    expect(plain.cells[0]?.category).toBe(0);
    expect(plain.cells).toHaveLength(6);
  });

  it("stacks columns from the bottom with the same dots across", () => {
    const placed = placeColumns([6, 3], ["A", "B"], BOX, {});
    const a = placed.cells.filter((cell) => cell.category === 0);
    expect(a).toHaveLength(6);
    const bottom = Math.max(...a.map((cell) => cell.y));
    expect(a[0]?.y).toBe(bottom);
    expect(placeColumns([6], ["A"], BOX, { clusterLabels: true }).titles).toHaveLength(1);
    expect(placeColumns([500], ["A"], BOX, {}).cells).toHaveLength(500);
  });

  it("seats an arc in rows, filled by category along the sweep", () => {
    const placed = placeArc([20, 10], BOX, {});
    expect(placed.cells).toHaveLength(30);
    expect(placed.cells.every((cell) => cell.y <= BOX.height)).toBe(true);
    const leftmost = [...placed.cells].sort((a, b) => a.x - b.x)[0];
    expect(leftmost?.category).toBe(0);
    const rows = placeArc([20, 10], BOX, { arcRows: 2 });
    const radii = new Set(
      rows.cells.map((cell) => Math.round(Math.hypot(cell.x - 200, cell.y - 296))),
    );
    expect(radii.size).toBe(2);
    const full = placeArc([10], BOX, { startAngle: 0, endAngle: 360, innerSize: 10 });
    expect(full.cells).toHaveLength(10);
    expect(placeArc([1000], BOX, {}).cells).toHaveLength(1000);
  });

  it("picks a placer and validates the layout", () => {
    expect(isChartUnitLayout("arc")).toBe(true);
    expect(isChartUnitLayout("bad")).toBe(false);
    for (const layout of ["packed", "columns", "grid", "arc", "grouped", "other"])
      expect(chartUnitPlacer(layout)([1], [1], ["A"], BOX, {}).cells).toHaveLength(1);
  });
});

describe("unit layout", () => {
  it("draws circles by default, one group per category, a category per tooltip", () => {
    const { data, layout, format, legend } = draw({ unitLayout: "grid" });
    expect(layout.mode).toBe("unit");
    expect(find(layout.nodes, "data-ok-chart-unit-cell")).toHaveLength(18);
    expect(find(layout.nodes, "data-ok-chart-unit-cell")[0]?.tag).toBe("circle");
    expect(find(layout.nodes, "data-ok-chart-series")[0]?.attrs["data-ok-type"]).toBe("unit");
    expect(legend?.map((item) => item.name)).toEqual(["A", "B"]);
    const active = nextChartActive(layout, null, "End") ?? null;
    expect(chartTooltip(data, layout, format, active)?.rows[0]?.value).toBe("6");
    expect(draw({ series: [{ name: "x", type: "line", data: [1] }] }).data.series[0]?.type).toBe(
      "unit",
    );
  });

  it("a square marker draws lattice cells as squares", () => {
    const { layout } = draw({ unitLayout: "grid", markerShape: "square", cellRadius: 3 });
    const [cell] = find(layout.nodes, "data-ok-chart-unit-cell");
    expect(cell?.tag).toBe("rect");
    expect(cell?.attrs["rx"]).toBe("3");
    expect(
      find(draw({ markerShape: "star" }).layout.nodes, "data-ok-chart-unit-cell")[0]?.attrs[
        "data-ok-shape"
      ],
    ).toBe("star");
  });

  it("uses unitValue, the arc's angles and labels, and writes its options", () => {
    expect(find(draw({ unitValue: 3 }).layout.nodes, "data-ok-chart-unit-cell")).toHaveLength(6);
    expect(
      find(draw({ clusterLabels: true }).layout.nodes, "data-ok-chart-unit-title"),
    ).toHaveLength(2);
    const arc = draw({
      unitLayout: "arc",
      innerSize: 20,
      startAngle: 0,
      endAngle: 180,
      arcRows: 3,
    });
    expect(find(arc.layout.nodes, "data-ok-chart-unit-cell")).toHaveLength(18);
    expect(
      chartAttributes({
        unitLayout: "packed",
        clusterLabels: true,
        disableSortByGroup: true,
        arcRows: 5,
      }),
    ).toMatchObject({
      "data-ok-unit-layout": "packed",
      "data-ok-cluster-labels": "",
      "data-ok-disable-sort-by-group": "",
      "data-ok-arc-rows": "5",
    });
  });
});
