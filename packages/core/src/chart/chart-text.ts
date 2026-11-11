import { type ChartYAxis, chartYAxesText } from "./chart-axes.js";
import { type ChartDiscreteMarker, chartDiscreteMarkersText } from "./chart-cues.js";
import { type ChartIndicator, chartIndicatorsText } from "./chart-indicators.js";
import type { ChartColorRange } from "./chart-layout.js";
import {
  type ChartColor,
  type ChartStripeColor,
  chartColors,
  parseChartNumber,
} from "./chart-model.js";

/*
 * Text attributes of a chart root (written by React and read by the HTML runtime): texts that
 * aren't option-schema values (titles, affixes, the locale), the links of phase 4 (`group`,
 * `brushTarget`) and heatmap color ranges. Always text: never markup, never a selector.
 */

export interface ChartTextOptions {
  readonly yTitle?: string | undefined;
  readonly totalLabel?: string | undefined;
  readonly valuePrefix?: string | undefined;
  readonly valueSuffix?: string | undefined;
  readonly locale?: string | undefined;
  /** Synchronized charts: the group's name. */
  readonly group?: string | undefined;
  /** Brush charts: the id of the chart they zoom. */
  readonly brushTarget?: string | undefined;
  readonly colorRanges?: readonly ChartColorRange[] | undefined;
  /** Sankey charts: a title per rank (`"Income; Budget; Spending"`). */
  readonly axisTitles?: readonly string[] | undefined;
  /** Stock charts: indicators (`"sma 20; rsi 14"`, ADR-0047). */
  readonly indicators?: readonly ChartIndicator[] | undefined;
  /** Value axes (`"min 0 title Sales; opposite logarithmic title Visits"`, 4.18.59). */
  readonly yaxis?: ChartYAxis | readonly ChartYAxis[] | undefined;
  /** The x axis title. */
  readonly xTitle?: string | undefined;
  /** Bars: track colors (`"info-lighter warning-lighter"`, 4.18.61). */
  readonly backgroundBarColors?: readonly ChartColor[] | undefined;
  /** Markers on single points (`"0 3 error square 6; 1 2"`, 4.18.62). */
  readonly discreteMarkers?: readonly ChartDiscreteMarker[] | undefined;
  /** Legend names (`"Income; Spending"`, 4.18.64). */
  readonly customLegendItems?: readonly string[] | undefined;
  /** Grid stripes (`"grey transparent"`, 4.18.64). */
  readonly gridRowColors?: readonly ChartStripeColor[] | undefined;
  readonly gridColumnColors?: readonly ChartStripeColor[] | undefined;
  /** Dumbbell markers: a start and an end color per series (`"info success; warning error"`, 4.18.21). */
  readonly dumbbellColors?: readonly (readonly ChartColor[])[] | undefined;
  /** Tree charts: ids of the collapsed nodes (`"Sales; Support"`, ADR-0058). */
  readonly collapsedNodes?: readonly string[] | undefined;
  /** Written only for geo charts, whose table has no color column. */
  readonly type?: string | undefined;
  /** Geo charts: the class ramp (`"info"`, or several colors), read back as `colors`. */
  readonly colors?: readonly ChartColor[] | undefined;
  /** Geo charts: the feature property that holds the region id (ADR-0059). */
  readonly joinBy?: string | undefined;
  /** Geo charts, `threshold` method: the class breaks (`"10; 20; 40"`). */
  readonly scaleThresholds?: readonly number[] | undefined;
  /** Sunburst and icicle charts: the id of the node zoomed into (ADR-0058). */
  readonly drillNode?: string | null | undefined;
}

export const CHART_TEXT_ATTRIBUTES = {
  yTitle: "data-ok-y-title",
  totalLabel: "data-ok-total-label",
  valuePrefix: "data-ok-value-prefix",
  valueSuffix: "data-ok-value-suffix",
  locale: "data-ok-locale",
  group: "data-ok-group",
  brushTarget: "data-ok-brush-target",
  colorRanges: "data-ok-color-ranges",
  axisTitles: "data-ok-axis-titles",
  colors: "data-ok-colors",
  joinBy: "data-ok-join-by",
  scaleThresholds: "data-ok-scale-thresholds",
  indicators: "data-ok-indicators",
  yaxis: "data-ok-yaxis",
  xTitle: "data-ok-x-title",
  backgroundBarColors: "data-ok-background-bar-colors",
  discreteMarkers: "data-ok-discrete-markers",
  customLegendItems: "data-ok-custom-legend-items",
  gridRowColors: "data-ok-grid-row-colors",
  gridColumnColors: "data-ok-grid-column-colors",
  dumbbellColors: "data-ok-dumbbell-colors",
  collapsedNodes: "data-ok-collapsed-nodes",
  drillNode: "data-ok-drill-node",
} as const;

const isColor = (value: unknown): value is ChartColor => chartColors.includes(value as ChartColor);

/**
 * Color ranges from text: `from to color [name]` groups separated by `;`, for example
 * `"-30 0 info Cold; 0 20 success; 20 50 error Hot"`. Invalid groups are dropped.
 */
export function parseChartColorRanges(text: string | null | undefined): ChartColorRange[] {
  if (!text || text.length > 2000) return [];
  return text.split(";").flatMap((group): ChartColorRange[] => {
    const [from, to, color, ...name] = group.trim().split(/\s+/);
    const a = parseChartNumber(from);
    const b = parseChartNumber(to);
    if (a === null || b === null || !isColor(color)) return [];
    const label = name.join(" ");
    return [{ from: Math.min(a, b), to: Math.max(a, b), color, ...(label ? { name: label } : {}) }];
  });
}

/** Color ranges as attribute text (the inverse of `parseChartColorRanges`). */
export function chartColorRangesText(ranges: readonly ChartColorRange[]): string {
  return ranges
    .flatMap((range) => {
      const from = parseChartNumber(range.from);
      const to = parseChartNumber(range.to);
      if (from === null || to === null || !isColor(range.color)) return [];
      const name = range.name
        ? ` ${String(range.name)
            .replace(/[;\s]+/g, " ")
            .trim()}`
        : "";
      return [`${from} ${to} ${range.color}${name}`];
    })
    .join("; ");
}

/** Palette colors from text separated by spaces (`"info warning-light"`); others are dropped. */
export function parseChartColors(text: string | null | undefined): ChartColor[] {
  if (!text || text.length > 2000) return [];
  return text.trim().split(/\s+/).filter(isColor).slice(0, 100);
}

const isStripe = (value: unknown): value is ChartStripeColor =>
  value === "grey" || value === "transparent" || isColor(value);

/** Stripe colors from text separated by spaces (palette names, `grey`, `transparent`). */
export function parseChartStripeColors(text: string | null | undefined): ChartStripeColor[] {
  if (!text || text.length > 2000) return [];
  return text.trim().split(/\s+/).filter(isStripe).slice(0, 100);
}

/**
 * Dumbbell colors from text: one pair per series separated by `;`, each a start and an end color
 * (`"info success; warning error"`); a single color colors both ends. Invalid colors are dropped.
 */
export function parseChartDumbbellColors(text: string | null | undefined): ChartColor[][] {
  if (!text || text.length > 2000) return [];
  return text
    .split(";")
    .slice(0, 100)
    .flatMap((group) => {
      const [start, end = start] = group.trim().split(/\s+/).filter(isColor);
      return start && end ? [[start, end]] : [];
    });
}

/** Dumbbell colors as attribute text (the inverse of `parseChartDumbbellColors`). */
export function chartDumbbellColorsText(pairs: readonly (readonly ChartColor[])[]): string {
  return pairs
    .map((pair) => pair.filter(isColor).slice(0, 2).join(" "))
    .filter(Boolean)
    .join("; ");
}

/** A list as attribute text: items separated by `; ` (a `;` inside an item becomes a space). */
export function chartListText(items: readonly string[]): string {
  return items
    .map((item) =>
      String(item)
        .replace(/[;\s]+/g, " ")
        .trim(),
    )
    .join("; ");
}

/** A list from attribute text (`chartListText`); at most 2000 characters and 100 items. */
export function parseChartList(text: string | null | undefined): string[] {
  if (!text || text.length > 2000) return [];
  return text
    .split(";")
    .slice(0, 100)
    .map((item) => item.trim());
}

/** The root's text attributes for these options (only the ones given). */
export function chartTextAttributes(options: ChartTextOptions): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, attr] of Object.entries(CHART_TEXT_ATTRIBUTES)) {
    const value = options[key as keyof ChartTextOptions];
    if (key === "colors") {
      const text =
        options.type === "geo"
          ? ((value as readonly ChartColor[] | undefined) ?? []).join(" ")
          : "";
      if (text) out[attr] = text;
      continue;
    }
    if (key === "yaxis") {
      const text = chartYAxesText(value as ChartYAxis | readonly ChartYAxis[] | undefined);
      if (text) out[attr] = text;
    } else if (key === "indicators") {
      const text = chartIndicatorsText((value as readonly ChartIndicator[] | undefined) ?? []);
      if (text) out[attr] = text;
    } else if (key === "scaleThresholds") {
      const text = ((value as readonly number[] | undefined) ?? [])
        .filter((item) => Number.isFinite(item))
        .join("; ");
      if (text) out[attr] = text;
    } else if (key === "axisTitles") {
      const text = chartListText((value as readonly string[] | undefined) ?? []);
      if (text) out[attr] = text;
    } else if (key === "gridRowColors" || key === "gridColumnColors") {
      const text = ((value as readonly ChartStripeColor[] | undefined) ?? [])
        .filter(isStripe)
        .join(" ");
      if (text) out[attr] = text;
    } else if (key === "dumbbellColors") {
      const text = chartDumbbellColorsText(
        (value as readonly (readonly ChartColor[])[] | undefined) ?? [],
      );
      if (text) out[attr] = text;
    } else if (key === "customLegendItems" || key === "collapsedNodes") {
      const text = chartListText((value as readonly string[] | undefined) ?? []);
      if (text) out[attr] = text;
    } else if (key === "discreteMarkers") {
      const text = chartDiscreteMarkersText(value as readonly ChartDiscreteMarker[] | undefined);
      if (text) out[attr] = text;
    } else if (key === "backgroundBarColors") {
      const text = ((value as readonly ChartColor[] | undefined) ?? []).filter(isColor).join(" ");
      if (text) out[attr] = text;
    } else if (key === "colorRanges") {
      const text = chartColorRangesText((value as readonly ChartColorRange[] | undefined) ?? []);
      if (text) out[attr] = text;
    } else if (typeof value === "string" && value) out[attr] = value;
  }
  return out;
}
