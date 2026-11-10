import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { createRuntime } from "../../runtime/runtime.js";
import type { Runtime } from "../../runtime/types.js";
import { expectNoAxeViolations, mount, resetPage, settle } from "../../test-utils.js";
import { components } from "../index.js";
import type { DataGridInstance } from "./data-grid.js";
import contextHtml from "./examples/context-group.html?raw";
import filtersHtml from "./examples/filters-group.html?raw";

const writeText = vi.fn<(text: string) => Promise<void>>();
const readText = vi.fn<() => Promise<string>>();
let runtime: Runtime | undefined;
beforeEach(() => {
  writeText.mockReset().mockResolvedValue(undefined);
  readText.mockReset().mockResolvedValue("");
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText, readText },
    configurable: true,
  });
});
afterEach(() => {
  runtime?.stop();
  runtime = undefined;
  resetPage();
  delete (navigator as { clipboard?: unknown }).clipboard;
  vi.restoreAllMocks();
});
const setup = (html: string, edit?: (root: HTMLElement) => void) => {
  const host = mount(html);
  const root = host.querySelector<HTMLElement>("[data-ok-data-grid]") as HTMLElement;
  root.setAttribute("data-ok-disable-virtualization", "");
  edit?.(root);
  runtime = createRuntime()
    .register(...components)
    .start();
  const instance = runtime.get<DataGridInstance>(root, "data-grid") as DataGridInstance;
  return { host, root, instance };
};
const cell = (host: Element, rowId: string, field: string) =>
  host.querySelector<HTMLElement>(
    `[data-ok-row-id="${rowId}"] > [role="gridcell"][data-ok-field="${field}"]`,
  ) as HTMLElement;
const contextMenu = (target: Element, init: MouseEventInit = {}) =>
  target.dispatchEvent(
    new MouseEvent("contextmenu", { bubbles: true, cancelable: true, button: 2, ...init }),
  );
const key = (target: Element, k: string, init: KeyboardEventInit = {}) =>
  target.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: k, ...init }),
  );
const live = (host: Element) => host.querySelector("[data-ok-data-grid-live]")?.textContent;

describe("data grid context menu (HTML)", () => {
  const menu = () => document.getElementById("grid-context-context-menu") as HTMLElement;
  const action = (name: string) =>
    menu().querySelector<HTMLElement>(
      `[data-ok-data-grid-context-action="${name}"]`,
    ) as HTMLElement;

  it("opens at the pointer or the focused cell, and gives the focus back", async () => {
    const { host } = setup(contextHtml);
    const target = cell(host, "is-2", "priority");
    expect(contextMenu(target, { clientX: 120, clientY: 60 })).toBe(false);
    expect(menu().hasAttribute("data-ok-open")).toBe(true);
    expect(menu().getAttribute("data-ok-anchor-position")).toBe("60,120");
    await settle();
    expect(menu().contains(document.activeElement)).toBe(true);
    // A cell outside the selection becomes the selection.
    expect(target.getAttribute("aria-selected")).toBe("true");
    await expectNoAxeViolations(document.body);
    await userEvent.keyboard("{Escape}");
    expect(menu().hasAttribute("data-ok-open")).toBe(false);
    expect(document.activeElement).toBe(target);
    const other = cell(host, "is-1", "title");
    other.focus();
    expect(key(other, "F10", { shiftKey: true })).toBe(false);
    const box = other.getBoundingClientRect();
    expect(menu().getAttribute("data-ok-anchor-position")).toBe(
      `${Math.round(box.bottom)},${Math.round(box.left)}`,
    );
    expect(contextMenu(other, { button: 0 })).toBe(false);
  });

  it("copies, pastes, pins and exports; refused pastes are announced", async () => {
    const { host, root } = setup(contextHtml);
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:x");
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const edits = vi.fn();
    const pins = vi.fn();
    root.addEventListener("ok:data-grid:edit", (e) => edits((e as CustomEvent).detail));
    root.addEventListener("ok:data-grid:pinned", (e) => pins((e as CustomEvent).detail));
    contextMenu(cell(host, "is-3", "title"));
    action("copy").click();
    expect(writeText).toHaveBeenCalledWith("Add dark mode");
    expect(document.activeElement).toBe(cell(host, "is-3", "title"));
    readText.mockResolvedValue("Night mode");
    contextMenu(cell(host, "is-3", "title"));
    action("paste").click();
    await settle();
    await settle();
    expect(edits).toHaveBeenCalledWith({ id: "is-3", row: { title: "Night mode" } });
    expect(cell(host, "is-3", "title").textContent).toBe("Night mode");
    readText.mockRejectedValue(new Error("denied"));
    contextMenu(cell(host, "is-1", "title"));
    action("paste").click();
    await settle();
    expect(live(host)).toBe("Press Ctrl + V (Cmd + V on a Mac) to paste");
    contextMenu(cell(host, "is-1", "priority"));
    action("pin-right").click();
    expect(pins).toHaveBeenLastCalledWith({ model: { left: [], right: ["priority"] } });
    contextMenu(cell(host, "is-1", "priority"));
    expect(action("pin-right").getAttribute("aria-disabled")).toBe("true");
    expect(action("unpin").hasAttribute("aria-disabled")).toBe(false);
    action("export-csv").click();
    contextMenu(cell(host, "is-1", "priority"));
    action("export-excel").click();
    expect(createObjectURL).toHaveBeenCalledTimes(2);
  });

  it("lets listeners add items, skip actions or keep the browser's menu", () => {
    const { host, root } = setup(contextHtml);
    const chosen = vi.fn();
    root.addEventListener("ok:data-grid:contextmenu", (event) => {
      const { menu: list, field } = (event as CustomEvent).detail;
      if (field === "points") return event.preventDefault();
      if (list.querySelector('[data-ok-data-grid-context-action="done"]')) return;
      const item = document.createElement("li");
      item.setAttribute("role", "menuitem");
      item.tabIndex = -1;
      item.setAttribute("data-ok-menu-item", "");
      item.setAttribute("data-ok-data-grid-context-action", "done");
      item.textContent = "Mark as done";
      list.append(item);
    });
    root.addEventListener("ok:data-grid:contextmenuselect", (event) => {
      chosen((event as CustomEvent).detail);
      if ((event as CustomEvent).detail.action === "copy") event.preventDefault();
    });
    expect(contextMenu(cell(host, "is-1", "points"))).toBe(true);
    expect(menu().hasAttribute("data-ok-open")).toBe(false);
    contextMenu(cell(host, "is-4", "title"));
    action("done").click();
    expect(chosen).toHaveBeenLastCalledWith({ action: "done", id: "is-4", field: "title" });
    contextMenu(cell(host, "is-4", "title"));
    action("copy").click();
    expect(writeText).not.toHaveBeenCalled();
    // Without the option the browser's menu stays.
    root.removeAttribute("data-ok-context-menu");
    expect(contextMenu(cell(host, "is-4", "title"))).toBe(true);
  });
});

describe("data grid filter groups (HTML)", () => {
  const panel = () => document.getElementById("grid-filters-filters") as HTMLElement;
  const box = () => panel().querySelector("[data-ok-data-grid-panel]") as HTMLElement;
  const shown = (host: Element) =>
    [...host.querySelectorAll<HTMLElement>('[data-ok-data-grid-body] > [role="row"]')]
      .filter((row) => !row.hidden)
      .map((row) => row.querySelector('[data-ok-field="title"]')?.textContent?.trim());
  const change = (element: Element, value: string) => {
    (element as HTMLInputElement).value = value;
    element.dispatchEvent(
      new Event(element.tagName === "INPUT" ? "input" : "change", { bubbles: true }),
    );
  };

  it("reads nested groups from the panel and filters with them", async () => {
    const { host, root } = setup(filtersHtml);
    const models: unknown[] = [];
    root.addEventListener("ok:data-grid:filter", (e) =>
      models.push((e as CustomEvent).detail.model),
    );
    const group = panel().querySelector("#grid-filters-filter-group-g0") as HTMLElement;
    expect(group.getAttribute("aria-label")).toBe("Filter group 1");
    change(group.querySelector("#grid-filters-filter-logic-g0-1") as Element, "and");
    expect(models.at(-1)).toEqual({
      items: [{ field: "points", operator: ">", value: "2" }],
      logicOperator: "and",
      groups: [
        {
          items: [
            { field: "priority", operator: "equals", value: "High" },
            { field: "priority", operator: "equals", value: "Medium" },
          ],
          logicOperator: "and",
        },
      ],
    });
    expect(shown(host)).toEqual([]);
    change(group.querySelector("#grid-filters-filter-logic-g0-1") as Element, "or");
    change(group.querySelector("#grid-filters-filter-value-g0-1") as Element, "");
    expect(shown(host)).toEqual(["Fix the login form", "Speed up search"]);
    await expectNoAxeViolations(document.body);
  });

  it("adds, nests, renames and removes rows and groups like React", () => {
    const { host, root } = setup(filtersHtml);
    const models: { groups?: unknown[] }[] = [];
    root.addEventListener("ok:data-grid:filter", (e) =>
      models.push((e as CustomEvent).detail.model),
    );
    (box().querySelector(":scope > [data-ok-data-grid-filter-add]") as HTMLElement).click();
    // The new row comes before the group; the group's And / Or is now the third entry's.
    const rows = box().querySelectorAll(":scope > [data-ok-data-grid-filter]");
    expect(rows).toHaveLength(2);
    expect(rows[1]?.querySelector("select")?.id).toBe("grid-filters-filter-logic-1");
    expect(
      (panel().querySelector("#grid-filters-filter-logic-g0") as HTMLSelectElement).disabled,
    ).toBe(true);
    (box().querySelector(":scope > [data-ok-data-grid-filter-add-group]") as HTMLElement).click();
    const second = panel().querySelector("#grid-filters-filter-group-g1") as HTMLElement;
    expect(second.getAttribute("aria-label")).toBe("Filter group 2");
    expect(second.querySelector("#grid-filters-filter-field-g1-0")).not.toBeNull();
    expect(second.querySelector('label[for="grid-filters-filter-field-g1-0"]')).not.toBeNull();
    expect(models.at(-1)?.groups).toHaveLength(2);
    // Nested: Add group inside the second group.
    (
      second.querySelector(
        ":scope > [data-ok-data-grid-filter-group-actions] > [data-ok-data-grid-filter-add-group]",
      ) as HTMLElement
    ).click();
    const nested = panel().querySelector("#grid-filters-filter-group-g1-g0") as HTMLElement;
    expect(nested.getAttribute("aria-label")).toBe("Filter group 2.1");
    expect(nested.querySelector("#grid-filters-filter-logic-g1-g0")).not.toBeNull();
    change(nested.querySelector("#grid-filters-filter-value-g1-g0-0") as Element, "search");
    expect(models.at(-1)).toMatchObject({
      groups: [{}, { groups: [{ items: [{ field: "title", value: "search" }] }] }],
    });
    // Removing the first group renames the second one.
    (
      panel().querySelector(
        "#grid-filters-filter-group-g0 [data-ok-data-grid-filter-group-remove]",
      ) as HTMLElement
    ).click();
    expect(panel().querySelector("#grid-filters-filter-group-g0")?.getAttribute("aria-label")).toBe(
      "Filter group 1",
    );
    expect(panel().querySelector("#grid-filters-filter-value-g0-g0-0")).not.toBeNull();
    // A group's last row takes its group with it.
    const last = panel().querySelector("#grid-filters-filter-group-g0-g0") as HTMLElement;
    (last.querySelector("[data-ok-data-grid-filter-remove]") as HTMLElement).click();
    expect(panel().querySelector("#grid-filters-filter-group-g0-g0")).toBeNull();
    expect(host.querySelectorAll("[data-ok-data-grid-filter-group]")).toHaveLength(1);
    // The first panel row goes: the next one loses its And / Or field.
    (
      box().querySelector(
        ":scope > [data-ok-data-grid-filter] [data-ok-data-grid-filter-remove]",
      ) as HTMLElement
    ).click();
    const first = box().querySelector(":scope > [data-ok-data-grid-filter]") as HTMLElement;
    expect(first.querySelector('select[id*="-filter-logic"]')).toBeNull();
    expect(first.querySelector("select")?.id).toBe("grid-filters-filter-field");
  });

  it("hides Add group without the option or with one filter", () => {
    const { root } = setup(filtersHtml, (r) => r.removeAttribute("data-ok-filter-groups"));
    const buttons = () => [
      ...panel().querySelectorAll<HTMLElement>("[data-ok-data-grid-filter-add-group]"),
    ];
    expect(buttons().every((b) => b.hidden)).toBe(true);
    root.setAttribute("data-ok-filter-groups", "");
    root.setAttribute("data-ok-disable-multiple-columns-filtering", "");
    return settle().then(() => expect(buttons().every((b) => b.hidden)).toBe(true));
  });
});
