import { defaultLabelDisplayedRows, lastPage, pageRange } from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";
import { byId, groupsOf, showGroup } from "../table/table.js";

export interface TablePaginationInstance extends ComponentInstance {
  readonly page: number;
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
export const tablePagination = defineComponent<TablePaginationInstance>({
  name: "table-pagination",
  selector: "[data-ok-table-pagination]",

  setup(element, { emit }) {
    const select = element.querySelector<HTMLSelectElement>(
      "[data-ok-table-pagination-rows] select",
    );
    const owner = () => {
      const found = byId(element, element.getAttribute("data-ok-table-pagination") as string);
      return found instanceof HTMLTableElement ? found : null;
    };
    const server = element.hasAttribute("data-ok-count");
    const count = () =>
      server
        ? Number(element.getAttribute("data-ok-count")) || 0
        : (() => {
            const tableElement = owner();
            return tableElement ? groupsOf(tableElement).length : 0;
          })();
    let rows = select
      ? Number(select.value)
      : whole(element.getAttribute("data-ok-rows-per-page"), 10);
    let page = whole(element.getAttribute("data-ok-page"), 0);

    const last = () => (rows === -1 ? 0 : lastPage(rows, count()));

    const render = () => {
      const total = count();
      page = Math.min(page, Number.isFinite(last()) ? last() : page);
      const label = element.querySelector("[data-ok-table-pagination-displayed]");
      if (label) label.textContent = defaultLabelDisplayedRows(pageRange(page, rows, total));
      for (const action of ACTIONS) {
        const button = element.querySelector<HTMLButtonElement>(
          `[data-ok-table-pagination-action="${action}"]`,
        );
        if (button)
          button.disabled =
            action === "first" || action === "previous" ? page <= 0 : page >= last();
      }
      const tableElement = owner();
      if (server || !tableElement) return;
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
          if (select) select.value = String(rows);
          return false;
        }
        rows = next;
        page = 0;
        element.setAttribute("data-ok-page", "0");
        if (select) select.value = String(rows);
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
