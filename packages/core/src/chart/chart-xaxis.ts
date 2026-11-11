import type { ChartXGroup } from "./chart-layout.js";
import { type ChartData, parseChartNumber } from "./chart-model.js";
import { type ChartZoom, chartZoomExtent, clampChartZoom } from "./chart-zoom.js";

/*
 * The x axis' own options (roadmap 4.18.65): a second row of labels (ApexCharts `xaxis.group`) and a
 * fixed window (`xaxis.min`, `.max`, `.range`). Groups are text attributes on the root (`"6 H1; 6
 * H2"`: the columns, then the title), so React and HTML read the same value.
 */

/** Keeps the valid groups: a title and at least one column (at most 500 groups). */
export function chartXGroups(list: readonly ChartXGroup[] | undefined): ChartXGroup[] {
  return (list ?? []).slice(0, 500).flatMap((entry) => {
    const cols = parseChartNumber(entry?.cols);
    if (cols === null || cols < 1 || !entry.title) return [];
    return [{ title: String(entry.title).slice(0, 200), cols: Math.floor(cols) }];
  });
}

/** Groups as attribute text (the inverse of `parseChartXGroups`). */
export function chartXGroupsText(list: readonly ChartXGroup[] | undefined): string {
  return chartXGroups(list)
    .map((group) => `${group.cols} ${group.title.replace(/[;\s]+/g, " ").trim()}`)
    .join("; ");
}

/** Groups from attribute text: `cols title` entries separated by `;`. */
export function parseChartXGroups(text: string | null | undefined): ChartXGroup[] {
  if (!text || text.length > 4000) return [];
  return chartXGroups(
    text.split(";").map((entry) => {
      const [cols, ...title] = entry.trim().split(/\s+/);
      return { cols: Number(cols), title: title.join(" ") };
    }),
  );
}

/** The title of the group that holds a category, or `undefined`. */
export function chartXGroupAt(groups: readonly ChartXGroup[], index: number): string | undefined {
  let end = 0;
  for (const group of groups) {
    end += group.cols;
    if (index < end) return group.title;
  }
  return undefined;
}

export interface ChartFixedWindowOptions {
  readonly xMin?: number | undefined;
  readonly xMax?: number | undefined;
  readonly xRange?: number | undefined;
}

/**
 * The window a chart shows when nothing has zoomed it. Numeric axes: x values, which may lie beyond
 * the data. Date axes: timestamps in milliseconds, turned into the categories they reach. Category
 * axes: category indexes. `xRange`: the last so many units, ending at `xMax` or the last x value.
 */
export function chartFixedWindow(
  data: ChartData,
  options: ChartFixedWindowOptions,
): ChartZoom | null {
  const { xMin, xMax, xRange } = options;
  if (xMin === undefined && xMax === undefined && xRange === undefined) return null;
  const extent = chartZoomExtent(data);
  if (data.xType === "numeric") {
    const hi = xMax ?? extent?.max;
    const lo = xMin ?? (xRange !== undefined && hi !== undefined ? hi - xRange : extent?.min);
    return lo !== undefined && hi !== undefined && hi > lo ? { min: lo, max: hi } : null;
  }
  if (!extent) return null;
  const times = data.categories as readonly number[];
  const lastTime = times[times.length - 1];
  const dates = data.xType === "datetime" && lastTime !== undefined;
  /** A window end as a category index (date axes: the categories inside the times). */
  const hiIndex =
    xMax === undefined
      ? extent.max
      : dates
        ? times.reduce((best, time, i) => (time <= xMax ? i : best), 0)
        : xMax;
  const loOf = (time: number) => {
    const found = times.findIndex((value) => value >= time);
    return found < 0 ? extent.max : found;
  };
  const loIndex =
    xMin !== undefined
      ? dates
        ? loOf(xMin)
        : xMin
      : xRange !== undefined
        ? dates
          ? loOf((xMax ?? (lastTime as number)) - xRange)
          : hiIndex - xRange
        : extent.min;
  return clampChartZoom({ min: loIndex, max: hiIndex }, extent, "index");
}
