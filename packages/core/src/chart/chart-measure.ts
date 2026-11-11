import type { ChartActive } from "./chart-active.js";
import type { ChartAnnotation } from "./chart-annotations.js";
import type { ChartFormat } from "./chart-format.js";
import {
  type ChartLayout,
  type ChartNode,
  chartSigned,
  chartTextWidth,
  clamp,
  fmt,
  node,
  r2,
} from "./chart-layout.js";
import { type ChartData, parseChartNumber } from "./chart-model.js";
import { chartPxOf, chartXAt } from "./chart-zoom.js";

/*
 * Measure rulers and draggable annotations (roadmap 4.18.20, ApexCharts `chart.measure` and
 * draggable annotations). Pure functions: owners keep the rulers and the annotations being moved,
 * the gesture controller reports pointer positions, and keys do the same without a pointer
 * (WCAG 2.5.7). Positions are data coordinates: an x position (a category index or an x value)
 * and a value of the first value axis.
 */

/** `span`: the change between two x positions of the first visible series; `free`: between two points. */
export const chartMeasureModes = ["span", "free"] as const;
export type ChartMeasureMode = (typeof chartMeasureModes)[number];

export interface ChartMeasure {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

/** At most this many rulers stay pinned. */
export const CHART_MAX_MEASURES = 20;

/** Texts of the measure tools (localizable through `localeText`). */
export const chartMeasureLabels = {
  measure: "Measure",
  clearMeasures: "Clear measures",
  measureFrom: "Measure from",
  annotation: "Annotation",
  annotationDropped: "Annotation placed",
} as const;

/** Keeps the valid rulers (finite numbers), at most `CHART_MAX_MEASURES`. */
export function chartMeasures(list: readonly ChartMeasure[] | undefined): ChartMeasure[] {
  return (list ?? [])
    .flatMap((entry) => {
      const values = [entry?.x1, entry?.y1, entry?.x2, entry?.y2].map(parseChartNumber);
      if (values.some((value) => value === null)) return [];
      const [x1, y1, x2, y2] = values as [number, number, number, number];
      return [{ x1, y1, x2, y2 }];
    })
    .slice(-CHART_MAX_MEASURES);
}

/** A data position at a px position of the plot (index axes snap to a category). */
export function chartMeasureAt(
  layout: ChartLayout,
  px: number,
  py: number,
): { x: number; y: number } | null {
  const { x: xMap, y: yMap, plot } = layout;
  if (!xMap || !yMap) return null;
  const left = plot.x;
  const right = plot.x + plot.width;
  const raw = chartXAt(xMap, clamp(px, left, right));
  const x = xMap.kind === "index" ? clamp(Math.round(raw), xMap.min, xMap.max) : r2(raw);
  const y = r2(chartXAt(yMap, clamp(py, plot.y, plot.y + plot.height)));
  return { x, y };
}

/** Span rulers: the first visible series' value at an x position (`undefined`: none). */
function valueAt(layout: ChartLayout, x: number): number | undefined {
  let best: { distance: number; series: number; value: number } | undefined;
  for (const mark of layout.marks) {
    const distance = Math.abs(mark.x - x);
    if (
      !best ||
      distance < best.distance ||
      (distance === best.distance && mark.series < best.series)
    )
      best = { distance, series: mark.series, value: mark.value };
  }
  return best?.value;
}

/**
 * A ruler between two data positions. `span` rulers read the values of the first drawn series at
 * both x positions; `free` rulers keep the positions as given.
 */
export function chartMeasureBetween(
  layout: ChartLayout,
  mode: ChartMeasureMode,
  a: { x: number; y: number },
  b: { x: number; y: number },
): ChartMeasure {
  if (mode === "free") return { x1: a.x, y1: a.y, x2: b.x, y2: b.y };
  return {
    x1: a.x,
    y1: valueAt(layout, a.x) ?? a.y,
    x2: b.x,
    y2: valueAt(layout, b.x) ?? b.y,
  };
}

/** A position from the keyboard's active item (a category or a point), for rulers without a pointer. */
export function chartMeasureActive(
  layout: ChartLayout,
  active: ChartActive | null,
): { x: number; y: number } | null {
  if (!active || !layout.x) return null;
  if (active.kind === "mark") {
    const mark = layout.marks[active.mark];
    return mark ? { x: mark.x, y: mark.value } : null;
  }
  const value = valueAt(layout, active.index);
  return value === undefined ? null : { x: active.index, y: value };
}

/** A ruler as text: `"Jan → Apr: +12 (+35.3%)"` (announced and drawn on its tag). */
export function chartMeasureText(
  data: ChartData,
  format: ChartFormat,
  measure: ChartMeasure,
): string {
  const xText = (x: number) =>
    data.xType === "numeric"
      ? format.number(x)
      : format.title(
          data.xType === "datetime"
            ? (data.categories[x] as number)
            : (data.categories[x] ?? String(x + 1)),
        );
  const delta = r2(measure.y2 - measure.y1);
  const change = chartSigned(delta, format.value(delta, 0));
  const percent =
    measure.y1 !== 0
      ? ` (${chartSigned(delta, `${format.number(Math.round((delta / Math.abs(measure.y1)) * 1000) / 10)}%`)})`
      : "";
  return `${xText(measure.x1)} → ${xText(measure.x2)}: ${change}${percent}`;
}

/** The rulers over the plot: a band (span) or a line (free), two ends and a tag with the change. */
export function chartMeasureNodes(
  layout: ChartLayout,
  data: ChartData,
  format: ChartFormat,
  mode: ChartMeasureMode,
  list: readonly ChartMeasure[],
): ChartNode[] {
  const { x: xMap, y: yMap, plot } = layout;
  if (!xMap || !yMap || list.length === 0) return [];
  const half = xMap.band ? xMap.band / 2 : 0;
  const groups = list.map((measure) => {
    const x1 = chartPxOf(xMap, measure.x1);
    const x2 = chartPxOf(xMap, measure.x2);
    const y1 = clamp(chartPxOf(yMap, measure.y1), plot.y, plot.y + plot.height);
    const y2 = clamp(chartPxOf(yMap, measure.y2), plot.y, plot.y + plot.height);
    const children: ChartNode[] = [];
    if (mode === "span") {
      const lo = Math.max(plot.x, Math.min(x1, x2) - half);
      const hi = Math.min(plot.x + plot.width, Math.max(x1, x2) + half);
      children.push(
        node("rect", {
          x: fmt(lo),
          y: fmt(plot.y),
          width: fmt(Math.max(1, hi - lo)),
          height: fmt(plot.height),
          "data-ok-chart-measure-band": "",
        }),
      );
    } else
      children.push(
        node("line", {
          x1: fmt(x1),
          y1: fmt(y1),
          x2: fmt(x2),
          y2: fmt(y2),
          "data-ok-chart-measure-line": "",
        }),
      );
    for (const [cx, cy] of [
      [x1, y1],
      [x2, y2],
    ] as const)
      children.push(
        node("circle", { cx: fmt(cx), cy: fmt(cy), r: "4", "data-ok-chart-measure-end": "" }),
      );
    const text = chartMeasureText(data, format, measure);
    const width = chartTextWidth(text) + 12;
    const left = clamp((x1 + x2) / 2 - width / 2, 0, Math.max(0, layout.width - width));
    const top = clamp(Math.min(y1, y2) - 26, 0, Math.max(0, layout.height - 18));
    children.push(
      node("rect", {
        x: fmt(left),
        y: fmt(top),
        width: fmt(width),
        height: "18",
        rx: "4",
        "data-ok-chart-measure-tag": "",
      }),
      node(
        "text",
        {
          x: fmt(left + width / 2),
          y: fmt(top + 9),
          dy: "0.35em",
          "text-anchor": "middle",
          "data-ok-chart-measure-label": "",
          "data-ok-trend":
            measure.y2 > measure.y1 ? "up" : measure.y2 < measure.y1 ? "down" : "flat",
        },
        undefined,
        text,
      ),
    );
    return node("g", { "data-ok-chart-measure": mode }, children);
  });
  return [node("g", { "data-ok-chart-measures": "" }, groups)];
}

// --- Draggable annotations ------------------------------------------------------------------

/** Where a draggable annotation is drawn (px): its line, point or text position. */
export interface ChartAnnotationHit {
  /** Its index in the annotation list. */
  readonly index: number;
  readonly axis: ChartAnnotation["axis"];
  readonly px?: number | undefined;
  readonly py?: number | undefined;
}

/** How near (px) a press must be to an annotation to move it. */
const HIT = 8;

/** The draggable annotation under a px position (the nearest within 8px), or `undefined`. */
export function chartAnnotationAt(
  hits: readonly ChartAnnotationHit[],
  px: number,
  py: number,
): number | undefined {
  let best: { index: number; distance: number } | undefined;
  for (const hit of hits) {
    const dx = hit.px === undefined ? 0 : Math.abs(px - hit.px);
    const dy = hit.py === undefined ? 0 : Math.abs(py - hit.py);
    const distance = hit.px !== undefined && hit.py !== undefined ? Math.hypot(dx, dy) : dx + dy;
    if (distance <= (hit.axis === "text" ? HIT * 3 : HIT) && (!best || distance < best.distance))
      best = { index: hit.index, distance };
  }
  return best?.index;
}

/** An x position as an annotation `x`: the category's label, its date, or the number. */
function xOfIndex(data: ChartData, x: number): string | number {
  if (data.xType === "numeric") return r2(x);
  const index = clamp(Math.round(x), 0, Math.max(0, data.categories.length - 1));
  if (data.xType === "datetime") {
    const time = data.categories[index] as number | undefined;
    return time === undefined ? index : new Date(time).toISOString().slice(0, 10);
  }
  return data.categories[index] ?? index;
}

/** An annotation's x as a position on the axis (category index, date's index or number). */
export function chartAnnotationX(
  data: ChartData,
  raw: string | number | Date | undefined,
): number | undefined {
  if (raw === undefined) return undefined;
  if (data.xType === "numeric") return parseChartNumber(raw) ?? undefined;
  if (data.xType === "category") {
    const found = data.categories.indexOf(String(raw));
    return found >= 0 ? found : (parseChartNumber(raw) ?? undefined);
  }
  const time = new Date(raw).getTime();
  const index = (data.categories as readonly number[]).findIndex((value) => value >= time);
  return index < 0 ? undefined : index;
}

/**
 * The annotation moved by `dx` positions along the x axis and `dy` values (bands move as a whole).
 * Lines along one axis only move along the other.
 */
export function moveChartAnnotation(
  data: ChartData,
  annotation: ChartAnnotation,
  dx: number,
  dy: number,
): ChartAnnotation {
  const shiftX = (raw: string | number | Date | undefined) => {
    const at = chartAnnotationX(data, raw);
    return at === undefined ? raw : xOfIndex(data, at + dx);
  };
  const shiftY = (value: number | undefined) => (value === undefined ? value : r2(value + dy));
  if (annotation.axis === "x")
    return {
      ...annotation,
      x: shiftX(annotation.x),
      ...(annotation.x2 !== undefined ? { x2: shiftX(annotation.x2) } : {}),
    };
  if (annotation.axis === "y")
    return {
      ...annotation,
      y: shiftY(annotation.y),
      ...(annotation.y2 !== undefined ? { y2: shiftY(annotation.y2) } : {}),
    };
  return { ...annotation, x: shiftX(annotation.x), y: shiftY(annotation.y) };
}

/** The annotation dragged from one px position to another (data coordinates, snapped on index axes). */
export function dragChartAnnotation(
  layout: ChartLayout,
  data: ChartData,
  annotation: ChartAnnotation,
  from: { px: number; py: number },
  to: { px: number; py: number },
): ChartAnnotation {
  const { x: xMap, y: yMap } = layout;
  if (!xMap || !yMap) return annotation;
  const rawDx = chartXAt(xMap, to.px) - chartXAt(xMap, from.px);
  const dx = xMap.kind === "index" ? Math.round(rawDx) : rawDx;
  const dy = chartXAt(yMap, to.py) - chartXAt(yMap, from.py);
  return moveChartAnnotation(data, annotation, dx, dy);
}

/**
 * Keyboard moves of a picked annotation: arrows move it by one category (a tenth of the window on
 * numeric axes) or a twentieth of the value axis. `undefined`: not a move key.
 */
export function chartAnnotationKey(
  layout: ChartLayout,
  data: ChartData,
  annotation: ChartAnnotation,
  key: string,
): ChartAnnotation | undefined {
  const { x: xMap, y: yMap } = layout;
  if (!xMap || !yMap) return undefined;
  const stepX = xMap.kind === "index" ? 1 : (xMap.max - xMap.min) / 10;
  const stepY = (yMap.max - yMap.min) / 20;
  const moves: Record<string, [number, number]> = {
    ArrowLeft: [-stepX, 0],
    ArrowRight: [stepX, 0],
    ArrowUp: [0, stepY],
    ArrowDown: [0, -stepY],
  };
  const move = moves[key];
  return move ? moveChartAnnotation(data, annotation, move[0], move[1]) : undefined;
}

/** An annotation as announced: its label and position (`"Target: Mar, 40"`). */
export function chartAnnotationText(annotation: ChartAnnotation): string {
  const parts = [
    annotation.x === undefined ? undefined : String(annotation.x),
    annotation.x2 === undefined ? undefined : String(annotation.x2),
    annotation.y === undefined ? undefined : String(annotation.y),
    annotation.y2 === undefined ? undefined : String(annotation.y2),
  ].filter(Boolean);
  return `${annotation.label ?? chartMeasureLabels.annotation}: ${parts.join(", ")}`;
}
