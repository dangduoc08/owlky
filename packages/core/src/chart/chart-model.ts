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
] as const;
/** Charts of one series whose categories are slices or rings (legend items are categories). */
export const chartCircularTypes = ["pie", "donut", "radialBar"] as const;
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
/** Whether a chart type is drawn around a center (circular charts and radar): no mixed types. */
export const isPolarChart = (type: ChartType): boolean => type === "radar" || isCircularChart(type);
type Shade = (typeof chartShades)[number];

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

/** A point: a value, `null` (a gap), an `[x, y]` pair or `{ x, y, color }`. */
export type ChartPointInput =
  | number
  | null
  | readonly [x: number | string | Date, y: number | null]
  | {
      readonly x?: number | string | Date;
      readonly y: number | null;
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
  readonly y: number | null;
  readonly color?: ChartColor | undefined;
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
  const xType = pick(chartXTypes, input.xType, type === "scatter" ? "numeric" : "category");
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
  const polar = isPolarChart(type);
  const circular = isCircularChart(type);
  const series = input.series.map((entry, index): ChartDataSeries => {
    const points: ChartPoint[] = [];
    entry.data.forEach((raw, position) => {
      let x: number | undefined = xType === "numeric" ? undefined : position;
      let y: number | null;
      let color: ChartColor | undefined;
      if (Array.isArray(raw)) {
        const [rx, ry] = raw as readonly [unknown, unknown];
        if (xType === "numeric") x = numericX(rx);
        else if (xType === "datetime" && input.categories === undefined) {
          const time = toTimestamp(rx);
          if (time !== undefined) {
            if (!categories.includes(time)) categories.push(time);
            x = categories.indexOf(time);
          } else x = undefined;
        }
        y = parseChartNumber(ry);
      } else if (raw !== null && typeof raw === "object") {
        const point = raw as { x?: unknown; y?: unknown; color?: unknown };
        if (xType === "numeric") x = numericX(point.x);
        y = parseChartNumber(point.y);
        if (isColor(point.color)) color = point.color;
      } else y = parseChartNumber(raw);
      if (x === undefined) return;
      // Circular charts color each slice (ring): its own color, `colors` or the default order.
      if (circular && !color)
        color =
          palette[position] ??
          (chartDefaultColors[position % chartDefaultColors.length] as ChartColor);
      points.push(color ? { x, y, color } : { x, y });
    });
    const fallback =
      palette[index] ?? (chartDefaultColors[index % chartDefaultColors.length] as ChartColor);
    return {
      name: String(entry.name),
      // Polar charts draw every series the same way (no mixed types).
      type: polar ? type : pick(chartTypes, entry.type, type),
      color: isColor(entry.color) ? entry.color : fallback,
      points,
    };
  });
  return { type, xType, categories, series };
}

// --- Data table (the accessible view of the data; the HTML source) ------------------------------

export interface ChartTableCell {
  readonly text: string;
  /** `data-ok-*` attributes of the cell (series type / color, raw x value, point color). */
  readonly attrs: Readonly<Record<string, string>>;
}

export interface ChartTableModel {
  readonly head: readonly ChartTableCell[];
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
 * series. `formatX` / `formatValue` give the visible text; raw values that differ from the text
 * go into `data-ok-value`.
 */
export function chartTable(
  data: ChartData,
  options: {
    xLabel: string;
    formatX: (x: string | number) => string;
    formatValue: (value: number, series: number) => string;
    /** Series types written on the column headers (`true` for mixed charts). */
    seriesTypes?: boolean;
  },
): ChartTableModel {
  const head: ChartTableCell[] = [
    { text: options.xLabel, attrs: {} },
    ...data.series.map((series) => ({
      text: series.name,
      attrs: {
        ...(options.seriesTypes ? { "data-ok-type": series.type } : {}),
        "data-ok-color": series.color,
      },
    })),
  ];
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
      const cells = at.map((points, index) => {
        const point = points[k];
        if (!point || point.y === null) return { text: "", attrs: {} };
        const value = options.formatValue(point.y, index);
        return {
          text: value,
          attrs: {
            ...(value !== String(point.y) ? { "data-ok-value": String(point.y) } : {}),
            ...(point.color ? { "data-ok-color": point.color } : {}),
          },
        };
      });
      rows.push({ header: { text, attrs }, cells });
    }
  }
  return { head, rows };
}

/** Reads series and categories from a chart data table (HTML). Missing cells are gaps. */
export function readChartTable(
  table: HTMLTableElement,
  xType: ChartXType,
): { series: ChartSeries[]; categories: (string | number)[] } {
  const headRow = table.tHead?.rows[0] ?? table.rows[0];
  if (!headRow) return { series: [], categories: [] };
  const headers = [...headRow.cells].slice(1);
  const bodyRows = [...table.rows].filter((row) => row !== headRow);
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
  const series = headers.map((header, column): ChartSeries => {
    const data: ChartPointInput[] = bodyRows.map((row, index) => {
      const cell = row.cells[column + 1];
      const text = raw(cell);
      const y = text === "" ? null : parseChartNumber(text);
      const color = cell?.getAttribute("data-ok-color");
      if (xType === "numeric") return [xs[index] as string, y];
      return isColor(color) ? { y, color } : y;
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
    };
  }
  return { series, categories };
}
