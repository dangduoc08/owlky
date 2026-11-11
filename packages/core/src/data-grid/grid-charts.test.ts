import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import type { GridColumn, GridFilterModel } from "./data-grid.js";
import { createGridCellSelection } from "./grid-cells.js";
import {
  createGridChartRangeHandle,
  gridChartGroups,
  gridChartRangeMarks,
  gridChartsState,
  gridCrossFilter,
  gridCrossFilterBase,
  gridCrossFilterField,
  gridCrossFilterPoints,
  gridCrossFilterSelection,
  gridCrossFilterValues,
  gridRangeChartId,
  gridRangeChartModel,
  gridResizeChartRange,
  isGridRangeChart,
  sanitizeGridChartsState,
} from "./grid-charts.js";
import { sanitizeGridState } from "./grid-layout.js";
import { sanitizeGridChartModel } from "./grid-premium.js";

afterEach(() => {
  cleanupDom();
  vi.restoreAllMocks();
});

const COLUMNS: GridColumn[] = [
  { field: "product" },
  { field: "units", type: "number", headerName: "Units" },
  { field: "revenue", type: "number" },
  { field: "note" },
  { field: "actions", type: "actions" },
];
const VALUES: Record<string, Record<string, unknown>> = {
  r1: { product: "Tea", units: 4, revenue: 40, note: "a" },
  r2: { product: "Juice", units: 2, revenue: "", note: "b" },
  r3: { product: "Coffee", units: null, revenue: 30, note: "c" },
};
const valueAt = (id: string, field: string) => VALUES[id]?.[field];
const IDS = ["r1", "r2", "r3"];

describe("gridRangeChartModel", () => {
  it("takes the categories from the first text column and series from number columns", () => {
    const range = {
      r3: { product: true, revenue: true },
      r1: { product: true, units: true, note: true, actions: true },
    };
    expect(gridRangeChartModel(range, IDS, COLUMNS, valueAt)).toEqual({
      type: "column",
      dimension: "product",
      values: ["units", "revenue"],
      rows: ["r1", "r3"],
    });
  });

  it("uses the rows' positions when the first column holds numbers", () => {
    const model = gridRangeChartModel(
      { r1: { units: true, revenue: true }, r2: { units: true } },
      IDS,
      COLUMNS,
      valueAt,
      { chartType: "line", label: "Mine" },
    );
    expect(model).toEqual({
      label: "Mine",
      type: "line",
      dimension: null,
      values: ["units", "revenue"],
      rows: ["r1", "r2"],
    });
  });

  it("refuses ranges without numbers", () => {
    expect(gridRangeChartModel({}, IDS, COLUMNS, valueAt)).toBeNull();
    expect(gridRangeChartModel({ r1: { product: true, note: true } }, IDS, COLUMNS, valueAt)).toBe(
      null,
    );
    // Number columns with empty cells only.
    expect(
      gridRangeChartModel({ r3: { product: true, units: true } }, IDS, COLUMNS, valueAt),
    ).toBeNull();
    // Unknown chart types fall back to columns; unknown rows are ignored.
    expect(
      gridRangeChartModel({ x: { units: true }, r1: { units: true } }, IDS, COLUMNS, valueAt, {
        chartType: "nope" as never,
      })?.type,
    ).toBe("column");
  });

  it("finds a free id and tells range charts apart", () => {
    expect(gridRangeChartId({})).toEqual({ id: "range-1", index: 1 });
    expect(gridRangeChartId({ "range-1": {}, "range-3": {} })).toEqual({
      id: "range-2",
      index: 2,
    });
    expect(gridRangeChartId({ "range-1": {} }, "mine")).toEqual({ id: "mine", index: 2 });
    expect(gridRangeChartId({}, "bad id")).toEqual({ id: "range-1", index: 1 });
    expect(gridRangeChartId({}, "__proto__")).toEqual({ id: "range-1", index: 1 });
    expect(isGridRangeChart({ rows: [] })).toBe(true);
    expect(isGridRangeChart({ values: ["units"] })).toBe(false);
  });
});

describe("cross-filtering", () => {
  const model: GridFilterModel = {
    items: [
      { field: "units", operator: ">", value: "1" },
      { field: "product", operator: "isAnyOf", value: ["Tea"] },
    ],
    logicOperator: "and",
  };

  it("picks the field a chart filters", () => {
    expect(gridCrossFilterField({ dimension: "product" }, null)).toBeNull();
    expect(gridCrossFilterField({ crossFilter: true, dimension: "product" }, null)).toBe("product");
    expect(gridCrossFilterField({ crossFilter: true }, "region")).toBe("region");
    expect(gridCrossFilterField({ crossFilter: true, dimension: "note", rows: [] }, "region")).toBe(
      "note",
    );
    expect(gridCrossFilterField({ crossFilter: true }, null)).toBeNull();
    expect(gridCrossFilterField({ crossFilter: true }, "region", { pivot: true })).toBeNull();
    expect(
      gridCrossFilterField({ crossFilter: true, dimension: "units" }, null, { numeric: true }),
    ).toBeNull();
  });

  it("reads, sets and clears the chart's filter item", () => {
    expect(gridCrossFilterValues(model, "product")).toEqual(["Tea"]);
    expect(gridCrossFilterValues(model, "note")).toEqual([]);
    expect(gridCrossFilterBase(model, "product")).toEqual({
      items: [{ field: "units", operator: ">", value: "1" }],
      logicOperator: "and",
    });
    expect(gridCrossFilterBase(model, "note")).toBe(model);
    expect(gridCrossFilter(model, "product", ["Juice", "Coffee"]).items).toEqual([
      { field: "units", operator: ">", value: "1" },
      { field: "product", operator: "isAnyOf", value: ["Juice", "Coffee"] },
    ]);
    expect(gridCrossFilter(model, "product", []).items).toEqual([
      { field: "units", operator: ">", value: "1" },
    ]);
  });

  it("turns a selection change into categories", () => {
    const categories = ["Tea", "Juice", "Coffee", "Tea"];
    expect(
      gridCrossFilterSelection(categories, {
        dataPointIndex: 1,
        selected: true,
        selectedDataPoints: [
          { seriesIndex: 1, dataPointIndex: 2 },
          { seriesIndex: 0, dataPointIndex: 1 },
          { seriesIndex: 0, dataPointIndex: 3 },
          { seriesIndex: 0, dataPointIndex: 9 },
        ],
      }),
    ).toEqual(["Juice", "Coffee", "Tea"]);
    // A cleared point clears its category, even with other series still selected there.
    expect(
      gridCrossFilterSelection(categories, {
        dataPointIndex: 2,
        selected: false,
        selectedDataPoints: [{ seriesIndex: 0, dataPointIndex: 2 }],
      }),
    ).toEqual([]);
  });

  it("selects every series' point of the filtered categories", () => {
    expect(gridCrossFilterPoints(["Tea", "Juice", "Coffee"], ["juice", "Coffee"], 2)).toEqual([
      { seriesIndex: 0, dataPointIndex: 1 },
      { seriesIndex: 1, dataPointIndex: 1 },
      { seriesIndex: 0, dataPointIndex: 2 },
      { seriesIndex: 1, dataPointIndex: 2 },
    ]);
    expect(gridCrossFilterPoints(["Tea"], ["Tea"], 0)).toEqual([
      { seriesIndex: 0, dataPointIndex: 0 },
    ]);
    expect(gridCrossFilterPoints(["Tea"], [], 1)).toEqual([]);
  });

  it("groups rows by key in first-appearance order", () => {
    expect(gridChartGroups(["b1", "a1", "b2"], (row) => row.charAt(0))).toEqual([
      { key: "b", rows: ["b1", "b2"] },
      { key: "a", rows: ["a1"] },
    ]);
  });
});

describe("charts config", () => {
  it("serializes the models as plain JSON", () => {
    const charts = { a: { type: "line" as const, rows: ["r1"] } };
    const state = gridChartsState({ type: "pie" }, charts, "a");
    expect(state).toEqual({ model: { type: "pie" }, charts, activeChartId: "a" });
    expect(state.charts).not.toBe(charts);
    expect(gridChartsState({}, {}, null)).toEqual({ model: {} });
  });

  it("restores known keys only", () => {
    expect(sanitizeGridChartsState(null)).toEqual({});
    expect(sanitizeGridChartsState([])).toEqual({});
    expect(
      sanitizeGridChartsState({
        model: { type: "bar", crossFilter: true, extra: 1 },
        charts: { "range-1": { rows: ["r1", 2, null, {}], crossFilter: "yes" }, "bad id": {} },
        activeChartId: "range-1",
        other: true,
      }),
    ).toEqual({
      model: { type: "bar", crossFilter: true },
      charts: { "range-1": { rows: ["r1", "2"] } },
      activeChartId: "range-1",
    });
    expect(sanitizeGridChartModel({ rows: "r1" })).toEqual({});
    expect(
      sanitizeGridState({ chartsIntegration: { model: { crossFilter: true } } }).chartsIntegration,
    ).toEqual({ model: { crossFilter: true } });
    expect(sanitizeGridState({ chartsIntegration: { other: 1 } }).chartsIntegration).toBe(
      undefined,
    );
  });
});

const GRID = `
<div role="grid" data-ok-data-grid-main>
  <div role="rowgroup" data-ok-data-grid-body>
    <div role="row" aria-rowindex="2" data-ok-row-id="r1">
      <div role="gridcell" data-ok-field="a" aria-colindex="1" tabindex="0">1</div>
    </div>
  </div>
  <div role="rowgroup" data-ok-data-grid-header>
    <div role="row"><div role="columnheader" data-ok-field="a" tabindex="-1">A</div></div>
  </div>
</div>`;

describe("Alt + F1", () => {
  it("asks for a range chart from a body cell", () => {
    const grid = mount(GRID).firstElementChild as HTMLElement;
    const onRangeChart = vi.fn();
    let on = true;
    const handle = createGridCellSelection(grid, {
      enabled: () => on,
      onSelect: vi.fn(),
      onRangeChart,
    });
    const cell = grid.querySelector('[role="gridcell"]') as HTMLElement;
    const header = grid.querySelector('[role="columnheader"]') as HTMLElement;
    const key = (target: HTMLElement, init: KeyboardEventInit) => {
      const event = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, ...init });
      target.dispatchEvent(event);
      return event.defaultPrevented;
    };
    expect(key(cell, { key: "F1", altKey: true })).toBe(true);
    expect(onRangeChart).toHaveBeenCalledTimes(1);
    expect(key(cell, { key: "F1" })).toBe(false);
    expect(key(cell, { key: "F1", altKey: true, ctrlKey: true })).toBe(false);
    expect(key(header, { key: "F1", altKey: true })).toBe(false);
    on = false;
    expect(key(cell, { key: "F1", altKey: true })).toBe(false);
    expect(onRangeChart).toHaveBeenCalledTimes(1);
    handle.destroy();
  });
});

describe("the range on the grid (4.18.89)", () => {
  const columns: GridColumn[] = [
    { field: "name", type: "string" },
    { field: "a", type: "number" },
    { field: "note", type: "string" },
    { field: "b", type: "number" },
  ];
  const model = { type: "column" as const, dimension: "name", values: ["a"], rows: ["1", "2"] };

  it("marks the charted cells, their outline edges and the handle", () => {
    const marks = gridChartRangeMarks(model, ["1", "2", "3"], ["name", "a", "b"]);
    expect(marks.cells["1"]).toEqual({
      name: { kind: "category", edges: "top left" },
      a: { kind: "series", edges: "top right" },
    });
    expect(marks.cells["2"]?.["a"]).toEqual({ kind: "series", edges: "right bottom" });
    expect(marks.cells["3"]).toBeUndefined();
    expect(marks.handle).toEqual({ id: "2", field: "a" });
    // A row between them (sorted elsewhere) splits the outline.
    const split = gridChartRangeMarks(model, ["1", "9", "2"], ["a"]);
    expect(split.cells["1"]?.["a"]?.edges).toBe("top right bottom left");
    expect(gridChartRangeMarks({ values: ["a"] }, ["1"], ["a"])).toEqual({
      cells: {},
      handle: null,
    });
    expect(gridChartRangeMarks({ ...model, values: [] }, ["1"], ["name"]).handle).toBeNull();
  });

  it("resizes to a cell: rows from the first one, number columns from the first value", () => {
    const ids = ["1", "2", "3", "4"];
    expect(gridResizeChartRange(model, ids, columns, { id: "4", field: "b" })).toMatchObject({
      rows: ["1", "2", "3", "4"],
      values: ["a", "b"],
      dimension: "name",
    });
    // Above the first row and before the first value: the first row and value stay.
    const back = gridResizeChartRange({ ...model, rows: ["2", "3"] }, ids, columns, {
      id: "1",
      field: "name",
    });
    expect(back.rows).toEqual(["1", "2"]);
    expect(back.values).toEqual(["a"]);
    // Unknown target row or value column: those parts stay.
    const kept = gridResizeChartRange({ ...model, values: ["zz"] }, ids, columns, {
      id: "x",
      field: "b",
    });
    expect(kept.rows).toEqual(["1", "2"]);
    expect(kept.values).toEqual(["zz"]);
    const plain = { values: ["a"] };
    expect(gridResizeChartRange(plain, ids, columns, { id: "1", field: "a" })).toBe(plain);
  });

  it("the handle reports drags, the end and Escape; Alt + Shift + F1 asks for an update", () => {
    const host = mount(`<div role="grid"><div data-ok-data-grid-body>
      <div role="row" data-ok-row-id="1"><div role="gridcell" data-ok-field="a" tabindex="-1">1<span data-ok-data-grid-chart-handle></span></div></div>
      <div role="row" data-ok-row-id="2"><div role="gridcell" data-ok-field="a" tabindex="-1">2</div></div>
    </div></div>`);
    const grid = host.firstElementChild as HTMLElement;
    const onStart = vi.fn();
    const onMove = vi.fn();
    const onEnd = vi.fn();
    const controller = createGridChartRangeHandle(grid, { onStart, onMove, onEnd });
    const cells = grid.querySelectorAll<HTMLElement>('[role="gridcell"]');
    const second = cells[1] as HTMLElement;
    const handle = grid.querySelector("[data-ok-data-grid-chart-handle]") as HTMLElement;
    handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
    expect(onStart).toHaveBeenCalled();
    const box = second.getBoundingClientRect();
    const at = { clientX: box.left + 2, clientY: box.top + box.height / 2 };
    document.dispatchEvent(new PointerEvent("pointermove", at));
    document.dispatchEvent(new PointerEvent("pointermove", at));
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith({ id: "2", field: "a" });
    document.dispatchEvent(new PointerEvent("pointermove", { clientX: -50, clientY: -50 }));
    document.dispatchEvent(new PointerEvent("pointerup"));
    expect(onEnd).toHaveBeenLastCalledWith(false);
    handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "a" }));
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    expect(onEnd).toHaveBeenLastCalledWith(true);
    // Other presses and buttons don't start a drag.
    second.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }));
    handle.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 2 }));
    expect(onStart).toHaveBeenCalledTimes(2);
    controller.destroy();
    const onRangeChartUpdate = vi.fn();
    const onRangeChart = vi.fn();
    const selection = createGridCellSelection(grid, {
      enabled: () => true,
      onSelect: vi.fn(),
      onRangeChart,
      onRangeChartUpdate,
    });
    const press = (init: KeyboardEventInit) =>
      second.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "F1", ...init }));
    press({ altKey: true, shiftKey: true });
    expect(onRangeChartUpdate).toHaveBeenCalledTimes(1);
    press({ altKey: true });
    expect(onRangeChart).toHaveBeenCalledTimes(1);
    selection.destroy();
  });
});
