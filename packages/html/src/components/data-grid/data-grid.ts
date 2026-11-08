import {
  createGridNavigation,
  dataGridOptions,
  filterGridRows,
  GRID_CHECKBOX_FIELD,
  type GridColumn,
  type GridColumnType,
  type GridColumnVisibilityModel,
  type GridDensity,
  type GridFilterItem,
  type GridFilterModel,
  type GridSortModel,
  gridAriaSort,
  gridColumnTemplate,
  gridColumnTypes,
  gridDefaultLabels,
  gridDensities,
  gridFilterOperators,
  gridOperatorNeedsValue,
  gridQuickFilterValues,
  gridSelectAllState,
  gridToCsv,
  isGridSortable,
  nextGridSort,
  pick,
  sortGridRows,
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
  /** These setters don't emit events. */
  setSortModel(model: GridSortModel): void;
  setFilterModel(model: GridFilterModel): void;
  setSelection(ids: readonly string[]): void;
  setColumnVisibilityModel(model: GridColumnVisibilityModel): void;
  /** The CSV of the filtered, sorted rows and shown columns. */
  toCsv(): string;
  /** Downloads the CSV (`data-ok-export-file-name`, default "data"). */
  exportCsv(): void;
}

const {
  density: densityOption,
  disableRowSelectionOnClick,
  disableMultipleColumnsSorting,
  disableColumnMenu,
} = dataGridOptions.options;
const ROW = '[role="row"][data-ok-row-id]';
const INTERACTIVE = "button, a, input, label, select, textarea";

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
    }));
    const rows = () => [...body.querySelectorAll<HTMLElement>(ROW)];
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
    });

    /** Columns: template, hidden cells, column indexes. */
    const layout = () => {
      const shown = visibleGridColumns(columns, visibility);
      written = syncCustomProperties(
        main,
        { "--_ok-data-grid-columns": gridColumnTemplate(shown, checkbox) },
        written,
      );
      main.setAttribute("aria-colcount", String(shown.length + (checkbox ? 1 : 0)));
      const offset = checkbox ? 2 : 1;
      for (const row of [headerRow, ...rows()]) {
        for (const cell of row.querySelectorAll<HTMLElement>("[data-ok-field]")) {
          const field = cell.getAttribute("data-ok-field") as string;
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
    };

    /** Rows: filter, sort (moving rows), page, selection marks, overlay. */
    const apply = () => {
      const all = rows();
      filtered = filterGridRows(all, filterModel, columns, value, text);
      const sorted = sortGridRows(filtered, sortModel, columns, value);
      const kept = new Set(sorted);
      for (const row of [...sorted, ...all.filter((r) => !kept.has(r))]) body.append(row);
      pagination?.setAttribute("data-ok-count", String(sorted.length));
      const pages = Number.isFinite(pageSize)
        ? Math.max(Math.ceil(sorted.length / pageSize), 1)
        : 1;
      page = Math.min(page, pages - 1);
      pager()?.refresh();
      sorted.forEach((row, index) => {
        row.hidden =
          Number.isFinite(pageSize) && (index < page * pageSize || index >= (page + 1) * pageSize);
        row.setAttribute("aria-rowindex", String(index + 2));
      });
      for (const row of all) if (!kept.has(row)) row.hidden = true;
      main.setAttribute("aria-rowcount", String(sorted.length + 1));
      for (const header of headers()) {
        const column = columns.find(
          (c) => c.field === header.getAttribute("data-ok-field"),
        ) as GridColumn;
        if (isGridSortable(column) && header.hasAttribute("aria-sort"))
          header.setAttribute("aria-sort", gridAriaSort(sortModel, column) as string);
      }
      mark();
      const visible = sorted.some((row) => !row.hidden);
      overlay.hidden = visible;
      overlay.textContent = visible
        ? ""
        : all.length === 0
          ? (element.getAttribute("data-ok-label-no-rows") ?? gridDefaultLabels.noRowsLabel)
          : (element.getAttribute("data-ok-label-no-results") ??
            gridDefaultLabels.noResultsOverlayLabel);
      navigation.sync();
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
        apply();
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
        apply();
      });
    const setVisibility = (model: GridColumnVisibilityModel) =>
      change("columns", model, (next) => {
        visibility = next;
        layout();
        navigation.sync();
      });

    // Filter panel: one item (column, operator, value).
    const filterPanel = byId("filters");
    const [fieldSelect, operatorSelect] = [
      ...(filterPanel?.querySelectorAll<HTMLSelectElement>("select") ?? []),
    ];
    const valueInput = filterPanel?.querySelector<HTMLInputElement>("input");
    const fillOperators = (field: string) => {
      const type = columns.find((c) => c.field === field)?.type;
      (operatorSelect as HTMLSelectElement).replaceChildren(
        ...gridFilterOperators(type).map((operator) => {
          const option = document.createElement("option");
          option.value = operator;
          option.textContent = gridDefaultLabels.filterOperator[operator] as string;
          return option;
        }),
      );
    };
    const readFilter = (): GridFilterItem => ({
      field: (fieldSelect as HTMLSelectElement).value,
      operator: (operatorSelect as HTMLSelectElement).value,
      value: (valueInput as HTMLInputElement).value,
    });
    filterPanel?.addEventListener(
      "change",
      (event) => {
        if (event.target === fieldSelect) fillOperators(fieldSelect.value);
        const item = readFilter();
        (valueInput as HTMLInputElement).disabled = !gridOperatorNeedsValue(item.operator);
        setFilter({ ...filterModel, items: [item] });
      },
      { signal },
    );
    valueInput?.addEventListener(
      "input",
      () => setFilter({ ...filterModel, items: [readFilter()] }),
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
    byId("export")?.addEventListener("ok:menu:select", exportCsv, { signal });

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
            apply();
          });
        else if (action === "unsort")
          change(
            "sort",
            sortModel.filter((s) => s.field !== field),
            (model) => {
              sortModel = model;
              apply();
            },
          );
        else if (action === "hide") setVisibility({ ...visibility, [field]: false });
        else if (action === "filter") {
          // The menu offers Filter and Manage columns only with the toolbar (its panels).
          (fieldSelect as HTMLSelectElement).value = field;
          fillOperators(field);
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
        queueMicrotask(apply);
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
    };
    const options = new MutationObserver(reflect);
    options.observe(element, {
      attributes: true,
      attributeFilter: [densityOption.attr, disableColumnMenu.attr],
    });

    if (fieldSelect) fillOperators(fieldSelect.value);
    reflect();
    layout();
    apply();

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
      destroy() {
        options.disconnect();
        navigation.destroy();
        syncCustomProperties(main, {}, written);
      },
    };
  },
});
