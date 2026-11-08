import type { GridGetRowsParams } from "@owlky/core";
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
  it("covers every story group", () => expect(snippets).toHaveLength(5));

  // Grids whose rows come from JavaScript (setRows, data sources) ship no rows.
  const scripted = (path: string) => /(large|server)-group/.test(path);

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

  it.each(snippets.filter(([path]) => !scripted(path)))(
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

const ADVANCED = snippets.find(([path]) => path.endsWith("advanced-group.html"))?.[1] as string;

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
