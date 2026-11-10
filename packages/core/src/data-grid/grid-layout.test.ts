import { afterEach, describe, expect, it } from "vitest";
import { cleanupDom, mount } from "../test-utils.js";
import {
  gridAutoPageSize,
  gridColSpans,
  gridDensityFactor,
  gridFormatValue,
  gridHeaderHeightProperties,
  gridRowOffsets,
  gridRowSpans,
  gridRowWindowOf,
  isGridRtl,
  measureGridColumn,
  parseGridFormatOptions,
  sanitizeGridState,
} from "./grid-layout.js";
import {
  deDE,
  enUS,
  esES,
  frFR,
  gridDisplayedRows,
  gridFooterRowCount,
  gridFooterRowSelected,
  jaJP,
  viVN,
  zhCN,
} from "./grid-locales.js";

afterEach(cleanupDom);

describe("spans", () => {
  it("column spans stop at the row's end and cover the next cells", () => {
    expect(gridColSpans(4, (i) => (i === 1 ? 2 : 1))).toEqual([
      { span: 1, covered: false },
      { span: 2, covered: false },
      { span: 1, covered: true },
      { span: 1, covered: false },
    ]);
    expect(gridColSpans(3, () => 9).map((s) => s.span)).toEqual([3, 1, 1]);
    expect(gridColSpans(2, () => Number.NaN).map((s) => s.span)).toEqual([1, 1]);
  });

  it("row spans merge neighbours with the same non-empty text", () => {
    const rows = [
      { a: "x", b: "1" },
      { a: "x", b: "2" },
      { a: "x", b: "" },
      { a: "y", b: "" },
    ];
    const { cells, origin } = gridRowSpans(rows, ["a", "b"], (row, f) => row[f as "a"]);
    expect(cells[0]?.get("a")).toEqual({ span: 3, covered: false });
    expect(cells[1]?.get("a")).toEqual({ span: 1, covered: true });
    expect(cells[2]?.get("a")).toEqual({ span: 1, covered: true });
    expect(cells[3]?.get("a")).toBeUndefined();
    // Empty values never merge.
    expect(cells[2]?.get("b")).toBeUndefined();
    expect(origin).toEqual([0, 0, 0, 3]);
  });
});

describe("rows of their own height", () => {
  it("offsets and the window of rows that meet the visible area", () => {
    const offsets = gridRowOffsets([50, 100, 50, 50, 200]);
    expect(offsets).toEqual([0, 50, 150, 200, 250, 450]);
    expect(gridRowWindowOf(offsets, 0, 100, 0)).toEqual({
      start: 0,
      end: 2,
      before: 0,
      after: 300,
    });
    expect(gridRowWindowOf(offsets, 160, 50, 0)).toEqual({
      start: 2,
      end: 4,
      before: 150,
      after: 200,
    });
    expect(gridRowWindowOf(offsets, 400, 500)).toEqual({ start: 4, end: 5, before: 250, after: 0 });
    expect(gridRowWindowOf([0], 0, 100)).toEqual({ start: 0, end: 0, before: 0, after: 0 });
  });

  it("density factors", () => {
    expect([gridDensityFactor("compact"), gridDensityFactor("standard")]).toEqual([0.7, 1]);
    expect(gridDensityFactor("comfortable")).toBe(1.3);
  });
});

describe("measureGridColumn", () => {
  it("measures the natural width of the cells and header, then restores them", () => {
    const grid = mount(`<div>
      <div role="columnheader" data-ok-field="a" style="width: 40px">A</div>
      <div role="gridcell" data-ok-field="a" style="width: 30px; display: block; white-space: nowrap; font: 16px monospace">a long text</div>
      <div role="gridcell" data-ok-field="a" hidden>hidden very long hidden text</div>
    </div>`);
    const cell = grid.querySelector<HTMLElement>('[role="gridcell"]') as HTMLElement;
    const withHeader = measureGridColumn(grid, "a");
    const cells = measureGridColumn(grid, "a", { includeHeaders: false });
    expect(cells).toBeGreaterThan(60);
    expect(withHeader).toBeGreaterThanOrEqual(cells);
    expect(cell.style.width).toBe("30px");
    expect((grid.querySelector('[role="columnheader"]') as HTMLElement).style.width).toBe("40px");
    cell.style.removeProperty("width");
    measureGridColumn(grid, "a");
    expect(cell.style.width).toBe("");
  });

  it("reads the direction", () => {
    const element = mount(`<div dir="rtl"><span>x</span></div>`).firstElementChild as Element;
    expect(isGridRtl(element)).toBe(true);
    expect(isGridRtl(document.body)).toBe(false);
  });
});

describe("sanitizeGridState", () => {
  it("keeps known keys and value types only", () => {
    const state = sanitizeGridState(
      JSON.parse(`{
        "sorting": { "sortModel": [{ "field": "a", "sort": "asc" }, { "field": "b", "sort": "up" }, 3] },
        "filter": { "filterModel": {
          "items": [{ "field": "a", "operator": "contains", "value": "x" },
                    { "field": "b", "operator": "isAnyOf", "value": ["1", 2] },
                    { "field": 1 }, { "field": "c" }],
          "logicOperator": "or", "quickFilterValues": ["w", 4] } },
        "pagination": { "paginationModel": { "page": 2.7, "pageSize": 25 } },
        "columns": {
          "columnVisibilityModel": { "a": false, "b": "no", "__proto__": { "x": 1 } },
          "orderedFields": ["b", "a", "constructor"],
          "dimensions": { "a": { "width": 120 }, "b": { "width": -1 }, "prototype": { "width": 9 } }
        },
        "pinnedColumns": { "left": ["a"], "right": "b" },
        "density": "compact",
        "__proto__": { "polluted": true }
      }`),
    );
    expect(state).toEqual({
      sorting: { sortModel: [{ field: "a", sort: "asc" }] },
      filter: {
        filterModel: {
          items: [
            { field: "a", operator: "contains", value: "x" },
            { field: "b", operator: "isAnyOf", value: ["1"] },
          ],
          logicOperator: "or",
          quickFilterValues: ["w"],
        },
      },
      pagination: { paginationModel: { page: 2, pageSize: 25 } },
      columns: {
        columnVisibilityModel: { a: false },
        orderedFields: ["b", "a"],
        dimensions: { a: { width: 120 } },
      },
      pinnedColumns: { left: ["a"] },
      density: "compact",
    });
    expect(({} as Record<string, unknown>)["polluted"]).toBeUndefined();
    expect(({} as Record<string, unknown>)["x"]).toBeUndefined();
  });

  it("skips parts of the wrong shape", () => {
    expect(
      sanitizeGridState({
        sorting: 1,
        filter: 1,
        pagination: { paginationModel: { page: "2", pageSize: Number.NaN } },
        columns: { dimensions: { a: 5, b: { width: "9" } } },
        pinnedColumns: { right: ["b"] },
      }),
    ).toEqual({
      pagination: { paginationModel: {} },
      columns: { dimensions: {} },
      pinnedColumns: { right: ["b"] },
    });
    expect(sanitizeGridState({ pagination: 1, columns: 1, pinnedColumns: 1 })).toEqual({});
  });

  it("returns nothing for other input", () => {
    expect(sanitizeGridState(null)).toEqual({});
    expect(sanitizeGridState([1])).toEqual({});
    expect(
      sanitizeGridState({
        filter: { filterModel: { items: "x" } },
        pagination: { paginationModel: { page: -1, pageSize: 0 } },
        columns: {},
        pinnedColumns: {},
        density: "huge",
      }),
    ).toEqual({
      filter: { filterModel: { items: [] } },
      pagination: { paginationModel: {} },
      columns: {},
      pinnedColumns: {},
    });
  });
});

describe("value formats", () => {
  it("allows a few Intl options from untrusted JSON", () => {
    expect(
      parseGridFormatOptions(
        '{"currency":"EUR","maximumFractionDigits":1,"useGrouping":false,"style":"x","currencyDisplay":4}',
      ),
    ).toEqual({ currency: "EUR", maximumFractionDigits: 1, useGrouping: false });
    expect(parseGridFormatOptions("{oops")).toEqual({});
    expect(parseGridFormatOptions("[1]")).toEqual({});
    expect(parseGridFormatOptions(null)).toEqual({});
  });

  it("formats numbers and dates; bad values and options show the value", () => {
    expect(gridFormatValue(1234.5, "number", {}, "en-US")).toBe("1,234.5");
    expect(gridFormatValue("12", "currency", {}, "en-US")).toBe("$12.00");
    expect(gridFormatValue(12, "currency", { currency: "EUR" }, "en-US")).toBe("€12.00");
    expect(gridFormatValue(0.25, "percent", {}, "en-US")).toBe("25%");
    expect(gridFormatValue("2026-11-08", "date", { timeZone: "UTC" }, "en-US")).toBe("Nov 8, 2026");
    expect(
      gridFormatValue(new Date("2026-11-08T10:30:00Z"), "datetime", { timeZone: "UTC" }, "en-US"),
    ).toMatch(/Nov 8, 2026.*10:30/);
    expect(gridFormatValue("soon", "date")).toBe("soon");
    expect(gridFormatValue("n/a", "number")).toBe("n/a");
    expect(gridFormatValue(5, "currency", { currency: "nope" })).toBe("5");
    expect(gridFormatValue(null, "number")).toBe("");
    expect(gridFormatValue("", "number")).toBe("");
  });
});

describe("locales", () => {
  it("every pack has every label", () => {
    const keys = Object.keys(enUS).sort();
    const operators = Object.keys(enUS.filterOperator).sort();
    for (const pack of [viVN, frFR, deDE, esES, jaJP, zhCN]) {
      expect(Object.keys(pack).sort()).toEqual(keys);
      expect(Object.keys(pack.filterOperator).sort()).toEqual(operators);
    }
  });

  it("fills the displayed rows pattern", () => {
    expect(gridDisplayedRows(viVN.paginationDisplayedRows, { from: 1, to: 10, count: 25 })).toBe(
      "1–10 trên 25",
    );
  });

  it("writes the footer's counts", () => {
    expect(gridFooterRowSelected(enUS, 1)).toBe("1 row selected");
    expect(gridFooterRowSelected(enUS, 3)).toBe("3 rows selected");
    expect(gridFooterRowCount(enUS, 25, 25)).toBe("Total Rows: 25");
    expect(gridFooterRowCount(enUS, 3, 25)).toBe("Total Rows: 3 of 25");
    expect(gridFooterRowCount(frFR, 3, 25)).toBe("Total de lignes : 3 sur 25");
  });
});

describe("header heights and page size", () => {
  it("scales the given heights by the density; the header filters follow the headers", () => {
    expect(gridHeaderHeightProperties({}, "standard")).toEqual({});
    expect(gridHeaderHeightProperties({ columnHeaderHeight: 40 }, "comfortable")).toEqual({
      "--_ok-data-grid-header-height": "52px",
      "--_ok-data-grid-header-filter-height": "52px",
    });
    expect(
      gridHeaderHeightProperties(
        { columnGroupHeaderHeight: 30, headerFilterHeight: 50 },
        "compact",
      ),
    ).toEqual({
      "--_ok-data-grid-group-header-height": "21px",
      "--_ok-data-grid-header-filter-height": "35px",
    });
    expect(gridHeaderHeightProperties({ columnHeaderHeight: 0 }, "standard")).toEqual({});
  });

  it("fits the rows under the header and pinned rows, at least one", () => {
    const host = mount(`<div id="m" style="height: 300px; overflow: auto">
      <div data-ok-data-grid-header style="height: 56px"></div>
      <div data-ok-data-grid-pinned-rows="top" style="height: 30px"></div>
      <div data-ok-data-grid-pinned-rows="bottom" hidden style="height: 30px"></div>
      <div data-ok-data-grid-body style="height: 900px"></div>
    </div>`);
    const main = host.querySelector<HTMLElement>("#m") as HTMLElement;
    expect(gridAutoPageSize(main, 53)).toBe(4);
    main.style.height = "60px";
    expect(gridAutoPageSize(main, 53)).toBe(1);
    expect(gridAutoPageSize(main, 0)).toBe(1);
  });
});
