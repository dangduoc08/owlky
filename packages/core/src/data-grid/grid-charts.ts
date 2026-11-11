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

/* ------------------------------------------------------------------ the range on the grid */

/** A charted cell's part: the categories, or a series. */
export type GridChartRangeKind = "category" | "series";

/** The outline of a range chart's cells on the page (4.18.89, AG Grid's chart range). */
export interface GridChartRangeMarks {
  /** By row id, then field: the cell's kind and its outline edges (`top right bottom left`). */
  cells: Record<string, Record<string, { kind: GridChartRangeKind; edges: string }>>;
  /** The cell that holds the resize handle: the last row's last series cell. */
  handle: { id: string; field: string } | null;
}

/**
 * The cells a range chart draws, among the page's shown rows and fields (in order): its rows ×
 * its dimension (categories) and values (series). Edges follow the neighbours in the page, so a
 * range split by sorting or filtering draws one outline per block.
 */
export function gridChartRangeMarks(
  model: GridChartModel,
  rowIds: readonly string[],
  fields: readonly string[],
): GridChartRangeMarks {
  const cells: GridChartRangeMarks["cells"] = {};
  if (!isGridRangeChart(model)) return { cells, handle: null };
  const rows = new Set(model.rows);
  const charted = new Set([...(model.dimension ? [model.dimension] : []), ...(model.values ?? [])]);
  const at = (row: number, col: number) =>
    rows.has(rowIds[row] as string) && charted.has(fields[col] as string);
  let handle: GridChartRangeMarks["handle"] = null;
  rowIds.forEach((id, r) => {
    fields.forEach((field, c) => {
      if (!at(r, c)) return;
      const edges = [
        !at(r - 1, c) && "top",
        !at(r, c + 1) && "right",
        !at(r + 1, c) && "bottom",
        !at(r, c - 1) && "left",
      ].filter(Boolean);
      const kind: GridChartRangeKind = field === model.dimension ? "category" : "series";
      const own = cells[id] ?? {};
      own[field] = { kind, edges: edges.join(" ") };
      cells[id] = own;
      if (kind === "series") handle = { id, field };
    });
  });
  return { cells, handle };
}

/**
 * A range chart resized to a cell (its handle dragged there, AG Grid): the rows from the range's
 * first row to the target's (`rowIds`: every row that passes the filters, in order), and the number
 * columns from its first value to the target's column (`columns`: the shown ones, in order). The
 * first row and the first value always stay; other keys of the model are kept.
 */
export function gridResizeChartRange(
  model: GridChartModel,
  rowIds: readonly string[],
  columns: readonly GridColumn[],
  target: { id: string; field: string },
): GridChartModel {
  if (!isGridRangeChart(model)) return model;
  const rows = new Set(model.rows);
  const first = rowIds.findIndex((id) => rows.has(id));
  const to = rowIds.indexOf(target.id);
  const nextRows =
    first < 0 || to < 0
      ? [...(model.rows ?? [])]
      : rowIds.slice(Math.min(first, to), Math.max(first, to) + 1);
  const fields = columns.map((c) => c.field);
  const start = fields.indexOf(model.values?.[0] ?? "");
  const end = fields.indexOf(target.field);
  const values =
    start < 0
      ? [...(model.values ?? [])]
      : columns
          .slice(start, Math.max(start, end) + 1)
          .filter((c) => c.type === "number" && c.field !== model.dimension)
          .map((c) => c.field);
  return { ...model, rows: nextRows, values };
}

export interface GridChartRangeHandleOptions {
  /** A drag of the handle starts (keep the model to restore on Escape). */
  onStart(): void;
  /** The pointer is over another body cell. */
  onMove(target: { id: string; field: string }): void;
  /** The drag ended (`cancelled`: Escape, the owner restores the model). */
  onEnd(cancelled: boolean): void;
}

/**
 * Drags of a range chart's handle (`[data-ok-data-grid-chart-handle]`): reports the body cell
 * under the pointer while dragging, the end, and Escape. Keyboard path: Alt + Shift + F1 (the cell
 * selection controller's `onRangeChartUpdate`).
 */
export function createGridChartRangeHandle(
  grid: HTMLElement,
  options: GridChartRangeHandleOptions,
): { destroy(): void } {
  const abort = new AbortController();
  const { signal } = abort;
  const doc = grid.ownerDocument;
  const cellSelector = '[data-ok-data-grid-body] :is([role="gridcell"], [role="rowheader"])';
  grid.addEventListener(
    "pointerdown",
    (event) => {
      const handle = (event.target as Element).closest("[data-ok-data-grid-chart-handle]");
      if (!handle || event.button !== 0) return;
      event.preventDefault();
      options.onStart();
      let last = "";
      const drag = new AbortController();
      const end = (cancelled: boolean) => {
        drag.abort();
        options.onEnd(cancelled);
      };
      doc.addEventListener(
        "pointermove",
        (move) => {
          const cell = doc.elementFromPoint(move.clientX, move.clientY)?.closest(cellSelector);
          const row = cell?.closest('[role="row"][data-ok-row-id]');
          const field = cell?.getAttribute("data-ok-field");
          if (!cell || !row || !field || !grid.contains(cell)) return;
          const id = row.getAttribute("data-ok-row-id") as string;
          if (`${id}\u0000${field}` === last) return;
          last = `${id}\u0000${field}`;
          options.onMove({ id, field });
        },
        { signal: drag.signal },
      );
      doc.addEventListener("pointerup", () => end(false), { signal: drag.signal });
      doc.addEventListener(
        "keydown",
        (key) => {
          if (key.key !== "Escape") return;
          key.preventDefault();
          end(true);
        },
        { signal: drag.signal },
      );
      signal.addEventListener("abort", () => drag.abort());
    },
    { signal },
  );
  return {
    destroy() {
      abort.abort();
    },
  };
}

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
