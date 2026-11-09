/**
 * Gantt time scale (ADR-0048): the zoom (`pixelsPerDay`) picks the two header tiers; the range
 * starts one bottom unit before the first task and ends one after the last.
 */
import { type GanttUnit, ganttUnitLabel, ganttUnitNext, ganttUnitStart } from "./gantt-date.js";

export const ganttViews = ["day", "week", "month", "quarter", "year"] as const;
export type GanttView = (typeof ganttViews)[number];

/** Pixels per day of each named view. */
export const GANTT_VIEW_DENSITY: Readonly<Record<GanttView, number>> = {
  day: 36,
  week: 16,
  month: 5,
  quarter: 1.6,
  year: 0.5,
};
export const GANTT_MIN_DENSITY = 0.25;
export const GANTT_MAX_DENSITY = 120;
/** Zoom buttons multiply or divide the density by this step. */
export const GANTT_ZOOM_STEP = 1.4;

/** A valid density: clamped to the zoom limits; anything else → the view's. */
export function ganttDensity(pixelsPerDay: unknown, view: GanttView = "week"): number {
  const value = Number(pixelsPerDay);
  if (pixelsPerDay === undefined || pixelsPerDay === null || !Number.isFinite(value) || value <= 0)
    return GANTT_VIEW_DENSITY[view];
  return Math.min(GANTT_MAX_DENSITY, Math.max(GANTT_MIN_DENSITY, value));
}

/** The density one zoom step in (`1`) or out (`-1`), rounded to 3 decimals. */
export const ganttZoom = (density: number, direction: 1 | -1): number =>
  Math.round(
    Math.min(
      GANTT_MAX_DENSITY,
      Math.max(
        GANTT_MIN_DENSITY,
        direction > 0 ? density * GANTT_ZOOM_STEP : density / GANTT_ZOOM_STEP,
      ),
    ) * 1000,
  ) / 1000;

/** The header tiers (top, bottom) for a density. */
export function ganttTiers(density: number): readonly [top: GanttUnit, bottom: GanttUnit] {
  if (density >= 24) return ["month", "day"];
  if (density >= 8) return ["month", "week"];
  if (density >= 2.5) return ["year", "month"];
  if (density >= 0.9) return ["year", "quarter"];
  return ["year", "half"];
}

export interface GanttTick {
  readonly start: number;
  readonly end: number;
  /** Offset and width in px. */
  readonly x: number;
  readonly width: number;
  readonly label: string;
}

export interface GanttScale {
  readonly density: number;
  /** First day shown, and the day after the last one. */
  readonly start: number;
  readonly end: number;
  readonly width: number;
  readonly top: readonly GanttTick[];
  readonly bottom: readonly GanttTick[];
  readonly units: readonly [top: GanttUnit, bottom: GanttUnit];
  /** px of a day number. */
  x(day: number): number;
}

export interface GanttScaleOptions {
  readonly density: number;
  readonly weekStart?: number | undefined;
  readonly locale?: string | undefined;
}

const r2 = (value: number) => Math.round(value * 100) / 100;

/** Lays out the scale for a project from `first` to `last` (day after the last day). */
export function ganttScale(first: number, last: number, options: GanttScaleOptions): GanttScale {
  const density = options.density;
  const weekStart = options.weekStart ?? 1;
  const locale = options.locale ?? "en-US";
  const units = ganttTiers(density);
  const [topUnit, bottomUnit] = units;
  // One bottom unit of air on both sides, aligned to the units.
  const start = ganttUnitStart(
    bottomUnit,
    ganttUnitStart(bottomUnit, first, weekStart) - 1,
    weekStart,
  );
  let end = ganttUnitStart(bottomUnit, Math.max(last, first + 1) - 1, weekStart);
  end = ganttUnitNext(bottomUnit, ganttUnitNext(bottomUnit, end));
  const x = (day: number) => r2((day - start) * density);
  const ticks = (unit: GanttUnit, top: boolean): GanttTick[] => {
    const list: GanttTick[] = [];
    for (let at = ganttUnitStart(unit, start, weekStart); at < end; ) {
      const next = ganttUnitNext(unit, at);
      const from = Math.max(at, start);
      const to = Math.min(next, end);
      list.push({
        start: from,
        end: to,
        x: x(from),
        width: r2((to - from) * density),
        label: ganttUnitLabel(unit, at, locale, top),
      });
      at = next;
    }
    return list;
  };
  return {
    density,
    start,
    end,
    width: x(end),
    top: ticks(topUnit, true),
    bottom: ticks(bottomUnit, false),
    units,
    x,
  };
}
