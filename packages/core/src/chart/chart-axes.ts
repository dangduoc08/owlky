import { type ChartData, parseChartNumber } from "./chart-model.js";
import { type NiceScale, niceScale, niceStep, scaleLinear } from "./chart-scale.js";

/*
 * Value axes (roadmap 4.18.59, ApexCharts `yaxis`): one axis or several (left and `opposite`),
 * each with its own scale: linear or logarithmic, reversed, a fixed number of ticks. Series go to
 * an axis by `seriesName`, by position or by their own `yAxis`. HTML writes the axes as text on the
 * root (`data-ok-yaxis`) and each series' axis on its column header (`th[data-ok-y-axis]`).
 */

/** A value axis (ApexCharts `yaxis`; `title.text` → `title`). */
export interface ChartYAxis {
  /** The series drawn on this axis, by name (one or several). Default: the series at its position. */
  readonly seriesName?: string | readonly string[] | undefined;
  /** On the right of the plot instead of the left. */
  readonly opposite?: boolean | undefined;
  /** A logarithmic scale (values ≤ 0 aren't drawn). */
  readonly logarithmic?: boolean | undefined;
  /** Base of the logarithmic scale. Default 10. */
  readonly logBase?: number | undefined;
  /** The highest value at the bottom (vertical charts) or the left (horizontal bars). */
  readonly reversed?: boolean | undefined;
  /** The number of intervals between ticks (linear scales). Default about one per 48px. */
  readonly tickAmount?: number | undefined;
  /** Lowest value of the axis (default from the data). */
  readonly min?: number | undefined;
  /** Highest value of the axis (default from the data). */
  readonly max?: number | undefined;
  /** The axis title, drawn beside its labels. */
  readonly title?: string | undefined;
  /** `false`: the axis isn't drawn (its series keep its scale). Default `true`. */
  readonly show?: boolean | undefined;
}

/** A validated axis: numbers finite, the base above 1, names as a list. */
export interface ChartAxisSpec {
  readonly seriesName: readonly string[];
  readonly opposite: boolean;
  readonly logarithmic: boolean;
  readonly logBase: number;
  readonly reversed: boolean;
  readonly tickAmount?: number | undefined;
  readonly min?: number | undefined;
  readonly max?: number | undefined;
  readonly title?: string | undefined;
  readonly show: boolean;
}

const MAX_AXES = 10;

const finite = (value: unknown): number | undefined => {
  const parsed = parseChartNumber(value);
  return parsed === null ? undefined : parsed;
};

/** Validated axes from `yaxis` (one object or a list); untrusted values fall back. */
export function chartYAxes(
  input: ChartYAxis | readonly ChartYAxis[] | null | undefined,
): ChartAxisSpec[] {
  if (!input) return [];
  const list = (Array.isArray(input) ? input : [input]) as readonly ChartYAxis[];
  return list.slice(0, MAX_AXES).map((axis): ChartAxisSpec => {
    const entry = axis && typeof axis === "object" ? axis : {};
    const names = entry.seriesName;
    const base = finite(entry.logBase);
    const ticks = finite(entry.tickAmount);
    const min = finite(entry.min);
    const max = finite(entry.max);
    const title = typeof entry.title === "string" && entry.title.trim() ? entry.title : undefined;
    return {
      seriesName: (Array.isArray(names) ? names : names === undefined ? [] : [names])
        .filter((name): name is string => typeof name === "string")
        .slice(0, 100),
      opposite: entry.opposite === true,
      logarithmic: entry.logarithmic === true,
      logBase: base !== undefined && base > 1 ? base : 10,
      reversed: entry.reversed === true,
      ...(ticks !== undefined && ticks >= 1 ? { tickAmount: Math.min(50, Math.round(ticks)) } : {}),
      ...(min !== undefined ? { min } : {}),
      ...(max !== undefined ? { max } : {}),
      ...(title ? { title: title.slice(0, 200) } : {}),
      show: entry.show !== false,
    };
  });
}

/** Text of one axis title inside the attribute: `;` separates axes, so it becomes a space. */
const titleText = (title: string) => title.replace(/[;\s]+/g, " ").trim();

/**
 * Axes as attribute text (`data-ok-yaxis`): axes separated by `;`, each a list of words —
 * `opposite`, `logarithmic`, `reversed`, `hidden`, `log-base <n>`, `tick-amount <n>`, `min <n>`,
 * `max <n>` and last `title <text>`. Series names stay in the table (`th[data-ok-y-axis]`).
 */
export function chartYAxesText(input: ChartYAxis | readonly ChartYAxis[] | undefined): string {
  const axes = chartYAxes(input);
  return axes
    .map((axis) =>
      [
        axis.opposite ? "opposite" : "",
        axis.logarithmic ? "logarithmic" : "",
        axis.logarithmic && axis.logBase !== 10 ? `log-base ${axis.logBase}` : "",
        axis.reversed ? "reversed" : "",
        axis.show ? "" : "hidden",
        axis.tickAmount !== undefined ? `tick-amount ${axis.tickAmount}` : "",
        axis.min !== undefined ? `min ${axis.min}` : "",
        axis.max !== undefined ? `max ${axis.max}` : "",
        axis.title ? `title ${titleText(axis.title)}` : "",
      ]
        .filter(Boolean)
        .join(" "),
    )
    .join("; ");
}

/** Axes from attribute text (`chartYAxesText`); at most 2000 characters and 10 axes. */
export function parseChartYAxes(text: string | null | undefined): ChartAxisSpec[] {
  if (text === null || text === undefined || text.length > 2000) return [];
  if (text.trim() === "") return [];
  return chartYAxes(
    text
      .split(";")
      .slice(0, MAX_AXES)
      .map((group): ChartYAxis => {
        const words = group.trim().split(/\s+/).filter(Boolean);
        const out: Record<string, unknown> = {};
        for (let i = 0; i < words.length; i++) {
          const word = words[i] as string;
          if (word === "title") {
            out["title"] = words.slice(i + 1).join(" ");
            break;
          }
          if (word === "opposite" || word === "logarithmic" || word === "reversed")
            out[word] = true;
          else if (word === "hidden") out["show"] = false;
          else if (word === "log-base") out["logBase"] = words[++i];
          else if (word === "tick-amount") out["tickAmount"] = words[++i];
          else if (word === "min" || word === "max") out[word] = words[++i];
        }
        return out as ChartYAxis;
      }),
  );
}

/**
 * The axis of each series: its own `yAxis` (HTML: the column header's), else the first axis
 * naming it, else the axis at its position when that axis names no series, else the first.
 */
export function chartSeriesAxes(
  series: readonly { readonly name: string; readonly axis?: number | undefined }[],
  axes: readonly ChartAxisSpec[],
): number[] {
  return series.map((entry, index) => {
    if (entry.axis !== undefined && entry.axis < axes.length) return entry.axis;
    const named = axes.findIndex((axis) => axis.seriesName.includes(entry.name));
    if (named >= 0) return named;
    const own = axes[index];
    return own && own.seriesName.length === 0 ? index : 0;
  });
}

/** Gives each series its axis (charts with several axes; otherwise the axes are dropped). */
export function withChartAxes(data: ChartData, axes: readonly ChartAxisSpec[]): ChartData {
  if (axes.length < 2)
    return data.series.some((series) => series.axis !== undefined)
      ? {
          ...data,
          series: data.series.map(({ axis: _, ...series }) => series),
        }
      : data;
  const list = chartSeriesAxes(data.series, axes);
  return {
    ...data,
    series: data.series.map((series, index) => ({ ...series, axis: list[index] as number })),
  };
}

// --- Scales ------------------------------------------------------------------------------------

/** A value scale: its ticks and where a value goes between two px ends. */
export interface ChartValueScale extends NiceScale {
  /** Base of a logarithmic scale (`undefined`: linear). */
  readonly log?: number | undefined;
}

const logOf = (value: number, base: number) => Math.log(value) / Math.log(base);

/** Where `value` goes between `r0` (the scale's min) and `r1` (its max). `NaN` off a log scale. */
export function scaleValue(scale: ChartValueScale, value: number, r0: number, r1: number): number {
  if (scale.log === undefined) return scaleLinear(value, scale.min, scale.max, r0, r1);
  if (!(value > 0)) return Number.NaN;
  return scaleLinear(
    logOf(value, scale.log),
    logOf(scale.min, scale.log),
    logOf(scale.max, scale.log),
    r0,
    r1,
  );
}

/** Ticks at whole powers of `base` covering `[lo, hi]` (positive values); fixed ends are kept. */
export function logScale(
  lo: number,
  hi: number,
  base: number,
  fixed: { min?: number | undefined; max?: number | undefined } = {},
): ChartValueScale {
  const min0 = fixed.min !== undefined && fixed.min > 0 ? fixed.min : lo > 0 ? lo : 1;
  const max0 = fixed.max !== undefined && fixed.max > min0 ? fixed.max : Math.max(hi, min0);
  const a = Math.floor(logOf(min0, base) + 1e-9);
  let b = Math.ceil(logOf(max0, base) - 1e-9);
  if (b <= a) b = a + 1;
  const min = fixed.min !== undefined && fixed.min > 0 ? fixed.min : base ** a;
  const max = fixed.max !== undefined && fixed.max > min ? fixed.max : base ** b;
  const ticks: number[] = [];
  for (let k = a; k <= b && ticks.length < 60; k++) {
    const tick = Number((base ** k).toPrecision(12));
    if (tick >= min * (1 - 1e-9) && tick <= max * (1 + 1e-9)) ticks.push(tick);
  }
  return { min, max, step: 1, ticks, log: base };
}

/**
 * A linear scale of exactly `count` intervals: the smallest nice step whose whole multiples
 * cover `[lo, hi]` in `count` steps; fixed ends divide the range evenly instead.
 */
export function countScale(
  lo: number,
  hi: number,
  count: number,
  fixed: { min?: number | undefined; max?: number | undefined } = {},
): ChartValueScale {
  const n = Math.max(1, Math.round(count));
  let a = fixed.min ?? lo;
  let b = fixed.max ?? hi;
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    a = 0;
    b = 1;
  }
  if (a > b) [a, b] = [b, a];
  if (a === b) b = a + (a === 0 ? 1 : Math.abs(a));
  const even = (min: number, max: number): ChartValueScale => {
    const step = (max - min) / n;
    const ticks = Array.from({ length: n + 1 }, (_, i) =>
      i === n ? max : Number((min + step * i).toPrecision(12)),
    );
    return { min, max, step, ticks };
  };
  if (fixed.min !== undefined && fixed.max !== undefined) return even(a, b);
  let step = niceStep((b - a) / n);
  for (let tries = 0; tries < 40; tries++) {
    const start = fixed.min !== undefined ? a : Math.floor(a / step + 1e-9) * step;
    const end = start + step * n;
    if (end >= b - step * 1e-9) {
      if (fixed.max !== undefined) return even(start, b);
      const ticks = Array.from({ length: n + 1 }, (_, i) =>
        Number((start + step * i).toPrecision(12)),
      );
      return { min: start, max: end, step, ticks };
    }
    step = niceStep(step * 1.1);
  }
  return even(a, b);
}

/** A value axis' scale: logarithmic, a fixed tick count, or nice ticks about `count` apart. */
export function axisScale(
  lo: number,
  hi: number,
  count: number,
  axis: Pick<ChartAxisSpec, "logarithmic" | "logBase" | "tickAmount"> | undefined,
  fixed: { min?: number | undefined; max?: number | undefined },
): ChartValueScale {
  if (axis?.logarithmic) return logScale(lo, hi, axis.logBase, fixed);
  if (axis?.tickAmount !== undefined) return countScale(lo, hi, axis.tickAmount, fixed);
  return niceScale(lo, hi, count, fixed);
}
