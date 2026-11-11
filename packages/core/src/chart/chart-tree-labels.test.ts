import { describe, expect, it } from "vitest";
import { type ChartRenderInput, renderChart } from "./chart.js";
import { chartFormat } from "./chart-format.js";
import {
  type ChartHierarchyNode,
  chartHierarchy,
  chartHierarchyTable,
  chartTreeLabel,
  chartTreeLabelLevelsText,
  chartTreeLabelText,
  parseChartTreeLabel,
  parseChartTreeLabelLevels,
  readChartHierarchyTable,
} from "./chart-hierarchy.js";
import type { ChartNode } from "./chart-layout.js";
import { chartData } from "./chart-model.js";
import { chartTextAttributes } from "./chart-text.js";

/* Tree chart label placement (ApexTree `externalLabel`, roadmap 4.18.86): chart, level and node
   options, estimated text room, the attribute texts and the nodes table. */

const base = { width: 600, height: 320, idPrefix: "t", type: "tree" as const };
const draw = (
  input: Omit<ChartRenderInput, "width" | "height" | "idPrefix" | "type"> & {
    width?: number;
    height?: number;
  },
) => renderChart({ ...base, ...input }).layout;

const TREE: ChartHierarchyNode = {
  name: "Root",
  children: [
    { name: "A", children: [{ name: "A1" }, { name: "A2" }] },
    { name: "B", children: [{ name: "B1" }] },
    { name: "C" },
  ],
};

function labels(nodes: readonly ChartNode[]): Map<string, Record<string, string>> {
  const found = new Map<string, Record<string, string>>();
  const walk = (list: readonly ChartNode[]) => {
    for (const node of list) {
      if (node.attrs["data-ok-chart-node-label"] !== undefined)
        found.set(node.text ?? "", node.attrs);
      if (node.children) walk(node.children);
    }
  };
  walk(nodes);
  return found;
}
const markOf = (layout: ReturnType<typeof draw>, id: string) => {
  const mark = layout.marks.find((item) => item.tree?.id === id);
  if (!mark) throw new Error(id);
  return mark;
};

describe("tree label options", () => {
  it("keeps valid fields only, clamps numbers, and round-trips the attribute text", () => {
    expect(chartTreeLabel(undefined)).toBeUndefined();
    expect(chartTreeLabel({ align: "middle", verticalAlign: "center" })).toBeUndefined();
    expect(
      chartTreeLabel({ align: "right", verticalAlign: "top", offsetX: "4", rotation: 9999 }),
    ).toEqual({ align: "right", verticalAlign: "top", offsetX: 4, rotation: 360 });
    expect(chartTreeLabel({ offsetY: -5000, offsetX: "x" })).toEqual({ offsetY: -1000 });
    const text = chartTreeLabelText({ rotation: -45, align: "left", offsetY: 2 });
    expect(text).toBe("align=left offsetY=2 rotation=-45");
    expect(parseChartTreeLabel(text)).toEqual({ align: "left", offsetY: 2, rotation: -45 });
    expect(parseChartTreeLabel('align=right"><x color=red rotation')).toBeUndefined();
    expect(parseChartTreeLabel("x".repeat(600))).toBeUndefined();
    expect(chartTreeLabelText(undefined)).toBe("");
    const levels = chartTreeLabelLevelsText({
      2: { rotation: -45 },
      0: { verticalAlign: "top" },
      [-1]: { align: "left" },
      3: { align: "nope" as never },
    });
    expect(levels).toBe("0: verticalAlign=top; 2: rotation=-45");
    expect(parseChartTreeLabelLevels(levels)).toEqual({
      0: { verticalAlign: "top" },
      2: { rotation: -45 },
    });
    expect(parseChartTreeLabelLevels("x: align=left; 99: align=left; 1 align=left")).toEqual({});
    expect(parseChartTreeLabelLevels(null)).toEqual({});
    expect(chartTreeLabelLevelsText(undefined)).toBe("");
    expect(
      chartTextAttributes({
        externalLabel: { align: "right" },
        externalLabelLevels: { 1: { rotation: 30 } },
      }),
    ).toEqual({
      "data-ok-external-label": "align=right",
      "data-ok-external-label-levels": "1: rotation=30",
    });
    expect(chartTextAttributes({ externalLabel: {}, externalLabelLevels: {} })).toEqual({});
  });

  it("writes a node's own label on its row header and reads it back", () => {
    const h = chartHierarchy({
      hierarchy: { name: "Root", children: [{ name: "Leaf", externalLabel: { rotation: 90 } }] },
    });
    expect(h.items[1]?.label).toEqual({ rotation: 90 });
    expect(h.items[0]?.label).toBeUndefined();
    const table = chartHierarchyTable(h, chartFormat(chartData({ type: "tree", series: [] })));
    expect(table.rows[1]?.header.attrs["data-ok-external-label"]).toBe("rotation=90");
    expect(table.rows[0]?.header.attrs).not.toHaveProperty("data-ok-external-label");
    const element = document.createElement("table");
    const body = element.createTBody();
    for (const row of table.rows) {
      const tr = body.insertRow();
      for (const cell of [row.header, ...row.cells]) {
        const td = tr.insertCell();
        td.textContent = cell.text;
        for (const [k, v] of Object.entries(cell.attrs)) td.setAttribute(k, v);
      }
    }
    const read = readChartHierarchyTable(element).hierarchy;
    expect(read[0]?.children?.[0]?.externalLabel).toEqual({ rotation: 90 });
  });
});

describe("tree label placement", () => {
  it("draws exactly the default labels without options", () => {
    expect(draw({ hierarchy: TREE }).nodes).toEqual(
      draw({ hierarchy: TREE, externalLabel: {}, externalLabelLevels: {} }).nodes,
    );
  });

  it("aligns around the node, moves by the offsets and turns by the rotation", () => {
    const layout = draw({
      hierarchy: TREE,
      externalLabel: { align: "right", verticalAlign: "middle", offsetX: 3, offsetY: -2 },
    });
    const root = markOf(layout, "Root");
    const label = labels(layout.nodes).get("Root");
    // Marker radius 5, then the 4px gap, then the offset.
    expect(Number(label?.["x"])).toBeCloseTo(root.px + 5 + 4 + 3, 1);
    expect(Number(label?.["y"])).toBeCloseTo(root.py - 2, 1);
    expect(label?.["text-anchor"]).toBe("start");
    expect(label?.["dy"]).toBe("0.35em");
    expect(label?.["transform"]).toBeUndefined();
    const turned = labels(
      draw({ hierarchy: TREE, externalLabel: { align: "left", rotation: -45 } }).nodes,
    ).get("Root");
    expect(turned?.["text-anchor"]).toBe("end");
    // A missing verticalAlign keeps the default side (below the node in top trees).
    expect(turned?.["dy"]).toBe("0.71em");
    expect(turned?.["transform"]).toBe(`rotate(-45 ${turned?.["x"]} ${turned?.["y"]})`);
    // The margins make room for turned labels: the leaves move up.
    const plain = markOf(draw({ hierarchy: TREE }), "A1").py;
    const slanted = draw({ hierarchy: TREE, externalLabel: { align: "left", rotation: -45 } });
    expect(markOf(slanted, "A1").py).toBeLessThan(plain);
    expect(labels(slanted.nodes).has("A1")).toBe(true);
    const aboveLayout = draw({ hierarchy: TREE, externalLabel: { verticalAlign: "top" } });
    const above = labels(aboveLayout.nodes);
    expect(above.get("A1")?.["dy"]).toBe("0");
    expect(Number(above.get("A1")?.["y"])).toBeLessThan(markOf(aboveLayout, "A1").py);
    // Nothing below the leaves any more: they move down.
    expect(markOf(aboveLayout, "A1").py).toBeGreaterThan(plain);
    // The root's label above it gets a top margin.
    const rootAbove = labels(
      draw({ hierarchy: TREE, externalLabelLevels: { 0: { verticalAlign: "top" } } }).nodes,
    ).get("Root");
    expect(Number(rootAbove?.["y"])).toBeGreaterThan(0);
  });

  it("levels override the chart, and a node's own options override its level", () => {
    const tree: ChartHierarchyNode = {
      name: "Root",
      children: [
        { name: "A", children: [{ name: "A1" }, { name: "A2", externalLabel: { align: "left" } }] },
        { name: "B" },
      ],
    };
    const found = labels(
      draw({
        hierarchy: tree,
        externalLabel: { verticalAlign: "top" },
        externalLabelLevels: { 2: { rotation: 30, align: "right" } },
      }).nodes,
    );
    expect(found.get("Root")?.["dy"]).toBe("0");
    expect(found.get("A1")?.["transform"]).toMatch(/^rotate\(30 /);
    expect(found.get("A1")?.["text-anchor"]).toBe("start");
    expect(found.get("A2")?.["text-anchor"]).toBe("end");
    expect(found.get("A2")?.["transform"]).toMatch(/^rotate\(30 /);
    expect(found.get("B")?.["transform"]).toBeUndefined();
  });

  it("left and right trees keep their default sides for unset options", () => {
    const left = labels(
      draw({ hierarchy: TREE, direction: "left", externalLabel: { offsetY: 6 } }).nodes,
    );
    expect(left.get("A1")?.["text-anchor"]).toBe("start");
    expect(left.get("A")?.["text-anchor"]).toBe("end");
    const right = labels(
      draw({ hierarchy: TREE, direction: "right", externalLabel: { offsetX: 0 } }).nodes,
    );
    expect(right.get("A1")?.["text-anchor"]).toBe("end");
    expect(right.get("A")?.["text-anchor"]).toBe("start");
    // Crowded levels (rows under one line apart) drop labels drawn on the node's row.
    const crowded = labels(
      draw({
        hierarchy: {
          name: "Root",
          children: Array.from({ length: 40 }, (_, i) => ({ name: `N${i}` })),
        },
        direction: "left",
        height: 100,
        externalLabel: { offsetX: 0 },
      }).nodes,
    );
    expect(crowded.has("N1")).toBe(false);
    // Turned labels don't depend on the row spacing.
    const turned = labels(
      draw({
        hierarchy: {
          name: "Root",
          children: Array.from({ length: 40 }, (_, i) => ({ name: `N${i}` })),
        },
        direction: "left",
        height: 100,
        externalLabel: { rotation: 90 },
      }).nodes,
    );
    expect([...turned.keys()].length).toBeGreaterThan(1);
  });

  it("estimates the room toward the plot's edge and cuts or drops labels that don't fit", () => {
    const long = { name: "Root", children: [{ name: "A very long label for a leaf node" }] };
    const narrow = labels(
      draw({ hierarchy: long, width: 120, externalLabel: { align: "right" } }).nodes,
    );
    const text = [...narrow.keys()].find((key) => key.startsWith("A")) as string;
    expect(text.endsWith("…")).toBe(true);
    // No room at all: the label is left out (the table and the tooltip keep the name).
    const none = labels(
      draw({ hierarchy: long, width: 120, externalLabel: { align: "right", offsetX: 200 } }).nodes,
    );
    expect([...none.keys()].some((key) => key.startsWith("A"))).toBe(false);
    // Centered labels in top trees stay within their level neighbors.
    const centered = labels(
      draw({
        hierarchy: {
          name: "Root",
          children: Array.from({ length: 8 }, (_, i) => ({ name: `Long name ${i}` })),
        },
        width: 500,
        externalLabel: { offsetY: 4 },
      }).nodes,
    );
    expect([...centered.keys()].filter((key) => key.endsWith("…")).length).toBeGreaterThan(0);
  });

  it("radial leaves stay on their ray: offsetX moves them out, rotation adds to the angle", () => {
    const plain = draw({ hierarchy: TREE, direction: "radial", height: 400 });
    const moved = draw({
      hierarchy: TREE,
      direction: "radial",
      height: 400,
      externalLabel: { offsetX: 3, rotation: 15, align: "left" },
    });
    const a = labels(plain.nodes).get("A1");
    const b = labels(moved.nodes).get("A1");
    const distance = (attrs: Record<string, string> | undefined) =>
      Math.hypot(Number(attrs?.["x"]) - 300, Number(attrs?.["y"]) - 200);
    expect(distance(b) - distance(a)).toBeCloseTo(3, 1);
    const angle = (attrs: Record<string, string> | undefined) =>
      Number(/rotate\(([-\d.]+)/.exec(attrs?.["transform"] ?? "")?.[1]);
    expect(angle(b) - angle(a)).toBeCloseTo(15, 1);
    expect(b?.["text-anchor"]).toBe(a?.["text-anchor"]);
    // Parent labels in radial trees take align like any other.
    expect(labels(moved.nodes).get("A")?.["text-anchor"]).toBe("end");
  });
});
