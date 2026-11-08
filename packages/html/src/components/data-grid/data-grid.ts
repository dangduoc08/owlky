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
  type GridDataSource,
  type GridDensity,
  type GridFilterModel,
  type GridPinnedColumns,
  type GridSortModel,
  type GridViewport,
  gridAriaSort,
  gridColumnTemplate,
  gridColumnTypes,
  gridDefaultLabels,
  gridDensities,
  gridEditInputType,
  gridEditText,
  gridFilterOperators,
  gridOperatorNeedsValue,
  gridPinSide,
  gridQuickFilterValues,
  gridRowWindow,
  gridSelectAllState,
  gridToCsv,
  isGridResizable,
  isGridSortable,
  moveGridColumn,
  nextGridSort,
  orderGridColumns,
  parseGridEditValue,
  pick,
  pinGridColumn,
  printGridContent,
  readNumber,
  readStyle,
  sortGridRows,
  syncGridPinning,
  toggleGridRow,
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
  /** The CSV of the filtered, sorted rows and shown columns. */
  toCsv(): string;
  /** Downloads the CSV (`data-ok-export-file-name`, default "data"). */
  exportCsv(): void;
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
} = dataGridOptions.options;

type DataRow = Record<string, unknown>;
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
      sortable: header.hasAttribute("aria-sort"),
      hideable: header.getAttribute("data-ok-hideable") !== "false",
      filterable: header.getAttribute("data-ok-filterable") !== "false",
      resizable: header.getAttribute("data-ok-resizable") !== "false",
      editable: header.hasAttribute("data-ok-editable"),
      valueOptions: stringList(header.getAttribute("data-ok-value-options")),
    }));
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
      onToggleRow: (row) => select(toggleGridRow(selection, idOf(row))),
      onSelectAll: () => {
        if (checkbox) select(toggleGridRows(selection, filtered.map(idOf)));
      },
      onEdit: (cell) =>
        startEdit(
          cell.closest<HTMLElement>(ROW) as HTMLElement,
          cell.getAttribute("data-ok-field") as string,
        ),
      onResizeKey: (field, delta) =>
        resize(field, (headerOf(field) as HTMLElement).getBoundingClientRect().width + delta, true),
    });
    const headerOf = (field: string) =>
      headerRow.querySelector<HTMLElement>(
        `[role="columnheader"][data-ok-field="${CSS.escape(field)}"]`,
      );

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
          if (cell) row.append(cell);
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
          cell.hidden = index < 0;
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
        : filterGridRows(all, filterModel, columns, value, text);
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
    const draw = () => {
      const vp = viewport as GridViewport;
      const virtual =
        !element.hasAttribute(disableVirtualization.attr) && !!vp?.scrolls && vp.rowHeight > 0;
      const range = virtual
        ? gridRowWindow(pageList.length, vp.rowHeight, vp.offset, vp.viewport)
        : { start: 0, end: pageList.length, before: 0, after: 0 };
      const shownRows = pageList.slice(range.start, range.end);
      const keep = new Set(shownRows);
      for (const row of [...body.children]) if (!keep.has(row as HTMLElement)) row.remove();
      shownRows.forEach((row, index) => {
        row.hidden = false;
        if (body.children[index] !== row) body.insertBefore(row, body.children[index] ?? null);
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
            ? (element.getAttribute("data-ok-label-no-rows") ?? gridDefaultLabels.noRowsLabel)
            : (element.getAttribute("data-ok-label-no-results") ??
              gridDefaultLabels.noResultsOverlayLabel);
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
          const shownText = raw === null || raw === undefined ? "" : String(raw);
          const cellTemplate = element.querySelector<HTMLTemplateElement>(
            `template[data-ok-data-grid-cell="${CSS.escape(field)}"]`,
          );
          if (cellTemplate) {
            cell.replaceChildren(cellTemplate.content.cloneNode(true));
            for (const slot of cell.querySelectorAll("[data-ok-data-grid-value]"))
              slot.textContent = shownText;
            cell.setAttribute("data-ok-text", shownText);
          } else cell.textContent = shownText;
          if (typeof raw !== "string") cell.setAttribute("data-ok-value", shownText);
        }
        return row;
      });
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
        (
          row.querySelector(
            '[data-ok-data-grid-checkbox] input[type="checkbox"]',
          ) as HTMLInputElement
        ).checked = on;
      }
      const all = headerRow.querySelector(
        '[data-ok-data-grid-checkbox] input[type="checkbox"]',
      ) as HTMLInputElement;
      const state = gridSelectAllState(filtered.map(idOf), selection);
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
      operatorSelect.replaceChildren(
        ...gridFilterOperators(type).map((operator) => {
          const option = document.createElement("option");
          option.value = operator;
          option.textContent = gridDefaultLabels.filterOperator[operator] as string;
          return option;
        }),
      );
    };
    const readFilters = (): GridFilterModel => {
      const rowsNow = filterRows();
      const logic = rowsNow[1] ? partsOf(rowsNow[1]).logic?.value : undefined;
      return {
        ...filterModel,
        items: rowsNow.map((row) => {
          const { field, operator, input } = partsOf(row);
          input.disabled = !gridOperatorNeedsValue(operator.value);
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
        label.textContent = gridDefaultLabels.filterPanelLogicOperator;
      select.replaceChildren(
        ...(["and", "or"] as const).map((value) => {
          const option = document.createElement("option");
          option.value = value;
          option.textContent =
            value === "and"
              ? gridDefaultLabels.filterPanelOperatorAnd
              : gridDefaultLabels.filterPanelOperatorOr;
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
    const toCsv = () =>
      gridToCsv(
        visibleGridColumns(columns, visibility),
        sortGridRows(
          filterGridRows(rows(), filterModel, columns, value, text),
          sortModel,
          columns,
          value,
        ),
        text,
      );
    const exportCsv = () =>
      download(element.getAttribute("data-ok-export-file-name") ?? "data", toCsv());
    const print = () => printGridContent(main, main.getAttribute("aria-label") ?? "");
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
    });

    // Editing: inputs replace the cell content; Enter commits, Escape cancels.
    interface Edit {
      cell: HTMLElement;
      column: GridColumn;
      input: HTMLInputElement | HTMLSelectElement;
      content: Node[];
    }
    let edits: Edit[] = [];
    let editRow: HTMLElement | null = null;
    const startEdit = (row: HTMLElement, field: string) => {
      const column = columns.find((c) => c.field === field);
      if (edits.length || !column?.editable) return;
      const rowMode = element.getAttribute(editMode.attr) === "row";
      const targets = rowMode
        ? visibleGridColumns(columns, visibility).filter((c) => c.editable)
        : [column];
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
        input.setAttribute("data-ok-data-grid-edit-input", "");
        input.setAttribute("aria-label", `${gridDefaultLabels.editLabel} ${name}`);
        const content = [...cell.childNodes];
        cell.replaceChildren(input);
        cell.setAttribute("data-ok-editing", "");
        return { cell, column: c, input, content };
      });
      (edits[0] as Edit).input.focus();
    };
    const stopEdit = (commit: boolean, focusField?: string) => {
      const done = edits;
      const row = editRow as HTMLElement;
      edits = [];
      editRow = null;
      row.removeAttribute("data-ok-editing");
      const values = Object.fromEntries(
        done.map(({ column, input }) => {
          const textValue =
            input instanceof HTMLInputElement && input.type === "checkbox"
              ? String(input.checked)
              : input.value;
          return [column.field, parseGridEditValue(textValue, column.type)];
        }),
      );
      const accepted = commit && emit("edit", { id: idOf(row), row: values }, { cancelable: true });
      for (const { cell, column, content } of done) {
        cell.removeAttribute("data-ok-editing");
        if (!accepted) {
          cell.replaceChildren(...content);
          continue;
        }
        const next = values[column.field];
        const shownText = next === null || next === undefined ? "" : String(next);
        cell.replaceChildren(shownText);
        cell.removeAttribute("data-ok-text");
        cell.setAttribute("data-ok-value", shownText);
      }
      // Re-sorting moves rows, which drops the focus: apply first, then focus the cell.
      if (accepted) apply();
      (cellOf(row, focusField ?? (done[0] as Edit).column.field) as HTMLElement).focus();
    };
    main.addEventListener(
      "dblclick",
      (event) => {
        const cell = (event.target as Element).closest<HTMLElement>('[role="gridcell"]');
        if (cell)
          startEdit(
            cell.closest<HTMLElement>(ROW) as HTMLElement,
            cell.getAttribute("data-ok-field") as string,
          );
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
          sortBy(header.getAttribute("data-ok-field") as string, (event as MouseEvent).shiftKey);
          return;
        }
        const row = target.closest<HTMLElement>(ROW);
        if (
          row &&
          checkbox &&
          !element.hasAttribute(disableRowSelectionOnClick.attr) &&
          !target.closest(INTERACTIVE)
        )
          select(toggleGridRow(selection, idOf(row)));
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
        select(
          row ? toggleGridRow(selection, idOf(row)) : toggleGridRows(selection, filtered.map(idOf)),
        );
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
      syncOverlays(rows().length);
    };
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
      ],
    });

    for (const row of filterRows()) fillOperators(partsOf(row).operator, partsOf(row).field.value);
    layout();
    apply();
    reflect();
    scrollWatcher.measure();

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
      },
    };
  },
});
