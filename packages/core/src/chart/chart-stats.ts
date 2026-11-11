/*
 * Statistics for distribution charts (roadmap 4.18.21, violin): quantiles, Silverman's bandwidth
 * and a Gaussian kernel density estimate. Pure numbers, no chart model, so the data model and the
 * layouts can both use it.
 */

/** At most this many observations per point (untrusted input). */
export const CHART_MAX_SAMPLES = 20_000;

/** The input of a violin point: observations, a precomputed curve, or both. */
export interface ChartViolinInput {
  /** The curve as `[value, weight]` pairs (drawn as given; weights are normalized for width). */
  readonly density?: readonly (readonly [number, number])[] | undefined;
  /** The observations, drawn as dots and used for the curve when `density` is absent. */
  readonly points?: readonly number[] | undefined;
}

/** A violin's statistics. */
export interface ChartViolinStats {
  /** Observations in order (ascending), at most `CHART_MAX_SAMPLES`. */
  readonly samples: readonly number[];
  /** The curve when given (sorted by value), else `undefined` (estimated from `samples`). */
  readonly density?: readonly (readonly [number, number])[] | undefined;
  /** Observations, or the sum of the weights rounded when only a curve is given. */
  readonly count: number;
  /** Minimum, Q1, median, Q3, maximum. */
  readonly five: readonly [number, number, number, number, number];
}

/** The `p` quantile of `sorted` values (linear interpolation between ranks). */
export function chartQuantile(sorted: readonly number[], p: number): number {
  const at = (sorted.length - 1) * p;
  const low = Math.floor(at);
  const high = Math.ceil(at);
  const a = sorted[low] as number;
  return a + ((sorted[high] as number) - a) * (at - low);
}

/** Weighted quantiles of a curve: where its running weight reaches `p` of the whole. */
function weightedQuantile(
  curve: readonly (readonly [number, number])[],
  total: number,
  p: number,
): number {
  let running = 0;
  for (const [value, weight] of curve) {
    running += weight;
    if (running >= p * total) return value;
  }
  return (curve.at(-1) as readonly [number, number])[0];
}

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

/** Valid statistics from what a point gives (`y` or `points`), or `null` when there is nothing to draw. */
export function chartViolinStats(y: unknown, points: unknown): ChartViolinStats | null {
  const given = (y !== null && typeof y === "object" && !Array.isArray(y) ? y : {}) as {
    density?: unknown;
    points?: unknown;
  };
  const rawPoints = Array.isArray(y) ? y : (given.points ?? points);
  const samples = (Array.isArray(rawPoints) ? rawPoints : [])
    .slice(0, CHART_MAX_SAMPLES)
    .map((value) => (typeof value === "string" ? Number(value) : value))
    .filter(finite)
    .sort((a, b) => a - b);
  const density = (Array.isArray(given.density) ? given.density : [])
    .slice(0, CHART_MAX_SAMPLES)
    .flatMap((pair: unknown): [number, number][] => {
      if (!Array.isArray(pair)) return [];
      const [value, weight] = pair;
      return finite(value) && finite(weight) && weight >= 0 ? [[value, weight]] : [];
    })
    .sort((a, b) => a[0] - b[0]);
  if (samples.length === 0 && density.length === 0) return null;
  if (samples.length > 0) {
    const five = [0, 0.25, 0.5, 0.75, 1].map((p) => chartQuantile(samples, p));
    return {
      samples,
      ...(density.length ? { density } : {}),
      count: samples.length,
      five: five as unknown as ChartViolinStats["five"],
    };
  }
  const total = density.reduce((sum, [, weight]) => sum + weight, 0);
  const five = [0, 0.25, 0.5, 0.75].map((p) => weightedQuantile(density, total, p));
  return {
    samples: [],
    density,
    count: Math.round(total),
    five: [
      (density[0] as [number, number])[0],
      five[1] as number,
      five[2] as number,
      five[3] as number,
      (density.at(-1) as [number, number])[0],
    ],
  };
}

/** Silverman's rule of thumb, with a fallback for equal values (zero spread). */
export function chartBandwidth(sorted: readonly number[]): number {
  const n = sorted.length;
  const mean = sorted.reduce((sum, value) => sum + value, 0) / n;
  const sd = Math.sqrt(sorted.reduce((sum, value) => sum + (value - mean) ** 2, 0) / n);
  const iqr = chartQuantile(sorted, 0.75) - chartQuantile(sorted, 0.25);
  const spread = Math.min(sd, iqr > 0 ? iqr / 1.34 : sd) || sd || Math.abs(mean) * 0.1 || 1;
  return 0.9 * spread * n ** -0.2;
}

/**
 * A Gaussian kernel density estimate over `sorted`, on `resolution` evenly spaced values from
 * three bandwidths below the minimum to three above the maximum.
 */
export function chartKernelDensity(
  sorted: readonly number[],
  bandwidth: number,
  resolution: number,
): [number, number][] {
  const h = bandwidth;
  const low = (sorted[0] as number) - 3 * h;
  const high = (sorted.at(-1) as number) + 3 * h;
  const count = Math.max(4, Math.min(Math.round(resolution), 256));
  const norm = sorted.length * h * Math.sqrt(2 * Math.PI);
  const curve: [number, number][] = [];
  for (let i = 0; i < count; i++) {
    const at = low + ((high - low) * i) / (count - 1);
    let sum = 0;
    for (const value of sorted) sum += Math.exp(-0.5 * ((at - value) / h) ** 2);
    curve.push([at, sum / norm]);
  }
  return curve;
}

/** Tukey's whisker ends: the farthest observations within 1.5 interquartile ranges. */
export function chartTukeyEnds(sorted: readonly number[]): readonly [number, number] {
  const q1 = chartQuantile(sorted, 0.25);
  const q3 = chartQuantile(sorted, 0.75);
  const fence = 1.5 * (q3 - q1);
  return [
    sorted.find((value) => value >= q1 - fence) as number,
    sorted.findLast((value) => value <= q3 + fence) as number,
  ];
}

/** Attribute text of a curve (`"value:weight value:weight"`). */
export const chartDensityText = (density: readonly (readonly [number, number])[]) =>
  density.map(([value, weight]) => `${value}:${weight}`).join(" ");

/** A curve or a list of observations back from attribute text. */
export function parseChartViolinCell(
  samples: string | null | undefined,
  density: string | null | undefined,
): ChartViolinInput | null {
  if ((samples && samples.length > 400_000) || (density && density.length > 400_000)) return null;
  const points = (samples ?? "").trim().split(/\s+/).filter(Boolean).map(Number).filter(finite);
  const curve = (density ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .flatMap((pair): [number, number][] => {
      const [value, weight] = pair.split(":").map(Number);
      return finite(value) && finite(weight) ? [[value, weight]] : [];
    });
  if (points.length === 0 && curve.length === 0) return null;
  return {
    ...(points.length ? { points } : {}),
    ...(curve.length ? { density: curve } : {}),
  };
}
