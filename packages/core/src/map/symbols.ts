/*
 * Proportional symbols of the Map (spec: specs/components/map.md › Proportional symbols, roadmap
 * 4.18.94, after ApexMaps' bubble layer): a size scale from values to circle radii (square root by
 * default, so the circle's area follows the value), the MapLibre expression that applies it, the
 * values of a nested-circle legend and a ready circle layer. Pure: no DOM, no MapLibre import.
 */
import type { MapExpression, MapScaleResult } from "./choropleth.js";

/** How `mapSizeScale` turns values into radii. */
export const mapSizeMethods = ["sqrt", "linear"] as const;
export type MapSizeMethod = (typeof mapSizeMethods)[number];

export interface MapSizeScaleOptions {
  /** `sqrt` (default: the circle's area follows the value) or `linear` (its radius does). */
  readonly method?: MapSizeMethod | undefined;
  /** Radii in px of the lowest and the highest value. Default `[4, 32]`. */
  readonly range?: readonly [number, number] | undefined;
  /** The values that get the ends of `range`. Default: the lowest and the highest value. */
  readonly domain?: readonly [number, number] | undefined;
  /** The values shown by the size legend, largest first. Default: three rounded values over the domain. */
  readonly legendValues?: readonly number[] | undefined;
  /** The value each symbol is sized by. Default `["get", "value"]` (a feature property). */
  readonly input?: MapExpression | undefined;
}

/** One circle of a size legend. */
export interface MapSizeLegendItem {
  readonly value: number;
  /** Radius in px. */
  readonly radius: number;
}

export interface MapSizeScaleResult {
  readonly method: MapSizeMethod;
  /** The domain's ends. */
  readonly min: number;
  readonly max: number;
  /** Radii of the domain's ends. */
  readonly range: readonly [number, number];
  /** How many values were missing (not finite numbers). */
  readonly nullCount: number;
  /** The circles of a size legend, largest first. */
  readonly legend: readonly MapSizeLegendItem[];
  /** A MapLibre expression for `circle-radius` (0 without a value). */
  readonly expression: MapExpression;
  /** The radius of a value (0 without a value; values outside the domain take the nearest end). */
  radiusOf(value: number | null | undefined): number;
}

const DEFAULT_INPUT: MapExpression = ["get", "value"];

/** A value rounded to two significant digits (legend values read as round numbers). */
const round2 = (value: number) => (value === 0 ? 0 : Number(value.toPrecision(2)));

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

/**
 * A size scale for proportional symbols: radii from values, a MapLibre `circle-radius`
 * expression and the circles of a nested size legend. Missing values (`null`, `NaN`) get no
 * circle. Pure and deterministic.
 */
export function mapSizeScale(
  values: readonly (number | null | undefined)[],
  options: MapSizeScaleOptions = {},
): MapSizeScaleResult {
  const method: MapSizeMethod = options.method === "linear" ? "linear" : "sqrt";
  const given = values.filter(finite);
  const nullCount = values.length - given.length;
  const sqrt = method === "sqrt";
  const low = given.length ? Math.min(...given) : 0;
  const high = given.length ? Math.max(...given) : 0;
  const domain = options.domain?.every(finite) ? options.domain : null;
  const min = Math.max(sqrt ? 0 : Number.NEGATIVE_INFINITY, domain ? domain[0] : low);
  const max = Math.max(min, domain ? domain[1] : high);
  const range = options.range?.every((r) => finite(r) && r >= 0) ? options.range : null;
  const r0 = range ? Math.min(range[0], range[1]) : 4;
  const r1 = range ? Math.max(range[0], range[1]) : 32;
  const t = (value: number) => (sqrt ? Math.sqrt(Math.max(0, value)) : value);
  const t0 = t(min);
  const t1 = t(max);
  const radiusOf = (value: number | null | undefined) => {
    if (!finite(value)) return 0;
    if (t1 === t0) return Math.round(((r0 + r1) / 2) * 100) / 100;
    const share = Math.max(0, Math.min(1, (t(value) - t0) / (t1 - t0)));
    return Math.round((r0 + (r1 - r0) * share) * 100) / 100;
  };
  const input = options.input ?? DEFAULT_INPUT;
  const scaled: unknown = sqrt ? ["sqrt", ["max", 0, input]] : input;
  const radius: unknown =
    t1 === t0 ? radiusOf(min) : ["interpolate", ["linear"], scaled, round(t0), r0, round(t1), r1];
  const picks = options.legendValues?.filter(finite) ?? [
    round2(max),
    round2(min + (max - min) * 0.35),
    round2(min + (max - min) * 0.08),
  ];
  const legend = [...new Set(picks)]
    .filter((value) => value > 0 || !sqrt)
    .sort((a, b) => b - a)
    .map((value) => ({ value, radius: radiusOf(value) }))
    .filter((item, index, all) => index === 0 || item.radius < (all[index - 1]?.radius ?? 0));
  return {
    method,
    min,
    max,
    range: [r0, r1],
    nullCount,
    legend: given.length ? legend : [],
    expression: ["case", ["==", ["typeof", input], "number"], radius, 0],
    radiusOf,
  };
}

const round = (value: number) => Math.round(value * 1e6) / 1e6;
const state = (name: string) => ["boolean", ["feature-state", name], false];
const active = ["any", state("selected"), state("focus"), state("hover")];

/** Options of `mapBubbleLayer`. */
export interface MapBubbleLayerOptions {
  readonly id: string;
  /** The GeoJSON or vector source of the points. */
  readonly source: string;
  /** Vector sources: the layer of the source with the points. */
  readonly sourceLayer?: string | undefined;
  /** The size scale from `mapSizeScale()`. */
  readonly size: MapSizeScaleResult;
  /**
   * The circles' color: a `mapScale()` result (a second field colors them, with its own `input`)
   * or one color. Default `var(--ok-palette-primary-main)`.
   */
  readonly color?: MapScaleResult | string | undefined;
  /** Opacity of the circles, so overlaps stay readable. Default 0.62. */
  readonly opacity?: number | undefined;
  /** The value the size scale reads, for the drawing order (the largest circles first). Default `["get", "value"]`. */
  readonly input?: MapExpression | undefined;
}

/**
 * A circle layer of proportional symbols: radius from the size scale, color from a class scale or
 * one color, a paper outline (the primary text color while a `MapRegions` of the points hovers,
 * focuses or selects one), and the largest circles drawn first so small ones stay on top.
 */
export function mapBubbleLayer(options: MapBubbleLayerOptions): {
  id: string;
  type: "circle";
  source: string;
  "source-layer"?: string;
  layout: Record<string, unknown>;
  paint: Record<string, unknown>;
} {
  const input = options.input ?? DEFAULT_INPUT;
  const color = options.color;
  return {
    id: options.id,
    type: "circle",
    source: options.source,
    ...(options.sourceLayer ? { "source-layer": options.sourceLayer } : {}),
    layout: { "circle-sort-key": ["-", 0, ["to-number", input, 0]] },
    paint: {
      "circle-radius": options.size.expression,
      "circle-color":
        typeof color === "string"
          ? color
          : color
            ? color.expression
            : "var(--ok-palette-primary-main)",
      "circle-opacity": options.opacity ?? 0.62,
      // Points joined by `MapRegions` (hover, keyboard focus, selection) get a stronger outline.
      "circle-stroke-color": ["case", active, "var(--ok-text-primary)", "var(--ok-bg-paper)"],
      "circle-stroke-width": ["case", active, 2, 1],
    },
  };
}
