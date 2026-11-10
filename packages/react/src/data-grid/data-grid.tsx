"use client";

import {
  arrangeGridColumns,
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
  dataGridAttributes,
  filterGridRows,
  formatIsoDate,
  formatIsoDateTime,
  GRID_AGGREGATION_ROOT_ID,
  GRID_CHECKBOX_FIELD,
  GRID_CHECKBOX_WIDTH,
  GRID_GROUPING_FIELD,
  GRID_SORTING_ORDER,
  GRID_TREE_FIELD,
  GRID_XLSX_TYPE,
  type GridAggregationFunction,
  type GridAggregationModel,
  type GridCellModesModel,
  type GridCellSelectionModel,
  type GridChartModel,
  type GridChartModels,
  type GridChartType,
  type GridColumn,
  type GridColumnGroup,
  type GridColumnVisibilityModel,
  type GridColumnWidths,
  type GridCsvOptions,
  type GridDataSource,
  type GridDataSourceCache,
  type GridDensity,
  type GridEditStartReason,
  type GridExcelOptions,
  type GridFilterItem,
  type GridFilterModel,
  type GridFilterOperator,
  type GridGroupNode,
  type GridHistoryApi,
  type GridHistoryChange,
  type GridHistoryStack,
  type GridLabels,
  type GridNavigation,
  type GridPinnedColumns,
  type GridPivotModel,
  type GridPivotSection,
  type GridRowModesModel,
  type GridRowWindow,
  type GridSortDirection,
  type GridSortingOrder,
  type GridSortModel,
  type GridState,
  type GridTreeRow,
  type GridViewport,
  gridActiveChartId,
  gridAggregate,
  gridAggregationFunctions,
  gridAggregationFunctionsFor,
  gridAlign,
  gridAriaSort,
  gridAutoPageSize,
  gridCanMoveColumn,
  gridCellEdges,
  gridCellRange,
  gridChartData,
  gridChartFields,
  gridChartOptions,
  gridChartTypes,
  gridColSpans,
  gridColumnTemplate,
  gridColumnWindow,
  gridDefaultLabels,
  gridDensities,
  gridDensityFactor,
  gridDirectedComparator,
  gridDisplayedRows,
  gridEditInputType,
  gridEditModes,
  gridEditTarget,
  gridEditText,
  gridExpandedByDepth,
  gridExportColumns,
  gridFilterOperators,
  gridFilterValues,
  gridFooterRowCount,
  gridFooterRowSelected,
  gridGroupComparator,
  gridGroupFooterId,
  gridGroupingField,
  gridGroupingFieldOf,
  gridGroupingKey,
  gridGroupPaths,
  gridGroupRows,
  gridGroupsById,
  gridHeaderAlign,
  gridHeaderHeightProperties,
  gridHistoryRow,
  gridLockedFields,
  gridMissingRanges,
  gridOperatorNeedsValue,
  gridPinSide,
  gridPivot,
  gridPivotDerivedColumns,
  gridPivotRole,
  gridPivotSectionNames,
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
  gridTreeGroups,
  gridTreeRows,
  gridWithGroupFooters,
  isGridCellSelected,
  isGridFilterable,
  isGridHideable,
  isGridResizable,
  isGridSortable,
  measureGridColumn,
  mergeGridCellSelection,
  moveGridColumn,
  moveGridPivotField,
  moveGridRow,
  nextGridSort,
  orderGridColumns,
  parseGridClipboard,
  parseGridEditValue,
  parseGridExcelOptions,
  parseGridExportOptions,
  parseGridSortingOrder,
  parseIsoDate,
  pinGridColumn,
  prepareGridPrint,
  printGridContent,
  pruneGridSelection,
  sanitizeGridChartModels,
  sanitizeGridState,
  selectGridRow,
  setGridPivotRole,
  sortGridRows,
  syncGridPinning,
  toggleGridCell,
  toggleGridRows,
  visibleGridColumns,
} from "@owlky/core";
import {
  type CSSProperties,
  type FocusEvent,
  Fragment,
  forwardRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  type RefObject,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Autocomplete } from "../autocomplete/autocomplete.js";
import { Button } from "../button/button.js";
import { Chart } from "../chart/chart.js";
import { Checkbox } from "../checkbox/checkbox.js";
import { CircularProgress } from "../circular-progress/circular-progress.js";
import { DatePicker } from "../date-picker/date-picker.js";
import { DateTimePicker } from "../date-time-picker/date-time-picker.js";
import { FormControlLabel } from "../form-control-label/form-control-label.js";
import { IconButton } from "../icon-button/icon-button.js";
import { LinearProgress } from "../linear-progress/linear-progress.js";
import { Menu, MenuItem } from "../menu/menu.js";
import { Popover } from "../popover/popover.js";
import { Switch } from "../switch/switch.js";
import { TablePagination } from "../table/table.js";
import { InputAdornment, TextField } from "../text-field/text-field.js";
import { Tooltip } from "../tooltip/tooltip.js";
import { useMergedRefs } from "../utils/refs.js";
import { useControllableState } from "../utils/use-controllable-state.js";

export interface GridRenderCellParams<R> {
  row: R;
  field: string;
  /** The raw value (`valueGetter`, else `row[field]`). */
  value: unknown;
  /** The text (`valueFormatter`, else the value as text). */
  formattedValue: string;
}

export interface GridCellParams<R> {
  id: string;
  field: string;
  row: R;
  value: unknown;
}

export interface GridRowParams<R> {
  id: string;
  row: R;
  /** Position on the current page. */
  indexRelativeToCurrentPage: number;
  isFirstVisible: boolean;
  isLastVisible: boolean;
}

/**
 * Compares two values for sorting (MUI X `GridComparatorFn`): negative when `v1` goes first. The
 * params give each value's row.
 */
export type GridComparatorFn<R> = (
  v1: unknown,
  v2: unknown,
  cellParams1: GridCellParams<R>,
  cellParams2: GridCellParams<R>,
) => number;

export interface GridPreProcessEditCellProps<R> {
  id: string;
  row: R;
  /** The value being typed (after `valueParser`). */
  props: { value: unknown };
  hasChanged: boolean;
}

/** What `renderEditCell` gets (MUI X `GridRenderEditCellParams`). */
export interface GridRenderEditCellParams<R> {
  id: string;
  field: string;
  row: R;
  /** The value being edited (what `setEditCellValue` set, else the typed text parsed). */
  value: unknown;
  /** `true` or a message while the value is invalid (`preProcessEditCellProps`). */
  error: boolean | string;
  colDef: GridColDef<R>;
  /** The grid's methods: `api.setEditCellValue({ id, field, value })` sets the edited value. */
  api: GridApi<R>;
}

/** What `renderHeaderFilter` gets (MUI X `GridHeaderFilterCellProps`). */
export interface GridRenderHeaderFilterParams<R> {
  field: string;
  colDef: GridColDef<R>;
  /** The column's filter item (or a new one with the type's first operator). */
  item: GridFilterItem;
  /** Sets the column's filter item; an empty `value` removes it. */
  applyFilterChanges(item: GridFilterItem): void;
}

/** A column (MUI X `GridColDef`). */
export interface GridColDef<R = Record<string, unknown>> extends GridColumn {
  /** The raw value of a row for this column (default: `row[field]`). */
  valueGetter?: ((row: R) => unknown) | undefined;
  /** The text shown, searched and exported (default: the value as text). */
  valueFormatter?: ((value: unknown, row: R) => string) | undefined;
  /** Custom cell content (the text still drives search and export). */
  renderCell?: ((params: GridRenderCellParams<R>) => ReactNode) | undefined;
  /** Class names of the column's cells: a string, or one per cell (with `getCellClassName`). */
  cellClassName?: string | ((params: GridCellParams<R>) => string) | undefined;
  /** Class names of the column's header cell: a string, or from the column. */
  headerClassName?:
    | string
    | ((params: { field: string; colDef: GridColDef<R> }) => string)
    | undefined;
  /**
   * The value `rowSpanning` compares for this column, from the raw value and the row (default: the
   * cell's text). Equal neighbours merge.
   */
  rowSpanValueGetter?: ((value: unknown, row: R) => unknown) | undefined;
  /** A pasted text as a value (default: `valueParser`, else by the column type). */
  pastedValueParser?: ((value: string, row: R) => unknown) | undefined;
  /** Sorts the column's values (ascending; reversed for descending). Default: by the column type. */
  sortComparator?: GridComparatorFn<R> | undefined;
  /**
   * A comparator per direction, used as it is (such as empty values last in both directions).
   * `undefined` falls back to `sortComparator`.
   */
  getSortComparator?:
    | ((sortDirection: GridSortDirection) => GridComparatorFn<R> | undefined)
    | undefined;
  /**
   * A custom editor for the cell being edited. Call `api.setEditCellValue` with its value; Enter
   * saves, Escape cancels, leaving the cell saves. The first control (or the one marked
   * `data-ok-data-grid-edit-input`) takes the focus.
   */
  renderEditCell?: ((params: GridRenderEditCellParams<R>) => ReactNode) | undefined;
  /** A custom field for the column's header filter (`headerFilters`). */
  renderHeaderFilter?: ((params: GridRenderHeaderFilterParams<R>) => ReactNode) | undefined;
  /** Custom header content (the header name still labels the column). */
  renderHeader?: ((params: { field: string; colDef: GridColDef<R> }) => ReactNode) | undefined;
  /** Columns a cell spans (a number, or per cell). */
  colSpan?: number | ((params: GridCellParams<R>) => number) | undefined;
  /** The edited text as a value (default: by the column type). */
  valueParser?: ((value: string, row: R) => unknown) | undefined;
  /** The row with an edited value (default: `{ ...row, [field]: value }`). */
  valueSetter?: ((value: unknown, row: R) => R) | undefined;
  /** Checks an edited value: `{ error: true | "message" }` keeps the cell open. */
  preProcessEditCellProps?:
    | ((params: GridPreProcessEditCellProps<R>) => { error?: boolean | string | undefined })
    | undefined;
  /** Operators of the filter panel for this column (they replace the type's operators). */
  filterOperators?: readonly GridFilterOperator<R>[] | undefined;
  /** `null`: the quick filter skips this column. */
  getApplyQuickFilterFn?: null | undefined;
  /** Rows can be grouped by this column. Default true. */
  groupable?: boolean | undefined;
  /** The column can be aggregated. Default true. */
  aggregable?: boolean | undefined;
  /** Aggregation functions offered for this column (default: those of its type). */
  availableAggregationFunctions?: readonly string[] | undefined;
  /** The column can be used in the pivot. Default true. */
  pivotable?: boolean | undefined;
  /**
   * The value rows are grouped by, from `row[field]` (MUI X: a string, number, `Date` or nothing),
   * such as a decade for a year. Default: the cell's text.
   */
  groupingValueGetter?:
    | ((value: unknown, row: R) => string | number | Date | null | undefined)
    | undefined;
}

/** Where a group's aggregated values show: in its row, in a footer row, or nowhere. */
export type GridAggregationPosition = "inline" | "footer" | null;

/** The group `getAggregationPosition` asks about (MUI X `GridGroupNode`). */
export interface GridAggregationGroup {
  id: string;
  /** -1 for the root (every row). */
  depth: number;
  isRoot: boolean;
  /** Row grouping: the grouped field (MUI X `groupingField`). */
  groupingField?: string | undefined;
  /** Row grouping: the group's name (MUI X `groupingKey`). */
  groupingKey?: string | undefined;
}

/** Print export options (MUI X `printOptions`). */
export interface GridPrintOptions {
  /** Default true. */
  hideToolbar?: boolean | undefined;
  /** Default true. */
  hideFooter?: boolean | undefined;
  /** Fields to print (default: the shown columns). */
  fields?: readonly string[] | undefined;
  /** Hidden columns too. */
  allColumns?: boolean | undefined;
  /** Print the selection checkboxes. Default false. */
  includeCheckboxes?: boolean | undefined;
  /** The document title (default: the grid's label). */
  fileName?: string | undefined;
}

/** The grid's methods (MUI X `apiRef`), the same as the HTML runtime's instance. */
export interface GridApi<R> {
  getRow(id: string): R | undefined;
  getSortModel(): GridSortModel;
  setSortModel(model: GridSortModel): void;
  getFilterModel(): GridFilterModel;
  setFilterModel(model: GridFilterModel): void;
  getRowSelectionModel(): string[];
  setRowSelectionModel(ids: readonly string[]): void;
  setColumnVisibilityModel(model: GridColumnVisibilityModel): void;
  setColumnOrder(fields: readonly string[]): void;
  setPinnedColumns(model: GridPinnedColumns): void;
  setColumnWidth(field: string, width: number): void;
  setPaginationModel(model: GridPaginationModel): void;
  setDensity(density: GridDensity): void;
  /** Fits columns to their content (default: every resizable column). */
  autosizeColumns(options?: GridAutosizeOptions): void;
  /** Scrolls a row (index on the current page) and / or a column (shown index) into view. */
  scrollToIndexes(indexes: { rowIndex?: number; colIndex?: number }): void;
  exportState(): GridState;
  /** Applies a saved state (unknown keys and values are dropped). */
  restoreState(state: unknown): void;
  getDataAsCsv(options?: GridCsvOptions): string;
  exportDataAsCsv(options?: GridCsvOptions): void;
  exportDataAsPrint(options?: GridPrintOptions): void;
  /** Tree data: opens or closes a row's children. */
  setRowChildrenExpansion(id: string, expanded: boolean): void;
  /** Master-detail: opens or closes a row's detail panel. */
  toggleDetailPanel(id: string): void;
  getRowGroupingModel(): string[];
  setRowGroupingModel(model: readonly string[]): void;
  getAggregationModel(): GridAggregationModel;
  setAggregationModel(model: GridAggregationModel): void;
  setPivotModel(model: GridPivotModel): void;
  setPivotActive(active: boolean): void;
  getCellSelectionModel(): GridCellSelectionModel;
  setCellSelectionModel(model: GridCellSelectionModel): void;
  /** Sets the chart model (several charts: the chart the panel edits). */
  setChartModel(model: GridChartModel): void;
  /** Several charts: sets every chart's model, by chart id. */
  setChartModels(models: GridChartModels): void;
  /** Several charts: the chart the panel edits. */
  setActiveChartId(id: string): void;
  /** The .xlsx file of the filtered, sorted rows (bytes). */
  getDataAsExcel(options?: GridExcelOptions): Uint8Array;
  exportDataAsExcel(options?: GridExcelOptions): void;
  /** Undo and redo of edits and pastes (MUI X `apiRef.current.history`). */
  history: GridHistoryApi;
  /** Sets the value of a cell being edited (custom editors). */
  setEditCellValue(params: { id: string; field: string; value: unknown }): void;
  /** The cells in edit mode. */
  getCellModesModel(): GridCellModesModel;
  /** The rows in edit mode. */
  getRowModesModel(): GridRowModesModel;
  /** Opens a cell's editor (cell mode). */
  startCellEditMode(params: { id: string; field: string }): void;
  /** Closes the cell's editor, saving unless `ignoreModifications`. */
  stopCellEditMode(params: { id: string; field: string; ignoreModifications?: boolean }): void;
  /** Opens a row's editors (row mode). */
  startRowEditMode(params: { id: string; fieldToFocus?: string }): void;
  /** Closes the row's editors, saving unless `ignoreModifications`. */
  stopRowEditMode(params: { id: string; ignoreModifications?: boolean }): void;
}

export interface GridAutosizeOptions {
  /** Fields to fit (default: every resizable column). */
  columns?: readonly string[] | undefined;
  /** Count the header text. Default true. */
  includeHeaders?: boolean | undefined;
}

export interface GridGroupingColDef {
  /** Default "Group". */
  headerName?: string | undefined;
  /** px. Default 200. */
  width?: number | undefined;
  /** No "(n)" after group names. */
  hideDescendantCount?: boolean | undefined;
}

/** A ref for `apiRef` (MUI X `useGridApiRef`). */
export const useGridApiRef = <R = Record<string, unknown>>(): RefObject<GridApi<R> | null> =>
  useRef<GridApi<R> | null>(null);

export interface GridPaginationModel {
  page: number;
  pageSize: number;
}

/** The state a grid starts with (the shape `exportState()` returns). */
export type GridInitialState = GridState;

export interface DataGridProps<R>
  extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onChange"> {
  /** The rows: one object per row. */
  rows: readonly R[];
  /** The columns: field, header, type, width and how cells render. */
  columns: readonly GridColDef<R>[];
  /** Returns a row's id. Default `row.id`. */
  getRowId?: ((row: R) => string | number) | undefined;
  checkboxSelection?: boolean | undefined;
  disableRowSelectionOnClick?: boolean | undefined;
  /** The selected row ids, controlled. */
  rowSelectionModel?: readonly string[] | undefined;
  /** Called when the row selection changes. */
  onRowSelectionModelChange?: ((ids: string[]) => void) | undefined;
  /** The sort model, controlled. */
  sortModel?: GridSortModel | undefined;
  /** Called when the sort model changes. */
  onSortModelChange?: ((model: GridSortModel) => void) | undefined;
  /** The filter model, controlled. */
  filterModel?: GridFilterModel | undefined;
  /** Called when the filter model changes. */
  onFilterModelChange?: ((model: GridFilterModel) => void) | undefined;
  /** The page and the page size, controlled. */
  paginationModel?: GridPaginationModel | undefined;
  /** Called when the page or the page size changes. */
  onPaginationModelChange?: ((model: GridPaginationModel) => void) | undefined;
  /** The page sizes the footer offers. Default `[5, 10, 25]`. */
  pageSizeOptions?: readonly number[] | undefined;
  /** Which columns are visible (field to `false` hides it), controlled. */
  columnVisibilityModel?: GridColumnVisibilityModel | undefined;
  /** Called when the column visibility changes. */
  onColumnVisibilityModelChange?: ((model: GridColumnVisibilityModel) => void) | undefined;
  density?: GridDensity | undefined;
  /** Called when the density changes. */
  onDensityChange?: ((density: GridDensity) => void) | undefined;
  /** The first state of the uncontrolled models (sort, filter, pagination, columns…). */
  initialState?: GridInitialState | undefined;
  /** Shows the toolbar: quick filter, columns, filters, density and export. */
  showToolbar?: boolean | undefined;
  disableColumnMenu?: boolean | undefined;
  /** Turns sorting off for every column. */
  disableColumnSorting?: boolean | undefined;
  /** Turns filtering off for every column. */
  disableColumnFilter?: boolean | undefined;
  /** Hides the column selector of the toolbar and the column menu. */
  disableColumnSelector?: boolean | undefined;
  /** Hides the density selector of the toolbar. */
  disableDensitySelector?: boolean | undefined;
  disableMultipleColumnsSorting?: boolean | undefined;
  /**
   * The directions a header click goes through, in order (`null`: not sorted). Default
   * `["asc", "desc", null]`. A column's `sortingOrder` overrides it.
   */
  sortingOrder?: GridSortingOrder | undefined;
  /**
   * `always`: a header click adds the column to the sort. Default `withModifierKey`: only with
   * Shift.
   */
  multipleColumnsSortingMode?: "withModifierKey" | "always" | undefined;
  /** Hides the footer (row count and pagination). */
  hideFooter?: boolean | undefined;
  /**
   * Hides the footer's pagination: every row shows, and the footer shows the row count instead
   * ("Total Rows: 25").
   */
  hideFooterPagination?: boolean | undefined;
  /** Hides the footer's row count (it shows only without pagination). */
  hideFooterRowCount?: boolean | undefined;
  /** Hides the footer's "2 rows selected". */
  hideFooterSelectedRowCount?: boolean | undefined;
  /** The grid's name: the toolbar shows it (with `showToolbar`) and it names the grid. */
  label?: string | undefined;
  /**
   * What Tab does inside the grid: `none` (default) leaves it, `content` moves between body cells,
   * `header` between column headers, `all` through both. Tab past the last cell leaves the grid.
   */
  tabNavigation?: "none" | "content" | "header" | "all" | undefined;
  /** Labels (MUI X locale text keys). */
  localeText?: Partial<GridLabels> | undefined;
  /** Name of the CSV file (without `.csv`). Default "data". */
  exportFileName?: string | undefined;
  /** The filter panel keeps one filter (no Add filter). */
  disableMultipleColumnsFiltering?: boolean | undefined;
  disableColumnResize?: boolean | undefined;
  /** A column's width after resizing (on release, and for each keyboard step). */
  onColumnWidthChange?: ((field: string, width: number) => void) | undefined;
  disableColumnReorder?: boolean | undefined;
  /** Column order (fields); missing fields follow in their place. */
  columnOrder?: readonly string[] | undefined;
  /** Called when the column order changes, with the fields in their new order. */
  onColumnOrderChange?: ((fields: string[]) => void) | undefined;
  disableColumnPinning?: boolean | undefined;
  /** The columns pinned to the start and the end, controlled. */
  pinnedColumns?: GridPinnedColumns | undefined;
  /** Called when the pinned columns change. */
  onPinnedColumnsChange?: ((model: GridPinnedColumns) => void) | undefined;
  /** Editable columns: edit one `cell` (default) or every editable cell of a `row` together. */
  editMode?: "cell" | "row" | undefined;
  /** Called with the edited row; return (or resolve) the row to show. Reject to refuse it. */
  processRowUpdate?: ((newRow: R, oldRow: R) => R | Promise<R>) | undefined;
  /** Called when `processRowUpdate` throws or rejects. */
  onProcessRowUpdateError?: ((error: unknown) => void) | undefined;
  /**
   * Edits that Ctrl / Cmd + Z can undo (Ctrl / Cmd + Shift + Z or Ctrl + Y redo). Each saved cell
   * or row edit, and each paste, is one step; undo and redo go through `processRowUpdate`. `0`
   * turns undo and redo off. Default `30`.
   */
  historyStackSize?: number | undefined;
  /** Called after an undo, with the ids of the rows it restored. */
  onUndo?: ((params: { ids: string[] }) => void) | undefined;
  /** Called after a redo, with the ids of the rows it changed again. */
  onRedo?: ((params: { ids: string[] }) => void) | undefined;
  /** Undo and Redo buttons in the toolbar (with `showToolbar` and undo on). Default `true`. */
  showHistoryControls?: boolean | undefined;
  /**
   * Which cells are in edit mode (`editMode="cell"`), controlled: `{ [id]: { [field]: { mode } } }`
   * with `mode` `"edit"` or `"view"` (`ignoreModifications: true` leaves without saving). The
   * grid edits one cell at a time: the first `edit` entry.
   */
  cellModesModel?: GridCellModesModel | undefined;
  /** Called when a cell starts or stops editing, with the next cell modes model. */
  onCellModesModelChange?: ((model: GridCellModesModel) => void) | undefined;
  /**
   * Which rows are in edit mode (`editMode="row"`), controlled: `{ [id]: { mode, fieldToFocus? } }`.
   * The grid edits one row at a time: the first `edit` entry.
   */
  rowModesModel?: GridRowModesModel | undefined;
  /** Called when a row starts or stops editing, with the next row modes model. */
  onRowModesModelChange?: ((model: GridRowModesModel) => void) | undefined;
  /** Render every row of the page instead of the visible ones. */
  disableVirtualization?: boolean | undefined;
  /** `server`: report the model and show `rows` as given. Default `client`. */
  sortingMode?: "client" | "server" | undefined;
  filterMode?: "client" | "server" | undefined;
  /** `server`: `rows` are the current page and `rowCount` the total. */
  paginationMode?: "client" | "server" | undefined;
  rowCount?: number | undefined;
  /** Shows the loading overlay. */
  loading?: boolean | undefined;
  /** Default `linear-progress`. */
  loadingVariant?: "linear-progress" | "circular-progress" | "skeleton" | undefined;
  /** The rows were scrolled near their end (infinite loading). Called once per row count. */
  onRowsScrollEnd?: ((params: { visibleRowsCount: number }) => void) | undefined;
  /** Distance from the end that counts as the end, px. Default 80. */
  scrollEndThreshold?: number | undefined;
  /** Loads rows from a server for the current sort, filter and page (replaces `rows`). */
  dataSource?: GridDataSource<R> | undefined;
  /** Responses kept per request; `null` turns caching off. Default: a cache of 50. */
  dataSourceCache?: GridDataSourceCache<R> | null | undefined;
  /** Called when the data source fails to load rows. */
  onDataSourceError?: ((error: unknown) => void) | undefined;
  /** One row at a time (no select all). */
  disableMultipleRowSelection?: boolean | undefined;
  /** Returns whether a row can be selected. */
  isRowSelectable?: ((params: { id: string; row: R }) => boolean) | undefined;
  keepNonExistentRowsSelected?: boolean | undefined;
  /** Select all selects the current page only. */
  checkboxSelectionVisibleOnly?: boolean | undefined;
  autosizeOnMount?: boolean | undefined;
  /** How `autosizeColumns` measures (columns, header, outliers, extra width). */
  autosizeOptions?: GridAutosizeOptions | undefined;
  /** Neighbouring cells with the same value merge (per column). */
  rowSpanning?: boolean | undefined;
  /** Row height, px, before the density factor. Default 52. */
  rowHeight?: number | undefined;
  /** Column header height, px, before the density factor. Default 56. */
  columnHeaderHeight?: number | undefined;
  /** Column group header height, px, before the density factor. Default: `columnHeaderHeight`. */
  columnGroupHeaderHeight?: number | undefined;
  /**
   * Header filter row height, px, before the density factor. Default: `columnHeaderHeight`, else
   * 56.
   */
  headerFilterHeight?: number | undefined;
  /** Vertical lines between the cells. */
  showCellVerticalBorder?: boolean | undefined;
  /** Full-height vertical lines between the column headers. */
  showColumnVerticalBorder?: boolean | undefined;
  /**
   * Where `getRowSpacing` puts its space: outside the row (`margin`, default) or inside it, under
   * its background (`border`).
   */
  rowSpacingType?: "margin" | "border" | undefined;
  /** The grid grows with its rows (no scroll area, so no virtualization). Don't give it a height. */
  autoHeight?: boolean | undefined;
  /**
   * The page size fits the grid's height, and the rows per page choice goes away. The grid needs a
   * height.
   */
  autoPageSize?: boolean | undefined;
  /** A row's height: px, or `"auto"` (the content decides); `null`: the default. */
  getRowHeight?:
    | ((params: { id: string; model: R; densityFactor: number }) => number | "auto" | null)
    | undefined;
  /** The height to assume for `"auto"` rows before they are measured. */
  getEstimatedRowHeight?: ((params: { id: string; model: R }) => number) | undefined;
  /** Returns a class name for a row. */
  getRowClassName?: ((params: GridRowParams<R>) => string) | undefined;
  /** Returns a class name for a cell. */
  getCellClassName?: ((params: GridCellParams<R>) => string) | undefined;
  /** Space above and below a row, px. */
  getRowSpacing?:
    | ((params: GridRowParams<R>) => { top?: number | undefined; bottom?: number | undefined })
    | undefined;
  /** Called on a click on a row. */
  onRowClick?: ((params: GridRowParams<R>, event: MouseEvent<HTMLElement>) => void) | undefined;
  /** Called on a double click on a row. */
  onRowDoubleClick?:
    | ((params: GridRowParams<R>, event: MouseEvent<HTMLElement>) => void)
    | undefined;
  /** Called on a click on a cell. */
  onCellClick?: ((params: GridCellParams<R>, event: MouseEvent<HTMLElement>) => void) | undefined;
  /** Called on a double click on a cell. */
  onCellDoubleClick?:
    | ((params: GridCellParams<R>, event: MouseEvent<HTMLElement>) => void)
    | undefined;
  /** Called on a key press in a cell. */
  onCellKeyDown?:
    | ((params: GridCellParams<R>, event: KeyboardEvent<HTMLElement>) => void)
    | undefined;
  /** Called on a click on a column header. */
  onColumnHeaderClick?:
    | ((params: { field: string; colDef: GridColDef<R> }, event: MouseEvent<HTMLElement>) => void)
    | undefined;
  /** Receives the grid's methods. */
  apiRef?: RefObject<GridApi<R> | null> | undefined;
  /** Returns whether a cell can be edited (over the column's `editable`). */
  isCellEditable?: ((params: GridCellParams<R>) => boolean) | undefined;
  /** Called when a cell starts editing, with the reason. */
  onCellEditStart?: ((params: GridCellParams<R>, reason: GridEditStartReason) => void) | undefined;
  /** Called when a cell stops editing, with the reason. */
  onCellEditStop?: ((params: GridCellParams<R>, reason: GridEditStopReason) => void) | undefined;
  /** Called when a row starts editing (`editMode="row"`). */
  onRowEditStart?:
    | ((params: { id: string; row: R }, reason: GridEditStartReason) => void)
    | undefined;
  /** Called when a row stops editing (`editMode="row"`). */
  onRowEditStop?:
    | ((params: { id: string; row: R }, reason: GridEditStopReason) => void)
    | undefined;
  /** Search words: all must match (`and`, default) or any (`or`). */
  quickFilterLogicOperator?: "and" | "or" | undefined;
  quickFilterExcludeHiddenColumns?: boolean | undefined;
  /** Searches and filters ignore accents. */
  ignoreDiacritics?: boolean | undefined;
  /** Options of the CSV export (file name, delimiter, fields…). */
  csvOptions?: GridCsvOptions | undefined;
  /** Options of the print export (title, fields…). */
  printOptions?: GridPrintOptions | undefined;
  /** Toolbar buttons with text (default) or icons with tooltips. */
  toolbarVariant?: "labeled" | "icon" | undefined;
  /** Rows form a tree (`getTreeDataPath`, or a data source with `getChildrenCount`). */
  treeData?: boolean | undefined;
  /** A row's path in the tree: its ancestors' keys, then its own (MUI X). */
  getTreeDataPath?: ((row: R) => readonly string[]) | undefined;
  /**
   * Overrides the grouping column (header, width…). A function is called for each grouping
   * column with the fields it groups by (`rowGroupingColumnMode="multiple"`: one each).
   */
  groupingColDef?:
    | GridGroupingColDef
    | ((params: { fields: string[] }) => GridGroupingColDef)
    | undefined;
  /** Levels open at first (`-1`: all). Default 0. */
  defaultGroupingExpansionDepth?: number | undefined;
  /** Returns whether a group row starts expanded. */
  isGroupExpandedByDefault?: ((node: { id: string; depth: number; row: R }) => boolean) | undefined;
  /** A row's detail panel (`null`: none, no toggle). */
  getDetailPanelContent?: ((params: { id: string; row: R }) => ReactNode) | undefined;
  /** px, or `"auto"` (default): the content decides. */
  getDetailPanelHeight?: ((params: { id: string; row: R }) => number | "auto") | undefined;
  /** The rows whose detail panel is open, controlled. */
  detailPanelExpandedRowIds?: readonly string[] | undefined;
  /** Called when detail panels open or close. */
  onDetailPanelExpandedRowIdsChange?: ((ids: string[]) => void) | undefined;
  /** Rows move by dragging their handle (or Alt + Up / Down on it). */
  rowReordering?: boolean | undefined;
  /** Called when a dragged row moves. */
  onRowOrderChange?:
    | ((params: { row: R; oldIndex: number; targetIndex: number }) => void)
    | undefined;
  /** Rows kept above or below the others (not sorted, filtered or paged). */
  pinnedRows?: { top?: readonly R[] | undefined; bottom?: readonly R[] | undefined } | undefined;
  /** Header groups over the columns (multi-level headers). */
  columnGroupingModel?: readonly GridColumnGroup[] | undefined;
  /** Each row shows as one cell (`listViewColumn`). */
  listView?: boolean | undefined;
  /** The single column of the list view (`listView`). */
  listViewColumn?:
    | { field: string; renderCell?: ((params: GridRenderCellParams<R>) => ReactNode) | undefined }
    | undefined;
  /** Rows rendered beyond the visible ones, px. Default 150. */
  rowBufferPx?: number | undefined;
  /** Columns rendered beyond the visible ones, px. Default 150. */
  columnBufferPx?: number | undefined;
  /** With `dataSource` and a row count: rows load in chunks as they scroll into view. */
  lazyLoading?: boolean | undefined;
  /** Least time between two lazy loading requests, ms. Default 500. */
  lazyLoadingRequestThrottleMs?: number | undefined;
  /** Fields the rows are grouped by, outermost first (MUI X Premium). */
  rowGroupingModel?: readonly string[] | undefined;
  /** Called when the row grouping changes. */
  onRowGroupingModelChange?: ((model: string[]) => void) | undefined;
  disableRowGrouping?: boolean | undefined;
  /**
   * One grouping column for every grouped field (`single`, default), or one column per grouped
   * field (`multiple`). Server-side grouping keeps one column.
   */
  rowGroupingColumnMode?: "single" | "multiple" | undefined;
  /** Field → aggregation function (`sum`, `avg`, `min`, `max`, `size` or your own). */
  aggregationModel?: GridAggregationModel | undefined;
  /** Called when the aggregation changes. */
  onAggregationModelChange?: ((model: GridAggregationModel) => void) | undefined;
  disableAggregation?: boolean | undefined;
  /** The functions offered (default: the built-in ones). */
  aggregationFunctions?: Readonly<Record<string, GridAggregationFunction>> | undefined;
  /** Rows aggregated: the filtered ones (default) or all. */
  aggregationRowsScope?: "filtered" | "all" | undefined;
  /**
   * Where a group shows its values: in its row (`inline`), in a footer row after its rows
   * (`footer`) or nowhere (`null`). Default: groups inline, the root (`depth` -1) in a footer row.
   * Ignored while pivoting.
   */
  getAggregationPosition?: ((group: GridAggregationGroup) => GridAggregationPosition) | undefined;
  /** The pivot model (rows, columns and values), controlled. */
  pivotModel?: GridPivotModel | undefined;
  /** Called when the pivot model changes. */
  onPivotModelChange?: ((model: GridPivotModel) => void) | undefined;
  /** Shows the pivot of the rows instead of the rows. */
  pivotActive?: boolean | undefined;
  /** Called when pivot mode turns on or off. */
  onPivotActiveChange?: ((active: boolean) => void) | undefined;
  disablePivoting?: boolean | undefined;
  /**
   * Pivot fields derived from a column, such as its year (MUI X). Default: the year and quarter
   * of every `date` column (`<field>-year`, `<field>-quarter`); `null`: none.
   */
  getPivotDerivedColumns?:
    | ((column: GridColDef<R>) => GridColDef<R>[] | undefined)
    | null
    | undefined;
  /** Options of the Excel export. */
  excelOptions?: GridExcelOptions | undefined;
  /** Cells are selected in ranges (press, drag, Shift + click, Shift + arrows). */
  cellSelection?: boolean | undefined;
  /** The selected cells (row id to fields), controlled. */
  cellSelectionModel?: GridCellSelectionModel | undefined;
  /** Called when the cell selection changes. */
  onCellSelectionModelChange?: ((model: GridCellSelectionModel) => void) | undefined;
  /** Ctrl / Cmd + V doesn't paste into editable cells. */
  disableClipboardPaste?: boolean | undefined;
  /** Called after cells were copied, with the copied text. */
  onClipboardCopy?: ((data: string) => void) | undefined;
  /** Called before pasted cells are written. */
  onClipboardPasteStart?: ((params: { data: string[][] }) => void) | undefined;
  /** Called after pasted cells were written. */
  onClipboardPasteEnd?: (() => void) | undefined;
  /** Splits pasted text into cells (default: tab-separated lines). */
  splitClipboardPastedText?: ((text: string) => string[][]) | undefined;
  /** Default a tab. */
  clipboardCopyCellDelimiter?: string | undefined;
  /** Copies raw values instead of formatted text. */
  ignoreValueFormatterDuringExport?: boolean | undefined;
  /** A row of filter fields under the column headers. */
  headerFilters?: boolean | undefined;
  /**
   * With `cellSelection`: a status bar under the grid shows the count of the selected cells and
   * the sum, average, min and max of their numbers (through `aggregationFunctions`).
   */
  statusBar?: boolean | undefined;
  /** A chart of the rows (or top-level groups) under the grid. */
  chartsIntegration?: boolean | undefined;
  /** The chart panel's model, controlled. */
  chartModel?: GridChartModel | undefined;
  /** Called when the chart panel's model changes. */
  onChartModelChange?: ((model: GridChartModel) => void) | undefined;
  /**
   * Several charts of the grid, by chart id (MUI X: one renderer proxy per id), controlled. Each
   * model's `label` names its chart. Replaces `chartModel`.
   */
  chartModels?: GridChartModels | undefined;
  /** Called when a chart's model changes, with every chart's model. */
  onChartModelsChange?: ((models: GridChartModels) => void) | undefined;
  /** Several charts: the one the chart panel edits (default: the first), controlled. */
  activeChartId?: string | undefined;
  /** Called when the chart panel switches to another chart. */
  onActiveChartIdChange?: ((id: string) => void) | undefined;
}

export type GridEditStopReason = "enterKeyDown" | "escapeKeyDown" | "cellFocusOut";

const SortIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M12 4l-6 6h4v10h4V10h4z" />
  </svg>
);
const MoreIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
  </svg>
);
const ColumnsIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M4 5h4v14H4zm6 0h4v14h-4zm6 0h4v14h-4z" />
  </svg>
);
const FilterIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M3 5h18l-7 8v6l-4 2v-8z" />
  </svg>
);
const DensityIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M3 5h18v2H3zm0 6h18v2H3zm0 6h18v2H3z" />
  </svg>
);
const ExportIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M11 3h2v9l3-3 1.4 1.4L12 15.8l-5.4-5.4L8 9l3 3zM5 18h14v2H5z" />
  </svg>
);
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z" />
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M6.4 5 12 10.6 17.6 5 19 6.4 13.4 12 19 17.6 17.6 19 12 13.4 6.4 19 5 17.6 10.6 12 5 6.4z" />
  </svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M10 3a7 7 0 015.6 11.2l4.6 4.6-1.4 1.4-4.6-4.6A7 7 0 1110 3zm0 2a5 5 0 100 10 5 5 0 000-10z" />
  </svg>
);

const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M9 6l6 6-6 6-1.4-1.4 4.6-4.6-4.6-4.6z" />
  </svg>
);
const ExpandIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M7.4 8.6 12 13.2l4.6-4.6L18 10l-6 6-6-6z" />
  </svg>
);
const GripIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M9 5h2v2H9zm4 0h2v2h-2zM9 11h2v2H9zm4 0h2v2h-2zm-4 6h2v2H9zm4 0h2v2h-2z" />
  </svg>
);

const PivotIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M3 3h18v4H3zm0 6h4v12H3zm6 0h12v12H9zm2 2v8h8v-8z" />
  </svg>
);
const MoveIcon = ({ down }: { down?: boolean }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path
      d={
        down
          ? "M11 4h2v12l4.6-4.6L19 12.8l-7 7-7-7 1.4-1.4L11 16z"
          : "M11 20h2V8l4.6 4.6L19 11.2l-7-7-7 7 1.4 1.4L11 8z"
      }
    />
  </svg>
);
const ChartIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M4 20V10h3v10zm6.5 0V4h3v16zM17 20v-7h3v7z" />
  </svg>
);
const UndoIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="M9 5 4 10l5 5v-4h6a4 4 0 0 1 0 8h-3v2h3a6 6 0 0 0 0-12H9z" />
  </svg>
);
const RedoIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
    <path d="m15 5 5 5-5 5v-4H9a4 4 0 0 0 0 8h3v2H9a6 6 0 0 1 0-12h6z" />
  </svg>
);

const REORDER_FIELD = "__reorder__";
const DETAIL_FIELD = "__detail_panel_toggle__";
/** Lazy loading asks for rows in chunks of this many. */
const LAZY_CHUNK = 50;
/** Controls a custom editor (`renderEditCell`) may hold, the first takes the focus. */
const EDIT_FOCUSABLE = "input, select, textarea, button, [contenteditable], [tabindex]";
/** Rows of a lazy grid that haven't loaded yet. */
const HOLE = Symbol("row not loaded");
type Hole = { [HOLE]: number };
const holeAt = <R,>(index: number) => ({ [HOLE]: index }) as unknown as R;
const isHole = (row: unknown): row is Hole =>
  typeof row === "object" && row !== null && HOLE in row;

/** Generated rows (row groups, missing tree parents): rendered by the grid, not data. */
const GROUP = Symbol("group row");
type Group = { [GROUP]: GridGroupNode };
const asGroupRow = <R,>(node: GridGroupNode) => ({ [GROUP]: node }) as unknown as R;
const isGroup = (row: unknown): row is Group =>
  typeof row === "object" && row !== null && GROUP in row;
/** A group's footer row (`getAggregationPosition` → `footer`): a generated row too. */
const FOOTER = Symbol("group footer");
type Footer = Group & { [FOOTER]: string };
const asFooterRow = <R,>(node: GridGroupNode) =>
  ({ [GROUP]: { ...node, id: gridGroupFooterId(node.id) }, [FOOTER]: node.id }) as unknown as R;
const isFooter = (row: unknown): row is Footer =>
  typeof row === "object" && row !== null && FOOTER in row;
/** Data rows only (not generated or placeholder rows). */
const isData = (row: unknown) => !isGroup(row) && !isHole(row);

const rawValue = <R,>(column: GridColDef<R>, row: R) =>
  !isData(row)
    ? undefined
    : column.valueGetter
      ? column.valueGetter(row)
      : (row as Record<string, unknown>)[column.field];
const asText = (value: unknown) =>
  value === null || value === undefined
    ? ""
    : value instanceof Date
      ? value.toISOString()
      : String(value);
const textOf = <R,>(column: GridColDef<R>, row: R) => {
  if (!isData(row)) return "";
  const value = rawValue(column, row);
  return column.valueFormatter ? column.valueFormatter(value, row) : asText(value);
};

/** Starts a download (a Blob link, revoked right after). */
function download(name: string, data: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}
const downloadCsv = (name: string, csv: string) =>
  download(`${name}.csv`, csv, "text/csv;charset=utf-8");

/**
 * `YYYY-MM-DD` of a picked date (`YYYY-MM-DDTHH:mm:ss` for `dateTime` columns); "" while it isn't
 * a whole, valid date.
 */
const isoValue = (date: Date | null, type: GridColDef["type"]) =>
  date && !Number.isNaN(date.getTime())
    ? type === "dateTime"
      ? formatIsoDateTime(date)
      : formatIsoDate(date)
    : "";

const NO_PIVOT: GridPivotModel = { rows: [], columns: [], values: [] };

type Panel = "columns" | "filters" | "density" | "export" | "pivot" | "charts" | null;

function DataGridInner<R>(
  {
    rows,
    columns: columnsProp,
    getRowId = (row: R) => (row as { id: string | number }).id,
    checkboxSelection,
    disableRowSelectionOnClick,
    rowSelectionModel,
    onRowSelectionModelChange,
    sortModel: sortProp,
    onSortModelChange,
    filterModel: filterProp,
    onFilterModelChange,
    paginationModel: paginationProp,
    onPaginationModelChange,
    pageSizeOptions = [5, 10, 25],
    columnVisibilityModel: visibilityProp,
    onColumnVisibilityModelChange,
    density: densityProp,
    onDensityChange,
    initialState,
    showToolbar,
    disableColumnMenu,
    disableColumnSorting,
    disableColumnFilter,
    disableColumnSelector,
    disableDensitySelector,
    disableMultipleColumnsSorting,
    sortingOrder,
    multipleColumnsSortingMode,
    statusBar,
    hideFooter,
    hideFooterPagination,
    hideFooterRowCount,
    hideFooterSelectedRowCount,
    label,
    tabNavigation,
    localeText,
    exportFileName = "data",
    disableMultipleColumnsFiltering,
    disableColumnResize,
    onColumnWidthChange,
    disableColumnReorder,
    columnOrder,
    onColumnOrderChange,
    disableColumnPinning,
    pinnedColumns: pinnedProp,
    onPinnedColumnsChange,
    editMode = "cell",
    processRowUpdate,
    historyStackSize: historyStackSizeProp = 30,
    onUndo,
    onRedo,
    showHistoryControls = true,
    cellModesModel,
    onCellModesModelChange,
    rowModesModel,
    onRowModesModelChange,
    onProcessRowUpdateError,
    disableVirtualization,
    sortingMode = "client",
    filterMode = "client",
    paginationMode = "client",
    rowCount,
    loading,
    loadingVariant = "linear-progress",
    onRowsScrollEnd,
    scrollEndThreshold = 80,
    dataSource,
    dataSourceCache,
    onDataSourceError,
    disableMultipleRowSelection,
    isRowSelectable,
    keepNonExistentRowsSelected,
    checkboxSelectionVisibleOnly,
    autosizeOnMount,
    autosizeOptions,
    rowSpanning,
    rowHeight,
    columnHeaderHeight,
    columnGroupHeaderHeight,
    headerFilterHeight,
    showCellVerticalBorder,
    showColumnVerticalBorder,
    rowSpacingType,
    autoHeight,
    autoPageSize,
    getRowHeight,
    getEstimatedRowHeight,
    getRowClassName,
    getCellClassName,
    getRowSpacing,
    onRowClick: onRowClickProp,
    onRowDoubleClick,
    onCellClick,
    onCellDoubleClick,
    onCellKeyDown,
    onColumnHeaderClick,
    apiRef,
    isCellEditable,
    onCellEditStart,
    onCellEditStop,
    onRowEditStart,
    onRowEditStop,
    quickFilterLogicOperator = "and",
    quickFilterExcludeHiddenColumns,
    ignoreDiacritics,
    csvOptions,
    printOptions,
    toolbarVariant = "labeled",
    treeData,
    getTreeDataPath,
    groupingColDef,
    defaultGroupingExpansionDepth = 0,
    isGroupExpandedByDefault,
    getDetailPanelContent,
    getDetailPanelHeight,
    detailPanelExpandedRowIds,
    onDetailPanelExpandedRowIdsChange,
    rowReordering,
    onRowOrderChange,
    pinnedRows,
    columnGroupingModel: columnGroupingProp,
    listView,
    listViewColumn,
    rowBufferPx = 150,
    columnBufferPx = 150,
    lazyLoading,
    lazyLoadingRequestThrottleMs = 500,
    rowGroupingModel: groupingProp,
    onRowGroupingModelChange,
    disableRowGrouping,
    rowGroupingColumnMode = "single",
    aggregationModel: aggregationProp,
    onAggregationModelChange,
    disableAggregation,
    aggregationFunctions = gridAggregationFunctions,
    aggregationRowsScope = "filtered",
    getAggregationPosition,
    pivotModel: pivotProp,
    onPivotModelChange,
    pivotActive: pivotActiveProp,
    onPivotActiveChange,
    disablePivoting,
    getPivotDerivedColumns,
    excelOptions,
    cellSelection,
    cellSelectionModel,
    onCellSelectionModelChange,
    disableClipboardPaste,
    onClipboardCopy,
    onClipboardPasteStart,
    onClipboardPasteEnd,
    splitClipboardPastedText,
    clipboardCopyCellDelimiter = "\t",
    ignoreValueFormatterDuringExport,
    headerFilters,
    chartsIntegration,
    chartModel: chartProp,
    chartModels: chartModelsProp,
    onChartModelsChange,
    activeChartId: activeChartProp,
    onActiveChartIdChange,
    onChartModelChange,
    "aria-label": ariaLabelProp,
    "aria-labelledby": ariaLabelledby,
    ...props
  }: DataGridProps<R>,
  ref: Ref<HTMLDivElement>,
) {
  // `label` names the grid (MUI X: always its `aria-label`).
  const ariaLabel = label ?? ariaLabelProp;
  const labels = { ...gridDefaultLabels, ...localeText };
  const generated = useId();
  // Parts are named after the grid's id, so pages (and snippets) get readable ids.
  const id = props.id ?? generated;
  const gridRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRefs<HTMLDivElement>(rootRef, ref);
  const navigation = useRef<GridNavigation | null>(null);
  const [selection, setSelection] = useControllableState<readonly string[]>({
    value: rowSelectionModel,
    defaultValue: [],
    onChange: (next) => onRowSelectionModelChange?.([...next]),
  });
  const [sortModel, setSortModel] = useControllableState<GridSortModel>({
    value: sortProp,
    defaultValue: initialState?.sorting?.sortModel ?? [],
    onChange: onSortModelChange,
  });
  const [filterModel, setFilterModel] = useControllableState<GridFilterModel>({
    value: filterProp,
    defaultValue: initialState?.filter?.filterModel ?? { items: [] },
    onChange: onFilterModelChange,
  });
  const firstSize = pageSizeOptions[0] ?? 10;
  const [pagination, setPagination] = useControllableState<GridPaginationModel>({
    value: paginationProp,
    defaultValue: {
      page: initialState?.pagination?.paginationModel?.page ?? 0,
      pageSize: initialState?.pagination?.paginationModel?.pageSize ?? firstSize,
    },
    onChange: onPaginationModelChange,
  });
  const [visibility, setVisibility] = useControllableState<GridColumnVisibilityModel>({
    value: visibilityProp,
    defaultValue: initialState?.columns?.columnVisibilityModel ?? {},
    onChange: onColumnVisibilityModelChange,
  });
  const [density, setDensity] = useControllableState<GridDensity>({
    value: densityProp,
    defaultValue: initialState?.density ?? "standard",
    onChange: onDensityChange,
  });
  const [order, setOrder] = useControllableState<readonly string[]>({
    value: columnOrder,
    defaultValue: initialState?.columns?.orderedFields ?? [],
    onChange: (next) => onColumnOrderChange?.([...next]),
  });
  const [pinned, setPinned] = useControllableState<GridPinnedColumns>({
    value: pinnedProp,
    defaultValue: initialState?.pinnedColumns ?? {},
    onChange: onPinnedColumnsChange,
  });
  const [groupingModel, setGroupingModel] = useControllableState<readonly string[]>({
    value: groupingProp,
    defaultValue: initialState?.rowGrouping?.model ?? [],
    onChange: (next) => onRowGroupingModelChange?.([...next]),
  });
  const [aggregationState, setAggregationModel] = useControllableState<GridAggregationModel>({
    value: aggregationProp,
    defaultValue: initialState?.aggregation?.model ?? {},
    onChange: onAggregationModelChange,
  });
  const [pivotModel, setPivotModel] = useControllableState<GridPivotModel>({
    value: pivotProp,
    defaultValue: initialState?.pivoting?.model ?? NO_PIVOT,
    onChange: onPivotModelChange,
  });
  const [pivotActive, setPivotActive] = useControllableState<boolean>({
    value: pivotActiveProp,
    defaultValue: initialState?.pivoting?.active ?? false,
    onChange: onPivotActiveChange,
  });
  const [cellModel, setCellModel] = useControllableState<GridCellSelectionModel>({
    value: cellSelectionModel,
    defaultValue: {},
    onChange: onCellSelectionModelChange,
  });
  const [chartModel, setChartModel] = useControllableState<GridChartModel>({
    value: chartProp,
    defaultValue: initialState?.chartsIntegration?.model ?? {},
    onChange: onChartModelChange,
  });
  // Several charts (MUI X): one model per chart id; the panel edits the active one.
  const [chartModels, setChartModels] = useControllableState<GridChartModels>({
    value: chartModelsProp,
    defaultValue: initialState?.chartsIntegration?.charts ?? {},
    onChange: onChartModelsChange,
  });
  const [activeChartState, setActiveChartId] = useControllableState<string | null>({
    value: activeChartProp,
    defaultValue: initialState?.chartsIntegration?.activeChartId ?? null,
    onChange: (next) => next && onActiveChartIdChange?.(next),
  });
  const chartIds = Object.keys(chartModels);
  const activeChartId = gridActiveChartId(chartModels, activeChartState);
  const panelModel: GridChartModel = activeChartId
    ? (chartModels[activeChartId] as GridChartModel)
    : chartModel;
  const setPanelModel = (next: GridChartModel) =>
    activeChartId ? setChartModels({ ...chartModels, [activeChartId]: next }) : setChartModel(next);
  const [widths, setWidths] = useState<GridColumnWidths>(() =>
    Object.fromEntries(
      Object.entries(initialState?.columns?.dimensions ?? {}).map(([f, d]) => [f, d.width]),
    ),
  );
  const [editing, setEditing] = useState<{
    rowId: string;
    field: string | null;
    /** The field whose input takes the focus. */
    focus: string;
    /** A typed character started the edit (the caret goes after it). */
    typed: boolean;
  } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string | true>>({});
  const initialDrafts = useRef<Record<string, string>>({});
  const [overrides, setOverrides] = useState<ReadonlyMap<string, R>>(new Map());
  const refocus = useRef<{ rowId: string; field: string } | null>(null);
  // New rows from the parent replace the edits shown so far.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when `rows` changes.
  useEffect(() => {
    setOverrides(new Map());
    setRowOrder(null);
  }, [rows]);
  // Row reordering: an order of ids set by moves (new rows from the parent reset it).
  const [rowOrder, setRowOrder] = useState<readonly string[] | null>(null);
  const [panel, setPanel] = useState<Panel>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [menuField, setMenuField] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const [viewport, setViewport] = useState<GridViewport | null>(null);
  const [sourced, setSourced] = useState<{
    rows: readonly R[];
    rowCount?: number | undefined;
    aggregateRow?: Record<string, unknown> | undefined;
  }>({
    rows: [],
  });
  const [sourceLoading, setSourceLoading] = useState(false);
  // One default cache per data source: a new source never sees the old one's rows.
  // biome-ignore lint/correctness/useExhaustiveDependencies: a new cache for each source.
  const defaultCache = useMemo(() => createGridDataSourceCache<R>(), [dataSource]);
  const lazy = !!lazyLoading && !!dataSource;
  // Lazy loading: rows by index as they arrive; the others show as placeholders.
  const [lazyRows, setLazyRows] = useState<ReadonlyMap<number, R>>(new Map());
  // Server tree data: children loaded per parent id; parents whose children are loading.
  const [childRows, setChildRows] = useState<ReadonlyMap<string, readonly R[]>>(new Map());
  const [loadingChildren, setLoadingChildren] = useState<ReadonlySet<string>>(new Set());
  const serverTree =
    !!dataSource &&
    (!!treeData || (!disableRowGrouping && !lazyLoading && groupingModel.length > 0));
  const base: readonly R[] = lazy
    ? [...lazyRows.values()]
    : dataSource
      ? serverTree
        ? [...sourced.rows, ...[...childRows.values()].flat()]
        : sourced.rows
      : rows;
  const server = {
    sort: !!dataSource || sortingMode === "server",
    filter: !!dataSource || filterMode === "server",
    page: !!dataSource || paginationMode === "server",
  };
  const idOf = (row: R) =>
    isHole(row) ? `__loading__-${row[HOLE]}` : isGroup(row) ? row[GROUP].id : String(getRowId(row));
  const view = base.map((row) => overrides.get(idOf(row)) ?? row);
  const rank = rowOrder ? new Map(rowOrder.map((rowId, i) => [rowId, i])) : null;
  const orderedRows = rank
    ? [...view].sort((a, b) => (rank.get(idOf(a)) ?? rank.size) - (rank.get(idOf(b)) ?? rank.size))
    : view;
  // Phase 6. Pivoting: the filtered rows become groups of `rows` fields with one aggregated column
  // per key of `columns` fields and value; the pivot's columns replace the columns.
  const aggLabel = (fn: string) =>
    (labels[
      `aggregationFunctionLabel${fn.charAt(0).toUpperCase()}${fn.slice(1)}` as keyof GridLabels
    ] as string | undefined) ?? fn;
  // Pivot fields derived from other columns (default: the year and quarter of date columns).
  const derivedColumns: GridColDef<R>[] =
    getPivotDerivedColumns === null
      ? []
      : columnsProp.flatMap((column) => {
          if (column.pivotable === false || column.type === "actions") return [];
          if (getPivotDerivedColumns) return getPivotDerivedColumns(column) ?? [];
          return (
            gridPivotDerivedColumns(column, {
              year: labels.pivotYearColumnHeaderName,
              quarter: labels.pivotQuarterColumnHeaderName,
            }) ?? []
          ).map(({ derive, ...rest }) => ({
            ...rest,
            valueGetter: (row: R) => derive(rawValue(column, row)),
          }));
        });
  const sourceOf = (field: string) =>
    (columnsProp.find((c) => c.field === field) ??
      derivedColumns.find((c) => c.field === field)) as GridColDef<R>;
  const pivotOn = !!pivotActive && !disablePivoting && !treeData && !lazy;
  const pivotRows = pivotOn
    ? server.filter
      ? orderedRows
      : filterGridRows(
          orderedRows,
          filterModel,
          columnsProp,
          (row, field) => rawValue(sourceOf(field), row),
          (row, field) => textOf(sourceOf(field), row),
          { ignoreDiacritics, quickFilterLogicOperator },
        )
    : [];
  const pivot = pivotOn
    ? gridPivot(
        pivotRows,
        [...columnsProp, ...derivedColumns].filter((c) => c.pivotable !== false),
        pivotModel,
        (row, field) => rawValue(sourceOf(field), row),
        (row, field) => textOf(sourceOf(field), row),
        aggLabel,
      )
    : null;
  const columns: readonly GridColDef<R>[] = pivot
    ? pivot.columns.map((c) => {
        const formatter = sourceOf(c.pivotValueField).valueFormatter;
        return {
          ...c,
          valueGetter: (row: R) => pivot.value(row, c.field),
          ...(formatter && pivot.aggregationModel[c.field] !== "size"
            ? { valueFormatter: formatter }
            : {}),
        };
      })
    : columnsProp;
  const columnGroupingModel = pivot
    ? pivot.columnGroupingModel.length
      ? pivot.columnGroupingModel
      : undefined
    : columnGroupingProp;
  // Row grouping (not with tree data or lazy loading) and aggregation.
  const grouping = pivot
    ? pivot.rowGroupingModel
    : treeData || disableRowGrouping || lazy
      ? []
      : groupingModel.filter((f) => columnsProp.some((c) => c.field === f));
  const aggregationModel: GridAggregationModel = pivot
    ? pivot.aggregationModel
    : disableAggregation
      ? {}
      : aggregationState;
  const aggregating = Object.keys(aggregationModel).length > 0;
  const aggregationPosition = (group: GridAggregationGroup): GridAggregationPosition =>
    getAggregationPosition && !pivot
      ? getAggregationPosition(group)
      : group.isRoot
        ? "footer"
        : "inline";
  /** The grouping's positions by level, for the HTML runtime (`data-ok-aggregation-position`). */
  const positions: Record<string, GridAggregationPosition> = {};
  /** The functions a column offers, and the one it uses (when it offers it). */
  const functionsOf = (column: GridColDef<R>) =>
    gridAggregationFunctionsFor(column, aggregationFunctions, column.availableAggregationFunctions);
  const aggregationOf = (column: GridColDef<R>) => {
    const fn = aggregationModel[column.field];
    return fn && functionsOf(column).includes(fn) ? fn : undefined;
  };
  const groupField = treeData ? GRID_TREE_FIELD : GRID_GROUPING_FIELD;
  const treeLike = !!treeData || grouping.length > 0;
  // One grouping column per grouped field (client-side row grouping only).
  const multipleGrouping =
    rowGroupingColumnMode === "multiple" &&
    !treeData &&
    !pivot &&
    !serverTree &&
    grouping.length > 0;
  const groupingColumns = multipleGrouping
    ? grouping.map((field) => gridGroupingField(field))
    : [groupField];
  /** The grouping column's overrides (`groupingColDef`, per column when it is a function). */
  const groupingColDefOf = (field: string): GridGroupingColDef => {
    const own = gridGroupingFieldOf(field);
    const fields = own ? [own] : treeData ? [] : [...grouping];
    return typeof groupingColDef === "function"
      ? groupingColDef({ fields })
      : (groupingColDef ?? {});
  };
  /** The grouping column that shows a group row's name. */
  const groupCellOf = (row: R & Group) =>
    multipleGrouping ? gridGroupingField(row[GROUP].field ?? null) : groupField;
  /** A row's group key: `groupingValueGetter` (from `row[field]`), else the cell's text. */
  const groupingKeyOf = (row: R, field: string) => {
    const column = sourceOf(field);
    return column?.groupingValueGetter
      ? gridGroupingKey(column.groupingValueGetter((row as Record<string, unknown>)[field], row))
      : textOf(column, row);
  };
  const ordered = orderGridColumns(columns, order);
  /** What row spanning compares: the column's `rowSpanValueGetter`, else the cell's text. */
  const spanKeyOf = (column: GridColDef<R>, row: R) =>
    column.rowSpanValueGetter && isData(row)
      ? asText(column.rowSpanValueGetter(rawValue(column, row), row))
      : textOf(column, row);
  // While printing (every row and the printed columns render, then the page prints).
  const [printing, setPrinting] = useState<GridPrintOptions | null>(null);
  const shown = visibleGridColumns(
    arrangeGridColumns(ordered, pinned),
    printing?.allColumns || pivot ? {} : visibility,
  );
  const leftPinned = shown.some((c) => gridPinSide(pinned, c.field) === "left");
  const editable = (column: GridColDef<R>) =>
    !!column.editable && !column.valueGetter && column.type !== "actions";
  const columnOf = (field: string) => columns.find((c) => c.field === field) as GridColDef<R>;
  const operators = Object.fromEntries(
    columns.flatMap((c) => (c.filterOperators ? [[c.field, c.filterOperators]] : [])),
  ) as Record<string, readonly GridFilterOperator<R>[]>;
  const searchColumns = (quickFilterExcludeHiddenColumns ? shown : columns).map((c) =>
    c.getApplyQuickFilterFn === null ? { ...c, searchable: false } : c,
  );
  const localFilter = (list: readonly R[]) =>
    filterGridRows(
      list,
      filterModel,
      columns,
      (row, field) => rawValue(columnOf(field), row),
      (row, field) => textOf(columnOf(field), row),
      {
        ignoreDiacritics,
        quickFilterLogicOperator,
        quickFilterColumns: searchColumns,
        operators,
      },
    );
  const sortParams = (column: GridColDef<R>, row: R): GridCellParams<R> => ({
    id: idOf(row),
    field: column.field,
    row,
    value: rawValue(column, row),
  });
  /** A column's own comparator for a direction, called with MUI X's cell params. */
  const comparatorOf = (field: string, direction: GridSortDirection) => {
    const column = columns.find((c) => c.field === field);
    const own = gridDirectedComparator<R>(
      column && {
        sortComparator: column.sortComparator
          ? (a, b, rowA, rowB) =>
              (column.sortComparator as GridComparatorFn<R>)(
                a,
                b,
                sortParams(column, rowA),
                sortParams(column, rowB),
              )
          : undefined,
        getSortComparator: column.getSortComparator
          ? (d) => {
              const fn = column.getSortComparator?.(d);
              return fn
                ? (a, b, rowA, rowB) => fn(a, b, sortParams(column, rowA), sortParams(column, rowB))
                : undefined;
            }
          : undefined,
      },
      direction,
    );
    return own;
  };
  const localSort = (list: readonly R[]) =>
    sortGridRows(
      list,
      sortModel,
      columns,
      (row, field) => rawValue(columnOf(field), row),
      comparatorOf,
    );
  // Tree data: which rows are open (absent: the default depth).
  const [expansion, setExpansion] = useState<ReadonlyMap<string, boolean>>(new Map());
  const serverParents = new Map<string, string>();
  for (const [parent, kids] of childRows)
    for (const kid of kids) serverParents.set(idOf(kid), parent);
  const aggregates = new Map<string, Record<string, unknown>>();
  /** Row grouping: each group's rows that pass the filter. */
  const leafCounts = new Map<string, number>();
  const aggregateRows = (list: readonly R[]) =>
    gridAggregate(
      list,
      Object.fromEntries(
        columns.flatMap((c) => (aggregationOf(c) ? [[c.field, aggregationOf(c) as string]] : [])),
      ),
      columns,
      (row, field) => rawValue(columnOf(field), row),
      aggregationFunctions,
    );
  let filtered: readonly R[];
  let sorted: readonly R[];
  let tree: Map<string, GridTreeRow<R>> | null = null;
  let treeOrder: readonly R[] | null = null;
  if (lazy) {
    const count = sourced.rowCount ?? rowCount ?? 0;
    sorted = Array.from({ length: count }, (_, i) => lazyRows.get(i) ?? holeAt<R>(i));
    filtered = sorted;
  } else if (treeLike) {
    // Tree data (generated rows for missing parents) or row grouping (one row per group);
    // the pivot shows its groups only.
    const source = pivot ? pivotRows : orderedRows;
    const nodes = serverTree
      ? null
      : treeData
        ? gridTreeGroups(source, idOf, getTreeDataPath ?? (() => []))
        : gridRowGroups(source, grouping, idOf, groupingKeyOf);
    const generated = (nodes?.groups ?? []).map((node) => asGroupRow<R>(node));
    const items = pivot ? generated : [...generated, ...source];
    const parents: ReadonlyMap<string, string | null> = nodes ? nodes.parentOf : serverParents;
    const byId = new Map([...items, ...source].map((row) => [idOf(row), row]));
    const passed = server.filter || pivot ? null : localFilter(source);
    const pass = passed ? new Set(passed) : null;
    const place = server.sort ? null : new Map(localSort(source).map((row, i) => [row, i]));
    // Aggregated values of each group: in its row, or in a footer row after its rows.
    const groupValues = new Map<string, Record<string, unknown>>();
    const footers = new Map<string, GridGroupNode>();
    if (aggregating) {
      const scoped = (list: readonly R[]) =>
        aggregationRowsScope === "all" || !pass ? list : list.filter((r) => pass.has(r));
      for (const node of nodes?.groups ?? []) {
        const position = aggregationPosition({
          id: node.id,
          depth: node.depth,
          isRoot: false,
          groupingField: node.field,
          groupingKey: node.key,
        });
        if (node.field && !(node.field in positions)) positions[node.field] = position;
        if (position === null) continue;
        const values = aggregateRows(scoped(node.leafIds.map((leaf) => byId.get(leaf) as R)));
        groupValues.set(node.id, values);
        if (position === "footer") {
          footers.set(node.id, node);
          aggregates.set(gridGroupFooterId(node.id), values);
        } else aggregates.set(node.id, values);
      }
    }
    const openOf = (rowId: string, depth: number) =>
      expansion.get(rowId) ??
      (isGroupExpandedByDefault
        ? isGroupExpandedByDefault({ id: rowId, depth, row: byId.get(rowId) as R })
        : gridExpandedByDepth(defaultGroupingExpansionDepth, depth));
    for (const node of nodes?.groups ?? [])
      leafCounts.set(
        node.id,
        pass
          ? node.leafIds.filter((leaf) => pass.has(byId.get(leaf) as R)).length
          : node.leafIds.length,
      );
    const firstPlace = new Map<string, number>();
    for (const node of nodes?.groups ?? [])
      firstPlace.set(
        node.id,
        Math.min(...node.leafIds.map((leaf) => place?.get(byId.get(leaf) as R) ?? 0)),
      );
    const options = {
      idOf,
      parentOf: (row: R) => parents.get(idOf(row)) ?? null,
      keep: pass ? (row: R) => !isGroup(row) && pass.has(row) : undefined,
      compare: place
        ? gridGroupComparator<R>({
            isGroup,
            place: (row) => place.get(row) as number,
            firstPlace: (row) => firstPlace.get(idOf(row)) as number,
            keyOf: (row) => (row as Group)[GROUP].key,
            aggregateOf: (row, field) => groupValues.get(idOf(row))?.[field],
            fieldOf: (row) => (isGroup(row) ? row[GROUP].field : undefined),
            sortModel,
            columns,
            groupFields: grouping,
            aggregated: Object.keys(aggregationModel),
          })
        : undefined,
    };
    // Footer rows follow the last row of their open group (the same object in both lists).
    const footerRows = new Map<string, R>();
    const withFooters = (rows: GridTreeRow<R>[]) =>
      footers.size
        ? gridWithGroupFooters(
            rows,
            (node) => footers.has(node.id),
            (node) => {
              let footer = footerRows.get(node.id);
              if (!footer) {
                footer = asFooterRow<R>(footers.get(node.id) as GridGroupNode);
                footerRows.set(node.id, footer);
              }
              return footer;
            },
          )
        : rows;
    const list = withFooters(gridTreeRows(items, { ...options, expanded: openOf }));
    // Every row renders (children of closed rows `hidden`), so the markup holds the whole tree.
    const all = serverTree
      ? list
      : withFooters(gridTreeRows(items, { ...options, expanded: () => true }));
    tree = new Map(
      all.map((node) => [
        node.id,
        { ...node, expanded: node.childrenCount > 0 && openOf(node.id, node.depth) },
      ]),
    );
    treeOrder = all.map((node) => node.row);
    sorted = list.map((node) => node.row);
    filtered = sorted;
  } else if (pivot) {
    // A pivot without row fields shows its totals only (the footer row).
    filtered = [];
    sorted = [];
  } else {
    filtered = server.filter ? orderedRows : localFilter(orderedRows);
    sorted = server.sort ? filtered : localSort(filtered);
  }
  // The root's values show in a footer row (MUI X: a pinned bottom row). Server-side
  // aggregation: the data source's `aggregateRow` (through `getAggregatedValue`).
  const rootPosition = aggregationPosition({
    id: GRID_AGGREGATION_ROOT_ID,
    depth: -1,
    isRoot: true,
  });
  positions["root"] = rootPosition;
  const serverAggregation =
    !!dataSource && !pivot && (!!dataSource.getAggregatedValue || !!sourced.aggregateRow);
  const requestedAggregation: GridAggregationModel = Object.fromEntries(
    columns.flatMap((c) => (aggregationOf(c) ? [[c.field, aggregationOf(c) as string]] : [])),
  );
  /** A server row's aggregated value (`getAggregatedValue`, else `row[field]`). */
  const serverValue = (row: R | Record<string, unknown>, field: string) =>
    dataSource?.getAggregatedValue
      ? dataSource.getAggregatedValue(row, field)
      : (row as Record<string, unknown>)[field];
  const rootAggregates =
    aggregating && (!lazy || serverAggregation) && rootPosition === "footer"
      ? serverAggregation
        ? Object.fromEntries(
            Object.keys(requestedAggregation).map((field) => [
              field,
              sourced.aggregateRow ? serverValue(sourced.aggregateRow, field) : undefined,
            ]),
          )
        : aggregateRows(
            pivot
              ? pivotRows
              : aggregationRowsScope === "all" || server.filter
                ? orderedRows
                : localFilter(orderedRows),
          )
      : null;
  const total = server.page
    ? ((dataSource ? sourced.rowCount : rowCount) ?? sorted.length)
    : sorted.length;
  const pageCount = Math.max(Math.ceil(total / pagination.pageSize), 1);
  const page = Math.min(pagination.page, pageCount - 1);
  // Rows of the page: all of them with server pagination or without a footer.
  const unpaged = server.page || hideFooter || hideFooterPagination || lazy;
  const pageStart = unpaged ? 0 : page * pagination.pageSize;
  const pageEnd = unpaged ? sorted.length : pageStart + pagination.pageSize;
  const onPage = (index: number) =>
    index >= 0 && (!!printing || (index >= pageStart && index < pageEnd));
  const pageRows = sorted.slice(pageStart, pageEnd);
  const [detailIds, setDetailIds] = useControllableState<readonly string[]>({
    value: detailPanelExpandedRowIds,
    defaultValue: [],
    onChange: (next) => onDetailPanelExpandedRowIdsChange?.([...next]),
  });
  const detailOf = (row: R) =>
    getDetailPanelContent && isData(row) && detailIds.includes(idOf(row))
      ? getDetailPanelContent({ id: idOf(row), row })
      : null;
  const factor = gridDensityFactor(density);
  // Rows of their own height (or spacing) need per-row offsets for the window.
  const rowParams = (row: R, i: number): GridRowParams<R> => ({
    id: idOf(row),
    row,
    indexRelativeToCurrentPage: i,
    isFirstVisible: i === 0,
    isLastVisible: i === pageRows.length - 1,
  });
  const heightOf = (row: R) =>
    isGroup(row) ? undefined : getRowHeight?.({ id: idOf(row), model: row, densityFactor: factor });
  const spacingOf = (row: R, i: number) =>
    (isGroup(row) ? undefined : getRowSpacing?.(rowParams(row, i))) ?? {};
  const variable =
    !!getRowHeight || !!getRowSpacing || (!!getDetailPanelContent && detailIds.length > 0);
  const baseHeight = Math.round((rowHeight ?? 52) * factor);
  // Header heights of their own (px × the density factor), as private properties of the root.
  const headerHeights = gridHeaderHeightProperties(
    { columnHeaderHeight, columnGroupHeaderHeight, headerFilterHeight },
    density,
  );
  const measured = useRef(new Map<string, number>());
  const [, remeasured] = useState(0);
  // Virtualization starts once the grid is measured: the first render (and SSR) shows every row,
  // rows of other pages `hidden` (as the HTML runtime does).
  const virtual =
    !disableVirtualization && !printing && !!viewport?.scrolls && viewport.rowHeight > 0;
  let range: GridRowWindow | null = null;
  let offsets: number[] | null = null;
  if (virtual) {
    const vp = viewport as GridViewport;
    if (variable) {
      const heights = pageRows.map((row, i) => {
        const own = heightOf(row);
        const space = spacingOf(row, i);
        const seen = measured.current.get(idOf(row));
        const box =
          seen ??
          (typeof own === "number"
            ? own + 1
            : (getEstimatedRowHeight?.({ id: idOf(row), model: row }) ?? baseHeight) + 1);
        // Border spacing is inside the row: a measured row already holds it.
        return seen !== undefined && rowSpacingType === "border"
          ? box
          : box + (space.top ?? 0) + (space.bottom ?? 0);
      });
      offsets = gridRowOffsets(heights);
      range = gridRowWindowOf(offsets, vp.offset, vp.viewport, rowBufferPx);
    } else
      range = gridRowWindow(pageRows.length, vp.rowHeight, vp.offset, vp.viewport, rowBufferPx);
  }
  // Lazy grids never render every row: before the first measure, the first chunk only.
  if (!range && lazy && !printing && pageRows.length > LAZY_CHUNK)
    range = {
      start: 0,
      end: LAZY_CHUNK,
      before: 0,
      after: (pageRows.length - LAZY_CHUNK) * (baseHeight + 1),
    };
  // Row spans (on the page): cells merge with the rows below; the window starts at a span's top.
  const spanFields = shown.filter((c) => c.type !== "actions").map((c) => c.field);
  const spans = rowSpanning
    ? gridRowSpans(pageRows, spanFields, (row, field) => spanKeyOf(columnOf(field), row))
    : null;
  if (range && spans && range.start > 0) {
    const start = spans.origin[range.start] as number;
    const before = offsets
      ? (offsets[start] as number)
      : start * (viewport as GridViewport).rowHeight;
    range = { ...range, start, before };
  }
  const rendered = range
    ? pageRows
        .slice((range as GridRowWindow).start, (range as GridRowWindow).end)
        .map((row, i) => ({ row, index: pageStart + (range as GridRowWindow).start + i }))
    : treeOrder
      ? (() => {
          const position = new Map(sorted.map((row, index) => [row, index]));
          return treeOrder.map((row) => ({ row, index: position.get(row) ?? -1 }));
        })()
      : sorted.map((row, index) => ({ row, index }));
  const busy = !!loading || sourceLoading;
  // Rows of a server page sit after the rows of the pages before it.
  const rowOffset = server.page ? page * pagination.pageSize : 0;
  const multiple = !disableMultipleRowSelection;
  const selectable = (row: R) => isData(row) && (isRowSelectable?.({ id: idOf(row), row }) ?? true);
  // Select all: the selectable rows of every page (or of this page only).
  const allIds = (
    checkboxSelectionVisibleOnly
      ? pageRows
      : grouping.length > 0 && !serverTree
        ? localSort(server.filter ? orderedRows : localFilter(orderedRows))
        : sorted
  )
    .filter(selectable)
    .map(idOf);
  const selectAll = gridSelectAllState(allIds, selection);
  // Rows that went away leave the selection (unless kept); not on mount.
  const mounted = useRef(false);
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the rows change.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (keepNonExistentRowsSelected) return;
    const kept = pruneGridSelection(selection, base.map(idOf));
    if (kept.length !== selection.length) setSelection(kept);
  }, [base]);
  // Columns the grid adds before the others: reorder handle, checkbox, detail toggle, tree group.
  const specials = [
    ...(rowReordering ? [{ field: REORDER_FIELD, width: 50 }] : []),
    ...(checkboxSelection ? [{ field: GRID_CHECKBOX_FIELD, width: GRID_CHECKBOX_WIDTH }] : []),
    ...(getDetailPanelContent ? [{ field: DETAIL_FIELD, width: 50 }] : []),
    ...(treeLike
      ? groupingColumns.map((field) => ({ field, width: groupingColDefOf(field).width ?? 200 }))
      : []),
  ];
  const colOffset = specials.length + 1;
  const colCount = specials.length + shown.length;
  const specialIndex = (field: string) => specials.findIndex((c) => c.field === field) + 1;
  // Column groups: header rows above the column headers.
  const groupPaths = useMemo(
    () => gridGroupPaths(columnGroupingModel ?? []),
    [columnGroupingModel],
  );
  const groupsById = useMemo(
    () => gridGroupsById(columnGroupingModel ?? []),
    [columnGroupingModel],
  );
  const groupRows = columnGroupingModel
    ? gridGroupRows(
        shown.map((c) => c.field),
        groupPaths,
      )
    : [];
  const headerLevels = groupRows.length;
  // Header filters: a header row under the column headers.
  const filterRow = headerFilters ? 1 : 0;
  const footerRow = rootAggregates ? 1 : 0;
  const topRows = pinnedRows?.top ?? [];
  const bottomRows = pinnedRows?.bottom ?? [];
  // Column virtualization: only the scrolling columns in view (fixed widths, no spans or groups).
  const trackPx = (c: GridColDef<R>) =>
    widths[c.field] !== undefined
      ? clampGridWidth(c, widths[c.field] as number)
      : Math.max(c.width ?? 100, c.minWidth ?? 50);
  const leftCols = shown.filter((c) => gridPinSide(pinned, c.field) === "left");
  const rightCols = shown.filter((c) => gridPinSide(pinned, c.field) === "right");
  const middleCols = shown.filter((c) => !gridPinSide(pinned, c.field));
  const fixedWidths = shown.every((c) => widths[c.field] !== undefined || !((c.flex ?? 0) > 0));
  let colWindow: GridRowWindow | null = null;
  if (
    !disableVirtualization &&
    !printing &&
    viewport?.width &&
    fixedWidths &&
    !listView &&
    headerLevels === 0 &&
    !shown.some((c) => c.colSpan !== undefined) &&
    middleCols.length > 0
  ) {
    const pinnedPx =
      specials.reduce((sum, c) => sum + c.width, 0) +
      [...leftCols, ...rightCols].reduce((sum, c) => sum + trackPx(c), 0);
    const window = gridColumnWindow(
      middleCols.map(trackPx),
      viewport.left ?? 0,
      viewport.width - pinnedPx,
      columnBufferPx,
    );
    if (window.before > 0 || window.after > 0) colWindow = window;
  }
  const visibleMiddle = colWindow ? middleCols.slice(colWindow.start, colWindow.end) : middleCols;
  const renders = (column: GridColDef<R>) =>
    !colWindow || gridPinSide(pinned, column.field) !== undefined || visibleMiddle.includes(column);
  const template = [
    ...specials.map((c) => `${c.width}px`),
    ...(colWindow
      ? [
          ...leftCols.map((c) => `${trackPx(c)}px`),
          `${colWindow.before}px`,
          ...visibleMiddle.map((c) => `${trackPx(c)}px`),
          `${colWindow.after}px`,
          ...rightCols.map((c) => `${trackPx(c)}px`),
        ]
      : [gridColumnTemplate(shown, false, widths)]),
  ]
    .filter(Boolean)
    .join(" ");
  /** With column virtualization, the cells after a spacer track say where they start. */
  const colStart = (column: GridColDef<R>): number | undefined => {
    if (!colWindow) return undefined;
    const first = specials.length + leftCols.length + 2;
    return column === visibleMiddle[0]
      ? first
      : column === rightCols[0]
        ? first + visibleMiddle.length + 1
        : undefined;
  };

  useEffect(() => {
    const grid = gridRef.current as HTMLDivElement;
    const handle = createGridNavigation(grid, {
      onSort: (field, multi) => sortBy.current(field, multi),
      onColumnMenu: (field, header) =>
        openMenu.current(field, header.querySelector("[data-ok-data-grid-menu-button]")),
      onToggleRow: (row) => toggleRow.current(row.getAttribute("data-ok-row-id") as string),
      onSelectAll: () => selectEvery.current(),
      onEdit: (cell, reason, key) =>
        startEdit.current(
          cell.closest('[role="row"]')?.getAttribute("data-ok-row-id") as string,
          cell.getAttribute("data-ok-field") as string,
          reason,
          key,
        ),
      onToggleExpansion: (row, expanded) =>
        toggleExpansion.current(row.getAttribute("data-ok-row-id") as string, expanded),
      onResizeKey: (field, delta) => {
        const header = grid.querySelector<HTMLElement>(
          `[role="columnheader"][data-ok-field="${CSS.escape(field)}"]`,
        ) as HTMLElement;
        resizeTo.current(field, header.getBoundingClientRect().width + delta, true);
      },
    });
    navigation.current = handle;
    return () => handle.destroy();
  }, []);
  useEffect(() => navigation.current?.sync());
  useEffect(() => {
    const handle = createGridColumnControls(gridRef.current as HTMLDivElement, {
      onResize: (field, width, done) => resizeTo.current(field, width, done),
      onMove: (field, target) => moveTo.current(field, target),
      canReorder: () => reorderable.current,
      onAutosize: (field) => autosize.current({ columns: [field] }),
    });
    return () => handle.destroy();
  }, []);
  // Rows of their own height: measure the rendered ones; new heights move the window.
  useLayoutEffect(() => {
    if (!variable) return;
    let changed = false;
    for (const row of (gridRef.current as HTMLDivElement).querySelectorAll<HTMLElement>(
      '[data-ok-data-grid-body] > [role="row"][data-ok-row-id]:not([hidden])',
    )) {
      const rowId = row.getAttribute("data-ok-row-id") as string;
      // A row's open detail panel counts with it.
      const panel = row.nextElementSibling?.hasAttribute("data-ok-data-grid-detail")
        ? (row.nextElementSibling as HTMLElement).offsetHeight
        : 0;
      const height = row.offsetHeight + panel;
      if (row.offsetHeight && measured.current.get(rowId) !== height) {
        measured.current.set(rowId, height);
        changed = true;
      }
    }
    if (changed && virtual) remeasured((n) => n + 1);
  });
  // Row reordering: the controller reports moves; the row keeps its focus.
  const [announcement, setAnnouncement] = useState("");
  const firstRowIndex = headerLevels + filterRow + topRows.length + 2;
  const canReorder = useRef(false);
  canReorder.current =
    !!rowReordering &&
    !treeLike &&
    !lazy &&
    sortModel.length === 0 &&
    filterModel.items.length === 0 &&
    !filterModel.quickFilterValues?.length;
  const refocusHandle = useRef<string | null>(null);
  const reorderMove = useRef<(rowId: string, rowIndex: number) => void>(undefined as never);
  reorderMove.current = (rowId, rowIndex) => {
    const ids = sorted.map(idOf);
    const oldIndex = ids.indexOf(rowId);
    const targetIndex = Math.min(Math.max(rowIndex - firstRowIndex - rowOffset, 0), ids.length - 1);
    if (oldIndex < 0 || oldIndex === targetIndex) return;
    setRowOrder(moveGridRow(ids, rowId, targetIndex));
    onRowOrderChange?.({ row: sorted[oldIndex] as R, oldIndex, targetIndex });
    setAnnouncement(
      labels.rowReorderingMoved
        .replace("{position}", String(targetIndex + 1))
        .replace("{count}", String(ids.length)),
    );
    refocusHandle.current = rowId;
  };
  useEffect(() => {
    const handle = createGridRowReorder(gridRef.current as HTMLDivElement, {
      canReorder: () => canReorder.current,
      onMove: (rowId, rowIndex) => reorderMove.current(rowId, rowIndex),
    });
    return () => handle.destroy();
  }, []);
  useLayoutEffect(() => {
    if (!refocusHandle.current) return;
    const rowId = refocusHandle.current;
    refocusHandle.current = null;
    (gridRef.current as HTMLDivElement)
      .querySelector<HTMLElement>(
        `[data-ok-row-id="${CSS.escape(rowId)}"] [data-ok-data-grid-reorder-handle]`,
      )
      ?.focus();
  });
  // Tree data: open or close a row; server trees load the children the first time.
  const toggleExpansion = useRef<(rowId: string, open?: boolean) => void>(undefined as never);
  toggleExpansion.current = (rowId, open) => {
    const node = tree?.get(rowId);
    if (!node) return;
    const current = serverTree ? expansion.get(rowId) === true : node.expanded;
    const next = open ?? !current;
    setExpansion(new Map(expansion).set(rowId, next));
    if (serverTree && next && !childRows.has(rowId) && dataSource) {
      // The group keys of the row and its ancestors.
      const keys: string[] = [];
      for (let row: R | undefined = node.row; row; ) {
        keys.unshift(dataSource.getGroupKey?.(row) ?? idOf(row));
        const parent = serverParents.get(idOf(row));
        row = parent ? (tree?.get(parent)?.row as R | undefined) : undefined;
      }
      setLoadingChildren((current) => new Set(current).add(rowId));
      dataSource
        .getRows({
          sortModel,
          filterModel,
          groupKeys: keys,
          ...(treeData ? {} : { groupFields: grouping }),
          ...(aggregating && !pivot ? { aggregationModel: requestedAggregation } : {}),
        })
        .then((response) => setChildRows((current) => new Map(current).set(rowId, response.rows)))
        .catch((error: unknown) => onDataSourceError?.(error))
        .finally(() =>
          setLoadingChildren((current) => {
            const next = new Set(current);
            next.delete(rowId);
            return next;
          }),
        );
    }
  };
  const toggleDetail = (rowId: string) =>
    setDetailIds(
      detailIds.includes(rowId) ? detailIds.filter((d) => d !== rowId) : [...detailIds, rowId],
    );
  // Sticky offsets of pinned columns, after every layout.
  useLayoutEffect(() => syncGridPinning(gridRef.current as HTMLDivElement));
  const scrollEnd = useRef<() => void>(undefined as never);
  const endCount = useRef(-1);
  scrollEnd.current = () => {
    if (!onRowsScrollEnd || endCount.current === sorted.length) return;
    endCount.current = sorted.length;
    onRowsScrollEnd({ visibleRowsCount: sorted.length });
  };
  const threshold = useRef(scrollEndThreshold);
  threshold.current = scrollEndThreshold;
  const watcher = useRef<ReturnType<typeof createGridScrollWatcher> | null>(null);
  useEffect(() => {
    const handle = createGridScrollWatcher(gridRef.current as HTMLDivElement, {
      onChange: (next) =>
        setViewport((current) =>
          current &&
          current.offset === next.offset &&
          current.viewport === next.viewport &&
          current.rowHeight === next.rowHeight &&
          current.scrolls === next.scrolls &&
          current.left === next.left &&
          current.width === next.width
            ? current
            : next,
        ),
      onScrollEnd: () => scrollEnd.current(),
      threshold: () => threshold.current,
    });
    watcher.current = handle;
    handle.measure();
    return () => handle.destroy();
  }, []);
  // A new density or new rows: measure the rows again.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-measures when these change.
  useEffect(() => watcher.current?.measure(), [density, rendered.length > 0]);
  // autoPageSize: the page size follows the scroll area's height (rows of the grid's height).
  const fitPage = useRef<() => void>(undefined as never);
  fitPage.current = () => {
    const main = gridRef.current;
    if (!autoPageSize || !main || hideFooter || hideFooterPagination || lazy) return;
    const size = gridAutoPageSize(main, baseHeight + 1);
    if (size === pagination.pageSize) return;
    const last = Math.max(Math.ceil(total / size), 1) - 1;
    setPagination({ page: Math.min(pagination.page, last), pageSize: size });
  };
  useEffect(() => {
    if (!autoPageSize || typeof ResizeObserver !== "function") return;
    const observer = new ResizeObserver(() => fitPage.current());
    observer.observe(gridRef.current as HTMLDivElement);
    return () => observer.disconnect();
  }, [autoPageSize]);
  // biome-ignore lint/correctness/useExhaustiveDependencies: fits again when the rows' height changes.
  useEffect(() => fitPage.current(), [autoPageSize, baseHeight]);

  const cache = dataSourceCache === undefined ? defaultCache : dataSourceCache;
  const request = JSON.stringify({
    sortModel,
    filterModel,
    paginationModel: { page: pagination.page, pageSize: pagination.pageSize },
    ...(serverTree ? { groupKeys: [] } : {}),
    ...(serverTree && !treeData ? { groupFields: grouping } : {}),
    ...(aggregating && !pivot ? { aggregationModel: requestedAggregation } : {}),
  });
  // New top-level rows: children loaded before belong to the old ones.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the request changes.
  useEffect(() => setChildRows(new Map()), [request, dataSource]);
  useEffect(() => {
    if (!dataSource || lazy) return;
    const params = JSON.parse(request);
    const cached = cache?.get(params);
    if (cached) {
      setSourced(cached);
      return;
    }
    let current = true;
    setSourceLoading(true);
    dataSource
      .getRows(params)
      .then((response) => {
        cache?.set(params, response);
        if (current) setSourced(response);
      })
      .catch((error: unknown) => {
        if (current) onDataSourceError?.(error);
      })
      .finally(() => {
        if (current) setSourceLoading(false);
      });
    return () => {
      current = false;
    };
  }, [dataSource, cache, request, onDataSourceError, lazy]);
  // Lazy loading: ask for the chunks the window misses (throttled); a new sort or filter restarts.
  const lazyAggregation = aggregating && !pivot ? requestedAggregation : null;
  const lazyKey = JSON.stringify({ sortModel, filterModel, lazyAggregation });
  const lazyWindow = range ?? { start: 0, end: Math.min(total || LAZY_CHUNK, LAZY_CHUNK) };
  const lazyState = useRef({ key: "", pending: new Set<string>(), last: 0 });
  // A new data source: lazily loaded rows belonged to the old one.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when the source changes.
  useEffect(() => {
    lazyState.current.key = "";
    lazyState.current.pending.clear();
    setLazyRows(new Map());
  }, [dataSource]);
  const lazyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  // biome-ignore lint/correctness/useExhaustiveDependencies: asks for the rows the window misses.
  useEffect(() => {
    if (!lazy || !dataSource) return;
    const state = lazyState.current;
    if (state.key !== lazyKey) {
      state.key = lazyKey;
      state.pending.clear();
      if (lazyRows.size) {
        setLazyRows(new Map());
        return;
      }
    }
    const ranges = gridMissingRanges(
      (i) => lazyRows.has(i),
      lazyWindow,
      LAZY_CHUNK,
      total > 0 ? total : lazyWindow.end,
    ).filter((r) => !state.pending.has(`${r.start}-${r.end}`));
    if (!ranges.length) return;
    const run = () => {
      state.last = Date.now();
      for (const r of ranges) {
        const name = `${r.start}-${r.end}`;
        state.pending.add(name);
        setSourceLoading(true);
        dataSource
          .getRows({
            sortModel,
            filterModel,
            start: r.start,
            end: r.end,
            ...(lazyAggregation ? { aggregationModel: lazyAggregation } : {}),
          })
          .then((response) => {
            if (state.key !== lazyKey) return;
            setLazyRows((current) => {
              const next = new Map(current);
              for (const [k, row] of response.rows.entries()) next.set(r.start + k, row);
              return next;
            });
            if (response.rowCount !== undefined || response.aggregateRow)
              setSourced((current) => ({
                ...current,
                ...(response.rowCount !== undefined ? { rowCount: response.rowCount } : {}),
                ...(response.aggregateRow ? { aggregateRow: response.aggregateRow } : {}),
              }));
          })
          .catch((error: unknown) => onDataSourceError?.(error))
          .finally(() => {
            state.pending.delete(name);
            setSourceLoading(state.pending.size > 0);
          });
      }
    };
    const wait = lazyLoadingRequestThrottleMs - (Date.now() - state.last);
    clearTimeout(lazyTimer.current);
    if (wait > 0) lazyTimer.current = setTimeout(run, wait);
    else run();
    return () => clearTimeout(lazyTimer.current);
  }, [lazy, lazyWindow.start, lazyWindow.end, lazyKey, total, lazyRows]);
  useEffect(() => {
    if (editing) {
      const grid = gridRef.current as HTMLDivElement;
      // The field's input; with `renderEditCell`, its marked input or its first control.
      const at = `[data-ok-field="${CSS.escape(editing.focus)}"][data-ok-editing]`;
      const input =
        grid.querySelector<HTMLInputElement>(`${at} [data-ok-data-grid-edit-input]`) ??
        grid.querySelector<HTMLInputElement>(`${at} :is(${EDIT_FOCUSABLE})`) ??
        grid.querySelector<HTMLInputElement>("[data-ok-data-grid-edit-input]");
      input?.focus();
      if (editing.typed && input?.type === "text")
        input.setSelectionRange(input.value.length, input.value.length);
    } else if (refocus.current) {
      const { rowId, field } = refocus.current;
      refocus.current = null;
      gridRef.current
        ?.querySelector<HTMLElement>(
          `[data-ok-row-id="${CSS.escape(rowId)}"] :is([role="gridcell"], [role="rowheader"])[data-ok-field="${CSS.escape(field)}"]`,
        )
        ?.focus();
    }
  }, [editing]);

  // Latest handlers for the navigation controller (it lives as long as the grid).
  const sortBy = useRef<(field: string, multi: boolean) => void>(undefined as never);
  sortBy.current = (field, multi) => {
    const column = columns.find((c) => c.field === field);
    if (!column || disableColumnSorting || !isGridSortable(column)) return;
    setSortModel(
      nextGridSort(
        sortModel,
        field,
        (multi || multipleColumnsSortingMode === "always") && !disableMultipleColumnsSorting,
        sortCycle(column),
      ),
    );
  };
  const toggleRow = useRef<(id: string) => void>(undefined as never);
  toggleRow.current = (rowId) => {
    // Only rows with aria-selected (checkbox selection) reach here.
    const row = view.find((r) => idOf(r) === rowId);
    if (row && !selectable(row)) return;
    setSelection(selectGridRow(selection, rowId, multiple));
  };
  const selectEvery = useRef<() => void>(undefined as never);
  selectEvery.current = () => {
    // Cell selection: every cell of the page.
    if (cellSelection) {
      const last = cellRowIds.at(-1);
      if (last)
        setCellModel(
          gridCellRange(
            cellRowIds,
            cellFields,
            { id: cellRowIds[0] as string, field: cellFields[0] as string },
            { id: last, field: cellFields.at(-1) as string },
          ),
        );
      return;
    }
    if (checkboxSelection && multiple) setSelection(toggleGridRows(selection, allIds));
  };
  const openMenu = useRef<(field: string, button: Element | null) => void>(undefined as never);
  openMenu.current = (field, button) => {
    if (disableColumnMenu || !button) return;
    setMenuField(field);
    setMenuAnchor(button as HTMLElement);
  };

  const resizeTo = useRef<(field: string, width: number, done: boolean) => void>(
    undefined as never,
  );
  resizeTo.current = (field, width, done) => {
    const column = columns.find((c) => c.field === field);
    if (!column || disableColumnResize || !isGridResizable(column)) return;
    const next = clampGridWidth(column, width);
    setWidths((current) => ({ ...current, [field]: next }));
    if (done) onColumnWidthChange?.(field, next);
  };
  const autosize = useRef<(options?: GridAutosizeOptions) => void>(undefined as never);
  autosize.current = (overrides = {}) => {
    const options = { ...autosizeOptions, ...overrides };
    const grid = gridRef.current as HTMLDivElement;
    const fields = options.columns ?? shown.filter(isGridResizable).map((c) => c.field);
    const next: GridColumnWidths = {};
    for (const field of fields) {
      const column = columns.find((c) => c.field === field);
      if (column) next[field] = clampGridWidth(column, measureGridColumn(grid, field, options));
    }
    setWidths((current) => ({ ...current, ...next }));
    for (const [field, width] of Object.entries(next)) onColumnWidthChange?.(field, width);
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: once, after the first layout.
  useLayoutEffect(() => {
    if (!autosizeOnMount) return;
    autosize.current();
    // Again once web fonts are in: text widths change with the font.
    let live = true;
    document.fonts?.ready.then(() => {
      if (live) autosize.current();
    });
    return () => {
      live = false;
    };
  }, []);
  const reorderable = useRef(true);
  reorderable.current = !disableColumnReorder;
  const fields = ordered.map((c) => c.field);
  const moveTo = useRef<(field: string, target: string) => void>(undefined as never);
  moveTo.current = (field, target) => {
    if (columnGroupingModel && !gridCanMoveColumn(groupPaths, field, target)) return;
    setOrder(moveGridColumn(fields, field, { to: target }, gridLockedFields(columns)));
  };

  /** A column's sort cycle: its own, the grid's, else asc → desc → none. */
  function sortCycle(column: GridColDef<R>): GridSortingOrder {
    return (
      parseGridSortingOrder(column.sortingOrder) ??
      parseGridSortingOrder(sortingOrder) ??
      GRID_SORTING_ORDER
    );
  }
  const cellParams = (column: GridColDef<R>, row: R): GridCellParams<R> => ({
    id: idOf(row),
    field: column.field,
    row,
    value: rawValue(column, row),
  });
  const cellEditable = (column: GridColDef<R>, row: R) =>
    editable(column) && (isCellEditable?.(cellParams(column, row)) ?? true);
  const parse = (column: GridColDef<R>, text: string, row: R) =>
    column.valueParser ? column.valueParser(text, row) : parseGridEditValue(text, column.type);
  // Edit modes: controlled through `cellModesModel` (cell mode) or `rowModesModel` (row mode).
  // Controlled, a start or a stop only reports the next model; the edit follows the prop.
  const modesControlled =
    editMode === "row" ? rowModesModel !== undefined : cellModesModel !== undefined;
  const reportModes = (rowId: string, field: string, mode: "edit" | "view", cancel = false) => {
    const next = gridEditModes(editMode, rowId, field, mode, cancel);
    if (editMode === "row") onRowModesModelChange?.(next.rows);
    else onCellModesModelChange?.(next.cells);
  };
  /** A user start or stop waiting for the controlled model (its reason, key and field). */
  const pendingStart = useRef<{ reason: GridEditStartReason; key?: string | undefined } | null>(
    null,
  );
  const pendingStop = useRef<{ field: string; reason: GridEditStopReason } | null>(null);
  const canEdit = (rowId: string, field: string) => {
    const column = columns.find((c) => c.field === field);
    const row = view.find((r) => idOf(r) === rowId);
    return !!column && !!row && cellEditable(column, row);
  };
  /** Opens the editors of a cell (or its row); `reason` undefined: from the modes model. */
  const beginEdit = (rowId: string, field: string, reason?: GridEditStartReason, key?: string) => {
    const column = columns.find((c) => c.field === field);
    const row = view.find((r) => idOf(r) === rowId);
    if (!column || !row || !cellEditable(column, row)) return;
    const targets = editMode === "row" ? shown.filter((c) => cellEditable(c, row)) : [column];
    const start = Object.fromEntries(
      targets.map((c) => [c.field, gridEditText(rawValue(c, row), c.type)]),
    );
    initialDrafts.current = start;
    draftValues.current = {};
    // A typed character replaces the value (text-like fields only).
    const typed = key !== undefined && !["boolean", "singleSelect"].includes(column.type ?? "");
    setDrafts(typed ? { ...start, [field]: key as string } : start);
    setErrors({});
    // The typed character is checked like any change.
    if (typed) check(column, key as string, row);
    setEditing({ rowId, field: editMode === "row" ? null : field, focus: field, typed });
    if (reason === undefined) return;
    if (editMode === "row") onRowEditStart?.({ id: rowId, row }, reason);
    else onCellEditStart?.(cellParams(column, row), reason);
  };
  const startEdit = useRef<
    (rowId: string, field: string, reason: GridEditStartReason, key?: string) => void
  >(undefined as never);
  startEdit.current = (rowId, field, reason, key) => {
    if (!canEdit(rowId, field)) return;
    if (modesControlled) {
      pendingStart.current = { reason, key };
      reportModes(rowId, field, "edit");
      return;
    }
    beginEdit(rowId, field, reason, key);
    reportModes(rowId, field, "edit");
  };
  /** Runs a column's check on an edited text (or a value set by an editor) and keeps its error. */
  const check = (column: GridColDef<R>, text: string, row: R, value?: { value: unknown }) => {
    if (!column.preProcessEditCellProps) return;
    const { error } = column.preProcessEditCellProps({
      id: idOf(row),
      row,
      props: { value: value ? value.value : parse(column, text, row) },
      hasChanged: text !== initialDrafts.current[column.field],
    });
    setErrors((current) => {
      const next = { ...current };
      if (error) next[column.field] = error;
      else delete next[column.field];
      return next;
    });
  };
  /** Values custom editors set (`setEditCellValue`), by field: used as they are, not parsed. */
  const draftValues = useRef<Record<string, unknown>>({});
  const changeDraft = (column: GridColDef<R>, text: string) => {
    delete draftValues.current[column.field];
    setDrafts((current) => ({ ...current, [column.field]: text }));
    const row = view.find((r) => idOf(r) === editing?.rowId);
    if (row) check(column, text, row);
  };
  /** MUI X `setEditCellValue`: the value of a cell being edited. */
  const setEditCellValue = ({
    id: rowId,
    field,
    value,
  }: {
    id: string;
    field: string;
    value: unknown;
  }) => {
    if (!editing || editing.rowId !== rowId || !(field in drafts)) return;
    const column = columnOf(field);
    const text = gridEditText(value, column.type);
    draftValues.current = { ...draftValues.current, [field]: value };
    setDrafts((current) => ({ ...current, [field]: text }));
    const row = view.find((r) => idOf(r) === rowId);
    if (row) check(column, text, row, { value });
  };
  /** The value of a field being edited: the value an editor set, else the parsed text. */
  const draftValue = (column: GridColDef<R>, row: R) =>
    column.field in draftValues.current
      ? draftValues.current[column.field]
      : parse(column, drafts[column.field] ?? "", row);
  /** Closes the editors; `commit` saves the row. `reason` undefined: from the modes model. */
  const endEdit = (commit: boolean, field: string, reason?: GridEditStopReason) => {
    if (!editing) return;
    const { rowId } = editing;
    refocus.current = { rowId, field };
    setEditing(null);
    setErrors({});
    const oldRow = view.find((r) => idOf(r) === rowId) as R;
    if (reason !== undefined) {
      if (editMode === "row") onRowEditStop?.({ id: rowId, row: oldRow }, reason);
      else onCellEditStop?.(cellParams(columnOf(field), oldRow), reason);
    }
    if (!commit || !oldRow) return;
    let newRow = { ...oldRow } as R;
    for (const f of Object.keys(drafts)) {
      const column = columnOf(f);
      const value = draftValue(column, oldRow);
      newRow = column.valueSetter
        ? column.valueSetter(value, newRow)
        : ({ ...newRow, [f]: value } as R);
    }
    commitRow(rowId, oldRow, newRow).then(
      (saved) => saved && record([{ id: rowId, before: oldRow, after: saved }]),
    );
  };
  /** `apiRef` starts and stops: no reasons (MUI X fires no edit start / stop events for them). */
  const apiStart = (rowId: string, field: string) => {
    if (!canEdit(rowId, field)) return;
    if (!modesControlled) beginEdit(rowId, field);
    reportModes(rowId, field, "edit");
  };
  const apiStop = (rowId: string, field: string, commit: boolean) => {
    if (!editing || editing.rowId !== rowId) return;
    if (commit && Object.keys(errors).length > 0) return;
    const at = editing.field ?? editing.focus;
    if (!modesControlled) endEdit(commit, field || at);
    reportModes(rowId, at, "view", !commit);
  };
  const stopEdit = (commit: boolean, field: string, reason: GridEditStopReason) => {
    if (!editing) return;
    // A value with an error keeps the cell open (Escape still cancels).
    if (commit && Object.keys(errors).length > 0) return;
    const at = editing.field ?? editing.focus;
    if (modesControlled) {
      pendingStop.current = { field, reason };
      reportModes(editing.rowId, at, "view", !commit);
      return;
    }
    endEdit(commit, field, reason);
    reportModes(editing.rowId, at, "view", !commit);
  };
  // Controlled modes: the edit follows the model (one cell or row at a time).
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when a model or the edit changes.
  useEffect(() => {
    if (!modesControlled) return;
    const target = gridEditTarget(cellModesModel, rowModesModel, editMode);
    if (editing) {
      if (target && target.id === editing.rowId && (target.field ?? null) === editing.field) return;
      const entry =
        editMode === "row"
          ? rowModesModel?.[editing.rowId]
          : cellModesModel?.[editing.rowId]?.[editing.field ?? ""];
      const cancel = entry?.ignoreModifications === true;
      // An invalid value stays open until it's fixed or cancelled.
      if (!cancel && Object.keys(errors).length > 0) return;
      const stop = pendingStop.current;
      pendingStop.current = null;
      endEdit(!cancel, stop?.field ?? editing.focus, stop?.reason);
      return;
    }
    if (!target) return;
    const begin = pendingStart.current;
    pendingStart.current = null;
    const row = view.find((r) => idOf(r) === target.id);
    const field =
      target.field ??
      (target.fieldToFocus && row && cellEditable(columnOf(target.fieldToFocus), row)
        ? target.fieldToFocus
        : row
          ? shown.find((c) => cellEditable(c, row))?.field
          : undefined);
    if (field) beginEdit(target.id, field, begin?.reason, begin?.key);
  }, [cellModesModel, rowModesModel, editing]);
  /**
   * An edited (or pasted) row: `processRowUpdate`, then the data source's `updateRow`. Resolves
   * the row `processRowUpdate` answered, or `null` when it refused.
   */
  const commitRow = (rowId: string, oldRow: R, newRow: R): Promise<R | null> =>
    Promise.resolve(processRowUpdate ? processRowUpdate(newRow, oldRow) : newRow)
      .then((result) => {
        setOverrides((current) => new Map(current).set(rowId, result));
        // A data source saves the row too; its answer is the row to show.
        if (dataSource?.updateRow)
          Promise.resolve(dataSource.updateRow({ rowId, updatedRow: result, previousRow: oldRow }))
            .then((saved) => {
              setOverrides((current) => new Map(current).set(rowId, saved));
              cache?.clear();
            })
            .catch((error: unknown) => {
              setOverrides((current) => new Map(current).set(rowId, oldRow));
              onDataSourceError?.(error);
            });
        return result;
      })
      .catch((error: unknown) => {
        onProcessRowUpdateError?.(error);
        return null;
      });

  // Undo and redo (MUI X `historyStackSize`): each saved edit, or paste, is one step. Off with a
  // stack size of 0, without editable columns, and with a data source that can't save rows.
  const historyStackSize = Math.max(0, Math.floor(historyStackSizeProp) || 0);
  const historyOn =
    historyStackSize > 0 && columns.some(editable) && (!dataSource || !!dataSource.updateRow);
  const history = useRef<GridHistoryStack<R> | null>(null);
  const historySize = useRef(-1);
  if (!history.current || historySize.current !== historyStackSize) {
    history.current = createGridHistoryStack<R>(historyStackSize);
    historySize.current = historyStackSize;
  }
  const [historySizes, setHistorySizes] = useState({ undo: 0, redo: 0 });
  const historySync = () => setHistorySizes((history.current as GridHistoryStack<R>).sizes);
  const historyBusy = useRef(false);
  /** Keeps the rows a step saved (the ones `processRowUpdate` accepted). */
  const record = (changes: (GridHistoryChange<R> | null)[]) => {
    if (!historyOn) return;
    history.current?.push({ changes: changes.filter((c): c is GridHistoryChange<R> => !!c) });
    historySync();
  };
  /** Applies the last step backwards (undo) or forwards (redo), each row through `commitRow`. */
  const travel = async (direction: "undo" | "redo"): Promise<boolean> => {
    const stack = history.current as GridHistoryStack<R>;
    const step = stack.peek(direction);
    if (!historyOn || !step || historyBusy.current) return false;
    historyBusy.current = true;
    const writes = step.changes.map((change) => {
      const current = dataById.get(change.id);
      const row =
        current &&
        gridHistoryRow(
          current as Record<string, unknown>,
          change as GridHistoryChange<Record<string, unknown>>,
          direction,
        );
      return row ? { change, current, row: row as R } : null;
    });
    // A row changed elsewhere since the step: the step (and the ones behind it) can't apply.
    let ok = writes.every(Boolean);
    if (ok)
      for (const write of writes as { change: GridHistoryChange<R>; current: R; row: R }[]) {
        const saved = await commitRow(write.change.id, write.current, write.row);
        if (saved === null) ok = false;
      }
    historyBusy.current = false;
    stack.settle(direction, ok);
    historySync();
    if (ok) {
      const params = { ids: step.changes.map((change) => change.id) };
      if (direction === "undo") onUndo?.(params);
      else onRedo?.(params);
    }
    return ok;
  };
  const historyApi: GridHistoryApi = {
    undo: () => travel("undo"),
    redo: () => travel("redo"),
    clear: () => {
      history.current?.clear();
      historySync();
    },
    canUndo: () => historyOn && (history.current?.sizes.undo ?? 0) > 0,
    canRedo: () => historyOn && (history.current?.sizes.redo ?? 0) > 0,
  };
  const historyKeys = useRef(historyApi);
  historyKeys.current = historyApi;
  const historyEnabled = useRef(historyOn);
  historyEnabled.current = historyOn;
  useEffect(() => {
    const keys = createGridHistoryKeys(gridRef.current as HTMLDivElement, {
      enabled: () => historyEnabled.current,
      undo: () => void historyKeys.current.undo(),
      redo: () => void historyKeys.current.redo(),
    });
    return () => keys.destroy();
  }, []);

  // Cell selection: ranges over the page's data rows and the shown columns.
  const cellRows = pageRows.filter(isData);
  const cellRowIds = cellRows.map(idOf);
  const cellFields = shown.map((c) => c.field);
  const cellBase = useRef<GridCellSelectionModel>({});
  const cellSelect = useRef<
    (
      anchor: { id: string; field: string },
      focus: { id: string; field: string },
      mode: "replace" | "add",
    ) => void
  >(undefined as never);
  cellSelect.current = (anchor, focus, mode) => {
    const range = gridCellRange(cellRowIds, cellFields, anchor, focus);
    if (mode === "replace") return setCellModel(range);
    // Ctrl / Cmd: a press toggles its cell, a drag adds its range to the selection before it.
    if (anchor.id === focus.id && anchor.field === focus.field) {
      cellBase.current = cellModel;
      return setCellModel(toggleGridCell(cellModel, focus.id, focus.field));
    }
    setCellModel(mergeGridCellSelection(cellBase.current, range));
  };
  // Status bar: figures of the selected cells of the page, through the aggregation functions.
  const statusItems =
    statusBar && cellSelection
      ? gridStatusItems(
          gridSelectionStats(
            cellRows.flatMap((row) =>
              shown
                .filter((column) => isGridCellSelected(cellModel, idOf(row), column.field))
                .map((column) => ({ value: rawValue(column, row), column })),
            ),
            aggregationFunctions,
          ),
          labels,
          typeof document === "undefined" ? undefined : document.documentElement.lang || undefined,
        )
      : [];
  const cellOn = useRef(false);
  cellOn.current = !!cellSelection;
  // Clipboard: the selected cells, else the selected rows, else the focused cell.
  const copyValue = (column: GridColDef<R>, row: R) =>
    ignoreValueFormatterDuringExport ? asText(rawValue(column, row)) : textOf(column, row);
  const copyText = (): string | null => {
    const fields = shown.filter((c) => c.type !== "actions");
    let block: string[][] | null = null;
    const picked = cellSelection
      ? gridSelectedBlock(
          cellModel,
          cellRowIds,
          fields.map((c) => c.field),
        )
      : null;
    if (picked?.ids.length)
      block = picked.ids.map((rowId) =>
        picked.fields.map((field) =>
          isGridCellSelected(cellModel, rowId, field)
            ? copyValue(columnOf(field), dataById.get(rowId) as R)
            : "",
        ),
      );
    const chosen = sorted.filter((row) => isData(row) && selection.includes(idOf(row)));
    if (!block && chosen.length) block = chosen.map((row) => fields.map((c) => copyValue(c, row)));
    if (!block) {
      const cell = (document.activeElement as Element | null)?.closest(
        '[data-ok-data-grid-body] :is([role="gridcell"], [role="rowheader"])[data-ok-field]',
      );
      const row = dataById.get(
        cell?.closest("[data-ok-row-id]")?.getAttribute("data-ok-row-id") ?? "",
      );
      const column = columns.find((c) => c.field === cell?.getAttribute("data-ok-field"));
      if (!row || !column) return null;
      block = [[copyValue(column, row)]];
    }
    return gridToTsv(block, clipboardCopyCellDelimiter);
  };
  /** Pasted cells go into editable cells from the selection's corner (or the focused cell). */
  const pasteText = (text: string) => {
    const data = splitClipboardPastedText
      ? splitClipboardPastedText(text)
      : parseGridClipboard(text);
    const picked = cellSelection ? gridSelectedBlock(cellModel, cellRowIds, cellFields) : null;
    let top: number;
    let left: number;
    // One value fills every selected cell.
    const fill = !!picked?.ids.length && data.length === 1 && data[0]?.length === 1;
    if (picked?.ids.length) {
      top = cellRowIds.indexOf(picked.ids[0] as string);
      left = cellFields.indexOf(picked.fields[0] as string);
    } else {
      const cell = (document.activeElement as Element | null)?.closest(
        '[data-ok-data-grid-body] :is([role="gridcell"], [role="rowheader"])[data-ok-field]',
      );
      top = cellRowIds.indexOf(
        cell?.closest("[data-ok-row-id]")?.getAttribute("data-ok-row-id") ?? "",
      );
      left = cellFields.indexOf(cell?.getAttribute("data-ok-field") ?? "");
      if (top < 0 || left < 0) return;
    }
    onClipboardPasteStart?.({ data });
    const height = fill ? (picked as { ids: string[] }).ids.length : data.length;
    const width = fill
      ? (picked as { fields: string[] }).fields.length
      : Math.max(...data.map((r) => r.length));
    const updates: Promise<GridHistoryChange<R> | null>[] = [];
    for (let r = 0; r < height; r++) {
      const row = fill
        ? (dataById.get((picked as { ids: string[] }).ids[r] as string) as R)
        : cellRows[top + r];
      if (!row) break;
      let next = { ...row } as R;
      let changed = false;
      for (let c = 0; c < width; c++) {
        const field = fill ? (picked as { fields: string[] }).fields[c] : cellFields[left + c];
        const column = field ? columnOf(field) : undefined;
        const typed = fill ? data[0]?.[0] : data[r]?.[c];
        if (!column || typed === undefined || !cellEditable(column, row)) continue;
        if (fill && !isGridCellSelected(cellModel, idOf(row), column.field)) continue;
        const value = column.pastedValueParser
          ? column.pastedValueParser(typed, row)
          : parse(column, typed, row);
        next = column.valueSetter
          ? column.valueSetter(value, next)
          : ({ ...next, [column.field]: value } as R);
        changed = true;
      }
      if (changed)
        updates.push(
          commitRow(idOf(row), row, next).then((saved) =>
            saved ? { id: idOf(row), before: row, after: saved } : null,
          ),
        );
    }
    Promise.all(updates).then((changes) => {
      // One step for the whole paste (MUI X: not with a data source).
      if (!dataSource) record(changes);
      onClipboardPasteEnd?.();
    });
  };
  const clipboard = useRef<{
    copyText: () => string | null;
    pasteText: (text: string) => void;
    canPaste: () => boolean;
  }>(null as never);
  clipboard.current = {
    copyText,
    pasteText,
    canPaste: () => !disableClipboardPaste && columns.some(editable),
  };
  const copied = useRef(onClipboardCopy);
  copied.current = onClipboardCopy;
  useEffect(() => {
    const grid = gridRef.current as HTMLDivElement;
    const cells = createGridCellSelection(grid, {
      enabled: () => cellOn.current,
      onSelect: (anchor, focus, mode) => cellSelect.current(anchor, focus, mode),
    });
    const handle = createGridClipboard(grid, {
      copyText: () => clipboard.current.copyText(),
      canPaste: () => clipboard.current.canPaste(),
      onPaste: (text) => clipboard.current.pasteText(text),
      onCopy: (text) => copied.current?.(text),
    });
    return () => {
      cells.destroy();
      handle.destroy();
    };
  }, []);

  // Exports hold data rows (filtered, sorted): grouped and pivoted grids export their rows.
  const exportRows = () =>
    pivot
      ? pivotRows
      : grouping.length > 0
        ? localSort(server.filter ? orderedRows : localFilter(orderedRows))
        : sorted.filter(isData);
  const exportBase = pivot ? columnsProp : columns;
  const exportShown = pivot ? visibleGridColumns(columnsProp, visibility) : shown;
  const getCsv = (options: GridCsvOptions = csvOptions ?? {}) =>
    gridToCsv(
      gridExportColumns(exportBase, exportShown, options),
      exportRows(),
      (row, field) => textOf(sourceOf(field), row),
      options,
    );
  const getExcel = (options: GridExcelOptions = excelOptions ?? {}) =>
    gridToXlsx(
      gridExportColumns(exportBase, exportShown, options),
      exportRows(),
      (row, field) => rawValue(sourceOf(field), row),
      (row, field) => textOf(sourceOf(field), row),
      options,
    );
  const exportExcel = (options: GridExcelOptions = excelOptions ?? {}) =>
    download(
      `${options.fileName ?? exportFileName}.xlsx`,
      getExcel(options) as BlobPart,
      GRID_XLSX_TYPE,
    );
  const exportCsv = (options: GridCsvOptions = csvOptions ?? {}) =>
    downloadCsv(options.fileName ?? exportFileName, getCsv(options));
  const print = (options: GridPrintOptions = printOptions ?? {}) => setPrinting({ ...options });
  useEffect(() => {
    if (!printing) return;
    const options = printing;
    const keep = options.fields ? new Set(options.fields) : null;
    const printed = shown.filter(
      (c) => c.type !== "actions" && !c.disableExport && (!keep || keep.has(c.field)),
    );
    const boxes = !!checkboxSelection && !!options.includeCheckboxes;
    printGridContent(
      rootRef.current as HTMLElement,
      options.fileName ?? ariaLabel ?? exportFileName,
      (copy) =>
        prepareGridPrint(
          copy,
          options,
          printed.map((c) => c.field),
          gridColumnTemplate(printed, boxes, widths),
        ),
    );
    setPrinting(null);
  });
  const exportState = (): GridState => ({
    sorting: { sortModel },
    filter: { filterModel },
    pagination: { paginationModel: { page: pagination.page, pageSize: pagination.pageSize } },
    columns: {
      columnVisibilityModel: { ...visibility },
      orderedFields: fields,
      dimensions: Object.fromEntries(Object.entries(widths).map(([f, width]) => [f, { width }])),
    },
    pinnedColumns: pinned,
    density,
    ...(groupingModel.length ? { rowGrouping: { model: [...groupingModel] } } : {}),
    ...(Object.keys(aggregationState).length
      ? { aggregation: { model: { ...aggregationState } } }
      : {}),
    ...(pivotAvailable ? { pivoting: { model: pivotModel, active: !!pivotActive } } : {}),
    ...(chartsIntegration
      ? {
          chartsIntegration: {
            model: chartModel,
            ...(chartIds.length ? { charts: chartModels } : {}),
            ...(activeChartId ? { activeChartId } : {}),
          },
        }
      : {}),
  });
  const restoreState = (input: unknown) => {
    const state = sanitizeGridState(input);
    if (state.sorting?.sortModel) setSortModel(state.sorting.sortModel);
    if (state.filter?.filterModel) {
      setFilterModel(state.filter.filterModel);
      setQuickText((state.filter.filterModel.quickFilterValues ?? []).join(" "));
    }
    const paging = state.pagination?.paginationModel;
    if (paging) setPagination({ ...pagination, ...paging });
    if (state.columns?.columnVisibilityModel) setVisibility(state.columns.columnVisibilityModel);
    if (state.columns?.orderedFields) setOrder(state.columns.orderedFields);
    const dimensions = state.columns?.dimensions;
    if (dimensions)
      setWidths(Object.fromEntries(Object.entries(dimensions).map(([f, d]) => [f, d.width])));
    if (state.pinnedColumns) setPinned(state.pinnedColumns);
    if (state.density) setDensity(state.density);
    if (state.rowGrouping?.model) setGroupingModel(state.rowGrouping.model);
    if (state.aggregation?.model) setAggregationModel(state.aggregation.model);
    if (state.pivoting?.model) setPivotModel(state.pivoting.model);
    if (state.pivoting?.active !== undefined) setPivotActive(state.pivoting.active);
    if (state.chartsIntegration?.model) setChartModel(state.chartsIntegration.model);
    if (state.chartsIntegration?.charts) setChartModels(state.chartsIntegration.charts);
    if (state.chartsIntegration?.activeChartId)
      setActiveChartId(state.chartsIntegration.activeChartId);
  };
  const scrollToIndexes = ({ rowIndex, colIndex }: { rowIndex?: number; colIndex?: number }) => {
    const grid = gridRef.current as HTMLDivElement;
    if (rowIndex !== undefined && rowIndex >= 0 && rowIndex < pageRows.length) {
      const step = viewport?.rowHeight || baseHeight + 1;
      const top = offsets ? (offsets[rowIndex] as number) : rowIndex * step;
      const height = offsets ? (offsets[rowIndex + 1] as number) - top : step;
      const header = grid.querySelector<HTMLElement>("[data-ok-data-grid-header]") as HTMLElement;
      const visible = grid.clientHeight - header.offsetHeight;
      if (top < grid.scrollTop) grid.scrollTop = top;
      else if (top + height > grid.scrollTop + visible) grid.scrollTop = top + height - visible;
    }
    const column = colIndex === undefined ? undefined : shown[colIndex];
    if (column) {
      const cell = grid.querySelector<HTMLElement>(
        `[role="columnheader"][data-ok-field="${CSS.escape(column.field)}"]`,
      ) as HTMLElement;
      const left = cell.offsetLeft;
      if (left < grid.scrollLeft) grid.scrollLeft = left;
      else if (left + cell.offsetWidth > grid.scrollLeft + grid.clientWidth)
        grid.scrollLeft = left + cell.offsetWidth - grid.clientWidth;
    }
  };
  const api: GridApi<R> = {
    getRow: (rowId) => view.find((r) => idOf(r) === rowId),
    getSortModel: () => sortModel,
    setSortModel,
    getFilterModel: () => filterModel,
    setFilterModel,
    getRowSelectionModel: () => [...selection],
    setRowSelectionModel: (ids) => setSelection([...ids]),
    setColumnVisibilityModel: setVisibility,
    setColumnOrder: (next) => setOrder([...next]),
    setPinnedColumns: setPinned,
    setColumnWidth: (field, width) => resizeTo.current(field, width, true),
    setPaginationModel: setPagination,
    setDensity,
    autosizeColumns: (options) => autosize.current(options),
    scrollToIndexes,
    exportState,
    restoreState,
    getDataAsCsv: getCsv,
    exportDataAsCsv: exportCsv,
    exportDataAsPrint: print,
    setRowChildrenExpansion: (rowId, expanded) => toggleExpansion.current(rowId, expanded),
    toggleDetailPanel: toggleDetail,
    getRowGroupingModel: () => [...groupingModel],
    setRowGroupingModel: (model) => setGroupingModel([...model]),
    getAggregationModel: () => ({ ...aggregationState }),
    setAggregationModel,
    setPivotModel,
    setPivotActive,
    getCellSelectionModel: () => cellModel,
    setCellSelectionModel: setCellModel,
    setChartModel: setPanelModel,
    setChartModels: (models) => setChartModels(sanitizeGridChartModels(models)),
    setActiveChartId,
    getDataAsExcel: getExcel,
    exportDataAsExcel: exportExcel,
    history: historyApi,
    setEditCellValue,
    getCellModesModel: () =>
      cellModesModel ??
      (editing?.field ? gridEditModes("cell", editing.rowId, editing.field, "edit").cells : {}),
    getRowModesModel: () =>
      rowModesModel ??
      (editing && editing.field === null
        ? gridEditModes("row", editing.rowId, editing.focus, "edit").rows
        : {}),
    startCellEditMode: ({ id: rowId, field }) => apiStart(rowId, field),
    stopCellEditMode: ({ id: rowId, field, ignoreModifications }) =>
      apiStop(rowId, field, !ignoreModifications),
    startRowEditMode: ({ id: rowId, fieldToFocus }) => {
      const row = view.find((r) => idOf(r) === rowId);
      const field =
        fieldToFocus ?? (row ? shown.find((c) => cellEditable(c, row))?.field : undefined);
      if (field) apiStart(rowId, field);
    },
    stopRowEditMode: ({ id: rowId, ignoreModifications }) =>
      apiStop(rowId, editing?.focus ?? "", !ignoreModifications),
  };
  useLayoutEffect(() => {
    if (!apiRef) return;
    apiRef.current = api;
    return () => {
      apiRef.current = null;
    };
  });
  /** Operators of a column's filter: its own, else its type's. */
  const operatorsOf = (column: GridColDef<R> | undefined) =>
    column?.filterOperators
      ? column.filterOperators.map((o) => ({ value: o.value, label: o.label ?? o.value }))
      : gridFilterOperators(column?.type).map((value) => ({
          value,
          label: labels.filterOperator[value] ?? value,
        }));

  const open = (which: Panel) => (event: MouseEvent<HTMLElement>) => {
    setAnchor(event.currentTarget);
    setPanel(which);
  };
  const closePanel = () => setPanel(null);
  // Date and date time filters: a partly typed value stays in its picker until it is whole.
  const [pickerDrafts, setPickerDrafts] = useState<Record<string, Date>>({});
  const pickerValue = (key: string, iso: string) => pickerDrafts[key] ?? parseIsoDate(iso);
  const pickDate = (
    key: string,
    date: Date | null,
    type: GridColDef["type"],
    apply: (iso: string) => void,
  ) => {
    const drafts = { ...pickerDrafts };
    if (date && Number.isNaN(date.getTime())) drafts[key] = date;
    else delete drafts[key];
    setPickerDrafts(drafts);
    if (!(key in drafts)) apply(isoValue(date, type));
  };
  // The typed text (with its spaces); the model keeps the words.
  const [quickText, setQuickText] = useState(() => (filterModel.quickFilterValues ?? []).join(" "));
  const setQuick = (text: string) => {
    setQuickText(text);
    setFilterModel({ ...filterModel, quickFilterValues: gridQuickFilterValues(text) });
    setPagination({ ...pagination, page: 0 });
  };
  const newItem = (): GridFilterItem => ({
    field: columnsProp.find(isGridFilterable)?.field ?? "",
    operator: operatorsOf(columnsProp.find(isGridFilterable))[0]?.value as string,
  });
  // The panel always shows a row: with no items, an empty one (applied once edited).
  const filterItems: GridFilterItem[] = filterModel.items.length ? filterModel.items : [newItem()];
  const setFilterItems = (items: GridFilterItem[]) => {
    setFilterModel({ ...filterModel, items });
    setPagination({ ...pagination, page: 0 });
  };
  const setFilterItem = (index: number, item: GridFilterItem) =>
    setFilterItems(filterItems.map((current, i) => (i === index ? item : current)));

  const onRowClick = (row: R, i: number) => (event: MouseEvent<HTMLElement>) => {
    onRowClickProp?.(rowParams(row, i), event);
    if (!checkboxSelection || disableRowSelectionOnClick) return;
    if ((event.target as Element).closest("button, a, input, label, select, textarea")) return;
    toggleRow.current(idOf(row));
  };

  const menuColumn = columns.find((c) => c.field === menuField);
  /** Whether Move left / Move right can move the menu's column (columns with `disableReorder` stay). */
  const movable = (field: string | null, delta: number) => {
    // Closed menu (no column yet): Move left off, Move right on, as the HTML markup has them.
    if (!field) return delta > 0;
    const at = fields.indexOf(field);
    if (at + delta < 0 || at + delta >= fields.length) return false;
    const next = moveGridColumn(fields, field, delta, gridLockedFields(columns));
    return next.join("\n") !== fields.join("\n");
  };
  /** `pinnable: false` hides the pin items of the column's menu. */
  const menuPinnable = menuColumn?.pinnable !== false;
  const menuSorted = sortModel.find((s) => s.field === menuField)?.sort;
  /** Sort items outside the column's cycle are hidden. */
  const menuCycle = menuColumn ? sortCycle(menuColumn) : GRID_SORTING_ORDER;
  const menuAction = (action: string) => {
    const field = menuField as string;
    setMenuAnchor(null);
    if (action === "asc" || action === "desc") setSortModel([{ field, sort: action }]);
    else if (action === "unsort") setSortModel(sortModel.filter((s) => s.field !== field));
    else if (action === "hide") setVisibility({ ...visibility, [field]: false });
    else if (action === "left" || action === "right") {
      const neighbour = fields[fields.indexOf(field) + (action === "left" ? -1 : 1)] as string;
      if (columnGroupingModel && !gridCanMoveColumn(groupPaths, field, neighbour)) return;
      setOrder(
        moveGridColumn(fields, field, action === "left" ? -1 : 1, gridLockedFields(columns)),
      );
    } else if (action === "pin-left" || action === "pin-right" || action === "unpin")
      setPinned(
        pinGridColumn(
          pinned,
          field,
          action === "unpin" ? null : action === "pin-left" ? "left" : "right",
        ),
      );
    else if (action === "group")
      setGroupingModel(
        groupingModel.includes(field)
          ? groupingModel.filter((f) => f !== field)
          : [...groupingModel, field],
      );
    else if (action.startsWith("aggregate-")) {
      const fn = action.slice("aggregate-".length);
      const next = { ...aggregationState };
      if (fn === "none") delete next[field];
      else next[field] = fn;
      setAggregationModel(next);
    } else if (action === "filter") {
      setFilterItems([{ field, operator: operatorsOf(menuColumn)[0]?.value as string }]);
      // The panels open next to their toolbar buttons (the menu offers them only with the toolbar).
      setAnchor(document.querySelector<HTMLElement>(`[aria-controls="${id}-filters"]`));
      setPanel("filters");
    } else {
      setAnchor(document.querySelector<HTMLElement>(`[aria-controls="${id}-columns"]`));
      setPanel("columns");
    }
  };

  // Pivot panel: the switch, then one section per place (not used, rows, columns, values) with
  // each field's place and function, Move up / Move down, and a handle to drag it (core drag).
  const pivotFieldColumns = [...columnsProp, ...derivedColumns].filter(
    (c) => c.pivotable !== false && c.type !== "actions",
  );
  const pivotSections = gridPivotSections(
    pivotModel,
    pivotFieldColumns.map((c) => c.field),
  );
  const pivotSectionTitles = {
    none: labels.pivotNotUsed,
    rows: labels.pivotRows,
    columns: labels.pivotColumns,
    values: labels.pivotValues,
  };
  const pivotHints = {
    none: "",
    rows: labels.pivotDragToRows,
    columns: labels.pivotDragToColumns,
    values: labels.pivotDragToValues,
  };
  const pivotFunctionOf = (column: GridColDef<R>) =>
    pivotModel.values.find((v) => v.field === column.field)?.aggFunc ??
    (gridAggregationFunctionsFor(column)[0] as string);
  const pivotPanelRef = useRef<HTMLDivElement>(null);
  const movePivot = useRef<(field: string, section: GridPivotSection, index: number) => void>(
    undefined as never,
  );
  movePivot.current = (field, section, index) => {
    const column = pivotFieldColumns.find((c) => c.field === field);
    if (column)
      setPivotModel(moveGridPivotField(pivotModel, field, section, index, pivotFunctionOf(column)));
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: attaches once the panel renders.
  useEffect(() => {
    const element = pivotPanelRef.current;
    if (!element) return;
    const drag = createGridPivotDrag(element, {
      onMove: (field, section, index) => movePivot.current(field, section, index),
    });
    return () => drag.destroy();
  }, [panel === "pivot"]);
  // Moving a field moves its buttons: the pressed one (or the other, at an end) keeps the focus.
  const refocusPivot = useRef<{ field: string; direction: "up" | "down" } | null>(null);
  useLayoutEffect(() => {
    const target = refocusPivot.current;
    if (!target) return;
    refocusPivot.current = null;
    const box = pivotPanelRef.current?.querySelector(
      `[data-ok-data-grid-pivot-field][data-ok-field="${CSS.escape(target.field)}"]`,
    );
    const pressed = box?.querySelector<HTMLButtonElement>(
      `[data-ok-data-grid-pivot-move="${target.direction}"]`,
    );
    const other = box?.querySelector<HTMLButtonElement>(
      `[data-ok-data-grid-pivot-move="${target.direction === "up" ? "down" : "up"}"]`,
    );
    (pressed && !pressed.disabled ? pressed : other)?.focus();
  });
  const pivotAvailable =
    !disablePivoting &&
    !treeData &&
    (pivotProp !== undefined || pivotActiveProp !== undefined || !!initialState?.pivoting);
  const pivotPanel = (
    <Popover
      id={`${id}-pivot`}
      open={panel === "pivot"}
      anchorEl={anchor}
      placement="bottom-end"
      onOpenChange={(next) => !next && closePanel()}
    >
      <div
        ref={pivotPanelRef}
        data-ok-data-grid-panel=""
        data-ok-data-grid-form-panel=""
        role="group"
        aria-label={labels.toolbarPivot}
      >
        <FormControlLabel
          label={labels.pivotActive}
          control={
            <Switch
              size="small"
              data-ok-data-grid-pivot-switch=""
              checked={pivotOn}
              onChange={(on) => setPivotActive(on)}
            />
          }
        />
        {gridPivotSectionNames.map((section) => (
          <div
            key={section}
            data-ok-data-grid-pivot-section={section}
            role="group"
            aria-labelledby={`${id}-pivot-section-${section}`}
          >
            <span id={`${id}-pivot-section-${section}`} data-ok-data-grid-pivot-section-title="">
              {pivotSectionTitles[section]}
            </span>
            {pivotSections[section].map((field, index, list) => {
              const column = pivotFieldColumns.find((c) => c.field === field) as GridColDef<R>;
              const role = gridPivotRole(pivotModel, column.field);
              const fn = pivotFunctionOf(column);
              const functions = gridAggregationFunctionsFor(column);
              const name = column.headerName ?? column.field;
              const move = (direction: "up" | "down") => {
                refocusPivot.current = { field, direction };
                setPivotModel(
                  moveGridPivotField(
                    pivotModel,
                    field,
                    section,
                    index + (direction === "up" ? -1 : 1),
                    fn,
                  ),
                );
              };
              return (
                <div
                  key={column.field}
                  data-ok-data-grid-pivot-field=""
                  data-ok-field={column.field}
                >
                  <span data-ok-data-grid-pivot-handle="" aria-hidden="true">
                    <GripIcon />
                  </span>
                  <TextField
                    id={`${id}-pivot-${column.field}`}
                    select
                    size="small"
                    label={column.headerName ?? column.field}
                    value={role}
                    onChange={(next) =>
                      setPivotModel(
                        setGridPivotRole(
                          pivotModel,
                          column.field,
                          next as "rows" | "columns" | "values" | "none",
                          fn,
                        ),
                      )
                    }
                  >
                    <option value="none">{labels.pivotNotUsed}</option>
                    <option value="rows">{labels.pivotRows}</option>
                    <option value="columns">{labels.pivotColumns}</option>
                    <option value="values">{labels.pivotValues}</option>
                  </TextField>
                  <TextField
                    id={`${id}-pivot-${column.field}-function`}
                    select
                    size="small"
                    label={labels.pivotAggregation}
                    disabled={role !== "values"}
                    value={fn}
                    onChange={(next) =>
                      setPivotModel({
                        ...pivotModel,
                        values: pivotModel.values.map((v) =>
                          v.field === column.field ? { ...v, aggFunc: next } : v,
                        ),
                      })
                    }
                  >
                    {functions.map((f) => (
                      <option key={f} value={f}>
                        {aggLabel(f)}
                      </option>
                    ))}
                  </TextField>
                  <IconButton
                    size="sm"
                    data-ok-data-grid-pivot-move="up"
                    aria-label={`${labels.pivotMoveUp}: ${name}`}
                    disabled={index === 0}
                    hidden={section === "none" || undefined}
                    onClick={() => move("up")}
                  >
                    <MoveIcon />
                  </IconButton>
                  <IconButton
                    size="sm"
                    data-ok-data-grid-pivot-move="down"
                    aria-label={`${labels.pivotMoveDown}: ${name}`}
                    disabled={index === list.length - 1}
                    hidden={section === "none" || undefined}
                    onClick={() => move("down")}
                  >
                    <MoveIcon down />
                  </IconButton>
                </div>
              );
            })}
            {section !== "none" && (
              <span
                data-ok-data-grid-pivot-empty=""
                hidden={pivotSections[section].length > 0 || undefined}
              >
                {pivotHints[section]}
              </span>
            )}
          </div>
        ))}
      </div>
    </Popover>
  );
  // Charts integration: one chart of the top-level groups (aggregated) or of the page's rows.
  // Pivoted grids chart their pivot columns: a value field stands for its columns.
  const dataById = new Map(view.map((row) => [idOf(row), row]));
  const chartColumns = columnsProp.filter((c) => c.type !== "actions");
  const chartCandidates = pivot ? columns : chartColumns;
  /** A chart's data, options and stacking from its model (one per chart). */
  const chartOf = (chartModel: GridChartModel) => {
    const chartType: GridChartType = chartModel.type ?? "column";
    const chartFields = gridChartFields(chartModel, chartCandidates);
    const dimension = chartColumns.some((c) => c.field === chartModel.dimension)
      ? (chartModel.dimension as string)
      : null;
    const topGroups =
      grouping.length > 0 && !serverTree
        ? sorted.filter((row): row is R & Group => isGroup(row) && row[GROUP].depth === 0)
        : null;
    const chartShown = chartsIntegration && chartFields.length > 0 && !!(dimension || topGroups);
    // Groups aggregate the rows that pass the filters (a pivot's rows are filtered already).
    const chartPass =
      chartShown && topGroups && !pivot && !server.filter
        ? new Set(localFilter(orderedRows).map(idOf))
        : null;
    const chartColumnOf = (field: string) =>
      chartCandidates.find((c) => c.field === field) as GridColDef<R>;
    const chartData = !chartShown
      ? null
      : topGroups
        ? gridChartData(
            topGroups,
            chartModel,
            chartCandidates,
            (row) => row[GROUP].key,
            (row, field) =>
              gridAggregate(
                row[GROUP].leafIds
                  .filter((leaf) => !chartPass || chartPass.has(leaf))
                  .map((leaf) => dataById.get(leaf) as R),
                { [field]: aggregationModel[field] ?? aggregationState[field] ?? "sum" },
                chartCandidates,
                (r, f) => rawValue(chartColumnOf(f), r),
                aggregationFunctions,
              )[field],
          )
        : gridChartData(
            pageRows.filter(isData),
            chartModel,
            chartCandidates,
            (row) => textOf(sourceOf(dimension as string), row),
            (row, field) => rawValue(chartColumnOf(field), row),
            sourceOf(dimension as string).type === "number"
              ? (row) => rawValue(sourceOf(dimension as string), row)
              : undefined,
          );
    const chartOptions = gridChartOptions(chartModel, chartData);
    const stackable =
      gridStackableChartTypes.includes(chartType) && (chartData?.series.length ?? 0) > 1;
    return { chartData, chartOptions, stackable };
  };
  const { chartData, chartOptions, stackable } = chartOf(chartModel);
  const panelChart = activeChartId ? chartOf(panelModel) : null;
  const panelStackable = panelChart ? panelChart.stackable : stackable;
  const chartType: GridChartType = panelModel.type ?? "column";
  const chartValues = panelModel.values ?? [];
  const dimension = chartColumns.some((c) => c.field === panelModel.dimension)
    ? (panelModel.dimension as string)
    : null;
  const chartsPanel = (
    <Popover
      id={`${id}-charts`}
      open={panel === "charts"}
      anchorEl={anchor}
      placement="bottom-end"
      onOpenChange={(next) => !next && closePanel()}
    >
      <div
        data-ok-data-grid-panel=""
        data-ok-data-grid-form-panel=""
        role="group"
        aria-label={labels.toolbarCharts}
      >
        {activeChartId && (
          <TextField
            id={`${id}-chart-active`}
            select
            size="small"
            label={labels.chartsActive}
            value={activeChartId}
            onChange={(next) => setActiveChartId(next)}
          >
            {chartIds.map((chartId) => (
              <option key={chartId} value={chartId}>
                {chartModels[chartId]?.label ?? chartId}
              </option>
            ))}
          </TextField>
        )}
        <TextField
          id={`${id}-chart-type`}
          select
          size="small"
          label={labels.chartsType}
          value={chartType}
          onChange={(type) => setPanelModel({ ...panelModel, type: type as GridChartType })}
        >
          {gridChartTypes.map((type) => (
            <option key={type} value={type}>
              {
                labels[
                  `chartType${type.charAt(0).toUpperCase()}${type.slice(1)}` as keyof GridLabels
                ] as string
              }
            </option>
          ))}
        </TextField>
        <TextField
          id={`${id}-chart-dimension`}
          select
          size="small"
          label={labels.chartsDimension}
          value={dimension ?? ""}
          onChange={(field) => setPanelModel({ ...panelModel, dimension: field || null })}
        >
          <option value="">{labels.chartsNone}</option>
          {chartColumns.map((c) => (
            <option key={c.field} value={c.field}>
              {c.headerName ?? c.field}
            </option>
          ))}
        </TextField>
        {chartColumns
          .filter((c) => c.type === "number")
          .map((column) => (
            <FormControlLabel
              key={column.field}
              label={`${labels.chartsValues}: ${column.headerName ?? column.field}`}
              control={
                <Switch
                  size="small"
                  data-ok-data-grid-chart-value={column.field}
                  checked={chartValues.includes(column.field)}
                  onChange={(on) =>
                    setPanelModel({
                      ...panelModel,
                      values: on
                        ? [...chartValues.filter((f) => f !== column.field), column.field]
                        : chartValues.filter((f) => f !== column.field),
                    })
                  }
                />
              }
            />
          ))}
        <FormControlLabel
          label={labels.chartsStacked}
          control={
            <Switch
              size="small"
              data-ok-data-grid-chart-stacked=""
              checked={!!panelModel.stacked}
              disabled={!panelStackable}
              onChange={(on) => setPanelModel({ ...panelModel, stacked: on })}
            />
          }
        />
        <FormControlLabel
          label={labels.chartsItemLabel}
          control={
            <Switch
              size="small"
              data-ok-data-grid-chart-item-label=""
              checked={panelModel.itemLabel === "value"}
              onChange={(on) => setPanelModel({ ...panelModel, itemLabel: on ? "value" : "none" })}
            />
          }
        />
        <TextField
          id={`${id}-chart-legend`}
          select
          size="small"
          label={labels.chartsLegend}
          value={panelModel.legend ?? "top"}
          onChange={(legend) =>
            setPanelModel({ ...panelModel, legend: legend as GridChartModel["legend"] })
          }
        >
          {(["top", "right", "bottom", "none"] as const).map((legend) => (
            <option key={legend} value={legend}>
              {
                labels[
                  `chartLegend${legend.charAt(0).toUpperCase()}${legend.slice(1)}` as keyof GridLabels
                ] as string
              }
            </option>
          ))}
        </TextField>
      </div>
    </Popover>
  );
  /** A toolbar button: text with an icon, or an icon with a tooltip (`toolbarVariant`). */
  const toolbarButton = (
    which: Exclude<Panel, null>,
    label: string,
    icon: ReactNode,
    popup: "dialog" | "menu",
  ) => {
    const common = {
      "aria-haspopup": popup,
      "aria-expanded": panel === which,
      "aria-controls": `${id}-${which}`,
      onClick: open(which),
    } as const;
    return toolbarVariant === "icon" ? (
      <Tooltip title={label} id={`${id}-${which}-tooltip`}>
        <IconButton size="sm" {...common}>
          {icon}
        </IconButton>
      </Tooltip>
    ) : (
      <Button size="sm" variant="text" startIcon={icon} {...common}>
        {label}
      </Button>
    );
  };
  const toolbar = showToolbar && (
    <div data-ok-data-grid-toolbar="">
      {label !== undefined && <span data-ok-data-grid-toolbar-label="">{label}</span>}
      <div data-ok-data-grid-quick-filter="">
        <TextField
          id={`${id}-search`}
          size="small"
          fullWidth
          aria-label={labels.toolbarQuickFilterLabel}
          placeholder={labels.toolbarQuickFilterPlaceholder}
          value={quickText}
          onChange={setQuick}
          startAdornment={
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          }
        />
      </div>
      <div data-ok-data-grid-toolbar-actions="">
        {showHistoryControls && historyOn && (
          <>
            <IconButton
              size="sm"
              data-ok-data-grid-history="undo"
              aria-label={labels.toolbarUndo}
              disabled={historySizes.undo === 0}
              onClick={() => void historyApi.undo()}
            >
              <UndoIcon />
            </IconButton>
            <IconButton
              size="sm"
              data-ok-data-grid-history="redo"
              aria-label={labels.toolbarRedo}
              disabled={historySizes.redo === 0}
              onClick={() => void historyApi.redo()}
            >
              <RedoIcon />
            </IconButton>
          </>
        )}
        {!disableColumnSelector &&
          toolbarButton("columns", labels.toolbarColumns, <ColumnsIcon />, "dialog")}
        {!disableColumnFilter &&
          toolbarButton("filters", labels.toolbarFilters, <FilterIcon />, "dialog")}
        {!disableDensitySelector &&
          toolbarButton("density", labels.toolbarDensity, <DensityIcon />, "menu")}
        {pivotAvailable && toolbarButton("pivot", labels.toolbarPivot, <PivotIcon />, "dialog")}
        {chartsIntegration &&
          toolbarButton("charts", labels.toolbarCharts, <ChartIcon />, "dialog")}
        {toolbarButton("export", labels.toolbarExport, <ExportIcon />, "menu")}
      </div>
      {pivotAvailable && pivotPanel}
      {chartsIntegration && chartsPanel}
      {!disableColumnSelector && (
        <Popover
          id={`${id}-columns`}
          open={panel === "columns"}
          anchorEl={anchor}
          placement="bottom-end"
          onOpenChange={(next) => !next && closePanel()}
        >
          <div data-ok-data-grid-panel="" role="group" aria-label={labels.toolbarColumns}>
            {columnsProp.filter(isGridHideable).map((column) => (
              <FormControlLabel
                key={column.field}
                label={column.headerName ?? column.field}
                control={
                  <Switch
                    size="small"
                    data-ok-field={column.field}
                    checked={visibility[column.field] !== false}
                    onChange={(checked) =>
                      setVisibility({ ...visibility, [column.field]: checked })
                    }
                  />
                }
              />
            ))}
          </div>
        </Popover>
      )}
      {!disableColumnFilter && (
        <Popover
          id={`${id}-filters`}
          open={panel === "filters"}
          anchorEl={anchor}
          placement="bottom-end"
          onOpenChange={(next) => !next && closePanel()}
        >
          <div data-ok-data-grid-panel="" role="group" aria-label={labels.toolbarFilters}>
            {filterItems.map((item, index) => {
              const suffix = index === 0 ? "" : `-${index}`;
              // Filters (and the columns panel) work on the data's columns, also in the pivot.
              const column = columnsProp.find((c) => c.field === item.field);
              const Picker = column?.type === "dateTime" ? DateTimePicker : DatePicker;
              return (
                // biome-ignore lint/suspicious/noArrayIndexKey: filter rows are positional.
                <div key={index} data-ok-data-grid-filter="">
                  <IconButton
                    size="sm"
                    data-ok-data-grid-filter-remove=""
                    aria-label={labels.filterPanelRemoveFilter}
                    onClick={() => setFilterItems(filterItems.filter((_, i) => i !== index))}
                  >
                    <CloseIcon />
                  </IconButton>
                  {index > 0 && (
                    <TextField
                      id={`${id}-filter-logic${suffix}`}
                      select
                      size="small"
                      label={labels.filterPanelLogicOperator}
                      disabled={index > 1}
                      value={filterModel.logicOperator ?? "and"}
                      onChange={(logic) =>
                        setFilterModel({ ...filterModel, logicOperator: logic as "and" | "or" })
                      }
                    >
                      <option value="and">{labels.filterPanelOperatorAnd}</option>
                      <option value="or">{labels.filterPanelOperatorOr}</option>
                    </TextField>
                  )}
                  <TextField
                    id={`${id}-filter-field${suffix}`}
                    select
                    size="small"
                    label={labels.filterPanelColumns}
                    value={item.field}
                    onChange={(field) =>
                      setFilterItem(index, {
                        field,
                        operator: operatorsOf(columnsProp.find((c) => c.field === field))[0]
                          ?.value as string,
                      })
                    }
                  >
                    {columnsProp.filter(isGridFilterable).map((c) => (
                      <option key={c.field} value={c.field}>
                        {c.headerName ?? c.field}
                      </option>
                    ))}
                  </TextField>
                  <TextField
                    id={`${id}-filter-operator${suffix}`}
                    select
                    size="small"
                    label={labels.filterPanelOperator}
                    value={item.operator}
                    onChange={(operator) => setFilterItem(index, { ...item, operator })}
                  >
                    {operatorsOf(column).map((operator) => (
                      <option key={operator.value} value={operator.value}>
                        {operator.label}
                      </option>
                    ))}
                  </TextField>
                  {item.operator === "isAnyOf" && !column?.filterOperators ? (
                    <Autocomplete
                      id={`${id}-filter-value${suffix}`}
                      size="small"
                      label={labels.filterPanelInputLabel}
                      multiple
                      freeSolo
                      options={column?.valueOptions ?? []}
                      value={gridFilterValues(item.value)}
                      onChange={(value) =>
                        setFilterItem(index, { ...item, value: (value as string[] | null) ?? [] })
                      }
                    />
                  ) : (column?.type === "date" || column?.type === "dateTime") &&
                    !column.filterOperators &&
                    gridOperatorNeedsValue(item.operator) ? (
                    <Picker
                      id={`${id}-filter-value${suffix}`}
                      size="small"
                      label={labels.filterPanelInputLabel}
                      value={pickerValue(
                        `${id}-filter-value${suffix}`,
                        typeof item.value === "string" ? item.value : "",
                      )}
                      onChange={(date) =>
                        pickDate(`${id}-filter-value${suffix}`, date, column.type, (iso) =>
                          setFilterItem(index, { ...item, value: iso }),
                        )
                      }
                    />
                  ) : (
                    <TextField
                      id={`${id}-filter-value${suffix}`}
                      size="small"
                      label={labels.filterPanelInputLabel}
                      placeholder={labels.filterPanelInputPlaceholder}
                      disabled={!gridOperatorNeedsValue(item.operator, column?.filterOperators)}
                      value={
                        typeof item.value === "string" ? item.value : (item.value ?? []).join(", ")
                      }
                      onChange={(value) => setFilterItem(index, { ...item, value })}
                    />
                  )}
                </div>
              );
            })}
            {!disableMultipleColumnsFiltering && (
              <Button
                size="sm"
                variant="text"
                data-ok-data-grid-filter-add=""
                startIcon={<PlusIcon />}
                onClick={() => setFilterItems([...filterItems, newItem()])}
              >
                {labels.filterPanelAddFilter}
              </Button>
            )}
          </div>
        </Popover>
      )}
      {!disableDensitySelector && (
        <Menu
          id={`${id}-density`}
          open={panel === "density"}
          anchorEl={anchor}
          placement="bottom-end"
          onOpenChange={(next) => !next && closePanel()}
        >
          {gridDensities.map((value) => (
            <MenuItem
              key={value}
              data-ok-density={value}
              selected={density === value}
              onClick={() => {
                setDensity(value);
                closePanel();
              }}
            >
              {
                labels[
                  `density${value.charAt(0).toUpperCase()}${value.slice(1)}` as keyof GridLabels
                ] as string
              }
            </MenuItem>
          ))}
        </Menu>
      )}
      <Menu
        id={`${id}-export`}
        open={panel === "export"}
        anchorEl={anchor}
        placement="bottom-end"
        onOpenChange={(next) => !next && closePanel()}
      >
        <MenuItem
          data-ok-data-grid-export="csv"
          onClick={() => {
            closePanel();
            exportCsv();
          }}
        >
          {labels.toolbarExportCSV}
        </MenuItem>
        <MenuItem
          data-ok-data-grid-export="print"
          onClick={() => {
            closePanel();
            print();
          }}
        >
          {labels.toolbarExportPrint}
        </MenuItem>
        <MenuItem
          data-ok-data-grid-export="excel"
          onClick={() => {
            closePanel();
            exportExcel();
          }}
        >
          {labels.toolbarExportExcel}
        </MenuItem>
      </Menu>
    </div>
  );

  /** Header filters: the first filter item of a field holds its value (the type's operator). */
  const setHeaderFilter = (column: GridColDef<R>, value: string) => {
    const index = filterModel.items.findIndex((item) => item.field === column.field);
    const current = filterModel.items[index];
    const item: GridFilterItem = {
      field: column.field,
      operator: current?.operator ?? (operatorsOf(column)[0]?.value as string),
      value,
    };
    const items =
      value === ""
        ? filterModel.items.filter((_, i) => i !== index)
        : index < 0
          ? [...filterModel.items, item]
          : filterModel.items.map((other, i) => (i === index ? item : other));
    setFilterItems(items);
  };
  /** `renderHeaderFilter`: a field's own filter item (an empty value removes it). */
  const applyHeaderFilter = (column: GridColDef<R>, next: GridFilterItem) => {
    const index = filterModel.items.findIndex((item) => item.field === column.field);
    const item = { ...next, field: column.field };
    const empty =
      gridOperatorNeedsValue(item.operator) &&
      (item.value === undefined ||
        item.value === "" ||
        (Array.isArray(item.value) && item.value.length === 0));
    setFilterItems(
      empty
        ? filterModel.items.filter((_, i) => i !== index)
        : index < 0
          ? [...filterModel.items, item]
          : filterModel.items.map((other, i) => (i === index ? item : other)),
    );
  };
  const headerFilterCell = (column: GridColDef<R>, c: number) => {
    if (!renders(column)) return null;
    const side = gridPinSide(pinned, column.field);
    const start = colStart(column);
    const place = {
      "data-ok-filter-field": column.field,
      ...(side ? { "data-ok-pinned": side, "data-ok-pin-field": column.field } : {}),
      ...(start !== undefined
        ? {
            "data-ok-col-start": "",
            style: { "--_ok-data-grid-col-start": start } as CSSProperties,
          }
        : {}),
    };
    if (disableColumnFilter || !isGridFilterable(column))
      return (
        <div key={column.field} {...place} role="presentation" data-ok-data-grid-group-filler="" />
      );
    const item = filterModel.items.find((i) => i.field === column.field);
    const operator = item?.operator ?? (operatorsOf(column)[0]?.value as string);
    const label = operatorsOf(column).find((o) => o.value === operator)?.label ?? operator;
    const value = typeof item?.value === "string" ? item.value : (item?.value ?? []).join(", ");
    const fieldId = `${id}-header-filter-${column.field}`;
    const name = column.headerName ?? column.field;
    const choices =
      column.type === "boolean"
        ? [
            ["true", labels.filterValueTrue],
            ["false", labels.filterValueFalse],
          ]
        : column.type === "singleSelect"
          ? (column.valueOptions ?? []).map((o) => [o, o])
          : null;
    return (
      <div
        key={column.field}
        {...place}
        role="columnheader"
        aria-colindex={c + colOffset}
        aria-label={`${name} ${labels.headerFilterLabel}`}
        data-ok-data-grid-header-filter=""
        tabIndex={-1}
      >
        {column.renderHeaderFilter ? (
          column.renderHeaderFilter({
            field: column.field,
            colDef: column,
            item: item ?? { field: column.field, operator },
            applyFilterChanges: (next) => applyHeaderFilter(column, next),
          })
        ) : choices ? (
          <TextField
            id={fieldId}
            select
            size="small"
            label={label}
            value={value}
            onChange={(next) => setHeaderFilter(column, next)}
          >
            <option value="">{labels.filterValueAny}</option>
            {choices.map(([v, text]) => (
              <option key={v} value={v}>
                {text}
              </option>
            ))}
          </TextField>
        ) : column.type === "date" ? (
          <DatePicker
            id={fieldId}
            size="small"
            label={label}
            value={pickerValue(fieldId, value)}
            onChange={(date) =>
              pickDate(fieldId, date, column.type, (iso) => setHeaderFilter(column, iso))
            }
          />
        ) : column.type === "dateTime" ? (
          <DateTimePicker
            id={fieldId}
            size="small"
            label={label}
            value={pickerValue(fieldId, value)}
            onChange={(date) =>
              pickDate(fieldId, date, column.type, (iso) => setHeaderFilter(column, iso))
            }
          />
        ) : (
          <TextField
            id={fieldId}
            size="small"
            label={label}
            value={value}
            onChange={(next) => setHeaderFilter(column, next)}
          />
        )}
      </div>
    );
  };
  const headerFilterRow = (
    <div role="row" aria-rowindex={headerLevels + 2} data-ok-data-grid-header-filters="">
      {specials.map((special) => (
        <div
          key={special.field}
          role="presentation"
          data-ok-data-grid-group-filler=""
          data-ok-pin-field={special.field}
          {...(leftPinned ? { "data-ok-pinned": "left" } : {})}
        />
      ))}
      {shown.map(headerFilterCell)}
    </div>
  );
  /** One row: body rows (paged, windowed, with a detail panel), or pinned rows. */
  const renderRow = (row: R, index: number, place: "body" | "top" | "bottom") => {
    if (isHole(row)) return holeRow(index);
    if (isGroup(row)) return renderGroupRow(row, index);
    const rowId = idOf(row);
    const selected = selection.includes(rowId);
    // Position on the page (spans, spacing and row params are per page).
    const i = place === "body" ? index - pageStart : index;
    const params = rowParams(row, i);
    const ownHeight = heightOf(row);
    const space = spacingOf(row, i);
    const rowStyle = {
      ...(typeof ownHeight === "number" ? { "--_ok-data-grid-row-height": `${ownHeight}px` } : {}),
      ...(space.top !== undefined ? { "--_ok-data-grid-spacing-top": `${space.top}px` } : {}),
      ...(space.bottom !== undefined
        ? { "--_ok-data-grid-spacing-bottom": `${space.bottom}px` }
        : {}),
    };
    const rowSpans = place === "body" ? spans?.cells[i] : undefined;
    const node = tree?.get(rowId);
    const hasChildren = serverTree
      ? (dataSource?.getChildrenCount?.(row) ?? 0) > 0
      : (node?.childrenCount ?? 0) > 0;
    const open = serverTree ? expansion.get(rowId) === true : !!node?.expanded;
    const colSpans = shown.some((c) => c.colSpan !== undefined)
      ? gridColSpans(shown.length, (k) => {
          const column = shown[k] as GridColDef<R>;
          return typeof column.colSpan === "function"
            ? column.colSpan(cellParams(column, row))
            : (column.colSpan ?? 1);
        })
      : null;
    const rowIndex =
      place === "top"
        ? headerLevels + filterRow + 2 + index
        : place === "bottom"
          ? headerLevels + filterRow + topRows.length + total + 2 + index
          : firstRowIndex + index + rowOffset;
    const detail = place === "body" ? detailOf(row) : null;
    const detailHeight =
      detail != null ? (getDetailPanelHeight?.({ id: rowId, row }) ?? "auto") : "auto";
    const rowElement = (
      <div
        key={rowId}
        role="row"
        aria-rowindex={rowIndex}
        hidden={(place === "body" && !onPage(index)) || undefined}
        data-ok-row-id={rowId}
        {...(node
          ? {
              "aria-level": node.depth + 1,
              "aria-posinset": node.posInSet,
              "aria-setsize": node.setSize,
              ...(hasChildren ? { "aria-expanded": open } : {}),
              ...(node.parentId ? { "data-ok-parent": node.parentId } : {}),
              ...(loadingChildren.has(rowId) ? { "aria-busy": true } : {}),
            }
          : {})}
        className={getRowClassName?.(params) || undefined}
        {...(ownHeight === "auto" || typeof ownHeight === "number"
          ? { "data-ok-row-height": String(ownHeight) }
          : {})}
        {...(space.top !== undefined ? { "data-ok-spacing-top": space.top } : {})}
        {...(space.bottom !== undefined ? { "data-ok-spacing-bottom": space.bottom } : {})}
        {...(checkboxSelection && place === "body" ? { "aria-selected": selected } : {})}
        {...(checkboxSelection && !selectable(row) ? { "data-ok-selectable": "false" } : {})}
        {...(editing?.rowId === rowId && editing.field === null ? { "data-ok-editing": "" } : {})}
        style={Object.keys(rowStyle).length ? (rowStyle as CSSProperties) : undefined}
        onClick={onRowClick(row, i)}
        onDoubleClick={(event) => onRowDoubleClick?.(params, event)}
      >
        {specials.map((special) => specialCell(special.field, row, place, node, hasChildren, open))}
        {shown.map((column, c) => {
          if (!renders(column)) return null;
          const value = rawValue(column, row);
          // Server-side aggregation: a server parent shows its aggregated values.
          const text =
            serverAggregation &&
            serverTree &&
            aggregationOf(column) &&
            (dataSource?.getChildrenCount?.(row) ?? 0) > 0
              ? aggregateText(column, serverValue(row, column.field))
              : textOf(column, row);
          const custom = column.renderCell?.({
            row,
            field: column.field,
            value,
            formattedValue: text,
          });
          const raw = asText(value);
          const name = column.headerName ?? column.field;
          const inEdit =
            editing?.rowId === rowId &&
            (editing.field === null ? column.field in drafts : editing.field === column.field);
          const draft = drafts[column.field] ?? "";
          const setDraft = (next: string) => changeDraft(column, next);
          const error = inEdit ? errors[column.field] : undefined;
          const errorId = `${id}-${rowId}-${column.field}-error`;
          const invalid = error
            ? {
                "aria-invalid": true,
                ...(typeof error === "string" ? { "aria-describedby": errorId } : {}),
              }
            : {};
          const editKeys = (event: { key: string; preventDefault(): void }) => {
            if (event.key === "Enter" || event.key === "Escape") {
              event.preventDefault();
              stopEdit(
                event.key === "Enter",
                column.field,
                event.key === "Enter" ? "enterKeyDown" : "escapeKeyDown",
              );
            }
          };
          const editBlur = (event: {
            relatedTarget: EventTarget | null;
            currentTarget: Element;
          }) => {
            // Row editing ends when the focus leaves the row.
            const scope = editMode === "row" ? event.currentTarget.closest('[role="row"]') : null;
            if (!scope?.contains(event.relatedTarget as Node | null))
              stopEdit(true, column.field, "cellFocusOut");
          };
          // A custom editor: the cell handles its keys and the focus leaving it.
          const customEditor =
            inEdit && column.renderEditCell
              ? column.renderEditCell({
                  id: rowId,
                  field: column.field,
                  row,
                  value: draftValue(column, row),
                  error: error ?? false,
                  colDef: column,
                  api,
                })
              : null;
          const customHandlers =
            inEdit && column.renderEditCell
              ? {
                  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => {
                    onCellKeyDown?.(params, event);
                    if (event.target !== event.currentTarget) editKeys(event);
                  },
                  onBlur: (event: FocusEvent<HTMLDivElement>) => {
                    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
                    editBlur(event);
                  },
                }
              : {};
          const editor = !inEdit ? null : column.renderEditCell ? (
            customEditor
          ) : column.type === "singleSelect" ? (
            <select
              data-ok-data-grid-edit-input=""
              aria-label={`${labels.editLabel} ${name}`}
              {...invalid}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={editKeys}
              onBlur={editBlur}
            >
              {(column.valueOptions ?? []).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          ) : column.type === "boolean" ? (
            <input
              data-ok-data-grid-edit-input=""
              type="checkbox"
              aria-label={`${labels.editLabel} ${name}`}
              checked={draft === "true"}
              onChange={(event) => setDraft(String(event.target.checked))}
              onKeyDown={editKeys}
              onBlur={editBlur}
            />
          ) : (
            <input
              data-ok-data-grid-edit-input=""
              type={gridEditInputType(column.type)}
              aria-label={`${labels.editLabel} ${name}`}
              {...invalid}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={editKeys}
              onBlur={editBlur}
            />
          );
          const colSpan = colSpans?.[c];
          const rowSpan = rowSpans?.get(column.field);
          const params = cellParams(column, row);
          const classes = [
            typeof column.cellClassName === "function"
              ? column.cellClassName(params)
              : column.cellClassName,
            getCellClassName?.(params),
          ]
            .filter(Boolean)
            .join(" ");
          return (
            // biome-ignore lint/a11y/noStaticElementInteractions: a grid cell or a row header (the role is dynamic).
            // biome-ignore lint/a11y/useAriaPropsSupportedByRole: both roles take aria-colindex.
            <div
              key={column.field}
              role={column.rowHeader ? "rowheader" : "gridcell"}
              aria-colindex={c + colOffset}
              data-ok-field={column.field}
              data-ok-align={gridAlign(column)}
              className={classes || undefined}
              {...(column.display === "flex" ? { "data-ok-display": "flex" } : {})}
              {...(rowSpanning && column.rowSpanValueGetter
                ? { "data-ok-row-span-value": spanKeyOf(column, row) }
                : {})}
              {...(colSpan && colSpan.span > 1 ? { "aria-colspan": colSpan.span } : {})}
              {...(rowSpan && rowSpan.span > 1 ? { "aria-rowspan": rowSpan.span } : {})}
              {...(colSpan?.covered || rowSpan?.covered
                ? { "data-ok-covered": "", "aria-hidden": true }
                : {})}
              hidden={colSpan?.covered || listView || undefined}
              {...(colStart(column) !== undefined ? { "data-ok-col-start": "" } : {})}
              {...(editable(column) && !cellEditable(column, row)
                ? { "data-ok-editable": "false" }
                : {})}
              style={
                (colSpan && colSpan.span > 1) ||
                (rowSpan && rowSpan.span > 1) ||
                colStart(column) !== undefined
                  ? ({
                      ...(colSpan && colSpan.span > 1
                        ? { "--_ok-data-grid-colspan": colSpan.span }
                        : {}),
                      ...(rowSpan && rowSpan.span > 1
                        ? { "--_ok-data-grid-rowspan": rowSpan.span }
                        : {}),
                      ...(colStart(column) !== undefined
                        ? { "--_ok-data-grid-col-start": colStart(column) }
                        : {}),
                    } as CSSProperties)
                  : undefined
              }
              {...(raw !== text || typeof value !== "string" ? { "data-ok-value": raw } : {})}
              {...(column.renderCell ? { "data-ok-text": text } : {})}
              {...(sourceOf(column.field)?.groupingValueGetter
                ? { "data-ok-grouping-value": groupingKeyOf(row, column.field) }
                : {})}
              {...(gridPinSide(pinned, column.field)
                ? { "data-ok-pinned": gridPinSide(pinned, column.field) }
                : {})}
              {...(inEdit ? { "data-ok-editing": "" } : {})}
              {...(cellSelection && isGridCellSelected(cellModel, rowId, column.field)
                ? {
                    "aria-selected": true,
                    "data-ok-range-edge": gridCellEdges(
                      cellModel,
                      cellRowIds,
                      cellFields,
                      rowId,
                      column.field,
                    ),
                  }
                : {})}
              tabIndex={-1}
              onClick={(event) => onCellClick?.(params, event)}
              onDoubleClick={(event) => {
                onCellDoubleClick?.(params, event);
                startEdit.current(rowId, column.field, "cellDoubleClick");
              }}
              onKeyDown={(event) => onCellKeyDown?.(params, event)}
              {...customHandlers}
            >
              {editor ?? (column.renderCell ? custom : text)}
              {typeof error === "string" && (
                <span data-ok-data-grid-edit-error="" id={errorId} role="alert">
                  {error}
                </span>
              )}
            </div>
          );
        })}
        {listViewColumn && (
          <div
            role="gridcell"
            aria-colindex={1}
            aria-colspan={colCount}
            data-ok-data-grid-list-cell=""
            hidden={!listView || undefined}
            tabIndex={-1}
          >
            {listViewColumn.renderCell
              ? listViewColumn.renderCell({
                  row,
                  field: listViewColumn.field,
                  value: rawValue(columnOf(listViewColumn.field), row),
                  formattedValue: textOf(columnOf(listViewColumn.field), row),
                })
              : textOf(columnOf(listViewColumn.field), row)}
          </div>
        )}
      </div>
    );
    // Always a fragment: opening a panel must not remount the row.
    return (
      <Fragment key={rowId}>
        {rowElement}
        {detail != null && (
          <div
            role="row"
            data-ok-data-grid-detail=""
            data-ok-detail-for={rowId}
            id={`${id}-${rowId}-detail`}
            hidden={!onPage(index) || undefined}
            {...(typeof detailHeight === "number"
              ? {
                  "data-ok-detail-height": detailHeight,
                  style: { "--_ok-data-grid-detail-height": `${detailHeight}px` } as CSSProperties,
                }
              : {})}
          >
            <div
              role="gridcell"
              aria-colindex={1}
              aria-colspan={colCount}
              data-ok-data-grid-detail-content=""
              tabIndex={-1}
            >
              {detail}
            </div>
          </div>
        )}
      </Fragment>
    );
  };
  /** The text of an aggregated value (counts as numbers, the others through the formatter). */
  const aggregateText = (column: GridColDef<R>, value: unknown) =>
    value === null || value === undefined
      ? ""
      : aggregationModel[column.field] === "size" || !column.valueFormatter
        ? asText(value)
        : column.valueFormatter(value, {} as R);
  /** A cell of a generated row: the column's aggregated value, if any. */
  const valueCell = (column: GridColDef<R>, c: number, values: Record<string, unknown> | null) => {
    if (!renders(column)) return null;
    const start = colStart(column);
    const side = gridPinSide(pinned, column.field);
    return (
      <div
        key={column.field}
        role="gridcell"
        aria-colindex={c + colOffset}
        data-ok-field={column.field}
        data-ok-align={gridAlign(column)}
        {...(side ? { "data-ok-pinned": side } : {})}
        {...(start !== undefined
          ? {
              "data-ok-col-start": "",
              style: { "--_ok-data-grid-col-start": start } as CSSProperties,
            }
          : {})}
        hidden={listView || undefined}
        tabIndex={-1}
      >
        {values && column.field in values ? aggregateText(column, values[column.field]) : ""}
      </div>
    );
  };
  /** A generated row: a group (row grouping, pivot), a missing tree parent or a group footer. */
  const renderGroupRow = (row: R & Group, index: number) => {
    const rowId = row[GROUP].id;
    const node = tree?.get(rowId) as GridTreeRow<R>;
    const parent = node.childrenCount > 0;
    if (isFooter(row))
      return (
        <div
          key={rowId}
          role="row"
          aria-rowindex={firstRowIndex + index + rowOffset}
          hidden={!onPage(index) || undefined}
          data-ok-row-id={rowId}
          data-ok-generated=""
          data-ok-data-grid-aggregation-row=""
          aria-level={node.depth + 1}
          data-ok-parent={node.parentId as string}
        >
          {specials.map((special) => specialCell(special.field, row, "body", node, false, false))}
          {shown.map((column, c) => valueCell(column, c, aggregates.get(rowId) ?? null))}
        </div>
      );
    return (
      <div
        key={rowId}
        role="row"
        aria-rowindex={firstRowIndex + index + rowOffset}
        hidden={!onPage(index) || undefined}
        data-ok-row-id={rowId}
        data-ok-generated=""
        aria-level={node.depth + 1}
        aria-posinset={node.posInSet}
        aria-setsize={node.setSize}
        {...(parent ? { "aria-expanded": node.expanded } : {})}
        {...(node.parentId ? { "data-ok-parent": node.parentId } : {})}
      >
        {specials.map((special) =>
          specialCell(special.field, row, "body", node, parent, node.expanded),
        )}
        {shown.map((column, c) => valueCell(column, c, aggregates.get(rowId) ?? null))}
      </div>
    );
  };
  /** The aggregation footer: the values of every (filtered) row. */
  const footerRowElement = rootAggregates && (
    <div
      role="row"
      aria-rowindex={headerLevels + filterRow + topRows.length + total + 2 + bottomRows.length}
      data-ok-row-id={GRID_AGGREGATION_ROOT_ID}
      data-ok-data-grid-aggregation-row=""
    >
      {specials.map((special) => (
        <div
          key={special.field}
          role="gridcell"
          aria-colindex={specialIndex(special.field)}
          data-ok-field={special.field}
          {...(leftPinned ? { "data-ok-pinned": "left" } : {})}
          hidden={listView || undefined}
          tabIndex={-1}
        />
      ))}
      {shown.map((column, c) => valueCell(column, c, rootAggregates))}
    </div>
  );
  /** A row of a lazy grid that hasn't loaded: placeholder cells. */
  const holeRow = (index: number) => (
    <div
      key={`__loading__-${index}`}
      role="row"
      aria-rowindex={firstRowIndex + index}
      data-ok-row-id={`__loading__-${index}`}
      data-ok-loading-row=""
    >
      {specials.map((special) => (
        <div
          key={special.field}
          role="gridcell"
          aria-colindex={specialIndex(special.field)}
          data-ok-field={special.field}
          tabIndex={-1}
        />
      ))}
      {shown.map((column, c) =>
        renders(column) ? (
          <div
            key={column.field}
            role="gridcell"
            aria-colindex={c + colOffset}
            data-ok-field={column.field}
            data-ok-align={gridAlign(column)}
            tabIndex={-1}
          >
            <span data-ok-data-grid-skeleton="" />
          </div>
        ) : null,
      )}
    </div>
  );
  /** The cells of the columns the grid adds (reorder handle, checkbox, detail toggle, tree group). */
  const specialCell = (
    field: string,
    row: R,
    place: "body" | "top" | "bottom",
    node: GridTreeRow<R> | undefined,
    hasChildren: boolean,
    open: boolean,
  ) => {
    const rowId = idOf(row);
    const common = {
      key: field,
      role: "gridcell",
      "aria-colindex": specialIndex(field),
      "data-ok-field": field,
      ...(leftPinned ? { "data-ok-pinned": "left" } : {}),
      hidden: listView || undefined,
      tabIndex: -1,
    } as const;
    if (place !== "body" || isFooter(row) || (isGroup(row) && field !== groupCellOf(row)))
      return <div {...common} />;
    if (field === REORDER_FIELD)
      return (
        <div {...common}>
          <IconButton
            size="sm"
            tabIndex={-1}
            data-ok-data-grid-reorder-handle=""
            aria-label={labels.rowReorderingHandle}
          >
            <GripIcon />
          </IconButton>
        </div>
      );
    if (field === GRID_CHECKBOX_FIELD)
      return (
        <div {...common} data-ok-data-grid-checkbox="">
          <Checkbox
            size="small"
            tabIndex={-1}
            aria-label={labels.checkboxSelectionSelectRow}
            checked={selection.includes(rowId)}
            disabled={!selectable(row)}
            onChange={() => toggleRow.current(rowId)}
          />
        </div>
      );
    if (field === DETAIL_FIELD) {
      const content = getDetailPanelContent?.({ id: rowId, row });
      const shownPanel = detailIds.includes(rowId);
      return (
        <div {...common}>
          {content != null && (
            <IconButton
              size="sm"
              tabIndex={-1}
              data-ok-data-grid-detail-toggle=""
              aria-label={shownPanel ? labels.collapseDetailPanel : labels.expandDetailPanel}
              aria-expanded={shownPanel}
              {...(shownPanel ? { "aria-controls": `${id}-${rowId}-detail` } : {})}
              onClick={() => toggleDetail(rowId)}
            >
              <ExpandIcon />
            </IconButton>
          )}
        </div>
      );
    }
    // One column per grouped field: no indent.
    const depth = {
      "--_ok-data-grid-depth": multipleGrouping ? 0 : (node?.depth ?? 0),
    } as CSSProperties;
    // Row grouping: data rows leave the group column empty.
    if (!treeData && !serverTree && !isGroup(row)) return <div {...common} style={depth} />;
    const label = isGroup(row)
      ? row[GROUP].key
      : (getTreeDataPath?.(row).at(-1) ?? dataSource?.getGroupKey?.(row) ?? rowId);
    const count =
      isGroup(row) && !treeData ? (leafCounts.get(rowId) ?? 0) : (node?.descendantCount ?? 0);
    return (
      <div {...common} style={depth}>
        {hasChildren ? (
          <IconButton
            size="sm"
            tabIndex={-1}
            data-ok-data-grid-tree-toggle=""
            aria-label={open ? labels.treeDataCollapse : labels.treeDataExpand}
            aria-expanded={open}
            onClick={() => toggleExpansion.current(rowId)}
          >
            <ChevronIcon />
          </IconButton>
        ) : (
          <span data-ok-data-grid-tree-spacer="" />
        )}
        <span data-ok-data-grid-tree-label="">{label}</span>
        {hasChildren && !serverTree && !groupingColDefOf(field).hideDescendantCount && (
          <span data-ok-data-grid-tree-count="">{`(${count})`}</span>
        )}
      </div>
    );
  };
  /** The headers of the columns the grid adds. */
  const specialHeader = (field: string) => {
    const common = {
      key: field,
      role: "columnheader",
      "aria-colindex": specialIndex(field),
      "data-ok-field": field,
      ...(leftPinned ? { "data-ok-pinned": "left" } : {}),
      tabIndex: -1,
    } as const;
    if (field === GRID_CHECKBOX_FIELD)
      return (
        <div
          {...common}
          data-ok-data-grid-checkbox=""
          {...(multiple ? {} : { "aria-label": labels.checkboxSelectionHeaderName })}
        >
          {multiple && (
            <Checkbox
              size="small"
              tabIndex={-1}
              aria-label={labels.checkboxSelectionSelectAllRows}
              checked={selectAll === "all"}
              indeterminate={selectAll === "some"}
              onChange={() => setSelection(toggleGridRows(selection, allIds))}
            />
          )}
        </div>
      );
    if (groupingColumns.includes(field)) {
      const def = groupingColDefOf(field);
      const own = gridGroupingFieldOf(field);
      return (
        <div
          {...common}
          data-ok-width={def.width ?? 200}
          {...(def.hideDescendantCount ? { "data-ok-hide-descendant-count": "" } : {})}
        >
          <span data-ok-data-grid-header-title="">
            {def.headerName ??
              (own ? (sourceOf(own)?.headerName ?? own) : labels.treeDataGroupingHeaderName)}
          </span>
        </div>
      );
    }
    return (
      <div
        {...common}
        role="columnheader"
        aria-label={
          field === REORDER_FIELD ? labels.rowReorderingHeaderName : labels.detailPanelHeaderName
        }
      />
    );
  };
  /** A header row of column groups (one level). */
  const groupRow = (cells: ReturnType<typeof gridGroupRows>[number], level: number) => (
    <div key={`group-${level}`} role="row" aria-rowindex={level + 1} data-ok-data-grid-group-row="">
      {specials.map((special) => (
        <div key={special.field} role="presentation" data-ok-data-grid-group-filler="" />
      ))}
      {cells.flatMap((cell) => {
        if (cell.groupId === null)
          return cell.fields.map((field) => (
            <div key={field} role="presentation" data-ok-data-grid-group-filler="" />
          ));
        const group = groupsById.get(cell.groupId);
        const sides = cell.fields.map((f) => gridPinSide(pinned, f));
        const side = sides.every((x) => x === "left")
          ? "left"
          : sides.every((x) => x === "right")
            ? "right"
            : undefined;
        const header = (
          <div
            key={`${cell.groupId}-${cell.start}`}
            role="columnheader"
            aria-colindex={cell.start + colOffset}
            {...(cell.span > 1 ? { "aria-colspan": cell.span } : {})}
            data-ok-group-id={cell.groupId}
            {...(side
              ? {
                  "data-ok-pinned": side,
                  "data-ok-pin-field": side === "left" ? cell.fields[0] : cell.fields.at(-1),
                }
              : {})}
            tabIndex={-1}
            style={
              cell.span > 1
                ? ({ "--_ok-data-grid-colspan": cell.span } as CSSProperties)
                : undefined
            }
          >
            <span data-ok-data-grid-header-title="">{group?.headerName ?? cell.groupId}</span>
          </div>
        );
        return group?.description ? (
          <Tooltip
            key={`${cell.groupId}-${cell.start}`}
            title={group.description}
            describeChild
            id={`${id}-${cell.groupId}-${cell.start}-description`}
          >
            {header}
          </Tooltip>
        ) : (
          header
        );
      })}
    </div>
  );

  return (
    <div
      ref={mergedRef}
      {...dataGridAttributes({
        density,
        checkboxSelection,
        disableRowSelectionOnClick,
        disableColumnMenu,
        disableMultipleColumnsSorting,
        disableMultipleColumnsFiltering,
        disableColumnResize,
        disableColumnReorder,
        disableColumnPinning,
        editMode,
        disableVirtualization,
        sortingMode,
        filterMode,
        paginationMode,
        rowCount,
        loading: busy,
        loadingVariant,
        scrollEndThreshold: scrollEndThreshold === 80 ? undefined : scrollEndThreshold,
        disableMultipleRowSelection,
        keepNonExistentRowsSelected,
        checkboxSelectionVisibleOnly,
        autosizeOnMount,
        rowSpanning,
        rowHeight,
        toolbarVariant,
        quickFilterLogicOperator,
        quickFilterExcludeHiddenColumns,
        ignoreDiacritics,
        treeData,
        defaultGroupingExpansionDepth:
          defaultGroupingExpansionDepth === 0 ? undefined : defaultGroupingExpansionDepth,
        rowReordering,
        listView,
        rowBufferPx: rowBufferPx === 150 ? undefined : rowBufferPx,
        columnBufferPx: columnBufferPx === 150 ? undefined : columnBufferPx,
        lazyLoading,
        lazyLoadingRequestThrottleMs:
          lazyLoadingRequestThrottleMs === 500 ? undefined : lazyLoadingRequestThrottleMs,
        disableRowGrouping,
        rowGroupingColumnMode,
        disableAggregation,
        aggregationRowsScope,
        disablePivoting,
        pivotActive: pivotOn,
        cellSelection,
        disableClipboardPaste,
        headerFilters,
        chartsIntegration,
        multipleColumnsSortingMode,
        statusBar,
        historyStackSize: historyStackSize === 30 ? undefined : historyStackSize,
        hideFooterPagination,
        hideFooterRowCount,
        hideFooterSelectedRowCount,
        tabNavigation,
        columnHeaderHeight,
        columnGroupHeaderHeight,
        headerFilterHeight,
        showCellVerticalBorder,
        showColumnVerticalBorder,
        rowSpacingType,
        autoHeight,
        autoPageSize,
      })}
      {...(sortingOrder ? { "data-ok-sorting-order": JSON.stringify(sortingOrder) } : {})}
      {...(groupingModel.length && !treeData
        ? { "data-ok-row-grouping-model": JSON.stringify(groupingModel) }
        : {})}
      {...(Object.keys(aggregationState).length
        ? { "data-ok-aggregation-model": JSON.stringify(aggregationState) }
        : {})}
      {...(getAggregationPosition && aggregating && !pivot
        ? { "data-ok-aggregation-position": JSON.stringify(positions) }
        : {})}
      {...(pivotAvailable ? { "data-ok-pivot-model": JSON.stringify(pivotModel) } : {})}
      {...(chartsIntegration ? { "data-ok-chart-model": JSON.stringify(chartModel) } : {})}
      {...(chartsIntegration && activeChartId
        ? {
            "data-ok-chart-models": JSON.stringify(chartModels),
            "data-ok-active-chart-id": activeChartId,
          }
        : {})}
      {...(excelOptions
        ? {
            "data-ok-excel-options": JSON.stringify(
              parseGridExcelOptions(JSON.stringify(excelOptions)),
            ),
          }
        : {})}
      {...(csvOptions
        ? {
            "data-ok-csv-options": JSON.stringify(
              parseGridExportOptions(JSON.stringify(csvOptions)),
            ),
          }
        : {})}
      {...(printOptions
        ? {
            "data-ok-print-options": JSON.stringify(
              parseGridExportOptions(JSON.stringify(printOptions)),
            ),
          }
        : {})}
      data-ok-runtime="off"
      {...props}
      style={
        rowHeight === undefined && !Object.keys(headerHeights).length
          ? props.style
          : ({
              ...(rowHeight === undefined
                ? {}
                : { "--_ok-data-grid-row-height": `${baseHeight}px` }),
              ...headerHeights,
              ...props.style,
            } as CSSProperties)
      }
    >
      {toolbar}
      {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: grid and treegrid both take a name. */}
      <div
        ref={gridRef}
        role={treeLike ? "treegrid" : "grid"}
        data-ok-data-grid-main=""
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-rowcount={
          headerLevels + filterRow + 1 + topRows.length + total + bottomRows.length + footerRow
        }
        aria-colcount={colCount}
        {...(checkboxSelection && multiple ? { "aria-multiselectable": true } : {})}
        {...(busy ? { "aria-busy": true } : {})}
        style={
          {
            "--_ok-data-grid-columns": template,
          } as CSSProperties
        }
      >
        <div role="rowgroup" data-ok-data-grid-header="" hidden={listView || undefined}>
          {groupRows.map(groupRow)}
          <div role="row" aria-rowindex={headerLevels + 1}>
            {specials.map((special) => specialHeader(special.field))}
            {shown.map((column, index) => {
              if (!renders(column)) return null;
              const sortable = !disableColumnSorting && isGridSortable(column);
              const name = column.headerName ?? column.field;
              const start = colStart(column);
              const header = (
                <div
                  key={column.field}
                  role="columnheader"
                  aria-colindex={index + colOffset}
                  {...(start !== undefined
                    ? {
                        "data-ok-col-start": "",
                        style: { "--_ok-data-grid-col-start": start } as CSSProperties,
                      }
                    : {})}
                  {...(groupPaths.get(column.field)?.length
                    ? { "data-ok-group-path": JSON.stringify(groupPaths.get(column.field)) }
                    : {})}
                  data-ok-field={column.field}
                  data-ok-type={column.type ?? "string"}
                  data-ok-align={gridHeaderAlign(column)}
                  {...(column.width !== undefined ? { "data-ok-width": column.width } : {})}
                  {...(column.minWidth !== undefined
                    ? { "data-ok-min-width": column.minWidth }
                    : {})}
                  {...(column.flex !== undefined ? { "data-ok-flex": column.flex } : {})}
                  {...(column.maxWidth !== undefined
                    ? { "data-ok-max-width": column.maxWidth }
                    : {})}
                  {...(column.getApplyQuickFilterFn === null
                    ? { "data-ok-searchable": "false" }
                    : {})}
                  {...(column.hideable === false ? { "data-ok-hideable": "false" } : {})}
                  {...(column.groupable === false ? { "data-ok-groupable": "false" } : {})}
                  {...(column.aggregable === false ? { "data-ok-aggregable": "false" } : {})}
                  {...(column.filterable === false ? { "data-ok-filterable": "false" } : {})}
                  {...(column.resizable === false ? { "data-ok-resizable": "false" } : {})}
                  {...(editable(column) ? { "data-ok-editable": "" } : {})}
                  {...(editable(column) && column.valueOptions
                    ? { "data-ok-value-options": JSON.stringify(column.valueOptions) }
                    : {})}
                  {...(gridPinSide(pinned, column.field)
                    ? { "data-ok-pinned": gridPinSide(pinned, column.field) }
                    : {})}
                  {...(sortable ? { "aria-sort": gridAriaSort(sortModel, column) } : {})}
                  {...(column.sortingOrder
                    ? { "data-ok-sorting-order": JSON.stringify(column.sortingOrder) }
                    : {})}
                  {...(column.disableReorder ? { "data-ok-disable-reorder": "" } : {})}
                  {...(column.disableExport ? { "data-ok-disable-export": "" } : {})}
                  {...(column.pinnable === false ? { "data-ok-pinnable": "false" } : {})}
                  className={
                    (typeof column.headerClassName === "function"
                      ? column.headerClassName({ field: column.field, colDef: column })
                      : column.headerClassName) || undefined
                  }
                  tabIndex={-1}
                  onClick={(event) => {
                    // A press that resized or moved the column doesn't sort it.
                    if (event.currentTarget.hasAttribute("data-ok-just-dragged")) return;
                    if ((event.target as Element).closest("button")) return;
                    onColumnHeaderClick?.({ field: column.field, colDef: column }, event);
                    sortBy.current(column.field, event.shiftKey);
                  }}
                >
                  <span data-ok-data-grid-header-title="">
                    {column.renderHeader
                      ? column.renderHeader({ field: column.field, colDef: column })
                      : name}
                  </span>
                  {!pivot && aggregationOf(column) && (
                    <span data-ok-data-grid-aggregation-label="">
                      {aggLabel(aggregationOf(column) as string)}
                    </span>
                  )}
                  {sortable && !column.hideSortIcons && (
                    <span data-ok-data-grid-sort-icon="">
                      <SortIcon />
                    </span>
                  )}
                  {!disableColumnMenu && !column.disableColumnMenu && !pivot && (
                    <IconButton
                      size="sm"
                      data-ok-data-grid-menu-button=""
                      tabIndex={-1}
                      aria-label={`${name} ${labels.columnHeaderMenuLabel}`}
                      aria-haspopup="menu"
                      aria-expanded={menuField === column.field && menuAnchor !== null}
                      aria-controls={`${id}-column-menu`}
                      onClick={(event) => openMenu.current(column.field, event.currentTarget)}
                    >
                      <MoreIcon />
                    </IconButton>
                  )}
                  {!disableColumnResize && isGridResizable(column) && (
                    <span data-ok-data-grid-resize="" aria-hidden="true" />
                  )}
                </div>
              );
              // A description shows as the header's tooltip (and describes it).
              return column.description ? (
                <Tooltip
                  key={column.field}
                  title={column.description}
                  describeChild
                  id={`${id}-${column.field}-description`}
                >
                  {header}
                </Tooltip>
              ) : (
                header
              );
            })}
          </div>
          {headerFilters && headerFilterRow}
        </div>
        {topRows.length > 0 && (
          <div role="rowgroup" data-ok-data-grid-pinned-rows="top">
            {topRows.map((row, index) => renderRow(row, index, "top"))}
          </div>
        )}
        <div
          role="rowgroup"
          data-ok-data-grid-body=""
          style={
            range
              ? ({
                  "--_ok-data-grid-before": `${range.before}px`,
                  "--_ok-data-grid-after": `${range.after}px`,
                } as CSSProperties)
              : undefined
          }
        >
          {rendered.map(({ row, index }) => renderRow(row, index, "body"))}
        </div>
        {(bottomRows.length > 0 || footerRowElement) && (
          <div role="rowgroup" data-ok-data-grid-pinned-rows="bottom">
            {bottomRows.map((row, index) => renderRow(row, index, "bottom"))}
            {footerRowElement}
          </div>
        )}
      </div>
      {chartsIntegration && !activeChartId && (
        <div data-ok-data-grid-chart="" hidden={!chartData || undefined}>
          <Chart
            id={`${id}-chart`}
            label={labels.chartLabel}
            {...chartOptions}
            categories={chartData?.categories ?? []}
            series={chartData?.series ?? []}
          />
        </div>
      )}
      {chartsIntegration &&
        chartIds.map((chartId) => {
          const model = chartModels[chartId] as GridChartModel;
          const one = chartId === activeChartId && panelChart ? panelChart : chartOf(model);
          return (
            <div
              key={chartId}
              data-ok-data-grid-chart=""
              data-ok-chart-id={chartId}
              hidden={!one.chartData || undefined}
            >
              <Chart
                id={`${id}-chart-${chartId}`}
                label={model.label ?? labels.chartLabel}
                {...one.chartOptions}
                categories={one.chartData?.categories ?? []}
                series={one.chartData?.series ?? []}
              />
            </div>
          );
        })}
      {rowReordering && (
        <div data-ok-data-grid-live="" role="status">
          {announcement}
        </div>
      )}
      <div
        data-ok-data-grid-loading=""
        data-ok-variant={loadingVariant}
        role="status"
        aria-label={labels.loadingLabel}
        hidden={!busy || undefined}
      >
        {loadingVariant === "linear-progress" ? (
          <LinearProgress aria-label={labels.loadingLabel} />
        ) : loadingVariant === "circular-progress" ? (
          <CircularProgress aria-label={labels.loadingLabel} />
        ) : (
          [0, 1, 2, 3, 4].map((line) => <span key={line} data-ok-data-grid-skeleton="" />)
        )}
      </div>
      <div
        data-ok-data-grid-overlay=""
        role="status"
        hidden={pageRows.length > 0 || busy || undefined}
      >
        {pageRows.length > 0 || busy
          ? null
          : base.length === 0
            ? labels.noRowsLabel
            : labels.noResultsOverlayLabel}
      </div>
      {!disableColumnMenu && (
        <Menu
          id={`${id}-column-menu`}
          open={menuAnchor !== null}
          anchorEl={menuAnchor}
          placement="bottom-start"
          onOpenChange={(next) => !next && setMenuAnchor(null)}
        >
          <MenuItem
            data-ok-data-grid-action="asc"
            hidden={!menuCycle.includes("asc") || undefined}
            disabled={!menuColumn || !isGridSortable(menuColumn) || menuSorted === "asc"}
            onClick={() => menuAction("asc")}
          >
            {labels.columnMenuSortAsc}
          </MenuItem>
          <MenuItem
            data-ok-data-grid-action="desc"
            hidden={!menuCycle.includes("desc") || undefined}
            disabled={!menuColumn || !isGridSortable(menuColumn) || menuSorted === "desc"}
            onClick={() => menuAction("desc")}
          >
            {labels.columnMenuSortDesc}
          </MenuItem>
          <MenuItem
            data-ok-data-grid-action="unsort"
            hidden={!menuCycle.includes(null) || undefined}
            disabled={!menuSorted}
            onClick={() => menuAction("unsort")}
          >
            {labels.columnMenuUnsort}
          </MenuItem>
          {!disableColumnReorder && (
            <MenuItem
              data-ok-data-grid-action="left"
              disabled={!movable(menuField, -1)}
              onClick={() => menuAction("left")}
            >
              {labels.columnMenuMoveLeft}
            </MenuItem>
          )}
          {!disableColumnReorder && (
            <MenuItem
              data-ok-data-grid-action="right"
              disabled={!movable(menuField, 1)}
              onClick={() => menuAction("right")}
            >
              {labels.columnMenuMoveRight}
            </MenuItem>
          )}
          {!disableColumnPinning && (
            <MenuItem
              data-ok-data-grid-action="pin-left"
              hidden={!menuPinnable || undefined}
              disabled={gridPinSide(pinned, menuField as string) === "left"}
              onClick={() => menuAction("pin-left")}
            >
              {labels.pinToLeft}
            </MenuItem>
          )}
          {!disableColumnPinning && (
            <MenuItem
              data-ok-data-grid-action="pin-right"
              hidden={!menuPinnable || undefined}
              disabled={gridPinSide(pinned, menuField as string) === "right"}
              onClick={() => menuAction("pin-right")}
            >
              {labels.pinToRight}
            </MenuItem>
          )}
          {!disableColumnPinning && (
            <MenuItem
              data-ok-data-grid-action="unpin"
              hidden={!menuPinnable || undefined}
              disabled={!gridPinSide(pinned, menuField as string)}
              onClick={() => menuAction("unpin")}
            >
              {labels.unpin}
            </MenuItem>
          )}
          {!disableRowGrouping && !treeData && (
            <MenuItem
              data-ok-data-grid-action="group"
              disabled={
                !menuColumn || menuColumn.groupable === false || menuColumn.type === "actions"
              }
              onClick={() => menuAction("group")}
            >
              {(groupingModel.includes(menuField as string)
                ? labels.columnMenuUngroup
                : labels.columnMenuGroupBy
              )
                .replace("{name}", menuColumn ? (menuColumn.headerName ?? menuColumn.field) : "")
                .trim()}
            </MenuItem>
          )}
          {!disableAggregation &&
            ["none", ...Object.keys(aggregationFunctions)].map((fn) => (
              <MenuItem
                key={fn}
                data-ok-data-grid-action={`aggregate-${fn}`}
                hidden={
                  !menuColumn ||
                  !functionsOf(menuColumn).length ||
                  (fn !== "none" && !functionsOf(menuColumn).includes(fn)) ||
                  undefined
                }
                selected={!!menuColumn && (aggregationOf(menuColumn) ?? "none") === fn}
                onClick={() => menuAction(`aggregate-${fn}`)}
              >
                {`${labels.aggregationMenuItemHeader}: ${fn === "none" ? labels.aggregationMenuItemNone : aggLabel(fn)}`}
              </MenuItem>
            ))}
          {showToolbar && !disableColumnFilter && (
            <MenuItem
              data-ok-data-grid-action="filter"
              disabled={!menuColumn || !isGridFilterable(menuColumn)}
              onClick={() => menuAction("filter")}
            >
              {labels.columnMenuFilter}
            </MenuItem>
          )}
          {!disableColumnSelector && (
            <MenuItem
              data-ok-data-grid-action="hide"
              disabled={!menuColumn || !isGridHideable(menuColumn)}
              onClick={() => menuAction("hide")}
            >
              {labels.columnMenuHideColumn}
            </MenuItem>
          )}
          {showToolbar && !disableColumnSelector && (
            <MenuItem data-ok-data-grid-action="columns" onClick={() => menuAction("columns")}>
              {labels.columnMenuManageColumns}
            </MenuItem>
          )}
        </Menu>
      )}
      {statusBar && cellSelection && (
        <div data-ok-data-grid-status-bar="" role="status">
          {statusItems.map((item) => (
            <span key={item.key} data-ok-data-grid-status-item={item.key}>
              {item.text}
            </span>
          ))}
        </div>
      )}
      {!hideFooter && (
        <div data-ok-data-grid-footer="">
          {!hideFooterSelectedRowCount && selection.length > 0 && (
            <span data-ok-data-grid-selected-row-count="">
              {gridFooterRowSelected(labels, selection.length)}
            </span>
          )}
          {hideFooterPagination && !hideFooterRowCount && (
            <span data-ok-data-grid-row-count="">
              {gridFooterRowCount(
                labels,
                server.filter ? total : localFilter(orderedRows.filter(isData)).length,
                server.page ? total : orderedRows.filter(isData).length,
              )}
            </span>
          )}
          {!hideFooterPagination && (
            <TablePagination
              count={total}
              page={page}
              rowsPerPage={pagination.pageSize}
              rowsPerPageOptions={autoPageSize ? [] : pageSizeOptions}
              {...(autoPageSize ? { "data-ok-rows-per-page": pagination.pageSize } : {})}
              onPageChange={(next) => setPagination({ ...pagination, page: next })}
              onRowsPerPageChange={(pageSize) => setPagination({ page: 0, pageSize })}
              labelRowsPerPage={labels.paginationRowsPerPage}
              {...(localeText?.paginationDisplayedRows
                ? {
                    labelDisplayedRows: (range: { from: number; to: number; count: number }) =>
                      gridDisplayedRows(labels.paginationDisplayedRows, range),
                  }
                : {})}
            />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * DataGrid — spec: specs/components/data-grid.md (ADR-0020, phase 1). An ARIA grid with sorting,
 * filtering, quick search, pagination, selection, column visibility, density and CSV export.
 */
export const DataGrid = forwardRef(DataGridInner) as <R>(
  props: DataGridProps<R> & { ref?: Ref<HTMLDivElement> },
) => ReactElement;
(DataGrid as { displayName?: string }).displayName = "DataGrid";
