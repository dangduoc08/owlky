# ADR-0055: Data grid range charts, cross-filtering and chart config

**Status:** Accepted (2026-11-10, auto-approved under the roadmap's autorun). Extends ADR-0021
(phase 6 charts integration) and builds on ADR-0054 (chart selection, crossfilter); nothing is
superseded.

## Context
Roadmap 4.18.12 asks for three things MUI X's charts integration doesn't have but ApexGrid, AG Grid
and spreadsheets do: a chart from a cell range (`createRangeChart`, Excel's Alt + F1), a chart
whose category click filters the grid (ApexGrid `chart.crossFilter`), and a chart config that can be
saved and restored (ApexGrid `chart.toJSON()` / `chart.restore()`). The grid already has several
charts (`chartModels`, `activeChartId`), the Chart's selection events (4.18.60) and the
`chartsIntegration` part of `exportState()`. The crossfilter of ADR-0054 links Chart components
through a registry; a grid chart filters rows, not other charts.

## Decision
1. **A range chart is a chart model with `rows`** (the range's row ids). `createRangeChart({
   cellRange?, chartType?, label?, id? })` (apiRef and HTML instance) builds it with core
   `gridRangeChartModel`: categories from the range's first column when it isn't a number column
   (else the rows' positions), series from its number columns, refused (`null`) without a number.
   With several charts it is added (`range-<n>`) and made active; with one chart it replaces that
   chart's model. It draws its rows that pass the filters in sort order, grouping and paging
   aside, so the panel, `exportState` and the type select work on it as on any chart.
2. **User paths:** Alt + F1 on a body cell (core `createGridCellSelection` `onRangeChart`, only with
   `cellSelection`) and a **Chart from selection** button in the chart panel
   (`button[data-ok-data-grid-chart-range]`). Both announce the result in the grid's live region
   (`[data-ok-data-grid-live]`, now rendered with `chartsIntegration` too). HTML fires the
   cancelable `ok:data-grid:chart` (`{ model, id? }`) before adding; the method fires no event.
   The HTML runtime builds the new chart region (`div › figure[data-ok-chart] › table`) and the
   panel's option with DOM methods, and removes regions whose model is gone (also for
   `setChartModels` / `restoreCharts`).
3. **Cross-filtering is the category field's `isAnyOf` filter item.** Model option `crossFilter`
   (panel switch `[data-ok-data-grid-chart-cross-filter]`). The field is the top-level grouping
   field when the chart draws groups, else `dimension`. A selection change (`onDataPointSelection`
   / `ok:chart:select`) replaces that field's `isAnyOf` item (none: removed); the grid's filter
   model and events stay the single source of truth, so the filter panel, header filters and
   `restoreState` see it. The chart draws the rows that pass the *other* filters (every page), so
   its categories don't collapse when it filters; its `selectedDataPoints` are derived from the
   filter (every series' point of the filtered categories), which keeps a filter set elsewhere and
   a refused filter in sync. No new Chart option and no registry: `gridChartOptions` stays the only
   model-to-options mapping.
4. **Range and cross-filtering charts merge rows of one category** (text or group key), aggregated
   with the aggregation model's function (default `sum`), as ApexGrid does; other row charts keep one
   category per row (unchanged).
5. **Config:** `chartsToJSON()` returns the `chartsIntegration` part of `exportState()` as plain
   JSON (`gridChartsState`); `restoreCharts(config)` sanitizes it (`sanitizeGridChartsState`, also
   used by `sanitizeGridState`) and applies it; `restoreState` goes through it.

## Consequences
- Additive (minor): two model keys, three methods, two panel parts, seven locale keys. Existing
  chart snippets gain the cross-filter switch and the live region; their charts draw the same.
- Not provided (spec): series by rows and combination charts, chart windows, filters across grids,
  cross-filtering of pivoted, server-filtered or numeric scatter charts, a range fill handle.
- HTML can't switch between one chart and several charts by restore alone: the panel's Chart
  select is markup of the several-charts mode.
