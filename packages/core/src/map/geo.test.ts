import { describe, expect, it } from "vitest";
import { distanceMeters } from "./helpers.js";
import { greatCircle } from "./index.js";

type Line = [number, number][];

const linesOf = (feature: ReturnType<typeof greatCircle>): Line[] =>
  feature.geometry.type === "LineString"
    ? [feature.geometry.coordinates]
    : feature.geometry.coordinates;

const lengthOf = (lines: Line[]) =>
  lines
    .flatMap((line) =>
      line.slice(1).map((point, i) => distanceMeters(line[i] as [number, number], point)),
    )
    .reduce((sum, part) => sum + part, 0);

describe("greatCircle", () => {
  it("runs from one position to the other through the requested steps", () => {
    const arc = greatCircle([-0.45, 51.47], [-73.78, 40.64], { steps: 8 });
    expect(arc.type).toBe("Feature");
    expect(arc.geometry.type).toBe("LineString");
    const [line] = linesOf(arc);
    expect(line).toHaveLength(9);
    expect(line?.[0]).toEqual([-0.45, 51.47]);
    expect(line?.at(-1)).toEqual([-73.78, 40.64]);
  });

  it("follows the geodesic: it bows toward the pole and matches the true distance", () => {
    const from: [number, number] = [-0.45, 51.47];
    const to: [number, number] = [-73.78, 40.64];
    const lines = linesOf(greatCircle(from, to));
    const latitudes = (lines[0] as Line).map((point) => point[1]);
    // London to New York passes well north of both cities, over the Atlantic.
    expect(Math.max(...latitudes)).toBeGreaterThan(52);
    expect(lengthOf(lines) / distanceMeters(from, to)).toBeCloseTo(1, 3);
  });

  it("splits an arc that crosses the antimeridian at ±180°", () => {
    const arc = greatCircle([139.78, 35.55], [-122.38, 37.62]);
    expect(arc.geometry.type).toBe("MultiLineString");
    const [west, east] = linesOf(arc) as [Line, Line];
    expect(west.at(-1)?.[0]).toBe(180);
    expect(east[0]?.[0]).toBe(-180);
    expect(west.at(-1)?.[1]).toBe(east[0]?.[1]);
    // No part jumps across the map.
    for (const line of [west, east])
      for (const [i, point] of line.entries())
        if (i) expect(Math.abs(point[0] - (line[i - 1] as [number, number])[0])).toBeLessThan(180);
  });

  it("splits going west too", () => {
    const [first, second] = linesOf(greatCircle([-170, 10], [170, 12])) as [Line, Line];
    expect(first.at(-1)?.[0]).toBe(-180);
    expect(second[0]?.[0]).toBe(180);
  });

  it("starts on the antimeridian without an empty part", () => {
    const arc = greatCircle([180, 0], [-170, 0], { steps: 4 });
    expect(linesOf(arc).every((line) => line.length > 1)).toBe(true);
  });

  it("returns valid GeoJSON for equal positions and carries the properties", () => {
    const arc = greatCircle([10, 20], [10, 20], { properties: { name: "Here" } });
    expect(arc.properties).toEqual({ name: "Here" });
    expect(arc.geometry.type).toBe("LineString");
    expect(linesOf(arc)[0]?.length).toBeGreaterThanOrEqual(2);
  });

  it("draws one of the great circles between opposite points", () => {
    for (const [from, to] of [
      [
        [0, 0],
        [180, 0],
      ],
      [
        [0, 90],
        [0, -90],
      ],
      [
        [90, 0],
        [-90, 0],
      ],
    ] as [[number, number], [number, number]][]) {
      const lines = linesOf(greatCircle(from, to));
      expect(lines.flat().every(([x, y]) => Number.isFinite(x) && Number.isFinite(y))).toBe(true);
      // Half way round the world.
      expect(lengthOf(lines) / 1000).toBeCloseTo(20015, -2);
    }
  });

  it("clamps steps and refuses impossible coordinates", () => {
    expect(linesOf(greatCircle([0, 0], [10, 0], { steps: 0 }))[0]).toHaveLength(2);
    expect(linesOf(greatCircle([0, 0], [10, 0], { steps: 1e6 }))[0]).toHaveLength(1025);
    expect(linesOf(greatCircle([0, 0], [10, 0], { steps: Number.NaN }))[0]).toHaveLength(65);
    expect(() => greatCircle([Number.NaN, 0], [0, 0])).toThrow(RangeError);
    expect(() => greatCircle([0, 91], [0, 0])).toThrow(RangeError);
    expect(() => greatCircle([0, 0], [0, -91])).toThrow(RangeError);
  });
});
