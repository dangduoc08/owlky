import type { ChartAxisMap, ChartLayout, ChartNode } from "./chart-layout.js";
import type { ChartData } from "./chart-model.js";

/*
 * Zoom, pan and brush math (ADR-0031, phase 4). Pure functions: React and the HTML runtime keep
 * the zoom in their state and redraw; the gesture controller and the keyboard report new ranges.
 * A range is a window of the x axis: category indexes (category and date axes, whole numbers) or
 * x values (numeric axes).
 */

export interface ChartZoom {
  readonly min: number;
  readonly max: number;
}

/** Why the zoom changed: the chart's own gestures or keys, its group, or a brush chart. */
export type ChartZoomReason = "user" | "group" | "brush";

const r2 = (value: number) => Math.round(value * 100) / 100;

/** The whole x axis of the data, or `null` when there is nothing to zoom (fewer than 2 x values). */
export function chartZoomExtent(data: ChartData): ChartZoom | null {
  if (data.xType === "numeric") {
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    for (const series of data.series)
      for (const point of series.points) {
        min = Math.min(min, point.x);
        max = Math.max(max, point.x);
      }
    return max > min ? { min, max } : null;
  }
  const count = Math.max(data.categories.length, ...data.series.map((s) => s.points.length), 0);
  return count > 1 ? { min: 0, max: count - 1 } : null;
}

/**
 * A valid range inside `extent`: index ranges are whole numbers and hold at least two
 * categories; a range is moved (not shrunk) back inside; one that covers everything is `null`.
 */
export function clampChartZoom(
  range: ChartZoom | null | undefined,
  extent: ChartZoom | null,
  kind: "index" | "value",
): ChartZoom | null {
  if (!range || !extent) return null;
  if (!Number.isFinite(range.min) || !Number.isFinite(range.max)) return null;
  const full = extent.max - extent.min;
  let min = Math.min(range.min, range.max);
  let max = Math.max(range.min, range.max);
  if (kind === "index") {
    min = Math.round(min);
    max = Math.round(max);
    if (max - min < 1) max = min + 1;
  } else if (max - min < full / 1000) max = min + full / 1000;
  const span = Math.min(max - min, full);
  if (min < extent.min) min = extent.min;
  if (min + span > extent.max) min = extent.max - span;
  max = min + span;
  if (min <= extent.min && max >= extent.max) return null;
  return kind === "index" ? { min, max } : { min: r2(min), max: r2(max) };
}

/** Zooms in (`factor` < 1) or out (> 1) around `center` (default: the middle of the range). */
export function zoomChartBy(
  range: ChartZoom | null,
  extent: ChartZoom | null,
  kind: "index" | "value",
  factor: number,
  center?: number,
): ChartZoom | null {
  if (!extent) return null;
  const current = range ?? extent;
  const middle = center ?? (current.min + current.max) / 2;
  const span = Math.max(kind === "index" ? 1 : 0, (current.max - current.min) * factor);
  const ratio =
    current.max > current.min ? (middle - current.min) / (current.max - current.min) : 0.5;
  const min = middle - span * ratio;
  return clampChartZoom({ min, max: min + span }, extent, kind);
}

/** Moves the range by `delta` (x units), keeping its width. */
export function panChart(
  range: ChartZoom | null,
  extent: ChartZoom | null,
  kind: "index" | "value",
  delta: number,
): ChartZoom | null {
  if (!range || !extent) return range ?? null;
  return clampChartZoom({ min: range.min + delta, max: range.max + delta }, extent, kind);
}

/**
 * The range after the data changed from `before` to `after` (live updates): a range that ended at
 * the last x value follows the end (a live tail); others keep their position, clamped.
 */
export function followChartZoom(
  range: ChartZoom | null,
  before: ChartZoom | null,
  after: ChartZoom | null,
  kind: "index" | "value",
): ChartZoom | null {
  if (!range || !after) return null;
  const shift = before && range.max >= before.max ? after.max - before.max : 0;
  return clampChartZoom({ min: range.min + shift, max: range.max + shift }, after, kind);
}

/** An x value at a px position on an axis map (fractional for index axes). */
export function chartXAt(map: ChartAxisMap, px: number): number {
  if (map.to === map.from) return map.min;
  return map.min + ((px - map.from) / (map.to - map.from)) * (map.max - map.min);
}

/** The px position of an x value on an axis map. */
export function chartPxOf(map: ChartAxisMap, x: number): number {
  if (map.max === map.min) return map.from;
  return map.from + ((x - map.min) / (map.max - map.min)) * (map.to - map.from);
}

/** The range between two px positions of a drag (in the layout's own px). */
export function chartZoomBetween(
  layout: ChartLayout,
  extent: ChartZoom | null,
  a: number,
  b: number,
): ChartZoom | null {
  const map = layout.x;
  if (!map) return null;
  return clampChartZoom(
    { min: chartXAt(map, Math.min(a, b)), max: chartXAt(map, Math.max(a, b)) },
    extent,
    map.kind,
  );
}

/**
 * The key's new range: `+` / `=` zoom in, `-` zoom out, `0` resets, Shift + Left / Right pans by
 * one category (a tenth of the range on value axes). `undefined`: not a zoom key.
 */
export function chartZoomKey(
  key: string,
  shift: boolean,
  range: ChartZoom | null,
  extent: ChartZoom | null,
  kind: "index" | "value",
): ChartZoom | null | undefined {
  if (key === "+" || key === "=") return zoomChartBy(range, extent, kind, 0.5);
  if (key === "-" || key === "_") return zoomChartBy(range, extent, kind, 2);
  if (key === "0") return null;
  if (shift && (key === "ArrowLeft" || key === "ArrowRight")) {
    const current = range ?? extent;
    if (!current) return null;
    const step = kind === "index" ? 1 : (current.max - current.min) / 10;
    return panChart(range, extent, kind, key === "ArrowLeft" ? -step : step);
  }
  return undefined;
}

/**
 * The selection of a brush chart, or a drag being zoomed: a shaded band over the plot, with a
 * handle at each end (brush charts).
 */
export function chartSelectionNodes(
  layout: ChartLayout,
  range: ChartZoom,
  handles: boolean,
): ChartNode[] {
  const map = layout.x;
  if (!map) return [];
  const half = map.band ? map.band / 2 : 0;
  const left = Math.max(layout.plot.x, chartPxOf(map, range.min) - half);
  const right = Math.min(layout.plot.x + layout.plot.width, chartPxOf(map, range.max) + half);
  const { y, height } = layout.plot;
  const rect = (x: number, w: number, attrs: Record<string, string>): ChartNode => ({
    tag: "rect",
    attrs: {
      x: String(r2(x)),
      y: String(y),
      width: String(r2(Math.max(0, w))),
      height: String(height),
      ...attrs,
    },
  });
  const nodes = [rect(left, right - left, { "data-ok-chart-selection": "" })];
  if (handles) {
    const h = Math.min(24, height);
    const top = r2(y + (height - h) / 2);
    for (const x of [left, right])
      nodes.push({
        tag: "rect",
        attrs: {
          x: String(r2(x - 3)),
          y: String(top),
          width: "6",
          height: String(h),
          rx: "3",
          "data-ok-chart-handle": "",
        },
      });
  }
  return [{ tag: "g", attrs: { "data-ok-chart-brush": "" }, children: nodes }];
}

/** The px range of a selection (brush gestures: inside it moves, its edges resize). */
export function chartSelectionPx(layout: ChartLayout, range: ChartZoom): [number, number] | null {
  const map = layout.x;
  if (!map) return null;
  const half = map.band ? map.band / 2 : 0;
  return [chartPxOf(map, range.min) - half, chartPxOf(map, range.max) + half];
}
