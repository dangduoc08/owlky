import {
  type ChartAnnotation,
  chartAnnotationNodes,
  chartAnnotations,
} from "./chart-annotations.js";
import { layoutHeatmap, layoutTreemap } from "./chart-cells.js";
import { type ChartFormat, type ChartFormatOptions, chartFormat } from "./chart-format.js";
import { type ChartIndicator, chartIndicatorSeries } from "./chart-indicators.js";
import {
  type ChartColorRange,
  type ChartLayout,
  type ChartNode,
  chartTextWidth,
  fmt,
  layoutChart,
  node,
} from "./chart-layout.js";
import {
  type ChartColor,
  type ChartCurve,
  type ChartData,
  type ChartFill,
  type ChartLegend,
  type ChartSeries,
  type ChartTableModel,
  type ChartType,
  type ChartXType,
  chartData,
  chartTable,
  isCircularChart,
  isWholeChart,
} from "./chart-model.js";
import { layoutCircular, layoutRadar } from "./chart-polar.js";
import {
  type ChartOrientation,
  type ChartSankeyEdge,
  type ChartSankeyNode,
  chartSankeyGraph,
  chartSankeyTable,
  layoutSankey,
} from "./chart-sankey.js";
import { layoutFunnel, layoutSlope } from "./chart-shapes.js";
import { layoutStock } from "./chart-stock.js";
import {
  type ChartZoom,
  chartSelectionNodes,
  chartZoomExtent,
  clampChartZoom,
  followChartZoom,
} from "./chart-zoom.js";

/** Everything a chart is drawn from (React props or the HTML root's attributes and table). */
export interface ChartRenderInput extends ChartFormatOptions {
  readonly type?: ChartType | undefined;
  readonly xType?: ChartXType | undefined;
  /** Every type but `sankey`. */
  readonly series?: readonly ChartSeries[] | undefined;
  /** Sankey charts (ADR-0047): nodes (optional: titles and colors) and the links between them. */
  readonly nodes?: readonly ChartSankeyNode[] | undefined;
  readonly edges?: readonly ChartSankeyEdge[] | undefined;
  /** Sankey charts: flow direction. Default `"horizontal"`. */
  readonly orientation?: ChartOrientation | undefined;
  /** Sankey charts: node thickness along the flow in px. Default 20. */
  readonly nodeWidth?: number | undefined;
  /** Sankey charts: share of the fullest rank left between its nodes (0 to 0.9). Default 0.18. */
  readonly whitespace?: number | undefined;
  /** Sankey charts: link opacity (0 to 1). Default 0.4. */
  readonly edgeOpacity?: number | undefined;
  /** Sankey charts: a title above each rank. */
  readonly axisTitles?: readonly string[] | undefined;
  /** Stock charts (ADR-0047): indicators of the first series (overlays and panes). */
  readonly indicators?: readonly ChartIndicator[] | undefined;
  /** Stock charts: a navigator under the panes (the whole axis, the zoom as a brush). */
  readonly navigator?: boolean | undefined;
  /** Stock charts: height of each indicator pane in px. Default 120. */
  readonly paneHeight?: number | undefined;
  readonly categories?: readonly (string | number | Date)[] | undefined;
  readonly colors?: readonly ChartColor[] | undefined;
  readonly curve?: ChartCurve | undefined;
  readonly fill?: ChartFill | undefined;
  readonly stacked?: boolean | undefined;
  readonly horizontal?: boolean | undefined;
  readonly markerSize?: number | undefined;
  readonly columnWidth?: number | undefined;
  readonly barHeight?: number | undefined;
  readonly yMin?: number | undefined;
  readonly yMax?: number | undefined;
  readonly yTitle?: string | undefined;
  readonly legend?: ChartLegend | undefined;
  readonly dataLabels?: boolean | undefined;
  readonly startAngle?: number | undefined;
  readonly endAngle?: number | undefined;
  readonly dashArray?: number | undefined;
  readonly trackWidth?: number | undefined;
  readonly total?: number | undefined;
  readonly totalLabel?: string | undefined;
  /** No axes, grid or legend: the plot fills the SVG (cards, table cells). */
  readonly sparkline?: boolean | undefined;
  /** Box plots: colors of the boxes above and below the median. */
  readonly boxUpperColor?: ChartColor | undefined;
  readonly boxLowerColor?: ChartColor | undefined;
  /** Candlesticks: rising and falling candles (default `success` and `error`). */
  readonly candleUpColor?: ChartColor | undefined;
  readonly candleDownColor?: ChartColor | undefined;
  /** Donut hole in % of the radius. Default 72. */
  readonly donutSize?: number | undefined;
  /** Heatmaps and treemaps: values in a range take its color. */
  readonly colorRanges?: readonly ChartColorRange[] | undefined;
  /** Outside data labels sit on a badge (a paper box with a border). */
  readonly dataLabelBackground?: boolean | undefined;
  /** Legend items show a value: the slice's or ring's, or the series' last one. */
  readonly legendValues?: boolean | undefined;
  /** Lines, bands and points with a label (vertical charts with an x axis). */
  readonly annotations?: readonly ChartAnnotation[] | undefined;
  /** The visible window of the x axis (`null`: all of it). Invalid ranges are clamped. */
  readonly zoom?: ChartZoom | null | undefined;
  /** The x axis (`extent`) when `zoom` was set: a zoom that ended at its end follows new data. */
  readonly zoomFrom?: ChartZoom | null | undefined;
  /** A range shaded over the plot: a drag being zoomed, or a brush chart's selection. */
  readonly selection?: ChartZoom | null | undefined;
  /** A brush chart: the selection (all of the axis when `null`) has handles. */
  readonly brush?: boolean | undefined;
  /** Header of the data table's first column. Default "Category", "Date" or "X". */
  readonly xLabel?: string | undefined;
  /** Indexes of the series hidden through the legend (categories for circular charts). */
  readonly hidden?: readonly number[] | undefined;
  /** SVG size in px. */
  readonly width: number;
  readonly height: number;
  /** Unique per chart (gradient ids). */
  readonly idPrefix: string;
}

export interface ChartLegendItem {
  readonly index: number;
  readonly name: string;
  readonly color: ChartColor;
  readonly hidden: boolean;
  /** `legendValues`: the item's value as text. */
  readonly value?: string | undefined;
}

export interface ChartRender {
  readonly data: ChartData;
  readonly format: ChartFormat;
  readonly layout: ChartLayout;
  /** Legend items, or `null` when no legend is shown (`none`, or a single series). */
  readonly legend: readonly ChartLegendItem[] | null;
  readonly table: ChartTableModel;
  /** The whole x axis (`null`: no x axis to zoom). */
  readonly extent: ChartZoom | null;
  /** The zoom drawn (clamped), or `null`. */
  readonly zoom: ChartZoom | null;
  /** The chart has an x axis that zooms (vertical charts drawn by `layoutChart`). */
  readonly zoomable: boolean;
}

/** Default SVG width before the chart is measured (server render, first paint). */
export const CHART_DEFAULT_WIDTH = 640;

/** A gradient id prefix from any string (React `useId`, an element id): letters, digits, `-`. */
export const chartIdPrefix = (raw: string): string =>
  `ok-chart-${raw.replace(/[^A-Za-z0-9_-]/g, "")}`;

/** Data, formatters, layout, legend and table for one render. */
export function renderChart(input: ChartRenderInput): ChartRender {
  if (input.type === "sankey") return renderSankey(input);
  const plain = chartData({ ...input, series: input.series ?? [] });
  // Stock charts (ADR-0047): indicators become generated series; panes share one x axis.
  const stock =
    (input.indicators?.length || input.navigator) &&
    plain.xType !== "numeric" &&
    !input.horizontal &&
    !input.sparkline &&
    !isWholeChart(plain.type) &&
    plain.type !== "scatter" &&
    plain.type !== "bubble";
  const data: ChartData = stock
    ? {
        ...plain,
        series: [...plain.series, ...chartIndicatorSeries(plain, input.indicators ?? [])],
      }
    : plain;
  // Radial bars show percentages unless told otherwise.
  const format = chartFormat(data, {
    ...input,
    valueSuffix: input.valueSuffix ?? (data.type === "radialBar" ? "%" : undefined),
  });
  const hidden = new Set(input.hidden ?? []);
  const circular = isCircularChart(data.type);
  type Layout = (d: ChartData, o: Parameters<typeof layoutChart>[1]) => ChartLayout;
  const layouts: Partial<Record<ChartType, Layout>> = {
    radar: (d, o) => layoutRadar(d, o, format),
    heatmap: (d, o) => layoutHeatmap(d, o, format),
    treemap: (d, o) => layoutTreemap(d, o, format),
    funnel: (d, o) => layoutFunnel(d, o, format),
    slope: (d, o) => layoutSlope(d, o, format),
  };
  const layoutOf: Layout = stock
    ? (d, o) =>
        layoutStock(d, { ...o, paneHeight: input.paneHeight, navigator: input.navigator }, format)
    : (layouts[data.type] ?? (circular ? (d, o) => layoutCircular(d, o, format) : layoutChart));
  const extent = chartZoomExtent(data);
  const kind = data.xType === "numeric" ? "value" : "index";
  // A zoom set on an older x axis (live data) follows it: at the end, it keeps to the end.
  const zoom =
    input.zoomFrom !== undefined
      ? followChartZoom(input.zoom ?? null, input.zoomFrom, extent, kind)
      : clampChartZoom(input.zoom, extent, kind);
  const base = layoutOf(data, {
    width: input.width,
    height: input.height,
    format,
    idPrefix: input.idPrefix,
    curve: input.curve,
    fill: input.fill,
    stacked: input.stacked,
    horizontal: input.horizontal,
    markerSize: input.markerSize,
    columnWidth: input.columnWidth,
    barHeight: input.barHeight,
    yMin: input.yMin,
    yMax: input.yMax,
    yTitle: input.yTitle,
    hidden: [...hidden],
    dataLabels: input.dataLabels,
    startAngle: input.startAngle,
    endAngle: input.endAngle,
    dashArray: input.dashArray,
    trackWidth: input.trackWidth,
    total: input.total,
    totalLabel: input.totalLabel,
    sparkline: input.sparkline,
    boxUpperColor: input.boxUpperColor,
    boxLowerColor: input.boxLowerColor,
    candleUpColor: input.candleUpColor,
    candleDownColor: input.candleDownColor,
    donutSize: input.donutSize,
    colorRanges: input.colorRanges,
    zoom,
  });
  const zoomable = base.x !== undefined && extent !== null && !input.sparkline;
  // Phase 4 overlays: annotations over the series, then a selection (brush or drag), badges.
  let nodes: ChartNode[] = [...base.nodes];
  const annotations = chartAnnotationNodes(data, base, chartAnnotations(input.annotations));
  const selected = input.brush
    ? (clampChartZoom(input.selection, extent, kind) ?? extent)
    : input.selection
      ? clampChartZoom(input.selection, extent, kind)
      : null;
  const selection =
    selected && base.x ? chartSelectionNodes(base, selected, input.brush === true) : [];
  if (input.dataLabelBackground)
    nodes = nodes.map((item) =>
      item.attrs["data-ok-chart-data-labels"] !== undefined ? badges(item) : item,
    );
  const before = (name: string) => nodes.findIndex((item) => item.attrs[name] !== undefined);
  if (annotations.length) {
    const at = before("data-ok-chart-data-labels");
    nodes.splice(at < 0 ? before("data-ok-chart-active") : at, 0, ...annotations);
  }
  if (selection.length) nodes.splice(before("data-ok-chart-active"), 0, ...selection);
  const layout: ChartLayout = { ...base, nodes };
  // Circular charts list their categories (slices, rings); the others their series.
  const items: ChartLegendItem[] = circular
    ? (data.series[0]?.points ?? []).map((point) => ({
        index: point.x,
        name: format.title(data.categories[point.x] ?? String(point.x + 1)),
        // `chartData` colors every point of a circular chart.
        color: point.color as ChartColor,
        hidden: hidden.has(point.x),
        ...(input.legendValues && point.y !== null ? { value: format.value(point.y, 0) } : {}),
      }))
    : data.series.map((series, index) => {
        const last = [...series.points].reverse().find((point) => point.y !== null)?.y;
        return {
          index,
          name: series.name,
          color: series.color,
          hidden: hidden.has(index),
          ...(input.legendValues && typeof last === "number"
            ? { value: format.value(last, index) }
            : {}),
        };
      });
  const legend = input.legend === "none" || input.sparkline || items.length < 2 ? null : items;
  const xLabel =
    input.xLabel ??
    (data.xType === "datetime" ? "Date" : data.xType === "numeric" ? "X" : "Category");
  const table = chartTable(data, {
    xLabel,
    formatX: (x) => format.title(x),
    formatValue: (value, series) => format.value(value, series),
    formatNumber: format.number,
    // Indicator columns carry their indicator, not a type (they are never read back).
    seriesTypes: data.series.some((series) => !series.indicator && series.type !== data.type),
    partLabels: input.partLabels,
  });
  return { data, format, layout, legend, table, extent, zoom: zoomable ? zoom : null, zoomable };
}

/** Sankey charts (ADR-0047): links instead of series; no legend, no zoom. */
function renderSankey(input: ChartRenderInput): ChartRender {
  const data = chartData({ type: "sankey", series: [] });
  const format = chartFormat(data, input);
  const graph = chartSankeyGraph(input);
  const layout = layoutSankey(
    graph,
    {
      width: input.width,
      height: input.height,
      idPrefix: input.idPrefix,
      orientation: input.orientation,
      nodeWidth: input.nodeWidth,
      whitespace: input.whitespace,
      edgeOpacity: input.edgeOpacity,
      fill: input.fill,
      axisTitles: input.axisTitles,
      dataLabels: input.dataLabels,
    },
    format,
  );
  return {
    data,
    format,
    layout,
    legend: null,
    table: chartSankeyTable(graph, format),
    extent: null,
    zoom: null,
    zoomable: false,
  };
}

/** Outside data labels on badges: a rounded box behind each text (`dataLabelBackground`). */
function badges(group: ChartNode): ChartNode {
  const children = (group.children ?? []).flatMap((label): ChartNode[] => {
    if (label.attrs["data-ok-chart-data-label"] !== "outside") return [label];
    const width = chartTextWidth(label.text ?? "") + 10;
    const x = Number(label.attrs["x"]);
    const anchor = label.attrs["text-anchor"];
    const left = anchor === "start" ? x - 5 : anchor === "end" ? x - width + 5 : x - width / 2;
    return [
      node("rect", {
        x: fmt(left),
        y: fmt(Number(label.attrs["y"]) - 10),
        width: fmt(width),
        height: "20",
        rx: "4",
        "data-ok-chart-data-label-badge": "",
      }),
      label,
    ];
  });
  return { ...group, children };
}
