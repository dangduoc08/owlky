import {
  arrangeGridColumns,
  chartAttributes,
  chartOptions,
  chartTextAttributes,
  clampGridWidth,
  createGridCellSelection,
  createGridClipboard,
  createGridColumnControls,
  createGridDataSourceCache,
  createGridHistoryKeys,
  createGridHistoryStack,
  createGridNavigation,
  createGridPivotDrag,
  createGridRowReorder,
  createGridScrollWatcher,
  dataGridOptions,
  filterGridRows,
  GRID_AGGREGATION_ROOT_ID,
  GRID_CHECKBOX_FIELD,
  GRID_CHECKBOX_WIDTH,
  GRID_GROUPING_FIELD,
  GRID_SORTING_ORDER,
  GRID_TREE_FIELD,
  GRID_XLSX_TYPE,
  type GridAggregationModel,
  type GridCellModesModel,
  type GridCellSelectionModel,
  type GridChartModel,
  type GridChartModels,
  type GridChartType,
  type GridColumn,
  type GridColumnGroup,
  type GridColumnType,
  type GridColumnVisibilityModel,
  type GridColumnWidths,
  type GridComparators,
  type GridCsvOptions,
  type GridDataSource,
  type GridDensity,
  type GridEditStartReason,
  type GridEditTarget,
  type GridExcelOptions,
  type GridFilterModel,
  type GridFilterOperator,
  type GridFormat,
  type GridGetRowsResponse,
  type GridGroupNode,
  type GridHistoryApi,
  type GridHistoryChange,
  type GridLabels,
  type GridPinnedColumns,
  type GridPivotColumn,
  type GridPivotModel,
  type GridPivotResult,
  type GridPivotSection,
  type GridPrintLayout,
  type GridRowModesModel,
  type GridRowWindow,
  type GridSortDirection,
  type GridSortModel,
  type GridState,
  type GridViewport,
  gridActiveChartId,
  gridAggregate,
  gridAggregationFunctionsFor,
  gridAggregationPositionOf,
  gridAlign,
  gridAriaSort,
  gridCanMoveColumn,
  gridCellEdges,
  gridCellRange,
  gridChartData,
  gridChartFields,
  gridChartOptions,
  gridColumnTemplate,
  gridColumnTypes,
  gridColumnWindow,
  gridDefaultLabels,
  gridDensities,
  gridDensityFactor,
  gridDirectedComparator,
  gridEditInputType,
  gridEditModes,
  gridEditTarget,
  gridEditText,
  gridExpandedByDepth,
  gridExportColumns,
  gridFilterOperators,
  gridFooterRowCount,
  gridFooterRowSelected,
  gridFormats,
  gridFormatValue,
  gridGroupComparator,
  gridGroupFooterId,
  gridGroupingField,
  gridGroupingKey,
  gridGroupPaths,
  gridGroupRows,
  gridGroupsById,
  gridHeaderAlign,
  gridHistoryRow,
  gridMissingRanges,
  gridOperatorNeedsValue,
  gridPinSide,
  gridPivot,
  gridPivotDerivedColumns,
  gridPivotRole,
  gridPivotSections,
  gridQuickFilterValues,
  gridRowGroups,
  gridRowOffsets,
  gridRowSpans,
  gridRowWindow,
  gridRowWindowOf,
  gridSelectAllState,
  gridSelectedBlock,
  gridSelectionStats,
  gridStackableChartTypes,
  gridStatusItems,
  gridToCsv,
  gridToTsv,
  gridToXlsx,
  gridTreeRows,
  gridWithGroupFooters,
  isGridCellSelected,
  isGridGroupingField,
  isGridResizable,
  isGridSortable,
  measureGridColumn,
  mergeGridCellSelection,
  moveGridColumn,
  moveGridPivotField,
  moveGridRow,
  nextGridSort,
  orderGridColumns,
  parseGridAggregationModel,
  parseGridAggregationPositions,
  parseGridClipboard,
  parseGridEditValue,
  parseGridExcelOptions,
  parseGridExportOptions,
  parseGridFormatOptions,
  parseGridSortingOrder,
  pick,
  pinGridColumn,
  prepareGridPrint,
  printGridContent,
  pruneGridSelection,
  readNumber,
  readStyle,
  renderChart,
  sanitizeGridCellModes,
  sanitizeGridCellSelection,
  sanitizeGridChartModel,
  sanitizeGridChartModels,
  sanitizeGridPivotModel,
  sanitizeGridRowModes,
  sanitizeGridState,
  selectGridRow,
  setGridPivotRole,
  sortGridRows,
  syncGridPinning,
  toggleGridCell,
  toggleGridRows,
  visibleGridColumns,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";
import type { AutocompleteInstance } from "../autocomplete/autocomplete.js";
import type { ChartInstance } from "../chart/chart.js";
import type { DatePickerInstance } from "../date-picker/date-picker.js";
import type { PopoverInstance } from "../popover/popover.js";
import type { TablePaginationInstance } from "../table-pagination/table-pagination.js";

/** Events whose detail is `{ model }` (the model about to be set). */
type GridModelEvent =
  | "sort"
  | "filter"
  | "selection"
  | "columns"
  | "density"
  | "order"
  | "pinned"
  | "rowgrouping"
  | "aggregation"
  | "cellselection"
  | "chart";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface DataGridEvents {
  /** Before the sort model changes. Call `preventDefault()` to keep it. */
  sort: EventSpec<{ model: GridSortModel }, true>;
  /** Before the filter model changes. Call `preventDefault()` to keep it. */
  filter: EventSpec<{ model: GridFilterModel }, true>;
  /** Before the row selection changes (row ids). Call `preventDefault()` to keep it. */
  selection: EventSpec<{ model: string[] }, true>;
  /** Before the column visibility changes. Call `preventDefault()` to keep it. */
  columns: EventSpec<{ model: Record<string, boolean> }, true>;
  /** Before the density changes. Call `preventDefault()` to keep it. */
  density: EventSpec<{ model: GridDensity }, true>;
  /** Before the column order changes (fields). Call `preventDefault()` to keep it. */
  order: EventSpec<{ model: string[] }, true>;
  /** Before the pinned columns change. Call `preventDefault()` to keep them. */
  pinned: EventSpec<{ model: GridPinnedColumns }, true>;
  /** Before the row grouping changes (fields). Call `preventDefault()` to keep it. */
  rowgrouping: EventSpec<{ model: string[] }, true>;
  /** Before the aggregation changes (field to function). Call `preventDefault()` to keep it. */
  aggregation: EventSpec<{ model: Record<string, string> }, true>;
  /** Before the cell selection changes. Call `preventDefault()` to keep it. */
  cellselection: EventSpec<{ model: GridCellSelectionModel }, true>;
  /** Before the chart panel's model changes. Call `preventDefault()` to keep it. */
  /** Before a chart's model changes (`id`: which chart, with several). Call `preventDefault()` to keep it. */
  chart: EventSpec<{ model: GridChartModel; id?: string | undefined }, true>;
  /** Before the chart panel switches to another chart. Call `preventDefault()` to stay. */
  activechart: EventSpec<{ id: string }, true>;
  /** Before the pivot model or mode changes. Call `preventDefault()` to keep it. */
  pivot: EventSpec<{ model: GridPivotModel; active: boolean }, true>;
  /** After a column was resized, in pixels. */
  resize: EventSpec<{ field: string; width: number | undefined }>;
  /** Before an edited row is saved (`row`: the edited fields). Call `preventDefault()` to discard the edit. */
  edit: EventSpec<{ id: string; row: Record<string, unknown> }, true>;
  /** After editing started (`field` in cell mode). */
  editstart: EventSpec<{ id: string; field?: string; reason: string }>;
  /** After editing stopped. */
  editstop: EventSpec<{ id: string; field?: string; reason: string }>;
  /** After Ctrl / Cmd + Z (or `history.undo()`) restored rows, with their ids. */
  undo: EventSpec<{ ids: string[] }>;
  /** After a redo changed rows again, with their ids. */
  redo: EventSpec<{ ids: string[] }>;
  /** Before a cell starts or stops editing (cell mode), with the next cell modes model. Call `preventDefault()` to refuse. */
  cellmodes: EventSpec<{ model: GridCellModesModel }, true>;
  /** Before a row starts or stops editing (row mode), with the next row modes model. Call `preventDefault()` to refuse. */
  rowmodes: EventSpec<{ model: GridRowModesModel }, true>;
  /** While a cell is edited: set `detail.error` to `true` or a message to mark the value invalid. */
  validate: EventSpec<{ id: string; field: string; value: unknown; error?: string | boolean }>;
  /** After the rows were scrolled to the end (load more rows here). */
  scrollend: EventSpec<{ visibleRowsCount: number }>;
  /** After the data source failed to load rows. */
  datasourceerror: EventSpec<{ error: unknown }>;
  /** Before a tree row expands or collapses. Call `preventDefault()` to refuse. */
  expand: EventSpec<{ id: string; expanded: boolean }, true>;
  /** Before a row's detail panel opens or closes. Call `preventDefault()` to refuse. */
  detailpanel: EventSpec<{ id: string; expanded: boolean }, true>;
  /** Before a dragged row moves to `targetIndex`. Call `preventDefault()` to keep the order. */
  roworder: EventSpec<{ id: string; oldIndex: number; targetIndex: number }, true>;
  /** After cells were copied, with the copied text. */
  clipboardcopy: EventSpec<{ data: string }>;
  /** Before pasted cells are written. Call `preventDefault()` to refuse them. */
  clipboardpaste: EventSpec<{ data: string[][] }, true>;
  /** After a click on a row. */
  rowclick: EventSpec<{ id: string }>;
  /** After a double click on a row. */
  rowdoubleclick: EventSpec<{ id: string }>;
  /** After a click on a cell, with its raw value. */
  cellclick: EventSpec<{ id: string; field: string; value: unknown }>;
  /** After a double click on a cell. */
  celldoubleclick: EventSpec<{ id: string; field: string; value: unknown }>;
  /** After a click on a column header. */
  columnheaderclick: EventSpec<{ field: string }>;
}

export interface DataGridInstance extends ComponentInstance {
  /** The sort model. */
  readonly sortModel: GridSortModel;
  /** The filter model. */
  readonly filterModel: GridFilterModel;
  /** Selected row ids. */
  readonly selection: string[];
  /** Which columns are visible (field to `false` hides it). */
  readonly columnVisibilityModel: GridColumnVisibilityModel;
  /** The fields in their display order. */
  readonly columnOrder: string[];
  /** The columns pinned to the start and the end. */
  readonly pinnedColumns: GridPinnedColumns;
  /** The width of each resized column, in pixels. */
  readonly columnWidths: GridColumnWidths;
  /** These setters don't emit events. */
  setColumnOrder(fields: readonly string[]): void;
  /** Pins columns to the start and the end. */
  setPinnedColumns(model: GridPinnedColumns): void;
  /** Sets a column's width, in pixels. */
  setColumnWidth(field: string, width: number): void;
  /** Sorts the rows (no event). */
  setSortModel(model: GridSortModel): void;
  /** Filters the rows (no event). */
  setFilterModel(model: GridFilterModel): void;
  /** Selects these rows (no event). */
  setSelection(ids: readonly string[]): void;
  /** Shows or hides columns (no event). */
  setColumnVisibilityModel(model: GridColumnVisibilityModel): void;
  /** The CSV of the filtered, sorted rows and shown columns (or the columns of `options`). */
  toCsv(options?: GridCsvOptions): string;
  /** Downloads the CSV (`options.fileName`, else `data-ok-export-file-name`, default "data"). */
  exportCsv(options?: GridCsvOptions): void;
  /** Prints every filtered row (toolbar and footer left out unless asked). */
  print(options?: GridPrintOptions): void;
  /** Fits columns to their content (default: every resizable shown column). */
  autosizeColumns(options?: { columns?: readonly string[]; includeHeaders?: boolean }): void;
  /** Scrolls a row (index on the current page) and / or a column (shown index) into view. */
  scrollToIndexes(indexes: { rowIndex?: number; colIndex?: number }): void;
  /** Returns the grid's state (models, column widths), for `restoreState`. */
  exportState(): GridState;
  /** Applies a saved state (unknown keys and values are dropped). */
  restoreState(state: unknown): void;
  /** Operators of a column's filter (they replace the type's operators). */
  setFilterOperators(field: string, operators: readonly GridFilterOperator<HTMLElement>[]): void;
  /**
   * A column's own sorting (MUI X `sortComparator` / `getSortComparator`), given the cells' values
   * (`data-ok-value`, else the text) and rows. `null`: back to sorting by the column type.
   */
  setSortComparator(field: string, comparators: GridComparators<HTMLElement> | null): void;
  /** The cell being edited (cell mode), as a cell modes model. */
  readonly cellModesModel: GridCellModesModel;
  /** The row being edited (row mode), as a row modes model. */
  readonly rowModesModel: GridRowModesModel;
  /**
   * Starts or stops editing a cell (cell mode; no events): the first `edit` entry opens, a cell
   * left out (or `view`) closes, saving unless `ignoreModifications`.
   */
  setCellModesModel(model: GridCellModesModel): void;
  /** Starts or stops editing a row (row mode; no events), like `setCellModesModel`. */
  setRowModesModel(model: GridRowModesModel): void;
  /** Undo and redo of edits and pastes (MUI X `apiRef.current.history`), without the keys. */
  readonly history: GridHistoryApi;
  /** Sets the value of a field being edited, such as from a custom editor's widget. */
  setEditCellValue(params: { id: string; field: string; value: unknown }): void;
  /** The text of a column's values in `setRows` and after editing (`null`: back to the default). */
  setValueFormatter(field: string, format: ((value: unknown) => string) | null): void;
  /**
   * The value a column's rows are grouped by (MUI X `groupingValueGetter`), from the cell's value
   * (`data-ok-value`, else its text); `null`: back to `data-ok-grouping-value`, else the text.
   */
  setGroupingValueGetter(
    field: string,
    getter:
      | ((value: unknown, row: HTMLElement) => string | number | Date | null | undefined)
      | null,
  ): void;
  /** Tree data: opens or closes a row's children. */
  setRowChildrenExpansion(id: string, expanded: boolean): void;
  /** Master-detail: opens or closes a row's detail panel. */
  toggleDetailPanel(id: string): void;
  /** Labels of the text the runtime writes (a locale pack, such as `viVN`). */
  setLocaleText(labels: Partial<GridLabels>): void;
  /**
   * Replaces the rows with data: each row is a copy of `<template data-ok-data-grid-row>`, its
   * cells filled as text (or from `<template data-ok-data-grid-cell="<field>">`, whose
   * `[data-ok-data-grid-value]` elements get the value). Needs `id` on each row.
   */
  setRows(rows: readonly DataRow[]): void;
  /** Loads the rows from a server for the current sort, filter and page (`null`: stop). */
  setDataSource(source: GridDataSource<DataRow> | null): void;
  /** Phase 6 (MUI X Premium). These setters don't emit events. */
  readonly rowGroupingModel: string[];
  /** The aggregation (field to function). */
  readonly aggregationModel: GridAggregationModel;
  /** The pivot model. */
  readonly pivotModel: GridPivotModel;
  /** Whether pivot mode is on. */
  readonly pivotActive: boolean;
  /** The selected cells. */
  readonly cellSelectionModel: GridCellSelectionModel;
  /** The chart panel's model (several charts: the active chart's). */
  readonly chartModel: GridChartModel;
  /** Several charts: every chart's model, by chart id (`data-ok-chart-models`). */
  readonly chartModels: GridChartModels;
  /** Several charts: the chart the panel edits (`data-ok-active-chart-id`). */
  readonly activeChartId: string | null;
  /** Several charts: sets every chart's model (no events). */
  setChartModels(models: GridChartModels): void;
  /** Several charts: the chart the panel edits (no events). */
  setActiveChartId(id: string): void;
  /** Groups the rows by these fields. */
  setRowGroupingModel(model: readonly string[]): void;
  /** Sets the aggregation. */
  setAggregationModel(model: GridAggregationModel): void;
  /** Sets the pivot model. */
  setPivotModel(model: GridPivotModel): void;
  /** Turns pivot mode on or off. */
  setPivotActive(active: boolean): void;
  /**
   * Pivot fields derived from a column (MUI X `getPivotDerivedColumns`), from the source cell's
   * value. Default: the year and quarter of `date` columns; `null`: none. The panel lists the
   * fields its markup has.
   */
  setPivotDerivedColumns(
    getter: ((column: GridColumn) => GridPivotDerivedField[] | undefined) | null,
  ): void;
  /** Selects these cells. */
  setCellSelectionModel(model: GridCellSelectionModel): void;
  /** Sets the chart panel's model. */
  setChartModel(model: GridChartModel): void;
  /** The .xlsx file of the filtered, sorted rows (bytes). */
  toExcel(options?: GridExcelOptions): Uint8Array;
  /** Downloads it (`options.fileName`, else `data-ok-export-file-name`, default "data"). */
  exportExcel(options?: GridExcelOptions): void;
}

const {
  density: densityOption,
  disableRowSelectionOnClick,
  disableMultipleColumnsSorting,
  disableColumnMenu,
  disableColumnResize,
  disableColumnReorder,
  disableColumnPinning,
  disableMultipleColumnsFiltering,
  editMode,
  disableVirtualization,
  sortingMode,
  filterMode,
  paginationMode,
  rowCount: rowCountOption,
  loading: loadingOption,
  scrollEndThreshold,
  disableMultipleRowSelection,
  keepNonExistentRowsSelected,
  checkboxSelectionVisibleOnly,
  autosizeOnMount,
  rowSpanning,
  rowHeight: rowHeightOption,
  treeData,
  defaultGroupingExpansionDepth,
  rowReordering,
  listView,
  rowBufferPx,
  columnBufferPx,
  lazyLoading,
  lazyLoadingRequestThrottleMs,
  quickFilterLogicOperator,
  quickFilterExcludeHiddenColumns,
  ignoreDiacritics,
  disableRowGrouping,
  rowGroupingColumnMode,
  disableAggregation,
  aggregationRowsScope,
  disablePivoting,
  pivotActive: pivotActiveOption,
  cellSelection: cellSelectionOption,
  disableClipboardPaste,
  multipleColumnsSortingMode,
  statusBar: statusBarOption,
  historyStackSize,
  hideFooterPagination,
  hideFooterRowCount,
  hideFooterSelectedRowCount,
} = dataGridOptions.options;

type DataRow = Record<string, unknown>;

/** A derived pivot field of the HTML grid: its value from the source cell's value. */
export interface GridPivotDerivedField extends GridColumn {
  valueGetter(value: unknown, row: HTMLElement): unknown;
  /** Its text (default: the value as text). */
  valueFormatter?: ((value: unknown) => string) | undefined;
}

export interface GridPrintOptions extends GridPrintLayout {
  /** Fields to print (default: the shown columns). */
  fields?: readonly string[] | undefined;
  /** Hidden columns too. */
  allColumns?: boolean | undefined;
  /** The document title (default: the grid's label). */
  fileName?: string | undefined;
}
const ROW = '[role="row"][data-ok-row-id]';
const REORDER_FIELD = "__reorder__";
const DETAIL_FIELD = "__detail_panel_toggle__";
/** Columns the grid adds before the others, with their widths (px). */
const SPECIALS: Record<string, number> = {
  [REORDER_FIELD]: 50,
  [GRID_CHECKBOX_FIELD]: GRID_CHECKBOX_WIDTH,
  [DETAIL_FIELD]: 50,
  [GRID_TREE_FIELD]: 200,
  [GRID_GROUPING_FIELD]: 200,
};
/** Columns the grid adds: the specials, and the grouping columns of each grouped field. */
const isSpecial = (field: string) => field in SPECIALS || isGridGroupingField(field);
const LAZY_CHUNK = 50;
const INTERACTIVE = "button, a, input, label, select, textarea";

/** `["a","b"]` → the strings; anything else → none (attribute input is untrusted). */
const stringList = (json: string | null): string[] | undefined => {
  try {
    const parsed: unknown = JSON.parse(json ?? "null");
    return Array.isArray(parsed)
      ? parsed.filter((v): v is string => typeof v === "string")
      : undefined;
  } catch {
    return undefined;
  }
};

const numberAttr = (element: Element, name: string) => {
  const value = Number(element.getAttribute(name));
  return element.hasAttribute(name) && Number.isFinite(value) && value > 0 ? value : undefined;
};

/** The download, through a Blob link revoked right after. */
function download(name: string, data: BlobPart, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

const SVG = "http://www.w3.org/2000/svg";
/** A decorative 24px icon (the React components' paths). */
const icon = (d: string) => {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("fill", "currentColor");
  const path = document.createElementNS(SVG, "path");
  path.setAttribute("d", d);
  svg.append(path);
  return svg;
};
const CHEVRON = "M9 6l6 6-6 6-1.4-1.4 4.6-4.6-4.6-4.6z";
const SORT_ARROW = "M12 4l-6 6h4v10h4V10h4z";
/** A JSON list of strings from an attribute (untrusted). */
const fieldList = (json: string | null): string[] =>
  (stringList(json) ?? []).filter((f) => !["__proto__", "constructor", "prototype"].includes(f));
const parseJson = (json: string | null): unknown => {
  try {
    return JSON.parse(json ?? "null");
  } catch {
    return null;
  }
};

/**
 * DataGrid — spec: specs/components/data-grid.md (ADR-0020, phase 1)
 *
 * Markup:  the React DataGrid's markup (see the snippets): toolbar, `div[role=grid]` with header
 *          cells (`data-ok-field`, `data-ok-type`, `aria-sort`, widths) and body rows
 *          (`data-ok-row-id`) whose cells may hold their raw value in `data-ok-value` and their
 *          text in `data-ok-text`; a TablePagination in the footer.
 * Behavior: sorts by moving rows, filters (panel + quick filter) and pages with `hidden`, selects
 *          rows, hides columns, sets the density and exports CSV, all with core's grid engine;
 *          keyboard navigation through core `createGridNavigation`.
 * Events:  ok:data-grid:sort | filter | selection | columns | density (cancelable, the new model in
 *          `detail.model`).
 */
export const dataGrid = defineComponent<DataGridInstance, DataGridEvents>({
  name: "data-grid",
  selector: "[data-ok-data-grid]",

  setup(element, { emit, signal, runtime }) {
    // grid, or treegrid with tree data.
    const main = element.querySelector<HTMLElement>("[data-ok-data-grid-main]") as HTMLElement;
    const body = main.querySelector<HTMLElement>("[data-ok-data-grid-body]") as HTMLElement;
    const headerGroup = main.querySelector<HTMLElement>(
      "[data-ok-data-grid-header]",
    ) as HTMLElement;
    // The column headers' row comes after the column group rows.
    const headerRow = headerGroup.querySelector<HTMLElement>(
      ':scope > [role="row"]:not([data-ok-data-grid-group-row])',
    ) as HTMLElement;
    const pinnedRowEls = () => [
      ...main.querySelectorAll<HTMLElement>('[data-ok-data-grid-pinned-rows] > [role="row"]'),
    ];
    const pinnedTop = () =>
      main.querySelectorAll('[data-ok-data-grid-pinned-rows="top"] > [role="row"]').length;
    const groupRowEls = () => [
      ...headerGroup.querySelectorAll<HTMLElement>(":scope > [data-ok-data-grid-group-row]"),
    ];
    const id = element.id;
    const byId = (suffix: string) => (id ? document.getElementById(`${id}-${suffix}`) : null);
    const checkbox = element.hasAttribute("data-ok-checkbox-selection");
    const readSpecials = () =>
      [...headerRow.querySelectorAll<HTMLElement>('[role="columnheader"][data-ok-field]')]
        .map((header) => header.getAttribute("data-ok-field") as string)
        .filter(isSpecial);
    let specialFields = readSpecials();
    const specialWidth = (field: string) =>
      numberAttr(
        headerRow.querySelector(`[data-ok-field="${CSS.escape(field)}"]`) as Element,
        "data-ok-width",
      ) ??
      SPECIALS[field] ??
      200;
    const headers = () =>
      [...headerRow.querySelectorAll<HTMLElement>('[role="columnheader"]')].filter(
        (header) => !isSpecial(header.getAttribute("data-ok-field") ?? ""),
      );
    const readColumns = (): GridColumn[] =>
      headers().map((header) => ({
        field: header.getAttribute("data-ok-field") as string,
        headerName: header.querySelector("[data-ok-data-grid-header-title]")?.textContent ?? "",
        type: pick(
          gridColumnTypes,
          header.getAttribute("data-ok-type"),
          "string",
        ) as GridColumnType,
        width: numberAttr(header, "data-ok-width"),
        minWidth: numberAttr(header, "data-ok-min-width"),
        flex: numberAttr(header, "data-ok-flex"),
        maxWidth: numberAttr(header, "data-ok-max-width"),
        searchable: header.getAttribute("data-ok-searchable") !== "false",
        sortable: header.hasAttribute("aria-sort"),
        hideable: header.getAttribute("data-ok-hideable") !== "false",
        filterable: header.getAttribute("data-ok-filterable") !== "false",
        resizable: header.getAttribute("data-ok-resizable") !== "false",
        editable: header.hasAttribute("data-ok-editable"),
        valueOptions: stringList(header.getAttribute("data-ok-value-options")),
        groupable: header.getAttribute("data-ok-groupable") !== "false",
        aggregable: header.getAttribute("data-ok-aggregable") !== "false",
        sortingOrder: parseGridSortingOrder(header.getAttribute("data-ok-sorting-order")),
      }));
    const baseColumns = readColumns();
    /** The columns: the markup's, or the pivot's while it shows. */
    let columns = baseColumns;
    // Text the runtime writes (setLocaleText), custom operators and value formatters.
    let labels: GridLabels = gridDefaultLabels;
    const operators: Record<string, readonly GridFilterOperator<HTMLElement>[]> = {};
    const formatters = new Map<string, (value: unknown) => string>();
    const comparators = new Map<string, GridComparators<HTMLElement>>();
    /** A column's own comparator for a direction (`setSortComparator`). */
    const comparatorOf = (field: string, direction: GridSortDirection) =>
      gridDirectedComparator(comparators.get(field), direction);
    /** A column's sort cycle: its `data-ok-sorting-order`, the root's, else asc → desc → none. */
    const sortCycle = (column: GridColumn) =>
      column.sortingOrder ??
      parseGridSortingOrder(element.getAttribute("data-ok-sorting-order")) ??
      GRID_SORTING_ORDER;
    /** A value as the column shows it: its formatter, its `data-ok-format`, or plain text. */
    const formatted = (field: string, raw: unknown) => {
      const own = formatters.get(field);
      if (own) return own(raw);
      const header = headerRow.querySelector(
        `[role="columnheader"][data-ok-field="${CSS.escape(field)}"]`,
      );
      const format = header?.getAttribute("data-ok-format");
      if (format && gridFormats.includes(format as GridFormat))
        return gridFormatValue(
          raw,
          format as GridFormat,
          parseGridFormatOptions(header?.getAttribute("data-ok-format-options") ?? null),
          document.documentElement.lang || undefined,
        );
      return raw === null || raw === undefined ? "" : String(raw);
    };
    // Column groups: each column's group chain (from the markup) and the groups' cells.
    let groupPaths = new Map<string, string[]>();
    for (const header of headers()) {
      const path = stringList(header.getAttribute("data-ok-group-path"));
      if (path?.length) groupPaths.set(header.getAttribute("data-ok-field") as string, path);
    }
    // Every row lives here; only the rows to show are in the page (pages, filters, the window).
    // Row groups are the runtime's: the markup's copies are built again from the rows.
    let rowEls = [...body.querySelectorAll<HTMLElement>(ROW)].filter((row) => {
      const generated =
        row.hasAttribute("data-ok-generated") && !element.hasAttribute(treeData.attr);
      if (generated) row.remove();
      return !generated;
    });
    const rows = () => rowEls;
    const cellOf = (row: HTMLElement, field: string) =>
      row.querySelector<HTMLElement>(`[role="gridcell"][data-ok-field="${CSS.escape(field)}"]`);
    const cellText = (row: HTMLElement, field: string) => {
      const cell = cellOf(row, field);
      return cell ? (cell.getAttribute("data-ok-text") ?? (cell.textContent as string).trim()) : "";
    };
    const cellValue = (row: HTMLElement, field: string) => {
      const cell = cellOf(row, field);
      return cell?.hasAttribute("data-ok-value")
        ? cell.getAttribute("data-ok-value")
        : cellText(row, field);
    };
    // Pivot columns aren't cells: the pivot gives their values (and text) from the rows.
    let pivot: GridPivotResult<HTMLElement> | null = null;
    const value = (row: HTMLElement, field: string) =>
      pivot && !baseColumns.some((c) => c.field === field)
        ? pivot.value(row, field)
        : cellValue(row, field);
    // Texts are the cells' (filters and search run on the data, also in the pivot).
    const text = cellText;
    const idOf = (row: HTMLElement) => row.getAttribute("data-ok-row-id") as string;
    const multiple = () => !element.hasAttribute(disableMultipleRowSelection.attr);
    const selectable = (row: HTMLElement) =>
      row.getAttribute("data-ok-selectable") !== "false" && !row.hasAttribute("data-ok-generated");
    /** Rows "select all" covers: selectable, filtered (or on this page only). */
    const allRows = () =>
      (element.hasAttribute(checkboxSelectionVisibleOnly.attr) ? pageList : filtered).filter(
        selectable,
      );
    const toggle = (row: HTMLElement) => {
      if (selectable(row)) select(selectGridRow(selection, idOf(row), multiple()));
    };
    const filterOptions = () => ({
      ignoreDiacritics: element.hasAttribute(ignoreDiacritics.attr),
      quickFilterLogicOperator: readStyle(element, quickFilterLogicOperator) as "and" | "or",
      quickFilterColumns: element.hasAttribute(quickFilterExcludeHiddenColumns.attr)
        ? visibleGridColumns(columns, visibility)
        : columns,
      operators,
    });

    let sortModel: GridSortModel = headers()
      .filter(
        (h) =>
          h.getAttribute("aria-sort") === "ascending" ||
          h.getAttribute("aria-sort") === "descending",
      )
      .map((h) => ({
        field: h.getAttribute("data-ok-field") as string,
        sort: h.getAttribute("aria-sort") === "ascending" ? "asc" : "desc",
      }));
    let filterModel: GridFilterModel = { items: [] };
    let selection = rows()
      .filter((r) => r.getAttribute("aria-selected") === "true")
      .map(idOf);
    let visibility: GridColumnVisibilityModel = {};
    for (const header of headers())
      if (header.hidden) visibility[header.getAttribute("data-ok-field") as string] = false;
    let order = columns.map((c) => c.field);
    const pinnedOf = (side: string) =>
      headers()
        .filter((h) => h.getAttribute("data-ok-pinned") === side)
        .map((h) => h.getAttribute("data-ok-field") as string);
    let pinned: GridPinnedColumns = { left: pinnedOf("left"), right: pinnedOf("right") };
    let widths: GridColumnWidths = {};
    let page = 0;
    let filtered: HTMLElement[] = [];
    let written: string[] = [];

    // Phase 6 (MUI X Premium): models from the markup (JSON attributes, untrusted).
    let rowGrouping = fieldList(element.getAttribute("data-ok-row-grouping-model"));
    let aggregationModel = parseGridAggregationModel(
      element.getAttribute("data-ok-aggregation-model"),
    );
    let pivotModel = sanitizeGridPivotModel(parseJson(element.getAttribute("data-ok-pivot-model")));
    let cellModel: GridCellSelectionModel = {};
    let chartModel = sanitizeGridChartModel(parseJson(element.getAttribute("data-ok-chart-model")));
    // Several charts (MUI X): one model per chart id; the panel edits the active one.
    let chartModels = sanitizeGridChartModels(
      parseJson(element.getAttribute("data-ok-chart-models")),
    );
    let activeChart = gridActiveChartId(
      chartModels,
      element.getAttribute("data-ok-active-chart-id"),
    );
    const panelModel = () => (activeChart ? (chartModels[activeChart] ?? {}) : chartModel);
    const labelOf = (fn: string) =>
      labels[
        `aggregationFunctionLabel${fn.charAt(0).toUpperCase()}${fn.slice(1)}` as keyof GridLabels
      ] as string;
    const pivotOn = () =>
      element.hasAttribute(pivotActiveOption.attr) &&
      !element.hasAttribute(disablePivoting.attr) &&
      !element.hasAttribute(treeData.attr);
    /** Fields grouped by now (the pivot's rows while it shows). */
    const grouping = () =>
      pivot
        ? pivot.rowGroupingModel
        : element.hasAttribute(treeData.attr) || element.hasAttribute(disableRowGrouping.attr)
          ? []
          : rowGrouping.filter((f) => baseColumns.some((c) => c.field === f));
    /** The aggregation in use: valid functions of known columns only. */
    const activeAggregation = (): GridAggregationModel => {
      const model = pivot
        ? pivot.aggregationModel
        : element.hasAttribute(disableAggregation.attr)
          ? {}
          : aggregationModel;
      return Object.fromEntries(
        Object.entries(model).filter(([field, fn]) => {
          const column = columns.find((c) => c.field === field);
          return !!column && gridAggregationFunctionsFor(column).includes(fn);
        }),
      );
    };
    // Generated rows: one element per group, kept while its group exists (and its footer row).
    const groupEls = new Map<string, HTMLElement>();
    const footerEls = new Map<string, HTMLElement>();
    const groupNodes = new Map<string, GridGroupNode>();
    const aggregates = new Map<string, Record<string, unknown>>();
    const leafCounts = new Map<string, number>();
    const aggregateText = (field: string, raw: unknown) =>
      raw === null || raw === undefined
        ? ""
        : activeAggregation()[field] === "size"
          ? String(raw)
          : formatted(
              pivot
                ? (pivot.columns.find((c) => c.field === field) as GridPivotColumn).pivotValueField
                : field,
              raw,
            );
    const gridCell = (field: string) => {
      const cell = document.createElement("div");
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("data-ok-field", field);
      cell.tabIndex = -1;
      return cell;
    };
    /** A generated row's cells: the special columns, then every column (layout hides some). */
    const fillGroupRow = (row: HTMLElement) => {
      const cells = specialFields.map((field, i) => {
        const cell = gridCell(field);
        cell.setAttribute("aria-colindex", String(i + 1));
        return cell;
      });
      for (const column of columns) {
        const cell = gridCell(column.field);
        cell.setAttribute("data-ok-align", gridAlign(column));
        cells.push(cell);
      }
      row.replaceChildren(...cells);
      laidOut.delete(row);
    };
    /** The group column's content: toggle (or spacer), name and count. */
    const groupLabel = (
      cell: HTMLElement,
      key: string,
      count: number | null,
      open: boolean | null,
    ) => {
      // The same parts are updated in place: the toggle may hold the focus.
      const toggle = cell.querySelector(":scope > [data-ok-data-grid-tree-toggle]");
      const label = cell.querySelector(":scope > [data-ok-data-grid-tree-label]");
      const counter = cell.querySelector(":scope > [data-ok-data-grid-tree-count]");
      if (label && !!toggle === (open !== null) && !!counter === (count !== null)) {
        label.textContent = key;
        if (counter) counter.textContent = `(${count})`;
        return;
      }
      const parts: Node[] = [];
      if (open === null) {
        const spacer = document.createElement("span");
        spacer.setAttribute("data-ok-data-grid-tree-spacer", "");
        parts.push(spacer);
      } else {
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("data-ok-icon-button", "");
        button.setAttribute("data-ok-color", "default");
        button.setAttribute("data-ok-size", "sm");
        button.tabIndex = -1;
        button.setAttribute("data-ok-data-grid-tree-toggle", "");
        button.append(icon(CHEVRON));
        parts.push(button);
      }
      const name = document.createElement("span");
      name.setAttribute("data-ok-data-grid-tree-label", "");
      name.textContent = key;
      parts.push(name);
      if (count !== null) {
        const counter = document.createElement("span");
        counter.setAttribute("data-ok-data-grid-tree-count", "");
        counter.textContent = `(${count})`;
        parts.push(counter);
      }
      cell.replaceChildren(...parts);
    };
    const hideCount = (field: string) =>
      !!headerRow.querySelector(
        `:scope > [data-ok-field="${CSS.escape(field)}"][data-ok-hide-descendant-count]`,
      );
    /** The grouping columns now: one, or one per grouped field (`multiple`, client-side). */
    const groupingColumns = () => {
      const fields = grouping();
      if (!fields.length) return [];
      return !pivot && !serverGrouping() && readStyle(element, rowGroupingColumnMode) === "multiple"
        ? fields.map((field) => gridGroupingField(field))
        : [GRID_GROUPING_FIELD];
    };
    /** Derived pivot fields by field: their source column and getter (`syncDerived`). */
    const derived = new Map<string, { source: string; column: GridPivotDerivedField }>();
    const groupingGetters = new Map<
      string,
      (value: unknown, row: HTMLElement) => string | number | Date | null | undefined
    >();
    /** A row's group key: the column's getter, its `data-ok-grouping-value`, else its text. */
    const groupingKey = (row: HTMLElement, field: string) => {
      if (derived.has(field)) return pivotText(row, field);
      const getter = groupingGetters.get(field);
      if (getter) return gridGroupingKey(getter(cellValue(row, field), row));
      return cellOf(row, field)?.getAttribute("data-ok-grouping-value") ?? cellText(row, field);
    };
    const groupElFor = (node: GridGroupNode) => {
      let row = groupEls.get(node.id);
      if (!row) {
        row = document.createElement("div");
        row.setAttribute("role", "row");
        row.setAttribute("data-ok-row-id", node.id);
        row.setAttribute("data-ok-generated", "");
        groupEls.set(node.id, row);
        fillGroupRow(row);
      }
      groupNodes.set(node.id, node);
      return row;
    };
    /**
     * The grouping columns of every row (and the row template) while rows are grouped: one, or one
     * per grouped field. Headers of the markup are kept (their width, title and count option).
     */
    const syncGroupColumns = () => {
      const wanted = groupingColumns();
      const grouped = (row: HTMLElement) =>
        [...row.querySelectorAll<HTMLElement>(":scope > [data-ok-field]")].filter((cell) =>
          isGridGroupingField(cell.getAttribute("data-ok-field") as string),
        );
      const present = grouped(headerRow);
      if (present.map((h) => h.getAttribute("data-ok-field")).join() === wanted.join()) return;
      const templateRow = element.querySelector<HTMLTemplateElement>(
        "template[data-ok-data-grid-row]",
      )?.content.firstElementChild as HTMLElement | null | undefined;
      const targets = [...rowEls, ...pinnedRowEls(), ...(templateRow ? [templateRow] : [])];
      const kept = new Map(present.map((h) => [h.getAttribute("data-ok-field") as string, h]));
      for (const row of [headerRow, ...targets]) for (const cell of grouped(row)) cell.remove();
      if (!wanted.length)
        for (const row of rowEls)
          for (const attr of ["aria-level", "aria-posinset", "aria-setsize", "data-ok-parent"])
            row.removeAttribute(attr);
      const after = (row: HTMLElement) =>
        [...row.querySelectorAll<HTMLElement>(":scope > [data-ok-field]")]
          .filter((cell) => isSpecial(cell.getAttribute("data-ok-field") as string))
          .at(-1) ?? null;
      const place = (row: HTMLElement, cell: HTMLElement) => {
        const last = after(row);
        if (last) last.after(cell);
        else row.prepend(cell);
        cell.setAttribute(
          "aria-colindex",
          String(
            [...row.querySelectorAll(":scope > [data-ok-field]")].filter((c) =>
              isSpecial(c.getAttribute("data-ok-field") as string),
            ).length,
          ),
        );
      };
      for (const field of wanted) {
        let header = kept.get(field);
        if (!header) {
          header = document.createElement("div");
          header.setAttribute("role", "columnheader");
          header.setAttribute("data-ok-field", field);
          header.tabIndex = -1;
          header.setAttribute("data-ok-width", "200");
          const title = document.createElement("span");
          title.setAttribute("data-ok-data-grid-header-title", "");
          const own = field === GRID_GROUPING_FIELD ? null : grouping()[wanted.indexOf(field)];
          title.textContent = own
            ? (baseColumns.find((c) => c.field === own)?.headerName ?? own)
            : labels.treeDataGroupingHeaderName;
          header.append(title);
        }
        place(headerRow, header);
        for (const row of targets) place(row, gridCell(field));
      }
      specialFields = readSpecials();
      for (const row of groupEls.values()) fillGroupRow(row);
      main.setAttribute(
        "role",
        wanted.length > 0 || element.hasAttribute(treeData.attr) ? "treegrid" : "grid",
      );
      layout();
    };

    const pagination = element.querySelector<HTMLElement>(
      "[data-ok-data-grid-footer] [data-ok-table-pagination]",
    );
    pagination?.setAttribute("data-ok-count", String(rows().length));
    const pager = () =>
      pagination
        ? (runtime.getOrCreate<TablePaginationInstance>(
            pagination,
            "table-pagination",
          ) as TablePaginationInstance)
        : null;
    let pageSize = pager()?.rowsPerPage ?? Number.POSITIVE_INFINITY;
    /** Pages show (a pagination in the footer, not turned off). */
    const paging = () => !!pagination && !element.hasAttribute(hideFooterPagination.attr);
    // Footer counts (MUI X footer): "2 rows selected" first, "Total Rows: n" without pagination.
    // Built with DOM methods, in React's order, so the markup matches.
    const footer = element.querySelector<HTMLElement>("[data-ok-data-grid-footer]");
    const footerPart = (name: string, content: string | null, before: Node | null) => {
      let part = footer?.querySelector<HTMLElement>(`:scope > [${name}]`) ?? null;
      if (content === null) {
        part?.remove();
        return;
      }
      if (!footer) return;
      if (!part) {
        part = document.createElement("span");
        part.setAttribute(name, "");
        footer.insertBefore(part, before);
      }
      if (part.textContent !== content) part.textContent = content;
    };
    const syncFooter = () => {
      if (!footer) return;
      const noPages = element.hasAttribute(hideFooterPagination.attr);
      if (pagination) pagination.hidden = noPages;
      footerPart(
        "data-ok-data-grid-selected-row-count",
        !element.hasAttribute(hideFooterSelectedRowCount.attr) && selection.length > 0
          ? gridFooterRowSelected(labels, selection.length)
          : null,
        footer.firstChild,
      );
      const data = () => rows().filter((row) => !row.hasAttribute("data-ok-generated"));
      footerPart(
        "data-ok-data-grid-row-count",
        noPages && !element.hasAttribute(hideFooterRowCount.attr)
          ? gridFooterRowCount(
              labels,
              serverSide(filterMode)
                ? total
                : filterGridRows(data(), filterModel, columns, value, text, filterOptions()).length,
              serverSide(paginationMode) ? total : data().length,
            )
          : null,
        pagination?.parentElement === footer ? pagination : null,
      );
    };
    const overlay = element.querySelector<HTMLElement>(
      "[data-ok-data-grid-overlay]",
    ) as HTMLElement;

    const navigation = createGridNavigation(main, {
      onSort: (field, multi) => sortBy(field, multi),
      onColumnMenu: (field, header) =>
        openColumnMenu(field, header.querySelector("[data-ok-data-grid-menu-button]")),
      onToggleRow: (row) => toggle(row),
      onSelectAll: () => {
        // Cell selection: every cell of the page.
        if (cellsOn()) {
          const ids = pageIds();
          const fields = shownFields();
          if (ids.length)
            setCells(
              gridCellRange(
                ids,
                fields,
                { id: ids[0] as string, field: fields[0] as string },
                { id: ids.at(-1) as string, field: fields.at(-1) as string },
              ),
            );
          return;
        }
        if (checkbox && multiple()) select(toggleGridRows(selection, allRows().map(idOf)));
      },
      onToggleExpansion: (row, expanded) => toggleExpansion(row, expanded),
      onEdit: (cell, reason, key) =>
        startEdit(
          cell.closest<HTMLElement>(ROW) as HTMLElement,
          cell.getAttribute("data-ok-field") as string,
          reason,
          key,
        ),
      onResizeKey: (field, delta) =>
        resize(field, (headerOf(field) as HTMLElement).getBoundingClientRect().width + delta, true),
    });
    const headerOf = (field: string) =>
      headerRow.querySelector<HTMLElement>(
        `[role="columnheader"][data-ok-field="${CSS.escape(field)}"]`,
      );

    /** Per-row heights and spacing, and column spans, from attributes into CSSOM. */
    const styleRows = (list: readonly HTMLElement[] = rows()) => {
      for (const row of list) {
        const own = Number(row.getAttribute("data-ok-row-height"));
        if (own > 0) row.style.setProperty("--_ok-data-grid-row-height", `${own}px`);
        for (const side of ["top", "bottom"] as const)
          if (row.hasAttribute(`data-ok-spacing-${side}`))
            row.style.setProperty(`--_ok-data-grid-spacing-${side}`, `${spacingOf(row, side)}px`);
        for (const cell of row.querySelectorAll<HTMLElement>("[aria-colspan]"))
          cell.style.setProperty(
            "--_ok-data-grid-colspan",
            String(Number(cell.getAttribute("aria-colspan")) || 1),
          );
      }
    };
    /** Columns: order (cells moved), pinning, template, hidden cells, column indexes. */
    /** Column group rows: one cell per run of shown columns of a group (cells are reused). */
    const groupLayout = (shown: GridColumn[], offset: number) => {
      const groupRowsNow = groupRowEls();
      if (!groupRowsNow.length) return;
      const levels = gridGroupRows(
        shown.map((c) => c.field),
        groupPaths,
      );
      groupRowsNow.forEach((rowEl, level) => {
        const pool = [
          ...rowEl.querySelectorAll<HTMLElement>('[role="columnheader"][data-ok-group-id]'),
        ];
        const tips = new Map<HTMLElement, Element[]>();
        for (const cell of pool)
          tips.set(
            cell,
            (cell.getAttribute("aria-describedby") ?? "")
              .split(/\s+/)
              .flatMap((ref) =>
                ref
                  ? [...rowEl.querySelectorAll(`:scope > [role="tooltip"]#${CSS.escape(ref)}`)]
                  : [],
              ),
          );
        const used = new Set<HTMLElement>();
        const filler = () => {
          const div = document.createElement("div");
          div.setAttribute("role", "presentation");
          div.setAttribute("data-ok-data-grid-group-filler", "");
          return div;
        };
        const parts: Element[] = specialFields.map(filler);
        for (const cell of levels[level] ?? []) {
          if (cell.groupId === null) {
            parts.push(...cell.fields.map(filler));
            continue;
          }
          let el = pool.find(
            (c) => !used.has(c) && c.getAttribute("data-ok-group-id") === cell.groupId,
          );
          if (!el) {
            const model = pool.find((c) => c.getAttribute("data-ok-group-id") === cell.groupId);
            el = (model?.cloneNode(true) ?? document.createElement("div")) as HTMLElement;
            el.removeAttribute("aria-describedby");
          }
          used.add(el);
          el.setAttribute("aria-colindex", String(cell.start + offset));
          if (cell.span > 1) {
            el.setAttribute("aria-colspan", String(cell.span));
            el.style.setProperty("--_ok-data-grid-colspan", String(cell.span));
          } else {
            el.removeAttribute("aria-colspan");
            el.style.removeProperty("--_ok-data-grid-colspan");
          }
          const sides = cell.fields.map((f) => gridPinSide(pinned, f));
          const side = sides.every((x) => x === "left")
            ? "left"
            : sides.every((x) => x === "right")
              ? "right"
              : undefined;
          if (side) {
            el.setAttribute("data-ok-pinned", side);
            el.setAttribute(
              "data-ok-pin-field",
              (side === "left" ? cell.fields[0] : cell.fields.at(-1)) as string,
            );
          } else {
            el.removeAttribute("data-ok-pinned");
            el.removeAttribute("data-ok-pin-field");
          }
          parts.push(el, ...(tips.get(el) ?? []));
        }
        rowEl.replaceChildren(...parts);
      });
    };
    let shownNow: GridColumn[] = [];
    /** Cells hidden by list view (not by spans) and by the column window. */
    const listHidden = new WeakSet<HTMLElement>();
    const windowHidden = new WeakSet<HTMLElement>();
    const layout = () => {
      const arranged = arrangeGridColumns(orderGridColumns(columns, order), pinned);
      const shown = visibleGridColumns(arranged, visibility);
      shownNow = shown;
      const list = element.hasAttribute(listView.attr);
      written = syncCustomProperties(
        main,
        {
          "--_ok-data-grid-columns": [
            ...specialFields.map((f) => `${specialWidth(f)}px`),
            gridColumnTemplate(shown, false, widths),
          ]
            .filter(Boolean)
            .join(" "),
        },
        written,
      );
      main.setAttribute("aria-colcount", String(shown.length + specialFields.length));
      const offset = specialFields.length + 1;
      const leftPinned = shown.some((c) => gridPinSide(pinned, c.field) === "left");
      headerGroup.hidden = list;
      groupLayout(shown, offset);
      layoutState = { arranged, shown, offset, leftPinned, list };
      layoutVersion++;
      layoutFilterRow();
      // Rows out of the page are laid out when they're drawn (large and lazy grids).
      for (const row of [
        headerRow,
        ...pinnedRowEls(),
        ...[...body.children].filter((child): child is HTMLElement => child.matches(ROW)),
      ])
        layoutRow(row);
      for (const input of byId("columns")?.querySelectorAll<HTMLInputElement>(
        "input[data-ok-field]",
      ) ?? [])
        input.checked = visibility[input.getAttribute("data-ok-field") as string] !== false;
      windowColumns([...body.children].filter((child): child is HTMLElement => child.matches(ROW)));
      syncGridPinning(main);
    };
    let layoutState = {
      arranged: [] as GridColumn[],
      shown: [] as GridColumn[],
      offset: 1,
      leftPinned: false,
      list: false,
    };
    let layoutVersion = 0;
    const laidOut = new WeakMap<HTMLElement, number>();
    /** The header filter row: one cell per column, in the columns' order, pinned with them. */
    const layoutFilterRow = () => {
      const row = filterRowEl();
      if (!row) return;
      const { arranged, shown, offset, leftPinned } = layoutState;
      for (const filler of row.querySelectorAll<HTMLElement>(
        ":scope > :not([data-ok-filter-field])",
      ))
        filler.toggleAttribute("data-ok-pinned", leftPinned);
      for (const filler of row.querySelectorAll<HTMLElement>(
        ":scope > [data-ok-pinned]:not([data-ok-filter-field])",
      ))
        filler.setAttribute("data-ok-pinned", "left");
      for (const column of arranged) {
        const cell = row.querySelector<HTMLElement>(
          `:scope > [data-ok-filter-field="${CSS.escape(column.field)}"]`,
        );
        if (!cell) continue;
        row.append(cell);
        const index = shown.findIndex((c) => c.field === column.field);
        cell.hidden = index < 0;
        if (index >= 0 && cell.getAttribute("role") === "columnheader")
          cell.setAttribute("aria-colindex", String(index + offset));
        const side = gridPinSide(pinned, column.field);
        if (side) {
          cell.setAttribute("data-ok-pinned", side);
          cell.setAttribute("data-ok-pin-field", column.field);
        } else {
          cell.removeAttribute("data-ok-pinned");
          cell.removeAttribute("data-ok-pin-field");
        }
      }
    };
    /** One row's cells: order, pinning, hidden columns and indexes (once per layout). */
    const layoutRow = (row: HTMLElement) => {
      if (laidOut.get(row) === layoutVersion) return;
      laidOut.set(row, layoutVersion);
      const { arranged, shown, offset, leftPinned, list } = layoutState;
      {
        for (const column of arranged) {
          const cell = row.querySelector<HTMLElement>(
            `:scope > [data-ok-field="${CSS.escape(column.field)}"]`,
          );
          if (!cell) continue;
          row.append(cell);
          // A header's tooltip (its description) moves with it.
          for (const ref of (cell.getAttribute("aria-describedby") ?? "").split(/\s+/)) {
            const tip = ref
              ? row.querySelector(`:scope > [role="tooltip"]#${CSS.escape(ref)}`)
              : null;
            if (tip) row.append(tip);
          }
        }
        for (const cell of row.querySelectorAll<HTMLElement>(":scope > [data-ok-field]")) {
          const field = cell.getAttribute("data-ok-field") as string;
          const special = isSpecial(field);
          const side = special ? (leftPinned ? "left" : undefined) : gridPinSide(pinned, field);
          if (side) cell.setAttribute("data-ok-pinned", side);
          else cell.removeAttribute("data-ok-pinned");
          if (special) {
            if (row !== headerRow) cell.hidden = list;
            continue;
          }
          const index = shown.findIndex((c) => c.field === field);
          // Cells covered by a column span stay hidden; list view shows the list cell only.
          cell.hidden =
            index < 0 ||
            (cell.hasAttribute("data-ok-covered") && cell.hidden && !listHidden.has(cell)) ||
            (list && row !== headerRow);
          if (list && row !== headerRow) listHidden.add(cell);
          else listHidden.delete(cell);
          if (index >= 0) cell.setAttribute("aria-colindex", String(index + offset));
        }
        const listCell = row.querySelector<HTMLElement>(":scope > [data-ok-data-grid-list-cell]");
        if (listCell) listCell.hidden = !list;
      }
    };
    /**
     * Column virtualization: only the scrolling columns in view keep their cells shown (fixed
     * widths, no spans, groups or list view); spacer tracks stand for the others.
     */
    const windowColumns = (shownRows: HTMLElement[]) => {
      const shown = shownNow;
      const px = (c: GridColumn) =>
        widths[c.field] !== undefined
          ? clampGridWidth(c, widths[c.field] as number)
          : Math.max(c.width ?? 100, c.minWidth ?? 50);
      const left = shown.filter((c) => gridPinSide(pinned, c.field) === "left");
      const right = shown.filter((c) => gridPinSide(pinned, c.field) === "right");
      const middle = shown.filter((c) => !gridPinSide(pinned, c.field));
      let win: GridRowWindow | null = null;
      if (
        !element.hasAttribute(disableVirtualization.attr) &&
        viewport?.width &&
        !element.hasAttribute(listView.attr) &&
        !groupRowEls().length &&
        shown.every((c) => widths[c.field] !== undefined || !((c.flex ?? 0) > 0)) &&
        !body.querySelector(
          '[role="gridcell"][aria-colspan]:not([data-ok-data-grid-list-cell]):not([data-ok-data-grid-detail-content])',
        ) &&
        middle.length
      ) {
        const pinnedPx =
          specialFields.reduce((sum, f) => sum + specialWidth(f), 0) +
          [...left, ...right].reduce((sum, c) => sum + px(c), 0);
        const w = gridColumnWindow(
          middle.map(px),
          viewport.left ?? 0,
          viewport.width - pinnedPx,
          readNumber(element, columnBufferPx) as number,
        );
        if (w.before > 0 || w.after > 0) win = w;
      }
      const visible = win ? middle.slice(win.start, win.end) : middle;
      const out = new Set(
        win ? middle.filter((c) => !visible.includes(c)).map((c) => c.field) : [],
      );
      written = syncCustomProperties(
        main,
        {
          "--_ok-data-grid-columns": [
            ...specialFields.map((f) => `${specialWidth(f)}px`),
            ...(win
              ? [
                  ...left.map((c) => `${px(c)}px`),
                  `${win.before}px`,
                  ...visible.map((c) => `${px(c)}px`),
                  `${win.after}px`,
                  ...right.map((c) => `${px(c)}px`),
                ]
              : [gridColumnTemplate(shown, false, widths)]),
          ]
            .filter(Boolean)
            .join(" "),
        },
        written,
      );
      const first = specialFields.length + left.length + 2;
      const startOf = (field: string) =>
        !win
          ? undefined
          : field === visible[0]?.field
            ? first
            : field === right[0]?.field
              ? first + visible.length + 1
              : undefined;
      const filters = filterRowEl();
      for (const row of [headerRow, ...shownRows, ...pinnedRowEls(), ...(filters ? [filters] : [])])
        for (const column of shown) {
          const cell = row.querySelector<HTMLElement>(
            row === filters
              ? `:scope > [data-ok-filter-field="${CSS.escape(column.field)}"]`
              : `:scope > [data-ok-field="${CSS.escape(column.field)}"]`,
          );
          if (!cell) continue;
          if (out.has(column.field)) {
            if (!cell.hidden) windowHidden.add(cell);
            cell.hidden = true;
          } else if (windowHidden.has(cell)) {
            windowHidden.delete(cell);
            cell.hidden = false;
          }
          const start = startOf(column.field);
          if (start === undefined) {
            cell.removeAttribute("data-ok-col-start");
            cell.style.removeProperty("--_ok-data-grid-col-start");
          } else {
            cell.setAttribute("data-ok-col-start", "");
            cell.style.setProperty("--_ok-data-grid-col-start", String(start));
          }
        }
    };

    /** Rows: filter, sort, page (client modes), then draw the window; selection marks, overlays. */
    let pageList: HTMLElement[] = [];
    let sortedList: HTMLElement[] = [];
    let rowShift = 0;
    let total = 0;
    let viewport: GridViewport | null = null;
    let spacers: string[] = [];
    let source: GridDataSource<DataRow> | null = null;
    let sourceCount: number | undefined;
    // Server-side aggregation: the data source's values of every row (the footer row).
    let sourceAggregateRow: Record<string, unknown> | undefined;
    /** The aggregation the data source is asked for (none while pivoting or not aggregating). */
    const serverAggregationModel = () => {
      const model = activeAggregation();
      return source && !pivot && Object.keys(model).length ? model : null;
    };
    const serverAggregation = () =>
      !!source && !pivot && (!!source.getAggregatedValue || !!sourceAggregateRow);
    /** A server row's aggregated value (`getAggregatedValue`, else `row[field]`). */
    const serverValue = (row: Record<string, unknown>, field: string) =>
      source?.getAggregatedValue ? source.getAggregatedValue(row, field) : row[field];
    /** Where groups show their values (`data-ok-aggregation-position`, JSON by level). */
    const positions = () =>
      pivot
        ? {}
        : parseGridAggregationPositions(element.getAttribute("data-ok-aggregation-position"));
    const serverSide = (spec: typeof sortingMode) =>
      source !== null || readStyle(element, spec) === "server";
    // Tree data: open rows (absent: the default depth).
    const expansion = new Map<string, boolean>();
    for (const row of rows())
      if (row.hasAttribute("aria-expanded"))
        expansion.set(idOf(row), row.getAttribute("aria-expanded") === "true");
    const isTree = () => element.hasAttribute(treeData.attr);
    /** Row grouping through a data source: the server sends each level's groups. */
    const serverGrouping = () =>
      !!source &&
      !isTree() &&
      !element.hasAttribute(disableRowGrouping.attr) &&
      rowGrouping.length > 0;
    const groupFieldSelector = `[data-ok-field="${GRID_TREE_FIELD}"], [data-ok-field="${GRID_GROUPING_FIELD}"]`;
    const filterRowEl = () =>
      headerGroup.querySelector<HTMLElement>(":scope > [data-ok-data-grid-header-filters]");
    const firstRowIndex = () => groupRowEls().length + (filterRowEl() ? 1 : 0) + pinnedTop() + 2;
    /** The pivot's rows: the filtered data rows. */
    const pivotRows = () =>
      serverSide(filterMode)
        ? rows()
        : filterGridRows(rows(), filterModel, baseColumns, cellValue, cellText, filterOptions());
    const apply = () => {
      const all = rows();
      variableRows = hasOwnHeights();
      let sorted: HTMLElement[];
      if (isTree() || serverGrouping()) {
        const pass = serverSide(filterMode)
          ? null
          : new Set(filterGridRows(all, filterModel, columns, value, text, filterOptions()));
        const place = serverSide(sortingMode)
          ? null
          : new Map(
              sortGridRows(all, sortModel, columns, value, comparatorOf).map((row, i) => [row, i]),
            );
        const depth = readNumber(element, defaultGroupingExpansionDepth) as number;
        const tree = gridTreeRows(all, {
          idOf,
          parentOf: (row) => row.getAttribute("data-ok-parent"),
          expanded: (rowId, level) => expansion.get(rowId) ?? gridExpandedByDepth(depth, level),
          keep: pass ? (row) => pass.has(row) : undefined,
          compare: place
            ? (a, b) => (place.get(a) as number) - (place.get(b) as number)
            : undefined,
        });
        for (const node of tree) {
          const row = node.row;
          row.setAttribute("aria-level", String(node.depth + 1));
          row.setAttribute("aria-posinset", String(node.posInSet));
          row.setAttribute("aria-setsize", String(node.setSize));
          row
            .querySelector<HTMLElement>(groupFieldSelector)
            ?.style.setProperty("--_ok-data-grid-depth", String(node.depth));
          const toggle = row.querySelector<HTMLElement>("[data-ok-data-grid-tree-toggle]");
          // Server trees know children before they load (the toggle comes with the row).
          const parent = node.childrenCount > 0 || (!!source && !!toggle);
          if (parent)
            row.setAttribute(
              "aria-expanded",
              String(source ? expansion.get(node.id) === true : node.expanded),
            );
          else row.removeAttribute("aria-expanded");
          if (toggle) {
            const open = row.getAttribute("aria-expanded") === "true";
            toggle.setAttribute("aria-expanded", String(open));
            toggle.setAttribute(
              "aria-label",
              open ? labels.treeDataCollapse : labels.treeDataExpand,
            );
          }
        }
        sorted = tree.map((node) => node.row);
        filtered = sorted;
      } else if (pivot || grouping().length) {
        // Row grouping (and the pivot, which shows its groups only).
        const fields = grouping();
        const source = pivot ? pivotRows() : all;
        const nodes = gridRowGroups(source, fields, idOf, groupingKey);
        const multipleColumns = groupingColumns()[0] !== GRID_GROUPING_FIELD;
        const current = new Set(nodes.groups.map((g) => g.id));
        for (const known of [...groupEls.keys()])
          if (!current.has(known)) {
            groupEls.delete(known);
            groupNodes.delete(known);
          }
        const generated = nodes.groups.map(groupElFor);
        const items = pivot ? generated : [...generated, ...source];
        const passed =
          serverSide(filterMode) || pivot
            ? null
            : filterGridRows(source, filterModel, columns, value, text, filterOptions());
        const pass = passed ? new Set(passed) : null;
        const place = serverSide(sortingMode)
          ? null
          : new Map(
              sortGridRows(source, sortModel, columns, value, comparatorOf).map((row, i) => [
                row,
                i,
              ]),
            );
        const model = activeAggregation();
        const levels = positions();
        const groupValues = new Map<string, Record<string, unknown>>();
        const footerValues = new Map<string, Record<string, unknown>>();
        aggregates.clear();
        leafCounts.clear();
        const byRowId = new Map(source.map((row) => [idOf(row), row]));
        const scoped = (list: HTMLElement[]) =>
          readStyle(element, aggregationRowsScope) === "all" || !pass
            ? list
            : list.filter((row) => pass.has(row));
        const firstPlace = new Map<string, number>();
        for (const node of nodes.groups) {
          const leaves = node.leafIds.map((leaf) => byRowId.get(leaf) as HTMLElement);
          leafCounts.set(node.id, pass ? leaves.filter((r) => pass.has(r)).length : leaves.length);
          const position = gridAggregationPositionOf(levels, node.field);
          if (Object.keys(model).length && position !== null) {
            const values = gridAggregate(scoped(leaves), model, columns, value);
            groupValues.set(node.id, values);
            (position === "footer" ? footerValues : aggregates).set(node.id, values);
          }
          firstPlace.set(node.id, Math.min(...leaves.map((r) => place?.get(r) ?? 0)));
        }
        const generatedRow = (row: HTMLElement) => row.hasAttribute("data-ok-generated");
        const depth = readNumber(element, defaultGroupingExpansionDepth) as number;
        const tree = gridTreeRows(items, {
          idOf,
          parentOf: (row) => nodes.parentOf.get(idOf(row)) ?? null,
          expanded: (rowId, level) => expansion.get(rowId) ?? gridExpandedByDepth(depth, level),
          keep: pass ? (row) => !generatedRow(row) && pass.has(row) : undefined,
          compare: place
            ? gridGroupComparator<HTMLElement>({
                isGroup: generatedRow,
                place: (row) => place.get(row) as number,
                firstPlace: (row) => firstPlace.get(idOf(row)) as number,
                keyOf: (row) => (groupNodes.get(idOf(row)) as GridGroupNode).key,
                aggregateOf: (row, field) => groupValues.get(idOf(row))?.[field],
                fieldOf: (row) => groupNodes.get(idOf(row))?.field,
                sortModel,
                columns,
                groupFields: fields,
                aggregated: Object.keys(model),
              })
            : undefined,
        });
        for (const node of tree) {
          const row = node.row;
          row.setAttribute("aria-level", String(node.depth + 1));
          row.setAttribute("aria-posinset", String(node.posInSet));
          row.setAttribute("aria-setsize", String(node.setSize));
          if (node.parentId) row.setAttribute("data-ok-parent", node.parentId);
          else row.removeAttribute("data-ok-parent");
          // One column per grouped field: a group row names itself in its field's column.
          const groupNode = groupNodes.get(node.id);
          const own =
            multipleColumns && groupNode
              ? gridGroupingField(groupNode.field ?? null)
              : GRID_GROUPING_FIELD;
          const cell = row.querySelector<HTMLElement>(
            `:scope > [data-ok-field="${CSS.escape(own)}"]`,
          );
          if (!multipleColumns)
            cell?.style.setProperty("--_ok-data-grid-depth", String(node.depth));
          if (!generatedRow(row)) continue;
          const parent = node.childrenCount > 0;
          if (parent) row.setAttribute("aria-expanded", String(node.expanded));
          else row.removeAttribute("aria-expanded");
          {
            groupLabel(
              cell as HTMLElement,
              (groupNodes.get(node.id) as GridGroupNode).key,
              parent && !hideCount(own) ? (leafCounts.get(node.id) as number) : null,
              parent ? node.expanded : null,
            );
            const toggle = (cell as HTMLElement).querySelector("[data-ok-data-grid-tree-toggle]");
            toggle?.setAttribute("aria-expanded", String(node.expanded));
            toggle?.setAttribute(
              "aria-label",
              node.expanded ? labels.treeDataCollapse : labels.treeDataExpand,
            );
          }
          const values = aggregates.get(node.id);
          for (const column of columns) {
            const target = cellOf(row, column.field);
            (target as HTMLElement).textContent = aggregateText(
              column.field,
              values?.[column.field],
            );
          }
        }
        // Group footers: a row after the last shown row of each open group that has one.
        for (const known of [...footerEls.keys()])
          if (!footerValues.has(known)) footerEls.delete(known);
        const shown = gridWithGroupFooters(
          tree,
          (node) => footerValues.has(node.id),
          (node) => {
            let row = footerEls.get(node.id);
            if (!row) {
              row = document.createElement("div");
              row.setAttribute("role", "row");
              row.setAttribute("data-ok-row-id", gridGroupFooterId(node.id));
              row.setAttribute("data-ok-generated", "");
              row.setAttribute("data-ok-data-grid-aggregation-row", "");
              footerEls.set(node.id, row);
            }
            if (
              row.querySelectorAll(":scope > [data-ok-field]").length !==
              specialFields.length + columns.length
            )
              fillGroupRow(row);
            row.setAttribute("aria-level", String(node.depth + 2));
            row.setAttribute("data-ok-parent", node.id);
            const values = footerValues.get(node.id);
            for (const column of columns)
              (cellOf(row, column.field) as HTMLElement).textContent = aggregateText(
                column.field,
                values?.[column.field],
              );
            return row;
          },
        );
        sorted = shown.map((node) => node.row);
        filtered = pass ? source.filter((row) => pass.has(row)) : source;
      } else {
        filtered = serverSide(filterMode)
          ? all
          : filterGridRows(all, filterModel, columns, value, text, filterOptions());
        sorted = serverSide(sortingMode)
          ? filtered
          : sortGridRows(filtered, sortModel, columns, value, comparatorOf);
      }
      const serverPage = serverSide(paginationMode);
      total = serverPage
        ? (sourceCount ??
          (readNumber(element, rowCountOption) as number | undefined) ??
          sorted.length)
        : sorted.length;
      pagination?.setAttribute("data-ok-count", String(total));
      const paged = paging() && Number.isFinite(pageSize) && !serverPage;
      // Server pages count too: the page stays within the server's rows.
      const pages = Number.isFinite(pageSize) ? Math.max(Math.ceil(total / pageSize), 1) : 1;
      page = Math.min(page, pages - 1);
      pager()?.refresh();
      const pageStart = paged ? page * pageSize : 0;
      pageList = paged ? sorted.slice(pageStart, pageStart + pageSize) : sorted;
      sortedList = sorted;
      // Rows of a server page sit after the rows of the pages before it.
      const rowOffset = serverPage && Number.isFinite(pageSize) ? page * pageSize : 0;
      rowShift = rowOffset;
      const first = firstRowIndex();
      sorted.forEach((row, index) => {
        row.setAttribute("aria-rowindex", String(index + first + rowOffset));
      });
      bottomRowIndexes(first);
      for (const header of headers()) {
        const column = columns.find(
          (c) => c.field === header.getAttribute("data-ok-field"),
        ) as GridColumn;
        if (isGridSortable(column) && header.hasAttribute("aria-sort"))
          header.setAttribute("aria-sort", gridAriaSort(sortModel, column) as string);
      }
      syncAggregation(first);
      mark();
      draw();
      syncOverlays(all.length);
      syncHeaderFilters();
      syncChart();
      navigation.sync();
    };
    /** Pinned bottom rows (and the aggregation footer) come after every row. */
    const bottomRowIndexes = (first: number) => {
      const bottom = [
        ...main.querySelectorAll<HTMLElement>(
          '[data-ok-data-grid-pinned-rows="bottom"] > [role="row"]',
        ),
      ];
      bottom.forEach((row, index) => {
        row.setAttribute("aria-rowindex", String(first + total + index));
      });
      main.setAttribute("aria-rowcount", String(first - 1 + total + bottom.length));
    };
    /** Aggregation: the function's name in headers and the footer row of every filtered row. */
    const syncAggregation = (first: number) => {
      const model = activeAggregation();
      for (const header of headers()) {
        const fn = pivot ? undefined : model[header.getAttribute("data-ok-field") as string];
        let label = header.querySelector<HTMLElement>(
          ":scope > [data-ok-data-grid-aggregation-label]",
        );
        if (!fn) {
          label?.remove();
          continue;
        }
        if (!label) {
          label = document.createElement("span");
          label.setAttribute("data-ok-data-grid-aggregation-label", "");
          header.querySelector(":scope > [data-ok-data-grid-header-title]")?.after(label);
        }
        label.textContent = labelOf(fn);
      }
      let footer = main.querySelector<HTMLElement>(
        `[data-ok-row-id="${GRID_AGGREGATION_ROOT_ID}"]`,
      );
      if (
        !Object.keys(model).length ||
        (lazy() && !serverAggregation()) ||
        gridAggregationPositionOf(positions(), undefined) !== "footer"
      ) {
        const group = footer?.parentElement;
        footer?.remove();
        if (group && !group.children.length) group.remove();
      } else {
        if (!footer) {
          footer = document.createElement("div");
          footer.setAttribute("role", "row");
          footer.setAttribute("data-ok-row-id", GRID_AGGREGATION_ROOT_ID);
          footer.setAttribute("data-ok-data-grid-aggregation-row", "");
          let group = main.querySelector<HTMLElement>('[data-ok-data-grid-pinned-rows="bottom"]');
          if (!group) {
            group = document.createElement("div");
            group.setAttribute("role", "rowgroup");
            group.setAttribute("data-ok-data-grid-pinned-rows", "bottom");
            body.after(group);
          }
          group.append(footer);
        }
        if (
          footer.querySelectorAll(":scope > [data-ok-field]").length !==
          specialFields.length + columns.length
        )
          fillGroupRow(footer);
        const rowsNow = pivot
          ? pivotRows()
          : readStyle(element, aggregationRowsScope) === "all" || serverSide(filterMode)
            ? rows()
            : filterGridRows(rows(), filterModel, columns, value, text, filterOptions());
        const values = serverAggregation()
          ? Object.fromEntries(
              Object.keys(model).map((field) => [
                field,
                sourceAggregateRow ? serverValue(sourceAggregateRow, field) : undefined,
              ]),
            )
          : gridAggregate(rowsNow, model, columns, value);
        for (const column of columns) {
          const cell = cellOf(footer, column.field);
          (cell as HTMLElement).textContent = aggregateText(column.field, values[column.field]);
        }
        layoutRow(footer);
      }
      bottomRowIndexes(first);
    };
    /** Header filters: each field shows the value of its column's first filter item. */
    const syncHeaderFilters = () => {
      for (const input of filterRowEl()?.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
        "[data-ok-data-grid-header-filter] > [data-ok-text-field] :is(input, select)",
      ) ?? []) {
        if (input.closest("[data-ok-date-picker]")) continue;
        const field = input.closest("[data-ok-filter-field]")?.getAttribute("data-ok-filter-field");
        const item = filterModel.items.find((i) => i.field === field);
        const shown = typeof item?.value === "string" ? item.value : (item?.value ?? []).join(", ");
        if (input.value !== shown) input.value = shown;
      }
    };
    /** Puts the rows of the window (or the whole page) in the body, moving as few as possible. */
    const measured = new WeakMap<HTMLElement, number>();
    const spacingOf = (row: HTMLElement, side: "top" | "bottom") =>
      Number(row.getAttribute(`data-ok-spacing-${side}`)) || 0;
    /** Rows with their own height or spacing (offsets per row). */
    let variableRows = false;
    const variable = () => detailOpen.size > 0 || variableRows;
    const hasOwnHeights = () =>
      rows().some(
        (row) =>
          row.hasAttribute("data-ok-row-height") ||
          row.hasAttribute("data-ok-spacing-top") ||
          row.hasAttribute("data-ok-spacing-bottom"),
      );
    const baseHeight = () => {
      const density = pick(gridDensities, element.getAttribute(densityOption.attr), "standard");
      return Math.round(
        ((readNumber(element, rowHeightOption) as number) || 52) * gridDensityFactor(density),
      );
    };
    const heights = () =>
      pageList.map((row) => {
        const own = Number(row.getAttribute("data-ok-row-height"));
        const box = measured.get(row) ?? (own > 0 ? own : baseHeight()) + 1;
        return box + spacingOf(row, "top") + spacingOf(row, "bottom");
      });
    let offsets: number[] | null = null;
    /** Row spans of the page (`rowSpanning`), recomputed on draw. */
    const spanRows = () => {
      for (const cell of body.querySelectorAll<HTMLElement>(
        "[aria-rowspan], [data-ok-covered]:not([hidden])",
      )) {
        cell.removeAttribute("aria-rowspan");
        cell.removeAttribute("data-ok-covered");
        cell.removeAttribute("aria-hidden");
        cell.style.removeProperty("--_ok-data-grid-rowspan");
      }
      if (!element.hasAttribute(rowSpanning.attr)) return null;
      const fields = visibleGridColumns(columns, visibility)
        .filter((c) => c.type !== "actions")
        .map((c) => c.field);
      return gridRowSpans(pageList, fields, text);
    };
    // Master-detail: open panels (from the markup) and the templates of the others.
    const panels = new Map<string, HTMLElement>();
    for (const panel of body.querySelectorAll<HTMLElement>(":scope > [data-ok-data-grid-detail]"))
      panels.set(panel.getAttribute("data-ok-detail-for") as string, panel);
    const detailOpen = new Set(panels.keys());
    const panelFor = (rowId: string) => {
      const known = panels.get(rowId);
      if (known) return known;
      const template = element.querySelector<HTMLTemplateElement>(
        `template[data-ok-data-grid-detail="${CSS.escape(rowId)}"]`,
      );
      if (!template) return null;
      const panel = document.createElement("div");
      panel.setAttribute("role", "row");
      panel.setAttribute("data-ok-data-grid-detail", "");
      panel.setAttribute("data-ok-detail-for", rowId);
      if (id) panel.id = `${id}-${rowId}-detail`;
      const height = numberAttr(template, "data-ok-detail-height");
      if (height) {
        panel.setAttribute("data-ok-detail-height", String(height));
        panel.style.setProperty("--_ok-data-grid-detail-height", `${height}px`);
      }
      const cell = document.createElement("div");
      cell.setAttribute("role", "gridcell");
      cell.setAttribute("aria-colindex", "1");
      cell.setAttribute("aria-colspan", main.getAttribute("aria-colcount") ?? "1");
      cell.setAttribute("data-ok-data-grid-detail-content", "");
      cell.tabIndex = -1;
      cell.append(template.content.cloneNode(true));
      panel.append(cell);
      panels.set(rowId, panel);
      return panel;
    };
    // Lazy loading: rows by index as they arrive; the others are placeholder rows.
    const lazy = () => source !== null && element.hasAttribute(lazyLoading.attr);
    const lazyLoaded = new Map<number, HTMLElement>();
    const lazyState = { key: "", pending: new Set<string>(), last: 0, timer: 0 as unknown };
    const placeholder = (index: number) => {
      const row = (
        (rowTemplate as HTMLTemplateElement).content.firstElementChild as HTMLElement
      ).cloneNode(true) as HTMLElement;
      row.setAttribute("data-ok-row-id", `__loading__-${index}`);
      row.setAttribute("data-ok-loading-row", "");
      row.removeAttribute("aria-selected");
      for (const cell of row.querySelectorAll<HTMLElement>(":scope > [data-ok-field]")) {
        cell.removeAttribute("data-ok-value");
        cell.removeAttribute("data-ok-text");
        const field = cell.getAttribute("data-ok-field") as string;
        if (isSpecial(field)) {
          cell.replaceChildren();
          continue;
        }
        const bar = document.createElement("span");
        bar.setAttribute("data-ok-data-grid-skeleton", "");
        cell.replaceChildren(bar);
      }
      return row;
    };
    const lazyRows = () => {
      const count = sourceCount ?? (readNumber(element, rowCountOption) as number | undefined) ?? 0;
      rowEls = Array.from({ length: count }, (_, i) => {
        let row = lazyLoaded.get(i);
        if (!row) {
          row = placeholder(i);
          lazyLoaded.set(-1 - i, row);
        }
        return lazyLoaded.get(i) ?? (lazyLoaded.get(-1 - i) as HTMLElement);
      });
    };
    const lazyRequest = (range: { start: number; end: number }) => {
      const current = source as GridDataSource<DataRow>;
      const aggregation = serverAggregationModel();
      const key = JSON.stringify({ sortModel, filterModel, aggregation });
      if (lazyState.key !== key) {
        lazyState.key = key;
        lazyState.pending.clear();
        lazyLoaded.clear();
      }
      const loaded = (i: number) => lazyLoaded.has(i);
      const ranges = gridMissingRanges(
        loaded,
        range,
        LAZY_CHUNK,
        total > 0 ? total : range.end,
      ).filter((r) => !lazyState.pending.has(`${r.start}-${r.end}`));
      if (!ranges.length) return;
      const run = () => {
        lazyState.last = Date.now();
        for (const r of ranges) {
          const name = `${r.start}-${r.end}`;
          lazyState.pending.add(name);
          element.setAttribute(loadingOption.attr, "");
          current
            .getRows({
              sortModel,
              filterModel,
              start: r.start,
              end: r.end,
              ...(aggregation ? { aggregationModel: aggregation } : {}),
            })
            .then((response) => {
              if (lazyState.key !== key || source !== current) return;
              if (response.aggregateRow) sourceAggregateRow = response.aggregateRow;
              const fresh = response.rows.map((item, k) => {
                const row = fillRow(item);
                lazyLoaded.set(r.start + k, row);
                return row;
              });
              if (response.rowCount !== undefined) sourceCount = response.rowCount;
              lazyRows();
              styleRows(fresh);
              apply();
              // The first rows give the row height: the window starts.
              scrollWatcher.measure();
            })
            .catch((error: unknown) => emit("datasourceerror", { error }))
            .finally(() => {
              lazyState.pending.delete(name);
              if (!lazyState.pending.size) element.removeAttribute(loadingOption.attr);
            });
        }
      };
      const wait =
        (readNumber(element, lazyLoadingRequestThrottleMs) as number) -
        (Date.now() - lazyState.last);
      clearTimeout(lazyState.timer as number);
      if (wait > 0) lazyState.timer = setTimeout(run, wait);
      else run();
    };
    let drawing = false;
    const draw = () => {
      const vp = viewport as GridViewport;
      const virtual =
        !element.hasAttribute(disableVirtualization.attr) && !!vp?.scrolls && vp.rowHeight > 0;
      offsets = virtual && variable() ? gridRowOffsets(heights()) : null;
      let range: GridRowWindow = virtual
        ? offsets
          ? gridRowWindowOf(
              offsets,
              vp.offset,
              vp.viewport,
              readNumber(element, rowBufferPx) as number,
            )
          : gridRowWindow(
              pageList.length,
              vp.rowHeight,
              vp.offset,
              vp.viewport,
              readNumber(element, rowBufferPx) as number,
            )
        : { start: 0, end: pageList.length, before: 0, after: 0 };
      // Lazy grids never draw every row: before the first measure, the first chunk only.
      if (!virtual && lazy() && pageList.length > LAZY_CHUNK)
        range = {
          start: 0,
          end: LAZY_CHUNK,
          before: 0,
          after: (pageList.length - LAZY_CHUNK) * (baseHeight() + 1),
        };
      const spans = spanRows();
      if (spans && range.start > 0) {
        const start = spans.origin[range.start] as number;
        range = {
          ...range,
          start,
          before: offsets ? (offsets[start] as number) : start * vp.rowHeight,
        };
      }
      const shownRows = pageList.slice(range.start, range.end);
      for (const row of shownRows) layoutRow(row);
      // Rows, each followed by its open detail panel.
      const items: HTMLElement[] = [];
      for (const row of shownRows) {
        items.push(row);
        const panel = detailOpen.has(idOf(row)) ? panelFor(idOf(row)) : null;
        if (panel) items.push(panel);
      }
      const keep = new Set(items);
      for (const child of [...body.children]) if (!keep.has(child as HTMLElement)) child.remove();
      items.forEach((item, index) => {
        item.hidden = false;
        if (body.children[index] !== item) body.insertBefore(item, body.children[index] ?? null);
      });
      if (lazy()) lazyRequest(virtual ? range : { start: 0, end: LAZY_CHUNK });
      shownRows.forEach((row, index) => {
        const cells = spans?.cells[range.start + index];
        for (const [field, span] of cells ?? []) {
          const cell = cellOf(row, field) as HTMLElement;
          if (span.covered) {
            cell.setAttribute("data-ok-covered", "");
            cell.setAttribute("aria-hidden", "true");
          } else {
            cell.setAttribute("aria-rowspan", String(span.span));
            cell.style.setProperty("--_ok-data-grid-rowspan", String(span.span));
          }
        }
      });
      spacers = syncCustomProperties(
        body,
        virtual || range.after > 0
          ? {
              "--_ok-data-grid-before": `${range.before}px`,
              "--_ok-data-grid-after": `${range.after}px`,
            }
          : {},
        spacers,
      );
      windowColumns(shownRows);
      markCells();
      syncGridPinning(main);
      // Rows of their own height: measure them (with their panels); new heights move the window.
      if (offsets && !drawing) {
        let changed = false;
        for (const row of shownRows) {
          const next = row.nextElementSibling as HTMLElement | null;
          const height =
            row.offsetHeight +
            (next?.hasAttribute("data-ok-data-grid-detail") ? next.offsetHeight : 0);
          if (row.offsetHeight && measured.get(row) !== height) {
            measured.set(row, height);
            changed = true;
          }
        }
        if (changed) {
          drawing = true;
          draw();
          drawing = false;
        }
      }
    };
    const loadingOverlay = element.querySelector<HTMLElement>("[data-ok-data-grid-loading]");
    const syncOverlays = (count: number) => {
      const busy = element.hasAttribute(loadingOption.attr);
      if (loadingOverlay) loadingOverlay.hidden = !busy;
      main.toggleAttribute("aria-busy", busy);
      if (busy) main.setAttribute("aria-busy", "true");
      const visible = pageList.length > 0;
      overlay.hidden = visible || busy;
      overlay.textContent =
        visible || busy
          ? ""
          : count === 0
            ? (element.getAttribute("data-ok-label-no-rows") ?? labels.noRowsLabel)
            : (element.getAttribute("data-ok-label-no-results") ?? labels.noResultsOverlayLabel);
    };

    // Virtualization and the end of the rows (infinite loading).
    let endCount = -1;
    const scrollWatcher = createGridScrollWatcher(main, {
      onChange: (next) => {
        viewport = next;
        draw();
      },
      onScrollEnd: () => {
        if (endCount === total) return;
        endCount = total;
        emit("scrollend", { visibleRowsCount: total });
      },
      threshold: () => readNumber(element, scrollEndThreshold) as number,
    });

    // Rows from data (templates) and from a data source.
    const rowTemplate = element.querySelector<HTMLTemplateElement>(
      "template[data-ok-data-grid-row]",
    );
    const buildRows = (data: readonly DataRow[]) => {
      // Without a row template only an empty list can be shown.
      if (!rowTemplate && data.length) return;
      rowEls = data.map((item) => fillRow(item));
      if (!element.hasAttribute(keepNonExistentRowsSelected.attr))
        selection = pruneGridSelection(selection, rowEls.map(idOf));
      styleRows();
      layout();
      apply();
      scrollWatcher.measure();
    };
    /** A row copied from the template, its cells filled as text (formatted). */
    const fillRow = (item: DataRow, parent?: string) => {
      {
        const row = (
          (rowTemplate as HTMLTemplateElement).content.firstElementChild as HTMLElement
        ).cloneNode(true) as HTMLElement;
        if (parent) row.setAttribute("data-ok-parent", parent);
        else row.removeAttribute("data-ok-parent");
        // Server tree data: the group key and a toggle when the row has children.
        const treeCell = row.querySelector<HTMLElement>(groupFieldSelector);
        if (treeCell && source) {
          const label = treeCell.querySelector("[data-ok-data-grid-tree-label]");
          if (label) label.textContent = source.getGroupKey?.(item) ?? String(item["id"]);
          treeCell.querySelector("[data-ok-data-grid-tree-count]")?.remove();
          const toggle = treeCell.querySelector("[data-ok-data-grid-tree-toggle]");
          if (toggle && !((source.getChildrenCount?.(item) ?? 0) > 0)) {
            const spacer = document.createElement("span");
            spacer.setAttribute("data-ok-data-grid-tree-spacer", "");
            toggle.replaceWith(spacer);
          }
        }
        row.setAttribute("data-ok-row-id", String(item["id"]));
        for (const cell of row.querySelectorAll<HTMLElement>('[role="gridcell"][data-ok-field]')) {
          const field = cell.getAttribute("data-ok-field") as string;
          if (isSpecial(field)) continue;
          const raw = item[field];
          // Server-side aggregation: a server parent shows its aggregated values.
          const shownText =
            serverAggregation() &&
            activeAggregation()[field] &&
            (source?.getChildrenCount?.(item) ?? 0) > 0
              ? aggregateText(field, serverValue(item, field))
              : formatted(field, raw);
          const cellTemplate = element.querySelector<HTMLTemplateElement>(
            `template[data-ok-data-grid-cell="${CSS.escape(field)}"]`,
          );
          if (cellTemplate) {
            cell.replaceChildren(cellTemplate.content.cloneNode(true));
            for (const slot of cell.querySelectorAll("[data-ok-data-grid-value]"))
              slot.textContent = shownText;
            cell.setAttribute("data-ok-text", shownText);
          } else cell.textContent = shownText;
          const rawText = raw === null || raw === undefined ? "" : String(raw);
          if (typeof raw !== "string" || rawText !== shownText)
            cell.setAttribute("data-ok-value", rawText);
        }
        return row;
      }
    };
    const sourceCache = createGridDataSourceCache<DataRow>();
    let request = 0;
    const load = () => {
      if (lazy()) {
        lazyRows();
        layout();
        apply();
        return;
      }
      const current = source as GridDataSource<DataRow>;
      const params = {
        sortModel,
        filterModel,
        paginationModel: { page, pageSize: Number.isFinite(pageSize) ? pageSize : 0 },
        ...(serverGrouping() ? { groupKeys: [], groupFields: [...rowGrouping] } : {}),
        ...(serverAggregationModel()
          ? { aggregationModel: serverAggregationModel() as GridAggregationModel }
          : {}),
      };
      const cached = sourceCache.get(params);
      const show = (response: GridGetRowsResponse<DataRow>) => {
        sourceCount = response.rowCount;
        sourceAggregateRow = response.aggregateRow;
        buildRows(response.rows);
      };
      if (cached) {
        show(cached);
        return;
      }
      const id = ++request;
      element.setAttribute(loadingOption.attr, "");
      current
        .getRows(params)
        .then((response) => {
          sourceCache.set(params, response);
          if (id === request) show(response);
        })
        .catch((error: unknown) => {
          if (id === request) emit("datasourceerror", { error });
        })
        .finally(() => {
          if (id === request) element.removeAttribute(loadingOption.attr);
        });
    };
    /** After a sort, filter or page change: ask the data source, or apply locally. */
    const refresh = () => {
      if (source && (isTree() || serverGrouping())) loadedChildren.clear();
      if (source) load();
      else apply();
    };

    // Tree data: open or close a row (`ok:data-grid:expand`, cancelable); server trees load children.
    const loadedChildren = new Set<string>();
    const toggleExpansion = (row: HTMLElement, open?: boolean) => {
      const rowId = idOf(row);
      const next = open ?? row.getAttribute("aria-expanded") !== "true";
      if (!emit("expand", { id: rowId, expanded: next }, { cancelable: true })) return;
      expansion.set(rowId, next);
      if (source && next && !loadedChildren.has(rowId)) {
        const current = source;
        const keys: string[] = [];
        for (let at: HTMLElement | undefined = row; at; ) {
          keys.unshift(at.querySelector("[data-ok-data-grid-tree-label]")?.textContent ?? idOf(at));
          const parent = at.getAttribute("data-ok-parent");
          at = parent ? rows().find((r) => idOf(r) === parent) : undefined;
        }
        loadedChildren.add(rowId);
        row.setAttribute("aria-busy", "true");
        current
          .getRows({
            sortModel,
            filterModel,
            groupKeys: keys,
            ...(serverGrouping() ? { groupFields: [...rowGrouping] } : {}),
            ...(serverAggregationModel()
              ? { aggregationModel: serverAggregationModel() as GridAggregationModel }
              : {}),
          })
          .then((response) => {
            if (source !== current) return;
            rowEls = [...rowEls, ...response.rows.map((item) => fillRow(item, rowId))];
            styleRows();
            layout();
            apply();
          })
          .catch((error: unknown) => {
            loadedChildren.delete(rowId);
            emit("datasourceerror", { error });
          })
          .finally(() => row.removeAttribute("aria-busy"));
      }
      apply();
    };
    // Master-detail: open or close a row's panel (`ok:data-grid:detailpanel`, cancelable).
    const toggleDetail = (row: HTMLElement) => {
      const rowId = idOf(row);
      const next = !detailOpen.has(rowId);
      if (!emit("detailpanel", { id: rowId, expanded: next }, { cancelable: true })) return;
      if (next) detailOpen.add(rowId);
      else detailOpen.delete(rowId);
      const toggle = row.querySelector<HTMLElement>("[data-ok-data-grid-detail-toggle]");
      if (toggle) {
        toggle.setAttribute("aria-expanded", String(next));
        toggle.setAttribute(
          "aria-label",
          next ? labels.collapseDetailPanel : labels.expandDetailPanel,
        );
        if (next && id) toggle.setAttribute("aria-controls", `${id}-${rowId}-detail`);
        else toggle.removeAttribute("aria-controls");
      }
      draw();
      navigation.sync();
    };
    // Row reordering (`ok:data-grid:roworder`, cancelable): no sort, filter, tree or lazy rows.
    const live = element.querySelector<HTMLElement>("[data-ok-data-grid-live]");
    const rowReorder = createGridRowReorder(main, {
      canReorder: () =>
        element.hasAttribute(rowReordering.attr) &&
        !isTree() &&
        !lazy() &&
        sortModel.length === 0 &&
        filterModel.items.length === 0 &&
        !filterModel.quickFilterValues?.length,
      onMove: (rowId, rowIndex) => {
        const ids = sortedList.map(idOf);
        const oldIndex = ids.indexOf(rowId);
        const targetIndex = Math.min(
          Math.max(rowIndex - firstRowIndex() - rowShift, 0),
          ids.length - 1,
        );
        if (oldIndex < 0 || oldIndex === targetIndex) return;
        if (!emit("roworder", { id: rowId, oldIndex, targetIndex }, { cancelable: true })) return;
        const byRowId = new Map(rowEls.map((row) => [idOf(row), row]));
        rowEls = moveGridRow(ids, rowId, targetIndex).map((rid) => byRowId.get(rid) as HTMLElement);
        apply();
        if (live)
          live.textContent = labels.rowReorderingMoved
            .replace("{position}", String(targetIndex + 1))
            .replace("{count}", String(ids.length));
        (byRowId.get(rowId) as HTMLElement)
          .querySelector<HTMLElement>("[data-ok-data-grid-reorder-handle]")
          ?.focus();
      },
    });

    /** Selection marks: rows, their checkboxes and "select all". */
    const mark = () => {
      syncFooter();
      if (!checkbox) return;
      for (const row of rows()) {
        const on = selection.includes(idOf(row));
        row.setAttribute("aria-selected", String(on));
        const box = row.querySelector(
          '[data-ok-data-grid-checkbox] input[type="checkbox"]',
        ) as HTMLInputElement;
        box.checked = on;
        box.disabled = !selectable(row);
      }
      const all = headerRow.querySelector<HTMLInputElement>(
        '[data-ok-data-grid-checkbox] input[type="checkbox"]',
      );
      // One row at a time: no "select all".
      if (!all) return;
      const state = gridSelectAllState(allRows().map(idOf), selection);
      all.checked = state === "all";
      all.indeterminate = state === "some";
      (all.closest("[data-ok-checkbox]") as Element).toggleAttribute(
        "data-ok-indeterminate",
        state === "some",
      );
    };

    const change = <T>(event: GridModelEvent, model: T, commit: (model: T) => void) => {
      const detail = { model } as DataGridEvents[GridModelEvent]["detail"];
      if (!emit(event, detail, { cancelable: true })) return false;
      commit(model);
      return true;
    };
    const sortBy = (field: string, multi: boolean) => {
      const column = columns.find((c) => c.field === field);
      if (!column || !isGridSortable(column)) return;
      const always = readStyle(element, multipleColumnsSortingMode) === "always";
      const next = nextGridSort(
        sortModel,
        field,
        (multi || always) && !element.hasAttribute(disableMultipleColumnsSorting.attr),
        sortCycle(column),
      );
      change("sort", next, (model) => {
        sortModel = model;
        refresh();
      });
    };
    const select = (ids: string[]) => {
      change("selection", ids, (model) => {
        selection = model;
        mark();
      });
    };
    const setFilter = (model: GridFilterModel) =>
      change("filter", model, (next) => {
        filterModel = next;
        page = 0;
        pager()?.setPage(0);
        refresh();
      });
    const setVisibility = (model: GridColumnVisibilityModel) =>
      change("columns", model, (next) => {
        visibility = next;
        layout();
        navigation.sync();
      });

    // Phase 6: row grouping and aggregation models (cancelable events, as the others).
    const setRowGrouping = (model: string[]) =>
      change("rowgrouping", model, (next) => {
        rowGrouping = next;
        commitGrouping();
      });
    const commitGrouping = () => {
      if (rowGrouping.length)
        element.setAttribute("data-ok-row-grouping-model", JSON.stringify(rowGrouping));
      else element.removeAttribute("data-ok-row-grouping-model");
      syncGroupColumns();
      refresh();
    };
    const setAggregation = (model: GridAggregationModel) =>
      change("aggregation", model, (next) => {
        aggregationModel = next;
        commitAggregation();
      });
    const commitAggregation = () => {
      if (Object.keys(aggregationModel).length)
        element.setAttribute("data-ok-aggregation-model", JSON.stringify(aggregationModel));
      else element.removeAttribute("data-ok-aggregation-model");
      // A data source aggregates on the server: ask again.
      if (source) refresh();
      else apply();
    };

    // Pivot fields derived from other columns (default: the year and quarter of date columns).
    let deriveColumns:
      | ((column: GridColumn) => GridPivotDerivedField[] | undefined)
      | null
      | undefined;
    const syncDerived = () => {
      derived.clear();
      if (deriveColumns === null) return;
      for (const column of baseColumns) {
        if (column.type === "actions") continue;
        const list = deriveColumns
          ? deriveColumns(column)
          : gridPivotDerivedColumns(column, {
              year: labels.pivotYearColumnHeaderName,
              quarter: labels.pivotQuarterColumnHeaderName,
            })?.map(({ derive, ...rest }) => ({
              ...rest,
              valueGetter: (raw: unknown) => derive(raw),
            }));
        for (const own of list ?? []) derived.set(own.field, { source: column.field, column: own });
      }
    };
    /** The pivot's values and texts: derived fields from their source cell. */
    const pivotValue = (row: HTMLElement, field: string) => {
      const own = derived.get(field);
      return own ? own.column.valueGetter(cellValue(row, own.source), row) : cellValue(row, field);
    };
    function pivotText(row: HTMLElement, field: string) {
      const own = derived.get(field);
      if (!own) return cellText(row, field);
      const raw = pivotValue(row, field);
      return own.column.valueFormatter
        ? own.column.valueFormatter(raw)
        : raw === null || raw === undefined
          ? ""
          : String(raw);
    }

    // Pivoting: the pivot's columns and groups replace the markup's columns while it shows.
    let baseHeader: Node[] | null = null;
    let baseGroupRows: HTMLElement[] = [];
    const baseGroupPaths = groupPaths;
    const headerCell = (field: string, name: string) => {
      const cell = document.createElement("div");
      cell.setAttribute("role", "columnheader");
      cell.setAttribute("data-ok-field", field);
      cell.tabIndex = -1;
      const title = document.createElement("span");
      title.setAttribute("data-ok-data-grid-header-title", "");
      title.textContent = name;
      cell.append(title);
      return cell;
    };
    const showPivot = () => {
      pivotNow = pivotOn();
      if (!pivotOn()) {
        if (!pivot) return;
        pivot = null;
        columns = baseColumns;
        groupPaths = baseGroupPaths;
        for (const row of groupRowEls()) row.remove();
        headerRow.before(...baseGroupRows);
        headerRow.replaceChildren(...(baseHeader as Node[]));
        baseHeader = null;
      } else {
        if (!pivot) {
          baseHeader = [...headerRow.childNodes];
          baseGroupRows = groupRowEls();
          for (const row of baseGroupRows) row.remove();
        }
        syncDerived();
        pivot = gridPivot(
          pivotRows(),
          [
            ...baseColumns.filter((c) => c.type !== "actions"),
            ...[...derived.values()].map((d) => d.column),
          ],
          pivotModel,
          pivotValue,
          pivotText,
          labelOf,
        );
        const result = pivot;
        columns = result.columns;
        groupPaths = gridGroupPaths(result.columnGroupingModel);
        // Specials stay (without the markup's group column), then the pivot's columns.
        const specials = (baseHeader as Node[]).filter(
          (node): node is HTMLElement =>
            node instanceof HTMLElement &&
            (node.getAttribute("data-ok-field") ?? "") in SPECIALS &&
            !isGridGroupingField(node.getAttribute("data-ok-field") ?? ""),
        );
        const cells: HTMLElement[] = specials.map((node) => node.cloneNode(true) as HTMLElement);
        if (result.rowGroupingModel.length) {
          const group = headerCell(GRID_GROUPING_FIELD, labels.treeDataGroupingHeaderName);
          group.setAttribute("data-ok-width", "200");
          cells.push(group);
        }
        cells.forEach((cell, i) => {
          cell.setAttribute("aria-colindex", String(i + 1));
        });
        for (const column of result.columns) {
          const cell = headerCell(column.field, column.headerName as string);
          cell.setAttribute("data-ok-type", column.type ?? "string");
          cell.setAttribute("data-ok-align", gridHeaderAlign(column));
          cell.setAttribute("data-ok-width", String(column.width));
          cell.setAttribute("data-ok-hideable", "false");
          cell.setAttribute("aria-sort", "none");
          const path = groupPaths.get(column.field);
          if (path?.length) cell.setAttribute("data-ok-group-path", JSON.stringify(path));
          const arrow = document.createElement("span");
          arrow.setAttribute("data-ok-data-grid-sort-icon", "");
          arrow.append(icon(SORT_ARROW));
          cell.append(arrow);
          if (!element.hasAttribute(disableColumnResize.attr)) {
            const handle = document.createElement("span");
            handle.setAttribute("data-ok-data-grid-resize", "");
            handle.setAttribute("aria-hidden", "true");
            cell.append(handle);
          }
          cells.push(cell);
        }
        headerRow.replaceChildren(...cells);
        // Column groups: one header row per level, a cell per group (laid out by groupLayout).
        for (const row of groupRowEls()) row.remove();
        const levels = Math.max(0, ...[...groupPaths.values()].map((p) => p.length));
        const byGroupId = gridGroupsById(result.columnGroupingModel);
        for (let level = 0; level < levels; level++) {
          const row = document.createElement("div");
          row.setAttribute("role", "row");
          row.setAttribute("aria-rowindex", String(level + 1));
          row.setAttribute("data-ok-data-grid-group-row", "");
          const ids = new Set([...groupPaths.values()].map((p) => p[level]).filter(Boolean));
          for (const groupId of ids) {
            const cell = headerCell(
              "",
              (byGroupId.get(groupId as string) as GridColumnGroup).headerName as string,
            );
            cell.removeAttribute("data-ok-field");
            cell.setAttribute("data-ok-group-id", groupId as string);
            row.append(cell);
          }
          headerRow.before(row);
        }
      }
      headerRow.setAttribute("aria-rowindex", String(groupRowEls().length + 1));
      filterRowEl()?.setAttribute("aria-rowindex", String(groupRowEls().length + 2));
      specialFields = readSpecials();
      for (const row of groupEls.values()) fillGroupRow(row);
      const footer = main.querySelector<HTMLElement>("[data-ok-data-grid-aggregation-row]");
      if (footer) fillGroupRow(footer);
      main.setAttribute("role", grouping().length || isTree() ? "treegrid" : "grid");
      syncPivotPanel();
      layout();
      apply();
      navigation.sync();
    };
    const pivotPanel = byId("pivot");
    /** The panel's fields follow the model (functions only for values). */
    const syncPivotPanel = () => {
      const toggle = pivotPanel?.querySelector<HTMLInputElement>(
        "[data-ok-data-grid-pivot-switch]",
      );
      if (toggle) toggle.checked = pivotOn();
      for (const box of pivotPanel?.querySelectorAll<HTMLElement>(
        "[data-ok-data-grid-pivot-field]",
      ) ?? []) {
        const field = box.getAttribute("data-ok-field") as string;
        const [role, fn] = [...box.querySelectorAll("select")] as [
          HTMLSelectElement,
          HTMLSelectElement,
        ];
        role.value = gridPivotRole(pivotModel, field);
        fn.disabled = role.value !== "values";
        const own = pivotModel.values.find((v) => v.field === field)?.aggFunc;
        if (own) fn.value = own;
      }
      // Sections: each field in its place, in the model's order (unused ones in column order).
      const sections = pivotPanel?.querySelectorAll<HTMLElement>(
        "[data-ok-data-grid-pivot-section]",
      );
      if (!pivotPanel || !sections?.length) return;
      const boxes = new Map(
        [...pivotPanel.querySelectorAll<HTMLElement>("[data-ok-data-grid-pivot-field]")].map(
          (box) => [box.getAttribute("data-ok-field") as string, box],
        ),
      );
      syncDerived();
      const order = gridPivotSections(
        pivotModel,
        [...baseColumns.map((c) => c.field), ...derived.keys()].filter((f) => boxes.has(f)),
      );
      for (const section of sections) {
        const name = section.getAttribute("data-ok-data-grid-pivot-section") as GridPivotSection;
        const list = order[name] ?? [];
        let previous = section.querySelector<HTMLElement>(
          ":scope > [data-ok-data-grid-pivot-section-title]",
        );
        list.forEach((field, index) => {
          const box = boxes.get(field) as HTMLElement;
          // Only fields out of place move (moving a focused element drops its focus).
          if (previous && box.previousElementSibling !== previous) previous.after(box);
          else if (!previous && box.parentElement !== section) section.prepend(box);
          previous = box;
          for (const button of box.querySelectorAll<HTMLButtonElement>(
            "[data-ok-data-grid-pivot-move]",
          )) {
            button.hidden = name === "none";
            button.disabled =
              button.getAttribute("data-ok-data-grid-pivot-move") === "up"
                ? index === 0
                : index === list.length - 1;
          }
        });
        const hint = section.querySelector<HTMLElement>(":scope > [data-ok-data-grid-pivot-empty]");
        if (hint) hint.hidden = list.length > 0;
      }
    };
    /** Moves a field of the panel (Move up / Move down, a drop). */
    const movePivotField = (field: string, section: GridPivotSection, index: number) => {
      const box = pivotPanel?.querySelector<HTMLElement>(
        `[data-ok-data-grid-pivot-field][data-ok-field="${CSS.escape(field)}"]`,
      );
      const fn = box?.querySelectorAll("select")[1]?.value ?? "sum";
      setPivot(moveGridPivotField(pivotModel, field, section, index, fn), pivotOn());
    };
    const setPivot = (model: GridPivotModel, active: boolean) => {
      if (!emit("pivot", { model, active }, { cancelable: true })) {
        syncPivotPanel();
        return;
      }
      pivotModel = model;
      element.setAttribute("data-ok-pivot-model", JSON.stringify(model));
      if (active !== pivotOn()) element.toggleAttribute(pivotActiveOption.attr, active);
      if (pivot || active) showPivot();
      else syncPivotPanel();
    };
    pivotPanel?.addEventListener(
      "click",
      (event) => {
        const button = (event.target as Element).closest<HTMLButtonElement>(
          "[data-ok-data-grid-pivot-move]",
        );
        const box = button?.closest<HTMLElement>("[data-ok-data-grid-pivot-field]");
        const section = box?.closest<HTMLElement>("[data-ok-data-grid-pivot-section]");
        if (!button || button.disabled || !box || !section) return;
        const field = box.getAttribute("data-ok-field") as string;
        const name = section.getAttribute("data-ok-data-grid-pivot-section") as GridPivotSection;
        const fields = [
          ...section.querySelectorAll<HTMLElement>(":scope > [data-ok-data-grid-pivot-field]"),
        ].map((b) => b.getAttribute("data-ok-field"));
        const direction = button.getAttribute("data-ok-data-grid-pivot-move");
        movePivotField(field, name, fields.indexOf(field) + (direction === "up" ? -1 : 1));
        // The pressed button keeps the focus (the other one at an end).
        const other = box.querySelector<HTMLButtonElement>(
          `[data-ok-data-grid-pivot-move="${direction === "up" ? "down" : "up"}"]`,
        );
        (button.disabled ? other : button)?.focus();
      },
      { signal },
    );
    const pivotDrag = pivotPanel
      ? createGridPivotDrag(pivotPanel, { onMove: movePivotField })
      : null;
    pivotPanel?.addEventListener(
      "change",
      (event) => {
        const target = event.target as HTMLInputElement | HTMLSelectElement;
        if (target.matches("[data-ok-data-grid-pivot-switch]")) {
          setPivot(pivotModel, (target as HTMLInputElement).checked);
          return;
        }
        // Every other field of the panel is a column's role or function.
        const box = target.closest<HTMLElement>("[data-ok-data-grid-pivot-field]") as HTMLElement;
        const field = box.getAttribute("data-ok-field") as string;
        const [role, fn] = [...box.querySelectorAll("select")] as [
          HTMLSelectElement,
          HTMLSelectElement,
        ];
        setPivot(
          target === role
            ? setGridPivotRole(pivotModel, field, role.value as "rows", fn.value)
            : {
                ...pivotModel,
                values: pivotModel.values.map((v) =>
                  v.field === field ? { ...v, aggFunc: fn.value } : v,
                ),
              },
          pivotOn(),
        );
      },
      { signal },
    );

    // Header filters: a field's value is the first filter item of its column.
    const operatorOf = (field: string) => {
      const type = columns.find((c) => c.field === field)?.type;
      return operators[field]?.[0]?.value ?? (gridFilterOperators(type)[0] as string);
    };
    const setHeaderFilter = (field: string, input: string, operator?: string | null) => {
      const index = filterModel.items.findIndex((item) => item.field === field);
      const current = filterModel.items[index];
      const item = {
        field,
        operator: operator || current?.operator || operatorOf(field),
        value: input,
      };
      setFilter({
        ...filterModel,
        items:
          input === ""
            ? filterModel.items.filter((_, i) => i !== index)
            : index < 0
              ? [...filterModel.items, item]
              : filterModel.items.map((other, i) => (i === index ? item : other)),
      });
    };
    const onHeaderFilter = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.closest("[data-ok-date-picker]")) return;
      const cell = target.closest("[data-ok-filter-field]") as Element;
      // A custom field (renderHeaderFilter) may name its operator.
      setHeaderFilter(
        cell.getAttribute("data-ok-filter-field") as string,
        target.value,
        target.closest("[data-ok-filter-operator]")?.getAttribute("data-ok-filter-operator"),
      );
    };
    headerGroup.addEventListener(
      "input",
      (event) => {
        if ((event.target as Element).closest("[data-ok-data-grid-header-filters]"))
          onHeaderFilter(event);
      },
      { signal },
    );
    headerGroup.addEventListener(
      "change",
      (event) => {
        const target = event.target as Element;
        if (target.tagName === "SELECT" && target.closest("[data-ok-data-grid-header-filters]"))
          onHeaderFilter(event);
      },
      { signal },
    );
    headerGroup.addEventListener(
      "ok:date-picker:change",
      (event) => {
        const cell = (event.target as Element).closest("[data-ok-filter-field]") as Element;
        const picked = (event as CustomEvent<{ value: string | null }>).detail.value;
        setHeaderFilter(cell.getAttribute("data-ok-filter-field") as string, picked ?? "");
      },
      { signal },
    );

    // Cell selection: ranges over the page's data rows and the shown columns.
    const pageIds = () =>
      pageList.filter((row) => !row.hasAttribute("data-ok-generated")).map(idOf);
    const shownFields = () => shownNow.map((c) => c.field);
    const cellsOn = () => element.hasAttribute(cellSelectionOption.attr);
    let cellBase: GridCellSelectionModel = {};
    const setCells = (model: GridCellSelectionModel) =>
      change("cellselection", model, (next) => {
        cellModel = next;
        markCells();
      });
    // Status bar: figures of the selected cells of the page (written only when they change).
    const statusBarEl = element.querySelector<HTMLElement>(
      ":scope > [data-ok-data-grid-status-bar]",
    );
    let statusNow = "";
    const syncStatus = () => {
      if (!statusBarEl) return;
      const on = cellsOn() && element.hasAttribute(statusBarOption.attr);
      const shown = on ? shownNow : [];
      const cells = on
        ? pageList
            .filter((row) => !row.hasAttribute("data-ok-generated"))
            .flatMap((row) =>
              shown
                .filter((column) => isGridCellSelected(cellModel, idOf(row), column.field))
                .map((column) => ({ value: value(row, column.field), column })),
            )
        : [];
      const items = gridStatusItems(
        gridSelectionStats(cells),
        labels,
        document.documentElement.lang || undefined,
      );
      const next = JSON.stringify(items);
      if (next === statusNow) return;
      statusNow = next;
      statusBarEl.replaceChildren(
        ...items.map((item) => {
          const span = document.createElement("span");
          span.setAttribute("data-ok-data-grid-status-item", item.key);
          span.textContent = item.text;
          return span;
        }),
      );
    };
    const markCells = () => {
      syncStatus();
      for (const cell of body.querySelectorAll<HTMLElement>('[role="gridcell"][aria-selected]')) {
        cell.removeAttribute("aria-selected");
        cell.removeAttribute("data-ok-range-edge");
      }
      if (!cellsOn()) return;
      const ids = pageIds();
      const fields = shownFields();
      for (const [rowId, cells] of Object.entries(cellModel)) {
        const row = rowEls.find((r) => idOf(r) === rowId);
        if (!row?.isConnected) continue;
        for (const field of Object.keys(cells)) {
          const cell = cellOf(row, field);
          if (!cell || !isGridCellSelected(cellModel, rowId, field)) continue;
          cell.setAttribute("aria-selected", "true");
          cell.setAttribute(
            "data-ok-range-edge",
            gridCellEdges(cellModel, ids, fields, rowId, field),
          );
        }
      }
    };
    const cellSelection = createGridCellSelection(main, {
      enabled: cellsOn,
      onSelect: (anchor, focus, mode) => {
        const range = gridCellRange(pageIds(), shownFields(), anchor, focus);
        if (mode === "replace") setCells(range);
        else if (anchor.id === focus.id && anchor.field === focus.field) {
          cellBase = cellModel;
          setCells(toggleGridCell(cellModel, focus.id, focus.field));
        } else setCells(mergeGridCellSelection(cellBase, range));
      },
    });

    // Clipboard: the selected cells, else the selected rows, else the focused cell.
    const focusedCell = () =>
      (document.activeElement as Element | null)?.closest<HTMLElement>(
        '[data-ok-data-grid-body] [role="gridcell"][data-ok-field]',
      );
    const clipboard = createGridClipboard(main, {
      copyText: () => {
        const fields = shownNow.filter((c) => c.type !== "actions").map((c) => c.field);
        const picked = cellsOn() ? gridSelectedBlock(cellModel, pageIds(), fields) : null;
        const byRow = (rowId: string) => rowEls.find((r) => idOf(r) === rowId) as HTMLElement;
        let block: string[][] | null = picked?.ids.length
          ? picked.ids.map((rowId) =>
              picked.fields.map((f) =>
                isGridCellSelected(cellModel, rowId, f) ? text(byRow(rowId), f) : "",
              ),
            )
          : null;
        const chosen = sortedList.filter(
          (row) => !row.hasAttribute("data-ok-generated") && selection.includes(idOf(row)),
        );
        if (!block && chosen.length) block = chosen.map((row) => fields.map((f) => text(row, f)));
        const cell = focusedCell();
        const row = cell?.closest<HTMLElement>(ROW);
        if (!block && cell && row && !row.hasAttribute("data-ok-generated"))
          block = [[text(row, cell.getAttribute("data-ok-field") as string)]];
        return block ? gridToTsv(block) : null;
      },
      canPaste: () =>
        !element.hasAttribute(disableClipboardPaste.attr) && columns.some((c) => c.editable),
      onCopy: (data) => emit("clipboardcopy", { data }),
      onPaste: (pasted) => pasteCells(pasted),
    });
    const pasteCells = (pasted: string) => {
      const data = parseGridClipboard(pasted);
      const ids = pageIds();
      const fields = shownFields();
      const picked = cellsOn() ? gridSelectedBlock(cellModel, ids, fields) : null;
      const fill = !!picked?.ids.length && data.length === 1 && data[0]?.length === 1;
      let top = 0;
      let left = 0;
      if (picked?.ids.length) {
        top = ids.indexOf(picked.ids[0] as string);
        left = fields.indexOf(picked.fields[0] as string);
      } else {
        const cell = focusedCell();
        top = ids.indexOf(cell?.closest(ROW)?.getAttribute("data-ok-row-id") ?? "");
        left = fields.indexOf(cell?.getAttribute("data-ok-field") ?? "");
        if (top < 0 || left < 0) return;
      }
      if (!emit("clipboardpaste", { data }, { cancelable: true })) return;
      const rowIds = fill ? (picked as { ids: string[] }).ids : ids.slice(top, top + data.length);
      const changes: GridHistoryChange<DataRow>[] = [];
      rowIds.forEach((rowId, r) => {
        const row = rowEls.find((el) => idOf(el) === rowId) as HTMLElement;
        const targets = fill ? (picked as { fields: string[] }).fields : fields.slice(left);
        const values: DataRow = {};
        targets.forEach((field, c) => {
          const column = columns.find((col) => col.field === field) as GridColumn;
          const typed = fill ? data[0]?.[0] : data[r]?.[c];
          if (typed === undefined || !cellEditable(row, column)) return;
          if (fill && !isGridCellSelected(cellModel, rowId, field)) return;
          values[field] = parseGridEditValue(typed, column.type);
        });
        if (
          !Object.keys(values).length ||
          !emit("edit", { id: rowId, row: values }, { cancelable: true })
        )
          return;
        changes.push({ id: rowId, before: valuesOf(row, Object.keys(values)), after: values });
        writeCells(row, values);
      });
      // One step for the whole paste (MUI X: not with a data source).
      if (!source) recordStep(changes);
      apply();
    };
    /** The values of some fields of a row (as the cells hold them). */
    const valuesOf = (row: HTMLElement, fields: readonly string[]): DataRow =>
      Object.fromEntries(fields.map((field) => [field, value(row, field)]));
    /** Writes values into a row's cells (formatted text, raw value). */
    const writeCells = (row: HTMLElement, values: DataRow) => {
      for (const [field, next] of Object.entries(values)) {
        const cell = cellOf(row, field);
        if (!cell) continue;
        cell.replaceChildren(formatted(field, next));
        cell.removeAttribute("data-ok-text");
        cell.setAttribute("data-ok-value", next === null || next === undefined ? "" : String(next));
      }
    };

    // Undo and redo (MUI X `historyStackSize`): each saved edit, or paste, is one step; every
    // undo and redo goes through a cancelable `ok:data-grid:edit`.
    const historySize = () => readNumber(element, historyStackSize) as number;
    let historyStack = createGridHistoryStack<DataRow>(historySize());
    let historyStackOf = historySize();
    const stackNow = () => {
      if (historySize() !== historyStackOf) {
        historyStackOf = historySize();
        historyStack = createGridHistoryStack<DataRow>(historyStackOf);
      }
      return historyStack;
    };
    const historyOn = () =>
      historySize() > 0 && columns.some((c) => c.editable) && (!source || !!source.updateRow);
    const historyButtons = () =>
      element.querySelectorAll<HTMLButtonElement>("button[data-ok-data-grid-history]");
    const syncHistory = () => {
      const { sizes } = stackNow();
      for (const button of historyButtons())
        button.disabled =
          !historyOn() ||
          sizes[button.getAttribute("data-ok-data-grid-history") === "redo" ? "redo" : "undo"] ===
            0;
    };
    const recordStep = (changes: GridHistoryChange<DataRow>[]) => {
      if (!historyOn()) return;
      stackNow().push({ changes });
      syncHistory();
    };
    /** Applies the last step backwards (undo) or forwards (redo). */
    const travel = (direction: "undo" | "redo"): boolean => {
      const stack = stackNow();
      const step = stack.peek(direction);
      if (!historyOn() || !step) return false;
      const writes = step.changes.map((change) => {
        const row = rowEls.find((el) => idOf(el) === change.id);
        const fields = [...new Set([...Object.keys(change.before), ...Object.keys(change.after)])];
        const next = row && gridHistoryRow(valuesOf(row, fields), change, direction);
        return row && next ? { row, values: next } : null;
      });
      // A row changed elsewhere since the step (or a refused edit): the step can't apply.
      let ok = writes.every(Boolean);
      if (ok)
        for (const write of writes as { row: HTMLElement; values: DataRow }[]) {
          if (!emit("edit", { id: idOf(write.row), row: write.values }, { cancelable: true })) {
            ok = false;
            break;
          }
          const previousRow: DataRow = {
            id: idOf(write.row),
            ...valuesOf(
              write.row,
              columns.map((c) => c.field),
            ),
          };
          writeCells(write.row, write.values);
          if (source?.updateRow) {
            const row = write.row;
            const updatedRow = { ...previousRow, ...write.values };
            Promise.resolve(source.updateRow({ rowId: idOf(row), updatedRow, previousRow }))
              .then((saved) => {
                fillCells(row, saved);
                sourceCache.clear();
              })
              .catch((error: unknown) => {
                fillCells(row, previousRow);
                emit("datasourceerror", { error });
              });
          }
        }
      stack.settle(direction, ok);
      syncHistory();
      apply();
      if (ok) emit(direction, { ids: step.changes.map((change) => change.id) });
      return ok;
    };
    const historyApi: GridHistoryApi = {
      undo: () => Promise.resolve(travel("undo")),
      redo: () => Promise.resolve(travel("redo")),
      clear: () => {
        stackNow().clear();
        syncHistory();
      },
      canUndo: () => historyOn() && stackNow().sizes.undo > 0,
      canRedo: () => historyOn() && stackNow().sizes.redo > 0,
    };
    const historyKeys = createGridHistoryKeys(main, {
      enabled: historyOn,
      undo: () => travel("undo"),
      redo: () => travel("redo"),
    });
    signal.addEventListener("abort", () => historyKeys.destroy());
    element.addEventListener(
      "click",
      (event) => {
        const button = (event.target as Element).closest<HTMLElement>(
          "button[data-ok-data-grid-history]",
        );
        if (!button || !element.contains(button)) return;
        travel(button.getAttribute("data-ok-data-grid-history") === "redo" ? "redo" : "undo");
      },
      { signal },
    );
    syncHistory();

    // Charts integration: the chart follows the rows (or the top-level groups; pivoted grids:
    // their pivot columns) through the Chart's update path (`updateSeries`, option attributes).
    /** The charts: one region, or one per chart id (`data-ok-chart-id`). */
    const chartRegions = () => [
      ...element.querySelectorAll<HTMLElement>(":scope > [data-ok-data-grid-chart]"),
    ];
    const chartKeys = new WeakMap<HTMLElement, string>();
    let chartSeriesCount = 0;
    /** Panel fields show the model (it may come from `setChartModel` or `restoreState`). */
    const syncChartPanel = () => {
      const panel = byId("charts");
      if (!panel) return;
      const chartModel = panelModel();
      const type = chartModel.type ?? "column";
      const select = (suffix: string, value: string) => {
        const field = panel.querySelector<HTMLSelectElement>(`#${CSS.escape(`${id}-${suffix}`)}`);
        if (field && field.value !== value) field.value = value;
      };
      if (activeChart) select("chart-active", activeChart);
      select("chart-type", type);
      select(
        "chart-dimension",
        baseColumns.some((c) => c.field === chartModel.dimension && c.type !== "actions")
          ? (chartModel.dimension as string)
          : "",
      );
      select("chart-legend", chartModel.legend ?? "top");
      for (const input of panel.querySelectorAll<HTMLInputElement>(
        "[data-ok-data-grid-chart-value]",
      ))
        input.checked = (chartModel.values ?? []).includes(
          input.getAttribute("data-ok-data-grid-chart-value") as string,
        );
      const stacked = panel.querySelector<HTMLInputElement>("[data-ok-data-grid-chart-stacked]");
      if (stacked) {
        stacked.checked = !!chartModel.stacked;
        stacked.disabled = !(gridStackableChartTypes.includes(type) && chartSeriesCount > 1);
      }
      const labelsSwitch = panel.querySelector<HTMLInputElement>(
        "[data-ok-data-grid-chart-item-label]",
      );
      if (labelsSwitch) labelsSwitch.checked = chartModel.itemLabel === "value";
    };
    const syncChart = () => {
      for (const region of chartRegions()) {
        const chartId = region.getAttribute("data-ok-chart-id");
        drawChart(
          region,
          chartId ? (chartModels[chartId] ?? {}) : chartModel,
          chartId === activeChart,
        );
      }
      syncChartPanel();
    };
    /** One chart: its data from its model, through the Chart's update path. */
    const drawChart = (chartRegion: HTMLElement, chartModel: GridChartModel, active: boolean) => {
      const figure = chartRegion.querySelector<HTMLElement>("[data-ok-chart]");
      const table = figure?.querySelector<HTMLTableElement>("[data-ok-chart-data]");
      if (!figure || !table) return;
      const chartColumns = baseColumns.filter((c) => c.type !== "actions");
      const candidates = pivot ? columns : chartColumns;
      const fields = gridChartFields(chartModel, candidates);
      const dimension = chartColumns.find((c) => c.field === chartModel.dimension);
      const top =
        grouping().length && !source
          ? sortedList.filter(
              (row) =>
                row.hasAttribute("data-ok-generated") && row.getAttribute("aria-level") === "1",
            )
          : null;
      // Groups aggregate the rows that pass the filters (`filtered`: the data rows shown).
      const pass = top ? new Set(filtered) : null;
      const byRowId = top ? new Map(rowEls.map((row) => [idOf(row), row])) : null;
      const aggregation = activeAggregation();
      const data =
        fields.length && (dimension || top)
          ? top
            ? gridChartData(
                top,
                chartModel,
                candidates,
                (row) => (groupNodes.get(idOf(row)) as GridGroupNode).key,
                (row, field) =>
                  gridAggregate(
                    (groupNodes.get(idOf(row)) as GridGroupNode).leafIds
                      .map((leaf) => byRowId?.get(leaf) as HTMLElement)
                      .filter((leaf) => leaf && pass?.has(leaf)),
                    { [field]: aggregation[field] ?? aggregationModel[field] ?? "sum" },
                    candidates,
                    value,
                  )[field],
              )
            : gridChartData(
                pageList.filter((row) => !row.hasAttribute("data-ok-generated")),
                chartModel,
                candidates,
                (row) => cellText(row, (dimension as GridColumn).field),
                value,
                dimension?.type === "number"
                  ? (row) => cellValue(row, (dimension as GridColumn).field)
                  : undefined,
              )
          : null;
      chartRegion.hidden = !data;
      if (active) chartSeriesCount = data?.series.length ?? 0;
      const { yTitle, ...options } = gridChartOptions(chartModel, data);
      const attributes: Record<string, string> = {
        ...chartAttributes(options),
        ...chartTextAttributes({ yTitle }),
      };
      for (const spec of Object.values(chartOptions.options))
        if (spec.attr.startsWith("data-ok-") && !(spec.attr in attributes))
          figure.removeAttribute(spec.attr);
      if (!yTitle) figure.removeAttribute("data-ok-y-title");
      for (const [name, attr] of Object.entries(attributes))
        if (figure.getAttribute(name) !== attr) figure.setAttribute(name, attr);
      const key = JSON.stringify([data, options.type, options.xType]);
      if (key === chartKeys.get(chartRegion)) return;
      chartKeys.set(chartRegion, key);
      const series = data?.series ?? [];
      const categories = data?.categories ?? [];
      const chart = runtime.getOrCreate<ChartInstance>(figure, "chart");
      if (chart) {
        chart.updateSeries(series, categories);
        return;
      }
      // Without the chart runtime, the data table is the chart: write it.
      const { table: model } = renderChart({
        ...options,
        series,
        categories,
        width: 640,
        height: 320,
        idPrefix: "t",
      });
      const cellEl = (
        tag: string,
        cell: { text: string; attrs: Record<string, string> },
        scope?: string,
      ) => {
        const node = document.createElement(tag);
        if (scope) node.setAttribute("scope", scope);
        for (const [name, attr] of Object.entries(cell.attrs))
          if (name.startsWith("data-ok-")) node.setAttribute(name, attr);
        node.textContent = cell.text;
        return node;
      };
      const head = document.createElement("tr");
      head.append(...model.head.map((cell) => cellEl("th", cell, "col")));
      (table.tHead as HTMLTableSectionElement).replaceChildren(head);
      (table.tBodies[0] as HTMLTableSectionElement).replaceChildren(
        ...model.rows.map((row) => {
          const tr = document.createElement("tr");
          tr.append(
            cellEl("th", row.header, "row"),
            ...row.cells.map((cell) => cellEl("td", cell)),
          );
          return tr;
        }),
      );
    };
    const chartRegion = chartRegions()[0];
    const setChart = (model: GridChartModel) => {
      if (
        !emit("chart", { model, ...(activeChart ? { id: activeChart } : {}) }, { cancelable: true })
      )
        return;
      if (activeChart) {
        chartModels = { ...chartModels, [activeChart]: model };
        element.setAttribute("data-ok-chart-models", JSON.stringify(chartModels));
      } else {
        chartModel = model;
        element.setAttribute("data-ok-chart-model", JSON.stringify(model));
      }
      syncChart();
    };
    const showActiveChart = (chartId: string) => {
      activeChart = gridActiveChartId(chartModels, chartId);
      if (activeChart) element.setAttribute("data-ok-active-chart-id", activeChart);
      syncChart();
    };
    byId("charts")?.addEventListener(
      "change",
      (event) => {
        const target = event.target as HTMLInputElement;
        const chartModel = panelModel();
        const values = chartModel.values ?? [];
        if (target.id === `${id}-chart-active`) {
          if (emit("activechart", { id: target.value }, { cancelable: true }))
            showActiveChart(target.value);
        } else if (target.id === `${id}-chart-type`)
          setChart({ ...chartModel, type: target.value as GridChartType });
        else if (target.id === `${id}-chart-dimension`)
          setChart({ ...chartModel, dimension: target.value || null });
        else if (target.id === `${id}-chart-legend`)
          setChart({ ...chartModel, legend: target.value as GridChartModel["legend"] });
        else if (target.hasAttribute("data-ok-data-grid-chart-stacked"))
          setChart({ ...chartModel, stacked: target.checked });
        else if (target.hasAttribute("data-ok-data-grid-chart-item-label"))
          setChart({ ...chartModel, itemLabel: target.checked ? "value" : "none" });
        else {
          // The panel's other fields are the series switches.
          const field = target.getAttribute("data-ok-data-grid-chart-value") as string;
          const others = values.filter((f) => f !== field);
          setChart({ ...chartModel, values: target.checked ? [...others, field] : others });
        }
        // A refused change (canceled event) puts the fields back.
        syncChartPanel();
      },
      { signal },
    );

    // Filter panel: rows of (logic,) column, operator, value; Add filter clones the first row.
    const filterPanel = byId("filters");
    const filterRows = () => [
      ...(filterPanel?.querySelectorAll<HTMLElement>("[data-ok-data-grid-filter]") ?? []),
    ];
    const partsOf = (row: HTMLElement) => {
      const logic = row.querySelector<HTMLSelectElement>('select[id*="-filter-logic"]');
      const [field, operator] = [...row.querySelectorAll<HTMLSelectElement>("select")].filter(
        (select) => select !== logic,
      ) as [HTMLSelectElement, HTMLSelectElement];
      // isAnyOf with chips: an Autocomplete takes the value field's place; dates: a picker.
      const chips = row.querySelector<HTMLElement>("[data-ok-autocomplete]");
      const date = row.querySelector<HTMLElement>("[data-ok-date-picker]");
      const input = chips || date ? null : (row.querySelector("input") as HTMLInputElement);
      return { logic, field, operator, input, chips, date };
    };
    const anyOfTemplate = filterPanel?.querySelector<HTMLTemplateElement>(
      "template[data-ok-data-grid-any-of]",
    );
    const dateTemplate = filterPanel?.querySelector<HTMLTemplateElement>(
      "template[data-ok-data-grid-date]",
    );
    const dateTimeTemplate = filterPanel?.querySelector<HTMLTemplateElement>(
      "template[data-ok-data-grid-date-time]",
    );
    /** The value field each filter row had before it showed chips or a date picker. */
    const valueBoxes = new WeakMap<HTMLElement, HTMLElement>();
    const chipValues = (chips: HTMLElement) => {
      const values = runtime.getOrCreate<AutocompleteInstance>(chips, "autocomplete")?.value;
      return Array.isArray(values) ? values : values ? [values] : [];
    };
    /** A copy of a template's field, its ids following this row's value field. */
    const fieldFrom = (template: HTMLTemplateElement, from: string, to: string) => {
      const clone = template.content.firstElementChild?.cloneNode(true) as HTMLElement;
      for (const node of [clone, ...clone.querySelectorAll("*")])
        for (const attr of [...node.attributes])
          if (from && attr.value.includes(from)) attr.value = attr.value.replaceAll(from, to);
      return clone;
    };
    /**
     * isAnyOf shows chips, a date column a date picker, a date time column a date time picker,
     * other operators the text field.
     */
    const syncValueField = (row: HTMLElement) => {
      const { field, operator, input, chips, date } = partsOf(row);
      const own = !operators[field.value];
      const type = columns.find((c) => c.field === field.value)?.type;
      const picker = type === "date" ? dateTemplate : type === "dateTime" ? dateTimeTemplate : null;
      const want =
        operator.value === "isAnyOf" && anyOfTemplate && own
          ? anyOfTemplate
          : picker && own && gridOperatorNeedsValue(operator.value)
            ? picker
            : null;
      const now = chips
        ? anyOfTemplate
        : date
          ? date.getAttribute("data-ok-value-type") === "date-time"
            ? dateTimeTemplate
            : dateTemplate
          : null;
      if (want === now) return;
      const box = (input?.closest<HTMLElement>("[data-ok-text-field]") ??
        chips ??
        date) as HTMLElement;
      if (input) valueBoxes.set(row, box);
      // The value field's id: the column field's, with "value" for "field".
      const valueId = field.id.replace("-filter-field", "-filter-value");
      const next = want
        ? fieldFrom(
            want,
            want.getAttribute("data-ok-data-grid-any-of") ??
              want.getAttribute("data-ok-data-grid-date") ??
              (want.getAttribute("data-ok-data-grid-date-time") as string),
            valueId,
          )
        : valueBoxes.get(row);
      if (!next) return;
      box.replaceWith(next);
      if (!want) (next.querySelector("input") as HTMLInputElement).value = "";
    };
    const fillOperators = (operatorSelect: HTMLSelectElement, field: string) => {
      const type = columns.find((c) => c.field === field)?.type;
      const choices = operators[field]
        ? operators[field].map((o) => ({ value: o.value, label: o.label ?? o.value }))
        : gridFilterOperators(type).map((o) => ({
            value: o,
            label: labels.filterOperator[o] ?? o,
          }));
      const current = operatorSelect.value;
      operatorSelect.replaceChildren(
        ...choices.map((choice) => {
          const option = document.createElement("option");
          option.value = choice.value;
          option.textContent = choice.label;
          return option;
        }),
      );
      if (choices.some((c) => c.value === current)) operatorSelect.value = current;
    };
    const readFilters = (): GridFilterModel => {
      const rowsNow = filterRows();
      const logic = rowsNow[1] ? partsOf(rowsNow[1]).logic?.value : undefined;
      return {
        ...filterModel,
        items: rowsNow.map((row) => {
          const { field, operator, input, chips, date } = partsOf(row);
          if (chips)
            return { field: field.value, operator: operator.value, value: chipValues(chips) };
          if (date)
            return {
              field: field.value,
              operator: operator.value,
              value: runtime.getOrCreate<DatePickerInstance>(date, "date-picker")?.value ?? "",
            };
          (input as HTMLInputElement).disabled = !gridOperatorNeedsValue(
            operator.value,
            operators[field.value],
          );
          return {
            field: field.value,
            operator: operator.value,
            value: (input as HTMLInputElement).value,
          };
        }),
        logicOperator: logic === "or" ? "or" : logic === "and" ? "and" : filterModel.logicOperator,
      };
    };
    const renameIds = (row: HTMLElement, index: number) => {
      for (const node of row.querySelectorAll("[id], label[for]")) {
        const attr = node.hasAttribute("id") ? "id" : "for";
        const base = (node.getAttribute(attr) as string).replace(/-\d+$/, "");
        node.setAttribute(attr, index === 0 ? base : `${base}-${index}`);
      }
    };
    const resetRow = (row: HTMLElement) => {
      const { field, operator } = partsOf(row);
      field.selectedIndex = 0;
      fillOperators(operator, field.value);
      syncValueField(row);
      const input = partsOf(row).input;
      if (input) {
        input.value = "";
        input.disabled = false;
      }
    };
    const addFilterRow = () => {
      const rowsNow = filterRows();
      const first = rowsNow[0] as HTMLElement;
      const row = first.cloneNode(true) as HTMLElement;
      // A copy of chips has no runtime: copy the plain value field instead.
      const firstBox = valueBoxes.get(first);
      if (firstBox)
        row
          .querySelector("[data-ok-autocomplete], [data-ok-date-picker]")
          ?.replaceWith(firstBox.cloneNode(true));
      const index = rowsNow.length;
      // The first row has no logic field: add a copy of the column field with and / or.
      const fieldBox = partsOf(row).field.closest("[data-ok-text-field]") as HTMLElement;
      const logicBox = fieldBox.cloneNode(true) as HTMLElement;
      const select = logicBox.querySelector("select") as HTMLSelectElement;
      select.id = `${id}-filter-logic`;
      logicBox.querySelector("label")?.setAttribute("for", select.id);
      for (const label of logicBox.querySelectorAll("label, legend > span"))
        label.textContent = labels.filterPanelLogicOperator;
      select.replaceChildren(
        ...(["and", "or"] as const).map((value) => {
          const option = document.createElement("option");
          option.value = value;
          option.textContent =
            value === "and" ? labels.filterPanelOperatorAnd : labels.filterPanelOperatorOr;
          return option;
        }),
      );
      fieldBox.before(logicBox);
      renameIds(row, index);
      resetRow(row);
      const logic = partsOf(row).logic as HTMLSelectElement;
      logic.value = filterModel.logicOperator ?? "and";
      logic.disabled = index > 1;
      (rowsNow[rowsNow.length - 1] as HTMLElement).after(row);
    };
    filterPanel?.addEventListener(
      "change",
      (event) => {
        const target = event.target as HTMLSelectElement;
        const row = target.closest<HTMLElement>("[data-ok-data-grid-filter]");
        if (row && partsOf(row).field === target)
          fillOperators(partsOf(row).operator, target.value);
        if (row && target.tagName === "SELECT") syncValueField(row);
        if (target.matches('select[id*="-filter-logic"]'))
          for (const other of filterPanel.querySelectorAll<HTMLSelectElement>(
            'select[id*="-filter-logic"]',
          ))
            other.value = target.value;
        setFilter(readFilters());
      },
      { signal },
    );
    filterPanel?.addEventListener("input", () => setFilter(readFilters()), { signal });
    // Chips and date pickers change after their event: read them once it has applied.
    for (const type of ["ok:autocomplete:change", "ok:date-picker:change"])
      filterPanel?.addEventListener(type, () => queueMicrotask(() => setFilter(readFilters())), {
        signal,
      });
    filterPanel?.addEventListener(
      "click",
      (event) => {
        const target = event.target as Element;
        if (target.closest("[data-ok-data-grid-filter-add]")) {
          addFilterRow();
          setFilter(readFilters());
          return;
        }
        const remove = target.closest("[data-ok-data-grid-filter-remove]");
        if (!remove) return;
        const row = remove.closest<HTMLElement>("[data-ok-data-grid-filter]") as HTMLElement;
        const rowsNow = filterRows();
        if (rowsNow.length === 1) {
          resetRow(row);
          setFilter({ ...filterModel, items: [] });
          return;
        }
        row.remove();
        // The first row never has a logic field.
        const first = filterRows()[0] as HTMLElement;
        partsOf(first).logic?.closest("[data-ok-text-field]")?.remove();
        for (const [i, r] of filterRows().entries()) renameIds(r, i);
        setFilter(readFilters());
      },
      { signal },
    );

    // Quick filter.
    element
      .querySelector<HTMLInputElement>("[data-ok-data-grid-quick-filter] input")
      ?.addEventListener(
        "input",
        (event) =>
          setFilter({
            ...filterModel,
            quickFilterValues: gridQuickFilterValues((event.target as HTMLInputElement).value),
          }),
        { signal },
      );

    // Columns panel.
    byId("columns")?.addEventListener(
      "change",
      (event) => {
        const input = event.target as HTMLInputElement;
        const field = input.getAttribute("data-ok-field");
        setVisibility({ ...visibility, [field as string]: input.checked });
      },
      { signal },
    );

    // Density and export menus (ok:menu:select).
    const setDensity = (next: GridDensity) =>
      change("density", next, (model) => {
        element.setAttribute(densityOption.attr, model);
        for (const item of (byId("density") as HTMLElement).querySelectorAll("[data-ok-density]"))
          item.toggleAttribute("data-ok-selected", item.getAttribute("data-ok-density") === model);
      });
    byId("density")?.addEventListener(
      "ok:menu:select",
      (event) => {
        const item = (event as CustomEvent<{ item: Element }>).detail.item;
        setDensity(pick(gridDensities, item.getAttribute("data-ok-density"), "standard"));
      },
      { signal },
    );
    const shownColumns = () =>
      visibleGridColumns(arrangeGridColumns(orderGridColumns(columns, order), pinned), visibility);
    const csvDefaults = () =>
      parseGridExportOptions(element.getAttribute("data-ok-csv-options")) as GridCsvOptions;
    // Exports hold the data rows (filtered, sorted) and columns, also while grouped or pivoted.
    const exportRows = () =>
      sortGridRows(
        filterGridRows(rows(), filterModel, baseColumns, cellValue, cellText, filterOptions()),
        sortModel,
        baseColumns,
        cellValue,
        comparatorOf,
      ).filter((row) => !row.hasAttribute("data-ok-generated"));
    const exportShown = () =>
      visibleGridColumns(
        arrangeGridColumns(orderGridColumns(baseColumns, order), pinned),
        visibility,
      );
    const fileName = (given: string | undefined) =>
      given ?? element.getAttribute("data-ok-export-file-name") ?? "data";
    const toCsv = (given: GridCsvOptions = {}, options = { ...csvDefaults(), ...given }) =>
      gridToCsv(
        gridExportColumns(baseColumns, exportShown(), options),
        exportRows(),
        cellText,
        options,
      );
    const exportCsv = (given: GridCsvOptions = {}, options = { ...csvDefaults(), ...given }) =>
      download(`${fileName(options.fileName)}.csv`, toCsv(options));
    const excelDefaults = () =>
      parseGridExcelOptions(element.getAttribute("data-ok-excel-options"));
    const toExcel = (given: GridExcelOptions = {}, options = { ...excelDefaults(), ...given }) =>
      gridToXlsx(
        gridExportColumns(baseColumns, exportShown(), options),
        exportRows(),
        cellValue,
        cellText,
        options,
      );
    const exportExcel = (
      given: GridExcelOptions = {},
      options = { ...excelDefaults(), ...given },
    ) =>
      download(`${fileName(options.fileName)}.xlsx`, toExcel(options) as BlobPart, GRID_XLSX_TYPE);
    const print = (
      given: GridPrintOptions = {},
      options: GridPrintOptions = {
        ...(parseGridExportOptions(
          element.getAttribute("data-ok-print-options"),
        ) as GridPrintOptions),
        ...given,
      },
    ) => {
      const keep = options.fields ? new Set(options.fields) : null;
      const base = options.allColumns
        ? arrangeGridColumns(orderGridColumns(columns, order), pinned)
        : shownColumns();
      const printed = base.filter((c) => c.type !== "actions" && (!keep || keep.has(c.field)));
      const boxes = checkbox && !!options.includeCheckboxes;
      printGridContent(
        element,
        options.fileName ?? main.getAttribute("aria-label") ?? "",
        (copy) => {
          // Every filtered, sorted row (all pages), not only the rows on screen.
          const copyBody = copy.querySelector("[data-ok-data-grid-body]") as HTMLElement;
          for (const row of sortedList) layoutRow(row);
          copyBody.replaceChildren(
            ...sortedList.map((row) => {
              const clone = copy.ownerDocument.importNode(row, true);
              clone.hidden = false;
              return clone;
            }),
          );
          prepareGridPrint(
            copy,
            options,
            printed.map((c) => c.field),
            gridColumnTemplate(printed, boxes, widths),
          );
        },
      );
    };
    byId("export")?.addEventListener(
      "ok:menu:select",
      (event) => {
        const item = (event as CustomEvent<{ item: Element }>).detail.item;
        const kind = item.getAttribute("data-ok-data-grid-export");
        if (kind === "print") print();
        else if (kind === "excel") exportExcel();
        else exportCsv();
      },
      { signal },
    );

    // Column widths, order and pinning.
    const resize = (field: string, width: number, done: boolean) => {
      const column = columns.find((c) => c.field === field);
      if (!column || element.hasAttribute(disableColumnResize.attr) || !isGridResizable(column))
        return;
      widths = { ...widths, [field]: clampGridWidth(column, width) };
      layout();
      if (done) emit("resize", { field, width: widths[field] });
    };
    const setOrder = (fields: string[]) =>
      change("order", fields, (model) => {
        order = model;
        layout();
        navigation.sync();
      });
    const arrangedFields = () => orderGridColumns(columns, order).map((c) => c.field);
    const setPinned = (model: GridPinnedColumns) =>
      change("pinned", model, (next) => {
        pinned = next;
        layout();
        navigation.sync();
      });
    const columnControls = createGridColumnControls(main, {
      onResize: resize,
      onMove: (field, target) => {
        if (groupPaths.size && !gridCanMoveColumn(groupPaths, field, target)) return;
        setOrder(moveGridColumn(arrangedFields(), field, { to: target }));
      },
      canReorder: () => !element.hasAttribute(disableColumnReorder.attr),
      onAutosize: (field) => autosize({ columns: [field] }),
    });
    const autosize = (options: { columns?: readonly string[]; includeHeaders?: boolean } = {}) => {
      const fields =
        options.columns ??
        shownColumns()
          .filter(isGridResizable)
          .map((c) => c.field);
      for (const field of fields) {
        const column = columns.find((c) => c.field === field);
        if (!column) continue;
        widths = {
          ...widths,
          [field]: clampGridWidth(column, measureGridColumn(main, field, options)),
        };
        emit("resize", { field, width: widths[field] });
      }
      layout();
    };

    // Editing: inputs replace the cell content; Enter commits, Escape cancels. A column's
    // `<template data-ok-data-grid-edit-cell="<field>">` is its own editor (renderEditCell).
    type EditInput = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    interface Edit {
      cell: HTMLElement;
      column: GridColumn;
      /** The field that holds the value (a custom editor may have none: `setEditCellValue`). */
      input: EditInput | null;
      content: Node[];
      /** A value set by `setEditCellValue`, used as it is. */
      value?: { value: unknown } | undefined;
      /** From the column's editor template. */
      custom: boolean;
    }
    let edits: Edit[] = [];
    let editRow: HTMLElement | null = null;
    /** The edited row's values before the editors replaced its cells. */
    let editBefore: DataRow = {};
    const errors = new Map<string, string | true>();
    const cellEditable = (row: HTMLElement, column: GridColumn) =>
      !!column.editable &&
      !row.hasAttribute("data-ok-generated") &&
      cellOf(row, column.field)?.getAttribute("data-ok-editable") !== "false";
    const rowMode = () => element.getAttribute(editMode.attr) === "row";
    const EDIT_FOCUSABLE = "input, select, textarea, button, [contenteditable], [tabindex]";
    /** A column's editor from its template, with its value field. */
    const customEditor = (field: string) => {
      const template = element.querySelector<HTMLTemplateElement>(
        `:scope > template[data-ok-data-grid-edit-cell="${CSS.escape(field)}"]`,
      );
      if (!template) return null;
      const content = template.content.cloneNode(true) as DocumentFragment;
      const input = content.querySelector<EditInput>(
        "input[data-ok-data-grid-edit-input], select[data-ok-data-grid-edit-input], textarea[data-ok-data-grid-edit-input]",
      );
      return { content, input };
    };
    /** The modes models of the edit in progress (MUI X `cellModesModel` / `rowModesModel`). */
    const editModes = () =>
      editRow && edits.length
        ? gridEditModes(
            rowMode() ? "row" : "cell",
            idOf(editRow),
            (edits[0] as Edit).column.field,
            "edit",
          )
        : { cells: {}, rows: {} };
    /** Reports a start or a stop (`ok:data-grid:cellmodes` | `rowmodes`); false: refused. */
    let silentModes = false;
    const reportModes = (
      row: HTMLElement,
      field: string,
      mode: "edit" | "view",
      cancel = false,
    ) => {
      if (silentModes) return true;
      const next = gridEditModes(rowMode() ? "row" : "cell", idOf(row), field, mode, cancel);
      return rowMode()
        ? emit("rowmodes", { model: next.rows }, { cancelable: true })
        : emit("cellmodes", { model: next.cells }, { cancelable: true });
    };
    const startEdit = (
      row: HTMLElement,
      field: string,
      reason?: GridEditStartReason,
      key?: string,
    ) => {
      const column = columns.find((c) => c.field === field);
      if (edits.length || !column || !cellEditable(row, column)) return;
      if (!reportModes(row, field, "edit")) return;
      const targets = rowMode()
        ? visibleGridColumns(columns, visibility).filter((c) => cellEditable(row, c))
        : [column];
      errors.clear();
      editBefore = {
        id: idOf(row),
        ...Object.fromEntries(columns.map((c) => [c.field, value(row, c.field)])),
      };
      editRow = row;
      if (rowMode()) row.setAttribute("data-ok-editing", "");
      edits = targets.map((c) => {
        const cell = cellOf(row, c.field) as HTMLElement;
        const name = c.headerName as string;
        const start = gridEditText(value(row, c.field), c.type);
        const custom = customEditor(c.field);
        let input: EditInput | null;
        if (custom) input = custom.input;
        else if (c.type === "singleSelect") {
          const select = document.createElement("select");
          for (const choice of c.valueOptions ?? []) {
            const option = document.createElement("option");
            option.value = choice;
            option.textContent = choice;
            select.append(option);
          }
          input = select;
        } else {
          const text = document.createElement("input");
          text.type = gridEditInputType(c.type);
          input = text;
        }
        if (input instanceof HTMLInputElement && input.type === "checkbox")
          input.checked = start === "true";
        else if (input) input.value = start;
        // A typed character replaces the value (text-like fields only).
        if (key !== undefined && c.field === field && input instanceof HTMLInputElement)
          if (input.type !== "checkbox") input.value = key;
        if (!custom && input) {
          input.setAttribute("data-ok-data-grid-edit-input", "");
          input.setAttribute("aria-label", `${labels.editLabel} ${name}`);
        }
        const content = [...cell.childNodes];
        if (custom) cell.replaceChildren(custom.content);
        else cell.replaceChildren(input as EditInput);
        cell.setAttribute("data-ok-editing", "");
        return { cell, column: c, input, content, custom: !!custom };
      });
      // The started cell is always among the edits (shown and editable).
      const first = edits.find((e) => e.column.field === field) as Edit;
      const focus = first.input ?? first.cell.querySelector<HTMLElement>(EDIT_FOCUSABLE);
      focus?.focus();
      if (
        key !== undefined &&
        first.input instanceof HTMLInputElement &&
        first.input.type === "text"
      )
        first.input.setSelectionRange(first.input.value.length, first.input.value.length);
      if (reason !== undefined)
        emit("editstart", rowMode() ? { id: idOf(row), reason } : { id: idOf(row), field, reason });
    };
    const editText = (input: EditInput) =>
      input instanceof HTMLInputElement && input.type === "checkbox"
        ? String(input.checked)
        : input.value;
    /** The value of an edited field: the one `setEditCellValue` set, else the field's, parsed. */
    const editValue = (edit: Edit) =>
      edit.value
        ? edit.value.value
        : edit.input
          ? parseGridEditValue(editText(edit.input), edit.column.type)
          : value(editRow as HTMLElement, edit.column.field);
    /** Cells of a row from a data row (text, formatted). */
    const fillCells = (row: HTMLElement, item: DataRow) => {
      for (const column of columns) {
        if (!(column.field in item)) continue;
        const cell = cellOf(row, column.field);
        if (!cell || cell.hasAttribute("data-ok-editing")) continue;
        const raw = item[column.field];
        cell.replaceChildren(formatted(column.field, raw));
        cell.setAttribute("data-ok-value", raw === null || raw === undefined ? "" : String(raw));
      }
    };
    /** `ok:data-grid:validate`: a listener sets `detail.error` (true or a message). */
    const validate = (edit: Edit) => {
      const detail: { id: string; field: string; value: unknown; error?: string | boolean } = {
        id: idOf(editRow as HTMLElement),
        field: edit.column.field,
        value: editValue(edit),
      };
      emit("validate", detail);
      const message = edit.cell.querySelector<HTMLElement>("[data-ok-data-grid-edit-error]");
      if (detail.error) {
        errors.set(edit.column.field, detail.error === true ? true : String(detail.error));
        edit.input?.setAttribute("aria-invalid", "true");
      } else {
        errors.delete(edit.column.field);
        edit.input?.removeAttribute("aria-invalid");
      }
      const text = typeof detail.error === "string" ? detail.error : "";
      if (!text) {
        message?.remove();
        edit.input?.removeAttribute("aria-describedby");
        return;
      }
      const errorId = `${id || "grid"}-${idOf(editRow as HTMLElement)}-${edit.column.field}-error`;
      const span = message ?? document.createElement("span");
      span.setAttribute("data-ok-data-grid-edit-error", "");
      span.setAttribute("role", "alert");
      span.id = errorId;
      span.textContent = text;
      if (!message) edit.cell.append(span);
      edit.input?.setAttribute("aria-describedby", errorId);
    };
    const stopEdit = (
      commit: boolean,
      focusField?: string,
      reason?: "enterKeyDown" | "escapeKeyDown" | "cellFocusOut",
    ) => {
      // A value with an error keeps the cell open (Escape still cancels).
      if (commit && errors.size > 0) return;
      const done = edits;
      const row = editRow as HTMLElement;
      if (!reportModes(row, (done[0] as Edit).column.field, "view", !commit)) return;
      errors.clear();
      const previousRow: DataRow = { ...editBefore };
      const values = Object.fromEntries(done.map((edit) => [edit.column.field, editValue(edit)]));
      edits = [];
      editRow = null;
      row.removeAttribute("data-ok-editing");
      if (reason !== undefined)
        emit(
          "editstop",
          rowMode()
            ? { id: idOf(row), reason }
            : { id: idOf(row), field: (done[0] as Edit).column.field, reason },
        );
      const accepted = commit && emit("edit", { id: idOf(row), row: values }, { cancelable: true });
      for (const { cell, column, content } of done) {
        cell.removeAttribute("data-ok-editing");
        if (!accepted) {
          cell.replaceChildren(...content);
          continue;
        }
        const next = values[column.field];
        cell.replaceChildren(formatted(column.field, next));
        cell.removeAttribute("data-ok-text");
        cell.setAttribute("data-ok-value", next === null || next === undefined ? "" : String(next));
      }
      if (accepted)
        recordStep([
          {
            id: idOf(row),
            before: Object.fromEntries(Object.keys(values).map((f) => [f, previousRow[f]])),
            after: values,
          },
        ]);
      // A data source saves the row; its answer is shown, a failure brings the old values back.
      if (accepted && source?.updateRow) {
        const updatedRow = { ...previousRow, ...values };
        Promise.resolve(source.updateRow({ rowId: idOf(row), updatedRow, previousRow }))
          .then((saved) => {
            fillCells(row, saved);
            sourceCache.clear();
          })
          .catch((error: unknown) => {
            fillCells(row, previousRow);
            emit("datasourceerror", { error });
          });
      }
      // Re-sorting moves rows, which drops the focus: apply first, then focus the cell.
      if (accepted) apply();
      (cellOf(row, focusField ?? (done[0] as Edit).column.field) as HTMLElement).focus();
    };
    /** The edit whose editor an event happened in (inside the cell, not on the cell itself). */
    const editAt = (target: EventTarget | null) =>
      target instanceof Node
        ? edits.find((edit) => edit.cell !== target && edit.cell.contains(target))
        : undefined;
    main.addEventListener(
      "dblclick",
      (event) => {
        const cell = (event.target as Element).closest<HTMLElement>('[role="gridcell"]');
        const row = cell?.closest<HTMLElement>(ROW);
        if (!cell || !row) return;
        const field = cell.getAttribute("data-ok-field") as string;
        emit("rowdoubleclick", { id: idOf(row) });
        emit("celldoubleclick", { id: idOf(row), field, value: value(row, field) });
        if (!cell.hasAttribute("data-ok-editing")) startEdit(row, field, "cellDoubleClick");
      },
      { signal },
    );
    for (const type of ["input", "change"])
      main.addEventListener(
        type,
        (event) => {
          const edit = editAt(event.target);
          // Built-in fields report every change as `input`; custom editors may only fire `change`.
          if (!edit || (type === "change" && !edit.custom)) return;
          // A custom editor's own field: its typed value replaces one set from code.
          if (edit.input && event.target === edit.input) edit.value = undefined;
          validate(edit);
        },
        { signal },
      );
    main.addEventListener(
      "keydown",
      (event) => {
        const edit = editAt(event.target);
        if (!edit || (event.key !== "Enter" && event.key !== "Escape")) return;
        event.preventDefault();
        stopEdit(
          event.key === "Enter",
          edit.column.field,
          event.key === "Enter" ? "enterKeyDown" : "escapeKeyDown",
        );
      },
      { signal },
    );
    main.addEventListener(
      "focusout",
      (event) => {
        const edit = editAt(event.target);
        if (!edit) return;
        const next = event.relatedTarget as Node | null;
        // Row mode ends when the focus leaves the row, cell mode when it leaves the cell.
        const scope = rowMode() ? editRow : edit.cell;
        if (!scope?.contains(next)) stopEdit(true, undefined, "cellFocusOut");
      },
      { signal },
    );
    /** Starts or stops an edit from code (no reasons; refused like a user's). */
    const editFromModes = (target: GridEditTarget | null, cancelled: (id: string) => boolean) => {
      const current = editRow;
      if (
        current &&
        (!target ||
          target.id !== idOf(current) ||
          (target.field !== null && target.field !== (edits[0] as Edit).column.field))
      )
        stopEdit(!cancelled(idOf(current)));
      if (!target || edits.length) return;
      const row = rowEls.find((r) => idOf(r) === target.id && r.isConnected);
      if (!row) return;
      const field =
        target.field ??
        (target.fieldToFocus &&
        columns.some((c) => c.field === target.fieldToFocus && cellEditable(row, c))
          ? target.fieldToFocus
          : visibleGridColumns(columns, visibility).find((c) => cellEditable(row, c))?.field);
      if (field) startEdit(row, field);
    };
    /** `setCellModesModel` / `setRowModesModel`: no events. */
    const applyModes = (target: GridEditTarget | null, cancelled: (id: string) => boolean) => {
      silentModes = true;
      try {
        editFromModes(target, cancelled);
      } finally {
        silentModes = false;
      }
    };

    // Column menu: one menu, anchored to the header's button.
    const columnMenu = byId("column-menu");
    let menuField: string | null = null;
    let menuButton: Element | null = null;
    const openColumnMenu = (field: string, button: Element | null) => {
      if (!columnMenu || !button) return;
      menuField = field;
      menuButton = button;
      const column = columns.find((c) => c.field === field) as GridColumn;
      const sorted = sortModel.find((s) => s.field === field)?.sort;
      const disable = (action: string, off: boolean) => {
        const item = columnMenu.querySelector(`[data-ok-data-grid-action="${action}"]`);
        if (off) item?.setAttribute("aria-disabled", "true");
        else item?.removeAttribute("aria-disabled");
      };
      disable("asc", !isGridSortable(column) || sorted === "asc");
      disable("desc", !isGridSortable(column) || sorted === "desc");
      disable("unsort", !sorted);
      // Sort items outside the column's cycle are hidden.
      const cycle = sortCycle(column);
      for (const [action, direction] of [
        ["asc", "asc"],
        ["desc", "desc"],
        ["unsort", null],
      ] as const) {
        const item = columnMenu.querySelector<HTMLElement>(
          `[data-ok-data-grid-action="${action}"]`,
        );
        if (item) item.hidden = !cycle.includes(direction);
      }
      disable("filter", column.filterable === false || column.type === "actions");
      disable("hide", column.hideable === false);
      const fieldsNow = arrangedFields();
      disable("left", fieldsNow.indexOf(field) <= 0);
      disable("right", fieldsNow.indexOf(field) >= fieldsNow.length - 1);
      disable("pin-left", gridPinSide(pinned, field) === "left");
      disable("pin-right", gridPinSide(pinned, field) === "right");
      disable("unpin", !gridPinSide(pinned, field));
      // Row grouping and aggregation: the item names the column; functions follow its type.
      const groupItem = columnMenu.querySelector('[data-ok-data-grid-action="group"]');
      if (groupItem)
        groupItem.textContent = (
          rowGrouping.includes(field) ? labels.columnMenuUngroup : labels.columnMenuGroupBy
        )
          .replace("{name}", column.headerName || field)
          .trim();
      disable("group", column.groupable === false || column.type === "actions");
      const functions = gridAggregationFunctionsFor(column);
      const currentFn = activeAggregation()[field] ?? "none";
      for (const item of columnMenu.querySelectorAll<HTMLElement>(
        '[data-ok-data-grid-action^="aggregate-"]',
      )) {
        const fn = (item.getAttribute("data-ok-data-grid-action") as string).slice(10);
        item.hidden = !functions.length || (fn !== "none" && !functions.includes(fn));
        item.toggleAttribute("data-ok-selected", fn === currentFn);
      }
      button.setAttribute("aria-expanded", "true");
      runtime.getOrCreate<PopoverInstance>(columnMenu, "popover")?.open(button);
    };
    columnMenu?.addEventListener(
      "ok:popover:close",
      () => {
        menuButton?.setAttribute("aria-expanded", "false");
      },
      { signal },
    );
    columnMenu?.addEventListener(
      "ok:menu:select",
      (event) => {
        const field = menuField as string;
        const action = (event as CustomEvent<{ item: Element }>).detail.item.getAttribute(
          "data-ok-data-grid-action",
        );
        if (action === "asc" || action === "desc")
          change("sort", [{ field, sort: action }] as GridSortModel, (model) => {
            sortModel = model;
            refresh();
          });
        else if (action === "unsort")
          change(
            "sort",
            sortModel.filter((s) => s.field !== field),
            (model) => {
              sortModel = model;
              refresh();
            },
          );
        else if (action === "hide") setVisibility({ ...visibility, [field]: false });
        else if (action === "group")
          setRowGrouping(
            rowGrouping.includes(field)
              ? rowGrouping.filter((f) => f !== field)
              : [...rowGrouping, field],
          );
        else if (action?.startsWith("aggregate-")) {
          const fn = action.slice(10);
          const next = { ...aggregationModel };
          if (fn === "none") delete next[field];
          else next[field] = fn;
          setAggregation(next);
        } else if (action === "left" || action === "right") {
          const fieldsNow = arrangedFields();
          const neighbour = fieldsNow[fieldsNow.indexOf(field) + (action === "left" ? -1 : 1)];
          if (groupPaths.size && !gridCanMoveColumn(groupPaths, field, neighbour as string)) return;
          setOrder(moveGridColumn(fieldsNow, field, action === "left" ? -1 : 1));
        } else if (action === "pin-left" || action === "pin-right" || action === "unpin")
          setPinned(
            pinGridColumn(
              pinned,
              field,
              action === "unpin" ? null : action === "pin-left" ? "left" : "right",
            ),
          );
        else if (action === "filter") {
          // The menu offers Filter and Manage columns only with the toolbar (its panels).
          const first = partsOf(filterRows()[0] as HTMLElement);
          first.field.value = field;
          fillOperators(first.operator, field);
          setFilter(readFilters());
          runtime
            .getOrCreate<PopoverInstance>(filterPanel as HTMLElement, "popover")
            ?.open(element.querySelector(`[data-ok-popover-open="${id}-filters"]`) as Element);
        } else
          runtime
            .getOrCreate<PopoverInstance>(byId("columns") as HTMLElement, "popover")
            ?.open(element.querySelector(`[data-ok-popover-open="${id}-columns"]`) as Element);
      },
      { signal },
    );

    // Pointer: header sorting, menu buttons, row selection, checkboxes.
    element.addEventListener(
      "click",
      (event) => {
        const target = event.target as Element;
        const treeToggle = target.closest("[data-ok-data-grid-tree-toggle]");
        if (treeToggle) {
          toggleExpansion(treeToggle.closest<HTMLElement>(ROW) as HTMLElement);
          return;
        }
        const detailToggle = target.closest("[data-ok-data-grid-detail-toggle]");
        if (detailToggle) {
          toggleDetail(detailToggle.closest<HTMLElement>(ROW) as HTMLElement);
          return;
        }
        const menu = target.closest("[data-ok-data-grid-menu-button]");
        if (menu) {
          openColumnMenu(
            menu.closest('[role="columnheader"]')?.getAttribute("data-ok-field") as string,
            menu,
          );
          return;
        }
        const header = target.closest<HTMLElement>('[role="columnheader"]');
        if (header && main.contains(header) && !target.closest(INTERACTIVE)) {
          // A press that resized or moved the column doesn't sort it.
          if (header.hasAttribute("data-ok-just-dragged")) return;
          const field = header.getAttribute("data-ok-field") as string;
          emit("columnheaderclick", { field });
          sortBy(field, (event as MouseEvent).shiftKey);
          return;
        }
        const row = target.closest<HTMLElement>(ROW);
        if (!row || !main.contains(row)) return;
        emit("rowclick", { id: idOf(row) });
        const cell = target.closest<HTMLElement>('[role="gridcell"]');
        const field = cell?.getAttribute("data-ok-field");
        if (field) emit("cellclick", { id: idOf(row), field, value: value(row, field) });
        if (
          checkbox &&
          !element.hasAttribute(disableRowSelectionOnClick.attr) &&
          !target.closest(INTERACTIVE)
        )
          toggle(row);
      },
      { signal },
    );
    main.addEventListener(
      "change",
      (event) => {
        const box = (event.target as Element).closest(
          '[data-ok-data-grid-checkbox] input[type="checkbox"]',
        );
        if (!box) return;
        const row = box.closest<HTMLElement>(ROW);
        if (row) toggle(row);
        else select(toggleGridRows(selection, allRows().map(idOf)));
        mark();
      },
      { signal },
    );
    element.addEventListener(
      "ok:table-pagination:change",
      (event) => {
        const detail = (event as CustomEvent<{ page: number; rowsPerPage: number }>).detail;
        page = detail.page;
        pageSize = detail.rowsPerPage === -1 ? Number.POSITIVE_INFINITY : detail.rowsPerPage;
        // The pagination applies its own page after this event.
        queueMicrotask(refresh);
      },
      { signal },
    );

    // Options set on the root later (density, column menu) are reflected in their parts.
    const reflect = () => {
      const density = element.getAttribute(densityOption.attr);
      for (const item of byId("density")?.querySelectorAll("[data-ok-density]") ?? [])
        item.toggleAttribute("data-ok-selected", item.getAttribute("data-ok-density") === density);
      const noMenu = element.hasAttribute(disableColumnMenu.attr);
      for (const button of headerRow.querySelectorAll<HTMLElement>(
        "[data-ok-data-grid-menu-button]",
      ))
        button.hidden = noMenu;
      if (columnMenu) columnMenu.hidden = noMenu;
      // Turned-off features hide their parts, as React leaves them out.
      const off = (attr: string, selector: string) => {
        for (const part of element.querySelectorAll<HTMLElement>(selector))
          part.hidden = element.hasAttribute(attr);
      };
      off(disableColumnResize.attr, "[data-ok-data-grid-resize]");
      off(
        disableColumnReorder.attr,
        '[data-ok-data-grid-action="left"], [data-ok-data-grid-action="right"]',
      );
      off(
        disableColumnPinning.attr,
        '[data-ok-data-grid-action="pin-left"], [data-ok-data-grid-action="pin-right"], [data-ok-data-grid-action="unpin"]',
      );
      off(disableMultipleColumnsFiltering.attr, "[data-ok-data-grid-filter-add]");
      if (checkbox) {
        if (multiple()) main.setAttribute("aria-multiselectable", "true");
        else main.removeAttribute("aria-multiselectable");
      }
      // A row height of the grid (with the density factor), through CSSOM.
      rootVars = syncCustomProperties(
        element,
        element.hasAttribute(rowHeightOption.attr)
          ? { "--_ok-data-grid-row-height": `${baseHeight()}px` }
          : {},
        rootVars,
      );
      syncOverlays(rows().length);
    };
    let rootVars: string[] = [];
    let listNow = element.hasAttribute(listView.attr);
    let pivotNow = pivotOn();
    let columnModeNow = readStyle(element, rowGroupingColumnMode);
    let positionsNow = element.getAttribute("data-ok-aggregation-position");
    let pagingNow = paging();
    const options = new MutationObserver(() => {
      reflect();
      if (pivotOn() !== pivotNow) {
        pivotNow = pivotOn();
        showPivot();
      }
      if (readStyle(element, rowGroupingColumnMode) !== columnModeNow) {
        columnModeNow = readStyle(element, rowGroupingColumnMode);
        syncGroupColumns();
        apply();
      }
      if (element.getAttribute("data-ok-aggregation-position") !== positionsNow) {
        positionsNow = element.getAttribute("data-ok-aggregation-position");
        apply();
      }
      // Pages on or off: the rows page again; the footer's counts follow.
      if (paging() !== pagingNow) {
        pagingNow = paging();
        apply();
      } else syncFooter();
      markCells();
      // List view: column cells and headers hide, list cells show.
      if (element.hasAttribute(listView.attr) !== listNow) {
        listNow = !listNow;
        layout();
        draw();
        navigation.sync();
      }
    });
    options.observe(element, {
      attributes: true,
      attributeFilter: [
        densityOption.attr,
        disableColumnMenu.attr,
        disableColumnResize.attr,
        disableColumnReorder.attr,
        disableColumnPinning.attr,
        disableMultipleColumnsFiltering.attr,
        loadingOption.attr,
        disableMultipleRowSelection.attr,
        rowHeightOption.attr,
        listView.attr,
        pivotActiveOption.attr,
        cellSelectionOption.attr,
        rowGroupingColumnMode.attr,
        "data-ok-aggregation-position",
        hideFooterPagination.attr,
        hideFooterRowCount.attr,
        hideFooterSelectedRowCount.attr,
      ],
    });

    for (const row of filterRows()) fillOperators(partsOf(row).operator, partsOf(row).field.value);
    styleRows();
    syncGroupColumns();
    layout();
    if (pivotOn()) showPivot();
    else apply();
    reflect();
    scrollWatcher.measure();
    if (element.hasAttribute(autosizeOnMount.attr)) {
      autosize();
      // Again once web fonts are in: text widths change with the font.
      document.fonts?.ready.then(() => {
        if (!signal.aborted) autosize();
      });
    }

    return {
      get sortModel() {
        return sortModel;
      },
      get filterModel() {
        return filterModel;
      },
      get selection() {
        return [...selection];
      },
      get columnVisibilityModel() {
        return { ...visibility };
      },
      get columnOrder() {
        return arrangedFields();
      },
      get pinnedColumns() {
        return { left: [...(pinned.left ?? [])], right: [...(pinned.right ?? [])] };
      },
      get columnWidths() {
        return { ...widths };
      },
      setColumnOrder(fields) {
        order = [...fields];
        layout();
      },
      setPinnedColumns(model) {
        pinned = { ...model };
        layout();
      },
      setColumnWidth(field, width) {
        resize(field, width, false);
      },
      setSortModel(model) {
        sortModel = model;
        apply();
      },
      setFilterModel(model) {
        filterModel = model;
        apply();
      },
      setSelection(ids) {
        selection = [...ids];
        mark();
      },
      setColumnVisibilityModel(model) {
        visibility = { ...model };
        layout();
        navigation.sync();
      },
      toCsv,
      exportCsv,
      print,
      autosizeColumns: autosize,
      scrollToIndexes({ rowIndex, colIndex }) {
        if (rowIndex !== undefined && rowIndex >= 0 && rowIndex < pageList.length) {
          const step = viewport?.rowHeight || baseHeight() + 1;
          const top = offsets ? (offsets[rowIndex] as number) : rowIndex * step;
          const height = offsets ? (offsets[rowIndex + 1] as number) - top : step;
          const header = main.querySelector<HTMLElement>(
            "[data-ok-data-grid-header]",
          ) as HTMLElement;
          const visible = main.clientHeight - header.offsetHeight;
          if (top < main.scrollTop) main.scrollTop = top;
          else if (top + height > main.scrollTop + visible) main.scrollTop = top + height - visible;
        }
        const column = colIndex === undefined ? undefined : shownColumns()[colIndex];
        const cell = column ? headerOf(column.field) : null;
        if (cell) {
          const left = cell.offsetLeft;
          if (left < main.scrollLeft) main.scrollLeft = left;
          else if (left + cell.offsetWidth > main.scrollLeft + main.clientWidth)
            main.scrollLeft = left + cell.offsetWidth - main.clientWidth;
        }
      },
      exportState: () => ({
        sorting: { sortModel: [...sortModel] },
        filter: { filterModel },
        pagination: {
          paginationModel: { page, pageSize: Number.isFinite(pageSize) ? pageSize : -1 },
        },
        columns: {
          columnVisibilityModel: { ...visibility },
          orderedFields: arrangedFields(),
          dimensions: Object.fromEntries(
            Object.entries(widths).map(([f, width]) => [f, { width }]),
          ),
        },
        pinnedColumns: { left: [...(pinned.left ?? [])], right: [...(pinned.right ?? [])] },
        density: pick(gridDensities, element.getAttribute(densityOption.attr), "standard"),
        ...(rowGrouping.length ? { rowGrouping: { model: [...rowGrouping] } } : {}),
        ...(Object.keys(aggregationModel).length
          ? { aggregation: { model: { ...aggregationModel } } }
          : {}),
        ...(pivotPanel ? { pivoting: { model: pivotModel, active: pivotOn() } } : {}),
        ...(chartRegion
          ? {
              chartsIntegration: {
                model: chartModel,
                ...(activeChart ? { charts: chartModels, activeChartId: activeChart } : {}),
              },
            }
          : {}),
      }),
      restoreState(input) {
        const state = sanitizeGridState(input);
        if (state.sorting?.sortModel) sortModel = state.sorting.sortModel;
        if (state.filter?.filterModel) filterModel = state.filter.filterModel;
        const paging = state.pagination?.paginationModel;
        if (paging) {
          // The pagination reports each change (resetting the page): set the target after.
          const target = paging.page ?? page;
          if (paging.pageSize !== undefined) {
            pageSize = paging.pageSize;
            pager()?.setRowsPerPage(pageSize);
          }
          page = target;
          pager()?.setPage(target);
        }
        if (state.columns?.columnVisibilityModel) visibility = state.columns.columnVisibilityModel;
        if (state.columns?.orderedFields) order = state.columns.orderedFields;
        const dimensions = state.columns?.dimensions;
        if (dimensions)
          widths = Object.fromEntries(Object.entries(dimensions).map(([f, d]) => [f, d.width]));
        if (state.pinnedColumns) pinned = state.pinnedColumns;
        if (state.density) element.setAttribute(densityOption.attr, state.density);
        if (state.aggregation?.model) aggregationModel = state.aggregation.model;
        if (state.chartsIntegration?.model) chartModel = state.chartsIntegration.model;
        if (state.chartsIntegration?.charts) chartModels = state.chartsIntegration.charts;
        if (state.chartsIntegration?.charts || state.chartsIntegration?.activeChartId)
          activeChart = gridActiveChartId(
            chartModels,
            state.chartsIntegration.activeChartId ?? activeChart,
          );
        if (state.pivoting?.model) pivotModel = state.pivoting.model;
        if (state.pivoting?.active !== undefined)
          element.toggleAttribute(pivotActiveOption.attr, state.pivoting.active);
        if (state.rowGrouping?.model) {
          rowGrouping = state.rowGrouping.model;
          syncGroupColumns();
        }
        if (state.pivoting) showPivot();
        layout();
        refresh();
      },
      setFilterOperators(field, list) {
        operators[field] = list;
        for (const row of filterRows())
          if (partsOf(row).field.value === field) fillOperators(partsOf(row).operator, field);
        apply();
      },
      get cellModesModel() {
        return rowMode() ? {} : editModes().cells;
      },
      get rowModesModel() {
        return rowMode() && editRow && edits.length
          ? { [idOf(editRow)]: { mode: "edit" as const } }
          : {};
      },
      setCellModesModel(model) {
        if (rowMode()) return;
        const cells = sanitizeGridCellModes(model);
        applyModes(gridEditTarget(cells, {}, "cell"), (rowId) =>
          Object.values(cells[rowId] ?? {}).some((entry) => entry.ignoreModifications === true),
        );
      },
      setRowModesModel(model) {
        if (!rowMode()) return;
        const rowsModel = sanitizeGridRowModes(model);
        applyModes(
          gridEditTarget({}, rowsModel, "row"),
          (rowId) => rowsModel[rowId]?.ignoreModifications === true,
        );
      },
      history: historyApi,
      setEditCellValue({ id: rowId, field, value: next }) {
        if (!editRow || idOf(editRow) !== rowId) return;
        const edit = edits.find((e) => e.column.field === field);
        if (!edit) return;
        edit.value = { value: next };
        const text = gridEditText(next, edit.column.type);
        if (edit.input instanceof HTMLInputElement && edit.input.type === "checkbox")
          edit.input.checked = text === "true";
        else if (edit.input) edit.input.value = text;
        validate(edit);
      },
      setSortComparator(field, own) {
        if (own) comparators.set(field, own);
        else comparators.delete(field);
        refresh();
      },
      setValueFormatter(field, format) {
        if (format) formatters.set(field, format);
        else formatters.delete(field);
      },
      setGroupingValueGetter(field, getter) {
        if (getter) groupingGetters.set(field, getter);
        else groupingGetters.delete(field);
        apply();
      },
      setLocaleText(next) {
        labels = { ...gridDefaultLabels, ...next };
        for (const row of filterRows())
          fillOperators(partsOf(row).operator, partsOf(row).field.value);
        if (next.paginationDisplayedRows)
          pagination?.setAttribute("data-ok-label-displayed-rows", next.paginationDisplayedRows);
        else pagination?.removeAttribute("data-ok-label-displayed-rows");
        pager()?.refresh();
        syncOverlays(rows().length);
        syncFooter();
      },
      setRowChildrenExpansion(rowId, expanded) {
        const row = rows().find((r) => idOf(r) === rowId);
        if (row) toggleExpansion(row, expanded);
      },
      toggleDetailPanel(rowId) {
        const row = rows().find((r) => idOf(r) === rowId);
        if (row) toggleDetail(row);
      },
      setRows(data) {
        buildRows(data);
      },
      setDataSource(next) {
        source = next;
        // A new source: lazily loaded rows belonged to the old one.
        lazyLoaded.clear();
        lazyState.key = "";
        sourceCount = undefined;
        sourceCache.clear();
        if (next) load();
        else apply();
      },
      get rowGroupingModel() {
        return [...rowGrouping];
      },
      get aggregationModel() {
        return { ...aggregationModel };
      },
      get pivotModel() {
        return pivotModel;
      },
      get pivotActive() {
        return pivotOn();
      },
      get cellSelectionModel() {
        return cellModel;
      },
      get chartModels() {
        return chartModels;
      },
      get activeChartId() {
        return activeChart;
      },
      setChartModels(models) {
        chartModels = sanitizeGridChartModels(models);
        element.setAttribute("data-ok-chart-models", JSON.stringify(chartModels));
        showActiveChart(activeChart ?? "");
      },
      setActiveChartId(chartId) {
        showActiveChart(chartId);
      },
      get chartModel() {
        return panelModel();
      },
      setRowGroupingModel(model) {
        rowGrouping = [...model];
        commitGrouping();
      },
      setAggregationModel(model) {
        aggregationModel = parseGridAggregationModel(JSON.stringify(model));
        commitAggregation();
      },
      setPivotModel(model) {
        pivotModel = sanitizeGridPivotModel(model);
        element.setAttribute("data-ok-pivot-model", JSON.stringify(pivotModel));
        if (pivot) showPivot();
      },
      setPivotActive(active) {
        element.toggleAttribute(pivotActiveOption.attr, active);
        showPivot();
      },
      setPivotDerivedColumns(getter) {
        deriveColumns = getter;
        syncDerived();
        if (pivot) showPivot();
        else syncPivotPanel();
      },
      setCellSelectionModel(model) {
        cellModel = sanitizeGridCellSelection(model);
        markCells();
      },
      setChartModel(model) {
        if (activeChart)
          chartModels = { ...chartModels, [activeChart]: sanitizeGridChartModel(model) };
        else chartModel = sanitizeGridChartModel(model);
        syncChart();
      },
      toExcel,
      exportExcel,
      destroy() {
        cellSelection.destroy();
        clipboard.destroy();
        options.disconnect();
        scrollWatcher.destroy();
        columnControls.destroy();
        rowReorder.destroy();
        pivotDrag?.destroy();
        clearTimeout(lazyState.timer as number);
        navigation.destroy();
        syncCustomProperties(main, {}, written);
        syncCustomProperties(element, {}, rootVars);
      },
    };
  },
});
