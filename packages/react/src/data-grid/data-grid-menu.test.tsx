import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { userEvent } from "vitest/browser";
import { expectNoAxeViolations } from "../test-utils.js";
import { DataGrid, type DataGridProps, type GridColDef } from "./data-grid.js";

interface Issue {
  id: string;
  title: string;
  priority: string;
  points: number;
}
const ISSUES: Issue[] = [
  { id: "1", title: "Login", priority: "High", points: 3 },
  { id: "2", title: "Docs", priority: "Low", points: 2 },
  { id: "3", title: "Dark mode", priority: "Medium", points: 8 },
  { id: "4", title: "Search", priority: "High", points: 1 },
];
const COLUMNS: GridColDef<Issue>[] = [
  { field: "title", headerName: "Title", width: 140, editable: true },
  { field: "priority", headerName: "Priority", width: 120 },
  { field: "points", headerName: "Points", type: "number", width: 100, editable: true },
];

const writeText = vi.fn<(text: string) => Promise<void>>();
const readText = vi.fn<() => Promise<string>>();
beforeEach(() => {
  writeText.mockReset().mockResolvedValue(undefined);
  readText.mockReset().mockResolvedValue("");
  Object.defineProperty(navigator, "clipboard", {
    value: { writeText, readText },
    configurable: true,
  });
});
afterEach(() => {
  delete (navigator as { clipboard?: unknown }).clipboard;
  vi.restoreAllMocks();
});

const cell = (rowId: string, field: string) =>
  document.querySelector<HTMLElement>(
    `[data-ok-row-id="${rowId}"] [role="gridcell"][data-ok-field="${field}"]`,
  ) as HTMLElement;
const menu = () => document.getElementById("g-context-menu") as HTMLElement;
const action = (name: string) =>
  menu().querySelector<HTMLElement>(`[data-ok-data-grid-context-action="${name}"]`) as HTMLElement;
/** The menu's own items (a submenu by its trigger's text). */
const topItems = () =>
  [...menu().querySelectorAll(":scope > ul > li")].map((li) =>
    (li.matches("[data-ok-menu-submenu]") ? li.firstElementChild : li)?.textContent?.trim(),
  );
const live = () => document.querySelector("[data-ok-data-grid-live]")?.textContent;
const texts = () =>
  [...document.querySelectorAll<HTMLElement>('[data-ok-data-grid-body] > [role="row"]')]
    .filter((row) => !row.hidden)
    .map((row) => row.querySelector('[data-ok-field="title"]')?.textContent);
const grid = (props: Partial<DataGridProps<Issue>> = {}) => (
  <DataGrid
    id="g"
    aria-label="Issues"
    disableVirtualization
    rows={ISSUES}
    columns={COLUMNS}
    contextMenu
    hideFooter
    {...props}
  />
);
const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

describe("DataGrid context menu", () => {
  it("opens at the pointer on a right click, with the default items", async () => {
    render(grid());
    const target = cell("2", "priority");
    expect(fireEvent.contextMenu(target, { clientX: 120, clientY: 60 })).toBe(false);
    expect(menu().hasAttribute("data-ok-open")).toBe(true);
    expect(menu().getAttribute("data-ok-anchor-position")).toBe("60,120");
    expect(document.activeElement).not.toBe(target);
    expect(topItems()).toEqual(["Copy", "Paste", "Export", "Pin column"]);
    expect(within(menu()).getByRole("menu", { name: "Cell actions" })).toBeTruthy();
    expect(action("paste").hasAttribute("data-ok-show-divider")).toBe(true);
    expect(action("unpin").getAttribute("aria-disabled")).toBe("true");
    await expectNoAxeViolations(document.body);
    // Escape closes it; the focus goes back to the cell.
    await userEvent.keyboard("{Escape}");
    expect(menu().hasAttribute("data-ok-open")).toBe(false);
    expect(document.activeElement).toBe(target);
  });

  it("opens from Shift + F10 and the Menu key at the focused cell", () => {
    render(grid());
    const target = cell("1", "title");
    target.focus();
    expect(fireEvent.keyDown(target, { key: "F10", shiftKey: true })).toBe(false);
    expect(menu().hasAttribute("data-ok-open")).toBe(true);
    const box = target.getBoundingClientRect();
    expect(menu().getAttribute("data-ok-anchor-position")).toBe(`${box.bottom},${box.left}`);
    // The browser's own menu that follows the key is swallowed.
    expect(fireEvent.contextMenu(target, { button: 0 })).toBe(false);
    expect(menu().getAttribute("data-ok-anchor-position")).toBe(`${box.bottom},${box.left}`);
    fireEvent.keyDown(document.activeElement as Element, { key: "Escape" });
    expect(fireEvent.keyDown(target, { key: "ContextMenu" })).toBe(false);
    expect(menu().hasAttribute("data-ok-open")).toBe(true);
  });

  it("copies, pastes, pins and exports from the menu", async () => {
    const onRows = vi.fn((row: Issue) => row);
    const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:x");
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const onPinned = vi.fn();
    render(grid({ processRowUpdate: onRows, onPinnedColumnsChange: onPinned }));
    fireEvent.contextMenu(cell("3", "title"));
    fireEvent.click(action("copy"));
    expect(writeText).toHaveBeenCalledWith("Dark mode");
    expect(document.activeElement).toBe(cell("3", "title"));
    // Paste reads the clipboard and writes the editable cells from the cell.
    readText.mockResolvedValue("Night mode\t5");
    fireEvent.contextMenu(cell("3", "title"));
    fireEvent.click(action("paste"));
    await settle();
    await settle();
    expect(onRows).toHaveBeenCalledWith(
      { id: "3", title: "Night mode", priority: "Medium", points: 8 },
      ISSUES[2],
    );
    // A refused read is announced with the keyboard way.
    readText.mockRejectedValue(new Error("denied"));
    fireEvent.contextMenu(cell("1", "title"));
    fireEvent.click(action("paste"));
    await settle();
    expect(live()).toBe("Press Ctrl + V (Cmd + V on a Mac) to paste");
    // Pin the cell's column; Pin to left is then disabled.
    fireEvent.contextMenu(cell("1", "priority"));
    fireEvent.click(action("pin-left"));
    expect(onPinned).toHaveBeenLastCalledWith({ left: ["priority"], right: [] });
    fireEvent.contextMenu(cell("1", "priority"));
    expect(action("pin-left").getAttribute("aria-disabled")).toBe("true");
    expect(action("unpin").hasAttribute("aria-disabled")).toBe(false);
    fireEvent.click(action("export-csv"));
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    fireEvent.contextMenu(cell("1", "priority"));
    fireEvent.click(action("export-excel"));
    expect(createObjectURL).toHaveBeenCalledTimes(2);
  });

  it("falls back to the copy command without the Clipboard API", async () => {
    delete (navigator as { clipboard?: unknown }).clipboard;
    Object.defineProperty(navigator, "clipboard", { value: undefined, configurable: true });
    const exec = vi.spyOn(document, "execCommand").mockReturnValue(true);
    render(grid());
    fireEvent.contextMenu(cell("2", "title"));
    fireEvent.click(action("copy"));
    await settle();
    expect(exec).toHaveBeenCalledWith("copy");
  });

  it("selects the pressed cell, charts the selection, and takes custom items", async () => {
    const onCells = vi.fn();
    const onModel = vi.fn();
    const done = vi.fn();
    render(
      grid({
        cellSelection: true,
        chartsIntegration: true,
        onCellSelectionModelChange: onCells,
        onChartModelChange: onModel,
        getContextMenuItems: ({ defaultItems, row }) => [
          ...defaultItems,
          "separator",
          { name: "done", label: `Close ${row.title}`, onClick: done },
          { name: "off", label: "Off", disabled: true },
        ],
      }),
    );
    fireEvent.contextMenu(cell("3", "points"));
    expect(onCells).toHaveBeenLastCalledWith({ "3": { points: true } });
    expect(topItems()).toEqual([
      "Copy",
      "Paste",
      "Export",
      "Chart from selection",
      "Pin column",
      "Close Dark mode",
      "Off",
    ]);
    expect(action("pin").hasAttribute("data-ok-show-divider")).toBe(true);
    expect(action("off").getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(action("chart-range"));
    expect(onModel.mock.lastCall?.[0]).toMatchObject({ values: ["points"], rows: ["3"] });
    expect(live()).toBe("Chart created: Range chart 1");
    fireEvent.contextMenu(cell("1", "title"));
    fireEvent.click(action("done"));
    expect(done).toHaveBeenCalledWith(
      expect.objectContaining({ id: "1", field: "title", value: "Login", row: ISSUES[0] }),
    );
    expect(done.mock.lastCall?.[0].defaultItems).toEqual([
      "copy",
      "paste",
      "separator",
      "export",
      "chart-range",
      "separator",
      "pin",
    ]);
  });

  it("prints, unpins and skips unknown item names", () => {
    // The grid prints from a hidden iframe: stub that frame's print, or Firefox opens a real dialog
    // and the page hangs.
    const print = vi.fn();
    const append = document.body.append.bind(document.body);
    vi.spyOn(document.body, "append").mockImplementation((...nodes) => {
      append(...nodes);
      for (const node of nodes)
        if (node instanceof HTMLIFrameElement) (node.contentWindow as Window).print = print;
    });
    const onPinned = vi.fn();
    render(
      grid({
        initialState: { pinnedColumns: { left: ["title"] } },
        onPinnedColumnsChange: onPinned,
        getContextMenuItems: ({ defaultItems }) => [
          "nope" as never,
          ...defaultItems.filter((name) => name !== "paste"),
        ],
      }),
    );
    fireEvent.contextMenu(cell("1", "title"));
    expect(topItems()).toEqual(["Copy", "Export", "Pin column"]);
    expect(action("pin-left").getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(action("unpin"));
    expect(onPinned).toHaveBeenLastCalledWith({ left: [], right: [] });
    fireEvent.contextMenu(cell("1", "title"));
    fireEvent.click(action("print"));
    expect(menu().hasAttribute("data-ok-open")).toBe(false);
    expect(print).toHaveBeenCalledTimes(1);
    document.querySelector("iframe")?.remove();
  });

  it("leaves the browser's menu off the grid's options and in fields", () => {
    const { rerender } = render(grid({ contextMenu: false }));
    expect(menu()).toBeNull();
    expect(fireEvent.contextMenu(cell("1", "title"))).toBe(true);
    rerender(grid({ columns: [...COLUMNS, { field: "actions", type: "actions", width: 80 }] }));
    expect(fireEvent.contextMenu(cell("1", "actions"))).toBe(true);
    const header = document.querySelector('[role="columnheader"][data-ok-field="title"]');
    expect(fireEvent.contextMenu(header as Element)).toBe(true);
    rerender(grid({ disableColumnPinning: true, disableClipboardPaste: true }));
    expect(topItems()).toEqual(["Copy", "Export"]);
  });
});

describe("DataGrid filter groups", () => {
  const filterGrid = (props: Partial<DataGridProps<Issue>> = {}) =>
    grid({ contextMenu: false, showToolbar: true, filterGroups: true, ...props });
  const panel = () => document.getElementById("g-filters") as HTMLElement;

  it("filters with nested groups of And / Or (JSON model)", async () => {
    const onFilter = vi.fn();
    render(
      filterGrid({
        onFilterModelChange: onFilter,
        initialState: {
          filter: {
            filterModel: {
              items: [{ field: "points", operator: ">", value: "1" }],
              groups: [
                {
                  logicOperator: "or",
                  items: [
                    { field: "priority", operator: "equals", value: "High" },
                    { field: "priority", operator: "equals", value: "Medium" },
                  ],
                },
              ],
            },
          },
        },
      }),
    );
    expect(texts()).toEqual(["Login", "Dark mode"]);
    await userEvent.click(screen.getByRole("button", { name: "Filters" }));
    const group = within(panel()).getByRole("group", { name: "Filter group 1" });
    expect(group.id).toBe("g-filter-group-g0");
    // The group joins the panel's rows with their And; its second row shows its own Or.
    expect((group.querySelector("#g-filter-logic-g0") as HTMLSelectElement).value).toBe("and");
    expect((group.querySelector("#g-filter-logic-g0-1") as HTMLSelectElement).value).toBe("or");
    expect((group.querySelector("#g-filter-value-g0-1") as HTMLInputElement).value).toBe("Medium");
    // The group's And / Or.
    fireEvent.change(group.querySelector("#g-filter-logic-g0-1") as HTMLSelectElement, {
      target: { value: "and" },
    });
    expect(onFilter.mock.lastCall?.[0].groups[0].logicOperator).toBe("and");
    expect(texts()).toEqual([]);
    fireEvent.change(group.querySelector("#g-filter-logic-g0-1") as HTMLSelectElement, {
      target: { value: "or" },
    });
    // The panel's And / Or joins the row and the group.
    fireEvent.change(group.querySelector("#g-filter-logic-g0") as HTMLSelectElement, {
      target: { value: "or" },
    });
    expect(onFilter.mock.lastCall?.[0].logicOperator).toBe("or");
    expect(texts()).toEqual(["Login", "Docs", "Dark mode", "Search"]);
    await expectNoAxeViolations(document.body);
  });

  it("adds, nests and removes groups", async () => {
    const onFilter = vi.fn();
    render(filterGrid({ onFilterModelChange: onFilter }));
    await userEvent.click(screen.getByRole("button", { name: "Filters" }));
    const box = panel().querySelector("[data-ok-data-grid-panel]") as HTMLElement;
    fireEvent.click(box.querySelector(":scope > [data-ok-data-grid-filter-add-group]") as Element);
    expect(onFilter.mock.lastCall?.[0]).toEqual({
      items: [],
      groups: [{ items: [{ field: "title", operator: "contains" }] }],
    });
    const group = within(panel()).getByRole("group", { name: "Filter group 1" });
    fireEvent.click(group.querySelector("[data-ok-data-grid-filter-add-group]") as Element);
    expect(within(panel()).getByRole("group", { name: "Filter group 1.1" }).id).toBe(
      "g-filter-group-g0-g0",
    );
    fireEvent.click(
      group.querySelector(
        ":scope > [data-ok-data-grid-filter-group-actions] > [data-ok-data-grid-filter-add]",
      ) as Element,
    );
    expect(onFilter.mock.lastCall?.[0].groups[0].items).toHaveLength(2);
    // The nested group follows the group's two rows: its And / Or is shown, disabled.
    expect((panel().querySelector("#g-filter-logic-g0-g0") as HTMLSelectElement).disabled).toBe(
      true,
    );
    fireEvent.change(panel().querySelector("#g-filter-value-g0-1") as HTMLInputElement, {
      target: { value: "s" },
    });
    expect(onFilter.mock.lastCall?.[0].groups[0].items[1].value).toBe("s");
    // Removing one of two rows keeps the group.
    fireEvent.click(
      panel().querySelector(
        "#g-filter-group-g0 > [data-ok-data-grid-filter]:nth-of-type(3) [data-ok-data-grid-filter-remove]",
      ) as Element,
    );
    expect(onFilter.mock.lastCall?.[0].groups[0].items).toHaveLength(1);
    fireEvent.click(
      group.querySelector(
        ":scope > [data-ok-data-grid-filter-group-actions] > [data-ok-data-grid-filter-add]",
      ) as Element,
    );
    fireEvent.change(panel().querySelector("#g-filter-value-g0-g0-0") as HTMLInputElement, {
      target: { value: "o" },
    });
    expect(onFilter.mock.lastCall?.[0].groups[0].groups[0].items[0].value).toBe("o");
    // Removing a group's last row removes the group.
    const nested = within(panel()).getByRole("group", { name: "Filter group 1.1" });
    fireEvent.click(nested.querySelector("[data-ok-data-grid-filter-remove]") as Element);
    expect(onFilter.mock.lastCall?.[0].groups[0].groups).toBeUndefined();
    fireEvent.click(
      within(panel()).getByRole("button", { name: "Remove group" }) as HTMLButtonElement,
    );
    expect(onFilter.mock.lastCall?.[0]).toEqual({ items: [] });
    await expectNoAxeViolations(document.body);
  });

  it("offers Add group only with filterGroups and several filters", async () => {
    const { rerender } = render(filterGrid({ filterGroups: false }));
    await userEvent.click(screen.getByRole("button", { name: "Filters" }));
    expect(panel().querySelector("[data-ok-data-grid-filter-add-group]")).toBeNull();
    rerender(filterGrid({ disableMultipleColumnsFiltering: true }));
    expect(panel().querySelector("[data-ok-data-grid-filter-add-group]")).toBeNull();
    // A model's groups still show, without buttons to add more.
    rerender(
      filterGrid({
        disableMultipleColumnsFiltering: true,
        filterModel: { items: [], groups: [{ items: [{ field: "title", operator: "isEmpty" }] }] },
      }),
    );
    const group = within(panel()).getByRole("group", { name: "Filter group 1" });
    expect(group.querySelector("[data-ok-data-grid-filter-group-actions]")).toBeNull();
    expect(texts()).toEqual([]);
  });
});
