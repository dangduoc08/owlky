import { chartMarkerNode } from "./chart-cues.js";
import type { ChartFormat } from "./chart-format.js";
import {
  type ChartLayout,
  type ChartLayoutOptions,
  type ChartNode,
  type ChartSeriesPaint,
  layoutChart,
  node,
  r2,
} from "./chart-layout.js";
import type { ChartData, ChartDataSeries } from "./chart-model.js";
import type { ChartOrientation } from "./chart-sankey.js";

/*
 * Beeswarm charts (roadmap 4.18.21, ApexCharts unit `layout: "scatter"`, `y: "lanes"`): one lane per
 * series, each observation a dot along the value axis, pushed across the lane just far enough not to
 * overlap the dots before it (`swarm`) or spread by a fixed sequence (`jitter`). Both are computed,
 * never random, so server, React and HTML agree.
 */

export const chartBeeswarmSpreads = ["swarm", "jitter"] as const;
export type ChartBeeswarmSpread = (typeof chartBeeswarmSpreads)[number];

export interface ChartBeeswarmOptions {
  /** How equal values separate within a lane. Default `"swarm"`. */
  readonly spread?: ChartBeeswarmSpread | undefined;
  /** The value axis: left to right (`horizontal`, the default) or up (`vertical`). */
  readonly orientation?: ChartOrientation | undefined;
}

/** Offsets across the lane for dots at sorted positions `at`, none closer than `2r` to another. */
export function chartSwarmOffsets(at: readonly number[], r: number): number[] {
  const placed: { at: number; off: number }[] = [];
  const out: number[] = [];
  const diameter = 2 * r;
  for (const pos of at) {
    // Dots within a diameter along the axis block part of the lane around their own offset.
    const near = placed.filter((dot) => Math.abs(dot.at - pos) < diameter);
    const blocked = near.map((dot) => {
      const reach = Math.sqrt(Math.max(0, diameter ** 2 - (dot.at - pos) ** 2));
      return [dot.off - reach, dot.off + reach] as const;
    });
    const free = (off: number) => blocked.every(([a, b]) => off <= a + 1e-6 || off >= b - 1e-6);
    const candidates = [0, ...blocked.flat()].sort((a, b) => Math.abs(a) - Math.abs(b) || b - a);
    const off = candidates.find(free) ?? 0;
    placed.push({ at: pos, off });
    out.push(off);
  }
  return out;
}

const golden = (i: number) => (i * 0.61803398875) % 1;

/** Lays out a beeswarm on `layoutChart`'s axes, lanes as categories. */
export function layoutBeeswarm(
  data: ChartData,
  options: ChartLayoutOptions,
  bee: ChartBeeswarmOptions,
  format: ChartFormat,
): ChartLayout {
  const hidden = new Set(options.hidden ?? []);
  const visible = data.series.flatMap((series, index) =>
    hidden.has(index) ? [] : [{ series, index }],
  );
  const given = options.markerSize;
  // One lane per series: a point that spans the lane's values sets the value scale.
  const series: ChartDataSeries[] = visible.map(({ series: entry }, lane) => {
    const values = entry.points.flatMap((point) => (point.y === null ? [] : [point.y]));
    return {
      ...entry,
      points: values.length
        ? [{ x: lane, y: values[0] as number, range: [Math.min(...values), Math.max(...values)] }]
        : [],
    };
  });
  const paint = ({
    series: lane,
    index,
    attrs,
    horizontal,
    band,
    toValue,
    toPos,
    marks,
  }: Parameters<NonNullable<ChartLayoutOptions["drawSeries"]>>[0]): ChartSeriesPaint => {
    const { series: source, index: original } = visible[index] as (typeof visible)[number];
    const center = toPos(index);
    const halfLane = (band / 2) * 0.9;
    const dots = source.points
      .flatMap((point) => (point.y === null ? [] : [{ point, at: toValue(point.y) }]))
      .sort((a, b) => a.at - b.at || a.point.x - b.point.x);
    const positions = dots.map((dot) => dot.at);
    let r = Math.max(1, given ?? 5);
    let offsets =
      bee.spread === "jitter" ? positions.map(() => 0) : chartSwarmOffsets(positions, r);
    if (bee.spread === "jitter") {
      offsets = positions.map((_, i) => (golden(i) - 0.5) * halfLane * 2);
    } else {
      // A swarm that overflows its lane shrinks its dots, then squeezes what still overflows.
      const reach = () => Math.max(0, ...offsets.map(Math.abs)) || 1;
      if (given === undefined && reach() > halfLane) {
        r = Math.max(2, r / Math.sqrt(reach() / halfLane));
        offsets = chartSwarmOffsets(positions, r);
      }
      if (reach() > halfLane) {
        const scale = halfLane / reach();
        offsets = offsets.map((off) => off * scale);
      }
    }
    const children: ChartNode[] = dots.map(({ point, at }, i) => {
      const cross = center + (offsets[i] as number);
      const [px, py] = horizontal ? [at, cross] : [cross, at];
      marks.push({
        series: original,
        type: "beeswarm",
        index: point.x,
        x: point.x,
        value: point.y as number,
        px: r2(px),
        py: r2(py),
        r: r2(r),
        color: point.color ?? lane.color,
        ...(lane.shape ? { shape: lane.shape } : {}),
      });
      return chartMarkerNode(lane.shape, px, py, r, {
        "data-ok-chart-bee": "",
        ...(point.color ? { "data-ok-color": point.color } : {}),
      });
    });
    return {
      layer: "points",
      node: node("g", { ...attrs, "data-ok-index": String(original) }, children),
    };
  };
  const horizontal = bee.orientation !== "vertical";
  return layoutChart(
    { ...data, categories: visible.map(({ series: lane }) => lane.name), series },
    {
      ...options,
      hidden: [],
      horizontal,
      format,
      drawSeries: paint,
    },
  );
}
