/*
 * Chart scales (ADR-0024): nice ticks, linear mapping and the UTC calendar helpers used by
 * datetime axes. Pure functions: the same input gives the same output on the server, in React
 * and in the HTML runtime, so both implementations draw identical SVG.
 */

export interface NiceScale {
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly ticks: readonly number[];
}

/** The nice step closest to `raw`: 1, 2, 2.5 or 5 times a power of ten. */
export function niceStep(raw: number): number {
  if (!(raw > 0) || !Number.isFinite(raw)) return 1;
  const power = 10 ** Math.floor(Math.log10(raw));
  const fraction = raw / power;
  const nice =
    fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10;
  return nice * power;
}

/** Removes floating point noise (0.1 + 0.2) from tick values. */
const clean = (value: number, step: number) => {
  const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 2);
  return Number(value.toFixed(Math.min(decimals, 12)));
};

/**
 * Ticks covering `[min, max]` with about `count` intervals. The scale widens to whole steps.
 * Fixed ends (`fixedMin` / `fixedMax`) are kept as given.
 */
export function niceScale(
  min: number,
  max: number,
  count: number,
  fixed: { min?: number | undefined; max?: number | undefined } = {},
): NiceScale {
  let lo = fixed.min ?? min;
  let hi = fixed.max ?? max;
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
    lo = 0;
    hi = 1;
  }
  if (lo > hi) [lo, hi] = [hi, lo];
  if (lo === hi) {
    const pad = lo === 0 ? 1 : Math.abs(lo) * 0.5;
    if (fixed.min === undefined) lo -= lo === 0 ? 0 : pad;
    if (fixed.max === undefined) hi += pad;
  }
  const step = niceStep((hi - lo) / Math.max(1, Math.round(count)));
  const start = fixed.min !== undefined ? lo : Math.floor(lo / step + 1e-9) * step;
  const end = fixed.max !== undefined ? hi : Math.ceil(hi / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let value = start, i = 0; value <= end + step * 1e-6 && i < 1000; i++) {
    ticks.push(clean(value, step));
    value = start + step * (i + 1);
  }
  if (fixed.max !== undefined && ticks[ticks.length - 1] !== end) ticks.push(end);
  return { min: start, max: end, step, ticks };
}

/** Maps `value` from `[d0, d1]` to `[r0, r1]` (a flat domain maps to the middle). */
export function scaleLinear(value: number, d0: number, d1: number, r0: number, r1: number): number {
  if (d1 === d0) return (r0 + r1) / 2;
  return r0 + ((value - d0) / (d1 - d0)) * (r1 - r0);
}

/** Decimals needed to print every tick of a step without noise (0.25 → 2, 50 → 0). */
export function stepDecimals(step: number): number {
  if (!(step > 0) || !Number.isFinite(step)) return 0;
  for (let decimals = 0; decimals < 10; decimals++) {
    if (Math.abs(Math.round(step * 10 ** decimals) - step * 10 ** decimals) < 1e-6) return decimals;
  }
  return 10;
}

// --- Dates (UTC, so the server and every browser agree) ----------------------------------------

/** A timestamp from a `Date`, a number (ms) or an ISO 8601 string; `undefined` when invalid. */
export function toTimestamp(value: unknown): number | undefined {
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : undefined;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (
    typeof value === "string" &&
    value.length <= 40 &&
    /^\d{4}-\d{2}(-\d{2})?([T ][\d:.]+Z?)?$/.test(value.trim())
  ) {
    const text = value.trim();
    const iso = /^\d{4}-\d{2}$/.test(text) ? `${text}-01` : text;
    const time = Date.parse(
      iso.length === 10 ? `${iso}T00:00:00Z` : iso.endsWith("Z") ? iso : `${iso}Z`,
    );
    return Number.isFinite(time) ? time : undefined;
  }
  return undefined;
}

export type DateUnit = "day" | "month" | "year";

const DAY = 86_400_000;

/** The calendar unit that best describes the spacing of sorted timestamps. */
export function dateUnit(times: readonly number[]): DateUnit {
  const gaps: number[] = [];
  for (let i = 1; i < times.length; i++)
    gaps.push(Math.abs((times[i] as number) - (times[i - 1] as number)));
  if (gaps.length === 0) return "day";
  gaps.sort((a, b) => a - b);
  const median = gaps[Math.floor(gaps.length / 2)] as number;
  return median >= 360 * DAY ? "year" : median >= 27 * DAY ? "month" : "day";
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Month names of `locale` (short, UTC); English when `Intl` doesn't know the locale. */
export function chartMonthNames(locale = "en-US"): readonly string[] {
  try {
    const format = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" });
    return MONTHS.map((_, month) => format.format(Date.UTC(2000, month, 1)));
  } catch {
    return MONTHS;
  }
}

/** Index of a timestamp's unit since 1970, used to pick evenly spaced labels (every 6 months). */
export function unitIndex(time: number, unit: DateUnit): number {
  const date = new Date(time);
  if (unit === "day") return Math.floor(time / DAY);
  if (unit === "month") return date.getUTCFullYear() * 12 + date.getUTCMonth();
  return date.getUTCFullYear();
}

export interface DateLabel {
  readonly text: string;
  /** A boundary of the next unit up (a new year, a new month): drawn bolder. */
  readonly major: boolean;
}

/** Axis label of a timestamp: "2012" at a new year, "Jul '11" for months, "02 Jan" for days. */
export function dateAxisLabel(time: number, unit: DateUnit, months: readonly string[]): DateLabel {
  const date = new Date(time);
  const year = date.getUTCFullYear();
  const month = months[date.getUTCMonth()] as string;
  const yy = String(year % 100).padStart(2, "0");
  if (unit === "year") return { text: String(year), major: false };
  if (unit === "month") {
    return date.getUTCMonth() === 0
      ? { text: String(year), major: true }
      : { text: `${month} '${yy}`, major: false };
  }
  return date.getUTCDate() === 1
    ? { text: `${month} '${yy}`, major: true }
    : { text: `${String(date.getUTCDate()).padStart(2, "0")} ${month}`, major: false };
}

/** Tooltip title of a timestamp: "Jan 2012", or "02 Jan 2012" for daily data. */
export function dateTooltipLabel(time: number, unit: DateUnit, months: readonly string[]): string {
  const date = new Date(time);
  const month = months[date.getUTCMonth()] as string;
  if (unit === "year") return String(date.getUTCFullYear());
  if (unit === "month") return `${month} ${date.getUTCFullYear()}`;
  return `${String(date.getUTCDate()).padStart(2, "0")} ${month} ${date.getUTCFullYear()}`;
}
