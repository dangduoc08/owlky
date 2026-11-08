import type { ChartFormat } from "./chart-format.js";
import {
  type ChartLayout,
  type ChartLayoutOptions,
  type ChartMark,
  type ChartNode,
  type ChartRect,
  chartTextWidth,
  dataLabel,
  FONT,
  fmt,
  node,
  r2,
  shownLabels,
} from "./chart-layout.js";
import type { ChartColor, ChartData } from "./chart-model.js";

/*
 * Cell layouts (ADR-0027, phase 3): heatmaps (a grid of categories × series) and treemaps
 * (nested rectangles). Same contract as `layoutChart`: data + size → SVG nodes and the cells
 * that activate the tooltip. A cell's shade (`fill-opacity`) grows with its value, so the color
 * stays the series' own and follows themes.
 */

/** Gap between cells in px. */
const GAP = 3;
/** Treemap cell names: the medium font size. */
const NAME_FONT = 14;

/** A shade (fill opacity) from `floor` to 1 for a value between `min` and `max`. */
const shader = (values: readonly number[], floor: number) => {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return (value: number) =>
    max > min ? r2(floor + ((1 - floor) * (value - min)) / (max - min)) : 1;
};

/** White text on strong shades, primary text on faint ones (they show the paper through). */
const tone = (opacity: number) => (opacity >= 0.6 ? "inside" : "plain");

const cellNode = (rect: ChartRect, opacity: number, color: ChartColor | undefined, rx: number) =>
  node("rect", {
    x: fmt(rect.x + GAP / 2),
    y: fmt(rect.y + GAP / 2),
    width: fmt(Math.max(0, rect.width - GAP)),
    height: fmt(Math.max(0, rect.height - GAP)),
    rx: String(rx),
    "fill-opacity": String(opacity),
    "data-ok-chart-cell": "",
    ...(color ? { "data-ok-color": color } : {}),
  });

const seriesGroup = (type: string, color: ChartColor, index: number, children: ChartNode[]) =>
  node(
    "g",
    {
      "data-ok-chart-series": "",
      "data-ok-type": type,
      "data-ok-color": color,
      "data-ok-index": String(index),
    },
    children,
  );

const result = (
  width: number,
  height: number,
  plot: ChartRect,
  marks: ChartMark[],
  nodes: ChartNode[],
): ChartLayout => ({
  width,
  height,
  plot,
  mode: "cell",
  horizontal: false,
  banded: false,
  band: 0,
  slots: [],
  marks,
  activeRadius: 0,
  nodes,
});

const tick = (x: number, y: number, anchor: string, text: string, dy: string) =>
  node(
    "text",
    { x: fmt(x), y: fmt(y), dy, "text-anchor": anchor, "data-ok-chart-tick": "" },
    undefined,
    text,
  );

/** Heatmap: one row per series (the first at the bottom), one column per category. */
export function layoutHeatmap(
  data: ChartData,
  options: ChartLayoutOptions,
  format: ChartFormat,
): ChartLayout {
  const width = Math.max(40, Math.round(options.width));
  const height = Math.max(40, Math.round(options.height));
  const hidden = new Set(options.hidden ?? []);
  const rows = data.series
    .map((series, index) => ({ series, index }))
    .filter(({ index }) => !hidden.has(index));
  const count = Math.max(data.categories.length, ...data.series.map((s) => s.points.length), 0);
  const columnLabels = Array.from(
    { length: count },
    (_, i) =>
      format.axis(
        data.xType === "datetime"
          ? (data.categories[i] as number)
          : (data.categories[i] ?? String(i + 1)),
      ).text,
  );
  const left = Math.max(0, ...rows.map(({ series }) => chartTextWidth(series.name))) + 14;
  const top = 10;
  const plot: ChartRect = {
    x: left,
    y: top,
    width: Math.max(10, width - left - 4),
    height: Math.max(10, height - top - (FONT + 18)),
  };
  const cw = plot.width / Math.max(1, count);
  const ch = plot.height / Math.max(1, rows.length);
  const values = rows.flatMap(({ series }) =>
    series.points.flatMap((point) => (point.y === null ? [] : [point.y])),
  );
  const shade = shader(values, 0.12);
  const marks: ChartMark[] = [];
  const groups: ChartNode[] = [];
  const labels: ChartNode[] = [];
  const axisY: ChartNode[] = [];
  rows.forEach(({ series, index }, row) => {
    const y = plot.y + plot.height - (row + 1) * ch;
    axisY.push(tick(plot.x - 12, y + ch / 2, "end", series.name, "0.35em"));
    const cells: ChartNode[] = [];
    for (const point of series.points) {
      if (point.y === null || point.x >= count) continue;
      const cell: ChartRect = {
        x: r2(plot.x + point.x * cw),
        y: r2(y),
        width: r2(cw),
        height: r2(ch),
      };
      const opacity = shade(point.y);
      cells.push(cellNode(cell, opacity, point.color, 2));
      marks.push({
        series: index,
        type: "heatmap",
        index: point.x,
        x: point.x,
        value: point.y,
        px: r2(cell.x + cw / 2),
        py: r2(cell.y + ch / 2),
        color: point.color ?? series.color,
        cell,
      });
      if (options.dataLabels) {
        const text = format.value(point.y, index);
        if (chartTextWidth(text) + 4 <= cw - GAP && FONT + 4 <= ch - GAP)
          labels.push(dataLabel(cell.x + cw / 2, cell.y + ch / 2, text, tone(opacity)));
      }
    }
    groups.push(seriesGroup("heatmap", series.color, index, cells));
  });
  const widest = Math.max(0, ...columnLabels.map((text) => chartTextWidth(text)));
  const show = shownLabels(count, cw, widest, "index", (i) => i);
  const axisX = columnLabels.flatMap((text, i) =>
    show(i)
      ? [tick(plot.x + cw * (i + 0.5), plot.y + plot.height + 12, "middle", text, "0.71em")]
      : [],
  );
  return result(width, height, plot, marks, [
    node("g", { "data-ok-chart-axis": "x" }, axisX),
    node("g", { "data-ok-chart-axis": "y" }, axisY),
    node("g", { "data-ok-chart-series-group": "" }, groups),
    ...(labels.length ? [node("g", { "data-ok-chart-data-labels": "" }, labels)] : []),
    node("g", { "data-ok-chart-active": "" }, []),
  ]);
}

interface Area {
  readonly key: number;
  readonly value: number;
}

/** The worst aspect ratio of a row of areas laid along a side (squarified treemaps). */
const worst = (row: readonly Area[], side: number) => {
  const sum = row.reduce((total, item) => total + item.value, 0);
  const max = Math.max(...row.map((item) => item.value));
  const min = Math.min(...row.map((item) => item.value));
  return Math.max((side * side * max) / (sum * sum), (sum * sum) / (side * side * min));
};

/**
 * Squarified treemap (Bruls, Huizing and van Wijk): rectangles with areas proportional to the
 * values and aspect ratios close to 1, largest first. Values must be positive.
 */
export function squarify(values: readonly Area[], rect: ChartRect): Map<number, ChartRect> {
  const out = new Map<number, ChartRect>();
  const total = values.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0 || rect.width <= 0 || rect.height <= 0) return out;
  const scale = (rect.width * rect.height) / total;
  const queue = [...values]
    .sort((a, b) => b.value - a.value)
    .map((item) => ({ key: item.key, value: item.value * scale }));
  let { x, y, width: w, height: h } = rect;
  const place = (row: readonly Area[]) => {
    const sum = row.reduce((s, item) => s + item.value, 0);
    if (w >= h) {
      // A column on the left.
      const cw = sum / h;
      let yy = y;
      for (const item of row) {
        const hh = item.value / cw;
        out.set(item.key, { x, y: yy, width: cw, height: hh });
        yy += hh;
      }
      x += cw;
      w -= cw;
    } else {
      // A row on top.
      const rh = sum / w;
      let xx = x;
      for (const item of row) {
        const ww = item.value / rh;
        out.set(item.key, { x: xx, y, width: ww, height: rh });
        xx += ww;
      }
      y += rh;
      h -= rh;
    }
  };
  let row: Area[] = [];
  for (const item of queue) {
    const side = Math.min(w, h);
    if (row.length > 0 && worst([...row, item], side) > worst(row, side)) {
      place(row);
      row = [];
    }
    row.push(item);
  }
  if (row.length) place(row);
  return out;
}

/** Treemap: one group per series, one rectangle per category value, sized by value. */
export function layoutTreemap(
  data: ChartData,
  options: ChartLayoutOptions,
  format: ChartFormat,
): ChartLayout {
  const width = Math.max(40, Math.round(options.width));
  const height = Math.max(40, Math.round(options.height));
  const hidden = new Set(options.hidden ?? []);
  const plot: ChartRect = { x: 0, y: 0, width, height };
  const groups = data.series
    .map((series, index) => ({
      series,
      index,
      points: series.points.filter(
        (point): point is typeof point & { y: number } => point.y !== null && point.y > 0,
      ),
    }))
    .filter(({ index, points }) => !hidden.has(index) && points.length > 0);
  const shade = shader(
    groups.flatMap(({ points }) => points.map((point) => point.y)),
    0.48,
  );
  const boxes = squarify(
    groups.map(({ index, points }) => ({
      key: index,
      value: points.reduce((sum, point) => sum + point.y, 0),
    })),
    plot,
  );
  const marks: ChartMark[] = [];
  const nodes: ChartNode[] = [];
  const labels: ChartNode[] = [];
  const tags: ChartNode[] = [];
  for (const { series, index, points } of groups) {
    const box = boxes.get(index) as ChartRect;
    const cells = squarify(
      points.map((point, i) => ({ key: i, value: point.y })),
      box,
    );
    const children: ChartNode[] = [];
    points.forEach((point, i) => {
      const rect = cells.get(i) as ChartRect;
      const cell: ChartRect = {
        x: r2(rect.x),
        y: r2(rect.y),
        width: r2(rect.width),
        height: r2(rect.height),
      };
      const opacity = shade(point.y);
      children.push(cellNode(cell, opacity, point.color, 4));
      const cx = cell.x + cell.width / 2;
      const cy = cell.y + cell.height / 2;
      marks.push({
        series: index,
        type: "treemap",
        index: point.x,
        x: point.x,
        value: point.y,
        px: r2(cx),
        py: r2(cy),
        color: point.color ?? series.color,
        cell,
      });
      // The category name when it fits; with data labels, the value under it.
      const name = format.axis(data.categories[point.x] ?? String(point.x + 1)).text;
      const room = cell.width - GAP - 8;
      if (chartTextWidth(name, NAME_FONT) > room || NAME_FONT + 8 > cell.height - GAP) return;
      const value = options.dataLabels ? format.value(point.y, index) : "";
      const both = value !== "" && chartTextWidth(value) <= room && cell.height - GAP >= 44;
      labels.push(
        node(
          "text",
          {
            x: fmt(cx),
            y: fmt(both ? cy - 8 : cy),
            dy: "0.35em",
            "text-anchor": "middle",
            "data-ok-chart-cell-label": tone(opacity),
          },
          undefined,
          name,
        ),
      );
      if (both) labels.push(dataLabel(cx, cy + 10, value, tone(opacity)));
    });
    nodes.push(seriesGroup("treemap", series.color, index, children));
    // Several groups: a tag with the series name in the group's corner, when it fits.
    const tagWidth = chartTextWidth(series.name) + 12;
    if (groups.length > 1 && tagWidth + 8 <= box.width && box.height >= 30) {
      const x = box.x + GAP / 2 + 4;
      const y = box.y + GAP / 2 + 4;
      tags.push(
        node("rect", {
          x: fmt(x),
          y: fmt(y),
          width: fmt(tagWidth),
          height: "18",
          rx: "4",
          "data-ok-chart-tag": "",
        }),
        node(
          "text",
          { x: fmt(x + 6), y: fmt(y + 9), dy: "0.35em", "data-ok-chart-tag-label": "" },
          undefined,
          series.name,
        ),
      );
    }
  }
  return result(width, height, plot, marks, [
    node("g", { "data-ok-chart-series-group": "" }, nodes),
    ...(labels.length ? [node("g", { "data-ok-chart-data-labels": "" }, labels)] : []),
    ...(tags.length ? [node("g", { "data-ok-chart-tags": "" }, tags)] : []),
    node("g", { "data-ok-chart-active": "" }, []),
  ]);
}
