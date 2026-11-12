import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import {
  createGridContextMenu,
  gridContextMenuEntries,
  gridDefaultContextMenuItems,
} from "./grid-context-menu.js";

const handles: { destroy(): void }[] = [];
afterEach(() => {
  for (const handle of handles.splice(0)) handle.destroy();
  cleanupDom();
  vi.restoreAllMocks();
});

const GRID = `
<div role="grid" data-ok-data-grid-main>
  <div role="rowgroup" data-ok-data-grid-header>
    <div role="row"><div role="columnheader" data-ok-field="a" tabindex="-1">A</div></div>
  </div>
  <div role="rowgroup" data-ok-data-grid-body>
    <div role="row" data-ok-row-id="r1">
      <div role="gridcell" data-ok-field="a" tabindex="-1">1</div>
      <div role="gridcell" data-ok-field="b" tabindex="-1"><input aria-label="Edit" /></div>
      <div role="gridcell" data-ok-field="c" tabindex="-1">
        <div role="grid" data-ok-data-grid-main aria-label="Inner">
          <div role="rowgroup" data-ok-data-grid-body>
            <div role="row" data-ok-row-id="x"><div role="gridcell" data-ok-field="d" tabindex="-1">d</div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>`;

const contextMenu = (target: Element, init: MouseEventInit = {}) =>
  target.dispatchEvent(
    new MouseEvent("contextmenu", { bubbles: true, cancelable: true, button: 2, ...init }),
  );
const key = (target: Element, k: string, init: KeyboardEventInit = {}) =>
  target.dispatchEvent(
    new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: k, ...init }),
  );

describe("cell menu items", () => {
  it("lists the items the options allow, with separators", () => {
    expect(gridDefaultContextMenuItems({ paste: true, chart: true, pin: true })).toEqual([
      "copy",
      "paste",
      "separator",
      "export",
      "chart-range",
      "separator",
      "pin",
    ]);
    expect(gridDefaultContextMenuItems({ paste: false, chart: false, pin: false })).toEqual([
      "copy",
      "separator",
      "export",
    ]);
  });

  it("turns separators into lines under the item before them", () => {
    expect(
      gridContextMenuEntries(["separator", "a", "separator", "separator", "b", "separator"]),
    ).toEqual([
      { item: "a", divider: true },
      { item: "b", divider: false },
    ]);
    expect(gridContextMenuEntries([])).toEqual([]);
  });
});

describe("createGridContextMenu", () => {
  const setup = (answer = true) => {
    const grid = mount(GRID).firstElementChild as HTMLElement;
    const onOpen = vi.fn(() => answer);
    let on = true;
    const handle = createGridContextMenu(grid, { enabled: () => on, onOpen });
    handles.push(handle);
    const cell = grid.querySelector('[data-ok-field="a"][role="gridcell"]') as HTMLElement;
    return { grid, cell, onOpen, handle, off: () => (on = false) };
  };

  it("opens at the pointer on a right click and focuses the cell", () => {
    const { cell, onOpen } = setup();
    expect(contextMenu(cell, { clientX: 30, clientY: 40 })).toBe(false);
    expect(onOpen).toHaveBeenCalledWith(cell, { top: 40, left: 30 }, "pointer");
    expect(document.activeElement).toBe(cell);
  });

  it("opens at the cell's corner from Shift + F10 and the Menu key", () => {
    const { cell, onOpen } = setup();
    cell.focus();
    const box = cell.getBoundingClientRect();
    expect(key(cell, "F10", { shiftKey: true })).toBe(false);
    expect(onOpen).toHaveBeenLastCalledWith(cell, { top: box.bottom, left: box.left }, "keyboard");
    // The browser's own event after the key is swallowed, once; a right click is not.
    expect(contextMenu(document.body, { button: 0 })).toBe(false);
    expect(contextMenu(document.body, { button: 0 })).toBe(true);
    key(cell, "F10", { shiftKey: true });
    expect(contextMenu(cell, { clientX: 5, clientY: 6 })).toBe(false);
    expect(onOpen).toHaveBeenLastCalledWith(cell, { top: 6, left: 5 }, "pointer");
    key(cell, "F10", { shiftKey: true });
    document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
    expect(contextMenu(document.body, { button: 0 })).toBe(true);
    expect(key(cell, "ContextMenu")).toBe(false);
    expect(onOpen).toHaveBeenCalledTimes(5);
    // Other keys and modifiers do nothing.
    expect(key(cell, "F10")).toBe(true);
    expect(key(cell, "F10", { shiftKey: true, ctrlKey: true })).toBe(true);
    expect(onOpen).toHaveBeenCalledTimes(5);
  });

  it("uses the cell's end corner right to left", () => {
    const { cell, onOpen } = setup();
    cell.style.direction = "rtl";
    key(cell, "ContextMenu");
    expect(onOpen).toHaveBeenLastCalledWith(
      cell,
      { top: cell.getBoundingClientRect().bottom, left: cell.getBoundingClientRect().right },
      "keyboard",
    );
  });

  it("leaves the browser's menu to fields, headers, inner grids and refusals", () => {
    const { grid, cell, onOpen, off, handle } = setup();
    expect(contextMenu(grid.querySelector("input") as Element)).toBe(true);
    expect(contextMenu(grid.querySelector('[role="columnheader"]') as Element)).toBe(true);
    expect(contextMenu(grid.querySelector('[data-ok-field="d"]') as Element)).toBe(true);
    expect(key(grid.querySelector("input") as Element, "ContextMenu")).toBe(true);
    // A cell being edited: its editor (a Select's trigger) keeps the browser's menu.
    const trigger = document.createElement("div");
    trigger.setAttribute("role", "combobox");
    cell.append(trigger);
    cell.setAttribute("data-ok-editing", "");
    expect(contextMenu(trigger)).toBe(true);
    expect(key(trigger, "ContextMenu")).toBe(true);
    cell.removeAttribute("data-ok-editing");
    trigger.remove();
    off();
    expect(contextMenu(cell)).toBe(true);
    expect(key(cell, "ContextMenu")).toBe(true);
    expect(onOpen).not.toHaveBeenCalled();
    handle.destroy();
    const refused = setup(false);
    expect(contextMenu(refused.cell)).toBe(true);
    expect(key(refused.cell, "ContextMenu")).toBe(true);
    expect(contextMenu(refused.cell)).toBe(true);
    expect(refused.onOpen).toHaveBeenCalledTimes(3);
  });
});
