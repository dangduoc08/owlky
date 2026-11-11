import { describe, expect, it } from "vitest";
import {
  gridAutoColumns,
  gridAutoValue,
  gridHeaderName,
  gridInferColumnType,
} from "./grid-auto-columns.js";

describe("generated columns", () => {
  it("infers types from values, blanks left out", () => {
    expect(gridInferColumnType([1, 2.5, null, undefined, ""])).toBe("number");
    expect(gridInferColumnType([true, false, null])).toBe("boolean");
    expect(gridInferColumnType(["2025-05-14", "2024-02-29"])).toBe("date");
    expect(gridInferColumnType(["2025-05-14", "2025-05-14T10:30:00Z"])).toBe("dateTime");
    expect(gridInferColumnType([new Date(2025, 4, 1)])).toBe("date");
    expect(gridInferColumnType([new Date(2025, 4, 1, 9, 30)])).toBe("dateTime");
    expect(gridInferColumnType([new Date(Number.NaN)])).toBe("string");
    expect(gridInferColumnType(["2025-13-45"])).toBe("string");
    expect(gridInferColumnType([1, "a"])).toBe("string");
    expect(gridInferColumnType(["1", "2"])).toBe("string");
    expect(gridInferColumnType([Number.NaN])).toBe("string");
    expect(gridInferColumnType([{ a: 1 }, [1]])).toBe("string");
    expect(gridInferColumnType([null, ""])).toBe("string");
    expect(gridInferColumnType([])).toBe("string");
  });

  it("reads table text: numbers, booleans and ISO dates", () => {
    expect(gridInferColumnType(["42", " -1.5 ", "1e3", ".5"], true)).toBe("number");
    expect(gridInferColumnType(["true", "false", ""], true)).toBe("boolean");
    expect(gridInferColumnType(["2025-05-14", "2025-05-15 08:00"], true)).toBe("dateTime");
    expect(gridInferColumnType(["42", "n/a"], true)).toBe("string");
    expect(gridInferColumnType(["Yes"], true)).toBe("string");
    expect(gridAutoValue(" 42 ", "number")).toBe(42);
    expect(gridAutoValue("true", "boolean")).toBe(true);
    expect(gridAutoValue("false", "boolean")).toBe(false);
    expect(gridAutoValue("2025-05-14", "date")).toBe("2025-05-14");
    expect(gridAutoValue("  ", "string")).toBeNull();
  });

  it("names headers from fields", () => {
    expect(gridHeaderName("firstName")).toBe("First name");
    expect(gridHeaderName("unit_price")).toBe("Unit price");
    expect(gridHeaderName("due-date")).toBe("Due date");
    expect(gridHeaderName("userID")).toBe("User ID");
    expect(gridHeaderName("HTMLText")).toBe("HTML text");
    expect(gridHeaderName("id")).toBe("ID");
    expect(gridHeaderName("points2025")).toBe("Points2025");
    expect(gridHeaderName("__")).toBe("__");
  });

  it("makes one column per field, in first-seen order", () => {
    const rows = [
      { id: 1, title: "Docs", done: false },
      { id: 2, title: "Search", due: "2025-05-21", done: true },
      null,
      "text",
      JSON.parse('{"__proto__": 1, "points": 3}'),
    ];
    expect(gridAutoColumns(rows)).toEqual([
      { field: "id", headerName: "ID", type: "number", flex: 1, minWidth: 120 },
      { field: "title", headerName: "Title", type: "string", flex: 1, minWidth: 120 },
      { field: "done", headerName: "Done", type: "boolean", flex: 1, minWidth: 120 },
      { field: "due", headerName: "Due", type: "date", flex: 1, minWidth: 120 },
      { field: "points", headerName: "Points", type: "number", flex: 1, minWidth: 120 },
    ]);
    // Only the sampled rows count.
    expect(gridAutoColumns([{ a: 1 }, { b: 2 }], { sample: 1 }).map((c) => c.field)).toEqual(["a"]);
    expect(gridAutoColumns([{ n: "7" }], { fromText: true })[0]?.type).toBe("number");
    expect(gridAutoColumns([])).toEqual([]);
  });
});
