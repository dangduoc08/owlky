import { describe, expect, it } from "vitest";
import { geoDescription } from "./describe.js";

const ITEMS = [
  { name: "Ohio", value: 11.8, text: "11.8 million" },
  { name: "Utah", value: 3.27, text: "3.27 million" },
  { name: "Texas", value: 29.15, text: "29.15 million" },
  { name: "Guam", value: null },
  { name: "Iowa", value: 3.19, text: "3.19 million" },
];

describe("geoDescription", () => {
  it("names the type, the count, the range, the extremes, the classes and the gaps", () => {
    expect(geoDescription({ kind: "choropleth", items: ITEMS, classes: ["0 – 5", "5 – 30"] })).toBe(
      "Choropleth map of 5 regions. Values range from 3.19 million in Iowa to 29.15 million in Texas. Highest: Texas (29.15 million), Ohio (11.8 million) and Utah (3.27 million). 2 classes: 0 – 5 and 5 – 30. No data for Guam.",
    );
  });

  it("translates through its strings and shortens long lists", () => {
    const text = geoDescription({
      kind: "hex",
      items: [
        { name: "A", value: 1 },
        { name: "B", value: null },
        { name: "C", value: null },
        { name: "D", value: null },
      ],
      noDataLimit: 2,
      strings: { summary: "{type} : {count} régions.", hex: "Carte hexagonale", and: "et" },
    });
    expect(text).toBe(
      "Carte hexagonale : 4 régions. Values range from 1 in A to 1 in A. No data for B, C et 1 more.",
    );
    // Without values or regions: the summary only.
    expect(geoDescription({ items: [] })).toBe("Map of 0 regions.");
    expect(
      geoDescription({
        kind: "pixel",
        items: [
          { name: "X", value: 2 },
          { name: "Y", value: 1 },
        ],
        highest: 0,
      }),
    ).toBe("Pixel map of 2 regions. Values range from 1 in Y to 2 in X.");
    // Unknown placeholders stay as written.
    expect(geoDescription({ items: [], strings: { summary: "{nope}" } })).toBe("{nope}");
  });
});
