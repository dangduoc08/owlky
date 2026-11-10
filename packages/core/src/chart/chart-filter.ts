import type { ChartLayout, ChartNode } from "./chart-layout.js";
import { fmt, node } from "./chart-layout.js";
import type { ChartData } from "./chart-model.js";
import { slicePath } from "./chart-polar.js";
import { type ChartDataPoint, chartMarkPoint } from "./chart-select.js";
import type { ChartLocaleText } from "./chart-toolbar.js";
import type { ChartZoom } from "./chart-zoom.js";

/*
 * Crossfilter (roadmap 4.18.19, ADR-0054; ApexCharts Premium Linked Views / Highlight Filter):
 * charts of a `group` with `crossfilter` share one filter, a set of category indexes, through the
 * link registry. A chart's own selection or brush sets it; the others draw it as a filter (the
 * other categories lose their values) or a highlight (a tint behind the filtered categories).
 * Owns no state: React and the HTML runtime keep the group's filter they were told about.
 */

export { type ChartCrossfilter, chartCrossfilters } from "./chart-model.js";

/** The group's filter as one member sees it (`null`: none). */
export interface ChartGroupFilter {
  /** Category indexes (category, date and circular charts), ascending. */
  readonly categories: readonly number[];
  /** This chart set it (its own selection or brush): it draws its selection, not the filter. */
  readonly own: boolean;
}

/** Whether a chart's points can name categories (no numeric axes, no Sankey links). */
const categorical = (data: ChartData) => data.xType !== "numeric" && data.type !== "sankey";

/**
 * The categories a selection filters: the unique `dataPointIndex` of its points, ascending;
 * `null` when it is empty or when the chart has no categories (numeric axes, Sankey charts).
 */
export function chartFilterCategories(
  data: ChartData,
  points: readonly ChartDataPoint[],
): number[] | null {
  if (!categorical(data) || points.length === 0) return null;
  return [...new Set(points.map((point) => point.dataPointIndex))].sort((a, b) => a - b);
}

/** The whole categories inside a brush range (`null`: the whole axis, no filter). */
export function chartBrushCategories(range: ChartZoom | null): number[] | null {
  if (!range) return null;
  const from = Math.max(0, Math.ceil(range.min));
  const to = Math.floor(range.max);
  if (to < from) return null;
  return Array.from({ length: Math.min(10_000, to - from + 1) }, (_, i) => from + i);
}

/** A valid filter (untrusted input): whole, non-negative indexes, each once, ascending. */
export function chartFilter(list: readonly number[] | null | undefined): number[] | null {
  if (!list) return null;
  const out = [...new Set(list.slice(0, 10_000).filter((i) => Number.isInteger(i) && i >= 0))].sort(
    (a, b) => a - b,
  );
  return out.length ? out : null;
}

/** Texts of the filter controls (localizable). */
export const chartFilterLabels = {
  clearFilter: "Clear filter",
  filter: "Filter",
  filterCleared: "Filter cleared",
} as const;

/**
 * What the status announces after a filter change made in this chart: `"Filter: Jan, Mar"`
 * (the categories as this chart names them) or `"Filter cleared"`.
 */
export function chartFilterText(
  data: ChartData,
  categories: readonly number[] | null,
  title: (x: string | number) => string,
  text: ChartLocaleText = {},
): string {
  if (!categories?.length) return text.filterCleared ?? chartFilterLabels.filterCleared;
  const names = categories
    .slice(0, 20)
    .map((index) => title(data.categories[index] ?? String(index + 1)));
  const more = categories.length > 20 ? ` (+${categories.length - 20})` : "";
  return `${text.filter ?? chartFilterLabels.filter}: ${names.join(", ")}${more}`;
}

/**
 * `filter` mode: the data drawn when only `categories` keep their values (points of other
 * categories become gaps). Circular charts hide their slices instead (`chartFilterHidden`).
 */
export function filterChartData(data: ChartData, categories: readonly number[]): ChartData {
  if (!categorical(data)) return data;
  const keep = new Set(categories);
  return {
    ...data,
    series: data.series.map((series) => ({
      ...series,
      points: series.points.map((point) => (keep.has(point.x) ? point : { x: point.x, y: null })),
    })),
  };
}

/** `filter` mode on circular charts: the slices (categories) left out. */
export function chartFilterHidden(data: ChartData, categories: readonly number[]): number[] {
  const keep = new Set(categories);
  return (data.series[0]?.points ?? []).map((point) => point.x).filter((x) => !keep.has(x));
}

/**
 * `highlight` mode: a tint behind each filtered category (`g[data-ok-chart-filter-layer]`, drawn
 * under the series): its band (index charts), a halo around its slice (circular charts) or its cells
 * (heatmaps, treemaps). Radar and Sankey charts draw none.
 */
export function chartFilterNodes(
  layout: ChartLayout,
  categories: readonly number[] | null,
): ChartNode[] {
  if (!categories?.length || layout.mode === "flow" || layout.polar) return [];
  const keep = new Set(categories);
  const attrs = { "data-ok-chart-filter-band": "" };
  let shapes: ChartNode[] = [];
  if (layout.mode === "slice") {
    shapes = layout.marks.flatMap((mark) => {
      const arc = mark.arc;
      if (!arc || !keep.has(mark.index)) return [];
      return [
        node("path", {
          d: slicePath(arc.cx, arc.cy, arc.inner, arc.outer + 6, arc.start, arc.end),
          ...attrs,
        }),
      ];
    });
  } else if (layout.mode === "cell") {
    shapes = layout.marks.flatMap((mark) => {
      const cell = mark.cell;
      if (!cell || !keep.has(chartMarkPoint(mark).dataPointIndex)) return [];
      return [
        node("rect", {
          x: fmt(cell.x - 2),
          y: fmt(cell.y - 2),
          width: fmt(cell.width + 4),
          height: fmt(cell.height + 4),
          rx: "4",
          ...attrs,
        }),
      ];
    });
  } else {
    const { plot, band } = layout;
    shapes = layout.slots.flatMap((slot) => {
      if (!keep.has(slot.index)) return [];
      const at = fmt(slot.pos - band / 2);
      return [
        node(
          "rect",
          layout.horizontal
            ? { x: fmt(plot.x), y: at, width: fmt(plot.width), height: fmt(band), ...attrs }
            : { x: at, y: fmt(plot.y), width: fmt(band), height: fmt(plot.height), ...attrs },
        ),
      ];
    });
  }
  return shapes.length ? [node("g", { "data-ok-chart-filter-layer": "" }, shapes)] : [];
}
