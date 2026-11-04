import { afterEach, describe, expect, it } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { mount, resetPage } from "../../test-utils.js";
import { components } from "../index.js";
import type { TableInstance } from "../table/table.js";
import { type TablePaginationInstance, tablePagination } from "./table-pagination.js";

let runtime: Runtime | undefined;
const start = () => {
  runtime = createRuntime()
    .register(...components)
    .start();
  return runtime;
};
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
});

const rows = (count: number) =>
  Array.from({ length: count }, (_, i) => `<tr><td>${i + 1}</td></tr>`).join("");
const TABLE = (count: number) =>
  `<table id="t" data-ok-table><thead><tr><th scope="col"><button type="button" data-ok-table-sort-label data-ok-direction="asc">N</button></th></tr></thead><tbody>${rows(count)}</tbody></table>`;
const button = (action: string) =>
  `<button type="button" data-ok-table-pagination-action="${action}" aria-label="${action}">${action}</button>`;
const PAGINATION = (extra = "", options = [5, 10]) => `
  <div data-ok-table-pagination="t" ${extra}>
    <label data-ok-table-pagination-rows>Rows per page:<select>${options
      .map((o) => `<option value="${o}">${o}</option>`)
      .join("")}</select></label>
    <span data-ok-table-pagination-displayed aria-live="polite"></span>
    <div data-ok-table-pagination-actions>${["first", "previous", "next", "last"].map(button).join("")}</div>
  </div>`;

const visible = (host: Element) =>
  [...host.querySelectorAll<HTMLTableRowElement>("tbody > tr")]
    .filter((row) => !row.hidden)
    .map((row) => row.textContent);
const text = (host: Element) =>
  host.querySelector("[data-ok-table-pagination-displayed]")?.textContent;
const disabled = (host: Element) =>
  ["first", "previous", "next", "last"].filter(
    (a) => (host.querySelector(`[aria-label="${a}"]`) as HTMLButtonElement).disabled,
  );
const instanceOf = (host: Element) =>
  runtime?.get<TablePaginationInstance>(
    host.querySelector("[data-ok-table-pagination]"),
    "table-pagination",
  ) as TablePaginationInstance;

describe("table pagination runtime", () => {
  it("pages the rows, updates the label and buttons, and emits change", async () => {
    const host = mount(TABLE(12) + PAGINATION());
    start();
    expect(visible(host)).toEqual(["1", "2", "3", "4", "5"]);
    expect(text(host)).toBe("1–5 of 12");
    expect(disabled(host)).toEqual(["first", "previous"]);
    const events: unknown[] = [];
    host.addEventListener("ok:table-pagination:change", (e) =>
      events.push((e as CustomEvent).detail),
    );
    await userEvent.click(host.querySelector('[aria-label="next"]') as HTMLElement);
    expect(visible(host)).toEqual(["6", "7", "8", "9", "10"]);
    await userEvent.click(host.querySelector('[aria-label="last"]') as HTMLElement);
    expect(visible(host)).toEqual(["11", "12"]);
    expect(text(host)).toBe("11–12 of 12");
    expect(disabled(host)).toEqual(["next", "last"]);
    await userEvent.click(host.querySelector('[aria-label="previous"]') as HTMLElement);
    await userEvent.click(host.querySelector('[aria-label="first"]') as HTMLElement);
    expect(instanceOf(host).page).toBe(0);
    expect(host.querySelector("[data-ok-table-pagination]")?.getAttribute("data-ok-page")).toBe(
      "0",
    );
    await userEvent.selectOptions(host.querySelector("select") as HTMLSelectElement, "10");
    expect(visible(host)).toHaveLength(10);
    expect(instanceOf(host).rowsPerPage).toBe(10);
    expect(events).toEqual([
      { page: 1, rowsPerPage: 5 },
      { page: 2, rowsPerPage: 5 },
      { page: 1, rowsPerPage: 5 },
      { page: 0, rowsPerPage: 5 },
      { page: 0, rowsPerPage: 10 },
    ]);
  });

  it("prevented changes keep the page and the select; out-of-range pages are refused", async () => {
    const host = mount(TABLE(12) + PAGINATION());
    start();
    host.addEventListener("ok:table-pagination:change", (e) => e.preventDefault());
    await userEvent.click(host.querySelector('[aria-label="next"]') as HTMLElement);
    await userEvent.selectOptions(host.querySelector("select") as HTMLSelectElement, "10");
    expect(instanceOf(host).page).toBe(0);
    expect((host.querySelector("select") as HTMLSelectElement).value).toBe("5");
    expect(instanceOf(host).setPage(9)).toBe(false);
    expect(instanceOf(host).setPage(-1)).toBe(false);
    expect(instanceOf(host).setPage(0.5)).toBe(false);
    expect(instanceOf(host).setPage(0)).toBe(true);
  });

  it("starts on data-ok-page, refreshes after sorting, keeps detail rows with their row", async () => {
    const detail = '<tr><td>2</td></tr><tr data-ok-table-detail id="d"><td>detail</td></tr>';
    const host = mount(
      TABLE(0).replace(
        "<tbody></tbody>",
        `<tbody><tr><td>1</td></tr>${detail}<tr><td>3</td></tr></tbody>`,
      ) + PAGINATION('data-ok-page="1"', [1, 2]),
    );
    start();
    expect(visible(host)).toEqual(["2"]);
    expect(text(host)).toBe("2–2 of 3");
    const table = runtime?.get<TableInstance>(host.querySelector("table"), "table");
    table?.sort(0, "desc");
    expect(visible(host)).toEqual(["2"]);
  });

  it("server-side (data-ok-count) leaves rows alone; no select → data-ok-rows-per-page", () => {
    const host = mount(
      TABLE(3) +
        PAGINATION('data-ok-count="50" data-ok-rows-per-page="5"').replace(
          /<label[\s\S]*<\/label>/,
          "",
        ),
    );
    start();
    expect(visible(host)).toHaveLength(3);
    expect(text(host)).toBe("1–5 of 50");
    expect(instanceOf(host).rowsPerPage).toBe(5);
    expect(instanceOf(host).setPage(9)).toBe(true);
    expect(text(host)).toBe("46–50 of 50");
  });

  it("all rows, invalid attributes, a missing table and the registry", () => {
    const host = mount(
      `${TABLE(3)}${PAGINATION('data-ok-page="-2"', [-1, 5])}<div data-ok-table-pagination="missing" data-ok-page="x"><span data-ok-table-pagination-displayed></span></div>`,
    );
    start();
    expect(visible(host)).toHaveLength(3);
    expect(text(host)).toBe("1–3 of 3");
    expect(instanceOf(host).lastPage).toBe(0);
    const missing = runtime?.get<TablePaginationInstance>(
      host.querySelector('[data-ok-table-pagination="missing"]'),
      "table-pagination",
    );
    expect(missing?.page).toBe(0);
    expect(missing?.rowsPerPage).toBe(10);
    expect(host.querySelector('[data-ok-table-pagination="missing"] span')?.textContent).toBe(
      "0–0 of 0",
    );
    expect(components).toContain(tablePagination);
  });

  it("unknown count (-1): next stays enabled", () => {
    const host = mount(TABLE(3) + PAGINATION('data-ok-count="-1"'));
    start();
    expect(disabled(host)).toEqual(["first", "previous"]);
    expect(instanceOf(host).lastPage).toBe(Number.POSITIVE_INFINITY);
    expect(text(host)).toBe("1–5 of more than 5");
  });

  it("without a select or a label; invalid count; unknown actions; programmatic rows", async () => {
    const host = mount(
      `${TABLE(3)}<div data-ok-table-pagination="t" data-ok-count="abc"><div data-ok-table-pagination-actions>${button("next")}${button("bogus")}</div></div>`,
    );
    start();
    const instance = instanceOf(host);
    expect(instance.lastPage).toBe(0);
    await userEvent.click(host.querySelector('[aria-label="bogus"]') as HTMLElement);
    expect(instance.page).toBe(0);
    expect(instance.setRowsPerPage(2)).toBe(true);
    expect(instance.rowsPerPage).toBe(2);
    host.addEventListener("ok:table-pagination:change", (e) => e.preventDefault());
    expect(instance.setRowsPerPage(5)).toBe(false);
    expect(instance.rowsPerPage).toBe(2);
  });
});
