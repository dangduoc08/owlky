import type { ChartFormat } from "./chart-format.js";
import {
  type ChartLayout,
  type ChartLayoutOptions,
  type ChartMark,
  type ChartNode,
  type ChartSlot,
  chartTextWidth,
  dataLabel,
  FONT,
  fmt,
  linePath,
  node,
  r2,
  shownLabels,
} from "./chart-layout.js";
import type { ChartData } from "./chart-model.js";
import { scaleLinear } from "./chart-scale.js";

/*
 * Funnel and slope layouts (ADR-0027, phase 3). Same contract as `layoutChart`. A funnel draws
 * the first visible series as bars centered on one axis (a pyramid is a funnel of growing
 * values); a slope chart joins each series' values across a few categories, without a value axis.
 */

const tick = (x: number, y: number, anchor: string, text: string, dy: string) =>
  node(
    "text",
    { x: fmt(x), y: fmt(y), dy, "text-anchor": anchor, "data-ok-chart-tick": "" },
    undefined,
    text,
  );

const groups = (series: ChartNode[], labels: ChartNode[]) => [
  node("g", { "data-ok-chart-crosshair": "" }, []),
  node("g", { "data-ok-chart-series-group": "" }, series),
  ...(labels.length ? [node("g", { "data-ok-chart-data-labels": "" }, labels)] : []),
  node("g", { "data-ok-chart-active": "" }, []),
];

const categoryText = (data: ChartData, format: ChartFormat, i: number) =>
  format.axis(
    data.xType === "datetime"
      ? (data.categories[i] as number)
      : (data.categories[i] ?? String(i + 1)),
  ).text;

/** Funnel: one centered bar per category, as long as its share of the largest value. */
export function layoutFunnel(
  data: ChartData,
  options: ChartLayoutOptions,
  format: ChartFormat,
): ChartLayout {
  const width = Math.max(40, Math.round(options.width));
  const height = Math.max(40, Math.round(options.height));
  const hidden = new Set(options.hidden ?? []);
  const index = data.series.findIndex((_, i) => !hidden.has(i));
  const series = data.series[index];
  const count = Math.max(data.categories.length, series?.points.length ?? 0);
  const names = Array.from({ length: count }, (_, i) => categoryText(data, format, i));
  const left = Math.max(0, ...names.map((text) => chartTextWidth(text))) + 16;
  const plot = { x: left, y: 0, width: Math.max(10, width - left - 8), height };
  const band = plot.height / Math.max(1, count);
  const thickness = (band * Math.min(100, Math.max(1, options.barHeight ?? 80))) / 100;
  const points = (series?.points ?? []).filter(
    (point): point is typeof point & { y: number } => point.y !== null && point.y > 0,
  );
  const max = Math.max(0, ...points.map((point) => point.y));
  const marks: ChartMark[] = [];
  const slots: ChartSlot[] = [];
  const bars: ChartNode[] = [];
  const labels: ChartNode[] = [];
  const axisY: ChartNode[] = [];
  const show = shownLabels(count, band, FONT, "index", (i) => i);
  for (let i = 0; i < count; i++) {
    const cy = plot.y + band * (i + 0.5);
    slots.push({ index: i, pos: r2(cy) });
    if (show(i)) axisY.push(tick(plot.x - 12, cy, "end", names[i] as string, "0.35em"));
  }
  for (const point of points) {
    if (!series || point.x >= count) continue;
    const w = (plot.width * point.y) / max;
    const x = plot.x + (plot.width - w) / 2;
    const cy = plot.y + band * (point.x + 0.5);
    marks.push({
      series: index,
      type: "funnel",
      index: point.x,
      x: point.x,
      value: point.y,
      px: r2(x + w),
      py: r2(cy),
      color: point.color ?? series.color,
    });
    bars.push(
      node("rect", {
        x: fmt(x),
        y: fmt(cy - thickness / 2),
        width: fmt(w),
        height: fmt(thickness),
        rx: String(Math.min(4, thickness / 2)),
        "data-ok-chart-bar": "",
        ...(point.color ? { "data-ok-color": point.color } : {}),
      }),
    );
    if (options.dataLabels) {
      const text = format.dataLabel(point.y, index, point.x, format.value(point.y, index));
      if (chartTextWidth(text) + 8 <= w && FONT + 2 <= thickness)
        labels.push(dataLabel(x + w / 2, cy, text, "inside"));
    }
  }
  const seriesNodes = series
    ? [
        node(
          "g",
          {
            "data-ok-chart-series": "",
            "data-ok-type": "funnel",
            "data-ok-color": series.color,
            "data-ok-index": String(index),
          },
          bars,
        ),
      ]
    : [];
  return {
    width,
    height,
    plot: { x: r2(plot.x), y: 0, width: r2(plot.width), height },
    mode: "index",
    horizontal: true,
    banded: true,
    band: r2(band),
    slots,
    marks,
    activeRadius: 0,
    nodes: [node("g", { "data-ok-chart-axis": "y" }, axisY), ...groups(seriesNodes, labels)],
  };
}

/**
 * Slope: each series a straight line across the categories (usually two: before and after), its
 * values printed beside the first and last points. The value scale fits the data; no value axis.
 */
export function layoutSlope(
  data: ChartData,
  options: ChartLayoutOptions,
  format: ChartFormat,
): ChartLayout {
  const width = Math.max(40, Math.round(options.width));
  const height = Math.max(40, Math.round(options.height));
  const hidden = new Set(options.hidden ?? []);
  const visible = data.series
    .map((series, index) => ({ series, index }))
    .filter(({ index }) => !hidden.has(index));
  const count = Math.max(data.categories.length, ...data.series.map((s) => s.points.length), 0);
  const names = Array.from({ length: count }, (_, i) => categoryText(data, format, i));
  const radius = Math.max(0, options.markerSize ?? 4);
  let lo = Number.POSITIVE_INFINITY;
  let hi = Number.NEGATIVE_INFINITY;
  let leftText = 0;
  let rightText = 0;
  for (const { series, index } of visible) {
    for (const point of series.points) {
      if (point.y === null) continue;
      lo = Math.min(lo, options.yMin ?? point.y);
      hi = Math.max(hi, options.yMax ?? point.y);
      const text = chartTextWidth(
        format.dataLabel(point.y, index, point.x, format.value(point.y, index)),
      );
      if (point.x === 0) leftText = Math.max(leftText, text);
      if (point.x === count - 1) rightText = Math.max(rightText, text);
    }
  }
  if (lo === Number.POSITIVE_INFINITY) {
    lo = 0;
    hi = 1;
  }
  const edge = radius + 8;
  const left = Math.max(leftText + edge, Math.ceil(chartTextWidth(names[0] ?? "") / 2), 8);
  const right = Math.max(rightText + edge, Math.ceil(chartTextWidth(names.at(-1) ?? "") / 2), 8);
  const top = 10 + radius;
  const plot = {
    x: left,
    y: top,
    width: Math.max(10, width - left - right),
    height: Math.max(10, height - top - (FONT + 18) - radius),
  };
  const toCat = (i: number) =>
    count > 1 ? plot.x + (plot.width * i) / (count - 1) : plot.x + plot.width / 2;
  const toValue = (value: number) => scaleLinear(value, lo, hi, plot.y + plot.height, plot.y);
  const grid: ChartNode[] = [];
  const axisX: ChartNode[] = [];
  const slots: ChartSlot[] = [];
  const spacing = count > 1 ? plot.width / (count - 1) : plot.width;
  const show = shownLabels(
    count,
    spacing,
    Math.max(0, ...names.map((text) => chartTextWidth(text))),
    "index",
    (i) => i,
  );
  for (let i = 0; i < count; i++) {
    const x = fmt(toCat(i));
    slots.push({ index: i, pos: r2(toCat(i)) });
    grid.push(
      node("line", {
        x1: x,
        x2: x,
        y1: fmt(plot.y - radius),
        y2: fmt(plot.y + plot.height + radius),
        "data-ok-chart-grid-line": "",
      }),
    );
    if (show(i))
      axisX.push(
        tick(toCat(i), plot.y + plot.height + radius + 12, "middle", names[i] as string, "0.71em"),
      );
  }
  const marks: ChartMark[] = [];
  const shapes: ChartNode[] = [];
  const labels: ChartNode[] = [];
  for (const { series, index } of visible) {
    const segments: [number, number][][] = [];
    let current: [number, number][] = [];
    const children: ChartNode[] = [];
    for (const point of [...series.points].sort((a, b) => a.x - b.x)) {
      if (point.y === null || point.x >= count) {
        if (current.length) segments.push(current);
        current = [];
        continue;
      }
      const px = toCat(point.x);
      const py = toValue(point.y);
      current.push([px, py]);
      marks.push({
        series: index,
        type: "slope",
        index: point.x,
        x: point.x,
        value: point.y,
        px: r2(px),
        py: r2(py),
        color: series.color,
      });
      if (radius > 0)
        children.push(
          node("circle", {
            cx: fmt(px),
            cy: fmt(py),
            r: fmt(radius),
            "data-ok-chart-marker": "",
          }),
        );
      // Values beside the first and last points, above the others.
      const text = format.dataLabel(point.y, index, point.x, format.value(point.y, index));
      const first = point.x === 0;
      const last = point.x === count - 1 && count > 1;
      labels.push(
        first || last
          ? node(
              "text",
              {
                x: fmt(first ? px - edge : px + edge),
                y: fmt(py),
                dy: "0.35em",
                "text-anchor": first ? "end" : "start",
                "data-ok-chart-data-label": "outside",
              },
              undefined,
              text,
            )
          : dataLabel(px, py - radius - 10, text, "outside"),
      );
    }
    if (current.length) segments.push(current);
    shapes.push(
      node(
        "g",
        {
          "data-ok-chart-series": "",
          "data-ok-type": "slope",
          "data-ok-color": series.color,
          "data-ok-index": String(index),
        },
        [
          ...segments.map((segment) =>
            node("path", {
              d: linePath(segment, "straight"),
              "data-ok-chart-line": "",
              ...(options.dashArray ? { "stroke-dasharray": fmt(options.dashArray) } : {}),
            }),
          ),
          ...children,
        ],
      ),
    );
  }
  return {
    width,
    height,
    plot: { x: r2(plot.x), y: r2(plot.y), width: r2(plot.width), height: r2(plot.height) },
    mode: "index",
    horizontal: false,
    banded: false,
    band: r2(spacing),
    slots,
    marks,
    activeRadius: radius + 2,
    nodes: [
      node("g", { "data-ok-chart-grid": "" }, grid),
      node("g", { "data-ok-chart-axis": "x" }, axisX),
      ...groups(shapes, labels),
    ],
  };
}
