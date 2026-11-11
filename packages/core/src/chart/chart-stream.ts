import type { ChartFormat } from "./chart-format.js";
import {
  type ChartLayout,
  type ChartLayoutOptions,
  type ChartMark,
  type ChartNode,
  type ChartSeriesPaint,
  chartTextWidth,
  clamp,
  dataLabel,
  FONT,
  layoutChart,
  linePath,
  node,
  r2,
} from "./chart-layout.js";
import type { ChartColor, ChartData, ChartDataSeries, ChartPoint } from "./chart-model.js";

/*
 * Streamgraphs (roadmap 4.18.21, ApexCharts `streamgraph`): stacked areas around a moving baseline.
 * The bands' edges are computed here and handed to `layoutChart` as ranges, so axes, zoom, keyboard
 * slots and the data table work as for any other x axis chart; the values stay in the table.
 */

export const chartStreamOffsets = ["wiggle", "silhouette", "zero", "expand"] as const;
export type ChartStreamOffset = (typeof chartStreamOffsets)[number];
export const chartStreamOrders = ["inside-out", "inverse", "none"] as const;
export type ChartStreamOrder = (typeof chartStreamOrders)[number];

export interface ChartStreamOptions {
  /** The baseline. Default `"wiggle"`. */
  readonly offset?: ChartStreamOffset | undefined;
  /** The stacking order, bottom first. Default `"inside-out"`. */
  readonly order?: ChartStreamOrder | undefined;
  /** No series names on the bands. */
  readonly hideLabels?: boolean | undefined;
  /** Bands thinner than this many px get no name. Default 24. */
  readonly labelMinWidth?: number | undefined;
  /** Per-point tooltips: the opacity of the other bands (0 to 1). Default 0.35. */
  readonly hoverOpacity?: number | undefined;
}

/** One band's values per column, bottom edge and top edge (in scale units). */
export interface ChartStreamBand {
  readonly series: number;
  readonly y0: readonly number[];
  readonly y1: readonly number[];
}

/** Bottom-to-top order of the series: `values[s][k]` is series `s` at column `k`. */
export function chartStreamOrder(
  values: readonly (readonly number[])[],
  order: ChartStreamOrder,
): number[] {
  const ids = values.map((_, id) => id);
  if (order === "none") return ids;
  if (order === "inverse") return ids.reverse();
  // Inside-out: series that peak first sit in the middle, the later ones alternate outward,
  // onto whichever side holds less so far.
  const peak = values.map((row) => row.indexOf(Math.max(...row)));
  const sum = values.map((row) => row.reduce((total, value) => total + value, 0));
  const sorted = [...ids].sort((a, b) => (peak[a] as number) - (peak[b] as number) || a - b);
  const tops: number[] = [];
  const bottoms: number[] = [];
  let top = 0;
  let bottom = 0;
  for (const id of sorted) {
    if (top <= bottom) {
      tops.push(id);
      top += sum[id] as number;
    } else {
      bottoms.push(id);
      bottom += sum[id] as number;
    }
  }
  return [...bottoms.reverse(), ...tops];
}

/** The stack's baseline per column for `values` in bottom-to-top order. */
export function chartStreamBaseline(
  values: readonly (readonly number[])[],
  offset: ChartStreamOffset,
): number[] {
  const columns = values[0]?.length ?? 0;
  const totals = Array.from({ length: columns }, (_, k) =>
    values.reduce((sum, row) => sum + (row[k] as number), 0),
  );
  if (offset === "zero" || offset === "expand") return totals.map(() => 0);
  if (offset === "silhouette") return totals.map((total) => -total / 2);
  // Wiggle: each column moves the baseline against the weighted slope of the bands above it, so
  // the outer edges stay as flat as the data allows (Byron and Wattenberg, 2008).
  const base = new Array<number>(columns).fill(0);
  for (let k = 1; k < columns; k++) {
    let weighted = 0;
    let weight = 0;
    let below = 0;
    for (const row of values) {
      const now = row[k] as number;
      const change = now - (row[k - 1] as number);
      weighted += (below + change / 2) * now;
      weight += now;
      below += change;
    }
    base[k] = (base[k - 1] as number) - (weight > 0 ? weighted / weight : 0);
  }
  // Centered on the stream's own extent, so the scale stays symmetric around the middle.
  const low = Math.min(...base);
  const high = Math.max(...base.map((value, k) => value + (totals[k] as number)));
  return base.map((value) => value - (low + high) / 2);
}

/** Band edges in scale units, bottom band first (`expand`: each column runs from 0 to 100). */
export function chartStreamBands(
  values: readonly (readonly number[])[],
  options: Pick<ChartStreamOptions, "offset" | "order">,
): ChartStreamBand[] {
  const offset = options.offset ?? "wiggle";
  const order = chartStreamOrder(values, options.order ?? "inside-out");
  const stack = order.map((id) => values[id] as readonly number[]);
  const columns = values[0]?.length ?? 0;
  const totals = Array.from({ length: columns }, (_, k) =>
    stack.reduce((sum, row) => sum + (row[k] as number), 0),
  );
  const base = chartStreamBaseline(stack, offset);
  const scale = (k: number) =>
    offset === "expand" ? ((totals[k] as number) > 0 ? 100 / (totals[k] as number) : 0) : 1;
  const edge = [...base];
  return order.map((series) => {
    const row = values[series] as readonly number[];
    const y0 = [...edge];
    for (let k = 0; k < columns; k++) edge[k] = (edge[k] as number) + (row[k] as number) * scale(k);
    return { series, y0, y1: [...edge] };
  });
}

/** A band's name: where the band is thickest, and only when it fits there. */
function bandLabel(
  name: string,
  color: ChartColor,
  xs: readonly number[],
  tops: readonly number[],
  bottoms: readonly number[],
  minWidth: number,
): ChartNode | undefined {
  const thick = xs.map((_, k) => (bottoms[k] as number) - (tops[k] as number));
  const room = FONT + 4;
  const tone = /-(lighter|light)$/.test(color) ? "plain" : "inside";
  // The thickest column whose neighbors still hold the name on a line of text.
  const columns = xs.map((_, k) => k).sort((a, b) => (thick[b] as number) - (thick[a] as number));
  for (const best of columns) {
    if ((thick[best] as number) < Math.max(room, minWidth)) return undefined;
    let from = best;
    let to = best;
    while (from > 0 && (thick[from - 1] as number) >= room) from--;
    while (to < xs.length - 1 && (thick[to + 1] as number) >= room) to++;
    const center = xs[best] as number;
    const half = Math.min(center - (xs[from] as number), (xs[to] as number) - center);
    if (xs.length === 1 || chartTextWidth(name) / 2 <= half)
      return dataLabel(
        center,
        ((tops[best] as number) + (bottoms[best] as number)) / 2,
        name,
        tone,
      );
  }
  return undefined;
}

/** Lays out a streamgraph on `layoutChart`'s axes. */
export function layoutStream(
  data: ChartData,
  options: ChartLayoutOptions,
  stream: ChartStreamOptions,
  format: ChartFormat,
): ChartLayout {
  const hidden = new Set(options.hidden ?? []);
  const visible = data.series.flatMap((series, index) =>
    hidden.has(index) ? [] : [{ series, index }],
  );
  const columns = Math.max(
    data.categories.length,
    ...data.series.flatMap((series) => series.points.map((point) => point.x + 1)),
    0,
  );
  const raw = visible.map(({ series }) => {
    const row = new Array<ChartPoint | undefined>(columns).fill(undefined);
    for (const point of series.points) row[point.x] = point;
    return row;
  });
  // Series are joined on x: a missing value is zero, and a negative one too (a band has no sign).
  const values = raw.map((row) => row.map((point) => Math.max(0, point?.y ?? 0)));
  const offset = stream.offset ?? "wiggle";
  const bands = chartStreamBands(values, { offset, order: stream.order });
  const totals = Array.from({ length: columns }, (_, k) =>
    values.reduce((sum, row) => sum + (row[k] as number), 0),
  );
  const series: ChartDataSeries[] = bands.map(({ series: at, y0, y1 }) => ({
    ...(visible[at] as { series: ChartDataSeries }).series,
    points: Array.from({ length: columns }, (_, x) => ({
      x,
      y: y1[x] as number,
      range: [y0[x] as number, y1[x] as number],
    })),
  }));
  const veil = 1 - clamp(stream.hoverOpacity ?? 0.35, 0, 1);
  const paint = ({
    series: band,
    index,
    points,
    attrs,
    toValue,
    toPos,
    plot,
    marks,
    labels,
    patterns,
  }: Parameters<NonNullable<ChartLayoutOptions["drawSeries"]>>[0]): ChartSeriesPaint => {
    const at = (bands[index] as ChartStreamBand).series;
    const original = (visible[at] as { index: number }).index;
    const xs = points.map((point) => toPos(point.x));
    const tops = points.map((point) => toValue((point.range as readonly number[])[1] as number));
    const bottoms = points.map((point) => toValue((point.range as readonly number[])[0] as number));
    const curve = options.curve ?? "smooth";
    const upper = linePath(
      xs.map((x, k) => [x, tops[k] as number]),
      curve,
    );
    const lower = linePath(
      xs.map((x, k) => [x, bottoms[k] as number]).reverse() as [number, number][],
      curve,
    );
    const d = `${upper}L${lower.slice(1)}Z`;
    const fill = band.pattern ? { fill: patterns.fill(band.pattern, band.color) } : {};
    const name = stream.hideLabels
      ? undefined
      : bandLabel(band.name, band.color, xs, tops, bottoms, stream.labelMinWidth ?? 24);
    if (name) labels.push(name);
    points.forEach((point, k) => {
      const given = (raw[at] as (ChartPoint | undefined)[])[point.x];
      if (given?.y === null || given?.y === undefined) return;
      marks.push({
        series: original,
        type: "streamgraph",
        index: point.x,
        x: point.x,
        value: given.y,
        px: r2(xs[k] as number),
        py: r2(((tops[k] as number) + (bottoms[k] as number)) / 2),
        color: band.color,
        ...(offset === "expand" ? {} : { total: totals[point.x] as number }),
        ...(band.pattern ? { pattern: band.pattern } : {}),
        ...(veil > 0
          ? {
              stream: {
                veil: node("rect", {
                  x: String(plot.x),
                  y: String(plot.y),
                  width: String(plot.width),
                  height: String(plot.height),
                  "fill-opacity": String(r2(veil)),
                  "data-ok-chart-stream-veil": "",
                }),
                band: node("path", {
                  d,
                  ...fill,
                  "data-ok-chart-stream-band": "",
                  "data-ok-color": band.color,
                }),
                ...(name ? { label: name } : {}),
              },
            }
          : {}),
      });
    });
    return {
      layer: "areas",
      node: node("g", { ...attrs, "data-ok-index": String(original) }, [
        node("path", { d, ...fill, "data-ok-chart-stream-band": "" }),
      ]),
    };
  };
  const layout = layoutChart(
    { ...data, series },
    {
      ...options,
      hidden: [],
      // The baseline moves: value ticks mean little unless the author asks for them.
      grid: options.grid ?? "none",
      yAxes: options.yAxes?.length
        ? options.yAxes
        : [
            {
              seriesName: [],
              opposite: false,
              logarithmic: false,
              logBase: 10,
              reversed: false,
              show: false,
            },
          ],
      format,
      drawSeries: paint,
    },
  );
  // Tooltip rows run top-down, the way the bands are stacked on screen.
  return { ...layout, marks: [...layout.marks].reverse() as ChartMark[] };
}
