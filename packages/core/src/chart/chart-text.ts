import type { ChartColorRange } from "./chart-layout.js";
import { type ChartColor, chartColors, parseChartNumber } from "./chart-model.js";

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

/** The root's text attributes for these options (only the ones given). */
export function chartTextAttributes(options: ChartTextOptions): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, attr] of Object.entries(CHART_TEXT_ATTRIBUTES)) {
    const value = options[key as keyof ChartTextOptions];
    if (key === "colorRanges") {
      const text = chartColorRangesText((value as readonly ChartColorRange[] | undefined) ?? []);
      if (text) out[attr] = text;
    } else if (typeof value === "string" && value) out[attr] = value;
  }
  return out;
}
