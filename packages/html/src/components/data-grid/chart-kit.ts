/*
 * The grid's chart helpers (ADR-0068 S5): the Chart's schema, attribute writers and engine load on
 * first use, so a grid without the charts integration never downloads them. On the CDN they are
 * the chunks of the Chart module, which the bundler merged with its registration: loading them
 * also registers the Chart, which the loader would do anyway (the grid's chart region holds a
 * `[data-ok-chart]` root).
 */
import type {
  chartAttributes,
  chartOptions,
  chartTextAttributes,
  renderChart,
} from "@owlky/core/chart";

export interface GridChartKit {
  readonly chartAttributes: typeof chartAttributes;
  readonly chartOptions: typeof chartOptions;
  readonly chartTextAttributes: typeof chartTextAttributes;
  readonly renderChart: typeof renderChart;
}

let kit: GridChartKit | undefined;
let pending: Promise<GridChartKit> | undefined;

/** The helpers once loaded (`undefined` before: call `loadGridChartKit`). */
export const gridChartKit = (): GridChartKit | undefined => kit;

/** Loads the helpers once; resolves when `gridChartKit()` returns them. */
export function loadGridChartKit(): Promise<GridChartKit> {
  pending ??= import("@owlky/core/chart").then(
    ({ chartAttributes, chartOptions, chartTextAttributes, renderChart }) => {
      kit = { chartAttributes, chartOptions, chartTextAttributes, renderChart };
      return kit;
    },
  );
  return pending;
}
