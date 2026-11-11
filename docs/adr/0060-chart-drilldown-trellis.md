# ADR-0060: Chart: drilldown levels and trellis small multiples

**Status:** Accepted (2026-11-11, auto-approved under the owner's standing instruction). Extends
ADR-0024, ADR-0031 and ADR-0058; nothing earlier is superseded.

## Context
Roadmap 4.18.68 (could) asks for two ApexCharts v8 features. **Drilldown**
(`apexcharts/features/drilldown`): a data point names a child level (`drilldown: "id"`) listed in
`drilldown.series`; a click opens it, a breadcrumb leads back, and `drillDown(id)`, `drillUp()`,
`drillToRoot()` drive it. **Trellis** (`apexcharts/features/trellis`): `ApexCharts.trellis(el,
options)` splits one data set into small multiples (`trellis.by`), on shared scales by default, in
a grid of `columns` with headers; `promote` lets a header expand one panel with an "All panels" way
back. The sunburst and icicle drill of ADR-0058 already has a **Back** control and a polite path
status (`div[data-ok-chart-drill]`). The Chart contract stays: React and HTML draw the same node
tree from `renderChart`, the HTML data is a `<table>`, strict CSP, no `innerHTML`, no new runtime
dependency, WCAG 2.2 AA.

## Decision
1. **Drilldown levels are data next to the series.** A point may name a level: `{ y, drilldown:
   "id" }` (HTML `td[data-ok-drilldown="id"]`). Levels are React `drilldown: { id, name?, type?,
   categories?, series }[]` and, in HTML, more tables after the chart's own:
   `table[data-ok-chart-drilldown="id"]` (the caption is the name, `data-ok-type` its type), read by
   the same `readChartTable`. React renders the same tables, so every level stays in the accessible
   view, visually hidden like the main table. Levels may name deeper levels. Core
   `chartDrilldownLevels` validates them (unique ids, at most 200 levels and 20 deep).
2. **The state is a path of level ids**, `data-ok-drilldown-path` on the root (`"q1; jan"`, written by
   React and the runtime; authors may set it), React `drilldownPath` (controlled) /
   `defaultDrilldownPath` / `onDrilldownChange(path)`. `renderChart` draws the last level of the
   path (an invalid tail is dropped) with the chart's options, its own `type` when it has one, no
   zoom and no selection; the main data table is always the root's.
3. **The controls are the ADR-0058 drill row**: `div[data-ok-chart-drill]` with **Back**
   (`[data-ok-chart-drill-up]`, hidden at the root) and the path status (`"All › Q1 › January"`;
   `localeText.drilldownRoot`, default "All", ApexCharts' `breadcrumb.rootLabel`). A click on a point
   with a level, or Enter / Space on the active item (the first of its points that has one), drills
   down instead of selecting; Escape and **Back** go up one level; at the root **Back** hides and the
   focus moves to the plot. HTML `ok:chart:drilldown` (cancelable, before the change, detail `{ id,
   path }`, `id` `null` for the root) and instance `drilldownPath`, `drillDown(id)`, `drillUp()`,
   `drillToRoot()` (no events). Asynchronous levels (`onDrillDown` resolvers), `clearDrilldownCache`
   and breadcrumb styling are not built: levels are data, and HTML has no function to resolve.
4. **Trellis is a container of charts, not a chart type.** React `ChartTrellis` takes the data and
   the chart options once and renders one `Chart` per series (`by="series"`) or per category
   (`by="category"`, one series of every series' value at it), each under a header in a CSS grid:
   `div[data-ok-chart-trellis][role=group][aria-label]` › `div[data-ok-chart-trellis-panel]` ›
   (`div | button[data-ok-chart-trellis-header]` + the chart's `figure`). `scaleY="shared"` (the
   default, ApexCharts `scales.y`) gives every panel the same nice value domain (core
   `chartTrellisPanels`), so a taller shape is a bigger number; `independent` lets each fit itself.
   `columns` (1 to 6, `data-ok-columns`) fixes the grid, else panels fill rows at least 220px wide;
   the gap is a token (12px), not an option. HTML authors write the panels (the snippet generator
   writes them from React's model), so no runtime computes the scales.
5. **Promote** (`promote`, `data-ok-promote`): headers become buttons (`aria-expanded`); pressing one
   shows that panel alone across the grid and an **All panels** button
   (`[data-ok-chart-trellis-back]`, `localeText.allPanels`) brings the others back. React
   `promoted` / `defaultPromoted` / `onPromotedChange(index)`; HTML runtime `chart-trellis`
   (`ok:chart-trellis:promote`, cancelable, detail `{ index }`; instance `promoted`,
   `promotePanel(index)`, `restorePanels()`). Panels that aren't shown are `hidden`, so their charts
   leave the tab order and the accessibility tree.

## Consequences
- Drill levels and panels are plain data in both frameworks; parity compares them like any story.
- Level tables add markup in proportion to the data; very large drill trees belong on the server.
- Not built: trellis `row` / `column` grids, `by` as a function, `scales.x: "independent"` (panels
  share the categories), virtualization, `emptyPanels`, shared legends and toolbars, linked zoom
  (use `group`), `getPanels` / `getPanel` (the panels are the container's children).
