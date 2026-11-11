import type { ChartFormat } from "./chart-format.js";
import {
  type ChartHierarchy,
  type ChartHierarchyItem,
  type ChartHierarchyState,
  type ChartLeaf,
  type ChartTreeMark,
  chartHierarchyIndex,
  chartHierarchyPath,
  chartHierarchyRows,
  chartHierarchyTitle,
} from "./chart-hierarchy.js";
import {
  type ChartLayout,
  type ChartMark,
  type ChartNode,
  chartTextWidth,
  FONT,
  fmt,
  node,
  r2,
} from "./chart-layout.js";
import { polarPoint, slicePath } from "./chart-polar.js";
import { fitChartText } from "./chart-sankey.js";

/*
 * Partition charts (ADR-0058, ApexCharts v8 `sunburst` and `icicle`): each node gets a share of
 * its parent's span in proportion to its value, one ring (sunburst) or band (icicle) per level.
 * A drilled node (`drill`, ApexCharts `zoomOnClick`) becomes the visible root. Positions are
 * computed, never measured, so server, React and HTML agree.
 */

export interface ChartPartitionOptions {
  readonly width: number;
  readonly height: number;
  /** The node zoomed into (an id; nodes without children are ignored). */
  readonly drill?: string | null | undefined;
  /** Clicks, Enter and Space don't drill. */
  readonly disableZoomOnClick?: boolean | undefined;
  /** Shallow branches end at their level (`stop`) or reach the edge (`extend`). */
  readonly leaf?: ChartLeaf | undefined;
  /** Gap between cells in px (a paper stroke). Default 1. */
  readonly spacing?: number | undefined;
  /** How much paler each level is than the one its color starts at (0 to 1). Default 0.14. */
  readonly tint?: number | undefined;
  /** Prints each node's value under its name (when values are given). */
  readonly dataLabels?: boolean | undefined;
  /** Sunburst: the hole in % of the radius. Default 15. */
  readonly innerSize?: number | undefined;
  /** Sunburst: where the rings start and end, in degrees clockwise from 12 o'clock. */
  readonly startAngle?: number | undefined;
  readonly endAngle?: number | undefined;
}

/** A node's span: `a0` to `a1` across (degrees or px), at `level` (0: the drilled node). */
export interface Span {
  readonly item: number;
  readonly a0: number;
  readonly a1: number;
  readonly level: number;
}

/** Shares of `[a0, a1]` for `items` and their descendants, in preorder. */
export function split(
  hierarchy: ChartHierarchy,
  items: readonly number[],
  a0: number,
  a1: number,
  level: number,
  out: Span[],
) {
  const total = items.reduce((sum, item) => sum + (hierarchy.items[item]?.value ?? 0), 0);
  if (total <= 0) return;
  let at = a0;
  for (const item of items) {
    const entry = hierarchy.items[item];
    if (!entry || entry.value <= 0) continue;
    const end = at + ((a1 - a0) * entry.value) / total;
    out.push({ item, a0: at, a1: end, level });
    split(hierarchy, entry.children, at, end, level + 1, out);
    at = end;
  }
}

/** The drilled node (an index; `-1` when none or a leaf) and the state owners read. */
export function drillState(
  hierarchy: ChartHierarchy,
  type: "sunburst" | "icicle",
  options: ChartPartitionOptions,
): { index: number; state: ChartHierarchyState } {
  const found = chartHierarchyIndex(hierarchy, options.drill);
  const index = found >= 0 && (hierarchy.items[found]?.children.length ?? 0) > 0 ? found : -1;
  const item = hierarchy.items[index];
  const parent = item ? hierarchy.items[item.parent] : undefined;
  return {
    index,
    state: {
      type,
      drill: item ? item.id : null,
      ...(item ? { up: parent ? parent.id : null } : {}),
      path: item
        ? chartHierarchyPath(hierarchy, index).map((at) => hierarchy.items[at]?.name ?? "")
        : [],
      drillable: !options.disableZoomOnClick,
    },
  };
}

/** Least room for a label in px (two characters and an ellipsis). */
const MIN_LABEL = 26;
export const fits = (room: number, text: string) =>
  room >= Math.min(MIN_LABEL, chartTextWidth(text));
/** Labels are white on strong shades and primary text on pale ones (as treemap cells). */
export const tone = (opacity: number) => (opacity >= 0.6 ? "inside" : "plain");

/** The paint of one span: its shade (`tint` per level) and the gap around it. */
export function spanPaint(
  hierarchy: ChartHierarchy,
  span: Span,
  options: ChartPartitionOptions,
): { opacity: number; spacing: string } {
  const entry = hierarchy.items[span.item] as ChartHierarchy["items"][number];
  const tint = Math.max(0, Math.min(options.tint ?? 0.14, 1));
  return {
    opacity: r2(Math.max(0.3, 1 - tint * entry.tone)),
    spacing: fmt(Math.max(0, Math.min(options.spacing ?? 1, 8))),
  };
}

/** What Enter or a click does on a span (drill in, or out of the drilled node). */
export function actionOf(
  hierarchy: ChartHierarchy,
  span: Span,
  drill: number,
  options: ChartPartitionOptions,
): ChartTreeMark["action"] {
  if (options.disableZoomOnClick) return undefined;
  if (span.item === drill) return "out";
  return (hierarchy.items[span.item]?.children.length ?? 0) > 0 ? "in" : undefined;
}

/** Relatives as mark indexes: the parent span drawn, and the child spans drawn. */
export function relatives(hierarchy: ChartHierarchy, spans: readonly Span[]) {
  const markOf = new Map<number, number>();
  spans.forEach((span, i) => {
    markOf.set(span.item, i);
  });
  return spans.map((span) => {
    const entry = hierarchy.items[span.item] as ChartHierarchy["items"][number];
    return {
      parent: markOf.get(entry.parent) ?? -1,
      children: entry.children.flatMap((child) => {
        const at = markOf.get(child);
        return at === undefined ? [] : [at];
      }),
    };
  });
}

/** The label of a node: its name, and its value with data labels. */
export const labelOf = (
  hierarchy: ChartHierarchy,
  item: number,
  format: ChartFormat,
  dataLabels: boolean | undefined,
) => {
  const entry = hierarchy.items[item] as ChartHierarchy["items"][number];
  return dataLabels && hierarchy.hasValues
    ? `${entry.name} ${format.dataLabel(entry.value, 0, item, format.value(entry.value, 0))}`
    : entry.name;
};

/** The layout of a partition chart (shapes, then labels, then the active group). */
export const result = (
  width: number,
  height: number,
  type: "sunburst" | "icicle",
  marks: ChartMark[],
  shapes: ChartNode[],
  labels: ChartNode[],
  state: ChartHierarchyState,
): ChartLayout => ({
  width,
  height,
  plot: { x: 0, y: 0, width, height },
  mode: "tree",
  horizontal: false,
  banded: false,
  band: 0,
  slots: [],
  marks,
  activeRadius: 0,
  hierarchy: state,
  nodes: [
    node("g", { "data-ok-chart-crosshair": "" }, []),
    node("g", { "data-ok-chart-series-group": "" }, [
      node("g", { "data-ok-chart-series": "", "data-ok-type": type, "data-ok-index": "0" }, shapes),
    ]),
    node("g", { "data-ok-chart-data-labels": "" }, labels),
    node("g", { "data-ok-chart-active": "" }, []),
  ],
});

/** Lays out a sunburst: one ring per level around an `innerSize` hole (the drilled node's disc). */
export function layoutSunburst(
  hierarchy: ChartHierarchy,
  options: ChartPartitionOptions,
  format: ChartFormat,
): ChartLayout {
  const width = Math.max(40, Math.round(options.width));
  const height = Math.max(40, Math.round(options.height));
  const { index: drill, state } = drillState(hierarchy, "sunburst", options);
  const start = options.startAngle ?? 0;
  const sweep = Math.max(1, Math.min((options.endAngle ?? 360) - start, 360));
  // The rings fill the SVG: a part of a turn (a half circle) is fitted by its bounding box.
  const corners = [0, 1, 2, 3, 4, 5, 6, 7, 8]
    .map((k) => k * 90)
    .filter((angle) => angle > start && angle < start + sweep);
  const unit = [start, start + sweep, ...corners].map((angle) => polarPoint(0, 0, 1, angle));
  const xs = [0, ...unit.map((p) => p[0])];
  const ys = [0, ...unit.map((p) => p[1])];
  const [minX, maxX, minY, maxY] = [
    Math.min(...xs),
    Math.max(...xs),
    Math.min(...ys),
    Math.max(...ys),
  ];
  const outer = Math.max(
    10,
    Math.min((width - 4) / Math.max(maxX - minX, 0.01), (height - 4) / Math.max(maxY - minY, 0.01)),
  );
  const cx = width / 2 - (outer * (minX + maxX)) / 2;
  const cy = height / 2 - (outer * (minY + maxY)) / 2;
  const hole = (Math.max(0, Math.min(options.innerSize ?? 15, 90)) / 100) * outer;
  // A drilled node fills the center (at least 15% of the radius), so it can be pressed to go up.
  const center = drill >= 0 ? Math.max(hole, outer * 0.15) : 0;
  const spans: Span[] = [];
  if (drill >= 0) {
    spans.push({ item: drill, a0: start, a1: start + sweep, level: 0 });
    // `drillState` only drills into a node that exists and has children.
    const { children } = hierarchy.items[drill] as ChartHierarchyItem;
    split(hierarchy, children, start, start + sweep, 1, spans);
  } else split(hierarchy, hierarchy.roots, start, start + sweep, 1, spans);
  const levels = Math.max(1, ...spans.map((span) => span.level));
  const first = drill >= 0 ? center : hole;
  const ring = (outer - first) / levels;
  const extend = (options.leaf ?? "extend") === "extend";
  const family = relatives(hierarchy, spans);
  const shapes: ChartNode[] = [];
  const labels: ChartNode[] = [];
  const marks: ChartMark[] = [];
  spans.forEach((span, i) => {
    const entry = hierarchy.items[span.item] as ChartHierarchy["items"][number];
    const disc = span.level === 0;
    const inner = disc ? 0 : first + (span.level - 1) * ring;
    const edge = disc
      ? center
      : extend && entry.children.length === 0
        ? outer
        : first + span.level * ring;
    const { opacity, spacing } = spanPaint(hierarchy, span, options);
    const d = slicePath(cx, cy, inner, edge, span.a0, span.a1);
    shapes.push(
      node("path", {
        d,
        "fill-opacity": String(opacity),
        "stroke-width": spacing,
        "data-ok-chart-arc": "",
        "data-ok-color": entry.color,
      }),
    );
    // Labels: across the center disc; on arcs of at least 8°, along the radius or along the
    // ring (straight, within the ring's thickness), whichever leaves more room.
    const mid = (span.a0 + span.a1) / 2;
    const turnWidth = span.a1 - span.a0;
    const radius = disc ? 0 : (inner + edge) / 2;
    const thickness = edge - inner;
    const text = labelOf(hierarchy, span.item, format, options.dataLabels);
    const [px, py] = disc ? [cx, cy] : polarPoint(cx, cy, radius, mid);
    const arcLength = ((turnWidth * Math.PI) / 180) * radius;
    // A straight line along the ring bulges out of it by its sagitta: keep the text inside.
    const sag = Math.max(0, (thickness - FONT) / 2 - 2);
    const chord = 2 * Math.sqrt(Math.max(0, radius * radius - (radius - sag) ** 2));
    const along = disc || thickness < FONT + 6 ? 0 : Math.min(chord, arcLength) - 8;
    const outward = thickness - 8;
    const room = disc ? center * 2 - 12 : Math.max(along, outward);
    const angle = ((mid % 360) + 360) % 360;
    const turn =
      along > outward
        ? angle > 90 && angle < 270
          ? mid + 180
          : mid
        : angle < 180
          ? mid - 90
          : mid + 90;
    if (
      fits(room, text) &&
      (disc || (turnWidth >= 8 && (along > outward || arcLength >= FONT + 2)))
    )
      labels.push(
        node(
          "text",
          {
            x: fmt(px),
            y: fmt(py),
            dy: "0.35em",
            "text-anchor": "middle",
            ...(disc ? {} : { transform: `rotate(${fmt(turn)} ${fmt(px)} ${fmt(py)})` }),
            "data-ok-chart-partition-label": tone(opacity),
          },
          undefined,
          fitChartText(text, room),
        ),
      );
    const relation = family[i] as (typeof family)[number];
    marks.push({
      series: 0,
      type: "sunburst",
      index: span.item,
      x: span.item,
      value: entry.value,
      px: r2(px),
      py: r2(py),
      color: entry.color,
      tree: {
        id: entry.id,
        depth: span.level,
        parent: relation.parent,
        children: relation.children,
        cross: r2(span.a0),
        axis: "radial",
        hit: {
          kind: "arc",
          cx: r2(cx),
          cy: r2(cy),
          inner: r2(inner),
          outer: r2(edge),
          start: r2(span.a0),
          end: r2(span.a1),
        },
        outline: node("path", { d, "data-ok-chart-active-node": "" }),
        action: actionOf(hierarchy, span, drill, options),
        path: chartHierarchyPath(hierarchy, span.item).map((at) => hierarchy.items[at]?.name ?? ""),
        title: chartHierarchyTitle(hierarchy, span.item),
        rows: chartHierarchyRows(hierarchy, span.item, format),
      },
    });
  });
  return result(width, height, "sunburst", marks, shapes, labels, state);
}
