import type { ChartFormat } from "./chart-format.js";
import {
  type ChartFlow,
  type ChartLayout,
  type ChartMark,
  type ChartNode,
  type ChartRect,
  chartTextWidth,
  FONT,
  fitChartText,
  fmt,
  node,
  r2,
} from "./chart-layout.js";
import {
  type ChartColor,
  type ChartPart,
  type ChartTableCell,
  type ChartTableModel,
  chartColors,
  chartDefaultColors,
  chartPartNames,
  parseChartNumber,
} from "./chart-model.js";

/*
 * Sankey charts (ADR-0047, phase 2.1). The data is links between nodes, not series: React passes
 * `nodes` and `edges` (ApexSankey's shape), HTML authors write one table row per link. The layout is
 * ours: ranks from the longest path after cycles are broken, node sizes by value, a few rounds of
 * relaxation toward each node's neighbors, links as filled bands between two cubic curves. Every
 * position is computed (never measured), so server, React and HTML draw the same diagram.
 */

/** A node: an id that links name, a title (default the id) and a palette color. */
export interface ChartSankeyNode {
  readonly id: string;
  readonly title?: string | undefined;
  readonly color?: ChartColor | undefined;
}

/** A link from `source` to `target` (node ids) carrying a positive `value`. */
export interface ChartSankeyEdge {
  readonly source: string;
  readonly target: string;
  readonly value: number | string;
  /** The link's own color (default: a gradient from the source to the target color). */
  readonly color?: ChartColor | undefined;
}

export const chartOrientations = ["horizontal", "vertical"] as const;
export type ChartOrientation = (typeof chartOrientations)[number];

interface GraphNode {
  readonly id: string;
  readonly title: string;
  readonly color: ChartColor;
}
interface GraphLink {
  readonly source: number;
  readonly target: number;
  readonly value: number;
  readonly color?: ChartColor | undefined;
}

/** A normalized Sankey graph: nodes in order of first use, links with positive values. */
export interface ChartSankeyGraph {
  readonly nodes: readonly GraphNode[];
  readonly links: readonly GraphLink[];
}

const isColor = (value: unknown): value is ChartColor => chartColors.includes(value as ChartColor);
/** Ids and titles are text, at most 200 characters (untrusted input). */
const textOf = (value: unknown) => String(value ?? "").slice(0, 200);

/**
 * Normalizes nodes and links. Links need two different known-or-new ids and a positive finite
 * value (others are dropped); a node without links is not drawn. Node colors: their own, then
 * `colors` in order of first use, then the default chart palette.
 */
export function chartSankeyGraph(input: {
  nodes?: readonly ChartSankeyNode[] | undefined;
  edges?: readonly ChartSankeyEdge[] | undefined;
  colors?: readonly ChartColor[] | undefined;
}): ChartSankeyGraph {
  const declared = new Map<string, ChartSankeyNode>();
  for (const entry of input.nodes ?? []) {
    if (entry && typeof entry === "object") declared.set(textOf(entry.id), entry);
  }
  const palette = (input.colors ?? []).filter(isColor);
  const nodes: GraphNode[] = [];
  const index = new Map<string, number>();
  const nodeOf = (raw: unknown) => {
    const id = textOf(raw);
    let at = index.get(id);
    if (at === undefined) {
      at = nodes.length;
      index.set(id, at);
      const own = declared.get(id);
      const title = own?.title === undefined ? id : textOf(own.title);
      nodes.push({
        id,
        title,
        color: isColor(own?.color)
          ? own.color
          : (palette[at] ?? (chartDefaultColors[at % chartDefaultColors.length] as ChartColor)),
      });
    }
    return at;
  };
  const links: GraphLink[] = [];
  for (const edge of input.edges ?? []) {
    if (!edge || typeof edge !== "object") continue;
    const value = parseChartNumber(edge.value);
    if (value === null || value <= 0) continue;
    if (textOf(edge.source) === textOf(edge.target)) continue;
    const source = nodeOf(edge.source);
    const target = nodeOf(edge.target);
    links.push({ source, target, value, ...(isColor(edge.color) ? { color: edge.color } : {}) });
  }
  return { nodes, links };
}

// --- Data table ---------------------------------------------------------------------------------

/** The data table: one row per link (source as the row header, then target and value). */
export function chartSankeyTable(graph: ChartSankeyGraph, format: ChartFormat): ChartTableModel {
  const nodeCell = (at: number): ChartTableCell => {
    const item = graph.nodes[at] as GraphNode;
    return {
      text: item.title,
      attrs: {
        ...(item.id !== item.title ? { "data-ok-value": item.id } : {}),
        "data-ok-color": item.color,
      },
    };
  };
  const head = (["source", "target", "y"] as const).map(
    (part): ChartTableCell => ({ text: format.part(part), attrs: { "data-ok-part": part } }),
  );
  return {
    head,
    parts: [],
    rows: graph.links.map((link) => {
      const text = format.value(link.value, 0);
      return {
        header: nodeCell(link.source),
        cells: [
          nodeCell(link.target),
          {
            text,
            attrs: {
              ...(text !== String(link.value) ? { "data-ok-value": String(link.value) } : {}),
              ...(link.color ? { "data-ok-color": link.color } : {}),
            },
          },
        ],
      };
    }),
  };
}

/** Reads nodes and links from a Sankey data table (HTML): source, target and value per row. */
export function readChartSankeyTable(table: HTMLTableElement): {
  nodes: ChartSankeyNode[];
  edges: ChartSankeyEdge[];
  partLabels: Partial<Record<ChartPart, string>>;
} {
  const headRow = table.tHead?.rows[0] ?? null;
  const partLabels: Partial<Record<ChartPart, string>> = {};
  for (const cell of headRow ? [...headRow.cells] : []) {
    const part = cell.getAttribute("data-ok-part") as ChartPart;
    const label = cell.textContent?.trim() ?? "";
    if (chartPartNames.includes(part) && label) partLabels[part] = label;
  }
  const rows = [...table.rows].filter((row) => row.parentElement !== table.tHead);
  const nodes = new Map<string, ChartSankeyNode>();
  const read = (cell: HTMLTableCellElement | undefined) => {
    const title = cell?.textContent?.trim() ?? "";
    const id = cell?.getAttribute("data-ok-value") ?? title;
    const color = cell?.getAttribute("data-ok-color");
    if (id && !nodes.has(id)) nodes.set(id, { id, title, ...(isColor(color) ? { color } : {}) });
    return id;
  };
  const edges: ChartSankeyEdge[] = [];
  for (const row of rows) {
    const [first, second, third] = [...row.cells];
    const source = read(first);
    const target = read(second);
    const value = third?.getAttribute("data-ok-value") ?? third?.textContent?.trim() ?? "";
    const color = third?.getAttribute("data-ok-color");
    if (!source || !target) continue;
    edges.push({ source, target, value, ...(isColor(color) ? { color } : {}) });
  }
  return { nodes: [...nodes.values()], edges, partLabels };
}

// --- Layout -------------------------------------------------------------------------------------

export interface ChartSankeyOptions {
  readonly width: number;
  readonly height: number;
  readonly idPrefix: string;
  readonly orientation?: ChartOrientation | undefined;
  /** Node thickness along the flow in px. Default 20. */
  readonly nodeWidth?: number | undefined;
  /** Share (0 to 0.9) of the fullest rank left between its nodes. Default 0.18. */
  readonly whitespace?: number | undefined;
  /** Fill opacity of links (0 to 1). Default 0.4. */
  readonly edgeOpacity?: number | undefined;
  /** `gradient` (default): links fade from the source to the target color; `solid`: source color. */
  readonly fill?: "gradient" | "solid" | undefined;
  /** One title per rank, drawn above each column (beside each row when vertical). */
  readonly axisTitles?: readonly string[] | undefined;
  /** Prints each node's value after its title. */
  readonly dataLabels?: boolean | undefined;
}

/** Relaxation rounds (each one pass along the flow and one back). */
const ROUNDS = 6;
/** Least room for a horizontal label in px (two characters and an ellipsis). */
const MIN_LABEL = 26;
/** Space between a node and its label in px. */
const LABEL_GAP = 6;
/** Room under the diagram for each loop of a cycle in px (besides its width). */
const LOOP_GAP = 6;

interface Placed {
  rank: number;
  value: number;
  /** Breadth position (top edge) and size. */
  b: number;
  size: number;
  order: number;
}

/** Ranks: longest path from the sources once back links (cycles) are found; sinks go last. */
function rankNodes(graph: ChartSankeyGraph) {
  const count = graph.nodes.length;
  const out: number[][] = Array.from({ length: count }, () => []);
  graph.links.forEach((link, i) => {
    out[link.source]?.push(i);
  });
  // Iterative depth-first search: a link to a node on the current path closes a cycle.
  const state = new Uint8Array(count); // 0 new, 1 on the path, 2 done
  const back = new Set<number>();
  for (let start = 0; start < count; start++) {
    if (state[start]) continue;
    const stack: [number, number][] = [[start, 0]];
    state[start] = 1;
    while (stack.length) {
      const top = stack[stack.length - 1] as [number, number];
      const [at, next] = top;
      const list = out[at] as number[];
      if (next >= list.length) {
        state[at] = 2;
        stack.pop();
        continue;
      }
      top[1] = next + 1;
      const link = list[next] as number;
      const to = (graph.links[link] as GraphLink).target;
      if (state[to] === 1) back.add(link);
      else if (state[to] === 0) {
        state[to] = 1;
        stack.push([to, 0]);
      }
    }
  }
  // Longest path over the forward links (Kahn's order).
  const incoming = new Array<number>(count).fill(0);
  graph.links.forEach((link, i) => {
    if (!back.has(i)) incoming[link.target] = (incoming[link.target] as number) + 1;
  });
  const rank = new Array<number>(count).fill(0);
  const queue: number[] = [];
  for (let i = 0; i < count; i++) if (incoming[i] === 0) queue.push(i);
  for (let q = 0; q < queue.length; q++) {
    const at = queue[q] as number;
    for (const link of out[at] as number[]) {
      if (back.has(link)) continue;
      const to = (graph.links[link] as GraphLink).target;
      rank[to] = Math.max(rank[to] as number, (rank[at] as number) + 1);
      incoming[to] = (incoming[to] as number) - 1;
      if (incoming[to] === 0) queue.push(to);
    }
  }
  const last = Math.max(0, ...rank);
  // Justified: nodes without forward links out end in the last rank.
  for (let i = 0; i < count; i++)
    if ((out[i] as number[]).every((link) => back.has(link))) rank[i] = last;
  return { rank, back, last };
}

/** Sorts a rank by position and pushes overlapping nodes apart inside `[0, extent]`. */
function settle(column: Placed[], gap: number, extent: number) {
  column.sort((a, b) => a.b + a.size / 2 - (b.b + b.size / 2) || a.order - b.order);
  let edge = 0;
  for (const item of column) {
    item.b = Math.max(item.b, edge);
    edge = item.b + item.size + gap;
  }
  edge = extent;
  for (let i = column.length - 1; i >= 0; i--) {
    const item = column[i] as Placed;
    item.b = Math.min(item.b, edge - item.size);
    edge = item.b - gap;
  }
  edge = 0;
  for (const item of column) {
    item.b = Math.max(item.b, edge);
    edge = item.b + item.size + gap;
  }
}

/** A point of the cubic curve between two link ends at `t` (shared by drawing and hit tests). */
const ease = (t: number) => 3 * t * t - 2 * t * t * t;
const along = (t: number) => 1.5 * t * (1 - t) + t * t * t;

export { fitChartText };

/** Whether `(d, b)` lies on a link band (abstract coordinates: d along the flow, b across). */
export function onSankeyLink(link: NonNullable<ChartFlow["link"]>, d: number, b: number): boolean {
  if (link.back) return false;
  if (d < link.d0 || d > link.d1 || link.d1 <= link.d0) return false;
  let lo = 0;
  let hi = 1;
  const target = (d - link.d0) / (link.d1 - link.d0);
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (along(mid) < target) lo = mid;
    else hi = mid;
  }
  const top = link.b0 + (link.b1 - link.b0) * ease((lo + hi) / 2);
  const slack = Math.max(0, (3 - link.w) / 2);
  return b >= top - slack && b <= top + link.w + slack;
}

/** Lays out a Sankey diagram (same contract as `layoutChart`; tooltips are computed here). */
export function layoutSankey(
  graph: ChartSankeyGraph,
  options: ChartSankeyOptions,
  format: ChartFormat,
): ChartLayout {
  const width = Math.max(40, Math.round(options.width));
  const height = Math.max(40, Math.round(options.height));
  const vertical = options.orientation === "vertical";
  const nodeWidth = Math.max(1, Math.min(options.nodeWidth ?? 20, 200));
  const whitespace = Math.max(0, Math.min(options.whitespace ?? 0.18, 0.9));
  const opacity = String(r2(Math.max(0, Math.min(options.edgeOpacity ?? 0.4, 1))));
  const gradient = options.fill !== "solid";
  const titles = (options.axisTitles ?? []).map(textOf);
  const { rank, back, last } = rankNodes(graph);
  const count = graph.nodes.length;

  // Node values: the larger of what flows in and out (cycles included).
  const inSum = new Array<number>(count).fill(0);
  const outSum = new Array<number>(count).fill(0);
  for (const link of graph.links) {
    outSum[link.source] = (outSum[link.source] as number) + link.value;
    inSum[link.target] = (inSum[link.target] as number) + link.value;
  }
  const placed: Placed[] = graph.nodes.map((_, i) => ({
    rank: rank[i] as number,
    value: Math.max(inSum[i] as number, outSum[i] as number),
    b: 0,
    size: 0,
    order: i,
  }));
  const columns: Placed[][] = Array.from({ length: last + 1 }, () => []);
  for (const item of placed) columns[item.rank]?.push(item);

  // The frame: titles above the columns (or beside the rows), loops of cycles below.
  const titleSpace = titles.length
    ? vertical
      ? Math.max(...titles.map((title) => chartTextWidth(title))) + 12
      : FONT + 14
    : 0;
  const breadthStart = titleSpace;
  const depthExtent = vertical ? height : width;
  const breadthTotal = (vertical ? width : height) - titleSpace;
  // Vertical diagrams keep room for the labels before the first and after the last row.
  const labelRoom = vertical ? FONT + LABEL_GAP + 4 : 0;
  const backLinks = graph.links.filter((_, i) => back.has(i));
  const backValue = backLinks.reduce((sum, link) => sum + link.value, 0);
  const loopRoom = backLinks.length ? 8 + backLinks.length * LOOP_GAP : 0;
  const fullest = Math.max(1, ...columns.map((column) => column.length));
  const available = Math.max(10, breadthTotal - loopRoom - 2);
  const gap = fullest > 1 ? (available * whitespace) / (fullest - 1) : 0;
  let scale = Number.POSITIVE_INFINITY;
  for (const column of columns) {
    if (!column.length) continue;
    const sum = column.reduce((total, item) => total + item.value, 0) + backValue;
    scale = Math.min(scale, (available - (column.length - 1) * gap) / Math.max(sum, 1e-9));
  }
  if (!Number.isFinite(scale) || scale < 0) scale = 0;
  const extent = available - backValue * scale;
  for (const item of placed) item.size = Math.max(1, item.value * scale);

  // First positions: each rank stacked in order of first use, centered.
  for (const column of columns) {
    const used = column.reduce((total, item) => total + item.size, 0) + gap * (column.length - 1);
    let b = Math.max(0, (extent - used) / 2);
    for (const item of column) {
      item.b = b;
      b += item.size + gap;
    }
  }
  // Relaxation: toward the value-weighted center of the neighbors, along the flow and back.
  const center = (at: number) => {
    const item = placed[at] as Placed;
    return item.b + item.size / 2;
  };
  const forward = graph.links.filter((_, i) => !back.has(i));
  for (let round = 0; round < ROUNDS; round++) {
    const alpha = 0.9 ** (round + 1);
    for (const pass of [0, 1]) {
      const order = pass === 0 ? columns.slice(1) : columns.slice(0, -1).reverse();
      for (const column of order) {
        for (const item of column) {
          let weight = 0;
          let sum = 0;
          for (const link of forward) {
            const other =
              pass === 0
                ? link.target === item.order
                  ? link.source
                  : -1
                : link.source === item.order
                  ? link.target
                  : -1;
            if (other < 0) continue;
            weight += link.value;
            sum += center(other) * link.value;
          }
          if (weight > 0) item.b += (sum / weight - item.size / 2 - item.b) * alpha;
        }
        settle(column, gap, extent);
      }
    }
  }

  // Link ends: sorted at each node by the other end's position; back links last.
  const linkSize = (link: GraphLink) => link.value * scale;
  const startAt = new Array<number>(graph.links.length).fill(0);
  const endAt = new Array<number>(graph.links.length).fill(0);
  for (let at = 0; at < count; at++) {
    const item = placed[at] as Placed;
    const outs = graph.links
      .map((link, i) => ({ link, i }))
      .filter(({ link }) => link.source === at)
      .sort(
        (a, b) =>
          Number(back.has(a.i)) - Number(back.has(b.i)) ||
          center(a.link.target) - center(b.link.target) ||
          a.i - b.i,
      );
    let b = item.b;
    for (const { link, i } of outs) {
      startAt[i] = b;
      b += linkSize(link);
    }
    const ins = graph.links
      .map((link, i) => ({ link, i }))
      .filter(({ link }) => link.target === at)
      .sort(
        (a, b) =>
          Number(back.has(a.i)) - Number(back.has(b.i)) ||
          center(a.link.source) - center(b.link.source) ||
          a.i - b.i,
      );
    b = item.b;
    for (const { link, i } of ins) {
      endAt[i] = b;
      b += linkSize(link);
    }
  }

  // Abstract (d along the flow, b across) → SVG.
  // Loops of cycles bulge past the nodes they leave and enter (a curve 0.75 × its radius deep).
  const widest = Math.max(0, ...backLinks.map((link) => link.value * scale));
  const edge = labelRoom + (backLinks.length ? 0.75 * (8 + widest / 2) + widest / 2 + 2 : 0);
  const step = last > 0 ? (depthExtent - edge * 2 - nodeWidth) / last : 0;
  const dOf = (r: number) =>
    edge + (last > 0 ? step * r : (depthExtent - edge * 2 - nodeWidth) / 2);
  const bOf = (b: number) => breadthStart + 1 + b;
  const pt = (d: number, b: number) => (vertical ? `${fmt(b)},${fmt(d)}` : `${fmt(d)},${fmt(b)}`);
  const rect = (d: number, b: number, along: number, across: number): ChartRect =>
    vertical
      ? { x: r2(b), y: r2(d), width: r2(across), height: r2(along) }
      : { x: r2(d), y: r2(b), width: r2(along), height: r2(across) };

  const defs: ChartNode[] = [];
  const linkNodes: ChartNode[] = [];
  const nodeShapes: ChartNode[] = [];
  const labels: ChartNode[] = [];
  const marks: ChartMark[] = [];
  const nodeMark = new Array<number>(count);
  const valueText = (value: number) => format.value(value, 0);
  const linkMarks: number[][] = Array.from({ length: count }, () => []);

  graph.nodes.forEach((item, at) => {
    const p = placed[at] as Placed;
    const d = dOf(p.rank);
    const b = bOf(p.b);
    const box = rect(d, b, nodeWidth, p.size);
    nodeShapes.push(
      node("rect", {
        x: fmt(box.x),
        y: fmt(box.y),
        width: fmt(box.width),
        height: fmt(box.height),
        rx: "2",
        "data-ok-chart-node": "",
        "data-ok-color": item.color,
      }),
    );
    const full = options.dataLabels
      ? `${item.title} ${format.dataLabel(p.value, 0, at, valueText(p.value))}`
      : item.title;
    // Horizontal labels sit between two ranks: longer ones are cut (the table keeps the name).
    // The first gap holds the labels of the first two ranks (after the first, before the second).
    // Narrow charts leave out labels that would keep fewer than two characters.
    const gapRoom = step - nodeWidth - LABEL_GAP * 2;
    const room = p.rank <= 1 ? (gapRoom - LABEL_GAP) / 2 : gapRoom;
    const fits = vertical || last === 0 || room >= MIN_LABEL;
    const text = vertical || last === 0 ? full : fitChartText(full, room);
    if (vertical) {
      // First row: label after the node; the others before it. Kept inside the width.
      const half = chartTextWidth(text) / 2;
      const cx = Math.max(Math.min(b + p.size / 2, width - half), Math.min(half, width / 2));
      const y = p.rank === 0 && last > 0 ? d + nodeWidth + LABEL_GAP : d - LABEL_GAP;
      labels.push(
        node(
          "text",
          {
            x: fmt(cx),
            y: fmt(y),
            dy: p.rank === 0 && last > 0 ? "0.71em" : "0",
            "text-anchor": "middle",
            "data-ok-chart-node-label": "",
          },
          undefined,
          text,
        ),
      );
    } else if (fits) {
      const first = p.rank === 0 && last > 0;
      labels.push(
        node(
          "text",
          {
            x: fmt(first ? d + nodeWidth + LABEL_GAP : d - LABEL_GAP),
            y: fmt(b + p.size / 2),
            dy: "0.35em",
            "text-anchor": first ? "start" : "end",
            "data-ok-chart-node-label": "",
          },
          undefined,
          text,
        ),
      );
    }
    nodeMark[at] = marks.length;
    const rows = [
      ...((inSum[at] as number) > 0
        ? [
            {
              name: format.part("incoming"),
              value: valueText(inSum[at] as number),
              color: item.color,
            },
          ]
        : []),
      ...((outSum[at] as number) > 0
        ? [
            {
              name: format.part("outgoing"),
              value: valueText(outSum[at] as number),
              color: item.color,
            },
          ]
        : []),
    ];
    marks.push({
      series: 0,
      type: "sankey",
      index: at,
      x: at,
      value: p.value,
      px: r2(box.x + box.width / 2),
      py: r2(box.y + box.height / 2),
      color: item.color,
      flow: {
        kind: "node",
        order: p.rank * 2,
        cross: p.b,
        rect: box,
        vertical,
        links: [],
        title: item.title,
        rows,
      },
    });
  });

  // Loops of cycles: one lane each under the diagram.
  let lane = extent + 8;
  graph.links.forEach((link, i) => {
    const source = graph.nodes[link.source] as GraphNode;
    const target = graph.nodes[link.target] as GraphNode;
    const ps = placed[link.source] as Placed;
    const pt0 = placed[link.target] as Placed;
    const w = Math.max(1, linkSize(link));
    const d0 = dOf(ps.rank) + nodeWidth;
    const d1 = dOf(pt0.rank);
    const b0 = bOf(startAt[i] as number);
    const b1 = bOf(endAt[i] as number);
    const isBack = back.has(i);
    let d: string;
    let paint: Record<string, string>;
    if (isBack) {
      // A dashed loop: out of the source, down to its lane, back and into the target.
      const loop = bOf(lane + w / 2);
      lane += w + LOOP_GAP;
      const r = 8 + w / 2;
      const s = b0 + w / 2;
      const t = b1 + w / 2;
      d = `M${pt(d0, s)}C${pt(d0 + r, s)} ${pt(d0 + r, loop)} ${pt(d0, loop)}L${pt(d1, loop)}C${pt(d1 - r, loop)} ${pt(d1 - r, t)} ${pt(d1, t)}`;
      paint = {
        "stroke-width": fmt(w),
        // Dashes scale with the width, so wide loops read as dashes, not hatching.
        "stroke-dasharray": `${fmt(Math.max(8, w * 2))} ${fmt(Math.max(4, w * 0.4))}`,
        "data-ok-color": link.color ?? source.color,
        "data-ok-back": "",
      };
    } else {
      const m = (d0 + d1) / 2;
      d = `M${pt(d0, b0)}C${pt(m, b0)} ${pt(m, b1)} ${pt(d1, b1)}L${pt(d1, b1 + w)}C${pt(m, b1 + w)} ${pt(m, b0 + w)} ${pt(d0, b0 + w)}Z`;
      if (gradient && !link.color && source.color !== target.color) {
        const id = `${options.idPrefix}-link-${i}`;
        const [x1, y1, x2, y2] = vertical ? [0, d0, 0, d1] : [d0, 0, d1, 0];
        defs.push(
          node(
            "linearGradient",
            {
              id,
              gradientUnits: "userSpaceOnUse",
              x1: fmt(x1),
              y1: fmt(y1),
              x2: fmt(x2),
              y2: fmt(y2),
            },
            [
              node("stop", {
                offset: "0",
                "data-ok-chart-stop": "",
                "data-ok-color": source.color,
              }),
              node("stop", {
                offset: "1",
                "data-ok-chart-stop": "",
                "data-ok-color": target.color,
              }),
            ],
          ),
        );
        paint = { fill: `url(#${id})` };
      } else paint = { "data-ok-color": link.color ?? source.color };
    }
    linkNodes.push(
      node("path", {
        d,
        [isBack ? "stroke-opacity" : "fill-opacity"]: opacity,
        "data-ok-chart-link": "",
        ...paint,
      }),
    );
    const mark = marks.length;
    (linkMarks[link.source] as number[]).push(mark);
    (linkMarks[link.target] as number[]).push(mark);
    const mid = isBack
      ? { d: (d0 + d1) / 2, b: bOf(lane) }
      : { d: (d0 + d1) / 2, b: (b0 + b1) / 2 + w / 2 };
    marks.push({
      series: 0,
      type: "sankey",
      index: count + i,
      x: count + i,
      value: link.value,
      px: r2(vertical ? mid.b : mid.d),
      py: r2(vertical ? mid.d : mid.b),
      color: link.color ?? source.color,
      flow: {
        kind: "link",
        order: ps.rank * 2 + 1,
        cross: Math.min(b0, b1),
        link: { d0, d1, b0, b1, w, back: isBack },
        vertical,
        links: [],
        path: d,
        paint,
        title: `${source.title} → ${target.title}`,
        rows: [
          {
            name: format.part("y"),
            value: valueText(link.value),
            color: link.color ?? source.color,
          },
        ],
      },
    });
  });
  // Nodes highlight their links.
  graph.nodes.forEach((_, at) => {
    const index = nodeMark[at] as number;
    const mark = marks[index] as ChartMark;
    marks[index] = {
      ...mark,
      flow: { ...(mark.flow as ChartFlow), links: linkMarks[at] as number[] },
    };
  });

  const titleNodes = titles.flatMap((title, r): ChartNode[] => {
    if (!title || r > last) return [];
    if (vertical)
      return [
        node(
          "text",
          {
            x: "0",
            y: fmt(dOf(r) + nodeWidth / 2),
            dy: "0.35em",
            "text-anchor": "start",
            "data-ok-chart-axis-title": "",
          },
          undefined,
          title,
        ),
      ];
    const half = chartTextWidth(title) / 2;
    const cx = Math.max(Math.min(dOf(r) + nodeWidth / 2, width - half), Math.min(half, width / 2));
    return [
      node(
        "text",
        {
          x: fmt(cx),
          y: "0",
          dy: "0.71em",
          "text-anchor": "middle",
          "data-ok-chart-axis-title": "",
        },
        undefined,
        title,
      ),
    ];
  });

  const plot = vertical
    ? { x: r2(breadthStart), y: 0, width: r2(breadthTotal), height }
    : { x: 0, y: r2(breadthStart), width, height: r2(breadthTotal) };
  return {
    width,
    height,
    plot,
    mode: "flow",
    horizontal: false,
    banded: false,
    band: 0,
    slots: [],
    marks,
    activeRadius: 0,
    nodes: [
      ...(defs.length ? [node("defs", {}, defs)] : []),
      ...(titleNodes.length ? [node("g", { "data-ok-chart-axis": "titles" }, titleNodes)] : []),
      node("g", { "data-ok-chart-crosshair": "" }, []),
      node("g", { "data-ok-chart-series-group": "" }, [
        node("g", { "data-ok-chart-series": "", "data-ok-type": "sankey", "data-ok-index": "0" }, [
          ...linkNodes,
          ...nodeShapes,
        ]),
      ]),
      node("g", { "data-ok-chart-active": "" }, []),
      node("g", { "data-ok-chart-data-labels": "" }, labels),
    ],
  };
}
