/*
 * Sources and layers written as markup (HTML), read into MapLibre specifications (ADR-0025):
 *
 *   <div data-ok-map-source data-ok-id="quakes" data-ok-type="geojson" data-ok-data="quakes.geojson"
 *        data-ok-cluster data-ok-cluster-radius="50" hidden>
 *     <div data-ok-map-layer data-ok-id="clusters" data-ok-type="circle"
 *          data-ok-filter='["has","point_count"]' data-ok-paint='{"circle-color":"#00A76F"}' hidden></div>
 *   </div>
 *
 * Only the keys below are read (an allowlist, ADR-0025 / S4); JSON values go through `JSON.parse`
 * and MapLibre's style validation, URLs through `safeMapUrl`.
 */
import { safeMapUrl } from "./helpers.js";

type Kind = "string" | "number" | "flag" | "json" | "url" | "urls" | "data";

const SOURCE_KEYS: Record<string, [attr: string, kind: Kind]> = {
  data: ["data-ok-data", "data"],
  url: ["data-ok-url", "url"],
  tiles: ["data-ok-tiles", "urls"],
  tileSize: ["data-ok-tile-size", "number"],
  minzoom: ["data-ok-min-zoom", "number"],
  maxzoom: ["data-ok-max-zoom", "number"],
  bounds: ["data-ok-bounds", "json"],
  scheme: ["data-ok-scheme", "string"],
  attribution: ["data-ok-attribution", "string"],
  cluster: ["data-ok-cluster", "flag"],
  clusterRadius: ["data-ok-cluster-radius", "number"],
  clusterMaxZoom: ["data-ok-cluster-max-zoom", "number"],
  clusterMinPoints: ["data-ok-cluster-min-points", "number"],
  clusterProperties: ["data-ok-cluster-properties", "json"],
  promoteId: ["data-ok-promote-id", "string"],
  generateId: ["data-ok-generate-id", "flag"],
  buffer: ["data-ok-buffer", "number"],
  tolerance: ["data-ok-tolerance", "number"],
  lineMetrics: ["data-ok-line-metrics", "flag"],
  encoding: ["data-ok-encoding", "string"],
  coordinates: ["data-ok-coordinates", "json"],
};

const LAYER_KEYS: Record<string, [attr: string, kind: Kind]> = {
  "source-layer": ["data-ok-source-layer", "string"],
  minzoom: ["data-ok-min-zoom", "number"],
  maxzoom: ["data-ok-max-zoom", "number"],
  filter: ["data-ok-filter", "json"],
  layout: ["data-ok-layout", "json"],
  paint: ["data-ok-paint", "json"],
};

export const mapSourceTypes = [
  "geojson",
  "vector",
  "raster",
  "raster-dem",
  "image",
  "video",
] as const;
export const mapLayerTypes = [
  "background",
  "fill",
  "line",
  "symbol",
  "circle",
  "heatmap",
  "fill-extrusion",
  "raster",
  "hillshade",
  "color-relief",
] as const;

const ID = /^[A-Za-z0-9_.:-]{1,128}$/;

function read(element: Element, attr: string, kind: Kind): unknown {
  const raw = element.getAttribute(attr);
  if (raw === null) return undefined;
  switch (kind) {
    case "flag":
      return raw !== "false";
    case "number": {
      const value = raw.trim() === "" ? Number.NaN : Number(raw);
      return Number.isFinite(value) ? value : undefined;
    }
    case "json":
      try {
        return JSON.parse(raw);
      } catch {
        return undefined;
      }
    case "url":
      return safeMapUrl(raw) ?? undefined;
    case "urls": {
      const urls = raw
        .split(/\s+/)
        .map((each) => safeMapUrl(each))
        .filter((each): each is string => each !== null);
      return urls.length > 0 ? urls : undefined;
    }
    case "data": {
      const text = raw.trim();
      if (text.startsWith("{")) return read(element, attr, "json");
      return safeMapUrl(text) ?? undefined;
    }
    default:
      return raw;
  }
}

function collect(element: Element, keys: Record<string, [string, Kind]>) {
  const spec: Record<string, unknown> = {};
  for (const [key, [attr, kind]] of Object.entries(keys)) {
    const value = read(element, attr, kind);
    if (value !== undefined) spec[key] = value;
  }
  return spec;
}

/** A source declaration: `{ id, spec }`, or `null` when its id or type is missing or invalid. */
export function readSourceDeclaration(
  element: Element,
): { id: string; spec: Record<string, unknown> } | null {
  const id = element.getAttribute("data-ok-id") ?? "";
  const type = element.getAttribute("data-ok-type");
  if (!ID.test(id) || !mapSourceTypes.includes(type as (typeof mapSourceTypes)[number]))
    return null;
  return { id, spec: { type, ...collect(element, SOURCE_KEYS) } };
}

/**
 * A layer declaration: its spec (with `source` from the parent source declaration or its own
 * `data-ok-source`) and `beforeId`, or `null` when invalid.
 */
export function readLayerDeclaration(
  element: Element,
): { spec: Record<string, unknown>; beforeId?: string | undefined } | null {
  const id = element.getAttribute("data-ok-id") ?? "";
  const type = element.getAttribute("data-ok-type");
  if (!ID.test(id) || !mapLayerTypes.includes(type as (typeof mapLayerTypes)[number])) return null;
  const parent = element.parentElement?.closest("[data-ok-map-source], [data-ok-map]");
  const source = parent?.hasAttribute("data-ok-map-source")
    ? parent.getAttribute("data-ok-id")
    : element.getAttribute("data-ok-source");
  const spec: Record<string, unknown> = { id, type, ...collect(element, LAYER_KEYS) };
  if (type !== "background") {
    if (!source || !ID.test(source)) return null;
    spec["source"] = source;
  }
  const beforeId = element.getAttribute("data-ok-before-id");
  return { spec, beforeId: beforeId && ID.test(beforeId) ? beforeId : undefined };
}
