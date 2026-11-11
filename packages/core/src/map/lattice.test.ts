import { describe, expect, it } from "vitest";
import {
  geometryRings,
  inRings,
  latticePoints,
  latticeShape,
  mapPixelGrid,
  mercatorLatitude,
  mercatorY,
} from "./lattice.js";

const square = (x: number, y: number, side: number) => [
  [
    [x, y],
    [x + side, y],
    [x + side, y + side],
    [x, y + side],
    [x, y],
  ],
];

describe("lattice", () => {
  it("converts latitudes to the Mercator plane and back", () => {
    expect(mercatorY(0)).toBeCloseTo(0, 12);
    expect(mercatorLatitude(mercatorY(45))).toBeCloseTo(45, 9);
    expect(mercatorY(90)).toBeCloseTo(mercatorY(85.05113), 9);
  });

  it("places lattice points inside rings, anchored at the origin", () => {
    const rings = [
      (square(0, 0, 10)[0] ?? []).map(([x, y]) => [x as number, y as number] as const),
    ];
    const points = latticePoints(rings, 5, "circle");
    // Multiples of the spacing only; points on the lower edges count as inside (even-odd).
    expect(points).toEqual([
      [0, 0],
      [5, 0],
      [0, 5],
      [5, 5],
    ]);
    expect(points.every(([x, y]) => inRings(rings, x, y))).toBe(true);
    // Hexagon rows sit √3 / 2 apart; odd rows shift by half a step.
    const hex = latticePoints(rings, 4, "hexagon");
    const rows = [...new Set(hex.map(([, y]) => Math.round(y * 1000) / 1000))];
    expect((rows[1] ?? 0) - (rows[0] ?? 0)).toBeCloseTo(2 * Math.sqrt(3), 3);
    const odd = hex.filter(([, y]) => Math.abs(Math.round(y / (2 * Math.sqrt(3)))) % 2 === 1);
    expect(odd.every(([x]) => Math.abs((x % 4) - 2) < 1e-9)).toBe(true);
    expect(latticePoints(rings, 0, "square")).toEqual([]);
    expect(latticePoints([], 1, "square")).toEqual([]);
    expect(latticePoints(rings, 1, "square", 3)).toHaveLength(3);
  });

  it("draws circles, squares and hexagons of the given width", () => {
    expect(latticeShape("square", 0, 0, 2)).toEqual([
      [-1, -1],
      [1, -1],
      [1, 1],
      [-1, 1],
    ]);
    expect(latticeShape("circle", 0, 0, 2)).toHaveLength(16);
    const hex = latticeShape("hexagon", 0, 0, Math.sqrt(3));
    expect(hex).toHaveLength(6);
    expect(Math.max(...hex.map(([x]) => x))).toBeCloseTo(Math.sqrt(3) / 2, 9);
  });

  it("reads polygon and multipolygon rings, skipping the rest", () => {
    expect(geometryRings({ type: "Polygon", coordinates: square(0, 0, 1) })).toHaveLength(1);
    expect(
      geometryRings({
        type: "MultiPolygon",
        coordinates: [square(0, 0, 1), square(5, 5, 1), "x", [["bad"]]],
      }),
    ).toHaveLength(2);
    expect(geometryRings({ type: "Point", coordinates: [0, 0] })).toEqual([]);
    expect(geometryRings(null)).toEqual([]);
    expect(geometryRings({ type: "Polygon", coordinates: 3 })).toEqual([]);
  });
});

describe("mapPixelGrid", () => {
  it("returns one cell per lattice point, tagged with its region", () => {
    const grid = mapPixelGrid(
      {
        type: "FeatureCollection",
        features: [
          {
            properties: { name: "A" },
            geometry: { type: "Polygon", coordinates: square(0, 0, 4) },
          },
          { id: 7, properties: {}, geometry: { type: "Polygon", coordinates: square(10, 0, 2) } },
          { properties: {}, geometry: { type: "Polygon", coordinates: square(20, 0, 2) } },
        ],
      },
      { spacing: 1, shape: "square", size: 0.5 },
    );
    const regions = grid.features.map((feature) => feature.properties["region"]);
    expect(new Set(regions)).toEqual(new Set(["A", "7"]));
    expect(regions.filter((region) => region === "A").length).toBeGreaterThanOrEqual(9);
    const ring = grid.features[0]?.geometry.coordinates[0] as number[][];
    expect(ring).toHaveLength(5);
    expect(ring[0]).toEqual(ring[4]);
    expect((ring[1]?.[0] as number) - (ring[0]?.[0] as number)).toBeCloseTo(0.5, 6);
  });

  it("joins by a property and names the cell property", () => {
    const grid = mapPixelGrid(
      [{ properties: { code: "X" }, geometry: { type: "Polygon", coordinates: square(0, 0, 3) } }],
      { joinBy: "code", property: "state", shape: "hexagon", spacing: 1, size: 5 },
    );
    expect(grid.features.length).toBeGreaterThan(3);
    expect(grid.features.every((feature) => feature.properties["state"] === "X")).toBe(true);
    // Sizes above 100% are clamped, invalid spacings fall back to 1.
    const fallback = mapPixelGrid(
      [{ properties: { name: "Y" }, geometry: { type: "Polygon", coordinates: square(0, 0, 3) } }],
      { spacing: Number.NaN, shape: "triangle" as never, size: Number.NaN },
    );
    expect(fallback.features[0]?.geometry.coordinates[0]).toHaveLength(17);
  });
});
