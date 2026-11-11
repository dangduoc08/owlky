import { describe, expect, it } from "vitest";
import { mapScale } from "./choropleth.js";
import { mapHexbin } from "./hexbin.js";
import { inRings, mercatorY } from "./lattice.js";

describe("mapHexbin", () => {
  it("counts points per hexagon and returns one closed polygon per cell", () => {
    const bins = mapHexbin(
      [
        [0, 0],
        [0.1, 0.1],
        [-0.1, 0.05],
        [10, 10],
      ],
      { radius: 1 },
    );
    expect(bins.type).toBe("FeatureCollection");
    expect(bins.features).toHaveLength(2);
    // North first.
    const [north, south] = bins.features;
    expect(north?.properties).toMatchObject({ count: 1, value: 1 });
    expect(south?.properties).toMatchObject({ count: 3, value: 3, longitude: 0, latitude: 0 });
    expect(bins.features.map((feature) => feature.id)).toEqual([0, 1]);
    const ring = south?.geometry.coordinates[0] as number[][];
    expect(ring).toHaveLength(7);
    expect(ring[0]).toEqual(ring[6]);
    // Every point lies in its own cell (checked in the Mercator plane).
    const plane = ring.map(([x, y]) => [x as number, mercatorY(y as number)] as const);
    expect(inRings([plane], 0.1, mercatorY(0.1))).toBe(true);
  });

  it("averages a value, leaving thin cells without one, and reads GeoJSON features", () => {
    const quake = (lng: number, mag: number | null) => ({
      type: "Feature",
      properties: { mag },
      geometry: { type: "Point", coordinates: [lng, 40] },
    });
    const bins = mapHexbin(
      {
        type: "FeatureCollection",
        features: [quake(0, 2), quake(0.2, 4), quake(20, 5), quake(20.1, null), quake(50, null)],
      },
      { radius: 2, aggregate: "mean", valueProperty: "mag", minCount: 2 },
    );
    const byLongitude = [...bins.features].sort(
      (a, b) => a.properties.longitude - b.properties.longitude,
    );
    expect(byLongitude.map((feature) => feature.properties.value)).toEqual([3, null, null]);
    expect(byLongitude.map((feature) => feature.properties.count)).toEqual([2, 2, 1]);
    const scale = mapScale(
      bins.features.map((feature) => feature.properties.value),
      { input: ["get", "value"] },
    );
    expect(scale.nullCount).toBe(2);
    expect(scale.expression[1]).toEqual(["==", ["typeof", ["get", "value"]], "number"]);
  });

  it("skips invalid points and falls back to a radius of 1", () => {
    const bins = mapHexbin(
      [
        [Number.NaN, 0],
        [0, 89],
        { geometry: { type: "LineString", coordinates: [] } },
        { geometry: { type: "Point", coordinates: "x" } },
        [0, 0, 5],
      ],
      { radius: -3 },
    );
    expect(bins.features).toHaveLength(1);
    const ring = bins.features[0]?.geometry.coordinates[0] as number[][];
    expect(Math.max(...ring.map(([x]) => x as number))).toBeCloseTo(Math.sqrt(3) / 2, 5);
    expect(mapHexbin([]).features).toEqual([]);
  });
});
