import {
  arrangeGridColumns,
  clampGridWidth,
  createGridColumnControls,
  createGridDataSourceCache,
  createGridNavigation,
  createGridScrollWatcher,
  dataGridOptions,
  filterGridRows,
  GRID_CHECKBOX_FIELD,
  type GridColumn,
  type GridColumnType,
  type GridColumnVisibilityModel,
  type GridColumnWidths,
  type GridCsvOptions,
  type GridDataSource,
  type GridDensity,
  type GridEditStartReason,
  type GridFilterModel,
  type GridFilterOperator,
  type GridFormat,
  type GridLabels,
  type GridPinnedColumns,
  type GridPrintLayout,
  type GridRowWindow,
  type GridSortModel,
  type GridState,
  type GridViewport,
  gridAriaSort,
  gridColumnTemplate,
  gridColumnTypes,
  gridDefaultLabels,
  gridDensities,
  gridDensityFactor,
  gridEditInputType,
  gridEditText,
  gridExportColumns,
  gridFilterOperators,
  gridFormats,
  gridFormatValue,
  gridOperatorNeedsValue,
  gridPinSide,
  gridQuickFilterValues,
  gridRowOffsets,
  gridRowSpans,
  gridRowWindow,
  gridRowWindowOf,
  gridSelectAllState,
  gridToCsv,
  isGridResizable,
  isGridSortable,
  measureGridColumn,
  moveGridColumn,
  nextGridSort,
  orderGridColumns,
  parseGridEditValue,
  parseGridFormatOptions,
  pick,
  pinGridColumn,
  prepareGridPrint,
  printGridContent,
  pruneGridSelection,
  readNumber,
  readStyle,
  sanitizeGridState,
  selectGridRow,
  sortGridRows,
  syncGridPinning,
  toggleGridRows,
  visibleGridColumns,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import { syncCustomProperties } from "../../runtime/style.js";
import type { ComponentInstance } from "../../runtime/types.js";
import type { PopoverInstance } from "../popover/popover.js";
import type { TablePaginationInstance } from "../table-pagination/table-pagination.js";

export interface DataGridInstance extends ComponentInstance {
  readonly sortModel: GridSortModel;
  readonly filterModel: GridFilterModel;
  /** Selected row ids. */
  readonly selection: string[];
  readonly columnVisibilityModel: GridColumnVisibilityModel;
  readonly columnOrder: string[];
  readonly pinnedColumns: GridPinnedColumns;
  readonly columnWidths: GridColumnWidths;
  /** These setters don't emit events. */
  setColumnOrder(fields: readonly string[]): void;
  setPinnedColumns(model: GridPinnedColumns): void;
  setColumnWidth(field: string, width: number): void;
  setSortModel(model: GridSortModel): void;
  setFilterModel(model: GridFilterModel): void;
  setSelection(ids: readonly string[]): void;
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
  exportState(): GridState;
  /** Applies a saved state (unknown keys and values are dropped). */
  restoreState(state: unknown): void;
  /** Operators of a column's filter (they replace the type's operators). */
  setFilterOperators(field: string, operators: readonly GridFilterOperator<HTMLElement>[]): void;
  /** The text of a column's values in `setRows` and after editing (`null`: back to the default). */
  setValueFormatter(field: string, format: ((value: unknown) => string) | null): void;
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
  quickFilterLogicOperator,
  quickFilterExcludeHiddenColumns,
  ignoreDiacritics,
} = dataGridOptions.options;

type DataRow = Record<string, unknown>;

export interface GridPrintOptions extends GridPrintLayout {
  /** Fields to print (default: the shown columns). */
  fields?: readonly string[] | undefined;
  /** Hidden columns too. */
  allColumns?: boolean | undefined;
  /** The document title (default: the grid's label). */
  fileName?: string | undefined;
}
const ROW = '[role="row"][data-ok-row-id]';
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
function download(name: string, csv: string) {
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${name}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

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
export const dataGrid = defineComponent<DataGridInstance>({
  name: "data-grid",
  selector: "[data-ok-data-grid]",

  setup(element, { emit, signal, runtime }) {
    const main = element.querySelector<HTMLElement>('[role="grid"]') as HTMLElement;
    const body = main.querySelector<HTMLElement>("[data-ok-data-grid-body]") as HTMLElement;
    const headerRow = main.querySelector<HTMLElement>(
      '[data-ok-data-grid-header] [role="row"]',
    ) as HTMLElement;
    const id = element.id;
    const byId = (suffix: string) => (id ? document.getElementById(`${id}-${suffix}`) : null);
    const checkbox = element.hasAttribute("data-ok-checkbox-selection");
    const headers = () =>
      [...headerRow.querySelectorAll<HTMLElement>('[role="columnheader"]')].filter(
        (header) => header.getAttribute("data-ok-field") !== GRID_CHECKBOX_FIELD,
      );
    const columns: GridColumn[] = headers().map((header) => ({
      field: header.getAttribute("data-ok-field") as string,
      headerName: header.querySelector("[data-ok-data-grid-header-title]")?.textContent ?? "",
      type: pick(gridColumnTypes, header.getAttribute("data-ok-type"), "string") as GridColumnType,
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
    }));
    // Text the runtime writes (setLocaleText), custom operators and value formatters.
    let labels: GridLabels = gridDefaultLabels;
    const operators: Record<string, readonly GridFilterOperator<HTMLElement>[]> = {};
    const formatters = new Map<string, (value: unknown) => string>();
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
    // Every row lives here; only the rows to show are in the page (pages, filters, the window).
    let rowEls = [...body.querySelectorAll<HTMLElement>(ROW)];
    const rows = () => rowEls;
    const cellOf = (row: HTMLElement, field: string) =>
      row.querySelector<HTMLElement>(`[role="gridcell"][data-ok-field="${CSS.escape(field)}"]`);
    const text = (row: HTMLElement, field: string) => {
      const cell = cellOf(row, field);
      return cell ? (cell.getAttribute("data-ok-text") ?? (cell.textContent as string).trim()) : "";
    };
    const value = (row: HTMLElement, field: string) => {
      const cell = cellOf(row, field);
      return cell?.hasAttribute("data-ok-value")
        ? cell.getAttribute("data-ok-value")
        : text(row, field);
    };
    const idOf = (row: HTMLElement) => row.getAttribute("data-ok-row-id") as string;
    const multiple = () => !element.hasAttribute(disableMultipleRowSelection.attr);
    const selectable = (row: HTMLElement) => row.getAttribute("data-ok-selectable") !== "false";
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
    const overlay = element.querySelector<HTMLElement>(
      "[data-ok-data-grid-overlay]",
    ) as HTMLElement;

    const navigation = createGridNavigation(main, {
      onSort: (field, multi) => sortBy(field, multi),
      onColumnMenu: (field, header) =>
        openColumnMenu(field, header.querySelector("[data-ok-data-grid-menu-button]")),
      onToggleRow: (row) => toggle(row),
      onSelectAll: () => {
        if (checkbox && multiple()) select(toggleGridRows(selection, allRows().map(idOf)));
      },
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
    const styleRows = () => {
      for (const row of rows()) {
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
    const layout = () => {
      const arranged = arrangeGridColumns(orderGridColumns(columns, order), pinned);
      const shown = visibleGridColumns(arranged, visibility);
      written = syncCustomProperties(
        main,
        { "--_ok-data-grid-columns": gridColumnTemplate(shown, checkbox, widths) },
        written,
      );
      main.setAttribute("aria-colcount", String(shown.length + (checkbox ? 1 : 0)));
      const offset = checkbox ? 2 : 1;
      const leftPinned = shown.some((c) => gridPinSide(pinned, c.field) === "left");
      for (const row of [headerRow, ...rows()]) {
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
          const side =
            field === GRID_CHECKBOX_FIELD
              ? leftPinned
                ? "left"
                : undefined
              : gridPinSide(pinned, field);
          if (side) cell.setAttribute("data-ok-pinned", side);
          else cell.removeAttribute("data-ok-pinned");
          if (field === GRID_CHECKBOX_FIELD) continue;
          const index = shown.findIndex((c) => c.field === field);
          // Cells covered by a column span stay hidden.
          cell.hidden = index < 0 || (cell.hasAttribute("data-ok-covered") && cell.hidden);
          if (index >= 0) cell.setAttribute("aria-colindex", String(index + offset));
        }
      }
      for (const input of byId("columns")?.querySelectorAll<HTMLInputElement>(
        "input[data-ok-field]",
      ) ?? [])
        input.checked = visibility[input.getAttribute("data-ok-field") as string] !== false;
      syncGridPinning(main);
    };

    /** Rows: filter, sort, page (client modes), then draw the window; selection marks, overlays. */
    let pageList: HTMLElement[] = [];
    let sortedList: HTMLElement[] = [];
    let total = 0;
    let viewport: GridViewport | null = null;
    let spacers: string[] = [];
    let source: GridDataSource<DataRow> | null = null;
    let sourceCount: number | undefined;
    const serverSide = (spec: typeof sortingMode) =>
      source !== null || readStyle(element, spec) === "server";
    const apply = () => {
      const all = rows();
      filtered = serverSide(filterMode)
        ? all
        : filterGridRows(all, filterModel, columns, value, text, filterOptions());
      const sorted = serverSide(sortingMode)
        ? filtered
        : sortGridRows(filtered, sortModel, columns, value);
      const serverPage = serverSide(paginationMode);
      total = serverPage
        ? (sourceCount ??
          (readNumber(element, rowCountOption) as number | undefined) ??
          sorted.length)
        : sorted.length;
      pagination?.setAttribute("data-ok-count", String(total));
      const paged = Number.isFinite(pageSize) && !serverPage;
      // Server pages count too: the page stays within the server's rows.
      const pages = Number.isFinite(pageSize) ? Math.max(Math.ceil(total / pageSize), 1) : 1;
      page = Math.min(page, pages - 1);
      pager()?.refresh();
      const pageStart = paged ? page * pageSize : 0;
      pageList = paged ? sorted.slice(pageStart, pageStart + pageSize) : sorted;
      sortedList = sorted;
      // Rows of a server page sit after the rows of the pages before it.
      const rowOffset = serverPage && Number.isFinite(pageSize) ? page * pageSize : 0;
      sorted.forEach((row, index) => {
        row.setAttribute("aria-rowindex", String(index + 2 + rowOffset));
      });
      main.setAttribute("aria-rowcount", String(total + 1));
      for (const header of headers()) {
        const column = columns.find(
          (c) => c.field === header.getAttribute("data-ok-field"),
        ) as GridColumn;
        if (isGridSortable(column) && header.hasAttribute("aria-sort"))
          header.setAttribute("aria-sort", gridAriaSort(sortModel, column) as string);
      }
      mark();
      draw();
      syncOverlays(all.length);
      navigation.sync();
    };
    /** Puts the rows of the window (or the whole page) in the body, moving as few as possible. */
    const measured = new WeakMap<HTMLElement, number>();
    const spacingOf = (row: HTMLElement, side: "top" | "bottom") =>
      Number(row.getAttribute(`data-ok-spacing-${side}`)) || 0;
    /** Rows with their own height or spacing (offsets per row). */
    const variable = () =>
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
    let drawing = false;
    const draw = () => {
      const vp = viewport as GridViewport;
      const virtual =
        !element.hasAttribute(disableVirtualization.attr) && !!vp?.scrolls && vp.rowHeight > 0;
      offsets = virtual && variable() ? gridRowOffsets(heights()) : null;
      let range: GridRowWindow = virtual
        ? offsets
          ? gridRowWindowOf(offsets, vp.offset, vp.viewport)
          : gridRowWindow(pageList.length, vp.rowHeight, vp.offset, vp.viewport)
        : { start: 0, end: pageList.length, before: 0, after: 0 };
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
      const keep = new Set(shownRows);
      for (const row of [...body.children]) if (!keep.has(row as HTMLElement)) row.remove();
      shownRows.forEach((row, index) => {
        row.hidden = false;
        if (body.children[index] !== row) body.insertBefore(row, body.children[index] ?? null);
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
        virtual
          ? {
              "--_ok-data-grid-before": `${range.before}px`,
              "--_ok-data-grid-after": `${range.after}px`,
            }
          : {},
        spacers,
      );
      syncGridPinning(main);
      // Rows of their own height: measure them; new heights move the window (once).
      if (offsets && !drawing) {
        let changed = false;
        for (const row of shownRows)
          if (row.offsetHeight && measured.get(row) !== row.offsetHeight) {
            measured.set(row, row.offsetHeight);
            changed = true;
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
      rowEls = data.map((item) => {
        const row = (
          (rowTemplate as HTMLTemplateElement).content.firstElementChild as HTMLElement
        ).cloneNode(true) as HTMLElement;
        row.setAttribute("data-ok-row-id", String(item["id"]));
        for (const cell of row.querySelectorAll<HTMLElement>('[role="gridcell"][data-ok-field]')) {
          const field = cell.getAttribute("data-ok-field") as string;
          if (field === GRID_CHECKBOX_FIELD) continue;
          const raw = item[field];
          const shownText = formatted(field, raw);
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
      });
      if (!element.hasAttribute(keepNonExistentRowsSelected.attr))
        selection = pruneGridSelection(selection, rowEls.map(idOf));
      styleRows();
      layout();
      apply();
      scrollWatcher.measure();
    };
    const sourceCache = createGridDataSourceCache<DataRow>();
    let request = 0;
    const load = () => {
      const current = source as GridDataSource<DataRow>;
      const params = {
        sortModel,
        filterModel,
        paginationModel: { page, pageSize: Number.isFinite(pageSize) ? pageSize : 0 },
      };
      const cached = sourceCache.get(params);
      const show = (response: { rows: DataRow[]; rowCount?: number | undefined }) => {
        sourceCount = response.rowCount;
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
      if (source) load();
      else apply();
    };

    /** Selection marks: rows, their checkboxes and "select all". */
    const mark = () => {
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

    const change = <T>(event: string, model: T, commit: (model: T) => void) => {
      if (!emit(event, { model }, { cancelable: true })) return false;
      commit(model);
      return true;
    };
    const sortBy = (field: string, multi: boolean) => {
      const column = columns.find((c) => c.field === field);
      if (!column || !isGridSortable(column)) return;
      const next = nextGridSort(
        sortModel,
        field,
        multi && !element.hasAttribute(disableMultipleColumnsSorting.attr),
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
      return { logic, field, operator, input: row.querySelector("input") as HTMLInputElement };
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
          const { field, operator, input } = partsOf(row);
          input.disabled = !gridOperatorNeedsValue(operator.value, operators[field.value]);
          return { field: field.value, operator: operator.value, value: input.value };
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
      const { field, operator, input } = partsOf(row);
      field.selectedIndex = 0;
      fillOperators(operator, field.value);
      input.value = "";
      input.disabled = false;
    };
    const addFilterRow = () => {
      const rowsNow = filterRows();
      const first = rowsNow[0] as HTMLElement;
      const row = first.cloneNode(true) as HTMLElement;
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
    const toCsv = (options: GridCsvOptions = {}) =>
      gridToCsv(
        gridExportColumns(columns, shownColumns(), options),
        sortGridRows(
          filterGridRows(rows(), filterModel, columns, value, text, filterOptions()),
          sortModel,
          columns,
          value,
        ),
        text,
        options,
      );
    const exportCsv = (options: GridCsvOptions = {}) =>
      download(
        options.fileName ?? element.getAttribute("data-ok-export-file-name") ?? "data",
        toCsv(options),
      );
    const print = (options: GridPrintOptions = {}) => {
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
        if (item.getAttribute("data-ok-data-grid-export") === "print") print();
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
      onMove: (field, target) => setOrder(moveGridColumn(arrangedFields(), field, { to: target })),
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

    // Editing: inputs replace the cell content; Enter commits, Escape cancels.
    interface Edit {
      cell: HTMLElement;
      column: GridColumn;
      input: HTMLInputElement | HTMLSelectElement;
      content: Node[];
    }
    let edits: Edit[] = [];
    let editRow: HTMLElement | null = null;
    const errors = new Map<string, string | true>();
    const cellEditable = (row: HTMLElement, column: GridColumn) =>
      !!column.editable && cellOf(row, column.field)?.getAttribute("data-ok-editable") !== "false";
    const startEdit = (
      row: HTMLElement,
      field: string,
      reason: GridEditStartReason = "cellDoubleClick",
      key?: string,
    ) => {
      const column = columns.find((c) => c.field === field);
      if (edits.length || !column || !cellEditable(row, column)) return;
      const rowMode = element.getAttribute(editMode.attr) === "row";
      const targets = rowMode
        ? visibleGridColumns(columns, visibility).filter((c) => cellEditable(row, c))
        : [column];
      errors.clear();
      editRow = row;
      if (rowMode) row.setAttribute("data-ok-editing", "");
      edits = targets.map((c) => {
        const cell = cellOf(row, c.field) as HTMLElement;
        const name = c.headerName as string;
        const start = gridEditText(value(row, c.field), c.type);
        let input: HTMLInputElement | HTMLSelectElement;
        if (c.type === "singleSelect") {
          input = document.createElement("select");
          for (const choice of c.valueOptions ?? []) {
            const option = document.createElement("option");
            option.value = choice;
            option.textContent = choice;
            input.append(option);
          }
          input.value = start;
        } else {
          input = document.createElement("input");
          input.type = gridEditInputType(c.type);
          if (c.type === "boolean") input.checked = start === "true";
          else input.value = start;
        }
        // A typed character replaces the value (text-like fields only).
        if (key !== undefined && c.field === field && input instanceof HTMLInputElement)
          if (input.type !== "checkbox") input.value = key;
        input.setAttribute("data-ok-data-grid-edit-input", "");
        input.setAttribute("aria-label", `${labels.editLabel} ${name}`);
        const content = [...cell.childNodes];
        cell.replaceChildren(input);
        cell.setAttribute("data-ok-editing", "");
        return { cell, column: c, input, content };
      });
      // The started cell is always among the edits (shown and editable).
      const first = edits.find((e) => e.column.field === field) as Edit;
      first.input.focus();
      if (
        key !== undefined &&
        first.input instanceof HTMLInputElement &&
        first.input.type === "text"
      )
        first.input.setSelectionRange(first.input.value.length, first.input.value.length);
      emit("editstart", rowMode ? { id: idOf(row), reason } : { id: idOf(row), field, reason });
    };
    const editText = (input: HTMLInputElement | HTMLSelectElement) =>
      input instanceof HTMLInputElement && input.type === "checkbox"
        ? String(input.checked)
        : input.value;
    /** `ok:data-grid:validate`: a listener sets `detail.error` (true or a message). */
    const validate = (edit: Edit) => {
      const detail: { id: string; field: string; value: unknown; error?: string | boolean } = {
        id: idOf(editRow as HTMLElement),
        field: edit.column.field,
        value: parseGridEditValue(editText(edit.input), edit.column.type),
      };
      emit("validate", detail);
      const message = edit.cell.querySelector<HTMLElement>("[data-ok-data-grid-edit-error]");
      if (detail.error) {
        errors.set(edit.column.field, detail.error === true ? true : String(detail.error));
        edit.input.setAttribute("aria-invalid", "true");
      } else {
        errors.delete(edit.column.field);
        edit.input.removeAttribute("aria-invalid");
      }
      const text = typeof detail.error === "string" ? detail.error : "";
      if (!text) {
        message?.remove();
        edit.input.removeAttribute("aria-describedby");
        return;
      }
      const errorId = `${id || "grid"}-${idOf(editRow as HTMLElement)}-${edit.column.field}-error`;
      const span = message ?? document.createElement("span");
      span.setAttribute("data-ok-data-grid-edit-error", "");
      span.setAttribute("role", "alert");
      span.id = errorId;
      span.textContent = text;
      if (!message) edit.cell.append(span);
      edit.input.setAttribute("aria-describedby", errorId);
    };
    const stopEdit = (
      commit: boolean,
      focusField?: string,
      reason: "enterKeyDown" | "escapeKeyDown" | "cellFocusOut" = "cellFocusOut",
    ) => {
      // A value with an error keeps the cell open (Escape still cancels).
      if (commit && errors.size > 0) return;
      const done = edits;
      const row = editRow as HTMLElement;
      errors.clear();
      edits = [];
      editRow = null;
      row.removeAttribute("data-ok-editing");
      const values = Object.fromEntries(
        done.map(({ column, input }) => [
          column.field,
          parseGridEditValue(editText(input), column.type),
        ]),
      );
      const rowMode = element.getAttribute(editMode.attr) === "row";
      emit(
        "editstop",
        rowMode
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
      // Re-sorting moves rows, which drops the focus: apply first, then focus the cell.
      if (accepted) apply();
      (cellOf(row, focusField ?? (done[0] as Edit).column.field) as HTMLElement).focus();
    };
    main.addEventListener(
      "dblclick",
      (event) => {
        const cell = (event.target as Element).closest<HTMLElement>('[role="gridcell"]');
        const row = cell?.closest<HTMLElement>(ROW);
        if (!cell || !row) return;
        const field = cell.getAttribute("data-ok-field") as string;
        emit("rowdoubleclick", { id: idOf(row) });
        emit("celldoubleclick", { id: idOf(row), field, value: value(row, field) });
        startEdit(row, field, "cellDoubleClick");
      },
      { signal },
    );
    main.addEventListener(
      "input",
      (event) => {
        const edit = edits.find((e) => e.input === event.target);
        if (edit) validate(edit);
      },
      { signal },
    );
    main.addEventListener(
      "keydown",
      (event) => {
        const input = (event.target as Element).closest("[data-ok-data-grid-edit-input]");
        if (!input || (event.key !== "Enter" && event.key !== "Escape")) return;
        event.preventDefault();
        stopEdit(
          event.key === "Enter",
          (input.closest("[data-ok-field]") as Element).getAttribute("data-ok-field") as string,
          event.key === "Enter" ? "enterKeyDown" : "escapeKeyDown",
        );
      },
      { signal },
    );
    main.addEventListener(
      "focusout",
      (event) => {
        if (!edits.length || !(event.target as Element).closest("[data-ok-data-grid-edit-input]"))
          return;
        const next = event.relatedTarget as Node | null;
        const scope = element.getAttribute(editMode.attr) === "row" ? editRow : null;
        if (!scope?.contains(next)) stopEdit(true);
      },
      { signal },
    );

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
      disable("filter", column.filterable === false || column.type === "actions");
      disable("hide", column.hideable === false);
      const fieldsNow = arrangedFields();
      disable("left", fieldsNow.indexOf(field) <= 0);
      disable("right", fieldsNow.indexOf(field) >= fieldsNow.length - 1);
      disable("pin-left", gridPinSide(pinned, field) === "left");
      disable("pin-right", gridPinSide(pinned, field) === "right");
      disable("unpin", !gridPinSide(pinned, field));
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
        else if (action === "left" || action === "right")
          setOrder(moveGridColumn(arrangedFields(), field, action === "left" ? -1 : 1));
        else if (action === "pin-left" || action === "pin-right" || action === "unpin")
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
    const options = new MutationObserver(reflect);
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
      ],
    });

    for (const row of filterRows()) fillOperators(partsOf(row).operator, partsOf(row).field.value);
    styleRows();
    layout();
    apply();
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
        layout();
        refresh();
      },
      setFilterOperators(field, list) {
        operators[field] = list;
        for (const row of filterRows())
          if (partsOf(row).field.value === field) fillOperators(partsOf(row).operator, field);
        apply();
      },
      setValueFormatter(field, format) {
        if (format) formatters.set(field, format);
        else formatters.delete(field);
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
      },
      setRows(data) {
        buildRows(data);
      },
      setDataSource(next) {
        source = next;
        sourceCount = undefined;
        sourceCache.clear();
        if (next) load();
        else apply();
      },
      destroy() {
        options.disconnect();
        scrollWatcher.destroy();
        columnControls.destroy();
        navigation.destroy();
        syncCustomProperties(main, {}, written);
        syncCustomProperties(element, {}, rootVars);
      },
    };
  },
});
