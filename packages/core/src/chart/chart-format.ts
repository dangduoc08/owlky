import { type ChartData, type ChartPart, chartPartLabels } from "./chart-model.js";
import {
  chartMonthNames,
  type DateLabel,
  type DateUnit,
  dateAxisLabel,
  dateTooltipLabel,
  dateUnit,
} from "./chart-scale.js";
import { type TimeUnit, timeTickLabel, timeUnit, timeValueLabel } from "./chart-time.js";

/** How a chart prints numbers and x values (built once per render by `chartFormat`). */
export interface ChartFormat {
  readonly dateUnit: DateUnit;
  /** A plain number in the chart's locale (no prefix, suffix or formatter). */
  number(value: number): string;
  /** A value in the tooltip and the data table. */
  value(value: number, series: number): string;
  /** A value-axis tick (`decimals` from the tick step). */
  tick(value: number, decimals: number): string;
  /** An x-axis label: a category, a date or a number. */
  axis(x: string | number, decimals?: number): DateLabel;
  /** The tooltip title and the data table's row header. */
  title(x: string | number): string;
  /** The label of a part of a point ("Minimum", "Open"; localized through `partLabels`). */
  part(part: ChartPart): string;
  /** A value printed on the chart: `dataLabelFormatter`, else `fallback` (the value's text). */
  dataLabel(value: number, series: number, index: number, fallback: string): string;
  /** Timelines: the unit of their time axis and a tick's label. */
  readonly timeUnit: TimeUnit;
  timeTick(time: number): { text: string; major: boolean };
}

export interface ChartFormatOptions {
  /** BCP 47 locale for numbers and month names. Default `"en-US"`. */
  readonly locale?: string | undefined;
  /** Text before every value ("$"). */
  readonly valuePrefix?: string | undefined;
  /** Text after every value ("%", " points"). */
  readonly valueSuffix?: string | undefined;
  /** Replaces the value text (tooltip, table and value axis). */
  readonly valueFormatter?: ((value: number, series: number) => string) | undefined;
  /** Replaces the x text (axis labels, tooltip title and table). */
  readonly labelFormatter?: ((x: string | number) => string) | undefined;
  /**
   * Replaces the values printed on the chart (`index`: the category or point; pie and donut
   * labels get the percentage).
   */
  readonly dataLabelFormatter?:
    | ((value: number, series: number, index: number) => string)
    | undefined;
  /** Labels of the parts of a point (table headers, tooltip rows): "Minimum", "Q1"… */
  readonly partLabels?: Readonly<Partial<Record<ChartPart, string>>> | undefined;
}

const numberFormat = (locale: string, options: Intl.NumberFormatOptions) => {
  try {
    return new Intl.NumberFormat(locale, options);
  } catch {
    return new Intl.NumberFormat("en-US", options);
  }
};

/** Formatters for one chart. Formatter results are text (written with `textContent`). */
export function chartFormat(data: ChartData, options: ChartFormatOptions = {}): ChartFormat {
  const locale = options.locale ?? "en-US";
  const prefix = options.valuePrefix ?? "";
  const suffix = options.valueSuffix ?? "";
  const values = numberFormat(locale, { maximumFractionDigits: 2 });
  const tickFormats = new Map<number, Intl.NumberFormat>();
  const months = data.xType === "datetime" ? chartMonthNames(locale) : [];
  const unit = dateUnit(data.xType === "datetime" ? (data.categories as number[]) : []);
  const custom = options.valueFormatter;
  const label = options.labelFormatter;
  const safe = (text: unknown) => (typeof text === "string" ? text : String(text ?? ""));
  // Timelines: values are dates; their unit follows the span of the data.
  const timeline = data.type === "timeline";
  const times = timeline
    ? data.series.flatMap((series) => series.points.flatMap((point) => point.range ?? []))
    : [];
  const tUnit = times.length ? timeUnit(Math.min(...times), Math.max(...times)) : "day";
  const timeMonths = timeline ? chartMonthNames(locale) : [];
  const labelOf = options.dataLabelFormatter;
  return {
    dateUnit: unit,
    timeUnit: tUnit,
    number: (value) => values.format(value),
    value: (value, series) =>
      custom
        ? safe(custom(value, series))
        : timeline
          ? timeValueLabel(value, tUnit, timeMonths)
          : data.series[series]?.pane
            ? // Stock panes (ADR-0047): oscillators and volumes are plain numbers.
              values.format(value)
            : `${prefix}${values.format(value)}${suffix}`,
    part: (part) => options.partLabels?.[part] ?? chartPartLabels[part],
    dataLabel: (value, series, index, fallback) =>
      labelOf ? safe(labelOf(value, series, index)) : fallback,
    timeTick: (time) => timeTickLabel(time, tUnit, timeMonths),
    tick: (value, decimals) => {
      if (custom) return safe(custom(value, -1));
      let format = tickFormats.get(decimals);
      if (!format) {
        format = numberFormat(locale, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
          useGrouping: false,
        });
        tickFormats.set(decimals, format);
      }
      return `${prefix}${format.format(value === 0 ? 0 : value)}${suffix}`;
    },
    axis: (x, decimals = 0) => {
      if (label) return { text: safe(label(x)), major: false };
      if (data.xType === "datetime") return dateAxisLabel(x as number, unit, months);
      if (data.xType === "numeric") {
        return {
          text: numberFormat(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
            useGrouping: false,
          }).format(x as number),
          major: false,
        };
      }
      return { text: String(x), major: false };
    },
    title: (x) => {
      if (label) return safe(label(x));
      if (data.xType === "datetime") return dateTooltipLabel(x as number, unit, months);
      if (data.xType === "numeric") return values.format(x as number);
      return String(x);
    },
  };
}
