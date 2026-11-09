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
] as const;
/** Charts of one series whose categories are slices or rings (legend items are categories). */
export const chartCircularTypes = ["pie", "donut", "radialBar", "polarArea"] as const;
export const chartCurves = ["smooth", "straight", "stepline"] as const;
export const chartLegends = ["top", "right", "bottom", "none"] as const;
export const chartXTypes = ["category", "datetime", "numeric"] as const;
export const chartFills = ["gradient", "solid"] as const;
export const chartShades = ["lighter", "light", "main", "dark", "darker"] as const;

export type ChartType = (typeof chartTypes)[number];
export type ChartCurve = (typeof chartCurves)[number];
export type ChartLegend = (typeof chartLegends)[number];
export type ChartXType = (typeof chartXTypes)[number];
export type ChartFill = (typeof chartFills)[number];
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
  | "outgoing";
const PARTS: Partial<Record<ChartType, readonly ChartPart[]>> = {
  boxPlot: ["min", "q1", "median", "q3", "max"],
  rangeArea: ["low", "high"],
  bubble: ["y", "z"],
  // Phase 4: candles keep ApexCharts' order (open, high, low, close); range bars start and end.
  candlestick: ["open", "high", "low", "close"],
  rangeBar: ["start", "end"],
  timeline: ["start", "end"],
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
    };

export interface ChartSeries {
  readonly name: string;
  readonly data: readonly ChartPointInput[];
  /** Mixed charts: how this series is drawn (default: the chart's `type`). */
  readonly type?: ChartType | undefined;
  readonly color?: ChartColor | undefined;
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
}

export interface ChartDataSeries {
  readonly name: string;
  readonly type: ChartType;
  readonly color: ChartColor;
  readonly points: readonly ChartPoint[];
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
      let color: ChartColor | undefined;
      if (Array.isArray(raw)) {
        const [rx, ry, rz] = raw as readonly [unknown, unknown, unknown];
        x = xType === "numeric" ? numericX(rx) : categoryOf(rx, position);
        rawY = ry;
        rawZ = rz;
      } else if (raw !== null && typeof raw === "object") {
        const point = raw as { x?: unknown; y?: unknown; z?: unknown; color?: unknown };
        x = xType === "numeric" ? numericX(point.x) : categoryOf(point.x, position);
        rawY = point.y;
        rawZ = point.z;
        if (isColor(point.color)) color = point.color;
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
            seriesType === "candlestick"
              ? (values as number[])
              : (values as number[]).sort((a, b) => a - b);
        y = range ? (range[parts === 5 ? 2 : parts === 4 ? 3 : 1] as number) : null;
      } else y = Array.isArray(rawY) ? null : parseChartNumber(rawY);
      const z = seriesType === "bubble" ? parseChartNumber(rawZ) : null;
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
      });
    });
    const fallback =
      palette[index] ?? (chartDefaultColors[index % chartDefaultColors.length] as ChartColor);
    return {
      name: String(entry.name),
      type: seriesType,
      color: isColor(entry.color) ? entry.color : fallback,
      points,
    };
  });
  return { type, xType, categories, series };
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
  const partsOf = data.series.map((series) => chartParts(series.type));
  const two = partsOf.some((parts) => parts.length > 0);
  const head: ChartTableCell[] = [
    { text: options.xLabel, attrs: {}, ...(two ? { rowSpan: 2 } : {}) },
    ...data.series.map((series, index) => {
      const count = (partsOf[index] as readonly ChartPart[]).length;
      return {
        text: series.name,
        attrs: {
          ...(options.seriesTypes ? { "data-ok-type": series.type } : {}),
          "data-ok-color": series.color,
        },
        ...(count > 0 ? { colSpan: count } : two ? { rowSpan: 2 } : {}),
      };
    }),
  ];
  const parts: ChartTableCell[] = partsOf.flatMap((list) =>
    list.map((part) => ({
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
      const cells = at.flatMap((points, index): ChartTableCell[] => {
        const point = points[k];
        const list = partsOf[index] as readonly ChartPart[];
        const width = Math.max(1, list.length);
        if (!point || point.y === null) return Array.from({ length: width }, () => empty);
        if (point.range)
          return point.range.map((value, i) =>
            cell(value, options.formatValue(value, index), i === 0 ? point.color : undefined),
          );
        const main = cell(point.y, options.formatValue(point.y, index), point.color);
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
  const series = [...headRow.cells].slice(1).map((header): ChartSeries => {
    // A header over a second header row spans the columns of its values.
    const spans = partCells.length > 0 && header.rowSpan < 2;
    const parts = spans
      ? partCells.slice(next, next + header.colSpan).map((c) => c.getAttribute("data-ok-part"))
      : [];
    if (spans) next += header.colSpan;
    const first = column;
    column += spans ? header.colSpan : 1;
    const data: ChartPointInput[] = bodyRows.map((row, index) => {
      const cell = row.cells[first];
      const value = (at: number) => {
        const text = raw(row.cells[at]);
        if (text === "") return null;
        return dates ? (toTimestamp(text) ?? null) : parseChartNumber(text);
      };
      const color = cell?.getAttribute("data-ok-color");
      let y: number | number[] | null;
      let z: number | null = null;
      if (parts.includes("z")) {
        y = value(first + parts.indexOf("y"));
        z = value(first + parts.indexOf("z"));
      } else if (parts.length > 0) {
        const values = parts.map((_, i) => value(first + i));
        y = values.every((v) => v !== null) ? (values as number[]) : null;
      } else y = value(first);
      if (xType === "numeric")
        return z === null ? [xs[index] as string, y] : [xs[index] as string, y, z];
      if (!Array.isArray(y) && z === null && !isColor(color)) return y;
      return { y, ...(z !== null ? { z } : {}), ...(isColor(color) ? { color } : {}) };
    });
    const type = header.getAttribute("data-ok-type");
    const color = header.getAttribute("data-ok-color");
    return {
      name: cellText(header),
      data:
        xType === "numeric"
          ? data.filter((point) => (point as readonly unknown[])[1] !== null)
          : data,
      ...(chartTypes.includes(type as ChartType) ? { type: type as ChartType } : {}),
      ...(isColor(color) ? { color } : {}),
    };
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
