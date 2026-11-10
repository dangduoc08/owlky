/*
 * Choropleth helpers of the Map (spec: specs/components/map.md › Choropleth, roadmap 4.18.15):
 * classify values (quantile, equal interval, Jenks natural breaks, thresholds), pick colors from
 * the `--ok-*` palette tokens and build MapLibre expressions. Pure: no DOM, no MapLibre import.
 * Colors are `var(--ok-…)` strings; the map controller resolves them when it adds a layer and again
 * when the color scheme or the preset changes, so themes and presets reach the map.
 */
import { type PaletteColorName, paletteColorNames } from "@owlky/tokens";

/** How `mapScale` splits the values into classes. */
export const mapScaleMethods = ["quantile", "equalInterval", "jenks", "threshold"] as const;
export type MapScaleMethod = (typeof mapScaleMethods)[number];

/** Named palettes: one sequential ramp of token shades per palette color, and `grey`. */
export const mapScalePalettes = [...paletteColorNames, "grey"] as const;
export type MapScalePalette = PaletteColorName | "grey";

/** A MapLibre expression (JSON array). */
export type MapExpression = [string, ...unknown[]];

export interface MapScaleOptions {
  /**
   * `quantile` (default: about as many values in each class), `equalInterval` (classes of the
   * same width), `jenks` (natural breaks: classes that keep similar values together) or
   * `threshold` (your own `thresholds`). ApexMaps' `naturalBreaks` and `quantize` are accepted too.
   */
  readonly method?: MapScaleMethod | "naturalBreaks" | "quantize" | undefined;
  /** Number of classes (default 5). Named palettes have five shades, so at most 5 for them. */
  readonly classes?: number | undefined;
  /** A named palette (default `primary`) or your own colors from the lowest class to the highest. */
  readonly palette?: MapScalePalette | readonly string[] | undefined;
  /** `threshold` method: the class breaks (a value equal to a break starts the next class). */
  readonly thresholds?: readonly number[] | undefined;
  /** Color of regions without a value. Default `var(--ok-text-disabled)` (a grey for each scheme). */
  readonly nullColor?: string | undefined;
  /** The value each region is colored by. Default `["feature-state", "value"]` (set by the map's regions). */
  readonly input?: MapExpression | undefined;
}

/** One class of a scale. */
export interface MapScaleClass {
  readonly index: number;
  /** Lowest value of the class (inclusive). */
  readonly min: number;
  /** Highest value of the class (the next class starts at this value; the last one includes it). */
  readonly max: number;
  readonly color: string;
  /** How many of the values fall in the class. */
  readonly count: number;
}

export interface MapScaleResult {
  readonly method: MapScaleMethod;
  /** Smallest and largest value. */
  readonly min: number;
  readonly max: number;
  /** Inner class breaks, ascending (one fewer than the classes). */
  readonly breaks: readonly number[];
  readonly classes: readonly MapScaleClass[];
  /** The class colors, from the lowest class to the highest. */
  readonly colors: readonly string[];
  readonly nullColor: string;
  /** How many values were missing (not finite numbers). */
  readonly nullCount: number;
  /** A MapLibre `step` expression (classes), with `nullColor` for missing values. */
  readonly expression: MapExpression;
  /** A MapLibre `interpolate` expression (a continuous gradient over the same colors). */
  readonly gradient: MapExpression;
  /** The class index of a value, or `-1` without a value. */
  classOf(value: number | null | undefined): number;
}

const SHADES = ["lighter", "light", "main", "dark", "darker"] as const;
const GREYS = [200, 300, 400, 500, 600, 700, 800] as const;
const DEFAULT_INPUT: MapExpression = ["feature-state", "value"];

/** The token colors of a named palette, lightest first. */
export function mapPaletteColors(palette: MapScalePalette): string[] {
  if (palette === "grey") return GREYS.map((shade) => `var(--ok-palette-grey-${shade})`);
  return SHADES.map((shade) => `var(--ok-palette-${palette}-${shade})`);
}

/** `count` colors spread evenly over a ramp (its ends included). */
function sample(ramp: readonly string[], count: number): string[] {
  if (count <= 1) return [ramp[Math.floor((ramp.length - 1) / 2)] as string];
  return Array.from(
    { length: count },
    (_, i) => ramp[Math.round((i * (ramp.length - 1)) / (count - 1))] as string,
  );
}

/** The value at fraction `p` of sorted values (linear interpolation, like d3's `quantile`). */
function quantile(sorted: readonly number[], p: number): number {
  const position = (sorted.length - 1) * p;
  const below = Math.floor(position);
  const low = sorted[below] as number;
  const high = sorted[Math.min(below + 1, sorted.length - 1)] as number;
  return low + (high - low) * (position - below);
}

/**
 * Jenks natural breaks (Fisher's exact optimization, the classic dynamic program): splits sorted
 * values into `classes` groups with the smallest sum of squared deviations from their means.
 * Returns the first value of each class after the first (the `step` breaks).
 */
export function jenksBreaks(values: readonly number[], classes: number): number[] {
  const data = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  const n = data.length;
  const k = Math.min(Math.max(1, Math.floor(classes)), new Set(data).size);
  if (n === 0 || k <= 1) return [];
  // lower[i][j]: index (1-based) where class j of the first i values starts; cost[i][j]: its variance.
  const lower = Array.from({ length: n + 1 }, () => new Array<number>(k + 1).fill(0));
  const cost = Array.from({ length: n + 1 }, () =>
    new Array<number>(k + 1).fill(Number.POSITIVE_INFINITY),
  );
  for (let j = 1; j <= k; j++) {
    (lower[1] as number[])[j] = 1;
    (cost[1] as number[])[j] = 0;
  }
  for (let l = 2; l <= n; l++) {
    let sum = 0;
    let squares = 0;
    let weight = 0;
    let variance = 0;
    for (let m = 1; m <= l; m++) {
      const start = l - m + 1;
      const value = data[start - 1] as number;
      weight++;
      sum += value;
      squares += value * value;
      variance = squares - (sum * sum) / weight;
      if (start === 1) continue;
      for (let j = 2; j <= k; j++) {
        const candidate = variance + ((cost[start - 1] as number[])[j - 1] as number);
        if (((cost[l] as number[])[j] as number) >= candidate) {
          (lower[l] as number[])[j] = start;
          (cost[l] as number[])[j] = candidate;
        }
      }
    }
    (lower[l] as number[])[1] = 1;
    (cost[l] as number[])[1] = variance;
  }
  const breaks: number[] = [];
  let end = n;
  for (let j = k; j >= 2; j--) {
    const start = (lower[end] as number[])[j] as number;
    breaks.unshift(data[start - 1] as number);
    end = start - 1;
  }
  return breaks;
}

const METHODS: Record<string, MapScaleMethod> = {
  quantile: "quantile",
  equalInterval: "equalInterval",
  quantize: "equalInterval",
  jenks: "jenks",
  naturalBreaks: "jenks",
  threshold: "threshold",
};

/**
 * Classifies `values` for a choropleth: class breaks, one color per class (token colors from a
 * named palette, or your own), and the MapLibre expressions that paint regions with them.
 * Missing values (`null`, `NaN`) count as no data. Pure and deterministic.
 */
export function mapScale(
  values: readonly (number | null | undefined)[],
  options: MapScaleOptions = {},
): MapScaleResult {
  const method = METHODS[options.method ?? "quantile"] ?? "quantile";
  const finite = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  const nullCount = values.length - finite.length;
  const sorted = [...finite].sort((a, b) => a - b);
  const min = sorted.length > 0 ? (sorted[0] as number) : 0;
  const max = sorted.length > 0 ? (sorted[sorted.length - 1] as number) : 0;
  const palette = options.palette ?? "primary";
  const ramp =
    typeof palette === "string"
      ? mapPaletteColors(mapScalePalettes.includes(palette) ? palette : "primary")
      : palette.length > 0
        ? [...palette]
        : mapPaletteColors("primary");
  const requested =
    method === "threshold"
      ? (options.thresholds?.length ?? 0) + 1
      : Math.max(1, Math.floor(options.classes ?? 5));
  const count = Math.min(requested, ramp.length);

  let breaks: number[];
  if (method === "threshold")
    breaks = [...(options.thresholds ?? [])]
      .filter((v) => Number.isFinite(v))
      .sort((a, b) => a - b)
      .slice(0, count - 1);
  else if (sorted.length === 0 || min === max) breaks = [];
  else if (method === "equalInterval")
    breaks = Array.from({ length: count - 1 }, (_, i) => min + ((max - min) * (i + 1)) / count);
  else if (method === "jenks") breaks = jenksBreaks(sorted, count);
  else breaks = Array.from({ length: count - 1 }, (_, i) => quantile(sorted, (i + 1) / count));
  // Equal breaks would make empty classes: keep each break once.
  breaks = breaks
    .map((v) => Number(v.toPrecision(12)))
    .filter((v, i, all) => i === 0 || v !== all[i - 1]);

  const colors = sample(ramp, breaks.length + 1);
  const classOf = (value: number | null | undefined) => {
    if (typeof value !== "number" || !Number.isFinite(value)) return -1;
    let index = 0;
    while (index < breaks.length && value >= (breaks[index] as number)) index++;
    return index;
  };
  const counts = colors.map(() => 0);
  for (const value of finite) {
    const index = classOf(value);
    counts[index] = (counts[index] ?? 0) + 1;
  }
  const bounds = [Math.min(min, breaks[0] ?? min), ...breaks, Math.max(max, breaks.at(-1) ?? max)];
  const classes = colors.map((color, index) => ({
    index,
    min: bounds[index] as number,
    max: bounds[index + 1] as number,
    color,
    count: counts[index] as number,
  }));

  const input = options.input ?? DEFAULT_INPUT;
  const nullColor = options.nullColor ?? "var(--ok-text-disabled)";
  const isNumber = ["==", ["typeof", input], "number"];
  const step: unknown =
    breaks.length === 0
      ? colors[0]
      : ["step", input, colors[0], ...breaks.flatMap((b, i) => [b, colors[i + 1]])];
  const stops =
    colors.length > 1 && max > min
      ? colors.flatMap((color, i) => [min + ((max - min) * i) / (colors.length - 1), color])
      : null;
  const gradient: unknown = stops ? ["interpolate", ["linear"], input, ...stops] : colors[0];
  return {
    method,
    min,
    max,
    breaks,
    classes,
    colors,
    nullColor,
    nullCount,
    expression: ["case", isNumber, step, nullColor],
    gradient: ["case", isNumber, gradient, nullColor],
    classOf,
  };
}

const NUMBER = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 });

/** The legend text of a class: `"1.5 – 3"` (the formatter gets each end). */
export function mapScaleLabel(
  item: Pick<MapScaleClass, "min" | "max">,
  format: (value: number) => string = (value) => NUMBER.format(value),
): string {
  return item.min === item.max ? format(item.min) : `${format(item.min)} – ${format(item.max)}`;
}

/** Options of `mapRegionLayers`. */
export interface MapRegionLayersOptions {
  /** Id of the fill layer; the outline layer is `<id>-outline`. */
  readonly id: string;
  /** The GeoJSON or vector source of the regions. */
  readonly source: string;
  /** Vector sources: the layer of the source with the regions. */
  readonly sourceLayer?: string | undefined;
  readonly scale: MapScaleResult;
  /** `classes` (default, the `step` expression) or `gradient` (the `interpolate` one). */
  readonly variant?: "classes" | "gradient" | undefined;
  /** Opacity of the fill. Default 0.8. */
  readonly opacity?: number | undefined;
  /** Opacity of regions outside the legend's pressed classes. Default 0.15 (ApexMaps `states.muted.opacity`). */
  readonly mutedOpacity?: number | undefined;
}

const state = (name: string) => ["boolean", ["feature-state", name], false];

/**
 * The two layers of a choropleth: a fill colored by the scale (muted regions fade out, the
 * hovered one is stronger) and an outline that marks the hovered, focused and selected regions.
 * They read the feature states the map's regions set: `value`, `hover`, `focus`, `selected`, `muted`.
 */
export function mapRegionLayers(options: MapRegionLayersOptions): [
  {
    id: string;
    type: "fill";
    source: string;
    "source-layer"?: string;
    paint: Record<string, unknown>;
  },
  {
    id: string;
    type: "line";
    source: string;
    "source-layer"?: string;
    paint: Record<string, unknown>;
  },
] {
  const opacity = options.opacity ?? 0.8;
  const muted = options.mutedOpacity ?? 0.15;
  const layer = options.sourceLayer ? { "source-layer": options.sourceLayer } : {};
  return [
    {
      id: options.id,
      type: "fill",
      source: options.source,
      ...layer,
      paint: {
        "fill-color":
          options.variant === "gradient" ? options.scale.gradient : options.scale.expression,
        "fill-opacity": [
          "case",
          state("muted"),
          muted,
          ["any", state("hover"), state("focus"), state("selected")],
          Math.round(Math.min(1, opacity + 0.15) * 100) / 100,
          opacity,
        ],
      },
    },
    {
      id: `${options.id}-outline`,
      type: "line",
      source: options.source,
      ...layer,
      paint: {
        "line-color": [
          "case",
          ["any", state("selected"), state("focus"), state("hover")],
          "var(--ok-text-primary)",
          "var(--ok-bg-paper)",
        ],
        "line-width": [
          "case",
          state("selected"),
          2.5,
          ["any", state("focus"), state("hover")],
          1.5,
          0.5,
        ],
      },
    },
  ];
}
