import { type GridDensity, gridDensities } from "../data-grid/data-grid.js";
import {
  behavior,
  type DataAttributes,
  defineOptions,
  flag,
  number,
  optionAttributes,
  style,
} from "../options/define.js";

// --- Data grid (ADR-0020) ---------------------------------------------------------------------

export const dataGridOptions = defineOptions("data-grid", "data-ok-data-grid", {
  density: style(
    "data-ok-density",
    gridDensities,
    "standard",
    "Row height: `compact` 36px, `standard` 52px, `comfortable` 67px.",
  ),
  checkboxSelection: flag(
    "data-ok-checkbox-selection",
    "A first column of checkboxes selects rows.",
  ),
  disableRowSelectionOnClick: flag(
    "data-ok-disable-row-selection-on-click",
    "Clicking a row doesn't select it (only its checkbox does).",
  ),
  disableColumnMenu: flag("data-ok-disable-column-menu", "No column menu in the headers."),
  disableMultipleColumnsSorting: flag(
    "data-ok-disable-multiple-columns-sorting",
    "Shift doesn't add columns to the sort.",
  ),
  disableMultipleColumnsFiltering: flag(
    "data-ok-disable-multiple-columns-filtering",
    "The filter panel keeps one filter (no Add filter).",
  ),
  disableColumnResize: flag("data-ok-disable-column-resize", "Columns can't be resized."),
  disableColumnReorder: flag("data-ok-disable-column-reorder", "Columns can't be moved."),
  disableColumnPinning: flag("data-ok-disable-column-pinning", "Columns can't be pinned."),
  editMode: style(
    "data-ok-edit-mode",
    ["cell", "row"],
    "cell",
    "Editable columns: edit one `cell` at a time, or every editable cell of a `row` together.",
  ),
  disableVirtualization: flag(
    "data-ok-disable-virtualization",
    "Render every row of the page, not only the visible ones.",
  ),
  sortingMode: style(
    "data-ok-sorting-mode",
    ["client", "server"],
    "client",
    "`server`: the grid reports the sort model and shows the rows as given.",
  ),
  filterMode: style(
    "data-ok-filter-mode",
    ["client", "server"],
    "client",
    "`server`: the grid reports the filter model and shows the rows as given.",
  ),
  paginationMode: style(
    "data-ok-pagination-mode",
    ["client", "server"],
    "client",
    "`server`: the rows are the current page; `rowCount` is the total.",
  ),
  rowCount: number(
    "data-ok-row-count",
    undefined,
    "Total rows on the server (`-1`: not known yet).",
    { min: -1 },
  ),
  estimatedRowCount: number(
    "data-ok-estimated-row-count",
    undefined,
    'With an unknown row count: the pagination shows "around" this number while the page is before it.',
    { min: 0 },
  ),
  loading: flag("data-ok-loading", "Data is loading: an overlay shows progress."),
  loadingVariant: style(
    "data-ok-loading-variant",
    ["linear-progress", "circular-progress", "skeleton"],
    "linear-progress",
    "How loading shows: a bar, a spinner or placeholder rows.",
  ),
  scrollEndThreshold: number(
    "data-ok-scroll-end-threshold",
    80,
    "Distance from the end of the rows (px) that reports the scroll end.",
    { min: 0 },
  ),
  disableMultipleRowSelection: flag(
    "data-ok-disable-multiple-row-selection",
    "One row at a time: selecting a row clears the others (no select all).",
  ),
  keepNonExistentRowsSelected: flag(
    "data-ok-keep-non-existent-rows-selected",
    "Selected ids stay selected when their rows go away (server pages, new data).",
  ),
  checkboxSelectionVisibleOnly: flag(
    "data-ok-checkbox-selection-visible-only",
    "Select all selects the rows of the current page only.",
  ),
  autosizeOnMount: flag(
    "data-ok-autosize-on-mount",
    "Columns fit their content once the grid shows (resizable, non-flex columns).",
  ),
  rowSpanning: flag(
    "data-ok-row-spanning",
    "Neighbouring cells of a column with the same value merge into one tall cell.",
  ),
  rowHeight: number("data-ok-row-height", undefined, "Row height (px) before density.", {
    min: 1,
  }),
  toolbarVariant: style(
    "data-ok-toolbar-variant",
    ["labeled", "icon"],
    "labeled",
    "Toolbar buttons with text, or icons with tooltips.",
  ),
  quickFilterLogicOperator: style(
    "data-ok-quick-filter-logic-operator",
    ["and", "or"],
    "and",
    "Search words: every one must match (`and`), or any one (`or`).",
  ),
  quickFilterExcludeHiddenColumns: flag(
    "data-ok-quick-filter-exclude-hidden-columns",
    "The search skips hidden columns.",
  ),
  ignoreDiacritics: flag(
    "data-ok-ignore-diacritics",
    'Searches and filters ignore accents: "ha noi" finds "Hà Nội".',
  ),
  treeData: flag(
    "data-ok-tree-data",
    "Rows form a tree: a group column opens and closes their children.",
  ),
  defaultGroupingExpansionDepth: number(
    "data-ok-default-grouping-expansion-depth",
    0,
    "Tree levels open at first (`-1`: all).",
  ),
  rowReordering: flag(
    "data-ok-row-reordering",
    "Rows move by dragging their handle, or Alt + Up / Down on it.",
  ),
  listView: flag("data-ok-list-view", "Each row shows as one cell (a card) instead of columns."),
  rowBufferPx: number(
    "data-ok-row-buffer-px",
    150,
    "Rows rendered above and below the visible ones, px.",
    { min: 0 },
  ),
  columnBufferPx: number(
    "data-ok-column-buffer-px",
    150,
    "Columns rendered left and right of the visible ones, px.",
    { min: 0 },
  ),
  lazyLoading: flag(
    "data-ok-lazy-loading",
    "With a data source and a row count: rows load in chunks as they scroll into view.",
  ),
  lazyLoadingRequestThrottleMs: number(
    "data-ok-lazy-loading-request-throttle-ms",
    500,
    "Least time between two lazy loading requests, ms.",
    { min: 0 },
  ),
  disableRowGrouping: flag(
    "data-ok-disable-row-grouping",
    "Columns can't be grouped by (no Group by in the column menu).",
  ),
  rowGroupingColumnMode: style(
    "data-ok-row-grouping-column-mode",
    ["single", "multiple"] as const,
    "single",
    "Grouped rows show in one grouping column (`single`), or in one column per grouped field (`multiple`).",
  ),
  disableAggregation: flag(
    "data-ok-disable-aggregation",
    "No aggregation (no Aggregation items in the column menu).",
  ),
  aggregationRowsScope: style(
    "data-ok-aggregation-rows-scope",
    ["filtered", "all"] as const,
    "filtered",
    "Rows aggregated: the `filtered` ones, or `all` of them.",
  ),
  disablePivoting: flag("data-ok-disable-pivoting", "No pivot button in the toolbar."),
  pivotActive: flag(
    "data-ok-pivot-active",
    "The grid shows the pivot of its rows (`pivotModel`) instead of the rows.",
  ),
  cellSelection: flag(
    "data-ok-cell-selection",
    "Cells are selected in ranges: press, drag, Shift + click or Shift + arrows.",
  ),
  disableClipboardPaste: flag(
    "data-ok-disable-clipboard-paste",
    "Ctrl / Cmd + V doesn't paste into editable cells (copying still works).",
  ),
  headerFilters: flag("data-ok-header-filters", "A row of filter fields under the column headers."),
  chartsIntegration: flag(
    "data-ok-charts-integration",
    "A chart of the grid's rows (or top-level groups) follows its filters, sorting and grouping.",
  ),
  multipleColumnsSortingMode: style(
    "data-ok-multiple-columns-sorting-mode",
    ["withModifierKey", "always"] as const,
    "withModifierKey",
    "Sorting a column keeps the others with Shift, Ctrl or Cmd (`withModifierKey`), or `always`.",
    { optional: true },
  ),
  disableAutosize: flag(
    "data-ok-disable-autosize",
    "A double click on a column's edge doesn't fit it to its content.",
  ),
  keepColumnPositionIfDraggedOutside: flag(
    "data-ok-keep-column-position-if-dragged-outside",
    "A column dropped outside the grid takes the place of the last header it passed.",
  ),
  pinnedColumnsSectionSeparator: style(
    "data-ok-pinned-columns-section-separator",
    ["border", "shadow", "border-and-shadow"] as const,
    "border",
    "The edge between pinned and scrolling columns: a line, a shadow or both.",
    { optional: true },
  ),
  pinnedRowsSectionSeparator: style(
    "data-ok-pinned-rows-section-separator",
    ["border", "border-and-shadow"] as const,
    "border",
    "The edge between pinned and scrolling rows: a line, or a line and a shadow.",
    { optional: true },
  ),
  pivotPanelOpen: flag("data-ok-pivot-panel-open", "The pivot panel is open."),
  virtualizeColumnsWithAutoRowHeight: flag(
    "data-ok-virtualize-columns-with-auto-row-height",
    'Columns virtualize with `"auto"` row heights too (rows may change height while scrolling sideways).',
  ),
  dataSourceKeepPreviousData: flag(
    "data-ok-data-source-keep-previous-data",
    "With a data source: the rows stay until the new ones arrive (flat rows; tree and grouped rows reset).",
  ),
  dataSourceRevalidateMs: number(
    "data-ok-data-source-revalidate-ms",
    0,
    "With a data source: how often (ms) rows whose cache entry expired load again (`0`: never).",
    { min: 0 },
  ),
  filterDebounceMs: number(
    "data-ok-filter-debounce-ms",
    0,
    "Wait (ms) after a keystroke in the quick filter or the filter panel before filtering.",
    { min: 0 },
  ),
  columnFilterDebounceMs: number(
    "data-ok-column-filter-debounce-ms",
    0,
    "Wait (ms) after a keystroke in a header filter before filtering.",
    { min: 0 },
  ),
  disableChildrenFiltering: flag(
    "data-ok-disable-children-filtering",
    "Tree data: filters apply to top-level rows only; a row's children show with it.",
  ),
  disableChildrenSorting: flag(
    "data-ok-disable-children-sorting",
    "Tree data: sorting orders top-level rows only.",
  ),
  cellSelectionFillHandle: flag(
    "data-ok-cell-selection-fill-handle",
    "With cell selection: a handle at the selection's corner repeats its cells where it is dragged (Ctrl / Cmd + D or R from the keyboard).",
  ),
  statusBar: flag(
    "data-ok-status-bar",
    "With cell selection: a bar under the rows counts the selected cells and sums their numbers.",
  ),
  historyStackSize: number(
    "data-ok-history-stack-size",
    30,
    "Edits and pastes that Ctrl / Cmd + Z can undo (`0` turns undo and redo off).",
    { min: 0 },
  ),
  hideFooterPagination: flag(
    "data-ok-hide-footer-pagination",
    "No pagination in the footer: every row shows, with the row count.",
  ),
  hideFooterRowCount: flag(
    "data-ok-hide-footer-row-count",
    "No row count in the footer (it shows only without pagination).",
  ),
  hideFooterSelectedRowCount: flag(
    "data-ok-hide-footer-selected-row-count",
    'No "n rows selected" in the footer.',
  ),
  tabNavigation: style(
    "data-ok-tab-navigation",
    ["none", "content", "header", "all"] as const,
    "none",
    "Tab moves between body cells (`content`), headers (`header`) or both (`all`); `none` leaves the grid.",
    { optional: true },
  ),
  columnHeaderHeight: number(
    "data-ok-column-header-height",
    undefined,
    "Column header height (px) before density. Default 56.",
    { min: 1 },
  ),
  columnGroupHeaderHeight: number(
    "data-ok-column-group-header-height",
    undefined,
    "Column group header height (px) before density (default: the column headers').",
    { min: 1 },
  ),
  headerFilterHeight: number(
    "data-ok-header-filter-height",
    undefined,
    "Header filter row height (px) before density (default: the column headers', else 56).",
    { min: 1 },
  ),
  showCellVerticalBorder: flag(
    "data-ok-show-cell-vertical-border",
    "Vertical lines between the cells.",
  ),
  showColumnVerticalBorder: flag(
    "data-ok-show-column-vertical-border",
    "Full-height vertical lines between the column headers.",
  ),
  rowSpacingType: style(
    "data-ok-row-spacing-type",
    ["margin", "border"] as const,
    "margin",
    "`getRowSpacing` space outside each row (`margin`) or inside it, under its background (`border`).",
    { optional: true },
  ),
  autoHeight: flag(
    "data-ok-auto-height",
    "The grid grows with its rows: no scroll area, so no virtualization.",
  ),
  autoPageSize: flag(
    "data-ok-auto-page-size",
    "The page size fits the grid's height (no rows per page choice). The grid needs a height.",
  ),
  rowSelection: behavior(
    "data-ok-row-selection",
    true,
    'Rows can be selected (`"false"`: no selection, no checkboxes, no `aria-selected`).',
  ),
  contextMenu: flag(
    "data-ok-context-menu",
    "A right click, Shift + F10 or the Menu key on a cell opens a menu: copy, paste, export, chart, pin.",
  ),
  filterGroups: flag(
    "data-ok-filter-groups",
    "The filter panel nests groups of filters, each with its own And / Or (Add group).",
  ),
  autoGenerate: flag(
    "data-ok-auto-generate",
    "Columns from the data when none are given: one per field, typed from the values (HTML: from `table[data-ok-data-grid-data]`).",
  ),
  columnsToolPanel: flag(
    "data-ok-columns-tool-panel",
    "The Columns panel becomes a tool panel: search, Show all / Hide all, Reset, pin and move each column, row groups and values.",
  ),
});

export interface DataGridAnatomyOptions {
  contextMenu?: boolean | undefined;
  filterGroups?: boolean | undefined;
  autoGenerate?: boolean | undefined;
  columnsToolPanel?: boolean | undefined;
  columnHeaderHeight?: number | undefined;
  columnGroupHeaderHeight?: number | undefined;
  headerFilterHeight?: number | undefined;
  showCellVerticalBorder?: boolean | undefined;
  showColumnVerticalBorder?: boolean | undefined;
  rowSpacingType?: "margin" | "border" | undefined;
  autoHeight?: boolean | undefined;
  autoPageSize?: boolean | undefined;
  rowSelection?: boolean | undefined;
  hideFooterPagination?: boolean | undefined;
  hideFooterRowCount?: boolean | undefined;
  hideFooterSelectedRowCount?: boolean | undefined;
  tabNavigation?: "none" | "content" | "header" | "all" | undefined;
  historyStackSize?: number | undefined;
  multipleColumnsSortingMode?: "withModifierKey" | "always" | undefined;
  statusBar?: boolean | undefined;
  disableRowGrouping?: boolean | undefined;
  rowGroupingColumnMode?: "single" | "multiple" | undefined;
  disableAggregation?: boolean | undefined;
  aggregationRowsScope?: "filtered" | "all" | undefined;
  disablePivoting?: boolean | undefined;
  pivotActive?: boolean | undefined;
  cellSelection?: boolean | undefined;
  disableClipboardPaste?: boolean | undefined;
  headerFilters?: boolean | undefined;
  chartsIntegration?: boolean | undefined;
  treeData?: boolean | undefined;
  defaultGroupingExpansionDepth?: number | undefined;
  rowReordering?: boolean | undefined;
  listView?: boolean | undefined;
  rowBufferPx?: number | undefined;
  columnBufferPx?: number | undefined;
  lazyLoading?: boolean | undefined;
  lazyLoadingRequestThrottleMs?: number | undefined;
  disableMultipleRowSelection?: boolean | undefined;
  keepNonExistentRowsSelected?: boolean | undefined;
  checkboxSelectionVisibleOnly?: boolean | undefined;
  autosizeOnMount?: boolean | undefined;
  rowSpanning?: boolean | undefined;
  rowHeight?: number | undefined;
  toolbarVariant?: "labeled" | "icon" | undefined;
  quickFilterLogicOperator?: "and" | "or" | undefined;
  quickFilterExcludeHiddenColumns?: boolean | undefined;
  ignoreDiacritics?: boolean | undefined;
  density?: GridDensity | undefined;
  checkboxSelection?: boolean | undefined;
  disableRowSelectionOnClick?: boolean | undefined;
  disableColumnMenu?: boolean | undefined;
  disableMultipleColumnsSorting?: boolean | undefined;
  disableMultipleColumnsFiltering?: boolean | undefined;
  disableColumnResize?: boolean | undefined;
  disableColumnReorder?: boolean | undefined;
  disableColumnPinning?: boolean | undefined;
  editMode?: "cell" | "row" | undefined;
  disableVirtualization?: boolean | undefined;
  sortingMode?: "client" | "server" | undefined;
  filterMode?: "client" | "server" | undefined;
  paginationMode?: "client" | "server" | undefined;
  rowCount?: number | undefined;
  estimatedRowCount?: number | undefined;
  cellSelectionFillHandle?: boolean | undefined;
  disableAutosize?: boolean | undefined;
  keepColumnPositionIfDraggedOutside?: boolean | undefined;
  pinnedColumnsSectionSeparator?: "border" | "shadow" | "border-and-shadow" | undefined;
  pinnedRowsSectionSeparator?: "border" | "border-and-shadow" | undefined;
  pivotPanelOpen?: boolean | undefined;
  virtualizeColumnsWithAutoRowHeight?: boolean | undefined;
  dataSourceKeepPreviousData?: boolean | undefined;
  dataSourceRevalidateMs?: number | undefined;
  filterDebounceMs?: number | undefined;
  columnFilterDebounceMs?: number | undefined;
  disableChildrenFiltering?: boolean | undefined;
  disableChildrenSorting?: boolean | undefined;
  loading?: boolean | undefined;
  loadingVariant?: "linear-progress" | "circular-progress" | "skeleton" | undefined;
  scrollEndThreshold?: number | undefined;
}

/** `data-ok-*` attributes of a data grid root. */
export const dataGridAttributes = (options: DataGridAnatomyOptions = {}): DataAttributes =>
  optionAttributes(dataGridOptions, { ...options });
