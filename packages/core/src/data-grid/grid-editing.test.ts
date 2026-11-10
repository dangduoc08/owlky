import { describe, expect, it } from "vitest";
import {
  gridEditModeOf,
  gridEditModes,
  gridEditTarget,
  sanitizeGridCellModes,
  sanitizeGridRowModes,
} from "./grid-editing.js";

describe("edit modes models", () => {
  it("finds the first cell or row in edit mode", () => {
    const cells = {
      a: { name: { mode: "view" as const } },
      b: { age: { mode: "edit" as const }, name: { mode: "edit" as const } },
    };
    expect(gridEditTarget(cells, {}, "cell")).toEqual({ id: "b", field: "age" });
    expect(gridEditTarget({ a: { name: { mode: "view" } } }, undefined, "cell")).toBeNull();
    expect(gridEditTarget(undefined, { a: { mode: "edit", fieldToFocus: "age" } }, "row")).toEqual({
      id: "a",
      field: null,
      fieldToFocus: "age",
    });
    expect(gridEditTarget(undefined, { a: { mode: "edit" } }, "row")).toEqual({
      id: "a",
      field: null,
    });
    expect(gridEditTarget(cells, { a: { mode: "view" } }, "row")).toBeNull();
    expect(gridEditModeOf(cells, {}, "cell", "b", "age")).toBe("edit");
    expect(gridEditModeOf(cells, {}, "cell", "b", "name")).toBe("view");
    expect(gridEditModeOf(cells, {}, "cell", "a", "name")).toBe("view");
    expect(gridEditModeOf({}, { a: { mode: "edit" } }, "row", "a")).toBe("edit");
  });

  it("builds the models of a start and a stop", () => {
    expect(gridEditModes("cell", "a", "name", "edit")).toEqual({
      cells: { a: { name: { mode: "edit" } } },
      rows: {},
    });
    expect(gridEditModes("cell", "a", "name", "view", true).cells).toEqual({
      a: { name: { mode: "view", ignoreModifications: true } },
    });
    expect(gridEditModes("row", "a", "name", "edit").rows).toEqual({
      a: { mode: "edit", fieldToFocus: "name" },
    });
    expect(gridEditModes("row", "a", "name", "view").rows).toEqual({ a: { mode: "view" } });
  });

  it("sanitizes untrusted models", () => {
    expect(
      sanitizeGridCellModes({
        a: { name: { mode: "edit", ignoreModifications: "yes", fieldToFocus: "x" }, age: 1 },
        b: [],
        c: { x: { mode: "open" } },
      }),
    ).toEqual({ a: { name: { mode: "edit" } } });
    expect(sanitizeGridCellModes(null)).toEqual({});
    expect(
      sanitizeGridRowModes({
        a: { mode: "view", ignoreModifications: true },
        b: { mode: "edit", fieldToFocus: "age" },
        c: "edit",
      }),
    ).toEqual({
      a: { mode: "view", ignoreModifications: true },
      b: { mode: "edit", fieldToFocus: "age" },
    });
    expect(sanitizeGridRowModes([])).toEqual({});
  });
});
