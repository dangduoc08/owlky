/*
 * The grid's chart helpers (ADR-0068 S5): the Chart's schema, attribute writers and engine load on
 * first use, so a grid without the charts integration never downloads them. On the CDN they are
 * the chunks of the Chart module, which the bundler merged with its registration: loading them
 * also registers the Chart, which the loader would do anyway (the grid's chart region holds a
 * `[data-ok-chart]` root).
 *
 * The Chart's stylesheet (ADR-0068 S4) is not part of the grid's: the loader attaches
 * `modules/chart.css` with the Chart module, so the kit is ready only once `runtime.load("chart")`
 * has finished, and the grid never draws a chart before its CSS. Without a loader (npm, tests
 * that register every component) that load rejects or resolves at once and the grid goes on.
 */

import type {
  chartAttributes,
  chartOptions,
  chartTextAttributes,
  renderChart,
} from "@owlky/core/chart";
import type { Runtime } from "../../runtime/types.js";

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
export function loadGridChartKit(runtime?: Runtime): Promise<GridChartKit> {
  const sheet = runtime?.load("chart").catch(() => {});
  pending ??= import("@owlky/core/chart").then(
    async ({ chartAttributes, chartOptions, chartTextAttributes, renderChart }) => {
      await sheet;
      kit = { chartAttributes, chartOptions, chartTextAttributes, renderChart };
      return kit;
    },
  );
  return pending;
}
