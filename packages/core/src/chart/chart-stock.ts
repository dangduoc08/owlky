import type { ChartFormat } from "./chart-format.js";
import {
  type ChartAxisMap,
  type ChartLayout,
  type ChartLayoutOptions,
  type ChartMark,
  type ChartNode,
  fmt,
  layoutChart,
  node,
  r2,
} from "./chart-layout.js";
import type { ChartData, ChartDataSeries } from "./chart-model.js";
import { chartPxOf, chartSelectionNodes } from "./chart-zoom.js";

/*
 * Stock charts (ADR-0047, phase 2.2): panes on one time axis and a navigator, inside one SVG.
 * Each pane is laid out by `layoutChart` with a common left edge, banded categories and a value
 * scale fitted to the zoom window; only the last pane prints the x labels. Marks keep their
 * global series index and move by their pane's offset, so one tooltip lists every pane.
 */

/** Height of the navigator's plot in px (under the panes, after the x labels). */
export const NAVIGATOR_HEIGHT = 48;
const NAVIGATOR_GAP = 12;
/** Space between two panes in px (a divider line runs through its middle). */
const PANE_GAP = 10;

export interface ChartStockOptions extends ChartLayoutOptions {
  /** Height of each indicator pane in px. Default 120. */
  readonly paneHeight?: number | undefined;
  /** A navigator under the panes: the whole price line with the zoom as a brush. */
  readonly navigator?: boolean | undefined;
}

/** Group nodes the panes share once (crosshair, hover and labels live at the top level). */
const SHARED = ["data-ok-chart-crosshair", "data-ok-chart-active"];

const shifted = (nodes: readonly ChartNode[], y: number, attrs: Record<string, string>) =>
  node(
    "g",
    { ...attrs, ...(y ? { transform: `translate(0 ${fmt(y)})` } : {}) },
    nodes.filter((item) => !SHARED.some((name) => item.attrs[name] !== undefined)) as ChartNode[],
  );

/** Series nodes carry their global index (legend, animations), not their index in the pane. */
function renumber(nodes: readonly ChartNode[], global: readonly number[]): ChartNode[] {
  return nodes.map((item) => {
    const index = item.attrs["data-ok-index"];
    const attrs =
      item.attrs["data-ok-chart-series"] !== undefined && index !== undefined
        ? { ...item.attrs, "data-ok-index": String(global[Number(index)] ?? index) }
        : item.attrs;
    return {
      ...item,
      attrs,
      ...(item.children ? { children: renumber(item.children, global) } : {}),
    };
  });
}

/** Lays out the panes (pane 0: the price and its overlays) and the navigator. */
export function layoutStock(
  data: ChartData,
  options: ChartStockOptions,
  format: ChartFormat,
): ChartLayout {
  const width = Math.max(40, Math.round(options.width));
  const hidden = new Set(options.hidden ?? []);
  const paneOf = (series: ChartDataSeries) => series.pane ?? 0;
  const numbers = [...new Set(data.series.map(paneOf))].sort((a, b) => a - b);
  if (!numbers.includes(0)) numbers.unshift(0);
  const panes = numbers.map((pane) => {
    const global = data.series.flatMap((series, index) => (paneOf(series) === pane ? [index] : []));
    const series = global.map((index) => data.series[index] as ChartDataSeries);
    const first = series[0];
    return {
      pane,
      global,
      data: { ...data, type: pane === 0 ? data.type : "line", series } as ChartData,
      hidden: global.flatMap((index, local) => (hidden.has(index) ? [local] : [])),
      scale: pane === 0 ? undefined : first?.scale,
      guides: pane === 0 ? [] : (first?.guides ?? []),
      volume: first?.indicator === "volume",
      // The pane's lines name it (MACD and its signal, not the histogram); a lone series names it.
      title:
        pane === 0
          ? ""
          : series
              .filter((s) => s.type === "line" || series.length === 1)
              .map((s) => s.name)
              .join(" · "),
    };
  });
  const paneHeight = Math.max(60, Math.round(options.paneHeight ?? 120));
  const mainHeight = Math.max(80, Math.round(options.height));
  const last = panes.length - 1;
  // Volumes: compact ticks ("1.2M"), the axis stays narrow.
  const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
  const lay = (index: number, plotLeft?: number, plotRight?: number) => {
    const pane = panes[index] as (typeof panes)[number];
    const height = index === 0 ? mainHeight : paneHeight;
    const paneFormat: ChartFormat =
      pane.pane === 0
        ? format
        : {
            ...format,
            tick: (value) => (pane.volume ? compact.format(value) : format.number(value)),
          };
    return layoutChart(pane.data, {
      ...options,
      width,
      height,
      format: paneFormat,
      idPrefix: `${options.idPrefix}-p${pane.pane}`,
      hidden: pane.hidden,
      banded: true,
      fitZoom: true,
      xLabels: index === last,
      yMin: pane.scale?.min ?? (pane.pane === 0 ? options.yMin : undefined),
      yMax: pane.scale?.max ?? (pane.pane === 0 ? options.yMax : undefined),
      yTitle: pane.pane === 0 ? options.yTitle : undefined,
      // Several value axes (4.18.59) belong to the price pane; the x title to the last pane.
      yAxes: pane.pane === 0 ? options.yAxes : undefined,
      xTitle: index === last ? options.xTitle : undefined,
      dataLabels: pane.pane === 0 ? options.dataLabels : false,
      // The price scale fits the prices; oscillators keep their zero.
      ...(pane.pane === 0 ? { zeroBased: false } : {}),
      ...(plotLeft !== undefined ? { plotLeft } : {}),
      ...(plotRight !== undefined ? { plotRight } : {}),
    });
  };
  // Two passes: measure every pane's value labels, then lay them out on the widest edges (the
  // right one holds `opposite` axes of the price pane).
  const measured = panes.map((_, i) => lay(i));
  const left = Math.max(...measured.map((layout) => layout.plot.x));
  const right = Math.max(
    ...measured.map((layout) => layout.width - layout.plot.x - layout.plot.width),
  );
  const layouts = panes.map((_, i) => lay(i, left, right));
  const main = layouts[0] as ChartLayout;

  const nodes: ChartNode[] = [];
  const marks: ChartMark[] = [];
  const labels: ChartNode[] = [];
  let top = 0;
  layouts.forEach((layout, i) => {
    const pane = panes[i] as (typeof panes)[number];
    const children = renumber(layout.nodes, pane.global);
    const extra: ChartNode[] = [];
    if (pane.pane > 0) {
      top += PANE_GAP;
      const mid = fmt(top - PANE_GAP / 2);
      nodes.push(
        node("line", {
          x1: fmt(layout.plot.x),
          x2: fmt(layout.plot.x + layout.plot.width),
          y1: mid,
          y2: mid,
          "data-ok-chart-pane-divider": "",
        }),
      );
      // Reference lines (RSI 30 / 70) and the pane's title, top left inside its plot.
      const y = layout.y as ChartAxisMap;
      for (const value of pane.guides) {
        if (value < y.min || value > y.max) continue;
        const py = fmt(chartPxOf(y, value));
        extra.push(
          node("line", {
            x1: fmt(layout.plot.x),
            x2: fmt(layout.plot.x + layout.plot.width),
            y1: py,
            y2: py,
            "data-ok-chart-guide": "",
          }),
        );
      }
      labels.push(
        node(
          "text",
          {
            x: fmt(layout.plot.x + 6),
            y: fmt(top + layout.plot.y + 4),
            dy: "0.71em",
            "data-ok-chart-pane-title": "",
          },
          undefined,
          pane.title,
        ),
      );
    }
    nodes.push(shifted([...extra, ...children], top, { "data-ok-chart-pane": String(pane.pane) }));
    for (const mark of layout.marks)
      marks.push({
        ...mark,
        series: pane.global[mark.series] ?? mark.series,
        py: r2(mark.py + top),
        ...(mark.box ? { box: { ...mark.box, y: r2(mark.box.y + top) } } : {}),
      });
    top += layout.height;
  });
  const lastLayout = layouts[last] as ChartLayout;
  const plotBottom = top - lastLayout.height + lastLayout.plot.y + lastLayout.plot.height;
  let height = top;

  // The navigator: the price's closing line over the whole axis, the zoom as a brush on it.
  let navigator: ChartLayout["navigator"];
  const price = data.series[0];
  const count = Math.max(data.categories.length, ...data.series.map((s) => s.points.length), 0);
  if (options.navigator && price && count > 1) {
    const navTop = top + NAVIGATOR_GAP;
    const line: ChartDataSeries = {
      name: price.name,
      type: "line",
      color: price.type === "candlestick" ? "primary" : price.color,
      points: price.points.map((point) => ({ x: point.x, y: point.y })),
    };
    const nav = layoutChart(
      { ...data, type: "line", series: [line] },
      {
        width: main.plot.width + 6,
        height: NAVIGATOR_HEIGHT,
        format,
        idPrefix: `${options.idPrefix}-nav`,
        fill: "solid",
        sparkline: true,
        banded: true,
      },
    );
    const plot = {
      x: r2(main.plot.x),
      y: r2(navTop),
      width: main.plot.width,
      height: NAVIGATOR_HEIGHT,
    };
    const band = plot.width / count;
    const map: ChartAxisMap = {
      kind: "index",
      min: 0,
      max: count - 1,
      from: r2(plot.x + band / 2),
      to: r2(plot.x + plot.width - band / 2),
      band: r2(band),
    };
    navigator = { x: map, plot };
    const range = options.zoom ?? { min: 0, max: count - 1 };
    const brush = chartSelectionNodes({ ...main, x: map, plot }, range, true);
    nodes.push(
      node("g", { "data-ok-chart-navigator": "" }, [
        node("rect", {
          x: fmt(plot.x),
          y: fmt(plot.y),
          width: fmt(plot.width),
          height: fmt(plot.height),
          rx: "4",
          "data-ok-chart-navigator-frame": "",
        }),
        shifted(nav.nodes, 0, { transform: `translate(${fmt(plot.x - 3)} ${fmt(navTop)})` }),
        ...brush,
      ]),
    );
    height = navTop + NAVIGATOR_HEIGHT + 2;
  }

  return {
    ...main,
    width,
    height: Math.round(height),
    plot: { ...main.plot, height: r2(plotBottom - main.plot.y) },
    mode: "index",
    banded: true,
    marks,
    activeRadius: 5,
    nodes: [
      // The crosshair (a band behind the candles) runs through every pane.
      node("g", { "data-ok-chart-crosshair": "" }, []),
      ...nodes,
      node("g", { "data-ok-chart-active": "" }, []),
      ...(labels.length ? [node("g", { "data-ok-chart-pane-titles": "" }, labels)] : []),
    ],
    ...(navigator ? { navigator } : {}),
  };
}
