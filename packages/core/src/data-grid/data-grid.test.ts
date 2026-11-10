import { describe, expect, it } from "vitest";
import {
  clampGridWidth,
  csvField,
  filterGridRows,
  type GridColumn,
  gridAlign,
  gridAriaSort,
  gridColumnTemplate,
  gridCompare,
  gridDirectedComparator,
  gridExportColumns,
  gridFilterOperators,
  gridFilterValues,
  gridFoldText,
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
  parseGridSortingOrder,
  pruneGridSelection,
  selectGridRow,
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

  it("follows a sort cycle (sortingOrder)", () => {
    const order = ["desc", "asc"] as const;
    expect(nextGridSort([], "a", false, order)).toEqual([{ field: "a", sort: "desc" }]);
    expect(nextGridSort([{ field: "a", sort: "desc" }], "a", false, order)).toEqual([
      { field: "a", sort: "asc" },
    ]);
    // No null in the cycle: the column never goes back to unsorted.
    expect(nextGridSort([{ field: "a", sort: "asc" }], "a", false, order)).toEqual([
      { field: "a", sort: "desc" },
    ]);
    expect(nextGridSort([{ field: "a", sort: "asc" }], "a", false, ["desc", null])).toEqual([
      { field: "a", sort: "desc" },
    ]);
    expect(nextGridSort([{ field: "a", sort: "desc" }], "a", true, ["desc", null])).toEqual([]);
    expect(parseGridSortingOrder('["desc", null, "desc", "up", 1]')).toEqual(["desc", null]);
    expect(parseGridSortingOrder(["asc"])).toEqual(["asc"]);
    expect(parseGridSortingOrder("[]")).toBeUndefined();
    expect(parseGridSortingOrder("{")).toBeUndefined();
    expect(parseGridSortingOrder('{"a":1}')).toBeUndefined();
    expect(parseGridSortingOrder(null)).toBeUndefined();
  });

  it("sorts with a column's own comparators", () => {
    const byLength = (a: unknown, b: unknown) => String(a).length - String(b).length;
    expect(gridDirectedComparator(undefined, "asc")).toBeUndefined();
    expect(gridDirectedComparator({ sortComparator: byLength }, "asc")?.("ab", "a", {}, {})).toBe(
      1,
    );
    expect(gridDirectedComparator({ sortComparator: byLength }, "desc")?.("ab", "a", {}, {})).toBe(
      -1,
    );
    // getSortComparator wins and is used as it is; undefined falls back to sortComparator.
    const directed = {
      sortComparator: byLength,
      getSortComparator: (direction: "asc" | "desc") => (direction === "asc" ? () => 7 : undefined),
    };
    expect(gridDirectedComparator(directed, "asc")?.("a", "b", {}, {})).toBe(7);
    expect(gridDirectedComparator(directed, "desc")?.("ab", "a", {}, {})).toBe(-1);
    const own = (field: string, direction: "asc" | "desc") =>
      field === "name"
        ? gridDirectedComparator<Row>(
            {
              sortComparator: (a, b, rowA, rowB) =>
                byLength(a, b) || Number(rowB["id"]) - Number(rowA["id"]),
            },
            direction,
          )
        : undefined;
    expect(ids(sortGridRows(rows, [{ field: "name", sort: "asc" }], columns, value, own))).toEqual([
      "4",
      "2",
      "1",
      "3",
    ]);
    expect(ids(sortGridRows(rows, [{ field: "name", sort: "desc" }], columns, value, own))).toEqual(
      ["3", "1", "2", "4"],
    );
    // A tie (or NaN) goes on to the next key.
    const tie = () => () => Number.NaN;
    expect(
      ids(
        sortGridRows(
          rows,
          [
            { field: "team", sort: "asc" },
            { field: "age", sort: "asc" },
          ],
          columns,
          value,
          (field) => (field === "team" ? tie() : undefined),
        ),
      ),
    ).toEqual(["2", "1", "4", "3"]);
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

describe("phase 4", () => {
  it("isAnyOf: text, numbers, single select; lists and comma text", () => {
    expect(gridFilterValues(" a, b ,,c")).toEqual(["a", "b", "c"]);
    expect(gridFilterValues(["x", " y "])).toEqual(["x", "y"]);
    expect(gridFilterValues(undefined)).toEqual([]);
    const anyOf = (field: string, v: string | string[]) =>
      ids(
        filterGridRows(
          rows,
          { items: [{ field, operator: "isAnyOf", value: v }] },
          columns,
          value,
          text,
        ),
      );
    expect(anyOf("name", "ana, BAO")).toEqual(["1", "2", "4"]);
    expect(anyOf("age", ["9", "30"])).toEqual(["1", "2", "4"]);
    expect(anyOf("team", ["blue"])).toEqual(["2"]);
    expect(anyOf("name", [])).toEqual(["1", "2", "3", "4"]);
    expect(gridFilterOperators("string")).toContain("isAnyOf");
    expect(gridFilterOperators("date")).not.toContain("isAnyOf");
  });

  it("ignores accents when asked", () => {
    expect(gridFoldText("Đà Nẵng", true)).toBe("da nang");
    expect(gridFoldText("Đà", false)).toBe("đà");
    const places: Row[] = [
      { id: "a", name: "Hà Nội" },
      { id: "b", name: "Huế" },
    ];
    const cols: GridColumn[] = [{ field: "name" }];
    const find = (words: string[], ignoreDiacritics: boolean) =>
      ids(
        filterGridRows(places, { items: [], quickFilterValues: words }, cols, value, text, {
          ignoreDiacritics,
        }),
      );
    expect(find(["ha", "noi"], true)).toEqual(["a"]);
    expect(find(["ha", "noi"], false)).toEqual([]);
    expect(
      matchesGridFilter(
        "Huế",
        "Huế",
        { field: "name", operator: "equals", value: "hue" },
        "string",
        true,
      ),
    ).toBe(true);
  });

  it("quick filter: or, searched columns, unsearchable columns", () => {
    const words = (quickFilterValues: string[], options = {}) =>
      ids(filterGridRows(rows, { items: [], quickFilterValues }, columns, value, text, options));
    expect(words(["chloe", "bao"])).toEqual([]);
    expect(words(["chloe", "bao"], { quickFilterLogicOperator: "or" })).toEqual(["2", "3"]);
    expect(words(["blue"], { quickFilterColumns: [columns[0] as GridColumn] })).toEqual([]);
    expect(
      words(["blue"], {
        quickFilterColumns: columns.map((c) =>
          c.field === "team" ? { ...c, searchable: false } : c,
        ),
      }),
    ).toEqual([]);
  });

  it("custom operators replace the type's; null tests filter nothing", () => {
    const operators = {
      age: [
        {
          value: "between",
          getApplyFilterFn: (item: { value?: unknown }) => {
            const [low, high] = gridFilterValues(item.value as string).map(Number);
            return low === undefined || high === undefined
              ? null
              : (v: unknown) => Number(v) >= low && Number(v) <= high;
          },
        },
        { value: "any", requiresValue: false, getApplyFilterFn: () => () => true },
      ],
    };
    const by = (v: string) =>
      ids(
        filterGridRows(
          rows,
          { items: [{ field: "age", operator: "between", value: v }] },
          columns,
          value,
          text,
          {
            operators,
          },
        ),
      );
    expect(by("5, 10")).toEqual(["2"]);
    expect(by("5")).toEqual(["1", "2", "3", "4"]);
    expect(gridOperatorNeedsValue("any", operators.age)).toBe(false);
    expect(gridOperatorNeedsValue("between", operators.age)).toBe(true);
    expect(gridOperatorNeedsValue("isEmpty")).toBe(false);
  });

  it("single selection, pruning, max widths", () => {
    expect(selectGridRow(["a"], "b", false)).toEqual(["b"]);
    expect(selectGridRow(["b"], "b", false)).toEqual([]);
    expect(selectGridRow(["a"], "b")).toEqual(["a", "b"]);
    expect(pruneGridSelection(["a", "x", "b"], ["a", "b", "c"])).toEqual(["a", "b"]);
    expect(clampGridWidth({ field: "a", maxWidth: 120 }, 500)).toBe(120);
    expect(clampGridWidth({ field: "a", maxWidth: 120 }, 10)).toBe(50);
  });

  it("CSV options: delimiter, headers, BOM, fields and hidden columns", () => {
    const shown = columns.slice(0, 2);
    expect(gridExportColumns(columns, shown).map((c) => c.field)).toEqual(["name", "age"]);
    expect(gridExportColumns(columns, shown, { allColumns: true }).map((c) => c.field)).toEqual([
      "name",
      "age",
      "joined",
      "admin",
      "team",
    ]);
    expect(
      gridExportColumns(columns, shown, { fields: ["team", "name", "nope"] }).map((c) => c.field),
    ).toEqual(["team", "name"]);
    const csv = gridToCsv(shown, rows.slice(0, 2), text, {
      delimiter: ";",
      includeHeaders: false,
      utf8WithBom: false,
    });
    expect(csv).toBe("Ana;30\r\nbao;9");
    expect(csvField("a;b", ";")).toBe('"a;b"');
    expect(csvField("a;b")).toBe("a;b");
  });
});
