/*
 * Hexbins of the Map (spec: specs/components/map.md › Hexbin, roadmap 4.18.95, after ApexMaps'
 * hexbin series): points binned into a lattice of pointy-top hexagons in the Web Mercator plane
 * (so the cells look regular on the map), one GeoJSON polygon per non-empty cell with the count or
 * the mean of a value. Classify the cells' `value` with `mapScale(values, { input: ["get", "value"] })`.
 * Pure: no DOM, no MapLibre import.
 */
import { mercatorLatitude, mercatorY } from "./lattice.js";

export const mapHexbinAggregates = ["count", "mean"] as const;
export type MapHexbinAggregate = (typeof mapHexbinAggregates)[number];

/** A point: `[longitude, latitude]`, `[longitude, latitude, value]` or a GeoJSON `Point` feature. */
export type MapHexbinPoint =
  | readonly [number, number]
  | readonly [number, number, number | null | undefined]
  | {
      readonly type?: string | undefined;
      readonly geometry?: { readonly type: string; readonly coordinates: unknown } | null;
      readonly properties?: Readonly<Record<string, unknown>> | null | undefined;
    };

export interface MapHexbinOptions {
  /** The hexagons' radius (center to corner) in degrees of longitude. Default 1. */
  readonly radius?: number | undefined;
  /** `count` (default: points per cell) or `mean` (the mean of each cell's values). */
  readonly aggregate?: MapHexbinAggregate | undefined;
  /** Features: the property that holds a point's value. Default `value`. */
  readonly valueProperty?: string | undefined;
  /** `mean`: cells with fewer points get no value (`null`), so thin cells don't dominate. Default 1. */
  readonly minCount?: number | undefined;
}

export interface MapHexbinFeature {
  readonly type: "Feature";
  /** The cell's index in the collection (feature state needs numeric ids). */
  readonly id: number;
  readonly properties: {
    /** Points in the cell. */
    readonly count: number;
    /** The count, or the mean (`null` under `minCount` or without values). */
    readonly value: number | null;
    /** The cell's center. */
    readonly longitude: number;
    readonly latitude: number;
  };
  readonly geometry: { readonly type: "Polygon"; readonly coordinates: number[][][] };
}

export interface MapHexbinCollection {
  readonly type: "FeatureCollection";
  readonly features: MapHexbinFeature[];
}

const MAX_POINTS = 500_000;
const SQRT3 = Math.sqrt(3);
const round6 = (value: number) => Math.round(value * 1e6) / 1e6;

function read(
  point: MapHexbinPoint,
  property: string,
): { lng: number; lat: number; value: number | null } | null {
  let lng: number;
  let lat: number;
  let value: unknown;
  if (Array.isArray(point)) {
    [lng, lat, value] = point as [number, number, unknown];
  } else {
    const feature = point as Exclude<MapHexbinPoint, readonly unknown[]>;
    if (feature.geometry?.type !== "Point") return null;
    const coordinates = feature.geometry.coordinates as unknown[];
    if (!Array.isArray(coordinates)) return null;
    lng = Number(coordinates[0]);
    lat = Number(coordinates[1]);
    value = feature.properties?.[property];
  }
  if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lat) > 85.05113) return null;
  const number = typeof value === "number" ? value : Number.NaN;
  return { lng, lat, value: Number.isFinite(number) ? number : null };
}

/** The axial cell (q, r) of a plane point (cube rounding). */
function cellOf(x: number, y: number, radius: number): [number, number] {
  const fq = ((SQRT3 / 3) * x - y / 3) / radius;
  const fr = ((2 / 3) * y) / radius;
  const fs = -fq - fr;
  let q = Math.round(fq);
  let r = Math.round(fr);
  const s = Math.round(fs);
  const dq = Math.abs(q - fq);
  const dr = Math.abs(r - fr);
  const ds = Math.abs(s - fs);
  if (dq > dr && dq > ds) q = -r - s;
  else if (dr > ds) r = -q - s;
  return [q, r];
}

/**
 * Bins points into hexagons: one polygon per cell that holds points, with its `count`, its `value`
 * (the count, or the mean of the points' values) and its center. Cells are ordered north to south,
 * then west to east. Deterministic.
 */
export function mapHexbin(
  points:
    | readonly MapHexbinPoint[]
    | { readonly type: "FeatureCollection"; readonly features: readonly MapHexbinPoint[] },
  options: MapHexbinOptions = {},
): MapHexbinCollection {
  const list = Array.isArray(points)
    ? (points as readonly MapHexbinPoint[])
    : ((points as { features?: readonly MapHexbinPoint[] }).features ?? []);
  const radius =
    typeof options.radius === "number" && options.radius > 0 && Number.isFinite(options.radius)
      ? options.radius
      : 1;
  const mean = options.aggregate === "mean";
  const property = options.valueProperty ?? "value";
  const minCount = Math.max(1, Math.floor(options.minCount ?? 1));
  const cells = new Map<string, { q: number; r: number; count: number; sum: number; n: number }>();
  for (const point of list.slice(0, MAX_POINTS)) {
    const position = read(point, property);
    if (!position) continue;
    const [q, r] = cellOf(position.lng, mercatorY(position.lat), radius);
    const key = `${q},${r}`;
    const cell = cells.get(key) ?? { q, r, count: 0, sum: 0, n: 0 };
    cell.count++;
    if (position.value !== null) {
      cell.sum += position.value;
      cell.n++;
    }
    cells.set(key, cell);
  }
  const sorted = [...cells.values()].sort((a, b) => b.r - a.r || a.q - b.q);
  const features = sorted.map((cell, index): MapHexbinFeature => {
    const cx = radius * SQRT3 * (cell.q + cell.r / 2);
    const cy = radius * 1.5 * cell.r;
    const ring = Array.from({ length: 7 }, (_, i) => {
      const angle = ((60 * (i % 6) - 30) * Math.PI) / 180;
      return [
        round6(cx + radius * Math.cos(angle)),
        round6(mercatorLatitude(cy + radius * Math.sin(angle))),
      ];
    });
    const value = mean ? (cell.n >= minCount && cell.n > 0 ? cell.sum / cell.n : null) : cell.count;
    return {
      type: "Feature",
      id: index,
      properties: {
        count: cell.count,
        value: value === null ? null : round6(value),
        longitude: round6(cx),
        latitude: round6(mercatorLatitude(cy)),
      },
      geometry: { type: "Polygon", coordinates: [ring] },
    };
  });
  return { type: "FeatureCollection", features };
}
