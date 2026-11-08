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
