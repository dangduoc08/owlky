import { describe, expect, it } from "vitest";
import { distance, matchesAll, normalizeName, suggest } from "./search.js";

describe("normalizeName", () => {
  it.each([
    ["IconButton", "icon-button"],
    ["Icon button", "icon-button"],
    ["  icon_button ", "icon-button"],
    ["Foundations/Colors", "foundations-colors"],
    ["DateTimePicker2", "date-time-picker2"],
  ])("%s → %s", (input, expected) => expect(normalizeName(input)).toBe(expected));
});

describe("distance", () => {
  it("counts edits", () => {
    expect(distance("kitten", "sitting")).toBe(3);
    expect(distance("same", "same")).toBe(0);
    expect(distance("", "abc")).toBe(3);
  });

  it("stops early past the maximum", () => {
    expect(distance("a", "abcdef", 2)).toBe(3);
    expect(distance("abcdef", "uvwxyz", 2)).toBe(3);
  });
});

describe("suggest", () => {
  const names = ["button", "button-group", "icon-button", "badge", "dialog"];

  it("puts substrings first, then typos, shortest first", () => {
    expect(suggest("button", names)).toEqual(["button", "icon-button", "button-group"]);
    expect(suggest("dialgo", names)).toEqual(["dialog"]);
    expect(suggest("icon-button-x", names)).toEqual(["button", "icon-button"]);
  });

  it("returns nothing for distant input and honors the limit", () => {
    expect(suggest("zzzzzzzz", names)).toEqual([]);
    expect(suggest("b", names, 2)).toHaveLength(2);
    expect(suggest("b", ["b", "a", "b"])).toEqual(["b", "a"]);
    expect(suggest("a", ["ba", "ab"])).toEqual(["ab", "ba"]);
    expect(suggest("a", ["ab", "ba"])).toEqual(["ab", "ba"]);
  });
});

describe("matchesAll", () => {
  it("needs every word in some field", () => {
    expect(matchesAll("primary MAIN", ["--ok-palette-primary-main", undefined])).toBe(true);
    expect(matchesAll("primary dark", ["--ok-palette-primary-main"])).toBe(false);
    expect(matchesAll("   ", ["anything"])).toBe(true);
  });
});
