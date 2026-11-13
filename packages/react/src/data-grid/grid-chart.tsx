"use client";
/*
 * The data grid's charts (ADR-0068 S5): the Chart and its engine load on first use, so a grid
 * without `chartsIntegration` never bundles them. Until the module is in, the grid renders the
 * chart's no-JavaScript state: the root and its data table.
 */
import type { ChartPointInput } from "@owlky/core";
import { useEffect, useState } from "react";
import type { ChartProps } from "../chart/chart.js";

type ChartModule = typeof import("../chart/chart.js");

let chartModule: ChartModule | undefined;
let pending: Promise<ChartModule> | undefined;

/** Starts loading the Chart (once) and resolves when it can render synchronously. */
export function preloadGridChart(): Promise<ChartModule> {
  pending ??= import("../chart/chart.js").then((module) => {
    chartModule = module;
    return module;
  });
  return pending;
}

/** A point's value as table text (the Chart formats it once it loads). */
const pointText = (point: ChartPointInput | undefined): string => {
  const value =
    point === null || point === undefined || typeof point === "number"
      ? point
      : Array.isArray(point)
        ? point[1]
        : (point as { y: unknown }).y;
  return value === null || value === undefined ? "" : String(value);
};

/** The Chart once it has loaded; its root and data table before. */
export function GridChart(props: ChartProps) {
  const [module, setModule] = useState(chartModule);
  // Server renders start the import too, so a second render (snippets) has the Chart.
  if (!module) void preloadGridChart();
  useEffect(() => {
    if (module) return;
    let live = true;
    void preloadGridChart().then((loaded) => {
      if (live) setModule(() => loaded);
    });
    return () => {
      live = false;
    };
  }, [module]);
  if (module) return <module.Chart {...props} />;
  const { id, label, categories = [], series = [] } = props;
  return (
    <figure id={id} data-ok-chart="" data-ok-runtime="off" aria-busy="true">
      <table data-ok-chart-data="">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">Category</th>
            {series.map((one, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: columns are positions (names may repeat).
              <th key={index} scope="col">
                {one.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {categories.map((category, row) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: rows are positions (categories may repeat).
            <tr key={row}>
              <th scope="row">{String(category)}</th>
              {series.map((one, index) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: cells are positions.
                <td key={index}>{pointText(one.data[row])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
