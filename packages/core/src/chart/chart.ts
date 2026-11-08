import { type ChartFormat, type ChartFormatOptions, chartFormat } from "./chart-format.js";
import { type ChartLayout, layoutChart } from "./chart-layout.js";
import {
  type ChartColor,
  type ChartCurve,
  type ChartData,
  type ChartFill,
  type ChartLegend,
  type ChartSeries,
  type ChartTableModel,
  type ChartType,
  type ChartXType,
  chartData,
  chartTable,
  isCircularChart,
} from "./chart-model.js";
import { layoutCircular, layoutRadar } from "./chart-polar.js";

/** Everything a chart is drawn from (React props or the HTML root's attributes and table). */
export interface ChartRenderInput extends ChartFormatOptions {
  readonly type?: ChartType | undefined;
  readonly xType?: ChartXType | undefined;
  readonly series: readonly ChartSeries[];
  readonly categories?: readonly (string | number | Date)[] | undefined;
  readonly colors?: readonly ChartColor[] | undefined;
  readonly curve?: ChartCurve | undefined;
  readonly fill?: ChartFill | undefined;
  readonly stacked?: boolean | undefined;
  readonly horizontal?: boolean | undefined;
  readonly markerSize?: number | undefined;
  readonly columnWidth?: number | undefined;
  readonly barHeight?: number | undefined;
  readonly yMin?: number | undefined;
  readonly yMax?: number | undefined;
  readonly yTitle?: string | undefined;
  readonly legend?: ChartLegend | undefined;
  readonly dataLabels?: boolean | undefined;
  readonly startAngle?: number | undefined;
  readonly endAngle?: number | undefined;
  readonly dashArray?: number | undefined;
  readonly trackWidth?: number | undefined;
  readonly total?: number | undefined;
  readonly totalLabel?: string | undefined;
  /** Header of the data table's first column. Default "Category", "Date" or "X". */
  readonly xLabel?: string | undefined;
  /** Indexes of the series hidden through the legend (categories for circular charts). */
  readonly hidden?: readonly number[] | undefined;
  /** SVG size in px. */
  readonly width: number;
  readonly height: number;
  /** Unique per chart (gradient ids). */
  readonly idPrefix: string;
}

export interface ChartLegendItem {
  readonly index: number;
  readonly name: string;
  readonly color: ChartColor;
  readonly hidden: boolean;
}

export interface ChartRender {
  readonly data: ChartData;
  readonly format: ChartFormat;
  readonly layout: ChartLayout;
  /** Legend items, or `null` when no legend is shown (`none`, or a single series). */
  readonly legend: readonly ChartLegendItem[] | null;
  readonly table: ChartTableModel;
}

/** Default SVG width before the chart is measured (server render, first paint). */
export const CHART_DEFAULT_WIDTH = 640;

/** A gradient id prefix from any string (React `useId`, an element id): letters, digits, `-`. */
export const chartIdPrefix = (raw: string): string =>
  `ok-chart-${raw.replace(/[^A-Za-z0-9_-]/g, "")}`;

/** Data, formatters, layout, legend and table for one render. */
export function renderChart(input: ChartRenderInput): ChartRender {
  const data = chartData(input);
  // Radial bars show percentages unless told otherwise.
  const format = chartFormat(data, {
    ...input,
    valueSuffix: input.valueSuffix ?? (data.type === "radialBar" ? "%" : undefined),
  });
  const hidden = new Set(input.hidden ?? []);
  const circular = isCircularChart(data.type);
  const layoutOf =
    data.type === "radar"
      ? (d: ChartData, o: Parameters<typeof layoutChart>[1]) => layoutRadar(d, o, format)
      : circular
        ? (d: ChartData, o: Parameters<typeof layoutChart>[1]) => layoutCircular(d, o, format)
        : layoutChart;
  const layout = layoutOf(data, {
    width: input.width,
    height: input.height,
    format,
    idPrefix: input.idPrefix,
    curve: input.curve,
    fill: input.fill,
    stacked: input.stacked,
    horizontal: input.horizontal,
    markerSize: input.markerSize,
    columnWidth: input.columnWidth,
    barHeight: input.barHeight,
    yMin: input.yMin,
    yMax: input.yMax,
    yTitle: input.yTitle,
    hidden: [...hidden],
    dataLabels: input.dataLabels,
    startAngle: input.startAngle,
    endAngle: input.endAngle,
    dashArray: input.dashArray,
    trackWidth: input.trackWidth,
    total: input.total,
    totalLabel: input.totalLabel,
  });
  // Circular charts list their categories (slices, rings); the others their series.
  const items: ChartLegendItem[] = circular
    ? (data.series[0]?.points ?? []).map((point) => ({
        index: point.x,
        name: format.title(data.categories[point.x] ?? String(point.x + 1)),
        // `chartData` colors every point of a circular chart.
        color: point.color as ChartColor,
        hidden: hidden.has(point.x),
      }))
    : data.series.map((series, index) => ({
        index,
        name: series.name,
        color: series.color,
        hidden: hidden.has(index),
      }));
  const legend = input.legend === "none" || items.length < 2 ? null : items;
  const xLabel =
    input.xLabel ??
    (data.xType === "datetime" ? "Date" : data.xType === "numeric" ? "X" : "Category");
  const table = chartTable(data, {
    xLabel,
    formatX: (x) => format.title(x),
    formatValue: (value, series) => format.value(value, series),
    seriesTypes: data.series.some((series) => series.type !== data.type),
  });
  return { data, format, layout, legend, table };
}
