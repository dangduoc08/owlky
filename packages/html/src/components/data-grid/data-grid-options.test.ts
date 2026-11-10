import { afterEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import type { DataGridInstance } from "./data-grid.js";

// Roadmap batch E (Data grid shoulds): footer and toolbar, layout, column options, selection
// options and the set filter.

const snippets = import.meta.glob("./examples/*.html", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;
const snippet = (name: string) => snippets[`./examples/${name}.html`] as string;

let runtime: Runtime | undefined;
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
  vi.restoreAllMocks();
});

const setup = (html: string) => {
  const host = mount(html);
  runtime = createRuntime()
    .register(...components)
    .start();
  const root = host.querySelector<HTMLElement>("[data-ok-data-grid]") as HTMLElement;
  const instance = runtime.get<DataGridInstance>(root, "data-grid") as DataGridInstance;
  return { host, root, instance };
};
const footer = (host: Element) => host.querySelector("[data-ok-data-grid-footer]") as HTMLElement;
const shown = (host: Element) =>
  host.querySelectorAll('[data-ok-data-grid-body] > [role="row"]:not([hidden])');

describe("data grid footer and toolbar", () => {
  it("shows every row and the row count without pagination; filters count 'n of total'", async () => {
    const { host, instance } = setup(snippet("footer-group"));
    expect(shown(host)).toHaveLength(6);
    const count = () => footer(host).querySelector("[data-ok-data-grid-row-count]")?.textContent;
    expect(count()).toBe("Total Rows: 6");
    instance.setFilterModel({ items: [{ field: "priority", operator: "equals", value: "High" }] });
    expect(count()).toBe("Total Rows: 2 of 6");
    expect(shown(host)).toHaveLength(2);
    await expectNoAxeViolations(host);
  });

  it("counts the selected rows first in the footer, as React renders it", async () => {
    const { host, root } = setup(snippet("footer-group"));
    const boxes = host.querySelectorAll<HTMLInputElement>(
      '[data-ok-data-grid-body] [data-ok-data-grid-checkbox] input[type="checkbox"]',
    );
    await userEvent.click(boxes[0] as HTMLInputElement);
    const first = footer(host).firstElementChild as HTMLElement;
    expect(first.hasAttribute("data-ok-data-grid-selected-row-count")).toBe(true);
    expect(first.textContent).toBe("1 row selected");
    await userEvent.click(boxes[1] as HTMLInputElement);
    expect(first.textContent).toBe("2 rows selected");
    root.setAttribute("data-ok-hide-footer-selected-row-count", "");
    await settle();
    expect(footer(host).querySelector("[data-ok-data-grid-selected-row-count]")).toBeNull();
    root.setAttribute("data-ok-hide-footer-row-count", "");
    await settle();
    expect(footer(host).querySelector("[data-ok-data-grid-row-count]")).toBeNull();
  });

  it("the hide-footer-pagination flag hides the pagination and shows every row", async () => {
    const { host, root } = setup(snippet("basic-group"));
    expect(shown(host)).toHaveLength(10);
    root.setAttribute("data-ok-hide-footer-pagination", "");
    await settle();
    expect(shown(host)).toHaveLength(20);
    expect((footer(host).querySelector("[data-ok-table-pagination]") as HTMLElement).hidden).toBe(
      true,
    );
    expect(footer(host).querySelector("[data-ok-data-grid-row-count]")?.textContent).toBe(
      "Total Rows: 20",
    );
    root.removeAttribute("data-ok-hide-footer-pagination");
    await settle();
    expect(shown(host)).toHaveLength(10);
    expect(footer(host).querySelector("[data-ok-data-grid-row-count]")).toBeNull();
  });

  it("Tab moves from header to header, then into the cells (tabNavigation all)", async () => {
    const { host } = setup(snippet("footer-group"));
    const title = host.querySelector<HTMLElement>(
      '[role="columnheader"][data-ok-field="title"]',
    ) as HTMLElement;
    title.focus();
    await userEvent.keyboard("{Tab}");
    expect(document.activeElement?.getAttribute("data-ok-field")).toBe("priority");
    await userEvent.keyboard("{Tab}{Tab}");
    // The first body cell holds the row's checkbox.
    expect(document.activeElement?.getAttribute("aria-label")).toBe("Select row");
    expect(host.querySelectorAll('[data-ok-data-grid-main] [tabindex="0"]')).toHaveLength(1);
  });
});

/** Resolves once `test` passes after a mutation of `target` (ResizeObserver work lands later). */
const whenMutated = (target: Element, test: () => boolean) =>
  new Promise<void>((resolve) => {
    if (test()) return resolve();
    const observer = new MutationObserver(() => {
      if (!test()) return;
      observer.disconnect();
      resolve();
    });
    observer.observe(target, { attributes: true, childList: true, subtree: true });
  });

describe("data grid layout options", () => {
  it("header heights through CSSOM, borders and border spacing, as React writes them", async () => {
    const { host, root } = setup(snippet("dimensions-borders"));
    expect(root.style.getPropertyValue("--_ok-data-grid-header-height")).toBe("44px");
    expect(root.style.getPropertyValue("--_ok-data-grid-group-header-height")).toBe("36px");
    expect(root.hasAttribute("style")).toBe(true);
    const header = host.querySelector(
      '[data-ok-data-grid-header] [role="columnheader"][data-ok-field="title"]',
    ) as HTMLElement;
    expect(header.getBoundingClientRect().height).toBe(44);
    const group = host.querySelector(
      '[role="columnheader"][data-ok-group-id="work"]',
    ) as HTMLElement;
    expect(group.getBoundingClientRect().height).toBe(36);
    const cell = host.querySelector('[role="gridcell"][data-ok-field="title"]') as HTMLElement;
    expect(getComputedStyle(cell).borderInlineEndWidth).toBe("1px");
    expect(getComputedStyle(header).borderInlineEndWidth).toBe("1px");
    const row = cell.closest('[role="row"]') as HTMLElement;
    expect(getComputedStyle(row).paddingTop).toBe("4px");
    expect(getComputedStyle(row).marginTop).toBe("0px");
    // Density scales the heights; a header filter height of its own.
    root.setAttribute("data-ok-density", "compact");
    root.setAttribute("data-ok-header-filter-height", "50");
    await settle();
    expect(root.style.getPropertyValue("--_ok-data-grid-header-height")).toBe("31px");
    expect(root.style.getPropertyValue("--_ok-data-grid-header-filter-height")).toBe("35px");
    root.removeAttribute("data-ok-column-header-height");
    root.removeAttribute("data-ok-column-group-header-height");
    root.removeAttribute("data-ok-header-filter-height");
    await settle();
    expect(root.style.getPropertyValue("--_ok-data-grid-header-height")).toBe("");
    await expectNoAxeViolations(host);
  });

  it("autoPageSize fits the page to the grid's height and follows resizes", async () => {
    const { host, root } = setup(snippet("dimensions-pages"));
    root.style.height = "500px";
    const main = host.querySelector("[data-ok-data-grid-main]") as HTMLElement;
    const pagination = host.querySelector("[data-ok-table-pagination]") as HTMLElement;
    const fits = () => {
      const header = main.querySelector("[data-ok-data-grid-header]") as HTMLElement;
      return Math.floor((main.clientHeight - header.offsetHeight) / 53);
    };
    await whenMutated(
      pagination,
      () => pagination.getAttribute("data-ok-rows-per-page") === String(fits()) && fits() > 5,
    );
    await settle();
    expect(shown(host)).toHaveLength(fits());
    expect(main.scrollHeight).toBeLessThanOrEqual(main.clientHeight + 1);
    const before = fits();
    root.style.height = "700px";
    await whenMutated(
      pagination,
      () => pagination.getAttribute("data-ok-rows-per-page") === String(fits()) && fits() > before,
    );
    await settle();
    expect(shown(host)).toHaveLength(fits());
  });
});

describe("data grid column options", () => {
  const cell = (host: Element, id: string, field: string) =>
    host.querySelector(`[data-ok-row-id="${id}"] [data-ok-field="${field}"]`) as HTMLElement;
  const headerOf = (host: Element, field: string) =>
    host.querySelector(
      `[data-ok-data-grid-header] [role="columnheader"][data-ok-field="${field}"]`,
    ) as HTMLElement;
  const menuItem = (host: Element, action: string) =>
    host.querySelector(
      `#grid-columns-column-menu [data-ok-data-grid-action="${action}"]`,
    ) as HTMLElement;

  it("row headers sort, merge by their span value and take the arrow keys", async () => {
    const { host, instance } = setup(snippet("columns-group"));
    expect(cell(host, "tt-1", "owner").getAttribute("aria-rowspan")).toBe("2");
    // Same owner, another team: no merge.
    expect(cell(host, "tt-3", "owner").hasAttribute("data-ok-covered")).toBe(false);
    instance.setSortModel([{ field: "task", sort: "asc" }]);
    await settle();
    expect(
      [...host.querySelectorAll('[data-ok-data-grid-body] [role="rowheader"]')].map(
        (c) => c.textContent,
      ),
    ).toEqual([
      "Draw the icons",
      "Fix the build",
      "Plan the sprint",
      "Review the API",
      "Write the guide",
    ]);
    cell(host, "tt-5", "task").focus();
    await userEvent.keyboard("{ArrowDown}");
    expect(document.activeElement).toBe(cell(host, "tt-2", "task"));
    await expectNoAxeViolations(host);
  });

  it("disableReorder keeps the column first; pinnable false hides the pin items", async () => {
    const { host } = setup(snippet("columns-group"));
    // Ctrl + Enter opens a column's menu; the Task column has none.
    headerOf(host, "task").focus();
    await userEvent.keyboard("{Control>}{Enter}{/Control}");
    expect(menuItem(host, "left").closest("[data-ok-open]")).toBeNull();
    headerOf(host, "team").focus();
    await userEvent.keyboard("{Control>}{Enter}{/Control}");
    expect(menuItem(host, "left").getAttribute("aria-disabled")).toBe("true");
    expect(menuItem(host, "right").hasAttribute("aria-disabled")).toBe(false);
    for (const action of ["pin-left", "pin-right", "unpin"])
      expect(menuItem(host, action).hidden).toBe(true);
    await userEvent.keyboard("{Escape}");
    headerOf(host, "owner").focus();
    await userEvent.keyboard("{Control>}{Enter}{/Control}");
    expect(menuItem(host, "pin-left").hidden).toBe(false);
    await userEvent.keyboard("{Escape}");
  });

  it("disableExport leaves the column out of the CSV; no sort icon on hideSortIcons", () => {
    const { host, instance } = setup(snippet("columns-group"));
    expect(instance.toCsv().split("\r\n")[0]).toBe("﻿Task,Team,Owner,Points");
    expect(headerOf(host, "points").querySelector("[data-ok-data-grid-sort-icon]")).toBeNull();
    expect(headerOf(host, "points").getAttribute("aria-sort")).toBe("none");
    expect(getComputedStyle(cell(host, "tt-1", "points")).display).toBe("flex");
  });

  it("setPastedValueParser turns pasted text into the value", async () => {
    const markup = snippet("columns-group")
      .replace("data-ok-data-grid ", "data-ok-data-grid data-ok-cell-selection ")
      .replace(
        'data-ok-field="points" data-ok-type="number"',
        'data-ok-field="points" data-ok-type="number" data-ok-editable',
      );
    const { host, root, instance } = setup(markup);
    const edits: unknown[] = [];
    root.addEventListener("ok:data-grid:edit", (event) =>
      edits.push((event as CustomEvent<{ row: unknown }>).detail.row),
    );
    instance.setPastedValueParser(
      "points",
      (value, row) => Number(value) * 10 + Number(row["points"]),
    );
    const target = cell(host, "tt-1", "points");
    target.focus();
    target.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "v", ctrlKey: true }),
    );
    const transfer = new DataTransfer();
    transfer.setData("text/plain", "4");
    const read = vi.spyOn(DataTransfer.prototype, "getData").mockReturnValue("4");
    (document.activeElement as HTMLElement).dispatchEvent(
      new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: transfer }),
    );
    read.mockRestore();
    expect(edits).toEqual([{ points: 43 }]);
    expect(cell(host, "tt-1", "points").textContent).toBe("43");
    instance.setPastedValueParser("points", null);
  });
});

describe("data grid selection options", () => {
  const box = (host: Element, id: string) =>
    host.querySelector(
      `[data-ok-row-id="${id}"] [data-ok-data-grid-checkbox] input`,
    ) as HTMLInputElement;

  it("tree data: a parent selects its children; all children select the parent; mixed parents", async () => {
    const { host, root, instance } = setup(snippet("selection-tree"));
    const models: string[][] = [];
    root.addEventListener("ok:data-grid:selection", (event) =>
      models.push((event as CustomEvent<{ model: string[] }>).detail.model),
    );
    const head = host.querySelector(
      '[role="columnheader"][data-ok-field="__check__"]',
    ) as HTMLElement;
    expect(head.getAttribute("data-ok-width")).toBe("60");
    expect(
      (host.querySelector("[data-ok-data-grid-main]") as HTMLElement).style
        .getPropertyValue("--_ok-data-grid-columns")
        .startsWith("60px"),
    ).toBe(true);
    await userEvent.click(box(host, "w-design"));
    expect(instance.selection).toEqual(["w-design", "w-icons", "w-colors"]);
    await userEvent.click(box(host, "w-icons"));
    expect(instance.selection).toEqual(["w-colors"]);
    expect(box(host, "w-design").indeterminate).toBe(true);
    expect(
      box(host, "w-design").closest("[data-ok-checkbox]")?.hasAttribute("data-ok-indeterminate"),
    ).toBe(true);
    await userEvent.click(box(host, "w-icons"));
    expect(instance.selection).toEqual(["w-colors", "w-icons", "w-design"]);
    expect(box(host, "w-design").checked).toBe(true);
    expect(models).toHaveLength(3);
    await expectNoAxeViolations(host);
  });

  it("row groups: a group's checkbox (built like React's) selects its rows, parents stay out", async () => {
    const { host, instance } = setup(snippet("selection-groups"));
    const group = () => box(host, "auto-generated-row-team/Docs");
    expect(group()).not.toBeNull();
    await userEvent.click(group());
    expect(instance.selection).toEqual(["tt-3", "tt-4"]);
    expect(group().checked).toBe(true);
    await userEvent.click(box(host, "tt-4"));
    expect(group().indeterminate).toBe(true);
    await userEvent.click(group());
    expect(instance.selection).toEqual(["tt-3", "tt-4"]);
    await userEvent.click(group());
    expect(instance.selection).toEqual([]);
    await expectNoAxeViolations(host);
  });

  it("data-ok-row-selection=false: no selection from clicks or Space", async () => {
    const markup = snippet("basic-group").replace(
      "data-ok-data-grid ",
      'data-ok-data-grid data-ok-row-selection="false" ',
    );
    const { host, instance } = setup(markup);
    const cell = host.querySelector(
      '[data-ok-data-grid-body] [role="row"] [data-ok-field="firstName"]',
    ) as HTMLElement;
    await userEvent.click(cell);
    expect(instance.selection).toEqual([]);
    // Checkboxes left in the markup do nothing either.
    await userEvent.click(
      cell.closest('[role="row"]')?.querySelector('input[type="checkbox"]') as HTMLInputElement,
    );
    expect(instance.selection).toEqual([]);
  });
});

describe("data grid set filter", () => {
  const values = (list: Element) =>
    [...list.querySelectorAll<HTMLInputElement>("[data-ok-data-grid-set-value]")].map((input) =>
      input.getAttribute("data-ok-data-grid-set-value"),
    );
  const valueBox = (list: Element, value: string) =>
    list.querySelector(`[data-ok-data-grid-set-value="${value}"]`) as HTMLInputElement;
  const headerList = (host: Element, field: string) =>
    host.querySelector(
      `[data-ok-filter-field="${field}"] [data-ok-data-grid-set-filter]`,
    ) as HTMLElement;

  it("header filter: the checklist filters with is any of; search and Select all", async () => {
    const { host, root, instance } = setup(snippet("set-group"));
    const button = host.querySelector(
      '[data-ok-filter-field="priority"] [data-ok-data-grid-set-filter-button]',
    ) as HTMLElement;
    await userEvent.click(button);
    const list = headerList(host, "priority");
    expect(values(list)).toEqual(["High", "Low", "Medium"]);
    await userEvent.click(valueBox(list, "High"));
    expect(instance.filterModel.items).toEqual([
      { field: "priority", operator: "isAnyOf", value: ["High"] },
    ]);
    expect(shown(host)).toHaveLength(2);
    expect(button.textContent).toBe("is any of: High");
    const all = list.querySelector("[data-ok-data-grid-set-all]") as HTMLInputElement;
    expect(all.indeterminate).toBe(true);
    await userEvent.type(
      list.querySelector('input:not([type="checkbox"])') as HTMLInputElement,
      "l",
    );
    // "High" has no l: hidden; Low and Medium stay.
    expect((valueBox(list, "High").closest("label") as HTMLElement).hidden).toBe(true);
    expect(instance.filterModel.items[0]?.value).toEqual(["High"]);
    await userEvent.click(all);
    expect(instance.filterModel.items[0]?.value).toEqual(["High", "Low"]);
    expect(button.textContent).toBe("is any of: 2 selected");
    // Clearing every box removes the filter.
    await userEvent.click(all);
    await userEvent.clear(list.querySelector('input:not([type="checkbox"])') as HTMLInputElement);
    expect((valueBox(list, "High").closest("label") as HTMLElement).hidden).toBe(false);
    await userEvent.click(valueBox(list, "High"));
    expect(instance.filterModel.items).toEqual([]);
    expect(button.textContent).toBe("is any of: any");
    expect(root.querySelectorAll("[data-ok-data-grid-set-filter]")).toHaveLength(2);
    await expectNoAxeViolations(host);
  });

  it("filter panel: a set column's checklist replaces the value field and back", async () => {
    const { host, instance } = setup(snippet("set-group"));
    const panel = host.querySelector("#grid-set-filters") as HTMLElement;
    const field = panel.querySelector("#grid-set-filter-field") as HTMLSelectElement;
    field.value = "points";
    field.dispatchEvent(new Event("change", { bubbles: true }));
    const operator = panel.querySelector("#grid-set-filter-operator") as HTMLSelectElement;
    expect(operator.value).toBe("isAnyOf");
    const list = panel.querySelector("[data-ok-data-grid-set-filter]") as HTMLElement;
    expect(list.id).toBe("grid-set-filter-value");
    expect(values(list)).toEqual(["1", "2", "3", "5", "8"]);
    valueBox(list, "3").click();
    expect(instance.filterModel.items).toEqual([
      { field: "points", operator: "isAnyOf", value: ["3"] },
    ]);
    expect(shown(host)).toHaveLength(2);
    // Another operator brings the text field back.
    operator.value = ">";
    operator.dispatchEvent(new Event("change", { bubbles: true }));
    expect(panel.querySelector("[data-ok-data-grid-set-filter]")).toBeNull();
    expect(panel.querySelector<HTMLInputElement>("#grid-set-filter-value")?.type).toBe("text");
  });
});
