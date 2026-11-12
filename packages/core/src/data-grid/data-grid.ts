/*
 * Data grid engine (ADR-0020), shared by React and the HTML runtime: column types and sizing,
 * sorting, filtering, quick filter, selection and CSV export. Pure functions over rows the owner
 * keeps (React: props / state; HTML: the rows in the DOM). Values are read through `value(row,
 * field)` (the raw value, for sorting and filtering) and `text(row, field)` (what the cell shows).
 */

import type { GridExportSource, GridGetRowsToExportParams } from "./grid-structure.js";

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
  /** Default true (MUI X: resizing is free since v7). */
  resizable?: boolean | undefined;
  /** Cells can be edited (double click, Enter, F2 or typing). */
  editable?: boolean | undefined;
  /** px; the largest width resizing and autosizing give (default: none). */
  maxWidth?: number | undefined;
  /** Shown as the header's tooltip and description. */
  description?: string | undefined;
  /** The quick filter searches this column (default true for filterable columns). */
  searchable?: boolean | undefined;
  /** Rows can be grouped by this column. Default true. */
  groupable?: boolean | undefined;
  /** The column can be aggregated. Default true. */
  aggregable?: boolean | undefined;
  /** The sort cycle of this column's header (default: the grid's, else asc → desc → none). */
  sortingOrder?: GridSortingOrder | undefined;
  /** The header shows no sort arrow (it still sorts). */
  hideSortIcons?: boolean | undefined;
  /** No column menu for this column. */
  disableColumnMenu?: boolean | undefined;
  /** The column stays in its place: it can't be moved, and moves that would shift it are refused. */
  disableReorder?: boolean | undefined;
  /** The column is left out of exports (CSV, Excel, print). */
  disableExport?: boolean | undefined;
  /** Default true; `false` hides the pin items of its column menu. */
  pinnable?: boolean | undefined;
  /** Its cells are row headers (`role="rowheader"`): they name their row. */
  rowHeader?: boolean | undefined;
  /** `flex` lays the cell's content out in a row, centered (default `text`: one line). */
  display?: "text" | "flex" | undefined;
  /**
   * `set`: "is any of" comes first among the column's operators, and its value is a checklist of
   * the column's values with a search and "Select all" (text, number and single select columns).
   */
  filterVariant?: "set" | undefined;
}

export type GridSortDirection = "asc" | "desc";
/** The directions a header goes through, in order; `null` is "not sorted" (MUI X `sortingOrder`). */
export type GridSortingOrder = readonly (GridSortDirection | null)[];
/** The default sort cycle: asc → desc → none. */
export const GRID_SORTING_ORDER: GridSortingOrder = ["asc", "desc", null];
/**
 * Compares two values for a sort (MUI X `GridComparatorFn`): `a` and `b` are the values, `rowA` and
 * `rowB` the rows they come from.
 */
export type GridComparator<R = unknown> = (a: unknown, b: unknown, rowA: R, rowB: R) => number;
/** A column's own sorting: `sortComparator` (ascending, reversed for desc) or `getSortComparator`. */
export interface GridComparators<R = unknown> {
  sortComparator?: GridComparator<R> | undefined;
  /** A comparator per direction, used as it is (`undefined`: the default comparison). */
  getSortComparator?: ((direction: GridSortDirection) => GridComparator<R> | undefined) | undefined;
}

/** The comparator of a direction (already reversed for desc), or `undefined` for the default. */
export function gridDirectedComparator<R>(
  comparators: GridComparators<R> | undefined,
  direction: GridSortDirection,
): GridComparator<R> | undefined {
  const own = comparators?.getSortComparator?.(direction);
  if (own) return own;
  const base = comparators?.sortComparator;
  if (!base) return undefined;
  return direction === "asc" ? base : (a, b, rowA, rowB) => -base(a, b, rowA, rowB);
}

/** A sort cycle from untrusted input (JSON text or an array): known directions once each. */
export function parseGridSortingOrder(input: unknown): GridSortingOrder | undefined {
  let list = input;
  if (typeof input === "string") {
    try {
      list = JSON.parse(input);
    } catch {
      return undefined;
    }
  }
  if (!Array.isArray(list)) return undefined;
  const order: (GridSortDirection | null)[] = [];
  for (const item of list)
    if ((item === "asc" || item === "desc" || item === null) && !order.includes(item))
      order.push(item);
  return order.length ? order : undefined;
}
export interface GridSortItem {
  field: string;
  sort: GridSortDirection;
}
export type GridSortModel = GridSortItem[];

export interface GridFilterItem {
  field: string;
  operator: string;
  /** Text; a list for `isAnyOf`. */
  value?: string | readonly string[] | undefined;
}
/**
 * A group of filters (beyond MUI X; ApexGrid's filter builder): its items and nested groups
 * combine with its own `logicOperator`. Plain data, so a model stores as JSON.
 */
export interface GridFilterGroup {
  items: GridFilterItem[];
  /** How the items and groups combine: every one (`and`, default) or any one (`or`). */
  logicOperator?: "and" | "or" | undefined;
  /** Groups inside this one, after its items. */
  groups?: GridFilterGroup[] | undefined;
}
export interface GridFilterModel extends GridFilterGroup {
  /** Words typed in the quick filter: every word (or, with `or`, any word) must match a column. */
  quickFilterValues?: string[] | undefined;
}

/** A filter operator of a column (MUI X `GridFilterOperator`): it replaces the type's operators. */
export interface GridFilterOperator<R = unknown> {
  value: string;
  label?: string | undefined;
  /** Default true. */
  requiresValue?: boolean | undefined;
  /** A test for one item (`null`: the item filters nothing, for example without a value). */
  getApplyFilterFn(
    item: GridFilterItem,
    column: GridColumn,
  ): ((value: unknown, row: R) => boolean) | null;
}

export interface GridFilterOptions<R = unknown> {
  /** Accents don't count: "ha noi" finds "Hà Nội". */
  ignoreDiacritics?: boolean | undefined;
  /** How quick filter words combine. Default `and`. */
  quickFilterLogicOperator?: "and" | "or" | undefined;
  /** Columns the quick filter searches (default: filterable, searchable ones). */
  quickFilterColumns?: readonly GridColumn[] | undefined;
  /** Custom operators per field. */
  operators?: Readonly<Record<string, readonly GridFilterOperator<R>[]>> | undefined;
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
export function gridColumnTemplate(
  columns: readonly GridColumn[],
  checkbox: boolean,
  /** Widths set by resizing, px (they replace `width` and `flex`). */
  widths: GridColumnWidths = {},
): string {
  const tracks = columns.map((column) => {
    const min = positive(column.minWidth, 50);
    const resized = widths[column.field];
    if (resized !== undefined) return `${clampGridWidth(column, resized)}px`;
    if (column.flex !== undefined && positive(column.flex, 0) > 0)
      return `minmax(${min}px, ${positive(column.flex, 1)}fr)`;
    return `${Math.max(positive(column.width, 100), min)}px`;
  });
  return [...(checkbox ? [`${GRID_CHECKBOX_WIDTH}px`] : []), ...tracks].join(" ");
}

export type GridColumnWidths = Record<string, number>;

/** A resized width: whole pixels, at least the column's `minWidth` (50), at most its `maxWidth`. */
export const clampGridWidth = (column: GridColumn, width: number): number =>
  Math.min(
    Math.max(Math.round(Number.isFinite(width) ? width : 0), positive(column.minWidth, 50)),
    positive(column.maxWidth, Number.POSITIVE_INFINITY),
  );

/** Default true; `disableColumnResize` on the grid turns every column off. */
export const isGridResizable = (column: GridColumn) => column.resizable ?? true;

/** Columns in `order` (fields); fields missing from it keep their place after the ordered ones. */
export function orderGridColumns<C extends GridColumn>(
  columns: readonly C[],
  order: readonly string[] = [],
): C[] {
  const rank = (field: string) => {
    const index = order.indexOf(field);
    return index < 0 ? order.length : index;
  };
  return columns
    .map((column, index) => ({ column, index }))
    .sort((a, b) => rank(a.column.field) - rank(b.column.field) || a.index - b.index)
    .map(({ column }) => column);
}

/**
 * The field order after moving `field` by `delta` places (or before `to`, a field). `locked`
 * fields (`disableReorder`) keep their place: a move of one, or a move that would shift one, gives
 * the order back unchanged.
 */
export function moveGridColumn(
  fields: readonly string[],
  field: string,
  delta: number | { to: string },
  locked: readonly string[] = [],
): string[] {
  const from = fields.indexOf(field);
  if (from < 0 || locked.includes(field)) return [...fields];
  const rest = fields.filter((f) => f !== field);
  const target =
    typeof delta === "number"
      ? Math.min(Math.max(from + delta, 0), rest.length)
      : rest.indexOf(delta.to) < 0
        ? from
        : rest.indexOf(delta.to) + (fields.indexOf(delta.to) > from ? 1 : 0);
  const next = [...rest.slice(0, target), field, ...rest.slice(target)];
  return locked.some((f) => next.indexOf(f) !== fields.indexOf(f)) ? [...fields] : next;
}

/** The fields of the columns that keep their place (`disableReorder`). */
export const gridLockedFields = (columns: readonly GridColumn[]): string[] =>
  columns.filter((c) => c.disableReorder).map((c) => c.field);

export interface GridPinnedColumns {
  left?: string[] | undefined;
  right?: string[] | undefined;
}

/** Left-pinned columns first, right-pinned last (in the pinned order), the others between. */
export function arrangeGridColumns<C extends GridColumn>(
  columns: readonly C[],
  pinned: GridPinnedColumns = {},
): C[] {
  const left = (pinned.left ?? []).flatMap((f) => columns.filter((c) => c.field === f));
  const right = (pinned.right ?? []).flatMap((f) => columns.filter((c) => c.field === f));
  const middle = columns.filter((c) => !left.includes(c) && !right.includes(c));
  return [...left, ...middle, ...right];
}

/** Side a column is pinned to, if any. */
export const gridPinSide = (
  pinned: GridPinnedColumns = {},
  field: string,
): "left" | "right" | undefined =>
  pinned.left?.includes(field) ? "left" : pinned.right?.includes(field) ? "right" : undefined;

/** The pinned model after pinning `field` to `side` (or unpinning it with `null`). */
export function pinGridColumn(
  pinned: GridPinnedColumns,
  field: string,
  side: "left" | "right" | null,
): GridPinnedColumns {
  const left = (pinned.left ?? []).filter((f) => f !== field);
  const right = (pinned.right ?? []).filter((f) => f !== field);
  if (side === "left") left.push(field);
  if (side === "right") right.unshift(field);
  return { left, right };
}

/**
 * Sticky offsets of pinned cells, measured from the header: every cell with `data-ok-pinned`
 * gets `--_ok-data-grid-pin` (px from its side), written through CSSOM. Run after layout.
 */
export function syncGridPinning(grid: HTMLElement): void {
  // Pinned top rows sit under the header (whatever its levels).
  const headerGroup = grid.querySelector<HTMLElement>("[data-ok-data-grid-header]");
  if (headerGroup)
    grid.style.setProperty("--_ok-data-grid-header-offset", `${headerGroup.offsetHeight}px`);
  // The column headers' row: the last header row (column groups come first, filters after).
  const header = [
    ...grid.querySelectorAll<HTMLElement>(
      '[data-ok-data-grid-header] > [role="row"]:not([data-ok-data-grid-header-filters])',
    ),
  ].at(-1);
  if (!header) return;
  const cells = [...header.querySelectorAll<HTMLElement>('[role="columnheader"]')].filter(
    (cell) => !cell.hidden,
  );
  const offsets = new Map<string, number>();
  let left = 0;
  for (const cell of cells.filter((c) => c.getAttribute("data-ok-pinned") === "left")) {
    offsets.set(cell.getAttribute("data-ok-field") as string, left);
    left += cell.offsetWidth;
  }
  let right = 0;
  for (const cell of cells.filter((c) => c.getAttribute("data-ok-pinned") === "right").reverse()) {
    offsets.set(cell.getAttribute("data-ok-field") as string, right);
    right += cell.offsetWidth;
  }
  // Cells name their column by `data-ok-field`; group headers by `data-ok-pin-field`.
  for (const cell of grid.querySelectorAll<HTMLElement>(
    "[data-ok-pinned][data-ok-field], [data-ok-pinned][data-ok-pin-field]",
  )) {
    const field = cell.getAttribute("data-ok-field") ?? cell.getAttribute("data-ok-pin-field");
    const offset = offsets.get(field as string);
    if (offset === undefined) cell.style.removeProperty("--_ok-data-grid-pin");
    else cell.style.setProperty("--_ok-data-grid-pin", `${offset}px`);
  }
}

/** A typed value from an edit field's text (`""` → null; invalid numbers / dates → null). */
export function parseGridEditValue(text: string, type: GridColumnType = "string"): unknown {
  if (type === "boolean") return text === "true";
  if (text === "") return null;
  if (type === "number") {
    const n = Number(text);
    return Number.isFinite(n) ? n : null;
  }
  if (type === "date" || type === "dateTime")
    return Number.isNaN(new Date(text).getTime()) ? null : text;
  return text;
}

/** The text an edit field starts with for a raw value. */
export function gridEditText(value: unknown, type: GridColumnType = "string"): string {
  if (value === null || value === undefined) return "";
  if (type === "date" || type === "dateTime") {
    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) return "";
    const iso = date.toISOString();
    return type === "date" ? iso.slice(0, 10) : iso.slice(0, 16);
  }
  return String(value);
}

/** The input type of an edit field. */
export const gridEditInputType = (type: GridColumnType = "string"): string =>
  type === "number"
    ? "number"
    : type === "date"
      ? "date"
      : type === "dateTime"
        ? "datetime-local"
        : type === "boolean"
          ? "checkbox"
          : "text";

/** The component a column type edits with (ADR-0067): a Select, a Checkbox or an InputBase. */
export type GridEditorKind = "select" | "checkbox" | "input";

/** The built-in editor of a column type: `singleSelect` → Select, `boolean` → Checkbox, else InputBase. */
export const gridEditorKind = (type: GridColumnType = "string"): GridEditorKind =>
  type === "singleSelect" ? "select" : type === "boolean" ? "checkbox" : "input";

/** The id of a built-in editor's field (an input, or a Select's trigger). */
export const gridEditorId = (grid: string, rowId: string, field: string): string =>
  `${grid}-${rowId}-${field}-edit`;

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
 * The sort model after activating a column header: the next direction of `order` (default none →
 * asc → desc → none; a direction not in it starts the cycle). With `multi` (Shift, MUI X Pro) the
 * column is added to or cycled in the model; otherwise it replaces it.
 */
export function nextGridSort(
  model: GridSortModel,
  field: string,
  multi = false,
  order: GridSortingOrder = GRID_SORTING_ORDER,
): GridSortModel {
  const current = model.find((item) => item.field === field);
  const at = order.indexOf(current?.sort ?? null);
  const sort = order[(at + 1) % order.length] ?? null;
  const next: GridSortItem | null = sort ? { field, sort } : null;
  if (!multi) return next ? [next] : [];
  const rest = model.filter((item) => item.field !== field);
  if (!next) return rest;
  return current ? model.map((item) => (item.field === field ? next : item)) : [...rest, next];
}

type Read<R> = (row: R, field: string) => unknown;

/**
 * Rows sorted by the model (stable; empty values last). `comparator` gives a field's own
 * comparator for a direction (`gridDirectedComparator`): its result is used as it is.
 */
export function sortGridRows<R>(
  rows: readonly R[],
  model: GridSortModel,
  columns: readonly GridColumn[],
  value: Read<R>,
  comparator?: (field: string, direction: GridSortDirection) => GridComparator<R> | undefined,
): R[] {
  const keys = model
    .map((item) => ({
      item,
      column: columns.find((c) => c.field === item.field),
      own: comparator?.(item.field, item.sort),
    }))
    .filter((key) => key.column !== undefined);
  if (keys.length === 0) return [...rows];
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      for (const { item, column, own } of keys) {
        const type = (column as GridColumn).type;
        const x = value(a.row, item.field);
        const y = value(b.row, item.field);
        if (own) {
          const result = own(x, y, a.row, b.row);
          if (result !== 0 && !Number.isNaN(result)) return result;
          continue;
        }
        const empty = gridSortValue(x, type) === null || gridSortValue(y, type) === null;
        const order = gridCompare(x, y, type);
        if (order !== 0) return empty || item.sort === "asc" ? order : -order;
      }
      return a.index - b.index;
    })
    .map(({ row }) => row);
}

/** Operators per column type (MUI X names). */
export function gridFilterOperators(
  type: GridColumnType = "string",
  variant?: GridColumn["filterVariant"],
): string[] {
  const own = typeOperators(type);
  // A set filter starts with "is any of" (its checklist), where the type has it.
  return variant === "set" && own.includes("isAnyOf")
    ? ["isAnyOf", ...own.filter((o) => o !== "isAnyOf")]
    : own;
}

/** Whether a column filters with a checklist of its values (`filterVariant: "set"`). */
export const isGridSetFilter = (column: GridColumn | undefined): boolean =>
  column?.filterVariant === "set" && typeOperators(column.type).includes("isAnyOf");

/** A value of a set filter's checklist: what "is any of" matches, and the text it shows. */
export interface GridSetFilterValue {
  value: string;
  label: string;
}

/**
 * The checklist of a set filter: each distinct value of the column (numbers and single select
 * choices by value, text by the cell's text), blanks left out, in the column type's order.
 */
export function gridSetFilterValues<R>(
  rows: readonly R[],
  column: GridColumn,
  raw: (row: R, field: string) => unknown,
  text: (row: R, field: string) => string,
): GridSetFilterValue[] {
  const byValue = column.type === "number" || column.type === "singleSelect";
  const seen = new Map<string, { item: GridSetFilterValue; raw: unknown }>();
  for (const row of rows) {
    const own = raw(row, column.field);
    const label = text(row, column.field);
    const value = byValue ? (own === null || own === undefined ? "" : String(own)) : label;
    if (value === "" || seen.has(value)) continue;
    seen.set(value, { item: { value, label: label || value }, raw: byValue ? own : label });
  }
  return [...seen.values()]
    .sort((a, b) => gridCompare(a.raw, b.raw, column.type))
    .map((entry) => entry.item);
}

/** The checklist values a set filter shows for a search (accents ignored with the option). */
export const gridSetFilterSearch = (
  values: readonly GridSetFilterValue[],
  search: string,
  ignoreDiacritics = false,
): GridSetFilterValue[] => {
  const query = gridFoldText(search.trim(), ignoreDiacritics);
  return query
    ? values.filter((v) => gridFoldText(v.label, ignoreDiacritics).includes(query))
    : [...values];
};

/** "Select all" over the shown values: every one checked → those cleared, else those added. */
export function toggleGridSetFilterValues(
  selected: readonly string[],
  shown: readonly GridSetFilterValue[],
): string[] {
  const ids = shown.map((v) => v.value);
  return gridSelectAllState(ids, selected) === "all"
    ? selected.filter((v) => !ids.includes(v))
    : [...selected, ...ids.filter((v) => !selected.includes(v))];
}

/** The short text of a set filter's selection: "any", the one value, or "2 selected". */
export function gridSetFilterSummary(
  labels: Pick<GridLabels, "filterValueAny" | "setFilterSelected">,
  values: readonly GridSetFilterValue[],
  selected: readonly string[],
): string {
  if (selected.length === 0) return labels.filterValueAny;
  if (selected.length === 1)
    return values.find((v) => v.value === selected[0])?.label ?? (selected[0] as string);
  return labels.setFilterSelected.replaceAll("{count}", String(selected.length));
}

function typeOperators(type: GridColumnType = "string"): string[] {
  if (type === "number")
    return ["=", "!=", ">", ">=", "<", "<=", "isEmpty", "isNotEmpty", "isAnyOf"];
  if (type === "date" || type === "dateTime")
    return ["is", "not", "after", "onOrAfter", "before", "onOrBefore", "isEmpty", "isNotEmpty"];
  if (type === "boolean") return ["is"];
  if (type === "singleSelect") return ["is", "not", "isEmpty", "isNotEmpty", "isAnyOf"];
  return [
    "contains",
    "doesNotContain",
    "equals",
    "startsWith",
    "endsWith",
    "isEmpty",
    "isNotEmpty",
    "isAnyOf",
  ];
}

/** Operators that need no value (custom operators say so with `requiresValue: false`). */
export const gridOperatorNeedsValue = (
  operator: string,
  custom?: readonly GridFilterOperator<never>[],
) => {
  const own = custom?.find((o) => o.value === operator);
  if (own) return own.requiresValue !== false;
  return operator !== "isEmpty" && operator !== "isNotEmpty";
};

/** A filter value as a list (`isAnyOf`): arrays as they are, text split at commas. */
export const gridFilterValues = (value: GridFilterItem["value"]): string[] =>
  (typeof value === "string" ? value.split(",") : [...(value ?? [])])
    .map((v) => v.trim())
    .filter(Boolean);

/** Lower case, and without accents when asked ("Đà Nẵng" → "da nang"). */
export const gridFoldText = (text: string, ignoreDiacritics = false): string => {
  const lower = text.toLocaleLowerCase();
  return ignoreDiacritics
    ? lower
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replaceAll("đ", "d")
    : lower;
};

/** Whether a row's value / text passes a filter item (an item without a value passes). */
export function matchesGridFilter(
  raw: unknown,
  text: string,
  item: GridFilterItem,
  type: GridColumnType = "string",
  ignoreDiacritics = false,
): boolean {
  const empty = gridSortValue(raw, type) === null;
  if (item.operator === "isEmpty") return empty;
  if (item.operator === "isNotEmpty") return !empty;
  const fold = (t: string) => gridFoldText(t, ignoreDiacritics);
  if (item.operator === "isAnyOf") {
    const choices = gridFilterValues(item.value);
    if (choices.length === 0) return true;
    if (type === "number") {
      const x = gridSortValue(raw, type);
      return choices.some((choice) => gridSortValue(choice, type) === x);
    }
    const own = fold(type === "singleSelect" ? String(raw ?? "") : text);
    return choices.some((choice) => fold(choice) === own);
  }
  if (typeof item.value !== "string" || item.value === "") return true;
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
  const haystack = fold(type === "singleSelect" ? String(raw ?? "") : text);
  const needle = fold(item.value);
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

/**
 * Rows kept by the filter items and groups (all must pass, or any with `or`; items without a value
 * are left out) and the quick filter words (each must match a searched column, or any word with
 * `quickFilterLogicOperator: "or"`).
 */
export function filterGridRows<R>(
  rows: readonly R[],
  model: GridFilterModel,
  columns: readonly GridColumn[],
  value: Read<R>,
  text: (row: R, field: string) => string,
  options: GridFilterOptions<R> = {},
): R[] {
  const ignore = !!options.ignoreDiacritics;
  const known = (item: GridFilterItem) => columns.some((c) => c.field === item.field);
  const words = (model.quickFilterValues ?? [])
    .map((w) => gridFoldText(w.trim(), ignore))
    .filter(Boolean);
  const searched = (options.quickFilterColumns ?? columns).filter(
    (c) => isGridFilterable(c) && c.searchable !== false,
  );
  /** One test per item, built once (custom operators: `getApplyFilterFn` once). */
  const testOf = (item: GridFilterItem): ((row: R) => boolean) => {
    const column = columns.find((c) => c.field === item.field) as GridColumn;
    const custom = options.operators?.[item.field]?.find((o) => o.value === item.operator);
    if (custom) {
      const test = custom.getApplyFilterFn(item, column);
      return test ? (row: R) => test(value(row, item.field), row) : () => true;
    }
    return (row: R) =>
      matchesGridFilter(value(row, item.field), text(row, item.field), item, column.type, ignore);
  };
  /**
   * A group's test (`null`: nothing in it filters). Items that filter nothing yet (no value) are
   * left out, so an empty item never lets every row through an `or` (MUI X).
   */
  const groupTest = (group: GridFilterGroup, depth: number): ((row: R) => boolean) | null => {
    if (depth > GRID_FILTER_MAX_DEPTH) return null;
    const own = [
      ...group.items
        .filter((item) => known(item) && gridFilterItemActive(item, options.operators))
        .map(testOf),
      ...(group.groups ?? []).flatMap((g) => groupTest(g, depth + 1) ?? []),
    ];
    if (own.length === 0) return null;
    return group.logicOperator === "or"
      ? (row) => own.some((test) => test(row))
      : (row) => own.every((test) => test(row));
  };
  const test = groupTest(model, 0);
  if (!test && words.length === 0) return [...rows];
  return rows.filter((row) => {
    if (test && !test(row)) return false;
    if (words.length === 0) return true;
    const found = (word: string) =>
      searched.some((column) => gridFoldText(text(row, column.field), ignore).includes(word));
    return options.quickFilterLogicOperator === "or" ? words.some(found) : words.every(found);
  });
}

/** How deep filter groups may nest (deeper ones are ignored; untrusted input stays bounded). */
export const GRID_FILTER_MAX_DEPTH = 8;

/** Whether an item filters anything: an operator without a value, or a value (a list: not empty). */
export function gridFilterItemActive<R>(
  item: GridFilterItem,
  operators?: Readonly<Record<string, readonly GridFilterOperator<R>[]>>,
): boolean {
  if (!gridOperatorNeedsValue(item.operator, operators?.[item.field] as never)) return true;
  return Array.isArray(item.value)
    ? item.value.length > 0
    : typeof item.value === "string" && item.value.trim() !== "";
}

/** The group at `path` (indexes into `groups`, from the model); the model itself for `[]`. */
export function gridFilterGroupAt(
  model: GridFilterGroup,
  path: readonly number[],
): GridFilterGroup | undefined {
  let group: GridFilterGroup | undefined = model;
  for (const index of path) group = group?.groups?.[index];
  return group;
}

/**
 * The model with the group at `path` replaced by `update(group)`; `null` removes that group (for
 * `[]`, the model itself, `null` leaves it with no items and no groups).
 */
export function updateGridFilterGroup<M extends GridFilterGroup>(
  model: M,
  path: readonly number[],
  update: (group: GridFilterGroup) => GridFilterGroup | null,
): M {
  const walk = (group: GridFilterGroup, rest: readonly number[]): GridFilterGroup | null => {
    if (rest.length === 0) return update(group);
    const [index, ...tail] = rest as [number, ...number[]];
    const child = group.groups?.[index];
    if (!child) return group;
    const next = walk(child, tail);
    const groups = (group.groups ?? []).flatMap((g, i) => (i !== index ? [g] : next ? [next] : []));
    const { groups: _, ...own } = group;
    return groups.length ? { ...own, groups } : own;
  };
  const next = walk(model, path);
  const { groups: _, ...rest } = model;
  return (next ? { ...rest, ...next } : { ...rest, items: [] }) as M;
}

/** The id suffix of a filter group's fields (`-g0-g1`): one `-g<index>` per level. */
export const gridFilterGroupSuffix = (path: readonly number[]): string =>
  path.map((index) => `-g${index}`).join("");

/** A filter group's number as people read it ("1", "1.2"). */
export const gridFilterGroupName = (path: readonly number[]): string =>
  path.map((index) => index + 1).join(".");

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

/** Toggles one row; without `multiple` the row replaces the selection (or clears it). */
export const selectGridRow = (
  selected: readonly string[],
  id: string,
  multiple = true,
): string[] => (multiple ? toggleGridRow(selected, id) : selected.includes(id) ? [] : [id]);

/** Ids still among the rows (selection without `keepNonExistentRowsSelected`). */
export const pruneGridSelection = (
  selected: readonly string[],
  ids: readonly string[],
): string[] => {
  const present = new Set(ids);
  return selected.filter((id) => present.has(id));
};

/** Toggles every row of `ids`: all selected → none of them, else all of them. */
export function toggleGridRows(selected: readonly string[], ids: readonly string[]): string[] {
  if (gridSelectAllState(ids, selected) === "all") return selected.filter((s) => !ids.includes(s));
  return [...selected, ...ids.filter((id) => !selected.includes(id))];
}

/** Selects (`on`) or clears every row of `range`, keeping the rest of the selection. */
function setGridRows(selected: readonly string[], range: readonly string[], on: boolean): string[] {
  if (!on) return selected.filter((id) => !range.includes(id));
  return [...selected, ...range.filter((id) => !selected.includes(id))];
}

/**
 * Shift + click on a row or its checkbox (MUI X `expandMouseRowRangeSelection`): the rows from the
 * anchor (the row toggled last, else the clicked one) to the clicked row take the clicked row's
 * new state. A selected row clears the rows from the anchor up to the one before it (it stays).
 * `ids`: the rows a range can cover, in their shown order (selectable data rows).
 */
export function gridRowRangeSelection(
  selected: readonly string[],
  ids: readonly string[],
  anchor: string | null,
  id: string,
): string[] {
  const start = anchor !== null && ids.includes(anchor) ? anchor : id;
  const startIndex = ids.indexOf(start);
  let endIndex = ids.indexOf(id);
  if (endIndex < 0) return [...selected];
  const isSelected = selected.includes(id);
  if (isSelected) {
    if (startIndex === endIndex) return [...selected];
    endIndex += startIndex > endIndex ? 1 : -1;
  }
  const [from, to] = startIndex <= endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
  return setGridRows(selected, ids.slice(from, to + 1), !isSelected);
}

/**
 * Shift + Up / Down (MUI X): focus moved from the row `from` to the row `to`; `to` and the rows in
 * between take `to`'s new state (a selected `to` clears the rows passed, so going back shrinks the
 * range). Without `multiple`, `to` replaces the selection (or clears it).
 */
export function gridRowArrowSelection(
  selected: readonly string[],
  ids: readonly string[],
  from: string,
  to: string,
  multiple = true,
): string[] {
  const next = ids.indexOf(to);
  const previous = ids.indexOf(from);
  if (next < 0) return [...selected];
  const isNextSelected = selected.includes(to);
  if (!multiple) return isNextSelected ? selected.filter((id) => id !== to) : [to];
  if (previous < 0) return setGridRows(selected, [to], !isNextSelected);
  const [start, end] =
    next > previous
      ? [previous, isNextSelected ? next - 1 : next]
      : [isNextSelected ? next + 1 : next, previous];
  return setGridRows(selected, ids.slice(start, end + 1), !isNextSelected);
}

/** Whether selecting a row also selects related rows (MUI X `rowSelectionPropagation`). */
export interface GridRowSelectionPropagation {
  /** Selecting every selectable descendant of a parent selects the parent; clearing one clears it. */
  parents?: boolean | undefined;
  /** Selecting a parent (or a group) selects its descendants; clearing it clears them. */
  descendants?: boolean | undefined;
}

/** The rows of a tree (tree data or row groups) as selection propagation sees them. */
export interface GridSelectionTree {
  /** The shown (filtered) children of a row or group. */
  children(id: string): readonly string[];
  /** A row's parent row or group, or `null`. */
  parent(id: string): string | null;
  /** Whether the id goes in the selection model: selectable data rows (not group rows). */
  selectable(id: string): boolean;
}

/** Every shown descendant of a row or group, depth first. */
function gridDescendants(tree: GridSelectionTree, id: string): string[] {
  const out: string[] = [];
  const walk = (parent: string) => {
    for (const child of tree.children(parent)) {
      out.push(child);
      walk(child);
    }
  };
  walk(id);
  return out;
}

/** The shown descendants of a row or group that can be selected (group rows never can). */
export const gridSelectableDescendants = (tree: GridSelectionTree, id: string): string[] =>
  gridDescendants(tree, id).filter(tree.selectable);

/**
 * How much of a row's or group's selectable descendants is selected: a group's checkbox and the
 * mixed state of a parent row (`none` without any).
 */
export function gridDescendantSelection(
  selected: readonly string[],
  id: string,
  tree: GridSelectionTree,
): "all" | "some" | "none" {
  const ids = gridSelectableDescendants(tree, id);
  return ids.length ? gridSelectAllState(ids, selected) : "none";
}

/**
 * The selection after checking (`checked`) or clearing a row or group, with propagation: its
 * descendants follow it (`descendants`); ancestors whose selectable descendants are all selected
 * join, and ancestors of a cleared row leave (`parents`). Group rows never enter the model.
 */
export function propagateGridSelection(
  selected: readonly string[],
  id: string,
  checked: boolean,
  tree: GridSelectionTree,
  propagation: GridRowSelectionPropagation,
): string[] {
  const next = new Set(selected);
  const set = (rowId: string) => {
    if (!tree.selectable(rowId)) return;
    if (checked) next.add(rowId);
    else next.delete(rowId);
  };
  set(id);
  if (propagation.descendants) for (const rowId of gridDescendants(tree, id)) set(rowId);
  if (propagation.parents)
    for (let parent = tree.parent(id); parent !== null; parent = tree.parent(parent)) {
      if (!tree.selectable(parent)) continue;
      const below = gridSelectableDescendants(tree, parent);
      if (checked && below.length && below.every((rowId) => next.has(rowId))) next.add(parent);
      if (!checked) next.delete(parent);
    }
  return [
    ...selected.filter((rowId) => next.has(rowId)),
    ...[...next].filter((rowId) => !selected.includes(rowId)),
  ];
}

/**
 * One CSV field: quoted when needed, and neutralized against spreadsheet formulas (a leading `=`,
 * `+`, `-`, `@`, tab or carriage return gets a `'`): exported data may come from users.
 */
export function csvField(text: string, delimiter = ","): string {
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  const quote = /["\r\n]/.test(safe) || safe.includes(delimiter) || safe !== text;
  return quote ? `"${safe.replaceAll('"', '""')}"` : safe;
}

/** CSV export options (MUI X `csvOptions`). */
export interface GridCsvOptions {
  /** Default ",". */
  delimiter?: string | undefined;
  /** File name without `.csv`. */
  fileName?: string | undefined;
  /** Default true. */
  includeHeaders?: boolean | undefined;
  /** Default true. */
  utf8WithBom?: boolean | undefined;
  /** Fields to export, in this order (default: the shown columns). */
  fields?: readonly string[] | undefined;
  /** Hidden columns too. Default false. */
  allColumns?: boolean | undefined;
  /** Which rows: `filtered` (default), `selected`, `page` or `all` (ApexGrid `source`). */
  source?: GridExportSource | undefined;
  /** The ids of the rows to export, in order (MUI X); wins over `source`. */
  getRowsToExport?: ((params: GridGetRowsToExportParams) => readonly string[]) | undefined;
}

/** The columns an export (CSV, print) includes: `fields` in order, else shown or all columns. */
export function gridExportColumns<C extends GridColumn>(
  columns: readonly C[],
  shown: readonly C[],
  options: { fields?: readonly string[] | undefined; allColumns?: boolean | undefined } = {},
): C[] {
  const picked = options.fields
    ? options.fields.flatMap((f) => columns.filter((c) => c.field === f))
    : options.allColumns
      ? [...columns]
      : [...shown];
  return picked.filter((column) => !isActions(column) && !column.disableExport);
}

/** CSV of the columns (header names) and rows (their text), CRLF lines, with a UTF-8 BOM. */
export function gridToCsv<R>(
  columns: readonly GridColumn[],
  rows: readonly R[],
  text: (row: R, field: string) => string,
  options: GridCsvOptions = {},
): string {
  const delimiter = options.delimiter || ",";
  const exported = columns.filter((column) => !isActions(column));
  const line = (cells: string[]) => cells.map((cell) => csvField(cell, delimiter)).join(delimiter);
  const lines = [
    ...(options.includeHeaders === false
      ? []
      : [line(exported.map((column) => column.headerName ?? column.field))]),
    ...rows.map((row) => line(exported.map((column) => text(row, column.field)))),
  ];
  return `${options.utf8WithBom === false ? "" : "\uFEFF"}${lines.join("\r\n")}`;
}

/** Default labels (MUI X locale text keys). */
export const gridDefaultLabels = {
  toolbarColumns: "Columns",
  /** Columns tool panel (`columnsToolPanel`, 4.18.90; MUI X `columnsManagement…` keys). */
  columnsManagementSearchTitle: "Search columns",
  columnsManagementShowAll: "Show all",
  columnsManagementHideAll: "Hide all",
  columnsManagementReset: "Reset",
  columnsManagementNoColumns: "No columns",
  columnsManagementPin: "Pin",
  columnsManagementNotPinned: "Not pinned",
  columnsManagementRowGroups: "Row groups",
  columnsManagementValues: "Values",
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
  columnMenuMoveLeft: "Move left",
  columnMenuMoveRight: "Move right",
  pinToLeft: "Pin to left",
  pinToRight: "Pin to right",
  unpin: "Unpin",
  columnResizeLabel: "Resize",
  filterPanelAddFilter: "Add filter",
  filterPanelRemoveFilter: "Remove filter",
  filterPanelLogicOperator: "Logic operator",
  filterPanelOperatorAnd: "And",
  filterPanelOperatorOr: "Or",
  filterPanelAddGroup: "Add group",
  filterPanelRemoveGroup: "Remove group",
  /** `{index}` is replaced (the group's number, such as "1.2"). */
  filterPanelGroup: "Filter group {index}",
  toolbarExportPrint: "Print",
  editLabel: "Edit",
  filterPanelColumns: "Columns",
  filterPanelOperator: "Operator",
  filterPanelInputLabel: "Value",
  filterPanelInputPlaceholder: "Filter value",
  checkboxSelectionHeaderName: "Checkbox selection",
  checkboxSelectionSelectAllRows: "Select all rows",
  checkboxSelectionSelectRow: "Select row",
  noRowsLabel: "No rows",
  loadingLabel: "Loading",
  noResultsOverlayLabel: "No results found.",
  /** After the header name in its menu button's label ("Name column menu"). */
  columnHeaderMenuLabel: "column menu",
  paginationRowsPerPage: "Rows per page:",
  /** `{from}`, `{to}` and `{count}` are replaced. */
  paginationDisplayedRows: "{from}–{to} of {count}",
  paginationCountAround: "around {count}",
  paginationCountMoreThan: "more than {to}",
  treeDataGroupingHeaderName: "Group",
  treeDataExpand: "see children",
  treeDataCollapse: "hide children",
  detailPanelHeaderName: "Details",
  expandDetailPanel: "Expand",
  collapseDetailPanel: "Collapse",
  rowReorderingHeaderName: "Row reordering",
  rowReorderingHandle: "Drag or press Alt + arrows to move the row",
  /** `{position}` and `{count}` are replaced. */
  rowReorderingMoved: "Row moved to position {position} of {count}",
  toolbarExportExcel: "Download as Excel",
  toolbarPivot: "Pivot",
  toolbarCharts: "Chart",
  /** `{name}` is replaced by the header name. */
  columnMenuGroupBy: "Group by {name}",
  columnMenuUngroup: "Stop grouping by {name}",
  aggregationMenuItemHeader: "Aggregation",
  aggregationMenuItemNone: "none",
  aggregationFunctionLabelSum: "sum",
  aggregationFunctionLabelAvg: "avg",
  aggregationFunctionLabelMin: "min",
  aggregationFunctionLabelMax: "max",
  aggregationFunctionLabelSize: "size",
  pivotActive: "Pivot",
  pivotRows: "Rows",
  pivotColumns: "Columns",
  pivotValues: "Values",
  pivotNotUsed: "Not used",
  pivotAggregation: "Function",
  pivotYearColumnHeaderName: "(Year)",
  pivotQuarterColumnHeaderName: "(Quarter)",
  pivotDragToRows: "Drag here to create rows",
  pivotDragToColumns: "Drag here to create columns",
  pivotDragToValues: "Drag here to create values",
  pivotMoveUp: "Move up",
  pivotMoveDown: "Move down",
  chartsActive: "Chart",
  chartsType: "Chart type",
  chartsDimension: "Category",
  chartsValues: "Series",
  chartsNone: "None",
  chartTypeColumn: "Column",
  chartTypeBar: "Bar",
  chartTypeLine: "Line",
  chartTypeArea: "Area",
  chartTypePie: "Pie",
  chartTypeDonut: "Donut",
  chartTypeRadar: "Radar",
  chartTypeScatter: "Scatter",
  chartTypeCombo: "Combo",
  chartsStacked: "Stacked",
  chartsItemLabel: "Show values",
  chartsLegend: "Legend",
  chartLegendTop: "Top",
  chartLegendRight: "Right",
  chartLegendBottom: "Bottom",
  chartLegendNone: "None",
  chartLabel: "Chart of the data",
  chartsRange: "Chart from selection",
  /** `{index}` is replaced (the range chart's number). */
  chartsRangeLabel: "Range chart {index}",
  /** `{label}` is replaced (the new chart's name). */
  chartsRangeCreated: "Chart created: {label}",
  chartsRangeRefused: "Select cells with numbers to create a chart",
  /** `{label}` is replaced (the chart's label). */
  chartsRangeUpdated: "Chart range updated: {label}",
  chartsCrossFilter: "Filter the grid",
  /** `{field}` and `{values}` are replaced (the column's name, the categories). */
  chartsCrossFilterApplied: "Filtered by {field}: {values}",
  chartsCrossFilterCleared: "Filter cleared",
  headerFilterLabel: "filter",
  filterValueAny: "any",
  filterValueTrue: "true",
  filterValueFalse: "false",
  toolbarUndo: "Undo",
  toolbarRedo: "Redo",
  statusBarCount: "Count",
  statusBarSum: "Sum",
  statusBarAvg: "Average",
  statusBarMin: "Min",
  statusBarMax: "Max",
  /** `{count}` is replaced (several rows). */
  footerRowSelected: "{count} rows selected",
  /** `{count}` is replaced (one row). */
  footerRowSelectedOne: "{count} row selected",
  footerTotalRows: "Total Rows:",
  /** `{visibleCount}` and `{totalCount}` are replaced (filtered rows). */
  footerTotalVisibleRows: "{visibleCount} of {totalCount}",
  contextMenuLabel: "Cell actions",
  contextMenuCopy: "Copy",
  contextMenuPaste: "Paste",
  contextMenuExport: "Export",
  contextMenuPin: "Pin column",
  contextMenuPasteRefused: "Press Ctrl + V (Cmd + V on a Mac) to paste",
  setFilterSearch: "Search values",
  setFilterSelectAll: "Select all",
  setFilterValues: "Values",
  /** `{count}` is replaced (a set filter's choice). */
  setFilterSelected: "{count} selected",
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
    isAnyOf: "is any of",
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
