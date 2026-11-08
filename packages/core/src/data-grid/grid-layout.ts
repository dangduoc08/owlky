/*
 * Data grid phase 4 (ADR-0021), shared by React and the HTML runtime: cell spans, rows of
 * different heights in the virtualization window, column autosizing, grid state (export and a
 * safe restore), value formatting for HTML cells and the reading direction.
 */
import type {
  GridColumnVisibilityModel,
  GridDensity,
  GridFilterItem,
  GridFilterModel,
  GridPinnedColumns,
  GridSortModel,
} from "./data-grid.js";
import { gridDensities } from "./data-grid.js";
import {
  type GridAggregationModel,
  type GridChartModel,
  type GridPivotModel,
  parseGridAggregationModel,
  sanitizeGridChartModel,
  sanitizeGridPivotModel,
} from "./grid-premium.js";
import type { GridRowWindow } from "./grid-virtual.js";
import { GRID_ROW_BUFFER } from "./grid-virtual.js";

/** How one cell takes part in a span: `span` cells wide / tall, or `covered` by an earlier one. */
export interface GridSpan {
  span: number;
  covered: boolean;
}

/**
 * Column spans of one row: `spanAt(index)` is the wanted span of the cell at `index` (of `count`
 * shown cells). Spans stop at the end of the row; the cells they cover are `covered`.
 */
export function gridColSpans(count: number, spanAt: (index: number) => number): GridSpan[] {
  const spans: GridSpan[] = [];
  let covered = 0;
  for (let index = 0; index < count; index++) {
    if (covered > 0) {
      covered--;
      spans.push({ span: 1, covered: true });
      continue;
    }
    const wanted = Math.floor(spanAt(index));
    const span = Math.min(Number.isFinite(wanted) && wanted > 1 ? wanted : 1, count - index);
    covered = span - 1;
    spans.push({ span, covered: false });
  }
  return spans;
}

export interface GridRowSpans {
  /** Per row (in order), per field: its span (rows tall) or `covered`. Absent: a plain cell. */
  cells: Map<string, GridSpan>[];
  /** Per row: the first row of the spans that reach it (itself when none). */
  origin: number[];
}

/**
 * Row spans (MUI X `rowSpanning`): neighbouring rows with the same non-empty `key` in a field merge
 * into one cell, as tall as the rows.
 */
export function gridRowSpans<R>(
  rows: readonly R[],
  fields: readonly string[],
  key: (row: R, field: string) => string,
): GridRowSpans {
  const cells = rows.map(() => new Map<string, GridSpan>());
  const origin = rows.map((_, index) => index);
  for (const field of fields) {
    let start = 0;
    while (start < rows.length) {
      const value = key(rows[start] as R, field);
      let end = start + 1;
      while (value !== "" && end < rows.length && key(rows[end] as R, field) === value) end++;
      if (end - start > 1) {
        (cells[start] as Map<string, GridSpan>).set(field, { span: end - start, covered: false });
        for (let row = start + 1; row < end; row++) {
          (cells[row] as Map<string, GridSpan>).set(field, { span: 1, covered: true });
          origin[row] = Math.min(origin[row] as number, start);
        }
      }
      start = end;
    }
  }
  return { cells, origin };
}

/** Offsets of rows of given heights: `offsets[i]` is where row `i` starts; the last is the total. */
export function gridRowOffsets(heights: readonly number[]): number[] {
  const offsets = [0];
  for (const height of heights) offsets.push((offsets[offsets.length - 1] as number) + height);
  return offsets;
}

/** The rows of different heights that meet the visible area plus a buffer, and the spacers. */
export function gridRowWindowOf(
  offsets: readonly number[],
  offset: number,
  viewport: number,
  buffer = GRID_ROW_BUFFER,
): GridRowWindow {
  const count = offsets.length - 1;
  const total = offsets[count] as number;
  if (count <= 0 || !(total > 0)) return { start: 0, end: Math.max(count, 0), before: 0, after: 0 };
  // The last row starting at or before `y`.
  const rowAt = (y: number) => {
    let low = 0;
    let high = count - 1;
    while (low < high) {
      const mid = Math.ceil((low + high) / 2);
      if ((offsets[mid] as number) <= y) low = mid;
      else high = mid - 1;
    }
    return low;
  };
  const start = rowAt(Math.max(offset - buffer, 0));
  const end = Math.min(rowAt(offset + viewport + buffer) + 1, count);
  return {
    start,
    end,
    before: offsets[start] as number,
    after: total - (offsets[end] as number),
  };
}

/** Row height multipliers of the densities (MUI X `densityFactor`). */
export const gridDensityFactor = (density: GridDensity): number =>
  density === "compact" ? 0.7 : density === "comfortable" ? 1.3 : 1;

/** Extra room for a header's sort icon and menu button, which show on hover. */
const HEADER_ICONS = 64;

/**
 * The width that fits the content of a column (MUI X `autosizeColumns`): each rendered cell of
 * `field` (and its header, unless `includeHeaders` is false) measured at its natural width.
 */
export function measureGridColumn(
  grid: HTMLElement,
  field: string,
  options: { includeHeaders?: boolean | undefined } = {},
): number {
  const cells = [
    ...grid.querySelectorAll<HTMLElement>(
      `[role="gridcell"][data-ok-field="${CSS.escape(field)}"]`,
    ),
  ].filter((cell) => !cell.hidden && !cell.closest("[hidden]") && cell.isConnected);
  const header =
    options.includeHeaders === false
      ? null
      : grid.querySelector<HTMLElement>(
          `[role="columnheader"][data-ok-field="${CSS.escape(field)}"]`,
        );
  let width = 0;
  for (const cell of header ? [header, ...cells] : cells) {
    const previous = cell.style.getPropertyValue("width");
    cell.style.setProperty("width", "max-content");
    width = Math.max(
      width,
      cell.getBoundingClientRect().width + (cell === header ? HEADER_ICONS : 0),
    );
    if (previous) cell.style.setProperty("width", previous);
    else cell.style.removeProperty("width");
  }
  return Math.ceil(width);
}

/** The grid lays out right to left. */
export const isGridRtl = (element: Element): boolean =>
  getComputedStyle(element).direction === "rtl";

/** What `exportState()` returns and `restoreState()` / `initialState` take (MUI X shape). */
export interface GridState {
  sorting?: { sortModel?: GridSortModel | undefined } | undefined;
  filter?: { filterModel?: GridFilterModel | undefined } | undefined;
  pagination?: { paginationModel?: { page?: number; pageSize?: number } | undefined } | undefined;
  columns?:
    | {
        columnVisibilityModel?: GridColumnVisibilityModel | undefined;
        orderedFields?: string[] | undefined;
        dimensions?: Record<string, { width: number }> | undefined;
      }
    | undefined;
  pinnedColumns?: GridPinnedColumns | undefined;
  density?: GridDensity | undefined;
  /** Phase 6 (MUI X Premium). */
  rowGrouping?: { model?: string[] | undefined } | undefined;
  aggregation?: { model?: GridAggregationModel | undefined } | undefined;
  pivoting?: { model?: GridPivotModel | undefined; active?: boolean | undefined } | undefined;
  chartsIntegration?: { model?: GridChartModel | undefined } | undefined;
}

const UNSAFE = new Set(["__proto__", "constructor", "prototype"]);
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const strings = (value: unknown): string[] | undefined =>
  Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : undefined;
const finite = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;
/** Own, safe keys of a record, each value checked. */
const entries = <T>(
  value: Record<string, unknown>,
  check: (v: unknown) => T | undefined,
): Record<string, T> => {
  const out: Record<string, T> = {};
  for (const key of Object.keys(value)) {
    if (UNSAFE.has(key)) continue;
    const checked = check(value[key]);
    if (checked !== undefined) out[key] = checked;
  }
  return out;
};

/**
 * A grid state from untrusted input (stored JSON, URLs): only known keys and value types are kept,
 * never `__proto__`, `constructor` or `prototype`.
 */
export function sanitizeGridState(input: unknown): GridState {
  const state: GridState = {};
  if (!isRecord(input)) return state;
  const sortItems = isRecord(input["sorting"]) ? input["sorting"]["sortModel"] : undefined;
  if (Array.isArray(sortItems))
    state.sorting = {
      sortModel: sortItems.flatMap((item) =>
        isRecord(item) &&
        typeof item["field"] === "string" &&
        (item["sort"] === "asc" || item["sort"] === "desc")
          ? [{ field: item["field"], sort: item["sort"] }]
          : [],
      ),
    };
  const filter = isRecord(input["filter"]) ? input["filter"]["filterModel"] : undefined;
  if (isRecord(filter)) {
    const items = Array.isArray(filter["items"]) ? filter["items"] : [];
    const model: GridFilterModel = {
      items: items.flatMap((item): GridFilterItem[] => {
        if (!isRecord(item) || typeof item["field"] !== "string") return [];
        if (typeof item["operator"] !== "string") return [];
        const value = item["value"];
        return [
          {
            field: item["field"],
            operator: item["operator"],
            ...(typeof value === "string" ? { value } : {}),
            ...(Array.isArray(value) ? { value: strings(value) as string[] } : {}),
          },
        ];
      }),
    };
    if (filter["logicOperator"] === "and" || filter["logicOperator"] === "or")
      model.logicOperator = filter["logicOperator"];
    const words = strings(filter["quickFilterValues"]);
    if (words) model.quickFilterValues = words;
    state.filter = { filterModel: model };
  }
  const pagination = isRecord(input["pagination"])
    ? input["pagination"]["paginationModel"]
    : undefined;
  if (isRecord(pagination)) {
    const page = finite(pagination["page"]);
    const pageSize = finite(pagination["pageSize"]);
    state.pagination = {
      paginationModel: {
        ...(page !== undefined && page >= 0 ? { page: Math.floor(page) } : {}),
        ...(pageSize !== undefined && pageSize > 0 ? { pageSize: Math.floor(pageSize) } : {}),
      },
    };
  }
  if (isRecord(input["columns"])) {
    const columns = input["columns"];
    state.columns = {};
    if (isRecord(columns["columnVisibilityModel"]))
      state.columns.columnVisibilityModel = entries(columns["columnVisibilityModel"], (v) =>
        typeof v === "boolean" ? v : undefined,
      );
    const ordered = strings(columns["orderedFields"]);
    if (ordered) state.columns.orderedFields = ordered.filter((f) => !UNSAFE.has(f));
    if (isRecord(columns["dimensions"]))
      state.columns.dimensions = entries(columns["dimensions"], (v) => {
        const width = isRecord(v) ? finite(v["width"]) : undefined;
        return width !== undefined && width > 0 ? { width } : undefined;
      });
  }
  if (isRecord(input["pinnedColumns"])) {
    const left = strings(input["pinnedColumns"]["left"]);
    const right = strings(input["pinnedColumns"]["right"]);
    state.pinnedColumns = { ...(left ? { left } : {}), ...(right ? { right } : {}) };
  }
  if (gridDensities.includes(input["density"] as GridDensity))
    state.density = input["density"] as GridDensity;
  const grouping = isRecord(input["rowGrouping"])
    ? strings(input["rowGrouping"]["model"])
    : undefined;
  if (grouping) state.rowGrouping = { model: grouping.filter((f) => !UNSAFE.has(f)) };
  if (isRecord(input["aggregation"]) && isRecord(input["aggregation"]["model"]))
    state.aggregation = {
      model: parseGridAggregationModel(JSON.stringify(input["aggregation"]["model"])),
    };
  if (isRecord(input["pivoting"])) {
    const pivoting = input["pivoting"];
    state.pivoting = {
      ...(isRecord(pivoting["model"]) ? { model: sanitizeGridPivotModel(pivoting["model"]) } : {}),
      ...(typeof pivoting["active"] === "boolean" ? { active: pivoting["active"] } : {}),
    };
  }
  if (isRecord(input["chartsIntegration"]) && isRecord(input["chartsIntegration"]["model"]))
    state.chartsIntegration = {
      model: sanitizeGridChartModel(input["chartsIntegration"]["model"]),
    };
  return state;
}

/** Formats an HTML column's cells (`data-ok-format`): numbers and dates through `Intl`. */
export const gridFormats = ["number", "currency", "percent", "date", "datetime"] as const;
export type GridFormat = (typeof gridFormats)[number];

/** `Intl` options a column may set (`data-ok-format-options`); anything else is dropped. */
const FORMAT_KEYS: Record<string, "string" | "number" | "boolean"> = {
  currency: "string",
  currencyDisplay: "string",
  minimumFractionDigits: "number",
  maximumFractionDigits: "number",
  useGrouping: "boolean",
  notation: "string",
  compactDisplay: "string",
  signDisplay: "string",
  unit: "string",
  unitDisplay: "string",
  dateStyle: "string",
  timeStyle: "string",
  hour12: "boolean",
  timeZone: "string",
};

/** Format options from untrusted JSON: only the allowed keys with values of the right type. */
export function parseGridFormatOptions(
  json: string | null,
): Record<string, string | number | boolean> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json ?? "null");
  } catch {
    return {};
  }
  const out: Record<string, string | number | boolean> = {};
  if (!isRecord(parsed)) return out;
  for (const [key, type] of Object.entries(FORMAT_KEYS)) {
    const value = parsed[key];
    if (typeof value === type) out[key] = value as string | number | boolean;
  }
  return out;
}

/**
 * The text of a value in a format (`locale` from the page's `lang`). Invalid values or options
 * show the value as it is.
 */
export function gridFormatValue(
  value: unknown,
  format: GridFormat,
  options: Record<string, string | number | boolean> = {},
  locale?: string,
): string {
  if (value === null || value === undefined || value === "") return "";
  try {
    if (format === "date" || format === "datetime") {
      const date = value instanceof Date ? value : new Date(String(value));
      if (Number.isNaN(date.getTime())) return String(value);
      const defaults: Intl.DateTimeFormatOptions =
        format === "date" ? { dateStyle: "medium" } : { dateStyle: "medium", timeStyle: "short" };
      return new Intl.DateTimeFormat(locale, { ...defaults, ...options }).format(date);
    }
    const n = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(n)) return String(value);
    const style = format === "number" ? "decimal" : format;
    return new Intl.NumberFormat(locale, {
      style,
      ...(format === "currency" && !options["currency"] ? { currency: "USD" } : {}),
      ...options,
    }).format(n);
  } catch {
    return String(value);
  }
}
