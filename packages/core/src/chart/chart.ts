import {
  type ChartAnnotation,
  chartAnnotationNodes,
  chartAnnotations,
} from "./chart-annotations.js";
import { type ChartYAxis, chartYAxes, withChartAxes } from "./chart-axes.js";
import { layoutHeatmap, layoutTreemap } from "./chart-cells.js";
import {
  type ChartDiscreteMarker,
  chartDiscreteMarkers,
  chartPatternAt,
  withChartCues,
} from "./chart-cues.js";
import {
  type ChartCrossfilter,
  chartFilter,
  chartFilterHidden,
  chartFilterNodes,
  filterChartData,
} from "./chart-filter.js";
import { type ChartFormat, type ChartFormatOptions, chartFormat } from "./chart-format.js";
import {
  type ChartDirection,
  type ChartEdgeStyle,
  type ChartHierarchyNode,
  type ChartLayoutType,
  type ChartLeaf,
  type ChartZoomType,
  chartHierarchy,
  chartHierarchyTable,
  isHierarchyChart,
} from "./chart-hierarchy.js";
import { layoutIcicle } from "./chart-icicle.js";
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
  type ChartDataLabelPosition,
  type ChartFill,
  type ChartGrid,
  type ChartLegend,
  type ChartMarkerShape,
  type ChartPattern,
  type ChartSeries,
  type ChartStackType,
  type ChartStripeColor,
  type ChartTableModel,
  type ChartTooltipMode,
  type ChartType,
  type ChartXType,
  chartData,
  chartDefaultColors,
  chartTable,
  isCircularChart,
  isWholeChart,
} from "./chart-model.js";
import { layoutSunburst } from "./chart-partition.js";
import { layoutCircular, layoutRadar } from "./chart-polar.js";
import {
  type ChartOrientation,
  type ChartSankeyEdge,
  type ChartSankeyNode,
  chartSankeyGraph,
  chartSankeyTable,
  layoutSankey,
} from "./chart-sankey.js";
import { type ChartDataPoint, chartSelectedNodes, chartSelection } from "./chart-select.js";
import { layoutFunnel, layoutSlope } from "./chart-shapes.js";
import { layoutStock } from "./chart-stock.js";
import { layoutTree } from "./chart-tree.js";
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
  /** Hierarchy charts (ADR-0058): nested nodes (one root, or several). */
  readonly hierarchy?: ChartHierarchyNode | readonly ChartHierarchyNode[] | undefined;
  /** Tree and icicle charts: where the root sits (`radial`: trees around the center). Default `"top"`. */
  readonly direction?: ChartDirection | undefined;
  /** Tree charts: `tree` (tidy, default) or `cluster` (a dendrogram: leaves on one level). */
  readonly layoutType?: ChartLayoutType | undefined;
  /** Tree charts: links `orthogonal` (default), `curved` or `straight`. */
  readonly edgeStyle?: ChartEdgeStyle | undefined;
  /** Tree charts: Enter and clicks expand and collapse nodes. */
  readonly enableExpandCollapse?: boolean | undefined;
  /** Tree charts: ids of the nodes whose children are hidden. */
  readonly collapsedNodes?: readonly string[] | undefined;
  /** Sunburst and icicle charts: the node zoomed into (an id; `null`: none). */
  readonly drillNode?: string | null | undefined;
  /** Sunburst and icicle charts: clicks, Enter and Space don't zoom into nodes. */
  readonly disableZoomOnClick?: boolean | undefined;
  /** Sunburst charts: the hole in % of the radius. Default 15. */
  readonly innerSize?: number | undefined;
  /** Sunburst and icicle charts: the gap between arcs or cells in px. Default 1. */
  readonly spacing?: number | undefined;
  /** Sunburst and icicle charts: shallow branches `extend` to the edge or `stop` (default `extend` on sunbursts, `stop` on icicles). */
  readonly leaf?: ChartLeaf | undefined;
  /** Sunburst and icicle charts: how much paler each level gets (0 to 1). Default 0.14. */
  readonly tint?: number | undefined;
  /** Icicle charts: a zoomed branch keeps its ancestors (`value`, default) or is the top (`both`). */
  readonly zoomType?: ChartZoomType | undefined;
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
  /** Stacks (4.18.61): `100%` draws each category's stacked values as shares of their sum. */
  readonly stackType?: ChartStackType | undefined;
  /** Stacks only the bar series of a mixed chart. */
  readonly stackOnlyBar?: boolean | undefined;
  /** Stacked bars: each stack's total past its end. */
  readonly stackTotals?: boolean | undefined;
  /** Bars: where data labels sit (`center`, `top`: by the value end, `bottom`: by the base). */
  readonly dataLabelPosition?: ChartDataLabelPosition | undefined;
  /** Bars: a grey track behind each bar (or `backgroundBarColors`). */
  readonly backgroundBars?: boolean | undefined;
  /** Bars: track colors, one per category in turn. */
  readonly backgroundBarColors?: readonly ChartColor[] | undefined;
  /** Bars: track opacity (0 to 1). */
  readonly backgroundBarOpacity?: number | undefined;
  /** Bars: track corner radius in px. Default 4. */
  readonly backgroundBarRadius?: number | undefined;
  /** Marker shape of every series (4.18.62; series may set their own). */
  readonly markerShape?: ChartMarkerShape | undefined;
  /** Pattern of every series or slice (turns patterns on, like `fill: "pattern"`). */
  readonly fillPattern?: ChartPattern | undefined;
  /** Line width of every series in px. */
  readonly strokeWidth?: number | undefined;
  /** A distinct marker shape, pattern and dash per series (non-color cues, WCAG 1.4.1). */
  readonly colorBlindMode?: boolean | undefined;
  /** Markers on single points (ApexCharts `markers.discrete`). */
  readonly discreteMarkers?: readonly ChartDiscreteMarker[] | undefined;
  /** Tooltips (4.18.63): `point` gives index charts one tooltip per point (block or nearest point). */
  readonly tooltip?: ChartTooltipMode | undefined;
  /** Legend (4.18.64): shown for a single series too. */
  readonly showForSingleSeries?: boolean | undefined;
  /** Legend: these names instead of the series' (item n stands for series n and its color). */
  readonly customLegendItems?: readonly string[] | undefined;
  /** Grid lines (4.18.64): `y` (default), `x`, `both` or `none`. */
  readonly grid?: ChartGrid | undefined;
  /** Stripes between the horizontal / vertical grid positions, colors in turn. */
  readonly gridRowColors?: readonly ChartStripeColor[] | undefined;
  readonly gridColumnColors?: readonly ChartStripeColor[] | undefined;
  /** Stripe opacity (0 to 1). Default 0.5. */
  readonly gridRowOpacity?: number | undefined;
  readonly gridColumnOpacity?: number | undefined;
  readonly horizontal?: boolean | undefined;
  readonly markerSize?: number | undefined;
  readonly columnWidth?: number | undefined;
  readonly barHeight?: number | undefined;
  readonly yMin?: number | undefined;
  readonly yMax?: number | undefined;
  readonly yTitle?: string | undefined;
  /**
   * Value axes (ApexCharts `yaxis`): one object for the value axis, or a list (several axes on
   * vertical charts with an x axis; series pick theirs by `seriesName` or position).
   */
  readonly yaxis?: ChartYAxis | readonly ChartYAxis[] | undefined;
  /** The x axis title, drawn under the labels (and the data table's first header by default). */
  readonly xTitle?: string | undefined;
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
  /** Waterfall charts (4.18.21): rising and falling steps (default `success` and `error`). */
  readonly waterfallPositiveColor?: ChartColor | undefined;
  readonly waterfallNegativeColor?: ChartColor | undefined;
  /** Waterfall charts: total bars (default the series color) and subtotals (default the total's). */
  readonly waterfallTotalColor?: ChartColor | undefined;
  readonly waterfallSubtotalColor?: ChartColor | undefined;
  /** Waterfall charts: no connectors between the bars. */
  readonly hideConnectors?: boolean | undefined;
  /** Dumbbell charts: start and end marker colors per series (`[[start, end], …]`). */
  readonly dumbbellColors?: readonly (readonly ChartColor[])[] | undefined;
  /** Heatmaps, treemaps and bars: values in a range take its color. */
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
  /** Selected data points (4.18.60): drawn with an outline (`g[data-ok-chart-selected]`). */
  readonly selectedDataPoints?: readonly ChartDataPoint[] | undefined;
  /** Crossfilter (4.18.19, ADR-0054): how the group's `filter` is drawn. */
  readonly crossfilter?: ChartCrossfilter | undefined;
  /** Crossfilter: the categories another chart of the group filters (`null`: none). */
  readonly filter?: readonly number[] | null | undefined;
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
  /** Non-color cues (4.18.62): the series' marker shape or pattern, shown on its marker. */
  readonly shape?: ChartMarkerShape | undefined;
  readonly pattern?: ChartPattern | undefined;
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
  if (isHierarchyChart(input.type)) return renderHierarchy(input);
  const axes = chartYAxes(input.yaxis);
  // Several value axes (4.18.59): every series gets its axis (written on its table column).
  const plain = withChartAxes(chartData({ ...input, series: input.series ?? [] }), axes);
  // Stock charts (ADR-0047): indicators become generated series; panes share one x axis.
  const stock =
    (input.indicators?.length || input.navigator) &&
    plain.xType !== "numeric" &&
    !input.horizontal &&
    !input.sparkline &&
    !isWholeChart(plain.type) &&
    plain.type !== "scatter" &&
    plain.type !== "bubble";
  const priceAxis = plain.series[0]?.axis;
  const cued = stock ? plain : withChartCues(plain, input);
  const data: ChartData = stock
    ? {
        ...plain,
        series: [
          ...plain.series,
          // Overlays of the price are drawn on the price's axis.
          ...chartIndicatorSeries(plain, input.indicators ?? []).map((series) =>
            priceAxis !== undefined && !series.pane ? { ...series, axis: priceAxis } : series,
          ),
        ],
      }
    : cued;
  // Radial bars show percentages unless told otherwise.
  const format = chartFormat(data, {
    ...input,
    valueSuffix: input.valueSuffix ?? (data.type === "radialBar" ? "%" : undefined),
  });
  const hidden = new Set(input.hidden ?? []);
  const circular = isCircularChart(data.type);
  /** Pie, donut and polar area slices: their pattern (4.18.62; rings have none). */
  const slicePattern = (x: number) =>
    circular && data.type !== "radialBar" ? chartPatternAt(input, x) : undefined;
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
  // Crossfilter (ADR-0054): `filter` draws only the filtered categories' values (circular charts
  // hide the other slices); the legend, the table and the axes keep the whole data.
  const filter = input.crossfilter ? chartFilter(input.filter) : null;
  const filtering = filter !== null && input.crossfilter === "filter";
  const drawn = filtering && !circular ? filterChartData(data, filter) : data;
  const drawnHidden =
    filtering && circular
      ? [...new Set([...hidden, ...chartFilterHidden(data, filter)])]
      : [...hidden];
  const extent = chartZoomExtent(data);
  const kind = data.xType === "numeric" ? "value" : "index";
  // A zoom set on an older x axis (live data) follows it: at the end, it keeps to the end.
  const zoom =
    input.zoomFrom !== undefined
      ? followChartZoom(input.zoom ?? null, input.zoomFrom, extent, kind)
      : clampChartZoom(input.zoom, extent, kind);
  const base = layoutOf(drawn, {
    width: input.width,
    height: input.height,
    format,
    idPrefix: input.idPrefix,
    curve: input.curve,
    fill: input.fill,
    stacked: input.stacked,
    stackType: input.stackType,
    stackOnlyBar: input.stackOnlyBar,
    stackTotals: input.stackTotals,
    dataLabelPosition: input.dataLabelPosition,
    backgroundBars: input.backgroundBars,
    backgroundBarColors: input.backgroundBarColors,
    backgroundBarOpacity: input.backgroundBarOpacity,
    backgroundBarRadius: input.backgroundBarRadius,
    horizontal: input.horizontal,
    markerSize: input.markerSize,
    columnWidth: input.columnWidth,
    barHeight: input.barHeight,
    yMin: input.yMin,
    yMax: input.yMax,
    yTitle: input.yTitle,
    yAxes: axes,
    xTitle: input.xTitle,
    hidden: drawnHidden,
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
    waterfallPositiveColor: input.waterfallPositiveColor,
    waterfallNegativeColor: input.waterfallNegativeColor,
    waterfallTotalColor: input.waterfallTotalColor,
    waterfallSubtotalColor: input.waterfallSubtotalColor,
    hideConnectors: input.hideConnectors,
    dumbbellColors: input.dumbbellColors,
    colorRanges: input.colorRanges,
    discreteMarkers: chartDiscreteMarkers(input.discreteMarkers),
    grid: input.grid,
    gridRowColors: input.gridRowColors,
    gridColumnColors: input.gridColumnColors,
    gridRowOpacity: input.gridRowOpacity,
    gridColumnOpacity: input.gridColumnOpacity,
    cueMarkers: input.colorBlindMode,
    strokeWidth: input.strokeWidth,
    slicePatterns: circular
      ? (data.series[0]?.points ?? []).map((point) => slicePattern(point.x))
      : undefined,
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
  // Highlight filters (ADR-0054): tints behind the filtered categories, under the series.
  const tints = input.crossfilter === "highlight" ? chartFilterNodes(base, filter) : [];
  if (tints.length) {
    const at = before("data-ok-chart-crosshair");
    nodes.splice(at < 0 ? before("data-ok-chart-series-group") : at, 0, ...tints);
  }
  // Selected points (4.18.60): outlines over the series, under the hover highlight.
  const marked = chartSelectedNodes(base, chartSelection(input.selectedDataPoints));
  if (marked.length) nodes.splice(before("data-ok-chart-active"), 0, ...marked);
  // Per-point tooltips (4.18.63): index charts (not radars) point at one mark at a time.
  const perPoint = input.tooltip === "point" && base.mode === "index" && !base.polar;
  const layout: ChartLayout = { ...base, nodes, ...(perPoint ? { mode: "point" as const } : {}) };
  // Circular charts list their categories (slices, rings); the others their series.
  const items: ChartLegendItem[] = circular
    ? (data.series[0]?.points ?? []).map((point) => ({
        index: point.x,
        name: format.title(data.categories[point.x] ?? String(point.x + 1)),
        // `chartData` colors every point of a circular chart.
        color: point.color as ChartColor,
        hidden: hidden.has(point.x),
        ...(input.legendValues && point.y !== null ? { value: format.value(point.y, 0) } : {}),
        ...(slicePattern(point.x) ? { pattern: slicePattern(point.x) } : {}),
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
          ...(series.shape ? { shape: series.shape } : {}),
          ...(series.pattern ? { pattern: series.pattern } : {}),
        };
      });
  // Custom items (4.18.64): their names, each standing for the series (or slice) at its position.
  const custom = input.customLegendItems?.length
    ? input.customLegendItems.slice(0, 100).map(
        (name, index): ChartLegendItem =>
          items[index]
            ? { ...items[index], name: String(name) }
            : {
                index,
                name: String(name),
                color: chartDefaultColors[index % chartDefaultColors.length] as ChartColor,
                hidden: hidden.has(index),
              },
      )
    : items;
  const legend =
    input.legend === "none" ||
    input.sparkline ||
    custom.length < (input.showForSingleSeries ? 1 : 2)
      ? null
      : custom;
  const xLabel =
    input.xLabel ??
    input.xTitle ??
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
      fill: input.fill === "pattern" ? undefined : input.fill,
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

/** Hierarchy charts (ADR-0058): nested nodes instead of series; no legend, no zoom. */
function renderHierarchy(input: ChartRenderInput): ChartRender {
  const data = chartData({ type: input.type, series: [] });
  const format = chartFormat(data, input);
  const hierarchy = chartHierarchy(input);
  const partition = {
    width: input.width,
    height: input.height,
    drill: input.drillNode,
    disableZoomOnClick: input.disableZoomOnClick,
    leaf: input.leaf,
    spacing: input.spacing,
    tint: input.tint,
    dataLabels: input.dataLabels,
  };
  const layout =
    input.type === "sunburst"
      ? layoutSunburst(
          hierarchy,
          {
            ...partition,
            innerSize: input.innerSize,
            startAngle: input.startAngle,
            endAngle: input.endAngle,
          },
          format,
        )
      : input.type === "icicle"
        ? layoutIcicle(
            hierarchy,
            { ...partition, direction: input.direction, zoomType: input.zoomType },
            format,
          )
        : layoutTree(
            hierarchy,
            {
              width: input.width,
              height: input.height,
              direction: input.direction,
              layoutType: input.layoutType,
              edgeStyle: input.edgeStyle,
              markerSize: input.markerSize,
              collapsed: input.collapsedNodes,
              expandCollapse: input.enableExpandCollapse,
              dataLabels: input.dataLabels,
              startAngle: input.startAngle,
              endAngle: input.endAngle,
            },
            format,
          );
  return {
    data,
    format,
    layout,
    legend: null,
    table: chartHierarchyTable(hierarchy, format),
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
