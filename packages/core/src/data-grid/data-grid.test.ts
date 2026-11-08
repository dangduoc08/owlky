import { describe, expect, it } from "vitest";
import {
  csvField,
  filterGridRows,
  type GridColumn,
  gridAlign,
  gridAriaSort,
  gridColumnTemplate,
  gridCompare,
  gridFilterOperators,
  gridHeaderAlign,
  gridOperatorNeedsValue,
  gridQuickFilterValues,
  gridSelectAllState,
  gridSortValue,
  gridToCsv,
  isGridFilterable,
  isGridHideable,
  isGridSortable,
  matchesGridFilter,
  nextGridSort,
  sortGridRows,
  toggleGridRow,
  toggleGridRows,
  visibleGridColumns,
} from "./data-grid.js";

type Row = Record<string, unknown>;
const rows: Row[] = [
  { id: "1", name: "Ana", age: 30, joined: "2026-01-02", admin: true, team: "red" },
  { id: "2", name: "bao", age: 9, joined: "2025-12-31", admin: false, team: "blue" },
  { id: "3", name: "Chloe", age: null, joined: "", admin: "true", team: "red" },
  { id: "4", name: "Ana", age: 30, joined: "2026-03-01", admin: false, team: "" },
];
const columns: GridColumn[] = [
  { field: "name", headerName: "Name" },
  { field: "age", type: "number" },
  { field: "joined", type: "date" },
  { field: "admin", type: "boolean" },
  { field: "team", type: "singleSelect", valueOptions: ["red", "blue"] },
  { field: "actions", type: "actions" },
];
const value = (row: Row, field: string) => row[field];
const text = (row: Row, field: string) => String(row[field] ?? "");
const ids = (list: Row[]) => list.map((r) => r["id"]);

describe("data grid columns", () => {
  it("defaults by type", () => {
    const [name, age, , , , actions] = columns as [
      GridColumn,
      GridColumn,
      GridColumn,
      GridColumn,
      GridColumn,
      GridColumn,
    ];
    expect([
      isGridSortable(name),
      isGridSortable(actions),
      isGridSortable({ field: "x", sortable: false }),
    ]).toEqual([true, false, false]);
    expect([isGridFilterable(age), isGridFilterable(actions)]).toEqual([true, false]);
    expect([isGridHideable(name), isGridHideable({ field: "x", hideable: false })]).toEqual([
      true,
      false,
    ]);
    expect([gridAlign(name), gridAlign(age), gridAlign({ field: "x", align: "center" })]).toEqual([
      "left",
      "right",
      "center",
    ]);
    expect([
      gridHeaderAlign(age),
      gridHeaderAlign({ field: "x", type: "number", headerAlign: "left" }),
    ]).toEqual(["right", "left"]);
  });

  it("template: px widths, flex tracks with a minimum, the checkbox column", () => {
    expect(
      gridColumnTemplate([{ field: "a" }, { field: "b", width: 40, minWidth: 60 }], false),
    ).toBe("100px 60px");
    expect(
      gridColumnTemplate(
        [
          { field: "a", flex: 2, minWidth: 120 },
          { field: "b", flex: -1 },
          { field: "c", width: Number.NaN },
        ],
        true,
      ),
    ).toBe("50px minmax(120px, 2fr) 100px 100px");
  });

  it("visibility model hides columns set to false", () => {
    expect(visibleGridColumns(columns, { age: false, name: true }).map((c) => c.field)).toEqual([
      "name",
      "joined",
      "admin",
      "team",
      "actions",
    ]);
    expect(visibleGridColumns(columns)).toHaveLength(6);
  });
});

describe("data grid sorting", () => {
  it("values by type; empty → null", () => {
    expect(gridSortValue("12", "number")).toBe(12);
    expect(gridSortValue("x", "number")).toBeNull();
    expect(gridSortValue(new Date(5), "dateTime")).toBe(5);
    expect(gridSortValue("nope", "date")).toBeNull();
    expect([gridSortValue(true, "boolean"), gridSortValue("false", "boolean")]).toEqual([1, 0]);
    expect(gridSortValue("Ab")).toBe("ab");
    expect([gridSortValue(null), gridSortValue(undefined), gridSortValue("")]).toEqual([
      null,
      null,
      null,
    ]);
  });

  it("compares numerically and naturally; empty last", () => {
    expect(gridCompare(9, 30, "number")).toBeLessThan(0);
    expect(gridCompare("item 2", "item 10")).toBeLessThan(0);
    expect(gridCompare(null, 1, "number")).toBe(1);
    expect(gridCompare(1, null, "number")).toBe(-1);
    expect(gridCompare(null, "")).toBe(0);
  });

  it("next sort: none → asc → desc → none; multi keeps the others", () => {
    expect(nextGridSort([], "a")).toEqual([{ field: "a", sort: "asc" }]);
    expect(nextGridSort([{ field: "a", sort: "asc" }], "a")).toEqual([
      { field: "a", sort: "desc" },
    ]);
    expect(nextGridSort([{ field: "a", sort: "desc" }], "a")).toEqual([]);
    expect(nextGridSort([{ field: "a", sort: "asc" }], "b")).toEqual([{ field: "b", sort: "asc" }]);
    const two = nextGridSort([{ field: "a", sort: "asc" }], "b", true);
    expect(two).toEqual([
      { field: "a", sort: "asc" },
      { field: "b", sort: "asc" },
    ]);
    expect(nextGridSort(two, "a", true)).toEqual([
      { field: "a", sort: "desc" },
      { field: "b", sort: "asc" },
    ]);
    expect(
      nextGridSort(
        [
          { field: "a", sort: "desc" },
          { field: "b", sort: "asc" },
        ],
        "a",
        true,
      ),
    ).toEqual([{ field: "b", sort: "asc" }]);
  });

  it("sorts stably, by several keys, empty values last in both directions", () => {
    expect(ids(sortGridRows(rows, [{ field: "age", sort: "asc" }], columns, value))).toEqual([
      "2",
      "1",
      "4",
      "3",
    ]);
    expect(ids(sortGridRows(rows, [{ field: "age", sort: "desc" }], columns, value))).toEqual([
      "1",
      "4",
      "2",
      "3",
    ]);
    expect(
      ids(
        sortGridRows(
          rows,
          [
            { field: "name", sort: "asc" },
            { field: "joined", sort: "desc" },
          ],
          columns,
          value,
        ),
      ),
    ).toEqual(["4", "1", "2", "3"]);
    expect(ids(sortGridRows(rows, [{ field: "missing", sort: "asc" }], columns, value))).toEqual([
      "1",
      "2",
      "3",
      "4",
    ]);
    expect(ids(sortGridRows(rows, [], columns, value))).toEqual(["1", "2", "3", "4"]);
    expect(gridAriaSort([{ field: "age", sort: "desc" }], columns[1] as GridColumn)).toBe(
      "descending",
    );
    expect(gridAriaSort([{ field: "age", sort: "asc" }], columns[1] as GridColumn)).toBe(
      "ascending",
    );
    expect(gridAriaSort([], columns[0] as GridColumn)).toBe("none");
    expect(gridAriaSort([], columns[5] as GridColumn)).toBeUndefined();
  });
});

describe("data grid filtering", () => {
  it("operators per type; which need a value", () => {
    expect(gridFilterOperators()).toContain("contains");
    expect(gridFilterOperators("number")).toContain(">=");
    expect(gridFilterOperators("dateTime")).toContain("onOrBefore");
    expect(gridFilterOperators("boolean")).toEqual(["is"]);
    expect(gridFilterOperators("singleSelect")).toContain("not");
    expect([gridOperatorNeedsValue("isEmpty"), gridOperatorNeedsValue("contains")]).toEqual([
      false,
      true,
    ]);
  });

  it("string operators (case-insensitive) and empty checks", () => {
    const m = (operator: string, v?: string) =>
      matchesGridFilter("Hello", "Hello", { field: "f", operator, value: v });
    expect([
      m("contains", "ell"),
      m("doesNotContain", "ell"),
      m("equals", "hello"),
      m("startsWith", "he"),
      m("endsWith", "LO"),
    ]).toEqual([true, false, true, true, true]);
    expect([m("contains"), m("unknown", "x")]).toEqual([true, true]);
    expect(matchesGridFilter("", "", { field: "f", operator: "isEmpty" })).toBe(true);
    expect(matchesGridFilter("x", "x", { field: "f", operator: "isNotEmpty" })).toBe(true);
  });

  it("numbers, dates (by day), booleans, single select", () => {
    const n = (operator: string, v: string, raw: unknown = 10) =>
      matchesGridFilter(raw, String(raw), { field: "f", operator, value: v }, "number");
    expect([
      n("=", "10"),
      n("!=", "10"),
      n(">", "9"),
      n(">=", "10"),
      n("<", "11"),
      n("<=", "9"),
      n("?", "1"),
      n("=", "x"),
      n("=", "1", null),
    ]).toEqual([true, false, true, true, true, false, true, false, false]);
    const d = (operator: string, v: string) =>
      matchesGridFilter("2026-01-02T18:00:00Z", "", { field: "f", operator, value: v }, "date");
    expect([
      d("is", "2026-01-02"),
      d("not", "2026-01-02"),
      d("after", "2026-01-01"),
      d("onOrAfter", "2026-01-02"),
      d("before", "2026-01-03"),
      d("onOrBefore", "2026-01-01"),
    ]).toEqual([true, false, true, true, true, false]);
    expect(
      matchesGridFilter(
        "2026-01-02T18:00:00Z",
        "",
        { field: "f", operator: "is", value: "2026-01-02T18:00:00Z" },
        "dateTime",
      ),
    ).toBe(true);
    expect(
      matchesGridFilter(true, "yes", { field: "f", operator: "is", value: "true" }, "boolean"),
    ).toBe(true);
    expect(
      matchesGridFilter("false", "no", { field: "f", operator: "is", value: "true" }, "boolean"),
    ).toBe(false);
    expect(
      matchesGridFilter(
        "red",
        "Red team",
        { field: "f", operator: "is", value: "RED" },
        "singleSelect",
      ),
    ).toBe(true);
    expect(
      matchesGridFilter(
        undefined,
        "",
        { field: "f", operator: "not", value: "red" },
        "singleSelect",
      ),
    ).toBe(true);
  });

  it("filter items (all pass) and quick filter words (each in some filterable column)", () => {
    const model = (
      items: { field: string; operator: string; value?: string }[],
      quick?: string[],
    ) => ({ items, quickFilterValues: quick });
    expect(
      ids(
        filterGridRows(
          rows,
          model([{ field: "age", operator: ">", value: "10" }]),
          columns,
          value,
          text,
        ),
      ),
    ).toEqual(["1", "4"]);
    expect(ids(filterGridRows(rows, model([], ["ana", "2026-03"]), columns, value, text))).toEqual([
      "4",
    ]);
    expect(ids(filterGridRows(rows, model([], ["  ", ""]), columns, value, text))).toEqual([
      "1",
      "2",
      "3",
      "4",
    ]);
    expect(
      ids(
        filterGridRows(
          rows,
          model([{ field: "nope", operator: "contains", value: "x" }]),
          columns,
          value,
          text,
        ),
      ),
    ).toEqual(["1", "2", "3", "4"]);
    expect(
      ids(
        filterGridRows(
          rows,
          model([{ field: "team", operator: "isEmpty" }], ["ana"]),
          columns,
          value,
          text,
        ),
      ),
    ).toEqual(["4"]);
    expect(gridQuickFilterValues("  red   ana ")).toEqual(["red", "ana"]);
  });
});

describe("data grid selection and export", () => {
  it("select-all state and toggles", () => {
    expect(gridSelectAllState(["a", "b"], [])).toBe("none");
    expect(gridSelectAllState(["a", "b"], ["a"])).toBe("some");
    expect(gridSelectAllState(["a", "b"], ["b", "a", "z"])).toBe("all");
    expect(toggleGridRow(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleGridRow(["a", "b"], "a")).toEqual(["b"]);
    expect(toggleGridRows(["z"], ["a", "b"])).toEqual(["z", "a", "b"]);
    expect(toggleGridRows(["a", "b", "z"], ["a", "b"])).toEqual(["z"]);
  });

  it("CSV: quotes, formula neutralization, BOM, CRLF; actions columns skipped", () => {
    expect(csvField("plain")).toBe("plain");
    expect(csvField('say "hi", ok')).toBe('"say ""hi"", ok"');
    expect(csvField("=SUM(A1)")).toBe(`"'=SUM(A1)"`);
    expect(csvField("-2")).toBe(`"'-2"`);
    expect(csvField("@x")).toBe(`"'@x"`);
    expect(csvField("line\nbreak")).toBe('"line\nbreak"');
    const csv = gridToCsv(columns, [rows[0] as Row], text);
    expect(csv.startsWith("﻿Name,age,joined,admin,team\r\n")).toBe(true);
    expect(csv.endsWith("Ana,30,2026-01-02,true,red")).toBe(true);
  });
});
