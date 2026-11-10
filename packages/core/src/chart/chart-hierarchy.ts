import type { ChartFormat } from "./chart-format.js";
import type { ChartLayout, ChartMark, ChartNode } from "./chart-layout.js";
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
 * Hierarchy charts (ADR-0058): `tree`, `sunburst` and `icicle` draw one hierarchy. React passes
 * nested nodes (`hierarchy`); HTML authors write one table row per node with its parent, in
 * document order (a parent before its children). Both become the same `ChartHierarchy`: nodes in
 * preorder with their depth, parent, children and value, so the layouts are shared.
 */

/** A node of a hierarchy chart: a name, an optional value and color, and its children. */
export interface ChartHierarchyNode {
  /** Unique id (default the name; repeated names get `-2`, `-3`…). */
  readonly id?: string | number | undefined;
  readonly name?: string | number | undefined;
  /** ApexCharts' name of `name` (sunburst and icicle data points). */
  readonly x?: string | number | undefined;
  /** The value of a leaf; parents are the sum of their children. */
  readonly value?: number | string | undefined;
  /** ApexCharts' name of `value`. */
  readonly y?: number | string | undefined;
  /** A palette color for the node and its subtree. */
  readonly color?: ChartColor | undefined;
  readonly children?: readonly ChartHierarchyNode[] | undefined;
}

/** Hierarchy chart types (ADR-0058). */
export const chartHierarchyTypes = ["tree", "sunburst", "icicle"] as const;
export type ChartHierarchyType = (typeof chartHierarchyTypes)[number];
export const isHierarchyChart = (type: unknown): type is ChartHierarchyType =>
  chartHierarchyTypes.includes(type as ChartHierarchyType);

/** Where the root sits (ApexTree `direction`); `radial` puts it in the center. */
export const chartDirections = ["top", "bottom", "left", "right", "radial"] as const;
export type ChartDirection = (typeof chartDirections)[number];
/** Tree layouts (ApexTree `layoutType`): `tree` tidy, `cluster` a dendrogram (leaves aligned). */
export const chartLayoutTypes = ["tree", "cluster"] as const;
export type ChartLayoutType = (typeof chartLayoutTypes)[number];
/** Tree links (ApexTree `edgeStyle`). */
export const chartEdgeStyles = ["orthogonal", "curved", "straight"] as const;
export type ChartEdgeStyle = (typeof chartEdgeStyles)[number];
/** Partitions: shallow branches stop at their level or `extend` to the edge. */
export const chartLeaves = ["extend", "stop"] as const;
export type ChartLeaf = (typeof chartLeaves)[number];
/** Icicle zoom (ApexCharts `zoomType`): `value` keeps the levels, `both` makes the branch the top. */
export const chartZoomTypes = ["value", "both"] as const;
export type ChartZoomType = (typeof chartZoomTypes)[number];

/** One node in preorder. */
export interface ChartHierarchyItem {
  readonly id: string;
  readonly name: string;
  /** The value given (`null`: none). */
  readonly own: number | null;
  /** Leaves: their value (1 each when no node has one); parents: the sum of their children. */
  readonly value: number;
  readonly color: ChartColor;
  /** Levels below the node where its color starts (0: it starts here; written in the table). */
  readonly tone: number;
  readonly depth: number;
  /** Index of the parent item, `-1` for roots. */
  readonly parent: number;
  readonly children: readonly number[];
}

export interface ChartHierarchy {
  readonly items: readonly ChartHierarchyItem[];
  readonly roots: readonly number[];
  /** Some node has a value (values are shown in the table and the tooltip). */
  readonly hasValues: boolean;
}

/** At most this many nodes and levels (untrusted input). */
const MAX_NODES = 5000;
const MAX_DEPTH = 64;
const isColor = (value: unknown): value is ChartColor => chartColors.includes(value as ChartColor);
const textOf = (value: unknown) => String(value ?? "").slice(0, 200);

/**
 * Normalizes nested nodes (one root or several). Colors: a node's own; else palette colors in
 * order (`colors`, then the chart palette) for the roots, or for the children of a single root;
 * else the parent's.
 */
export function chartHierarchy(input: {
  hierarchy?: ChartHierarchyNode | readonly ChartHierarchyNode[] | undefined;
  colors?: readonly ChartColor[] | undefined;
}): ChartHierarchy {
  const given = input.hierarchy;
  const top = (Array.isArray(given) ? given : given ? [given] : []) as ChartHierarchyNode[];
  const palette = (input.colors ?? []).filter(isColor);
  const colorAt = (i: number) =>
    palette[i] ?? (chartDefaultColors[i % chartDefaultColors.length] as ChartColor);
  const items: {
    id: string;
    name: string;
    own: number | null;
    value: number;
    color: ChartColor;
    tone: number;
    depth: number;
    parent: number;
    children: number[];
  }[] = [];
  const ids = new Set<string>();
  const single = top.filter((entry) => entry && typeof entry === "object").length === 1;
  const visit = (entry: ChartHierarchyNode, depth: number, parent: number, at: number) => {
    if (!entry || typeof entry !== "object" || items.length >= MAX_NODES) return;
    const name = textOf(entry.name ?? entry.x ?? entry.id ?? "");
    const base = textOf(entry.id ?? name);
    let id = base;
    for (let n = 2; ids.has(id); n++) id = `${base}-${n}`;
    ids.add(id);
    const raw = parseChartNumber(entry.value ?? entry.y);
    const up = items[parent];
    // Palette colors start at the roots, or at the children of a single root.
    const starts = depth === 0 || (single && depth === 1);
    const palettePosition = depth === 0 ? at : at + 1;
    const color = isColor(entry.color)
      ? entry.color
      : starts || !up
        ? colorAt(palettePosition)
        : up.color;
    const index = items.length;
    items.push({
      id,
      name,
      own: raw === null || raw < 0 ? null : raw,
      value: 0,
      color,
      tone: isColor(entry.color) || starts || !up ? 0 : up.tone + 1,
      depth,
      parent,
      children: [],
    });
    up?.children.push(index);
    if (depth + 1 >= MAX_DEPTH) return;
    (Array.isArray(entry.children) ? entry.children : []).forEach((child, i) => {
      visit(child, depth + 1, index, i);
    });
  };
  top.forEach((entry, i) => {
    visit(entry, 0, -1, i);
  });
  const hasValues = items.some((item) => item.own !== null);
  // Values bottom up (children follow their parent in preorder).
  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i] as (typeof items)[number];
    item.value = item.children.length
      ? item.children.reduce((sum, child) => sum + (items[child]?.value ?? 0), 0)
      : (item.own ?? (hasValues ? 0 : 1));
  }
  return {
    items,
    roots: items.flatMap((item, i) => (item.parent < 0 ? [i] : [])),
    hasValues,
  };
}

/** Indexes of the item and its ancestors, root first. */
export function chartHierarchyPath(hierarchy: ChartHierarchy, index: number): number[] {
  const path: number[] = [];
  for (let at = index; at >= 0 && path.length <= MAX_DEPTH; ) {
    path.unshift(at);
    at = hierarchy.items[at]?.parent ?? -1;
  }
  return path;
}

/** The index of the item with this id, or `-1`. */
export const chartHierarchyIndex = (hierarchy: ChartHierarchy, id: string | null | undefined) =>
  id === null || id === undefined ? -1 : hierarchy.items.findIndex((item) => item.id === id);

// --- Data table ---------------------------------------------------------------------------------

/**
 * The data table: one row per node in preorder (the name as the row header, then its parent's
 * name and, when values are given, its value). Ids that differ from the names and colors where they start are
 * cell attributes.
 */
export function chartHierarchyTable(
  hierarchy: ChartHierarchy,
  format: ChartFormat,
): ChartTableModel {
  const parts: ChartPart[] = hierarchy.hasValues ? ["name", "parent", "y"] : ["name", "parent"];
  const head = parts.map(
    (part): ChartTableCell => ({ text: format.part(part), attrs: { "data-ok-part": part } }),
  );
  return {
    head,
    parts: [],
    rows: hierarchy.items.map((item) => {
      const parent = hierarchy.items[item.parent];
      const cells: ChartTableCell[] = [
        {
          text: parent?.name ?? "",
          attrs: parent && parent.id !== parent.name ? { "data-ok-value": parent.id } : {},
        },
      ];
      if (hierarchy.hasValues) {
        const text = format.value(item.value, 0);
        cells.push({
          text,
          attrs: text !== String(item.value) ? { "data-ok-value": String(item.value) } : {},
        });
      }
      return {
        header: {
          text: item.name,
          attrs: {
            ...(item.id !== item.name ? { "data-ok-value": item.id } : {}),
            // Colors where they start (own or from the palette), so HTML draws the same ones.
            ...(item.tone === 0 ? { "data-ok-color": item.color } : {}),
          },
        },
        cells,
      };
    }),
  };
}

/**
 * Reads nested nodes from a hierarchy data table (HTML): one row per node, its name as the row
 * header, then its parent (empty for roots) and its value. A parent must come before its children;
 * an unknown parent makes the row a root.
 */
export function readChartHierarchyTable(table: HTMLTableElement): {
  hierarchy: ChartHierarchyNode[];
  partLabels: Partial<Record<ChartPart, string>>;
} {
  const headRow = table.tHead?.rows[0] ?? null;
  const partLabels: Partial<Record<ChartPart, string>> = {};
  const headParts: (ChartPart | null)[] = [];
  for (const cell of headRow ? [...headRow.cells] : []) {
    const part = cell.getAttribute("data-ok-part") as ChartPart;
    const label = cell.textContent?.trim() ?? "";
    headParts.push(chartPartNames.includes(part) ? part : null);
    if (chartPartNames.includes(part) && label) partLabels[part] = label;
  }
  const valueColumn = headParts.indexOf("y");
  const parentColumn = headParts.includes("parent") ? headParts.indexOf("parent") : 1;
  type Mutable = {
    id: string;
    name: string;
    value?: string;
    color?: ChartColor;
    children: Mutable[];
  };
  const byId = new Map<string, Mutable>();
  const roots: Mutable[] = [];
  const rows = [...table.rows].filter((row) => row.parentElement !== table.tHead);
  for (const row of rows.slice(0, MAX_NODES)) {
    const cells = [...row.cells];
    const head = cells[0];
    const name = head?.textContent?.trim() ?? "";
    const id = head?.getAttribute("data-ok-value") ?? name;
    if (!id && !name) continue;
    const parentCell = cells[parentColumn];
    const parentId =
      parentCell?.getAttribute("data-ok-value") ?? parentCell?.textContent?.trim() ?? "";
    const valueCell = valueColumn >= 0 ? cells[valueColumn] : undefined;
    const value = valueCell?.getAttribute("data-ok-value") ?? valueCell?.textContent?.trim();
    const color = head?.getAttribute("data-ok-color");
    const entry: Mutable = {
      id,
      name,
      ...(value ? { value } : {}),
      ...(isColor(color) ? { color } : {}),
      children: [],
    };
    const parent = parentId ? byId.get(parentId) : undefined;
    if (parent) parent.children.push(entry);
    else roots.push(entry);
    if (!byId.has(id)) byId.set(id, entry);
  }
  return { hierarchy: roots, partLabels };
}

// --- Interaction ----------------------------------------------------------------------------------

/** How arrow keys walk a hierarchy: the direction children grow in (`radial`: outward). */
export type ChartTreeAxis = "down" | "up" | "right" | "left" | "radial";

/** A node of a hierarchy chart as a mark: its relatives, its shape and its tooltip. */
export interface ChartTreeMark {
  /** The node's id. */
  readonly id: string;
  /** Depth as drawn (keyboard rows). */
  readonly depth: number;
  /** Marks of the parent (`-1`: none drawn) and of the children drawn. */
  readonly parent: number;
  readonly children: readonly number[];
  /** Position across the depth (left to right, top to bottom, or the angle). */
  readonly cross: number;
  readonly axis: ChartTreeAxis;
  /** What a pointer hits: a circle (tree nodes), a rectangle (icicle cells) or an arc (sunburst). */
  readonly hit:
    | { readonly kind: "circle"; readonly cx: number; readonly cy: number; readonly r: number }
    | {
        readonly kind: "rect";
        readonly x: number;
        readonly y: number;
        readonly width: number;
        readonly height: number;
      }
    | {
        readonly kind: "arc";
        readonly cx: number;
        readonly cy: number;
        readonly inner: number;
        readonly outer: number;
        readonly start: number;
        readonly end: number;
      };
  /** The highlight drawn over the node. */
  readonly outline: ChartNode;
  /** Tree links: the path from the parent (highlighted with the lineage). */
  readonly link?: string | undefined;
  /** Enter or a click: `toggle` expands or collapses (trees), `in` / `out` drill (partitions). */
  readonly action?: "toggle" | "in" | "out" | undefined;
  /** Trees: the node's children are hidden. */
  readonly collapsed?: boolean | undefined;
  /** Partitions: the names from the root to the node (the drill path when it is drilled). */
  readonly path?: readonly string[] | undefined;
  readonly title: string;
  readonly rows: readonly {
    readonly name: string;
    readonly value: string;
    readonly color: ChartColor;
  }[];
}

/** The state of a hierarchy chart for its owners (drill, collapse). */
export interface ChartHierarchyState {
  readonly type: ChartHierarchyType;
  /** The node the chart is zoomed into (`null`: none). */
  readonly drill: string | null;
  /** Where Escape and the back control go (`undefined`: not drilled). */
  readonly up?: string | null | undefined;
  /** Names from the top to the drilled node. */
  readonly path: readonly string[];
  /** Drilling is on (sunburst and icicle without `disableZoomOnClick`). */
  readonly drillable: boolean;
}

/** The tooltip title of a node: the names from its root, joined by ` › `. */
export const chartHierarchyTitle = (hierarchy: ChartHierarchy, index: number) =>
  chartHierarchyPath(hierarchy, index)
    .map((at) => hierarchy.items[at]?.name ?? "")
    .join(" › ");

/** Tooltip rows of a node: its value (when values are given), its level and its children. */
export function chartHierarchyRows(
  hierarchy: ChartHierarchy,
  index: number,
  format: ChartFormat,
  collapsed = false,
): ChartTreeMark["rows"] {
  const item = hierarchy.items[index] as ChartHierarchyItem;
  return [
    ...(hierarchy.hasValues
      ? [{ name: format.part("y"), value: format.value(item.value, 0), color: item.color }]
      : []),
    { name: format.part("level"), value: format.number(item.depth + 1), color: item.color },
    ...(item.children.length
      ? [
          {
            name: format.part(collapsed ? "collapsed" : "children"),
            value: format.number(item.children.length),
            color: item.color,
          },
        ]
      : []),
  ];
}

/** Whether `(x, y)` lies on a hierarchy mark (4px of slack around circles). */
export function onChartTreeMark(tree: ChartTreeMark, x: number, y: number): boolean {
  const { hit } = tree;
  if (hit.kind === "circle") return Math.hypot(x - hit.cx, y - hit.cy) <= hit.r + 4;
  if (hit.kind === "rect")
    return x >= hit.x && x <= hit.x + hit.width && y >= hit.y && y <= hit.y + hit.height;
  const distance = Math.hypot(x - hit.cx, y - hit.cy);
  if (distance < hit.inner || distance > hit.outer) return false;
  const angle = ((Math.atan2(x - hit.cx, hit.cy - y) * 180) / Math.PI + 360) % 360;
  const from = (((angle - hit.start) % 360) + 360) % 360;
  return hit.end - hit.start >= 360 || from <= hit.end - hit.start;
}

const KEYS: Record<ChartTreeAxis, readonly [string, string, string, string]> = {
  // child, parent, next, previous
  down: ["ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"],
  up: ["ArrowUp", "ArrowDown", "ArrowRight", "ArrowLeft"],
  right: ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"],
  left: ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp"],
  radial: ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"],
};

/**
 * Keyboard over a hierarchy: one arrow goes to the first child, the opposite one to the parent,
 * the other two to the next or previous node drawn at the same depth; Home goes to the first node,
 * End to the last. `undefined` when the key isn't one of these; the mark index otherwise.
 */
export function nextChartTreeMark(
  marks: readonly ChartMark[],
  from: number | null,
  key: string,
): number | null | undefined {
  if (marks.length === 0)
    return key.startsWith("Arrow") || key === "Home" || key === "End" ? null : undefined;
  if (key === "Home") return 0;
  if (key === "End") return marks.length - 1;
  const current = from === null ? undefined : marks[from]?.tree;
  if (!key.startsWith("Arrow")) return undefined;
  if (!current || from === null) return 0;
  const [child, parent, next, previous] = KEYS[current.axis];
  if (key === child) return current.children[0] ?? from;
  if (key === parent) return current.parent >= 0 ? current.parent : from;
  if (key !== next && key !== previous) return undefined;
  const row = marks
    .map((mark, index) => ({ tree: mark.tree, index }))
    .filter(({ tree }) => tree && tree.depth === current.depth)
    .sort((a, b) => (a.tree as ChartTreeMark).cross - (b.tree as ChartTreeMark).cross);
  const at = row.findIndex(({ index }) => index === from);
  const step = row[at + (key === next ? 1 : -1)];
  return step ? step.index : from;
}

/** The mark of the node with this id in a layout, or `null`. */
export function chartTreeMarkOf(layout: ChartLayout, id: string | null): number | null {
  if (id === null) return null;
  const at = layout.marks.findIndex((mark) => mark.tree?.id === id);
  return at < 0 ? null : at;
}

/** What Enter or a click on a hierarchy mark does. */
export type ChartHierarchyAction =
  | { readonly kind: "toggle"; readonly id: string }
  | {
      readonly kind: "drill";
      /** The node to zoom into (`null`: none). */
      readonly id: string | null;
      /** The names from the root to that node (empty for `null`). */
      readonly path: readonly string[];
      /** The node that stays active after the redraw. */
      readonly focus: string;
    };

/** The action of a mark (`null`: none): expand or collapse a tree node, or drill in or out. */
export function chartHierarchyAction(
  layout: ChartLayout,
  mark: number | null,
): ChartHierarchyAction | null {
  const tree = mark === null ? undefined : layout.marks[mark]?.tree;
  if (!tree?.action) return null;
  if (tree.action === "toggle") return { kind: "toggle", id: tree.id };
  const path = tree.path ?? [];
  if (tree.action === "in") return { kind: "drill", id: tree.id, path, focus: tree.id };
  const up = layout.hierarchy?.up ?? null;
  return { kind: "drill", id: up, path: up === null ? [] : path.slice(0, -1), focus: tree.id };
}

/** Escape and the back control: one level up from the drilled node (`null` when not drilled). */
export function chartDrillUp(layout: ChartLayout): ChartHierarchyAction | null {
  const state = layout.hierarchy;
  if (!state?.drill) return null;
  const up = state.up ?? null;
  return {
    kind: "drill",
    id: up,
    path: up === null ? [] : state.path.slice(0, -1),
    focus: state.drill,
  };
}

/** Collapsed ids after toggling one (kept in order, each once). */
export function toggleChartCollapsed(collapsed: readonly string[], id: string): string[] {
  return collapsed.includes(id) ? collapsed.filter((entry) => entry !== id) : [...collapsed, id];
}

/** Texts of the drill controls (localizable). */
export const chartDrillLabels = { drillUp: "Back" } as const;
