/*
 * Data grid engine (ADR-0020), shared by React and the HTML runtime: column types and sizing,
 * sorting, filtering, quick filter, selection and CSV export. Pure functions over rows the owner
 * keeps (React: props / state; HTML: the rows in the DOM). Values are read through `value(row,
 * field)` (the raw value, for sorting and filtering) and `text(row, field)` (what the cell shows).
 */

export const gridColumnTypes = [
  "string",
  "number",
  "date",
  "dateTime",
  "boolean",
  "singleSelect",
  "actions",
] as const;
export type GridColumnType = (typeof gridColumnTypes)[number];
export type GridAlign = "left" | "center" | "right";

/** What the engine needs to know about a column (React adds renderers on top). */
export interface GridColumn {
  field: string;
  headerName?: string | undefined;
  type?: GridColumnType | undefined;
  /** px; default 100 (ignored with `flex`). */
  width?: number | undefined;
  /** px; default 50. */
  minWidth?: number | undefined;
  /** Share of the free width (like `fr`). */
  flex?: number | undefined;
  align?: GridAlign | undefined;
  headerAlign?: GridAlign | undefined;
  /** Default true (false for `actions`). */
  sortable?: boolean | undefined;
  /** Default true (false for `actions`). */
  filterable?: boolean | undefined;
  /** Default true. */
  hideable?: boolean | undefined;
  /** `singleSelect`: the choices. */
  valueOptions?: readonly string[] | undefined;
}

export type GridSortDirection = "asc" | "desc";
export interface GridSortItem {
  field: string;
  sort: GridSortDirection;
}
export type GridSortModel = GridSortItem[];

export interface GridFilterItem {
  field: string;
  operator: string;
  value?: string | undefined;
}
export interface GridFilterModel {
  items: GridFilterItem[];
  /** Words typed in the quick filter: every word must match some column. */
  quickFilterValues?: string[] | undefined;
}

export const gridDensities = ["compact", "standard", "comfortable"] as const;
export type GridDensity = (typeof gridDensities)[number];
export type GridColumnVisibilityModel = Record<string, boolean>;

/** Width of the checkbox selection column, px. */
export const GRID_CHECKBOX_WIDTH = 50;
export const GRID_CHECKBOX_FIELD = "__check__";

const isActions = (column: GridColumn) => column.type === "actions";
export const isGridSortable = (column: GridColumn) => column.sortable ?? !isActions(column);
export const isGridFilterable = (column: GridColumn) => column.filterable ?? !isActions(column);
export const isGridHideable = (column: GridColumn) => column.hideable ?? true;
/** Numbers align right (as in MUI); everything else left. */
export const gridAlign = (column: GridColumn): GridAlign =>
  column.align ?? (column.type === "number" ? "right" : "left");
export const gridHeaderAlign = (column: GridColumn): GridAlign =>
  column.headerAlign ?? gridAlign(column);

const positive = (value: number | undefined, fallback: number) =>
  typeof value === "number" && Number.isFinite(value) && value > 0 ? value : fallback;

/** One track per visible column (`--_ok-data-grid-columns`): px widths, or `minmax(min, Nfr)`. */
export function gridColumnTemplate(columns: readonly GridColumn[], checkbox: boolean): string {
  const tracks = columns.map((column) => {
    const min = positive(column.minWidth, 50);
    if (column.flex !== undefined && positive(column.flex, 0) > 0)
      return `minmax(${min}px, ${positive(column.flex, 1)}fr)`;
    return `${Math.max(positive(column.width, 100), min)}px`;
  });
  return [...(checkbox ? [`${GRID_CHECKBOX_WIDTH}px`] : []), ...tracks].join(" ");
}

/** Columns shown by a visibility model (absent = shown). */
export const visibleGridColumns = <C extends GridColumn>(
  columns: readonly C[],
  model: GridColumnVisibilityModel = {},
): C[] => columns.filter((column) => model[column.field] !== false);

/** A sortable / comparable form of a raw value for the column type; empty → null. */
export function gridSortValue(
  value: unknown,
  type: GridColumnType = "string",
): number | string | null {
  if (value === null || value === undefined || value === "") return null;
  if (type === "number") {
    const n = typeof value === "number" ? value : Number(value);
    return Number.isNaN(n) ? null : n;
  }
  if (type === "date" || type === "dateTime") {
    const time = value instanceof Date ? value.getTime() : new Date(value as string).getTime();
    return Number.isNaN(time) ? null : time;
  }
  if (type === "boolean") return value === true || value === "true" ? 1 : 0;
  return String(value).toLocaleLowerCase();
}

/** Ascending comparison; empty values go last whatever the direction. */
export function gridCompare(a: unknown, b: unknown, type: GridColumnType = "string"): number {
  const x = gridSortValue(a, type);
  const y = gridSortValue(b, type);
  if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1;
  if (typeof x === "number" && typeof y === "number") return x - y;
  return String(x).localeCompare(String(y), undefined, { numeric: true });
}

/**
 * The sort model after activating a column header: none → asc → desc → none. With `multi`
 * (Shift, MUI X Pro) the column is added to or cycled in the model; otherwise it replaces it.
 */
export function nextGridSort(model: GridSortModel, field: string, multi = false): GridSortModel {
  const current = model.find((item) => item.field === field);
  const next: GridSortItem | null = !current
    ? { field, sort: "asc" }
    : current.sort === "asc"
      ? { field, sort: "desc" }
      : null;
  if (!multi) return next ? [next] : [];
  const rest = model.filter((item) => item.field !== field);
  if (!next) return rest;
  return current ? model.map((item) => (item.field === field ? next : item)) : [...rest, next];
}

type Read<R> = (row: R, field: string) => unknown;

/** Rows sorted by the model (stable; empty values last). */
export function sortGridRows<R>(
  rows: readonly R[],
  model: GridSortModel,
  columns: readonly GridColumn[],
  value: Read<R>,
): R[] {
  const keys = model
    .map((item) => ({ item, column: columns.find((c) => c.field === item.field) }))
    .filter((key) => key.column !== undefined);
  if (keys.length === 0) return [...rows];
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      for (const { item, column } of keys) {
        const type = (column as GridColumn).type;
        const x = value(a.row, item.field);
        const y = value(b.row, item.field);
        const empty = gridSortValue(x, type) === null || gridSortValue(y, type) === null;
        const order = gridCompare(x, y, type);
        if (order !== 0) return empty || item.sort === "asc" ? order : -order;
      }
      return a.index - b.index;
    })
    .map(({ row }) => row);
}

/** Operators per column type (MUI X names). */
export function gridFilterOperators(type: GridColumnType = "string"): string[] {
  if (type === "number") return ["=", "!=", ">", ">=", "<", "<=", "isEmpty", "isNotEmpty"];
  if (type === "date" || type === "dateTime")
    return ["is", "not", "after", "onOrAfter", "before", "onOrBefore", "isEmpty", "isNotEmpty"];
  if (type === "boolean") return ["is"];
  if (type === "singleSelect") return ["is", "not", "isEmpty", "isNotEmpty"];
  return [
    "contains",
    "doesNotContain",
    "equals",
    "startsWith",
    "endsWith",
    "isEmpty",
    "isNotEmpty",
  ];
}

/** Operators that need no value. */
export const gridOperatorNeedsValue = (operator: string) =>
  operator !== "isEmpty" && operator !== "isNotEmpty";

/** Whether a row's value / text passes a filter item (an item without a value passes). */
export function matchesGridFilter(
  raw: unknown,
  text: string,
  item: GridFilterItem,
  type: GridColumnType = "string",
): boolean {
  const empty = gridSortValue(raw, type) === null;
  if (item.operator === "isEmpty") return empty;
  if (item.operator === "isNotEmpty") return !empty;
  if (item.value === undefined || item.value === "") return true;
  if (type === "boolean") return gridSortValue(raw, type) === (item.value === "true" ? 1 : 0);
  if (type === "number" || type === "date" || type === "dateTime") {
    const x = gridSortValue(raw, type);
    const y = gridSortValue(item.value, type);
    if (x === null || y === null) return false;
    const day = (n: number | string) =>
      type === "date" ? Math.floor(Number(n) / 86_400_000) : Number(n);
    const [a, b] = [day(x), day(y)];
    switch (item.operator) {
      case "=":
      case "is":
        return a === b;
      case "!=":
      case "not":
        return a !== b;
      case ">":
      case "after":
        return a > b;
      case ">=":
      case "onOrAfter":
        return a >= b;
      case "<":
      case "before":
        return a < b;
      case "<=":
      case "onOrBefore":
        return a <= b;
      default:
        return true;
    }
  }
  const haystack = (type === "singleSelect" ? String(raw ?? "") : text).toLocaleLowerCase();
  const needle = item.value.toLocaleLowerCase();
  switch (item.operator) {
    case "contains":
      return haystack.includes(needle);
    case "doesNotContain":
      return !haystack.includes(needle);
    case "equals":
    case "is":
      return haystack === needle;
    case "not":
      return haystack !== needle;
    case "startsWith":
      return haystack.startsWith(needle);
    case "endsWith":
      return haystack.endsWith(needle);
    default:
      return true;
  }
}

/** Rows kept by the filter items (all must pass) and the quick filter words (each must match). */
export function filterGridRows<R>(
  rows: readonly R[],
  model: GridFilterModel,
  columns: readonly GridColumn[],
  value: Read<R>,
  text: (row: R, field: string) => string,
): R[] {
  const items = model.items.filter((item) => columns.some((c) => c.field === item.field));
  const words = (model.quickFilterValues ?? [])
    .map((w) => w.trim().toLocaleLowerCase())
    .filter(Boolean);
  const searchable = columns.filter(isGridFilterable);
  if (items.length === 0 && words.length === 0) return [...rows];
  return rows.filter((row) => {
    for (const item of items) {
      const column = columns.find((c) => c.field === item.field) as GridColumn;
      if (!matchesGridFilter(value(row, item.field), text(row, item.field), item, column.type))
        return false;
    }
    return words.every((word) =>
      searchable.some((column) => text(row, column.field).toLocaleLowerCase().includes(word)),
    );
  });
}

/** Splits a quick filter text into words (MUI X `quickFilterValues`). */
export const gridQuickFilterValues = (text: string): string[] =>
  text.split(/\s+/).filter((word) => word !== "");

/** State of a "select all" checkbox over some row ids. */
export function gridSelectAllState(
  ids: readonly string[],
  selected: readonly string[],
): "all" | "some" | "none" {
  const chosen = ids.filter((id) => selected.includes(id)).length;
  return chosen === 0 ? "none" : chosen === ids.length ? "all" : "some";
}

/** Toggles one row (multiple selection). */
export const toggleGridRow = (selected: readonly string[], id: string): string[] =>
  selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id];

/** Toggles every row of `ids`: all selected → none of them, else all of them. */
export function toggleGridRows(selected: readonly string[], ids: readonly string[]): string[] {
  if (gridSelectAllState(ids, selected) === "all") return selected.filter((s) => !ids.includes(s));
  return [...selected, ...ids.filter((id) => !selected.includes(id))];
}

/**
 * One CSV field: quoted when needed, and neutralized against spreadsheet formulas (a leading `=`,
 * `+`, `-`, `@`, tab or carriage return gets a `'`): exported data may come from users.
 */
export function csvField(text: string): string {
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(safe) || safe !== text ? `"${safe.replaceAll('"', '""')}"` : safe;
}

/** CSV of the columns (header names) and rows (their text), CRLF lines, with a UTF-8 BOM. */
export function gridToCsv<R>(
  columns: readonly GridColumn[],
  rows: readonly R[],
  text: (row: R, field: string) => string,
): string {
  const exported = columns.filter((column) => !isActions(column));
  const lines = [
    exported.map((column) => csvField(column.headerName ?? column.field)).join(","),
    ...rows.map((row) => exported.map((column) => csvField(text(row, column.field))).join(",")),
  ];
  return `﻿${lines.join("\r\n")}`;
}

/** Default labels (MUI X locale text keys). */
export const gridDefaultLabels = {
  toolbarColumns: "Columns",
  toolbarFilters: "Filters",
  toolbarDensity: "Density",
  toolbarExport: "Export",
  toolbarExportCSV: "Download as CSV",
  toolbarQuickFilterPlaceholder: "Search…",
  toolbarQuickFilterLabel: "Search",
  densityCompact: "Compact",
  densityStandard: "Standard",
  densityComfortable: "Comfortable",
  columnMenuLabel: "Menu",
  columnMenuSortAsc: "Sort by ASC",
  columnMenuSortDesc: "Sort by DESC",
  columnMenuUnsort: "Unsort",
  columnMenuFilter: "Filter",
  columnMenuHideColumn: "Hide column",
  columnMenuManageColumns: "Manage columns",
  filterPanelColumns: "Columns",
  filterPanelOperator: "Operator",
  filterPanelInputLabel: "Value",
  filterPanelInputPlaceholder: "Filter value",
  checkboxSelectionHeaderName: "Checkbox selection",
  checkboxSelectionSelectAllRows: "Select all rows",
  checkboxSelectionSelectRow: "Select row",
  noRowsLabel: "No rows",
  noResultsOverlayLabel: "No results found.",
  filterOperator: {
    contains: "contains",
    doesNotContain: "does not contain",
    equals: "equals",
    startsWith: "starts with",
    endsWith: "ends with",
    isEmpty: "is empty",
    isNotEmpty: "is not empty",
    is: "is",
    not: "is not",
    after: "is after",
    onOrAfter: "is on or after",
    before: "is before",
    onOrBefore: "is on or before",
    "=": "=",
    "!=": "!=",
    ">": ">",
    ">=": ">=",
    "<": "<",
    "<=": "<=",
  } as Record<string, string>,
};
export type GridLabels = typeof gridDefaultLabels;

/** `aria-sort` of a column header: sortable columns are `none` until sorted. */
export function gridAriaSort(
  model: GridSortModel,
  column: GridColumn,
): "ascending" | "descending" | "none" | undefined {
  const item = model.find((s) => s.field === column.field);
  if (item) return item.sort === "asc" ? "ascending" : "descending";
  return isGridSortable(column) ? "none" : undefined;
}
