import { chartMarkerNode } from "./chart-cues.js";
import type { ChartFormat } from "./chart-format.js";
import { chartGeoContains } from "./chart-geo.js";
import { nextChartTreeMark, onChartTreeMark } from "./chart-hierarchy.js";
import {
  type ChartArc,
  type ChartLayout,
  type ChartMark,
  type ChartNode,
  type ChartRect,
  chartSigned,
} from "./chart-layout.js";
import type {
  ChartColor,
  ChartData,
  ChartMarkerShape,
  ChartPart,
  ChartPattern,
  ChartTooltipCorner,
} from "./chart-model.js";
import { polarPoint, slicePath } from "./chart-polar.js";
import { onSankeyLink } from "./chart-sankey.js";
import { type ChartDataPoint, chartMarkPoint, hasChartDataPoint } from "./chart-select.js";
import { chartUnitAt } from "./chart-unit.js";

const BOX: readonly ChartPart[] = ["min", "q1", "median", "q3", "max"];
const CANDLE: readonly ChartPart[] = ["open", "high", "low", "close"];

/*
 * Chart interaction (ADR-0024): which category or point is active for a pointer position or a
 * key, the hover nodes and the tooltip content. Owns no state: React keeps the active item in
 * state, the HTML runtime in its instance.
 */

/** The active category (index charts) or point (scatter: `mark` is its index in `layout.marks`). */
export type ChartActive =
  | { readonly kind: "index"; readonly index: number }
  | { readonly kind: "mark"; readonly mark: number };

/** Whether two active items are the same category or point. */
export function sameChartActive(a: ChartActive | null, b: ChartActive | null): boolean {
  if (a === null || b === null) return a === b;
  return a.kind === "index"
    ? b.kind === "index" && a.index === b.index
    : b.kind === "mark" && a.mark === b.mark;
}

/** Angle of a point around a center in degrees, clockwise from 12 o'clock (0 to 360). */
const angleAt = (cx: number, cy: number, x: number, y: number) =>
  ((Math.atan2(x - cx, cy - y) * 180) / Math.PI + 360) % 360;

/** Whether `angle` lies within an arc's angles (which may start below 0 or end past 360). */
const within = (angle: number, arc: ChartArc) => {
  const from = (((angle - arc.start) % 360) + 360) % 360;
  return arc.end - arc.start >= 360 || from <= arc.end - arc.start;
};

/** Angular distance between two angles in degrees (0 to 180). */
const turn = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

/** Pointer position in SVG px → the active item, or `null` outside the plot. */
export function chartActiveAt(layout: ChartLayout, x: number, y: number): ChartActive | null {
  const { plot } = layout;
  if (layout.mode === "tree") {
    // Hierarchy charts (ADR-0058): the topmost node shape under the pointer.
    for (let mark = layout.marks.length - 1; mark >= 0; mark--) {
      const tree = layout.marks[mark]?.tree;
      if (tree && onChartTreeMark(tree, x, y)) return { kind: "mark", mark };
    }
    return null;
  }
  if (layout.mode === "unit") {
    // Waffle and unit charts: the category of the mark under the pointer.
    const index = chartUnitAt(layout.units, x, y);
    return index === null
      ? null
      : { kind: "index", index: (layout.slots[index] as (typeof layout.slots)[number]).index };
  }
  if (layout.mode === "flow") {
    // Sankey: the node under the pointer (3px of slack), else the topmost link.
    const node = layout.marks.findIndex(({ flow }) => {
      const r = flow?.rect;
      return r && x >= r.x - 3 && x <= r.x + r.width + 3 && y >= r.y - 3 && y <= r.y + r.height + 3;
    });
    if (node >= 0) return { kind: "mark", mark: node };
    for (let mark = layout.marks.length - 1; mark >= 0; mark--) {
      const flow = layout.marks[mark]?.flow;
      if (flow?.link && onSankeyLink(flow.link, flow.vertical ? y : x, flow.vertical ? x : y))
        return { kind: "mark", mark };
    }
    return null;
  }
  if (layout.mode === "cell") {
    // The cell under the pointer (heatmap, treemap).
    const mark = layout.marks.findIndex(({ cell, geo }) => {
      const c = cell as ChartRect;
      const inside = x >= c.x && x <= c.x + c.width && y >= c.y && y <= c.y + c.height;
      return inside && (!geo || chartGeoContains(geo, x, y));
    });
    return mark < 0 ? null : { kind: "mark", mark };
  }
  if (layout.mode === "slice") {
    // The slice (or ring) under the pointer, with 8px of slack around its radii.
    for (const mark of layout.marks) {
      const arc = mark.arc as ChartArc;
      const distance = Math.hypot(x - arc.cx, y - arc.cy);
      if (
        distance >= arc.inner - 8 &&
        distance <= arc.outer + 8 &&
        within(angleAt(arc.cx, arc.cy, x, y), arc)
      )
        return { kind: "index", index: mark.index };
    }
    return null;
  }
  if (layout.polar) {
    // Radar: the category axis nearest in angle, inside the web (plus room for its label).
    const { cx, cy, r } = layout.polar;
    if (layout.slots.length === 0 || Math.hypot(x - cx, y - cy) > r + 24) return null;
    const angle = angleAt(cx, cy, x, y);
    let best = layout.slots[0] as (typeof layout.slots)[number];
    for (const slot of layout.slots) if (turn(slot.pos, angle) < turn(best.pos, angle)) best = slot;
    return { kind: "index", index: best.index };
  }
  const slack = 8;
  if (
    x < plot.x - slack ||
    x > plot.x + plot.width + slack ||
    y < plot.y - slack ||
    y > plot.y + plot.height + slack
  ) {
    return null;
  }
  if (layout.mode === "point") {
    // Per-point tooltips of index charts (4.18.63): the block under the pointer (2px of slack).
    const block = layout.marks.findIndex(
      ({ box }) =>
        box &&
        x >= box.x - 2 &&
        x <= box.x + box.width + 2 &&
        y >= box.y - 2 &&
        y <= box.y + box.height + 2,
    );
    if (block >= 0) return { kind: "mark", mark: block };
    // The nearest point within 24px, or inside its bubble.
    let best = -1;
    let distance = Number.POSITIVE_INFINITY;
    layout.marks.forEach((mark, index) => {
      const d = (mark.px - x) ** 2 + (mark.py - y) ** 2;
      if (d <= Math.max(24, (mark.r ?? 0) + 4) ** 2 && d <= distance) {
        distance = d;
        best = index;
      }
    });
    return best < 0 ? null : { kind: "mark", mark: best };
  }
  if (layout.slots.length === 0) return null;
  const along = layout.horizontal ? y : x;
  let best = layout.slots[0] as (typeof layout.slots)[number];
  for (const slot of layout.slots)
    if (Math.abs(slot.pos - along) < Math.abs(best.pos - along)) best = slot;
  return { kind: "index", index: best.index };
}

/**
 * Marks in reading order for keyboard navigation: left to right, then top to bottom; Sankey nodes
 * and links rank by rank (a rank's nodes, then the links that leave it).
 */
const order = (layout: ChartLayout) =>
  layout.marks
    .map((mark, index) => ({ mark, index }))
    .sort((a, b) =>
      a.mark.flow && b.mark.flow
        ? a.mark.flow.order - b.mark.flow.order || a.mark.flow.cross - b.mark.flow.cross
        : a.mark.px - b.mark.px || a.mark.py - b.mark.py,
    );

/**
 * Cells (heatmap, treemap): an arrow moves to the nearest cell in its direction (centers
 * compared, the cross distance weighs double); Home / End go to the top-left / bottom-right one.
 */
function nextCell(
  layout: ChartLayout,
  active: ChartActive | null,
  key: string,
): ChartActive | null {
  const { marks } = layout;
  if (marks.length === 0) return null;
  const reading = marks
    .map((mark, index) => ({ mark, index }))
    .sort((a, b) => a.mark.py - b.mark.py || a.mark.px - b.mark.px);
  const from = active?.kind === "mark" ? marks[active.mark] : undefined;
  if (key === "End") return { kind: "mark", mark: (reading.at(-1) as (typeof reading)[0]).index };
  if (key === "Home" || !from)
    return { kind: "mark", mark: (reading[0] as (typeof reading)[0]).index };
  const [dx, dy] =
    key === "ArrowRight"
      ? [1, 0]
      : key === "ArrowLeft"
        ? [-1, 0]
        : key === "ArrowDown"
          ? [0, 1]
          : [0, -1];
  let best = (active as { mark: number }).mark;
  let score = Number.POSITIVE_INFINITY;
  marks.forEach((mark, index) => {
    const along = (mark.px - from.px) * dx + (mark.py - from.py) * dy;
    if (along <= 0.5) return;
    const across = Math.abs((mark.px - from.px) * dy + (mark.py - from.py) * dx);
    const s = along + across * 2;
    if (s < score) {
      score = s;
      best = index;
    }
  });
  return { kind: "mark", mark: best };
}

/** The item a key moves to (arrows, Home, End); `undefined` when the key isn't a chart key. */
export function nextChartActive(
  layout: ChartLayout,
  active: ChartActive | null,
  key: string,
): ChartActive | null | undefined {
  const forward = key === "ArrowRight" || key === "ArrowDown";
  const backward = key === "ArrowLeft" || key === "ArrowUp";
  if (!forward && !backward && key !== "Home" && key !== "End") return undefined;
  if (layout.mode === "tree") {
    const next = nextChartTreeMark(layout.marks, active?.kind === "mark" ? active.mark : null, key);
    return next === undefined ? undefined : next === null ? null : { kind: "mark", mark: next };
  }
  if (layout.mode === "cell") return nextCell(layout, active, key);
  if (layout.mode === "point" || layout.mode === "flow") {
    const sorted = order(layout);
    if (sorted.length === 0) return null;
    const at =
      active?.kind === "mark" ? sorted.findIndex((entry) => entry.index === active.mark) : -1;
    const next =
      key === "Home"
        ? 0
        : key === "End"
          ? sorted.length - 1
          : at < 0
            ? 0
            : Math.min(sorted.length - 1, Math.max(0, at + (forward ? 1 : -1)));
    return { kind: "mark", mark: (sorted[next] as (typeof sorted)[number]).index };
  }
  const count = layout.slots.length;
  if (count === 0) return null;
  // Slots in order (hidden slices have none): move by position, report the category.
  const at =
    active?.kind === "index" ? layout.slots.findIndex((slot) => slot.index === active.index) : -1;
  const next =
    key === "Home"
      ? 0
      : key === "End"
        ? count - 1
        : at < 0
          ? 0
          : Math.min(count - 1, Math.max(0, at + (forward ? 1 : -1)));
  return { kind: "index", index: (layout.slots[next] as (typeof layout.slots)[number]).index };
}

/** Series types drawn as blocks: the band highlights them, no hover marker. */
const BLOCKS: readonly string[] = [
  "bar",
  "boxPlot",
  "funnel",
  "candlestick",
  "rangeBar",
  "timeline",
  "waterfall",
  "violin",
];
/** Series types whose points have their own colors in the tooltip (not the series color). */
const OWN_COLORS: readonly string[] = [
  "funnel",
  "boxPlot",
  "candlestick",
  "rangeBar",
  "timeline",
  "waterfall",
];

const circle = (
  cx: number,
  cy: number,
  r: number,
  color: ChartColor,
  shape?: ChartMarkerShape,
): ChartNode =>
  shape
    ? chartMarkerNode(shape, cx, cy, r, {
        "data-ok-chart-active-marker": "",
        "data-ok-color": color,
      })
    : {
        tag: "circle",
        attrs: {
          cx: String(cx),
          cy: String(cy),
          r: String(r),
          "data-ok-chart-active-marker": "",
          "data-ok-color": color,
        },
      };

/**
 * Hover nodes: `under` goes into the crosshair group (behind the series: the category band or a
 * dashed line), `over` into the active group (bigger markers).
 */
export function chartActiveNodes(
  layout: ChartLayout,
  active: ChartActive | null,
): { under: ChartNode[]; over: ChartNode[] } {
  if (!active) return { under: [], over: [] };
  const { plot } = layout;
  if (active.kind === "mark") {
    const mark = layout.marks[active.mark];
    if (!mark) return { under: [], over: [] };
    if (mark.flow) return { under: [], over: flowNodes(layout, mark) };
    if (mark.geo)
      return {
        under: [],
        over: [{ tag: "path", attrs: { d: mark.geo.d, "data-ok-chart-active-cell": "" } }],
      };
    // Streamgraphs (4.18.21): a per-point tooltip's band over a veil that fades the others.
    if (mark.stream) {
      const { veil, band, label } = mark.stream;
      return {
        under: [],
        over: [
          veil,
          band,
          circle(mark.px, mark.py, layout.activeRadius, mark.color, mark.shape),
          ...(label ? [label] : []),
        ],
      };
    }
    if (mark.tree) return { under: [], over: [...treeNodes(layout, mark), mark.tree.outline] };
    if (mark.cell) {
      // An outline around the cell (heatmap, treemap).
      const { x, y, width, height } = mark.cell;
      return {
        under: [],
        over: [
          {
            tag: "rect",
            attrs: {
              x: String(x + 1),
              y: String(y + 1),
              width: String(Math.max(0, Math.round((width - 2) * 100) / 100)),
              height: String(Math.max(0, Math.round((height - 2) * 100) / 100)),
              rx: mark.type === "treemap" ? "4" : "2",
              "data-ok-chart-active-cell": "",
            },
          },
        ],
      };
    }
    // A block of a per-point tooltip (4.18.63): its category's band behind it.
    if (mark.box) {
      const band = bandNode(
        layout,
        layout.horizontal ? mark.box.y + mark.box.height / 2 : mark.box.x + mark.box.width / 2,
      );
      return { under: band ? [band] : [], over: [] };
    }
    const r = mark.r !== undefined ? mark.r + 2 : layout.activeRadius;
    return { under: [], over: [circle(mark.px, mark.py, r, mark.color, mark.shape)] };
  }
  const slot = layout.slots.find((entry) => entry.index === active.index);
  if (!slot) return { under: [], over: [] };
  const under: ChartNode[] = [];
  if (layout.mode === "unit") {
    // Waffle and unit charts: an outline around every mark of the category.
    const mark = layout.marks.find((entry) => entry.index === active.index);
    return mark?.unit
      ? {
          under,
          over: [{ tag: "path", attrs: { d: mark.unit.outline, "data-ok-chart-active-node": "" } }],
        }
      : { under, over: [] };
  }
  if (layout.mode === "slice") {
    // A wider copy of the slice behind it (a halo); rings show only the tooltip.
    const mark = layout.marks.find((entry) => entry.index === active.index);
    if (mark?.type === "pie" || mark?.type === "donut" || mark?.type === "polarArea") {
      const arc = mark.arc as ChartArc;
      under.push({
        tag: "path",
        attrs: {
          d: slicePath(arc.cx, arc.cy, arc.inner, arc.outer + 6, arc.start, arc.end),
          "data-ok-chart-active-slice": "",
          "data-ok-color": mark.color,
        },
      });
    }
    return { under, over: [] };
  }
  if (layout.polar) {
    const { cx, cy, r } = layout.polar;
    const [x2, y2] = polarPoint(cx, cy, r, slot.pos);
    under.push({
      tag: "line",
      attrs: {
        x1: String(cx),
        y1: String(cy),
        x2: String(Math.round(x2 * 100) / 100),
        y2: String(Math.round(y2 * 100) / 100),
        "data-ok-chart-crosshair-line": "",
      },
    });
  } else if (layout.banded) {
    const half = layout.band / 2;
    under.push({
      tag: "rect",
      attrs: layout.horizontal
        ? {
            x: String(plot.x),
            y: String(Math.round((slot.pos - half) * 100) / 100),
            width: String(plot.width),
            height: String(layout.band),
            "data-ok-chart-band": "",
          }
        : {
            x: String(Math.round((slot.pos - half) * 100) / 100),
            y: String(plot.y),
            width: String(layout.band),
            height: String(plot.height),
            "data-ok-chart-band": "",
          },
    });
  } else {
    under.push({
      tag: "line",
      attrs: {
        x1: String(slot.pos),
        x2: String(slot.pos),
        y1: String(plot.y),
        y2: String(plot.y + plot.height),
        "data-ok-chart-crosshair-line": "",
      },
    });
  }
  const over =
    layout.activeRadius > 0
      ? layout.marks
          .filter((mark) => mark.index === active.index && !BLOCKS.includes(mark.type))
          .map((mark) => circle(mark.px, mark.py, layout.activeRadius, mark.color, mark.shape))
      : [];
  return { under, over };
}

/** The band of the category nearest `pos` (banded charts), or `undefined`. */
function bandNode(layout: ChartLayout, pos: number): ChartNode | undefined {
  if (!layout.banded || layout.slots.length === 0) return undefined;
  let slot = layout.slots[0] as (typeof layout.slots)[number];
  for (const entry of layout.slots)
    if (Math.abs(entry.pos - pos) < Math.abs(slot.pos - pos)) slot = entry;
  const { plot } = layout;
  const at = String(Math.round((slot.pos - layout.band / 2) * 100) / 100);
  return {
    tag: "rect",
    attrs: layout.horizontal
      ? {
          x: String(plot.x),
          y: at,
          width: String(plot.width),
          height: String(layout.band),
          "data-ok-chart-band": "",
        }
      : {
          x: at,
          y: String(plot.y),
          width: String(layout.band),
          height: String(plot.height),
          "data-ok-chart-band": "",
        },
  };
}

/** Hierarchy highlight (ADR-0058): the links from the root to the active node (trees). */
function treeNodes(layout: ChartLayout, mark: ChartMark): ChartNode[] {
  const out: ChartNode[] = [];
  for (let at: ChartMark | undefined = mark; at?.tree; ) {
    if (at.tree.link)
      out.unshift({
        tag: "path",
        attrs: { d: at.tree.link, "data-ok-chart-active-path": "", "data-ok-color": at.color },
      });
    at = at.tree.parent >= 0 ? layout.marks[at.tree.parent] : undefined;
  }
  return out;
}

/** Sankey highlight: the active link, or a node's links and an outline around the node. */
function flowNodes(layout: ChartLayout, mark: ChartMark): ChartNode[] {
  const flow = mark.flow as NonNullable<ChartMark["flow"]>;
  const copy = (link: ChartMark | undefined): ChartNode[] =>
    link?.flow?.path
      ? [
          {
            tag: "path",
            attrs: { d: link.flow.path, ...link.flow.paint, "data-ok-chart-active-link": "" },
          },
        ]
      : [];
  if (flow.kind === "link") return copy(mark);
  const r = flow.rect as ChartRect;
  const n = (value: number) => String(Math.round(value * 100) / 100);
  return [
    ...flow.links.flatMap((index) => copy(layout.marks[index])),
    {
      tag: "rect",
      attrs: {
        x: n(r.x - 2),
        y: n(r.y - 2),
        width: n(r.width + 4),
        height: n(r.height + 4),
        rx: "3",
        "data-ok-chart-active-cell": "",
      },
    },
  ];
}

export interface ChartTooltipRow {
  readonly name: string;
  readonly value: string;
  readonly color: ChartColor;
  /** Non-color cues (4.18.62) on the row's marker. */
  readonly shape?: ChartMarkerShape | undefined;
  readonly pattern?: ChartPattern | undefined;
}

export interface ChartTooltip {
  readonly title: string;
  /** The item (or one of a category's points) is selected (4.18.60): the tooltip says so. */
  readonly selected?: boolean | undefined;
  readonly rows: readonly ChartTooltipRow[];
  /** Where the tooltip points, in SVG px. */
  readonly x: number;
  readonly y: number;
}

/**
 * Tooltip content for the active item; `selected` (the selection, 4.18.60) marks a tooltip whose
 * item has a selected point.
 */
export function chartTooltip(
  data: ChartData,
  layout: ChartLayout,
  format: ChartFormat,
  active: ChartActive | null,
  selected?: readonly ChartDataPoint[],
): ChartTooltip | null {
  const tooltip = tooltipOf(data, layout, format, active);
  if (!tooltip || !selected?.length || !active) return tooltip;
  const marks =
    active.kind === "mark"
      ? [layout.marks[active.mark]]
      : layout.marks.filter((mark) => mark.index === active.index);
  const on = marks.some(
    (mark) => mark && !mark.flow && !mark.tree && hasChartDataPoint(selected, chartMarkPoint(mark)),
  );
  return on ? { ...tooltip, selected: true } : tooltip;
}

function tooltipOf(
  data: ChartData,
  layout: ChartLayout,
  format: ChartFormat,
  active: ChartActive | null,
): ChartTooltip | null {
  if (!active) return null;
  const xOf = (index: number) =>
    data.xType === "numeric"
      ? index
      : data.xType === "datetime"
        ? (data.categories[index] as number)
        : (data.categories[index] ?? String(index + 1));
  /** Rows of a mark: one value, a range (low – high), five box values or a value and a size. */
  const rowsOf = (mark: ChartMark, color: ChartColor): ChartTooltipRow[] =>
    cueRows(rowsOfMark(mark, color), mark);
  const cueRows = (rows: ChartTooltipRow[], mark: ChartMark): ChartTooltipRow[] =>
    mark.shape || mark.pattern
      ? rows.map((row) => ({
          ...row,
          ...(mark.shape ? { shape: mark.shape } : {}),
          ...(mark.pattern ? { pattern: mark.pattern } : {}),
        }))
      : rows;
  const rowsOfMark = (mark: ChartMark, color: ChartColor): ChartTooltipRow[] => {
    const series = data.series[mark.series] as (typeof data.series)[number];
    const value = (v: number) => format.value(v, mark.series);
    const { range } = mark;
    const several = (type: string) => data.series.filter((s) => s.type === type).length > 1;
    if (mark.type === "waterfall") {
      // Waterfall steps (4.18.21): the signed change, then the running total after it.
      if (mark.sum) return [{ name: series.name, value: value(mark.value), color }];
      const total = format.part("total");
      return [
        { name: series.name, value: chartSigned(mark.value, value(mark.value)), color },
        {
          name: several("waterfall") ? `${series.name} (${total})` : total,
          value: value((range as readonly number[])[1] as number),
          color,
        },
      ];
    }
    if (mark.type === "violin" && range) {
      // Violins (4.18.21): the five numbers and how many observations they summarize.
      return [
        ...BOX.map((part, i) => ({
          name: several("violin") ? `${series.name} (${format.part(part)})` : format.part(part),
          value: value(range[i] as number),
          color,
        })),
        {
          name: several("violin")
            ? `${series.name} (${format.part("count")})`
            : format.part("count"),
          value: format.number(mark.count as number),
          color,
        },
      ];
    }
    if (mark.type === "dumbbell" && range) {
      // Dumbbells (4.18.21): the start and the end, each with its marker's color.
      return (["start", "end"] as const).map((part, i) => ({
        name: several("dumbbell") ? `${series.name} (${format.part(part)})` : format.part(part),
        value: value(range[i] as number),
        color: mark.ends?.[i] ?? color,
      }));
    }
    if (range && (range.length === 5 || range.length === 4)) {
      // Box plots list five values, candles four (open, high, low, close).
      const parts = range.length === 5 ? BOX : CANDLE;
      return parts.map((part, i) => ({
        name: several(series.type) ? `${series.name} (${format.part(part)})` : format.part(part),
        value: value(range[i] as number),
        color,
      }));
    }
    const rows = [
      {
        name: series.name,
        value: range
          ? `${value(range[0] as number)} – ${value(range[1] as number)}`
          : value(mark.value),
        color,
      },
    ];
    if (mark.z !== undefined)
      rows.push({ name: format.part("z"), value: format.number(mark.z), color });
    return rows;
  };
  if (active.kind === "mark") {
    const mark = layout.marks[active.mark];
    if (!mark) return null;
    if (mark.flow) return { title: mark.flow.title, rows: mark.flow.rows, x: mark.px, y: mark.py };
    if (mark.geo) return { title: mark.geo.title, rows: mark.geo.rows, x: mark.px, y: mark.py };
    if (mark.tree) return { title: mark.tree.title, rows: mark.tree.rows, x: mark.px, y: mark.py };
    return {
      title: format.title(xOf(mark.x)),
      rows: rowsOf(mark, mark.color),
      x: mark.px,
      y: mark.py,
    };
  }
  const slot = layout.slots.find((entry) => entry.index === active.index);
  if (!slot) return null;
  const marks = layout.marks.filter((mark) => mark.index === active.index);
  const x =
    data.xType === "datetime"
      ? (data.categories[active.index] as number)
      : (data.categories[active.index] ?? String(active.index + 1));
  if (layout.mode === "slice" || layout.mode === "unit") {
    // One slice or ring (or a unit chart's category): its own color, pointing at its middle (bars: their end).
    const mark = marks[0];
    if (!mark) return null;
    return {
      title: format.title(x),
      rows: cueRows(
        [
          {
            name: (data.series[0] as (typeof data.series)[number]).name,
            value: format.value(mark.value, 0),
            color: mark.color,
          },
        ],
        mark,
      ),
      x: mark.px,
      y: mark.py,
    };
  }
  const rows = marks.flatMap((mark) =>
    rowsOf(
      mark,
      // Funnel bars and boxes have their own colors; other index charts list their series' colors.
      OWN_COLORS.includes(mark.type)
        ? mark.color
        : (data.series[mark.series] as (typeof data.series)[number]).color,
    ),
  );
  // Streamgraphs (4.18.21): the column's total after its bands (not with `expand`).
  const columnTotal = marks[0]?.total;
  if (columnTotal !== undefined && marks[0])
    rows.push({
      name: format.part("total"),
      value: format.value(columnTotal, 0),
      color: marks[0].color,
    });
  if (layout.polar) {
    // Radar: beside the outermost value of the category.
    const { cx, cy } = layout.polar;
    const far = marks.reduce<(typeof marks)[number] | undefined>(
      (best, mark) =>
        !best || Math.hypot(mark.px - cx, mark.py - cy) > Math.hypot(best.px - cx, best.py - cy)
          ? mark
          : best,
      undefined,
    );
    return {
      title: format.title(x),
      rows,
      x: far ? far.px : cx,
      y: far ? far.py : cy,
    };
  }
  const reach = marks.length
    ? layout.horizontal
      ? Math.max(...marks.map((m) => m.px))
      : Math.min(...marks.map((m) => m.py))
    : 0;
  return {
    title: format.title(x),
    rows,
    x: layout.horizontal ? reach : slot.pos,
    y: layout.horizontal ? slot.pos : marks.length ? reach : layout.plot.y,
  };
}

/** A fixed tooltip (4.18.63): a corner of the plot area (in the plot box's px). */
export interface ChartTooltipFixed {
  readonly corner: ChartTooltipCorner;
  readonly plot: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
}

/** A fixed tooltip's corner and the plot area scaled to the drawn size (`undefined`: not fixed). */
export function chartTooltipFixed(
  corner: ChartTooltipCorner | undefined,
  layout: ChartLayout,
  scale: number,
): ChartTooltipFixed | undefined {
  if (!corner) return undefined;
  const { x, y, width, height } = layout.plot;
  return {
    corner,
    plot: { x: x * scale, y: y * scale, width: width * scale, height: height * scale },
  };
}

/**
 * Tooltip position inside the plot box: beside the anchor (right, or left when there's no
 * room), vertically centered on it, kept inside `[0, width] × [0, height]`; or 8px inside a
 * corner of the plot area (`fixed`).
 */
export function placeChartTooltip(
  anchor: { x: number; y: number },
  size: { width: number; height: number },
  box: { width: number; height: number },
  fixed?: ChartTooltipFixed,
): { left: number; top: number } {
  if (fixed) {
    const { plot, corner } = fixed;
    const left = corner.endsWith("Left") ? plot.x + 8 : plot.x + plot.width - 8 - size.width;
    const top = corner.startsWith("top") ? plot.y + 8 : plot.y + plot.height - 8 - size.height;
    return {
      left: Math.round(Math.max(0, Math.min(left, box.width - size.width))),
      top: Math.round(Math.max(0, Math.min(top, box.height - size.height))),
    };
  }
  const gap = 16;
  let left = anchor.x + gap;
  if (left + size.width > box.width) left = anchor.x - gap - size.width;
  left = Math.max(0, Math.min(left, box.width - size.width));
  const top = Math.max(0, Math.min(anchor.y - size.height / 2, box.height - size.height));
  return { left: Math.round(left), top: Math.round(top) };
}
