import { type ChartBeeswarmSpread, chartBeeswarmSpreads } from "../chart/chart-beeswarm.js";
import {
  type ChartGeoLayout,
  type ChartImageFit,
  type ChartPixelShape,
  type ChartProjection,
  type ChartScaleMethod,
  chartGeoLayouts,
  chartImageFits,
  chartPixelShapes,
  chartProjections,
  chartScaleMethods,
} from "../chart/chart-geo.js";
import {
  type ChartDirection,
  type ChartEdgeStyle,
  type ChartLayoutType,
  type ChartLeaf,
  type ChartZoomType,
  chartDirections,
  chartEdgeStyles,
  chartLayoutTypes,
  chartLeaves,
  chartZoomTypes,
} from "../chart/chart-hierarchy.js";
import { type ChartMeasureMode, chartMeasureModes } from "../chart/chart-measure.js";
import {
  type ChartColor,
  type ChartCrossfilter,
  type ChartCurve,
  type ChartDataLabelPosition,
  type ChartFill,
  type ChartGrid,
  type ChartLegend,
  type ChartLegendAlign,
  type ChartMarkerShape,
  type ChartNoDataAlign,
  type ChartNoDataVerticalAlign,
  type ChartPattern,
  type ChartStackType,
  type ChartTooltipCorner,
  type ChartTooltipMode,
  type ChartType,
  type ChartXType,
  chartColors,
  chartCrossfilters,
  chartCurves,
  chartDataLabelPositions,
  chartFills,
  chartGrids,
  chartLegendAligns,
  chartLegends,
  chartMarkerShapes,
  chartNoDataAligns,
  chartNoDataVerticalAligns,
  chartPatterns,
  chartStackTypes,
  chartTooltipCorners,
  chartTooltipModes,
  chartTypes,
  chartXTypes,
} from "../chart/chart-model.js";
import { type ChartOrientation, chartOrientations } from "../chart/chart-sankey.js";
import {
  type ChartStreamOffset,
  type ChartStreamOrder,
  chartStreamOffsets,
  chartStreamOrders,
} from "../chart/chart-stream.js";
import { type ChartFillFrom, chartFillFroms } from "../chart/chart-unit.js";
import { type ChartUnitLayout, chartUnitLayouts } from "../chart/chart-unit-layouts.js";
import {
  type ChartViolinNormalize,
  type ChartViolinSide,
  type ChartViolinWhiskers,
  chartViolinNormalize,
  chartViolinSides,
  chartViolinWhiskers,
} from "../chart/chart-violin.js";
import {
  type DataAttributes,
  defineOptions,
  flag,
  number,
  optionAttributes,
  state,
  style,
} from "../options/define.js";

// --- Chart (ADR-0024) ---------------------------------------------------------------------------

export const chartOptions = defineOptions("chart", "data-ok-chart", {
  type: style(
    "data-ok-type",
    chartTypes,
    "line",
    "Chart type: `line`, `area`, `bar` (columns; rows with `horizontal`), `scatter`, `pie`, `donut`, `radialBar`, `radar`, `boxPlot`, `heatmap`, `treemap`, `bubble`, `rangeArea`, `funnel`, `slope`, `candlestick`, `rangeBar`, `timeline`, `polarArea`, `sankey` (links between nodes: `nodes` and `edges` in React, one table row per link in HTML), `waterfall` (each value a step from the running total; `isTotal` / `isSubtotal` points show the total), `dumbbell` (a start and an end value per category: two markers joined by a line), `tree` (a hierarchy: `hierarchy` in React, one table row per node with its parent in HTML), `sunburst` (the same hierarchy as rings, each node an arc sized by its value), `icicle` (the same hierarchy as bands, each node a cell sized by its value), `streamgraph` (stacked bands around a moving baseline, with a total per x value), `violin` (the distribution of observations per category as a mirrored density curve), `beeswarm` (each observation a dot in its series' lane, along the value axis), `waffle` (a grid of cells, each category filling a share), `unit` (each value as a number of marks, in blobs, columns or an arc) or `geo` (regions of GeoJSON geometry or hex tiles, colored by value classes, no map tiles: `geometry` and `regions` in React, a table of regions and `data-ok-geometry` or `setGeometry()` in HTML). Series may override it in line, area, bar, scatter, box plot, bubble, range area and candlestick charts (mixed charts).",
  ),
  xType: style(
    "data-ok-x-type",
    chartXTypes,
    "category",
    "X axis: `category` labels, `datetime` (ISO 8601 dates) or `numeric` values (scatter).",
  ),
  curve: style(
    "data-ok-curve",
    chartCurves,
    "smooth",
    "Line shape: `smooth`, `straight` or `stepline`.",
  ),
  legend: style(
    "data-ok-legend",
    chartLegends,
    "top",
    "Legend position: `top`, `right`, `bottom` or `none` (never shown for a single series).",
  ),
  fill: style(
    "data-ok-fill",
    chartFills,
    "gradient",
    "Area fill: a fading `gradient`, a `solid` tint or a `pattern` (bars, areas and slices too; a different pattern per series unless `fillPattern` is set).",
  ),
  stacked: flag("data-ok-stacked", "Stacks the series on each other (bars, lines, areas)."),
  horizontal: flag("data-ok-horizontal", "Bars run left to right, categories down the side."),
  height: number("data-ok-height", 320, "Height of the plot in px (at least 40, sparklines 8).", {
    min: 8,
  }),
  markerSize: number(
    "data-ok-marker-size",
    undefined,
    "Marker radius of line and area points in px (default none; scatter points 5).",
    { min: 0 },
  ),
  columnWidth: number("data-ok-column-width", 40, "Column width in % of a category.", { min: 1 }),
  barHeight: number(
    "data-ok-bar-height",
    undefined,
    "Horizontal bar thickness in % of a category (default 40; funnels 80).",
    { min: 1 },
  ),
  yMin: number(
    "data-ok-y-min",
    undefined,
    "Lowest value on the value axis (default from the data).",
  ),
  yMax: number(
    "data-ok-y-max",
    undefined,
    "Highest value on the value axis (default from the data); radial bars: the value of a full ring (default 100).",
  ),
  dataLabels: flag(
    "data-ok-data-labels",
    "Prints the values on the chart: percentages on pie and donut slices, values in bars and above points.",
  ),
  startAngle: number(
    "data-ok-start-angle",
    0,
    "Pie, donut and radial bar: where the slices or rings start, in degrees clockwise from 12 o'clock.",
  ),
  endAngle: number(
    "data-ok-end-angle",
    360,
    "Pie, donut and radial bar: where they end (at most one turn after `startAngle`).",
  ),
  dashArray: number(
    "data-ok-dash-array",
    undefined,
    "Dash length of lines and radial bars in px (default solid).",
    { min: 0 },
  ),
  trackWidth: number("data-ok-track-width", 50, "Radial bar track thickness in % of the bar.", {
    min: 0,
  }),
  total: number(
    "data-ok-total",
    undefined,
    "Donut and radial bar center: the total shown under `totalLabel` (default the sum; radial bars the average). Waffle charts: the cells shared out between the categories (`100` for a percentage waffle; default one cell per unit); split waffles: the cells of each tile (default 100).",
  ),
  sparkline: flag(
    "data-ok-sparkline",
    "No axes, grid or legend: the chart fills its container (cards, table cells). Its height is the container's, at least `height` (default 40px).",
  ),
  boxUpperColor: style(
    "data-ok-box-upper-color",
    chartColors,
    "primary",
    "Box plots: color of the box above the median (default the series color).",
    { optional: true },
  ),
  boxLowerColor: style(
    "data-ok-box-lower-color",
    chartColors,
    "primary",
    "Box plots: color of the box below the median (default a lighter tone of the series color).",
    { optional: true },
  ),
  candleUpColor: style(
    "data-ok-candle-up-color",
    chartColors,
    "success",
    "Candlesticks: color of rising candles (default `success`).",
    { optional: true },
  ),
  candleDownColor: style(
    "data-ok-candle-down-color",
    chartColors,
    "error",
    "Candlesticks: color of falling candles (default `error`).",
    { optional: true },
  ),
  donutSize: number(
    "data-ok-donut-size",
    undefined,
    "Donut hole in % of the radius (10 to 95; default 72).",
    {
      min: 10,
    },
  ),
  dataLabelBackground: flag(
    "data-ok-data-label-background",
    "Data labels above points sit on a badge (a paper box with a border).",
  ),
  legendValues: flag(
    "data-ok-legend-values",
    "Legend items show a value: the slice's or ring's, or the series' last one.",
  ),
  zoom: flag(
    "data-ok-zoom",
    "Zoom and pan the x axis: drag to select (mouse), pinch or drag (touch), Ctrl + wheel, keys `+` `-` `0` and Shift + arrows.",
  ),
  toolbar: flag(
    "data-ok-toolbar",
    "A toolbar with zoom buttons (with `zoom`) and downloads (SVG, PNG, CSV).",
  ),
  animations: flag(
    "data-ok-animations",
    "Series grow in when first drawn and move to new values on updates (never with reduced motion).",
  ),
  orientation: style(
    "data-ok-orientation",
    chartOrientations,
    "horizontal",
    "Sankey charts: the flow runs left to right (`horizontal`, the default) or top to bottom (`vertical`). Beeswarm charts: the value axis runs left to right (`horizontal`, the default) or upward (`vertical`).",
    { optional: true },
  ),
  nodeWidth: number(
    "data-ok-node-width",
    20,
    "Sankey charts: node thickness along the flow in px.",
    {
      min: 1,
    },
  ),
  whitespace: number(
    "data-ok-whitespace",
    0.18,
    "Sankey charts: share of the fullest rank left between its nodes (0 to 0.9).",
    { min: 0 },
  ),
  edgeOpacity: number("data-ok-edge-opacity", 0.4, "Sankey charts: link opacity (0 to 1).", {
    min: 0,
  }),
  navigator: flag(
    "data-ok-navigator",
    "Stock charts: a navigator under the chart, the whole price line with the zoom as a brush (zooms like `zoom`).",
  ),
  paneHeight: number(
    "data-ok-pane-height",
    120,
    "Stock charts: height in px of each indicator pane (volume, RSI, MACD…) under the price.",
    { min: 60 },
  ),
  allowMultipleDataPointsSelection: flag(
    "data-ok-allow-multiple-data-points-selection",
    "Clicks and Enter or Space add points to the selection instead of replacing it.",
  ),
  stackType: style(
    "data-ok-stack-type",
    chartStackTypes,
    "normal",
    "Stacked charts: `normal` stacks the values, `100%` stacks each category's values as shares of their total (the value axis runs to 100%).",
    { optional: true },
  ),
  stackOnlyBar: flag(
    "data-ok-stack-only-bar",
    "Stacked mixed charts: only the bar series stack; lines and areas keep their own values.",
  ),
  stackTotals: flag(
    "data-ok-stack-totals",
    "Stacked bars: prints the total of each stack past its end.",
  ),
  dataLabelPosition: style(
    "data-ok-data-label-position",
    chartDataLabelPositions,
    "center",
    "Bars: where data labels sit inside the bar: `center`, `top` (by the value end) or `bottom` (by the base).",
    { optional: true },
  ),
  backgroundBars: flag(
    "data-ok-background-bars",
    "Bars: a grey track the height of the plot behind each bar.",
  ),
  backgroundBarOpacity: number(
    "data-ok-background-bar-opacity",
    undefined,
    "Bars: opacity of the tracks behind the bars (0 to 1; default 1).",
    { min: 0 },
  ),
  backgroundBarRadius: number(
    "data-ok-background-bar-radius",
    undefined,
    "Bars: corner radius of the tracks in px (default 4).",
    { min: 0 },
  ),
  markerShape: style(
    "data-ok-marker-shape",
    chartMarkerShapes,
    "circle",
    "Shape of the markers of every series: `circle`, `square`, `triangle`, `diamond`, `cross`, `plus` or `star` (series may set their own).",
    { optional: true },
  ),
  fillPattern: style(
    "data-ok-fill-pattern",
    chartPatterns,
    "slantedLines",
    "Pattern of every bar, area and slice: `slantedLines`, `squares`, `circles`, `horizontalLines` or `verticalLines` (turns patterns on; series may set their own).",
    { optional: true },
  ),
  strokeWidth: number(
    "data-ok-stroke-width",
    undefined,
    "Line width of every series in px (default 2.5; series may set their own).",
    { min: 0 },
  ),
  colorBlindMode: flag(
    "data-ok-color-blind-mode",
    "Series differ by more than their color: a different marker shape (lines get markers), pattern and dash per series.",
  ),
  tooltip: style(
    "data-ok-tooltip-mode",
    chartTooltipModes,
    "shared",
    "Tooltip: `shared` lists every series of the category, `point` only the value under the pointer (or the keyboard), `none` shows none (the values are still announced).",
    { optional: true },
  ),
  tooltipFixed: style(
    "data-ok-tooltip-fixed",
    chartTooltipCorners,
    "topRight",
    "The tooltip stays in a corner of the plot: `topLeft`, `topRight`, `bottomLeft` or `bottomRight` (default beside the value).",
    { optional: true },
  ),
  legendAlign: style(
    "data-ok-legend-align",
    chartLegendAligns,
    "right",
    "Legend items line up `left`, `center` or `right` (default right above the plot, centered below it and around circular charts).",
    { optional: true },
  ),
  showForSingleSeries: flag(
    "data-ok-show-for-single-series",
    "Shows the legend for a single series too.",
  ),
  disableLegendToggle: flag(
    "data-ok-disable-legend-toggle",
    "Legend items are plain labels: clicks don't hide series.",
  ),
  grid: style(
    "data-ok-grid",
    chartGrids,
    "y",
    "Grid lines: `y` horizontal (along the value ticks, or between the bars of horizontal bar charts), `x` vertical, `both` or `none`.",
    { optional: true },
  ),
  gridRowOpacity: number(
    "data-ok-grid-row-opacity",
    undefined,
    "Opacity of the row stripes (0 to 1; default 0.5).",
    { min: 0 },
  ),
  gridColumnOpacity: number(
    "data-ok-grid-column-opacity",
    undefined,
    "Opacity of the column stripes (0 to 1; default 0.5).",
    { min: 0 },
  ),
  waterfallPositiveColor: style(
    "data-ok-waterfall-positive-color",
    chartColors,
    "success",
    "Waterfall charts: color of the steps that raise the total (default `success`).",
    { optional: true },
  ),
  waterfallNegativeColor: style(
    "data-ok-waterfall-negative-color",
    chartColors,
    "error",
    "Waterfall charts: color of the steps that lower the total (default `error`).",
    { optional: true },
  ),
  waterfallTotalColor: style(
    "data-ok-waterfall-total-color",
    chartColors,
    "primary",
    "Waterfall charts: color of the total bars (default the series color).",
    { optional: true },
  ),
  waterfallSubtotalColor: style(
    "data-ok-waterfall-subtotal-color",
    chartColors,
    "primary",
    "Waterfall charts: color of the subtotal bars (default the total color).",
    { optional: true },
  ),
  hideConnectors: flag(
    "data-ok-hide-connectors",
    "Waterfall charts: no dashed lines from the end of each bar to the next one.",
  ),
  streamOffset: style(
    "data-ok-stream-offset",
    chartStreamOffsets,
    "wiggle",
    "Streamgraphs: the baseline: `wiggle` (bands as flat as the data allows, the default), `silhouette` (centered on one line), `zero` (a stacked area) or `expand` (each x value fills the chart).",
    { optional: true },
  ),
  streamOrder: style(
    "data-ok-stream-order",
    chartStreamOrders,
    "inside-out",
    "Streamgraphs: the stacking order: `inside-out` (series that peak first in the middle, the default), `inverse` or `none` (the series order).",
    { optional: true },
  ),
  hideStreamLabels: flag(
    "data-ok-hide-stream-labels",
    "Streamgraphs: no series names on the bands.",
  ),
  streamLabelMinWidth: number(
    "data-ok-stream-label-min-width",
    undefined,
    "Streamgraphs: bands thinner than this many pixels get no name (default 24).",
    { min: 0 },
  ),
  unitLayout: style(
    "data-ok-unit-layout",
    chartUnitLayouts,
    "grouped",
    "Unit charts: where the marks go: `grouped` (a blob per category, the default), `packed` (one blob), `columns` (stacked dots), `grid` (the waffle lattice) or `arc` (rows of seats).",
    { optional: true },
  ),
  clusterLabels: flag(
    "data-ok-cluster-labels",
    "Unit charts: category names under each cluster or column (grouped and columns layouts).",
  ),
  disableSortByGroup: flag(
    "data-ok-disable-sort-by-group",
    "Packed unit charts: keep the given order instead of the smallest group in the middle.",
  ),
  arcRows: number(
    "data-ok-arc-rows",
    undefined,
    "Arc unit charts: the concentric rows (default the fewest that seat everyone). Use `innerSize` for the inner radius (default 40) and `startAngle` / `endAngle` for the sweep (default -90 to 90).",
    { min: 1 },
  ),
  columns: number("data-ok-columns", undefined, "Waffle charts: cells per row (default 10).", {
    min: 1,
  }),
  fillFrom: style(
    "data-ok-fill-from",
    chartFillFroms,
    "bottom",
    "Waffle charts: the row where the cells start filling: `bottom` (the default) or `top`.",
    { optional: true },
  ),
  split: flag("data-ok-split", "Waffle charts: one mini waffle per category, filled to its value."),
  tileColumns: number(
    "data-ok-tile-columns",
    undefined,
    "Split waffles: tiles per row (default about a square of tiles).",
    { min: 1 },
  ),
  splitMax: number(
    "data-ok-split-max",
    undefined,
    "Split waffles: the value a full tile stands for (default the largest value).",
    { min: 0 },
  ),
  trackColor: style(
    "data-ok-track-color",
    chartColors,
    "primary",
    "Split waffles: the color of the empty cells (default a neutral grey).",
    { optional: true },
  ),
  unitValue: number(
    "data-ok-unit-value",
    undefined,
    "Waffle and unit charts: how many units of value one mark stands for (default 1).",
    { min: 0 },
  ),
  maxUnits: number(
    "data-ok-max-units",
    undefined,
    "Waffle and unit charts: the most marks drawn; counts scale down above it (default 5000).",
    { min: 1 },
  ),
  cellRadius: number(
    "data-ok-cell-radius",
    undefined,
    "Waffle charts: the corner radius of square cells in pixels (default 2).",
    { min: 0 },
  ),
  beeswarmSpread: style(
    "data-ok-beeswarm-spread",
    chartBeeswarmSpreads,
    "swarm",
    "Beeswarm charts: dots push apart just enough not to overlap (`swarm`, the default) or spread across the lane by a fixed sequence (`jitter`).",
    { optional: true },
  ),
  violinNormalize: style(
    "data-ok-violin-normalize",
    chartViolinNormalize,
    "individual",
    "Violins: each violin fills its slot (`individual`, the default) or all share one density scale (`group`).",
    { optional: true },
  ),
  violinSide: style(
    "data-ok-violin-side",
    chartViolinSides,
    "both",
    "Violins: symmetric (`both`, the default) or half a violin: `left`, `right`, `top` or `bottom`.",
    { optional: true },
  ),
  bandwidthScale: number(
    "data-ok-bandwidth-scale",
    undefined,
    "Violins: multiplies the drawn half-width (default 1). This is not the statistical bandwidth (`kdeBandwidth`).",
    { min: 0 },
  ),
  kdeBandwidth: number(
    "data-ok-kde-bandwidth",
    undefined,
    "Violins: the kernel width of the density estimate, in value units (default Silverman's rule of thumb).",
    { min: 0 },
  ),
  kdeResolution: number(
    "data-ok-kde-resolution",
    undefined,
    "Violins: how many density samples each violin uses (4 to 256; default 64).",
    { min: 4 },
  ),
  violinBox: flag("data-ok-violin-box", "Violins: a five-number box beside the density."),
  violinWhiskers: style(
    "data-ok-violin-whiskers",
    chartViolinWhiskers,
    "minmax",
    "Violins with a box: the whiskers end at the data's extremes (`minmax`, the default) or at Tukey's 1.5 × IQR fences (`tukey`).",
    { optional: true },
  ),
  hideViolinPoints: flag("data-ok-hide-violin-points", "Violins: no dots for the observations."),
  violinPointSize: number(
    "data-ok-violin-point-size",
    undefined,
    "Violins: the radius of the observation dots in pixels (default 2.5).",
    { min: 0.5 },
  ),
  violinJitter: number(
    "data-ok-violin-jitter",
    undefined,
    "Violins: how far the dots spread, as a share of the half-width (0 to 1; default 0.5).",
    { min: 0 },
  ),
  unconstrainedViolinPoints: flag(
    "data-ok-unconstrained-violin-points",
    "Violins: the dots may leave the density outline.",
  ),
  violinMaxPoints: number(
    "data-ok-violin-max-points",
    undefined,
    "Violins: the most dots drawn per violin; extra observations are thinned evenly (default 3000).",
    { min: 1 },
  ),
  streamHoverOpacity: number(
    "data-ok-stream-hover-opacity",
    undefined,
    'Streamgraphs with `tooltip="point"`: the opacity of the bands that are not active (0 to 1; default 0.35).',
    { min: 0 },
  ),
  direction: style(
    "data-ok-direction",
    chartDirections,
    "top",
    "Tree and icicle charts: where the root sits, `top` (the default), `bottom`, `left` or `right`, or `radial` (trees: the root in the center, levels as rings).",
    { optional: true },
  ),
  layoutType: style(
    "data-ok-layout-type",
    chartLayoutTypes,
    "tree",
    "Tree charts: `tree` (a tidy tree, the default) or `cluster` (a dendrogram: every leaf on the last level).",
    { optional: true },
  ),
  edgeStyle: style(
    "data-ok-edge-style",
    chartEdgeStyles,
    "orthogonal",
    "Tree charts: links with right angles (`orthogonal`, the default), `curved` or `straight`.",
    { optional: true },
  ),
  enableExpandCollapse: flag(
    "data-ok-enable-expand-collapse",
    "Tree charts: a click, Enter or Space on a node with children hides or shows them.",
  ),
  innerSize: number(
    "data-ok-inner-size",
    undefined,
    "Sunburst charts: the hole in the center, in % of the radius (0 to 90; default 15). Unit charts with the `arc` layout: the inner radius in % of the outer (default 40).",
    { min: 0 },
  ),
  spacing: number(
    "data-ok-spacing",
    undefined,
    "Sunburst and icicle charts: the gap between arcs or cells in px (default 1).",
    { min: 0 },
  ),
  leaf: style(
    "data-ok-leaf",
    chartLeaves,
    "extend",
    "Sunburst and icicle charts: branches that end before the deepest level `extend` to the edge or `stop` at their level (default `extend` on sunbursts, `stop` on icicles).",
    { optional: true },
  ),
  tint: number(
    "data-ok-tint",
    undefined,
    "Sunburst and icicle charts: how much paler each level is than the level its color starts at (0 to 1; default 0.14).",
    { min: 0 },
  ),
  disableZoomOnClick: flag(
    "data-ok-disable-zoom-on-click",
    "Sunburst and icicle charts: a click, Enter or Space on a node doesn't zoom into it.",
  ),
  zoomType: style(
    "data-ok-zoom-type",
    chartZoomTypes,
    "value",
    "Icicle charts: a branch zoomed into keeps its ancestors as full bands above it (`value`, the default) or becomes the top level (`both`).",
    { optional: true },
  ),
  projection: style(
    "data-ok-projection",
    chartProjections,
    "equalEarth",
    "Geo charts: `equalEarth` (equal areas, the default), `mercator` (straight rhumb lines) or `equirectangular`.",
    { optional: true },
  ),
  geoLayout: style(
    "data-ok-geo-layout",
    chartGeoLayouts,
    "geographic",
    "Geo charts: real boundaries (`geographic`, the default) or equal hex tiles (`hex`).",
    { optional: true },
  ),
  scaleMethod: style(
    "data-ok-scale-method",
    chartScaleMethods,
    "quantile",
    "Geo charts: how values are split into classes: `quantile` (the default), `equalInterval`, `jenks` (natural breaks) or `threshold` (your own `scaleThresholds`).",
    { optional: true },
  ),
  xMin: number(
    "data-ok-x-min",
    undefined,
    "The first x position shown when nothing has zoomed the chart: a category index, a timestamp in milliseconds (date axes) or an x value (numeric axes).",
  ),
  xMax: number(
    "data-ok-x-max",
    undefined,
    "The last x position shown when nothing has zoomed the chart (see `xMin`).",
  ),
  xRange: number(
    "data-ok-x-range",
    undefined,
    "Shows the last so many x units, ending at `xMax` or the last x value (a sliding window for live data).",
    { min: 0 },
  ),
  xLabelRotate: number(
    "data-ok-x-label-rotate",
    undefined,
    "X labels turn by this many degrees (-90 to 90) when they don't fit flat. Without it, labels that don't fit are left out.",
    { min: -90 },
  ),
  xLabelRotateAlways: flag(
    "data-ok-x-label-rotate-always",
    "X labels turn by `xLabelRotate` even when they fit flat.",
  ),
  measure: style(
    "data-ok-measure",
    chartMeasureModes,
    "span",
    "Measure rulers: a **Measure** button in the toolbar; a drag (or Enter at two points) then measures the change between two x positions (`span`, the series' values) or two points (`free`).",
    { optional: true },
  ),
  measurePinOnRelease: flag(
    "data-ok-measure-pin-on-release",
    "Measure rulers stay on the chart when the drag ends, up to 20 of them (without it, a new ruler replaces the last one).",
  ),
  rangeBarGroupRows: flag(
    "data-ok-range-bar-group-rows",
    "Range bars and timelines: the series share one lane per category, so bars of different series line up in a row.",
  ),
  disableRangeBarOverlap: flag(
    "data-ok-disable-range-bar-overlap",
    "Range bars and timelines: bars that overlap in time go to lanes of their own instead of being drawn over each other.",
  ),
  hideZeroBarsWhenGrouped: flag(
    "data-ok-hide-zero-bars-when-grouped",
    "Grouped columns: zero and empty bars take no slot, so the other bars of a category close up around its center.",
  ),
  dataReducer: flag(
    "data-ok-data-reducer",
    "Long lines and areas draw only the points that shape them (Largest Triangle Three Buckets); the table, the tooltip and the keyboard keep every point.",
  ),
  dataReducerTargetPoints: number(
    "data-ok-data-reducer-target-points",
    undefined,
    "Points kept per series when reducing (default 250).",
    { min: 3 },
  ),
  dataReducerThreshold: number(
    "data-ok-data-reducer-threshold",
    undefined,
    "A series with more visible points than this is reduced (default 500).",
    { min: 3 },
  ),
  forecastCount: number(
    "data-ok-forecast-count",
    undefined,
    "How many points at the end of each line, area or bar series are a forecast: lines are dashed, areas and bars faint.",
    { min: 1 },
  ),
  forecastDashArray: number(
    "data-ok-forecast-dash-array",
    undefined,
    "Forecast line dashes in px (default 4).",
    { min: 1 },
  ),
  forecastStrokeWidth: number(
    "data-ok-forecast-stroke-width",
    undefined,
    "Forecast line width in px (default the series' width).",
    { min: 0 },
  ),
  forecastFillOpacity: number(
    "data-ok-forecast-fill-opacity",
    undefined,
    "Opacity of forecast areas and bars (0 to 1; default 0.5).",
    { min: 0 },
  ),
  noDataAlign: style(
    "data-ok-no-data-align",
    chartNoDataAligns,
    "center",
    "Where the `noDataText` message sits across the plot: `left`, `center` (the default) or `right`.",
    { optional: true },
  ),
  noDataVerticalAlign: style(
    "data-ok-no-data-vertical-align",
    chartNoDataVerticalAligns,
    "middle",
    "Where the `noDataText` message sits down the plot: `top`, `middle` (the default) or `bottom`.",
    { optional: true },
  ),
  scaleClasses: number(
    "data-ok-scale-classes",
    5,
    "Geo charts: how many value classes (at most the colors available).",
    { min: 1 },
  ),
  sphere: flag("data-ok-sphere", "Geo charts: the outline of the globe behind the regions."),
  graticule: flag(
    "data-ok-graticule",
    "Geo charts: lines of longitude and latitude every 30 degrees.",
  ),
  imageFit: style(
    "data-ok-image-fit",
    chartImageFits,
    "cover",
    "Geo charts: how a region's picture (`data-ok-image` on its row header) fills the region's box: `cover` (the default, cropped), `contain` (the whole picture on the class color) or `fill` (stretched).",
    { optional: true },
  ),
  pixelShape: style(
    "data-ok-pixel-shape",
    chartPixelShapes,
    "circle",
    "Geo charts, `pixel` layout: the shape of each cell, `circle` (the default), `square` or `hexagon` (hexagons sit in rows half a step apart).",
    { optional: true },
  ),
  pixelSpacing: number(
    "data-ok-pixel-spacing",
    8,
    "Geo charts, `pixel` layout: the distance between the cells' centers in px (3 to 64).",
    { min: 3 },
  ),
  pixelSize: number(
    "data-ok-pixel-size",
    80,
    "Geo charts, `pixel` layout: each cell's width in % of the spacing (10 to 100).",
    { min: 10 },
  ),
  crossfilter: style(
    "data-ok-crossfilter",
    chartCrossfilters,
    "highlight",
    "Charts of a `group`: a selection (click, Enter or Space) or a brush in this chart filters the group, and this chart shows the group's filter as a `filter` (only the filtered categories keep their values) or a `highlight` (a tint behind them).",
    { optional: true },
  ),
  hiddenSeries: state(
    "aria-pressed",
    'Indexes of the series hidden through the legend (`aria-pressed="false"` on their buttons); categories in pie, donut and radial bar charts.',
    "toggle",
  ),
  selectedDataPoints: state(
    "instance.selectedDataPoints",
    "The selected points, `{ seriesIndex, dataPointIndex }[]`: a click selects the point, slice or cell under the pointer, Enter or Space the active one.",
    "select",
  ),
  zoomRange: state(
    "instance.zoomRange",
    "The visible window of the x axis, `{ min, max }` (category indexes or x values), or `null`.",
    "zoom",
  ),
});

export interface ChartAnatomyOptions {
  type?: ChartType | undefined;
  xType?: ChartXType | undefined;
  curve?: ChartCurve | undefined;
  legend?: ChartLegend | undefined;
  fill?: ChartFill | undefined;
  stacked?: boolean | undefined;
  horizontal?: boolean | undefined;
  height?: number | undefined;
  markerSize?: number | undefined;
  columnWidth?: number | undefined;
  barHeight?: number | undefined;
  yMin?: number | undefined;
  yMax?: number | undefined;
  dataLabels?: boolean | undefined;
  startAngle?: number | undefined;
  endAngle?: number | undefined;
  dashArray?: number | undefined;
  trackWidth?: number | undefined;
  total?: number | undefined;
  sparkline?: boolean | undefined;
  boxUpperColor?: ChartColor | undefined;
  boxLowerColor?: ChartColor | undefined;
  candleUpColor?: ChartColor | undefined;
  candleDownColor?: ChartColor | undefined;
  donutSize?: number | undefined;
  dataLabelBackground?: boolean | undefined;
  legendValues?: boolean | undefined;
  zoom?: boolean | undefined;
  toolbar?: boolean | undefined;
  animations?: boolean | undefined;
  orientation?: ChartOrientation | undefined;
  nodeWidth?: number | undefined;
  whitespace?: number | undefined;
  edgeOpacity?: number | undefined;
  navigator?: boolean | undefined;
  paneHeight?: number | undefined;
  allowMultipleDataPointsSelection?: boolean | undefined;
  stackType?: ChartStackType | undefined;
  stackOnlyBar?: boolean | undefined;
  stackTotals?: boolean | undefined;
  dataLabelPosition?: ChartDataLabelPosition | undefined;
  backgroundBars?: boolean | undefined;
  backgroundBarOpacity?: number | undefined;
  backgroundBarRadius?: number | undefined;
  markerShape?: ChartMarkerShape | undefined;
  fillPattern?: ChartPattern | undefined;
  strokeWidth?: number | undefined;
  colorBlindMode?: boolean | undefined;
  tooltip?: ChartTooltipMode | undefined;
  tooltipFixed?: ChartTooltipCorner | undefined;
  legendAlign?: ChartLegendAlign | undefined;
  showForSingleSeries?: boolean | undefined;
  disableLegendToggle?: boolean | undefined;
  grid?: ChartGrid | undefined;
  gridRowOpacity?: number | undefined;
  gridColumnOpacity?: number | undefined;
  waterfallPositiveColor?: ChartColor | undefined;
  waterfallNegativeColor?: ChartColor | undefined;
  waterfallTotalColor?: ChartColor | undefined;
  waterfallSubtotalColor?: ChartColor | undefined;
  hideConnectors?: boolean | undefined;
  direction?: ChartDirection | undefined;
  layoutType?: ChartLayoutType | undefined;
  edgeStyle?: ChartEdgeStyle | undefined;
  enableExpandCollapse?: boolean | undefined;
  innerSize?: number | undefined;
  spacing?: number | undefined;
  leaf?: ChartLeaf | undefined;
  tint?: number | undefined;
  disableZoomOnClick?: boolean | undefined;
  zoomType?: ChartZoomType | undefined;
  crossfilter?: ChartCrossfilter | undefined;
  projection?: ChartProjection | undefined;
  geoLayout?: ChartGeoLayout | undefined;
  scaleMethod?: ChartScaleMethod | undefined;
  scaleClasses?: number | undefined;
  sphere?: boolean | undefined;
  graticule?: boolean | undefined;
  pixelShape?: ChartPixelShape | undefined;
  imageFit?: ChartImageFit | undefined;
  pixelSpacing?: number | undefined;
  pixelSize?: number | undefined;
  streamOffset?: ChartStreamOffset | undefined;
  streamOrder?: ChartStreamOrder | undefined;
  hideStreamLabels?: boolean | undefined;
  streamLabelMinWidth?: number | undefined;
  streamHoverOpacity?: number | undefined;
  beeswarmSpread?: ChartBeeswarmSpread | undefined;
  unitLayout?: ChartUnitLayout | undefined;
  clusterLabels?: boolean | undefined;
  disableSortByGroup?: boolean | undefined;
  arcRows?: number | undefined;
  columns?: number | undefined;
  fillFrom?: ChartFillFrom | undefined;
  split?: boolean | undefined;
  tileColumns?: number | undefined;
  splitMax?: number | undefined;
  trackColor?: ChartColor | undefined;
  unitValue?: number | undefined;
  maxUnits?: number | undefined;
  cellRadius?: number | undefined;
  violinNormalize?: ChartViolinNormalize | undefined;
  violinSide?: ChartViolinSide | undefined;
  bandwidthScale?: number | undefined;
  kdeBandwidth?: number | undefined;
  kdeResolution?: number | undefined;
  violinBox?: boolean | undefined;
  violinWhiskers?: ChartViolinWhiskers | undefined;
  hideViolinPoints?: boolean | undefined;
  violinPointSize?: number | undefined;
  violinJitter?: number | undefined;
  unconstrainedViolinPoints?: boolean | undefined;
  violinMaxPoints?: number | undefined;
  xMin?: number | undefined;
  xMax?: number | undefined;
  xRange?: number | undefined;
  xLabelRotate?: number | undefined;
  xLabelRotateAlways?: boolean | undefined;
  measure?: ChartMeasureMode | undefined;
  measurePinOnRelease?: boolean | undefined;
  rangeBarGroupRows?: boolean | undefined;
  disableRangeBarOverlap?: boolean | undefined;
  hideZeroBarsWhenGrouped?: boolean | undefined;
  dataReducer?: boolean | undefined;
  dataReducerTargetPoints?: number | undefined;
  dataReducerThreshold?: number | undefined;
  forecastCount?: number | undefined;
  forecastDashArray?: number | undefined;
  forecastStrokeWidth?: number | undefined;
  forecastFillOpacity?: number | undefined;
  noDataAlign?: ChartNoDataAlign | undefined;
  noDataVerticalAlign?: ChartNoDataVerticalAlign | undefined;
}

/** `data-ok-*` attributes of a chart root (numbers only when given). */
export const chartAttributes = (options: ChartAnatomyOptions = {}): DataAttributes =>
  optionAttributes(chartOptions, { ...options });

/** Chart trellis (ADR-0060): small multiples of one data set, one chart per panel. */
export const chartTrellisOptions = defineOptions("chart-trellis", "data-ok-chart-trellis", {
  columns: number(
    "data-ok-columns",
    undefined,
    "Panels per row from 600px up (1 to 6; default as many as fit, at least 220px wide). Narrower screens show one per row.",
    { min: 1 },
  ),
  promote: flag(
    "data-ok-promote",
    "Panel headers are buttons: pressing one shows that panel alone across the grid, with an **All panels** button to go back.",
  ),
});

export interface ChartTrellisAnatomyOptions {
  columns?: number | undefined;
  promote?: boolean | undefined;
}

/** `data-ok-*` attributes of a chart trellis root. */
export const chartTrellisAttributes = (options: ChartTrellisAnatomyOptions = {}): DataAttributes =>
  optionAttributes(chartTrellisOptions, { ...options });
