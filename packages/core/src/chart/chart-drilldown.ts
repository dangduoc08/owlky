import type { ChartActive } from "./chart-active.js";
import type { ChartLayout } from "./chart-layout.js";
import {
  type ChartColor,
  type ChartSeries,
  type ChartType,
  type ChartXType,
  chartDefaultColors,
  chartTypes,
  readChartTable,
} from "./chart-model.js";
import { niceScale } from "./chart-scale.js";

/*
 * Drilldown levels and trellis panels (roadmap 4.18.68, ADR-0060). Pure functions: owners keep the
 * path of level ids (`data-ok-drilldown-path`) or the promoted panel, `renderChart` draws the
 * level at the end of the path.
 */

/** A level a point can open (ApexCharts `drilldown.series` entries). */
export interface ChartDrilldownLevel {
  readonly id: string;
  /** The level's name (the path status; HTML: its table's caption). */
  readonly name?: string | undefined;
  /** Its own chart type (default the chart's). */
  readonly type?: ChartType | undefined;
  readonly categories?: readonly (string | number | Date)[] | undefined;
  readonly series: readonly ChartSeries[];
}

/** Texts of the drilldown and trellis controls (localizable). */
export const chartDrilldownLabels = { drilldownRoot: "All", allPanels: "All panels" } as const;

const MAX_LEVELS = 200;
const MAX_DEPTH = 20;

/** Keeps the valid levels: a unique id and a list of series (at most 200). */
export function chartDrilldownLevels(
  list: readonly ChartDrilldownLevel[] | undefined,
): ChartDrilldownLevel[] {
  const seen = new Set<string>();
  return (list ?? []).slice(0, MAX_LEVELS).flatMap((level) => {
    const id = typeof level?.id === "string" ? level.id.trim().slice(0, 200) : "";
    if (!id || seen.has(id) || !Array.isArray(level.series)) return [];
    seen.add(id);
    return [
      {
        id,
        ...(level.name ? { name: String(level.name).slice(0, 200) } : {}),
        ...(chartTypes.includes(level.type as ChartType) ? { type: level.type } : {}),
        ...(level.categories ? { categories: level.categories } : {}),
        series: level.series,
      },
    ];
  });
}

/** The longest valid start of a path: ids of known levels, at most 20 deep. */
export function chartDrilldownPath(
  levels: readonly ChartDrilldownLevel[],
  path: readonly string[] | undefined,
): string[] {
  const ids = new Set(levels.map((level) => level.id));
  const out: string[] = [];
  for (const id of path ?? []) {
    if (!ids.has(id) || out.length >= MAX_DEPTH) break;
    out.push(id);
  }
  return out;
}

/** The level a click, Enter or Space opens from these marks (the first that names one). */
export function chartDrilldownTarget(
  layout: ChartLayout,
  marks: readonly number[],
): string | undefined {
  for (const index of marks) {
    const id = layout.marks[index]?.drilldown;
    if (id) return id;
  }
  return undefined;
}

/** The level an active item opens (a category: the first of its points with a level). */
export function chartDrilldownActive(
  layout: ChartLayout,
  active: ChartActive | null,
): string | undefined {
  if (!active) return undefined;
  if (active.kind === "mark") return layout.marks[active.mark]?.drilldown;
  return layout.marks.find((mark) => mark.index === active.index && mark.drilldown)?.drilldown;
}

/** Reads the level tables of a chart root (HTML): `table[data-ok-chart-drilldown]` children. */
export function readChartDrilldownTables(
  root: Element,
  xType: ChartXType,
  type: ChartType,
): ChartDrilldownLevel[] {
  const tables = [
    ...root.querySelectorAll<HTMLTableElement>(":scope > table[data-ok-chart-drilldown]"),
  ];
  return chartDrilldownLevels(
    tables.map((table) => {
      const own = table.getAttribute("data-ok-type");
      const levelType = chartTypes.includes(own as ChartType) ? (own as ChartType) : type;
      const read = readChartTable(table, xType, levelType);
      return {
        id: table.getAttribute("data-ok-chart-drilldown") ?? "",
        name: table.caption?.textContent?.trim() || undefined,
        ...(own && levelType !== type ? { type: levelType } : {}),
        ...(read.categories ? { categories: read.categories } : {}),
        series: read.series,
      };
    }),
  );
}

// --- Trellis --------------------------------------------------------------------------------

/** How a trellis splits the data: one panel per series, or per category. */
export const chartTrellisBys = ["series", "category"] as const;
export type ChartTrellisBy = (typeof chartTrellisBys)[number];
/** Value scales of the panels: one shared domain, or each its own. */
export const chartTrellisScales = ["shared", "independent"] as const;
export type ChartTrellisScale = (typeof chartTrellisScales)[number];

export interface ChartTrellisPanel {
  /** The header (a series or category name). */
  readonly title: string;
  readonly series: readonly ChartSeries[];
  readonly categories?: readonly (string | number | Date)[] | undefined;
  /** Shared scales: the domain every panel draws. */
  readonly yMin?: number | undefined;
  readonly yMax?: number | undefined;
}

/** The plain values of a point (numbers or the values of a range); none for gaps. */
const valuesOf = (point: unknown): number[] => {
  const raw = Array.isArray(point)
    ? point[1]
    : point !== null && typeof point === "object"
      ? (point as { y?: unknown }).y
      : point;
  const list = Array.isArray(raw) ? raw : [raw];
  return list.filter(
    (value): value is number => typeof value === "number" && Number.isFinite(value),
  );
};

/**
 * Panels of a trellis (ApexCharts `trellis.by`): one per series (`series`), or one per category
 * (`category`: a series of every series' value there, named by the series). With shared scales
 * every panel gets the same nice value domain, including zero.
 */
export function chartTrellisPanels(input: {
  readonly series: readonly ChartSeries[];
  readonly categories?: readonly (string | number | Date)[] | undefined;
  readonly by?: ChartTrellisBy | undefined;
  readonly scaleY?: ChartTrellisScale | undefined;
  /** Series colors in order (each panel keeps its series' color). */
  readonly colors?: readonly ChartColor[] | undefined;
}): ChartTrellisPanel[] {
  // Each series keeps the color it has in one chart, so panels read like a legend.
  const series = input.series.slice(0, 200).map((entry, index) => ({
    ...entry,
    color:
      entry.color ??
      input.colors?.[index] ??
      (chartDefaultColors[index % chartDefaultColors.length] as ChartColor),
  }));
  const panels: ChartTrellisPanel[] =
    input.by === "category"
      ? (input.categories ?? []).slice(0, 200).map((category, index) => ({
          title: String(category instanceof Date ? category.toISOString().slice(0, 10) : category),
          categories: series.map((entry) => entry.name),
          series: [
            {
              name: String(
                category instanceof Date ? category.toISOString().slice(0, 10) : category,
              ),
              data: series.map((entry) => {
                const point = entry.data[index];
                return point === undefined ? null : (valuesOf(point)[0] ?? null);
              }),
            },
          ],
        }))
      : series.map((entry) => ({
          title: entry.name,
          ...(input.categories ? { categories: input.categories } : {}),
          series: [entry],
        }));
  if (input.scaleY === "independent") return panels;
  const values = panels.flatMap((panel) =>
    panel.series.flatMap((entry) => entry.data.flatMap(valuesOf)),
  );
  if (values.length === 0) return panels;
  const lo = Math.min(0, ...values);
  const hi = Math.max(0, ...values);
  const scale = niceScale(lo, hi > lo ? hi : lo + 1, 5);
  return panels.map((panel) => ({ ...panel, yMin: scale.min, yMax: scale.max }));
}
