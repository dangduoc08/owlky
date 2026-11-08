import { describe, expect, it } from "vitest";
import type { GridColumn } from "./data-grid.js";
import { sanitizeGridState } from "./grid-layout.js";
import {
  GRID_GROUPING_FIELD,
  gridAggregate,
  gridAggregationFunctions,
  gridAggregationFunctionsFor,
  gridChartData,
  gridGroupComparator,
  gridGroupRowId,
  gridPivot,
  gridPivotField,
  gridPivotRole,
  gridRowGroups,
  gridTreeGroups,
  isGridPivotField,
  parseGridAggregationModel,
  sanitizeGridChartModel,
  sanitizeGridPivotModel,
  setGridPivotRole,
} from "./grid-premium.js";

interface Sale {
  id: string;
  region: string;
  product: string;
  year: string;
  amount: number | null;
  date: string;
}
const SALES: Sale[] = [
  { id: "1", region: "North", product: "Tea", year: "2024", amount: 10, date: "2025-01-03" },
  { id: "2", region: "South", product: "Tea", year: "2025", amount: 20, date: "2025-02-01" },
  { id: "3", region: "North", product: "Coffee", year: "2025", amount: 5, date: "2024-12-31" },
  { id: "4", region: "North", product: "Tea", year: "2025", amount: null, date: "" },
];
const COLUMNS: GridColumn[] = [
  { field: "region", headerName: "Region" },
  { field: "product", headerName: "Product" },
  { field: "year", headerName: "Year" },
  { field: "amount", headerName: "Amount", type: "number", width: 90 },
  { field: "date", headerName: "Date", type: "date" },
];
const value = (row: Sale, field: string) => row[field as keyof Sale];
const text = (row: Sale, field: string) => String(row[field as keyof Sale] ?? "");

describe("row grouping", () => {
  it("groups rows by the keys of each field, nested in order", () => {
    const { groups, parentOf } = gridRowGroups(SALES, ["region", "product"], (r) => r.id, text);
    expect(groups.map((g) => [g.id, g.depth, g.key, g.leafIds])).toEqual([
      [gridGroupRowId(["region", "North"]), 0, "North", ["1", "3", "4"]],
      [gridGroupRowId(["region", "North", "product", "Tea"]), 1, "Tea", ["1", "4"]],
      [gridGroupRowId(["region", "South"]), 0, "South", ["2"]],
      [gridGroupRowId(["region", "South", "product", "Tea"]), 1, "Tea", ["2"]],
      [gridGroupRowId(["region", "North", "product", "Coffee"]), 1, "Coffee", ["3"]],
    ]);
    expect(parentOf.get("3")).toBe(gridGroupRowId(["region", "North", "product", "Coffee"]));
    expect(parentOf.get(gridGroupRowId(["region", "North"]))).toBeNull();
    expect(groups[1]?.field).toBe("product");
  });

  it("encodes keys in generated ids", () => {
    expect(gridGroupRowId(["a/b", "c d"])).toBe("auto-generated-row-a%2Fb/c%20d");
  });

  it("keeps rows ungrouped without fields", () => {
    const { groups, parentOf } = gridRowGroups(SALES, [], (r) => r.id, text);
    expect(groups).toEqual([]);
    expect(parentOf.get("1")).toBeNull();
  });
});

describe("tree groups", () => {
  it("generates rows for missing parents and links the others", () => {
    const rows = [
      { id: "a", path: ["A"] },
      { id: "c", path: ["A", "B", "C"] },
      { id: "d", path: ["X", "D"] },
      { id: "e", path: [] as string[] },
    ];
    const { groups, parentOf } = gridTreeGroups(
      rows,
      (r) => r.id,
      (r) => r.path,
    );
    const ab = gridGroupRowId(["A", "B"]);
    const x = gridGroupRowId(["X"]);
    expect(groups.map((g) => [g.id, g.parentId, g.depth, g.key, g.leafIds])).toEqual([
      [ab, "a", 1, "B", ["c"]],
      [x, null, 0, "X", ["d"]],
    ]);
    expect(parentOf.get("c")).toBe(ab);
    expect(parentOf.get("a")).toBeNull();
    expect(parentOf.get("e")).toBeNull();
    expect(parentOf.get(ab)).toBe("a");
  });

  it("generates one row per missing path shared by several rows", () => {
    const rows = [
      { id: "1", path: ["G", "1"] },
      { id: "2", path: ["G", "2"] },
    ];
    const { groups } = gridTreeGroups(
      rows,
      (r) => r.id,
      (r) => r.path,
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]?.leafIds).toEqual(["1", "2"]);
  });
});

describe("aggregation", () => {
  it("sums, averages, counts and finds extremes", () => {
    const result = gridAggregate(
      SALES,
      { amount: "sum", region: "size", date: "max" },
      COLUMNS,
      value,
    );
    expect(result).toEqual({ amount: 35, region: 4, date: "2025-02-01" });
    expect(gridAggregate(SALES, { amount: "avg" }, COLUMNS, value)).toEqual({ amount: 11.67 });
    expect(gridAggregate(SALES, { amount: "min" }, COLUMNS, value)).toEqual({ amount: 5 });
    expect(gridAggregate(SALES, { amount: "max" }, COLUMNS, value)).toEqual({ amount: 20 });
    expect(gridAggregate(SALES, { date: "min" }, COLUMNS, value)).toEqual({ date: "2024-12-31" });
  });

  it("gives null for no values and skips unknown functions, fields and types", () => {
    expect(gridAggregate([], { amount: "avg" }, COLUMNS, value)).toEqual({ amount: null });
    expect(gridAggregate([], { amount: "min" }, COLUMNS, value)).toEqual({ amount: null });
    expect(
      gridAggregate(
        SALES,
        { amount: "median", nope: "sum", region: "sum", toString: "sum" },
        COLUMNS,
        value,
      ),
    ).toEqual({});
    // Rows without a value for the field (pivot buckets) are left out.
    expect(gridAggregate(SALES, { amount: "size" }, COLUMNS, () => undefined)).toEqual({
      amount: 0,
    });
  });

  it("lists the functions of a column", () => {
    expect(gridAggregationFunctionsFor(COLUMNS[3] as GridColumn)).toEqual([
      "sum",
      "avg",
      "min",
      "max",
      "size",
    ]);
    expect(gridAggregationFunctionsFor(COLUMNS[4] as GridColumn)).toEqual(["min", "max", "size"]);
    expect(gridAggregationFunctionsFor({ field: "x" })).toEqual(["size"]);
    expect(gridAggregationFunctionsFor({ field: "x", type: "actions" })).toEqual([]);
    expect(gridAggregationFunctionsFor({ field: "x", aggregable: false })).toEqual([]);
    expect(
      gridAggregationFunctionsFor(COLUMNS[3] as GridColumn, gridAggregationFunctions, ["sum"]),
    ).toEqual(["sum"]);
  });

  it("parses models from untrusted JSON", () => {
    expect(parseGridAggregationModel('{"amount":"sum","x":"evil","__proto__":"sum"}')).toEqual({
      amount: "sum",
    });
    expect(parseGridAggregationModel("[1]")).toEqual({});
    expect(parseGridAggregationModel("{")).toEqual({});
    expect(parseGridAggregationModel(null)).toEqual({});
    expect(({} as Record<string, unknown>)["x"]).toBeUndefined();
  });
});

describe("group order", () => {
  type Item = { group: boolean; place: number; key: string; total: number | null };
  const items: Item[] = [
    { group: true, place: 2, key: "b", total: 5 },
    { group: true, place: 0, key: "a", total: 9 },
    { group: true, place: 1, key: "c", total: null },
  ];
  const order = (sortModel: { field: string; sort: "asc" | "desc" }[]) =>
    [...items]
      .sort(
        gridGroupComparator<Item>({
          isGroup: (i) => i.group,
          place: (i) => i.place,
          firstPlace: (i) => i.place,
          keyOf: (i) => i.key,
          aggregateOf: (i) => i.total,
          sortModel,
          columns: [{ field: "total", type: "number" }],
          groupFields: ["region"],
          aggregated: ["total"],
        }),
      )
      .map((i) => i.key);

  it("orders groups by their first row, keys or aggregated values", () => {
    expect(order([])).toEqual(["a", "c", "b"]);
    expect(order([{ field: "region", sort: "desc" }])).toEqual(["c", "b", "a"]);
    expect(order([{ field: GRID_GROUPING_FIELD, sort: "asc" }])).toEqual(["a", "b", "c"]);
    // Empty aggregates go last whatever the direction.
    expect(order([{ field: "total", sort: "asc" }])).toEqual(["b", "a", "c"]);
    expect(order([{ field: "total", sort: "desc" }])).toEqual(["a", "b", "c"]);
    expect(order([{ field: "other", sort: "asc" }])).toEqual(["a", "c", "b"]);
  });

  it("orders data rows by their place, and mixed siblings by first place", () => {
    const compare = gridGroupComparator<Item>({
      isGroup: (i) => i.group,
      place: (i) => i.place,
      firstPlace: (i) => i.place + 10,
      keyOf: (i) => i.key,
      aggregateOf: () => null,
      sortModel: [{ field: "region", sort: "asc" }],
      columns: [],
      groupFields: ["region"],
      aggregated: [],
    });
    const leaf = (place: number): Item => ({ group: false, place, key: "", total: null });
    expect(compare(leaf(1), leaf(3))).toBeLessThan(0);
    expect(compare(items[0] as Item, leaf(3))).toBeGreaterThan(0);
    expect(compare(leaf(30), items[0] as Item)).toBeGreaterThan(0);
    const same = { ...(items[0] as Item) };
    expect(compare(items[0] as Item, same)).toBe(0);
  });
});

describe("pivoting", () => {
  it("makes one column per key and value, grouped by key", () => {
    const pivot = gridPivot(
      SALES,
      COLUMNS,
      {
        rows: [{ field: "region" }],
        columns: [{ field: "year" }],
        values: [
          { field: "amount", aggFunc: "sum" },
          { field: "date", aggFunc: "size" },
        ],
      },
      value,
      text,
    );
    expect(pivot.columns.map((c) => [c.field, c.headerName, c.type])).toEqual([
      [gridPivotField(["2024"], "amount", "sum"), "Amount (sum)", "number"],
      [gridPivotField(["2024"], "date", "size"), "Date (size)", "number"],
      [gridPivotField(["2025"], "amount", "sum"), "Amount (sum)", "number"],
      [gridPivotField(["2025"], "date", "size"), "Date (size)", "number"],
    ]);
    expect(pivot.rowGroupingModel).toEqual(["region"]);
    expect(pivot.aggregationModel[gridPivotField(["2025"], "amount", "sum")]).toBe("sum");
    expect(pivot.columnGroupingModel.map((g) => [g.headerName, g.children.length])).toEqual([
      ["2024", 2],
      ["2025", 2],
    ]);
    const field = gridPivotField(["2025"], "amount", "sum");
    expect(pivot.value(SALES[1] as Sale, field)).toBe(20);
    expect(pivot.value(SALES[0] as Sale, field)).toBeUndefined();
    expect(pivot.value(SALES[0] as Sale, "region")).toBe("North");
    expect(isGridPivotField(field)).toBe(true);
    expect(isGridPivotField("amount")).toBe(false);
  });

  it("nests column keys, sorts them and labels functions", () => {
    const pivot = gridPivot(
      SALES,
      COLUMNS,
      {
        rows: [{ field: "region", hidden: true }],
        columns: [{ field: "year", sort: "desc" }, { field: "product" }],
        values: [
          { field: "amount", aggFunc: "max" },
          { field: "amount", aggFunc: "median" },
          { field: "missing", aggFunc: "sum" },
        ],
      },
      value,
      text,
      (fn) => fn.toUpperCase(),
    );
    expect(pivot.rowGroupingModel).toEqual([]);
    expect(pivot.columns.map((c) => c.pivotKeys)).toEqual([
      ["2025", "Coffee"],
      ["2025", "Tea"],
      ["2024", "Tea"],
    ]);
    expect(pivot.columns[0]?.headerName).toBe("Amount (MAX)");
    const top = pivot.columnGroupingModel[0];
    expect(top?.headerName).toBe("2025");
    expect(top?.children.map((c) => ("headerName" in c ? c.headerName : ""))).toEqual([
      "Coffee",
      "Tea",
    ]);
  });

  it("makes one column per value without column fields", () => {
    const pivot = gridPivot(
      SALES,
      [...COLUMNS, { field: "noWidth", type: "number" }],
      { rows: [], columns: [], values: [{ field: "noWidth", aggFunc: "sum" }] },
      value,
      text,
    );
    expect(pivot.columns.map((c) => [c.field, c.width])).toEqual([
      [gridPivotField([], "noWidth", "sum"), 120],
    ]);
    expect(pivot.columnGroupingModel).toEqual([]);
    expect(pivot.value(SALES[0] as Sale, gridPivotField([], "noWidth", "sum"))).toBeUndefined();
  });

  it("reads and edits the model safely", () => {
    const model = sanitizeGridPivotModel({
      rows: [{ field: "region" }, { field: 1 }, { field: "x", hidden: true }],
      columns: [{ field: "year", sort: "desc", hidden: true }, { field: "p", sort: "up" }, 3],
      values: [
        { field: "amount", aggFunc: "sum", hidden: true },
        { field: "a", aggFunc: "evil" },
        { field: "b" },
      ],
    });
    expect(model).toEqual({
      rows: [{ field: "region" }, { field: "x", hidden: true }],
      columns: [{ field: "year", sort: "desc", hidden: true }, { field: "p" }],
      values: [{ field: "amount", aggFunc: "sum", hidden: true }],
    });
    expect(sanitizeGridPivotModel(null)).toEqual({ rows: [], columns: [], values: [] });
    expect(sanitizeGridPivotModel({ rows: "x" })).toEqual({ rows: [], columns: [], values: [] });
    expect(gridPivotRole(model, "region")).toBe("rows");
    expect(gridPivotRole(model, "year")).toBe("columns");
    expect(gridPivotRole(model, "amount")).toBe("values");
    expect(gridPivotRole(model, "zzz")).toBe("none");
    const moved = setGridPivotRole(model, "region", "values", "avg");
    expect(moved.rows).toEqual([{ field: "x", hidden: true }]);
    expect(moved.values.at(-1)).toEqual({ field: "region", aggFunc: "avg" });
    expect(setGridPivotRole(model, "zzz", "columns").columns.at(-1)).toEqual({ field: "zzz" });
    expect(setGridPivotRole(model, "zzz", "rows").rows.at(-1)).toEqual({ field: "zzz" });
    expect(setGridPivotRole(model, "year", "none").columns).toEqual([{ field: "p" }]);
    expect(setGridPivotRole(model, "q", "values").values.at(-1)).toEqual({
      field: "q",
      aggFunc: "sum",
    });
  });
});

describe("charts", () => {
  it("takes categories and number series from the items", () => {
    const data = gridChartData(
      SALES,
      { values: ["amount", "missing", "region"] },
      COLUMNS,
      (r) => r.product,
      value,
    );
    expect(data).toEqual({
      categories: ["Tea", "Tea", "Coffee", "Tea"],
      series: [
        { name: "Amount", data: [10, 20, 5, null] },
        { name: "Region", data: [null, null, null, null] },
      ],
    });
    expect(gridChartData(SALES, {}, [{ field: "amount" }], (r) => r.id, value).series).toEqual([]);
    expect(
      gridChartData(SALES, { values: ["amount"] }, [{ field: "amount" }], (r) => r.id, value)
        .series[0]?.name,
    ).toBe("amount");
  });

  it("reads chart models safely", () => {
    expect(sanitizeGridChartModel({ type: "line", dimension: "region", values: ["a", 1] })).toEqual(
      { type: "line", dimension: "region", values: ["a"] },
    );
    expect(sanitizeGridChartModel({ type: "pie", dimension: 2, values: "a" })).toEqual({});
    expect(sanitizeGridChartModel([])).toEqual({});
    expect(sanitizeGridChartModel(null)).toEqual({});
  });
});

describe("grid state", () => {
  it("keeps phase 6 models and drops the rest", () => {
    const state = sanitizeGridState({
      rowGrouping: { model: ["region", 3, "__proto__"] },
      aggregation: { model: { amount: "sum", x: "nope" } },
      pivoting: { model: { rows: [{ field: "region" }] }, active: true },
      chartsIntegration: { model: { type: "area" } },
    });
    expect(state.rowGrouping).toEqual({ model: ["region"] });
    expect(state.aggregation).toEqual({ model: { amount: "sum" } });
    expect(state.pivoting).toEqual({
      model: { rows: [{ field: "region" }], columns: [], values: [] },
      active: true,
    });
    expect(state.chartsIntegration).toEqual({ model: { type: "area" } });
    const empty = sanitizeGridState({
      rowGrouping: { model: "x" },
      aggregation: { model: [] },
      pivoting: { model: 1, active: "yes" },
      chartsIntegration: { model: 1 },
    });
    expect(empty).toEqual({ pivoting: {} });
  });
});
