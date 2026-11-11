import { axisScale, type ChartAxisSpec, type ChartValueScale, scaleValue } from "./chart-axes.js";
import {
  type ChartDiscreteMarker,
  type ChartPattern,
  chartMarkerNode,
  chartPatternDefs,
} from "./chart-cues.js";
import type { ChartFormat } from "./chart-format.js";
import type { ChartGeoMark } from "./chart-geo.js";
import type { ChartHierarchyState, ChartTreeMark } from "./chart-hierarchy.js";
import {
  type ChartColor,
  type ChartCurve,
  type ChartData,
  type ChartDataLabelPosition,
  type ChartDataSeries,
  type ChartFill,
  type ChartGrid,
  type ChartMarkerShape,
  type ChartPoint,
  type ChartStackType,
  type ChartStripeColor,
  type ChartSum,
  type ChartType,
  lighterTone,
} from "./chart-model.js";
import {
  type DateLabel,
  type DateUnit,
  niceScale,
  scaleLinear,
  stepDecimals,
  unitIndex,
} from "./chart-scale.js";
import { timeTicks } from "./chart-time.js";
import type { ChartUnitCell } from "./chart-unit.js";

/*
 * Chart layout (ADR-0024): data + size → a tree of SVG nodes and the positions of every drawn
 * value. React turns the nodes into elements, the HTML runtime builds them with createElement:
 * attribute names are SVG's own, values are plain text (never markup).
 */

export type ChartNodeTag =
  | "svg"
  | "g"
  | "path"
  | "line"
  | "rect"
  | "circle"
  | "text"
  | "defs"
  | "linearGradient"
  | "stop"
  | "pattern";

export interface ChartNode {
  readonly tag: ChartNodeTag;
  readonly attrs: Readonly<Record<string, string>>;
  readonly children?: readonly ChartNode[] | undefined;
  /** Text content (`text` nodes only). */
  readonly text?: string | undefined;
}

export interface ChartLayoutOptions {
  readonly width: number;
  readonly height: number;
  readonly format: ChartFormat;
  /** Unique per chart: prefixes gradient ids. */
  readonly idPrefix: string;
  readonly curve?: ChartCurve | undefined;
  readonly fill?: ChartFill | undefined;
  readonly stacked?: boolean | undefined;
  readonly horizontal?: boolean | undefined;
  /** Marker radius of line and area series (default 0: none); scatter points default to 5. */
  readonly markerSize?: number | undefined;
  /** Bar width in % of a category (vertical bars). Default 40. */
  readonly columnWidth?: number | undefined;
  /** Bar thickness in % of a category (horizontal bars). Default 40. */
  readonly barHeight?: number | undefined;
  readonly yMin?: number | undefined;
  readonly yMax?: number | undefined;
  readonly yTitle?: string | undefined;
  /** Series hidden through the legend (by index; categories for pie, donut and radial bar). */
  readonly hidden?: readonly number[] | undefined;
  /** Prints values on the chart (percentages on pie and donut slices). */
  readonly dataLabels?: boolean | undefined;
  /** Circular charts: where the slices or rings start and end, in degrees clockwise from 12 o'clock. */
  readonly startAngle?: number | undefined;
  readonly endAngle?: number | undefined;
  /** Dash length of lines and radial bars in px (default solid). */
  readonly dashArray?: number | undefined;
  /** Radial bar track thickness in % of the bar. Default 50. */
  readonly trackWidth?: number | undefined;
  /** Donut and radial bar center: the total's label ("Total"); shown only when given. */
  readonly totalLabel?: string | undefined;
  /** Donut and radial bar center: the total shown (default the sum; radial bars the average). */
  readonly total?: number | undefined;
  /** No axes, grid or legend: the plot fills the SVG (charts in cards and table cells). */
  readonly sparkline?: boolean | undefined;
  /** Box plots: the box above the median (default the series color). */
  readonly boxUpperColor?: ChartColor | undefined;
  /** Box plots: the box below the median (default a lighter tone of the series color). */
  readonly boxLowerColor?: ChartColor | undefined;
  /** Candlesticks: rising and falling candles (default `success` and `error`). */
  readonly candleUpColor?: ChartColor | undefined;
  readonly candleDownColor?: ChartColor | undefined;
  /** Donut hole in % of the radius. Default 72. */
  readonly donutSize?: number | undefined;
  /** Heatmaps and treemaps: values in a range take its color (full strength). */
  readonly colorRanges?: readonly ChartColorRange[] | undefined;
  /**
   * The visible part of the x axis (vertical charts with an x axis): category indexes, or x
   * values on numeric axes. The value axis keeps the whole data's scale.
   */
  readonly zoom?: { readonly min: number; readonly max: number } | null | undefined;
  /** Stock panes (ADR-0047): the value scale fits the points in the zoom window only. */
  readonly fitZoom?: boolean | undefined;
  /** Stock panes: the plot's left edge in px (panes line up on one x axis). */
  readonly plotLeft?: number | undefined;
  /** Stock panes: the space right of the plot in px (room for `opposite` axes in every pane). */
  readonly plotRight?: number | undefined;
  /**
   * Value axes (4.18.59, validated by `chartYAxes`): several on vertical charts with an x axis
   * (series pick theirs through `axis`), else the first one's scale options.
   */
  readonly yAxes?: readonly ChartAxisSpec[] | undefined;
  /** The x axis title, drawn under the labels. */
  readonly xTitle?: string | undefined;
  /** Stock panes: `false` leaves out the x axis labels (only the last pane prints them). */
  readonly xLabels?: boolean | undefined;
  /** Stock panes: categories are bands even without bars (every pane places x the same way). */
  readonly banded?: boolean | undefined;
  /** Stock price panes: `false` fits the value scale to the data (lines and areas too). */
  readonly zeroBased?: boolean | undefined;
  /** Stacks (4.18.61): `100%` draws each category's stacked values as shares of their sum. */
  readonly stackType?: ChartStackType | undefined;
  /** Stacks only the bar series of a mixed chart (lines and areas keep their values). */
  readonly stackOnlyBar?: boolean | undefined;
  /** Stacked bars: the total of each stack printed past its end. */
  readonly stackTotals?: boolean | undefined;
  /** Bars: where the data labels sit (default `center`). */
  readonly dataLabelPosition?: ChartDataLabelPosition | undefined;
  /** Bars: a track the height of the plot behind each bar (grey, or `backgroundBarColors`). */
  readonly backgroundBars?: boolean | undefined;
  /** Bars: track colors, one per category in turn (implies `backgroundBars`). */
  readonly backgroundBarColors?: readonly ChartColor[] | undefined;
  /** Bars: track opacity (0 to 1; an attribute, CSS never sets it). */
  readonly backgroundBarOpacity?: number | undefined;
  /** Bars: track corner radius in px. Default 4. */
  readonly backgroundBarRadius?: number | undefined;
  /** Markers on single points (4.18.62, validated by `chartDiscreteMarkers`). */
  readonly discreteMarkers?: readonly ChartDiscreteMarker[] | undefined;
  /** Lines and areas get markers (4.4px) even without `markerSize` (`colorBlindMode`). */
  readonly cueMarkers?: boolean | undefined;
  /** Circular charts: the pattern of each slice by category (4.18.62). */
  readonly slicePatterns?: readonly (ChartPattern | undefined)[] | undefined;
  /** Line width of every series in px (series may set their own). */
  readonly strokeWidth?: number | undefined;
  /**
   * Grid lines (4.18.64): `y` horizontal (default: along the value ticks, or between the
   * categories of horizontal bars), `x` vertical, `both` or `none`.
   */
  readonly grid?: ChartGrid | undefined;
  /** Stripes between the horizontal grid lines, colors in turn (`grey`, a palette color, `transparent`). */
  readonly gridRowColors?: readonly ChartStripeColor[] | undefined;
  /** Stripes between the vertical grid positions. */
  readonly gridColumnColors?: readonly ChartStripeColor[] | undefined;
  /** Stripe opacity (0 to 1; an attribute). Default 0.5. */
  readonly gridRowOpacity?: number | undefined;
  readonly gridColumnOpacity?: number | undefined;
  /** Waterfall charts (4.18.21): colors of rising and falling steps (default `success`, `error`). */
  readonly waterfallPositiveColor?: ChartColor | undefined;
  readonly waterfallNegativeColor?: ChartColor | undefined;
  /** Waterfall charts: total bars (default the series color) and subtotals (default the total's). */
  readonly waterfallTotalColor?: ChartColor | undefined;
  readonly waterfallSubtotalColor?: ChartColor | undefined;
  /** Waterfall charts: no dashed lines from each bar's end to the next bar. */
  readonly hideConnectors?: boolean | undefined;
  /**
   * Dumbbell charts (4.18.21): the start and end marker colors of each series (pair n for series
   * n; later series take the first pair). Default the series color for both.
   */
  readonly dumbbellColors?: readonly (readonly ChartColor[])[] | undefined;
  /**
   * Chart types with a file of their own (streamgraph, violin, beeswarm): draws one series on this
   * layout's axes. Whole-chart types only, so no other series goes through it.
   */
  readonly drawSeries?: ((context: ChartSeriesContext) => ChartSeriesPaint) | undefined;
}

/** What `drawSeries` gets: the series, the axes in px and where to add marks and labels. */
export interface ChartSeriesContext {
  readonly series: ChartDataSeries;
  /** The series' position in the data given to `layoutChart`. */
  readonly index: number;
  /** Its points in the zoom window. */
  readonly points: readonly ChartPoint[];
  /** The series group's attributes. */
  readonly attrs: Readonly<Record<string, string>>;
  readonly horizontal: boolean;
  /** A category's band in px (banded charts), or the distance between categories. */
  readonly band: number;
  readonly plot: ChartLayout["plot"];
  /** Value → px along the value axis. */
  readonly toValue: (value: number) => number;
  /** Category index or x value → px along the category axis. */
  readonly toPos: (x: number) => number;
  readonly marks: ChartMark[];
  readonly labels: ChartNode[];
  readonly patterns: ReturnType<typeof chartPatternDefs>;
}

/** A drawn series and the layer it goes in (areas, bars, then points). */
export interface ChartSeriesPaint {
  readonly layer: "areas" | "bars" | "points";
  readonly node: ChartNode;
}

/** A heatmap / treemap color range: values from `from` to `to` (inclusive) take `color`. */
export interface ChartColorRange {
  readonly from: number;
  readonly to: number;
  readonly color: ChartColor;
  readonly name?: string | undefined;
}

/**
 * How an axis maps values to SVG px (`from` is the px of `min`, `to` of `max`). `index`: category
 * indexes (centers of the first and last visible categories); `value`: numbers.
 */
export interface ChartAxisMap {
  readonly kind: "index" | "value";
  readonly min: number;
  readonly max: number;
  readonly from: number;
  readonly to: number;
  /** Banded categories (bars): the band width in px. */
  readonly band?: number | undefined;
  /** A logarithmic value axis: its base (`from` and `to` are the px of `min` and `max`). */
  readonly log?: number | undefined;
}

/** A rectangle in SVG px (heatmap and treemap cells). */
export interface ChartRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** A slice or ring of a circular chart: angles in degrees clockwise from 12 o'clock. */
export interface ChartArc {
  readonly cx: number;
  readonly cy: number;
  readonly start: number;
  readonly end: number;
  readonly inner: number;
  readonly outer: number;
}

/** A drawn value: what the tooltip and keyboard navigation point at. */
export interface ChartMark {
  readonly series: number;
  readonly type: ChartType;
  /** Category index (index charts) or the point's position in its series (scatter). */
  readonly index: number;
  /** The x value: category index or numeric x. */
  readonly x: number;
  readonly value: number;
  readonly px: number;
  readonly py: number;
  readonly color: ChartColor;
  /** Circular charts: the area that activates the mark (a slice, or a ring's whole track). */
  readonly arc?: ChartArc | undefined;
  /** Box plots (five values) and range areas (low, high): every value of the point. */
  readonly range?: readonly number[] | undefined;
  /** Bubbles: the size value and the drawn radius. */
  readonly z?: number | undefined;
  readonly r?: number | undefined;
  /** Heatmaps and treemaps: the cell that activates the mark. */
  readonly cell?: ChartRect | undefined;
  /** Sankey charts: the node or link, its tooltip and its highlight. */
  readonly flow?: ChartFlow | undefined;
  /** Geo charts (ADR-0059): the region's outline, rings for hits and its tooltip. */
  readonly geo?: ChartGeoMark | undefined;
  /** Hierarchy charts (ADR-0058): the node, its relatives, its shape and its tooltip. */
  readonly tree?: ChartTreeMark | undefined;
  /** Blocks (bars, boxes, candles, range bars, funnel bars): the rectangle they cover. */
  readonly box?: ChartRect | undefined;
  /** Non-color cues (4.18.62): the point's marker shape, the block's or slice's pattern. */
  readonly shape?: ChartMarkerShape | undefined;
  readonly pattern?: ChartPattern | undefined;
  /**
   * The point's `dataPointIndex` when it differs from `index`: its position among the series'
   * points with a value (numeric axes).
   */
  readonly point?: number | undefined;
  /** Waterfall charts: a total or subtotal bar (`range` is `[0, total]`). */
  readonly sum?: ChartSum | undefined;
  /** Dumbbells: the colors of the start and end markers (tooltip rows). */
  readonly ends?: readonly [ChartColor, ChartColor] | undefined;
  /** Violins: the number of observations (a tooltip row). */
  readonly count?: number | undefined;
  /** Waffle and unit charts: the outline of a category's marks (one path). */
  readonly unit?: { readonly outline: string } | undefined;
  /** Streamgraphs: the column's total (a tooltip row). */
  readonly total?: number | undefined;
  /** Streamgraphs: the nodes that show one band over the others (per-point tooltips). */
  readonly stream?:
    | {
        readonly veil: ChartNode;
        readonly band: ChartNode;
        readonly label?: ChartNode | undefined;
      }
    | undefined;
}

/**
 * A node or link of a Sankey chart (ADR-0047). Link geometry is abstract: `d` runs along the flow
 * (x, or y when `vertical`), `b` across it; `b0` / `b1` are the band's top edge at both ends.
 */
export interface ChartFlow {
  readonly kind: "node" | "link";
  /** Keyboard order: rank by rank, nodes before the links that leave them. */
  readonly order: number;
  /** Position across the flow (keyboard order within a rank). */
  readonly cross: number;
  readonly vertical: boolean;
  /** Nodes: the rectangle that activates them. */
  readonly rect?: ChartRect | undefined;
  readonly link?:
    | {
        readonly d0: number;
        readonly d1: number;
        readonly b0: number;
        readonly b1: number;
        readonly w: number;
        readonly back: boolean;
      }
    | undefined;
  /** Nodes: the marks of their links (highlighted with the node). */
  readonly links: readonly number[];
  /** Links: their path and paint attributes (copied for the highlight). */
  readonly path?: string | undefined;
  readonly paint?: Readonly<Record<string, string>> | undefined;
  readonly title: string;
  readonly rows: readonly {
    readonly name: string;
    readonly value: string;
    readonly color: ChartColor;
  }[];
}

export interface ChartSlot {
  readonly index: number;
  /** Center along the category axis (x for vertical charts, y for horizontal bars). */
  readonly pos: number;
}

export interface ChartLayout {
  readonly width: number;
  readonly height: number;
  readonly plot: {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  };
  /**
   * `index`: one tooltip per category; `point`: one per point (scatter, bubble); `slice`: one per
   * slice or ring (pie, donut, radial bar); `cell`: one per cell (heatmap, treemap; arrow keys
   * move in their direction); `flow`: one per Sankey node or link; `tree`: one per node of a
   * hierarchy chart (arrow keys walk parents, children and the nodes of a level); `unit`: one per
   * category of a waffle or unit chart (its marks light up together).
   */
  readonly mode: "index" | "point" | "slice" | "cell" | "flow" | "tree" | "unit";
  /** Waffle and unit charts: every mark and its category (pointer hit-testing). */
  readonly units?: readonly ChartUnitCell[] | undefined;
  /** Hierarchy charts (ADR-0058): the drilled node and the drill path. */
  readonly hierarchy?: ChartHierarchyState | undefined;
  /** Radar: center and radius; slots are categories and `pos` their angle in degrees. */
  readonly polar?: { readonly cx: number; readonly cy: number; readonly r: number } | undefined;
  readonly horizontal: boolean;
  /** Bars are drawn: categories are bands (the hover highlight covers the band). */
  readonly banded: boolean;
  readonly band: number;
  readonly slots: readonly ChartSlot[];
  readonly marks: readonly ChartMark[];
  /** Radius of hover markers (0: none; bars only). */
  readonly activeRadius: number;
  readonly nodes: readonly ChartNode[];
  /** Vertical charts with an x axis (phase 4): x values → px (zoom, brush, annotations). */
  readonly x?: ChartAxisMap | undefined;
  /** The value axis: values → px (annotations). */
  readonly y?: ChartAxisMap | undefined;
  /**
   * Stock charts (ADR-0047): the navigator's region and its axis (the whole x axis). Presses there
   * move or resize the zoom window like a brush.
   */
  readonly navigator?:
    | {
        readonly x: ChartAxisMap;
        readonly plot: {
          readonly x: number;
          readonly y: number;
          readonly width: number;
          readonly height: number;
        };
      }
    | undefined;
}

export const FONT = 12;
/** Glyph widths of the UI font in em, by class (narrow, wide and currency signs, minus, digits, capitals, others). */
const glyph = (c: string): number =>
  /[ .,:;'!|il1jtfI()[\]]/.test(c)
    ? 0.32
    : /[%MWmw@$€£¥]/.test(c)
      ? 0.9
      : c === "-"
        ? 0.45
        : /\d/.test(c)
          ? 0.6
          : /[A-Z]/.test(c)
            ? 0.66
            : 0.56;

/**
 * Estimated width of a label at `FONT` px. An estimate (not a measurement), so the server, React
 * and the HTML runtime lay out identically; it errs on the wide side.
 */
export const chartTextWidth = (text: string, size = FONT): number => {
  let em = 0;
  for (const c of text) em += glyph(c);
  return Math.ceil(em * size);
};

export const r2 = (value: number) => Math.round(value * 100) / 100;
/** A change as text with its sign: `+12` (rising waterfall steps; falling ones carry their minus). */
export const chartSigned = (value: number, text: string) =>
  value > 0 && !text.startsWith("+") ? `+${text}` : text;
const r1 = (value: number) => Math.round(value * 10) / 10;
export const fmt = (value: number) => String(r2(value));
export const node = (
  tag: ChartNodeTag,
  attrs: Record<string, string>,
  children?: ChartNode[],
  text?: string,
): ChartNode => ({
  tag,
  attrs,
  ...(children ? { children } : {}),
  ...(text !== undefined ? { text } : {}),
});

/**
 * A value printed on the chart: `inside` a filled shape (white), `outside` above a point, or
 * `plain` on a faint cell (primary text).
 */
export const dataLabel = (
  x: number,
  y: number,
  text: string,
  place: "inside" | "outside" | "plain",
) =>
  node(
    "text",
    {
      x: fmt(x),
      y: fmt(y),
      dy: "0.35em",
      "text-anchor": "middle",
      "data-ok-chart-data-label": place,
    },
    undefined,
    text,
  );

// --- Paths ----------------------------------------------------------------------------------

type Pt = readonly [number, number];

/** A line through points: straight, smooth (horizontal tangents, no overshoot) or stepped. */
export function linePath(
  points: readonly Pt[],
  curve: ChartCurve = "smooth",
  horizontal = false,
): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points as [Pt, ...Pt[]];
  let d = `M${fmt(first[0])},${fmt(first[1])}`;
  let [px, py] = first;
  for (const [x, y] of rest) {
    if (curve === "straight") d += `L${fmt(x)},${fmt(y)}`;
    else if (curve === "stepline") {
      d += horizontal
        ? `L${fmt(px)},${fmt(y)}L${fmt(x)},${fmt(y)}`
        : `L${fmt(x)},${fmt(py)}L${fmt(x)},${fmt(y)}`;
    } else if (horizontal) {
      const dy = (y - py) * 0.35;
      d += `C${fmt(px)},${fmt(py + dy)} ${fmt(x)},${fmt(y - dy)} ${fmt(x)},${fmt(y)}`;
    } else {
      const dx = (x - px) * 0.35;
      d += `C${fmt(px + dx)},${fmt(py)} ${fmt(x - dx)},${fmt(y)} ${fmt(x)},${fmt(y)}`;
    }
    px = x;
    py = y;
  }
  return d;
}

/** A bar from `base` to `end` across `[a, a + size]`, rounded (radius `r`) at the value end. */
export function barPath(
  a: number,
  size: number,
  base: number,
  end: number,
  r: number,
  horizontal: boolean,
): string {
  const length = Math.abs(end - base);
  const radius = Math.max(0, Math.min(r, size / 2, length));
  const dir = end < base ? -1 : 1;
  const b = a + size;
  if (!horizontal) {
    // Vertical: along y; `dir` -1 = upward (positive values).
    const turn = end - dir * radius;
    const sweep = dir < 0 ? 1 : 0;
    return radius === 0
      ? `M${fmt(a)},${fmt(base)}V${fmt(end)}H${fmt(b)}V${fmt(base)}Z`
      : `M${fmt(a)},${fmt(base)}V${fmt(turn)}A${fmt(radius)},${fmt(radius)} 0 0 ${sweep} ${fmt(a + radius)},${fmt(end)}H${fmt(b - radius)}A${fmt(radius)},${fmt(radius)} 0 0 ${sweep} ${fmt(b)},${fmt(turn)}V${fmt(base)}Z`;
  }
  const turn = end - dir * radius;
  const sweep = dir > 0 ? 1 : 0;
  return radius === 0
    ? `M${fmt(base)},${fmt(a)}H${fmt(end)}V${fmt(b)}H${fmt(base)}Z`
    : `M${fmt(base)},${fmt(a)}H${fmt(turn)}A${fmt(radius)},${fmt(radius)} 0 0 ${sweep} ${fmt(end)},${fmt(a + radius)}V${fmt(b - radius)}A${fmt(radius)},${fmt(radius)} 0 0 ${sweep} ${fmt(turn)},${fmt(b)}H${fmt(base)}Z`;
}

// --- Label thinning ---------------------------------------------------------------------------

const STEPS: Record<DateUnit | "index", readonly number[]> = {
  index: [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 25, 50, 100],
  day: [1, 2, 7, 14, 28],
  month: [1, 2, 3, 4, 6, 12, 24, 60, 120],
  year: [1, 2, 5, 10, 20, 50, 100],
};

/** Which categories get a label so that labels `width` px wide never overlap. */
export function shownLabels(
  count: number,
  spacing: number,
  width: number,
  unit: DateUnit | "index",
  key: (index: number) => number,
): (index: number) => boolean {
  const steps = STEPS[unit];
  // The computed step always fits: it ends the list of candidates.
  const fallback = Math.ceil((width + 8) / Math.max(spacing, 1));
  const step = [...steps, fallback].find((s) => s * spacing >= width + 8) as number;
  if (step <= 1) return () => true;
  return (index) => index < count && key(index) % step === 0;
}

/** A scale from `min` to `max` without ticks (sparklines); a flat range opens upward. */
const flatScale = (min: number, max: number) => {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  return { min: lo, max: hi > lo ? hi : lo + 1, step: 1, ticks: [] as number[] };
};

// --- Layout -----------------------------------------------------------------------------------

/** Series types that `horizontal` turns (left to right). */
const TURNABLE: readonly ChartType[] = [
  "bar",
  "boxPlot",
  "rangeBar",
  "waterfall",
  "dumbbell",
  "violin",
  "beeswarm",
];
/** Series types drawn in category bands. */
const BANDED: readonly ChartType[] = [
  "bar",
  "boxPlot",
  "candlestick",
  "rangeBar",
  "timeline",
  "waterfall",
  "dumbbell",
  "violin",
  "beeswarm",
];
/** Series types that fit the value scale to their data (no zero baseline). */
const FITTED: readonly ChartType[] = [
  "boxPlot",
  "rangeArea",
  "bubble",
  "candlestick",
  "rangeBar",
  "timeline",
  "dumbbell",
  "streamgraph",
  "violin",
  "beeswarm",
];
export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/** Lays out a chart. `width` and `height` are the SVG size in px. */
export function layoutChart(data: ChartData, options: ChartLayoutOptions): ChartLayout {
  const width = Math.max(40, Math.round(options.width));
  const height = Math.max(options.sparkline ? 8 : 40, Math.round(options.height));
  const { format } = options;
  const hidden = new Set(options.hidden ?? []);
  const visible = data.series
    .map((series, index) => ({ series, index }))
    .filter(({ index }) => !hidden.has(index));
  const typeOf = (s: ChartDataSeries): ChartType => s.type;
  // Timelines are horizontal range bars; bars, box plots and range bars may turn horizontal.
  const timeline = data.type === "timeline";
  const horizontal =
    timeline ||
    (options.horizontal === true &&
      visible.every(({ series }) => TURNABLE.includes(typeOf(series))));
  const numeric = data.xType === "numeric";
  const mode =
    data.series.length > 0 &&
    data.series.every((s) => s.type === "scatter" || s.type === "bubble" || s.type === "beeswarm")
      ? "point"
      : "index";
  const banded =
    !numeric && (options.banded ?? visible.some(({ series }) => BANDED.includes(series.type)));
  const stacked = options.stacked === true;
  const sparkline = options.sparkline === true;
  const count = numeric
    ? 0
    : Math.max(data.categories.length, ...data.series.map((s) => s.points.length), 0);
  // Zoom (phase 4): vertical charts show a window of their categories (or x values).
  const zoom = horizontal ? undefined : (options.zoom ?? undefined);
  const first = !numeric && zoom && count > 0 ? clamp(Math.round(zoom.min), 0, count - 1) : 0;
  const last =
    !numeric && zoom && count > 0 ? clamp(Math.round(zoom.max), first, count - 1) : count - 1;
  const shown = Math.max(0, last - first + 1);
  const inView = (x: number) =>
    numeric ? !zoom || (x >= zoom.min && x <= zoom.max) : x >= first && x <= last;

  // Value axes (4.18.59): several on vertical charts with an x axis, else one. Each has its own
  // scale (linear, logarithmic or a fixed tick count) and may be reversed.
  const specs = sparkline || timeline ? [] : (options.yAxes ?? []);
  const multi = specs.length > 1 && !horizontal;
  const axisCount = multi ? specs.length : 1;
  const axisOf = (index: number) =>
    multi ? Math.min(axisCount - 1, data.series[index]?.axis ?? 0) : 0;
  const specOf = (axis: number) => specs[axis];
  const isLog = (axis: number) => specOf(axis)?.logarithmic === true;
  const fixedOf = (axis: number) => ({
    min: specOf(axis)?.min ?? (axis === 0 ? options.yMin : undefined),
    max: specOf(axis)?.max ?? (axis === 0 ? options.yMax : undefined),
  });
  const titleOf = (axis: number) =>
    sparkline ? undefined : (specOf(axis)?.title ?? (axis === 0 ? options.yTitle : undefined));
  const onAxis = (axis: number) => visible.filter(({ index }) => axisOf(index) === axis);
  /** Whether a series stacks: stacked charts (never numeric or logarithmic), bars only with `stackOnlyBar`. */
  const stacksOn = (series: ChartDataSeries, axis: number) =>
    stacked && !numeric && !isLog(axis) && (options.stackOnlyBar !== true || series.type === "bar");
  // 100% stacks (4.18.61): each category's stacked values become shares of their absolute sum.
  const percent = stacked && options.stackType === "100%";
  const shares = percent
    ? Array.from({ length: axisCount }, () => new Array<number>(count).fill(0))
    : undefined;
  if (shares)
    for (const { series, index } of visible) {
      const axis = axisOf(index);
      if (!stacksOn(series, axis)) continue;
      const sums = shares[axis] as number[];
      for (const point of series.points)
        if (point.y !== null && !point.range)
          sums[point.x] = (sums[point.x] ?? 0) + Math.abs(point.y);
    }
  /** A stacked value: itself, or its share of the category in % (100% stacks). */
  const stackValue = (axis: number, x: number, y: number) => {
    const sum = shares?.[axis]?.[x];
    return sum === undefined ? y : sum > 0 ? (y / sum) * 100 : 0;
  };
  const percentAxis = (axis: number) =>
    percent && onAxis(axis).some(({ series }) => stacksOn(series, axis));

  // Stacked values: running totals per category and axis, positives and negatives apart (never
  // on logarithmic axes).
  const totals = Array.from({ length: axisCount }, () => ({
    pos: new Array<number>(count).fill(0),
    neg: new Array<number>(count).fill(0),
  }));
  const stack = new Map<string, readonly [number, number]>();
  const los = new Array<number>(axisCount).fill(Number.POSITIVE_INFINITY);
  const his = new Array<number>(axisCount).fill(Number.NEGATIVE_INFINITY);
  let xlo = Number.POSITIVE_INFINITY;
  let xhi = Number.NEGATIVE_INFINITY;
  const fitZoom = options.fitZoom === true && zoom !== undefined && zoom !== null;
  for (const { series, index } of visible) {
    const axis = axisOf(index);
    const log = isLog(axis);
    const stacks = stacksOn(series, axis);
    for (const point of series.points) {
      if (fitZoom && !inView(point.x)) continue;
      if (numeric) {
        xlo = Math.min(xlo, point.x);
        xhi = Math.max(xhi, point.x);
      }
      if (point.y === null) continue;
      // Logarithmic axes leave out values they can't draw (zero and below).
      const values = point.range ?? [point.y];
      if (log && values.some((value) => value <= 0)) continue;
      if (point.range) {
        // Box plots, ranges and candles span their values (never stacked).
        los[axis] = Math.min(los[axis] as number, ...point.range);
        his[axis] = Math.max(his[axis] as number, ...point.range);
      } else if (stacks) {
        const sums =
          point.y >= 0
            ? (totals[axis] as { pos: number[] }).pos
            : (totals[axis] as { neg: number[] }).neg;
        const start = sums[point.x] as number;
        const value = stackValue(axis, point.x, point.y);
        sums[point.x] = start + value;
        stack.set(`${index}:${point.x}`, [start, start + value]);
        los[axis] = Math.min(los[axis] as number, start + value, start);
        his[axis] = Math.max(his[axis] as number, start + value, start);
      } else {
        los[axis] = Math.min(los[axis] as number, point.y);
        his[axis] = Math.max(his[axis] as number, point.y);
      }
    }
  }
  for (let axis = 0; axis < axisCount; axis++) {
    const own = onAxis(axis);
    if (los[axis] === Number.POSITIVE_INFINITY) {
      los[axis] = isLog(axis) ? 1 : 0;
      his[axis] = isLog(axis) ? 10 : 1;
    }
    // Values start at zero, except where box plots, range areas, bubbles or sparkline lines fit
    // the scale to their data (bars and areas, filled from zero, keep it) and on log axes.
    const fitted = sparkline || own.some(({ series }) => FITTED.includes(series.type));
    const zeroBased = own.some(({ series }) =>
      fitted
        ? series.type === "bar" || series.type === "area"
        : ["line", "area", "bar", "scatter", "waterfall"].includes(series.type),
    );
    if (!isLog(axis) && ((zeroBased && options.zeroBased !== false) || own.length === 0)) {
      los[axis] = Math.min(los[axis] as number, 0);
      his[axis] = Math.max(his[axis] as number, 0);
    }
    // Dumbbells (4.18.21): a tenth of the span on both sides, so the end markers and their labels
    // stay inside the plot (never below zero for positive data).
    if (!isLog(axis) && own.some(({ series }) => series.type === "dumbbell")) {
      const lo = los[axis] as number;
      const hi = his[axis] as number;
      const pad = (hi - lo) / 10 || Math.abs(hi) / 10 || 1;
      los[axis] = lo >= 0 ? Math.max(0, lo - pad) : lo - pad;
      his[axis] = hi + pad;
    }
    // 100% stacks end at ±100 (sums of shares may round past it).
    if (percentAxis(axis)) {
      los[axis] = Math.max(los[axis] as number, -100);
      his[axis] = Math.min(his[axis] as number, 100);
    }
  }
  const lo = los[0] as number;
  const hi = his[0] as number;

  const gap = 12;
  const xLabels = options.xLabels !== false;
  const xTitle = !sparkline && xLabels && options.xTitle ? options.xTitle : undefined;
  const labelHeight = (sparkline ? 0 : xLabels ? FONT + gap + 6 : 6) + (xTitle ? FONT + 8 : 0);
  const top = sparkline ? 0 : 10;
  const yTitleSpace = titleOf(0) ? FONT + 10 : 0;

  // Value axis ticks: about one per 48px of height (vertical) or 200px of width (horizontal).
  // Sparklines have no ticks: their scale is the data's own range.
  const valueSpan = horizontal ? width : height - top - labelHeight;
  // Timelines: dates along the value axis, on whole minutes, hours, days, months or years.
  const timeScale = () => {
    const end = hi > lo ? hi : lo + 86_400_000;
    return {
      min: lo,
      max: end,
      step: 1,
      ticks: timeTicks(lo, end, Math.max(2, Math.floor(valueSpan / 110)), format.timeUnit),
    };
  };
  const tickCount = Math.max(2, Math.round(valueSpan / (horizontal ? 200 : 48)));
  // An axis is drawn when shown and when it has a visible series (one axis is always drawn).
  const drawn = (axis: number) =>
    specOf(axis)?.show !== false && (!multi || onAxis(axis).length > 0);
  const primary = Math.max(
    0,
    Array.from({ length: axisCount }, (_, axis) => axis).findIndex(drawn),
  );
  const scales: ChartValueScale[] = new Array(axisCount);
  const scaleOf = (axis: number, count: number): ChartValueScale =>
    sparkline
      ? flatScale(options.yMin ?? lo, options.yMax ?? hi)
      : timeline
        ? timeScale()
        : axisScale(
            los[axis] as number,
            his[axis] as number,
            tickCount,
            {
              ...(specOf(axis) as ChartAxisSpec | undefined),
              ...(count > 0 && !isLog(axis) && specOf(axis)?.tickAmount === undefined
                ? { tickAmount: count }
                : {}),
              logarithmic: isLog(axis),
              logBase: specOf(axis)?.logBase ?? 10,
            },
            fixedOf(axis),
          );
  scales[primary] = scaleOf(primary, 0);
  // The other axes take the primary's number of intervals, so their labels sit on its grid lines.
  const intervals = scales[primary].log === undefined ? scales[primary].ticks.length - 1 : 0;
  for (let axis = 0; axis < axisCount; axis++)
    if (axis !== primary) scales[axis] = scaleOf(axis, intervals);
  const valueScale = scales[0] as ChartValueScale;
  const textsOf = (axis: number) => {
    const scale = scales[axis] as ChartValueScale;
    const decimals =
      scale.log !== undefined
        ? Math.max(0, ...scale.ticks.map((tick) => stepDecimals(tick)))
        : Math.min(
            stepDecimals(scale.step),
            specOf(axis)?.tickAmount !== undefined || axis !== primary ? 2 : 10,
          );
    // 100% stacks: the axis shows shares, not values.
    if (percentAxis(axis)) return scale.ticks.map((tick) => `${format.number(tick)}%`);
    return scale.ticks.map((tick) =>
      timeline ? format.timeTick(tick).text : format.tick(tick, decimals),
    );
  };
  const tickTexts = textsOf(0);
  const nodes: ChartNode[] = [];
  const marks: ChartMark[] = [];
  const slots: ChartSlot[] = [];

  let plot: ChartLayout["plot"];
  let band = 0;
  let toValue: (value: number) => number;
  let toCat: (index: number) => number;
  /** Px of a scale's min and max along the value axis (before `reversed` swaps them). */
  let valuePx: readonly [number, number] = [0, 1];
  const toValueOf = (axis: number) => {
    const scale = scales[axis] as ChartValueScale;
    const [r0, r1] = specOf(axis)?.reversed ? [valuePx[1], valuePx[0]] : valuePx;
    return (value: number) => scaleValue(scale, value, r0, r1);
  };
  let xMin = 0;
  let xMax = 1;

  const grid: ChartNode[] = [];
  // Grid positions (4.18.64): horizontal lines (y px) and vertical ones (x px).
  let gridRows: number[] = [];
  let gridColumns: number[] = [];
  const axisX: ChartNode[] = [];
  const axisY: ChartNode[] = [];
  /** Value axis groups (vertical charts: one per drawn axis) and their titles. */
  let yAxisNodes: ChartNode[] | undefined;
  const yTitles: ChartNode[] = [];
  const axisTitle = (x: number, y: number, angle: number, text: string) =>
    node(
      "text",
      {
        x: fmt(x),
        y: fmt(y),
        dy: "0.35em",
        "text-anchor": "middle",
        transform: `rotate(${angle} ${fmt(x)} ${fmt(y)})`,
        "data-ok-chart-axis-title": "",
      },
      undefined,
      text,
    );
  const tickNode = (
    x: number,
    y: number,
    anchor: string,
    text: string,
    major = false,
    dy = "0.35em",
  ) =>
    node(
      "text",
      {
        x: fmt(x),
        y: fmt(y),
        dy,
        "text-anchor": anchor,
        "data-ok-chart-tick": "",
        ...(major ? { "data-ok-major": "" } : {}),
      },
      undefined,
      text,
    );
  const categoryLabels = Array.from({ length: count }, (_, index) =>
    format.axis(
      data.xType === "datetime"
        ? (data.categories[index] as number)
        : (data.categories[index] ?? String(index + 1)),
    ),
  );

  if (sparkline) {
    // No axes: the plot fills the SVG, less room for line strokes and markers.
    const pad = banded ? 1 : Math.max(3, (options.markerSize ?? 0) + 1);
    plot = {
      x: pad,
      y: pad,
      width: Math.max(10, width - pad * 2),
      height: Math.max(10, height - pad * 2),
    };
    if (numeric) {
      xMin = zoom ? zoom.min : xlo === Number.POSITIVE_INFINITY ? 0 : xlo;
      xMax = zoom ? zoom.max : xhi === Number.NEGATIVE_INFINITY || xhi === xMin ? xMin + 1 : xhi;
    }
    const along = horizontal ? plot.height : plot.width;
    band = banded ? along / Math.max(1, shown) : shown > 1 ? along / (shown - 1) : along;
    const start = horizontal ? plot.y : plot.x;
    toCat = (index) =>
      banded
        ? start + band * (index - first + 0.5)
        : shown > 1
          ? start + band * (index - first)
          : start + along / 2;
    valuePx = horizontal ? [plot.x, plot.x + plot.width] : [plot.y + plot.height, plot.y];
    toValue = toValueOf(0);
  } else if (horizontal) {
    // Categories down the left, values along the bottom.
    const catWidth = Math.max(0, ...categoryLabels.map((label) => chartTextWidth(label.text)));
    const left = catWidth + 16 + yTitleSpace;
    const right = Math.max(8, Math.ceil(chartTextWidth(tickTexts.at(-1) ?? "") / 2));
    plot = {
      x: left,
      y: top,
      width: Math.max(10, width - left - right),
      height: Math.max(10, height - top - labelHeight),
    };
    band = plot.height / Math.max(1, count);
    valuePx = [plot.x, plot.x + plot.width];
    toValue = toValueOf(0);
    toCat = (index) => plot.y + band * (index + 0.5);
    // Between the categories; vertical lines along the value ticks.
    gridRows = Array.from({ length: count + 1 }, (_, i) => plot.y + band * i);
    gridColumns = valueScale.ticks.map((tick) => toValue(tick));
    valueScale.ticks.forEach((tick, i) => {
      axisX.push(
        tickNode(
          toValue(tick),
          plot.y + plot.height + gap,
          "middle",
          tickTexts[i] as string,
          timeline && format.timeTick(tick).major,
          "0.71em",
        ),
      );
    });
    const show = shownLabels(count, band, FONT, "index", (i) => i);
    categoryLabels.forEach((label, i) => {
      if (show(i)) axisY.push(tickNode(plot.x - 12, toCat(i), "end", label.text, label.major));
    });
  } else {
    // Value axes beside the plot: the left ones from the plot outward, `opposite` ones on the right.
    const sides = Array.from({ length: axisCount }, (_, axis) => {
      const texts = textsOf(axis);
      const shown = drawn(axis);
      const labels = shown ? Math.max(0, ...texts.map((text) => chartTextWidth(text))) + 14 : 0;
      return {
        axis,
        texts,
        shown,
        opposite: specOf(axis)?.opposite === true,
        width: labels + (shown && titleOf(axis) ? FONT + 10 : 0),
        offset: 0,
      };
    });
    let leftWidth = 0;
    let rightWidth = 0;
    for (const side of sides) {
      if (!side.shown) continue;
      side.offset = side.opposite ? rightWidth : leftWidth;
      if (side.opposite) rightWidth += side.width;
      else leftWidth += side.width;
    }
    const left = options.plotLeft ?? Math.max(8, leftWidth);
    let xTicks: number[] = [];
    let xDecimals = 0;
    let right = 8;
    if (numeric) {
      if (xlo === Number.POSITIVE_INFINITY) {
        xlo = 0;
        xhi = 1;
      }
      const xCount = Math.max(2, Math.round((width - left) / 90));
      const xScale = zoom
        ? niceScale(zoom.min, zoom.max, xCount, { min: zoom.min, max: zoom.max })
        : niceScale(xlo, xhi, xCount);
      xTicks = [...xScale.ticks];
      xDecimals = stepDecimals(xScale.step);
      right = Math.max(8, Math.ceil(chartTextWidth(format.axis(xScale.max, xDecimals).text) / 2));
      right = options.plotRight ?? Math.max(right, rightWidth);
      plot = {
        x: left,
        y: top,
        width: Math.max(10, width - left - right),
        height: Math.max(10, height - top - labelHeight),
      };
      xMin = xScale.min;
      xMax = xScale.max;
    } else {
      if (!banded && shown > 1) {
        right = Math.max(
          8,
          Math.ceil(chartTextWidth((categoryLabels[last] as DateLabel).text) / 2),
        );
      }
      right = options.plotRight ?? Math.max(right, rightWidth);
      plot = {
        x: left,
        y: top,
        width: Math.max(10, width - left - right),
        height: Math.max(10, height - top - labelHeight),
      };
    }
    band = banded
      ? plot.width / Math.max(1, shown)
      : shown > 1
        ? plot.width / (shown - 1)
        : plot.width;
    valuePx = [plot.y + plot.height, plot.y];
    toValue = toValueOf(0);
    toCat = (index) =>
      banded
        ? plot.x + band * (index - first + 0.5)
        : shown > 1
          ? plot.x + (plot.width * (index - first)) / (shown - 1)
          : plot.x + plot.width / 2;
    // Grid lines follow the primary axis (the first one drawn); the others share its intervals.
    const gridAt = toValueOf(primary);
    gridRows = (scales[primary] as ChartValueScale).ticks.map((tick) => gridAt(tick));
    // Vertical lines: through the x ticks, between bands, or through the categories.
    gridColumns = numeric
      ? xTicks.map((tick) => toX(tick))
      : banded
        ? Array.from({ length: shown + 1 }, (_, i) => plot.x + band * i)
        : Array.from({ length: shown }, (_, i) => toCat(first + i));
    yAxisNodes = [];
    const middle = plot.y + plot.height / 2;
    for (const side of sides) {
      if (!side.shown) continue;
      const at = toValueOf(side.axis);
      const right = plot.x + plot.width;
      const children = (scales[side.axis] as ChartValueScale).ticks.map((tick, i) =>
        side.opposite
          ? tickNode(right + side.offset + 14, at(tick), "start", side.texts[i] as string)
          : tickNode(plot.x - side.offset - 14, at(tick), "end", side.texts[i] as string),
      );
      yAxisNodes.push(
        node(
          "g",
          {
            "data-ok-chart-axis": "y",
            ...(multi ? { "data-ok-index": String(side.axis) } : {}),
            ...(side.opposite ? { "data-ok-opposite": "" } : {}),
          },
          children,
        ),
      );
      const title = titleOf(side.axis);
      if (!title) continue;
      // Titles read upward on the left, downward on the right; the outermost left one sits at the edge.
      const x = side.opposite
        ? right + side.offset + side.width - FONT
        : side.offset + side.width >= leftWidth
          ? FONT
          : plot.x - side.offset - side.width + FONT;
      yTitles.push(axisTitle(x, middle, side.opposite ? 90 : -90, title));
    }
    if (yAxisNodes.length === 0) yAxisNodes.push(node("g", { "data-ok-chart-axis": "y" }, []));
    const labelY = plot.y + plot.height + gap;
    if (!xLabels) {
      // Stock panes above the last one: the x axis is printed once, under the last pane.
    } else if (numeric) {
      for (const tick of xTicks)
        axisX.push(
          tickNode(toX(tick), labelY, "middle", format.axis(tick, xDecimals).text, false, "0.71em"),
        );
    } else {
      const inWindow = categoryLabels.slice(first, last + 1);
      const widest = Math.max(0, ...inWindow.map((label) => chartTextWidth(label.text)));
      const unit = data.xType === "datetime" ? format.dateUnit : "index";
      const key = (i: number) =>
        data.xType === "datetime" ? unitIndex(data.categories[i] as number, format.dateUnit) : i;
      const show = shownLabels(count, band, widest, unit, key);
      // Dates with gaps (trading days) aren't evenly spaced: a label that would touch the one
      // before it is left out.
      let edge = Number.NEGATIVE_INFINITY;
      inWindow.forEach((label, offset) => {
        const i = first + offset;
        if (!show(i)) return;
        const half = chartTextWidth(label.text) / 2;
        if (toCat(i) - half < edge + 8) return;
        edge = toCat(i) + half;
        axisX.push(tickNode(toCat(i), labelY, "middle", label.text, label.major, "0.71em"));
      });
    }
  }

  // Hoisted: numeric axes call it while laying out their ticks (after `plot` is set).
  function toX(x: number): number {
    return scaleLinear(x, xMin, xMax, plot.x, plot.x + plot.width);
  }
  for (let i = first; i <= last; i++) slots.push({ index: i, pos: r2(toCat(i)) });

  /** Where bars and areas start on an axis: zero, or the edge nearest to it. */
  const baseOf = (axis: number) => {
    const scale = scales[axis] as ChartValueScale;
    return toValueOf(axis)(Math.min(Math.max(0, scale.min), scale.max));
  };
  const defs: ChartNode[] = [];
  const areas: ChartNode[] = [];
  const bars: ChartNode[] = [];
  const lines: ChartNode[] = [];
  const scatters: ChartNode[] = [];
  const labels: ChartNode[] = [];
  const barSeries = visible.filter(({ series }) => series.type === "bar").map(({ index }) => index);
  const groupSize =
    (band *
      Math.min(100, Math.max(1, (horizontal ? options.barHeight : options.columnWidth) ?? 40))) /
    100;
  const markerSize = Math.max(0, options.markerSize ?? 0);
  // Non-color cues (4.18.62): cue markers (colorBlindMode), discrete markers, pattern fills.
  const lineMarkerSize = markerSize > 0 ? markerSize : options.cueMarkers ? 4 : 0;
  const discrete = new Map(
    (options.discreteMarkers ?? []).map((entry) => [
      `${entry.seriesIndex}:${entry.dataPointIndex}`,
      entry,
    ]),
  );
  const patterns = chartPatternDefs(options.idPrefix);
  const indexesOf = (types: readonly ChartType[]) =>
    visible.filter(({ series }) => types.includes(series.type)).map(({ index }) => index);
  const boxSeries = indexesOf(["boxPlot"]);
  const candleSeries = indexesOf(["candlestick"]);
  const rangeSeries = indexesOf(["rangeBar", "timeline"]);
  const waterfallSeries = indexesOf(["waterfall"]);
  const dumbbellSeries = indexesOf(["dumbbell"]);
  /** The rectangle a block mark covers (4.18.60: clicks select it, an outline shows it). */
  const box = (a: number, size: number, v0: number, v1: number): ChartRect => {
    const lo = r2(Math.min(v0, v1));
    const length = r2(Math.abs(v1 - v0));
    return horizontal
      ? { x: lo, y: r2(a), width: length, height: r2(size) }
      : { x: r2(a), y: lo, width: r2(size), height: length };
  };
  /** A rectangle across `[a, a + size]` between two value positions (either axis). */
  const span = (a: number, size: number, v0: number, v1: number, least = 0) => {
    const lo = Math.min(v0, v1);
    const length = Math.max(least, Math.abs(v1 - v0));
    return horizontal
      ? { x: fmt(lo), y: fmt(a), width: fmt(length), height: fmt(size) }
      : { x: fmt(a), y: fmt(lo), width: fmt(size), height: fmt(length) };
  };
  /** The color of the first value range (`colorRanges`) holding a bar's value. */
  const rangeColor = (value: number) =>
    options.colorRanges?.find((range) => value >= range.from && value <= range.to)?.color;
  // Bubbles: the largest size gets a tenth of the plot's smaller side (at least 8px).
  let zMax = 0;
  for (const { series } of visible)
    if (series.type === "bubble")
      for (const point of series.points)
        if (point.y !== null && point.z !== undefined) zMax = Math.max(zMax, Math.abs(point.z));
  const bubbleMax = Math.max(8, Math.min(plot.width, plot.height) / 10);

  // Topmost / bottommost stacked bar per category: only stack ends are rounded.
  const ends = new Map<string, number>();
  const endKey = (index: number, y: number, x: number) =>
    `${axisOf(index)}${y > 0 ? "+" : "-"}${x}`;
  if (stacked) {
    for (const index of barSeries) {
      for (const point of (data.series[index] as ChartDataSeries).points) {
        if (point.y === null || point.y === 0) continue;
        ends.set(endKey(index, point.y, point.x), index);
      }
    }
  }

  for (const { series, index } of visible) {
    const seriesAttrs = {
      "data-ok-chart-series": "",
      "data-ok-type": series.type,
      "data-ok-color": series.color,
      "data-ok-index": String(index),
    };
    // The series' value axis (4.18.59): its scale, its base and whether it stacks.
    const axis = axisOf(index);
    const toValue = toValueOf(axis);
    const base = baseOf(axis);
    const log = isLog(axis);
    const stacks = stacksOn(series, axis);
    // Zoomed charts draw the points in their window only; log axes skip values ≤ 0 (gaps).
    const inWindow = zoom ? series.points.filter((point) => inView(point.x)) : series.points;
    const points = log
      ? inWindow.map((point) =>
          point.y !== null && (point.range ?? [point.y]).every((value) => value > 0)
            ? point
            : { x: point.x, y: null },
        )
      : inWindow;
    const stackedValue = (point: { x: number; y: number }) =>
      stacks ? (stack.get(`${index}:${point.x}`) as readonly [number, number])[1] : point.y;
    // Numeric axes (4.18.60): a point is named by its position among the series' points with a
    // value (`dataPointIndex`); category axes name it by its category.
    const positions = numeric
      ? new Map(series.points.filter((p) => p.y !== null).map((p, i) => [p as object, i]))
      : undefined;
    const pointOf = (point: object) => (positions ? { point: positions.get(point) as number } : {});
    if (series.type === "bar" && !numeric) {
      const slot = barSeries.indexOf(index);
      const size = stacks ? groupSize : groupSize / Math.max(1, barSeries.length);
      const offset = stacks ? 0 : slot * size;
      const children: ChartNode[] = [];
      for (const point of points) {
        if (point.y === null) continue;
        const [from, to] = stacks
          ? (stack.get(`${index}:${point.x}`) as readonly [number, number])
          : [log ? (scales[axis] as ChartValueScale).min : 0, point.y];
        const a = toCat(point.x) - groupSize / 2 + offset;
        const start = toValue(from);
        const end = toValue(to);
        const rounded = !stacks || ends.get(endKey(index, point.y, point.x)) === index;
        // Value ranges (4.18.61) color the bars whose value they hold; a point's own color wins.
        const own = point.color ?? rangeColor(point.y);
        const color = own ?? series.color;
        const fill = series.pattern ? { fill: patterns.fill(series.pattern, color) } : {};
        marks.push({
          series: index,
          type: series.type,
          index: point.x,
          x: point.x,
          value: point.y,
          px: r2(horizontal ? end : a + size / 2),
          py: r2(horizontal ? a + size / 2 : end),
          color,
          box: box(a, size, start, end),
          ...(series.pattern ? { pattern: series.pattern } : {}),
        });
        if (from === to) continue;
        if (options.dataLabels) {
          // Inside the bar, only where the value fits; 100% stacks print the share.
          const share = percent && stacks ? to - from : undefined;
          const text =
            share === undefined
              ? format.dataLabel(point.y, index, point.x, format.value(point.y, index))
              : format.dataLabel(share, index, point.x, `${format.number(r1(share))}%`);
          const length = Math.abs(end - start);
          const fits = horizontal
            ? length >= chartTextWidth(text) + 8 && size >= FONT + 2
            : length >= FONT + 6 && size >= chartTextWidth(text) + 4;
          if (fits) {
            // `top`: by the value end, `bottom`: by the base (4.18.61), else the middle.
            const sign = end >= start ? 1 : -1;
            const half = (horizontal ? chartTextWidth(text) : FONT) / 2 + 4;
            const place = options.dataLabelPosition;
            const mid =
              place === "top"
                ? end - sign * half
                : place === "bottom"
                  ? start + sign * half
                  : (start + end) / 2;
            const across = a + size / 2;
            labels.push(
              dataLabel(horizontal ? mid : across, horizontal ? across : mid, text, "inside"),
            );
          }
        }
        children.push(
          node("path", {
            d: barPath(a, size, start, end, rounded ? 4 : 0, horizontal),
            "data-ok-chart-bar": "",
            ...(own ? { "data-ok-color": own } : {}),
            ...fill,
          }),
        );
      }
      bars.push(node("g", seriesAttrs, children));
      continue;
    }
    const posOf = (x: number) => (numeric ? toX(x) : toCat(x));
    if (options.drawSeries) {
      const painted = options.drawSeries({
        series,
        index,
        points,
        attrs: seriesAttrs,
        horizontal,
        band,
        plot,
        toValue,
        toPos: posOf,
        marks,
        labels,
        patterns,
      });
      (painted.layer === "areas" ? areas : painted.layer === "bars" ? bars : scatters).push(
        painted.node,
      );
      continue;
    }
    if (series.type === "boxPlot") {
      // Whiskers from the minimum to Q1 and Q3 to the maximum, two boxes split at the median.
      const slot = boxSeries.indexOf(index);
      const size = groupSize / Math.max(1, boxSeries.length);
      const upper = options.boxUpperColor ?? series.color;
      const lower = options.boxLowerColor ?? lighterTone(series.color);
      const children: ChartNode[] = [];
      for (const point of points) {
        if (!point.range) continue;
        const [min, q1, median, q3, max] = point.range.map(toValue) as [
          number,
          number,
          number,
          number,
          number,
        ];
        const a = posOf(point.x) - groupSize / 2 + slot * size;
        const c = a + size / 2;
        const cap = size / 4;
        // Horizontal box plots (phase 4): values along x, categories down the side.
        const at = (across: number, value: number): Pt =>
          horizontal ? [value, across] : [across, value];
        const [px, py] = at(c, max);
        marks.push({
          series: index,
          type: series.type,
          index: point.x,
          x: point.x,
          value: point.y as number,
          px: r2(px),
          py: r2(py),
          color: upper,
          range: point.range,
          box: box(a, size, min, max),
          ...pointOf(point),
        });
        const whisker = (from: Pt, to: Pt) =>
          node("line", {
            x1: fmt(from[0]),
            y1: fmt(from[1]),
            x2: fmt(to[0]),
            y2: fmt(to[1]),
            "data-ok-chart-whisker": "",
          });
        children.push(
          whisker(at(c, max), at(c, q3)),
          whisker(at(c, q1), at(c, min)),
          whisker(at(c - cap, max), at(c + cap, max)),
          whisker(at(c - cap, min), at(c + cap, min)),
          node("rect", {
            ...span(a, size, q3, median),
            "data-ok-chart-box": "upper",
            "data-ok-color": upper,
          }),
          node("rect", {
            ...span(a, size, median, q1),
            "data-ok-chart-box": "lower",
            "data-ok-color": lower,
          }),
        );
      }
      bars.push(node("g", seriesAttrs, children));
      continue;
    }
    if (series.type === "candlestick") {
      // A wick from the high to the low, a body from the open to the close (phase 4).
      const slot = candleSeries.indexOf(index);
      const size = groupSize / Math.max(1, candleSeries.length);
      const children: ChartNode[] = [];
      for (const point of points) {
        if (!point.range) continue;
        const [open, high, low, close] = point.range as [number, number, number, number];
        const rising = close >= open;
        const color =
          point.color ??
          (rising ? (options.candleUpColor ?? "success") : (options.candleDownColor ?? "error"));
        const a = posOf(point.x) - groupSize / 2 + slot * size;
        const c = a + size / 2;
        marks.push({
          series: index,
          type: series.type,
          index: point.x,
          x: point.x,
          value: close,
          px: r2(c),
          py: r2(toValue(high)),
          color,
          range: point.range,
          box: box(a, size, toValue(high), toValue(low)),
          ...pointOf(point),
        });
        const top = Math.min(toValue(open), toValue(close));
        children.push(
          node("line", {
            x1: fmt(c),
            y1: fmt(toValue(high)),
            x2: fmt(c),
            y2: fmt(toValue(low)),
            "data-ok-chart-wick": "",
            "data-ok-color": color,
          }),
          node("rect", {
            x: fmt(a),
            y: fmt(top),
            width: fmt(size),
            // A candle that opens and closes alike (a doji) is still a line.
            height: fmt(Math.max(1, Math.abs(toValue(open) - toValue(close)))),
            "data-ok-chart-candle": rising ? "up" : "down",
            "data-ok-color": color,
          }),
        );
      }
      bars.push(node("g", seriesAttrs, children));
      continue;
    }
    if (series.type === "rangeBar" || series.type === "timeline") {
      // Bars from the start to the end value, rounded at both ends; timelines run left to right.
      const slot = rangeSeries.indexOf(index);
      const size = groupSize / Math.max(1, rangeSeries.length);
      const children: ChartNode[] = [];
      for (const point of points) {
        if (!point.range) continue;
        const [from, to] = point.range.map(toValue) as [number, number];
        const a = posOf(point.x) - groupSize / 2 + slot * size;
        const length = Math.abs(to - from);
        const end = horizontal ? Math.max(from, to) : Math.min(from, to);
        marks.push({
          series: index,
          type: series.type,
          index: point.x,
          x: point.x,
          value: point.range[1] as number,
          px: r2(horizontal ? end : a + size / 2),
          py: r2(horizontal ? a + size / 2 : end),
          color: point.color ?? series.color,
          range: point.range,
          box: box(a, size, from, to),
          ...pointOf(point),
        });
        children.push(
          node("rect", {
            ...span(a, size, from, to, 1),
            rx: fmt(Math.min(4, size / 2, length / 2)),
            "data-ok-chart-bar": "",
            ...(point.color ? { "data-ok-color": point.color } : {}),
          }),
        );
        if (options.dataLabels) {
          const [s, e] = point.range as [number, number];
          const text = format.dataLabel(
            e - s,
            index,
            point.x,
            `${format.value(s, index)} – ${format.value(e, index)}`,
          );
          const fits = horizontal
            ? length >= chartTextWidth(text) + 8 && size >= FONT + 2
            : length >= FONT + 6 && size >= chartTextWidth(text) + 4;
          const mid = (from + to) / 2;
          const across = a + size / 2;
          if (fits)
            labels.push(
              dataLabel(horizontal ? mid : across, horizontal ? across : mid, text, "inside"),
            );
        }
      }
      bars.push(node("g", seriesAttrs, children));
      continue;
    }
    if (series.type === "dumbbell") {
      // Two markers per category joined by a line (4.18.21): the start ring, the end disc.
      const slot = dumbbellSeries.indexOf(index);
      const size = groupSize / Math.max(1, dumbbellSeries.length);
      const radius = Math.max(2, options.markerSize ?? 6);
      const pair = options.dumbbellColors?.[index] ?? options.dumbbellColors?.[0];
      const children: ChartNode[] = [];
      for (const point of points) {
        if (!point.range) continue;
        const [start, end] = point.range as [number, number];
        const from = toValue(start);
        const to = toValue(end);
        const c = posOf(point.x) - groupSize / 2 + slot * size + size / 2;
        const at = (value: number): Pt => (horizontal ? [value, c] : [c, value]);
        const [x1, y1] = at(from);
        const [x2, y2] = at(to);
        const startColor = point.color ?? pair?.[0];
        const endColor = point.color ?? pair?.[1];
        marks.push({
          series: index,
          type: series.type,
          index: point.x,
          x: point.x,
          value: end,
          px: r2(x2),
          py: r2(y2),
          color: endColor ?? series.color,
          range: point.range,
          box: box(
            c - radius,
            radius * 2,
            Math.min(from, to) - radius,
            Math.max(from, to) + radius,
          ),
          ends: [startColor ?? series.color, endColor ?? series.color],
          ...pointOf(point),
        });
        children.push(
          node("line", {
            x1: fmt(x1),
            y1: fmt(y1),
            x2: fmt(x2),
            y2: fmt(y2),
            "data-ok-chart-dumbbell-line": "",
          }),
          node("circle", {
            cx: fmt(x1),
            cy: fmt(y1),
            r: fmt(radius),
            "data-ok-chart-dumbbell": "start",
            ...(startColor ? { "data-ok-color": startColor } : {}),
          }),
          node("circle", {
            cx: fmt(x2),
            cy: fmt(y2),
            r: fmt(radius),
            "data-ok-chart-dumbbell": "end",
            ...(endColor ? { "data-ok-color": endColor } : {}),
          }),
        );
        if (options.dataLabels) {
          // Each value outside its marker: below or left of the lower end, above or right of the higher.
          const ends: [number, number][] =
            start === end
              ? [[end, to]]
              : [
                  [start, from],
                  [end, to],
                ];
          const high = Math.max(start, end);
          for (const [value, px] of ends) {
            const text = format.dataLabel(value, index, point.x, format.value(value, index));
            const outward = value === high ? 1 : -1;
            labels.push(
              horizontal
                ? node(
                    "text",
                    {
                      x: fmt(px + outward * (radius + 6)),
                      y: fmt(c),
                      dy: "0.35em",
                      "text-anchor": outward > 0 ? "start" : "end",
                      "data-ok-chart-data-label": "outside",
                    },
                    undefined,
                    text,
                  )
                : dataLabel(c, px - outward * (radius + 10), text, "outside"),
            );
          }
        }
      }
      scatters.push(node("g", seriesAttrs, children));
      continue;
    }
    if (series.type === "waterfall") {
      // Steps float from the running total before them to the total after (4.18.21); totals
      // and subtotals rise from zero. Dashed connectors join each bar's end to the next bar.
      const slot = waterfallSeries.indexOf(index);
      const size = groupSize / Math.max(1, waterfallSeries.length);
      const connectors: ChartNode[] = [];
      const children: ChartNode[] = [];
      let previous: { edge: number; at: number } | undefined;
      for (const point of [...points].sort((a, b) => a.x - b.x)) {
        if (!point.range || point.y === null) {
          previous = undefined;
          continue;
        }
        const [start, end] = point.range as [number, number];
        const from = toValue(start);
        const to = toValue(end);
        const a = posOf(point.x) - groupSize / 2 + slot * size;
        const step = point.sum ?? (end >= start ? "up" : "down");
        const total = options.waterfallTotalColor ?? series.color;
        const color =
          point.color ??
          (step === "total"
            ? total
            : step === "subtotal"
              ? (options.waterfallSubtotalColor ?? total)
              : step === "up"
                ? (options.waterfallPositiveColor ?? "success")
                : (options.waterfallNegativeColor ?? "error"));
        const length = Math.abs(to - from);
        // The tooltip points at the running total after the bar.
        marks.push({
          series: index,
          type: series.type,
          index: point.x,
          x: point.x,
          value: point.y,
          px: r2(horizontal ? to : a + size / 2),
          py: r2(horizontal ? a + size / 2 : to),
          color,
          range: point.range,
          box: box(a, size, from, to),
          ...pointOf(point),
          ...(point.sum ? { sum: point.sum } : {}),
        });
        if (previous && !options.hideConnectors) {
          const at = fmt(previous.at);
          const ends = horizontal
            ? { x1: at, x2: at, y1: fmt(previous.edge), y2: fmt(a) }
            : { x1: fmt(previous.edge), x2: fmt(a), y1: at, y2: at };
          connectors.push(node("line", { ...ends, "data-ok-chart-connector": "" }));
        }
        previous = { edge: a + size, at: to };
        children.push(
          node("rect", {
            ...span(a, size, from, to, 1),
            rx: fmt(Math.min(4, size / 2, length / 2)),
            "data-ok-chart-bar": "",
            "data-ok-chart-step": step,
            "data-ok-color": color,
          }),
        );
        if (options.dataLabels) {
          const text = format.dataLabel(
            point.y,
            index,
            point.x,
            point.sum
              ? format.value(point.y, index)
              : chartSigned(point.y, format.value(point.y, index)),
          );
          const fits = horizontal
            ? length >= chartTextWidth(text) + 8 && size >= FONT + 2
            : length >= FONT + 6 && size >= chartTextWidth(text) + 4;
          const mid = (from + to) / 2;
          const across = a + size / 2;
          if (fits)
            labels.push(
              dataLabel(horizontal ? mid : across, horizontal ? across : mid, text, "inside"),
            );
        }
      }
      bars.push(node("g", seriesAttrs, [...connectors, ...children]));
      continue;
    }
    if (series.type === "rangeArea") {
      // A band between the low and high values, outlined at both edges; gaps break it.
      const segments: { high: Pt; low: Pt }[][] = [];
      let current: { high: Pt; low: Pt }[] = [];
      for (const point of [...points].sort((a, b) => a.x - b.x)) {
        if (!point.range) {
          if (current.length) segments.push(current);
          current = [];
          continue;
        }
        const x = posOf(point.x);
        const [low, high] = point.range as [number, number];
        current.push({ high: [x, toValue(high)], low: [x, toValue(low)] });
        marks.push({
          series: index,
          type: series.type,
          index: point.x,
          x: point.x,
          value: high,
          px: r2(x),
          py: r2(toValue(high)),
          color: series.color,
          range: point.range,
          ...pointOf(point),
        });
      }
      if (current.length) segments.push(current);
      const curve = options.curve ?? "smooth";
      const children: ChartNode[] = [];
      for (const segment of segments) {
        const highs = segment.map((p) => p.high);
        const lows = segment.map((p) => p.low).reverse();
        children.push(
          node("path", {
            d: `${linePath(highs, curve)}L${linePath(lows, curve).slice(1)}Z`,
            "data-ok-chart-area": "",
          }),
        );
      }
      for (const segment of segments)
        for (const edge of ["high", "low"] as const)
          children.push(
            node("path", {
              d: linePath(
                segment.map((p) => p[edge]),
                curve,
              ),
              "data-ok-chart-line": "",
            }),
          );
      areas.push(node("g", seriesAttrs, children));
      continue;
    }
    if (series.type === "bubble") {
      // Radius by the square root of the size, so areas compare like the values.
      const children: ChartNode[] = [];
      for (const point of points) {
        if (point.y === null) continue;
        const px = posOf(point.x);
        const py = toValue(point.y);
        const r =
          zMax > 0 && point.z !== undefined
            ? Math.max(4, bubbleMax * Math.sqrt(Math.abs(point.z) / zMax))
            : 4;
        marks.push({
          series: index,
          type: series.type,
          index: point.x,
          x: point.x,
          value: point.y,
          px: r2(px),
          py: r2(py),
          color: point.color ?? series.color,
          r: r2(r),
          ...(point.z !== undefined ? { z: point.z } : {}),
          ...pointOf(point),
        });
        children.push(
          node("circle", {
            cx: fmt(px),
            cy: fmt(py),
            r: fmt(r),
            "data-ok-chart-bubble": "",
            ...(point.color ? { "data-ok-color": point.color } : {}),
          }),
        );
      }
      scatters.push(node("g", seriesAttrs, children));
      continue;
    }
    const pts: { x: number; y: number }[] = points.filter(
      (p): p is { x: number; y: number } => p.y !== null,
    );
    const at = (point: { x: number; y: number }): Pt =>
      numeric ? [toX(point.x), toValue(point.y)] : [toCat(point.x), toValue(stackedValue(point))];
    for (const point of pts) {
      const [px, py] = at(point);
      marks.push({
        series: index,
        type: series.type,
        index: point.x,
        x: point.x,
        value: point.y,
        px: r2(px),
        py: r2(py),
        color: series.color,
        ...pointOf(point),
        ...(series.shape ? { shape: series.shape } : {}),
      });
      if (options.dataLabels && series.type !== "scatter") {
        const entry = percent && stacks ? stack.get(`${index}:${point.x}`) : undefined;
        labels.push(
          dataLabel(
            px,
            Math.max(FONT / 2, py - 12),
            entry
              ? format.dataLabel(
                  entry[1] - entry[0],
                  index,
                  point.x,
                  `${format.number(r1(entry[1] - entry[0]))}%`,
                )
              : format.dataLabel(point.y, index, point.x, format.value(point.y, index)),
            "outside",
          ),
        );
      }
    }
    /** A point's marker: the series' shape and size, or its discrete marker (4.18.62). */
    const markerOf = (
      point: { x: number; y: number; color?: ChartColor | undefined },
      size: number,
    ) => {
      const own = discrete.get(`${index}:${positions ? positions.get(point) : point.x}`);
      const radius = own ? (own.size ?? Math.max(size, 5)) : size;
      if (radius <= 0) return [];
      const [px, py] = at(point);
      const color = own?.color ?? point.color;
      return [
        chartMarkerNode(own?.shape ?? series.shape, px, py, radius, {
          "data-ok-chart-marker": "",
          ...(color ? { "data-ok-color": color } : {}),
        }),
      ];
    };
    if (series.type === "scatter") {
      const radius = options.markerSize ?? 5;
      scatters.push(
        node(
          "g",
          seriesAttrs,
          points
            .filter((p) => p.y !== null)
            .flatMap((p) => markerOf(p as { x: number; y: number }, radius)),
        ),
      );
      continue;
    }
    // Lines break at gaps (null values).
    const segments: Pt[][] = [];
    let current: Pt[] = [];
    const sorted = [...points].sort((a, b) => a.x - b.x);
    for (const point of sorted) {
      if (point.y === null) {
        if (current.length) segments.push(current);
        current = [];
      } else current.push(at(point as { x: number; y: number }));
    }
    if (current.length) segments.push(current);
    const curve = options.curve ?? "smooth";
    const children: ChartNode[] = [];
    if (series.type === "area") {
      // A pattern (4.18.62) replaces the gradient.
      const pattern = series.pattern ? patterns.fill(series.pattern, series.color) : undefined;
      const gradient = options.fill !== "solid" && !pattern;
      const id = `${options.idPrefix}-area-${index}`;
      if (gradient) {
        defs.push(
          node(
            "linearGradient",
            { id, x1: "0", y1: "0", x2: "0", y2: "1", "data-ok-color": series.color },
            [
              node("stop", { offset: "0", "stop-opacity": "0.4", "data-ok-chart-stop": "" }),
              node("stop", { offset: "1", "stop-opacity": "0", "data-ok-chart-stop": "" }),
            ],
          ),
        );
      }
      for (const segment of segments) {
        const first = segment[0] as Pt;
        const last = segment[segment.length - 1] as Pt;
        // Areas close on the zero line (or the axis edge when zero is out of range).
        const close = `L${fmt(last[0])},${fmt(base)}L${fmt(first[0])},${fmt(base)}Z`;
        children.push(
          node("path", {
            d: linePath(segment, curve) + close,
            "data-ok-chart-area": "",
            ...(gradient ? { fill: `url(#${id})` } : pattern ? { fill: pattern } : {}),
          }),
        );
      }
    }
    // Dashes and widths per series (4.18.62), else the chart's.
    const dash = series.dash
      ? { "stroke-dasharray": series.dash }
      : options.dashArray
        ? { "stroke-dasharray": fmt(options.dashArray) }
        : {};
    const lineWidth = series.width ?? options.strokeWidth;
    const stroke = lineWidth !== undefined ? { "stroke-width": fmt(lineWidth) } : {};
    for (const segment of segments) {
      children.push(
        node("path", {
          d: linePath(segment, curve),
          "data-ok-chart-line": "",
          ...dash,
          ...stroke,
        }),
      );
    }
    // Markers in x order (the segments' points); discrete markers also on series without markers.
    if (lineMarkerSize > 0 || discrete.size > 0)
      for (const point of sorted)
        if (point.y !== null)
          children.push(...markerOf(point as { x: number; y: number }, lineMarkerSize));
    (series.type === "area" ? areas : lines).push(node("g", seriesAttrs, children));
  }

  // Stack totals (4.18.61): past the end of each category's stacked bars (positives and negatives).
  if (options.stackTotals && stacked && !numeric) {
    const sums = new Map<string, { sum: number; end: number; x: number; axis: number }>();
    for (const { series, index } of visible) {
      const axis = axisOf(index);
      if (series.type !== "bar" || !stacksOn(series, axis)) continue;
      for (const point of series.points) {
        if (point.y === null || point.y === 0 || !inView(point.x)) continue;
        const key = endKey(index, point.y, point.x);
        const end = (stack.get(`${index}:${point.x}`) as readonly [number, number])[1];
        const entry = sums.get(key) ?? { sum: 0, end, x: point.x, axis };
        entry.sum += point.y;
        entry.end = point.y > 0 ? Math.max(entry.end, end) : Math.min(entry.end, end);
        sums.set(key, entry);
      }
    }
    for (const { sum, end, x, axis } of sums.values()) {
      const at = toValueOf(axis)(end);
      const up = sum > 0 !== (specOf(axis)?.reversed === true);
      const text = format.value(sum, -1);
      labels.push(
        node(
          "text",
          horizontal
            ? {
                x: fmt(at + (up ? 6 : -6)),
                y: fmt(toCat(x)),
                dy: "0.35em",
                "text-anchor": up ? "start" : "end",
                "data-ok-chart-data-label": "total",
              }
            : {
                x: fmt(toCat(x)),
                y: fmt(up ? Math.max(FONT / 2, at - 12) : at + 12),
                dy: "0.35em",
                "text-anchor": "middle",
                "data-ok-chart-data-label": "total",
              },
          undefined,
          text,
        ),
      );
    }
  }
  // Background bars (4.18.61): a track the height of the plot behind each bar slot.
  const tracks: ChartNode[] = [];
  const trackColors = options.backgroundBarColors ?? [];
  if ((options.backgroundBars || trackColors.length > 0) && barSeries.length > 0 && !numeric) {
    const slots = stacked ? 1 : barSeries.length;
    const size = groupSize / slots;
    const radius = fmt(Math.max(0, Math.min(options.backgroundBarRadius ?? 4, size / 2)));
    const opacity = options.backgroundBarOpacity;
    for (let i = first; i <= last; i++) {
      const color = trackColors[i % Math.max(1, trackColors.length)];
      for (let slot = 0; slot < slots; slot++) {
        const a = toCat(i) - groupSize / 2 + slot * size;
        tracks.push(
          node("rect", {
            ...(horizontal
              ? { x: fmt(plot.x), y: fmt(a), width: fmt(plot.width), height: fmt(size) }
              : { x: fmt(a), y: fmt(plot.y), width: fmt(size), height: fmt(plot.height) }),
            rx: radius,
            "data-ok-chart-background-bar": "",
            ...(color ? { "data-ok-color": color } : {}),
            ...(opacity !== undefined ? { "fill-opacity": fmt(clamp(opacity, 0, 1)) } : {}),
          }),
        );
      }
    }
  }

  // Grid (4.18.64): stripes, then horizontal and vertical lines as asked (horizontal by default).
  const gridMode = options.grid;
  const stripes = (
    positions: readonly number[],
    colors: readonly ChartStripeColor[] | undefined,
    opacity: number | undefined,
    kind: "row" | "column",
  ) => {
    if (!colors?.length) return;
    const sorted = [...positions].sort((a, b) => a - b);
    for (let i = 0; i + 1 < sorted.length; i++) {
      const color = colors[i % colors.length] as ChartStripeColor;
      if (color === "transparent") continue;
      const [a, b] = [sorted[i] as number, sorted[i + 1] as number];
      grid.push(
        node("rect", {
          ...(kind === "row"
            ? { x: fmt(plot.x), y: fmt(a), width: fmt(plot.width), height: fmt(b - a) }
            : { x: fmt(a), y: fmt(plot.y), width: fmt(b - a), height: fmt(plot.height) }),
          "fill-opacity": fmt(clamp(opacity ?? 0.5, 0, 1)),
          "data-ok-chart-stripe": kind,
          ...(color === "grey" ? {} : { "data-ok-color": color }),
        }),
      );
    }
  };
  stripes(gridRows, options.gridRowColors, options.gridRowOpacity, "row");
  stripes(gridColumns, options.gridColumnColors, options.gridColumnOpacity, "column");
  if (gridMode === undefined || gridMode === "y" || gridMode === "both")
    for (const at of gridRows) {
      const y = fmt(at);
      grid.push(
        node("line", {
          x1: fmt(plot.x),
          x2: fmt(plot.x + plot.width),
          y1: y,
          y2: y,
          "data-ok-chart-grid-line": "",
        }),
      );
    }
  if (gridMode === "x" || gridMode === "both")
    for (const at of gridColumns) {
      const x = fmt(at);
      grid.push(
        node("line", {
          x1: x,
          x2: x,
          y1: fmt(plot.y),
          y2: fmt(plot.y + plot.height),
          "data-ok-chart-grid-line": "",
        }),
      );
    }

  defs.push(...patterns.nodes());
  if (defs.length) nodes.push(node("defs", {}, defs));
  if (!sparkline) nodes.push(node("g", { "data-ok-chart-grid": "" }, grid));
  // Horizontal bars: the value axis title beside the categories, at the left edge.
  const title0 = titleOf(0);
  if (horizontal && title0) yTitles.push(axisTitle(FONT, plot.y + plot.height / 2, -90, title0));
  nodes.push(...yTitles);
  if (xTitle) {
    // The x axis title (4.18.59), centered under the labels.
    nodes.push(
      node(
        "text",
        {
          x: fmt(plot.x + plot.width / 2),
          y: fmt(plot.y + plot.height + gap + FONT + 8),
          dy: "0.71em",
          "text-anchor": "middle",
          "data-ok-chart-axis-title": "x",
        },
        undefined,
        xTitle,
      ),
    );
  }
  if (!sparkline) {
    nodes.push(node("g", { "data-ok-chart-axis": "x" }, axisX));
    nodes.push(...(yAxisNodes ?? [node("g", { "data-ok-chart-axis": "y" }, axisY)]));
  }
  if (tracks.length) nodes.push(node("g", { "data-ok-chart-background-bars": "" }, tracks));
  nodes.push(node("g", { "data-ok-chart-crosshair": "" }, []));
  nodes.push(
    node("g", { "data-ok-chart-series-group": "" }, [...areas, ...bars, ...lines, ...scatters]),
  );
  if (labels.length) nodes.push(node("g", { "data-ok-chart-data-labels": "" }, labels));
  nodes.push(node("g", { "data-ok-chart-active": "" }, []));

  return {
    width,
    height,
    plot: { x: r2(plot.x), y: r2(plot.y), width: r2(plot.width), height: r2(plot.height) },
    mode,
    horizontal,
    banded,
    band: r2(band),
    slots,
    marks,
    activeRadius:
      mode === "point"
        ? (options.markerSize ?? 5) + 2
        : visible.every(({ series }) => BANDED.includes(series.type))
          ? 0
          : Math.max(markerSize + 2, 5),
    nodes,
    ...(horizontal
      ? {}
      : {
          x: numeric
            ? { kind: "value", min: xMin, max: xMax, from: plot.x, to: plot.x + plot.width }
            : {
                kind: "index",
                min: first,
                max: Math.max(first, last),
                from: r2(toCat(first)),
                to: r2(toCat(Math.max(first, last))),
                ...(banded ? { band: r2(band) } : {}),
              },
          y: {
            kind: "value",
            min: valueScale.min,
            max: valueScale.max,
            from: r2(toValue(valueScale.min)),
            to: r2(toValue(valueScale.max)),
            ...(valueScale.log !== undefined ? { log: valueScale.log } : {}),
          },
        }),
  };
}
