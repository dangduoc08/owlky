"use client";

import {
  arrangeGridColumns,
  clampGridWidth,
  createGridColumnControls,
  createGridDataSourceCache,
  createGridNavigation,
  createGridScrollWatcher,
  dataGridAttributes,
  filterGridRows,
  GRID_CHECKBOX_FIELD,
  type GridColumn,
  type GridColumnVisibilityModel,
  type GridColumnWidths,
  type GridDataSource,
  type GridDataSourceCache,
  type GridDensity,
  type GridFilterItem,
  type GridFilterModel,
  type GridLabels,
  type GridNavigation,
  type GridPinnedColumns,
  type GridSortModel,
  type GridViewport,
  gridAlign,
  gridAriaSort,
  gridColumnTemplate,
  gridDefaultLabels,
  gridDensities,
  gridEditInputType,
  gridEditText,
  gridFilterOperators,
  gridHeaderAlign,
  gridOperatorNeedsValue,
  gridPinSide,
  gridQuickFilterValues,
  gridRowWindow,
  gridSelectAllState,
  gridToCsv,
  isGridFilterable,
  isGridHideable,
  isGridResizable,
  isGridSortable,
  moveGridColumn,
  nextGridSort,
  orderGridColumns,
  parseGridEditValue,
  pinGridColumn,
  printGridContent,
  sortGridRows,
  syncGridPinning,
  toggleGridRow,
  toggleGridRows,
  visibleGridColumns,
} from "@owlky/core";
import {
  type CSSProperties,
  forwardRef,
  type HTMLAttributes,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { useControllableState } from "../utils/use-controllable-state.js";

export interface GridRenderCellParams<R> {
  row: R;
  field: string;
  /** The raw value (`valueGetter`, else `row[field]`). */
  value: unknown;
  /** The text (`valueFormatter`, else the value as text). */
  formattedValue: string;
}

/** A column (MUI X `GridColDef`). */
export interface GridColDef<R = Record<string, unknown>> extends GridColumn {
  /** The raw value of a row for this column (default: `row[field]`). */
  valueGetter?: ((row: R) => unknown) | undefined;
  /** The text shown, searched and exported (default: the value as text). */
  valueFormatter?: ((value: unknown, row: R) => string) | undefined;
  /** Custom cell content (the text still drives search and export). */
  renderCell?: ((params: GridRenderCellParams<R>) => ReactNode) | undefined;
}

export interface GridPaginationModel {
  page: number;
  pageSize: number;
}

export interface GridInitialState {
  sorting?: { sortModel?: GridSortModel } | undefined;
  filter?: { filterModel?: GridFilterModel } | undefined;
  pagination?: { paginationModel?: Partial<GridPaginationModel> } | undefined;
  columns?:
    | {
        columnVisibilityModel?: GridColumnVisibilityModel;
        /** Column order (fields). */
        orderedFields?: string[];
        /** Widths set by resizing, px. */
        dimensions?: Record<string, { width: number }>;
      }
    | undefined;
  pinnedColumns?: GridPinnedColumns | undefined;
  density?: GridDensity | undefined;
}

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
}

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
  const [editing, setEditing] = useState<{ rowId: string; field: string | null } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [overrides, setOverrides] = useState<ReadonlyMap<string, R>>(new Map());
  const refocus = useRef<{ rowId: string; field: string } | null>(null);
  // New rows from the parent replace the edits shown so far.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs when `rows` changes.
  useEffect(() => setOverrides(new Map()), [rows]);
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
  const base = dataSource ? sourced.rows : rows;
  const server = {
    sort: !!dataSource || sortingMode === "server",
    filter: !!dataSource || filterMode === "server",
    page: !!dataSource || paginationMode === "server",
  };
  const view = base.map((row) => overrides.get(String(getRowId(row))) ?? row);
  const ordered = orderGridColumns(columns, order);
  const shown = visibleGridColumns(arrangeGridColumns(ordered, pinned), visibility);
  const leftPinned = shown.some((c) => gridPinSide(pinned, c.field) === "left");
  const editable = (column: GridColDef<R>) =>
    !!column.editable && !column.valueGetter && column.type !== "actions";
  const filtered = server.filter
    ? view
    : filterGridRows(
        view,
        filterModel,
        columns,
        (row, field) => {
          const column = columns.find((c) => c.field === field) as GridColDef<R>;
          return rawValue(column, row);
        },
        (row, field) => textOf(columns.find((c) => c.field === field) as GridColDef<R>, row),
      );
  const sorted = server.sort
    ? filtered
    : sortGridRows(filtered, sortModel, columns, (row, field) =>
        rawValue(columns.find((c) => c.field === field) as GridColDef<R>, row),
      );
  const total = server.page
    ? ((dataSource ? sourced.rowCount : rowCount) ?? sorted.length)
    : sorted.length;
  const pageCount = Math.max(Math.ceil(total / pagination.pageSize), 1);
  const page = Math.min(pagination.page, pageCount - 1);
  // Rows of the page: all of them with server pagination or without a footer.
  const pageStart = server.page || hideFooter ? 0 : page * pagination.pageSize;
  const pageEnd = server.page || hideFooter ? sorted.length : pageStart + pagination.pageSize;
  const onPage = (index: number) => index >= pageStart && index < pageEnd;
  const pageRows = sorted.slice(pageStart, pageEnd);
  // Virtualization starts once the grid is measured: the first render (and SSR) shows every row,
  // rows of other pages `hidden` (as the HTML runtime does).
  const virtual = !disableVirtualization && !!viewport?.scrolls && viewport.rowHeight > 0;
  const range = virtual
    ? gridRowWindow(
        pageRows.length,
        (viewport as GridViewport).rowHeight,
        (viewport as GridViewport).offset,
        (viewport as GridViewport).viewport,
      )
    : null;
  const rendered = range
    ? pageRows
        .slice(range.start, range.end)
        .map((row, i) => ({ row, index: pageStart + range.start + i }))
    : sorted.map((row, index) => ({ row, index }));
  const busy = !!loading || sourceLoading;
  // Rows of a server page sit after the rows of the pages before it.
  const rowOffset = server.page ? page * pagination.pageSize : 0;
  const allIds = sorted.map((row) => String(getRowId(row)));
  const selectAll = gridSelectAllState(allIds, selection);
  const colOffset = checkboxSelection ? 2 : 1;

  useEffect(() => {
    const grid = gridRef.current as HTMLDivElement;
    const handle = createGridNavigation(grid, {
      onSort: (field, multi) => sortBy.current(field, multi),
      onColumnMenu: (field, header) =>
        openMenu.current(field, header.querySelector("[data-ok-data-grid-menu-button]")),
      onToggleRow: (row) => toggleRow.current(row.getAttribute("data-ok-row-id") as string),
      onSelectAll: () => selectEvery.current(),
      onEdit: (cell) =>
        startEdit.current(
          cell.closest('[role="row"]')?.getAttribute("data-ok-row-id") as string,
          cell.getAttribute("data-ok-field") as string,
        ),
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
    });
    return () => handle.destroy();
  }, []);
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
          current.scrolls === next.scrolls
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
  });
  useEffect(() => {
    if (!dataSource) return;
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
  }, [dataSource, cache, request, onDataSourceError]);
  useEffect(() => {
    if (editing)
      gridRef.current?.querySelector<HTMLElement>("[data-ok-data-grid-edit-input]")?.focus();
    else if (refocus.current) {
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
    setSelection(toggleGridRow(selection, rowId));
  };
  const selectEvery = useRef<() => void>(undefined as never);
  selectEvery.current = () => {
    if (checkboxSelection) setSelection(toggleGridRows(selection, allIds));
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
  const reorderable = useRef(true);
  reorderable.current = !disableColumnReorder;
  const fields = ordered.map((c) => c.field);
  const moveTo = useRef<(field: string, target: string) => void>(undefined as never);
  moveTo.current = (field, target) => setOrder(moveGridColumn(fields, field, { to: target }));

  const startEdit = useRef<(rowId: string, field: string) => void>(undefined as never);
  startEdit.current = (rowId, field) => {
    const column = columns.find((c) => c.field === field);
    if (!column || !editable(column)) return;
    const row = view.find((r) => String(getRowId(r)) === rowId) as R;
    const targets = editMode === "row" ? shown.filter(editable) : [column];
    setDrafts(
      Object.fromEntries(targets.map((c) => [c.field, gridEditText(rawValue(c, row), c.type)])),
    );
    setEditing({ rowId, field: editMode === "row" ? null : field });
  };
  const stopEdit = (commit: boolean, field: string) => {
    if (!editing) return;
    const { rowId } = editing;
    refocus.current = { rowId, field };
    setEditing(null);
    if (!commit) return;
    const oldRow = view.find((r) => String(getRowId(r)) === rowId) as R;
    const newRow = { ...oldRow } as Record<string, unknown>;
    for (const [f, text] of Object.entries(drafts))
      newRow[f] = parseGridEditValue(text, columns.find((c) => c.field === f)?.type);
    Promise.resolve(processRowUpdate ? processRowUpdate(newRow as R, oldRow) : (newRow as R))
      .then((result) => setOverrides((current) => new Map(current).set(rowId, result)))
      .catch((error: unknown) => onProcessRowUpdateError?.(error));
  };

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
    operator: gridFilterOperators(columns.find(isGridFilterable)?.type)[0] as string,
  });
  // The panel always shows a row: with no items, an empty one (applied once edited).
  const filterItems: GridFilterItem[] = filterModel.items.length ? filterModel.items : [newItem()];
  const setFilterItems = (items: GridFilterItem[]) => {
    setFilterModel({ ...filterModel, items });
    setPagination({ ...pagination, page: 0 });
  };
  const setFilterItem = (index: number, item: GridFilterItem) =>
    setFilterItems(filterItems.map((current, i) => (i === index ? item : current)));

  const onRowClick = (rowId: string) => (event: MouseEvent<HTMLElement>) => {
    if (!checkboxSelection || disableRowSelectionOnClick) return;
    if ((event.target as Element).closest("button, a, input, label, select, textarea")) return;
    setSelection(toggleGridRow(selection, rowId));
  };

  const menuColumn = columns.find((c) => c.field === menuField);
  const menuSorted = sortModel.find((s) => s.field === menuField)?.sort;
  const menuAction = (action: string) => {
    const field = menuField as string;
    setMenuAnchor(null);
    if (action === "asc" || action === "desc") setSortModel([{ field, sort: action }]);
    else if (action === "unsort") setSortModel(sortModel.filter((s) => s.field !== field));
    else if (action === "hide") setVisibility({ ...visibility, [field]: false });
    else if (action === "left" || action === "right")
      setOrder(moveGridColumn(fields, field, action === "left" ? -1 : 1));
    else if (action === "pin-left" || action === "pin-right" || action === "unpin")
      setPinned(
        pinGridColumn(
          pinned,
          field,
          action === "unpin" ? null : action === "pin-left" ? "left" : "right",
        ),
      );
    else if (action === "filter") {
      setFilterItems([{ field, operator: gridFilterOperators(menuColumn?.type)[0] as string }]);
      // The panels open next to their toolbar buttons (the menu offers them only with the toolbar).
      setAnchor(document.querySelector<HTMLElement>(`[aria-controls="${id}-filters"]`));
      setPanel("filters");
    } else {
      setAnchor(document.querySelector<HTMLElement>(`[aria-controls="${id}-columns"]`));
      setPanel("columns");
    }
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
        {!disableColumnSelector && (
          <Button
            size="sm"
            variant="text"
            startIcon={<ColumnsIcon />}
            aria-haspopup="dialog"
            aria-expanded={panel === "columns"}
            aria-controls={`${id}-columns`}
            onClick={open("columns")}
          >
            {labels.toolbarColumns}
          </Button>
        )}
        {!disableColumnFilter && (
          <Button
            size="sm"
            variant="text"
            startIcon={<FilterIcon />}
            aria-haspopup="dialog"
            aria-expanded={panel === "filters"}
            aria-controls={`${id}-filters`}
            onClick={open("filters")}
          >
            {labels.toolbarFilters}
          </Button>
        )}
        {!disableDensitySelector && (
          <Button
            size="sm"
            variant="text"
            startIcon={<DensityIcon />}
            aria-haspopup="menu"
            aria-expanded={panel === "density"}
            aria-controls={`${id}-density`}
            onClick={open("density")}
          >
            {labels.toolbarDensity}
          </Button>
        )}
        <Button
          size="sm"
          variant="text"
          startIcon={<ExportIcon />}
          aria-haspopup="menu"
          aria-expanded={panel === "export"}
          aria-controls={`${id}-export`}
          onClick={open("export")}
        >
          {labels.toolbarExport}
        </Button>
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
                        operator: gridFilterOperators(
                          columns.find((c) => c.field === field)?.type,
                        )[0] as string,
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
                    {gridFilterOperators(column?.type).map((operator) => (
                      <option key={operator} value={operator}>
                        {labels.filterOperator[operator] ?? operator}
                      </option>
                    ))}
                  </TextField>
                  <TextField
                    id={`${id}-filter-value${suffix}`}
                    size="small"
                    label={labels.filterPanelInputLabel}
                    placeholder={labels.filterPanelInputPlaceholder}
                    disabled={!gridOperatorNeedsValue(item.operator)}
                    value={item.value ?? ""}
                    onChange={(value) => setFilterItem(index, { ...item, value })}
                  />
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
            downloadCsv(
              exportFileName,
              gridToCsv(shown, sorted, (row, field) =>
                textOf(columns.find((c) => c.field === field) as GridColDef<R>, row),
              ),
            );
          }}
        >
          {labels.toolbarExportCSV}
        </MenuItem>
        <MenuItem
          data-ok-data-grid-export="print"
          onClick={() => {
            closePanel();
            printGridContent(gridRef.current as HTMLElement, ariaLabel ?? exportFileName);
          }}
        >
          {labels.toolbarExportPrint}
        </MenuItem>
      </Menu>
    </div>
  );

  return (
    <div
      ref={ref}
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
      })}
      data-ok-runtime="off"
      {...props}
    >
      {toolbar}
      <div
        ref={gridRef}
        role="grid"
        data-ok-data-grid-main=""
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        aria-rowcount={total + 1}
        aria-colcount={shown.length + (checkboxSelection ? 1 : 0)}
        {...(checkboxSelection ? { "aria-multiselectable": true } : {})}
        {...(busy ? { "aria-busy": true } : {})}
        style={
          {
            "--_ok-data-grid-columns": gridColumnTemplate(shown, !!checkboxSelection, widths),
          } as CSSProperties
        }
      >
        <div role="rowgroup" data-ok-data-grid-header="">
          <div role="row" aria-rowindex={1}>
            {checkboxSelection && (
              <div
                role="columnheader"
                aria-colindex={1}
                data-ok-field={GRID_CHECKBOX_FIELD}
                data-ok-data-grid-checkbox=""
                {...(leftPinned ? { "data-ok-pinned": "left" } : {})}
                tabIndex={-1}
              >
                <Checkbox
                  size="small"
                  tabIndex={-1}
                  aria-label={labels.checkboxSelectionSelectAllRows}
                  checked={selectAll === "all"}
                  indeterminate={selectAll === "some"}
                  onChange={() => setSelection(toggleGridRows(selection, allIds))}
                />
              </div>
            )}
            {shown.map((column, index) => {
              const sortable = !disableColumnSorting && isGridSortable(column);
              const name = column.headerName ?? column.field;
              return (
                <div
                  key={column.field}
                  role="columnheader"
                  aria-colindex={index + colOffset}
                  data-ok-field={column.field}
                  data-ok-type={column.type ?? "string"}
                  data-ok-align={gridHeaderAlign(column)}
                  {...(column.width !== undefined ? { "data-ok-width": column.width } : {})}
                  {...(column.minWidth !== undefined
                    ? { "data-ok-min-width": column.minWidth }
                    : {})}
                  {...(column.flex !== undefined ? { "data-ok-flex": column.flex } : {})}
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
                    sortBy.current(column.field, event.shiftKey);
                  }}
                >
                  <span data-ok-data-grid-header-title="">{name}</span>
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
                      aria-label={`${name} column menu`}
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
            })}
          </div>
        </div>
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
          {rendered.map(({ row, index }) => {
            const rowId = String(getRowId(row));
            const selected = selection.includes(rowId);
            return (
              <div
                key={rowId}
                role="row"
                aria-rowindex={index + 2 + rowOffset}
                hidden={!onPage(index) || undefined}
                data-ok-row-id={rowId}
                {...(checkboxSelection ? { "aria-selected": selected } : {})}
                {...(editing?.rowId === rowId && editing.field === null
                  ? { "data-ok-editing": "" }
                  : {})}
                onClick={onRowClick(rowId)}
              >
                {checkboxSelection && (
                  <div
                    role="gridcell"
                    aria-colindex={1}
                    data-ok-field={GRID_CHECKBOX_FIELD}
                    data-ok-data-grid-checkbox=""
                    {...(leftPinned ? { "data-ok-pinned": "left" } : {})}
                    tabIndex={-1}
                  >
                    <Checkbox
                      size="small"
                      tabIndex={-1}
                      aria-label={labels.checkboxSelectionSelectRow}
                      checked={selected}
                      onChange={() => setSelection(toggleGridRow(selection, rowId))}
                    />
                  </div>
                )}
                {shown.map((column, c) => {
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
                    (editing.field === null ? editable(column) : editing.field === column.field);
                  const draft = drafts[column.field] ?? "";
                  const setDraft = (next: string) =>
                    setDrafts((current) => ({ ...current, [column.field]: next }));
                  const editKeys = (event: { key: string; preventDefault(): void }) => {
                    if (event.key === "Enter" || event.key === "Escape") {
                      event.preventDefault();
                      stopEdit(event.key === "Enter", column.field);
                    }
                  };
                  const editBlur = (event: {
                    relatedTarget: EventTarget | null;
                    currentTarget: Element;
                  }) => {
                    // Row editing ends when the focus leaves the row.
                    const scope =
                      editMode === "row" ? event.currentTarget.closest('[role="row"]') : null;
                    if (!scope?.contains(event.relatedTarget as Node | null))
                      stopEdit(true, column.field);
                  };
                  const editor = !inEdit ? null : column.type === "singleSelect" ? (
                    <select
                      data-ok-data-grid-edit-input=""
                      aria-label={`${labels.editLabel} ${name}`}
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
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={editKeys}
                      onBlur={editBlur}
                    />
                  );
                  return (
                    <div
                      key={column.field}
                      role="gridcell"
                      aria-colindex={c + colOffset}
                      data-ok-field={column.field}
                      data-ok-align={gridAlign(column)}
                      {...(raw !== text || typeof value !== "string"
                        ? { "data-ok-value": raw }
                        : {})}
                      {...(column.renderCell ? { "data-ok-text": text } : {})}
                      {...(gridPinSide(pinned, column.field)
                        ? { "data-ok-pinned": gridPinSide(pinned, column.field) }
                        : {})}
                      {...(inEdit ? { "data-ok-editing": "" } : {})}
                      tabIndex={-1}
                      onDoubleClick={() => startEdit.current(rowId, column.field)}
                    >
                      {editor ?? (column.renderCell ? custom : text)}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
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
