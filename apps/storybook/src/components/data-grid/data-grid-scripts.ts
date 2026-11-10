import { getRuntime } from "@owlky/html";
import {
  createCustomerSource,
  createLazyCustomerSource,
  LARGE_STEP,
  LARGE_TOTAL,
  makeCustomers,
} from "./server-data.js";

interface GridApi {
  setRows(rows: readonly Record<string, unknown>[]): void;
  setDataSource(source: unknown): void;
}
const gridIn = (row: HTMLElement) => {
  const element = row.querySelector("[data-ok-data-grid]") as HTMLElement;
  return { element, api: getRuntime().get(element, "data-grid") as unknown as GridApi };
};

/** Large dataset (HTML): rows from data, more at each scroll end. */
export function largeScript(row: HTMLElement) {
  const { element, api } = gridIn(row);
  let count = LARGE_STEP;
  let timer: ReturnType<typeof setTimeout> | undefined;
  api.setRows(makeCustomers(0, count));
  const more = () => {
    if (count >= LARGE_TOTAL) return;
    element.setAttribute("data-ok-loading", "");
    timer = setTimeout(() => {
      count += LARGE_STEP;
      api.setRows(makeCustomers(0, count));
      element.removeAttribute("data-ok-loading");
    }, 300);
  };
  element.addEventListener("ok:data-grid:scrollend", more);
  return () => {
    clearTimeout(timer);
    element.removeEventListener("ok:data-grid:scrollend", more);
  };
}

export const LARGE_SCRIPT_SOURCE = `import { getRuntime } from "@owlky/html";

const element = document.getElementById("grid-large");
const grid = getRuntime().get(element, "data-grid");
let count = 200;
grid.setRows(await fetchCustomers(0, count));

// Load 200 more rows each time the rows are scrolled to their end
element.addEventListener("ok:data-grid:scrollend", async () => {
  element.setAttribute("data-ok-loading", "");
  count += 200;
  grid.setRows(await fetchCustomers(0, count));
  element.removeAttribute("data-ok-loading");
});`;

/** Server side (HTML): a data source sorts, filters and pages. */
export function serverScript(row: HTMLElement) {
  const { api } = gridIn(row);
  api.setDataSource(createCustomerSource());
  return () => api.setDataSource(null);
}

export const SERVER_SCRIPT_SOURCE = `import { getRuntime } from "@owlky/html";

const grid = getRuntime().get(document.getElementById("grid-server"), "data-grid");

// The grid asks for each sort, filter and page; the answer replaces the rows
grid.setDataSource({
  async getRows({ sortModel, filterModel, paginationModel }) {
    const response = await fetch("/api/customers", {
      method: "POST",
      body: JSON.stringify({ sortModel, filterModel, paginationModel }),
    });
    return response.json(); // { rows, rowCount }
  },
});`;

/** Server-side aggregation (HTML): the data source answers the footer's values too. */
export function serverAggregationScript(row: HTMLElement) {
  const { api } = gridIn(row);
  api.setDataSource(createCustomerSource());
  return () => api.setDataSource(null);
}

export const SERVER_AGGREGATION_SCRIPT_SOURCE = `import { getRuntime } from "@owlky/html";

const element = document.getElementById("grid-server-aggregation");
const grid = getRuntime().get(element, "data-grid");

// The grid asks for the aggregation too (the attribute data-ok-aggregation-model)
grid.setDataSource({
  async getRows({ sortModel, filterModel, paginationModel, aggregationModel }) {
    const response = await fetch("/api/customers", {
      method: "POST",
      body: JSON.stringify({ sortModel, filterModel, paginationModel, aggregationModel }),
    });
    return response.json(); // { rows, rowCount, aggregateRow }
  },
  getAggregatedValue: (row, field) => row[field],
});`;

/** Editing and validation (HTML): the price format and the checks React gets from its columns. */
export function validationScript(row: HTMLElement) {
  const { element, api } = gridIn(row);
  const grid = api as unknown as {
    setValueFormatter(field: string, format: ((value: unknown) => string) | null): void;
  };
  grid.setValueFormatter("price", (value) => `USD ${Number(value).toFixed(2)}`);
  const check = (event: Event) => {
    const detail = (event as CustomEvent<{ field: string; value: unknown; error?: string }>).detail;
    if (detail.field === "name" && String(detail.value ?? "").trim() === "")
      detail.error = "Enter a name";
    if (detail.field === "price" && !(Number(detail.value) > 0))
      detail.error = "Enter a price above 0";
  };
  element.addEventListener("ok:data-grid:validate", check);
  return () => {
    element.removeEventListener("ok:data-grid:validate", check);
    grid.setValueFormatter("price", null);
  };
}

export const VALIDATION_SCRIPT_SOURCE = `import { getRuntime } from "@owlky/html";

const element = document.getElementById("grid-products");
const grid = getRuntime().get(element, "data-grid");

// Edited prices show as currency
grid.setValueFormatter("price", (value) => \`USD \${Number(value).toFixed(2)}\`);

// A listener sets detail.error: the cell stays open and shows the message
element.addEventListener("ok:data-grid:validate", (event) => {
  const { field, value } = event.detail;
  if (field === "name" && String(value ?? "").trim() === "") event.detail.error = "Enter a name";
  if (field === "price" && !(Number(value) > 0)) event.detail.error = "Enter a price above 0";
});`;

/** Lazy loading (HTML): a data source that answers ranges of rows. */
export function lazyScript(row: HTMLElement) {
  const { api } = gridIn(row);
  api.setDataSource(createLazyCustomerSource());
  return () => api.setDataSource(null);
}

export const LAZY_SCRIPT_SOURCE = `import { getRuntime } from "@owlky/html";

const grid = getRuntime().get(document.getElementById("grid-lazy"), "data-grid");

// With data-ok-lazy-loading, the grid asks for the rows as they scroll into view
grid.setDataSource({
  async getRows({ start, end, sortModel, filterModel }) {
    const response = await fetch(\`/api/customers?start=\${start}&end=\${end}\`);
    return response.json(); // { rows, rowCount }
  },
});`;

interface EditApi {
  setEditCellValue(params: { id: string; field: string; value: unknown }): void;
  setRowModesModel(
    model: Record<string, { mode: "edit" | "view"; ignoreModifications?: boolean }>,
  ): void;
}
type EditEvent = CustomEvent<{ id: string; field?: string }>;

/** Custom editors (HTML): the Slider of the points template follows the cell and sets its value. */
export function editorsScript(row: HTMLElement) {
  const { element, api } = gridIn(row);
  const grid = api as unknown as EditApi;
  const sliderOf = (id: string) =>
    element.querySelector(
      `[data-ok-row-id="${CSS.escape(id)}"] [data-ok-field="points"] [data-ok-slider]`,
    );
  const start = (event: Event) => {
    const { id, field } = (event as EditEvent).detail;
    if (field !== "points") return;
    const cell = sliderOf(id)?.closest("[data-ok-field]");
    const slider = getRuntime().getOrCreate<{ setValue(value: number): void; destroy?(): void }>(
      sliderOf(id),
      "slider",
    );
    slider?.setValue(Number(cell?.getAttribute("data-ok-value")));
  };
  const change = (event: Event) => {
    const id = (event.target as Element)
      .closest("[data-ok-row-id]")
      ?.getAttribute("data-ok-row-id");
    const { value } = (event as CustomEvent<{ value: number[] }>).detail;
    if (id) grid.setEditCellValue({ id, field: "points", value: value[0] });
  };
  element.addEventListener("ok:data-grid:editstart", start);
  element.addEventListener("ok:slider:change", change);
  return () => {
    element.removeEventListener("ok:data-grid:editstart", start);
    element.removeEventListener("ok:slider:change", change);
  };
}

export const EDITORS_SCRIPT_SOURCE = `import { getRuntime } from "@owlky/html";

const element = document.getElementById("grid-editors");
const grid = getRuntime().get(element, "data-grid");
const sliderOf = (id) =>
  element.querySelector(\`[data-ok-row-id="\${id}"] [data-ok-field="points"] [data-ok-slider]\`);

// The template's Slider starts at the cell's value
element.addEventListener("ok:data-grid:editstart", (event) => {
  const { id, field } = event.detail;
  if (field !== "points") return;
  const cell = sliderOf(id).closest("[data-ok-field]");
  getRuntime().getOrCreate(sliderOf(id), "slider").setValue(Number(cell.dataset.okValue));
});

// Each move sets the edited value; Enter saves, Escape cancels
element.addEventListener("ok:slider:change", (event) => {
  const id = event.target.closest("[data-ok-row-id]").dataset.okRowId;
  grid.setEditCellValue({ id, field: "points", value: event.detail.value[0] });
});`;

/** Edit modes (HTML): the row buttons set the row modes model and show Save and Cancel. */
export function modesScript(row: HTMLElement) {
  const { element, api } = gridIn(row);
  const grid = api as unknown as EditApi;
  const show = (editing: string | null) => {
    for (const rowEl of element.querySelectorAll<HTMLElement>("[data-ok-row-id]")) {
      const on = rowEl.getAttribute("data-ok-row-id") === editing;
      for (const button of rowEl.querySelectorAll<HTMLElement>("[data-ok-field=actions] button"))
        button.hidden = (button.getAttribute("aria-label")?.startsWith("Edit") ?? false) === on;
    }
  };
  const click = (event: Event) => {
    const button = (event.target as Element).closest("[data-ok-field=actions] button");
    const id = button?.closest("[data-ok-row-id]")?.getAttribute("data-ok-row-id");
    if (!button || !id) return;
    const label = button.getAttribute("aria-label") ?? "";
    if (label.startsWith("Edit")) grid.setRowModesModel({ [id]: { mode: "edit" } });
    else if (label.startsWith("Save")) grid.setRowModesModel({ [id]: { mode: "view" } });
    else grid.setRowModesModel({ [id]: { mode: "view", ignoreModifications: true } });
    show(label.startsWith("Edit") ? id : null);
  };
  // Enter, Escape or leaving the row stop the edit too.
  const modes = (event: Event) => {
    const model = (event as CustomEvent<{ model: Record<string, { mode: string }> }>).detail.model;
    show(Object.keys(model).find((id) => model[id]?.mode === "edit") ?? null);
  };
  element.addEventListener("click", click);
  element.addEventListener("ok:data-grid:rowmodes", modes);
  return () => {
    element.removeEventListener("click", click);
    element.removeEventListener("ok:data-grid:rowmodes", modes);
  };
}

export const MODES_SCRIPT_SOURCE = `import { getRuntime } from "@owlky/html";

const element = document.getElementById("grid-edit-modes");
const grid = getRuntime().get(element, "data-grid");

// Edit shows Save and Cancel; Save and Cancel bring Edit back
function show(editing) {
  for (const row of element.querySelectorAll("[data-ok-row-id]")) {
    const on = row.dataset.okRowId === editing;
    for (const button of row.querySelectorAll("[data-ok-field=actions] button"))
      button.hidden = button.getAttribute("aria-label").startsWith("Edit") === on;
  }
}

element.addEventListener("click", (event) => {
  const button = event.target.closest("[data-ok-field=actions] button");
  if (!button) return;
  const id = button.closest("[data-ok-row-id]").dataset.okRowId;
  const label = button.getAttribute("aria-label");
  if (label.startsWith("Edit")) grid.setRowModesModel({ [id]: { mode: "edit" } });
  else if (label.startsWith("Save")) grid.setRowModesModel({ [id]: { mode: "view" } });
  else grid.setRowModesModel({ [id]: { mode: "view", ignoreModifications: true } });
  show(label.startsWith("Edit") ? id : null);
});

// Enter, Escape or leaving the row stop the edit too
element.addEventListener("ok:data-grid:rowmodes", (event) => {
  const { model } = event.detail;
  show(Object.keys(model).find((id) => model[id].mode === "edit") ?? null);
});`;

const PRIORITY_RANK: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
type Comparator = (a: unknown, b: unknown) => number;
interface SortingApi {
  setSortComparator(
    field: string,
    comparators: {
      sortComparator?: Comparator;
      getSortComparator?: (direction: "asc" | "desc") => Comparator;
    } | null,
  ): void;
}

/** Sorting (HTML): the comparators React gets from its columns. */
export function sortingScript(row: HTMLElement) {
  const grid = gridIn(row).api as unknown as SortingApi;
  grid.setSortComparator("priority", {
    sortComparator: (a, b) => (PRIORITY_RANK[String(a)] ?? 3) - (PRIORITY_RANK[String(b)] ?? 3),
  });
  grid.setSortComparator("due", {
    getSortComparator: (direction) => (a, b) => {
      if (!a || !b) return a === b ? 0 : a ? -1 : 1;
      const order = String(a).localeCompare(String(b));
      return direction === "asc" ? order : -order;
    },
  });
  return () => {
    grid.setSortComparator("priority", null);
    grid.setSortComparator("due", null);
  };
}

export const SORTING_SCRIPT_SOURCE = `import { getRuntime } from "@owlky/html";

const grid = getRuntime().get(document.getElementById("grid-sorting"), "data-grid");
const rank = { High: 0, Medium: 1, Low: 2 };

// Priorities sort by rank, not by name (values are the cells' text)
grid.setSortComparator("priority", {
  sortComparator: (a, b) => (rank[a] ?? 3) - (rank[b] ?? 3),
});

// Issues without a due date stay last in both directions
grid.setSortComparator("due", {
  getSortComparator: (direction) => (a, b) => {
    if (!a || !b) return a === b ? 0 : a ? -1 : 1;
    const order = a.localeCompare(b);
    return direction === "asc" ? order : -order;
  },
});`;
