/*
 * Data grid charts integration, batch E (roadmap 4.18.12, ADR-0055), shared by React and the HTML
 * runtime: a chart from a cell range (`createRangeChart`, Alt + F1), cross-filtering (a chart's
 * category selection is the `isAnyOf` filter of its category field) and the charts' JSON config
 * (`chartsToJSON` / `restoreCharts`). Pure functions; the owners keep the models.
 */

import type { ChartDataPoint } from "../chart/chart-select.js";
import {
  type GridColumn,
  type GridFilterModel,
  gridFilterValues,
  gridFoldText,
  gridSortValue,
} from "./data-grid.js";
import { type GridCellSelectionModel, gridSelectedBlock } from "./grid-cells.js";
import {
  type GridChartModel,
  type GridChartModels,
  type GridChartType,
  gridChartTypes,
  sanitizeGridChartModel,
  sanitizeGridChartModels,
} from "./grid-premium.js";

/* ------------------------------------------------------------------ range charts */

/** What `createRangeChart` takes (ApexGrid / AG Grid `createRangeChart` params). */
export interface GridRangeChartParams {
  /** The cells to chart. Default: the cell selection. */
  cellRange?: GridCellSelectionModel | undefined;
  /** Default `column`. */
  chartType?: GridChartType | undefined;
  /** The chart's name (several charts). Default "Range chart <n>". */
  label?: string | undefined;
  /** Several charts: the new chart's id. Default `range-<n>`. */
  id?: string | undefined;
}

/** A created range chart: its id (`null` with one chart, whose model it replaced) and model. */
export interface GridRangeChart {
  id: string | null;
  model: GridChartModel;
}

/**
 * The chart model of a cell range: its rows (`rows`, in the grid's order), categories from the
 * range's first column when that isn't a number column (else the rows' positions), one series per
 * number column of the range. `null` (refused) when the range holds no number.
 */
export function gridRangeChartModel(
  range: GridCellSelectionModel,
  rowIds: readonly string[],
  columns: readonly GridColumn[],
  valueAt: (rowId: string, field: string) => unknown,
  params: Pick<GridRangeChartParams, "chartType" | "label"> = {},
): GridChartModel | null {
  const usable = columns.filter((c) => c.type !== "actions");
  const block = gridSelectedBlock(
    range,
    rowIds,
    usable.map((c) => c.field),
  );
  if (!block.ids.length) return null;
  const typeOf = (field: string) => usable.find((c) => c.field === field)?.type;
  const first = block.fields[0] as string;
  const dimension = typeOf(first) === "number" ? null : first;
  const values = block.fields.filter((f) => f !== dimension && typeOf(f) === "number");
  const numeric = values.some((field) =>
    block.ids.some((rowId) => {
      const n = gridSortValue(valueAt(rowId, field), "number");
      return typeof n === "number" && Number.isFinite(n);
    }),
  );
  if (!numeric) return null;
  const type = gridChartTypes.includes(params.chartType as GridChartType)
    ? (params.chartType as GridChartType)
    : "column";
  return {
    ...(params.label ? { label: params.label } : {}),
    type,
    dimension,
    values,
    rows: block.ids,
  };
}

/**
 * The new range chart's id: `wanted` when it is a valid chart id (letters, digits, `-`, `_`),
 * else the first free `range-<n>`; `index` is that `n` (the default label's number).
 */
export function gridRangeChartId(
  models: GridChartModels,
  wanted?: string,
): { id: string; index: number } {
  let index = 1;
  while (Object.hasOwn(models, `range-${index}`)) index++;
  const valid = !!wanted && Object.hasOwn(sanitizeGridChartModels({ [wanted]: {} }), wanted);
  return { id: valid ? (wanted as string) : `range-${index}`, index };
}

/** Whether a chart model draws a range's rows (`rows`) instead of the grid's rows or groups. */
export const isGridRangeChart = (model: GridChartModel): boolean => Array.isArray(model.rows);

/* ------------------------------------------------------------------ cross-filtering */

/**
 * The field a cross-filtering chart filters: the top-level grouping field when the chart draws
 * groups, else its `dimension`. `null`: the chart doesn't cross-filter (off, pivoted, a numeric
 * scatter chart, no categories).
 */
export function gridCrossFilterField(
  model: GridChartModel,
  groupingField: string | null,
  options: { pivot?: boolean; numeric?: boolean } = {},
): string | null {
  if (!model.crossFilter || options.pivot || options.numeric) return null;
  if (groupingField && !isGridRangeChart(model)) return groupingField;
  return model.dimension ?? null;
}

const crossItem = (field: string) => (item: GridFilterModel["items"][number]) =>
  item.field === field && item.operator === "isAnyOf";

/** The filter a cross-filtering chart draws from: the grid's, without its own field's `isAnyOf`. */
export function gridCrossFilterBase(model: GridFilterModel, field: string): GridFilterModel {
  const own = crossItem(field);
  return model.items.some(own) ? { ...model, items: model.items.filter((i) => !own(i)) } : model;
}

/** The categories a cross-filtering chart filters on now (its field's `isAnyOf` values). */
export function gridCrossFilterValues(model: GridFilterModel, field: string): string[] {
  const item = model.items.find(crossItem(field));
  return item ? gridFilterValues(item.value) : [];
}

/**
 * The filter model after a chart's category selection: its field's `isAnyOf` items give way to
 * one item of `categories` (none clears the filter).
 */
export function gridCrossFilter(
  model: GridFilterModel,
  field: string,
  categories: readonly string[],
): GridFilterModel {
  const items = model.items.filter((i) => !crossItem(field)(i));
  if (categories.length) items.push({ field, operator: "isAnyOf", value: [...categories] });
  return { ...model, items };
}

/**
 * The categories a chart's selection change selects (`ok:chart:select` / `onDataPointSelection`
 * detail): the categories of the selected points, without the toggled one when it was cleared.
 */
export function gridCrossFilterSelection(
  categories: readonly string[],
  detail: { dataPointIndex: number; selected: boolean; selectedDataPoints: ChartDataPoint[] },
): string[] {
  const indexes = new Set(detail.selectedDataPoints.map((p) => p.dataPointIndex));
  if (!detail.selected) indexes.delete(detail.dataPointIndex);
  const out: string[] = [];
  for (const index of [...indexes].sort((a, b) => a - b)) {
    const category = categories[index];
    if (category !== undefined && !out.includes(category)) out.push(category);
  }
  return out;
}

/** The chart's selected points for the filtered categories: every series' point at each one. */
export function gridCrossFilterPoints(
  categories: readonly string[],
  values: readonly string[],
  seriesCount: number,
): ChartDataPoint[] {
  const wanted = new Set(values.map((v) => gridFoldText(v)));
  const out: ChartDataPoint[] = [];
  categories.forEach((category, dataPointIndex) => {
    if (!wanted.has(gridFoldText(category))) return;
    for (let seriesIndex = 0; seriesIndex < Math.max(seriesCount, 1); seriesIndex++)
      out.push({ seriesIndex, dataPointIndex });
  });
  return out;
}

/**
 * Items grouped by key in first-appearance order: the top-level groups a cross-filtering chart
 * draws (from rows that pass the other filters, already sorted).
 */
export function gridChartGroups<T>(
  items: readonly T[],
  keyOf: (item: T) => string,
): { key: string; rows: T[] }[] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyOf(item);
    const list = groups.get(key);
    if (list) list.push(item);
    else groups.set(key, [item]);
  }
  return [...groups].map(([key, rows]) => ({ key, rows }));
}

/* ------------------------------------------------------------------ charts config */

/**
 * The charts' JSON config (`chartsToJSON()`, ApexGrid `chart.toJSON()`): the `chartsIntegration`
 * part of the grid state (MUI X `exportState`).
 */
export interface GridChartsState {
  /** The one chart's model. */
  model?: GridChartModel | undefined;
  /** Several charts, by id (MUI X `charts`). */
  charts?: GridChartModels | undefined;
  /** The chart the panel edits (MUI X `activeChartId`). */
  activeChartId?: string | undefined;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** A charts config from untrusted input (`restoreCharts`, `restoreState`): known keys only. */
export function sanitizeGridChartsState(input: unknown): GridChartsState {
  if (!isRecord(input)) return {};
  const out: GridChartsState = {};
  if (isRecord(input["model"])) out.model = sanitizeGridChartModel(input["model"]);
  if (isRecord(input["charts"])) out.charts = sanitizeGridChartModels(input["charts"]);
  if (typeof input["activeChartId"] === "string") out.activeChartId = input["activeChartId"];
  return out;
}

/** The charts' JSON config from the owner's models (a deep copy: plain JSON values only). */
export function gridChartsState(
  model: GridChartModel,
  models: GridChartModels,
  activeChartId: string | null,
): GridChartsState {
  const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
  return {
    model: copy(model),
    ...(Object.keys(models).length ? { charts: copy(models) } : {}),
    ...(activeChartId ? { activeChartId } : {}),
  };
}
