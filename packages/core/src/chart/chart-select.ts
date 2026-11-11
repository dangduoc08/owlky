import {
  type ChartActive,
  type ChartTooltip,
  type ChartTooltipRow,
  chartActiveAt,
} from "./chart-active.js";
import { type ChartLayout, type ChartMark, type ChartNode, fmt, node } from "./chart-layout.js";
import { slicePath } from "./chart-polar.js";

/*
 * Data point selection (roadmap 4.18.60, ApexCharts `dataPointSelection` and `states.active`):
 * a click selects the point, slice or cell under the pointer, Enter or Space the active item.
 * Owns no state: React keeps the selection in state, the HTML runtime in its instance; both draw
 * the outlines from `renderChart` (`selectedDataPoints`).
 */

/** A selected point: its series and its `dataPointIndex` (category, or position on numeric axes). */
export interface ChartDataPoint {
  readonly seriesIndex: number;
  readonly dataPointIndex: number;
}

/** What a selection change reports (`ok:chart:select`, React `onDataPointSelection`). */
export interface ChartSelectionDetail extends ChartDataPoint {
  /** Whether the point is selected now. */
  readonly selected: boolean;
  /** Every selected point after the change. */
  readonly selectedDataPoints: ChartDataPoint[];
}

/** The data point a mark draws. */
export const chartMarkPoint = (mark: ChartMark): ChartDataPoint => ({
  seriesIndex: mark.series,
  dataPointIndex: mark.point ?? mark.index,
});

const same = (a: ChartDataPoint, b: ChartDataPoint) =>
  a.seriesIndex === b.seriesIndex && a.dataPointIndex === b.dataPointIndex;

/** Whether `point` is in `list`. */
export const hasChartDataPoint = (list: readonly ChartDataPoint[], point: ChartDataPoint) =>
  list.some((entry) => same(entry, point));

/** A valid selection: whole, non-negative indexes, each point once (untrusted input). */
export function chartSelection(
  list: readonly ChartDataPoint[] | null | undefined,
): ChartDataPoint[] {
  const out: ChartDataPoint[] = [];
  for (const entry of (list ?? []).slice(0, 10_000)) {
    const point = entry && {
      seriesIndex: Number(entry.seriesIndex),
      dataPointIndex: Number(entry.dataPointIndex),
    };
    if (
      point &&
      Number.isInteger(point.seriesIndex) &&
      Number.isInteger(point.dataPointIndex) &&
      point.seriesIndex >= 0 &&
      point.dataPointIndex >= 0 &&
      !hasChartDataPoint(out, point)
    )
      out.push(point);
  }
  return out;
}

/**
 * Toggles `points` together: when every one is selected they are cleared, otherwise they are
 * selected — added to the selection with `multiple`, replacing it without.
 */
export function toggleChartSelection(
  selected: readonly ChartDataPoint[],
  points: readonly ChartDataPoint[],
  multiple = false,
): ChartDataPoint[] {
  const list = chartSelection(points);
  if (list.length === 0) return [...selected];
  if (list.every((point) => hasChartDataPoint(selected, point)))
    return selected.filter((point) => !hasChartDataPoint(list, point));
  if (!multiple) return list;
  return [...selected, ...list.filter((point) => !hasChartDataPoint(selected, point))];
}

const inside = (box: NonNullable<ChartMark["box"]>, x: number, y: number, slack: number) =>
  x >= box.x - slack &&
  x <= box.x + box.width + slack &&
  y >= box.y - slack &&
  y <= box.y + box.height + slack;

/**
 * The mark a click at SVG px `(x, y)` selects: the block, slice or cell under it, or the nearest
 * point within 16px (index charts) or 24px (scatter, bubble); `null` elsewhere and on Sankey and
 * hierarchy charts.
 */
export function chartMarkAt(layout: ChartLayout, x: number, y: number): number | null {
  if (layout.mode === "flow" || layout.mode === "tree") return null;
  if (layout.mode !== "index") {
    const hit = chartActiveAt(layout, x, y);
    if (!hit) return null;
    if (hit.kind === "mark") return hit.mark;
    const at = layout.marks.findIndex((mark) => mark.index === hit.index);
    return at < 0 ? null : at;
  }
  let best = -1;
  let distance = Number.POSITIVE_INFINITY;
  layout.marks.forEach((mark, index) => {
    const d = mark.box
      ? inside(mark.box, x, y, 2)
        ? 0
        : Number.POSITIVE_INFINITY
      : Math.hypot(mark.px - x, mark.py - y);
    if (d <= 16 && d < distance) {
      distance = d;
      best = index;
    }
  });
  return best < 0 ? null : best;
}

/** The marks of the active item (Enter / Space selects them): a category's points, or one mark. */
export function chartActiveMarks(layout: ChartLayout, active: ChartActive | null): number[] {
  if (!active || layout.mode === "flow" || layout.mode === "tree") return [];
  if (active.kind === "mark") return layout.marks[active.mark] ? [active.mark] : [];
  return layout.marks.flatMap((mark, index) => (mark.index === active.index ? [index] : []));
}

/** What a custom tooltip gets (4.18.63, ApexCharts `tooltip.custom`). */
export interface ChartTooltipContext {
  /** The category, date or x value. */
  readonly title: string;
  /** One row per value: series name, value text, color (and cues). */
  readonly rows: readonly ChartTooltipRow[];
  /** The item has a selected point. */
  readonly selected: boolean;
  /** The data points shown: `{ seriesIndex, dataPointIndex }` (none for Sankey charts). */
  readonly points: readonly ChartDataPoint[];
  /** The active item. */
  readonly active: ChartActive;
}

/** The context of a custom tooltip for the active item's tooltip. */
export function chartTooltipContext(
  layout: ChartLayout,
  tooltip: ChartTooltip,
  active: ChartActive,
): ChartTooltipContext {
  return {
    title: tooltip.title,
    rows: tooltip.rows,
    selected: tooltip.selected === true,
    points: chartActiveMarks(layout, active).map((index) =>
      chartMarkPoint(layout.marks[index] as ChartMark),
    ),
    active,
  };
}

/**
 * The outlines of the selected marks (`g[data-ok-chart-selected]`; empty without a drawn one):
 * a ring around points, a frame around blocks and cells, the outline of slices and rings.
 */
export function chartSelectedNodes(
  layout: ChartLayout,
  selected: readonly ChartDataPoint[],
): ChartNode[] {
  if (selected.length === 0 || layout.mode === "flow" || layout.mode === "tree") return [];
  const shapes = layout.marks.flatMap((mark): ChartNode[] => {
    if (!hasChartDataPoint(selected, chartMarkPoint(mark))) return [];
    const attrs = { "data-ok-chart-selected-mark": "" };
    if (mark.geo) return [node("path", { d: mark.geo.d, ...attrs })];
    if (mark.unit) return [node("path", { d: mark.unit.outline, ...attrs })];
    const frame = mark.cell ?? mark.box;
    if (frame)
      return [
        node("rect", {
          x: fmt(frame.x - 2),
          y: fmt(frame.y - 2),
          width: fmt(frame.width + 4),
          height: fmt(frame.height + 4),
          rx: "4",
          ...attrs,
        }),
      ];
    if (mark.arc) {
      const { cx, cy, inner, outer, start, end } = mark.arc;
      return [node("path", { d: slicePath(cx, cy, inner, outer + 4, start, end), ...attrs })];
    }
    const r = (mark.r ?? Math.max(layout.activeRadius, 4)) + 3;
    return [node("circle", { cx: fmt(mark.px), cy: fmt(mark.py), r: fmt(r), ...attrs })];
  });
  return shapes.length ? [node("g", { "data-ok-chart-selected": "" }, shapes)] : [];
}
