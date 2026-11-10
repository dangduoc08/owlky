import { defaultLabelDisplayedRows, lastPage, pageRange } from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";
import type { SelectInstance } from "../select/select.js";
import { byId, groupsOf, showGroup } from "../table/table.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface TablePaginationEvents {
  /** Before the page or the rows per page change. Call `preventDefault()` to keep them. */
  change: EventSpec<{ page: number; rowsPerPage: number }, true>;
}

export interface TablePaginationInstance extends ComponentInstance {
  /** The page (0-based). */
  readonly page: number;
  /** The rows per page. */
  readonly rowsPerPage: number;
  /** Last 0-based page (`Infinity` when the count is unknown). */
  readonly lastPage: number;
  /** Returns `false` if out of range or `ok:table-pagination:change` was prevented. */
  setPage(page: number): boolean;
  /** Back to the first page. Returns `false` if `ok:table-pagination:change` was prevented. */
  setRowsPerPage(rowsPerPage: number): boolean;
  /** Re-applies the page to the table's rows (after rows were added, removed or sorted). */
  refresh(): void;
}

const ACTIONS = ["first", "previous", "next", "last"] as const;

/** A whole number ≥ 0 from an attribute, else the fallback. */
const whole = (value: string | null, fallback: number) => {
  const parsed = Number(value);
  return value !== null && Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
};

/**
 * Table pagination — spec: specs/components/table.md
 *
 * Markup:  <div data-ok-table-pagination="<table id>" data-ok-page="0"? data-ok-count="50"?>
 *            <label data-ok-table-pagination-rows>Rows per page: <select>…</select></label>
 *            <span data-ok-table-pagination-displayed aria-live="polite">1–5 of 12</span>
 *            <div data-ok-table-pagination-actions> button[data-ok-table-pagination-action=previous|next…]
 * Without data-ok-count the rows of the table are paged here; with it (server-side) only the
 * label, the buttons and the event change.
 * Events:  ok:table-pagination:change (cancelable, detail.page / rowsPerPage)
 */
export const tablePagination = defineComponent<TablePaginationInstance, TablePaginationEvents>({
  name: "table-pagination",
  selector: "[data-ok-table-pagination]",

  setup(element, { emit, runtime, signal }) {
    const select = element.querySelector<HTMLSelectElement>(
      "[data-ok-table-pagination-rows] select",
    );
    // A listbox Select (`selectProps.native` false): its hidden input holds the value.
    const listbox = element.querySelector<HTMLElement>(
      "[data-ok-table-pagination-rows] > [data-ok-select]",
    );
    const listboxInput = listbox?.querySelector<HTMLInputElement>(
      ":scope > [data-ok-select-input]",
    );
    const showRows = (value: number) => {
      if (select) select.value = String(value);
      if (listbox) runtime.getOrCreate<SelectInstance>(listbox, "select")?.setValue(String(value));
    };
    listbox?.addEventListener(
      "ok:select:change",
      (event) => {
        const { value } = (event as CustomEvent<{ value: string }>).detail;
        if (!instance.setRowsPerPage(Number(value))) event.preventDefault();
      },
      { signal },
    );
    const owner = () => {
      const found = byId(element, element.getAttribute("data-ok-table-pagination") as string);
      return found instanceof HTMLTableElement ? found : null;
    };
    // Read on every render: an owner (such as a data grid) may set the count after this setup.
    const server = () => element.hasAttribute("data-ok-count");
    const count = () =>
      server()
        ? Number(element.getAttribute("data-ok-count")) || 0
        : (() => {
            const tableElement = owner();
            return tableElement ? groupsOf(tableElement).length : 0;
          })();
    let rows = select
      ? Number(select.value)
      : listboxInput
        ? Number(listboxInput.value)
        : whole(element.getAttribute("data-ok-rows-per-page"), 10);
    let page = whole(element.getAttribute("data-ok-page"), 0);

    const last = () => (rows === -1 ? 0 : lastPage(rows, count()));

    const render = () => {
      const total = count();
      page = Math.min(page, Number.isFinite(last()) ? last() : page);
      const label = element.querySelector("[data-ok-table-pagination-displayed]");
      // `data-ok-label-displayed-rows`: a pattern with {from}, {to} and {count} (other languages).
      const range = pageRange(page, rows, total);
      const pattern = element.getAttribute("data-ok-label-displayed-rows");
      if (label)
        label.textContent = pattern
          ? pattern
              .replaceAll("{from}", String(range.from))
              .replaceAll("{to}", String(range.to))
              .replaceAll("{count}", String(range.count))
          : defaultLabelDisplayedRows(range);
      for (const action of ACTIONS) {
        const button = element.querySelector<HTMLButtonElement>(
          `[data-ok-table-pagination-action="${action}"]`,
        );
        if (button)
          button.disabled =
            action === "first" || action === "previous" ? page <= 0 : page >= last();
      }
      const tableElement = owner();
      if (server() || !tableElement) return;
      groupsOf(tableElement).forEach((group, index) => {
        showGroup(
          tableElement,
          group,
          rows === -1 || (index >= page * rows && index < (page + 1) * rows),
        );
      });
    };

    const instance: TablePaginationInstance = {
      get page() {
        return page;
      },
      get rowsPerPage() {
        return rows;
      },
      get lastPage() {
        return last();
      },
      setPage(next) {
        if (!Number.isInteger(next) || next < 0 || next > last()) return false;
        if (next === page) return true;
        if (!emit("change", { page: next, rowsPerPage: rows }, { cancelable: true })) return false;
        page = next;
        element.setAttribute("data-ok-page", String(page));
        render();
        return true;
      },
      setRowsPerPage(next) {
        if (!emit("change", { page: 0, rowsPerPage: next }, { cancelable: true })) {
          showRows(rows);
          return false;
        }
        rows = next;
        page = 0;
        element.setAttribute("data-ok-page", "0");
        showRows(rows);
        render();
        return true;
      },
      refresh: render,
    };
    render();
    return instance;
  },

  delegate: [
    {
      event: "click",
      selector: "[data-ok-table-pagination-action]",
      handle(button, _event, runtime) {
        // Always mounted: delegation skips data-ok-runtime="off" subtrees.
        const instance = runtime.getOrCreate<TablePaginationInstance>(
          button.closest("[data-ok-table-pagination]"),
          "table-pagination",
        ) as TablePaginationInstance;
        const targets: Record<string, number> = {
          first: 0,
          previous: instance.page - 1,
          next: instance.page + 1,
          last: instance.lastPage,
        };
        instance.setPage(
          targets[button.getAttribute("data-ok-table-pagination-action") as string] ?? -1,
        );
      },
    },
    {
      event: "change",
      selector: "[data-ok-table-pagination-rows] select",
      handle(select, _event, runtime) {
        const root = select.closest("[data-ok-table-pagination]");
        (
          runtime.getOrCreate<TablePaginationInstance>(
            root,
            "table-pagination",
          ) as TablePaginationInstance
        ).setRowsPerPage(Number((select as HTMLSelectElement).value));
      },
    },
  ],
});
