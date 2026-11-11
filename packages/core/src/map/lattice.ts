/*
 * Pixel maps (spec: specs/components/map.md › Pixel maps, chart.md › Geo charts, roadmap 4.18.96,
 * after ApexMaps' pixel series): a choropleth drawn as a lattice of dots, squares or hexagons. The
 * lattice is anchored at the plane's origin, so neighboring regions share one grid; a lattice
 * point belongs to the region that contains it (even-odd over the region's rings). Shared by the
 * Map (`mapPixelGrid`, lng / lat in the Web Mercator plane) and the Chart's `geoLayout="pixel"`
 * (SVG px). Pure: no DOM, no MapLibre import.
 */

export const mapPixelShapes = ["circle", "square", "hexagon"] as const;
export type MapPixelShape = (typeof mapPixelShapes)[number];

type Point = readonly [number, number];
type Ring = readonly Point[];

const SQRT3 = Math.sqrt(3);
const DEGREES = 180 / Math.PI;
const MAX_POINTS = 200_000;

/** Web Mercator y of a latitude, in degrees (x is the longitude). */
export const mercatorY = (latitude: number) =>
  DEGREES *
  Math.log(
    Math.tan(Math.PI / 4 + Math.max(-85.05113, Math.min(85.05113, latitude)) / (2 * DEGREES)),
  );

/** The latitude of a Web Mercator y in degrees. */
export const mercatorLatitude = (y: number) =>
  DEGREES * (2 * Math.atan(Math.exp(y / DEGREES)) - Math.PI / 2);

/** Even-odd point in rings (holes are rings too). */
export function inRings(rings: readonly Ring[], x: number, y: number): boolean {
  let inside = false;
  for (const ring of rings)
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i] as Point;
      const [xj, yj] = ring[j] as Point;
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
  return inside;
}

/**
 * The lattice points inside rings: a square grid (`circle`, `square`) or rows half a step apart
 * (`hexagon`, rows `spacing × √3 / 2` apart), anchored at the origin. At most `limit` points.
 */
export function latticePoints(
  rings: readonly Ring[],
  spacing: number,
  shape: MapPixelShape,
  limit = MAX_POINTS,
): [number, number][] {
  if (!(spacing > 0) || rings.length === 0) return [];
  let left = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let bottom = Number.POSITIVE_INFINITY;
  let top = Number.NEGATIVE_INFINITY;
  for (const ring of rings)
    for (const [x, y] of ring) {
      left = Math.min(left, x);
      right = Math.max(right, x);
      bottom = Math.min(bottom, y);
      top = Math.max(top, y);
    }
  const hex = shape === "hexagon";
  const rowStep = hex ? (spacing * SQRT3) / 2 : spacing;
  const points: [number, number][] = [];
  for (let row = Math.ceil(bottom / rowStep); row * rowStep <= top; row++) {
    const y = row * rowStep;
    const shift = hex && Math.abs(row) % 2 === 1 ? spacing / 2 : 0;
    for (let col = Math.ceil((left - shift) / spacing); col * spacing + shift <= right; col++) {
      const x = col * spacing + shift;
      if (!inRings(rings, x, y)) continue;
      points.push([x, y]);
      if (points.length >= limit) return points;
    }
  }
  return points;
}

/** The outline of one lattice cell of `size` (its width) at (x, y): a 16-gon, a square or a pointy-top hexagon. */
export function latticeShape(shape: MapPixelShape, x: number, y: number, size: number): Point[] {
  const r = size / 2;
  if (shape === "square")
    return [
      [x - r, y - r],
      [x + r, y - r],
      [x + r, y + r],
      [x - r, y + r],
    ];
  const sides = shape === "hexagon" ? 6 : 16;
  // Hexagons: the width across flats is `size`, so neighbors in a row touch at 100%.
  const radius = shape === "hexagon" ? size / SQRT3 : r;
  return Array.from({ length: sides }, (_, i) => {
    const angle = shape === "hexagon" ? ((60 * i - 30) * Math.PI) / 180 : (i * 2 * Math.PI) / sides;
    return [x + radius * Math.cos(angle), y + radius * Math.sin(angle)] as Point;
  });
}

/** A GeoJSON feature with `Polygon` / `MultiPolygon` geometry (others are skipped). */
export interface MapPixelSourceFeature {
  readonly type?: string | undefined;
  readonly id?: string | number | undefined;
  readonly properties?: Readonly<Record<string, unknown>> | null | undefined;
  readonly geometry?: { readonly type: string; readonly coordinates: unknown } | null;
}

export interface MapPixelGridOptions {
  /** `circle` (default), `square` or `hexagon`. */
  readonly shape?: MapPixelShape | undefined;
  /** Distance between lattice points in degrees of longitude (Web Mercator plane). Default 1. */
  readonly spacing?: number | undefined;
  /** Each cell's width as a share of `spacing` (0.1 to 1). Default 0.8. */
  readonly size?: number | undefined;
  /** The feature property with the region's id. Default: the feature's `id`, then its `id` or `name` property. */
  readonly joinBy?: string | undefined;
  /** The property of each cell that holds its region's id (the source's `promoteId`). Default `region`. */
  readonly property?: string | undefined;
}

/** The rings of a polygon or multipolygon geometry, `[x, y]` numbers only. */
export function geometryRings(geometry: MapPixelSourceFeature["geometry"]): Point[][] {
  if (!geometry) return [];
  const polygons: unknown =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.type === "MultiPolygon"
        ? geometry.coordinates
        : [];
  if (!Array.isArray(polygons)) return [];
  const rings: Point[][] = [];
  for (const polygon of polygons as unknown[][][][]) {
    if (!Array.isArray(polygon)) continue;
    for (const ring of polygon) {
      if (!Array.isArray(ring)) continue;
      const line: Point[] = [];
      for (const position of ring) {
        const x = Number(position?.[0]);
        const y = Number(position?.[1]);
        if (Number.isFinite(x) && Number.isFinite(y)) line.push([x, y]);
      }
      if (line.length >= 3) rings.push(line);
    }
  }
  return rings;
}

const round6 = (value: number) => Math.round(value * 1e6) / 1e6;

/**
 * A pixel map's cells: one polygon per lattice point inside each region, carrying the region's id
 * in `property`. Give the source `promoteId: "<property>"`: every cell of a region then shares its
 * feature state, so `MapRegions`, `mapScale` and `mapRegionLayers` color and select them like the
 * region itself.
 */
export function mapPixelGrid(
  geometry:
    | { readonly type?: string; readonly features: readonly MapPixelSourceFeature[] }
    | readonly MapPixelSourceFeature[],
  options: MapPixelGridOptions = {},
): {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    properties: Record<string, string>;
    geometry: { type: "Polygon"; coordinates: number[][][] };
  }[];
} {
  const shape = mapPixelShapes.includes(options.shape as MapPixelShape)
    ? (options.shape as MapPixelShape)
    : "circle";
  const spacing =
    typeof options.spacing === "number" && options.spacing > 0 && Number.isFinite(options.spacing)
      ? options.spacing
      : 1;
  const share = Math.max(0.1, Math.min(1, Number(options.size ?? 0.8) || 0.8));
  const property = options.property ?? "region";
  const list = Array.isArray(geometry)
    ? (geometry as readonly MapPixelSourceFeature[])
    : ((geometry as { features?: readonly MapPixelSourceFeature[] }).features ?? []);
  const features: ReturnType<typeof mapPixelGrid>["features"] = [];
  let budget = MAX_POINTS;
  for (const feature of list) {
    const properties = feature.properties ?? {};
    const raw = options.joinBy
      ? properties[options.joinBy]
      : (feature.id ?? properties["id"] ?? properties["name"]);
    if (raw === undefined || raw === null) continue;
    const rings = geometryRings(feature.geometry).map((ring) =>
      ring.map(([lng, lat]) => [lng, mercatorY(lat)] as Point),
    );
    const points = latticePoints(rings, spacing, shape, budget);
    budget -= points.length;
    for (const [x, y] of points) {
      const outline = latticeShape(shape, x, y, spacing * share).map(([px, py]) => [
        round6(px),
        round6(mercatorLatitude(py)),
      ]);
      outline.push(outline[0] as number[]);
      features.push({
        type: "Feature",
        properties: { [property]: String(raw) },
        geometry: { type: "Polygon", coordinates: [outline] },
      });
    }
    if (budget <= 0) break;
  }
  return { type: "FeatureCollection", features };
}
