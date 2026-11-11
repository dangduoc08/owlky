/*
 * Geo charts (ADR-0059, roadmap 4.18.17): regions of GeoJSON geometry, or hex tiles, drawn as SVG
 * by the chart engine: no tile style, no WebGL, no MapLibre. Values are classified by the Map's
 * `mapScale`, whose module is pure. Layout mode `cell`: keyboard moves between region centers.
 */
import { type MapScaleClass, mapScale, mapScaleLabel } from "../map/choropleth.js";
import { latticePoints, latticeShape, type MapPixelShape, mapPixelShapes } from "../map/lattice.js";
import type { ChartFormat } from "./chart-format.js";
import {
  type ChartLayout,
  type ChartMark,
  type ChartNode,
  chartTextWidth,
  FONT,
  fmt,
  node,
  r2,
} from "./chart-layout.js";
import {
  type ChartColor,
  type ChartPart,
  type ChartTableCell,
  type ChartTableModel,
  chartColors,
  chartPartNames,
} from "./chart-model.js";
import { fitChartText } from "./chart-sankey.js";

export const chartProjections = ["equalEarth", "mercator", "equirectangular"] as const;
export type ChartProjection = (typeof chartProjections)[number];
export const chartGeoLayouts = ["geographic", "hex", "pixel"] as const;
export type ChartGeoLayout = (typeof chartGeoLayouts)[number];
/** Cells of a pixel map (4.18.96): the Map's lattice shapes. */
export const chartPixelShapes = mapPixelShapes;
export type ChartPixelShape = MapPixelShape;
/** `mapScale` methods, under the names ApexMaps uses too (`naturalBreaks`, `quantize`). */
export const chartScaleMethods = ["quantile", "equalInterval", "jenks", "threshold"] as const;
export type ChartScaleMethod = (typeof chartScaleMethods)[number];

/** One region's data. */
export interface ChartGeoRegion {
  /** Joins the region to its feature (`joinBy`) and to its hex cell. */
  readonly id: string;
  /** Shown in the tooltip and the table. Default: the id. */
  readonly name?: string | undefined;
  /** Short text of the hex cell (`dataLabels`). Default: the name. */
  readonly label?: string | undefined;
  /** The value that colors the region; `null`: no data. */
  readonly value?: number | string | null | undefined;
}

/** A hex cell in an odd-r offset grid (odd rows sit half a cell to the right). */
export interface ChartHexCell {
  readonly id: string;
  readonly col: number;
  readonly row: number;
}

/** A GeoJSON feature of a polygon or several; other geometries are ignored. */
export interface ChartGeoFeature {
  readonly type?: string | undefined;
  readonly id?: string | number | undefined;
  readonly properties?: Readonly<Record<string, unknown>> | null | undefined;
  readonly geometry?: {
    readonly type: string;
    readonly coordinates: unknown;
  } | null;
}

/** A `FeatureCollection`, one feature or a list of features. */
export type ChartGeometry =
  | { readonly type: "FeatureCollection"; readonly features: readonly ChartGeoFeature[] }
  | ChartGeoFeature
  | readonly ChartGeoFeature[];

export interface ChartGeoOptions {
  /** Geo charts: the regions' shapes (GeoJSON). HTML: `data-ok-geometry` or `setGeometry()`. */
  readonly geometry?: ChartGeometry | null | undefined;
  /** Geo charts: the regions' data, joined to the geometry by id. */
  readonly regions?: readonly ChartGeoRegion[] | undefined;
  /** Geo charts: the feature property holding the region id. Default: the feature's `id`, then its `id`, `iso_a2` or `name` property. */
  readonly joinBy?: string | undefined;
  /** Geo charts: `equalEarth` (default), `mercator` or `equirectangular`. */
  readonly projection?: ChartProjection | undefined;
  /** Geo charts: `geographic` shapes (default), `hex` tiles or a `pixel` lattice of dots. */
  readonly geoLayout?: ChartGeoLayout | undefined;
  /** Pixel layouts: `circle` (default), `square` or `hexagon` cells. */
  readonly pixelShape?: ChartPixelShape | undefined;
  /** Pixel layouts: px between lattice points (3 to 64). Default 8. */
  readonly pixelSpacing?: number | undefined;
  /** Pixel layouts: each cell's width in % of the spacing (10 to 100). Default 80. */
  readonly pixelSize?: number | undefined;
  /** Hex layouts: a cell per region; without them, cells are placed from the geometry. */
  readonly hexCells?: readonly ChartHexCell[] | undefined;
  /** Geo charts: how values are split into classes. Default `quantile`. */
  readonly scaleMethod?: ChartScaleMethod | undefined;
  /** Geo charts: how many classes (at most the colors available). Default 5. */
  readonly scaleClasses?: number | undefined;
  /** Geo charts, `threshold` method: the class breaks. */
  readonly scaleThresholds?: readonly number[] | undefined;
  /** Geo charts: the outline of the globe behind the regions (ApexMaps `geo.sphere`). */
  readonly sphere?: boolean | undefined;
  /** Geo charts: lines of longitude and latitude every 30° (ApexMaps `geo.graticule`). */
  readonly graticule?: boolean | undefined;
}

/** What a region needs for hits and highlights (in `ChartMark.geo`). */
export interface ChartGeoMark {
  /** The region's outline as a path. */
  readonly d: string;
  /** Rings in SVG px, for the even-odd hit test. */
  readonly rings: readonly (readonly (readonly [number, number])[])[];
  readonly title: string;
  readonly rows: readonly {
    readonly name: string;
    readonly value: string;
    readonly color: ChartColor;
  }[];
}

const MAX_REGIONS = 2000;
const MAX_PIXELS = 40_000;
const MAX_COORDINATES = 400_000;
const RADIANS = Math.PI / 180;
const PADDING = 8;

type Project = (longitude: number, latitude: number) => [number, number];
type Ring = [number, number][];

const A1 = 1.340264;
const A2 = -0.081106;
const A3 = 0.000893;
const A4 = 0.003796;
const M = Math.sqrt(3) / 2;
const clampLatitude = (latitude: number, limit: number) =>
  Math.max(-limit, Math.min(limit, latitude));

/** Projections (radians in, plane units out, y up). Equal Earth: Šavrič, Patterson, Jenny 2018. */
const PROJECTIONS: Record<ChartProjection, Project> = {
  equalEarth(longitude, latitude) {
    const lambda = longitude * RADIANS;
    const theta = Math.asin(M * Math.sin(latitude * RADIANS));
    const t2 = theta * theta;
    const t6 = t2 * t2 * t2;
    const x = (lambda * Math.cos(theta)) / (M * (A1 + 3 * A2 * t2 + t6 * (7 * A3 + 9 * A4 * t2)));
    const y = theta * (A1 + A2 * t2 + t6 * (A3 + A4 * t2));
    return [x, y];
  },
  mercator(longitude, latitude) {
    const phi = clampLatitude(latitude, 85.05113) * RADIANS;
    return [longitude * RADIANS, Math.log(Math.tan(Math.PI / 4 + phi / 2))];
  },
  equirectangular(longitude, latitude) {
    return [longitude * RADIANS, latitude * RADIANS];
  },
};

/** Forward projection of a `[longitude, latitude]`, in plane units (y up). Exported for tests. */
export const chartProject = (
  projection: ChartProjection,
  longitude: number,
  latitude: number,
): [number, number] => PROJECTIONS[projection](longitude, latitude);

/** The outer rings of a geometry: `[[lng, lat], …][]`, invalid numbers skipped. */
function ringsOf(geometry: ChartGeoFeature["geometry"]): Ring[] {
  if (!geometry) return [];
  const polygons: unknown =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.type === "MultiPolygon"
        ? geometry.coordinates
        : [];
  if (!Array.isArray(polygons)) return [];
  const rings: Ring[] = [];
  for (const polygon of polygons as unknown[][][][]) {
    if (!Array.isArray(polygon)) continue;
    for (const ring of polygon) {
      if (!Array.isArray(ring)) continue;
      const line: Ring = [];
      for (const position of ring) {
        const longitude = Number(position?.[0]);
        const latitude = Number(position?.[1]);
        if (Number.isFinite(longitude) && Number.isFinite(latitude))
          line.push([longitude, Math.max(-90, Math.min(90, latitude))]);
      }
      if (line.length >= 3) rings.push(line);
    }
  }
  return rings;
}

const featuresOf = (geometry: ChartGeometry | null | undefined): readonly ChartGeoFeature[] => {
  if (!geometry) return [];
  if (Array.isArray(geometry)) return geometry as readonly ChartGeoFeature[];
  const shaped = geometry as {
    type?: string;
    features?: readonly ChartGeoFeature[];
  };
  return shaped.type === "FeatureCollection" && Array.isArray(shaped.features)
    ? shaped.features
    : [geometry as ChartGeoFeature];
};

/** The id that joins a feature to a region. */
function featureKey(feature: ChartGeoFeature, joinBy: string | undefined): string | undefined {
  const properties = feature.properties ?? {};
  const raw = joinBy
    ? properties[joinBy]
    : (feature.id ?? properties["id"] ?? properties["iso_a2"] ?? properties["name"]);
  return raw === undefined || raw === null ? undefined : String(raw);
}

const finiteValue = (value: ChartGeoRegion["value"]): number | null => {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const pathOf = (rings: readonly Ring[]) =>
  rings.map((ring) => `M${ring.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join("L")}Z`).join("");

/** The cells of a pixel map inside fitted rings, as one path (circles as two arcs). */
function pixelPath(
  rings: readonly Ring[],
  spacing: number,
  shape: ChartPixelShape,
  width: number,
  limit: number,
): { d: string; count: number } {
  const points = latticePoints(rings, spacing, shape, limit);
  const r = width / 2;
  const d = points
    .map(([x, y]) =>
      shape === "circle"
        ? `M${fmt(x - r)} ${fmt(y)}a${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(width)} 0a${fmt(r)} ${fmt(r)} 0 1 0 ${fmt(-width)} 0Z`
        : `M${latticeShape(shape, x, y, width)
            .map(([px, py]) => `${fmt(px)} ${fmt(py)}`)
            .join("L")}Z`,
    )
    .join("");
  return { d, count: points.length };
}

/** Area of a ring (absolute value), for the label's anchor. */
const ringArea = (ring: readonly (readonly [number, number])[]) => {
  let sum = 0;
  for (let i = 0; i < ring.length; i++) {
    const [ax, ay] = ring[i] as readonly [number, number];
    const [bx, by] = ring[(i + 1) % ring.length] as readonly [number, number];
    sum += ax * by - bx * ay;
  }
  return Math.abs(sum) / 2;
};

/** Area-weighted centroid of the biggest ring. */
function centroid(rings: readonly Ring[]): [number, number] {
  let best = rings[0] as Ring;
  for (const ring of rings) if (ringArea(ring) > ringArea(best)) best = ring;
  let area = 0;
  let cx = 0;
  let cy = 0;
  for (let i = 0; i < best.length; i++) {
    const [ax, ay] = best[i] as [number, number];
    const [bx, by] = best[(i + 1) % best.length] as [number, number];
    const cross = ax * by - bx * ay;
    area += cross;
    cx += (ax + bx) * cross;
    cy += (ay + by) * cross;
  }
  if (Math.abs(area) < 1e-9) return best[0] as [number, number];
  return [cx / (3 * area), cy / (3 * area)];
}

/** Whether a point lies inside a region (even-odd over its rings; bounding box checked first). */
export function chartGeoContains(geo: ChartGeoMark, x: number, y: number): boolean {
  let inside = false;
  for (const ring of geo.rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i] as readonly [number, number];
      const [xj, yj] = ring[j] as readonly [number, number];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

const box = (rings: readonly Ring[]) => {
  let left = Number.POSITIVE_INFINITY;
  let right = Number.NEGATIVE_INFINITY;
  let top = Number.POSITIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;
  for (const ring of rings)
    for (const [x, y] of ring) {
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  return { left, right, top, bottom };
};

/** Fits plane rings into the plot, keeping their proportions; y flips to SVG's. */
function fitter(rings: readonly Ring[], width: number, height: number) {
  const { left, right, top, bottom } = box(rings);
  const w = right - left || 1;
  const h = bottom - top || 1;
  const scale = Math.min((width - PADDING * 2) / w, (height - PADDING * 2) / h);
  const dx = (width - w * scale) / 2 - left * scale;
  const dy = (height + h * scale) / 2 + top * scale;
  return ([x, y]: readonly [number, number]): [number, number] => [x * scale + dx, dy - y * scale];
}

/** The outline of the projected globe (for the sphere and the fit). */
function sphereRing(project: Project, projection: ChartProjection): Ring {
  const ring: Ring = [];
  const limit = projection === "mercator" ? 85.05113 : 90;
  for (let lat = -limit; lat <= limit; lat += 5) ring.push(project(180, Math.min(lat, limit)));
  ring.push(project(180, limit));
  for (let lat = limit; lat >= -limit; lat -= 5) ring.push(project(-180, Math.max(lat, -limit)));
  ring.push(project(-180, -limit));
  return ring;
}

function graticule(
  project: Project,
  projection: ChartProjection,
  fit: (p: readonly [number, number]) => [number, number],
): ChartNode {
  const limit = projection === "mercator" ? 80 : 90;
  const lines: string[] = [];
  const line = (points: Ring) =>
    lines.push(`M${points.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join("L")}`);
  for (let lng = -180; lng <= 180; lng += 30) {
    const points: Ring = [];
    for (let lat = -limit; lat <= limit; lat += 5) points.push(fit(project(lng, lat)));
    line(points);
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const points: Ring = [];
    for (let lng = -180; lng <= 180; lng += 5) points.push(fit(project(lng, lat)));
    line(points);
  }
  return node("path", { d: lines.join(""), "data-ok-chart-graticule": "" });
}

/** Hex cells from a table or a prop: ids and whole numbers only. */
const validCells = (cells: readonly ChartHexCell[]): ChartHexCell[] =>
  cells.filter(
    (cell) =>
      typeof cell?.id === "string" &&
      Number.isFinite(Number(cell.col)) &&
      Number.isFinite(Number(cell.row)),
  );

/**
 * Places each region on a hex grid as near as possible to its centroid: cells are filled from the
 * middle of the map outward. Deterministic.
 */
function autoHexCells(points: readonly { id: string; x: number; y: number }[]): ChartHexCell[] {
  if (points.length === 0) return [];
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const count = Math.ceil(points.length * 1.6);
  // Rows and columns keep the area's proportions (a hex row is 0.866 of a column's pitch).
  const rows =
    spanX > 0 ? Math.max(1, Math.round(Math.sqrt((count * spanY) / (spanX * 0.866)))) : count;
  const cols = Math.max(1, Math.ceil(count / rows));
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  // Normalized position of a cell (odd rows half a cell to the right).
  const position = (col: number, row: number) => [
    minX + ((col + (row % 2 ? 0.5 : 0)) / Math.max(1, cols - 1)) * spanX,
    maxY - (row / Math.max(1, rows - 1)) * spanY,
  ];
  const free = new Set<string>();
  for (let row = 0; row < rows; row++)
    for (let col = 0; col < cols; col++) free.add(`${col},${row}`);
  const sorted = [...points].sort(
    (a, b) =>
      (a.x - cx) ** 2 + (a.y - cy) ** 2 - ((b.x - cx) ** 2 + (b.y - cy) ** 2) ||
      a.id.localeCompare(b.id),
  );
  const cells: ChartHexCell[] = [];
  for (const point of sorted) {
    let best = "";
    let distance = Number.POSITIVE_INFINITY;
    for (const key of free) {
      const [col, row] = key.split(",").map(Number) as [number, number];
      const [x, y] = position(col, row) as [number, number];
      const d = (x - point.x) ** 2 + (y - point.y) ** 2;
      if (d < distance) {
        distance = d;
        best = key;
      }
    }
    if (!best) break;
    free.delete(best);
    const [col, row] = best.split(",").map(Number) as [number, number];
    cells.push({ id: point.id, col, row });
  }
  return cells;
}

/** The six corners of a pointy-top hexagon, flat rings in px. */
const hexRing = (cx: number, cy: number, r: number): Ring =>
  Array.from({ length: 6 }, (_, i) => {
    const angle = ((60 * i - 30) * Math.PI) / 180;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as [number, number];
  });

/** Everything a geo chart draws: shapes with their class, marks, labels, the legend, the table. */
export function layoutGeo(
  options: ChartGeoOptions & {
    width: number;
    height: number;
    colors?: readonly ChartColor[] | undefined;
    hidden?: readonly number[] | undefined;
    dataLabels?: boolean | undefined;
  },
  format: ChartFormat,
): {
  layout: ChartLayout;
  legend: { index: number; name: string; color: ChartColor; hidden: boolean }[] | null;
  table: ChartTableModel;
} {
  const width = Math.max(40, Math.round(options.width));
  const height = Math.max(40, Math.round(options.height));
  const projection = options.projection ?? "equalEarth";
  const project = PROJECTIONS[projection];
  const regions = (options.regions ?? []).slice(0, MAX_REGIONS);
  const hexLayout = options.geoLayout === "hex";
  const pixelLayout = options.geoLayout === "pixel";
  const pixelShape: ChartPixelShape = chartPixelShapes.includes(
    options.pixelShape as ChartPixelShape,
  )
    ? (options.pixelShape as ChartPixelShape)
    : "circle";
  const pixelSpacing = Math.max(3, Math.min(64, Number(options.pixelSpacing) || 8));
  const pixelWidth =
    (pixelSpacing * Math.max(10, Math.min(100, Number(options.pixelSize) || 80))) / 100;
  let pixelBudget = MAX_PIXELS;
  /** The drawn path of a region: its outline, or its lattice cells in pixel layouts. */
  const drawnPath = (rings: readonly Ring[]) => {
    if (!pixelLayout) return pathOf(rings);
    const { d, count } = pixelPath(rings, pixelSpacing, pixelShape, pixelWidth, pixelBudget);
    pixelBudget = Math.max(0, pixelBudget - count);
    return d;
  };

  // --- Scale ---------------------------------------------------------------------------
  const given = options.colors?.filter((color) => chartColors.includes(color)) ?? [];
  const base = (given.length === 1 ? (given[0] as ChartColor).split("-")[0] : "primary") as string;
  const ramp: ChartColor[] =
    given.length > 1
      ? [...given]
      : (["lighter", "light", "", "dark", "darker"].map((shade) =>
          shade ? `${base}-${shade}` : base,
        ) as ChartColor[]);
  const values = regions.map((region) => finiteValue(region.value));
  const scale = mapScale(values, {
    method: options.scaleMethod,
    classes: options.scaleClasses,
    palette: ramp,
    thresholds: options.scaleThresholds,
  });
  const colorOf = (value: number | null) =>
    (value === null ? undefined : scale.colors[scale.classOf(value)]) as ChartColor | undefined;
  const hidden = new Set(options.hidden ?? []);
  const label = (item: MapScaleClass) => mapScaleLabel(item, (value) => format.value(value, 0));

  // --- Shapes --------------------------------------------------------------------------
  const rowByKey = new Map(regions.map((region, index) => [region.id, index]));
  const features = featuresOf(options.geometry);
  /** Plane rings per region row: the outer rings of its feature, within the coordinate limit. */
  const projected: { key: string | undefined; rings: Ring[] }[] = [];
  let budget = MAX_COORDINATES;
  for (const feature of features.slice(0, MAX_REGIONS * 4)) {
    const rings: Ring[] = [];
    for (const ring of ringsOf(feature.geometry)) {
      if (budget - ring.length < 0) break;
      budget -= ring.length;
      rings.push(ring.map(([lng, lat]) => project(lng, lat)));
    }
    if (rings.length) projected.push({ key: featureKey(feature, options.joinBy), rings });
  }
  const sphere = options.sphere ? sphereRing(project, projection) : null;

  const shapes: ChartNode[] = [];
  const labels: ChartNode[] = [];
  const marks: ChartMark[] = [];
  const addRegion = (
    index: number,
    rings: readonly Ring[],
    centerPoint: [number, number],
    hexCell = false,
  ) => {
    const region = regions[index] as ChartGeoRegion;
    const value = values[index] as number | null;
    const classIndex = value === null ? -1 : scale.classOf(value);
    const color = colorOf(value);
    const d = pathOf(rings);
    const muted = classIndex >= 0 && hidden.has(classIndex);
    shapes.push(
      node("path", {
        d: hexCell ? d : drawnPath(rings),
        "data-ok-chart-region": region.id,
        ...(color ? { "data-ok-color": color } : { "data-ok-no-data": "" }),
        ...(muted ? { "fill-opacity": "0.18" } : {}),
      }),
    );
    const name = region.name ?? region.id;
    const noData = format.part("noData" as ChartPart);
    const valueText = value === null ? noData : format.value(value, 0);
    const { left, right, top, bottom } = box(rings as Ring[]);
    const [cx, cy] = centerPoint;
    marks.push({
      series: 0,
      type: "geo",
      index,
      x: index,
      value: value ?? 0,
      px: r2(cx),
      py: r2(cy),
      color: color ?? ("primary" as ChartColor),
      cell: {
        x: r2(left),
        y: r2(top),
        width: r2(right - left),
        height: r2(bottom - top),
      },
      geo: {
        d,
        rings: rings as readonly (readonly [number, number])[][],
        title: name,
        rows: [
          { name: format.part("y"), value: valueText, color: color ?? ("primary" as ChartColor) },
        ],
      },
    });
    if (options.dataLabels) {
      const text = region.label ?? name;
      const room = right - left - 4;
      if (room >= 12 && bottom - top >= FONT + 2 && chartTextWidth(text) <= room * 1.15) {
        const fitted = fitChartText(text, room);
        labels.push(
          node(
            "text",
            {
              x: fmt(cx),
              y: fmt(cy),
              dy: "0.35em",
              "text-anchor": "middle",
              "data-ok-chart-partition-label":
                classIndex >= Math.ceil(scale.colors.length / 2) ? "inside" : "plain",
            },
            undefined,
            fitted,
          ),
        );
      }
    }
  };

  const background: ChartNode[] = [];
  if (hexLayout) {
    // Explicit cells, else positions from the geometry's centroids.
    const placed = options.hexCells?.length
      ? validCells(options.hexCells)
      : autoHexCells(
          projected.flatMap(({ key, rings }) => {
            if (key === undefined || !rowByKey.has(key)) return [];
            const [x, y] = centroid(rings);
            return [{ id: key, x, y }];
          }),
        );
    if (placed.length) {
      const cols = Math.max(...placed.map((cell) => Number(cell.col))) + 1;
      const rows = Math.max(...placed.map((cell) => Number(cell.row))) + 1;
      const anyOdd = placed.some((cell) => Number(cell.row) % 2 === 1);
      const units = cols + (anyOdd ? 0.5 : 0);
      const unitH = (rows - 1) * 1.5 + 2;
      const r = Math.min(
        (width - PADDING * 2) / (units * Math.sqrt(3)),
        (height - PADDING * 2) / unitH,
      );
      const hw = Math.sqrt(3) * r;
      const originX = (width - units * hw) / 2 + hw / 2;
      const originY = (height - (rows - 1) * r * 1.5) / 2;
      for (const cell of placed) {
        const index = rowByKey.get(cell.id);
        if (index === undefined) continue;
        const col = Number(cell.col);
        const row = Number(cell.row);
        const cx = originX + (col + (row % 2 === 1 ? 0.5 : 0)) * hw;
        const cy = originY + row * r * 1.5;
        addRegion(index, [hexRing(cx, cy, r * 0.96)], [cx, cy], true);
      }
    }
  } else if (projected.length || sphere) {
    const fit = fitter(sphere ? [sphere] : projected.flatMap(({ rings }) => rings), width, height);
    if (sphere)
      background.push(node("path", { d: pathOf([sphere.map(fit)]), "data-ok-chart-sphere": "" }));
    if (options.graticule) {
      background.push(graticule(project, projection, fit));
    }
    for (const { key, rings } of projected) {
      const fitted = rings.map((ring) => ring.map(fit));
      const index = key === undefined ? undefined : rowByKey.get(key);
      if (index === undefined) {
        // Geometry without data: drawn, not interactive.
        shapes.push(
          node("path", {
            d: drawnPath(fitted),
            "data-ok-chart-region": key ?? "",
            "data-ok-no-data": "",
          }),
        );
        continue;
      }
      addRegion(index, fitted, centroid(fitted));
    }
  }

  const layout: ChartLayout = {
    width,
    height,
    plot: { x: 0, y: 0, width, height },
    mode: "cell",
    horizontal: false,
    banded: false,
    band: 0,
    slots: [],
    marks,
    activeRadius: 0,
    nodes: [
      node("g", { "data-ok-chart-geo-background": "" }, background),
      node("g", { "data-ok-chart-crosshair": "" }, []),
      node("g", { "data-ok-chart-series-group": "" }, [
        node(
          "g",
          {
            "data-ok-chart-series": "",
            "data-ok-type": "geo",
            "data-ok-index": "0",
            ...(pixelLayout ? { "data-ok-layout": "pixel" } : {}),
          },
          shapes,
        ),
      ]),
      node("g", { "data-ok-chart-data-labels": "" }, labels),
      node("g", { "data-ok-chart-active": "" }, []),
    ],
  };

  const items = scale.classes.map((item) => ({
    index: item.index,
    name: label(item),
    color: item.color as ChartColor,
    hidden: hidden.has(item.index),
  }));

  // --- Table ---------------------------------------------------------------------------
  const part = (name: ChartPart): ChartTableCell => ({
    text: format.part(name),
    attrs: { "data-ok-part": name },
  });
  const cellOf = new Map(
    (hexLayout ? validCells(options.hexCells ?? []) : []).map((cell) => [cell.id, cell]),
  );
  const table: ChartTableModel = {
    head: [part("name"), part("y")],
    parts: [],
    rows: regions.map((region, index) => {
      const value = values[index] as number | null;
      const name = region.name ?? region.id;
      const cell = cellOf.get(region.id);
      return {
        header: {
          text: name,
          attrs: {
            ...(region.id !== name ? { "data-ok-value": region.id } : {}),
            ...(region.label !== undefined ? { "data-ok-label": region.label } : {}),
            ...(cell ? { "data-ok-cell": `${cell.col},${cell.row}` } : {}),
          },
        },
        cells: [
          value === null
            ? { text: "", attrs: {} }
            : { text: format.value(value, 0), attrs: { "data-ok-value": String(value) } },
        ],
      };
    }),
  };

  return { layout, legend: values.some((value) => value !== null) ? items : null, table };
}

/** Reads a geo chart's table back: one row per region, `th` name, `td` value. */
export function readChartGeoTable(table: HTMLTableElement): {
  regions: ChartGeoRegion[];
  hexCells: ChartHexCell[];
  partLabels: Partial<Record<ChartPart, string>>;
} {
  const partLabels: Partial<Record<ChartPart, string>> = {};
  for (const cell of table.tHead?.rows[0]?.cells ?? []) {
    const name = cell.getAttribute("data-ok-part") as ChartPart;
    const text = cell.textContent?.trim();
    if (chartPartNames.includes(name) && text) partLabels[name] = text;
  }
  const regions: ChartGeoRegion[] = [];
  const hexCells: ChartHexCell[] = [];
  for (const row of [...table.rows]
    .filter((r) => r.parentElement !== table.tHead)
    .slice(0, MAX_REGIONS)) {
    const [header, value] = row.cells;
    const name = header?.textContent?.trim() ?? "";
    const id = header?.getAttribute("data-ok-value") ?? name;
    if (!id) continue;
    const raw = value?.getAttribute("data-ok-value") ?? value?.textContent?.trim();
    const label = header?.getAttribute("data-ok-label") ?? undefined;
    regions.push({ id, name, ...(label !== undefined ? { label } : {}), value: raw || null });
    const cell = header?.getAttribute("data-ok-cell")?.split(",").map(Number);
    if (cell && cell.length === 2 && cell.every((n) => Number.isFinite(n)))
      hexCells.push({ id, col: cell[0] as number, row: cell[1] as number });
  }
  return { regions, hexCells, partLabels };
}
