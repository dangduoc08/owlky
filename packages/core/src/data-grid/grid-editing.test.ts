import { describe, expect, it } from "vitest";
import {
  createGridHistoryKeys,
  createGridHistoryStack,
  gridChangedFields,
  gridEditModeOf,
  gridEditModes,
  gridEditTarget,
  gridHistoryRow,
  gridSameValue,
  sanitizeGridCellModes,
  sanitizeGridRowModes,
} from "./grid-editing.js";

describe("edit modes models", () => {
  it("finds the first cell or row in edit mode", () => {
    const cells = {
      a: { name: { mode: "view" as const } },
      b: { age: { mode: "edit" as const }, name: { mode: "edit" as const } },
    };
    expect(gridEditTarget(cells, {}, "cell")).toEqual({ id: "b", field: "age" });
    expect(gridEditTarget({ a: { name: { mode: "view" } } }, undefined, "cell")).toBeNull();
    expect(gridEditTarget(undefined, { a: { mode: "edit", fieldToFocus: "age" } }, "row")).toEqual({
      id: "a",
      field: null,
      fieldToFocus: "age",
    });
    expect(gridEditTarget(undefined, { a: { mode: "edit" } }, "row")).toEqual({
      id: "a",
      field: null,
    });
    expect(gridEditTarget(cells, { a: { mode: "view" } }, "row")).toBeNull();
    expect(gridEditModeOf(cells, {}, "cell", "b", "age")).toBe("edit");
    expect(gridEditModeOf(cells, {}, "cell", "b", "name")).toBe("view");
    expect(gridEditModeOf(cells, {}, "cell", "a", "name")).toBe("view");
    expect(gridEditModeOf({}, { a: { mode: "edit" } }, "row", "a")).toBe("edit");
  });

  it("builds the models of a start and a stop", () => {
    expect(gridEditModes("cell", "a", "name", "edit")).toEqual({
      cells: { a: { name: { mode: "edit" } } },
      rows: {},
    });
    expect(gridEditModes("cell", "a", "name", "view", true).cells).toEqual({
      a: { name: { mode: "view", ignoreModifications: true } },
    });
    expect(gridEditModes("row", "a", "name", "edit").rows).toEqual({
      a: { mode: "edit", fieldToFocus: "name" },
    });
    expect(gridEditModes("row", "a", "name", "view").rows).toEqual({ a: { mode: "view" } });
  });

  it("sanitizes untrusted models", () => {
    expect(
      sanitizeGridCellModes({
        a: { name: { mode: "edit", ignoreModifications: "yes", fieldToFocus: "x" }, age: 1 },
        b: [],
        c: { x: { mode: "open" } },
      }),
    ).toEqual({ a: { name: { mode: "edit" } } });
    expect(sanitizeGridCellModes(null)).toEqual({});
    expect(
      sanitizeGridRowModes({
        a: { mode: "view", ignoreModifications: true },
        b: { mode: "edit", fieldToFocus: "age" },
        c: "edit",
      }),
    ).toEqual({
      a: { mode: "view", ignoreModifications: true },
      b: { mode: "edit", fieldToFocus: "age" },
    });
    expect(sanitizeGridRowModes([])).toEqual({});
  });
});

describe("undo and redo", () => {
  const step = (id: string, before: number, after: number) => ({
    changes: [{ id, before: { id, qty: before }, after: { id, qty: after } }],
  });

  it("keeps at most `size` steps; redo steps go on a new push", () => {
    const stack = createGridHistoryStack<Record<string, unknown>>(2);
    expect(stack.peek("undo")).toBeNull();
    stack.push(step("a", 1, 2));
    stack.push(step("a", 2, 3));
    stack.push(step("a", 3, 4));
    expect(stack.sizes).toEqual({ undo: 2, redo: 0 });
    expect(stack.peek("undo")).toEqual(step("a", 3, 4));
    stack.settle("undo", true);
    expect(stack.sizes).toEqual({ undo: 1, redo: 1 });
    expect(stack.peek("redo")).toEqual(step("a", 3, 4));
    stack.settle("redo", true);
    expect(stack.sizes).toEqual({ undo: 2, redo: 0 });
    stack.settle("undo", true);
    stack.push(step("b", 0, 1));
    expect(stack.sizes).toEqual({ undo: 2, redo: 0 });
    // Empty steps are not kept; settling nothing does nothing.
    stack.push({ changes: [] });
    stack.settle("redo", true);
    expect(stack.sizes).toEqual({ undo: 2, redo: 0 });
    stack.clear();
    expect(stack.sizes).toEqual({ undo: 0, redo: 0 });
    const off = createGridHistoryStack(0);
    off.push(step("a", 1, 2));
    expect(off.sizes.undo).toBe(0);
  });

  it("a failed undo drops the earlier steps; a failed redo the later ones", () => {
    const stack = createGridHistoryStack<Record<string, unknown>>(10);
    stack.push(step("a", 1, 2));
    stack.push(step("a", 2, 3));
    stack.push(step("a", 3, 4));
    stack.settle("undo", true);
    stack.settle("undo", true);
    stack.settle("redo", false);
    expect(stack.sizes).toEqual({ undo: 1, redo: 0 });
    stack.push(step("a", 2, 5));
    stack.settle("undo", false);
    expect(stack.sizes).toEqual({ undo: 0, redo: 0 });
  });

  it("compares values, finds changed fields and builds the rows to write", () => {
    expect(gridSameValue(1, 1)).toBe(true);
    expect(gridSameValue(1, "1")).toBe(true);
    expect(gridSameValue(null, "")).toBe(true);
    expect(gridSameValue(1, 2)).toBe(false);
    expect(gridSameValue(new Date(5), new Date(5))).toBe(true);
    expect(gridSameValue({}, {})).toBe(false);
    expect(gridChangedFields({ a: 1, b: 2 }, { a: 1, b: 3, c: 4 })).toEqual(["b", "c"]);
    const change = {
      id: "x",
      before: { id: "x", qty: 1, name: "A" },
      after: { id: "x", qty: 2, name: "A" },
    };
    expect(gridHistoryRow({ id: "x", qty: 2, name: "B" }, change, "undo")).toEqual({
      id: "x",
      qty: 1,
      name: "B",
    });
    expect(gridHistoryRow({ id: "x", qty: 1, name: "B" }, change, "redo")).toEqual({
      id: "x",
      qty: 2,
      name: "B",
    });
    // Changed elsewhere since: the step can't apply.
    expect(gridHistoryRow({ id: "x", qty: 7, name: "A" }, change, "undo")).toBeNull();
  });

  it("keys: Ctrl / Cmd + Z, Shift + Z and Y on cells; fields keep theirs", () => {
    const grid = document.createElement("div");
    grid.innerHTML =
      '<div role="gridcell" tabindex="-1"><input aria-label="x"></div><div role="columnheader" tabindex="-1"></div><button type="button">x</button>';
    document.body.append(grid);
    const calls: string[] = [];
    let enabled = true;
    const keys = createGridHistoryKeys(grid, {
      enabled: () => enabled,
      undo: () => calls.push("undo"),
      redo: () => calls.push("redo"),
    });
    const press = (target: Element, init: KeyboardEventInit) => {
      const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
      target.dispatchEvent(event);
      return event.defaultPrevented;
    };
    const cell = grid.querySelector('[role="gridcell"]') as HTMLElement;
    const header = grid.querySelector('[role="columnheader"]') as HTMLElement;
    expect(press(cell, { key: "z", ctrlKey: true })).toBe(true);
    press(header, { key: "Z", metaKey: true, shiftKey: true });
    press(cell, { key: "y", ctrlKey: true });
    // Not handled: no modifier, Alt, other keys, fields, outside cells, turned off.
    press(cell, { key: "z" });
    press(cell, { key: "z", ctrlKey: true, altKey: true });
    press(cell, { key: "x", ctrlKey: true });
    press(grid.querySelector("input") as HTMLElement, { key: "z", ctrlKey: true });
    press(grid.querySelector("button") as HTMLElement, { key: "z", ctrlKey: true });
    enabled = false;
    expect(press(cell, { key: "z", ctrlKey: true })).toBe(false);
    expect(calls).toEqual(["undo", "redo", "redo"]);
    keys.destroy();
    enabled = true;
    press(cell, { key: "z", ctrlKey: true });
    expect(calls).toHaveLength(3);
    grid.remove();
  });
});
