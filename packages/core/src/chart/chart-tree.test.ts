import { describe, expect, it } from "vitest";
import { chartAttributes } from "../anatomy/anatomy.js";
import { type ChartRenderInput, renderChart } from "./chart.js";
import { chartActiveAt, chartActiveNodes, chartTooltip, nextChartActive } from "./chart-active.js";
import { chartFormat } from "./chart-format.js";
import {
  type ChartHierarchyNode,
  chartDrillUp,
  chartHierarchy,
  chartHierarchyAction,
  chartHierarchyIndex,
  chartHierarchyPath,
  chartHierarchyTable,
  chartTreeMarkOf,
  isHierarchyChart,
  nextChartTreeMark,
  readChartHierarchyTable,
  toggleChartCollapsed,
} from "./chart-hierarchy.js";
import type { ChartLayout, ChartNode } from "./chart-layout.js";
import { chartData } from "./chart-model.js";
import { chartActiveMarks, chartMarkAt, chartSelectedNodes } from "./chart-select.js";
import { chartTextAttributes } from "./chart-text.js";

/* Tree charts (ADR-0058, roadmap 4.18.7): hierarchy model, tidy / cluster / radial layouts,
   keyboard over the hierarchy, collapse and the nodes table. */

const base = { width: 600, height: 320, idPrefix: "t", type: "tree" as const };
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

const TREE: ChartHierarchyNode = {
  name: "Root",
  children: [
    {
      name: "A",
      children: [
        { name: "A1", value: 2 },
        { name: "A2", value: 3 },
      ],
    },
    { name: "B", children: [{ name: "B1", value: 4 }] },
    { name: "C", value: 1 },
  ],
};
const ids = (layout: ChartLayout) => layout.marks.map((mark) => mark.tree?.id);
const markOf = (layout: ChartLayout, id: string) =>
  layout.marks.find((mark) => mark.tree?.id === id) as ChartLayout["marks"][number];

describe("chart hierarchy model", () => {
  it("normalizes nested nodes in preorder with sums, depths and branch colors", () => {
    const h = chartHierarchy({ hierarchy: TREE });
    expect(h.items.map((item) => item.id)).toEqual(["Root", "A", "A1", "A2", "B", "B1", "C"]);
    expect(h.items.map((item) => item.value)).toEqual([10, 5, 2, 3, 4, 4, 1]);
    expect(h.items.map((item) => item.depth)).toEqual([0, 1, 2, 2, 1, 2, 1]);
    expect(h.roots).toEqual([0]);
    expect(h.hasValues).toBe(true);
    // A single root: palette colors start at its children; descendants inherit.
    expect(h.items.map((item) => item.color)).toEqual([
      "primary-dark",
      "warning",
      "warning",
      "warning",
      "info",
      "info",
      "error",
    ]);
    expect(chartHierarchyPath(h, 5)).toEqual([0, 4, 5]);
    expect(chartHierarchyIndex(h, "B1")).toBe(5);
    expect(chartHierarchyIndex(h, null)).toBe(-1);
  });

  it("accepts ApexCharts' x / y, several roots, own colors and repeated names", () => {
    const h = chartHierarchy({
      colors: ["success"],
      hierarchy: [
        {
          x: "One",
          children: [
            { x: "Other", y: "2" },
            { x: "Other", y: 3, color: "error" },
          ],
        },
        { x: "Two", y: -4 },
        "bad" as unknown as ChartHierarchyNode,
      ],
    });
    expect(h.items.map((item) => item.id)).toEqual(["One", "Other", "Other-2", "Two"]);
    expect(h.items.map((item) => item.value)).toEqual([5, 2, 3, 0]);
    expect(h.items.map((item) => item.color)).toEqual(["success", "success", "error", "warning"]);
    expect(h.roots).toEqual([0, 3]);
    // No values at all: every leaf counts one.
    const plain = chartHierarchy({ hierarchy: { name: "r", children: [{ name: "a" }, {}] } });
    expect(plain.items.map((item) => item.value)).toEqual([2, 1, 1]);
    expect(plain.hasValues).toBe(false);
    expect(chartHierarchy({}).items).toEqual([]);
  });

  it("caps depth and the number of nodes", () => {
    let deep: ChartHierarchyNode = { name: "leaf" };
    for (let i = 0; i < 80; i++) deep = { name: `n${i}`, children: [deep] };
    expect(chartHierarchy({ hierarchy: deep }).items).toHaveLength(64);
    const wide = {
      name: "w",
      children: Array.from({ length: 6000 }, (_, i) => ({ name: `${i}` })),
    };
    expect(chartHierarchy({ hierarchy: wide }).items).toHaveLength(5000);
  });

  it("writes one table row per node and reads it back", () => {
    const h = chartHierarchy({
      hierarchy: {
        id: "root",
        name: "Root",
        children: [{ name: "Leaf", value: 1200, color: "info" }, { name: "Leaf" }],
      },
    });
    const table = chartHierarchyTable(h, chartFormat(chartData({ type: "tree", series: [] })));
    expect(table.head.map((cell) => cell.attrs["data-ok-part"])).toEqual(["name", "parent", "y"]);
    expect(table.rows.map((row) => [row.header, ...row.cells])).toEqual([
      [
        { text: "Root", attrs: { "data-ok-value": "root", "data-ok-color": "primary-dark" } },
        { text: "", attrs: {} },
        { text: "1,200", attrs: { "data-ok-value": "1200" } },
      ],
      [
        { text: "Leaf", attrs: { "data-ok-color": "info" } },
        { text: "Root", attrs: { "data-ok-value": "root" } },
        { text: "1,200", attrs: { "data-ok-value": "1200" } },
      ],
      [
        { text: "Leaf", attrs: { "data-ok-value": "Leaf-2", "data-ok-color": "info" } },
        { text: "Root", attrs: { "data-ok-value": "root" } },
        { text: "0", attrs: {} },
      ],
    ]);
    const element = document.createElement("table");
    const head = element.createTHead().insertRow();
    for (const cell of table.head) {
      const th = document.createElement("th");
      th.textContent = cell.attrs["data-ok-part"] === "parent" ? "Reports to" : cell.text;
      for (const [k, v] of Object.entries(cell.attrs)) th.setAttribute(k, v);
      head.append(th);
    }
    const body = element.createTBody();
    for (const row of table.rows) {
      const tr = body.insertRow();
      for (const cell of [row.header, ...row.cells]) {
        const td = tr.insertCell();
        td.textContent = cell.text;
        for (const [k, v] of Object.entries(cell.attrs)) td.setAttribute(k, v);
      }
    }
    // An unknown parent makes a root; an empty row is skipped.
    const orphan = body.insertRow();
    orphan.insertCell().textContent = "Orphan";
    orphan.insertCell().textContent = "Nobody";
    body.insertRow().insertCell();
    const read = readChartHierarchyTable(element);
    expect(read.partLabels).toEqual({ name: "Name", parent: "Reports to", y: "Value" });
    expect(read.hierarchy.map((node) => node.name)).toEqual(["Root", "Orphan"]);
    const again = chartHierarchy({ hierarchy: read.hierarchy.slice(0, 1) });
    expect(again.items.map((item) => [item.id, item.value, item.color])).toEqual(
      h.items.map((item) => [item.id, item.value, item.color]),
    );
    // Without a values column, the parent column is the second one.
    const plain = document.createElement("table");
    plain.createTBody().insertRow().insertCell().textContent = "Solo";
    expect(readChartHierarchyTable(plain).hierarchy).toEqual([
      { id: "Solo", name: "Solo", children: [] },
    ]);
  });

  it("maps drill actions of marks and the drill state", () => {
    const { layout } = draw({ hierarchy: TREE });
    expect(chartDrillUp(layout)).toBeNull();
    const tree = layout.marks[1]?.tree as NonNullable<ChartLayout["marks"][number]["tree"]>;
    const drilled: ChartLayout = {
      ...layout,
      hierarchy: { type: "tree", drill: "A", up: null, path: ["Root", "A"], drillable: true },
      marks: [
        {
          ...(layout.marks[0] as ChartLayout["marks"][number]),
          tree: { ...tree, id: "B", action: "in" },
        },
        { ...(layout.marks[1] as ChartLayout["marks"][number]), tree: { ...tree, action: "out" } },
      ],
    };
    expect(chartHierarchyAction(drilled, 0)).toEqual({
      kind: "drill",
      id: "B",
      path: [],
      focus: "B",
    });
    expect(chartHierarchyAction(drilled, 1)).toEqual({
      kind: "drill",
      id: null,
      path: [],
      focus: "A",
    });
    expect(chartDrillUp(drilled)).toEqual({ kind: "drill", id: null, path: [], focus: "A" });
    expect(chartHierarchyAction({ ...drilled, hierarchy: undefined }, 1)).toEqual({
      kind: "drill",
      id: null,
      path: [],
      focus: "A",
    });
  });

  it("knows its types and toggles collapsed ids", () => {
    expect(isHierarchyChart("tree")).toBe(true);
    expect(isHierarchyChart("bar")).toBe(false);
    expect(toggleChartCollapsed(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleChartCollapsed(["a", "b"], "a")).toEqual(["b"]);
  });
});

describe("tree layout", () => {
  it("lays out a tidy tree from the top: parents centered over their children", () => {
    const { layout, table, legend, zoomable } = draw({ hierarchy: TREE });
    expect(layout.mode).toBe("tree");
    expect(legend).toBeNull();
    expect(zoomable).toBe(false);
    expect(table.rows).toHaveLength(7);
    expect(ids(layout)).toEqual(["Root", "A", "A1", "A2", "B", "B1", "C"]);
    const [root, a, a1, a2] = layout.marks;
    expect(root?.py).toBeLessThan(a?.py as number);
    expect(a?.px).toBeCloseTo(((a1?.px as number) + (a2?.px as number)) / 2, 1);
    // Siblings never overlap: one level's nodes are spread apart.
    const level = layout.marks.filter((mark) => mark.tree?.depth === 2).map((mark) => mark.px);
    expect([...level].sort((x, y) => x - y)).toEqual(level);
    expect(find(layout.nodes, "data-ok-chart-tree-link")).toHaveLength(6);
    expect(find(layout.nodes, "data-ok-chart-tree-node")).toHaveLength(7);
    expect(find(layout.nodes, "data-ok-chart-node-label").map((n) => n.text)).toContain("Root");
    // Orthogonal links by default: vertical, horizontal, vertical.
    expect(find(layout.nodes, "data-ok-chart-tree-link")[0]?.attrs["d"]).toMatch(
      /^M[\d.,]+V[\d.]+H[\d.]+V/,
    );
  });

  it("separates the subtrees of cousins more than siblings (Reingold–Tilford)", () => {
    const { layout } = draw({
      width: 1000,
      hierarchy: {
        name: "r",
        children: [
          { name: "a", children: [{ name: "a1" }, { name: "a2" }] },
          { name: "b", children: [{ name: "b1" }, { name: "b2" }] },
        ],
      },
    });
    const x = (id: string) => markOf(layout, id).px;
    const sibling = x("a2") - x("a1");
    expect(x("b1") - x("a2")).toBeCloseTo(sibling * 2, 0);
    expect(x("r")).toBeCloseTo((x("a") + x("b")) / 2, 1);
  });

  it("puts every leaf on the last level in a dendrogram (cluster)", () => {
    const { layout } = draw({ hierarchy: TREE, layoutType: "cluster" });
    const y = (id: string) => markOf(layout, id).py;
    expect(y("C")).toBe(y("A1"));
    expect(y("A")).toBeLessThan(y("C"));
    expect(markOf(layout, "C").tree?.depth).toBe(2);
  });

  it("draws from the bottom, the left and the right", () => {
    const bottom = draw({ hierarchy: TREE, direction: "bottom" }).layout;
    expect(markOf(bottom, "Root").py).toBeGreaterThan(markOf(bottom, "A").py);
    const left = draw({ hierarchy: TREE, direction: "left", edgeStyle: "curved" }).layout;
    expect(markOf(left, "Root").px).toBeLessThan(markOf(left, "A").px);
    expect(find(left.nodes, "data-ok-chart-tree-link")[0]?.attrs["d"]).toContain("C");
    // Leaves are labeled after the node, parents before it.
    const labels = find(left.nodes, "data-ok-chart-node-label");
    expect(labels.find((n) => n.text === "A1")?.attrs["text-anchor"]).toBe("start");
    expect(labels.find((n) => n.text === "A")?.attrs["text-anchor"]).toBe("end");
    const right = draw({ hierarchy: TREE, direction: "right", edgeStyle: "straight" }).layout;
    expect(markOf(right, "Root").px).toBeGreaterThan(markOf(right, "A").px);
    expect(find(right.nodes, "data-ok-chart-tree-link")[0]?.attrs["d"]).toMatch(
      /^M[\d.,]+L[\d.,]+$/,
    );
    expect(markOf(right, "A").tree?.axis).toBe("left");
  });

  it("centers a lone node in every direction, and curves vertical links", () => {
    const lone: ChartHierarchyNode = { name: "Only" };
    const top = markOf(draw({ hierarchy: lone }).layout, "Only");
    expect(top.px).toBe(300);
    const left = markOf(draw({ hierarchy: lone, direction: "left" }).layout, "Only");
    expect(left.py).toBe(160);
    const radial = markOf(draw({ hierarchy: lone, direction: "radial" }).layout, "Only");
    expect([radial.px, radial.py]).toEqual([300, 160]);
    const turn = markOf(
      draw({ hierarchy: lone, direction: "radial", startAngle: 0, endAngle: 90 }).layout,
      "Only",
    );
    expect([turn.px, turn.py]).toEqual([300, 160]);
    const curved = draw({ hierarchy: TREE, edgeStyle: "curved" }).layout;
    expect(find(curved.nodes, "data-ok-chart-tree-link")[0]?.attrs["d"]).toMatch(/^M[\d.,]+C/);
  });

  it("lays out a radial tree around the center, leaves labeled outward", () => {
    const { layout } = draw({ hierarchy: TREE, direction: "radial", height: 400 });
    const root = markOf(layout, "Root");
    expect(root.px).toBe(300);
    expect(root.py).toBe(200);
    const r = (id: string) => Math.hypot(markOf(layout, id).px - 300, markOf(layout, id).py - 200);
    expect(r("A")).toBeLessThan(r("A1"));
    expect(r("A1")).toBeCloseTo(r("B1"), 1);
    const leafLabel = find(layout.nodes, "data-ok-chart-node-label").find((n) => n.text === "A1");
    expect(leafLabel?.attrs["transform"]).toMatch(/^rotate\(/);
    expect(markOf(layout, "A").tree?.axis).toBe("radial");
    // Orthogonal radial links bend around the middle circle; curved ones are cubics.
    expect(
      find(layout.nodes, "data-ok-chart-tree-link").some((n) =>
        /A[\d.]+,/.test(n.attrs["d"] ?? ""),
      ),
    ).toBe(true);
    const curved = draw({ hierarchy: TREE, direction: "radial", edgeStyle: "curved" }).layout;
    expect(find(curved.nodes, "data-ok-chart-tree-link")[1]?.attrs["d"]).toContain("C");
    // A half turn spreads the leaves over 180°.
    const half = draw({ hierarchy: TREE, direction: "radial", startAngle: -90, endAngle: 90 });
    expect(half.layout.marks.every((mark) => mark.py <= 160.01)).toBe(true);
  });

  it("hides the children of collapsed nodes and marks them", () => {
    const { layout } = draw({ hierarchy: TREE, collapsedNodes: ["A"], enableExpandCollapse: true });
    expect(ids(layout)).toEqual(["Root", "A", "B", "B1", "C"]);
    expect(markOf(layout, "A").tree?.collapsed).toBe(true);
    const shapes = find(layout.nodes, "data-ok-chart-tree-node");
    expect(shapes.filter((n) => n.attrs["data-ok-collapsed"] !== undefined)).toHaveLength(1);
    const a = chartTreeMarkOf(layout, "A") as number;
    expect(chartHierarchyAction(layout, a)).toEqual({ kind: "toggle", id: "A" });
    // Leaves and charts without expandCollapse do nothing.
    expect(chartHierarchyAction(layout, chartTreeMarkOf(layout, "C"))).toBeNull();
    expect(chartHierarchyAction(draw({ hierarchy: TREE }).layout, 0)).toBeNull();
    expect(chartHierarchyAction(layout, null)).toBeNull();
    expect(chartTreeMarkOf(layout, "A1")).toBeNull();
    expect(chartTreeMarkOf(layout, null)).toBeNull();
    const { format, data } = draw({ hierarchy: TREE, collapsedNodes: ["A"] });
    const tip = chartTooltip(data, layout, format, { kind: "mark", mark: a });
    expect(tip?.rows.map((row) => `${row.name} ${row.value}`)).toEqual([
      "Value 5",
      "Level 2",
      "Collapsed 2",
    ]);
  });

  it("prints values with data labels and drops labels with no room", () => {
    const { layout } = draw({ hierarchy: TREE, dataLabels: true });
    expect(find(layout.nodes, "data-ok-chart-node-label").map((n) => n.text)).toContain("A1 2");
    const crowded = draw({
      width: 120,
      hierarchy: {
        name: "r",
        children: Array.from({ length: 12 }, (_, i) => ({ name: `Leaf ${i}` })),
      },
    }).layout;
    expect(find(crowded.nodes, "data-ok-chart-node-label").map((n) => n.text)).toEqual(["r"]);
    expect(draw({ hierarchy: [] }).layout.marks).toEqual([]);
  });
});

describe("tree interaction", () => {
  const { layout, data, format } = draw({ hierarchy: TREE });
  const at = (id: string) => ({
    kind: "mark" as const,
    mark: chartTreeMarkOf(layout, id) as number,
  });
  const key = (from: string | null, name: string) => {
    const next = nextChartActive(layout, from === null ? null : at(from), name);
    return next && next.kind === "mark" ? layout.marks[next.mark]?.tree?.id : next;
  };

  it("walks children, parents and the nodes of a level with the arrow keys", () => {
    expect(key(null, "ArrowDown")).toBe("Root");
    expect(key("Root", "ArrowDown")).toBe("A");
    expect(key("A", "ArrowDown")).toBe("A1");
    expect(key("A1", "ArrowUp")).toBe("A");
    expect(key("Root", "ArrowUp")).toBe("Root");
    expect(key("A", "ArrowRight")).toBe("B");
    expect(key("A2", "ArrowRight")).toBe("B1");
    expect(key("C", "ArrowRight")).toBe("C");
    expect(key("B", "ArrowLeft")).toBe("A");
    expect(key("C", "ArrowDown")).toBe("C");
    expect(key("B", "Home")).toBe("Root");
    expect(key("B", "End")).toBe("C");
    expect(key("B", "Enter")).toBeUndefined();
    expect(nextChartTreeMark([], null, "ArrowDown")).toBeNull();
    expect(nextChartTreeMark([], null, "x")).toBeUndefined();
    expect(nextChartTreeMark(layout.marks, null, "PageDown")).toBeUndefined();
    // Left trees: right goes to a child, down to the next node of the level.
    const left = draw({ hierarchy: TREE, direction: "left" }).layout;
    const step = (from: string, name: string) => {
      const next = nextChartActive(
        left,
        { kind: "mark", mark: chartTreeMarkOf(left, from) as number },
        name,
      );
      return next?.kind === "mark" ? left.marks[next.mark]?.tree?.id : next;
    };
    expect(step("Root", "ArrowRight")).toBe("A");
    expect(step("A", "ArrowDown")).toBe("B");
    expect(step("A", "ArrowLeft")).toBe("Root");
  });

  it("finds nodes under the pointer, outlines them and their lineage, and shows the path", () => {
    const b1 = markOf(layout, "B1");
    expect(chartActiveAt(layout, b1.px + 2, b1.py - 2)).toEqual(at("B1"));
    expect(chartActiveAt(layout, 1, 1)).toBeNull();
    const nodes = chartActiveNodes(layout, at("B1"));
    expect(nodes.under).toEqual([]);
    expect(
      nodes.over.filter((n) => n.attrs["data-ok-chart-active-path"] !== undefined),
    ).toHaveLength(2);
    expect(nodes.over.at(-1)?.attrs["data-ok-chart-active-node"]).toBe("");
    const tip = chartTooltip(data, layout, format, at("B1"));
    expect(tip?.title).toBe("Root › B › B1");
    expect(tip?.rows.map((row) => row.name)).toEqual(["Value", "Level"]);
    // No selection on hierarchy charts.
    expect(chartMarkAt(layout, b1.px, b1.py)).toBeNull();
    expect(chartActiveMarks(layout, at("B1"))).toEqual([]);
    expect(chartSelectedNodes(layout, [{ seriesIndex: 0, dataPointIndex: 0 }])).toEqual([]);
    expect(
      chartTooltip(data, layout, format, at("B1"), [{ seriesIndex: 0, dataPointIndex: 5 }])
        ?.selected,
    ).toBeUndefined();
  });

  it("writes the options and the collapsed nodes as attributes", () => {
    expect(
      chartAttributes({
        type: "tree",
        direction: "radial",
        layoutType: "cluster",
        edgeStyle: "curved",
        enableExpandCollapse: true,
      }),
    ).toMatchObject({
      "data-ok-type": "tree",
      "data-ok-direction": "radial",
      "data-ok-layout-type": "cluster",
      "data-ok-edge-style": "curved",
      "data-ok-enable-expand-collapse": "",
    });
    expect(
      chartAttributes({ direction: "sideways" as never })["data-ok-direction"],
    ).toBeUndefined();
    expect(chartTextAttributes({ collapsedNodes: ["A", "B; C"] })).toEqual({
      "data-ok-collapsed-nodes": "A; B C",
    });
    expect(chartTextAttributes({ collapsedNodes: [] })).toEqual({});
  });
});
