import { describe, expect, it } from "vitest";
import { mapScale } from "./choropleth.js";
import { mapBubbleLayer, mapSizeScale } from "./symbols.js";

describe("mapSizeScale", () => {
  it("maps the square root of values to radii (area follows the value)", () => {
    const scale = mapSizeScale([1, 4, 9, 16], { range: [2, 10] });
    expect(scale.method).toBe("sqrt");
    expect([scale.min, scale.max]).toEqual([1, 16]);
    expect(scale.radiusOf(1)).toBe(2);
    expect(scale.radiusOf(16)).toBe(10);
    // √9 = 3 is two thirds of the way from √1 to √16.
    expect(scale.radiusOf(9)).toBeCloseTo(2 + (8 * 2) / 3, 2);
    expect(scale.radiusOf(null)).toBe(0);
    expect(scale.radiusOf(100)).toBe(10);
    expect(scale.expression).toEqual([
      "case",
      ["==", ["typeof", ["get", "value"]], "number"],
      ["interpolate", ["linear"], ["sqrt", ["max", 0, ["get", "value"]]], 1, 2, 4, 10],
      0,
    ]);
  });

  it("maps values linearly, with a domain and an input of your own", () => {
    const scale = mapSizeScale([5, 15], {
      method: "linear",
      domain: [0, 20],
      range: [30, 0],
      input: ["get", "pop"],
    });
    expect(scale.range).toEqual([0, 30]);
    expect(scale.radiusOf(10)).toBe(15);
    expect(scale.expression[2]).toEqual(["interpolate", ["linear"], ["get", "pop"], 0, 0, 20, 30]);
  });

  it("lists nested legend circles, largest first, at round values", () => {
    const scale = mapSizeScale([2.84, 6.25, 20.14]);
    expect(scale.legend.map((item) => item.value)).toEqual([20, 8.9, 4.2]);
    expect(scale.legend[0]?.radius).toBeCloseTo(scale.radiusOf(20), 5);
    const radii = scale.legend.map((item) => item.radius);
    expect([...radii].sort((a, b) => b - a)).toEqual(radii);
    expect(mapSizeScale([1, 2], { legendValues: [1, 2, 2] }).legend.map((i) => i.value)).toEqual([
      2, 1,
    ]);
  });

  it("handles missing and equal values", () => {
    const empty = mapSizeScale([null, Number.NaN]);
    expect(empty.nullCount).toBe(2);
    expect(empty.legend).toEqual([]);
    const flat = mapSizeScale([3, 3]);
    expect(flat.radiusOf(3)).toBe(18);
    expect(flat.expression[2]).toBe(18);
    // Negative values have no square root: they take the smallest radius.
    expect(mapSizeScale([-4, 4]).radiusOf(-4)).toBe(4);
  });
});

describe("mapBubbleLayer", () => {
  it("draws circles sized by the scale, colored by a second field, largest first", () => {
    const size = mapSizeScale([1, 9]);
    const color = mapScale([0, 10], { input: ["get", "growth"], palette: "error", classes: 2 });
    const layer = mapBubbleLayer({ id: "bubbles", source: "metros", size, color });
    expect(layer.type).toBe("circle");
    expect(layer.paint["circle-radius"]).toBe(size.expression);
    expect(layer.paint["circle-color"]).toBe(color.expression);
    expect(layer.paint["circle-opacity"]).toBe(0.62);
    expect(layer.paint["circle-stroke-color"]).toEqual([
      "case",
      [
        "any",
        ["boolean", ["feature-state", "selected"], false],
        ["boolean", ["feature-state", "focus"], false],
        ["boolean", ["feature-state", "hover"], false],
      ],
      "var(--ok-text-primary)",
      "var(--ok-bg-paper)",
    ]);
    expect(layer.layout["circle-sort-key"]).toEqual(["-", 0, ["to-number", ["get", "value"], 0]]);
    expect(
      mapBubbleLayer({ id: "b", source: "s", sourceLayer: "l", size, color: "red", opacity: 1 }),
    ).toMatchObject({ "source-layer": "l", paint: { "circle-color": "red", "circle-opacity": 1 } });
    expect(mapBubbleLayer({ id: "b", source: "s", size }).paint["circle-color"]).toBe(
      "var(--ok-palette-primary-main)",
    );
  });
});
