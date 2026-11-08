/*
 * Data grid phase 6 (ADR-0021), shared by React and the HTML runtime: row grouping and generated
 * tree parents (group nodes the owners render as rows), aggregation, pivoting and the charts
 * integration's data. Pure functions over rows the owner keeps.
 */
import {
  type GridColumn,
  type GridColumnType,
  type GridSortModel,
  gridCompare,
  gridSortValue,
} from "./data-grid.js";
import type { GridColumnGroup } from "./grid-structure.js";

/** The row grouping column (MUI X `GRID_ROW_GROUPING_SINGLE_GROUPING_FIELD`). */
export const GRID_GROUPING_FIELD = "__row_group_by_columns_group__";
/** Id of the aggregation footer row (the root group). */
export const GRID_AGGREGATION_ROOT_ID = "auto-generated-group-footer-root";

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

/* ------------------------------------------------------------------ order of grouped rows */

export interface GridGroupOrderOptions<T> {
  isGroup(item: T): boolean;
  /** Position of a data row in the sorted rows. */
  place(item: T): number;
  /** Lowest place of a group's rows (its order when nothing sorts the groups). */
  firstPlace(item: T): number;
  keyOf(item: T): string;
  aggregateOf(item: T, field: string): unknown;
  sortModel: GridSortModel;
  columns: readonly GridColumn[];
  /** Fields grouped by (sorting one of them, or the grouping column, sorts the groups by key). */
  groupFields: readonly string[];
  aggregated: readonly string[];
}

/**
 * Sibling order under row grouping: data rows as sorted; groups by key when the sort is on a
 * grouped field (or the grouping column), by their aggregated value when it is on an aggregated
 * field, else in the order of their first row.
 */
export function gridGroupComparator<T>(o: GridGroupOrderOptions<T>): (a: T, b: T) => number {
  const first = o.sortModel[0];
  return (a, b) => {
    if (!o.isGroup(a) && !o.isGroup(b)) return o.place(a) - o.place(b);
    if (first && o.isGroup(a) && o.isGroup(b)) {
      const sign = first.sort === "asc" ? 1 : -1;
      if (first.field === GRID_GROUPING_FIELD || o.groupFields.includes(first.field)) {
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

export const gridChartTypes = ["column", "bar", "line", "area"] as const;
export type GridChartType = (typeof gridChartTypes)[number];

/** What the grid's chart shows (MUI X charts integration). */
export interface GridChartModel {
  /** Default `column`. */
  type?: GridChartType | undefined;
  /** The field whose texts are the categories (with row grouping: the top-level groups). */
  dimension?: string | null | undefined;
  /** Number fields drawn as series. */
  values?: readonly string[] | undefined;
}

export interface GridChartData {
  categories: string[];
  series: { name: string; data: (number | null)[] }[];
}

/**
 * The chart's data: one category per item (a top-level group, or a shown row), one series per
 * value field (a group gives its aggregated value: the model's function, else the sum).
 */
export function gridChartData<T>(
  items: readonly T[],
  model: GridChartModel,
  columns: readonly GridColumn[],
  categoryOf: (item: T) => string,
  valueAt: (item: T, field: string) => unknown,
): GridChartData {
  const fields = (model.values ?? []).filter((f) => columns.some((c) => c.field === f));
  return {
    categories: items.map(categoryOf),
    series: fields.map((field) => {
      const column = columns.find((c) => c.field === field) as GridColumn;
      return {
        name: column.headerName ?? field,
        data: items.map((item) => {
          const n = gridSortValue(valueAt(item, field), "number");
          return typeof n === "number" ? n : null;
        }),
      };
    }),
  };
}

/** A chart model from untrusted input. */
export function sanitizeGridChartModel(input: unknown): GridChartModel {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return {};
  const value = input as Record<string, unknown>;
  const out: GridChartModel = {};
  if (gridChartTypes.includes(value["type"] as GridChartType))
    out.type = value["type"] as GridChartType;
  if (typeof value["dimension"] === "string") out.dimension = value["dimension"];
  if (Array.isArray(value["values"]))
    out.values = value["values"].filter((v): v is string => typeof v === "string");
  return out;
}
