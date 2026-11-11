import { chartMarkerNode } from "./chart-cues.js";
import type { ChartFormat } from "./chart-format.js";
import {
  type ChartLayout,
  type ChartLayoutOptions,
  type ChartNode,
  type ChartSeriesPaint,
  clamp,
  fmt,
  layoutChart,
  linePath,
  node,
  r2,
} from "./chart-layout.js";
import type { ChartData, ChartDataSeries } from "./chart-model.js";
import {
  type ChartViolinStats,
  chartBandwidth,
  chartKernelDensity,
  chartTukeyEnds,
} from "./chart-stats.js";

/*
 * Violin charts (roadmap 4.18.21, ApexCharts `violin`): a mirrored density curve per category,
 * estimated from the observations (Silverman's bandwidth) or given precomputed, with an optional
 * five-number box and the observations as dots. Jitter is a fixed sequence, so React, HTML and the
 * server draw the same dots.
 */

export const chartViolinNormalize = ["individual", "group"] as const;
export type ChartViolinNormalize = (typeof chartViolinNormalize)[number];
export const chartViolinSides = ["both", "left", "right", "top", "bottom"] as const;
export type ChartViolinSide = (typeof chartViolinSides)[number];
export const chartViolinWhiskers = ["minmax", "tukey"] as const;
export type ChartViolinWhiskers = (typeof chartViolinWhiskers)[number];

export interface ChartViolinOptions {
  /** Width scale: each violin's own peak (`individual`) or one scale for the chart (`group`). */
  readonly normalize?: ChartViolinNormalize | undefined;
  /** Symmetric, or half a violin on one side. Default `"both"`. */
  readonly side?: ChartViolinSide | undefined;
  /** Multiplies the drawn half-width. Default 1. */
  readonly bandwidthScale?: number | undefined;
  /** The kernel width in value units (default Silverman's rule). */
  readonly kdeBandwidth?: number | undefined;
  /** Density samples per violin. Default 64. */
  readonly kdeResolution?: number | undefined;
  /** A five-number box beside the density. */
  readonly box?: boolean | undefined;
  /** Whisker ends: the extremes (default) or Tukey's 1.5 × IQR fences. */
  readonly whiskers?: ChartViolinWhiskers | undefined;
  /** No dots. */
  readonly hidePoints?: boolean | undefined;
  /** Dot radius in px. Default 2.5. */
  readonly pointSize?: number | undefined;
  /** Dot spread as a share of the half-width (0 to 1). Default 0.5. */
  readonly jitter?: number | undefined;
  /** Dots may leave the outline. */
  readonly unconstrained?: boolean | undefined;
  /** Dots per violin; extra ones are thinned evenly. Default 3000. */
  readonly maxPoints?: number | undefined;
}

/** A violin's curve as `[value, weight]`: the given one, or the density estimate. */
export function chartViolinCurve(
  stats: ChartViolinStats,
  options: Pick<ChartViolinOptions, "kdeBandwidth" | "kdeResolution">,
): readonly (readonly [number, number])[] {
  if (stats.density) return stats.density;
  const bandwidth = options.kdeBandwidth;
  return chartKernelDensity(
    stats.samples,
    bandwidth !== undefined && bandwidth > 0 ? bandwidth : chartBandwidth(stats.samples),
    options.kdeResolution ?? 64,
  );
}

/** A low-discrepancy sequence in `[0, 1)`: the same dots on every render. */
const golden = (i: number) => (i * 0.61803398875) % 1;

/** Lays out violins on `layoutChart`'s axes, one per category and series. */
export function layoutViolin(
  data: ChartData,
  options: ChartLayoutOptions,
  violin: ChartViolinOptions,
  format: ChartFormat,
): ChartLayout {
  const hidden = new Set(options.hidden ?? []);
  const shown = data.series.flatMap((_, index) => (hidden.has(index) ? [] : [index]));
  const curves = new Map(
    data.series.flatMap((series) =>
      series.points.flatMap((point) => {
        const stats = point.violin;
        return stats ? [[point, chartViolinCurve(stats, violin)] as const] : [];
      }),
    ),
  );
  const series: ChartDataSeries[] = data.series.map((entry) => ({
    ...entry,
    points: entry.points.map((point) => {
      const curve = curves.get(point);
      if (!curve) return point;
      // The value scale spans the curve's own tails.
      return {
        ...point,
        range: [(curve[0] as readonly number[])[0], (curve.at(-1) as readonly number[])[0]] as [
          number,
          number,
        ],
      };
    }),
  }));
  const peak = (curve: readonly (readonly [number, number])[]) =>
    Math.max(...curve.map(([, weight]) => weight));
  const groupPeak = Math.max(0, ...[...curves.values()].map(peak));
  const normalize = violin.normalize ?? "individual";
  const side = violin.side ?? "both";
  const direction = side === "left" || side === "top" ? -1 : side === "both" ? 0 : 1;
  const scale = Math.max(0.05, violin.bandwidthScale ?? 1);
  const jitter = clamp(violin.jitter ?? 0.5, 0, 1);
  const radius = Math.max(0.5, violin.pointSize ?? 2.5);
  const limit = Math.max(1, Math.round(violin.maxPoints ?? 3000));
  const paint = ({
    series: entry,
    index,
    points,
    attrs,
    horizontal,
    band,
    toValue,
    toPos,
    marks,
    patterns,
  }: Parameters<NonNullable<ChartLayoutOptions["drawSeries"]>>[0]): ChartSeriesPaint => {
    const slot = shown.indexOf(index);
    const group = band * 0.8;
    const size = group / Math.max(1, shown.length);
    const at = (value: number, cross: number): [number, number] =>
      horizontal ? [value, cross] : [cross, value];
    const children: ChartNode[] = [];
    const original = data.series[index] as ChartDataSeries;
    for (const point of points) {
      const source = original.points.find((other) => other.x === point.x);
      const stats = source?.violin;
      if (!source || !stats) continue;
      const curve = curves.get(source) as readonly (readonly [number, number])[];
      const center = toPos(point.x) - group / 2 + slot * size + size / 2;
      const own = peak(curve);
      const top = normalize === "group" ? groupPeak : own;
      const half = (size / 2) * scale;
      const width = (weight: number) => (top > 0 ? (half * weight) / top : 0);
      const edge = curve.map(
        ([value, weight]) => [toValue(value), width(weight)] as [number, number],
      );
      const first = edge.map(([value, w]) => at(value, center + (direction || 1) * w));
      const second =
        direction === 0
          ? [...edge].reverse().map(([value, w]) => at(value, center - w))
          : [
              at((edge.at(-1) as [number, number])[0], center),
              at((edge[0] as [number, number])[0], center),
            ];
      const d = `${linePath(first, "straight")}L${linePath(second, "straight").slice(1)}Z`;
      children.push(
        node("path", {
          d,
          ...(entry.pattern ? { fill: patterns.fill(entry.pattern, entry.color) } : {}),
          "data-ok-chart-violin": "",
        }),
      );
      const [min, q1, median, q3, max] = stats.five;
      if (violin.box) {
        const boxSize = Math.max(4, size * 0.15);
        const [lo, hi] =
          violin.whiskers === "tukey" && stats.samples.length
            ? chartTukeyEnds(stats.samples)
            : [min, max];
        const a = at(toValue(lo), center);
        const b = at(toValue(q1), center);
        const c = at(toValue(q3), center);
        const e = at(toValue(hi), center);
        for (const [p, q] of [
          [a, b],
          [c, e],
        ] as const)
          children.push(
            node("line", {
              x1: fmt(p[0]),
              y1: fmt(p[1]),
              x2: fmt(q[0]),
              y2: fmt(q[1]),
              "data-ok-chart-violin-whisker": "",
            }),
          );
        const [bx, by] = at(toValue(Math.min(q1, q3)), center - boxSize / 2);
        const [cx, cy] = at(toValue(Math.max(q1, q3)), center + boxSize / 2);
        children.push(
          node("rect", {
            x: fmt(Math.min(bx, cx)),
            y: fmt(Math.min(by, cy)),
            width: fmt(Math.abs(cx - bx)),
            height: fmt(Math.abs(cy - by)),
            rx: "1",
            "data-ok-chart-violin-box": "",
          }),
        );
        const [mx0, my0] = at(toValue(median), center - boxSize / 2);
        const [mx1, my1] = at(toValue(median), center + boxSize / 2);
        children.push(
          node("line", {
            x1: fmt(mx0),
            y1: fmt(my0),
            x2: fmt(mx1),
            y2: fmt(my1),
            "data-ok-chart-violin-median": "",
          }),
        );
      }
      if (!violin.hidePoints && stats.samples.length) {
        const { samples } = stats;
        const step = samples.length > limit ? samples.length / limit : 1;
        for (let k = 0, count = 0; k < samples.length; k += step, count++) {
          const value = samples[Math.floor(k)] as number;
          // The curve's width at this value (the nearest density sample), or the whole slot.
          const allowed = violin.unconstrained
            ? half
            : width((nearest(curve, value) as readonly [number, number])[1]);
          const spread = golden(count) * jitter * allowed;
          const cross =
            direction === 0
              ? center + (count % 2 === 0 ? spread : -spread)
              : center + direction * spread;
          const [px, py] = at(toValue(value), cross);
          children.push(
            chartMarkerNode(entry.shape, px, py, radius, { "data-ok-chart-violin-point": "" }),
          );
        }
      }
      const [px, py] = at(toValue(median), center);
      const box = horizontal
        ? {
            x: r2(toValue(min)),
            y: r2(center - half),
            width: r2(Math.abs(toValue(max) - toValue(min))),
            height: r2(half * 2),
          }
        : {
            x: r2(center - half),
            y: r2(Math.min(toValue(min), toValue(max))),
            width: r2(half * 2),
            height: r2(Math.abs(toValue(max) - toValue(min))),
          };
      marks.push({
        series: index,
        type: "violin",
        index: point.x,
        x: point.x,
        value: median,
        px: r2(px),
        py: r2(py),
        color: entry.color,
        range: stats.five,
        box,
        count: stats.count,
        ...(entry.shape ? { shape: entry.shape } : {}),
        ...(entry.pattern ? { pattern: entry.pattern } : {}),
      });
    }
    return { layer: "bars", node: node("g", attrs, children) };
  };
  return layoutChart({ ...data, series }, { ...options, format, drawSeries: paint });
}

/** The curve point nearest to `value`. */
function nearest(curve: readonly (readonly [number, number])[], value: number) {
  let best = curve[0];
  for (const pair of curve)
    if (Math.abs(pair[0] - value) < Math.abs(((best as readonly number[])[0] as number) - value))
      best = pair;
  return best;
}
