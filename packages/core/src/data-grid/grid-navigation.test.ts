import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import { createGridNavigation, gridFocusTarget, moveGridCell } from "./grid-navigation.js";

afterEach(cleanupDom);

const GRID = `<div role="grid" id="g">
  <div role="rowgroup"><div role="row">
    <div role="columnheader" data-ok-field="__check__" tabindex="-1"><input type="checkbox" tabindex="-1" aria-label="all"></div>
    <div role="columnheader" data-ok-field="name" aria-sort="none" tabindex="-1">Name<button type="button" data-ok-data-grid-menu-button tabindex="-1" aria-label="menu">⋮</button></div>
    <div role="columnheader" data-ok-field="act" tabindex="-1">Act</div>
  </div></div>
  <div role="rowgroup" data-ok-data-grid-body>
    ${[1, 2, 3]
      .map(
        (n) => `<div role="row" data-ok-row-id="${n}" aria-selected="false">
      <div role="gridcell" tabindex="-1"><input type="checkbox" tabindex="-1" aria-label="row ${n}"></div>
      <div role="gridcell" tabindex="-1">Name ${n}</div>
      <div role="gridcell" tabindex="-1"><button type="button" tabindex="-1">Edit ${n}</button></div>
    </div>`,
      )
      .join("")}
    <div role="row" hidden><div role="gridcell" tabindex="-1">hidden</div></div>
  </div>
</div>`;

const setup = () => {
  const host = mount(GRID);
  const grid = host.querySelector<HTMLElement>("#g") as HTMLElement;
  const spies = {
    onSort: vi.fn(),
    onColumnMenu: vi.fn(),
    onToggleRow: vi.fn(),
    onSelectAll: vi.fn(),
  };
  const nav = createGridNavigation(grid, spies);
  return { grid, spies, nav };
};
const press = (target: Element, key: string, init: KeyboardEventInit = {}) =>
  target.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true, ...init }),
  );
const stop = (grid: HTMLElement) => grid.querySelectorAll('[tabindex="0"]');

describe("moveGridCell", () => {
  const size = { rows: 4, cols: () => 3, page: 2 };
  it("moves and clamps", () => {
    expect(moveGridCell({ row: 0, col: 0 }, "ArrowUp", size)).toEqual({ row: 0, col: 0 });
    expect(moveGridCell({ row: 3, col: 2 }, "ArrowDown", size)).toEqual({ row: 3, col: 2 });
    expect(moveGridCell({ row: 1, col: 0 }, "ArrowLeft", size)).toEqual({ row: 1, col: 0 });
    expect(moveGridCell({ row: 1, col: 2 }, "ArrowRight", size)).toEqual({ row: 1, col: 2 });
    expect(moveGridCell({ row: 1, col: 1 }, "Home", size)).toEqual({ row: 1, col: 0 });
    expect(moveGridCell({ row: 1, col: 1 }, "End", size)).toEqual({ row: 1, col: 2 });
    expect(moveGridCell({ row: 1, col: 1 }, "Home", size, true)).toEqual({ row: 0, col: 0 });
    expect(moveGridCell({ row: 1, col: 1 }, "End", size, true)).toEqual({ row: 3, col: 2 });
    expect(moveGridCell({ row: 0, col: 1 }, "PageDown", size)).toEqual({ row: 2, col: 1 });
    expect(moveGridCell({ row: 3, col: 1 }, "PageUp", size)).toEqual({ row: 1, col: 1 });
    expect(moveGridCell({ row: 1, col: 1 }, "x", size)).toBeNull();
  });
});

describe("createGridNavigation", () => {
  it("one tab stop: the first header's control; focus moves it", () => {
    const { grid } = setup();
    expect([...stop(grid)].map((e) => e.getAttribute("aria-label"))).toEqual(["all"]);
    const name = grid.querySelectorAll<HTMLElement>('[role="gridcell"]')[1] as HTMLElement;
    name.focus();
    expect(stop(grid)).toHaveLength(1);
    expect(stop(grid)[0]).toBe(name);
    expect(gridFocusTarget(name)).toBe(name);
  });

  it("arrow keys move the focus, controls inside cells take it, hidden rows are skipped", () => {
    const { grid } = setup();
    const all = grid.querySelector<HTMLElement>('[aria-label="all"]') as HTMLElement;
    all.focus();
    press(all, "ArrowRight");
    const header = grid.querySelector('[data-ok-field="name"]') as HTMLElement;
    expect(document.activeElement).toBe(header);
    press(header, "ArrowDown");
    expect(document.activeElement?.textContent).toBe("Name 1");
    press(document.activeElement as Element, "ArrowRight");
    expect(document.activeElement?.textContent).toBe("Edit 1");
    press(document.activeElement as Element, "End", { ctrlKey: true });
    expect(document.activeElement?.textContent).toBe("Edit 3");
    press(document.activeElement as Element, "PageUp");
    expect(press(document.activeElement as Element, "x")).toBe(true);
  });

  it("Shift + Up / Down reports a row range; Shift + Space toggles the row", () => {
    const host = mount(GRID);
    const grid = host.querySelector<HTMLElement>("#g") as HTMLElement;
    const onRowRange = vi.fn();
    const onToggleRow = vi.fn();
    createGridNavigation(grid, {
      onSort: vi.fn(),
      onColumnMenu: vi.fn(),
      onToggleRow,
      onSelectAll: vi.fn(),
      onRowRange,
    });
    const rows = grid.querySelectorAll<HTMLElement>("[data-ok-data-grid-body] > [role='row']");
    const name = (n: number) => (rows[n] as HTMLElement).children[1] as HTMLElement;
    name(0).focus();
    press(name(0), " ", { shiftKey: true });
    expect(onToggleRow).toHaveBeenCalledWith(rows[0]);
    press(name(0), "ArrowDown", { shiftKey: true });
    expect(document.activeElement).toBe(name(1));
    expect(onRowRange).toHaveBeenLastCalledWith(rows[0], rows[1]);
    press(name(1), "ArrowUp", { shiftKey: true });
    expect(onRowRange).toHaveBeenLastCalledWith(rows[1], rows[0]);
    // Not without Shift, not sideways, not at an edge, not from the header.
    press(name(0), "ArrowDown");
    press(name(1), "ArrowRight", { shiftKey: true });
    const top = grid.querySelector<HTMLElement>('[data-ok-field="name"]') as HTMLElement;
    press(top, "ArrowDown", { shiftKey: true });
    name(2).focus();
    press(name(2), "ArrowDown", { shiftKey: true });
    // Rows without selection don't report.
    (rows[1] as HTMLElement).removeAttribute("aria-selected");
    name(0).focus();
    press(name(0), "ArrowDown", { shiftKey: true });
    expect(onRowRange).toHaveBeenCalledTimes(2);
  });

  it("intents: sort, column menu, row toggle, select all", () => {
    const { grid, spies } = setup();
    const header = grid.querySelector<HTMLElement>('[data-ok-field="name"]') as HTMLElement;
    header.focus();
    press(header, "Enter", { shiftKey: true });
    expect(spies.onSort).toHaveBeenCalledWith("name", true);
    press(header, " ");
    expect(spies.onSort).toHaveBeenLastCalledWith("name", false);
    press(header, "Enter", { ctrlKey: true });
    expect(spies.onColumnMenu).toHaveBeenCalledWith("name", header);
    const act = grid.querySelector<HTMLElement>('[data-ok-field="act"]') as HTMLElement;
    press(act, "Enter");
    expect(spies.onSort).toHaveBeenCalledTimes(2);
    const cell = grid.querySelectorAll<HTMLElement>('[role="gridcell"]')[1] as HTMLElement;
    press(cell, " ");
    expect(spies.onToggleRow).toHaveBeenCalledWith(cell.parentElement);
    press(cell, "a", { metaKey: true });
    expect(spies.onSelectAll).toHaveBeenCalled();
    // A text field inside a cell keeps its keys; keys outside cells are ignored.
    const field = document.createElement("input");
    cell.append(field);
    expect(press(field, "ArrowDown")).toBe(true);
    expect(press(grid, "ArrowDown")).toBe(true);
  });

  it("Enter / F2 on a cell edits; Alt + arrows on a header resize", () => {
    const host = mount(GRID);
    const grid = host.querySelector<HTMLElement>("#g") as HTMLElement;
    const onEdit = vi.fn();
    const onResizeKey = vi.fn();
    createGridNavigation(grid, {
      onSort: vi.fn(),
      onColumnMenu: vi.fn(),
      onToggleRow: vi.fn(),
      onSelectAll: vi.fn(),
      onEdit,
      onResizeKey,
    });
    const cell = grid.querySelectorAll<HTMLElement>('[role="gridcell"]')[1] as HTMLElement;
    press(cell, "Enter");
    press(cell, "F2");
    expect(onEdit).toHaveBeenCalledTimes(2);
    const header = grid.querySelector<HTMLElement>('[data-ok-field="name"]') as HTMLElement;
    press(header, "ArrowLeft", { altKey: true });
    press(header, "ArrowRight", { altKey: true });
    expect(onResizeKey.mock.calls).toEqual([
      ["name", -10],
      ["name", 10],
    ]);
    // Without the handlers: nothing happens.
    const plain = mount(GRID).querySelector<HTMLElement>("#g") as HTMLElement;
    createGridNavigation(plain, {
      onSort: vi.fn(),
      onColumnMenu: vi.fn(),
      onToggleRow: vi.fn(),
      onSelectAll: vi.fn(),
    });
    const other = plain.querySelectorAll<HTMLElement>('[role="gridcell"]')[1] as HTMLElement;
    expect(press(other, "Enter")).toBe(true);
    expect(
      press(plain.querySelector('[data-ok-field="name"]') as Element, "ArrowLeft", {
        altKey: true,
      }),
    ).toBe(false);
  });

  it("typing a character edits; right to left swaps the arrows and Alt + arrows", () => {
    const host = mount(GRID);
    const grid = host.querySelector<HTMLElement>("#g") as HTMLElement;
    const onEdit = vi.fn();
    const onResizeKey = vi.fn();
    createGridNavigation(grid, {
      onSort: vi.fn(),
      onColumnMenu: vi.fn(),
      onToggleRow: vi.fn(),
      onSelectAll: vi.fn(),
      onEdit,
      onResizeKey,
    });
    const cell = grid.querySelectorAll<HTMLElement>('[role="gridcell"]')[1] as HTMLElement;
    press(cell, "F2");
    press(cell, "x");
    // Modified keys, long key names and Space don't start editing.
    press(cell, "x", { ctrlKey: true });
    press(cell, "x", { altKey: true });
    press(cell, "Tab");
    expect(onEdit.mock.calls).toEqual([
      [cell, "f2KeyDown"],
      [cell, "printableKeyDown", "x"],
    ]);
    grid.setAttribute("dir", "rtl");
    cell.focus();
    press(cell, "ArrowLeft");
    expect(document.activeElement?.textContent).toBe("Edit 1");
    press(document.activeElement as Element, "ArrowRight");
    expect(document.activeElement).toBe(cell);
    const header = grid.querySelector<HTMLElement>('[data-ok-field="name"]') as HTMLElement;
    press(header, "ArrowLeft", { altKey: true });
    expect(onResizeKey).toHaveBeenCalledWith("name", 10);
  });

  it("up and down keep the column across spans; covered cells are skipped", () => {
    const host = mount(`<div role="grid" id="s">
      <div role="row"><div role="gridcell" aria-colindex="1" tabindex="-1">a1</div><div role="gridcell" aria-colindex="2" tabindex="-1">b1</div></div>
      <div role="row"><div role="gridcell" aria-colindex="1" aria-colspan="2" tabindex="-1">ab2</div><div role="gridcell" aria-colindex="2" hidden tabindex="-1">x</div></div>
      <div role="row"><div role="gridcell" aria-colindex="1" aria-rowspan="2" tabindex="-1">a3</div><div role="gridcell" aria-colindex="2" tabindex="-1">b3</div></div>
      <div role="row"><div role="gridcell" aria-colindex="1" data-ok-covered tabindex="-1">a4</div><div role="gridcell" aria-colindex="2" tabindex="-1">b4</div></div>
    </div>`);
    const grid = host.querySelector<HTMLElement>("#s") as HTMLElement;
    createGridNavigation(grid, {
      onSort: vi.fn(),
      onColumnMenu: vi.fn(),
      onToggleRow: vi.fn(),
      onSelectAll: vi.fn(),
    });
    const at = (text: string) =>
      [...grid.querySelectorAll<HTMLElement>('[role="gridcell"]')].find(
        (c) => c.textContent === text,
      ) as HTMLElement;
    at("b1").focus();
    press(at("b1"), "ArrowDown");
    expect(document.activeElement?.textContent).toBe("ab2");
    press(at("ab2"), "ArrowDown");
    expect(document.activeElement?.textContent).toBe("a3");
    press(at("b4"), "ArrowUp");
    expect(document.activeElement?.textContent).toBe("b3");
    at("a3").focus();
    press(at("a3"), "ArrowDown");
    // The row below has no cell in column 1 (covered): the column stays, the row is passed.
    expect(document.activeElement?.textContent).toBe("a3");
  });

  it("tree data: Right opens, Left closes or goes to the parent", () => {
    const host = mount(`<div role="treegrid" id="t">
      <div role="row" data-ok-row-id="p" aria-expanded="false"><div role="gridcell" data-ok-field="__tree_data_group__" tabindex="-1">P</div><div role="gridcell" tabindex="-1">p</div></div>
      <div role="row" data-ok-row-id="o" aria-expanded="true"><div role="gridcell" data-ok-field="__tree_data_group__" tabindex="-1">O</div><div role="gridcell" tabindex="-1">o</div></div>
      <div role="row" data-ok-row-id="c" data-ok-parent="o"><div role="gridcell" data-ok-field="__tree_data_group__" tabindex="-1">C</div><div role="gridcell" tabindex="-1">c</div></div>
    </div>`);
    const grid = host.querySelector<HTMLElement>("#t") as HTMLElement;
    const onToggleExpansion = vi.fn();
    createGridNavigation(grid, {
      onSort: vi.fn(),
      onColumnMenu: vi.fn(),
      onToggleRow: vi.fn(),
      onSelectAll: vi.fn(),
      onToggleExpansion,
    });
    const cell = (id: string) =>
      grid.querySelector<HTMLElement>(`[data-ok-row-id="${id}"] [data-ok-field]`) as HTMLElement;
    press(cell("p"), "ArrowRight");
    press(cell("o"), "ArrowLeft");
    expect(
      onToggleExpansion.mock.calls.map(([row, open]) => [row.getAttribute("data-ok-row-id"), open]),
    ).toEqual([
      ["p", true],
      ["o", false],
    ]);
    cell("c").focus();
    press(cell("c"), "ArrowLeft");
    expect(document.activeElement).toBe(cell("o"));
    // Elsewhere: the arrows move between cells.
    press(cell("p"), "ArrowLeft");
    press(cell("c"), "ArrowRight");
    expect(document.activeElement?.textContent).toBe("c");
  });

  it("a Select editor keeps its keys; its hidden input never takes the cell's focus", () => {
    const { grid, spies } = setup();
    const cell = grid.querySelectorAll<HTMLElement>('[role="gridcell"]')[1] as HTMLElement;
    cell.setAttribute("data-ok-editing", "");
    cell.innerHTML = `<div data-ok-select>
      <div data-ok-select-display role="combobox" tabindex="-1" aria-label="Edit name">a</div>
      <input data-ok-select-input aria-hidden="true" tabindex="-1">
      <div data-ok-popover><ul role="listbox"><li role="option" tabindex="-1">a</li></ul></div>
    </div>`;
    const trigger = cell.querySelector<HTMLElement>('[role="combobox"]') as HTMLElement;
    const option = cell.querySelector<HTMLElement>('[role="option"]') as HTMLElement;
    trigger.focus();
    expect(gridFocusTarget(cell)).toBe(cell);
    expect(cell.querySelector("input")?.getAttribute("tabindex")).toBe("-1");
    for (const key of ["ArrowDown", "ArrowRight", "Home", "Enter", "x"]) {
      expect(press(trigger, key)).toBe(true);
      expect(press(option, key)).toBe(true);
    }
    expect(document.activeElement).toBe(trigger);
    // Out of the editor, the cell navigates again.
    cell.focus();
    press(cell, "ArrowDown");
    expect(document.activeElement).not.toBe(cell);
    expect(spies.onSort).not.toHaveBeenCalled();
  });

  it("sync restores a tab stop after re-rendering; destroy stops listening", () => {
    const { grid, nav, spies } = setup();
    const name = grid.querySelectorAll<HTMLElement>('[role="gridcell"]')[1] as HTMLElement;
    name.focus();
    name.setAttribute("tabindex", "-1");
    nav.sync();
    expect(name.getAttribute("tabindex")).toBe("0");
    name.closest('[role="row"]')?.remove();
    nav.sync();
    expect(stop(grid)).toHaveLength(1);
    nav.destroy();
    const header = grid.querySelector<HTMLElement>('[data-ok-field="name"]') as HTMLElement;
    press(header, "Enter");
    expect(spies.onSort).not.toHaveBeenCalled();
    const empty = mount('<div role="grid"></div>').firstElementChild as HTMLElement;
    createGridNavigation(empty, spies).sync();
    expect(stop(empty)).toHaveLength(0);
  });
});

describe("tabNavigation", () => {
  const tabGrid = (mode: string) => {
    const host = mount(
      `<div data-ok-data-grid data-ok-tab-navigation="${mode}">${GRID.replace(
        '<div role="rowgroup"><div role="row">',
        '<div role="rowgroup" data-ok-data-grid-header><div role="row">',
      )}</div>`,
    );
    const grid = host.querySelector<HTMLElement>("#g") as HTMLElement;
    createGridNavigation(grid, {
      onSort: vi.fn(),
      onColumnMenu: vi.fn(),
      onToggleRow: vi.fn(),
      onSelectAll: vi.fn(),
    });
    return grid;
  };
  /** Presses Tab on the focused element: `true` when the grid moved the focus itself. */
  const tab = (shift = false) =>
    !press(document.activeElement as Element, "Tab", { shiftKey: shift });
  const bodyCell = (grid: HTMLElement, row: number, col: number) =>
    grid.querySelectorAll<HTMLElement>('[data-ok-data-grid-body] [role="gridcell"]')[
      (row - 1) * 3 + col
    ] as HTMLElement;

  it("content: Tab moves through the body cells, then leaves the grid", () => {
    const grid = tabGrid("content");
    bodyCell(grid, 1, 1).focus();
    expect(tab()).toBe(true);
    expect(document.activeElement?.textContent).toBe("Edit 1");
    expect(tab()).toBe(true);
    expect(document.activeElement?.getAttribute("aria-label")).toBe("row 2");
    expect(tab(true)).toBe(true);
    expect(document.activeElement?.textContent).toBe("Edit 1");
    expect(stop(grid)).toHaveLength(1);
    // The last cell: the browser moves on (not prevented).
    (bodyCell(grid, 3, 2).querySelector("button") as HTMLElement).focus();
    expect(tab()).toBe(false);
    // Headers keep one tab stop.
    (grid.querySelector('[data-ok-field="name"]') as HTMLElement).focus();
    expect(tab()).toBe(false);
  });

  it("header: Tab moves through the column headers only", () => {
    const grid = tabGrid("header");
    (grid.querySelector('[data-ok-field="name"]') as HTMLElement).focus();
    expect(tab()).toBe(true);
    expect(document.activeElement?.getAttribute("data-ok-field")).toBe("act");
    expect(tab()).toBe(false);
    bodyCell(grid, 1, 1).focus();
    expect(tab()).toBe(false);
  });

  it("all: from the last header to the first body cell; none and no root leave the grid", () => {
    const grid = tabGrid("all");
    (grid.querySelector('[data-ok-field="act"]') as HTMLElement).focus();
    expect(tab()).toBe(true);
    expect(document.activeElement?.getAttribute("aria-label")).toBe("row 1");
    expect(tab(true)).toBe(true);
    expect(document.activeElement?.getAttribute("data-ok-field")).toBe("act");
    cleanupDom();
    const none = tabGrid("none");
    bodyCell(none, 1, 1).focus();
    expect(tab()).toBe(false);
    cleanupDom();
    const { grid: plain } = setup();
    bodyCell(plain, 1, 1).focus();
    expect(tab()).toBe(false);
  });
});
