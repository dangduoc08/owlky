import { describe, expect, it } from "vitest";
import { mapLegendAttributes } from "../anatomy/anatomy.js";
import {
  jenksBreaks,
  mapPaletteColors,
  mapRegionLayers,
  mapScale,
  mapScaleLabel,
} from "./choropleth.js";

/** Sum of squared deviations from the class means for the given `step` breaks. */
const cost = (sorted: number[], breaks: number[]) => {
  const groups: number[][] = breaks.map(() => []);
  groups.push([]);
  for (const v of sorted) {
    let i = 0;
    while (i < breaks.length && v >= (breaks[i] as number)) i++;
    (groups[i] as number[]).push(v);
  }
  return groups.reduce((total, g) => {
    const mean = g.reduce((a, b) => a + b, 0) / (g.length || 1);
    return total + g.reduce((a, b) => a + (b - mean) ** 2, 0);
  }, 0);
};

/** The best breaks by trying every split (small inputs only). */
const bruteForce = (sorted: number[], classes: number) => {
  let best = Number.POSITIVE_INFINITY;
  const walk = (from: number, left: number, picked: number[]) => {
    if (left === 0) {
      best = Math.min(
        best,
        cost(
          sorted,
          picked.map((i) => sorted[i] as number),
        ),
      );
      return;
    }
    for (let i = from; i <= sorted.length - left; i++) walk(i + 1, left - 1, [...picked, i]);
  };
  walk(1, classes - 1, []);
  return best;
};

describe("jenksBreaks", () => {
  it("finds the natural gaps", () => {
    expect(jenksBreaks([1, 2, 3, 10, 11, 12, 30, 31, 32], 3)).toEqual([10, 30]);
    expect(jenksBreaks([5, 1, 3, 2, 50, 52], 2)).toEqual([50]);
  });

  it("matches an exhaustive search", () => {
    const data = [4, 7, 9, 13, 14, 22, 25, 26, 40, 41, 43, 60, 71, 73, 90];
    for (const classes of [2, 3, 4, 5]) {
      const breaks = jenksBreaks(data, classes);
      expect(breaks).toHaveLength(classes - 1);
      expect(cost(data, breaks)).toBeCloseTo(bruteForce(data, classes), 9);
    }
  });

  it("handles few distinct values and empty input", () => {
    expect(jenksBreaks([], 4)).toEqual([]);
    expect(jenksBreaks([3, 3, 3], 3)).toEqual([]);
    expect(jenksBreaks([1, 1, 2, 2], 5)).toEqual([2]);
    expect(jenksBreaks([1, Number.NaN, 2], 2)).toEqual([2]);
  });
});

describe("mapScale", () => {
  const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  it("quantile by default: five classes of the primary palette", () => {
    const scale = mapScale(values);
    expect(scale.method).toBe("quantile");
    expect(scale.breaks).toEqual([2.8, 4.6, 6.4, 8.2]);
    expect(scale.colors).toEqual(mapPaletteColors("primary"));
    expect(scale.classes.map((c) => c.count)).toEqual([2, 2, 2, 2, 2]);
    expect(scale.classes[0]).toMatchObject({ index: 0, min: 1, max: 2.8 });
    expect(scale.classes[4]).toMatchObject({ min: 8.2, max: 10 });
    expect(scale.min).toBe(1);
    expect(scale.max).toBe(10);
  });

  it("equal interval, jenks (and ApexMaps aliases) and thresholds", () => {
    expect(mapScale(values, { method: "equalInterval", classes: 3 }).breaks).toEqual([4, 7]);
    expect(mapScale(values, { method: "quantize", classes: 3 }).method).toBe("equalInterval");
    const jenks = mapScale([1, 2, 3, 10, 11, 12, 30, 31, 32], { method: "jenks", classes: 3 });
    expect(jenks.breaks).toEqual([10, 30]);
    expect(mapScale(values, { method: "naturalBreaks", classes: 2 }).method).toBe("jenks");
    const threshold = mapScale(values, { method: "threshold", thresholds: [8, 3] });
    expect(threshold.breaks).toEqual([3, 8]);
    expect(threshold.classes.map((c) => c.count)).toEqual([2, 5, 3]);
    // Three classes from the five shades: lightest, middle and darkest.
    expect(threshold.colors).toEqual([
      "var(--ok-palette-primary-lighter)",
      "var(--ok-palette-primary-main)",
      "var(--ok-palette-primary-darker)",
    ]);
    // An unknown method falls back to quantile.
    expect(mapScale(values, { method: "nope" as "jenks" }).method).toBe("quantile");
  });

  it("palettes: named, grey, custom colors; classes capped by the palette", () => {
    expect(mapScale(values, { palette: "error", classes: 2 }).colors).toEqual([
      "var(--ok-palette-error-lighter)",
      "var(--ok-palette-error-darker)",
    ]);
    expect(mapScale(values, { palette: "grey", classes: 7 }).colors).toHaveLength(7);
    expect(mapScale(values, { classes: 9 }).colors).toHaveLength(5);
    expect(mapScale(values, { palette: ["#fee5d9", "#fb6a4a", "#cb181d"] }).colors).toEqual([
      "#fee5d9",
      "#fb6a4a",
      "#cb181d",
    ]);
    expect(mapScale(values, { palette: [] }).colors).toHaveLength(5);
    expect(mapScale(values, { palette: "nope" as "info" }).colors[0]).toBe(
      "var(--ok-palette-primary-lighter)",
    );
  });

  it("missing values, one value, duplicated breaks", () => {
    const scale = mapScale([null, 4, undefined, Number.NaN, 4]);
    expect(scale.nullCount).toBe(3);
    expect(scale.breaks).toEqual([]);
    expect(scale.classes).toHaveLength(1);
    expect(scale.colors).toEqual(["var(--ok-palette-primary-main)"]);
    expect(scale.expression).toEqual([
      "case",
      ["==", ["typeof", ["feature-state", "value"]], "number"],
      "var(--ok-palette-primary-main)",
      "var(--ok-text-disabled)",
    ]);
    expect(mapScale([1, 1, 1, 1, 9]).breaks).toEqual([1, 2.6]);
    expect(mapScale([]).classes).toHaveLength(1);
  });

  it("classOf and the MapLibre expressions", () => {
    const scale = mapScale(values, {
      method: "threshold",
      thresholds: [3, 8],
      palette: ["a", "b", "c"],
      nullColor: "grey",
      input: ["get", "pop"],
    });
    expect([scale.classOf(1), scale.classOf(3), scale.classOf(10), scale.classOf(null)]).toEqual([
      0, 1, 2, -1,
    ]);
    expect(scale.expression).toEqual([
      "case",
      ["==", ["typeof", ["get", "pop"]], "number"],
      ["step", ["get", "pop"], "a", 3, "b", 8, "c"],
      "grey",
    ]);
    expect(scale.gradient).toEqual([
      "case",
      ["==", ["typeof", ["get", "pop"]], "number"],
      ["interpolate", ["linear"], ["get", "pop"], 1, "a", 5.5, "b", 10, "c"],
      "grey",
    ]);
  });
});

describe("mapScaleLabel and mapRegionLayers", () => {
  it("formats class ranges", () => {
    expect(mapScaleLabel({ min: 1, max: 2.5 })).toBe("1 – 2.5");
    expect(mapScaleLabel({ min: 1234.567, max: 1234.567 })).toBe("1,234.57");
    expect(mapScaleLabel({ min: 1, max: 2 }, (v) => `${v}%`)).toBe("1% – 2%");
  });

  it("builds a fill and an outline layer on the feature states", () => {
    const scale = mapScale([1, 2, 3]);
    const [fill, outline] = mapRegionLayers({ id: "states", source: "src", scale });
    expect(fill).toMatchObject({ id: "states", type: "fill", source: "src" });
    expect(fill.paint["fill-color"]).toBe(scale.expression);
    expect(JSON.stringify(fill.paint["fill-opacity"])).toContain('"muted"');
    expect(outline).toMatchObject({ id: "states-outline", type: "line" });
    expect("source-layer" in outline).toBe(false);
    const [gradient] = mapRegionLayers({
      id: "g",
      source: "src",
      sourceLayer: "regions",
      scale,
      variant: "gradient",
      opacity: 1,
      mutedOpacity: 0.3,
    });
    expect(gradient["source-layer"]).toBe("regions");
    expect(gradient.paint["fill-color"]).toBe(scale.gradient);
    expect(gradient.paint["fill-opacity"]).toEqual([
      "case",
      ["boolean", ["feature-state", "muted"], false],
      0.3,
      [
        "any",
        ["boolean", ["feature-state", "hover"], false],
        ["boolean", ["feature-state", "focus"], false],
        ["boolean", ["feature-state", "selected"], false],
      ],
      1,
      1,
    ]);
  });
});

describe("mapLegendAttributes", () => {
  it("writes the variant, and interactive only when turned off", () => {
    expect(mapLegendAttributes()).toEqual({
      "data-ok-map-legend": "",
      "data-ok-variant": "classes",
    });
    expect(mapLegendAttributes({ variant: "gradient", interactive: false })).toEqual({
      "data-ok-map-legend": "",
      "data-ok-variant": "gradient",
      "data-ok-interactive": "false",
    });
  });
});
