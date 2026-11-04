import { describe, expect, it } from "vitest";
import { fromSelection, nextToggleSelection, toSelection } from "./toggle-selection.js";

describe("nextToggleSelection", () => {
  it("exclusive: selects one value, replaces it, and clears it when pressed again", () => {
    expect(nextToggleSelection([], "left", true)).toEqual(["left"]);
    expect(nextToggleSelection(["left"], "center", true)).toEqual(["center"]);
    expect(nextToggleSelection(["left"], "left", true)).toEqual([]);
  });

  it("multiple: adds and removes values, keeping order", () => {
    expect(nextToggleSelection(["bold"], "italic", false)).toEqual(["bold", "italic"]);
    expect(nextToggleSelection(["bold", "italic", "underline"], "italic", false)).toEqual([
      "bold",
      "underline",
    ]);
  });

  it("never mutates the input", () => {
    const selected = Object.freeze(["bold"]);
    nextToggleSelection(selected, "italic", false);
    nextToggleSelection(selected, "bold", false);
    expect(selected).toEqual(["bold"]);
  });
});

describe("selection shape helpers", () => {
  it("converts public values to selections", () => {
    expect(toSelection(undefined)).toEqual([]);
    expect(toSelection(null)).toEqual([]);
    expect(toSelection("left")).toEqual(["left"]);
    expect(toSelection(["a", "b"])).toEqual(["a", "b"]);
  });

  it("converts selections back for each mode", () => {
    expect(fromSelection([], true)).toBeNull();
    expect(fromSelection(["left"], true)).toBe("left");
    expect(fromSelection(["a", "b"], false)).toEqual(["a", "b"]);
  });
});
