import { describe, expect, it } from "vitest";
import { chartAttributes } from "../anatomy/anatomy.js";
import { type ChartRenderInput, renderChart } from "./chart.js";
import { chartActiveAt, chartActiveNodes, chartTooltip, nextChartActive } from "./chart-active.js";
import {
  type ChartHierarchyNode,
  chartDrillUp,
  chartHierarchyAction,
  chartTreeMarkOf,
} from "./chart-hierarchy.js";
import type { ChartLayout, ChartNode } from "./chart-layout.js";

/* Icicle charts (ADR-0058, roadmap 4.18.21): partition bands, directions, drill and keyboard. */

const base = { width: 400, height: 300, idPrefix: "t", type: "icicle" as const };
const draw = (
  input: Omit<ChartRenderInput, "width" | "height" | "idPrefix" | "type"> & {
    width?: number;
    height?: number;
  },
) => renderChart({ ...base, ...input });

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

const DATA: ChartHierarchyNode = {
  name: "Root",
  children: [
    {
      name: "A",
      children: [
        { name: "A1", value: 30 },
        { name: "A2", value: 10 },
      ],
    },
    { name: "B", value: 60 },
  ],
};
const cell = (layout: ChartLayout, id: string) => {
  const hit = layout.marks[chartTreeMarkOf(layout, id) as number]?.tree?.hit;
  if (hit?.kind !== "rect") throw new Error("not a cell");
  return hit;
};

describe("icicle layout", () => {
  it("lays out one band per level from the top, cells by value", () => {
    const { layout, table } = draw({ hierarchy: DATA });
    expect(table.rows).toHaveLength(5);
    expect(layout.marks.map((mark) => mark.tree?.id)).toEqual(["Root", "A", "A1", "A2", "B"]);
    expect(cell(layout, "Root")).toEqual({ kind: "rect", x: 0, y: 0, width: 400, height: 100 });
    expect(cell(layout, "A")).toEqual({ kind: "rect", x: 0, y: 100, width: 160, height: 100 });
    expect(cell(layout, "B")).toEqual({ kind: "rect", x: 160, y: 100, width: 240, height: 100 });
    expect(cell(layout, "A2")).toEqual({ kind: "rect", x: 120, y: 200, width: 40, height: 100 });
    const cells = find(layout.nodes, "data-ok-chart-icicle-cell");
    expect(cells).toHaveLength(5);
    expect(cells[0]?.attrs["stroke-width"]).toBe("1");
    expect(markAxis(layout)).toBe("down");
    expect(find(layout.nodes, "data-ok-chart-partition-label").map((n) => n.text)).toEqual([
      "Root",
      "A",
      "A1",
      "A2",
      "B",
    ]);
  });

  it("extends leaves on request and draws from the other sides", () => {
    expect(cell(draw({ hierarchy: DATA, leaf: "extend" }).layout, "B").height).toBe(200);
    const bottom = draw({ hierarchy: DATA, direction: "bottom" }).layout;
    expect(cell(bottom, "Root").y).toBe(200);
    expect(markAxis(bottom)).toBe("up");
    const left = draw({ hierarchy: DATA, direction: "left" }).layout;
    expect(cell(left, "Root")).toEqual({ kind: "rect", x: 0, y: 0, width: 133.33, height: 300 });
    expect(markAxis(left)).toBe("right");
    const right = draw({ hierarchy: DATA, direction: "right" }).layout;
    expect(cell(right, "Root").x).toBe(266.67);
    expect(markAxis(right)).toBe("left");
    // Radial is a tree layout: icicles draw from the top.
    expect(cell(draw({ hierarchy: DATA, direction: "radial" }).layout, "Root").y).toBe(0);
  });

  it("labels cells with room, values with data labels", () => {
    const { layout } = draw({ hierarchy: DATA, dataLabels: true, width: 100 });
    const labels = find(layout.nodes, "data-ok-chart-partition-label").map((n) => n.text);
    expect(labels).toContain("B 60");
    // A2 is 10px wide: no label.
    expect(labels.some((text) => text?.startsWith("A2"))).toBe(false);
  });

  it("drills into a branch, keeping its ancestors (value) or making it the top (both)", () => {
    const { layout, data, format } = draw({ hierarchy: DATA, drillNode: "A" });
    expect(layout.marks.map((mark) => mark.tree?.id)).toEqual(["Root", "A", "A1", "A2"]);
    expect(cell(layout, "A")).toEqual({ kind: "rect", x: 0, y: 100, width: 400, height: 100 });
    expect(cell(layout, "A1").width).toBe(300);
    // The ancestor zooms to itself, the drilled node out.
    expect(chartHierarchyAction(layout, 0)).toEqual({
      kind: "drill",
      id: "Root",
      path: ["Root"],
      focus: "Root",
    });
    expect(chartHierarchyAction(layout, 1)).toEqual({
      kind: "drill",
      id: "Root",
      path: ["Root"],
      focus: "A",
    });
    expect(chartDrillUp(layout)?.id).toBe("Root");
    expect(chartTooltip(data, layout, format, { kind: "mark", mark: 2 })?.title).toBe(
      "Root › A › A1",
    );
    const both = draw({ hierarchy: DATA, drillNode: "A", zoomType: "both" }).layout;
    expect(both.marks.map((mark) => mark.tree?.id)).toEqual(["A", "A1", "A2"]);
    expect(cell(both, "A")).toEqual({ kind: "rect", x: 0, y: 0, width: 400, height: 150 });
    expect(both.hierarchy).toEqual({
      type: "icicle",
      drill: "A",
      up: "Root",
      path: ["Root", "A"],
      drillable: true,
    });
  });
});

describe("icicle interaction", () => {
  const { layout } = draw({ hierarchy: DATA });
  const key = (from: string, name: string) => {
    const next = nextChartActive(
      layout,
      { kind: "mark", mark: chartTreeMarkOf(layout, from) as number },
      name,
    );
    return next?.kind === "mark" ? layout.marks[next.mark]?.tree?.id : next;
  };

  it("walks down to children, up to parents and across a level", () => {
    expect(key("Root", "ArrowDown")).toBe("A");
    expect(key("A", "ArrowRight")).toBe("B");
    expect(key("A2", "ArrowUp")).toBe("A");
    expect(key("A1", "ArrowRight")).toBe("A2");
  });

  it("finds cells under the pointer and outlines them", () => {
    expect(chartActiveAt(layout, 300, 150)).toEqual({
      kind: "mark",
      mark: chartTreeMarkOf(layout, "B"),
    });
    expect(chartActiveAt(layout, 300, 250)).toBeNull();
    const nodes = chartActiveNodes(layout, { kind: "mark", mark: 0 });
    expect(nodes.over[0]?.attrs).toMatchObject({
      x: "1",
      y: "1",
      width: "398",
      height: "98",
      "data-ok-chart-active-node": "",
    });
  });

  it("writes zoomType and direction as attributes", () => {
    expect(chartAttributes({ type: "icicle", zoomType: "both", direction: "left" })).toMatchObject({
      "data-ok-type": "icicle",
      "data-ok-zoom-type": "both",
      "data-ok-direction": "left",
    });
  });
});

function markAxis(layout: ChartLayout) {
  return layout.marks[0]?.tree?.axis;
}
