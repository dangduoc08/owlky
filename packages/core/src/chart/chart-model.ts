import { paletteColorNames } from "@owlky/tokens";
import { pick } from "../options/define.js";
import { toTimestamp } from "./chart-scale.js";

/*
 * Chart data model (ADR-0024). React passes series as props; the HTML runtime reads them from the
 * chart's data table. Both become the same `ChartData`, so layout and drawing are shared.
 */

export const chartTypes = [
  "line",
  "area",
  "bar",
  "scatter",
  "pie",
  "donut",
  "radialBar",
  "radar",
  "boxPlot",
  "heatmap",
  "treemap",
  "bubble",
  "rangeArea",
  "funnel",
  "slope",
  "candlestick",
  "rangeBar",
  "timeline",
  "polarArea",
  "sankey",
  "waterfall",
  "dumbbell",
] as const;
/** Charts of one series whose categories are slices or rings (legend items are categories). */
export const chartCircularTypes = ["pie", "donut", "radialBar", "polarArea"] as const;
export const chartCurves = ["smooth", "straight", "stepline"] as const;
export const chartLegends = ["top", "right", "bottom", "none"] as const;
export const chartXTypes = ["category", "datetime", "numeric"] as const;
export const chartFills = ["gradient", "solid", "pattern"] as const;
export const chartShades = ["lighter", "light", "main", "dark", "darker"] as const;
/** Stacks (4.18.61): values on each other (`normal`) or as shares of their category (`100%`). */
export const chartStackTypes = ["normal", "100%"] as const;
/** Where values sit inside bars (4.18.61): the middle, the value end or the base. */
export const chartDataLabelPositions = ["center", "top", "bottom"] as const;

export type ChartType = (typeof chartTypes)[number];
export type ChartCurve = (typeof chartCurves)[number];
export type ChartLegend = (typeof chartLegends)[number];
export type ChartXType = (typeof chartXTypes)[number];
export type ChartFill = (typeof chartFills)[number];
export type ChartStackType = (typeof chartStackTypes)[number];
/** Marker shapes (4.18.62, ApexCharts `markers.shape`). */
export const chartMarkerShapes = [
  "circle",
  "square",
  "triangle",
  "diamond",
  "cross",
  "plus",
  "star",
] as const;
export type ChartMarkerShape = (typeof chartMarkerShapes)[number];
/** Pattern fills (4.18.62, ApexCharts `fill.pattern.style`); `colorBlindMode` uses them in this order. */
export const chartPatterns = [
  "slantedLines",
  "squares",
  "circles",
  "horizontalLines",
  "verticalLines",
] as const;
export type ChartPattern = (typeof chartPatterns)[number];
export const isChartMarkerShape = (value: unknown): value is ChartMarkerShape =>
  chartMarkerShapes.includes(value as ChartMarkerShape);
export const isChartPattern = (value: unknown): value is ChartPattern =>
  chartPatterns.includes(value as ChartPattern);
export type ChartDataLabelPosition = (typeof chartDataLabelPositions)[number];
/** Tooltip modes (4.18.63): every series of a category, the point under the pointer, or none. */
export const chartTooltipModes = ["shared", "point", "none"] as const;
export type ChartTooltipMode = (typeof chartTooltipModes)[number];
/** Corners of the plot a fixed tooltip sits in (ApexCharts `tooltip.fixed.position`). */
export const chartTooltipCorners = ["topLeft", "topRight", "bottomLeft", "bottomRight"] as const;
export type ChartTooltipCorner = (typeof chartTooltipCorners)[number];
/** Grid lines (4.18.64): horizontal (`y`), vertical (`x`), both or none. */
export const chartGrids = ["y", "x", "both", "none"] as const;
export type ChartGrid = (typeof chartGrids)[number];
/** Legend alignment (4.18.64, ApexCharts `legend.horizontalAlign`). */
export const chartLegendAligns = ["left", "center", "right"] as const;
export type ChartLegendAlign = (typeof chartLegendAligns)[number];
/** A grid stripe color: a palette color, the neutral `grey`, or `transparent` (no stripe). */
export type ChartStripeColor = ChartColor | "grey" | "transparent";
type Palette = (typeof paletteColorNames)[number];
export type ChartCircularType = (typeof chartCircularTypes)[number];

/** Whether a chart type draws slices or rings (pie, donut, radial bar). */
export const isCircularChart = (type: ChartType): type is ChartCircularType =>
  chartCircularTypes.includes(type as ChartCircularType);
/** Whether a chart type is drawn around a center (circular charts and radar). */
export const isPolarChart = (type: ChartType): boolean => type === "radar" || isCircularChart(type);
const wholeTypes: readonly ChartType[] = [
  "radar",
  ...chartCircularTypes,
  "heatmap",
  "treemap",
  "funnel",
  "slope",
  "rangeBar",
  "timeline",
  "sankey",
  "waterfall",
  "dumbbell",
];
/** Whether a chart type draws every series the same way (no mixed charts). */
export const isWholeChart = (type: ChartType): boolean => wholeTypes.includes(type);
type Shade = (typeof chartShades)[number];

/**
 * Values of a point beyond `y`, by series type (phase 3): box plots have five, range areas two,
 * bubbles a size. Data tables give each part its own column (`th[data-ok-part]`).
 */
export type ChartPart =
  | "min"
  | "q1"
  | "median"
  | "q3"
  | "max"
  | "low"
  | "high"
  | "y"
  | "z"
  | "open"
  | "close"
  | "start"
  | "end"
  | "source"
  | "target"
  | "incoming"
  | "outgoing"
  | "volume"
  | "total";
const PARTS: Partial<Record<ChartType, readonly ChartPart[]>> = {
  boxPlot: ["min", "q1", "median", "q3", "max"],
  rangeArea: ["low", "high"],
  bubble: ["y", "z"],
  // Phase 4: candles keep ApexCharts' order (open, high, low, close); range bars start and end.
  candlestick: ["open", "high", "low", "close"],
  rangeBar: ["start", "end"],
  timeline: ["start", "end"],
  // Dumbbells (4.18.21): the two ends in the order given (never sorted).
  dumbbell: ["start", "end"],
};
export const chartParts = (type: ChartType): readonly ChartPart[] => PARTS[type] ?? [];
/** Every part name (an allowlist for labels read from tables and props). */
export const chartPartNames: readonly ChartPart[] = [
  "min",
  "q1",
  "median",
  "q3",
  "max",
  "low",
  "high",
  "y",
  "z",
  "open",
  "close",
  "start",
  "end",
  "source",
  "target",
  "incoming",
  "outgoing",
  "volume",
  "total",
];
/** Default text of each part (table headers and tooltip rows). */
export const chartPartLabels: Readonly<Record<ChartPart, string>> = {
  min: "Minimum",
  q1: "Q1",
  median: "Median",
  q3: "Q3",
  max: "Maximum",
  low: "Low",
  high: "High",
  y: "Value",
  z: "Size",
  open: "Open",
  close: "Close",
  start: "Start",
  end: "End",
  // Sankey charts (ADR-0047): table headers and tooltip rows.
  source: "From",
  target: "To",
  incoming: "Incoming",
  outgoing: "Outgoing",
  // Stock charts (ADR-0047): a price point's volume (`v`).
  volume: "Volume",
  // Waterfall charts (4.18.21): the running total after a step (tooltip rows).
  total: "Total",
};

/** One value of a point that has several: a number, or a date (timelines: ISO 8601, ms or Date). */
export type ChartRangeValue = number | string | Date;

/** A palette color (`main`) or one of its shades: `"info"`, `"primary-dark"`. */
export type ChartColor = Palette | `${Palette}-${Shade}`;

/** Every color a series or a point may use (an allowlist: other values are ignored). */
export const chartColors: readonly ChartColor[] = paletteColorNames.flatMap((name) => [
  name,
  ...chartShades.map((shade) => `${name}-${shade}` as ChartColor),
]);

/** Series colors in order when none is given (the reference's chart palette). */
export const chartDefaultColors: readonly ChartColor[] = [
  "primary-dark",
  "warning",
  "info",
  "error",
  "success",
  "warning-dark",
  "success-darker",
  "info-dark",
  "info-darker",
];

/**
 * A point: a value, `null` (a gap), an `[x, y]` pair, an `[x, y, z]` triple (bubbles) or
 * `{ x, y, z, color }`. Box plots take five values in `y` (minimum, Q1, median, Q3, maximum),
 * range areas and range bars two (low, high), candles four (open, high, low, close), timelines
 * two dates (start, end). Without `categories`, a text `x` names the point's category.
 */
export type ChartPointInput =
  | number
  | null
  | readonly [x: number | string | Date, y: number | readonly ChartRangeValue[] | null, z?: number]
  | {
      readonly x?: number | string | Date;
      readonly y: number | readonly ChartRangeValue[] | null;
      readonly z?: number | undefined;
      readonly color?: ChartColor | undefined;
      /** Stock charts: the bar's traded volume (ApexStock's `v`). */
      readonly v?: number | undefined;
      /** Waterfall charts: the bar shows the running total (its `y` is ignored). */
      readonly isTotal?: boolean | undefined;
      /** Waterfall charts: a subtotal bar, the running total in the subtotal color. */
      readonly isSubtotal?: boolean | undefined;
    }
  | {
      readonly x?: number | string | Date;
      /** Waterfall charts: a bar of the running total so far (ApexCharts `isTotal`). */
      readonly isTotal?: boolean | undefined;
      /** Waterfall charts: a subtotal bar (ApexCharts `isSubtotal`). */
      readonly isSubtotal?: boolean | undefined;
      readonly color?: ChartColor | undefined;
    };

export interface ChartSeries {
  readonly name: string;
  readonly data: readonly ChartPointInput[];
  /** Mixed charts: how this series is drawn (default: the chart's `type`). */
  readonly type?: ChartType | undefined;
  readonly color?: ChartColor | undefined;
  /**
   * Charts with several value axes: the index of this series' axis in `yaxis` (default the axis
   * naming it in `seriesName`, else the axis at its position).
   */
  readonly yAxis?: number | undefined;
  /** Marker shape of this series (4.18.62; default the chart's `markerShape`). */
  readonly markerShape?: ChartMarkerShape | undefined;
  /** Pattern fill of this series' bars or area (4.18.62). */
  readonly fillPattern?: ChartPattern | undefined;
  /** Line width of this series in px (4.18.62; default the chart's `strokeWidth`). */
  readonly strokeWidth?: number | undefined;
  /** Dash length of this series' line in px (4.18.62; default the chart's `dashArray`). */
  readonly dashArray?: number | undefined;
}

export interface ChartPoint {
  /** Position on the x axis: the category index (category / datetime) or the x value (numeric). */
  readonly x: number;
  /** The value (box plots: the median; range areas: the high value). */
  readonly y: number | null;
  readonly color?: ChartColor | undefined;
  /** Every value of a box plot (five, ascending) or a range area (low, high). */
  readonly range?: readonly number[] | undefined;
  /** Bubble size. */
  readonly z?: number | undefined;
  /** Stock charts: the volume of the bar. */
  readonly volume?: number | undefined;
  /**
   * Waterfall charts (4.18.21): a bar of the running total (`range` is `[0, total]`, `y` the
   * total). Steps have none: `range` is `[before, after]`, `y` the change.
   */
  readonly sum?: ChartSum | undefined;
}

/** Waterfall bars that show the running total (ApexCharts `isTotal` / `isSubtotal`). */
export type ChartSum = "total" | "subtotal";
export const isChartSum = (value: unknown): value is ChartSum =>
  value === "total" || value === "subtotal";

export interface ChartDataSeries {
  readonly name: string;
  readonly type: ChartType;
  readonly color: ChartColor;
  readonly points: readonly ChartPoint[];
  /** Stock charts (ADR-0047): a series generated by this indicator (`th[data-ok-indicator]`). */
  readonly indicator?: string | undefined;
  /** Stock charts: the pane it is drawn in (0, the price, by default). */
  readonly pane?: number | undefined;
  /** `false`: left out of the data table (volume bars: the price column holds the volume). */
  readonly table?: false | undefined;
  /** Stock panes: a fixed value scale (RSI 0–100) and dashed reference lines. */
  readonly scale?: { readonly min: number; readonly max: number } | undefined;
  readonly guides?: readonly number[] | undefined;
  /** Charts with several value axes: the axis it is drawn on (an index in `yaxis`). */
  readonly axis?: number | undefined;
  /** The series' own cues as given (4.18.62; written on its table column). */
  readonly markerShape?: ChartMarkerShape | undefined;
  readonly fillPattern?: ChartPattern | undefined;
  readonly strokeWidth?: number | undefined;
  readonly dashArray?: number | undefined;
  /** Resolved cues (`withChartCues`): drawn marker shape, pattern, dash and line width. */
  readonly shape?: ChartMarkerShape | undefined;
  readonly pattern?: ChartPattern | undefined;
  readonly dash?: string | undefined;
  readonly width?: number | undefined;
}

export interface ChartData {
  readonly type: ChartType;
  readonly xType: ChartXType;
  /** Category labels (category) or timestamps (datetime); empty for numeric axes. */
  readonly categories: readonly (string | number)[];
  readonly series: readonly ChartDataSeries[];
}

const isColor = (value: unknown): value is ChartColor => chartColors.includes(value as ChartColor);

/** The lighter tone of a color (radial bar gradients, the lower half of box plots). */
export function lighterTone(color: ChartColor): ChartColor {
  const [name, shade = "main"] = color.split("-") as [string, string | undefined];
  const index = chartShades.indexOf(shade as Shade);
  return `${name}-${chartShades[Math.max(0, index - 1)]}` as ChartColor;
}

/** A finite number from a number or numeric text ("1,234.5", "-12%"); otherwise `null`. */
export function parseChartNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value !== "string" || value.length > 40) return null;
  const text = value.replace(/[\s,]/g, "").replace(/%$/, "").replace(/^−/, "-");
  if (!/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(text)) return null;
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

/** A numeric x value (scatter), or `undefined`. */
const numericX = (value: unknown): number | undefined => {
  const parsed = parseChartNumber(value);
  return parsed === null ? undefined : parsed;
};

/** Trimmed text of a cell; missing cells are empty. */
const cellText = (cell: Element | undefined): string => cell?.textContent?.trim() ?? "";

/**
 * Normalizes series and categories. Unknown types, colors and non-finite numbers fall back
 * (untrusted input never reaches the DOM). Category charts index points by position; numeric
 * charts (scatter) need `[x, y]` pairs or `{ x, y }`.
 */
export function chartData(input: {
  type?: unknown;
  xType?: unknown;
  series: readonly ChartSeries[];
  categories?: readonly (string | number | Date)[] | undefined;
  colors?: readonly ChartColor[] | undefined;
}): ChartData {
  const type = pick(chartTypes, input.type, "line");
  const xType = pick(
    chartXTypes,
    input.xType,
    type === "scatter" || type === "bubble" ? "numeric" : "category",
  );
  const palette = (input.colors ?? []).filter(isColor);
  const categories: (string | number)[] = [];
  if (xType === "category")
    for (const label of input.categories ?? []) categories.push(String(label));
  else if (xType === "datetime") {
    for (const value of input.categories ?? []) {
      const time = toTimestamp(value);
      if (time !== undefined) categories.push(time);
    }
  }
  const whole = isWholeChart(type);
  const circular = isCircularChart(type);
  /** A point's own x on a category or date axis: its category, found or added (no `categories`). */
  const categoryOf = (raw: unknown, position: number): number | undefined => {
    if (input.categories !== undefined || raw === undefined) return position;
    const key = xType === "datetime" ? toTimestamp(raw) : String(raw);
    if (key === undefined) return undefined;
    if (!categories.includes(key)) categories.push(key);
    return categories.indexOf(key);
  };
  const series = input.series.map((entry, index): ChartDataSeries => {
    // Whole charts draw every series the same way, and mixed charts can't use whole types.
    const own = pick(chartTypes, entry.type, type);
    const seriesType = whole || isWholeChart(own) ? type : own;
    const parts = seriesType === "bubble" ? 0 : chartParts(seriesType).length;
    const points: ChartPoint[] = [];
    entry.data.forEach((raw, position) => {
      let x: number | undefined = xType === "numeric" ? undefined : position;
      let rawY: unknown = raw;
      let rawZ: unknown;
      let rawV: unknown;
      let color: ChartColor | undefined;
      let sum: ChartSum | undefined;
      if (Array.isArray(raw)) {
        const [rx, ry, rz] = raw as readonly [unknown, unknown, unknown];
        x = xType === "numeric" ? numericX(rx) : categoryOf(rx, position);
        rawY = ry;
        rawZ = rz;
      } else if (raw !== null && typeof raw === "object") {
        const point = raw as {
          x?: unknown;
          y?: unknown;
          z?: unknown;
          v?: unknown;
          color?: unknown;
          isTotal?: unknown;
          isSubtotal?: unknown;
        };
        x = xType === "numeric" ? numericX(point.x) : categoryOf(point.x, position);
        rawY = point.y;
        rawZ = point.z;
        rawV = point.v;
        if (isColor(point.color)) color = point.color;
        if (seriesType === "waterfall")
          sum =
            point.isTotal === true ? "total" : point.isSubtotal === true ? "subtotal" : undefined;
      }
      if (x === undefined) return;
      let y: number | null;
      let range: number[] | undefined;
      if (parts > 0) {
        // Box plots and ranges: every value or none, sorted (a box is never inside out); candles
        // keep their order (y is the close). Timelines take dates.
        const parse = (value: unknown) =>
          seriesType === "timeline" ? (toTimestamp(value) ?? null) : parseChartNumber(value);
        const values = Array.isArray(rawY) ? rawY.map(parse) : [];
        if (values.length === parts && values.every((value) => value !== null))
          range =
            seriesType === "candlestick" || seriesType === "dumbbell"
              ? (values as number[])
              : (values as number[]).sort((a, b) => a - b);
        y = range ? (range[parts === 5 ? 2 : parts === 4 ? 3 : 1] as number) : null;
      } else y = Array.isArray(rawY) ? null : parseChartNumber(rawY);
      const z = seriesType === "bubble" ? parseChartNumber(rawZ) : null;
      const volume = rawV === undefined ? null : parseChartNumber(rawV);
      // Circular charts color each slice (ring): its own color, `colors` or the default order.
      if (circular && !color)
        color =
          palette[position] ??
          (chartDefaultColors[position % chartDefaultColors.length] as ChartColor);
      points.push({
        x,
        y,
        ...(color ? { color } : {}),
        ...(range ? { range } : {}),
        ...(z !== null ? { z } : {}),
        ...(volume !== null && volume >= 0 ? { volume } : {}),
        ...(sum ? { sum } : {}),
      });
    });
    if (seriesType === "waterfall") runningTotals(points);
    const fallback =
      palette[index] ?? (chartDefaultColors[index % chartDefaultColors.length] as ChartColor);
    const axis = entry.yAxis;
    const strokeWidth = parseChartNumber(entry.strokeWidth);
    const dashArray = parseChartNumber(entry.dashArray);
    return {
      name: String(entry.name),
      type: seriesType,
      color: isColor(entry.color) ? entry.color : fallback,
      points,
      ...(Number.isInteger(axis) && (axis as number) >= 0 && (axis as number) < 10
        ? { axis: axis as number }
        : {}),
      ...(isChartMarkerShape(entry.markerShape) ? { markerShape: entry.markerShape } : {}),
      ...(isChartPattern(entry.fillPattern) ? { fillPattern: entry.fillPattern } : {}),
      ...(strokeWidth !== null && strokeWidth >= 0 && strokeWidth <= 50 ? { strokeWidth } : {}),
      ...(dashArray !== null && dashArray >= 0 && dashArray <= 500 ? { dashArray } : {}),
    };
  });
  return { type, xType, categories, series };
}

/**
 * Waterfall charts (4.18.21): each step floats from the running total before it to the total
 * after it; total and subtotal bars run from 0 to the running total (in x order, gaps skipped).
 */
function runningTotals(points: ChartPoint[]) {
  let total = 0;
  const order = points
    .map((point, index) => ({ point, index }))
    .sort((a, b) => a.point.x - b.point.x);
  for (const { point, index } of order) {
    if (point.sum) {
      points[index] = { ...point, y: total, range: [0, total] };
    } else if (point.y !== null) {
      points[index] = { ...point, range: [total, total + point.y] };
      total += point.y;
    }
  }
}

// --- Data table (the accessible view of the data; the HTML source) ------------------------------

export interface ChartTableCell {
  readonly text: string;
  /** `data-ok-*` attributes of the cell (series type / color, raw x value, point color, part). */
  readonly attrs: Readonly<Record<string, string>>;
  /** Header cells: a series of several values spans their columns. */
  readonly colSpan?: number | undefined;
  /** Header cells: spans both header rows (tables with a second header row). */
  readonly rowSpan?: number | undefined;
}

export interface ChartTableModel {
  readonly head: readonly ChartTableCell[];
  /**
   * The second header row: one cell per value of the series that have several (box plots,
   * range areas, bubbles). Empty when every series has one value (one header row).
   */
  readonly parts: readonly ChartTableCell[];
  readonly rows: readonly {
    readonly header: ChartTableCell;
    readonly cells: readonly ChartTableCell[];
  }[];
}

const isoDate = (time: number) => {
  const iso = new Date(time).toISOString();
  return iso.endsWith("T00:00:00.000Z") ? iso.slice(0, 10) : iso.replace(".000Z", "Z");
};

/**
 * The data table React renders and HTML authors write: one row per x value, one column per
 * series (one per value for box plots, range areas and bubbles, under a second header row).
 * `formatX` / `formatValue` give the visible text; raw values that differ from the text go into
 * `data-ok-value`.
 */
export function chartTable(
  data: ChartData,
  options: {
    xLabel: string;
    formatX: (x: string | number) => string;
    formatValue: (value: number, series: number) => string;
    /** Bubble sizes (default `String`). */
    formatNumber?: ((value: number) => string) | undefined;
    /** Series types written on the column headers (`true` for mixed charts). */
    seriesTypes?: boolean;
    /** Header text of each part (default `chartPartLabels`). */
    partLabels?: Readonly<Partial<Record<ChartPart, string>>> | undefined;
  },
): ChartTableModel {
  // Generated series that carry no table column (stock volume bars) are left out.
  const tabled = data.series
    .map((series, index) => ({ series, index }))
    .filter(({ series }) => series.table !== false);
  // A series whose points have a volume gets a Volume column after its values.
  const partsOf = data.series.map((series): readonly ChartPart[] => {
    const parts = chartParts(series.type);
    if (!series.points.some((point) => point.volume !== undefined)) return parts;
    return [...(parts.length ? parts : (["y"] as const)), "volume"];
  });
  const two = tabled.some(({ index }) => (partsOf[index] as readonly ChartPart[]).length > 0);
  const head: ChartTableCell[] = [
    { text: options.xLabel, attrs: {}, ...(two ? { rowSpan: 2 } : {}) },
    ...tabled.map(({ series, index }) => {
      const count = (partsOf[index] as readonly ChartPart[]).length;
      return {
        text: series.name,
        attrs: {
          ...(series.indicator ? { "data-ok-indicator": series.indicator } : {}),
          ...(options.seriesTypes && !series.indicator ? { "data-ok-type": series.type } : {}),
          "data-ok-color": series.color,
          // Several value axes (4.18.59): the series' axis, read back by the HTML runtime.
          ...(series.axis !== undefined ? { "data-ok-y-axis": String(series.axis) } : {}),
          // Series cues (4.18.62), read back by the HTML runtime.
          ...(series.markerShape ? { "data-ok-marker-shape": series.markerShape } : {}),
          ...(series.fillPattern ? { "data-ok-fill-pattern": series.fillPattern } : {}),
          ...(series.strokeWidth !== undefined
            ? { "data-ok-stroke-width": String(series.strokeWidth) }
            : {}),
          ...(series.dashArray !== undefined
            ? { "data-ok-dash-array": String(series.dashArray) }
            : {}),
        },
        ...(count > 0 ? { colSpan: count } : two ? { rowSpan: 2 } : {}),
      };
    }),
  ];
  const parts: ChartTableCell[] = tabled.flatMap(({ index }) =>
    (partsOf[index] as readonly ChartPart[]).map((part) => ({
      text: options.partLabels?.[part] ?? chartPartLabels[part],
      attrs: { "data-ok-part": part },
    })),
  );
  const formatNumber = options.formatNumber ?? String;
  // Timeline values are dates: their raw value is ISO 8601, as on date axes.
  const raw = (value: number) => (data.type === "timeline" ? isoDate(value) : String(value));
  const cell = (value: number, text: string, color?: ChartColor): ChartTableCell => ({
    text,
    attrs: {
      ...(text !== raw(value) ? { "data-ok-value": raw(value) } : {}),
      ...(color ? { "data-ok-color": color } : {}),
    },
  });
  const empty: ChartTableCell = { text: "", attrs: {} };
  // One row per x value; an x that holds several points of a series (scatter) gets one row per
  // point, so no value is lost: row `k` of an x holds the k-th point of each series.
  const xs: number[] =
    data.xType === "numeric"
      ? [...new Set(data.series.flatMap((series) => series.points.map((point) => point.x)))].sort(
          (a, b) => a - b,
        )
      : data.categories.map((_, index) => index);
  const rows: { header: ChartTableCell; cells: ChartTableCell[] }[] = [];
  for (const x of xs) {
    const raw = data.xType === "numeric" ? x : (data.categories[x] as string | number);
    const text = options.formatX(raw);
    const attrs: Record<string, string> =
      data.xType === "datetime"
        ? { "data-ok-value": isoDate(raw as number) }
        : data.xType === "numeric" && text !== String(raw)
          ? { "data-ok-value": String(raw) }
          : {};
    const at = data.series.map((series) => series.points.filter((p) => p.x === x));
    const count = Math.max(1, ...at.map((points) => points.length));
    for (let k = 0; k < count; k++) {
      const cells = tabled.flatMap(({ index }): ChartTableCell[] => {
        const point = (at[index] as ChartPoint[])[k];
        const list = partsOf[index] as readonly ChartPart[];
        const volume = list.at(-1) === "volume";
        const width = Math.max(1, list.length) - (volume ? 1 : 0);
        // Stock charts: the volume after the values (a plain number).
        const tail =
          volume && point?.volume !== undefined
            ? [cell(point.volume, formatNumber(point.volume))]
            : volume
              ? [empty]
              : [];
        if (!point || point.y === null)
          return [...Array.from({ length: width }, () => empty), ...tail];
        // Waterfall charts: one cell per point, the change or (sums) the running total.
        if (data.series[index]?.type === "waterfall") {
          const own = cell(point.y, options.formatValue(point.y, index), point.color);
          return [point.sum ? { ...own, attrs: { ...own.attrs, "data-ok-sum": point.sum } } : own];
        }
        if (point.range)
          return [
            ...point.range.map((value, i) =>
              cell(value, options.formatValue(value, index), i === 0 ? point.color : undefined),
            ),
            ...tail,
          ];
        const main = cell(point.y, options.formatValue(point.y, index), point.color);
        if (volume) return [main, ...tail];
        if (list.length === 0) return [main];
        // Bubbles: the value, then the size.
        return [main, point.z === undefined ? empty : cell(point.z, formatNumber(point.z))];
      });
      rows.push({ header: { text, attrs }, cells });
    }
  }
  return { head, parts, rows };
}

/**
 * Reads series and categories from a chart data table (HTML). Missing cells are gaps. A second
 * header row names the values of series that have several (`th[data-ok-part]` under a header
 * spanning them).
 */
export function readChartTable(
  table: HTMLTableElement,
  xType: ChartXType,
  type?: ChartType,
): {
  series: ChartSeries[];
  categories: (string | number)[];
  /** The text of each part's header (localized labels, phase 4). */
  partLabels?: Partial<Record<ChartPart, string>>;
} {
  const headRows = table.tHead ? [...table.tHead.rows] : [...table.rows].slice(0, 1);
  const headRow = headRows[0];
  if (!headRow) return { series: [], categories: [] };
  const partCells = [...(headRows[1]?.cells ?? [])];
  const partLabels: Partial<Record<ChartPart, string>> = {};
  for (const cell of partCells) {
    const part = cell.getAttribute("data-ok-part") as ChartPart;
    const label = cellText(cell);
    if (chartPartNames.includes(part) && label && !partLabels[part]) partLabels[part] = label;
  }
  const dates = type === "timeline";
  const bodyRows = [...table.rows].filter((row) => !headRows.includes(row));
  const raw = (cell: Element | undefined) => cell?.getAttribute("data-ok-value") ?? cellText(cell);
  const categories: (string | number)[] = [];
  const xs: unknown[] = [];
  for (const row of bodyRows) {
    const first = row.cells[0];
    if (xType === "category") categories.push(cellText(first));
    else if (xType === "datetime") {
      const time = toTimestamp(raw(first));
      categories.push(time ?? Number.NaN);
    }
    xs.push(raw(first));
  }
  let column = 1;
  let next = 0;
  const series = [...headRow.cells].slice(1).flatMap((header): ChartSeries[] => {
    // A header over a second header row spans the columns of its values.
    const spans = partCells.length > 0 && header.rowSpan < 2;
    const parts = spans
      ? partCells.slice(next, next + header.colSpan).map((c) => c.getAttribute("data-ok-part"))
      : [];
    if (spans) next += header.colSpan;
    const first = column;
    column += spans ? header.colSpan : 1;
    // Stock charts: indicator columns are computed, never read back (ADR-0047).
    if (header.hasAttribute("data-ok-indicator")) return [];
    // A Volume column after the values (stock charts): read apart from them.
    const volumeAt = parts.indexOf("volume");
    if (volumeAt >= 0) parts.splice(volumeAt, 1);
    const data: ChartPointInput[] = bodyRows.map((row, index) => {
      const cell = row.cells[first];
      const value = (at: number) => {
        const text = raw(row.cells[at]);
        if (text === "") return null;
        return dates ? (toTimestamp(text) ?? null) : parseChartNumber(text);
      };
      const color = cell?.getAttribute("data-ok-color");
      // Waterfall charts: a cell of the running total (its text is the computed total).
      const sum = cell?.getAttribute("data-ok-sum");
      const v = volumeAt >= 0 ? value(first + volumeAt) : null;
      let y: number | number[] | null;
      let z: number | null = null;
      if (parts.includes("z")) {
        y = value(first + parts.indexOf("y"));
        z = value(first + parts.indexOf("z"));
      } else if (parts.length === 1 && parts[0] === "y") y = value(first);
      else if (parts.length > 0) {
        const values = parts.map((_, i) => value(first + i));
        y = values.every((v) => v !== null) ? (values as number[]) : null;
      } else y = value(first);
      if (xType === "numeric")
        return z === null ? [xs[index] as string, y] : [xs[index] as string, y, z];
      if (!Array.isArray(y) && z === null && v === null && !isColor(color) && !isChartSum(sum))
        return y;
      return {
        y,
        ...(sum === "total" ? { isTotal: true } : sum === "subtotal" ? { isSubtotal: true } : {}),
        ...(z !== null ? { z } : {}),
        ...(v !== null ? { v } : {}),
        ...(isColor(color) ? { color } : {}),
      };
    });
    const type = header.getAttribute("data-ok-type");
    const color = header.getAttribute("data-ok-color");
    const axis = header.getAttribute("data-ok-y-axis");
    const shape = header.getAttribute("data-ok-marker-shape");
    const pattern = header.getAttribute("data-ok-fill-pattern");
    const width = parseChartNumber(header.getAttribute("data-ok-stroke-width"));
    const dash = parseChartNumber(header.getAttribute("data-ok-dash-array"));
    return [
      {
        name: cellText(header),
        ...(axis !== null && /^\d$/.test(axis) ? { yAxis: Number(axis) } : {}),
        ...(isChartMarkerShape(shape) ? { markerShape: shape } : {}),
        ...(isChartPattern(pattern) ? { fillPattern: pattern } : {}),
        ...(width !== null ? { strokeWidth: width } : {}),
        ...(dash !== null ? { dashArray: dash } : {}),
        data:
          xType === "numeric"
            ? data.filter((point) => (point as readonly unknown[])[1] !== null)
            : data,
        ...(chartTypes.includes(type as ChartType) ? { type: type as ChartType } : {}),
        ...(isColor(color) ? { color } : {}),
      },
    ];
  });
  if (xType === "datetime") {
    // Rows without a valid date are dropped from every series, keeping indexes aligned.
    const keep = categories.map((time) => Number.isFinite(time as number));
    return {
      categories: categories.filter((_, index) => keep[index]),
      series: series.map((s) => ({ ...s, data: s.data.filter((_, index) => keep[index]) })),
      partLabels,
    };
  }
  return { series, categories, partLabels };
}
