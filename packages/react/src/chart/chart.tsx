"use client";

import {
  CHART_DEFAULT_WIDTH,
  type ChartActive,
  type ChartAnnotation,
  type ChartColor,
  type ChartColorRange,
  type ChartCurve,
  type ChartDataLabelPosition,
  type ChartDataPoint,
  type ChartExportFormat,
  type ChartFill,
  type ChartGestureMode,
  type ChartGestures,
  type ChartIndicator,
  type ChartLegend,
  type ChartLink,
  type ChartLocaleText,
  type ChartNode,
  type ChartOrientation,
  type ChartSankeyEdge,
  type ChartSankeyNode,
  type ChartSelectionDetail,
  type ChartSeries,
  type ChartStackType,
  type ChartTool,
  type ChartType,
  type ChartXType,
  type ChartYAxis,
  type ChartZoom,
  type ChartZoomReason,
  chartActiveAt,
  chartActiveMarks,
  chartActiveNodes,
  chartAnnotationItems,
  chartAttributes,
  chartIdPrefix,
  chartMarkAt,
  chartMarkPoint,
  chartSelection,
  chartTextAttributes,
  chartToolbar,
  chartToolLabels,
  chartTooltip,
  chartZoomKey,
  createChartGestures,
  exportChart,
  hasChartDataPoint,
  linkChart,
  nextChartActive,
  placeChartTooltip,
  renderChart,
  sameChartActive,
  toggleChartSelection,
  zoomChartBy,
} from "@owlky/core";
import {
  type CSSProperties,
  createElement,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useMergedRefs } from "../utils/refs.js";
import { useControllableState } from "../utils/use-controllable-state.js";

export interface ChartProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  /** Accessible name of the chart and the caption of its data table. */
  label: string;
  /**
   * Default `"line"`: `area`, `bar` (columns; rows with `horizontal`), `scatter`, `pie`, `donut`,
   * `radialBar` or `radar`. Pie, donut and radial bar draw the first series, one slice or ring
   * per category.
   */
  type?: ChartType | undefined;
  /**
   * Series: values per category, `[x, y]` pairs (scatter, dates) or `{ x, y, color }`. Every type
   * but `sankey` (which takes `nodes` and `edges`).
   */
  series?: readonly ChartSeries[] | undefined;
  /** Sankey charts: node titles and colors (`{ id, title, color }`); nodes without links aren't drawn. */
  nodes?: readonly ChartSankeyNode[] | undefined;
  /** Sankey charts: the links (`{ source, target, value, color }`, node ids). */
  edges?: readonly ChartSankeyEdge[] | undefined;
  /** Sankey charts: the flow runs left to right (default) or top to bottom. */
  orientation?: ChartOrientation | undefined;
  /** Sankey charts: node thickness along the flow in px. Default 20. */
  nodeWidth?: number | undefined;
  /** Sankey charts: share of the fullest rank left between its nodes (0 to 0.9). Default 0.18. */
  whitespace?: number | undefined;
  /** Sankey charts: link opacity (0 to 1). Default 0.4. */
  edgeOpacity?: number | undefined;
  /** Sankey charts: a title above each rank (beside each row when vertical). */
  axisTitles?: readonly string[] | undefined;
  /**
   * Stock charts: indicators of the first series (the price), such as `{ type: "sma", period: 20 }`.
   * Overlays (`sma`, `ema`, `bollinger`, `vwap`, `donchian`, `keltner`) draw over the price;
   * `volume`, `rsi`, `macd`, `stochastic`, `atr`, `cci` and `pvt` get a pane each.
   */
  indicators?: readonly ChartIndicator[] | undefined;
  /** Stock charts: a navigator under the chart (the whole price line, the zoom as a brush). */
  navigator?: boolean | undefined;
  /** Stock charts: height of each indicator pane in px. Default 120. */
  paneHeight?: number | undefined;
  /** Category labels, or dates when `xType` is `"datetime"`. */
  categories?: readonly (string | number | Date)[] | undefined;
  /** Default `"category"` (`"numeric"` for scatter). */
  xType?: ChartXType | undefined;
  /** Series colors in order (palette names or shades such as `"primary-dark"`). */
  colors?: readonly ChartColor[] | undefined;
  /** Default `"smooth"`. */
  curve?: ChartCurve | undefined;
  /** Default `"top"`. Never shown for a single series. */
  legend?: ChartLegend | undefined;
  /** Area fill. Default `"gradient"`. */
  fill?: ChartFill | undefined;
  /** Stacks the series on each other (bars, lines, areas). */
  stacked?: boolean | undefined;
  /**
   * Stacked charts: `"normal"` (default) stacks the values; `"100%"` stacks each category's values
   * as shares of their total, on a value axis from 0 to 100%. Tooltips keep the values.
   */
  stackType?: ChartStackType | undefined;
  /** Stacked mixed charts: only the bar series stack; lines and areas keep their own values. */
  stackOnlyBar?: boolean | undefined;
  /** Stacked bars: prints the total of each stack past its end. */
  stackTotals?: boolean | undefined;
  /**
   * Bars: where data labels sit inside the bar. Default `"center"`; `"top"` by the value end,
   * `"bottom"` by the base.
   */
  dataLabelPosition?: ChartDataLabelPosition | undefined;
  /** Bars: a grey track the height of the plot behind each bar. */
  backgroundBars?: boolean | undefined;
  /** Bars: track colors (palette names), one per category in turn. Turns the tracks on. */
  backgroundBarColors?: readonly ChartColor[] | undefined;
  /** Bars: opacity of the tracks (0 to 1). Default 1. */
  backgroundBarOpacity?: number | undefined;
  /** Bars: corner radius of the tracks in px. Default 4. */
  backgroundBarRadius?: number | undefined;
  /** Bars run left to right, categories down the side. */
  horizontal?: boolean | undefined;
  /** Plot height in px. Default 320. */
  height?: number | undefined;
  /** Marker radius of line and area points in px (default none; scatter 5). */
  markerSize?: number | undefined;
  /** Column width in % of a category. Default 40. */
  columnWidth?: number | undefined;
  /** Horizontal bar thickness in % of a category. Default 40 (funnels 80). */
  barHeight?: number | undefined;
  /**
   * No axes, grid or legend: the chart fills its container (cards, table cells). Its height is the
   * container's, at least `height` (default 40px).
   */
  sparkline?: boolean | undefined;
  /** Box plots: color of the box above the median (default the series color). */
  boxUpperColor?: ChartColor | undefined;
  /** Box plots: color of the box below the median (default a lighter tone of the series color). */
  boxLowerColor?: ChartColor | undefined;
  yMin?: number | undefined;
  /** Highest value on the value axis; radial bars: the value of a full ring (default 100). */
  yMax?: number | undefined;
  /** Prints the values on the chart (percentages on pie and donut slices). */
  dataLabels?: boolean | undefined;
  /** Pie, donut and radial bar: start angle in degrees, clockwise from 12 o'clock. Default 0. */
  startAngle?: number | undefined;
  /** Pie, donut and radial bar: end angle in degrees. Default 360. */
  endAngle?: number | undefined;
  /** Dash length of lines and radial bars in px (default solid). */
  dashArray?: number | undefined;
  /** Radial bar track thickness in % of the bar. Default 50. */
  trackWidth?: number | undefined;
  /** Donut and radial bar center: the label of the total ("Total"); no total without it. */
  totalLabel?: string | undefined;
  /** Donut and radial bar center: the total (default the sum; radial bars the average). */
  total?: number | undefined;
  /** Title of the value axis. */
  yTitle?: string | undefined;
  /**
   * Value axes, as ApexCharts' `yaxis`: one object for the value axis, or a list for several
   * (vertical charts with an x axis). Each takes `seriesName`, `opposite`, `logarithmic`,
   * `logBase`, `reversed`, `tickAmount`, `min`, `max`, `title` and `show`. Series without a
   * `seriesName` match go to the axis at their position.
   */
  yaxis?: ChartYAxis | readonly ChartYAxis[] | undefined;
  /** Title of the x axis, drawn under its labels (also the data table's first header by default). */
  xTitle?: string | undefined;
  /** Text before every value ("$"). */
  valuePrefix?: string | undefined;
  /** Text after every value ("%"). */
  valueSuffix?: string | undefined;
  /** Replaces the value text in the tooltip, the table and the value axis (`series` -1). */
  valueFormatter?: ((value: number, series: number) => string) | undefined;
  /** Replaces the x text in axis labels, the tooltip title and the table. */
  labelFormatter?: ((x: string | number) => string) | undefined;
  /** Locale of numbers and month names. Default `"en-US"`. */
  locale?: string | undefined;
  /** Header of the data table's first column. */
  xLabel?: string | undefined;
  /** Controlled: indexes of the series (pie, donut, radial bar: categories) hidden through the legend. */
  hiddenSeries?: readonly number[] | undefined;
  /** Uncontrolled initial hidden series. */
  defaultHiddenSeries?: readonly number[] | undefined;
  /** Called with the new hidden series when a legend item is toggled. */
  onHiddenSeriesChange?: ((hidden: number[]) => void) | undefined;
  /** Called when the active category or point changes (pointer, touch or keyboard). */
  onActiveChange?: ((active: ChartActive | null) => void) | undefined;
  /** Candlesticks: color of rising candles. Default `"success"`. */
  candleUpColor?: ChartColor | undefined;
  /** Candlesticks: color of falling candles. Default `"error"`. */
  candleDownColor?: ChartColor | undefined;
  /** Donut hole in % of the radius (10 to 95). Default 72. */
  donutSize?: number | undefined;
  /** Data labels above points sit on a badge. */
  dataLabelBackground?: boolean | undefined;
  /** Replaces the values printed on the chart (pie and donut labels get the percentage). */
  dataLabelFormatter?: ((value: number, series: number, index: number) => string) | undefined;
  /** Legend items show a value: the slice's or ring's, or the series' last one. */
  legendValues?: boolean | undefined;
  /** Heatmaps, treemaps and bars: values in a range take its color (a point's own color wins on bars). */
  colorRanges?: readonly ChartColorRange[] | undefined;
  /** Lines, bands and points with a label (vertical charts with an x axis). */
  annotations?: readonly ChartAnnotation[] | undefined;
  /** Zoom and pan the x axis (mouse, touch, Ctrl + wheel and keys). */
  zoom?: boolean | undefined;
  /** Controlled zoom: the visible window of the x axis (category indexes or x values), or `null`. */
  zoomRange?: ChartZoom | null | undefined;
  /** Uncontrolled initial zoom. */
  defaultZoomRange?: ChartZoom | null | undefined;
  /** Called with the new zoom: the chart's own gestures (`"user"`), its group or a brush. */
  onZoomRangeChange?: ((range: ChartZoom | null, reason: ChartZoomReason) => void) | undefined;
  /** Synchronized charts: charts of one group share the active category and the zoom. */
  group?: string | undefined;
  /** A brush chart: its selection zooms the chart with this `id`. */
  brushTarget?: string | undefined;
  /** A toolbar with zoom buttons (with `zoom`) and downloads (SVG, PNG, CSV). */
  toolbar?: boolean | undefined;
  /** Series grow in when first drawn and move to new values (never with reduced motion). */
  animations?: boolean | undefined;
  /** Localized texts: part labels ("Minimum", "Q1"…), tool names, the export error and `selected`. */
  localeText?: ChartLocaleText | undefined;
  /**
   * Controlled: the selected points (`{ seriesIndex, dataPointIndex }`). A click selects the
   * point, slice or cell under the pointer, Enter or Space the active one.
   */
  selectedDataPoints?: readonly ChartDataPoint[] | undefined;
  /** Uncontrolled initial selection. */
  defaultSelectedDataPoints?: readonly ChartDataPoint[] | undefined;
  /**
   * Called for each point a click, Enter or Space selects or clears, with the point, whether it is
   * selected now and every selected point (ApexCharts' `dataPointSelection`).
   */
  onDataPointSelection?: ((detail: ChartSelectionDetail) => void) | undefined;
  /** Clicks and Enter or Space add points to the selection instead of replacing it. */
  allowMultipleDataPointsSelection?: boolean | undefined;
}

const NO_HIDDEN: readonly number[] = [];
const NO_POINTS: readonly ChartDataPoint[] = [];
const NO_SERIES: readonly ChartSeries[] = [];
/** Least height of a sparkline without `height` (the CSS default of `--_ok-chart-height`). */
const SPARKLINE_HEIGHT = 40;
const PRESERVED = /^(data-|aria-)/;
const camel = (name: string) =>
  PRESERVED.test(name) ? name : name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());

/** Core SVG nodes → React elements (attribute names camelCased: `stroke-opacity` → `strokeOpacity`). */
function toElements(nodes: readonly ChartNode[]): ReactNode[] {
  return nodes.map((node, index) => {
    const props: Record<string, string | number> = { key: index };
    for (const [name, value] of Object.entries(node.attrs)) props[camel(name)] = value;
    return createElement(
      node.tag,
      props,
      node.text ?? (node.children ? toElements(node.children) : undefined),
    );
  });
}

/**
 * Chart — spec: specs/components/chart.md (ADR-0024). An SVG chart drawn by the shared core
 * layout, with a legend that hides series, a tooltip for the pointer, touch and keyboard, and the
 * data as a visually hidden table.
 */
export const Chart = forwardRef<HTMLElement, ChartProps>(function Chart(
  {
    label,
    type,
    series = NO_SERIES,
    nodes: sankeyNodes,
    edges,
    orientation,
    nodeWidth,
    whitespace,
    edgeOpacity,
    axisTitles,
    indicators,
    navigator,
    paneHeight,
    categories,
    xType,
    colors,
    curve,
    legend,
    fill,
    stacked,
    stackType,
    stackOnlyBar,
    stackTotals,
    dataLabelPosition,
    backgroundBars,
    backgroundBarColors,
    backgroundBarOpacity,
    backgroundBarRadius,
    horizontal,
    height,
    markerSize,
    columnWidth,
    barHeight,
    yMin,
    yMax,
    dataLabels,
    startAngle,
    endAngle,
    dashArray,
    trackWidth,
    totalLabel,
    total,
    sparkline,
    boxUpperColor,
    boxLowerColor,
    yTitle,
    yaxis,
    xTitle,
    valuePrefix,
    valueSuffix,
    valueFormatter,
    labelFormatter,
    locale,
    xLabel,
    hiddenSeries,
    defaultHiddenSeries = NO_HIDDEN,
    onHiddenSeriesChange,
    onActiveChange,
    candleUpColor,
    candleDownColor,
    donutSize,
    dataLabelBackground,
    dataLabelFormatter,
    legendValues,
    colorRanges,
    annotations,
    zoom,
    zoomRange,
    defaultZoomRange = null,
    onZoomRangeChange,
    group,
    brushTarget,
    toolbar,
    animations,
    localeText,
    selectedDataPoints,
    defaultSelectedDataPoints = NO_POINTS,
    onDataPointSelection,
    allowMultipleDataPointsSelection,
    ...rest
  },
  ref,
) {
  const attributes = chartAttributes({
    type,
    xType: xType ?? (type === "scatter" || type === "bubble" ? "numeric" : "category"),
    curve,
    legend,
    fill,
    stacked,
    stackType,
    stackOnlyBar,
    stackTotals,
    dataLabelPosition,
    backgroundBars,
    backgroundBarOpacity,
    backgroundBarRadius,
    horizontal,
    height,
    markerSize,
    columnWidth,
    barHeight,
    yMin,
    yMax,
    dataLabels,
    startAngle,
    endAngle,
    dashArray,
    trackWidth,
    total,
    sparkline,
    boxUpperColor,
    boxLowerColor,
    candleUpColor,
    candleDownColor,
    donutSize,
    dataLabelBackground,
    legendValues,
    zoom,
    toolbar,
    animations,
    orientation,
    nodeWidth,
    whitespace,
    edgeOpacity,
    navigator,
    paneHeight,
    allowMultipleDataPointsSelection,
  });
  const isSparkline = attributes["data-ok-sparkline"] !== undefined;
  const givenHeight = attributes["data-ok-height"];
  const id = useId();
  const plotRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(CHART_DEFAULT_WIDTH);
  // Sparklines take their container's height (measured), at least `height`.
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const svgHeight = isSparkline
    ? measuredHeight || Number(givenHeight ?? SPARKLINE_HEIGHT)
    : Number(givenHeight ?? 320);
  const [active, setActiveState] = useState<ChartActive | null>(null);
  const [hidden, setHidden] = useControllableState<readonly number[]>({
    value: hiddenSeries,
    defaultValue: defaultHiddenSeries,
    onChange: onHiddenSeriesChange as ((value: readonly number[]) => void) | undefined,
  });

  // Validated option values (invalid props fall back, as in the attributes).
  const chartType = attributes["data-ok-type"] as ChartType;
  const chartXType = attributes["data-ok-x-type"] as ChartXType;
  const chartCurve = attributes["data-ok-curve"] as ChartCurve;
  const chartFill = attributes["data-ok-fill"] as ChartFill;
  const chartLegend = attributes["data-ok-legend"] as ChartLegend;
  const number = (name: `data-ok-${string}`) =>
    attributes[name] === undefined ? undefined : Number(attributes[name]);
  const validMarkerSize = number("data-ok-marker-size");
  const validColumnWidth = number("data-ok-column-width") ?? 40;
  const validBarHeight = number("data-ok-bar-height");
  const validUpper = attributes["data-ok-box-upper-color"] as ChartColor | undefined;
  const validLower = attributes["data-ok-box-lower-color"] as ChartColor | undefined;
  const validYMin = number("data-ok-y-min");
  const validYMax = number("data-ok-y-max");
  const validStartAngle = number("data-ok-start-angle");
  const validEndAngle = number("data-ok-end-angle");
  const validDashArray = number("data-ok-dash-array");
  const validTrackWidth = number("data-ok-track-width");
  const validTotal = number("data-ok-total");

  const validUpColor = attributes["data-ok-candle-up-color"] as ChartColor | undefined;
  const validDownColor = attributes["data-ok-candle-down-color"] as ChartColor | undefined;
  const validDonutSize = number("data-ok-donut-size");
  const navigatorOn = attributes["data-ok-navigator"] !== undefined;
  // A navigator zooms the chart: its gestures and keys are on.
  const zoomOn = attributes["data-ok-zoom"] !== undefined || navigatorOn;
  const validPaneHeight = number("data-ok-pane-height");
  const validOrientation = attributes["data-ok-orientation"] as ChartOrientation | undefined;
  const validNodeWidth = number("data-ok-node-width");
  const validWhitespace = number("data-ok-whitespace");
  const validEdgeOpacity = number("data-ok-edge-opacity");
  const validStackType = attributes["data-ok-stack-type"] as ChartStackType | undefined;
  const validLabelPosition = attributes["data-ok-data-label-position"] as
    | ChartDataLabelPosition
    | undefined;
  const validTrackOpacity = number("data-ok-background-bar-opacity");
  const validTrackRadius = number("data-ok-background-bar-radius");

  // Zoom (phase 4): controlled, or kept with the x axis it was set on (so it follows live data).
  const [innerZoom, setInnerZoom] = useState<{
    range: ChartZoom | null;
    from: ChartZoom | null | undefined;
  }>(() => ({ range: defaultZoomRange, from: undefined }));
  const zoomControlled = zoomRange !== undefined;
  const [pan, setPan] = useState(false);
  /** A drag being zoomed (zoom charts) or the target's zoom (brush charts). */
  const [preview, setPreview] = useState<ChartZoom | null>(null);
  const [selection, setSelection] = useState<ChartZoom | null>(null);
  const [status, setStatus] = useState("");
  // Selected points (4.18.60): controlled, or kept here.
  const [selected, setSelected] = useControllableState<readonly ChartDataPoint[]>({
    value: selectedDataPoints,
    defaultValue: defaultSelectedDataPoints,
  });
  const validSelected = useMemo(() => chartSelection(selected), [selected]);

  const render = useMemo(
    () =>
      renderChart({
        type: chartType,
        xType: chartXType,
        series,
        nodes: sankeyNodes,
        edges,
        orientation: validOrientation,
        nodeWidth: validNodeWidth,
        whitespace: validWhitespace,
        edgeOpacity: validEdgeOpacity,
        axisTitles,
        indicators,
        navigator: navigatorOn,
        paneHeight: validPaneHeight,
        categories,
        colors,
        curve: chartCurve,
        fill: chartFill,
        legend: chartLegend,
        stacked,
        stackType: validStackType,
        stackOnlyBar,
        stackTotals,
        dataLabelPosition: validLabelPosition,
        backgroundBars,
        backgroundBarColors,
        backgroundBarOpacity: validTrackOpacity,
        backgroundBarRadius: validTrackRadius,
        horizontal,
        markerSize: validMarkerSize,
        columnWidth: validColumnWidth,
        barHeight: validBarHeight,
        yMin: validYMin,
        yMax: validYMax,
        dataLabels,
        startAngle: validStartAngle,
        endAngle: validEndAngle,
        dashArray: validDashArray,
        trackWidth: validTrackWidth,
        total: validTotal,
        totalLabel,
        sparkline: isSparkline,
        boxUpperColor: validUpper,
        boxLowerColor: validLower,
        candleUpColor: validUpColor,
        candleDownColor: validDownColor,
        donutSize: validDonutSize,
        dataLabelBackground,
        dataLabelFormatter,
        legendValues,
        colorRanges,
        annotations,
        partLabels: localeText,
        zoom: zoomControlled ? zoomRange : innerZoom.range,
        zoomFrom: zoomControlled ? undefined : innerZoom.from,
        selection: brushTarget ? selection : preview,
        brush: Boolean(brushTarget),
        selectedDataPoints: validSelected,
        yTitle,
        yaxis,
        xTitle,
        valuePrefix,
        valueSuffix,
        valueFormatter,
        labelFormatter,
        locale,
        xLabel,
        hidden,
        width,
        height: svgHeight,
        idPrefix: chartIdPrefix(id),
      }),
    [
      chartType,
      chartXType,
      series,
      sankeyNodes,
      edges,
      validOrientation,
      validNodeWidth,
      validWhitespace,
      validEdgeOpacity,
      axisTitles,
      indicators,
      navigatorOn,
      validPaneHeight,
      categories,
      colors,
      chartCurve,
      chartFill,
      chartLegend,
      stacked,
      validStackType,
      stackOnlyBar,
      stackTotals,
      validLabelPosition,
      backgroundBars,
      backgroundBarColors,
      validTrackOpacity,
      validTrackRadius,
      horizontal,
      validMarkerSize,
      validColumnWidth,
      validBarHeight,
      validYMin,
      validYMax,
      dataLabels,
      validStartAngle,
      validEndAngle,
      validDashArray,
      validTrackWidth,
      validTotal,
      totalLabel,
      isSparkline,
      validUpper,
      validLower,
      validUpColor,
      validDownColor,
      validDonutSize,
      dataLabelBackground,
      dataLabelFormatter,
      legendValues,
      colorRanges,
      annotations,
      localeText,
      zoomControlled,
      zoomRange,
      innerZoom,
      brushTarget,
      selection,
      preview,
      validSelected,
      yTitle,
      yaxis,
      xTitle,
      valuePrefix,
      valueSuffix,
      valueFormatter,
      labelFormatter,
      locale,
      xLabel,
      hidden,
      width,
      svgHeight,
      id,
    ],
  );
  const { layout } = render;
  const renderRef = useRef(render);
  renderRef.current = render;
  const kind = render.data.xType === "numeric" ? "value" : "index";
  /** Gestures and keys: zoomable charts zoom, brush charts move their selection. */
  const gestureMode: ChartGestureMode = brushTarget
    ? "brush"
    : zoomOn && render.zoomable
      ? pan
        ? "pan"
        : "zoom"
      : "none";
  const modeRef = useRef(gestureMode);
  modeRef.current = gestureMode;

  const onZoomRef = useRef(onZoomRangeChange);
  onZoomRef.current = onZoomRangeChange;
  const linkRef = useRef<ChartLink | null>(null);
  /** Applies a new zoom; the chart's own changes reach its group and brushes. */
  const setZoom = (range: ChartZoom | null, reason: ChartZoomReason) => {
    const current = renderRef.current;
    if (!zoomControlled) setInnerZoom({ range, from: current.extent });
    onZoomRef.current?.(range, reason);
    if (reason === "user") linkRef.current?.zoomed(range);
  };
  const setZoomRef = useRef(setZoom);
  setZoomRef.current = setZoom;
  /** Brush charts: a new selection zooms the target (or only redraws without one). */
  const setBrush = (range: ChartZoom | null) => {
    setSelection(range);
    linkRef.current?.brush(range);
  };
  const setBrushRef = useRef(setBrush);
  setBrushRef.current = setBrush;
  /** The range gestures and keys change: the zoom, or a brush chart's selection. */
  const currentRange = () => (brushTarget ? selection : render.zoom);
  const commitRange = (range: ChartZoom | null) =>
    brushTarget ? setBrush(range) : setZoom(range, "user");

  const onActiveRef = useRef(onActiveChange);
  onActiveRef.current = onActiveChange;
  const activeRef = useRef(active);
  activeRef.current = active;
  /** The chart's own changes (pointer, touch, keyboard): reported, and shown by its group. */
  const setActive = (next: ChartActive | null) => {
    if (sameChartActive(next, activeRef.current)) return;
    activeRef.current = next;
    setActiveState(next);
    onActiveRef.current?.(next);
    linkRef.current?.shown(next?.kind === "index" ? next.index : null);
  };

  const figureRef = useRef<HTMLElement>(null);
  const mergedRef = useMergedRefs(ref, figureRef);
  const elementId = rest.id;

  // Synchronized groups and brush charts (phase 4): linked by `group`, `id` and `brushTarget`.
  useEffect(() => {
    if (!group && !brushTarget && !elementId) return;
    const link = linkChart({
      id: elementId,
      group,
      brushTarget,
      zoom: () => renderRef.current.zoom,
      showIndex: (index) => {
        const next: ChartActive | null = index === null ? null : { kind: "index", index };
        if (sameChartActive(next, activeRef.current)) return;
        activeRef.current = next;
        setActiveState(next);
      },
      applyZoom: (range, reason) => setZoomRef.current(range, reason),
      select: (range) => setSelection(range),
    });
    linkRef.current = link;
    return () => {
      link.unlink();
      linkRef.current = null;
    };
  }, [elementId, group, brushTarget]);

  // A zoom that follows live data moves by itself: brushes of this chart redraw.
  const drawnMin = render.zoom?.min;
  const drawnMax = render.zoom?.max;
  useEffect(() => {
    linkRef.current?.drawn(
      drawnMin === undefined ? null : { min: drawnMin, max: drawnMax as number },
    );
  }, [drawnMin, drawnMax]);

  // Zoom, pan and brush gestures (core controller; it reads the latest render through refs).
  const gesturesRef = useRef<ChartGestures | null>(null);
  useEffect(() => {
    const plot = plotRef.current as HTMLDivElement;
    const gestures = createChartGestures(plot, {
      layout: () => renderRef.current.layout,
      mode: () => modeRef.current,
      range: () => (modeRef.current === "brush" ? selectionRef.current : renderRef.current.zoom),
      extent: () => renderRef.current.extent,
      preview: (range) => setPreview(range),
      commit: (range) =>
        modeRef.current === "brush"
          ? setBrushRef.current(range)
          : setZoomRef.current(range, "user"),
    });
    gesturesRef.current = gestures;
    return () => gestures.destroy();
  }, []);
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  // Draw at the measured width (the first render uses the default, scaled by the viewBox).
  // Sparklines also take the plot's height (their SVG is out of flow, so no feedback loop).
  useLayoutEffect(() => {
    const plot = plotRef.current as HTMLDivElement;
    const measure = () => {
      const next = Math.round(plot.clientWidth);
      if (next > 0) setWidth(next);
      if (isSparkline) setMeasuredHeight(Math.round(plot.clientHeight));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(plot);
    return () => observer.disconnect();
  }, [isSparkline]);

  // A redraw (resize, hidden series, zoom) can remove the active item.
  const tooltip = chartTooltip(render.data, layout, render.format, active, validSelected);
  const shown = tooltip && tooltip.rows.length > 0 ? tooltip : null;

  // Tooltip position: measured after it renders, written as private properties.
  useLayoutEffect(() => {
    const tip = tipRef.current as HTMLDivElement;
    const plot = plotRef.current as HTMLDivElement;
    if (!shown) return;
    const scale = plot.clientWidth / layout.width || 1;
    const { left, top } = placeChartTooltip(
      { x: shown.x * scale, y: shown.y * scale },
      { width: tip.offsetWidth, height: tip.offsetHeight },
      { width: plot.clientWidth, height: plot.clientHeight },
    );
    tip.style.setProperty("--_ok-chart-tip-x", `${left}px`);
    tip.style.setProperty("--_ok-chart-tip-y", `${top}px`);
  });

  const point = (event: PointerEvent<HTMLDivElement>) => {
    if (gesturesRef.current?.dragging) return;
    const box = event.currentTarget.getBoundingClientRect();
    const scale = layout.width / (box.width || layout.width);
    setActive(
      chartActiveAt(layout, (event.clientX - box.left) * scale, (event.clientY - box.top) * scale),
    );
  };
  const onSelectionRef = useRef(onDataPointSelection);
  onSelectionRef.current = onDataPointSelection;
  /** Toggles points (a click, Enter or Space) and reports each one. */
  const select = (points: readonly ChartDataPoint[]) => {
    const next = toggleChartSelection(
      validSelected,
      points,
      attributes["data-ok-allow-multiple-data-points-selection"] !== undefined,
    );
    setSelected(next);
    for (const entry of chartSelection(points))
      onSelectionRef.current?.({
        ...entry,
        selected: hasChartDataPoint(next, entry),
        selectedDataPoints: [...next],
      });
  };
  // A click selects the point, slice or cell under the pointer (not after a drag or on brushes).
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    if (brushTarget || gesturesRef.current?.moved) return;
    const box = event.currentTarget.getBoundingClientRect();
    const scale = layout.width / (box.width || layout.width);
    const mark = chartMarkAt(
      layout,
      (event.clientX - box.left) * scale,
      (event.clientY - box.top) * scale,
    );
    if (mark !== null)
      select([chartMarkPoint(layout.marks[mark] as (typeof layout.marks)[number])]);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if ((event.key === "Enter" || event.key === " ") && !event.repeat && !brushTarget) {
      // Enter or Space selects the active item's points (a category: every series' point).
      const marks = chartActiveMarks(layout, activeRef.current);
      if (marks.length === 0) return;
      event.preventDefault();
      select(
        marks.map((mark) => chartMarkPoint(layout.marks[mark] as (typeof layout.marks)[number])),
      );
      return;
    }
    if (event.key === "Escape") {
      if (activeRef.current) {
        event.preventDefault();
        setActive(null);
      } else if (gestureMode !== "none" && currentRange()) {
        // A second Escape resets the zoom (or the brush selection).
        event.preventDefault();
        commitRange(null);
      }
      return;
    }
    if (gestureMode !== "none" && !event.altKey && !event.ctrlKey && !event.metaKey) {
      const range = chartZoomKey(event.key, event.shiftKey, currentRange(), render.extent, kind);
      if (range !== undefined) {
        event.preventDefault();
        commitRange(range);
        return;
      }
    }
    const next = nextChartActive(layout, activeRef.current, event.key);
    if (next === undefined) return;
    event.preventDefault();
    setActive(next);
  };

  const hover = chartActiveNodes(layout, shown ? active : null);
  const nodes = layout.nodes.map((node) =>
    node.attrs["data-ok-chart-crosshair"] !== undefined
      ? { ...node, children: hover.under }
      : node.attrs["data-ok-chart-active"] !== undefined
        ? { ...node, children: hover.over }
        : node,
  );

  const toggle = (index: number) => {
    const next = hidden.includes(index)
      ? hidden.filter((i) => i !== index)
      : [...hidden, index].sort((a, b) => a - b);
    setHidden(next);
  };

  const tools = toolbar
    ? chartToolbar({
        zoom: zoomOn && render.zoomable,
        zoomed: render.zoom !== null,
        pan,
        text: localeText,
      })
    : [];
  const runTool = (tool: ChartTool) => {
    if (tool === "pan") setPan((on) => !on);
    else if (tool === "reset") setZoom(null, "user");
    else if (tool === "zoomIn" || tool === "zoomOut")
      setZoom(zoomChartBy(render.zoom, render.extent, kind, tool === "zoomIn" ? 0.5 : 2), "user");
    else {
      setStatus("");
      exportChart(figureRef.current as HTMLElement, tool as ChartExportFormat).catch(() =>
        setStatus(localeText?.exportFailed ?? chartToolLabels.exportFailed),
      );
    }
  };
  const annotationItems = chartAnnotationItems(annotations ?? []);

  return (
    <figure
      ref={mergedRef}
      {...attributes}
      {...chartTextAttributes({
        yTitle,
        totalLabel,
        valuePrefix,
        valueSuffix,
        locale,
        group,
        brushTarget,
        colorRanges,
        axisTitles,
        indicators,
        yaxis,
        xTitle,
        backgroundBarColors,
      })}
      data-ok-ready=""
      data-ok-runtime="off"
      {...rest}
    >
      {tools.length > 0 && (
        <div
          data-ok-chart-toolbar=""
          role="group"
          aria-label={localeText?.toolbar ?? chartToolLabels.toolbar}
        >
          {tools.map((item) => (
            <button
              key={item.tool}
              type="button"
              data-ok-chart-tool={item.tool}
              aria-label={item.label}
              title={item.label}
              aria-pressed={item.pressed}
              disabled={item.disabled}
              onClick={() => runTool(item.tool)}
            >
              {item.icon ? toElements([item.icon]) : item.text}
            </button>
          ))}
          <span data-ok-chart-status="" role="status">
            {status}
          </span>
        </div>
      )}
      {render.legend && (
        <div data-ok-chart-legend="">
          {render.legend.map((item) => (
            <button
              key={item.index}
              type="button"
              data-ok-chart-legend-item=""
              data-ok-color={item.color}
              aria-pressed={!item.hidden}
              onClick={() => toggle(item.index)}
            >
              <span data-ok-chart-legend-marker="" />
              {item.name}
              {item.value !== undefined && <span data-ok-chart-legend-value="">{item.value}</span>}
            </button>
          ))}
        </div>
      )}
      {/* A focusable group (biome.json override): arrow keys move through the chart's values. */}
      <div
        ref={plotRef}
        data-ok-chart-plot=""
        role="group"
        aria-roledescription="chart"
        aria-label={label}
        tabIndex={0}
        // Sparklines: the least height (CSSOM in HTML; parity ignores `style`).
        style={
          isSparkline && givenHeight !== undefined
            ? ({ "--_ok-chart-height": `${givenHeight}px` } as CSSProperties)
            : undefined
        }
        onPointerMove={point}
        onPointerDown={point}
        onPointerLeave={(event) => {
          if (event.pointerType === "mouse") setActive(null);
        }}
        onKeyDown={onKeyDown}
        onClick={onClick}
        onFocus={(event) => {
          if (event.currentTarget.matches(":focus-visible") && !activeRef.current) {
            setActive(nextChartActive(layout, null, "Home") as ChartActive | null);
          }
        }}
        onBlur={() => setActive(null)}
      >
        <svg
          data-ok-chart-svg=""
          aria-hidden="true"
          focusable="false"
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
        >
          {toElements(nodes)}
        </svg>
        <div ref={tipRef} data-ok-chart-tooltip="" role="status" hidden={!shown}>
          {shown && (
            <>
              <div data-ok-chart-tooltip-title="">{shown.title}</div>
              {shown.selected && (
                <div data-ok-chart-tooltip-state="">
                  {localeText?.selected ?? chartToolLabels.selected}
                </div>
              )}
              <div data-ok-chart-tooltip-rows="">
                {shown.rows.map((row, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: rows follow the series order
                  <div key={index} data-ok-chart-tooltip-row="">
                    <span data-ok-chart-tooltip-marker="" data-ok-color={row.color} />
                    <span>{row.name}</span>
                    <span data-ok-chart-tooltip-value="">{row.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <table data-ok-chart-data="">
        <caption>{label}</caption>
        <thead>
          <tr>
            {render.table.head.map((cell, index) => (
              <th
                // biome-ignore lint/suspicious/noArrayIndexKey: columns are positional
                key={index}
                scope={cell.colSpan ? "colgroup" : "col"}
                colSpan={cell.colSpan}
                rowSpan={cell.rowSpan}
                {...cell.attrs}
              >
                {cell.text}
              </th>
            ))}
          </tr>
          {render.table.parts.length > 0 && (
            <tr>
              {render.table.parts.map((cell, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: columns are positional
                <th key={index} scope="col" {...cell.attrs}>
                  {cell.text}
                </th>
              ))}
            </tr>
          )}
        </thead>
        <tbody>
          {render.table.rows.map((row, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional
            <tr key={index}>
              <th scope="row" {...row.header.attrs}>
                {row.header.text}
              </th>
              {row.cells.map((cell, column) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: columns are positional
                <td key={column} {...cell.attrs}>
                  {cell.text}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {annotationItems.length > 0 && (
        <ul data-ok-chart-annotations="">
          {annotationItems.map((item, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: annotations are positional
            <li key={index} {...item.attrs}>
              {item.text}
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
});
