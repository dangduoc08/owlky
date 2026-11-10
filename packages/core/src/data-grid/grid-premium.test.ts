import { describe, expect, it } from "vitest";
import type { GridColumn } from "./data-grid.js";
import { sanitizeGridState } from "./grid-layout.js";
import {
  GRID_GROUPING_FIELD,
  gridActiveChartId,
  gridAggregate,
  gridAggregationFunctions,
  gridAggregationFunctionsFor,
  gridAggregationPositionOf,
  gridChartData,
  gridChartFields,
  gridChartOptions,
  gridChartStacked,
  gridGroupComparator,
  gridGroupFooterId,
  gridGroupingField,
  gridGroupingFieldOf,
  gridGroupingKey,
  gridGroupRowId,
  gridPivot,
  gridPivotField,
  gridPivotRole,
  gridRowGroups,
  gridTreeGroups,
  gridWithGroupFooters,
  isGridGroupingField,
  isGridPivotField,
  parseGridAggregationModel,
  parseGridAggregationPositions,
  sanitizeGridChartModel,
  sanitizeGridChartModels,
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

describe("grouping columns", () => {
  it("names one column per grouped field and reads the field back", () => {
    expect(gridGroupingField(null)).toBe(GRID_GROUPING_FIELD);
    expect(gridGroupingField("region")).toBe("__row_group_by_columns_group_region__");
    expect(gridGroupingFieldOf("__row_group_by_columns_group_region__")).toBe("region");
    expect(gridGroupingFieldOf(GRID_GROUPING_FIELD)).toBeNull();
    expect(gridGroupingFieldOf("region")).toBeUndefined();
    expect(gridGroupingFieldOf("__row_group_by_columns_group_")).toBeUndefined();
    expect(gridGroupingFieldOf("__row_group_by_columns_group___")).toBeUndefined();
    expect(isGridGroupingField(gridGroupingField("a_b"))).toBe(true);
    expect(isGridGroupingField("__tree_data_group__")).toBe(false);
  });

  it("turns grouping values into keys", () => {
    expect(gridGroupingKey("North")).toBe("North");
    expect(gridGroupingKey(1990)).toBe("1990");
    expect(gridGroupingKey(null)).toBe("");
    expect(gridGroupingKey(undefined)).toBe("");
    expect(gridGroupingKey(new Date(2025, 4, 3))).toBe("2025-05-03");
    expect(gridGroupingKey(new Date(Number.NaN))).toBe("");
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

describe("aggregation positions and group footers", () => {
  it("reads positions by level safely, with MUI X defaults", () => {
    const positions = parseGridAggregationPositions(
      '{"root":null,"region":"footer","product":"inline","x":"top","__proto__":"footer"}',
    );
    expect(positions).toEqual({ root: null, region: "footer", product: "inline" });
    expect(({} as Record<string, unknown>)["footer"]).toBeUndefined();
    expect(parseGridAggregationPositions("[1]")).toEqual({});
    expect(parseGridAggregationPositions("{oops")).toEqual({});
    expect(parseGridAggregationPositions(null)).toEqual({});
    expect(gridAggregationPositionOf(positions, undefined)).toBeNull();
    expect(gridAggregationPositionOf(positions, "region")).toBe("footer");
    expect(gridAggregationPositionOf({}, undefined)).toBe("footer");
    expect(gridAggregationPositionOf({}, "year")).toBe("inline");
  });

  it("adds a footer after the last shown row of each open group", () => {
    type Node = Parameters<typeof gridWithGroupFooters<string>>[0][number];
    const node = (id: string, depth: number, expanded = false, parentId: string | null = null) =>
      ({
        row: id,
        id,
        depth,
        parentId,
        childrenCount: expanded ? 1 : 0,
        descendantCount: 0,
        expanded,
        posInSet: 1,
        setSize: 1,
      }) as Node;
    const list = [
      node("a", 0, true),
      node("a/x", 1, true, "a"),
      node("a/x/1", 2, false, "a/x"),
      node("a/y", 1, false, "a"),
      node("b", 0, true),
      node("b/1", 1, false, "b"),
      node("c", 0, false),
    ];
    const out = gridWithGroupFooters(
      list,
      (n) => n.id !== "a/y",
      (n) => `footer of ${n.id}`,
    );
    expect(out.map((n) => n.row)).toEqual([
      "a",
      "a/x",
      "a/x/1",
      "footer of a/x",
      "a/y",
      "footer of a",
      "b",
      "b/1",
      "footer of b",
      "c",
    ]);
    const footer = out[3] as Node;
    expect(footer).toMatchObject({ id: gridGroupFooterId("a/x"), depth: 2, parentId: "a/x" });
    expect(gridGroupFooterId("g")).toBe("auto-generated-group-footer-g");
    // Closed groups (and lists without footers) stay as they are.
    expect(
      gridWithGroupFooters(
        list.slice(-1),
        () => true,
        () => "f",
      ),
    ).toHaveLength(1);
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

  it("sorts the groups of one field from its own grouping column", () => {
    const fieldOf = (i: Item) => (i.key === "c" ? "product" : "region");
    const compare = gridGroupComparator<Item>({
      isGroup: (i) => i.group,
      place: (i) => i.place,
      firstPlace: (i) => i.place,
      keyOf: (i) => i.key,
      aggregateOf: () => null,
      fieldOf,
      sortModel: [{ field: gridGroupingField("region"), sort: "desc" }],
      columns: [],
      groupFields: ["region", "product"],
      aggregated: [],
    });
    const [b, a, c] = items as [Item, Item, Item];
    // Two region groups: by key, descending; a product group against a region group: by place.
    expect(compare(a, b)).toBeGreaterThan(0);
    expect(compare(c, a)).toBeGreaterThan(0);
    expect(compare(b, c)).toBeGreaterThan(0);
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
    expect(sanitizeGridChartModel({ type: "gauge", dimension: 2, values: "a" })).toEqual({});
    expect(sanitizeGridChartModel([])).toEqual({});
    expect(sanitizeGridChartModel(null)).toEqual({});
    expect(
      sanitizeGridChartModel({
        type: "donut",
        stacked: true,
        showMark: "yes",
        showToolbar: false,
        animations: true,
        itemLabel: "value",
        legend: "right",
        colors: ["info", "nope", "error-dark", 3],
        curve: "stepline",
        seriesAxisLabel: "Revenue",
        height: 240,
        startAngle: -90,
        endAngle: Number.NaN,
        donutSize: "60",
      }),
    ).toEqual({
      type: "donut",
      stacked: true,
      showToolbar: false,
      animations: true,
      itemLabel: "value",
      legend: "right",
      colors: ["info", "error-dark"],
      curve: "stepline",
      seriesAxisLabel: "Revenue",
      height: 240,
      startAngle: -90,
    });
    expect(sanitizeGridChartModel({ itemLabel: "all", legend: "left", curve: "x" })).toEqual({});
  });

  it("charts pivot columns for their value field, named by their keys", () => {
    const pivot = gridPivot(
      SALES,
      COLUMNS,
      {
        rows: [{ field: "region" }],
        columns: [{ field: "year" }],
        values: [
          { field: "amount", aggFunc: "sum" },
          { field: "region", aggFunc: "size" },
        ],
      },
      value,
      text,
    );
    const fields = gridChartFields({ values: ["amount"] }, pivot.columns);
    expect(fields.map((c) => c.field)).toEqual([
      gridPivotField(["2024"], "amount", "sum"),
      gridPivotField(["2025"], "amount", "sum"),
    ]);
    // A pivot column field picks that column only; unknown fields are dropped.
    expect(
      gridChartFields(
        { values: [gridPivotField(["2025"], "region", "size"), "nope", "amount"] },
        pivot.columns,
      ).map((c) => c.field),
    ).toEqual([
      gridPivotField(["2025"], "region", "size"),
      gridPivotField(["2024"], "amount", "sum"),
      gridPivotField(["2025"], "amount", "sum"),
    ]);
    const groups = [
      { key: "North", rows: [SALES[0], SALES[2], SALES[3]] as Sale[] },
      { key: "South", rows: [SALES[1]] as Sale[] },
    ];
    const at = (group: (typeof groups)[number], field: string) =>
      gridAggregate(
        group.rows,
        { [field]: pivot.aggregationModel[field] as string },
        pivot.columns,
        (r, f) => pivot.value(r, f),
      )[field];
    const one = gridChartData(groups, { values: ["amount"] }, pivot.columns, (g) => g.key, at);
    expect(one.series).toEqual([
      { name: "2024", data: [10, null] },
      { name: "2025", data: [5, 20] },
    ]);
    const two = gridChartData(
      groups,
      { values: ["amount", "region"] },
      pivot.columns,
      (g) => g.key,
      at,
    );
    expect(two.series.map((s) => s.name)).toEqual([
      "2024 · Amount (sum)",
      "2025 · Amount (sum)",
      "2024 · Region (size)",
      "2025 · Region (size)",
    ]);
  });

  it("colors series or slices, and gives scatter charts [x, y] points", () => {
    const rows = SALES.slice(0, 3);
    const colored = gridChartData(
      rows,
      { values: ["amount", "year"], colors: ["info", "bad" as never] },
      COLUMNS,
      (r) => r.id,
      value,
    );
    expect(colored.series.map((s) => s.color)).toEqual(["info", "info"]);
    const pie = gridChartData(
      rows,
      { type: "pie", values: ["amount"], colors: ["info", "error"] },
      COLUMNS,
      (r) => r.id,
      value,
    );
    expect(pie.series[0]).toEqual({
      name: "Amount",
      data: [
        { y: 10, color: "info" },
        { y: 20, color: "error" },
        { y: 5, color: "info" },
      ],
    });
    const scatter = gridChartData(
      SALES,
      { type: "scatter", values: ["amount"] },
      COLUMNS,
      (r) => r.year,
      value,
      (r) => r.year,
    );
    expect(scatter).toEqual({
      categories: ["2024", "2025", "2025", "2025"],
      series: [
        {
          name: "Amount",
          data: [
            [2024, 10],
            [2025, 20],
            [2025, 5],
          ],
        },
      ],
      xType: "numeric",
    });
    // Without x values, a scatter chart uses the categories.
    expect(
      gridChartData(SALES, { type: "scatter", values: ["amount"] }, COLUMNS, (r) => r.id, value)
        .xType,
    ).toBeUndefined();
  });

  it("maps the model to the Chart's options", () => {
    const data = (n: number) => ({
      categories: [],
      series: Array.from({ length: n }, (_, i) => ({ name: String(i), data: [] })),
    });
    expect(gridChartOptions({}, null)).toEqual({ type: "bar", xType: "category" });
    expect(gridChartOptions({ type: "bar", stacked: true }, data(2))).toEqual({
      type: "bar",
      xType: "category",
      horizontal: true,
      stacked: true,
    });
    expect(gridChartStacked({ type: "line", stacked: true }, 1)).toBe(false);
    expect(gridChartStacked({ type: "pie", stacked: true }, 3)).toBe(false);
    expect(
      gridChartOptions(
        {
          type: "line",
          curve: "straight",
          showMark: true,
          itemLabel: "value",
          legend: "bottom",
          height: 200,
          seriesAxisLabel: "Revenue",
          showToolbar: true,
          animations: true,
          startAngle: 10,
        },
        data(1),
      ),
    ).toEqual({
      type: "line",
      xType: "category",
      curve: "straight",
      markerSize: 4,
      dataLabels: true,
      legend: "bottom",
      height: 200,
      yTitle: "Revenue",
      toolbar: true,
      animations: true,
    });
    expect(
      gridChartOptions(
        {
          type: "donut",
          legend: "top",
          curve: "straight",
          seriesAxisLabel: "x",
          startAngle: -90,
          endAngle: 90,
          donutSize: 60,
        },
        data(1),
      ),
    ).toEqual({ type: "donut", xType: "category", startAngle: -90, endAngle: 90, donutSize: 60 });
    expect(gridChartOptions({ type: "pie", donutSize: 60 }, data(1))).toEqual({
      type: "pie",
      xType: "category",
    });
    expect(
      gridChartOptions({ type: "radar", curve: "smooth", seriesAxisLabel: "x" }, null),
    ).toEqual({ type: "radar", xType: "category" });
    expect(gridChartOptions({ type: "scatter" }, { ...data(1), xType: "numeric" })).toEqual({
      type: "scatter",
      xType: "numeric",
    });
  });
});

describe("several charts", () => {
  it("reads chart models by safe ids and picks the active one", () => {
    expect(
      sanitizeGridChartModels({
        a: { type: "line", label: "A", bogus: 1 },
        "b-2_c": "x",
        "bad id": {},
        __proto__: { type: "bar" },
      }),
    ).toEqual({ a: { type: "line", label: "A" }, "b-2_c": {} });
    expect(sanitizeGridChartModels([1])).toEqual({});
    expect(sanitizeGridChartModels(null)).toEqual({});
    expect(gridActiveChartId({ a: {}, b: {} }, "b")).toBe("b");
    expect(gridActiveChartId({ a: {}, b: {} }, "c")).toBe("a");
    expect(gridActiveChartId({}, "a")).toBeNull();
    expect(
      sanitizeGridState({ chartsIntegration: { charts: { a: { label: 2 } }, activeChartId: "a" } })
        .chartsIntegration,
    ).toEqual({ charts: { a: {} }, activeChartId: "a" });
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
