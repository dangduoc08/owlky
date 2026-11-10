/*
 * Data grid phase 6 (ADR-0021), shared by React and the HTML runtime: row grouping and generated
 * tree parents (group nodes the owners render as rows), aggregation, pivoting and the charts
 * integration's data. Pure functions over rows the owner keeps.
 */

import {
  type ChartColor,
  type ChartCurve,
  type ChartLegend,
  type ChartPointInput,
  type ChartType,
  chartColors,
  chartCurves,
  chartLegends,
} from "../chart/chart-model.js";
import {
  type GridColumn,
  type GridColumnType,
  type GridLabels,
  type GridSortModel,
  gridCompare,
  gridSortValue,
} from "./data-grid.js";
import type { GridColumnGroup, GridTreeRow } from "./grid-structure.js";

/** The row grouping column (MUI X `GRID_ROW_GROUPING_SINGLE_GROUPING_FIELD`). */
export const GRID_GROUPING_FIELD = "__row_group_by_columns_group__";
const GROUPING_PREFIX = "__row_group_by_columns_group_";

/**
 * The grouping column of one grouped field (`rowGroupingColumnMode="multiple"`; MUI X
 * `getRowGroupingFieldFromGroupingCriteria`), or the single one for `null`.
 */
export const gridGroupingField = (field: string | null): string =>
  field === null ? GRID_GROUPING_FIELD : `${GROUPING_PREFIX}${field}__`;

/** The grouped field of a grouping column (`null`: the single column; `undefined`: not one). */
export function gridGroupingFieldOf(field: string): string | null | undefined {
  if (field === GRID_GROUPING_FIELD) return null;
  return field.startsWith(GROUPING_PREFIX) &&
    field.endsWith("__") &&
    field.length > GROUPING_PREFIX.length + 2
    ? field.slice(GROUPING_PREFIX.length, -2)
    : undefined;
}

/** Whether a field is a row grouping column (the single one, or one per grouped field). */
export const isGridGroupingField = (field: string): boolean =>
  gridGroupingFieldOf(field) !== undefined;

/** A group key from a `groupingValueGetter` result (MUI X: a string, number, Date or nothing). */
export function gridGroupingKey(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  return String(value);
}
/** Id of the aggregation footer row (the root group). */
export const GRID_AGGREGATION_ROOT_ID = "auto-generated-group-footer-root";

/** Id of a group's footer row (`getAggregationPosition` → `footer`; MUI X ids). */
export const gridGroupFooterId = (groupId: string): string =>
  `auto-generated-group-footer-${groupId}`;

/** Id of a generated row (a group, or a missing tree parent) from its path of keys. */
export const gridGroupRowId = (path: readonly string[]): string =>
  `auto-generated-row-${path.map(encodeURIComponent).join("/")}`;

export interface GridGroupNode {
  id: string;
  parentId: string | null;
  /** 0 for top-level groups. */
  depth: number;
  /** Row grouping: the grouped field (tree data: none). */
  field?: string | undefined;
  /** The group's name (a cell text, or a tree path part). */
  key: string;
  path: string[];
  /** Ids of the data rows below the group (every level). */
  leafIds: string[];
}

export interface GridGroupNodes {
  /** Groups in order of first appearance. */
  groups: GridGroupNode[];
  /** Parent of every data row and group (null: top level). */
  parentOf: Map<string, string | null>;
}

/**
 * Row grouping (MUI X `rowGroupingModel`): one group per distinct key (the cell text) of each
 * grouped field, nested in the model's order; data rows sit under their deepest group.
 */
export function gridRowGroups<R>(
  rows: readonly R[],
  fields: readonly string[],
  idOf: (row: R) => string,
  keyOf: (row: R, field: string) => string,
): GridGroupNodes {
  const groups = new Map<string, GridGroupNode>();
  const parentOf = new Map<string, string | null>();
  for (const row of rows) {
    let parent: GridGroupNode | null = null;
    const path: string[] = [];
    fields.forEach((field, depth) => {
      path.push(field, keyOf(row, field));
      const id = gridGroupRowId(path);
      let group = groups.get(id);
      if (!group) {
        group = {
          id,
          parentId: parent?.id ?? null,
          depth,
          field,
          key: path[path.length - 1] as string,
          path: [...path],
          leafIds: [],
        };
        groups.set(id, group);
        parentOf.set(id, group.parentId);
      }
      group.leafIds.push(idOf(row));
      parent = group;
    });
    parentOf.set(idOf(row), (parent as GridGroupNode | null)?.id ?? null);
  }
  return { groups: [...groups.values()], parentOf };
}

/**
 * Tree data parents from paths (MUI X `getTreeDataPath`), with a generated row for every path
 * prefix that has no row of its own.
 */
export function gridTreeGroups<R>(
  rows: readonly R[],
  idOf: (row: R) => string,
  pathOf: (row: R) => readonly string[],
): GridGroupNodes {
  const byPath = new Map<string, string>();
  for (const row of rows) byPath.set(JSON.stringify(pathOf(row)), idOf(row));
  const groups = new Map<string, GridGroupNode>();
  const parentOf = new Map<string, string | null>();
  /** The id of the row (or generated row) at `path`, created when missing. */
  const at = (path: readonly string[]): string | null => {
    if (path.length === 0) return null;
    const own = byPath.get(JSON.stringify(path));
    const id = own ?? gridGroupRowId(path);
    if (!own) {
      let group = groups.get(id);
      if (!group) {
        const parentId = at(path.slice(0, -1));
        group = {
          id,
          parentId,
          depth: path.length - 1,
          key: path[path.length - 1] as string,
          path: [...path],
          leafIds: [],
        };
        groups.set(id, group);
        parentOf.set(id, parentId);
      }
    }
    return id;
  };
  for (const row of rows) {
    const path = pathOf(row);
    const parent = path.length > 1 ? at(path.slice(0, -1)) : null;
    parentOf.set(idOf(row), parent);
  }
  // Leaves of the generated rows: every data row below them.
  for (const row of rows) {
    for (let p = parentOf.get(idOf(row)) ?? null; p !== null; p = parentOf.get(p) ?? null)
      groups.get(p)?.leafIds.push(idOf(row));
  }
  return { groups: [...groups.values()], parentOf };
}

/* ------------------------------------------------------------------ aggregation */

export type GridAggregationModel = Record<string, string>;

/** An aggregation function (MUI X `GridAggregationFunction`). */
export interface GridAggregationFunction {
  /** The result from the values of the rows (rows without a value are left out). */
  apply(values: unknown[], column: GridColumn): unknown;
  /** Column types it applies to (default: every type). */
  columnTypes?: readonly GridColumnType[] | undefined;
}

const numbers = (values: unknown[]) =>
  values.map((v) => gridSortValue(v, "number")).filter((v): v is number => typeof v === "number");
/** The value whose sort value is the smallest (or largest): numbers and dates keep their form. */
const extreme = (values: unknown[], column: GridColumn, sign: 1 | -1) => {
  let best: unknown = null;
  for (const value of values) {
    if (gridSortValue(value, column.type) === null) continue;
    if (best === null || sign * gridCompare(value, best, column.type) < 0) best = value;
  }
  return best;
};

/** Built-in functions (MUI X names): sum, avg (2 decimals), min, max and size (the row count). */
export const gridAggregationFunctions: Readonly<Record<string, GridAggregationFunction>> = {
  sum: {
    apply: (values) => {
      const list = numbers(values);
      return list.length ? list.reduce((sum, n) => sum + n, 0) : null;
    },
    columnTypes: ["number"],
  },
  avg: {
    apply: (values) => {
      const list = numbers(values);
      return list.length
        ? Math.round((list.reduce((sum, n) => sum + n, 0) / list.length) * 100) / 100
        : null;
    },
    columnTypes: ["number"],
  },
  min: {
    apply: (values, column) => extreme(values, column, 1),
    columnTypes: ["number", "date", "dateTime"],
  },
  max: {
    apply: (values, column) => extreme(values, column, -1),
    columnTypes: ["number", "date", "dateTime"],
  },
  size: { apply: (values) => values.length },
};

/** The functions a column offers (its `availableAggregationFunctions`, else by type). */
export function gridAggregationFunctionsFor(
  column: GridColumn,
  functions: Readonly<Record<string, GridAggregationFunction>> = gridAggregationFunctions,
  available?: readonly string[],
): string[] {
  if (column.aggregable === false || column.type === "actions") return [];
  return Object.entries(functions)
    .filter(
      ([name, fn]) =>
        (!available || available.includes(name)) &&
        (!fn.columnTypes || fn.columnTypes.includes(column.type ?? "string")),
    )
    .map(([name]) => name);
}

/** Aggregated values of `rows` per field of the model (unknown functions are skipped). */
export function gridAggregate<R>(
  rows: readonly R[],
  model: GridAggregationModel,
  columns: readonly GridColumn[],
  value: (row: R, field: string) => unknown,
  functions: Readonly<Record<string, GridAggregationFunction>> = gridAggregationFunctions,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [field, name] of Object.entries(model)) {
    const fn = Object.hasOwn(functions, name) ? functions[name] : undefined;
    const column = columns.find((c) => c.field === field);
    if (!fn || !column) continue;
    if (fn.columnTypes && !fn.columnTypes.includes(column.type ?? "string")) continue;
    const values = rows.map((row) => value(row, field)).filter((v) => v !== undefined);
    out[field] = fn.apply(values, column);
  }
  return out;
}

/** An aggregation model from untrusted input (JSON attributes): field → known function name. */
/** The status bar of a cell selection: how many cells hold a value, and their numbers' figures. */
export interface GridSelectionStats {
  /** Selected cells with a value. */
  count: number;
  /** Selected cells of `number` columns with a number. */
  numbers: number;
  sum: unknown;
  avg: unknown;
  min: unknown;
  max: unknown;
}

const STATUS_COLUMN: GridColumn = { field: "", type: "number" };

/**
 * Figures of the selected cells (`value` and its column): a count of the cells with a value, and
 * `sum`, `avg`, `min` and `max` of the numbers in `number` columns, through the aggregation
 * functions of those names (a missing or refused function gives `null`).
 */
export function gridSelectionStats(
  cells: readonly { value: unknown; column: GridColumn }[],
  functions: Readonly<Record<string, GridAggregationFunction>> = gridAggregationFunctions,
): GridSelectionStats {
  let count = 0;
  const values: number[] = [];
  for (const { value, column } of cells) {
    if (value === null || value === undefined || value === "") continue;
    count++;
    if (column.type !== "number") continue;
    const n = gridSortValue(value, "number");
    if (typeof n === "number") values.push(n);
  }
  const run = (name: string) => {
    const fn = Object.hasOwn(functions, name) ? functions[name] : undefined;
    if (!fn || !values.length || (fn.columnTypes && !fn.columnTypes.includes("number")))
      return null;
    return fn.apply(values, STATUS_COLUMN);
  };
  return {
    count,
    numbers: values.length,
    sum: run("sum"),
    avg: run("avg"),
    min: run("min"),
    max: run("max"),
  };
}

/** One item of the status bar: its key and its text ("Sum: 1,240"). */
export interface GridStatusItem {
  key: "count" | "sum" | "avg" | "min" | "max";
  text: string;
}

/**
 * The status bar's items: the count, then (with numbers) sum, average, min and max. Numbers are
 * formatted for `locale` with at most 2 decimals; values that aren't numbers show as text.
 */
export function gridStatusItems(
  stats: GridSelectionStats,
  labels: Pick<
    GridLabels,
    "statusBarCount" | "statusBarSum" | "statusBarAvg" | "statusBarMin" | "statusBarMax"
  >,
  locale?: string,
): GridStatusItem[] {
  if (stats.count === 0) return [];
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const show = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value) ? format.format(value) : String(value);
  const items: GridStatusItem[] = [
    { key: "count", text: `${labels.statusBarCount}: ${format.format(stats.count)}` },
  ];
  if (stats.numbers === 0) return items;
  const named = [
    ["sum", labels.statusBarSum],
    ["avg", labels.statusBarAvg],
    ["min", labels.statusBarMin],
    ["max", labels.statusBarMax],
  ] as const;
  for (const [key, label] of named) {
    const value = stats[key];
    if (value !== null && value !== undefined)
      items.push({ key, text: `${label}: ${show(value)}` });
  }
  return items;
}

export function parseGridAggregationModel(
  json: string | null,
  functions: Readonly<Record<string, GridAggregationFunction>> = gridAggregationFunctions,
): GridAggregationModel {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json ?? "null");
  } catch {
    return {};
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
  const out: GridAggregationModel = {};
  for (const [field, name] of Object.entries(parsed as Record<string, unknown>))
    if (
      !["__proto__", "constructor", "prototype"].includes(field) &&
      typeof name === "string" &&
      Object.hasOwn(functions, name)
    )
      out[field] = name;
  return out;
}

/** Where a group shows its aggregated values (MUI X `GridAggregationPosition`; `null`: nowhere). */
export type GridAggregationPosition = "inline" | "footer" | null;

/**
 * Positions by level (the HTML equivalent of `getAggregationPosition`): `root` for the footer of
 * every row (default `footer`), a grouped field for its groups (default `inline`).
 */
export type GridAggregationPositions = Record<string, GridAggregationPosition>;

/** Positions from untrusted input (JSON attributes): known values only. */
export function parseGridAggregationPositions(json: string | null): GridAggregationPositions {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json ?? "null");
  } catch {
    return {};
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
  const out: GridAggregationPositions = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>))
    if (
      !["__proto__", "constructor", "prototype"].includes(key) &&
      (value === "inline" || value === "footer" || value === null)
    )
      out[key] = value;
  return out;
}

/** A group's position (`field` undefined: the root) from positions by level. */
export const gridAggregationPositionOf = (
  positions: GridAggregationPositions,
  field: string | undefined,
): GridAggregationPosition =>
  field === undefined
    ? Object.hasOwn(positions, "root")
      ? (positions["root"] as GridAggregationPosition)
      : "footer"
    : Object.hasOwn(positions, field)
      ? (positions[field] as GridAggregationPosition)
      : "inline";

/**
 * The shown rows with a footer row after the last shown descendant of each open group that has
 * one (`getAggregationPosition` → `footer`). Footers sit one level below their group.
 */
export function gridWithGroupFooters<R>(
  list: readonly GridTreeRow<R>[],
  hasFooter: (node: GridTreeRow<R>) => boolean,
  footerOf: (node: GridTreeRow<R>) => R,
): GridTreeRow<R>[] {
  const out: GridTreeRow<R>[] = [];
  const open: GridTreeRow<R>[] = [];
  const close = (depth: number) => {
    while (open.length && (open[open.length - 1] as GridTreeRow<R>).depth >= depth) {
      const group = open.pop() as GridTreeRow<R>;
      out.push({
        row: footerOf(group),
        id: gridGroupFooterId(group.id),
        depth: group.depth + 1,
        parentId: group.id,
        childrenCount: 0,
        descendantCount: 0,
        expanded: false,
        posInSet: 0,
        setSize: 0,
      });
    }
  };
  for (const node of list) {
    close(node.depth);
    out.push(node);
    if (node.expanded && hasFooter(node)) open.push(node);
  }
  close(0);
  return out;
}

/* ------------------------------------------------------------------ order of grouped rows */

export interface GridGroupOrderOptions<T> {
  isGroup(item: T): boolean;
  /** Position of a data row in the sorted rows. */
  place(item: T): number;
  /** Lowest place of a group's rows (its order when nothing sorts the groups). */
  firstPlace(item: T): number;
  keyOf(item: T): string;
  aggregateOf(item: T, field: string): unknown;
  /** A group's grouped field (a column of one grouped field sorts that field's groups). */
  fieldOf?: ((item: T) => string | undefined) | undefined;
  sortModel: GridSortModel;
  columns: readonly GridColumn[];
  /** Fields grouped by (sorting one of them, or the grouping column, sorts the groups by key). */
  groupFields: readonly string[];
  aggregated: readonly string[];
}

/**
 * Sibling order under row grouping: data rows as sorted; groups by key when the sort is on a
 * grouped field or the grouping column (a column of one grouped field: that field's groups), by
 * their aggregated value when it is on an aggregated field, else in the order of their first row.
 */
export function gridGroupComparator<T>(o: GridGroupOrderOptions<T>): (a: T, b: T) => number {
  const first = o.sortModel[0];
  return (a, b) => {
    if (!o.isGroup(a) && !o.isGroup(b)) return o.place(a) - o.place(b);
    if (first && o.isGroup(a) && o.isGroup(b)) {
      const sign = first.sort === "asc" ? 1 : -1;
      const own = gridGroupingFieldOf(first.field);
      if (
        own === null ||
        o.groupFields.includes(first.field) ||
        (own !== undefined && o.fieldOf?.(a) === own && o.fieldOf?.(b) === own)
      ) {
        const order = o.keyOf(a).localeCompare(o.keyOf(b), undefined, { numeric: true });
        if (order !== 0) return sign * order;
      } else if (o.aggregated.includes(first.field)) {
        const type = o.columns.find((c) => c.field === first.field)?.type;
        const x = o.aggregateOf(a, first.field);
        const y = o.aggregateOf(b, first.field);
        const empty = gridSortValue(x, type) === null || gridSortValue(y, type) === null;
        const order = gridCompare(x, y, type);
        if (order !== 0) return empty ? order : sign * order;
      }
    }
    const pa = o.isGroup(a) ? o.firstPlace(a) : o.place(a);
    const pb = o.isGroup(b) ? o.firstPlace(b) : o.place(b);
    return pa - pb;
  };
}

/* ------------------------------------------------------------------ pivoting */

export interface GridPivotModel {
  rows: { field: string; hidden?: boolean | undefined }[];
  columns: { field: string; sort?: "asc" | "desc" | undefined; hidden?: boolean | undefined }[];
  values: { field: string; aggFunc: string; hidden?: boolean | undefined }[];
}

export interface GridPivotColumn extends GridColumn {
  /** The value column it aggregates. */
  pivotValueField: string;
  /** The column keys it stands for (one per pivot column field). */
  pivotKeys: string[];
}

export interface GridPivotResult<R> {
  columns: GridPivotColumn[];
  columnGroupingModel: GridColumnGroup[];
  aggregationModel: GridAggregationModel;
  rowGroupingModel: string[];
  /** A data row's value for a pivot column (`undefined` when the row isn't in its bucket). */
  value(row: R, field: string): unknown;
}

const PIVOT_PREFIX = "pivot:";
/** Field of a pivot column: its column keys, value field and function. */
export const gridPivotField = (
  keys: readonly string[],
  valueField: string,
  aggFunc: string,
): string => `${PIVOT_PREFIX}${[...keys, valueField, aggFunc].map(encodeURIComponent).join("/")}`;
export const isGridPivotField = (field: string): boolean => field.startsWith(PIVOT_PREFIX);

/**
 * The pivot (MUI X `pivotModel`): groups of `rows` fields, one column per distinct combination of
 * `columns` keys (cell texts, sorted) and value, aggregated with its function; column groups name
 * the keys.
 */
export function gridPivot<R>(
  rows: readonly R[],
  columns: readonly GridColumn[],
  model: GridPivotModel,
  value: (row: R, field: string) => unknown,
  text: (row: R, field: string) => string,
  labelOf: (fn: string) => string = (fn) => fn,
): GridPivotResult<R> {
  const has = (field: string) => columns.some((c) => c.field === field);
  const colFields = model.columns.filter((c) => !c.hidden && has(c.field));
  const values = model.values.filter(
    (v) => !v.hidden && has(v.field) && Object.hasOwn(gridAggregationFunctions, v.aggFunc),
  );
  // Distinct key tuples, sorted level by level (ascending unless the field says `desc`).
  const tuples = new Map<string, string[]>();
  for (const row of rows) {
    const keys = colFields.map((c) => text(row, c.field));
    tuples.set(JSON.stringify(keys), keys);
  }
  const sorted = [...tuples.values()].sort((a, b) => {
    for (const [i, c] of colFields.entries()) {
      const order = (a[i] as string).localeCompare(b[i] as string, undefined, { numeric: true });
      if (order !== 0) return c.sort === "desc" ? -order : order;
    }
    return 0;
  });
  const keyed = colFields.length ? sorted : [[]];
  const pivotColumns: GridPivotColumn[] = [];
  const aggregationModel: GridAggregationModel = {};
  for (const keys of keyed)
    for (const v of values) {
      const source = columns.find((c) => c.field === v.field) as GridColumn;
      const field = gridPivotField(keys, v.field, v.aggFunc);
      pivotColumns.push({
        field,
        headerName: `${source.headerName ?? source.field} (${labelOf(v.aggFunc)})`,
        type: v.aggFunc === "size" ? "number" : source.type,
        width: Math.max(source.width ?? 120, 120),
        hideable: false,
        resizable: true,
        pivotValueField: v.field,
        pivotKeys: keys,
      });
      aggregationModel[field] = v.aggFunc;
    }
  // Column groups: one level per column field, named by its key.
  const columnGroupingModel: GridColumnGroup[] = [];
  if (colFields.length) {
    const build = (level: number, prefix: string[]): GridColumnGroup[] => {
      const seen: string[] = [];
      for (const keys of sorted)
        if (JSON.stringify(keys.slice(0, level)) === JSON.stringify(prefix)) {
          const key = keys[level] as string;
          if (!seen.includes(key)) seen.push(key);
        }
      return seen.map((key) => {
        const path = [...prefix, key];
        return {
          groupId: `pivot-group:${path.map(encodeURIComponent).join("/")}`,
          headerName: key,
          children:
            level === colFields.length - 1
              ? values.map((v) => ({ field: gridPivotField(path, v.field, v.aggFunc) }))
              : build(level + 1, path),
        };
      });
    };
    columnGroupingModel.push(...build(0, []));
  }
  const byField = new Map(pivotColumns.map((c) => [c.field, c]));
  return {
    columns: pivotColumns,
    columnGroupingModel,
    aggregationModel,
    rowGroupingModel: model.rows.filter((r) => !r.hidden && has(r.field)).map((r) => r.field),
    value(row, field) {
      const column = byField.get(field);
      if (!column) return value(row, field);
      const inBucket = colFields.every((c, i) => text(row, c.field) === column.pivotKeys[i]);
      return inBucket ? value(row, column.pivotValueField) : undefined;
    },
  };
}

/** A pivot model from untrusted input: known shapes and function names only. */
export function sanitizeGridPivotModel(input: unknown): GridPivotModel {
  const out: GridPivotModel = { rows: [], columns: [], values: [] };
  const record = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v);
  if (!record(input)) return out;
  const list = (key: string) => (Array.isArray(input[key]) ? (input[key] as unknown[]) : []);
  for (const item of list("rows"))
    if (record(item) && typeof item["field"] === "string")
      out.rows.push({ field: item["field"], ...(item["hidden"] === true ? { hidden: true } : {}) });
  for (const item of list("columns"))
    if (record(item) && typeof item["field"] === "string")
      out.columns.push({
        field: item["field"],
        ...(item["sort"] === "asc" || item["sort"] === "desc" ? { sort: item["sort"] } : {}),
        ...(item["hidden"] === true ? { hidden: true } : {}),
      });
  for (const item of list("values"))
    if (
      record(item) &&
      typeof item["field"] === "string" &&
      typeof item["aggFunc"] === "string" &&
      Object.hasOwn(gridAggregationFunctions, item["aggFunc"])
    )
      out.values.push({
        field: item["field"],
        aggFunc: item["aggFunc"],
        ...(item["hidden"] === true ? { hidden: true } : {}),
      });
  return out;
}

/** Where a field sits in a pivot model (the panel's choice for it). */
export function gridPivotRole(
  model: GridPivotModel,
  field: string,
): "rows" | "columns" | "values" | "none" {
  if (model.rows.some((r) => r.field === field)) return "rows";
  if (model.columns.some((c) => c.field === field)) return "columns";
  if (model.values.some((v) => v.field === field)) return "values";
  return "none";
}

/** The model after moving `field` to `role` (values get `aggFunc`, default `sum` or `size`). */
export function setGridPivotRole(
  model: GridPivotModel,
  field: string,
  role: "rows" | "columns" | "values" | "none",
  aggFunc = "sum",
): GridPivotModel {
  const next: GridPivotModel = {
    rows: model.rows.filter((r) => r.field !== field),
    columns: model.columns.filter((c) => c.field !== field),
    values: model.values.filter((v) => v.field !== field),
  };
  if (role === "rows") next.rows.push({ field });
  if (role === "columns") next.columns.push({ field });
  if (role === "values") next.values.push({ field, aggFunc });
  return next;
}

/* ------------------------------------------------------------------ charts integration */

/**
 * Chart types of the charts integration: MUI X's (`column`, `bar`, `line`, `area`, `pie`; a pie
 * with a hole is `donut`) and, beyond it, `radar` and `scatter` from the Chart component.
 */
export const gridChartTypes = [
  "column",
  "bar",
  "line",
  "area",
  "pie",
  "donut",
  "radar",
  "scatter",
] as const;
export type GridChartType = (typeof gridChartTypes)[number];
/** Types that stack their series (MUI X `stacked`). */
export const gridStackableChartTypes: readonly GridChartType[] = ["column", "bar", "line", "area"];
/** Types that draw the first series only, one slice per category. */
const SLICED: readonly GridChartType[] = ["pie", "donut"];

/** What the grid's chart shows (MUI X charts integration: dimension, values, configuration). */
export interface GridChartModel {
  /** Several charts: the chart's name in the panel and its accessible label (MUI X `label`). */
  label?: string | undefined;
  /** Default `column`. */
  type?: GridChartType | undefined;
  /** The field whose texts are the categories (with row grouping: the top-level groups). */
  dimension?: string | null | undefined;
  /**
   * Number fields drawn as series. While the grid is pivoted, a value field of the pivot stands
   * for its pivot columns (one series per column key); pivot column fields work too.
   */
  values?: readonly string[] | undefined;
  /** Column, bar, line and area charts stack their series (two series or more). */
  stacked?: boolean | undefined;
  /** `value` prints the values on the chart (MUI X `itemLabel`). Default `none`. */
  itemLabel?: "none" | "value" | undefined;
  /** Legend position (never shown for a single series). Default `top`. */
  legend?: ChartLegend | undefined;
  /** Series colors in order (pie and donut: slice colors): palette names or shades. */
  colors?: readonly ChartColor[] | undefined;
  /** Plot height in px. Default 320. */
  height?: number | undefined;
  /** Line, area and radar shape (MUI X `interpolation`). Default `smooth`. */
  curve?: ChartCurve | undefined;
  /** Markers on line, area and radar points (MUI X `showMark`). */
  showMark?: boolean | undefined;
  /** Title of the value axis (MUI X `seriesAxisLabel`). */
  seriesAxisLabel?: string | undefined;
  /** The Chart's toolbar with downloads (MUI X `showToolbar`). */
  showToolbar?: boolean | undefined;
  /** Series grow in and move to new values (MUI X: the opposite of `skipAnimation`). */
  animations?: boolean | undefined;
  /** Pie and donut: where the slices start, in degrees clockwise from 12 o'clock. */
  startAngle?: number | undefined;
  /** Pie and donut: where the slices end. */
  endAngle?: number | undefined;
  /** Donut hole in % of the radius (MUI X `innerRadius`). */
  donutSize?: number | undefined;
  /**
   * A range chart (`createRangeChart`): the ids of the rows it draws, those that pass the filters
   * in the grid's order (grouping and paging aside). Without it, the page's rows or the groups.
   */
  rows?: readonly string[] | undefined;
  /**
   * Selecting a category (a click, Enter or Space) filters the grid to it, as an `isAnyOf` filter
   * of the category field; clearing the selection clears it (ApexGrid `crossFilter`). The chart
   * draws the rows that pass the other filters.
   */
  crossFilter?: boolean | undefined;
}

/** A series of the grid's chart (an entry of the Chart component's `series`). */
export interface GridChartSeries {
  name: string;
  data: ChartPointInput[];
  color?: ChartColor | undefined;
}

export interface GridChartData {
  categories: string[];
  series: GridChartSeries[];
  /** `numeric`: a scatter chart of rows whose dimension is a number column (`[x, y]` points). */
  xType?: "numeric" | undefined;
}

/** A column the chart can draw: a data column, or a pivot column (its value field and keys). */
export type GridChartColumn = GridColumn & {
  pivotValueField?: string | undefined;
  pivotKeys?: readonly string[] | undefined;
};

/**
 * The columns drawn as series, in the model's order: known fields of `columns`, and for pivot
 * columns every column whose value field the model names.
 */
export function gridChartFields(
  model: GridChartModel,
  columns: readonly GridChartColumn[],
): GridChartColumn[] {
  const out: GridChartColumn[] = [];
  for (const field of model.values ?? [])
    for (const column of columns)
      if ((column.field === field || column.pivotValueField === field) && !out.includes(column))
        out.push(column);
  return out;
}

/**
 * The chart's data: one category per item (a top-level group, or a shown row), one series per
 * value column (a group gives its aggregated value). Pivot columns are named by their keys (and
 * their value column when several value columns are drawn). A scatter chart gets `[x, y]` points
 * when `xOf` gives numbers (rows whose dimension is a number column).
 */
export function gridChartData<T>(
  items: readonly T[],
  model: GridChartModel,
  columns: readonly GridChartColumn[],
  categoryOf: (item: T) => string,
  valueAt: (item: T, field: string) => unknown,
  xOf?: (item: T) => unknown,
): GridChartData {
  const fields = gridChartFields(model, columns);
  const numberOf = (value: unknown) => {
    const n = gridSortValue(value, "number");
    return typeof n === "number" && Number.isFinite(n) ? n : null;
  };
  const sources = new Set(fields.map((c) => c.pivotValueField ?? c.field));
  const nameOf = (column: GridChartColumn) => {
    const header = column.headerName ?? column.field;
    if (!column.pivotKeys?.length) return header;
    const keys = column.pivotKeys.join(" · ");
    return sources.size > 1 ? `${keys} · ${header}` : keys;
  };
  const type = model.type ?? "column";
  const colors = (model.colors ?? []).filter((c) => chartColors.includes(c));
  const sliced = SLICED.includes(type);
  const xs = type === "scatter" && xOf ? items.map((item) => numberOf(xOf(item))) : null;
  return {
    categories: items.map(categoryOf),
    series: fields.map((column, index) => {
      const values = items.map((item) => numberOf(valueAt(item, column.field)));
      const data: ChartPointInput[] = xs
        ? values.flatMap((y, i) => {
            const x = xs[i] ?? null;
            return x === null || y === null ? [] : [[x, y] as const];
          })
        : sliced && colors.length
          ? values.map((y, i) => ({ y, color: colors[i % colors.length] as ChartColor }))
          : values;
      const color = !sliced && colors.length ? colors[index % colors.length] : undefined;
      return { name: nameOf(column), data, ...(color ? { color } : {}) };
    }),
    ...(xs ? { xType: "numeric" as const } : {}),
  };
}

/** The Chart component's options for a chart model (React props, HTML attributes). */
export interface GridChartOptions {
  type: ChartType;
  xType: "category" | "numeric";
  horizontal?: boolean;
  stacked?: boolean;
  dataLabels?: boolean;
  legend?: ChartLegend;
  height?: number;
  curve?: ChartCurve;
  markerSize?: number;
  yTitle?: string;
  toolbar?: boolean;
  animations?: boolean;
  startAngle?: number;
  endAngle?: number;
  donutSize?: number;
}

/** Whether the chart stacks its series: a stackable type, two series or more. */
export const gridChartStacked = (model: GridChartModel, seriesCount: number): boolean =>
  !!model.stacked && gridStackableChartTypes.includes(model.type ?? "column") && seriesCount > 1;

/**
 * The Chart component's options for a chart model: `column` / `bar` are vertical / horizontal
 * bars; configuration the type doesn't use is left out (defaults are left out too).
 */
export function gridChartOptions(
  model: GridChartModel,
  data: GridChartData | null,
): GridChartOptions {
  const type = model.type ?? "column";
  const sliced = SLICED.includes(type);
  const options: GridChartOptions = {
    type: type === "column" ? "bar" : type,
    xType: data?.xType ?? "category",
  };
  if (type === "bar") options.horizontal = true;
  if (gridChartStacked(model, data?.series.length ?? 0)) options.stacked = true;
  if (model.itemLabel === "value") options.dataLabels = true;
  if (model.legend && model.legend !== "top") options.legend = model.legend;
  if (model.height !== undefined) options.height = model.height;
  if (type === "line" || type === "area" || type === "radar") {
    if (model.curve && model.curve !== "smooth") options.curve = model.curve;
    if (model.showMark) options.markerSize = 4;
  }
  if (model.seriesAxisLabel && !sliced && type !== "radar") options.yTitle = model.seriesAxisLabel;
  if (model.showToolbar) options.toolbar = true;
  if (model.animations) options.animations = true;
  if (sliced) {
    if (model.startAngle !== undefined) options.startAngle = model.startAngle;
    if (model.endAngle !== undefined) options.endAngle = model.endAngle;
    if (type === "donut" && model.donutSize !== undefined) options.donutSize = model.donutSize;
  }
  return options;
}

/** Several charts of one grid (MUI X: one renderer proxy per id), by chart id. */
export type GridChartModels = Record<string, GridChartModel>;

/** Ids of several charts: letters, digits, `-` and `_` (they name elements). */
const CHART_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** Chart models by id from untrusted input: safe ids and known model keys only. */
export function sanitizeGridChartModels(input: unknown): GridChartModels {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return {};
  const out: GridChartModels = {};
  for (const [id, model] of Object.entries(input as Record<string, unknown>))
    if (CHART_ID.test(id) && !["__proto__", "constructor", "prototype"].includes(id))
      out[id] = sanitizeGridChartModel(model);
  return out;
}

/** The chart the panel edits: `id` when it is one of the charts, else the first. */
export const gridActiveChartId = (models: GridChartModels, id: string | null | undefined) =>
  id && Object.hasOwn(models, id) ? id : (Object.keys(models)[0] ?? null);

/** A chart model from untrusted input: known keys, types and values only. */
export function sanitizeGridChartModel(input: unknown): GridChartModel {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return {};
  const value = input as Record<string, unknown>;
  const out: GridChartModel = {};
  if (gridChartTypes.includes(value["type"] as GridChartType))
    out.type = value["type"] as GridChartType;
  if (typeof value["dimension"] === "string") out.dimension = value["dimension"];
  if (Array.isArray(value["values"]))
    out.values = value["values"].filter((v): v is string => typeof v === "string");
  for (const key of ["stacked", "showMark", "showToolbar", "animations", "crossFilter"] as const)
    if (typeof value[key] === "boolean") out[key] = value[key];
  if (value["itemLabel"] === "none" || value["itemLabel"] === "value")
    out.itemLabel = value["itemLabel"];
  if (chartLegends.includes(value["legend"] as ChartLegend))
    out.legend = value["legend"] as ChartLegend;
  if (Array.isArray(value["colors"]))
    out.colors = value["colors"].filter((c): c is ChartColor =>
      chartColors.includes(c as ChartColor),
    );
  if (chartCurves.includes(value["curve"] as ChartCurve)) out.curve = value["curve"] as ChartCurve;
  if (typeof value["seriesAxisLabel"] === "string") out.seriesAxisLabel = value["seriesAxisLabel"];
  if (typeof value["label"] === "string") out.label = value["label"];
  if (Array.isArray(value["rows"]))
    out.rows = value["rows"]
      .filter((v): v is string | number => typeof v === "string" || typeof v === "number")
      .slice(0, 100_000)
      .map(String);
  for (const key of ["height", "startAngle", "endAngle", "donutSize"] as const) {
    const n = value[key];
    if (typeof n === "number" && Number.isFinite(n)) out[key] = n;
  }
  return out;
}
