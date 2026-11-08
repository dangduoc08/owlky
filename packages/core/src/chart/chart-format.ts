import type { ChartData } from "./chart-model.js";
import {
  chartMonthNames,
  type DateLabel,
  type DateUnit,
  dateAxisLabel,
  dateTooltipLabel,
  dateUnit,
} from "./chart-scale.js";

/** How a chart prints numbers and x values (built once per render by `chartFormat`). */
export interface ChartFormat {
  readonly dateUnit: DateUnit;
  /** A value in the tooltip and the data table. */
  value(value: number, series: number): string;
  /** A value-axis tick (`decimals` from the tick step). */
  tick(value: number, decimals: number): string;
  /** An x-axis label: a category, a date or a number. */
  axis(x: string | number, decimals?: number): DateLabel;
  /** The tooltip title and the data table's row header. */
  title(x: string | number): string;
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
  return {
    dateUnit: unit,
    value: (value, series) =>
      custom ? safe(custom(value, series)) : `${prefix}${values.format(value)}${suffix}`,
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
