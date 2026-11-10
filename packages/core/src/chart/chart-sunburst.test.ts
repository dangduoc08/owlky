import { describe, expect, it } from "vitest";
import { chartAttributes } from "../anatomy/anatomy.js";
import { type ChartRenderInput, renderChart } from "./chart.js";
import { chartActiveAt, chartActiveNodes, chartTooltip, nextChartActive } from "./chart-active.js";
import {
  type ChartHierarchyNode,
  chartDrillUp,
  chartHierarchyAction,
  chartTreeMarkOf,
  onChartTreeMark,
} from "./chart-hierarchy.js";
import type { ChartLayout, ChartNode } from "./chart-layout.js";
import { chartTextAttributes } from "./chart-text.js";

/* Sunburst charts (ADR-0058, roadmap 4.18.21): partition rings, labels, drill and keyboard. */

const base = { width: 400, height: 400, idPrefix: "t", type: "sunburst" as const };
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

const DATA: ChartHierarchyNode[] = [
  {
    name: "A",
    children: [
      { name: "A1", value: 30 },
      {
        name: "A2",
        children: [
          { name: "A2a", value: 10 },
          { name: "A2b", value: 10 },
        ],
      },
    ],
  },
  { name: "B", value: 50 },
];
const markOf = (layout: ChartLayout, id: string) =>
  layout.marks[chartTreeMarkOf(layout, id) as number] as ChartLayout["marks"][number];
const hit = (layout: ChartLayout, id: string) => {
  const tree = markOf(layout, id).tree;
  if (tree?.hit.kind !== "arc") throw new Error("not an arc");
  return tree.hit;
};

describe("sunburst layout", () => {
  it("gives each node an arc of its parent's turn by value, one ring per level", () => {
    const { layout, table, legend } = draw({ hierarchy: DATA });
    expect(layout.mode).toBe("tree");
    expect(legend).toBeNull();
    expect(table.rows).toHaveLength(6);
    expect(layout.marks.map((mark) => mark.tree?.id)).toEqual(["A", "A1", "A2", "A2a", "A2b", "B"]);
    const a = hit(layout, "A");
    const b = hit(layout, "B");
    expect([a.start, a.end, b.start, b.end]).toEqual([0, 180, 180, 360]);
    expect(hit(layout, "A1").end).toBe(108);
    // The 15% hole, then three levels of rings; the leaf B extends to the edge.
    expect(a.inner).toBeCloseTo(198 * 0.15, 1);
    expect(b.outer).toBe(198);
    expect(hit(layout, "A1").outer).toBe(198);
    expect(hit(layout, "A2").outer).toBeLessThan(198);
    const arcs = find(layout.nodes, "data-ok-chart-arc");
    expect(arcs).toHaveLength(6);
    expect(arcs[0]?.attrs["stroke-width"]).toBe("1");
    // Deeper levels are paler (the tint), colors start at the roots.
    expect(arcs.map((arc) => arc.attrs["fill-opacity"])).toEqual([
      "1",
      "0.86",
      "0.86",
      "0.72",
      "0.72",
      "1",
    ]);
    expect(arcs.map((arc) => arc.attrs["data-ok-color"])).toEqual([
      "primary-dark",
      "primary-dark",
      "primary-dark",
      "primary-dark",
      "primary-dark",
      "warning",
    ]);
    expect(layout.hierarchy).toEqual({
      type: "sunburst",
      drill: null,
      path: [],
      drillable: true,
    });
  });

  it("stops shallow leaves, sets the hole, the gaps and the tint, and fits half turns", () => {
    const { layout } = draw({ hierarchy: DATA, leaf: "stop", innerSize: 0, spacing: 3, tint: 0 });
    expect(hit(layout, "A").inner).toBe(0);
    expect(hit(layout, "B").outer).toBeLessThan(198);
    const arcs = find(layout.nodes, "data-ok-chart-arc");
    expect(arcs.every((arc) => arc.attrs["stroke-width"] === "3")).toBe(true);
    expect(arcs.every((arc) => arc.attrs["fill-opacity"] === "1")).toBe(true);
    // A half turn fills the width and sits on the bottom edge.
    const half = draw({ hierarchy: DATA, startAngle: -90, endAngle: 90, height: 200 }).layout;
    const h = hit(half, "A");
    expect(h.cx).toBe(200);
    expect(h.cy).toBeGreaterThan(190);
    expect([h.start, hit(half, "B").end]).toEqual([-90, 90]);
  });

  it("labels arcs that have room, radially or along the ring, with values on request", () => {
    const { layout } = draw({ hierarchy: DATA, dataLabels: true });
    const labels = find(layout.nodes, "data-ok-chart-partition-label");
    expect(labels.map((n) => n.text)).toContain("B 50");
    expect(labels.every((n) => /^rotate\(/.test(n.attrs["transform"] ?? ""))).toBe(true);
    expect(labels.map((n) => n.attrs["data-ok-chart-partition-label"])).toContain("inside");
    // Tiny charts and pale shades: shorter or no labels, primary text.
    const small = draw({ hierarchy: DATA, width: 80, height: 80 }).layout;
    expect(find(small.nodes, "data-ok-chart-partition-label").length).toBeLessThan(labels.length);
    const pale = draw({ hierarchy: DATA, tint: 0.5 }).layout;
    expect(
      find(pale.nodes, "data-ok-chart-partition-label").map(
        (n) => n.attrs["data-ok-chart-partition-label"],
      ),
    ).toContain("plain");
    expect(draw({ hierarchy: [] }).layout.marks).toEqual([]);
  });

  it("drills into a node: its disc in the center, its children around it", () => {
    const { layout, format, data } = draw({ hierarchy: DATA, drillNode: "A2" });
    expect(layout.marks.map((mark) => mark.tree?.id)).toEqual(["A2", "A2a", "A2b"]);
    const center = hit(layout, "A2");
    expect([center.inner, center.outer]).toEqual([0, 29.7]);
    expect(hit(layout, "A2a").inner).toBe(29.7);
    expect(layout.hierarchy).toEqual({
      type: "sunburst",
      drill: "A2",
      up: "A",
      path: ["A", "A2"],
      drillable: true,
    });
    const labels = find(layout.nodes, "data-ok-chart-partition-label");
    expect(labels[0]?.text).toBe("A2");
    expect(labels[0]?.attrs["transform"]).toBeUndefined();
    // The center goes up a level; Escape too.
    expect(chartHierarchyAction(layout, 0)).toEqual({
      kind: "drill",
      id: "A",
      path: ["A"],
      focus: "A2",
    });
    expect(chartDrillUp(layout)).toEqual({ kind: "drill", id: "A", path: ["A"], focus: "A2" });
    const top = draw({ hierarchy: DATA, drillNode: "A" }).layout;
    expect(chartDrillUp(top)).toEqual({ kind: "drill", id: null, path: [], focus: "A" });
    // Leaves and unknown ids are no drill.
    expect(draw({ hierarchy: DATA, drillNode: "B" }).layout.hierarchy?.drill).toBeNull();
    expect(draw({ hierarchy: DATA, drillNode: "nope" }).layout.marks).toHaveLength(6);
    // Its tooltip has the path.
    expect(chartTooltip(data, layout, format, { kind: "mark", mark: 1 })?.title).toBe(
      "A › A2 › A2a",
    );
  });

  it("drills in on parents (not leaves) unless zoom on click is off", () => {
    const { layout } = draw({ hierarchy: DATA });
    expect(chartHierarchyAction(layout, chartTreeMarkOf(layout, "A2"))).toEqual({
      kind: "drill",
      id: "A2",
      path: ["A", "A2"],
      focus: "A2",
    });
    expect(chartHierarchyAction(layout, chartTreeMarkOf(layout, "B"))).toBeNull();
    const off = draw({ hierarchy: DATA, disableZoomOnClick: true, drillNode: "A" }).layout;
    expect(off.hierarchy?.drillable).toBe(false);
    expect(chartHierarchyAction(off, 0)).toBeNull();
  });
});

describe("sunburst interaction", () => {
  const { layout } = draw({ hierarchy: DATA });
  const key = (from: string | null, name: string) => {
    const next = nextChartActive(
      layout,
      from === null ? null : { kind: "mark", mark: chartTreeMarkOf(layout, from) as number },
      name,
    );
    return next?.kind === "mark" ? layout.marks[next.mark]?.tree?.id : next;
  };

  it("walks outward, inward and around the rings", () => {
    expect(key(null, "ArrowRight")).toBe("A");
    expect(key("A", "ArrowRight")).toBe("A1");
    expect(key("A1", "ArrowLeft")).toBe("A");
    expect(key("A", "ArrowDown")).toBe("B");
    expect(key("A1", "ArrowDown")).toBe("A2");
    expect(key("B", "ArrowUp")).toBe("A");
    expect(key("A", "End")).toBe("B");
  });

  it("finds arcs under the pointer and outlines them", () => {
    const b = hit(layout, "B");
    // Left of the center, in B's ring.
    expect(chartActiveAt(layout, 200 - (b.inner + 10), 200)).toEqual({
      kind: "mark",
      mark: chartTreeMarkOf(layout, "B"),
    });
    expect(chartActiveAt(layout, 200, 200)).toBeNull();
    expect(chartActiveAt(layout, 1, 1)).toBeNull();
    const tree = markOf(layout, "A").tree as NonNullable<ChartLayout["marks"][number]["tree"]>;
    expect(onChartTreeMark(tree, 200 + b.inner + 10, 200)).toBe(true);
    expect(
      onChartTreeMark({ ...tree, hit: { ...hit(layout, "A"), start: 0, end: 360 } }, 160, 200),
    ).toBe(true);
    const nodes = chartActiveNodes(layout, { kind: "mark", mark: 0 });
    expect(nodes.over[0]?.attrs["data-ok-chart-active-node"]).toBe("");
    expect(nodes.over[0]?.tag).toBe("path");
  });

  it("writes its options and the drilled node as attributes", () => {
    expect(
      chartAttributes({
        type: "sunburst",
        innerSize: 30,
        spacing: 2,
        leaf: "stop",
        tint: 0.2,
        disableZoomOnClick: true,
      }),
    ).toMatchObject({
      "data-ok-type": "sunburst",
      "data-ok-inner-size": "30",
      "data-ok-spacing": "2",
      "data-ok-leaf": "stop",
      "data-ok-tint": "0.2",
      "data-ok-disable-zoom-on-click": "",
    });
    expect(chartTextAttributes({ drillNode: "Storage" })).toEqual({
      "data-ok-drill-node": "Storage",
    });
    expect(chartTextAttributes({ drillNode: null })).toEqual({});
  });
});
