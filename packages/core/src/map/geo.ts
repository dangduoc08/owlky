/*
 * Geodesic helpers of the Map (spec: specs/components/map.md › Great circles, roadmap 4.18.16).
 * Pure: no DOM, no MapLibre import.
 */

/** A position: `[longitude, latitude]` in degrees. */
export type MapLngLat = readonly [longitude: number, latitude: number];

export interface GreatCircleOptions {
  /** Segments of the arc (1 to 1024). Default 64. */
  readonly steps?: number | undefined;
  /** Properties of the returned GeoJSON feature. */
  readonly properties?: Readonly<Record<string, unknown>> | undefined;
}

/** A GeoJSON feature: a line, or several when the arc crosses the antimeridian. */
export interface GreatCircleFeature {
  readonly type: "Feature";
  readonly properties: Record<string, unknown>;
  readonly geometry:
    | { readonly type: "LineString"; readonly coordinates: [number, number][] }
    | { readonly type: "MultiLineString"; readonly coordinates: [number, number][][] };
}

type Vector = readonly [number, number, number];

const RADIANS = Math.PI / 180;

const vectorOf = ([longitude, latitude]: MapLngLat): Vector => {
  const lng = longitude * RADIANS;
  const lat = latitude * RADIANS;
  return [Math.cos(lat) * Math.cos(lng), Math.cos(lat) * Math.sin(lng), Math.sin(lat)];
};

const dot = (a: Vector, b: Vector) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** Six decimals (about 0.1 m), so the output is stable and compact. */
const round = (value: number) => Math.round(value * 1e6) / 1e6 || 0;

const positionOf = (vector: Vector): [number, number] => [
  round(Math.atan2(vector[1], vector[0]) / RADIANS),
  round(Math.atan2(vector[2], Math.hypot(vector[0], vector[1])) / RADIANS),
];

/** The point at fraction `t` of the shorter arc from `a` to `b` (not opposite points). */
function slerp(a: Vector, b: Vector, t: number): Vector {
  const angle = Math.acos(Math.min(1, Math.max(-1, dot(a, b))));
  const sine = Math.sin(angle);
  if (sine < 1e-12) return a;
  const p = Math.sin((1 - t) * angle) / sine;
  const q = Math.sin(t * angle) / sine;
  return [p * a[0] + q * b[0], p * a[1] + q * b[1], p * a[2] + q * b[2]];
}

/** A unit vector at right angles to `a` (opposite points have no unique great circle). */
function perpendicular(a: Vector): Vector {
  // Crossed with the y axis, or the x axis when `a` lies along y.
  const [x, y] = Math.abs(a[1]) > 0.999 ? [1, 0] : [0, 1];
  const n: Vector = [-a[2] * y, a[2] * x, a[0] * y - a[1] * x];
  const length = Math.hypot(n[0], n[1], n[2]);
  return [n[0] / length, n[1] / length, n[2] / length];
}

/** Splits a line where it jumps across the antimeridian, ending and restarting at ±180°. */
function splitAtAntimeridian(points: readonly [number, number][]): [number, number][][] {
  const parts: [number, number][][] = [];
  let part: [number, number][] = [];
  const add = (point: [number, number]) => {
    const last = part.at(-1);
    if (!last || last[0] !== point[0] || last[1] !== point[1]) part.push(point);
  };
  for (const point of points) {
    const previous = part.at(-1);
    if (previous && Math.abs(point[0] - previous[0]) > 180) {
      const edge = previous[0] > 0 ? 180 : -180;
      // The longitude continued past the edge; the crossing is linear between two close samples.
      const unwrapped = point[0] + (edge > 0 ? 360 : -360);
      const t = (edge - previous[0]) / (unwrapped - previous[0]);
      const latitude = round(previous[1] + (point[1] - previous[1]) * t);
      add([edge, latitude]);
      parts.push(part);
      part = [[-edge, latitude]];
    }
    add(point);
  }
  parts.push(part);
  return parts.filter((line) => line.length > 1);
}

/**
 * The great circle arc (the shortest path on the globe) from one `[longitude, latitude]` to
 * another, as a GeoJSON feature. An arc that crosses the antimeridian becomes a `MultiLineString`
 * split at ±180°, so renderers don't draw a line across the whole map. Throws a `RangeError` on
 * coordinates that are not finite or a latitude outside −90 to 90.
 */
export function greatCircle(
  from: MapLngLat,
  to: MapLngLat,
  options: GreatCircleOptions = {},
): GreatCircleFeature {
  for (const [longitude, latitude] of [from, to])
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || Math.abs(latitude) > 90)
      throw new RangeError(`Invalid position: [${longitude}, ${latitude}].`);
  const requested = Math.floor(options.steps ?? 64);
  const steps = Number.isFinite(requested) ? Math.min(1024, Math.max(1, requested)) : 64;
  const a = vectorOf(from);
  const b = vectorOf(to);
  // Opposite points: any great circle is the shortest, so go through a point at right angles.
  const middle = dot(a, b) < -1 + 1e-12 ? perpendicular(a) : null;
  const at = (t: number): Vector => {
    if (!middle) return slerp(a, b, t);
    return t <= 0.5 ? slerp(a, middle, t * 2) : slerp(middle, b, t * 2 - 1);
  };
  const points = Array.from({ length: steps + 1 }, (_, i) => positionOf(at(i / steps)));
  const parts = splitAtAntimeridian(points);
  const properties = { ...options.properties };
  if (parts.length > 1)
    return {
      type: "Feature",
      properties,
      geometry: { type: "MultiLineString", coordinates: parts },
    };
  // One line. The same start and end: a line of two equal positions, still valid GeoJSON.
  return {
    type: "Feature",
    properties,
    geometry: { type: "LineString", coordinates: parts[0] ?? [positionOf(a), positionOf(b)] },
  };
}
