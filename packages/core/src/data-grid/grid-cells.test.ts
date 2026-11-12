import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import {
  createGridCellSelection,
  createGridClipboard,
  gridCellEdges,
  gridCellRange,
  gridSelectedBlock,
  gridToTsv,
  isGridCellSelected,
  mergeGridCellSelection,
  parseGridClipboard,
  sanitizeGridCellSelection,
  toggleGridCell,
} from "./grid-cells.js";
import { createGridNavigation } from "./grid-navigation.js";

afterEach(() => {
  cleanupDom();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const IDS = ["r1", "r2", "r3"];
const FIELDS = ["a", "b", "c"];

describe("cell selection model", () => {
  it("selects the rectangle between two cells", () => {
    expect(gridCellRange(IDS, FIELDS, { id: "r3", field: "b" }, { id: "r2", field: "a" })).toEqual({
      r2: { a: true, b: true },
      r3: { a: true, b: true },
    });
    expect(gridCellRange(IDS, FIELDS, { id: "x", field: "a" }, { id: "r1", field: "a" })).toEqual(
      {},
    );
    expect(gridCellRange(IDS, FIELDS, { id: "r1", field: "z" }, { id: "r1", field: "a" })).toEqual(
      {},
    );
  });

  it("merges, toggles and reads cells", () => {
    const one = { r1: { a: true } };
    const merged = mergeGridCellSelection(one, { r1: { b: true, c: false }, r2: { a: true } });
    expect(merged).toEqual({ r1: { a: true, b: true }, r2: { a: true } });
    expect(toggleGridCell(merged, "r1", "a")).toEqual({ r1: { b: true }, r2: { a: true } });
    expect(toggleGridCell(merged, "r2", "a")).toEqual({ r1: { a: true, b: true } });
    expect(toggleGridCell({}, "r3", "c")).toEqual({ r3: { c: true } });
    expect(isGridCellSelected(merged, "r1", "b")).toBe(true);
    expect(isGridCellSelected(merged, "toString", "b")).toBe(false);
    expect(isGridCellSelected(merged, "r3", "b")).toBe(false);
  });

  it("finds the edges of ranges", () => {
    const model = gridCellRange(IDS, FIELDS, { id: "r1", field: "a" }, { id: "r2", field: "b" });
    expect(gridCellEdges(model, IDS, FIELDS, "r1", "a")).toBe("top left");
    expect(gridCellEdges(model, IDS, FIELDS, "r2", "b")).toBe("right bottom");
    expect(gridCellEdges(model, IDS, FIELDS, "r3", "c")).toBe("");
    const single = { r3: { c: true } };
    expect(gridCellEdges(single, IDS, FIELDS, "r3", "c")).toBe("top right bottom left");
  });

  it("gives the block to copy", () => {
    expect(gridSelectedBlock({ r1: { c: true }, r3: { a: true } }, IDS, FIELDS)).toEqual({
      ids: ["r1", "r3"],
      fields: ["a", "c"],
    });
  });

  it("reads untrusted models", () => {
    expect(
      sanitizeGridCellSelection(
        JSON.parse('{"r1":{"a":true,"b":1,"__proto__":true},"__proto__":{"a":true},"r2":3}'),
      ),
    ).toEqual({ r1: { a: true } });
    expect(sanitizeGridCellSelection([])).toEqual({});
    expect(sanitizeGridCellSelection(null)).toEqual({});
  });
});

describe("tab-separated text", () => {
  it("writes and reads cells, quoting where needed", () => {
    const cells = [
      ["a", "b\tc", 'say "hi"'],
      ["line\nbreak", "", "x"],
    ];
    const text = gridToTsv(cells);
    expect(text).toBe('a\t"b\tc"\t"say ""hi"""\r\n"line\nbreak"\t\tx');
    expect(parseGridClipboard(text)).toEqual(cells);
    expect(parseGridClipboard("1\t2\n3\t4\n")).toEqual([
      ["1", "2"],
      ["3", "4"],
    ]);
    expect(parseGridClipboard("x\ry")).toEqual([["x"], ["y"]]);
    expect(parseGridClipboard("a,b", ",")).toEqual([["a", "b"]]);
    expect(gridToTsv([["a,b"]], ",")).toBe('"a,b"');
    expect(parseGridClipboard("")).toEqual([[""]]);
  });
});

const GRID = `
<div role="grid" data-ok-data-grid-main>
  <div role="rowgroup" data-ok-data-grid-header>
    <div role="row" aria-rowindex="1">
      <div role="columnheader" data-ok-field="a" aria-colindex="1" tabindex="-1">A</div>
      <div role="columnheader" data-ok-field="b" aria-colindex="2" tabindex="-1">B</div>
    </div>
  </div>
  <div role="rowgroup" data-ok-data-grid-body>
    <div role="row" aria-rowindex="2" data-ok-row-id="r1">
      <div role="gridcell" data-ok-field="a" aria-colindex="1" tabindex="-1">1</div>
      <div role="gridcell" data-ok-field="b" aria-colindex="2" tabindex="-1"><button type="button" tabindex="-1">x</button></div>
    </div>
    <div role="row" aria-rowindex="3" data-ok-row-id="r2">
      <div role="gridcell" data-ok-field="a" aria-colindex="1" tabindex="-1">2</div>
      <div role="gridcell" data-ok-field="b" aria-colindex="2" tabindex="-1">y</div>
    </div>
  </div>
</div>`;

const press = (el: Element, init: PointerEventInit = {}) =>
  el.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, ...init }));
const center = (el: Element) => {
  const box = el.getBoundingClientRect();
  return { clientX: box.left + box.width / 2, clientY: box.top + box.height / 2 };
};

describe("createGridCellSelection", () => {
  it("reports presses, drags, Shift and Ctrl presses", () => {
    const grid = mount(GRID).firstElementChild as HTMLElement;
    const onSelect = vi.fn();
    let on = true;
    const handle = createGridCellSelection(grid, { enabled: () => on, onSelect });
    const cells = [...grid.querySelectorAll<HTMLElement>('[role="gridcell"]')];
    const [a1, b1, a2, b2] = cells as [HTMLElement, HTMLElement, HTMLElement, HTMLElement];
    press(a1);
    expect(onSelect).toHaveBeenLastCalledWith(
      { id: "r1", field: "a" },
      { id: "r1", field: "a" },
      "replace",
    );
    document.dispatchEvent(new PointerEvent("pointermove", center(a1)));
    expect(onSelect).toHaveBeenCalledTimes(1);
    document.dispatchEvent(new PointerEvent("pointermove", center(b2)));
    expect(onSelect).toHaveBeenLastCalledWith(
      { id: "r1", field: "a" },
      { id: "r2", field: "b" },
      "replace",
    );
    document.dispatchEvent(new PointerEvent("pointermove", { clientX: -50, clientY: -50 }));
    document.dispatchEvent(new PointerEvent("pointerup"));
    document.dispatchEvent(new PointerEvent("pointermove", center(a2)));
    expect(onSelect).toHaveBeenCalledTimes(2);
    press(a2, { shiftKey: true });
    expect(onSelect).toHaveBeenLastCalledWith(
      { id: "r1", field: "a" },
      { id: "r2", field: "a" },
      "replace",
    );
    press(b2, { ctrlKey: true });
    expect(onSelect).toHaveBeenLastCalledWith(
      { id: "r2", field: "b" },
      { id: "r2", field: "b" },
      "add",
    );
    document.dispatchEvent(new PointerEvent("pointerup"));
    // Controls, other buttons, headers and turned-off selection are ignored.
    const count = onSelect.mock.calls.length;
    press(b1.querySelector("button") as HTMLElement);
    press(a1, { button: 2 });
    press(grid.querySelector('[role="columnheader"]') as HTMLElement);
    on = false;
    press(a1);
    expect(onSelect).toHaveBeenCalledTimes(count);
    handle.destroy();
    on = true;
    press(a1);
    expect(onSelect).toHaveBeenCalledTimes(count);
  });

  it("extends from the focused cell with Shift + arrows", () => {
    const grid = mount(GRID).firstElementChild as HTMLElement;
    const navigation = createGridNavigation(grid, {
      onSort: vi.fn(),
      onColumnMenu: vi.fn(),
      onToggleRow: vi.fn(),
      onSelectAll: vi.fn(),
    });
    const onSelect = vi.fn();
    let on = true;
    createGridCellSelection(grid, { enabled: () => on, onSelect });
    const a1 = grid.querySelector('[data-ok-row-id="r1"] [data-ok-field="a"]') as HTMLElement;
    a1.focus();
    const key = (target: Element, init: KeyboardEventInit) =>
      target.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init }),
      );
    key(a1, { key: "ArrowDown", shiftKey: true });
    expect(onSelect).toHaveBeenLastCalledWith(
      { id: "r1", field: "a" },
      { id: "r2", field: "a" },
      "replace",
    );
    key(document.activeElement as Element, { key: "ArrowRight", shiftKey: true });
    expect(onSelect).toHaveBeenLastCalledWith(
      { id: "r1", field: "a" },
      { id: "r2", field: "b" },
      "replace",
    );
    // Without Shift the anchor resets; other keys and headers do nothing.
    key(document.activeElement as Element, { key: "ArrowUp" });
    key(document.activeElement as Element, { key: "Enter", shiftKey: true });
    const calls = onSelect.mock.calls.length;
    const header = grid.querySelector('[role="columnheader"]') as HTMLElement;
    key(header, { key: "ArrowDown", shiftKey: true });
    expect(onSelect).toHaveBeenCalledTimes(calls);
    on = false;
    key(document.activeElement as Element, { key: "ArrowDown", shiftKey: true });
    expect(onSelect).toHaveBeenCalledTimes(calls);
    on = true;
    // Shift + arrow at the grid's edge: the focus stays in a header (not a body cell).
    const b1 = grid.querySelector('[data-ok-row-id="r1"] [data-ok-field="a"]') as HTMLElement;
    b1.focus();
    key(b1, { key: "ArrowUp", shiftKey: true });
    expect(onSelect).toHaveBeenCalledTimes(calls);
    navigation.destroy();
  });
});

describe("createGridClipboard", () => {
  const setup = (paste = true) => {
    const grid = mount(GRID).firstElementChild as HTMLElement;
    const onPaste = vi.fn();
    const onCopy = vi.fn();
    let text: string | null = "1\t2";
    const handle = createGridClipboard(grid, {
      copyText: () => text,
      canPaste: () => paste,
      onPaste,
      onCopy,
    });
    const cell = grid.querySelector('[data-ok-row-id="r2"] [data-ok-field="a"]') as HTMLElement;
    cell.focus();
    return {
      grid,
      cell,
      onPaste,
      onCopy,
      handle,
      setText: (next: string | null) => {
        text = next;
      },
    };
  };
  const key = (target: Element, k: string, init: KeyboardEventInit = { ctrlKey: true }) =>
    target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: k, ...init }));
  const clipboardEvent = (type: string, data?: string) => {
    const transfer = new DataTransfer();
    if (data !== undefined) transfer.setData("text/plain", data);
    const event = new ClipboardEvent(type, {
      bubbles: true,
      cancelable: true,
      clipboardData: transfer,
    });
    return { event, transfer };
  };

  it("copies through a text area, then gives the focus back", () => {
    const { cell, onCopy } = setup();
    key(cell, "c");
    const area = document.activeElement as HTMLTextAreaElement;
    expect(area.tagName).toBe("TEXTAREA");
    expect(area.value).toBe("1\t2");
    expect(area.getAttribute("aria-hidden")).toBe("true");
    // Synthetic clipboard events can't always hold data (Firefox): watch what the grid writes.
    const written = vi.spyOn(DataTransfer.prototype, "setData");
    const { event } = clipboardEvent("copy");
    area.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(written).toHaveBeenLastCalledWith("text/plain", "1\t2");
    expect(onCopy).toHaveBeenCalledWith("1\t2");
    expect(document.activeElement).toBe(cell);
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("pastes plain text into the owner", () => {
    const { cell, onPaste } = setup();
    key(cell, "V", { metaKey: true });
    const area = document.activeElement as HTMLTextAreaElement;
    vi.spyOn(DataTransfer.prototype, "getData").mockReturnValue("a\tb");
    const { event } = clipboardEvent("paste", "a\tb");
    area.dispatchEvent(event);
    expect(onPaste).toHaveBeenCalledWith("a\tb");
    expect(document.activeElement).toBe(cell);
  });

  it("ends without a clipboard event and ignores other keys", async () => {
    vi.useFakeTimers();
    const { cell, grid, onPaste, onCopy, setText, handle } = setup(false);
    key(cell, "c");
    expect(document.querySelector("textarea")).not.toBeNull();
    vi.runAllTimers();
    expect(document.querySelector("textarea")).toBeNull();
    expect(document.activeElement).toBe(cell);
    key(cell, "v");
    expect(document.querySelector("textarea")).toBeNull();
    key(cell, "c", { ctrlKey: true, altKey: true });
    key(cell, "c", {});
    key(cell, "x");
    setText(null);
    key(cell, "c");
    const input = document.createElement("input");
    cell.append(input);
    key(input, "c");
    // Anything inside a cell being edited (a Select editor's trigger) keeps its keys.
    const trigger = document.createElement("div");
    trigger.setAttribute("role", "combobox");
    cell.append(trigger);
    cell.setAttribute("data-ok-editing", "");
    key(trigger, "c");
    cell.removeAttribute("data-ok-editing");
    key(grid, "c");
    expect(document.querySelector("textarea")).toBeNull();
    expect(onPaste).not.toHaveBeenCalled();
    expect(onCopy).not.toHaveBeenCalled();
    handle.destroy();
    setText("x");
    key(cell, "c");
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("lets the browser copy text the person selected", () => {
    const { cell, onCopy } = setup();
    const range = document.createRange();
    range.selectNodeContents(cell);
    document.getSelection()?.removeAllRanges();
    document.getSelection()?.addRange(range);
    key(cell, "c");
    expect(document.querySelector("textarea")).toBeNull();
    expect(onCopy).not.toHaveBeenCalled();
    document.getSelection()?.removeAllRanges();
  });
});

describe("createGridClipboard copy() and paste() (menus)", () => {
  const setup = (paste = true) => {
    const grid = mount(GRID).firstElementChild as HTMLElement;
    const onPaste = vi.fn();
    const onCopy = vi.fn();
    const handle = createGridClipboard(grid, {
      copyText: () => "1",
      canPaste: () => paste,
      onPaste,
      onCopy,
    });
    return { handle, onPaste, onCopy };
  };
  const clipboard = (value: unknown) =>
    Object.defineProperty(navigator, "clipboard", { value, configurable: true });
  afterEach(() => {
    delete (navigator as { clipboard?: unknown }).clipboard;
  });

  it("copies with the Clipboard API, else the copy command", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    clipboard({ writeText });
    let { handle, onCopy } = setup();
    expect(await handle.copy("a\tb")).toBe(true);
    expect(writeText).toHaveBeenCalledWith("a\tb");
    expect(onCopy).toHaveBeenCalledWith("a\tb");
    handle.destroy();
    clipboard({ writeText: vi.fn().mockRejectedValue(new Error("denied")) });
    ({ handle, onCopy } = setup());
    const exec = vi.spyOn(document, "execCommand").mockImplementation(() => {
      document.activeElement?.dispatchEvent(new Event("copy", { bubbles: true, cancelable: true }));
      return true;
    });
    expect(await handle.copy("x")).toBe(true);
    expect(exec).toHaveBeenCalledWith("copy");
    expect(onCopy).toHaveBeenCalledWith("x");
    expect(document.querySelector("textarea")).toBeNull();
  });

  it("pastes the clipboard's text, unless pasting is off or refused", async () => {
    const readText = vi.fn().mockResolvedValue("5\t6");
    clipboard({ readText });
    const on = setup();
    expect(await on.handle.paste()).toBe(true);
    expect(on.onPaste).toHaveBeenCalledWith("5\t6");
    const off = setup(false);
    expect(await off.handle.paste()).toBe(false);
    readText.mockRejectedValue(new Error("denied"));
    expect(await on.handle.paste()).toBe(false);
    clipboard(undefined);
    const none = setup();
    expect(await none.handle.paste()).toBe(false);
    expect(none.onPaste).not.toHaveBeenCalled();
  });
});
