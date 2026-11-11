import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import {
  createGridFillHandle,
  gridFillCells,
  gridFillSelection,
  gridFillSource,
  gridFillWithin,
} from "./grid-fill.js";

afterEach(() => cleanupDom());

const IDS = ["1", "2", "3", "4", "5"];
const FIELDS = ["a", "b", "c", "d"];
const block = { ids: ["2", "3"], fields: ["b", "c"] };
const pairs = (cells: { id: string; field: string; from: { id: string; field: string } }[]) =>
  cells.map((c) => `${c.id}${c.field}<${c.from.id}${c.from.field}`);

describe("gridFillSource", () => {
  it("is the selected rectangle", () => {
    const model = { "2": { b: true, c: true }, "3": { b: true, c: true } };
    expect(gridFillSource(model, IDS, FIELDS)).toEqual(block);
  });
  it("is null for holes, gaps or nothing", () => {
    expect(gridFillSource({}, IDS, FIELDS)).toBeNull();
    expect(gridFillSource({ "2": { b: true, c: true }, "3": { b: true } }, IDS, FIELDS)).toBeNull();
    expect(gridFillSource({ "2": { b: true }, "4": { b: true } }, IDS, FIELDS)).toBeNull();
    expect(gridFillSource({ "2": { a: true, c: true } }, IDS, FIELDS)).toBeNull();
  });
});

describe("gridFillCells", () => {
  it("repeats the rows downward and upward, starting next to the source", () => {
    const down = gridFillCells(block, IDS, FIELDS, { id: "5", field: "a" });
    expect(down?.direction).toBe("down");
    expect(pairs(down?.cells ?? [])).toEqual(["4b<2b", "4c<2c", "5b<3b", "5c<3c"]);
    const up = gridFillCells(block, IDS, FIELDS, { id: "1", field: "c" });
    expect(up?.direction).toBe("up");
    expect(pairs(up?.cells ?? [])).toEqual(["1b<3b", "1c<3c"]);
  });
  it("repeats the columns right and left when they go further", () => {
    const right = gridFillCells(block, IDS, FIELDS, { id: "2", field: "d" });
    expect(right?.direction).toBe("right");
    expect(pairs(right?.cells ?? [])).toEqual(["2d<2b", "3d<3b"]);
    const left = gridFillCells(block, IDS, FIELDS, { id: "3", field: "a" });
    expect(left?.direction).toBe("left");
    expect(pairs(left?.cells ?? [])).toEqual(["2a<2c", "3a<3c"]);
  });
  it("is null inside the source or for unknown cells", () => {
    expect(gridFillCells(block, IDS, FIELDS, { id: "2", field: "c" })).toBeNull();
    expect(gridFillCells(block, IDS, FIELDS, { id: "9", field: "c" })).toBeNull();
    expect(
      gridFillCells({ ids: ["9"], fields: ["a"] }, IDS, FIELDS, { id: "1", field: "a" }),
    ).toBeNull();
  });
});

describe("gridFillWithin", () => {
  it("fills down and right from the first row or column", () => {
    expect(pairs(gridFillWithin(block, IDS, FIELDS, "down"))).toEqual(["3b<2b", "3c<2c"]);
    expect(pairs(gridFillWithin(block, IDS, FIELDS, "right"))).toEqual(["2c<2b", "3c<3b"]);
  });
  it("takes the row above or the column before a single line", () => {
    const one = { ids: ["2"], fields: ["b"] };
    expect(pairs(gridFillWithin(one, IDS, FIELDS, "down"))).toEqual(["2b<1b"]);
    expect(pairs(gridFillWithin(one, IDS, FIELDS, "right"))).toEqual(["2b<2a"]);
    const first = { ids: ["1"], fields: ["a"] };
    expect(gridFillWithin(first, IDS, FIELDS, "down")).toEqual([]);
    expect(gridFillWithin(first, IDS, FIELDS, "right")).toEqual([]);
  });
});

it("gridFillSelection holds the source and the filled cells", () => {
  expect(
    gridFillSelection({ ids: ["1"], fields: ["a"] }, [
      { id: "2", field: "a", from: { id: "1", field: "a" } },
    ]),
  ).toEqual({ "1": { a: true }, "2": { a: true } });
});

describe("createGridFillHandle", () => {
  const GRID = `<div role="grid"><div data-ok-data-grid-body>
    ${["1", "2", "3"]
      .map(
        (id) =>
          `<div role="row" data-ok-row-id="${id}" style="display:flex;height:30px"><div role="gridcell" data-ok-field="a" tabindex="-1" style="width:80px">${id}${id === "1" ? '<span data-ok-data-grid-fill-handle style="display:inline-block;width:8px;height:8px"></span>' : ""}</div></div>`,
      )
      .join("")}
  </div></div>`;
  const at = (el: Element) => {
    const box = el.getBoundingClientRect();
    return { clientX: box.left + 10, clientY: box.top + 10 };
  };
  const setup = (enabled = true) => {
    const grid = mount(GRID).firstElementChild as HTMLElement;
    const options = {
      enabled: () => enabled,
      preview: vi.fn((target: { id: string; field: string }) => [target]),
      onFill: vi.fn(),
      onFillKey: vi.fn(),
    };
    const handle = createGridFillHandle(grid, options);
    const cell = (id: string) =>
      grid.querySelector(`[data-ok-row-id="${id}"] > [data-ok-field]`) as HTMLElement;
    return { grid, options, handle, cell };
  };

  it("previews the cells while dragging and fills on release", () => {
    const { grid, options, cell } = setup();
    const press = new PointerEvent("pointerdown", { bubbles: true, cancelable: true, button: 0 });
    (grid.querySelector("[data-ok-data-grid-fill-handle]") as Element).dispatchEvent(press);
    expect(press.defaultPrevented).toBe(true);
    document.dispatchEvent(new PointerEvent("pointermove", at(cell("3"))));
    document.dispatchEvent(new PointerEvent("pointermove", at(cell("3"))));
    expect(options.preview).toHaveBeenCalledOnce();
    expect(cell("3").hasAttribute("data-ok-fill-target")).toBe(true);
    document.dispatchEvent(new PointerEvent("pointerup", at(cell("3"))));
    expect(options.onFill).toHaveBeenCalledWith({ id: "3", field: "a" });
    expect(grid.querySelector("[data-ok-fill-target]")).toBeNull();
  });

  it("Escape cancels a drag; a release outside the cells fills nothing", () => {
    const { grid, options, cell } = setup();
    const handleEl = grid.querySelector("[data-ok-data-grid-fill-handle]") as Element;
    handleEl.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
    document.dispatchEvent(new PointerEvent("pointermove", at(cell("2"))));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(grid.querySelector("[data-ok-fill-target]")).toBeNull();
    document.dispatchEvent(new PointerEvent("pointerup", at(cell("2"))));
    handleEl.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }));
    document.dispatchEvent(new PointerEvent("pointerup", { clientX: -50, clientY: -50 }));
    expect(options.onFill).not.toHaveBeenCalled();
  });

  it("Ctrl / Cmd + D and + R fill from the keyboard, on cells only", () => {
    const { options, cell, handle } = setup();
    const key = (target: Element, init: KeyboardEventInit) => {
      const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
      target.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(key(cell("2"), { key: "d", ctrlKey: true })).toBe(true);
    expect(key(cell("2"), { key: "R", metaKey: true })).toBe(true);
    expect(options.onFillKey.mock.calls).toEqual([["down"], ["right"]]);
    key(cell("2"), { key: "d" });
    key(cell("2"), { key: "d", ctrlKey: true, shiftKey: true });
    key(cell("2"), { key: "x", ctrlKey: true });
    key(cell("1").querySelector("span") as Element, { key: "d", ctrlKey: true });
    expect(options.onFillKey).toHaveBeenCalledTimes(2);
    handle.destroy();
    key(cell("2"), { key: "d", ctrlKey: true });
    expect(options.onFillKey).toHaveBeenCalledTimes(2);
  });

  it("does nothing while off", () => {
    const { grid, options, cell } = setup(false);
    (grid.querySelector("[data-ok-data-grid-fill-handle]") as Element).dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, button: 0 }),
    );
    document.dispatchEvent(new PointerEvent("pointermove", at(cell("3"))));
    cell("2").dispatchEvent(
      new KeyboardEvent("keydown", { key: "d", ctrlKey: true, bubbles: true }),
    );
    expect(options.preview).not.toHaveBeenCalled();
    expect(options.onFillKey).not.toHaveBeenCalled();
  });
});
