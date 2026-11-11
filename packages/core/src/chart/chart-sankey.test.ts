import { describe, expect, it } from "vitest";
import { chartAttributes } from "../anatomy/anatomy.js";
import { type ChartRenderInput, renderChart } from "./chart.js";
import { chartActiveAt, chartActiveNodes, chartTooltip, nextChartActive } from "./chart-active.js";
import { chartFormat } from "./chart-format.js";
import type { ChartLayout, ChartMark, ChartNode } from "./chart-layout.js";
import { chartData } from "./chart-model.js";
import {
  type ChartSankeyEdge,
  chartSankeyGraph,
  chartSankeyTable,
  fitChartText,
  layoutSankey,
  onSankeyLink,
  readChartSankeyTable,
} from "./chart-sankey.js";
import { chartListText, chartTextAttributes, parseChartList } from "./chart-text.js";

/* Sankey charts (ADR-0047, phase 2.1): graph, layout, interaction and the links table. */

const base = { width: 600, height: 300, idPrefix: "t", type: "sankey" as const };
const draw = (input: Omit<ChartRenderInput, "width" | "height" | "idPrefix">, extra = {}) =>
  renderChart({ ...base, ...input, ...extra });

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

const EDGES: ChartSankeyEdge[] = [
  { source: "wages", target: "budget", value: 60 },
  { source: "grants", target: "budget", value: 20 },
  { source: "budget", target: "rent", value: 30 },
  { source: "budget", target: "food", value: 25 },
  { source: "budget", target: "savings", value: 25 },
];
const NODES = [
  { id: "wages", title: "Wages", color: "info" as const },
  { id: "budget", title: "Budget" },
];

const nodeMarks = (layout: ChartLayout) => layout.marks.filter((m) => m.flow?.kind === "node");
const linkMarks = (layout: ChartLayout) => layout.marks.filter((m) => m.flow?.kind === "link");
const rectOf = (mark: ChartMark) =>
  mark.flow?.rect as NonNullable<NonNullable<ChartMark["flow"]>["rect"]>;

describe("chartSankeyGraph", () => {
  it("orders nodes by first use, keeps titles and colors, drops bad links", () => {
    const graph = chartSankeyGraph({
      nodes: [...NODES, { id: "lost", title: "No links" }],
      edges: [
        ...EDGES,
        { source: "a", target: "a", value: 3 },
        { source: "a", target: "b", value: -1 },
        { source: "a", target: "b", value: "x" },
        { source: "a", target: "b", value: 0 },
        null as unknown as ChartSankeyEdge,
      ],
      colors: ["warning", "error", "nope" as never],
    });
    expect(graph.nodes.map((n) => n.id)).toEqual([
      "wages",
      "budget",
      "grants",
      "rent",
      "food",
      "savings",
    ]);
    expect(graph.nodes[0]).toEqual({ id: "wages", title: "Wages", color: "info" });
    // Colors: own, then `colors` by position, then the default palette.
    expect(graph.nodes[1]?.color).toBe("error");
    expect(graph.nodes[2]?.color).toBe("info");
    expect(graph.nodes[3]?.title).toBe("rent");
    expect(graph.links).toHaveLength(5);
  });

  it("accepts numeric text values and own link colors", () => {
    const graph = chartSankeyGraph({
      edges: [{ source: "a", target: "b", value: "1,200", color: "success" }],
    });
    expect(graph.links[0]).toEqual({ source: 0, target: 1, value: 1200, color: "success" });
  });
});

describe("layoutSankey", () => {
  it("puts ranks in columns, sinks in the last one, and sizes nodes by value", () => {
    const { layout } = draw({
      nodes: NODES,
      edges: [...EDGES, { source: "wages", target: "tax", value: 10 }],
    });
    expect(layout.mode).toBe("flow");
    const nodes = nodeMarks(layout);
    const x = (id: number) => rectOf(nodes[id] as ChartMark).x;
    // wages, budget, grants, rent, food, savings, tax
    expect(x(0)).toBe(x(2));
    expect(x(1)).toBeGreaterThan(x(0));
    expect(x(3)).toBeGreaterThan(x(1));
    // `tax` is a sink of the first rank: justified to the last column.
    expect(x(6)).toBe(x(3));
    // Heights are proportional to max(in, out).
    const h = (id: number) => rectOf(nodes[id] as ChartMark).height;
    expect(h(1) / h(3)).toBeCloseTo(80 / 30, 1);
    expect(h(0) / h(2)).toBeCloseTo(70 / 20, 1);
    // Nodes of a column never overlap and stay inside the plot.
    const column = [3, 4, 5, 6].map((i) => rectOf(nodes[i] as ChartMark)).sort((a, b) => a.y - b.y);
    for (let i = 1; i < column.length; i++)
      expect(column[i]?.y).toBeGreaterThanOrEqual(
        (column[i - 1]?.y ?? 0) + (column[i - 1]?.height ?? 0) - 0.01,
      );
    expect((column.at(-1)?.y ?? 0) + (column.at(-1)?.height ?? 0)).toBeLessThanOrEqual(300);
  });

  it("draws links as bands as wide as their value, stacked at both ends", () => {
    const { layout } = draw({ edges: EDGES });
    const links = linkMarks(layout);
    const budget = rectOf(nodeMarks(layout)[1] as ChartMark);
    const outs = links.filter((m) => m.flow?.link && m.flow.link.d0 === budget.x + budget.width);
    expect(outs).toHaveLength(3);
    const total = outs.reduce((sum, m) => sum + (m.flow?.link?.w ?? 0), 0);
    expect(total).toBeCloseTo(budget.height, 1);
    const starts = outs.map((m) => m.flow?.link?.b0 ?? 0).sort((a, b) => a - b);
    expect(starts[0]).toBeCloseTo(budget.y, 1);
    const paths = find(layout.nodes, "data-ok-chart-link");
    expect(paths).toHaveLength(5);
    expect(paths[0]?.attrs["d"]).toMatch(/^M[\d.]+,[\d.]+C.*Z$/);
    expect(paths[0]?.attrs["fill-opacity"]).toBe("0.4");
  });

  it("fills links with a gradient from source to target color, or solid", () => {
    const gradient = draw({ nodes: NODES, edges: EDGES }).layout;
    const stops = find(gradient.nodes, "data-ok-chart-stop");
    expect(stops.length).toBeGreaterThan(0);
    expect(stops[0]?.attrs["data-ok-color"]).toBe("info");
    expect(find(gradient.nodes, "data-ok-chart-link")[0]?.attrs["fill"]).toBe("url(#t-link-0)");
    const solid = draw({ nodes: NODES, edges: EDGES, fill: "solid", edgeOpacity: 0.7 }).layout;
    expect(find(solid.nodes, "data-ok-chart-stop")).toHaveLength(0);
    const link = find(solid.nodes, "data-ok-chart-link")[0];
    expect(link?.attrs["data-ok-color"]).toBe("info");
    expect(link?.attrs["fill-opacity"]).toBe("0.7");
  });

  it("labels nodes after the first column and before the others, with values on request", () => {
    const { layout } = draw({ nodes: NODES, edges: EDGES, dataLabels: true, valuePrefix: "$" });
    const labels = find(layout.nodes, "data-ok-chart-node-label");
    expect(labels[0]?.text).toBe("Wages $60");
    expect(labels[0]?.attrs["text-anchor"]).toBe("start");
    expect(labels[1]?.attrs["text-anchor"]).toBe("end");
  });

  it("lays out vertical diagrams with ranks as rows", () => {
    const { layout } = draw({ edges: EDGES, orientation: "vertical", nodeWidth: 12 });
    const nodes = nodeMarks(layout);
    const a = rectOf(nodes[0] as ChartMark);
    const b = rectOf(nodes[1] as ChartMark);
    expect(a.height).toBe(12);
    expect(b.y).toBeGreaterThan(a.y);
    const labels = find(layout.nodes, "data-ok-chart-node-label");
    expect(labels.every((label) => label.attrs["text-anchor"] === "middle")).toBe(true);
    // Labels stay inside the width (estimated text widths).
    for (const label of labels) expect(Number(label.attrs["x"])).toBeGreaterThan(0);
    // A link is hit across its band (x) at a depth (y) between the ranks.
    const link = linkMarks(layout)[0] as ChartMark;
    expect(chartActiveAt(layout, link.px, link.py)).toEqual({
      kind: "mark",
      mark: layout.marks.indexOf(link),
    });
  });

  it("draws axis titles above columns or beside rows", () => {
    const titles = ["Income", "Budget", "Spending", "Extra"];
    const h = draw({ edges: EDGES, axisTitles: titles }).layout;
    const texts = find(h.nodes, "data-ok-chart-axis-title");
    expect(texts.map((t) => t.text)).toEqual(["Income", "Budget", "Spending"]);
    // Nodes start below the titles.
    expect(Math.min(...nodeMarks(h).map((m) => rectOf(m).y))).toBeGreaterThanOrEqual(26);
    const v = draw({ edges: EDGES, axisTitles: titles, orientation: "vertical" }).layout;
    const left = find(v.nodes, "data-ok-chart-axis-title");
    expect(left[0]?.attrs["text-anchor"]).toBe("start");
    expect(Math.min(...nodeMarks(v).map((m) => rectOf(m).x))).toBeGreaterThan(40);
  });

  it("breaks cycles: back links are dashed loops under the diagram", () => {
    const { layout } = draw({
      edges: [
        { source: "raw", target: "made", value: 10 },
        { source: "made", target: "used", value: 10 },
        { source: "used", target: "raw", value: 4 },
      ],
    });
    const nodes = nodeMarks(layout);
    expect(rectOf(nodes[2] as ChartMark).x).toBeGreaterThan(rectOf(nodes[1] as ChartMark).x);
    const loop = find(layout.nodes, "data-ok-back")[0];
    expect(loop?.attrs["stroke-width"]).toBeDefined();
    const bottom = Math.max(...nodes.map((m) => rectOf(m).y + rectOf(m).height));
    const back = linkMarks(layout).find((m) => m.flow?.link?.back) as ChartMark;
    expect(back.py).toBeGreaterThan(bottom);
    // Loops aren't hit by the pointer (they stay reachable by keyboard).
    expect(onSankeyLink(back.flow?.link as never, back.px, back.py)).toBe(false);
  });

  it("keeps parallel links apart and puts back links last at a node", () => {
    const { layout } = draw({
      edges: [
        { source: "a", target: "b", value: 5 },
        { source: "a", target: "b", value: 3 },
        { source: "b", target: "c", value: 6 },
        { source: "b", target: "a", value: 2 },
      ],
    });
    const links = linkMarks(layout).map(
      (m) => m.flow?.link as NonNullable<NonNullable<ChartMark["flow"]>["link"]>,
    );
    expect(links).toHaveLength(4);
    // Parallel links stack in their order at both ends.
    expect(links[1]?.b0).toBeCloseTo((links[0]?.b0 ?? 0) + (links[0]?.w ?? 0), 2);
    expect(links[1]?.b1).toBeCloseTo((links[0]?.b1 ?? 0) + (links[0]?.w ?? 0), 2);
    // At b, the forward link leaves above the loop back to a.
    expect(links[3]?.back).toBe(true);
    expect(links[3]?.b0).toBeGreaterThan(links[2]?.b0 ?? 0);
  });

  it("handles an empty graph and a single link", () => {
    expect(draw({ edges: [] }).layout.marks).toHaveLength(0);
    const one = draw({ edges: [{ source: "a", target: "b", value: 5 }] }).layout;
    expect(nodeMarks(one)).toHaveLength(2);
    expect(rectOf(nodeMarks(one)[1] as ChartMark).x).toBeGreaterThan(0);
    const graph = chartSankeyGraph({ edges: [{ source: "a", target: "b", value: 1 }] });
    const format = chartFormat(chartData({ type: "sankey", series: [] }));
    const tiny = layoutSankey(
      graph,
      { width: 10, height: 10, idPrefix: "x", whitespace: 5, nodeWidth: 999 },
      format,
    );
    expect(tiny.width).toBe(40);
  });

  it("cuts labels that don't fit between ranks", () => {
    expect(fitChartText("Short", 100)).toBe("Short");
    expect(fitChartText("A very long node title", 60)).toMatch(/^A very.*…$/);
    expect(fitChartText("Wide", 1)).toBe("W…");
    const { layout } = draw(
      {
        edges: [
          { source: "A very long node title indeed", target: "b", value: 1 },
          { source: "b", target: "c", value: 1 },
        ],
      },
      { width: 300 },
    );
    const label = find(layout.nodes, "data-ok-chart-node-label")[0];
    expect(label?.text?.endsWith("…")).toBe(true);
    expect(layout.marks[0]?.flow?.title).toBe("A very long node title indeed");
    // Too narrow for two characters: labels are left out (the tooltip and table keep them).
    const narrow = draw(
      {
        edges: [
          { source: "a", target: "b", value: 1 },
          { source: "b", target: "c", value: 1 },
        ],
      },
      { width: 120 },
    ).layout;
    expect(find(narrow.nodes, "data-ok-chart-node-label").map((n) => n.text)).toEqual([]);
  });

  it("is deterministic and relaxes crossings away", () => {
    const edges: ChartSankeyEdge[] = [
      { source: "a", target: "y", value: 10 },
      { source: "b", target: "x", value: 10 },
    ];
    const first = draw({ edges }).layout;
    expect(draw({ edges }).layout.nodes).toEqual(first.nodes);
    const nodes = nodeMarks(first);
    // a (top) feeds y, so y moves above x.
    expect(rectOf(nodes[1] as ChartMark).y).toBeLessThan(rectOf(nodes[3] as ChartMark).y);
  });
});

describe("Sankey interaction", () => {
  const { layout, data, format } = draw({ nodes: NODES, edges: EDGES, valueSuffix: " k" });

  it("hits nodes first, then links; nothing elsewhere", () => {
    const node = nodeMarks(layout)[1] as ChartMark;
    expect(chartActiveAt(layout, node.px, node.py)).toEqual({
      kind: "mark",
      mark: layout.marks.indexOf(node),
    });
    const link = linkMarks(layout)[2] as ChartMark;
    expect(chartActiveAt(layout, link.px, link.py)).toEqual({
      kind: "mark",
      mark: layout.marks.indexOf(link),
    });
    expect(chartActiveAt(layout, 300, 1)).toBeNull();
  });

  it("tooltips: node totals, link source → target", () => {
    const budget = layout.marks.indexOf(nodeMarks(layout)[1] as ChartMark);
    const tip = chartTooltip(data, layout, format, { kind: "mark", mark: budget });
    expect(tip?.title).toBe("Budget");
    expect(tip?.rows.map((row) => `${row.name}: ${row.value}`)).toEqual([
      "Incoming: 80 k",
      "Outgoing: 80 k",
    ]);
    const link = layout.marks.indexOf(linkMarks(layout)[0] as ChartMark);
    const linkTip = chartTooltip(data, layout, format, { kind: "mark", mark: link });
    expect(linkTip?.title).toBe("Wages → Budget");
    expect(linkTip?.rows[0]).toEqual({ name: "Value", value: "60 k", color: "info" });
    const sink = layout.marks.indexOf(nodeMarks(layout)[3] as ChartMark);
    expect(chartTooltip(data, layout, format, { kind: "mark", mark: sink })?.rows).toHaveLength(1);
  });

  it("highlights a node's links and outline, or one link", () => {
    const budget = layout.marks.indexOf(nodeMarks(layout)[1] as ChartMark);
    const nodes = chartActiveNodes(layout, { kind: "mark", mark: budget });
    expect(find(nodes.over, "data-ok-chart-active-link")).toHaveLength(5);
    expect(find(nodes.over, "data-ok-chart-active-cell")).toHaveLength(1);
    const link = layout.marks.indexOf(linkMarks(layout)[0] as ChartMark);
    const one = chartActiveNodes(layout, { kind: "mark", mark: link }).over;
    expect(one).toHaveLength(1);
    expect(one[0]?.attrs["fill"]).toBe("url(#t-link-0)");
  });

  it("walks nodes and links rank by rank with the keyboard", () => {
    const seen: string[] = [];
    let active = nextChartActive(layout, null, "Home");
    for (let i = 0; i < layout.marks.length; i++) {
      const mark = layout.marks[(active as { mark: number }).mark] as ChartMark;
      seen.push(mark.flow?.title ?? "");
      active = nextChartActive(layout, active ?? null, "ArrowRight");
    }
    expect(seen.slice(0, 4)).toEqual(["Wages", "grants", "Wages → Budget", "grants → Budget"]);
    expect(seen[4]).toBe("Budget");
    expect(new Set(seen).size).toBe(layout.marks.length);
    const end = nextChartActive(layout, null, "End") as { mark: number };
    expect(layout.marks[end.mark]?.flow?.kind).toBe("node");
  });
});

describe("Sankey table and attributes", () => {
  it("writes one row per link and reads it back (HTML)", () => {
    const { table } = draw({ nodes: NODES, edges: EDGES, valuePrefix: "$" });
    expect(table.head.map((cell) => cell.text)).toEqual(["From", "To", "Value"]);
    expect(table.rows[0]?.header).toEqual({
      text: "Wages",
      attrs: { "data-ok-value": "wages", "data-ok-color": "info" },
    });
    expect(table.rows[0]?.cells[1]).toEqual({ text: "$60", attrs: { "data-ok-value": "60" } });
    const element = document.createElement("table");
    const head = element.createTHead().insertRow();
    for (const cell of table.head) {
      const th = document.createElement("th");
      th.textContent = cell.text === "From" ? "Source" : cell.text;
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
    // A row without a target is skipped; an unknown color is ignored.
    const bad = body.insertRow();
    bad.insertCell().textContent = "x";
    (bad.insertCell() as HTMLElement).setAttribute("data-ok-color", "pink");
    const read = readChartSankeyTable(element);
    expect(read.partLabels).toEqual({ source: "Source", target: "To", y: "Value" });
    expect(read.edges).toHaveLength(5);
    expect(read.edges[0]).toEqual({ source: "wages", target: "budget", value: "60" });
    expect(read.nodes[0]).toEqual({ id: "wages", title: "Wages", color: "info" });
    const again = renderChart({ ...base, ...read });
    expect(again.table.rows).toEqual(draw({ nodes: NODES, edges: EDGES }).table.rows);
    expect(again.table.head[0]?.text).toBe("Source");
  });

  it("reads a table without a head; rows missing a node are skipped", () => {
    const table = document.createElement("table");
    table.innerHTML = `<tbody>
      <tr><th>A</th><th>B</th><td data-ok-value="5" data-ok-color="success">5</td></tr>
      <tr><th>B</th><th>C</th><td>2</td></tr>
      <tr><th>C</th></tr>
    </tbody>`;
    const read = readChartSankeyTable(table);
    expect(read.partLabels).toEqual({});
    expect(read.edges).toEqual([
      { source: "A", target: "B", value: "5", color: "success" },
      { source: "B", target: "C", value: "2" },
    ]);
    expect(read.nodes.map((node) => node.id)).toEqual(["A", "B", "C"]);
  });

  it("keeps own link colors in the table and localizes headers", () => {
    const graph = chartSankeyGraph({
      edges: [{ source: "a", target: "b", value: 2, color: "error" }],
    });
    const format = chartFormat(chartData({ type: "sankey", series: [] }), {
      partLabels: { source: "Từ", target: "Đến" },
    });
    const table = chartSankeyTable(graph, format);
    expect(table.head[0]?.text).toBe("Từ");
    expect(table.rows[0]?.cells[1]?.attrs).toEqual({ "data-ok-color": "error" });
  });

  it("writes the options and axis titles as attributes", () => {
    expect(
      chartAttributes({ type: "sankey", orientation: "vertical", nodeWidth: 12, edgeOpacity: 0.6 }),
    ).toMatchObject({
      "data-ok-type": "sankey",
      "data-ok-orientation": "vertical",
      "data-ok-node-width": "12",
      "data-ok-edge-opacity": "0.6",
    });
    expect(chartTextAttributes({ axisTitles: ["Income", "A; B"] })).toEqual({
      "data-ok-axis-titles": "Income; A B",
    });
    expect(chartTextAttributes({ axisTitles: [] })).toEqual({});
    expect(chartListText(["a", " b "])).toBe("a; b");
    expect(parseChartList("a; b ;c")).toEqual(["a", "b", "c"]);
    expect(parseChartList(null)).toEqual([]);
    expect(parseChartList("x".repeat(2001))).toEqual([]);
  });

  it("has no legend, zoom or series", () => {
    const render = draw({ edges: EDGES, legend: "top" });
    expect(render.legend).toBeNull();
    expect(render.zoomable).toBe(false);
    expect(render.data.series).toHaveLength(0);
  });
});
