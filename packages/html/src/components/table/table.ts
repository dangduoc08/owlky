import {
  ariaSort,
  compareCellValues,
  nextSortDirection,
  readStyle,
  selectAllState,
  type TableSortDirection,
  tableSortLabelOptions,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface TableEvents {
  /** Before a column is sorted. Call `preventDefault()` to keep the current order. */
  sort: EventSpec<{ column: number; direction: TableSortDirection }, true>;
  /** Before a collapsible row opens or closes. Call `preventDefault()` to refuse. */
  expand: EventSpec<{ row: Element; expanded: boolean }, true>;
  /** After the selection changed through a row checkbox or the select-all checkbox. */
  select: EventSpec<{ rows: HTMLTableRowElement[] }>;
}

export interface TableInstance extends ComponentInstance {
  /**
   * Sorts the rows by a column (0-based, last header row). Without `direction` an active column
   * flips and another one starts ascending. Returns `false` if `ok:table:sort` was prevented.
   */
  sort(column: number, direction?: TableSortDirection): boolean;
  /** Opens / closes / flips a detail row. Returns `false` if `ok:table:expand` was prevented. */
  expand(row: HTMLTableRowElement, open?: boolean): boolean;
  /** Body rows with their detail rows, in DOM order. */
  groups(): HTMLTableRowElement[][];
}

const DETAIL = "data-ok-table-detail";
const { active: activeOption, direction: directionOption } = tableSortLabelOptions.options;

export const rootOf = (from: Element) => from.getRootNode() as Document | ShadowRoot;
/** `id` lookup that also works inside shadow roots. */
export const byId = (from: Element, id: string) => rootOf(from).getElementById(id);

/** Rows of the first `<tbody>`, each followed by its detail rows. */
export function groupsOf(table: HTMLTableElement): HTMLTableRowElement[][] {
  const groups: HTMLTableRowElement[][] = [];
  for (const row of table.tBodies[0]?.rows ?? []) {
    const last = groups[groups.length - 1];
    if (row.hasAttribute(DETAIL) && last) last.push(row);
    else groups.push([row]);
  }
  return groups;
}

/** A detail row is open when its expand button says so. */
const detailOpen = (table: HTMLTableElement, detail: HTMLTableRowElement) =>
  detail.id !== "" &&
  table
    .querySelector(`[data-ok-table-expand="${CSS.escape(detail.id)}"]`)
    ?.getAttribute("aria-expanded") === "true";

/** Shows or hides a row group (detail rows only when open). */
export function showGroup(table: HTMLTableElement, group: HTMLTableRowElement[], visible: boolean) {
  for (const row of group)
    row.hidden = !visible || (row.hasAttribute(DETAIL) && !detailOpen(table, row));
}

/** The checkboxes of a table (its own, not a nested table's). */
const own = (table: HTMLTableElement, selector: string) =>
  [...table.querySelectorAll<HTMLInputElement>(selector)].filter(
    (input) => input.closest("table") === table,
  );

/**
 * Table — spec: specs/components/table.md
 *
 * Markup:  <table id="t" data-ok-table data-ok-size="medium" data-ok-padding="normal">
 *            thead th › button[data-ok-table-sort-label][data-ok-direction]
 *            input[data-ok-table-select-all] / input[data-ok-table-select] (selection column)
 *            button[data-ok-table-expand="<detail id>"] + tr[data-ok-table-detail][id][hidden]
 * Events:  ok:table:sort (cancelable, detail.column / direction), ok:table:select (detail.rows),
 *          ok:table:expand (cancelable, detail.row / expanded)
 */
export const table = defineComponent<TableInstance, TableEvents>({
  name: "table",
  selector: "table[data-ok-table]",

  setup(element, { emit, runtime }) {
    const tableElement = element as HTMLTableElement;

    const refreshPagination = () => {
      if (!tableElement.id) return;
      const id = CSS.escape(tableElement.id);
      for (const name of ["table-pagination", "pagination"])
        for (const pagination of rootOf(tableElement).querySelectorAll(`[data-ok-${name}="${id}"]`))
          runtime.get<ComponentInstance & { refresh(): void }>(pagination, name)?.refresh();
    };

    const instance: TableInstance = {
      groups: () => groupsOf(tableElement),
      sort(column, direction) {
        const head = tableElement.tHead;
        const header = head ? head.rows[head.rows.length - 1] : undefined;
        const cell = header?.cells[column];
        const label = cell?.querySelector<HTMLElement>("[data-ok-table-sort-label]");
        if (!header || !cell || !label) return false;
        const next =
          direction ??
          nextSortDirection(
            label.hasAttribute(activeOption.attr),
            readStyle(label, directionOption),
          );
        if (!emit("sort", { column, direction: next }, { cancelable: true })) return false;
        for (const other of header.cells) {
          const otherLabel = other.querySelector("[data-ok-table-sort-label]");
          if (!otherLabel) continue;
          const isActive = other === cell;
          otherLabel.toggleAttribute(activeOption.attr, isActive);
          otherLabel.setAttribute(directionOption.attr, isActive ? next : "asc");
          const sort = isActive ? ariaSort(next) : undefined;
          if (sort) other.setAttribute("aria-sort", sort);
          else other.removeAttribute("aria-sort");
        }
        const value = (group: HTMLTableRowElement[]) => {
          const target = group[0]?.cells[column];
          return target?.dataset["okSortValue"] ?? target?.textContent ?? "";
        };
        const sign = next === "asc" ? 1 : -1;
        const sorted = groupsOf(tableElement).sort(
          (a, b) => sign * compareCellValues(value(a), value(b)),
        );
        tableElement.tBodies[0]?.append(...sorted.flat());
        refreshPagination();
        return true;
      },
      expand(row, open) {
        const button = tableElement.querySelector(`[data-ok-table-expand="${CSS.escape(row.id)}"]`);
        const expanded = open ?? button?.getAttribute("aria-expanded") !== "true";
        if (!emit("expand", { row, expanded }, { cancelable: true })) return false;
        button?.setAttribute("aria-expanded", String(expanded));
        // A row paged out stays hidden; its detail row follows it.
        const owner = button?.closest("tr");
        row.hidden = !expanded || owner?.hidden === true;
        return true;
      },
    };

    // Rows reflect their checkboxes from the start (server-rendered "checked").
    syncSelection(tableElement);
    return instance;
  },

  delegate: [
    {
      event: "click",
      selector: "[data-ok-table-sort-label]",
      handle(label, _event, runtime) {
        const cell = label.closest("th");
        const owner = cell?.closest("table[data-ok-table]");
        if (!cell || !owner) return;
        (runtime.getOrCreate<TableInstance>(owner, "table") as TableInstance).sort(cell.cellIndex);
      },
    },
    {
      event: "click",
      selector: "[data-ok-table-expand]",
      handle(button, _event, runtime) {
        const target = byId(button, button.getAttribute("data-ok-table-expand") as string);
        const owner = button.closest("table[data-ok-table]");
        if (!(target instanceof HTMLTableRowElement) || !owner) return;
        (runtime.getOrCreate<TableInstance>(owner, "table") as TableInstance).expand(target);
      },
    },
    {
      // A switch (or checkbox) outside the table turns dense rows on and off.
      event: "change",
      selector: "input[data-ok-table-dense]",
      handle(input) {
        const target = byId(input, input.getAttribute("data-ok-table-dense") as string);
        if (!(target instanceof HTMLTableElement) || !target.hasAttribute("data-ok-table")) return;
        target.setAttribute(
          "data-ok-size",
          (input as HTMLInputElement).checked ? "small" : "medium",
        );
      },
    },
    {
      event: "change",
      selector: "[data-ok-table-select], [data-ok-table-select-all]",
      handle(input) {
        const owner = input.closest<HTMLTableElement>("table[data-ok-table]");
        if (!owner) return;
        if (input.hasAttribute("data-ok-table-select-all")) {
          const checked = (input as HTMLInputElement).checked;
          for (const box of own(owner, "[data-ok-table-select]")) box.checked = checked;
        }
        const rows = syncSelection(owner);
        owner.dispatchEvent(
          new CustomEvent("ok:table:select", { bubbles: true, detail: { rows } }),
        );
      },
    },
  ],
});

/** Rows follow their checkboxes; the select-all checkbox follows the rows. Returns the selected rows. */
function syncSelection(owner: HTMLTableElement): HTMLTableRowElement[] {
  const boxes = own(owner, "[data-ok-table-select]");
  const selected: HTMLTableRowElement[] = [];
  for (const box of boxes) {
    const row = box.closest("tr");
    row?.toggleAttribute("data-ok-selected", box.checked);
    if (row && box.checked) selected.push(row);
  }
  const state = selectAllState(selected.length, boxes.length);
  for (const all of own(owner, "[data-ok-table-select-all]")) {
    all.checked = state.checked;
    all.indeterminate = state.indeterminate;
    // Inside a Checkbox, the root shows the dash (same markup as React's `indeterminate`).
    all
      .closest("[data-ok-checkbox]")
      ?.toggleAttribute("data-ok-indeterminate", state.indeterminate);
  }
  return selected;
}
