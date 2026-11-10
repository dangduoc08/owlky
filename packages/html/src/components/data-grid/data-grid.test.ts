import { type GridGetRowsParams, viVN } from "@owlky/core";
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
import type { AutocompleteInstance } from "../autocomplete/autocomplete.js";
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
  it("covers every story group", () => expect(snippets).toHaveLength(43));

  // Grids whose rows come from JavaScript (setRows, data sources) ship no rows.
  const scripted = (path: string) => /(large|server|lazy|server-aggregation)-group/.test(path);

  it.each(snippets.filter(([path]) => scripted(path)))(
    "%s: CSP-safe shell with a row template; no axe violations with rows",
    async (_, html) => {
      const host = mount(html);
      expectCspSafe(host, html);
      expect(host.querySelectorAll('[data-ok-data-grid-body] > [role="row"]')).toHaveLength(0);
      expect(host.querySelector("template[data-ok-data-grid-row]")).not.toBeNull();
      start();
      const root = host.querySelector("[data-ok-data-grid]") as HTMLElement;
      const instance = runtime?.get<DataGridInstance>(root, "data-grid") as DataGridInstance;
      instance.setRows([{ id: "c-1", firstName: "Ana", lastName: "Silva", age: 40, city: "Lima" }]);
      await settle();
      expect(host.querySelectorAll('[data-ok-data-grid-body] > [role="row"]')).toHaveLength(1);
      await expectNoAxeViolations(host);
    },
  );

  // Layout and validation grids: their own rows, no pages.
  const unpaged = (path: string) =>
    /(layout|validation|tree|detail|ordering|groups|list|grouping|pivot|cells|charts|sorting|editors|modes|history|footer|dimensions|columns|selection|set|context|filters|auto)-/.test(
      path,
    );

  it.each(snippets.filter(([path]) => unpaged(path)))(
    "%s: CSP-safe; no axe violations once running",
    async (_, html) => {
      const host = mount(html);
      expectCspSafe(host, html);
      start();
      await settle();
      expect(
        host.querySelectorAll('[data-ok-data-grid-body] > [role="row"]').length,
      ).toBeGreaterThanOrEqual(2);
      await expectNoAxeViolations(host);
    },
  );

  it.each(snippets.filter(([path]) => !scripted(path) && !unpaged(path)))(
    "%s: CSP-safe anatomy; no axe violations once running",
    async (_, html) => {
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
    },
  );
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
    instance.setRows([]);
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

// Phase 2 tests reach every column: no column window in the narrow test page.
const ADVANCED = String(
  snippets.find(([path]) => path.endsWith("advanced-group.html"))?.[1],
).replace("<div data-ok-data-grid ", "<div data-ok-data-grid data-ok-disable-virtualization ");

describe("data grid runtime, phase 2", () => {
  const setupAdvanced = () => {
    const host = mount(ADVANCED);
    start();
    const root = host.querySelector<HTMLElement>("[data-ok-data-grid]") as HTMLElement;
    const instance = runtime?.get<DataGridInstance>(root, "data-grid") as DataGridInstance;
    return { host, root, instance };
  };
  const cellOf = (host: Element, rowId: string, field: string) =>
    host.querySelector(
      `[data-ok-row-id="${rowId}"] [role="gridcell"][data-ok-field="${field}"]`,
    ) as HTMLElement;

  it("reads pinned columns from the markup and keeps sticky offsets", () => {
    const { host, instance } = setupAdvanced();
    expect(instance.pinnedColumns).toEqual({ left: ["firstName"], right: ["actions"] });
    expect(header(host, "firstName").style.getPropertyValue("--_ok-data-grid-pin")).toBe("0px");
    expect(getComputedStyle(header(host, "actions")).position).toBe("sticky");
  });

  it("multi filters: add rows (with the logic field), or, remove", async () => {
    const { host, root, instance } = setupAdvanced();
    const panel = host.querySelector(`#${root.id}-filters`) as HTMLElement;
    await userEvent.click(
      host.querySelector(`[data-ok-popover-open="${root.id}-filters"]`) as HTMLElement,
    );
    await userEvent.selectOptions(panel.querySelector("select") as HTMLSelectElement, "age");
    const rowsOf = () => [...panel.querySelectorAll<HTMLElement>("[data-ok-data-grid-filter]")];
    await userEvent.selectOptions(
      (rowsOf()[0] as HTMLElement).querySelectorAll("select")[1] as HTMLSelectElement,
      "<",
    );
    await userEvent.type((rowsOf()[0] as HTMLElement).querySelector("input") as HTMLElement, "25");
    await userEvent.click(panel.querySelector("[data-ok-data-grid-filter-add]") as HTMLElement);
    const second = rowsOf()[1] as HTMLElement;
    const [logic, field, operator] = second.querySelectorAll("select");
    expect(logic?.id).toBe(`${root.id}-filter-logic-1`);
    expect(second.querySelector("label")?.textContent).toBe("Logic operator");
    expect(field?.id).toBe(`${root.id}-filter-field-1`);
    await userEvent.selectOptions(field as HTMLSelectElement, "age");
    await userEvent.selectOptions(operator as HTMLSelectElement, ">");
    await userEvent.type(second.querySelector("input") as HTMLElement, "60");
    await settle();
    expect(visible(host, "age")).toEqual([]);
    await userEvent.selectOptions(logic as HTMLSelectElement, "or");
    await settle();
    expect(instance.filterModel.logicOperator).toBe("or");
    expect(visible(host, "age").length).toBeGreaterThan(0);
    await userEvent.click(panel.querySelector("[data-ok-data-grid-filter-add]") as HTMLElement);
    expect(
      (
        (rowsOf()[2] as HTMLElement).querySelector(
          'select[id*="-filter-logic"]',
        ) as HTMLSelectElement
      ).disabled,
    ).toBe(true);
    await userEvent.click(
      rowsOf()[0]?.querySelector("[data-ok-data-grid-filter-remove]") as HTMLElement,
    );
    expect(rowsOf()).toHaveLength(2);
    expect(rowsOf()[0]?.querySelector('select[id*="-filter-logic"]')).toBeNull();
    expect(rowsOf()[1]?.querySelector("select")?.id).toBe(`${root.id}-filter-logic-1`);
    await userEvent.click(
      rowsOf()[1]?.querySelector("[data-ok-data-grid-filter-remove]") as HTMLElement,
    );
    await userEvent.click(
      rowsOf()[0]?.querySelector("[data-ok-data-grid-filter-remove]") as HTMLElement,
    );
    expect(rowsOf()).toHaveLength(1);
    expect(instance.filterModel.items).toEqual([]);
  });

  it("resizing by handle and keyboard; reorder by drag and menu; pinning from the menu", async () => {
    const { host, root, instance } = setupAdvanced();
    const resized: unknown[] = [];
    root.addEventListener("ok:data-grid:resize", (e) => resized.push((e as CustomEvent).detail));
    const handle = header(host, "email").querySelector("[data-ok-data-grid-resize]") as HTMLElement;
    const x = handle.getBoundingClientRect().left;
    handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, clientX: x, button: 0 }));
    document.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: x - 40 }));
    expect(resized).toEqual([{ field: "email", width: 220 }]);
    expect(header(host, "actions").querySelector("[data-ok-data-grid-resize]")).toBeNull();
    instance.setColumnWidth("actions", 300);
    expect(instance.columnWidths).toEqual({ email: 220 });
    header(host, "age").focus();
    await userEvent.keyboard("{Alt>}{ArrowRight}{/Alt}");
    expect(instance.columnWidths["age"]).toBe(100);
    // Drag "age" onto "email" (scrolled back: the pinned column covers the start).
    (host.querySelector('[role="grid"]') as HTMLElement).scrollLeft = 0;
    const age = header(host, "age");
    const email = header(host, "email").getBoundingClientRect();
    age.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        clientX: age.getBoundingClientRect().left + 5,
        clientY: email.top + 5,
        button: 0,
      }),
    );
    document.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: email.left + 20,
        clientY: email.top + 5,
      }),
    );
    document.dispatchEvent(
      new PointerEvent("pointerup", {
        bubbles: true,
        clientX: email.left + 20,
        clientY: email.top + 5,
      }),
    );
    expect(instance.columnOrder.slice(0, 4)).toEqual(["firstName", "lastName", "age", "email"]);
    const firstCells = [
      ...host.querySelectorAll('[data-ok-data-grid-body] > [role="row"] > [role="gridcell"]'),
    ].slice(0, 4);
    expect(firstCells.map((c) => c.getAttribute("data-ok-field"))).toEqual([
      "firstName",
      "lastName",
      "age",
      "email",
    ]);
    const menuOf = async (field: string) => {
      await userEvent.hover(header(host, field));
      await userEvent.click(
        header(host, field).querySelector("[data-ok-data-grid-menu-button]") as HTMLElement,
      );
    };
    const item = (action: string) =>
      host.querySelector(
        `#${root.id}-column-menu [data-ok-data-grid-action="${action}"]`,
      ) as HTMLElement;
    await menuOf("age");
    await userEvent.click(item("right"));
    expect(instance.columnOrder.slice(2, 4)).toEqual(["email", "age"]);
    await menuOf("age");
    await userEvent.click(item("left"));
    await menuOf("team");
    expect(item("unpin").getAttribute("aria-disabled")).toBe("true");
    await userEvent.click(item("pin-left"));
    expect(header(host, "team").getAttribute("data-ok-pinned")).toBe("left");
    expect(instance.pinnedColumns.left).toEqual(["firstName", "team"]);
    await menuOf("team");
    await userEvent.click(item("pin-right"));
    await menuOf("team");
    await userEvent.click(item("unpin"));
    expect(header(host, "team").hasAttribute("data-ok-pinned")).toBe(false);
    instance.setColumnOrder(["email"]);
    instance.setPinnedColumns({});
    expect(header(host, "firstName").hasAttribute("data-ok-pinned")).toBe(false);
    // Disabled options refuse.
    root.setAttribute("data-ok-disable-column-resize", "");
    instance.setColumnWidth("email", 400);
    expect(instance.columnWidths["email"]).toBe(220);
  });

  it("cell editing: double click, Enter commits, Escape cancels, blur commits, refused edits restore", async () => {
    const { host, root } = setupAdvanced();
    const edits: unknown[] = [];
    root.addEventListener("ok:data-grid:edit", (e) => edits.push((e as CustomEvent).detail));
    await userEvent.dblClick(cellOf(host, "p-001", "firstName"));
    const input = cellOf(host, "p-001", "firstName").querySelector("input") as HTMLInputElement;
    expect(input.getAttribute("aria-label")).toBe("Edit First name");
    expect(document.activeElement).toBe(input);
    await userEvent.clear(input);
    await userEvent.type(input, "Zed{Enter}");
    expect(edits).toEqual([{ id: "p-001", row: { firstName: "Zed" } }]);
    expect(cellOf(host, "p-001", "firstName").textContent).toBe("Zed");
    expect(document.activeElement).toBe(cellOf(host, "p-001", "firstName"));
    cellOf(host, "p-002", "age").focus();
    await userEvent.keyboard("{F2}");
    await userEvent.keyboard("{Control>}a{/Control}99{Escape}");
    expect(cellOf(host, "p-002", "age").textContent).toBe("35");
    await userEvent.dblClick(cellOf(host, "p-002", "team"));
    await userEvent.selectOptions(
      cellOf(host, "p-002", "team").querySelector("select") as HTMLSelectElement,
      "Sales",
    );
    cellOf(host, "p-003", "email").focus();
    expect(cellOf(host, "p-002", "team").textContent).toBe("Sales");
    root.addEventListener("ok:data-grid:edit", (e) => e.preventDefault(), { once: true });
    await userEvent.dblClick(cellOf(host, "p-003", "remote"));
    await userEvent.click(cellOf(host, "p-003", "remote").querySelector("input") as HTMLElement);
    await userEvent.keyboard("{Enter}");
    expect(cellOf(host, "p-003", "remote").textContent).toBe("true");
    // Not editable.
    await userEvent.dblClick(cellOf(host, "p-001", "email"));
    expect(cellOf(host, "p-001", "email").querySelector("input")).toBeNull();
  });

  it("row editing edits every editable cell; focus inside the row keeps it open", async () => {
    const { host, root } = setupAdvanced();
    root.setAttribute("data-ok-edit-mode", "row");
    await userEvent.dblClick(cellOf(host, "p-004", "age"));
    const row = host.querySelector('[data-ok-row-id="p-004"]') as HTMLElement;
    expect(row.hasAttribute("data-ok-editing")).toBe(true);
    expect(row.querySelectorAll("[data-ok-data-grid-edit-input]")).toHaveLength(6);
    await userEvent.tab();
    expect(row.querySelectorAll("[data-ok-data-grid-edit-input]")).toHaveLength(6);
    await userEvent.keyboard("{Enter}");
    expect(row.hasAttribute("data-ok-editing")).toBe(false);
  });

  it("print, value options from untrusted markup", async () => {
    const print = vi.fn();
    const append = document.body.append.bind(document.body);
    vi.spyOn(document.body, "append").mockImplementation((...nodes) => {
      append(...nodes);
      for (const node of nodes)
        if (node instanceof HTMLIFrameElement) (node.contentWindow as Window).print = print;
    });
    const host = mount(
      ADVANCED.replace(/data-ok-value-options="[^"]*"/, 'data-ok-value-options="not json"'),
    );
    start();
    const root = host.querySelector<HTMLElement>("[data-ok-data-grid]") as HTMLElement;
    await userEvent.click(
      host.querySelector(`[data-ok-popover-open="${root.id}-export"]`) as HTMLElement,
    );
    await userEvent.click(
      host.querySelector(`#${root.id}-export [data-ok-data-grid-export="print"]`) as HTMLElement,
    );
    expect(print).toHaveBeenCalled();
    document.querySelector("iframe")?.remove();
    await userEvent.dblClick(cellOf(host, "p-001", "team"));
    expect(cellOf(host, "p-001", "team").querySelectorAll("option")).toHaveLength(0);
  });
});

describe("data grid runtime, phase 2 edges", () => {
  it("pins the checkbox column with left pins; clicks after a resize don't sort; empty edits; outside clicks", async () => {
    const host = mount(BASIC);
    start();
    const root = host.querySelector<HTMLElement>("[data-ok-data-grid]") as HTMLElement;
    const instance = runtime?.get<DataGridInstance>(root, "data-grid") as DataGridInstance;
    instance.setPinnedColumns({ left: ["age"] });
    expect(
      host
        .querySelector('[role="columnheader"][data-ok-field="__check__"]')
        ?.getAttribute("data-ok-pinned"),
    ).toBe("left");
    instance.setPinnedColumns({});
    expect(instance.pinnedColumns).toEqual({ left: [], right: [] });
    instance.setColumnWidth("age", 120);
    expect(instance.columnWidths).toEqual({ age: 120 });
    // A release that resized marks the header: its click doesn't sort.
    const age = header(host, "age");
    const handle = age.querySelector("[data-ok-data-grid-resize]") as HTMLElement;
    handle.dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, clientX: 10, button: 0 }),
    );
    document.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, clientX: 20 }));
    age.click();
    expect(age.getAttribute("aria-sort")).toBe("none");
    // Double click outside cells; a click in the filter panel outside its buttons.
    header(host, "firstName").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    (host.querySelector(`#${root.id}-filters [data-ok-data-grid-panel]`) as HTMLElement).click();
    expect(instance.filterModel.items).toEqual([]);
  });

  it("an emptied number shows nothing; print titles fall back to empty", async () => {
    const print = vi.fn();
    const append = document.body.append.bind(document.body);
    vi.spyOn(document.body, "append").mockImplementation((...nodes) => {
      append(...nodes);
      for (const node of nodes)
        if (node instanceof HTMLIFrameElement) (node.contentWindow as Window).print = print;
    });
    const host = mount(ADVANCED);
    start();
    const root = host.querySelector<HTMLElement>("[data-ok-data-grid]") as HTMLElement;
    const cell = host.querySelector(
      '[data-ok-row-id="p-001"] [data-ok-field="age"]',
    ) as HTMLElement;
    await userEvent.dblClick(cell);
    await userEvent.clear(cell.querySelector("input") as HTMLElement);
    await userEvent.keyboard("{Enter}");
    expect(cell.textContent).toBe("");
    host.querySelector('[role="grid"]')?.removeAttribute("aria-label");
    await userEvent.click(
      host.querySelector(`[data-ok-popover-open="${root.id}-export"]`) as HTMLElement,
    );
    await userEvent.click(
      host.querySelector(`#${root.id}-export [data-ok-data-grid-export="print"]`) as HTMLElement,
    );
    expect(document.querySelector("iframe")?.contentDocument?.title).toBe("");
    document.querySelector("iframe")?.remove();
  });

  it("turned-off features hide their parts", async () => {
    const host = mount(ADVANCED);
    start();
    const root = host.querySelector<HTMLElement>("[data-ok-data-grid]") as HTMLElement;
    for (const flag of ["resize", "reorder", "pinning"])
      root.setAttribute(`data-ok-disable-column-${flag}`, "");
    root.setAttribute("data-ok-disable-multiple-columns-filtering", "");
    await settle();
    const hidden = (selector: string) =>
      [...host.querySelectorAll<HTMLElement>(selector)].every((part) => part.hidden);
    expect(hidden("[data-ok-data-grid-resize]")).toBe(true);
    expect(hidden('[data-ok-data-grid-action="left"], [data-ok-data-grid-action="pin-left"]')).toBe(
      true,
    );
    expect(hidden("[data-ok-data-grid-filter-add]")).toBe(true);
  });
});

describe("data grid runtime, phase 3", () => {
  const LARGE = snippets.find(([path]) => path.endsWith("large-group.html"))?.[1] as string;
  const SERVER = snippets.find(([path]) => path.endsWith("server-group.html"))?.[1] as string;
  const people = (count: number, from = 0) =>
    Array.from({ length: count }, (_, i) => ({
      id: `c-${from + i + 1}`,
      firstName: `P${from + i + 1}`,
      lastName: "Doe",
      age: (i * 7) % 50,
      city: "Lima",
    }));
  const open = (html: string, height?: string) => {
    const host = mount(html);
    const root = host.querySelector<HTMLElement>("[data-ok-data-grid]") as HTMLElement;
    if (height) root.style.height = height;
    start();
    const instance = runtime?.get<DataGridInstance>(root, "data-grid") as DataGridInstance;
    const grid = root.querySelector<HTMLElement>('[role="grid"]') as HTMLElement;
    const body = root.querySelector<HTMLElement>("[data-ok-data-grid-body]") as HTMLElement;
    const rows = () => [...body.querySelectorAll<HTMLElement>(':scope > [role="row"]')];
    const scrollTo = async (top: number) => {
      grid.scrollTop = top;
      grid.dispatchEvent(new Event("scroll"));
      await settle();
    };
    return { host, root, instance, grid, body, rows, scrollTo };
  };

  it("setRows fills copies of the row template (text only), cell templates, raw values", async () => {
    const { host, root, instance, rows } = open(SERVER);
    const cell = document.createElement("template");
    cell.setAttribute("data-ok-data-grid-cell", "city");
    cell.innerHTML = '<b class="pin"></b><span data-ok-data-grid-value></span>';
    root.append(cell);
    instance.setRows([
      { id: "a", firstName: "<img src=x onerror=alert(1)>", lastName: null, age: 7, city: "Hue" },
    ]);
    const row = rows()[0] as HTMLElement;
    expect(row.getAttribute("data-ok-row-id")).toBe("a");
    const first = row.querySelector('[data-ok-field="firstName"]') as HTMLElement;
    expect(first.textContent).toBe("<img src=x onerror=alert(1)>");
    expect(first.querySelector("img")).toBeNull();
    expect(row.querySelector('[data-ok-field="lastName"]')?.textContent).toBe("");
    expect(row.querySelector('[data-ok-field="age"]')?.getAttribute("data-ok-value")).toBe("7");
    const city = row.querySelector('[data-ok-field="city"]') as HTMLElement;
    expect(city.querySelector(".pin")).not.toBeNull();
    expect(city.querySelector("[data-ok-data-grid-value]")?.textContent).toBe("Hue");
    expect(city.getAttribute("data-ok-text")).toBe("Hue");
    // Filtering and sorting read the new rows.
    instance.setRows(people(25));
    expect(rows()).toHaveLength(10);
    expect(host.querySelector("[data-ok-table-pagination-displayed]")?.textContent).toBe(
      "1–10 of 25",
    );
    header(host, "firstName").click();
    header(host, "firstName").click();
    await settle();
    expect(visible(host)[0]).toBe("P25");
    instance.setRows([]);
    await settle();
    const overlay = host.querySelector<HTMLElement>("[data-ok-data-grid-overlay]") as HTMLElement;
    expect(overlay.hidden).toBe(false);
    expect(overlay.textContent).toBe("No rows");
    await expectNoAxeViolations(host);
  });

  it("setRows without a row template keeps the markup rows", () => {
    const { host, instance } = setup();
    instance.setRows(people(3));
    expect(host.querySelectorAll('[data-ok-data-grid-body] > [role="row"]')).toHaveLength(10);
  });

  it("virtualizes a bounded grid: a window of rows, spacers; off with the flag", async () => {
    const { root, instance, grid, body, rows, scrollTo } = open(LARGE, "400px");
    instance.setRows(people(1000));
    await settle();
    expect(grid.getAttribute("aria-rowcount")).toBe("1001");
    expect(rows().length).toBeGreaterThan(5);
    expect(rows().length).toBeLessThan(30);
    await scrollTo(52 * 500);
    const indexes = rows().map((row) => Number(row.getAttribute("aria-rowindex")));
    expect(Math.min(...indexes)).toBeGreaterThan(400);
    expect(Math.max(...indexes)).toBeLessThan(600);
    expect(Number.parseFloat(getComputedStyle(body).paddingTop)).toBeGreaterThan(10_000);
    expect(body.style.getPropertyValue("--_ok-data-grid-after")).not.toBe("");
    root.setAttribute("data-ok-disable-virtualization", "");
    await scrollTo(52 * 500 + 10);
    expect(rows()).toHaveLength(1000);
    expect(body.style.getPropertyValue("--_ok-data-grid-before")).toBe("");
  });

  it("ok:data-grid:scrollend fires once per row count", async () => {
    const { root, instance, scrollTo } = open(LARGE, "300px");
    const ends: unknown[] = [];
    root.addEventListener("ok:data-grid:scrollend", (e) => ends.push((e as CustomEvent).detail));
    instance.setRows(people(50));
    await settle();
    await scrollTo(100);
    expect(ends).toHaveLength(0);
    await scrollTo(100_000);
    await scrollTo(100_001);
    expect(ends).toEqual([{ visibleRowsCount: 50 }]);
    root.setAttribute("data-ok-scroll-end-threshold", "100000");
    instance.setRows(people(80));
    await scrollTo(0);
    expect(ends).toEqual([{ visibleRowsCount: 50 }, { visibleRowsCount: 80 }]);
  });

  it("server modes: no local sort or filter; rowCount drives the pagination", async () => {
    const host = mount(BASIC);
    const root = host.querySelector<HTMLElement>("[data-ok-data-grid]") as HTMLElement;
    root.setAttribute("data-ok-sorting-mode", "server");
    root.setAttribute("data-ok-filter-mode", "server");
    root.setAttribute("data-ok-pagination-mode", "server");
    root.setAttribute("data-ok-row-count", "100");
    start();
    await settle();
    const before = visible(host);
    expect(before).toHaveLength(20);
    expect(host.querySelector("[data-ok-table-pagination-displayed]")?.textContent).toMatch(
      /of 100$/,
    );
    const sorts: unknown[] = [];
    root.addEventListener("ok:data-grid:sort", (e) => sorts.push((e as CustomEvent).detail));
    header(host, "firstName").click();
    await settle();
    expect(sorts).toHaveLength(1);
    expect(visible(host)).toEqual(before);
    root.removeAttribute("data-ok-row-count");
    const instance = runtime?.get<DataGridInstance>(root, "data-grid") as DataGridInstance;
    instance.setFilterModel({ items: [{ field: "firstName", operator: "equals", value: "x" }] });
    await settle();
    expect(visible(host)).toHaveLength(20);
    expect(host.querySelector("[data-ok-table-pagination-displayed]")?.textContent).toMatch(
      /of 20$/,
    );
  });

  it("data-ok-loading: busy grid and overlay, no empty overlay", async () => {
    const { host, root, grid } = open(SERVER);
    const loading = host.querySelector<HTMLElement>("[data-ok-data-grid-loading]") as HTMLElement;
    const empty = host.querySelector<HTMLElement>("[data-ok-data-grid-overlay]") as HTMLElement;
    expect(loading.hidden).toBe(true);
    expect(empty.hidden).toBe(false);
    root.setAttribute("data-ok-loading", "");
    await settle();
    expect(grid.getAttribute("aria-busy")).toBe("true");
    expect(loading.hidden).toBe(false);
    expect(empty.hidden).toBe(true);
    await expectNoAxeViolations(host);
    root.removeAttribute("data-ok-loading");
    await settle();
    expect(grid.hasAttribute("aria-busy")).toBe(false);
    expect(loading.hidden).toBe(true);
  });

  it("setDataSource: loads pages, asks again on sort, caches, reports errors, stops", async () => {
    const { host, root, instance, grid } = open(SERVER);
    const all = people(30);
    const getRows = vi.fn((params: GridGetRowsParams) => {
      const sorted = params.sortModel[0]?.sort === "desc" ? [...all].reverse() : all;
      const { page, pageSize } = params.paginationModel ?? { page: 0, pageSize: 30 };
      return Promise.resolve({
        rows: sorted.slice(page * pageSize, (page + 1) * pageSize),
        rowCount: all.length,
      });
    });
    instance.setDataSource({ getRows });
    expect(root.hasAttribute("data-ok-loading")).toBe(true);
    await settle();
    await settle();
    expect(root.hasAttribute("data-ok-loading")).toBe(false);
    expect(grid.hasAttribute("aria-busy")).toBe(false);
    expect(getRows).toHaveBeenCalledWith({
      sortModel: [],
      filterModel: { items: [] },
      paginationModel: { page: 0, pageSize: 10 },
    });
    expect(visible(host)).toHaveLength(10);
    expect(host.querySelector("[data-ok-table-pagination-displayed]")?.textContent).toBe(
      "1–10 of 30",
    );
    header(host, "firstName").click();
    await settle();
    header(host, "firstName").click();
    await settle();
    await settle();
    expect(visible(host)[0]).toBe("P30");
    const calls = getRows.mock.calls.length;
    header(host, "firstName").click();
    await settle();
    expect(getRows).toHaveBeenCalledTimes(calls);
    expect(visible(host)[0]).toBe("P1");
    (host.querySelector('[aria-label="Go to next page"]') as HTMLElement).click();
    await settle();
    await settle();
    expect(getRows).toHaveBeenLastCalledWith(
      expect.objectContaining({ paginationModel: { page: 1, pageSize: 10 } }),
    );
    expect(visible(host)[0]).toBe("P11");
    expect(grid.getAttribute("aria-rowcount")).toBe("31");
    expect(
      host.querySelector('[data-ok-data-grid-body] > [role="row"]')?.getAttribute("aria-rowindex"),
    ).toBe("12");
    // The page stays (it isn't clamped to the rows of one page).
    instance.setRows(people(10, 10));
    expect(host.querySelector("[data-ok-table-pagination-displayed]")?.textContent).toBe(
      "11–20 of 30",
    );

    const errors: unknown[] = [];
    root.addEventListener("ok:data-grid:datasourceerror", (e) =>
      errors.push((e as CustomEvent).detail),
    );
    instance.setDataSource({ getRows: () => Promise.reject(new Error("down")) });
    await settle();
    expect(errors).toEqual([{ error: new Error("down") }]);
    expect(root.hasAttribute("data-ok-loading")).toBe(false);

    // A stale response is dropped.
    let resolveFirst: (value: { rows: Record<string, unknown>[] }) => void = () => {};
    instance.setDataSource({
      getRows: () =>
        new Promise((resolve) => {
          resolveFirst = resolve;
        }),
    });
    instance.setDataSource({ getRows: () => Promise.resolve({ rows: people(2, 100) }) });
    await settle();
    resolveFirst({ rows: people(5) });
    await settle();
    expect(visible(host)).toEqual(["P101", "P102"]);

    instance.setDataSource(null);
    instance.setRows(people(3));
    header(host, "firstName").click();
    await settle();
    expect(visible(host)).toEqual(["P1", "P2", "P3"]);
  });
});

describe("data grid runtime, phase 4", () => {
  const SPANS = snippets.find(([path]) => path.endsWith("layout-spans.html"))?.[1] as string;
  const TASKS = snippets.find(([path]) => path.endsWith("layout-tasks.html"))?.[1] as string;
  const PRODUCTS = snippets.find(([path]) => path.endsWith("validation-group.html"))?.[1] as string;
  const LARGE = snippets.find(([path]) => path.endsWith("large-group.html"))?.[1] as string;
  const open = (html: string, before?: (root: HTMLElement) => void) => {
    const host = mount(html);
    const root = host.querySelector<HTMLElement>("[data-ok-data-grid]") as HTMLElement;
    before?.(root);
    // One runtime per test: a second grid joins it.
    if (!runtime) start();
    const instance = runtime?.getOrCreate<DataGridInstance>(root, "data-grid") as DataGridInstance;
    const grid = root.querySelector<HTMLElement>('[role="grid"]') as HTMLElement;
    const row = (id: string) =>
      root.querySelector<HTMLElement>(`[data-ok-row-id="${id}"]`) as HTMLElement;
    const cell = (id: string, field: string) =>
      row(id).querySelector<HTMLElement>(`[data-ok-field="${field}"]`) as HTMLElement;
    const events: [string, unknown][] = [];
    for (const name of [
      "rowclick",
      "rowdoubleclick",
      "cellclick",
      "celldoubleclick",
      "columnheaderclick",
      "editstart",
      "editstop",
      "selection",
      "resize",
    ])
      root.addEventListener(`ok:data-grid:${name}`, (e) =>
        events.push([name, (e as CustomEvent).detail]),
      );
    return { host, root, instance, grid, row, cell, events };
  };
  const key = (target: Element, k: string, init: KeyboardEventInit = {}) =>
    target.dispatchEvent(
      new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }),
    );

  it("single selection; unselectable rows; select all on the page; pruning on new rows", async () => {
    const { host, root, instance, row, cell, events } = open(TASKS);
    expect(root.querySelector('[role="grid"]')?.hasAttribute("aria-multiselectable")).toBe(false);
    cell("t-1", "owner").click();
    cell("t-3", "owner").click();
    expect(instance.selection).toEqual(["t-3"]);
    cell("t-3", "owner").click();
    expect(instance.selection).toEqual([]);
    expect((row("t-2").querySelector("input") as HTMLInputElement).disabled).toBe(true);
    cell("t-2", "owner").click();
    expect(instance.selection).toEqual([]);
    key(cell("t-1", "owner"), "a", { ctrlKey: true });
    expect(events.filter(([n]) => n === "selection")).toHaveLength(3);
    // Multiple again: select all covers the selectable rows (of this page only, when asked).
    root.removeAttribute("data-ok-disable-multiple-row-selection");
    await settle();
    expect(root.querySelector('[role="grid"]')?.getAttribute("aria-multiselectable")).toBe("true");
    key(cell("t-1", "owner"), "a", { ctrlKey: true });
    expect(instance.selection).toEqual(["t-1", "t-3", "t-4", "t-5"]);
    expect(host).toBeTruthy();

    const basic = open(BASIC, (r) => r.setAttribute("data-ok-checkbox-selection-visible-only", ""));
    const all = basic.root.querySelector<HTMLInputElement>(
      '[role="columnheader"] input[type="checkbox"]',
    ) as HTMLInputElement;
    all.click();
    expect(basic.instance.selection).toHaveLength(10);
  });

  it("new rows prune the selection unless kept", () => {
    const LARGE_ROWS = (n: number) =>
      Array.from({ length: n }, (_, i) => ({
        id: `c-${i}`,
        firstName: "A",
        lastName: "B",
        age: i,
        city: "C",
      }));
    const pruned = open(LARGE);
    pruned.instance.setRows(LARGE_ROWS(3));
    pruned.instance.setSelection(["c-1", "c-2"]);
    pruned.instance.setRows(LARGE_ROWS(2));
    expect(pruned.instance.selection).toEqual(["c-1"]);
    const kept = open(LARGE, (r) => r.setAttribute("data-ok-keep-non-existent-rows-selected", ""));
    kept.instance.setRows(LARGE_ROWS(3));
    kept.instance.setSelection(["c-1", "c-2"]);
    kept.instance.setRows(LARGE_ROWS(2));
    expect(kept.instance.selection).toEqual(["c-1", "c-2"]);
  });

  it("column spans from the markup; row spans computed (and cleared)", async () => {
    const { root, cell, instance } = open(SPANS);
    expect(cell("total", "region").style.getPropertyValue("--_ok-data-grid-colspan")).toBe("3");
    expect(cell("total", "team").hidden).toBe(true);
    expect(cell("b-1", "region").getAttribute("aria-rowspan")).toBe("4");
    expect(cell("b-1", "region").style.getPropertyValue("--_ok-data-grid-rowspan")).toBe("4");
    expect(cell("b-2", "region").hasAttribute("data-ok-covered")).toBe(true);
    expect(cell("b-1", "team").getAttribute("aria-rowspan")).toBe("2");
    // Hiding a column keeps covered cells hidden.
    instance.setColumnVisibilityModel({ item: false });
    expect(cell("total", "team").hidden).toBe(true);
    root.removeAttribute("data-ok-row-spanning");
    instance.setSortModel([]);
    expect(cell("b-1", "region").hasAttribute("aria-rowspan")).toBe(false);
    expect(cell("b-2", "region").hasAttribute("data-ok-covered")).toBe(false);
    await expectNoAxeViolations(root.parentElement as HTMLElement);
  });

  it("row heights, spacing and the grid's row height (with the density)", async () => {
    const { root, row } = open(TASKS, (r) => {
      r.setAttribute("data-ok-row-height", "40");
      const first = r.querySelector('[data-ok-row-id="t-2"]') as HTMLElement;
      first.setAttribute("data-ok-row-height", "70");
      first.setAttribute("data-ok-spacing-top", "4");
      first.setAttribute("data-ok-spacing-bottom", "6");
    });
    expect(root.style.getPropertyValue("--_ok-data-grid-row-height")).toBe("40px");
    root.setAttribute("data-ok-density", "compact");
    await settle();
    expect(root.style.getPropertyValue("--_ok-data-grid-row-height")).toBe("28px");
    expect(row("t-2").style.getPropertyValue("--_ok-data-grid-row-height")).toBe("70px");
    expect(row("t-2").style.getPropertyValue("--_ok-data-grid-spacing-top")).toBe("4px");
    expect(row("t-2").getBoundingClientRect().height).toBe(71);
    expect(row("t-1").getAttribute("data-ok-row-height")).toBe("auto");
    root.removeAttribute("data-ok-row-height");
    await settle();
    expect(root.style.getPropertyValue("--_ok-data-grid-row-height")).toBe("");
  });

  it("virtualizes rows of their own height", async () => {
    const { root, instance, grid } = open(LARGE, (r) => {
      r.style.height = "400px";
      const template = r.querySelector("template") as HTMLTemplateElement;
      (template.content.firstElementChild as HTMLElement).setAttribute("data-ok-row-height", "80");
    });
    instance.setRows(
      Array.from({ length: 300 }, (_, i) => ({
        id: `c-${i}`,
        firstName: "A",
        lastName: "B",
        age: i,
        city: "C",
      })),
    );
    await settle();
    const rendered = () => root.querySelectorAll('[data-ok-data-grid-body] > [role="row"]');
    expect(rendered().length).toBeLessThan(15);
    grid.scrollTop = 81 * 100;
    grid.dispatchEvent(new Event("scroll"));
    await settle();
    const first = Number(rendered()[0]?.getAttribute("aria-rowindex"));
    expect(first).toBeGreaterThan(90);
    expect(first).toBeLessThan(110);
    instance.scrollToIndexes({ rowIndex: 0 });
    expect(grid.scrollTop).toBe(0);
    instance.scrollToIndexes({ rowIndex: 50, colIndex: 4 });
    expect(grid.scrollTop).toBeGreaterThan(0);
    instance.scrollToIndexes({ rowIndex: 999 });
  });

  it("click, double click and header events", () => {
    const { cell, events, root } = open(PRODUCTS);
    cell("p-1", "stock").click();
    cell("p-1", "stock").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    (root.querySelector('[role="columnheader"][data-ok-field="price"]') as HTMLElement).click();
    expect(events.map(([n]) => n)).toEqual([
      "rowclick",
      "cellclick",
      "rowdoubleclick",
      "celldoubleclick",
      "editstart",
      "columnheaderclick",
    ]);
    expect(events[1]?.[1]).toEqual({ id: "p-1", field: "stock", value: "12" });
    expect(events[4]?.[1]).toEqual({ id: "p-1", field: "stock", reason: "cellDoubleClick" });
  });

  it("editing: locked cells, typing, validation, formats, start and stop events", async () => {
    const { cell, events, instance, root } = open(PRODUCTS);
    root.addEventListener("ok:data-grid:validate", (e) => {
      const detail = (e as CustomEvent<{ field: string; value: unknown; error?: unknown }>).detail;
      if (detail.field === "price" && !(Number(detail.value) > 0)) detail.error = "Above 0";
      if (detail.field === "stock" && Number(detail.value) > 999) detail.error = true;
    });
    cell("p-5", "stock").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(cell("p-5", "stock").querySelector("input")).toBeNull();

    instance.setValueFormatter("price", (v) => `€${v}`);
    cell("p-1", "price").focus();
    key(cell("p-1", "price"), "0");
    const input = cell("p-1", "price").querySelector("input") as HTMLInputElement;
    expect(input.value).toBe("0");
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(input.getAttribute("aria-invalid")).toBe("true");
    const message = cell("p-1", "price").querySelector("[data-ok-data-grid-edit-error]");
    expect(message?.textContent).toBe("Above 0");
    expect(input.getAttribute("aria-describedby")).toBe(message?.id);
    key(input, "Enter");
    expect(cell("p-1", "price").querySelector("input")).toBe(input);
    input.value = "15";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(cell("p-1", "price").querySelector("[data-ok-data-grid-edit-error]")).toBeNull();
    key(input, "Enter");
    expect(cell("p-1", "price").textContent).toBe("€15");
    expect(events.filter(([n]) => n.startsWith("edit"))).toEqual([
      ["editstart", { id: "p-1", field: "price", reason: "printableKeyDown" }],
      ["editstop", { id: "p-1", field: "price", reason: "enterKeyDown" }],
    ]);

    // An error without a message marks the field only; Escape still cancels.
    cell("p-2", "stock").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    const stock = cell("p-2", "stock").querySelector("input") as HTMLInputElement;
    stock.value = "5000";
    stock.dispatchEvent(new Event("input", { bubbles: true }));
    expect(stock.getAttribute("aria-invalid")).toBe("true");
    expect(stock.hasAttribute("aria-describedby")).toBe(false);
    key(stock, "Escape");
    expect(cell("p-2", "stock").textContent).toBe("40");
    expect(events.at(-1)).toEqual([
      "editstop",
      { id: "p-2", field: "stock", reason: "escapeKeyDown" },
    ]);

    // data-ok-format on a header formats edited values (locale from the page).
    instance.setValueFormatter("price", null);
    const priceHeader = root.querySelector(
      '[role="columnheader"][data-ok-field="price"]',
    ) as HTMLElement;
    priceHeader.setAttribute("data-ok-format", "currency");
    priceHeader.setAttribute("data-ok-format-options", '{"currency":"EUR"}');
    document.documentElement.lang = "en-US";
    cell("p-3", "price").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    const price = cell("p-3", "price").querySelector("input") as HTMLInputElement;
    price.value = "7";
    key(price, "Enter");
    expect(cell("p-3", "price").textContent).toBe("€7.00");
    document.documentElement.removeAttribute("lang");

    // Row editing: one start and stop for the row.
    root.setAttribute("data-ok-edit-mode", "row");
    cell("p-4", "name").focus();
    key(cell("p-4", "name"), "Enter");
    expect(events.at(-1)).toEqual(["editstart", { id: "p-4", reason: "enterKeyDown" }]);
    key(cell("p-4", "name").querySelector("input") as HTMLInputElement, "Enter");
    expect(events.at(-1)).toEqual(["editstop", { id: "p-4", reason: "enterKeyDown" }]);
  });

  it("setRows formats with data-ok-format and formatters", () => {
    const { root, instance, cell } = open(LARGE, (r) => {
      const age = r.querySelector('[role="columnheader"][data-ok-field="age"]') as HTMLElement;
      age.setAttribute("data-ok-format", "number");
      age.setAttribute("data-ok-format-options", '{"minimumFractionDigits":1}');
    });
    instance.setValueFormatter("city", (v) => String(v).toUpperCase());
    instance.setRows([{ id: "x", firstName: "A", lastName: "B", age: 1200, city: "lima" }]);
    expect(cell("x", "age").textContent).toMatch(/1.200.0/);
    expect(cell("x", "age").getAttribute("data-ok-value")).toBe("1200");
    expect(cell("x", "city").textContent).toBe("LIMA");
    expect(cell("x", "city").getAttribute("data-ok-value")).toBe("lima");
    expect(root).toBeTruthy();
  });

  it("filters: isAnyOf, custom operators, search options and accents", async () => {
    const { root, instance, host } = open(BASIC);
    const panel = document.getElementById("grid-basic-filters") as HTMLElement;
    const [field, operator] = [...panel.querySelectorAll("select")] as HTMLSelectElement[];
    const input = panel.querySelector("input") as HTMLInputElement;
    (field as HTMLSelectElement).value = "firstName";
    (field as HTMLSelectElement).dispatchEvent(new Event("change", { bubbles: true }));
    (operator as HTMLSelectElement).value = "isAnyOf";
    operator?.dispatchEvent(new Event("change", { bubbles: true }));
    // isAnyOf: chips (an Autocomplete from the panel's template) replace the text field.
    const chips = panel.querySelector<HTMLElement>("[data-ok-autocomplete]") as HTMLElement;
    expect(chips.querySelector("input")?.id).toBe(input.id);
    runtime?.getOrCreate<AutocompleteInstance>(chips, "autocomplete")?.setValue(["ana", "bao"]);
    chips.dispatchEvent(new CustomEvent("ok:autocomplete:change", { bubbles: true }));
    await settle();
    expect(new Set(visible(host))).toEqual(new Set(["Ana", "Bao"]));

    instance.setFilterOperators("age", [
      {
        value: "atLeast",
        label: "at least",
        getApplyFilterFn: (item) => (item.value ? (v) => Number(v) >= Number(item.value) : null),
      },
      { value: "any", requiresValue: false, getApplyFilterFn: () => () => true },
    ]);
    (field as HTMLSelectElement).value = "age";
    field?.dispatchEvent(new Event("change", { bubbles: true }));
    expect([...(operator as HTMLSelectElement).options].map((o) => o.textContent)).toEqual([
      "at least",
      "any",
    ]);
    input.value = "50";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(instance.filterModel.items[0]).toEqual({
      field: "age",
      operator: "atLeast",
      value: "50",
    });
    expect(root.querySelector('[data-ok-data-grid-body] > [role="row"]')).not.toBeNull();
    (operator as HTMLSelectElement).value = "any";
    operator?.dispatchEvent(new Event("change", { bubbles: true }));
    expect(input.disabled).toBe(true);

    // Search: or, accents, hidden columns.
    instance.setFilterModel({ items: [], quickFilterValues: ["ana", "bao"] });
    expect(visible(host)).toHaveLength(0);
    root.setAttribute("data-ok-quick-filter-logic-operator", "or");
    instance.setFilterModel({ items: [], quickFilterValues: ["ana", "bao"] });
    expect(visible(host).length).toBeGreaterThan(1);
    root.setAttribute("data-ok-ignore-diacritics", "");
    instance.setFilterModel({ items: [], quickFilterValues: ["ánà"] });
    expect(visible(host).length).toBeGreaterThan(0);
    root.setAttribute("data-ok-quick-filter-exclude-hidden-columns", "");
    instance.setColumnVisibilityModel({ firstName: false, fullName: false });
    instance.setFilterModel({ items: [], quickFilterValues: ["ana"] });
    expect(visible(host, "lastName")).toHaveLength(0);
  });

  it("autosize: instance, double click, on mount", async () => {
    const { instance, events, root } = open(BASIC);
    instance.autosizeColumns({ columns: ["firstName"], includeHeaders: false });
    expect(events.at(-1)?.[0]).toBe("resize");
    expect(instance.columnWidths["firstName"]).toBeGreaterThan(30);
    const handle = root.querySelector(
      '[role="columnheader"][data-ok-field="lastName"] [data-ok-data-grid-resize]',
    ) as HTMLElement;
    handle.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(instance.columnWidths["lastName"]).toBeGreaterThan(30);
    const mounted = open(TASKS);
    expect(Object.keys(mounted.instance.columnWidths).length).toBeGreaterThan(2);
    await document.fonts.ready;
    await settle();
  });

  it("state, CSV options and print", async () => {
    const { instance, root, host } = open(BASIC);
    instance.setSortModel([{ field: "age", sort: "desc" }]);
    instance.setColumnWidth("firstName", 210);
    const state = instance.exportState();
    expect(state).toMatchObject({
      sorting: { sortModel: [{ field: "age", sort: "desc" }] },
      pagination: { paginationModel: { page: 0, pageSize: 10 } },
      columns: { dimensions: { firstName: { width: 210 } } },
      density: "standard",
    });
    instance.restoreState({
      sorting: { sortModel: [] },
      filter: { filterModel: { items: [] } },
      pagination: { paginationModel: { page: 1, pageSize: 5 } },
      columns: {
        columnVisibilityModel: { age: false },
        orderedFields: ["lastName"],
        dimensions: {},
      },
      pinnedColumns: { left: ["lastName"] },
      density: "compact",
      constructor: { bad: 1 },
    });
    expect(root.getAttribute("data-ok-density")).toBe("compact");
    expect(instance.columnOrder[0]).toBe("lastName");
    expect(instance.pinnedColumns.left).toEqual(["lastName"]);
    expect(header(host, "age").hidden).toBe(true);
    expect(host.querySelector("[data-ok-table-pagination-displayed]")?.textContent).toBe(
      "6–10 of 20",
    );
    instance.restoreState("nope");

    expect(
      instance
        .toCsv({ fields: ["age", "id"], delimiter: ";", utf8WithBom: false })
        .split("\r\n")[0],
    ).toBe("Age;ID");
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:x");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    let name = "";
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      name = this.download;
    });
    instance.exportCsv({ fileName: "people-2026" });
    expect(createObjectURL).toHaveBeenCalled();
    expect(name).toBe("people-2026.csv");

    let copy = "";
    const append = document.body.append.bind(document.body);
    vi.spyOn(document.body, "append").mockImplementation((...nodes) => {
      append(...nodes);
      for (const node of nodes)
        if (node instanceof HTMLIFrameElement)
          (node.contentWindow as Window).print = () => {
            copy = (node.contentDocument as Document).body.innerHTML;
          };
    });
    instance.print({ fields: ["firstName"], allColumns: true, fileName: "People" });
    // Every row of every page; no toolbar, footer or other columns.
    expect(copy.match(/role="row"/g)).toHaveLength(21);
    expect(copy).not.toContain("data-ok-data-grid-toolbar");
    expect(copy).not.toContain('data-ok-field="lastName"');
    document.querySelector("iframe")?.remove();
    instance.print();
    expect(copy).toContain('data-ok-field="lastName"');
    document.querySelector("iframe")?.remove();
  });

  it("setLocaleText: operators, overlays and the pagination range", async () => {
    const { instance, host } = open(BASIC);
    instance.setLocaleText(viVN);
    const operator = document.querySelectorAll<HTMLSelectElement>("#grid-basic-filters select")[1];
    expect(operator?.options[0]?.textContent).toBe("chứa");
    expect(host.querySelector("[data-ok-table-pagination-displayed]")?.textContent).toBe(
      "1–10 trên 20",
    );
    instance.setFilterModel({ items: [], quickFilterValues: ["zzzz"] });
    expect(host.querySelector("[data-ok-data-grid-overlay]")?.textContent).toBe(
      "Không tìm thấy kết quả.",
    );
    instance.setLocaleText({});
    expect(host.querySelector("[data-ok-table-pagination-displayed]")?.textContent).toMatch(/of/);
  });

  it("header tooltips move with their headers; right to left keys", () => {
    const { root, instance } = open(TASKS, (r) => r.setAttribute("dir", "rtl"));
    instance.setColumnOrder(["status", "title"]);
    const headerRow = root.querySelector('[data-ok-data-grid-header] [role="row"]') as HTMLElement;
    const status = headerRow.querySelector('[data-ok-field="status"]') as HTMLElement;
    expect(status.nextElementSibling?.id).toBe(status.getAttribute("aria-describedby"));
    const first = root.querySelector(
      '[data-ok-row-id="t-1"] [data-ok-field="owner"]',
    ) as HTMLElement;
    first.focus();
    key(first, "ArrowLeft");
    expect(document.activeElement?.getAttribute("data-ok-field")).not.toBe("owner");
  });
});

describe("data grid runtime, phase 4 edges", () => {
  const find = (name: string) => snippets.find(([path]) => path.endsWith(name))?.[1] as string;
  const LARGE = find("large-group.html");
  const ADVANCED = find("advanced-group.html");
  const TASKS = find("layout-tasks.html");
  const PRODUCTS = find("validation-group.html");
  const open = (html: string, before?: (root: HTMLElement) => void) => {
    const host = mount(html);
    const root = host.querySelector<HTMLElement>("[data-ok-data-grid]") as HTMLElement;
    before?.(root);
    if (!runtime) start();
    const instance = runtime?.getOrCreate<DataGridInstance>(root, "data-grid") as DataGridInstance;
    const grid = root.querySelector<HTMLElement>('[role="grid"]') as HTMLElement;
    const cell = (id: string, field: string) =>
      root.querySelector<HTMLElement>(
        `[data-ok-row-id="${id}"] [data-ok-field="${field}"]`,
      ) as HTMLElement;
    return { host, root, instance, grid, cell };
  };
  const key = (target: Element, k: string) =>
    target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  const customers = (n: number) =>
    Array.from({ length: n }, (_, i) => ({
      id: `c-${i}`,
      firstName: "A",
      lastName: "B",
      age: i,
      city: "Lima",
    }));
  const scroll = async (grid: HTMLElement, top: number) => {
    grid.scrollTop = top;
    grid.dispatchEvent(new Event("scroll"));
    await settle();
  };

  it("auto rows, row spans in the window (uniform and per-row heights), scrolling to indexes", async () => {
    for (const height of ["auto", ""]) {
      const { root, instance, grid } = open(LARGE, (r) => {
        r.style.height = "300px";
        r.style.width = "300px";
        r.setAttribute("data-ok-row-spanning", "");
        const row = (r.querySelector("template") as HTMLTemplateElement).content
          .firstElementChild as HTMLElement;
        if (height) row.setAttribute("data-ok-row-height", height);
      });
      instance.setRows(customers(200));
      await settle();
      await scroll(grid, 4000);
      // Every city is the same: the window starts at the span's first row.
      const first = root.querySelector('[data-ok-data-grid-body] > [role="row"]');
      expect(first?.getAttribute("aria-rowindex")).toBe("2");
      instance.scrollToIndexes({ rowIndex: 150 });
      expect(grid.scrollTop).toBeGreaterThan(4000);
      instance.scrollToIndexes({ rowIndex: 1 });
      expect(grid.scrollTop).toBeLessThan(200);
      grid.scrollLeft = 400;
      instance.scrollToIndexes({ colIndex: 0 });
      expect(grid.scrollLeft).toBe(0);
      instance.scrollToIndexes({ colIndex: 4 });
      expect(grid.scrollLeft).toBeGreaterThan(0);
      instance.scrollToIndexes({ colIndex: 1 });
      runtime?.stop();
      runtime = undefined;
      resetPage();
    }
  });

  it("templates with checkboxes; data sources without pages; stale errors", async () => {
    const { root, instance } = open(BASIC, (r) => {
      const template = document.createElement("template");
      template.setAttribute("data-ok-data-grid-row", "");
      const row = (
        r.querySelector('[data-ok-data-grid-body] > [role="row"]') as HTMLElement
      ).cloneNode(true) as HTMLElement;
      const second = row.querySelector('[role="gridcell"][aria-colindex="2"]') as HTMLElement;
      second.setAttribute("aria-colspan", "x");
      template.content.append(row);
      r.append(template);
    });
    instance.setRows([{ id: "n", firstName: "New" }]);
    expect(root.querySelectorAll('[data-ok-data-grid-body] > [role="row"]')).toHaveLength(1);

    const large = open(LARGE);
    const errors: unknown[] = [];
    large.root.addEventListener("ok:data-grid:datasourceerror", (e) => errors.push(e));
    let fail: (reason: unknown) => void = () => {};
    const getRows = vi.fn(
      () =>
        new Promise<never>((_, reject) => {
          fail = reject;
        }),
    );
    large.instance.setDataSource({ getRows });
    expect(getRows).toHaveBeenCalledWith(
      expect.objectContaining({ paginationModel: { page: 0, pageSize: 0 } }),
    );
    large.instance.setDataSource({ getRows: () => Promise.resolve({ rows: [] }) });
    fail(new Error("late"));
    await settle();
    expect(errors).toHaveLength(0);
    expect(large.instance.exportState().pagination?.paginationModel?.pageSize).toBe(-1);
  });

  it("editing edges: typed checkboxes and selects, grids without an id, formats without options", async () => {
    const adv = open(ADVANCED);
    const remote = adv.root.querySelector(
      '[data-ok-data-grid-body] [data-ok-field="remote"]',
    ) as HTMLElement;
    remote.focus();
    key(remote, "x");
    expect(remote.querySelector("input")?.type).toBe("checkbox");
    key(remote.querySelector("input") as Element, "Escape");
    const team = adv.root.querySelector(
      '[data-ok-data-grid-body] [data-ok-field="team"]',
    ) as HTMLElement;
    team.focus();
    key(team, "x");
    expect(team.querySelector("select")).not.toBeNull();
    key(team.querySelector("select") as Element, "Escape");
    runtime?.stop();
    runtime = undefined;
    resetPage();

    const { root, cell } = open(PRODUCTS, (r) => {
      r.removeAttribute("id");
      const price = r.querySelector('[role="columnheader"][data-ok-field="price"]') as HTMLElement;
      price.setAttribute("data-ok-format", "number");
    });
    root.addEventListener("ok:data-grid:validate", (e) => {
      (e as CustomEvent<{ error?: string }>).detail.error = "No";
    });
    cell("p-1", "price").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    const input = cell("p-1", "price").querySelector("input") as HTMLInputElement;
    input.value = "3";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    expect(input.getAttribute("aria-describedby")).toBe("grid-p-1-price-error");
    key(input, "Escape");
  });

  it("state edges, labels without operators, operators for the current field, autosize after stop", async () => {
    const { instance, root } = open(BASIC);
    instance.restoreState({ pagination: { paginationModel: { pageSize: 5 } } });
    expect(instance.exportState().pagination?.paginationModel).toEqual({ page: 0, pageSize: 5 });
    instance.restoreState({
      pagination: { paginationModel: { page: 1 } },
      columns: { dimensions: { firstName: { width: 150 } } },
      pinnedColumns: { right: ["age"] },
    });
    expect(instance.columnWidths).toEqual({ firstName: 150 });
    expect(instance.exportState().pinnedColumns).toEqual({ left: [], right: ["age"] });
    instance.setLocaleText({ filterOperator: {} });
    const operator = document.querySelectorAll<HTMLSelectElement>("#grid-basic-filters select")[1];
    expect(operator?.options[0]?.textContent).toBe("contains");
    const field = document.querySelectorAll<HTMLSelectElement>("#grid-basic-filters select")[0];
    instance.setFilterOperators(field?.value as string, [
      { value: "x", getApplyFilterFn: () => null },
    ]);
    expect(operator?.options[0]?.textContent).toBe("x");
    instance.autosizeColumns({ columns: ["nope"] });
    expect(root).toBeTruthy();

    const tasks = open(TASKS);
    expect(tasks.instance).toBeTruthy();
    runtime?.stop();
    runtime = undefined;
    await document.fonts.ready;
    await settle();
  });
});

describe("data grid runtime, phase 5", () => {
  const find = (name: string) => String(snippets.find(([path]) => path.endsWith(name))?.[1]);
  const open = (html: string, before?: (root: HTMLElement) => void) => {
    const host = mount(html);
    const root = host.querySelector<HTMLElement>("[data-ok-data-grid]") as HTMLElement;
    before?.(root);
    if (!runtime) start();
    const instance = runtime?.getOrCreate<DataGridInstance>(root, "data-grid") as DataGridInstance;
    const main = root.querySelector<HTMLElement>("[data-ok-data-grid-main]") as HTMLElement;
    const row = (id: string) =>
      root.querySelector<HTMLElement>(`[role="row"][data-ok-row-id="${id}"]`) as HTMLElement;
    const events: [string, unknown][] = [];
    for (const name of ["expand", "detailpanel", "roworder", "datasourceerror", "order"])
      root.addEventListener(`ok:data-grid:${name}`, (e) =>
        events.push([name, (e as CustomEvent).detail]),
      );
    return { host, root, instance, main, row, events };
  };
  const key = (target: Element, k: string, init: KeyboardEventInit = {}) =>
    target.dispatchEvent(
      new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }),
    );
  const shownIds = (root: Element) =>
    [
      ...root.querySelectorAll(
        '[data-ok-data-grid-body] > [role="row"][data-ok-row-id]:not([hidden])',
      ),
    ].map((r) => r.getAttribute("data-ok-row-id"));

  it("tree data: toggles, keyboard, cancelable expand events, the instance", () => {
    const { root, instance, row, events } = open(find("tree-group.html"));
    expect(root.querySelector('[role="treegrid"]')).not.toBeNull();
    expect(shownIds(root)).toEqual(["m-1", "m-2", "m-5", "m-8", "m-9"]);
    (row("m-2").querySelector("[data-ok-data-grid-tree-toggle]") as HTMLElement).click();
    expect(shownIds(root)).toEqual(["m-1", "m-2", "m-3", "m-4", "m-5", "m-8", "m-9"]);
    expect(row("m-3").getAttribute("aria-level")).toBe("3");
    expect(
      row("m-2").querySelector("[data-ok-data-grid-tree-toggle]")?.getAttribute("aria-label"),
    ).toBe("hide children");
    const group = row("m-1").querySelector('[data-ok-field="__tree_data_group__"]') as HTMLElement;
    group.focus();
    key(group, "ArrowLeft");
    expect(shownIds(root)).toEqual(["m-1", "m-8", "m-9"]);
    root.addEventListener("ok:data-grid:expand", (e) => e.preventDefault(), { once: true });
    key(group, "ArrowRight");
    expect(shownIds(root)).toEqual(["m-1", "m-8", "m-9"]);
    instance.setRowChildrenExpansion("m-1", true);
    instance.setRowChildrenExpansion("nope", true);
    expect(shownIds(root)).toContain("m-2");
    expect(events.filter(([n]) => n === "expand").length).toBe(4);
    // Sorting orders siblings; filtering keeps ancestors.
    instance.setFilterModel({ items: [{ field: "city", operator: "equals", value: "Beirut" }] });
    expect(shownIds(root)).toEqual(["m-1", "m-5"]);
  });

  it("tree data from a server: rows from the template; children load on open", async () => {
    const tree = find("tree-group.html");
    const { root, instance, row, events } = open(tree, (r) => {
      const template = document.createElement("template");
      template.setAttribute("data-ok-data-grid-row", "");
      template.content.append(
        (r.querySelector('[data-ok-row-id="m-1"]') as HTMLElement).cloneNode(true),
      );
      r.append(template);
    });
    let fail = false;
    const getRows = vi.fn((params: GridGetRowsParams) =>
      fail
        ? Promise.reject(new Error("no"))
        : Promise.resolve({
            rows: params.groupKeys?.length
              ? [{ id: "k", name: "Kid", kids: 1, title: "T", city: "C" }]
              : [{ id: "p", name: "Parent", kids: 2, title: "T", city: "C" }],
          }),
    );
    instance.setDataSource({
      getRows,
      getChildrenCount: (r) => Number(r["kids"]),
      getGroupKey: (r) => String(r["name"]),
    });
    await settle();
    await settle();
    expect(row("p").querySelector("[data-ok-data-grid-tree-label]")?.textContent).toBe("Parent");
    expect(row("p").getAttribute("aria-expanded")).toBe("false");
    (row("p").querySelector("[data-ok-data-grid-tree-toggle]") as HTMLElement).click();
    await settle();
    await settle();
    expect(getRows).toHaveBeenLastCalledWith(expect.objectContaining({ groupKeys: ["Parent"] }));
    expect(row("k").getAttribute("data-ok-parent")).toBe("p");
    // A grandchild request carries every ancestor's key; a failure reports the error.
    fail = true;
    (row("k").querySelector("[data-ok-data-grid-tree-toggle]") as HTMLElement).click();
    expect(getRows).toHaveBeenLastCalledWith(
      expect.objectContaining({ groupKeys: ["Parent", "Kid"] }),
    );
    await settle();
    await settle();
    expect(events.some(([n]) => n === "datasourceerror")).toBe(true);
    expect(row("k").hasAttribute("aria-busy")).toBe(false);
    fail = false;
    // Failures report the error.
    (row("p").querySelector("[data-ok-data-grid-tree-toggle]") as HTMLElement).click();
    instance.setSortModel([]);
    fail = true;
    instance.setDataSource({ getRows, getChildrenCount: () => 1 });
    await settle();
    expect(root).toBeTruthy();
    expect(events.some(([n]) => n === "datasourceerror")).toBe(true);
  });

  it("master-detail: panels from templates; events; the instance", () => {
    const { root, instance, row, events } = open(find("detail-group.html"), (r) => {
      r.querySelector('template[data-ok-data-grid-detail="o-1002"]')?.setAttribute(
        "data-ok-detail-height",
        "90",
      );
    });
    const toggle = row("o-1001").querySelector("[data-ok-data-grid-detail-toggle]") as HTMLElement;
    toggle.click();
    const panel = row("o-1001").nextElementSibling as HTMLElement;
    expect(panel.getAttribute("data-ok-data-grid-detail")).toBe("");
    expect(panel.id).toBe("grid-orders-o-1001-detail");
    expect(toggle.getAttribute("aria-controls")).toBe(panel.id);
    expect(toggle.getAttribute("aria-label")).toBe("Collapse");
    expect(panel.textContent).toContain("Order o-1001");
    expect(
      panel.querySelector("[data-ok-data-grid-detail-content]")?.getAttribute("aria-colspan"),
    ).toBe("5");
    instance.toggleDetailPanel("o-1002");
    expect(row("o-1002").nextElementSibling?.getAttribute("data-ok-detail-height")).toBe("90");
    toggle.click();
    expect(row("o-1001").nextElementSibling?.hasAttribute("data-ok-data-grid-detail")).toBe(false);
    root.addEventListener("ok:data-grid:detailpanel", (e) => e.preventDefault(), { once: true });
    toggle.click();
    expect(row("o-1001").nextElementSibling?.hasAttribute("data-ok-data-grid-detail")).toBe(false);
    instance.toggleDetailPanel("nope");
    expect(events.filter(([n]) => n === "detailpanel")).toHaveLength(4);
  });

  it("row reordering: Alt + arrows; cancelable; announced; off while sorted", () => {
    const { root, instance, row, events } = open(find("ordering-group.html"));
    const handle = row("a-1").querySelector("[data-ok-data-grid-reorder-handle]") as HTMLElement;
    handle.focus();
    key(handle, "ArrowDown", { altKey: true });
    expect(shownIds(root)).toEqual(["a-2", "a-1", "a-3", "a-4"]);
    expect(events.at(-1)).toEqual(["roworder", { id: "a-1", oldIndex: 0, targetIndex: 1 }]);
    expect(root.querySelector("[data-ok-data-grid-live]")?.textContent).toBe(
      "Row moved to position 2 of 4",
    );
    expect(row("a-1").getAttribute("aria-rowindex")).toBe("4");
    root.addEventListener("ok:data-grid:roworder", (e) => e.preventDefault(), { once: true });
    key(handle, "ArrowDown", { altKey: true });
    expect(shownIds(root)).toEqual(["a-2", "a-1", "a-3", "a-4"]);
    instance.setSortModel([{ field: "topic", sort: "asc" }]);
    key(row("a-3").querySelector("[data-ok-data-grid-reorder-handle]") as HTMLElement, "ArrowUp", {
      altKey: true,
    });
    expect(events.filter(([n]) => n === "roworder")).toHaveLength(2);
    // Pinned rows keep their indexes around the others.
    const bottom = root.querySelector('[data-ok-data-grid-pinned-rows="bottom"] > [role="row"]');
    expect(bottom?.getAttribute("aria-rowindex")).toBe("7");
    expect(root.querySelector("[data-ok-data-grid-main]")?.getAttribute("aria-rowcount")).toBe("7");
  });

  it("column groups: cells follow hidden and moved columns; moves stay in groups", () => {
    const { root, instance, events } = open(find("groups-group.html"));
    const groupRow = (level: number) =>
      root.querySelectorAll<HTMLElement>("[data-ok-data-grid-group-row]")[level] as HTMLElement;
    const person = () => groupRow(0).querySelector('[data-ok-group-id="person"]') as HTMLElement;
    expect(person().getAttribute("aria-colspan")).toBe("3");
    instance.setColumnVisibilityModel({ age: false });
    expect(person().getAttribute("aria-colspan")).toBe("2");
    instance.setColumnVisibilityModel({});
    instance.setColumnOrder(["firstName", "email", "lastName", "age", "city"]);
    // The moved column splits "person" in two cells (a copy without the tooltip).
    const cells = groupRow(0).querySelectorAll('[data-ok-group-id="person"]');
    expect(cells).toHaveLength(2);
    expect(cells[1]?.hasAttribute("aria-describedby")).toBe(false);
    instance.setColumnOrder(["firstName", "lastName", "age", "email", "city"]);
    instance.setPinnedColumns({ left: ["firstName", "lastName", "age"] });
    expect(person().getAttribute("data-ok-pinned")).toBe("left");
    expect(person().getAttribute("data-ok-pin-field")).toBe("firstName");
    instance.setPinnedColumns({ right: ["email", "city"] });
    const contact = groupRow(0).querySelector('[data-ok-group-id="contact"]') as HTMLElement;
    expect(contact.getAttribute("data-ok-pin-field")).toBe("city");
    instance.setPinnedColumns({});
    // Menu moves across groups are refused.
    const menu = root.querySelector(
      '[role="columnheader"][data-ok-field="age"] [data-ok-data-grid-menu-button]',
    ) as HTMLElement;
    menu.click();
    const columnMenu = document.getElementById("grid-groups-column-menu") as HTMLElement;
    columnMenu.dispatchEvent(
      new CustomEvent("ok:menu:select", {
        detail: { item: columnMenu.querySelector('[data-ok-data-grid-action="right"]') },
      }),
    );
    expect(events.filter(([n]) => n === "order")).toHaveLength(0);
  });

  it("list view: the list cell shows and the columns hide (both ways)", async () => {
    const { root, row } = open(find("list-group.html"));
    const list = () => row("c-1").querySelector("[data-ok-data-grid-list-cell]") as HTMLElement;
    const name = () => row("c-1").querySelector('[data-ok-field="firstName"]') as HTMLElement;
    expect(list().hidden).toBe(false);
    expect(name().hidden).toBe(true);
    root.removeAttribute("data-ok-list-view");
    await settle();
    expect(list().hidden).toBe(true);
    expect(name().hidden).toBe(false);
    expect((root.querySelector("[data-ok-data-grid-header]") as HTMLElement).hidden).toBe(false);
  });

  it("column virtualization: narrow grids show the columns in view", async () => {
    const { root, main } = open(
      find("advanced-group.html").replace(" data-ok-disable-virtualization", ""),
      (r) => {
        r.style.width = "400px";
        r.setAttribute("data-ok-column-buffer-px", "0");
      },
    );
    await settle();
    main.dispatchEvent(new Event("scroll"));
    await settle();
    const hiddenHeaders = () =>
      [...root.querySelectorAll<HTMLElement>('[data-ok-data-grid-header] [role="columnheader"]')]
        .filter((h) => h.hidden)
        .map((h) => h.getAttribute("data-ok-field"));
    expect(hiddenHeaders().length).toBeGreaterThan(0);
    expect(root.querySelector("[data-ok-col-start]")).not.toBeNull();
    main.scrollLeft = 800;
    main.dispatchEvent(new Event("scroll"));
    await settle();
    expect(hiddenHeaders()).toContain("lastName");
    root.setAttribute("data-ok-disable-virtualization", "");
    main.dispatchEvent(new Event("scroll"));
    await settle();
    expect(hiddenHeaders()).toEqual([]);
  });

  it("column virtualization keeps the special columns in front", async () => {
    const { root, main } = open(
      find("custom-group.html").replaceAll('data-ok-flex="1"', 'data-ok-width="200"'),
      (r) => {
        r.style.width = "400px";
        r.setAttribute("data-ok-column-buffer-px", "0");
      },
    );
    await settle();
    main.dispatchEvent(new Event("scroll"));
    await settle();
    const headers = [
      ...root.querySelectorAll<HTMLElement>('[data-ok-data-grid-header] [role="columnheader"]'),
    ];
    expect(headers.some((h) => h.hidden)).toBe(true);
    expect(headers.find((h) => h.getAttribute("data-ok-field") === "__check__")?.hidden).toBe(
      false,
    );
  });

  it("lazy loading: chunks load as they come into view", async () => {
    const { root, instance, main, events } = open(find("lazy-group.html"), (r) => {
      r.style.height = "300px";
      r.setAttribute("data-ok-lazy-loading-request-throttle-ms", "0");
    });
    const getRows = vi.fn((params: GridGetRowsParams) =>
      Promise.resolve({
        rows: Array.from({ length: (params.end ?? 0) - (params.start ?? 0) }, (_, i) => ({
          id: `c-${(params.start ?? 0) + i}`,
          firstName: "A",
          lastName: "B",
          age: i,
          city: "C",
        })),
        rowCount: 400,
      }),
    );
    instance.setDataSource({ getRows });
    await settle();
    await settle();
    expect(getRows).toHaveBeenCalledWith(expect.objectContaining({ start: 0, end: 50 }));
    expect(main.getAttribute("aria-rowcount")).toBe("401");
    main.scrollTop = 53 * 200;
    main.dispatchEvent(new Event("scroll"));
    await settle();
    await settle();
    expect(getRows.mock.calls.some(([p]) => (p.start ?? 0) >= 150)).toBe(true);
    instance.setSortModel([{ field: "age", sort: "desc" }]);
    // A new source starts over (its row count is unknown until it answers); failures report.
    root.setAttribute("data-ok-row-count", "100");
    main.scrollTop = 0;
    main.dispatchEvent(new Event("scroll"));
    instance.setDataSource({ getRows: () => Promise.reject(new Error("lazy")) });
    expect(root.querySelector("[data-ok-loading-row]")).not.toBeNull();
    await settle();
    await settle();
    expect(events.some(([n]) => n === "datasourceerror")).toBe(true);
  });

  it("data sources save edits; isAnyOf chips go back to text; export options from attributes", async () => {
    const { root, instance, row, events } = open(find("server-group.html"), (r) =>
      r.setAttribute("data-ok-csv-options", '{"delimiter":";","includeHeaders":false}'),
    );
    let fail = false;
    const updateRow = vi.fn(({ updatedRow }: { updatedRow: Record<string, unknown> }) =>
      fail
        ? Promise.reject(new Error("save"))
        : Promise.resolve({ ...updatedRow, firstName: "Saved" }),
    );
    instance.setDataSource({
      getRows: () =>
        Promise.resolve({
          rows: [{ id: "c-1", firstName: "Ana", lastName: "B", age: 3, city: "C" }],
        }),
      updateRow,
    });
    await settle();
    await settle();
    expect(instance.toCsv()).toBe("\uFEFFc-1;Ana;B;3;C");
    // Server grid columns aren't editable: edit through a cell made editable for the test.
    const header = root.querySelector(
      '[role="columnheader"][data-ok-field="firstName"]',
    ) as HTMLElement;
    expect(header).not.toBeNull();
    expect(row("c-1")).not.toBeNull();
    expect(updateRow).not.toHaveBeenCalled();
    fail = true;
    expect(events).toEqual([]);

    // Chips: back to a text field for other operators; Add filter copies the text field.
    const panel = document.getElementById("grid-server-filters") as HTMLElement;
    const [, operator] = [...panel.querySelectorAll("select")] as HTMLSelectElement[];
    (operator as HTMLSelectElement).value = "isAnyOf";
    operator?.dispatchEvent(new Event("change", { bubbles: true }));
    expect(panel.querySelector("[data-ok-autocomplete]")).not.toBeNull();
    (panel.querySelector("[data-ok-data-grid-filter-add]") as HTMLElement).click();
    expect(panel.querySelectorAll("[data-ok-autocomplete]")).toHaveLength(1);
    (operator as HTMLSelectElement).value = "contains";
    operator?.dispatchEvent(new Event("change", { bubbles: true }));
    expect(panel.querySelector("[data-ok-autocomplete]")).toBeNull();
  });

  it("validation snippet edits save through a data source (and fall back on failure)", async () => {
    const { root, instance, row, events } = open(find("validation-group.html"), (r) => {
      const template = document.createElement("template");
      template.setAttribute("data-ok-data-grid-row", "");
      template.content.append(
        (r.querySelector('[data-ok-row-id="p-1"]') as HTMLElement).cloneNode(true),
      );
      r.append(template);
    });
    let fail = false;
    const updateRow = vi.fn(({ updatedRow }: { updatedRow: Record<string, unknown> }) =>
      fail ? Promise.reject(new Error("save")) : Promise.resolve({ ...updatedRow, stock: 99 }),
    );
    instance.setDataSource({
      getRows: () =>
        Promise.resolve({
          rows: [{ id: "p-1", name: "Café table", category: "Furniture", price: 1, stock: 12 }],
        }),
      updateRow,
    });
    await settle();
    await settle();
    const stock = () => row("p-1").querySelector('[data-ok-field="stock"]') as HTMLElement;
    stock().focus();
    key(stock(), "7");
    key(stock().querySelector("input") as HTMLInputElement, "Enter");
    await settle();
    await settle();
    expect(updateRow).toHaveBeenCalledWith(expect.objectContaining({ rowId: "p-1" }));
    expect(stock().textContent).toBe("99");
    fail = true;
    stock().focus();
    key(stock(), "5");
    key(stock().querySelector("input") as HTMLInputElement, "Enter");
    await settle();
    await settle();
    expect(stock().textContent).toBe("99");
    expect(events.some(([n]) => n === "datasourceerror")).toBe(true);
    expect(root).toBeTruthy();
  });
});

describe("data grid sorting options", () => {
  it("sort cycles from the root and the headers; always adds columns; menu items follow", async () => {
    const host = mount(BASIC);
    const root = host.querySelector<HTMLElement>("[data-ok-data-grid]") as HTMLElement;
    root.setAttribute("data-ok-sorting-order", '["desc","asc"]');
    root.setAttribute("data-ok-multiple-columns-sorting-mode", "always");
    header(host, "firstName").setAttribute("data-ok-sorting-order", '["asc"]');
    start();
    const instance = runtime?.get<DataGridInstance>(root, "data-grid") as DataGridInstance;
    const age = header(host, "age");
    age.click();
    expect(age.getAttribute("aria-sort")).toBe("descending");
    age.click();
    expect(age.getAttribute("aria-sort")).toBe("ascending");
    age.click();
    expect(age.getAttribute("aria-sort")).toBe("descending");
    header(host, "firstName").click();
    expect(instance.sortModel).toEqual([
      { field: "age", sort: "desc" },
      { field: "firstName", sort: "asc" },
    ]);
    // A one-direction cycle stays sorted.
    header(host, "firstName").click();
    expect(instance.sortModel).toHaveLength(2);
    const menu = header(host, "firstName").querySelector(
      "[data-ok-data-grid-menu-button]",
    ) as HTMLElement;
    await userEvent.hover(header(host, "firstName"));
    await userEvent.click(menu);
    const item = (action: string) =>
      host.querySelector(
        `#${root.id}-column-menu [data-ok-data-grid-action="${action}"]`,
      ) as HTMLElement;
    expect(item("asc").hidden).toBe(false);
    expect(item("desc").hidden).toBe(true);
    expect(item("unsort").hidden).toBe(true);
    await userEvent.keyboard("{Escape}");
  });

  it("setSortComparator: a column's own comparators, then back to the type", () => {
    const { host, instance } = setup();
    const lengths: unknown[] = [];
    instance.setSortComparator("firstName", {
      sortComparator: (a, b, rowA) => {
        lengths.push(rowA);
        return String(a).length - String(b).length || String(a).localeCompare(String(b));
      },
    });
    header(host, "firstName").click();
    const asc = visible(host);
    expect(asc.map((name) => String(name).length)).toEqual(
      [...asc].map((name) => String(name).length).sort((x, y) => x - y),
    );
    expect(lengths[0]).toBeInstanceOf(HTMLElement);
    header(host, "firstName").click();
    const desc = visible(host);
    expect(String(desc[0]).length).toBeGreaterThanOrEqual(String(desc.at(-1)).length);
    // getSortComparator is used as it is (here: asc puts the oldest first).
    instance.setSortComparator("age", {
      getSortComparator: (direction) => (a, b) =>
        direction === "asc" ? Number(b) - Number(a) : Number(a) - Number(b),
    });
    instance.setSortModel([{ field: "age", sort: "asc" }]);
    const ages = visible(host, "age").map(Number);
    expect(ages).toEqual([...ages].sort((x, y) => y - x));
    instance.setSortComparator("age", null);
    instance.setSortModel([{ field: "age", sort: "asc" }]);
    const plain = visible(host, "age").map(Number);
    expect(plain).toEqual([...plain].sort((x, y) => x - y));
  });
});

describe("data grid custom editors and edit modes", () => {
  const snippet = (name: string) =>
    snippets.find(([path]) => path.endsWith(`${name}.html`))?.[1] as string;
  const open = (name: string, edit?: (root: HTMLElement) => void) => {
    const host = mount(snippet(name));
    const root = host.querySelector<HTMLElement>("[data-ok-data-grid]") as HTMLElement;
    edit?.(root);
    start();
    const instance = runtime?.get<DataGridInstance>(root, "data-grid") as DataGridInstance;
    const cell = (id: string, field: string) =>
      host.querySelector<HTMLElement>(
        `[data-ok-row-id="${id}"] [role="gridcell"][data-ok-field="${field}"]`,
      ) as HTMLElement;
    return { host, root, instance, cell };
  };
  const key = (target: Element, k: string) =>
    target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: k }));

  it("a template editor: cloned into the cell, setEditCellValue, keys and focus", async () => {
    const { root, instance, cell } = open("editors-group");
    const edits: unknown[] = [];
    root.addEventListener("ok:data-grid:edit", (event) =>
      edits.push((event as CustomEvent).detail),
    );
    cell("is-1", "points").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    const slider = cell("is-1", "points").querySelector("[data-ok-slider]") as HTMLElement;
    expect(slider).not.toBeNull();
    expect(document.activeElement).toBe(slider.querySelector("input"));
    instance.setEditCellValue({ id: "is-1", field: "points", value: 8 });
    // Another cell or row is ignored.
    instance.setEditCellValue({ id: "is-1", field: "title", value: "x" });
    instance.setEditCellValue({ id: "is-2", field: "points", value: 1 });
    key(slider.querySelector("input") as HTMLElement, "Enter");
    expect(edits.at(-1)).toEqual({ id: "is-1", row: { points: 8 } });
    expect(cell("is-1", "points").textContent).toBe("8");
    expect(cell("is-1", "points").getAttribute("data-ok-value")).toBe("8");
    // Escape restores the cell; focus moving inside the cell keeps the edit.
    cell("is-4", "points").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    const input = cell("is-4", "points").querySelector("input") as HTMLInputElement;
    input.dispatchEvent(new FocusEvent("focusout", { bubbles: true, relatedTarget: input }));
    expect(cell("is-4", "points").hasAttribute("data-ok-editing")).toBe(true);
    key(input, "Escape");
    expect(cell("is-4", "points").textContent).toBe("5");
    // A built-in editor still works next to it, and a checkbox value can be set.
    cell("is-4", "priority").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    instance.setEditCellValue({ id: "is-4", field: "priority", value: "Low" });
    expect((cell("is-4", "priority").querySelector("select") as HTMLSelectElement).value).toBe(
      "Low",
    );
    cell("is-4", "priority")
      .querySelector("select")
      ?.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
    expect(cell("is-4", "priority").textContent).toBe("Low");
    await settle();
  });

  it("a template's own field holds the value; validation marks it", () => {
    const { root, instance, cell } = open("editors-group", (r) => {
      const template = r.querySelector(
        'template[data-ok-data-grid-edit-cell="points"]',
      ) as HTMLTemplateElement;
      const field = document.createElement("input");
      field.type = "number";
      field.setAttribute("data-ok-data-grid-edit-input", "");
      field.setAttribute("aria-label", "Points");
      template.content.replaceChildren(field);
    });
    root.addEventListener("ok:data-grid:validate", (event) => {
      const detail = (event as CustomEvent<{ value: unknown; error?: string }>).detail;
      if (Number(detail.value) > 13) detail.error = "At most 13";
    });
    cell("is-2", "points").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    const field = cell("is-2", "points").querySelector("input") as HTMLInputElement;
    expect(field.value).toBe("2");
    field.value = "20";
    field.dispatchEvent(new Event("change", { bubbles: true }));
    expect(field.getAttribute("aria-invalid")).toBe("true");
    key(field, "Enter");
    expect(cell("is-2", "points").hasAttribute("data-ok-editing")).toBe(true);
    field.value = "6";
    field.dispatchEvent(new Event("input", { bubbles: true }));
    key(field, "Enter");
    expect(cell("is-2", "points").textContent).toBe("6");
    expect(instance.cellModesModel).toEqual({});
  });

  it("a custom header filter names its operator", () => {
    const { host, instance } = open("editors-group");
    const select = host.querySelector("#grid-editors-points-filter") as HTMLSelectElement;
    expect(select.getAttribute("data-ok-filter-operator")).toBe(">=");
    select.value = "5";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    expect(instance.filterModel.items).toEqual([{ field: "points", operator: ">=", value: "5" }]);
    expect(visible(host, "points")).toEqual(["8", "5"]);
  });

  it("cell and row modes: events, setters without events, refusals", () => {
    const { root, instance, cell } = open("editors-group");
    const modes: unknown[] = [];
    root.addEventListener("ok:data-grid:cellmodes", (event) =>
      modes.push((event as CustomEvent).detail.model),
    );
    cell("is-1", "title").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(modes.at(-1)).toEqual({ "is-1": { title: { mode: "edit" } } });
    expect(instance.cellModesModel).toEqual({ "is-1": { title: { mode: "edit" } } });
    expect(instance.rowModesModel).toEqual({});
    key(cell("is-1", "title").querySelector("input") as HTMLElement, "Escape");
    expect(modes.at(-1)).toEqual({
      "is-1": { title: { mode: "view", ignoreModifications: true } },
    });
    // Refused: the cell doesn't open (or doesn't close).
    root.addEventListener("ok:data-grid:cellmodes", (event) => event.preventDefault(), {
      once: true,
    });
    cell("is-2", "title").dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    expect(cell("is-2", "title").hasAttribute("data-ok-editing")).toBe(false);
    // Setters: no events; ignoreModifications cancels; another cell moves the edit.
    const count = modes.length;
    instance.setCellModesModel({ "is-2": { title: { mode: "edit" } } });
    const input = cell("is-2", "title").querySelector("input") as HTMLInputElement;
    input.value = "Changed";
    instance.setCellModesModel({ "is-2": { title: { mode: "view", ignoreModifications: true } } });
    expect(cell("is-2", "title").textContent).toBe("Update the docs");
    instance.setCellModesModel({ "is-2": { title: { mode: "edit" } } });
    (cell("is-2", "title").querySelector("input") as HTMLInputElement).value = "Docs";
    instance.setCellModesModel({ "is-3": { title: { mode: "edit" } } });
    expect(cell("is-2", "title").textContent).toBe("Docs");
    expect(cell("is-3", "title").hasAttribute("data-ok-editing")).toBe(true);
    instance.setCellModesModel({});
    expect(cell("is-3", "title").hasAttribute("data-ok-editing")).toBe(false);
    expect(modes).toHaveLength(count);
    // Row setters only work in row mode (and the reverse).
    instance.setRowModesModel({ "is-1": { mode: "edit" } });
    expect(instance.rowModesModel).toEqual({});
    root.setAttribute("data-ok-edit-mode", "row");
    instance.setCellModesModel({ "is-1": { title: { mode: "edit" } } });
    expect(instance.cellModesModel).toEqual({});
    instance.setRowModesModel({ "is-1": { mode: "edit", fieldToFocus: "priority" } });
    expect(document.activeElement).toBe(cell("is-1", "priority").querySelector("select"));
    expect(instance.rowModesModel).toEqual({
      "is-1": { mode: "edit" },
    });
    instance.setRowModesModel({ "is-1": { mode: "view" } });
    expect(root.querySelector('[data-ok-row-id="is-1"]')?.hasAttribute("data-ok-editing")).toBe(
      false,
    );
  });

  it("edit modes story: Save and Cancel start hidden (display none)", async () => {
    const { host, cell } = open("modes-group");
    expect(host.querySelector('[aria-label="Edit Ana Silva"]')?.hasAttribute("hidden")).toBe(false);
    const save = host.querySelector('[aria-label="Save Ana Silva"]') as HTMLButtonElement;
    expect(save.hidden).toBe(true);
    expect(getComputedStyle(save).display).toBe("none");
    await expectNoAxeViolations(host);
    expect(cell("m-1", "hours").textContent).toBe("32");
  });
});

describe("data grid undo and redo", () => {
  const snippet = (name: string) =>
    snippets.find(([path]) => path.endsWith(`${name}.html`))?.[1] as string;
  const open = (name: string, edit?: (root: HTMLElement) => void) => {
    const host = mount(snippet(name));
    const root = host.querySelector<HTMLElement>("[data-ok-data-grid]") as HTMLElement;
    root.setAttribute("data-ok-disable-virtualization", "");
    edit?.(root);
    start();
    const instance = runtime?.get<DataGridInstance>(root, "data-grid") as DataGridInstance;
    const cell = (id: string, field: string) =>
      host.querySelector<HTMLElement>(
        `[data-ok-row-id="${id}"] [role="gridcell"][data-ok-field="${field}"]`,
      ) as HTMLElement;
    return { host, root, instance, cell };
  };
  const key = (target: Element, k: string, init: KeyboardEventInit = {}) =>
    target.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: k, ...init }),
    );
  const editTo = (cell: HTMLElement, text: string) => {
    cell.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    const input = cell.querySelector("input") as HTMLInputElement;
    input.value = text;
    key(input, "Enter");
  };

  it("Ctrl + Z undoes an edit, Shift + Z and Y redo it; the toolbar buttons follow", async () => {
    const { host, root, instance, cell } = open("cells-group");
    const events: [string, unknown][] = [];
    for (const name of ["edit", "undo", "redo"])
      root.addEventListener(`ok:data-grid:${name}`, (event) =>
        events.push([name, (event as CustomEvent).detail]),
      );
    const undo = host.querySelector('[data-ok-data-grid-history="undo"]') as HTMLButtonElement;
    const redo = host.querySelector('[data-ok-data-grid-history="redo"]') as HTMLButtonElement;
    expect(undo.disabled).toBe(true);
    editTo(cell("i-1", "name"), "Pot");
    expect(cell("i-1", "name").textContent).toBe("Pot");
    expect(undo.disabled).toBe(false);
    key(cell("i-1", "name"), "z", { ctrlKey: true });
    expect(cell("i-1", "name").textContent).toBe("Kettle");
    expect(events.slice(-2)).toEqual([
      ["edit", { id: "i-1", row: { name: "Kettle" } }],
      ["undo", { ids: ["i-1"] }],
    ]);
    expect(redo.disabled).toBe(false);
    key(cell("i-1", "name"), "z", { metaKey: true, shiftKey: true });
    expect(cell("i-1", "name").textContent).toBe("Pot");
    expect(events.at(-1)).toEqual(["redo", { ids: ["i-1"] }]);
    undo.click();
    expect(cell("i-1", "name").textContent).toBe("Kettle");
    key(cell("i-1", "name"), "y", { ctrlKey: true });
    expect(cell("i-1", "name").textContent).toBe("Pot");
    expect(instance.history.canUndo()).toBe(true);
    expect(instance.history.canRedo()).toBe(false);
    redo.click();
    expect(await instance.history.redo()).toBe(false);
    // A refused undo fails and forgets the steps.
    root.addEventListener("ok:data-grid:edit", (event) => event.preventDefault(), { once: true });
    expect(await instance.history.undo()).toBe(false);
    expect(instance.history.canUndo()).toBe(false);
    expect(undo.disabled).toBe(true);
    await expectNoAxeViolations(host);
  });

  it("a paste is one step; changed rows and new rows stop a step; the size and clear", async () => {
    const { root, instance, cell } = open("cells-group", (r) =>
      r.setAttribute("data-ok-history-stack-size", "2"),
    );
    // Paste two rows of two cells into name / category.
    cell("i-1", "name").focus();
    key(cell("i-1", "name"), "v", { ctrlKey: true });
    const area = document.activeElement as HTMLElement;
    const read = vi.spyOn(DataTransfer.prototype, "getData").mockReturnValue("A\tTools\nB\tTools");
    area.dispatchEvent(
      new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: new DataTransfer(),
      }),
    );
    read.mockRestore();
    expect(cell("i-2", "name").textContent).toBe("B");
    expect(await instance.history.undo()).toBe(true);
    expect(cell("i-1", "name").textContent).toBe("Kettle");
    expect(cell("i-2", "category").textContent).toBe("Serving");
    expect(await instance.history.redo()).toBe(true);
    expect(cell("i-2", "category").textContent).toBe("Tools");
    // Three edits, two kept.
    editTo(cell("i-3", "name"), "C");
    editTo(cell("i-3", "name"), "D");
    editTo(cell("i-3", "name"), "E");
    expect(await instance.history.undo()).toBe(true);
    expect(await instance.history.undo()).toBe(true);
    expect(await instance.history.undo()).toBe(false);
    expect(cell("i-3", "name").textContent).toBe("C");
    // Changed outside the history: the step can't apply.
    instance.history.clear();
    editTo(cell("i-4", "name"), "F");
    cell("i-4", "name").setAttribute("data-ok-value", "G");
    expect(await instance.history.undo()).toBe(false);
    // Turned off: no steps, no keys.
    root.setAttribute("data-ok-history-stack-size", "0");
    editTo(cell("i-5", "name"), "H");
    key(cell("i-5", "name"), "z", { ctrlKey: true });
    expect(cell("i-5", "name").textContent).toBe("H");
    expect(instance.history.canUndo()).toBe(false);
  });
});
