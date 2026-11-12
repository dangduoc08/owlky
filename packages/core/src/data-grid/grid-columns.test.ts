import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import {
  arrangeGridColumns,
  clampGridWidth,
  filterGridRows,
  type GridColumn,
  gridColumnTemplate,
  gridEditInputType,
  gridEditorId,
  gridEditorKind,
  gridEditText,
  gridExportColumns,
  gridLockedFields,
  gridPinSide,
  isGridResizable,
  moveGridColumn,
  orderGridColumns,
  parseGridEditValue,
  pinGridColumn,
  syncGridPinning,
} from "./data-grid.js";
import { createGridColumnControls, prepareGridPrint, printGridContent } from "./grid-columns.js";

afterEach(() => {
  cleanupDom();
  vi.restoreAllMocks();
});

const cols: GridColumn[] = [
  { field: "a" },
  { field: "b", minWidth: 80 },
  { field: "c" },
  { field: "d" },
];
const fieldsOf = (list: GridColumn[]) => list.map((c) => c.field);

describe("filter logic", () => {
  it("and (default) needs every item, or needs one", () => {
    const rows = [{ n: 1 }, { n: 5 }, { n: 9 }];
    const columns: GridColumn[] = [{ field: "n", type: "number" }];
    const items = [
      { field: "n", operator: "<", value: "3" },
      { field: "n", operator: ">", value: "7" },
    ];
    const read = (row: { n: number }) => row.n;
    const text = (row: { n: number }) => String(row.n);
    expect(filterGridRows(rows, { items }, columns, read, text)).toEqual([]);
    expect(filterGridRows(rows, { items, logicOperator: "or" }, columns, read, text)).toEqual([
      { n: 1 },
      { n: 9 },
    ]);
  });
});

describe("column sizing, order and pinning", () => {
  it("resized widths replace width / flex, clamped to the minimum", () => {
    expect(
      gridColumnTemplate(
        [
          { field: "a", flex: 1 },
          { field: "b", minWidth: 80 },
        ],
        false,
        { a: 150.4, b: 10 },
      ),
    ).toBe("150px 80px");
    expect(clampGridWidth({ field: "x" }, Number.NaN)).toBe(50);
    expect([
      isGridResizable({ field: "x" }),
      isGridResizable({ field: "x", resizable: false }),
    ]).toEqual([true, false]);
  });

  it("orders by fields (unknown fields keep their place after) and moves columns", () => {
    expect(fieldsOf(orderGridColumns(cols, ["c", "a"]))).toEqual(["c", "a", "b", "d"]);
    expect(fieldsOf(orderGridColumns(cols))).toEqual(["a", "b", "c", "d"]);
    const f = ["a", "b", "c", "d"];
    expect(moveGridColumn(f, "b", -1)).toEqual(["b", "a", "c", "d"]);
    expect(moveGridColumn(f, "a", -1)).toEqual(f);
    expect(moveGridColumn(f, "d", 5)).toEqual(f);
    expect(moveGridColumn(f, "a", { to: "c" })).toEqual(["b", "c", "a", "d"]);
    expect(moveGridColumn(f, "d", { to: "b" })).toEqual(["a", "d", "b", "c"]);
    expect(moveGridColumn(f, "a", { to: "zz" })).toEqual(f);
    expect(moveGridColumn(f, "zz", 1)).toEqual(f);
  });

  it("disableReorder: locked columns don't move and keep their index", () => {
    const f = ["a", "b", "c", "d"];
    const locked = gridLockedFields([{ field: "a", disableReorder: true }, { field: "b" }]);
    expect(locked).toEqual(["a"]);
    expect(moveGridColumn(f, "a", 1, locked)).toEqual(f);
    // b can't go before a; c can move between b and d.
    expect(moveGridColumn(f, "b", -1, locked)).toEqual(f);
    expect(moveGridColumn(f, "d", { to: "a" }, locked)).toEqual(f);
    expect(moveGridColumn(f, "c", -1, locked)).toEqual(["a", "c", "b", "d"]);
  });

  it("disableExport and actions columns stay out of exports", () => {
    const columns: GridColumn[] = [
      { field: "a" },
      { field: "b", disableExport: true },
      { field: "c", type: "actions" },
    ];
    expect(gridExportColumns(columns, columns).map((c) => c.field)).toEqual(["a"]);
    expect(gridExportColumns(columns, columns, { fields: ["b", "a"] }).map((c) => c.field)).toEqual(
      ["a"],
    );
  });

  it("arranges pinned columns at the sides; pins and unpins", () => {
    expect(fieldsOf(arrangeGridColumns(cols, { left: ["c"], right: ["a"] }))).toEqual([
      "c",
      "b",
      "d",
      "a",
    ]);
    expect(fieldsOf(arrangeGridColumns(cols))).toEqual(["a", "b", "c", "d"]);
    expect(gridPinSide({ left: ["a"] }, "a")).toBe("left");
    expect(gridPinSide({ right: ["a"] }, "a")).toBe("right");
    expect(gridPinSide(undefined, "a")).toBeUndefined();
    expect(pinGridColumn({ left: ["a"] }, "b", "left")).toEqual({ left: ["a", "b"], right: [] });
    expect(pinGridColumn({ right: ["d"] }, "c", "right")).toEqual({ left: [], right: ["c", "d"] });
    expect(pinGridColumn({ left: ["a", "b"] }, "a", null)).toEqual({ left: ["b"], right: [] });
  });

  it("writes sticky offsets from the header widths", () => {
    const host =
      mount(`<div role="grid"><div data-ok-data-grid-header><div role="row" style="display:flex">
      <div role="columnheader" data-ok-field="a" data-ok-pinned="left" style="width:40px"></div>
      <div role="columnheader" data-ok-field="b" data-ok-pinned="left" style="width:60px"></div>
      <div role="columnheader" data-ok-field="h" data-ok-pinned="left" hidden></div>
      <div role="columnheader" data-ok-field="c" style="width:30px"></div>
      <div role="columnheader" data-ok-field="d" data-ok-pinned="right" style="width:70px"></div>
      <div role="columnheader" data-ok-field="e" data-ok-pinned="right" style="width:20px"></div>
    </div></div><div role="gridcell" data-ok-field="b" data-ok-pinned="left"></div><div role="gridcell" data-ok-field="x" data-ok-pinned="left" style="--_ok-data-grid-pin: 9px"></div></div>`);
    const grid = host.firstElementChild as HTMLElement;
    syncGridPinning(grid);
    const pin = (field: string) =>
      (grid.querySelector(`[data-ok-field="${field}"]`) as HTMLElement).style.getPropertyValue(
        "--_ok-data-grid-pin",
      );
    expect([pin("a"), pin("b"), pin("d"), pin("e")]).toEqual(["0px", "40px", "20px", "0px"]);
    expect(
      (
        grid.querySelector('[role="gridcell"][data-ok-field="b"]') as HTMLElement
      ).style.getPropertyValue("--_ok-data-grid-pin"),
    ).toBe("40px");
    expect(pin("x")).toBe("");
    syncGridPinning(mount("<div></div>").firstElementChild as HTMLElement);
  });
});

describe("editing values", () => {
  it("parses typed text and formats edit text", () => {
    expect(parseGridEditValue("true", "boolean")).toBe(true);
    expect(parseGridEditValue("", "number")).toBeNull();
    expect(parseGridEditValue("4.5", "number")).toBe(4.5);
    expect(parseGridEditValue("x", "number")).toBeNull();
    expect(parseGridEditValue("2026-01-02", "date")).toBe("2026-01-02");
    expect(parseGridEditValue("nope", "dateTime")).toBeNull();
    expect(parseGridEditValue("hi")).toBe("hi");
    expect(gridEditText(null)).toBe("");
    expect(gridEditText(3, "number")).toBe("3");
    expect(gridEditText("2026-01-02T10:20:00Z", "date")).toBe("2026-01-02");
    expect(gridEditText(new Date("2026-01-02T10:20:00Z"), "dateTime")).toBe("2026-01-02T10:20");
    expect(gridEditText("nope", "date")).toBe("");
    expect(
      ["number", "date", "dateTime", "boolean", "string"].map((t) => gridEditInputType(t as never)),
    ).toEqual(["number", "date", "datetime-local", "checkbox", "text"]);
    expect(gridEditInputType()).toBe("text");
    expect(
      ["singleSelect", "boolean", "number", "date", "string"].map((t) =>
        gridEditorKind(t as never),
      ),
    ).toEqual(["select", "checkbox", "input", "input", "input"]);
    expect(gridEditorKind()).toBe("input");
    expect(gridEditorId("g", "r-1", "name")).toBe("g-r-1-name-edit");
  });
});

describe("createGridColumnControls", () => {
  const GRID = `<div role="grid"><div role="row">
    <div role="columnheader" data-ok-field="a" style="width:100px;display:inline-block">A<span data-ok-data-grid-resize></span><button type="button">m</button></div><div role="columnheader" data-ok-field="b" style="width:100px;display:inline-block">B</div>
  </div><div role="gridcell">x</div></div>`;
  const pointer = (
    target: Element,
    type: string,
    clientX: number,
    extra: PointerEventInit = {},
  ) => {
    const rect = target.getBoundingClientRect();
    (type === "pointerdown" ? target : document).dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        clientX,
        clientY: rect.top + 5,
        button: 0,
        pointerId: 1,
        ...extra,
      }),
    );
  };

  it("resizing reports widths while dragging and on release; the release doesn't sort", async () => {
    const grid = mount(GRID).firstElementChild as HTMLElement;
    const onResize = vi.fn();
    createGridColumnControls(grid, { onResize, onMove: vi.fn(), canReorder: () => true });
    const handle = grid.querySelector("[data-ok-data-grid-resize]") as HTMLElement;
    pointer(handle, "pointerdown", 100);
    pointer(handle, "pointermove", 130);
    pointer(handle, "pointerup", 140);
    expect(onResize.mock.calls[0]).toEqual(["a", expect.closeTo(130, 0), false]);
    expect(onResize.mock.calls[1]).toEqual(["a", expect.closeTo(140, 0), true]);
    const header = grid.querySelector('[data-ok-field="a"]') as HTMLElement;
    expect(header.hasAttribute("data-ok-just-dragged")).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(header.hasAttribute("data-ok-just-dragged")).toBe(false);
  });

  it("a header with disableReorder doesn't drag (its resize handle still works)", () => {
    const grid = mount(
      GRID.replace('data-ok-field="a"', 'data-ok-field="a" data-ok-disable-reorder'),
    ).firstElementChild as HTMLElement;
    const onMove = vi.fn();
    const onResize = vi.fn();
    createGridColumnControls(grid, { onResize, onMove, canReorder: () => true });
    const a = grid.querySelector('[data-ok-field="a"]') as HTMLElement;
    const b = grid.querySelector('[data-ok-field="b"]') as HTMLElement;
    const bx = b.getBoundingClientRect().left + 20;
    pointer(a, "pointerdown", 10);
    pointer(a, "pointermove", bx);
    pointer(a, "pointerup", bx);
    expect(a.hasAttribute("data-ok-dragging")).toBe(false);
    expect(onMove).not.toHaveBeenCalled();
    const handle = grid.querySelector("[data-ok-data-grid-resize]") as HTMLElement;
    pointer(handle, "pointerdown", 100);
    pointer(handle, "pointerup", 120);
    expect(onResize).toHaveBeenCalled();
  });

  it("dragging a header onto another reorders; small moves, buttons, cells and refused reorders don't", () => {
    const grid = mount(GRID).firstElementChild as HTMLElement;
    const onMove = vi.fn();
    let allowed = true;
    const handle = createGridColumnControls(grid, {
      onResize: vi.fn(),
      onMove,
      canReorder: () => allowed,
    });
    const a = grid.querySelector('[data-ok-field="a"]') as HTMLElement;
    const b = grid.querySelector('[data-ok-field="b"]') as HTMLElement;
    const bx = b.getBoundingClientRect().left + 20;
    pointer(a, "pointerdown", 10);
    pointer(a, "pointermove", 12);
    expect(a.hasAttribute("data-ok-dragging")).toBe(false);
    pointer(a, "pointermove", bx);
    expect(a.hasAttribute("data-ok-dragging")).toBe(true);
    pointer(a, "pointerup", bx);
    expect(onMove).toHaveBeenCalledWith("a", "b");
    // Released on itself: nothing.
    pointer(a, "pointerdown", 10);
    pointer(a, "pointermove", 60);
    pointer(a, "pointerup", 20);
    // A press that never moved, a button, a cell, the right button, reordering off.
    pointer(a, "pointerdown", 10);
    pointer(a, "pointerup", 10);
    pointer(grid.querySelector("button") as Element, "pointerdown", 10);
    pointer(grid.querySelector('[role="gridcell"]') as Element, "pointerdown", 10);
    pointer(a, "pointerdown", 10, { button: 2 });
    allowed = false;
    pointer(a, "pointerdown", 10);
    expect(onMove).toHaveBeenCalledTimes(1);
    handle.destroy();
  });

  it("keepPositionOutside: a drop outside the grid lands on the last header passed", () => {
    const grid = mount(GRID).firstElementChild as HTMLElement;
    const onMove = vi.fn();
    let keep = false;
    createGridColumnControls(grid, {
      onResize: vi.fn(),
      onMove,
      canReorder: () => true,
      keepPositionOutside: () => keep,
    });
    const a = grid.querySelector('[data-ok-field="a"]') as HTMLElement;
    const b = grid.querySelector('[data-ok-field="b"]') as HTMLElement;
    const bx = b.getBoundingClientRect().left + 20;
    const outside = { clientY: grid.getBoundingClientRect().bottom + 200 };
    const drag = () => {
      pointer(a, "pointerdown", 10);
      pointer(a, "pointermove", bx);
      pointer(a, "pointerup", bx, outside);
    };
    drag();
    expect(onMove).not.toHaveBeenCalled();
    keep = true;
    drag();
    expect(onMove).toHaveBeenCalledExactlyOnceWith("a", "b");
  });

  it("double click on a resize handle autosizes; right to left, dragging left widens", () => {
    const grid = mount(GRID).firstElementChild as HTMLElement;
    const onAutosize = vi.fn();
    const onResize = vi.fn();
    createGridColumnControls(grid, {
      onResize,
      onMove: vi.fn(),
      canReorder: () => true,
      onAutosize,
    });
    const handle = grid.querySelector("[data-ok-data-grid-resize]") as HTMLElement;
    handle.dispatchEvent(new MouseEvent("dblclick", { bubbles: true }));
    (grid.querySelector('[data-ok-field="b"]') as HTMLElement).dispatchEvent(
      new MouseEvent("dblclick", { bubbles: true }),
    );
    expect(onAutosize.mock.calls).toEqual([["a"]]);
    grid.setAttribute("dir", "rtl");
    pointer(handle, "pointerdown", 100);
    pointer(handle, "pointerup", 70);
    expect(onResize.mock.calls[0]).toEqual(["a", expect.closeTo(130, 0), true]);
  });
});

describe("printGridContent", () => {
  it("prints a copy of the content with the page's styles and theme, then removes the frame", () => {
    document.documentElement.setAttribute("data-ok-theme", "dark");
    const style = document.createElement("style");
    style.textContent = ".x { color: red }";
    document.head.append(style);
    const content = mount('<div class="x">Rows</div>').firstElementChild as HTMLElement;
    const print = vi.fn();
    let frame: HTMLIFrameElement | null = null;
    // The frame's window only exists once it's in the page: stub its print() right then.
    const append = document.body.append.bind(document.body);
    vi.spyOn(document.body, "append").mockImplementation((...nodes) => {
      append(...nodes);
      for (const node of nodes)
        if (node instanceof HTMLIFrameElement) {
          frame = node;
          (node.contentWindow as Window).print = print;
        }
    });
    printGridContent(content, "People");
    const iframe = document.querySelector("iframe") as HTMLIFrameElement;
    expect(iframe).toBe(frame);
    expect(print).toHaveBeenCalled();
    const doc = iframe.contentDocument as Document;
    expect(doc.title).toBe("People");
    expect(doc.body.textContent).toBe("Rows");
    expect(doc.documentElement.getAttribute("data-ok-theme")).toBe("dark");
    expect(doc.head.querySelectorAll("style").length).toBeGreaterThan(0);
    (iframe.contentWindow as Window).dispatchEvent(new Event("afterprint"));
    expect(document.querySelector("iframe")).toBeNull();
    style.remove();
    document.documentElement.removeAttribute("data-ok-theme");
  });
});

describe("prepareGridPrint", () => {
  const ROOT = `<div data-ok-data-grid style="height: 300px">
    <div data-ok-data-grid-toolbar>tools</div>
    <div role="grid" style="overflow: auto"><div data-ok-data-grid-header><div role="row">
      <div role="columnheader" data-ok-field="__check__"></div>
      <div role="columnheader" data-ok-field="a">A<button data-ok-data-grid-menu-button></button><span data-ok-data-grid-resize></span></div>
      <div role="columnheader" data-ok-field="b" hidden>B</div>
      <div role="columnheader" data-ok-field="c">C</div>
    </div></div>
    <div data-ok-data-grid-body style="--_ok-data-grid-before: 10px; --_ok-data-grid-after: 20px"><div role="row">
      <div role="gridcell" data-ok-field="__check__"></div>
      <div role="gridcell" data-ok-field="a" aria-colspan="2">1</div>
      <div role="gridcell" data-ok-field="b" hidden data-ok-covered>2</div>
      <div role="gridcell" data-ok-field="c">3</div>
    </div></div></div>
    <div data-ok-data-grid-loading hidden></div><div data-ok-data-grid-overlay hidden></div>
    <div popover>menu</div><template></template>
    <div data-ok-data-grid-footer>pages</div>
  </div>`;

  it("keeps the printed fields, drops controls, toolbar and footer, and lets rows grow", () => {
    const copy = mount(ROOT).firstElementChild as HTMLElement;
    prepareGridPrint(copy, {}, ["a", "b"], "10px 20px");
    expect(
      copy.querySelector("[data-ok-data-grid-toolbar], [data-ok-data-grid-footer]"),
    ).toBeNull();
    expect(
      copy.querySelectorAll("[popover], template, button, [data-ok-data-grid-resize]"),
    ).toHaveLength(0);
    expect(copy.querySelectorAll('[data-ok-field="__check__"], [data-ok-field="c"]')).toHaveLength(
      0,
    );
    // A hidden column prints; a cell covered by a span stays hidden.
    expect(
      (copy.querySelector('[role="columnheader"][data-ok-field="b"]') as HTMLElement).hidden,
    ).toBe(false);
    expect((copy.querySelector('[role="gridcell"][data-ok-field="b"]') as HTMLElement).hidden).toBe(
      true,
    );
    expect(copy.style.height).toBe("auto");
    const main = copy.querySelector<HTMLElement>('[role="grid"]') as HTMLElement;
    expect(main.style.getPropertyValue("--_ok-data-grid-columns")).toBe("10px 20px");
    expect(main.style.overflow).toBe("visible");
    const body = copy.querySelector<HTMLElement>("[data-ok-data-grid-body]") as HTMLElement;
    expect(body.style.getPropertyValue("--_ok-data-grid-before")).toBe("");
  });

  it("prints the rows to export only", () => {
    const copy = mount(ROOT).firstElementChild as HTMLElement;
    const body = copy.querySelector("[data-ok-data-grid-body]") as HTMLElement;
    const second = (body.firstElementChild as HTMLElement).cloneNode(true) as HTMLElement;
    (body.firstElementChild as HTMLElement).setAttribute("data-ok-row-id", "1");
    second.setAttribute("data-ok-row-id", "2");
    body.append(second);
    prepareGridPrint(copy, { rowIds: ["2"] }, ["a"], "10px");
    expect([...body.children].map((row) => row.getAttribute("data-ok-row-id"))).toEqual(["2"]);
  });

  it("keeps the toolbar, footer and checkboxes when asked", () => {
    const copy = mount(ROOT).firstElementChild as HTMLElement;
    prepareGridPrint(
      copy,
      { hideToolbar: false, hideFooter: false, includeCheckboxes: true },
      ["c"],
      "1fr",
    );
    expect(copy.querySelector("[data-ok-data-grid-toolbar]")).not.toBeNull();
    expect(copy.querySelector("[data-ok-data-grid-footer]")).not.toBeNull();
    expect(copy.querySelectorAll('[data-ok-field="__check__"]')).toHaveLength(2);
    const bare = mount("<div></div>").firstElementChild as HTMLElement;
    prepareGridPrint(bare, {}, [], "");
    expect(bare.style.height).toBe("auto");
  });

  it("printGridContent hands the copy to prepare", () => {
    const content = mount("<div>Rows<b>x</b></div>").firstElementChild as HTMLElement;
    const append = document.body.append.bind(document.body);
    vi.spyOn(document.body, "append").mockImplementation((...nodes) => {
      append(...nodes);
      for (const node of nodes)
        if (node instanceof HTMLIFrameElement) (node.contentWindow as Window).print = vi.fn();
    });
    printGridContent(content, "T", (copy) => copy.querySelector("b")?.remove());
    expect(document.querySelector("iframe")?.contentDocument?.body.textContent).toBe("Rows");
    document.querySelector("iframe")?.remove();
  });
});
