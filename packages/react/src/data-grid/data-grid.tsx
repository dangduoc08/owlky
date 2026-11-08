"use client";

import {
  arrangeGridColumns,
  clampGridWidth,
  createGridColumnControls,
  createGridDataSourceCache,
  createGridNavigation,
  createGridRowReorder,
  createGridScrollWatcher,
  dataGridAttributes,
  filterGridRows,
  GRID_CHECKBOX_FIELD,
  GRID_CHECKBOX_WIDTH,
  GRID_TREE_FIELD,
  type GridColumn,
  type GridColumnGroup,
  type GridColumnVisibilityModel,
  type GridColumnWidths,
  type GridCsvOptions,
  type GridDataSource,
  type GridDataSourceCache,
  type GridDensity,
  type GridEditStartReason,
  type GridFilterItem,
  type GridFilterModel,
  type GridFilterOperator,
  type GridLabels,
  type GridNavigation,
  type GridPinnedColumns,
  type GridRowWindow,
  type GridSortModel,
  type GridState,
  type GridTreeRow,
  type GridViewport,
  gridAlign,
  gridAriaSort,
  gridCanMoveColumn,
  gridColSpans,
  gridColumnTemplate,
  gridColumnWindow,
  gridDefaultLabels,
  gridDensities,
  gridDensityFactor,
  gridDisplayedRows,
  gridEditInputType,
  gridEditText,
  gridExpandedByDepth,
  gridExportColumns,
  gridFilterOperators,
  gridFilterValues,
  gridGroupPaths,
  gridGroupRows,
  gridGroupsById,
  gridHeaderAlign,
  gridMissingRanges,
  gridOperatorNeedsValue,
  gridParentsFromPaths,
  gridPinSide,
  gridQuickFilterValues,
  gridRowOffsets,
  gridRowSpans,
  gridRowWindow,
  gridRowWindowOf,
  gridSelectAllState,
  gridToCsv,
  gridTreeRows,
  isGridFilterable,
  isGridHideable,
  isGridResizable,
  isGridSortable,
  measureGridColumn,
  moveGridColumn,
  moveGridRow,
  nextGridSort,
  orderGridColumns,
  parseGridEditValue,
  parseGridExportOptions,
  pinGridColumn,
  prepareGridPrint,
  printGridContent,
  pruneGridSelection,
  sanitizeGridState,
  selectGridRow,
  sortGridRows,
  syncGridPinning,
  toggleGridRows,
  visibleGridColumns,
} from "@owlky/core";
import {
  type CSSProperties,
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
import { Checkbox } from "../checkbox/checkbox.js";
import { CircularProgress } from "../circular-progress/circular-progress.js";
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

export interface GridPreProcessEditCellProps<R> {
  id: string;
  row: R;
  /** The value being typed (after `valueParser`). */
  props: { value: unknown };
  hasChanged: boolean;
}

/** A column (MUI X `GridColDef`). */
export interface GridColDef<R = Record<string, unknown>> extends GridColumn {
  /** The raw value of a row for this column (default: `row[field]`). */
  valueGetter?: ((row: R) => unknown) | undefined;
  /** The text shown, searched and exported (default: the value as text). */
  valueFormatter?: ((value: unknown, row: R) => string) | undefined;
  /** Custom cell content (the text still drives search and export). */
  renderCell?: ((params: GridRenderCellParams<R>) => ReactNode) | undefined;
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
  rows: readonly R[];
  columns: readonly GridColDef<R>[];
  /** Default `row.id`. */
  getRowId?: ((row: R) => string | number) | undefined;
  checkboxSelection?: boolean | undefined;
  disableRowSelectionOnClick?: boolean | undefined;
  rowSelectionModel?: readonly string[] | undefined;
  onRowSelectionModelChange?: ((ids: string[]) => void) | undefined;
  sortModel?: GridSortModel | undefined;
  onSortModelChange?: ((model: GridSortModel) => void) | undefined;
  filterModel?: GridFilterModel | undefined;
  onFilterModelChange?: ((model: GridFilterModel) => void) | undefined;
  paginationModel?: GridPaginationModel | undefined;
  onPaginationModelChange?: ((model: GridPaginationModel) => void) | undefined;
  /** Default `[5, 10, 25]`. */
  pageSizeOptions?: readonly number[] | undefined;
  columnVisibilityModel?: GridColumnVisibilityModel | undefined;
  onColumnVisibilityModelChange?: ((model: GridColumnVisibilityModel) => void) | undefined;
  density?: GridDensity | undefined;
  onDensityChange?: ((density: GridDensity) => void) | undefined;
  initialState?: GridInitialState | undefined;
  /** Shows the toolbar: quick filter, columns, filters, density and export. */
  showToolbar?: boolean | undefined;
  disableColumnMenu?: boolean | undefined;
  disableColumnSorting?: boolean | undefined;
  disableColumnFilter?: boolean | undefined;
  disableColumnSelector?: boolean | undefined;
  disableDensitySelector?: boolean | undefined;
  disableMultipleColumnsSorting?: boolean | undefined;
  hideFooter?: boolean | undefined;
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
  onColumnOrderChange?: ((fields: string[]) => void) | undefined;
  disableColumnPinning?: boolean | undefined;
  pinnedColumns?: GridPinnedColumns | undefined;
  onPinnedColumnsChange?: ((model: GridPinnedColumns) => void) | undefined;
  /** Editable columns: edit one `cell` (default) or every editable cell of a `row` together. */
  editMode?: "cell" | "row" | undefined;
  /** Called with the edited row; return (or resolve) the row to show. Reject to refuse it. */
  processRowUpdate?: ((newRow: R, oldRow: R) => R | Promise<R>) | undefined;
  onProcessRowUpdateError?: ((error: unknown) => void) | undefined;
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
  onDataSourceError?: ((error: unknown) => void) | undefined;
  /** One row at a time (no select all). */
  disableMultipleRowSelection?: boolean | undefined;
  isRowSelectable?: ((params: { id: string; row: R }) => boolean) | undefined;
  keepNonExistentRowsSelected?: boolean | undefined;
  /** Select all selects the current page only. */
  checkboxSelectionVisibleOnly?: boolean | undefined;
  autosizeOnMount?: boolean | undefined;
  autosizeOptions?: GridAutosizeOptions | undefined;
  /** Neighbouring cells with the same value merge (per column). */
  rowSpanning?: boolean | undefined;
  /** Row height, px, before the density factor. Default 52. */
  rowHeight?: number | undefined;
  /** A row's height: px, or `"auto"` (the content decides); `null`: the default. */
  getRowHeight?:
    | ((params: { id: string; model: R; densityFactor: number }) => number | "auto" | null)
    | undefined;
  /** The height to assume for `"auto"` rows before they are measured. */
  getEstimatedRowHeight?: ((params: { id: string; model: R }) => number) | undefined;
  getRowClassName?: ((params: GridRowParams<R>) => string) | undefined;
  getCellClassName?: ((params: GridCellParams<R>) => string) | undefined;
  /** Space above and below a row, px. */
  getRowSpacing?:
    | ((params: GridRowParams<R>) => { top?: number | undefined; bottom?: number | undefined })
    | undefined;
  onRowClick?: ((params: GridRowParams<R>, event: MouseEvent<HTMLElement>) => void) | undefined;
  onRowDoubleClick?:
    | ((params: GridRowParams<R>, event: MouseEvent<HTMLElement>) => void)
    | undefined;
  onCellClick?: ((params: GridCellParams<R>, event: MouseEvent<HTMLElement>) => void) | undefined;
  onCellDoubleClick?:
    | ((params: GridCellParams<R>, event: MouseEvent<HTMLElement>) => void)
    | undefined;
  onCellKeyDown?:
    | ((params: GridCellParams<R>, event: KeyboardEvent<HTMLElement>) => void)
    | undefined;
  onColumnHeaderClick?:
    | ((params: { field: string; colDef: GridColDef<R> }, event: MouseEvent<HTMLElement>) => void)
    | undefined;
  /** Receives the grid's methods. */
  apiRef?: RefObject<GridApi<R> | null> | undefined;
  isCellEditable?: ((params: GridCellParams<R>) => boolean) | undefined;
  onCellEditStart?: ((params: GridCellParams<R>, reason: GridEditStartReason) => void) | undefined;
  onCellEditStop?: ((params: GridCellParams<R>, reason: GridEditStopReason) => void) | undefined;
  onRowEditStart?:
    | ((params: { id: string; row: R }, reason: GridEditStartReason) => void)
    | undefined;
  onRowEditStop?:
    | ((params: { id: string; row: R }, reason: GridEditStopReason) => void)
    | undefined;
  /** Search words: all must match (`and`, default) or any (`or`). */
  quickFilterLogicOperator?: "and" | "or" | undefined;
  quickFilterExcludeHiddenColumns?: boolean | undefined;
  /** Searches and filters ignore accents. */
  ignoreDiacritics?: boolean | undefined;
  csvOptions?: GridCsvOptions | undefined;
  printOptions?: GridPrintOptions | undefined;
  /** Toolbar buttons with text (default) or icons with tooltips. */
  toolbarVariant?: "labeled" | "icon" | undefined;
  /** Rows form a tree (`getTreeDataPath`, or a data source with `getChildrenCount`). */
  treeData?: boolean | undefined;
  /** A row's path in the tree: its ancestors' keys, then its own (MUI X). */
  getTreeDataPath?: ((row: R) => readonly string[]) | undefined;
  groupingColDef?: GridGroupingColDef | undefined;
  /** Levels open at first (`-1`: all). Default 0. */
  defaultGroupingExpansionDepth?: number | undefined;
  isGroupExpandedByDefault?: ((node: { id: string; depth: number; row: R }) => boolean) | undefined;
  /** A row's detail panel (`null`: none, no toggle). */
  getDetailPanelContent?: ((params: { id: string; row: R }) => ReactNode) | undefined;
  /** px, or `"auto"` (default): the content decides. */
  getDetailPanelHeight?: ((params: { id: string; row: R }) => number | "auto") | undefined;
  detailPanelExpandedRowIds?: readonly string[] | undefined;
  onDetailPanelExpandedRowIdsChange?: ((ids: string[]) => void) | undefined;
  /** Rows move by dragging their handle (or Alt + Up / Down on it). */
  rowReordering?: boolean | undefined;
  onRowOrderChange?:
    | ((params: { row: R; oldIndex: number; targetIndex: number }) => void)
    | undefined;
  /** Rows kept above or below the others (not sorted, filtered or paged). */
  pinnedRows?: { top?: readonly R[] | undefined; bottom?: readonly R[] | undefined } | undefined;
  /** Header groups over the columns (multi-level headers). */
  columnGroupingModel?: readonly GridColumnGroup[] | undefined;
  /** Each row shows as one cell (`listViewColumn`). */
  listView?: boolean | undefined;
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

const REORDER_FIELD = "__reorder__";
const DETAIL_FIELD = "__detail_panel_toggle__";
/** Lazy loading asks for rows in chunks of this many. */
const LAZY_CHUNK = 50;
/** Rows of a lazy grid that haven't loaded yet. */
const HOLE = Symbol("row not loaded");
type Hole = { [HOLE]: number };
const holeAt = <R,>(index: number) => ({ [HOLE]: index }) as unknown as R;
const isHole = (row: unknown): row is Hole =>
  typeof row === "object" && row !== null && HOLE in row;

const rawValue = <R,>(column: GridColDef<R>, row: R) =>
  column.valueGetter ? column.valueGetter(row) : (row as Record<string, unknown>)[column.field];
const asText = (value: unknown) =>
  value === null || value === undefined
    ? ""
    : value instanceof Date
      ? value.toISOString()
      : String(value);
const textOf = <R,>(column: GridColDef<R>, row: R) => {
  const value = rawValue(column, row);
  return column.valueFormatter ? column.valueFormatter(value, row) : asText(value);
};

/** Starts a CSV download (a Blob link, revoked right after). */
function downloadCsv(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

type Panel = "columns" | "filters" | "density" | "export" | null;

function DataGridInner<R>(
  {
    rows,
    columns,
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
    hideFooter,
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
    columnGroupingModel,
    listView,
    listViewColumn,
    rowBufferPx = 150,
    columnBufferPx = 150,
    lazyLoading,
    lazyLoadingRequestThrottleMs = 500,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledby,
    ...props
  }: DataGridProps<R>,
  ref: Ref<HTMLDivElement>,
) {
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
  const [sourced, setSourced] = useState<{ rows: readonly R[]; rowCount?: number | undefined }>({
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
  const serverTree = !!treeData && !!dataSource;
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
  const idOf = (row: R) => (isHole(row) ? `__loading__-${row[HOLE]}` : String(getRowId(row)));
  const view = base.map((row) => overrides.get(idOf(row)) ?? row);
  const rank = rowOrder ? new Map(rowOrder.map((rowId, i) => [rowId, i])) : null;
  const orderedRows = rank
    ? [...view].sort((a, b) => (rank.get(idOf(a)) ?? rank.size) - (rank.get(idOf(b)) ?? rank.size))
    : view;
  const ordered = orderGridColumns(columns, order);
  // While printing (every row and the printed columns render, then the page prints).
  const [printing, setPrinting] = useState<GridPrintOptions | null>(null);
  const shown = visibleGridColumns(
    arrangeGridColumns(ordered, pinned),
    printing?.allColumns ? {} : visibility,
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
  const localSort = (list: readonly R[]) =>
    sortGridRows(list, sortModel, columns, (row, field) => rawValue(columnOf(field), row));
  // Tree data: which rows are open (absent: the default depth).
  const [expansion, setExpansion] = useState<ReadonlyMap<string, boolean>>(new Map());
  const serverParents = new Map<string, string>();
  for (const [parent, kids] of childRows)
    for (const kid of kids) serverParents.set(idOf(kid), parent);
  let filtered: readonly R[];
  let sorted: readonly R[];
  let tree: Map<string, GridTreeRow<R>> | null = null;
  let treeOrder: readonly R[] | null = null;
  if (lazy) {
    const count = sourced.rowCount ?? rowCount ?? 0;
    sorted = Array.from({ length: count }, (_, i) => lazyRows.get(i) ?? holeAt<R>(i));
    filtered = sorted;
  } else if (treeData) {
    const parents = serverTree
      ? serverParents
      : gridParentsFromPaths(orderedRows, idOf, getTreeDataPath ?? (() => []));
    const byId = new Map(orderedRows.map((row) => [idOf(row), row]));
    const pass = server.filter ? null : new Set(localFilter(orderedRows));
    const place = server.sort ? null : new Map(localSort(orderedRows).map((row, i) => [row, i]));
    const openOf = (rowId: string, depth: number) =>
      expansion.get(rowId) ??
      (isGroupExpandedByDefault
        ? isGroupExpandedByDefault({ id: rowId, depth, row: byId.get(rowId) as R })
        : gridExpandedByDepth(defaultGroupingExpansionDepth, depth));
    const options = {
      idOf,
      parentOf: (row: R) => parents.get(idOf(row)) ?? null,
      keep: pass ? (row: R) => pass.has(row) : undefined,
      compare: place
        ? (a: R, b: R) => (place.get(a) as number) - (place.get(b) as number)
        : undefined,
    };
    const list = gridTreeRows(orderedRows, { ...options, expanded: openOf });
    // Every row renders (children of closed rows `hidden`), so the markup holds the whole tree.
    const all = serverTree ? list : gridTreeRows(orderedRows, { ...options, expanded: () => true });
    tree = new Map(
      all.map((node) => [
        node.id,
        { ...node, expanded: node.childrenCount > 0 && openOf(node.id, node.depth) },
      ]),
    );
    treeOrder = all.map((node) => node.row);
    sorted = list.map((node) => node.row);
    filtered = sorted;
  } else {
    filtered = server.filter ? orderedRows : localFilter(orderedRows);
    sorted = server.sort ? filtered : localSort(filtered);
  }
  const total = server.page
    ? ((dataSource ? sourced.rowCount : rowCount) ?? sorted.length)
    : sorted.length;
  const pageCount = Math.max(Math.ceil(total / pagination.pageSize), 1);
  const page = Math.min(pagination.page, pageCount - 1);
  // Rows of the page: all of them with server pagination or without a footer.
  const unpaged = server.page || hideFooter || lazy;
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
    getDetailPanelContent && detailIds.includes(idOf(row))
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
  const heightOf = (row: R) => getRowHeight?.({ id: idOf(row), model: row, densityFactor: factor });
  const spacingOf = (row: R, i: number) => getRowSpacing?.(rowParams(row, i)) ?? {};
  const variable =
    !!getRowHeight || !!getRowSpacing || (!!getDetailPanelContent && detailIds.length > 0);
  const baseHeight = Math.round((rowHeight ?? 52) * factor);
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
        const box =
          measured.current.get(idOf(row)) ??
          (typeof own === "number"
            ? own + 1
            : (getEstimatedRowHeight?.({ id: idOf(row), model: row }) ?? baseHeight) + 1);
        return box + (space.top ?? 0) + (space.bottom ?? 0);
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
    ? gridRowSpans(pageRows, spanFields, (row, field) => textOf(columnOf(field), row))
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
  const selectable = (row: R) =>
    !isHole(row) && (isRowSelectable?.({ id: idOf(row), row }) ?? true);
  // Select all: the selectable rows of every page (or of this page only).
  const allIds = (checkboxSelectionVisibleOnly ? pageRows : sorted).filter(selectable).map(idOf);
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
    ...(treeData ? [{ field: GRID_TREE_FIELD, width: groupingColDef?.width ?? 200 }] : []),
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
  const firstRowIndex = headerLevels + topRows.length + 2;
  const canReorder = useRef(false);
  canReorder.current =
    !!rowReordering &&
    !treeData &&
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
        .getRows({ sortModel, filterModel, groupKeys: keys })
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

  const cache = dataSourceCache === undefined ? defaultCache : dataSourceCache;
  const request = JSON.stringify({
    sortModel,
    filterModel,
    paginationModel: { page: pagination.page, pageSize: pagination.pageSize },
    ...(serverTree ? { groupKeys: [] } : {}),
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
  const lazyKey = JSON.stringify({ sortModel, filterModel });
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
          .getRows({ sortModel, filterModel, start: r.start, end: r.end })
          .then((response) => {
            if (state.key !== lazyKey) return;
            setLazyRows((current) => {
              const next = new Map(current);
              for (const [k, row] of response.rows.entries()) next.set(r.start + k, row);
              return next;
            });
            if (response.rowCount !== undefined)
              setSourced((current) => ({ ...current, rowCount: response.rowCount }));
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
      const input =
        grid.querySelector<HTMLInputElement>(
          `[data-ok-field="${CSS.escape(editing.focus)}"] > [data-ok-data-grid-edit-input]`,
        ) ?? grid.querySelector<HTMLInputElement>("[data-ok-data-grid-edit-input]");
      input?.focus();
      if (editing.typed && input?.type === "text")
        input.setSelectionRange(input.value.length, input.value.length);
    } else if (refocus.current) {
      const { rowId, field } = refocus.current;
      refocus.current = null;
      gridRef.current
        ?.querySelector<HTMLElement>(
          `[data-ok-row-id="${CSS.escape(rowId)}"] [role="gridcell"][data-ok-field="${CSS.escape(field)}"]`,
        )
        ?.focus();
    }
  }, [editing]);

  // Latest handlers for the navigation controller (it lives as long as the grid).
  const sortBy = useRef<(field: string, multi: boolean) => void>(undefined as never);
  sortBy.current = (field, multi) => {
    const column = columns.find((c) => c.field === field);
    if (!column || disableColumnSorting || !isGridSortable(column)) return;
    setSortModel(nextGridSort(sortModel, field, multi && !disableMultipleColumnsSorting));
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
    setOrder(moveGridColumn(fields, field, { to: target }));
  };

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
  const startEdit = useRef<
    (rowId: string, field: string, reason: GridEditStartReason, key?: string) => void
  >(undefined as never);
  startEdit.current = (rowId, field, reason, key) => {
    const column = columns.find((c) => c.field === field);
    const row = view.find((r) => idOf(r) === rowId);
    if (!column || !row || !cellEditable(column, row)) return;
    const targets = editMode === "row" ? shown.filter((c) => cellEditable(c, row)) : [column];
    const start = Object.fromEntries(
      targets.map((c) => [c.field, gridEditText(rawValue(c, row), c.type)]),
    );
    initialDrafts.current = start;
    // A typed character replaces the value (text-like fields only).
    const typed = key !== undefined && !["boolean", "singleSelect"].includes(column.type ?? "");
    setDrafts(typed ? { ...start, [field]: key as string } : start);
    setErrors({});
    // The typed character is checked like any change.
    if (typed) check(column, key as string, row);
    setEditing({ rowId, field: editMode === "row" ? null : field, focus: field, typed });
    if (editMode === "row") onRowEditStart?.({ id: rowId, row }, reason);
    else onCellEditStart?.(cellParams(column, row), reason);
  };
  /** Runs a column's check on an edited text and keeps its error. */
  const check = (column: GridColDef<R>, text: string, row: R) => {
    if (!column.preProcessEditCellProps) return;
    const { error } = column.preProcessEditCellProps({
      id: idOf(row),
      row,
      props: { value: parse(column, text, row) },
      hasChanged: text !== initialDrafts.current[column.field],
    });
    setErrors((current) => {
      const next = { ...current };
      if (error) next[column.field] = error;
      else delete next[column.field];
      return next;
    });
  };
  const changeDraft = (column: GridColDef<R>, text: string) => {
    setDrafts((current) => ({ ...current, [column.field]: text }));
    const row = view.find((r) => idOf(r) === editing?.rowId);
    if (row) check(column, text, row);
  };
  const stopEdit = (commit: boolean, field: string, reason: GridEditStopReason) => {
    if (!editing) return;
    // A value with an error keeps the cell open (Escape still cancels).
    if (commit && Object.keys(errors).length > 0) return;
    const { rowId } = editing;
    refocus.current = { rowId, field };
    setEditing(null);
    setErrors({});
    const oldRow = view.find((r) => idOf(r) === rowId) as R;
    if (editMode === "row") onRowEditStop?.({ id: rowId, row: oldRow }, reason);
    else onCellEditStop?.(cellParams(columnOf(field), oldRow), reason);
    if (!commit) return;
    let newRow = { ...oldRow } as R;
    for (const [f, text] of Object.entries(drafts)) {
      const column = columnOf(f);
      const value = parse(column, text, oldRow);
      newRow = column.valueSetter
        ? column.valueSetter(value, newRow)
        : ({ ...newRow, [f]: value } as R);
    }
    Promise.resolve(processRowUpdate ? processRowUpdate(newRow, oldRow) : newRow)
      .then((result) => {
        setOverrides((current) => new Map(current).set(rowId, result));
        // A data source saves the row too; its answer is the row to show.
        if (!dataSource?.updateRow) return;
        Promise.resolve(dataSource.updateRow({ rowId, updatedRow: result, previousRow: oldRow }))
          .then((saved) => {
            setOverrides((current) => new Map(current).set(rowId, saved));
            cache?.clear();
          })
          .catch((error: unknown) => {
            setOverrides((current) => new Map(current).set(rowId, oldRow));
            onDataSourceError?.(error);
          });
      })
      .catch((error: unknown) => onProcessRowUpdateError?.(error));
  };

  const getCsv = (options: GridCsvOptions = csvOptions ?? {}) =>
    gridToCsv(
      gridExportColumns(columns, shown, options),
      sorted,
      (row, field) => textOf(columnOf(field), row),
      options,
    );
  const exportCsv = (options: GridCsvOptions = csvOptions ?? {}) =>
    downloadCsv(options.fileName ?? exportFileName, getCsv(options));
  const print = (options: GridPrintOptions = printOptions ?? {}) => setPrinting({ ...options });
  useEffect(() => {
    if (!printing) return;
    const options = printing;
    const keep = options.fields ? new Set(options.fields) : null;
    const printed = shown.filter((c) => c.type !== "actions" && (!keep || keep.has(c.field)));
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
  // The typed text (with its spaces); the model keeps the words.
  const [quickText, setQuickText] = useState(() => (filterModel.quickFilterValues ?? []).join(" "));
  const setQuick = (text: string) => {
    setQuickText(text);
    setFilterModel({ ...filterModel, quickFilterValues: gridQuickFilterValues(text) });
    setPagination({ ...pagination, page: 0 });
  };
  const newItem = (): GridFilterItem => ({
    field: columns.find(isGridFilterable)?.field ?? "",
    operator: operatorsOf(columns.find(isGridFilterable))[0]?.value as string,
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
  const menuSorted = sortModel.find((s) => s.field === menuField)?.sort;
  const menuAction = (action: string) => {
    const field = menuField as string;
    setMenuAnchor(null);
    if (action === "asc" || action === "desc") setSortModel([{ field, sort: action }]);
    else if (action === "unsort") setSortModel(sortModel.filter((s) => s.field !== field));
    else if (action === "hide") setVisibility({ ...visibility, [field]: false });
    else if (action === "left" || action === "right") {
      const neighbour = fields[fields.indexOf(field) + (action === "left" ? -1 : 1)] as string;
      if (columnGroupingModel && !gridCanMoveColumn(groupPaths, field, neighbour)) return;
      setOrder(moveGridColumn(fields, field, action === "left" ? -1 : 1));
    } else if (action === "pin-left" || action === "pin-right" || action === "unpin")
      setPinned(
        pinGridColumn(
          pinned,
          field,
          action === "unpin" ? null : action === "pin-left" ? "left" : "right",
        ),
      );
    else if (action === "filter") {
      setFilterItems([{ field, operator: operatorsOf(menuColumn)[0]?.value as string }]);
      // The panels open next to their toolbar buttons (the menu offers them only with the toolbar).
      setAnchor(document.querySelector<HTMLElement>(`[aria-controls="${id}-filters"]`));
      setPanel("filters");
    } else {
      setAnchor(document.querySelector<HTMLElement>(`[aria-controls="${id}-columns"]`));
      setPanel("columns");
    }
  };

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
        {!disableColumnSelector &&
          toolbarButton("columns", labels.toolbarColumns, <ColumnsIcon />, "dialog")}
        {!disableColumnFilter &&
          toolbarButton("filters", labels.toolbarFilters, <FilterIcon />, "dialog")}
        {!disableDensitySelector &&
          toolbarButton("density", labels.toolbarDensity, <DensityIcon />, "menu")}
        {toolbarButton("export", labels.toolbarExport, <ExportIcon />, "menu")}
      </div>
      {!disableColumnSelector && (
        <Popover
          id={`${id}-columns`}
          open={panel === "columns"}
          anchorEl={anchor}
          placement="bottom-end"
          onOpenChange={(next) => !next && closePanel()}
        >
          <div data-ok-data-grid-panel="" role="group" aria-label={labels.toolbarColumns}>
            {columns.filter(isGridHideable).map((column) => (
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
              const column = columns.find((c) => c.field === item.field);
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
                        operator: operatorsOf(columns.find((c) => c.field === field))[0]
                          ?.value as string,
                      })
                    }
                  >
                    {columns.filter(isGridFilterable).map((c) => (
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
      </Menu>
    </div>
  );

  /** One row: body rows (paged, windowed, with a detail panel), or pinned rows. */
  const renderRow = (row: R, index: number, place: "body" | "top" | "bottom") => {
    if (isHole(row)) return holeRow(index);
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
        ? headerLevels + 2 + index
        : place === "bottom"
          ? headerLevels + topRows.length + total + 2 + index
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
          const text = textOf(column, row);
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
          const editor = !inEdit ? null : column.type === "singleSelect" ? (
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
          return (
            <div
              key={column.field}
              role="gridcell"
              aria-colindex={c + colOffset}
              data-ok-field={column.field}
              data-ok-align={gridAlign(column)}
              className={getCellClassName?.(params) || undefined}
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
              {...(gridPinSide(pinned, column.field)
                ? { "data-ok-pinned": gridPinSide(pinned, column.field) }
                : {})}
              {...(inEdit ? { "data-ok-editing": "" } : {})}
              tabIndex={-1}
              onClick={(event) => onCellClick?.(params, event)}
              onDoubleClick={(event) => {
                onCellDoubleClick?.(params, event);
                startEdit.current(rowId, column.field, "cellDoubleClick");
              }}
              onKeyDown={(event) => onCellKeyDown?.(params, event)}
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
    if (place !== "body") return <div {...common} />;
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
    const label = getTreeDataPath?.(row).at(-1) ?? dataSource?.getGroupKey?.(row) ?? rowId;
    return (
      <div {...common} style={{ "--_ok-data-grid-depth": node?.depth ?? 0 } as CSSProperties}>
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
        {hasChildren && !serverTree && !groupingColDef?.hideDescendantCount && (
          <span data-ok-data-grid-tree-count="">({node?.descendantCount ?? 0})</span>
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
    if (field === GRID_TREE_FIELD)
      return (
        <div {...common} data-ok-width={groupingColDef?.width ?? 200}>
          <span data-ok-data-grid-header-title="">
            {groupingColDef?.headerName ?? labels.treeDataGroupingHeaderName}
          </span>
        </div>
      );
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
      })}
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
        rowHeight === undefined
          ? props.style
          : ({ "--_ok-data-grid-row-height": `${baseHeight}px`, ...props.style } as CSSProperties)
      }
    >
      {toolbar}
      {/* biome-ignore lint/a11y/useAriaPropsSupportedByRole: grid and treegrid both take a name. */}
      <div
        ref={gridRef}
        role={treeData ? "treegrid" : "grid"}
        data-ok-data-grid-main=""
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-rowcount={headerLevels + 1 + topRows.length + total + bottomRows.length}
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
                  {sortable && (
                    <span data-ok-data-grid-sort-icon="">
                      <SortIcon />
                    </span>
                  )}
                  {!disableColumnMenu && (
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
        {bottomRows.length > 0 && (
          <div role="rowgroup" data-ok-data-grid-pinned-rows="bottom">
            {bottomRows.map((row, index) => renderRow(row, index, "bottom"))}
          </div>
        )}
      </div>
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
            disabled={!menuColumn || !isGridSortable(menuColumn) || menuSorted === "asc"}
            onClick={() => menuAction("asc")}
          >
            {labels.columnMenuSortAsc}
          </MenuItem>
          <MenuItem
            data-ok-data-grid-action="desc"
            disabled={!menuColumn || !isGridSortable(menuColumn) || menuSorted === "desc"}
            onClick={() => menuAction("desc")}
          >
            {labels.columnMenuSortDesc}
          </MenuItem>
          <MenuItem
            data-ok-data-grid-action="unsort"
            disabled={!menuSorted}
            onClick={() => menuAction("unsort")}
          >
            {labels.columnMenuUnsort}
          </MenuItem>
          {!disableColumnReorder && (
            <MenuItem
              data-ok-data-grid-action="left"
              disabled={fields.indexOf(menuField as string) <= 0}
              onClick={() => menuAction("left")}
            >
              {labels.columnMenuMoveLeft}
            </MenuItem>
          )}
          {!disableColumnReorder && (
            <MenuItem
              data-ok-data-grid-action="right"
              disabled={fields.indexOf(menuField as string) >= fields.length - 1}
              onClick={() => menuAction("right")}
            >
              {labels.columnMenuMoveRight}
            </MenuItem>
          )}
          {!disableColumnPinning && (
            <MenuItem
              data-ok-data-grid-action="pin-left"
              disabled={gridPinSide(pinned, menuField as string) === "left"}
              onClick={() => menuAction("pin-left")}
            >
              {labels.pinToLeft}
            </MenuItem>
          )}
          {!disableColumnPinning && (
            <MenuItem
              data-ok-data-grid-action="pin-right"
              disabled={gridPinSide(pinned, menuField as string) === "right"}
              onClick={() => menuAction("pin-right")}
            >
              {labels.pinToRight}
            </MenuItem>
          )}
          {!disableColumnPinning && (
            <MenuItem
              data-ok-data-grid-action="unpin"
              disabled={!gridPinSide(pinned, menuField as string)}
              onClick={() => menuAction("unpin")}
            >
              {labels.unpin}
            </MenuItem>
          )}
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
      {!hideFooter && (
        <div data-ok-data-grid-footer="">
          <TablePagination
            count={total}
            page={page}
            rowsPerPage={pagination.pageSize}
            rowsPerPageOptions={pageSizeOptions}
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
