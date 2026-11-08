"use client";

import {
  createGridNavigation,
  dataGridAttributes,
  filterGridRows,
  GRID_CHECKBOX_FIELD,
  type GridColumn,
  type GridColumnVisibilityModel,
  type GridDensity,
  type GridFilterItem,
  type GridFilterModel,
  type GridLabels,
  type GridNavigation,
  type GridSortModel,
  gridAlign,
  gridAriaSort,
  gridColumnTemplate,
  gridDefaultLabels,
  gridDensities,
  gridFilterOperators,
  gridHeaderAlign,
  gridOperatorNeedsValue,
  gridQuickFilterValues,
  gridSelectAllState,
  gridToCsv,
  isGridFilterable,
  isGridHideable,
  isGridSortable,
  nextGridSort,
  sortGridRows,
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
  useRef,
  useState,
} from "react";
import { Button } from "../button/button.js";
import { Checkbox } from "../checkbox/checkbox.js";
import { FormControlLabel } from "../form-control-label/form-control-label.js";
import { IconButton } from "../icon-button/icon-button.js";
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
  columns?: { columnVisibilityModel?: GridColumnVisibilityModel } | undefined;
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
  const [panel, setPanel] = useState<Panel>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [menuField, setMenuField] = useState<string | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);

  const shown = visibleGridColumns(columns, visibility);
  const filtered = filterGridRows(
    rows,
    filterModel,
    columns,
    (row, field) => {
      const column = columns.find((c) => c.field === field) as GridColDef<R>;
      return rawValue(column, row);
    },
    (row, field) => textOf(columns.find((c) => c.field === field) as GridColDef<R>, row),
  );
  const sorted = sortGridRows(filtered, sortModel, columns, (row, field) =>
    rawValue(columns.find((c) => c.field === field) as GridColDef<R>, row),
  );
  const pageCount = Math.max(Math.ceil(sorted.length / pagination.pageSize), 1);
  const page = Math.min(pagination.page, pageCount - 1);
  // Every filtered row is rendered; rows of other pages are `hidden` (as the HTML runtime does).
  const onPage = (index: number) =>
    hideFooter || (index >= page * pagination.pageSize && index < (page + 1) * pagination.pageSize);
  const pageRows = sorted.filter((_, index) => onPage(index));
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
    });
    navigation.current = handle;
    return () => handle.destroy();
  }, []);
  useEffect(() => navigation.current?.sync());

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
  const filterItem: GridFilterItem = filterModel.items[0] ?? {
    field: columns.find(isGridFilterable)?.field ?? "",
    operator: gridFilterOperators(columns.find(isGridFilterable)?.type)[0] as string,
  };
  const setFilterItem = (item: GridFilterItem) => {
    setFilterModel({ ...filterModel, items: [item] });
    setPagination({ ...pagination, page: 0 });
  };
  const filterColumn = columns.find((c) => c.field === filterItem.field);

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
    else if (action === "filter") {
      setFilterItem({
        field,
        operator: gridFilterOperators(menuColumn?.type)[0] as string,
      });
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
            <div data-ok-data-grid-filter="">
              <TextField
                id={`${id}-filter-field`}
                select
                size="small"
                label={labels.filterPanelColumns}
                value={filterItem.field}
                onChange={(field) =>
                  setFilterItem({
                    field,
                    operator: gridFilterOperators(
                      columns.find((c) => c.field === field)?.type,
                    )[0] as string,
                  })
                }
              >
                {columns.filter(isGridFilterable).map((column) => (
                  <option key={column.field} value={column.field}>
                    {column.headerName ?? column.field}
                  </option>
                ))}
              </TextField>
              <TextField
                id={`${id}-filter-operator`}
                select
                size="small"
                label={labels.filterPanelOperator}
                value={filterItem.operator}
                onChange={(operator) => setFilterItem({ ...filterItem, operator })}
              >
                {gridFilterOperators(filterColumn?.type).map((operator) => (
                  <option key={operator} value={operator}>
                    {labels.filterOperator[operator] ?? operator}
                  </option>
                ))}
              </TextField>
              <TextField
                id={`${id}-filter-value`}
                size="small"
                label={labels.filterPanelInputLabel}
                placeholder={labels.filterPanelInputPlaceholder}
                disabled={!gridOperatorNeedsValue(filterItem.operator)}
                value={filterItem.value ?? ""}
                onChange={(value) => setFilterItem({ ...filterItem, value })}
              />
            </div>
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
        aria-rowcount={sorted.length + 1}
        aria-colcount={shown.length + (checkboxSelection ? 1 : 0)}
        {...(checkboxSelection ? { "aria-multiselectable": true } : {})}
        style={
          {
            "--_ok-data-grid-columns": gridColumnTemplate(shown, !!checkboxSelection),
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
                  {...(sortable ? { "aria-sort": gridAriaSort(sortModel, column) } : {})}
                  tabIndex={-1}
                  onClick={(event) => {
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
                </div>
              );
            })}
          </div>
        </div>
        <div role="rowgroup" data-ok-data-grid-body="">
          {sorted.map((row, index) => {
            const rowId = String(getRowId(row));
            const selected = selection.includes(rowId);
            return (
              <div
                key={rowId}
                role="row"
                aria-rowindex={index + 2}
                hidden={!onPage(index) || undefined}
                data-ok-row-id={rowId}
                {...(checkboxSelection ? { "aria-selected": selected } : {})}
                onClick={onRowClick(rowId)}
              >
                {checkboxSelection && (
                  <div
                    role="gridcell"
                    aria-colindex={1}
                    data-ok-field={GRID_CHECKBOX_FIELD}
                    data-ok-data-grid-checkbox=""
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
                      tabIndex={-1}
                    >
                      {column.renderCell ? custom : text}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <div data-ok-data-grid-overlay="" role="status" hidden={pageRows.length > 0 || undefined}>
        {pageRows.length > 0
          ? null
          : rows.length === 0
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
            count={sorted.length}
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
