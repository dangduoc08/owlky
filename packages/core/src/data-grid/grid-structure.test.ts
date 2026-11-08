import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import {
  createGridRowReorder,
  gridCanMoveColumn,
  gridColumnWindow,
  gridExpandedByDepth,
  gridGroupPaths,
  gridGroupRows,
  gridGroupsById,
  gridMissingRanges,
  gridParentsFromPaths,
  gridTreeRows,
  moveGridRow,
  parseGridExportOptions,
} from "./grid-structure.js";
import { createGridDataSourceCache } from "./grid-virtual.js";

afterEach(() => {
  cleanupDom();
  vi.useRealTimers();
});

interface Node {
  id: string;
  parent: string | null;
  name: string;
}
const NODES: Node[] = [
  { id: "a", parent: null, name: "b-root" },
  { id: "a1", parent: "a", name: "z" },
  { id: "a2", parent: "a", name: "y" },
  { id: "a21", parent: "a2", name: "x" },
  { id: "b", parent: null, name: "a-root" },
  { id: "orphan", parent: "missing", name: "o" },
];
const base = {
  idOf: (n: Node) => n.id,
  parentOf: (n: Node) => n.parent,
};

describe("tree rows", () => {
  it("orders siblings, opens by depth, counts children and descendants", () => {
    const rows = gridTreeRows(NODES, {
      ...base,
      expanded: (_, depth) => gridExpandedByDepth(1, depth),
      compare: (x, y) => x.name.localeCompare(y.name),
    });
    expect(rows.map((r) => r.id)).toEqual(["b", "a", "a2", "a1", "orphan"]);
    const a = rows.find((r) => r.id === "a");
    expect(a).toMatchObject({ depth: 0, childrenCount: 2, descendantCount: 3, expanded: true });
    expect(rows.find((r) => r.id === "a2")).toMatchObject({
      depth: 1,
      parentId: "a",
      expanded: false,
      posInSet: 1,
      setSize: 2,
    });
    expect(gridExpandedByDepth(-1, 9)).toBe(true);
    expect(gridExpandedByDepth(0, 0)).toBe(false);
  });

  it("keeps the ancestors of rows that pass; ends loops in bad data", () => {
    const rows = gridTreeRows(NODES, {
      ...base,
      expanded: () => true,
      keep: (n) => n.id === "a21",
    });
    expect(rows.map((r) => r.id)).toEqual(["a", "a2", "a21"]);
    const loop: Node[] = [
      { id: "p", parent: null, name: "p" },
      { id: "q", parent: "r", name: "q" },
      { id: "r", parent: "q", name: "r" },
    ];
    expect(gridTreeRows(loop, { ...base, expanded: () => true }).map((r) => r.id)).toEqual(["p"]);
  });

  it("parents from paths", () => {
    const rows = [
      { id: "1", path: ["Ana"] },
      { id: "2", path: ["Ana", "Bao"] },
      { id: "3", path: ["Lost", "Chloe"] },
    ];
    const parents = gridParentsFromPaths(
      rows,
      (r) => r.id,
      (r) => r.path,
    );
    expect([...parents]).toEqual([
      ["1", null],
      ["2", "1"],
      ["3", null],
    ]);
    // Rows without paths are all top-level rows.
    expect([
      ...gridParentsFromPaths(
        rows,
        (r) => r.id,
        () => [],
      ),
    ]).toEqual([
      ["1", null],
      ["2", null],
      ["3", null],
    ]);
  });
});

describe("column groups", () => {
  const model = [
    {
      groupId: "person",
      headerName: "Person",
      children: [
        { groupId: "name", children: [{ field: "first" }, { field: "last" }] },
        { field: "age" },
      ],
    },
    { groupId: "contact", children: [{ field: "email" }] },
  ];

  it("paths, groups by id, and header cells per level", () => {
    const paths = gridGroupPaths(model);
    expect(paths.get("first")).toEqual(["person", "name"]);
    expect(paths.get("age")).toEqual(["person"]);
    expect(gridGroupsById(model).get("person")?.headerName).toBe("Person");
    const rows = gridGroupRows(["first", "last", "age", "email", "city"], paths);
    expect(rows[0]?.map((c) => [c.groupId, c.start, c.span])).toEqual([
      ["person", 0, 3],
      ["contact", 3, 1],
      [null, 4, 1],
    ]);
    expect(rows[1]?.map((c) => [c.groupId, c.span])).toEqual([
      ["name", 2],
      [null, 1],
      [null, 1],
      [null, 1],
    ]);
    // A moved column splits its group.
    expect(gridGroupRows(["first", "email", "last"], paths)[0]?.map((c) => c.span)).toEqual([
      1, 1, 1,
    ]);
    expect(gridGroupRows(["x"], paths)).toEqual([]);
    expect(gridCanMoveColumn(paths, "first", "last")).toBe(true);
    expect(gridCanMoveColumn(paths, "first", "age")).toBe(false);
  });
});

describe("windows and ranges", () => {
  it("columns in view plus a buffer", () => {
    const widths = [100, 100, 100, 100, 100];
    expect(gridColumnWindow(widths, 0, 150, 0)).toEqual({
      start: 0,
      end: 2,
      before: 0,
      after: 300,
    });
    expect(gridColumnWindow(widths, 220, 100, 0)).toEqual({
      start: 2,
      end: 4,
      before: 200,
      after: 100,
    });
    expect(gridColumnWindow(widths, 0, 1000)).toEqual({ start: 0, end: 5, before: 0, after: 0 });
  });

  it("missing chunks within a window, merged", () => {
    const loaded = new Set([0, 1, 2]);
    expect(gridMissingRanges((i) => loaded.has(i), { start: 0, end: 10 }, 3, 20)).toEqual([
      { start: 3, end: 12 },
    ]);
    expect(gridMissingRanges(() => true, { start: 0, end: 10 }, 5, 20)).toEqual([]);
    expect(gridMissingRanges(() => false, { start: 8, end: 9 }, 5, 7)).toEqual([
      { start: 5, end: 7 },
    ]);
  });

  it("caches expire after their time to live; numbers still set the limit", () => {
    vi.useFakeTimers();
    const params = { sortModel: [], filterModel: { items: [] } };
    const cache = createGridDataSourceCache<number>({ ttl: 1000 });
    cache.set(params, { rows: [1] });
    expect(cache.get(params)?.rows).toEqual([1]);
    vi.advanceTimersByTime(1001);
    expect(cache.get(params)).toBeUndefined();
    const small = createGridDataSourceCache<number>(1);
    small.set(params, { rows: [1] });
    small.set({ ...params, start: 1 }, { rows: [2] });
    expect(small.get(params)).toBeUndefined();
  });
});

describe("row reordering", () => {
  const GRID = `<div role="grid"><div data-ok-data-grid-body>
    ${["a", "b", "c"]
      .map(
        (id, i) =>
          `<div role="row" data-ok-row-id="${id}" aria-rowindex="${i + 2}" style="height: 40px"><div role="gridcell"><button type="button" data-ok-data-grid-reorder-handle>${id}</button></div></div>`,
      )
      .join("")}
  </div></div>`;
  const key = (target: Element, k: string, altKey = true) =>
    target.dispatchEvent(
      new KeyboardEvent("keydown", { key: k, altKey, bubbles: true, cancelable: true }),
    );

  it("Alt + Up / Down moves to the neighbour's index; refused and edge moves do nothing", () => {
    const grid = mount(GRID).firstElementChild as HTMLElement;
    const onMove = vi.fn();
    let allowed = true;
    const handle = createGridRowReorder(grid, { canReorder: () => allowed, onMove });
    const [a, b, c] = [...grid.querySelectorAll("button")] as HTMLElement[];
    key(b as Element, "ArrowDown");
    key(b as Element, "ArrowUp");
    key(a as Element, "ArrowUp");
    key(c as Element, "ArrowDown");
    key(b as Element, "ArrowDown", false);
    key(grid, "ArrowDown");
    allowed = false;
    key(b as Element, "ArrowDown");
    expect(onMove.mock.calls).toEqual([
      ["b", 4],
      ["b", 2],
    ]);
    handle.destroy();
    allowed = true;
    key(b as Element, "ArrowDown");
    expect(onMove).toHaveBeenCalledTimes(2);
  });

  it("drags a handle onto another row (before or after it)", () => {
    const grid = mount(GRID).firstElementChild as HTMLElement;
    const onMove = vi.fn();
    createGridRowReorder(grid, { canReorder: () => true, onMove });
    const rows = [...grid.querySelectorAll<HTMLElement>('[role="row"]')];
    const handle = rows[0]?.querySelector("button") as HTMLElement;
    const point = (row: HTMLElement, part: number) => {
      const box = row.getBoundingClientRect();
      return { clientX: box.left + 5, clientY: box.top + box.height * part };
    };
    handle.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        button: 0,
        ...point(rows[0] as HTMLElement, 0.5),
      }),
    );
    expect(rows[0]?.hasAttribute("data-ok-dragging")).toBe(true);
    document.dispatchEvent(new PointerEvent("pointermove", point(rows[2] as HTMLElement, 0.8)));
    expect(rows[2]?.getAttribute("data-ok-drop")).toBe("after");
    document.dispatchEvent(new PointerEvent("pointerup", point(rows[2] as HTMLElement, 0.8)));
    expect(onMove).toHaveBeenCalledWith("a", 4);
    expect(grid.querySelector("[data-ok-drop], [data-ok-dragging]")).toBeNull();
    // Over its own row, or outside: nothing; the right button and refused moves don't start.
    handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
    document.dispatchEvent(new PointerEvent("pointermove", point(rows[0] as HTMLElement, 0.5)));
    document.dispatchEvent(new PointerEvent("pointerup", point(rows[0] as HTMLElement, 0.5)));
    handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 2 }));
    (rows[1] as HTMLElement).dispatchEvent(
      new PointerEvent("pointerdown", { bubbles: true, button: 0 }),
    );
    // Before a row above: the index of that row.
    const last = rows[2]?.querySelector("button") as HTMLElement;
    last.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
    document.dispatchEvent(new PointerEvent("pointermove", point(rows[0] as HTMLElement, 0.2)));
    expect(rows[0]?.getAttribute("data-ok-drop")).toBe("before");
    document.dispatchEvent(new PointerEvent("pointerup", point(rows[0] as HTMLElement, 0.2)));
    expect(onMove.mock.calls).toEqual([
      ["a", 4],
      ["c", 2],
    ]);
    const refused = mount(GRID).firstElementChild as HTMLElement;
    createGridRowReorder(refused, { canReorder: () => false, onMove });
    refused
      .querySelector("button")
      ?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
    expect(refused.querySelector("[data-ok-dragging]")).toBeNull();
  });

  it("moves ids", () => {
    expect(moveGridRow(["a", "b", "c"], "a", 2)).toEqual(["b", "c", "a"]);
    expect(moveGridRow(["a", "b", "c"], "c", -5)).toEqual(["c", "a", "b"]);
    expect(moveGridRow(["a"], "x", 0)).toEqual(["a"]);
  });
});

describe("export options from markup", () => {
  it("keeps known keys of the right type; one safe delimiter character", () => {
    expect(
      parseGridExportOptions(
        '{"fileName":"x","delimiter":";","includeHeaders":false,"fields":["a",1],"hideToolbar":true,"__proto__":{"y":1},"style":"z"}',
      ),
    ).toEqual({
      fileName: "x",
      delimiter: ";",
      includeHeaders: false,
      fields: ["a"],
      hideToolbar: true,
    });
    expect(parseGridExportOptions('{"delimiter":"="}')).toEqual({});
    expect(parseGridExportOptions('{"delimiter":";;"}')).toEqual({});
    expect(parseGridExportOptions("{bad")).toEqual({});
    expect(parseGridExportOptions("[1]")).toEqual({});
    expect(parseGridExportOptions(null)).toEqual({});
  });
});
