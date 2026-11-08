import { getRuntime } from "@owlky/html";
import { createCustomerSource, LARGE_STEP, LARGE_TOTAL, makeCustomers } from "./server-data.js";

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
