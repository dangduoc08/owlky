"use client";

import {
  CHART_DEFAULT_WIDTH,
  type ChartActive,
  type ChartAnnotation,
  type ChartBeeswarmSpread,
  type ChartColor,
  type ChartColorRange,
  type ChartCrossfilter,
  type ChartCurve,
  type ChartDataLabelPosition,
  type ChartDataPoint,
  type ChartDirection,
  type ChartDiscreteMarker,
  type ChartDrilldownLevel,
  type ChartEdgeStyle,
  type ChartExportFormat,
  type ChartFill,
  type ChartFillFrom,
  type ChartGeoLayout,
  type ChartGeometry,
  type ChartGeoRegion,
  type ChartGestureMode,
  type ChartGestures,
  type ChartGrid,
  type ChartGroupFilter,
  type ChartHexCell,
  type ChartHierarchyAction,
  type ChartHierarchyNode,
  type ChartIndicator,
  type ChartLayoutType,
  type ChartLeaf,
  type ChartLegend,
  type ChartLegendAlign,
  type ChartLink,
  type ChartLocaleText,
  type ChartMarkerShape,
  type ChartMeasure,
  type ChartMeasureMode,
  type ChartNoDataAlign,
  type ChartNoDataVerticalAlign,
  type ChartNode,
  type ChartOrientation,
  type ChartPattern,
  type ChartProjection,
  type ChartPxPoint,
  type ChartRender,
  type ChartSankeyEdge,
  type ChartSankeyNode,
  type ChartScaleMethod,
  type ChartSelectionDetail,
  type ChartSeries,
  type ChartStackType,
  type ChartStreamOffset,
  type ChartStreamOrder,
  type ChartStripeColor,
  type ChartTool,
  type ChartTooltipContext,
  type ChartTooltipCorner,
  type ChartTooltipMode,
  type ChartTreeLabel,
  type ChartTreeLabelLevels,
  type ChartType,
  type ChartUnitLayout,
  type ChartViolinNormalize,
  type ChartViolinSide,
  type ChartViolinWhiskers,
  type ChartXGroup,
  type ChartXType,
  type ChartYAxis,
  type ChartZoom,
  type ChartZoomReason,
  type ChartZoomType,
  chartActiveAt,
  chartActiveMarks,
  chartActiveNodes,
  chartAnnotationAt,
  chartAnnotationIndexes,
  chartAnnotationItems,
  chartAnnotationKey,
  chartAnnotations,
  chartAnnotationText,
  chartAttributes,
  chartBrushCategories,
  chartDrilldownActive,
  chartDrillLabels,
  chartDrillUp,
  chartFilterCategories,
  chartFilterLabels,
  chartFilterText,
  chartHierarchyAction,
  chartIdPrefix,
  chartMarkAt,
  chartMarkPoint,
  chartMeasureActive,
  chartMeasureAt,
  chartMeasureBetween,
  chartMeasures,
  chartMeasureText,
  chartSelection,
  chartTextAttributes,
  chartToolbar,
  chartToolLabels,
  chartTooltip,
  chartTooltipContext,
  chartTooltipFixed,
  chartTreeLabelLevelsText,
  chartTreeLabelText,
  chartTreeMarkOf,
  chartZoomKey,
  createChartGestures,
  dragChartAnnotation,
  exportChart,
  hasChartDataPoint,
  linkChart,
  nextChartActive,
  parseChartTreeLabel,
  parseChartTreeLabelLevels,
  placeChartTooltip,
  renderChart,
  sameChartActive,
  toggleChartCollapsed,
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
   * Tree charts: the nodes, nested (`{ id, name, value, color, children }`; one root or several).
   * `id` defaults to the name; parents' values are the sum of their children.
   */
  hierarchy?: ChartHierarchyNode | readonly ChartHierarchyNode[] | undefined;
  /** Tree and icicle charts: where the root sits, or `radial` (trees: the root in the center). Default `"top"`. */
  direction?: ChartDirection | undefined;
  /** Geo charts: the regions' shapes, a GeoJSON `FeatureCollection`, feature or list of features. */
  geometry?: ChartGeometry | null | undefined;
  /** Geo charts: one region's id, name, short tile label and value, joined to the geometry by id. */
  regions?: readonly ChartGeoRegion[] | undefined;
  /** Geo charts: the feature property that holds the region id. Default: the feature's `id`, then its `id`, `iso_a2` or `name` property. */
  joinBy?: string | undefined;
  /** Geo charts: `equalEarth` (equal areas), `mercator` or `equirectangular`. Default `"equalEarth"`. */
  projection?: ChartProjection | undefined;
  /** Geo charts: real boundaries or equal tiles. Default `"geographic"`. */
  geoLayout?: ChartGeoLayout | undefined;
  /** Geo charts, `hex` layout: each region's cell in an odd-r offset grid. Without them, cells follow the geometry. */
  hexCells?: readonly ChartHexCell[] | undefined;
  /** Geo charts: how values are split into classes. Default `"quantile"`. */
  scaleMethod?: ChartScaleMethod | undefined;
  /** Geo charts: how many value classes (at most the colors available). Default 5. */
  scaleClasses?: number | undefined;
  /** Geo charts, `threshold` method: the class breaks. */
  scaleThresholds?: readonly number[] | undefined;
  /** Geo charts: the outline of the globe behind the regions. */
  sphere?: boolean | undefined;
  /** Geo charts: lines of longitude and latitude every 30 degrees. */
  graticule?: boolean | undefined;
  /** Tree charts: `tree` (a tidy tree) or `cluster` (a dendrogram). Default `"tree"`. */
  layoutType?: ChartLayoutType | undefined;
  /** Tree charts: links with right angles, curved or straight. Default `"orthogonal"`. */
  edgeStyle?: ChartEdgeStyle | undefined;
  /**
   * Tree charts: where every node's label sits beside its node: `align` (`left`, `center`,
   * `right`), `verticalAlign` (`top`, `middle`, `bottom`), `offsetX` / `offsetY` in px and
   * `rotation` in degrees. Options left out keep the default side. Radial leaves stay on their
   * ray: `offsetX` moves them outward and `rotation` adds to their angle. Default: labels below
   * the node in top trees, above in bottom trees, beside it in left and right trees.
   */
  externalLabel?: ChartTreeLabel | undefined;
  /**
   * Tree charts: label placement per level (`{ 2: { rotation: -45 } }`; the roots are level 0),
   * over `externalLabel`. A node's own `externalLabel` in `hierarchy` wins over both.
   */
  externalLabelLevels?: ChartTreeLabelLevels | undefined;
  /** Tree charts: a click, Enter or Space on a node with children hides or shows them. */
  enableExpandCollapse?: boolean | undefined;
  /** Tree charts, controlled: ids of the nodes whose children are hidden. */
  collapsedNodes?: readonly string[] | undefined;
  /** Tree charts: the nodes collapsed at first (uncontrolled). */
  defaultCollapsedNodes?: readonly string[] | undefined;
  /** Tree charts: called with the collapsed ids after a node is expanded or collapsed. */
  onCollapsedNodesChange?: ((collapsedNodes: string[]) => void) | undefined;
  /**
   * Sunburst and icicle charts, controlled: the id of the node zoomed into (`null`: none). A click, Enter or
   * Space on a node with children zooms into it; on the zoomed node, Escape or **Back** zooms out.
   */
  drillNode?: string | null | undefined;
  /** Sunburst and icicle charts: the node zoomed into at first (uncontrolled). */
  defaultDrillNode?: string | null | undefined;
  /** Sunburst and icicle charts: called with the new node (`null` at the top) when the chart zooms. */
  onDrillNodeChange?: ((drillNode: string | null) => void) | undefined;
  /** Sunburst and icicle charts: clicks, Enter and Space don't zoom into nodes. */
  disableZoomOnClick?: boolean | undefined;
  /** Sunburst charts: the hole in the center in % of the radius (0 to 90). Default 15. */
  innerSize?: number | undefined;
  /** Sunburst and icicle charts: the gap between arcs or cells in px. Default 1. */
  spacing?: number | undefined;
  /** Sunburst and icicle charts: branches that end early `extend` to the edge or `stop`. Default `"extend"` on sunbursts, `"stop"` on icicles. */
  leaf?: ChartLeaf | undefined;
  /** Sunburst and icicle charts: how much paler each level is (0 to 1). Default 0.14. */
  tint?: number | undefined;
  /**
   * Icicle charts: a branch zoomed into keeps its ancestors as full bands above it (`value`) or
   * becomes the top level (`both`). Default `"value"`.
   */
  zoomType?: ChartZoomType | undefined;
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
  /**
   * Area fill. Default `"gradient"`; `"solid"`, or `"pattern"`: bars, areas and slices get a
   * different pattern per series (or `fillPattern`).
   */
  fill?: ChartFill | undefined;
  /**
   * Marker shape of every series: `"circle"` (default), `"square"`, `"triangle"`, `"diamond"`,
   * `"cross"`, `"plus"` or `"star"`. Series may set `markerShape` themselves.
   */
  markerShape?: ChartMarkerShape | undefined;
  /**
   * Pattern of every bar, area and slice (turns patterns on): `"slantedLines"`, `"squares"`,
   * `"circles"`, `"horizontalLines"` or `"verticalLines"`. Series may set `fillPattern`.
   */
  fillPattern?: ChartPattern | undefined;
  /** Line width of every series in px. Default 2.5. Series may set `strokeWidth`. */
  strokeWidth?: number | undefined;
  /**
   * Series differ by more than color: each gets its own marker shape (lines get markers), pattern
   * and dash.
   */
  colorBlindMode?: boolean | undefined;
  /**
   * Markers on single points (`{ seriesIndex, dataPointIndex, color, size, shape }`), also on
   * series without markers.
   */
  discreteMarkers?: readonly ChartDiscreteMarker[] | undefined;
  /**
   * Tooltip. Default `"shared"`: every series of the category. `"point"`: only the value under
   * the pointer or the keyboard. `"none"`: no tooltip is shown, but the values the keyboard moves to
   * are still announced.
   */
  tooltip?: ChartTooltipMode | undefined;
  /** The tooltip stays in this corner of the plot instead of following the value. */
  tooltipFixed?: ChartTooltipCorner | undefined;
  /**
   * Custom tooltip content: called with the title, the rows (name, value, color), whether the
   * item is selected and its data points; returns what the tooltip shows.
   */
  tooltipContent?: ((context: ChartTooltipContext) => ReactNode) | undefined;
  /** Legend items line up `"left"`, `"center"` or `"right"` (default right above the plot, centered below it). */
  legendAlign?: ChartLegendAlign | undefined;
  /** Shows the legend for a single series too. */
  showForSingleSeries?: boolean | undefined;
  /** Legend items are plain labels: clicks don't hide series. */
  disableLegendToggle?: boolean | undefined;
  /** Legend names instead of the series' names: item n stands for series n (its color and toggle). */
  customLegendItems?: readonly string[] | undefined;
  /**
   * Grid lines: `"y"` (default) horizontal, along the value ticks (between the bars of horizontal
   * bar charts); `"x"` vertical; `"both"` or `"none"`.
   */
  grid?: ChartGrid | undefined;
  /** Stripes between the horizontal grid lines: colors in turn (palette names, `"grey"` or `"transparent"`). */
  gridRowColors?: readonly ChartStripeColor[] | undefined;
  /** Stripes between the vertical grid positions: colors in turn. */
  gridColumnColors?: readonly ChartStripeColor[] | undefined;
  /** Opacity of the row stripes (0 to 1). Default 0.5. */
  gridRowOpacity?: number | undefined;
  /** Opacity of the column stripes (0 to 1). Default 0.5. */
  gridColumnOpacity?: number | undefined;
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
  /** Waterfall charts: color of the steps that raise the total. Default `"success"`. */
  waterfallPositiveColor?: ChartColor | undefined;
  /** Waterfall charts: color of the steps that lower the total. Default `"error"`. */
  waterfallNegativeColor?: ChartColor | undefined;
  /** Waterfall charts: color of the total bars (`isTotal` points). Default the series color. */
  waterfallTotalColor?: ChartColor | undefined;
  /** Waterfall charts: color of the subtotal bars (`isSubtotal` points). Default the total color. */
  waterfallSubtotalColor?: ChartColor | undefined;
  /** Waterfall charts: no dashed lines from the end of each bar to the next one. */
  hideConnectors?: boolean | undefined;
  /** Unit charts: where the marks go: `grouped`, `packed`, `columns`, `grid` or `arc`. Default `"grouped"`. */
  unitLayout?: ChartUnitLayout | undefined;
  /** Unit charts: category names under each cluster or column. */
  clusterLabels?: boolean | undefined;
  /** Packed unit charts: keep the given order instead of the smallest group in the middle. */
  disableSortByGroup?: boolean | undefined;
  /** Arc unit charts: the concentric rows. Default the fewest that seat everyone. */
  arcRows?: number | undefined;
  /** Waffle charts: cells per row. Default 10. */
  columns?: number | undefined;
  /** Waffle charts: the row where the cells start filling. Default `"bottom"`. */
  fillFrom?: ChartFillFrom | undefined;
  /** Waffle charts: one mini waffle per category, filled to its value. */
  split?: boolean | undefined;
  /** Split waffles: tiles per row. Default about a square of tiles. */
  tileColumns?: number | undefined;
  /** Split waffles: the value a full tile stands for. Default the largest value. */
  splitMax?: number | undefined;
  /** Split waffles: the color of the empty cells. Default a neutral grey. */
  trackColor?: ChartColor | undefined;
  /** Waffle and unit charts: how many units of value one mark stands for. Default 1. */
  unitValue?: number | undefined;
  /** Waffle and unit charts: the most marks drawn; counts scale down above it. Default 5000. */
  maxUnits?: number | undefined;
  /** Waffle charts: the corner radius of square cells in pixels. Default 2. */
  cellRadius?: number | undefined;
  /** Beeswarm charts: dots push apart just enough not to overlap (`swarm`) or spread across the lane by a fixed sequence (`jitter`). Default `"swarm"`. */
  beeswarmSpread?: ChartBeeswarmSpread | undefined;
  /** Violins: each violin fills its slot (`individual`) or all share one density scale (`group`). Default `"individual"`. */
  violinNormalize?: ChartViolinNormalize | undefined;
  /** Violins: symmetric (`both`) or half a violin: `left`, `right`, `top` or `bottom`. Default `"both"`. */
  violinSide?: ChartViolinSide | undefined;
  /** Violins: multiplies the drawn half-width. Default 1. */
  bandwidthScale?: number | undefined;
  /** Violins: the kernel width of the density estimate, in value units. Default Silverman's rule. */
  kdeBandwidth?: number | undefined;
  /** Violins: density samples per violin (4 to 256). Default 64. */
  kdeResolution?: number | undefined;
  /** Violins: a five-number box beside the density. */
  violinBox?: boolean | undefined;
  /** Violin boxes: whiskers at the extremes (`minmax`) or Tukey's fences (`tukey`). Default `"minmax"`. */
  violinWhiskers?: ChartViolinWhiskers | undefined;
  /** Violins: no dots for the observations. */
  hideViolinPoints?: boolean | undefined;
  /** Violins: the radius of the observation dots in pixels. Default 2.5. */
  violinPointSize?: number | undefined;
  /** Violins: how far the dots spread, as a share of the half-width (0 to 1). Default 0.5. */
  violinJitter?: number | undefined;
  /** Violins: the dots may leave the density outline. */
  unconstrainedViolinPoints?: boolean | undefined;
  /** Violins: the most dots per violin; extra observations are thinned evenly. Default 3000. */
  violinMaxPoints?: number | undefined;
  /** Streamgraphs: the baseline: `wiggle`, `silhouette`, `zero` or `expand`. Default `"wiggle"`. */
  streamOffset?: ChartStreamOffset | undefined;
  /** Streamgraphs: the stacking order: `inside-out`, `inverse` or `none`. Default `"inside-out"`. */
  streamOrder?: ChartStreamOrder | undefined;
  /** Streamgraphs: no series names on the bands. */
  hideStreamLabels?: boolean | undefined;
  /** Streamgraphs: bands thinner than this many pixels get no name. Default 24. */
  streamLabelMinWidth?: number | undefined;
  /** Streamgraphs with `tooltip="point"`: the opacity of the other bands (0 to 1). Default 0.35. */
  streamHoverOpacity?: number | undefined;
  /**
   * Dumbbell charts: the start and end marker colors of each series, such as
   * `[["info", "success"]]` (pair n for series n; later series take the first pair). Default the
   * series color: a ring at the start, a disc at the end.
   */
  dumbbellColors?: readonly (readonly ChartColor[])[] | undefined;
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
  brushTarget?: string | readonly string[] | undefined;
  /**
   * Charts of a `group`: a selection in this chart (click, Enter or Space), or its brush, filters
   * the other charts of the group, and this chart shows the group's filter: `"filter"` draws only
   * the filtered categories' values, `"highlight"` tints them. Charts of a group share their
   * categories by position. A **Clear filter** button under the plot clears it.
   */
  crossfilter?: ChartCrossfilter | undefined;
  /**
   * Called when the group's filter changes: the filtered category indexes (`null`: none) and
   * whether this chart set it.
   */
  onFilterChange?: ((categories: number[] | null, own: boolean) => void) | undefined;
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
  /**
   * The first x position shown when nothing has zoomed the chart: a category index, a timestamp in
   * milliseconds (date axes) or an x value (numeric axes, which may lie beyond the data).
   */
  xMin?: number | undefined;
  /** The last x position shown when nothing has zoomed the chart (see `xMin`). */
  xMax?: number | undefined;
  /** Shows the last so many x units, ending at `xMax` or the last x value. */
  xRange?: number | undefined;
  /** X labels turn by this many degrees (-90 to 90) when they don't fit flat. */
  xLabelRotate?: number | undefined;
  /** X labels turn by `xLabelRotate` even when they fit flat. */
  xLabelRotateAlways?: boolean | undefined;
  /** A second row of x labels: each `{ title, cols }` spans `cols` categories. */
  xaxisGroups?: readonly ChartXGroup[] | undefined;
  /**
   * Measure rulers: a **Measure** button in the toolbar. In measure mode a drag, or Enter or Space
   * at two points, measures the change between two x positions (`span`: the series' values) or two
   * points (`free`).
   */
  measure?: ChartMeasureMode | undefined;
  /** Rulers stay on the chart when the drag ends (up to 20); without it a new one replaces the last. */
  measurePinOnRelease?: boolean | undefined;
  /** Controlled: the rulers, in data coordinates (`{ x1, y1, x2, y2 }`). */
  measures?: readonly ChartMeasure[] | undefined;
  /** Uncontrolled initial rulers. */
  defaultMeasures?: readonly ChartMeasure[] | undefined;
  /** Called with the rulers after one is added or they are cleared. */
  onMeasuresChange?: ((measures: ChartMeasure[]) => void) | undefined;
  /** Called after a ruler is drawn, with it, every ruler and its text (ApexCharts' `measured`). */
  onMeasured?:
    | ((detail: { measure: ChartMeasure; measures: ChartMeasure[]; text: string }) => void)
    | undefined;
  /**
   * Called after a draggable annotation was moved (a drag, or the keyboard: A picks it up, arrows
   * move it, Enter drops it), with its index in `annotations` and its new coordinates. Update
   * `annotations` to keep it there (ApexCharts' `annotationDragged`).
   */
  onAnnotationChange?:
    | ((detail: { index: number; annotation: ChartAnnotation }) => void)
    | undefined;
  /**
   * Drilldown levels: `{ id, name, type, categories, series }`. A point names the level it opens in
   * `drilldown` (`{ y: 12, drilldown: "q1" }`); a click, Enter or Space opens it, Escape and
   * **Back** go up.
   */
  drilldown?: readonly ChartDrilldownLevel[] | undefined;
  /** Controlled: the ids of the levels opened, outermost first (`[]`: the root). */
  drilldownPath?: readonly string[] | undefined;
  /** Uncontrolled initial path. */
  defaultDrilldownPath?: readonly string[] | undefined;
  /** Called with the new path when a level opens or closes. */
  onDrilldownChange?: ((path: string[]) => void) | undefined;
  /** Range bars and timelines: the series share one lane per category. */
  rangeBarGroupRows?: boolean | undefined;
  /** Range bars and timelines: bars that overlap in time go to lanes of their own. */
  disableRangeBarOverlap?: boolean | undefined;
  /** Grouped columns: zero and empty bars take no slot, so the others close up. */
  hideZeroBarsWhenGrouped?: boolean | undefined;
  /**
   * Long lines and areas draw only the points that shape them (Largest Triangle Three Buckets).
   * The table, the tooltip and the keyboard keep every point.
   */
  dataReducer?: boolean | undefined;
  /** Points kept per series when reducing. Default 250. */
  dataReducerTargetPoints?: number | undefined;
  /** A series with more visible points than this is reduced. Default 500. */
  dataReducerThreshold?: number | undefined;
  /** How many points at the end of each line, area or bar series are a forecast. */
  forecastCount?: number | undefined;
  /** Forecast line dashes in px. Default 4. */
  forecastDashArray?: number | undefined;
  /** Forecast line width in px. Default the series' width. */
  forecastStrokeWidth?: number | undefined;
  /** Opacity of forecast areas and bars (0 to 1). Default 0.5. */
  forecastFillOpacity?: number | undefined;
  /** The message drawn when there is nothing to draw (none by default). */
  noDataText?: string | undefined;
  /** Where the message sits across the plot. Default `center`. */
  noDataAlign?: ChartNoDataAlign | undefined;
  /** Where the message sits down the plot. Default `middle`. */
  noDataVerticalAlign?: ChartNoDataVerticalAlign | undefined;
}

const NO_HIDDEN: readonly number[] = [];
const NO_IDS: readonly string[] = [];
const NO_POINTS: readonly ChartDataPoint[] = [];
const NO_SERIES: readonly ChartSeries[] = [];
const NO_MEASURES: readonly ChartMeasure[] = [];
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

/** The head and body of a chart data table (the chart's own, and each drilldown level's). */
function ChartTableRows({ table }: { table: ChartRender["table"] }) {
  return (
    <>
      <thead>
        <tr>
          {table.head.map((cell, index) => (
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
        {table.parts.length > 0 && (
          <tr>
            {table.parts.map((cell, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: columns are positional
              <th key={index} scope="col" {...cell.attrs}>
                {cell.text}
              </th>
            ))}
          </tr>
        )}
      </thead>
      <tbody>
        {table.rows.map((row, index) => (
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
    </>
  );
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
    geometry,
    regions,
    joinBy,
    projection,
    geoLayout,
    hexCells,
    scaleMethod,
    scaleClasses,
    scaleThresholds,
    sphere,
    graticule,
    hierarchy,
    direction,
    layoutType,
    edgeStyle,
    externalLabel,
    externalLabelLevels,
    enableExpandCollapse,
    collapsedNodes,
    defaultCollapsedNodes = NO_IDS,
    onCollapsedNodesChange,
    drillNode,
    defaultDrillNode = null,
    onDrillNodeChange,
    disableZoomOnClick,
    innerSize,
    spacing,
    leaf,
    tint,
    zoomType,
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
    waterfallPositiveColor,
    waterfallNegativeColor,
    waterfallTotalColor,
    waterfallSubtotalColor,
    hideConnectors,
    streamOffset,
    streamOrder,
    hideStreamLabels,
    streamLabelMinWidth,
    streamHoverOpacity,
    beeswarmSpread,
    unitLayout,
    clusterLabels,
    disableSortByGroup,
    arcRows,
    columns,
    fillFrom,
    split,
    tileColumns,
    splitMax,
    trackColor,
    unitValue,
    maxUnits,
    cellRadius,
    violinNormalize,
    violinSide,
    bandwidthScale,
    kdeBandwidth,
    kdeResolution,
    violinBox,
    violinWhiskers,
    hideViolinPoints,
    violinPointSize,
    violinJitter,
    unconstrainedViolinPoints,
    violinMaxPoints,
    dumbbellColors,
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
    crossfilter,
    onFilterChange,
    toolbar,
    animations,
    localeText,
    selectedDataPoints,
    defaultSelectedDataPoints = NO_POINTS,
    onDataPointSelection,
    allowMultipleDataPointsSelection,
    markerShape,
    fillPattern,
    strokeWidth,
    colorBlindMode,
    discreteMarkers,
    tooltip: tooltipMode,
    tooltipFixed,
    tooltipContent,
    legendAlign,
    showForSingleSeries,
    disableLegendToggle,
    customLegendItems,
    grid,
    gridRowColors,
    gridColumnColors,
    gridRowOpacity,
    gridColumnOpacity,
    xMin,
    xMax,
    xRange,
    xLabelRotate,
    xLabelRotateAlways,
    xaxisGroups,
    drilldown,
    drilldownPath,
    defaultDrilldownPath = NO_IDS,
    onDrilldownChange,
    measure,
    measurePinOnRelease,
    measures: measuresProp,
    defaultMeasures = NO_MEASURES,
    onMeasuresChange,
    onMeasured,
    onAnnotationChange,
    rangeBarGroupRows,
    disableRangeBarOverlap,
    hideZeroBarsWhenGrouped,
    dataReducer,
    dataReducerTargetPoints,
    dataReducerThreshold,
    forecastCount,
    forecastDashArray,
    forecastStrokeWidth,
    forecastFillOpacity,
    noDataText,
    noDataAlign,
    noDataVerticalAlign,
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
    projection,
    geoLayout,
    scaleMethod,
    scaleClasses,
    sphere,
    graticule,
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
    markerShape,
    fillPattern,
    strokeWidth,
    colorBlindMode,
    tooltip: tooltipMode,
    tooltipFixed,
    legendAlign,
    showForSingleSeries,
    disableLegendToggle,
    grid,
    gridRowOpacity,
    gridColumnOpacity,
    waterfallPositiveColor,
    waterfallNegativeColor,
    waterfallTotalColor,
    waterfallSubtotalColor,
    hideConnectors,
    streamOffset,
    streamOrder,
    hideStreamLabels,
    streamLabelMinWidth,
    streamHoverOpacity,
    beeswarmSpread,
    unitLayout,
    clusterLabels,
    disableSortByGroup,
    arcRows,
    columns,
    fillFrom,
    split,
    tileColumns,
    splitMax,
    trackColor,
    unitValue,
    maxUnits,
    cellRadius,
    violinNormalize,
    violinSide,
    bandwidthScale,
    kdeBandwidth,
    kdeResolution,
    violinBox,
    violinWhiskers,
    hideViolinPoints,
    violinPointSize,
    violinJitter,
    unconstrainedViolinPoints,
    violinMaxPoints,
    crossfilter,
    direction,
    layoutType,
    edgeStyle,
    enableExpandCollapse,
    disableZoomOnClick,
    innerSize,
    spacing,
    leaf,
    tint,
    zoomType,
    xMin,
    xMax,
    xRange,
    xLabelRotate,
    xLabelRotateAlways,
    measure,
    measurePinOnRelease,
    rangeBarGroupRows,
    disableRangeBarOverlap,
    hideZeroBarsWhenGrouped,
    dataReducer,
    dataReducerTargetPoints,
    dataReducerThreshold,
    forecastCount,
    forecastDashArray,
    forecastStrokeWidth,
    forecastFillOpacity,
    noDataAlign,
    noDataVerticalAlign,
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
  const color = (name: `data-ok-${string}`) => attributes[name] as ChartColor | undefined;
  const validPositive = color("data-ok-waterfall-positive-color");
  const validNegative = color("data-ok-waterfall-negative-color");
  const validTotalColor = color("data-ok-waterfall-total-color");
  const validSubtotal = color("data-ok-waterfall-subtotal-color");
  const connectorsOff = attributes["data-ok-hide-connectors"] !== undefined;
  const validStreamOffset = attributes["data-ok-stream-offset"] as ChartStreamOffset | undefined;
  const validStreamOrder = attributes["data-ok-stream-order"] as ChartStreamOrder | undefined;
  const streamLabelsOff = attributes["data-ok-hide-stream-labels"] !== undefined;
  const validStreamLabelMin = number("data-ok-stream-label-min-width");
  const validStreamHover = number("data-ok-stream-hover-opacity");
  const validBeeswarmSpread = attributes["data-ok-beeswarm-spread"] as
    | ChartBeeswarmSpread
    | undefined;
  const validUnitLayout = attributes["data-ok-unit-layout"] as ChartUnitLayout | undefined;
  const clusterLabelsOn = attributes["data-ok-cluster-labels"] !== undefined;
  const sortByGroupOff = attributes["data-ok-disable-sort-by-group"] !== undefined;
  const validArcRows = number("data-ok-arc-rows");
  const validColumns = number("data-ok-columns");
  const validFillFrom = attributes["data-ok-fill-from"] as ChartFillFrom | undefined;
  const splitOn = attributes["data-ok-split"] !== undefined;
  const validTileColumns = number("data-ok-tile-columns");
  const validSplitMax = number("data-ok-split-max");
  const validTrackColor = attributes["data-ok-track-color"] as ChartColor | undefined;
  const validUnitValue = number("data-ok-unit-value");
  const validMaxUnits = number("data-ok-max-units");
  const validCellRadius = number("data-ok-cell-radius");
  const validViolinNormalize = attributes["data-ok-violin-normalize"] as
    | ChartViolinNormalize
    | undefined;
  const validViolinSide = attributes["data-ok-violin-side"] as ChartViolinSide | undefined;
  const validBandwidthScale = number("data-ok-bandwidth-scale");
  const validKdeBandwidth = number("data-ok-kde-bandwidth");
  const validKdeResolution = number("data-ok-kde-resolution");
  const violinBoxOn = attributes["data-ok-violin-box"] !== undefined;
  const validWhiskers = attributes["data-ok-violin-whiskers"] as ChartViolinWhiskers | undefined;
  const violinPointsOff = attributes["data-ok-hide-violin-points"] !== undefined;
  const validViolinPointSize = number("data-ok-violin-point-size");
  const validViolinJitter = number("data-ok-violin-jitter");
  const violinUnconstrained = attributes["data-ok-unconstrained-violin-points"] !== undefined;
  const validViolinMax = number("data-ok-violin-max-points");
  const validCrossfilter = attributes["data-ok-crossfilter"] as ChartCrossfilter | undefined;
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
  const validShape = attributes["data-ok-marker-shape"] as ChartMarkerShape | undefined;
  const validPattern = attributes["data-ok-fill-pattern"] as ChartPattern | undefined;
  const validStrokeWidth = number("data-ok-stroke-width");
  const blind = attributes["data-ok-color-blind-mode"] !== undefined;
  const validTooltip = attributes["data-ok-tooltip-mode"] as ChartTooltipMode | undefined;
  const validCorner = attributes["data-ok-tooltip-fixed"] as ChartTooltipCorner | undefined;
  const validGrid = attributes["data-ok-grid"] as ChartGrid | undefined;
  const validRowOpacity = number("data-ok-grid-row-opacity");
  const validColumnOpacity = number("data-ok-grid-column-opacity");
  const single = attributes["data-ok-show-for-single-series"] !== undefined;
  const legendToggle = attributes["data-ok-disable-legend-toggle"] === undefined;
  const validDirection = attributes["data-ok-direction"] as ChartDirection | undefined;
  const validLayoutType = attributes["data-ok-layout-type"] as ChartLayoutType | undefined;
  const validEdgeStyle = attributes["data-ok-edge-style"] as ChartEdgeStyle | undefined;
  // Tree labels (4.18.86) as their attribute text: a stable key, parsed back for the layout.
  const labelText = chartTreeLabelText(externalLabel);
  const levelsText = chartTreeLabelLevelsText(externalLabelLevels);
  const treeLabel = useMemo(() => parseChartTreeLabel(labelText), [labelText]);
  const treeLabelLevels = useMemo(() => parseChartTreeLabelLevels(levelsText), [levelsText]);
  const expandCollapse = attributes["data-ok-enable-expand-collapse"] !== undefined;
  // Tree charts (ADR-0058): collapsed nodes, controlled or kept here.
  const [collapsed, setCollapsed] = useControllableState<readonly string[]>({
    value: collapsedNodes,
    defaultValue: defaultCollapsedNodes,
    onChange: onCollapsedNodesChange as ((value: readonly string[]) => void) | undefined,
  });
  // Sunburst and icicle charts: the drilled node, controlled or kept here.
  const [drill, setDrill] = useControllableState<string | null>({
    value: drillNode,
    defaultValue: defaultDrillNode,
    onChange: onDrillNodeChange,
  });
  const zoomOnClickOff = attributes["data-ok-disable-zoom-on-click"] !== undefined;
  const validInnerSize = number("data-ok-inner-size");
  const validSpacing = number("data-ok-spacing");
  const validLeaf = attributes["data-ok-leaf"] as ChartLeaf | undefined;
  const validTint = number("data-ok-tint");
  const validZoomType = attributes["data-ok-zoom-type"] as ChartZoomType | undefined;
  const validXMin = number("data-ok-x-min");
  const validXMax = number("data-ok-x-max");
  const validXRange = number("data-ok-x-range");
  const validXRotate = number("data-ok-x-label-rotate");
  const xRotateAlways = attributes["data-ok-x-label-rotate-always"] !== undefined;
  // Drilldown (4.18.68): the path of levels opened, controlled or kept here.
  const [levelPath, setLevelPath] = useControllableState<readonly string[]>({
    value: drilldownPath,
    defaultValue: defaultDrilldownPath,
    onChange: onDrilldownChange as ((value: readonly string[]) => void) | undefined,
  });
  // Measure rulers and draggable annotations (4.18.20).
  const validMeasure = attributes["data-ok-measure"] as ChartMeasureMode | undefined;
  const pinOn = attributes["data-ok-measure-pin-on-release"] !== undefined;
  const [rulers, setRulers] = useControllableState<readonly ChartMeasure[]>({
    value: measuresProp,
    defaultValue: defaultMeasures,
    onChange: onMeasuresChange as ((value: readonly ChartMeasure[]) => void) | undefined,
  });
  const validRulers = useMemo(() => chartMeasures(rulers), [rulers]);
  const [measuring, setMeasuring] = useState(false);
  const [rulerPreview, setRulerPreview] = useState<ChartMeasure | null>(null);
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null);
  /** Annotations moved here but not yet given back through `annotations` (by index). */
  const [moved, setMoved] = useState<ReadonlyMap<number, ChartAnnotation>>(() => new Map());
  const [picked, setPicked] = useState<number | null>(null);
  const lastPicked = useRef(-1);
  // New annotations from the owner replace the moves made here.
  const [annotationSource, setAnnotationSource] = useState(annotations);
  if (annotationSource !== annotations) {
    setAnnotationSource(annotations);
    setMoved(new Map());
  }
  const shownAnnotations = useMemo(
    () =>
      moved.size === 0
        ? annotations
        : (annotations ?? []).map((entry, index) => moved.get(index) ?? entry),
    [annotations, moved],
  );
  /** Positions in `annotations` of the valid ones (core indexes them in that order). */
  const annotationIndexes = useMemo(
    () => chartAnnotationIndexes(shownAnnotations),
    [shownAnnotations],
  );
  const drawnRulers = useMemo(
    () => (rulerPreview ? [...(pinOn ? validRulers : []), rulerPreview] : validRulers),
    [rulerPreview, pinOn, validRulers],
  );
  const groupRowsOn = attributes["data-ok-range-bar-group-rows"] !== undefined;
  const overlapOff = attributes["data-ok-disable-range-bar-overlap"] !== undefined;
  const hideZeroOn = attributes["data-ok-hide-zero-bars-when-grouped"] !== undefined;
  const reducerOn = attributes["data-ok-data-reducer"] !== undefined;
  const validReducerTarget = number("data-ok-data-reducer-target-points");
  const validReducerThreshold = number("data-ok-data-reducer-threshold");
  const validForecastCount = number("data-ok-forecast-count");
  const validForecastDash = number("data-ok-forecast-dash-array");
  const validForecastWidth = number("data-ok-forecast-stroke-width");
  const validForecastOpacity = number("data-ok-forecast-fill-opacity");
  const validNoDataAlign = attributes["data-ok-no-data-align"] as ChartNoDataAlign | undefined;
  const validNoDataVertical = attributes["data-ok-no-data-vertical-align"] as
    | ChartNoDataVerticalAlign
    | undefined;
  // Several brush targets are one attribute text, so linking depends on a stable value.
  const brushTargets = Array.isArray(brushTarget)
    ? brushTarget.filter(Boolean).join(" ") || undefined
    : (brushTarget as string | undefined);

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
  // Crossfilter (4.18.19, ADR-0054): the group's filter as the registry told it, and the status.
  const [groupFilter, setGroupFilter] = useState<ChartGroupFilter | null>(null);
  const [filterStatus, setFilterStatus] = useState("");
  const shownFilter = groupFilter && !groupFilter.own ? groupFilter.categories : null;

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
        geometry,
        regions,
        joinBy,
        projection,
        geoLayout,
        hexCells,
        scaleMethod,
        scaleClasses,
        scaleThresholds,
        sphere,
        graticule,
        hierarchy,
        direction: validDirection,
        layoutType: validLayoutType,
        edgeStyle: validEdgeStyle,
        externalLabel: treeLabel,
        externalLabelLevels: treeLabelLevels,
        enableExpandCollapse: expandCollapse,
        collapsedNodes: collapsed,
        drillNode: drill,
        disableZoomOnClick: zoomOnClickOff,
        innerSize: validInnerSize,
        spacing: validSpacing,
        leaf: validLeaf,
        tint: validTint,
        zoomType: validZoomType,
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
        markerShape: validShape,
        fillPattern: validPattern,
        strokeWidth: validStrokeWidth,
        colorBlindMode: blind,
        discreteMarkers,
        tooltip: validTooltip,
        showForSingleSeries: single,
        customLegendItems,
        grid: validGrid,
        gridRowColors,
        gridColumnColors,
        gridRowOpacity: validRowOpacity,
        gridColumnOpacity: validColumnOpacity,
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
        waterfallPositiveColor: validPositive,
        waterfallNegativeColor: validNegative,
        waterfallTotalColor: validTotalColor,
        waterfallSubtotalColor: validSubtotal,
        hideConnectors: connectorsOff,
        streamOffset: validStreamOffset,
        streamOrder: validStreamOrder,
        hideStreamLabels: streamLabelsOff,
        streamLabelMinWidth: validStreamLabelMin,
        streamHoverOpacity: validStreamHover,
        beeswarmSpread: validBeeswarmSpread,
        unitLayout: validUnitLayout,
        clusterLabels: clusterLabelsOn,
        disableSortByGroup: sortByGroupOff,
        arcRows: validArcRows,
        columns: validColumns,
        fillFrom: validFillFrom,
        split: splitOn,
        tileColumns: validTileColumns,
        splitMax: validSplitMax,
        trackColor: validTrackColor,
        unitValue: validUnitValue,
        maxUnits: validMaxUnits,
        cellRadius: validCellRadius,
        violinNormalize: validViolinNormalize,
        violinSide: validViolinSide,
        bandwidthScale: validBandwidthScale,
        kdeBandwidth: validKdeBandwidth,
        kdeResolution: validKdeResolution,
        violinBox: violinBoxOn,
        violinWhiskers: validWhiskers,
        hideViolinPoints: violinPointsOff,
        violinPointSize: validViolinPointSize,
        violinJitter: validViolinJitter,
        unconstrainedViolinPoints: violinUnconstrained,
        violinMaxPoints: validViolinMax,
        dumbbellColors,
        dataLabelBackground,
        dataLabelFormatter,
        legendValues,
        colorRanges,
        annotations: shownAnnotations,
        drilldown,
        drilldownPath: levelPath,
        measures: drawnRulers,
        measureMode: validMeasure,
        pickedAnnotation: picked === null ? undefined : annotationIndexes.indexOf(picked),
        partLabels: localeText,
        zoom: zoomControlled ? zoomRange : innerZoom.range,
        zoomFrom: zoomControlled ? undefined : innerZoom.from,
        selection: brushTargets ? selection : preview,
        brush: Boolean(brushTargets),
        selectedDataPoints: validSelected,
        crossfilter: validCrossfilter,
        filter: shownFilter,
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
        xMin: validXMin,
        xMax: validXMax,
        xRange: validXRange,
        xLabelRotate: validXRotate,
        xLabelRotateAlways: xRotateAlways,
        xaxisGroups,
        rangeBarGroupRows: groupRowsOn,
        disableRangeBarOverlap: overlapOff,
        hideZeroBarsWhenGrouped: hideZeroOn,
        dataReducer: reducerOn,
        dataReducerTargetPoints: validReducerTarget,
        dataReducerThreshold: validReducerThreshold,
        forecastCount: validForecastCount,
        forecastDashArray: validForecastDash,
        forecastStrokeWidth: validForecastWidth,
        forecastFillOpacity: validForecastOpacity,
        noDataText,
        noDataAlign: validNoDataAlign,
        noDataVerticalAlign: validNoDataVertical,
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
      geometry,
      regions,
      joinBy,
      projection,
      geoLayout,
      hexCells,
      scaleMethod,
      scaleClasses,
      scaleThresholds,
      sphere,
      graticule,
      hierarchy,
      validDirection,
      validLayoutType,
      validEdgeStyle,
      treeLabel,
      treeLabelLevels,
      expandCollapse,
      collapsed,
      drill,
      zoomOnClickOff,
      validInnerSize,
      validSpacing,
      validLeaf,
      validTint,
      validZoomType,
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
      validShape,
      validPattern,
      validStrokeWidth,
      blind,
      discreteMarkers,
      validTooltip,
      single,
      customLegendItems,
      validGrid,
      gridRowColors,
      gridColumnColors,
      validRowOpacity,
      validColumnOpacity,
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
      validPositive,
      validNegative,
      validTotalColor,
      validSubtotal,
      connectorsOff,
      validStreamOffset,
      validStreamOrder,
      streamLabelsOff,
      validStreamLabelMin,
      validStreamHover,
      validBeeswarmSpread,
      validUnitLayout,
      clusterLabelsOn,
      sortByGroupOff,
      validArcRows,
      validColumns,
      validFillFrom,
      splitOn,
      validTileColumns,
      validSplitMax,
      validTrackColor,
      validUnitValue,
      validMaxUnits,
      validCellRadius,
      validViolinNormalize,
      validViolinSide,
      validBandwidthScale,
      validKdeBandwidth,
      validKdeResolution,
      violinBoxOn,
      validWhiskers,
      violinPointsOff,
      validViolinPointSize,
      validViolinJitter,
      violinUnconstrained,
      validViolinMax,
      dumbbellColors,
      dataLabelBackground,
      dataLabelFormatter,
      legendValues,
      colorRanges,
      shownAnnotations,
      drilldown,
      levelPath,
      drawnRulers,
      validMeasure,
      picked,
      annotationIndexes,
      localeText,
      zoomControlled,
      zoomRange,
      innerZoom,
      brushTargets,
      selection,
      preview,
      validSelected,
      validCrossfilter,
      shownFilter,
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
      validXMin,
      validXMax,
      validXRange,
      validXRotate,
      xRotateAlways,
      xaxisGroups,
      groupRowsOn,
      overlapOff,
      hideZeroOn,
      reducerOn,
      validReducerTarget,
      validReducerThreshold,
      validForecastCount,
      validForecastDash,
      validForecastWidth,
      validForecastOpacity,
      noDataText,
      validNoDataAlign,
      validNoDataVertical,
    ],
  );
  const { layout } = render;
  const renderRef = useRef(render);
  renderRef.current = render;
  const kind = render.data.xType === "numeric" ? "value" : "index";
  /** Gestures and keys: zoomable charts zoom, brush charts move their selection. */
  const gestureMode: ChartGestureMode = brushTargets
    ? "brush"
    : measuring && validMeasure
      ? "measure"
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
    // Crossfilter: a brush filters its group by the categories it covers.
    if (validCrossfilter) publishFilter(chartBrushCategories(range));
  };
  const setBrushRef = useRef(setBrush);
  setBrushRef.current = setBrush;
  /** The range gestures and keys change: the zoom, or a brush chart's selection. */
  const currentRange = () => (brushTargets ? selection : render.zoom);
  const commitRange = (range: ChartZoom | null) =>
    brushTargets ? setBrush(range) : setZoom(range, "user");

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

  /** Crossfilter: this chart's selection or brush now filters these categories; announced here. */
  const publishFilter = (categories: number[] | null) => {
    const link = linkRef.current;
    if (!link || !group) return;
    // Clearing only matters when this chart's filter is the group's.
    if (!categories && !groupFilterRef.current?.own) return;
    link.filtered(categories);
    const current = renderRef.current;
    setFilterStatus(
      chartFilterText(current.data, categories, current.format.title, localeText ?? {}),
    );
  };
  const groupFilterRef = useRef(groupFilter);
  groupFilterRef.current = groupFilter;
  const onFilterRef = useRef(onFilterChange);
  onFilterRef.current = onFilterChange;
  const selectedRef = useRef(validSelected);
  selectedRef.current = validSelected;

  const figureRef = useRef<HTMLElement>(null);
  const mergedRef = useMergedRefs(ref, figureRef);
  const elementId = rest.id;

  // Synchronized groups and brush charts (phase 4): linked by `group`, `id` and `brushTarget`.
  useEffect(() => {
    if (!group && !brushTargets && !elementId) return;
    const link = linkChart({
      id: elementId,
      group,
      brushTarget: brushTargets,
      zoom: () => renderRef.current.zoom,
      showIndex: (index) => {
        // The keyboard drives a focused plot: another chart of the group (a pointer leaving it
        // after a layout shift) must not take its active point.
        if (plotRef.current?.contains(document.activeElement)) return;
        const next: ChartActive | null = index === null ? null : { kind: "index", index };
        if (sameChartActive(next, activeRef.current)) return;
        activeRef.current = next;
        setActiveState(next);
      },
      applyZoom: (range, reason) => setZoomRef.current(range, reason),
      select: (range) => setSelection(range),
      ...(validCrossfilter
        ? {
            filter: (next: ChartGroupFilter | null) => {
              setGroupFilter(next);
              onFilterRef.current?.(next ? [...next.categories] : null, next?.own ?? false);
            },
            cleared: () => clearOwnRef.current(),
          }
        : {}),
    });
    linkRef.current = link;
    // A chart linking again (new options) still filters with its selection.
    if (validCrossfilter && group) {
      const own = chartFilterCategories(renderRef.current.data, selectedRef.current);
      if (own) link.filtered(own);
    }
    return () => {
      link.unlink();
      linkRef.current = null;
      setGroupFilter(null);
    };
  }, [elementId, group, brushTargets, validCrossfilter]);

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
      measure: (from, to, end) => measureRef.current(from, to, end),
      annotationAt: (point) => {
        const hits = renderRef.current.annotationHits;
        return hits ? chartAnnotationAt(hits, point.px, point.py) : undefined;
      },
      dragAnnotation: (index, from, to, end) => dragRef.current(index, from, to, end),
    });
    gesturesRef.current = gestures;
    return () => gestures.destroy();
  }, []);
  const selectionRef = useRef(selection);
  selectionRef.current = selection;

  /** Adds a ruler (or replaces the last one without pinning) and announces it. */
  const addRuler = (ruler: ChartMeasure) => {
    const next = [...(pinOn ? validRulers : []), ruler].slice(-20);
    setRulers(next);
    const text = chartMeasureText(render.data, render.format, ruler);
    setStatus(text);
    onMeasured?.({ measure: ruler, measures: next, text });
  };
  /** Measure mode: a drag draws a ruler between its ends. */
  const measureDrag = (from: ChartPxPoint, to: ChartPxPoint, end: boolean) => {
    const current = renderRef.current.layout;
    const a = chartMeasureAt(current, from.px, from.py);
    const b = chartMeasureAt(current, to.px, to.py);
    if (!a || !b || !validMeasure) return;
    const ruler = chartMeasureBetween(current, validMeasure, a, b);
    if (!end) setRulerPreview(ruler);
    else {
      setRulerPreview(null);
      addRuler(ruler);
    }
  };
  const measureRef = useRef(measureDrag);
  measureRef.current = measureDrag;
  /** The annotation at a position of the shown list, moved (a drag or the keyboard). */
  const moveAnnotation = (index: number, next: ChartAnnotation, end: boolean) => {
    setMoved((map) => new Map(map).set(index, next));
    if (end) onAnnotationChange?.({ index, annotation: next });
  };
  const annotationDrag = (hit: number, from: ChartPxPoint, to: ChartPxPoint, end: boolean) => {
    const index = annotationIndexes[hit];
    const source = index === undefined ? undefined : annotations?.[index];
    if (index === undefined || !source) return;
    const valid = chartAnnotations([source])[0];
    if (!valid) return;
    const next = dragChartAnnotation(renderRef.current.layout, render.data, valid, from, to);
    moveAnnotation(index, next, end);
    if (end) setStatus(chartAnnotationText(next));
  };
  const dragRef = useRef(annotationDrag);
  dragRef.current = annotationDrag;

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
      chartTooltipFixed(validCorner, layout, scale),
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
    // Crossfilter: the selection's categories filter the group.
    if (validCrossfilter) publishFilter(chartFilterCategories(render.data, next));
  };
  /** Crossfilter: the group's filter was cleared elsewhere: this chart's selection goes too. */
  const clearOwn = () => {
    const previous = selectedRef.current;
    if (previous.length === 0) return;
    setSelected([]);
    for (const entry of previous)
      onSelectionRef.current?.({ ...entry, selected: false, selectedDataPoints: [] });
  };
  const clearOwnRef = useRef(clearOwn);
  clearOwnRef.current = clearOwn;
  /** Hierarchy charts: the node to make active once the chart has redrawn after an action. */
  const focusRef = useRef<string | null>(null);
  /**
   * Hierarchy charts: what a click, Enter or Space on a node does (expand or collapse it).
   * Returns whether the press did something.
   */
  const act = (action: ChartHierarchyAction | null) => {
    if (!action) return false;
    if (action.kind === "toggle") {
      focusRef.current = action.id;
      setCollapsed(toggleChartCollapsed(collapsed, action.id));
      return true;
    }
    if (!layout.hierarchy?.drillable) return false;
    focusRef.current = action.focus;
    setDrill(action.id);
    return true;
  };
  /** The **Back** button: one level up; at the top the button hides and the plot takes focus. */
  /** Drilldown: opens a level (or goes back to `path`); the active item is cleared. */
  const drillTo = (path: readonly string[]) => {
    setLevelPath(path);
    setActive(null);
  };
  const levels = render.drilldown;
  const drillUp = () => {
    if (levels) {
      if (levels.path.length === 0) return;
      drillTo(levels.path.slice(0, -1));
      if (levels.path.length === 1) plotRef.current?.focus();
      return;
    }
    const action = chartDrillUp(layout);
    act(action);
    if (action?.id === null) plotRef.current?.focus();
  };
  // After an action, the node acted on stays active (its mark may have moved).
  useLayoutEffect(() => {
    const id = focusRef.current;
    if (id === null) return;
    focusRef.current = null;
    const mark = chartTreeMarkOf(layout, id);
    setActive(mark === null ? null : { kind: "mark", mark });
  });
  // A click selects the point, slice or cell under the pointer (not after a drag or on brushes).
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    if (brushTargets || gesturesRef.current?.moved) return;
    const box = event.currentTarget.getBoundingClientRect();
    const scale = layout.width / (box.width || layout.width);
    if (layout.mode === "tree") {
      // Hierarchy charts: the node under the pointer expands, collapses or drills.
      const hit = chartActiveAt(
        layout,
        (event.clientX - box.left) * scale,
        (event.clientY - box.top) * scale,
      );
      act(chartHierarchyAction(layout, hit?.kind === "mark" ? hit.mark : null));
      return;
    }
    const mark = chartMarkAt(
      layout,
      (event.clientX - box.left) * scale,
      (event.clientY - box.top) * scale,
    );
    // Drilldown: a point with a level opens it instead of being selected.
    const level = mark === null ? undefined : layout.marks[mark]?.drilldown;
    if (levels && level) {
      drillTo([...levels.path, level]);
      return;
    }
    if (mark !== null)
      select([chartMarkPoint(layout.marks[mark] as (typeof layout.marks)[number])]);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (annotationKey(event)) {
      event.preventDefault();
      return;
    }
    if (measureKey(event)) {
      event.preventDefault();
      return;
    }
    if (
      (event.key === "Enter" || event.key === " ") &&
      !event.repeat &&
      layout.mode === "tree" &&
      act(
        chartHierarchyAction(
          layout,
          activeRef.current?.kind === "mark" ? activeRef.current.mark : null,
        ),
      )
    ) {
      event.preventDefault();
      return;
    }
    const level = levels ? chartDrilldownActive(layout, activeRef.current) : undefined;
    if ((event.key === "Enter" || event.key === " ") && !event.repeat && levels && level) {
      event.preventDefault();
      drillTo([...levels.path, level]);
      return;
    }
    if (event.key === "Escape" && levels && levels.path.length > 0) {
      event.preventDefault();
      drillTo(levels.path.slice(0, -1));
      return;
    }
    if ((event.key === "Enter" || event.key === " ") && !event.repeat && !brushTargets) {
      // Enter or Space selects the active item's points (a category: every series' point).
      const marks = chartActiveMarks(layout, activeRef.current);
      if (marks.length === 0) return;
      event.preventDefault();
      select(
        marks.map((mark) => chartMarkPoint(layout.marks[mark] as (typeof layout.marks)[number])),
      );
      return;
    }
    if (event.key === "Escape" && act(chartDrillUp(layout))) {
      // Sunburst and icicle charts: one level up before anything else.
      event.preventDefault();
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

  /**
   * The keyboard alternative to dragging annotations (WCAG 2.5.7): A picks up the next draggable
   * one, arrows move it, Enter, Space or Escape drops it. Returns whether the key was used.
   */
  function annotationKey(event: KeyboardEvent<HTMLDivElement>) {
    const draggable = (render.annotationHits ?? []).map((hit) => hit.index);
    if (picked !== null) {
      const index = picked;
      const current = shownAnnotations?.[index];
      const valid = current ? chartAnnotations([current])[0] : undefined;
      if (event.key === "Enter" || event.key === " " || event.key === "Escape") {
        setPicked(null);
        if (valid) {
          moveAnnotation(index, valid, true);
          setStatus(
            `${localeText?.annotationDropped ?? chartToolLabels.annotationDropped}: ${chartAnnotationText(valid)}`,
          );
        }
        return true;
      }
      const next = valid ? chartAnnotationKey(layout, render.data, valid, event.key) : undefined;
      if (!next) return false;
      moveAnnotation(index, next, false);
      setStatus(chartAnnotationText(next));
      return true;
    }
    if (event.key.toLowerCase() !== "a" || event.ctrlKey || event.metaKey || event.altKey)
      return false;
    if (draggable.length === 0) return false;
    // A again picks the next draggable annotation after the last one picked.
    const positions = draggable.map((hit) => annotationIndexes[hit] as number);
    const next = positions.find((index) => index > lastPicked.current) ?? positions[0];
    if (next === undefined) return false;
    lastPicked.current = next;
    setPicked(next);
    const entry = chartAnnotations([shownAnnotations?.[next] as ChartAnnotation])[0];
    if (entry) setStatus(chartAnnotationText(entry));
    return true;
  }
  /**
   * The keyboard alternative to measuring with a drag: in measure mode Enter or Space at one point
   * sets where the ruler starts, at another adds it; Escape forgets the start.
   */
  function measureKey(event: KeyboardEvent<HTMLDivElement>) {
    if (!measuring || !validMeasure) return false;
    if (event.key === "Escape" && anchor) {
      setAnchor(null);
      return true;
    }
    if ((event.key !== "Enter" && event.key !== " ") || event.repeat) return false;
    const at = chartMeasureActive(layout, activeRef.current);
    if (!at) return false;
    if (!anchor) {
      setAnchor(at);
      setStatus(
        `${localeText?.measureFrom ?? chartToolLabels.measureFrom} ${chartMeasureText(render.data, render.format, { x1: at.x, y1: at.y, x2: at.x, y2: at.y }).split(" → ")[0]}`,
      );
    } else {
      setAnchor(null);
      addRuler(chartMeasureBetween(layout, validMeasure, anchor, at));
    }
    return true;
  }

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

  const tools =
    toolbar || validMeasure
      ? chartToolbar({
          zoom: Boolean(toolbar) && zoomOn && render.zoomable,
          zoomed: render.zoom !== null,
          pan,
          text: localeText,
          measure: Boolean(validMeasure) && render.zoomable,
          measuring,
          measured: validRulers.length > 0,
          downloads: Boolean(toolbar),
        })
      : [];
  const runTool = (tool: ChartTool) => {
    if (tool === "measure") {
      setMeasuring((on) => !on);
      setPan(false);
      setAnchor(null);
    } else if (tool === "clearMeasures") {
      setRulers([]);
      setStatus("");
    } else if (tool === "pan") {
      setPan((on) => !on);
      setMeasuring(false);
    } else if (tool === "reset") setZoom(null, "user");
    else if (tool === "zoomIn" || tool === "zoomOut")
      setZoom(zoomChartBy(render.zoom, render.extent, kind, tool === "zoomIn" ? 0.5 : 2), "user");
    else {
      setStatus("");
      exportChart(figureRef.current as HTMLElement, tool as ChartExportFormat).catch(() =>
        setStatus(localeText?.exportFailed ?? chartToolLabels.exportFailed),
      );
    }
  };
  const annotationItems = chartAnnotationItems(shownAnnotations ?? []);

  return (
    <figure
      ref={mergedRef}
      {...attributes}
      {...chartTextAttributes({
        type: chartType,
        colors: chartType === "geo" ? colors : undefined,
        yTitle,
        totalLabel,
        valuePrefix,
        valueSuffix,
        locale,
        group,
        brushTarget: brushTargets,
        xaxisGroups,
        noDataText,
        colorRanges,
        joinBy,
        scaleThresholds,
        axisTitles,
        indicators,
        yaxis,
        xTitle,
        backgroundBarColors,
        discreteMarkers,
        customLegendItems,
        gridRowColors,
        gridColumnColors,
        dumbbellColors,
        collapsedNodes: collapsed,
        drillNode: drill,
        drilldownPath: levels?.path,
        externalLabel: treeLabel,
        externalLabelLevels: treeLabelLevels,
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
          {render.legend.map((item) => {
            const content = (
              <>
                <span
                  data-ok-chart-legend-marker=""
                  data-ok-shape={item.shape}
                  data-ok-pattern={item.pattern}
                />
                {item.name}
                {item.value !== undefined && (
                  <span data-ok-chart-legend-value="">{item.value}</span>
                )}
              </>
            );
            // Without toggling (4.18.64), items are labels, not buttons.
            return legendToggle ? (
              <button
                key={item.index}
                type="button"
                data-ok-chart-legend-item=""
                data-ok-color={item.color}
                aria-pressed={!item.hidden}
                onClick={() => toggle(item.index)}
              >
                {content}
              </button>
            ) : (
              <span key={item.index} data-ok-chart-legend-item="" data-ok-color={item.color}>
                {content}
              </span>
            );
          })}
        </div>
      )}
      {levels ? (
        <div data-ok-chart-drill="">
          <button
            type="button"
            data-ok-chart-drill-up=""
            hidden={levels.path.length === 0}
            onClick={drillUp}
          >
            {localeText?.drillUp ?? chartDrillLabels.drillUp}
          </button>
          <span data-ok-chart-drill-path="" role="status">
            {levels.text}
          </span>
        </div>
      ) : (
        layout.hierarchy?.drillable &&
        layout.hierarchy.type !== "tree" && (
          <div data-ok-chart-drill="">
            <button
              type="button"
              data-ok-chart-drill-up=""
              hidden={layout.hierarchy.drill === null}
              onClick={drillUp}
            >
              {localeText?.drillUp ?? chartDrillLabels.drillUp}
            </button>
            <span data-ok-chart-drill-path="" role="status">
              {layout.hierarchy.path.join(" › ")}
            </span>
          </div>
        )
      )}
      {/* A focusable group (biome.json override): arrow keys move through the chart's values. */}
      <div
        ref={plotRef}
        data-ok-chart-plot=""
        role="group"
        aria-roledescription="chart"
        aria-label={render.noData ? `${label}: ${render.noData}` : label}
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
          {shown && tooltipContent && active
            ? tooltipContent(chartTooltipContext(layout, shown, active))
            : shown && (
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
                        <span
                          data-ok-chart-tooltip-marker=""
                          data-ok-color={row.color}
                          data-ok-shape={row.shape}
                          data-ok-pattern={row.pattern}
                        />
                        <span>{row.name}</span>
                        <span data-ok-chart-tooltip-value="">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
        </div>
      </div>
      {tools.length === 0 && render.annotationHits && (
        <span data-ok-chart-status="" role="status">
          {status}
        </span>
      )}
      {validCrossfilter && (
        <div data-ok-chart-filter="">
          <button
            type="button"
            data-ok-chart-filter-clear=""
            hidden={!groupFilter}
            onClick={() => {
              linkRef.current?.clearFilter();
              setFilterStatus(localeText?.filterCleared ?? chartFilterLabels.filterCleared);
            }}
          >
            {localeText?.clearFilter ?? chartFilterLabels.clearFilter}
          </button>
          <span data-ok-chart-filter-status="" role="status">
            {filterStatus}
          </span>
        </div>
      )}
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
      {levels?.tables.map((level) => (
        <table key={level.id} data-ok-chart-drilldown={level.id} data-ok-type={level.type}>
          <caption>{level.name}</caption>
          <ChartTableRows table={level.table} />
        </table>
      ))}
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
