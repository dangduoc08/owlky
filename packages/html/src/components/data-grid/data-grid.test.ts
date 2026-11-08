import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import {
  expectCspSafe,
  expectNoAxeViolations,
  mount,
  resetPage,
  settle,
} from "../../test-utils.js";
import { components } from "../index.js";
import type { DataGridInstance } from "./data-grid.js";

const snippets = Object.entries(
  import.meta.glob("./examples/*.html", { query: "?raw", import: "default", eager: true }),
) as [string, string][];
const BASIC = snippets.find(([path]) => path.endsWith("basic-group.html"))?.[1] as string;

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
  vi.restoreAllMocks();
});

const setup = () => {
  const host = mount(BASIC);
  start();
  const root = host.querySelector<HTMLElement>("[data-ok-data-grid]") as HTMLElement;
  const instance = runtime?.get<DataGridInstance>(root, "data-grid") as DataGridInstance;
  return { host, root, instance };
};
const visible = (host: Element, field = "firstName") =>
  [...host.querySelectorAll('[data-ok-data-grid-body] > [role="row"]:not([hidden])')].map(
    (row) => row.querySelector(`[data-ok-field="${field}"]`)?.textContent,
  );
const header = (host: Element, field: string) =>
  host.querySelector<HTMLElement>(`[role="columnheader"][data-ok-field="${field}"]`) as HTMLElement;

describe("data grid snippets", () => {
  it("covers every story group", () => expect(snippets).toHaveLength(2));

  it.each(snippets)("%s: CSP-safe anatomy; no axe violations once running", async (_, html) => {
    const host = mount(html);
    expectCspSafe(host, html);
    const grid = host.querySelector('[role="grid"]') as Element;
    expect(grid.getAttribute("aria-label")).not.toBe("");
    expect(host.querySelectorAll('[data-ok-data-grid-body] > [role="row"]')).toHaveLength(20);
    start();
    await settle();
    expect(
      host.querySelectorAll('[data-ok-data-grid-body] > [role="row"]:not([hidden])'),
    ).toHaveLength(10);
    await expectNoAxeViolations(host);
  });
});

describe("data grid runtime", () => {
  it("lays out the columns; pages the rows; sets the pagination count", () => {
    const { host } = setup();
    const grid = host.querySelector<HTMLElement>('[role="grid"]') as HTMLElement;
    expect(grid.style.getPropertyValue("--_ok-data-grid-columns")).toBe(
      "50px 110px minmax(120px, 1fr) minmax(120px, 1fr) 90px minmax(160px, 1fr) 110px",
    );
    expect(host.querySelector("[data-ok-table-pagination-displayed]")?.textContent).toBe(
      "1–10 of 20",
    );
    expect(grid.getAttribute("aria-rowcount")).toBe("21");
  });

  it("sorts on header click and Enter (moving rows); Shift adds; events are cancelable", async () => {
    const { host, root, instance } = setup();
    const age = header(host, "age");
    age.click();
    expect(age.getAttribute("aria-sort")).toBe("ascending");
    expect(visible(host, "age").slice(0, 3)).toEqual(["18", "21", "22"]);
    age.focus();
    await userEvent.keyboard("{Enter}");
    expect(age.getAttribute("aria-sort")).toBe("descending");
    header(host, "firstName").dispatchEvent(
      new MouseEvent("click", { bubbles: true, shiftKey: true }),
    );
    expect(instance.sortModel).toEqual([
      { field: "age", sort: "desc" },
      { field: "firstName", sort: "asc" },
    ]);
    root.addEventListener("ok:data-grid:sort", (event) => event.preventDefault(), { once: true });
    age.click();
    expect(age.getAttribute("aria-sort")).toBe("descending");
    header(host, "actions").click();
    expect(instance.sortModel).toHaveLength(2);
  });

  it("quick filter and filter panel; page resets; overlay", async () => {
    const { host } = setup();
    await userEvent.click(
      host.querySelector("[data-ok-table-pagination-action='next']") as HTMLElement,
    );
    await settle();
    expect(host.querySelector("[data-ok-table-pagination-displayed]")?.textContent).toBe(
      "11–20 of 20",
    );
    await userEvent.type(
      host.querySelector("[data-ok-data-grid-quick-filter] input") as HTMLElement,
      "ana",
    );
    await settle();
    expect(visible(host)).toEqual(["Ana", "Ana"]);
    expect(host.querySelector("[data-ok-table-pagination-displayed]")?.textContent).toBe(
      "1–2 of 2",
    );
    await userEvent.clear(
      host.querySelector("[data-ok-data-grid-quick-filter] input") as HTMLElement,
    );
    const panel = host.querySelector('[id$="-filters"]') as HTMLElement;
    await userEvent.click(
      host.querySelector(`[data-ok-popover-open="${panel.id}"]`) as HTMLElement,
    );
    const [field, operator] = panel.querySelectorAll("select");
    await userEvent.selectOptions(field as HTMLSelectElement, "age");
    expect([...(operator as HTMLSelectElement).options].map((o) => o.value)).toContain(">");
    await userEvent.selectOptions(operator as HTMLSelectElement, ">");
    await userEvent.type(panel.querySelector("input") as HTMLElement, "60");
    await settle();
    expect(visible(host, "age")).toEqual(["64"]);
    await userEvent.selectOptions(operator as HTMLSelectElement, "isEmpty");
    await settle();
    expect((panel.querySelector("input") as HTMLInputElement).disabled).toBe(true);
    const overlay = host.querySelector("[data-ok-data-grid-overlay]") as HTMLElement;
    expect(overlay.hidden).toBe(false);
    expect(overlay.textContent).toBe("No results found.");
  });

  it("selection: row checkboxes, row click, select all, Ctrl+A, Space", async () => {
    const { host, instance } = setup();
    const rows = [...host.querySelectorAll<HTMLElement>('[data-ok-data-grid-body] > [role="row"]')];
    await userEvent.click(rows[0]?.querySelector('input[type="checkbox"]') as HTMLElement);
    expect(rows[0]?.getAttribute("aria-selected")).toBe("true");
    const all = host.querySelector<HTMLInputElement>(
      '[role="columnheader"] input[type="checkbox"]',
    ) as HTMLInputElement;
    expect(all.indeterminate).toBe(true);
    expect(all.closest("[data-ok-checkbox]")?.hasAttribute("data-ok-indeterminate")).toBe(true);
    await userEvent.click(rows[1]?.querySelector('[data-ok-field="lastName"]') as HTMLElement);
    expect(instance.selection).toEqual(["p-001", "p-002"]);
    await userEvent.click(rows[1]?.querySelector("button") as HTMLElement);
    expect(instance.selection).toHaveLength(2);
    await userEvent.click(all);
    expect(instance.selection).toHaveLength(20);
    await userEvent.click(all);
    expect(instance.selection).toEqual([]);
    ((rows[2] as HTMLElement).querySelector('[data-ok-field="lastName"]') as HTMLElement).focus();
    await userEvent.keyboard(" ");
    expect(instance.selection).toEqual(["p-003"]);
    await userEvent.keyboard("{Control>}a{/Control}");
    expect(instance.selection).toHaveLength(20);
    instance.setSelection(["p-005"]);
    expect(rows[4]?.getAttribute("aria-selected")).toBe("true");
  });

  it("columns panel, density menu, export, column menu", async () => {
    const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:x");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const { host, root, instance } = setup();
    const id = root.id;
    await userEvent.click(
      host.querySelector(`[data-ok-popover-open="${id}-columns"]`) as HTMLElement,
    );
    await userEvent.click(
      host.querySelector(`#${id}-columns input[data-ok-field="lastName"]`) as HTMLElement,
    );
    expect(header(host, "lastName").hidden).toBe(true);
    expect(instance.columnVisibilityModel).toEqual({ lastName: false });
    expect(header(host, "age").getAttribute("aria-colindex")).toBe("4");
    await userEvent.keyboard("{Escape}");
    await userEvent.click(
      host.querySelector(`[data-ok-popover-open="${id}-density"]`) as HTMLElement,
    );
    await userEvent.click(
      host.querySelector(`#${id}-density [data-ok-density="comfortable"]`) as HTMLElement,
    );
    expect(root.getAttribute("data-ok-density")).toBe("comfortable");
    await userEvent.click(
      host.querySelector(`[data-ok-popover-open="${id}-export"]`) as HTMLElement,
    );
    await userEvent.click(host.querySelector(`#${id}-export [role="menuitem"]`) as HTMLElement);
    expect(create).toHaveBeenCalledTimes(1);
    expect(instance.toCsv().split("\r\n")[0]).toBe("﻿ID,First name,Age,Full name");
    // Column menu.
    const ageMenu = header(host, "age").querySelector<HTMLElement>(
      "[data-ok-data-grid-menu-button]",
    ) as HTMLElement;
    await userEvent.hover(header(host, "age"));
    await userEvent.click(ageMenu);
    expect(ageMenu.getAttribute("aria-expanded")).toBe("true");
    const item = (action: string) =>
      host.querySelector(
        `#${id}-column-menu [data-ok-data-grid-action="${action}"]`,
      ) as HTMLElement;
    expect(item("unsort").getAttribute("aria-disabled")).toBe("true");
    await userEvent.click(item("desc"));
    expect(header(host, "age").getAttribute("aria-sort")).toBe("descending");
    expect(ageMenu.getAttribute("aria-expanded")).toBe("false");
    for (const action of ["unsort", "filter", "columns", "hide"]) {
      await userEvent.hover(header(host, "age"));
      await userEvent.click(ageMenu);
      await userEvent.click(item(action));
      await userEvent.keyboard("{Escape}");
    }
    expect(header(host, "age").getAttribute("aria-sort")).toBe("none");
    expect(header(host, "age").hidden).toBe(true);
    // Ctrl+Enter opens the menu from the keyboard.
    header(host, "firstName").focus();
    await userEvent.keyboard("{Control>}{Enter}{/Control}");
    expect(
      header(host, "firstName")
        .querySelector("[data-ok-data-grid-menu-button]")
        ?.getAttribute("aria-expanded"),
    ).toBe("true");
  });

  it("instance setters; stop() removes the template", () => {
    const { host, instance } = setup();
    instance.setSortModel([{ field: "age", sort: "asc" }]);
    expect(visible(host, "age")[0]).toBe("18");
    instance.setFilterModel({ items: [], quickFilterValues: ["kaya"] });
    expect(visible(host, "lastName")).toEqual(["Kaya", "Kaya"]);
    instance.setColumnVisibilityModel({ id: false });
    expect(header(host, "id").hidden).toBe(true);
    runtime?.stop();
    expect(
      (host.querySelector('[role="grid"]') as HTMLElement).style.getPropertyValue(
        "--_ok-data-grid-columns",
      ),
    ).toBe("");
  });
});

const MINIMAL = `<div data-ok-data-grid data-ok-label-no-rows="Empty" data-ok-disable-multiple-columns-sorting>
  <div role="grid" aria-label="Minimal" data-ok-data-grid-main>
    <div role="rowgroup" data-ok-data-grid-header><div role="row" aria-rowindex="1">
      <div role="columnheader" data-ok-field="n" data-ok-type="number" aria-sort="descending" tabindex="-1"><span data-ok-data-grid-header-title>N</span></div>
      <div role="columnheader" data-ok-field="t" data-ok-type="bogus" data-ok-width="x" aria-sort="ascending" data-ok-filterable="false" tabindex="-1" hidden><span data-ok-data-grid-header-title>T</span></div>
      <div role="columnheader" data-ok-field="u" aria-sort="none" tabindex="-1"></div>
    </div></div>
    <div role="rowgroup" data-ok-data-grid-body>
      <div role="row" data-ok-row-id="a"><div role="gridcell" data-ok-field="n" data-ok-value="1" tabindex="-1">one</div><div role="gridcell" data-ok-field="t" tabindex="-1">x</div></div>
      <div role="row" data-ok-row-id="b"><div role="gridcell" data-ok-field="n" data-ok-value="2" tabindex="-1">two</div><div role="gridcell" data-ok-field="t" tabindex="-1">y</div></div>
    </div>
  </div>
  <div data-ok-data-grid-overlay role="status" hidden></div>
</div>`;

describe("data grid runtime, minimal markup", () => {
  it("works without toolbar, footer, id or checkboxes; initial sort and hidden columns from the markup", async () => {
    const host = mount(MINIMAL);
    start();
    const root = host.firstElementChild as HTMLElement;
    const instance = runtime?.get<DataGridInstance>(root, "data-grid") as DataGridInstance;
    expect(instance.sortModel).toEqual([
      { field: "n", sort: "desc" },
      { field: "t", sort: "asc" },
    ]);
    expect(visible(host, "n")).toEqual(["two", "one"]);
    // A cell missing from a row reads as empty text; changes outside checkboxes are ignored.
    instance.setFilterModel({ items: [], quickFilterValues: ["one"] });
    expect(visible(host, "n")).toEqual(["one"]);
    host.querySelector('[role="gridcell"]')?.dispatchEvent(new Event("change", { bubbles: true }));
    instance.setFilterModel({ items: [] });
    expect(instance.columnVisibilityModel).toEqual({ t: false });
    expect((host.querySelector('[data-ok-field="t"][role="gridcell"]') as HTMLElement).hidden).toBe(
      true,
    );
    // No checkbox selection: clicks, Space and Ctrl+A select nothing; no menu to open.
    (host.querySelector('[role="gridcell"]') as HTMLElement).click();
    const cell = host.querySelector<HTMLElement>('[role="gridcell"]') as HTMLElement;
    cell.focus();
    await userEvent.keyboard("{Control>}a{/Control}");
    const n = header(host, "n");
    n.focus();
    await userEvent.keyboard("{Control>}{Enter}{/Control}");
    expect(instance.selection).toEqual([]);
    // Shift doesn't add a column here (data-ok-disable-multiple-columns-sorting).
    header(host, "u").dispatchEvent(new MouseEvent("click", { bubbles: true, shiftKey: true }));
    expect(instance.sortModel).toEqual([{ field: "u", sort: "asc" }]);
    instance.setFilterModel({ items: [{ field: "n", operator: ">", value: "5" }] });
    const overlay = host.querySelector("[data-ok-data-grid-overlay]") as HTMLElement;
    expect(overlay.textContent).toBe("No results found.");
    for (const row of host.querySelectorAll('[role="row"][data-ok-row-id]')) row.remove();
    instance.setFilterModel({ items: [] });
    expect(overlay.textContent).toBe("Empty");
    root.removeAttribute("data-ok-label-no-rows");
    instance.setFilterModel({ items: [] });
    expect(overlay.textContent).toBe("No rows");
    expect(instance.toCsv()).toBe("﻿N,");
  });

  it("refused selection, filter, columns and density changes keep the state", async () => {
    const { host, root, instance } = setup();
    for (const event of ["selection", "filter", "columns", "density"])
      root.addEventListener(`ok:data-grid:${event}`, (e) => e.preventDefault());
    await userEvent.click(
      host.querySelector('[data-ok-data-grid-body] input[type="checkbox"]') as HTMLElement,
    );
    expect(instance.selection).toEqual([]);
    await userEvent.type(
      host.querySelector("[data-ok-data-grid-quick-filter] input") as HTMLElement,
      "x",
    );
    expect(instance.filterModel).toEqual({ items: [] });
    instance.setSelection([]);
    await userEvent.click(
      host.querySelector(`[data-ok-popover-open="${root.id}-density"]`) as HTMLElement,
    );
    await userEvent.click(
      host.querySelector(`#${root.id}-density [data-ok-density="compact"]`) as HTMLElement,
    );
    expect(root.getAttribute("data-ok-density")).toBe("standard");
    await userEvent.keyboard("{Escape}");
    await userEvent.selectOptions(
      host.querySelector("[data-ok-table-pagination-rows] select") as HTMLSelectElement,
      "25",
    );
    await settle();
    expect(visible(host)).toHaveLength(20);
    // "All" rows per page (-1).
    root.dispatchEvent(
      new CustomEvent("ok:table-pagination:change", {
        bubbles: true,
        detail: { page: 0, rowsPerPage: -1 },
      }),
    );
    await settle();
    expect(visible(host)).toHaveLength(20);
  });
});
