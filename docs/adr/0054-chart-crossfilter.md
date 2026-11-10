# ADR-0054: Chart crossfilter — a group filter in the link registry, filter or highlight per chart

**Status:** Accepted (2026-11-10, auto-approved under the roadmap's autorun). Extends ADR-0031
(linked charts); nothing is superseded.

## Context
Roadmap 4.18.19 asks for ApexCharts Premium's Linked Views / Highlight Filter: a click on a bar
or slice (and the keyboard selection of 4.18.60), or a brush, filters or highlights the other
charts of a `group`. ADR-0031 links charts through a module-scoped registry that shares the active
category and the zoom; neither is a filter: the zoom keeps a window of one axis and is shared by
every member, and the active category is transient. A filter needs state that outlives the gesture,
one owner (whose selection it is), a way to clear it from any chart, and announcements, since the
SVG is `aria-hidden`.

## Decision
1. **Opt in per chart:** `crossfilter: "filter" | "highlight"` (`data-ok-crossfilter`, optional).
   Only charts of a `group` with the option take part, as a source and as a receiver; the value
   says how the chart *shows* the group's filter.
2. **The filter is a set of category indexes** (the dataPointIndex of category, date and circular
   charts), shared by index like the active category of ADR-0031. Sources: a chart's own selection
   changed by the user (click, Enter, Space: the unique categories of its selected points; numeric
   axes and Sankey charts are no sources), and a brush chart's own brush (the whole categories in
   its range; the whole axis clears).
3. **One filter per group, kept in the registry** with its source. A new filter replaces it; a
   source that empties its selection clears only its own filter; a source that leaves (unmount,
   `destroy`) takes its filter with it; a chart that joins late receives the current one. Members
   are told `{ categories, own }` or `null`; `own` marks the source, which keeps drawing its
   selection, not the filter.
4. **Showing it:** `filter` draws the receiver as if the other categories had no values (circular
   charts hide their slices); its legend, table, categories and keyboard slots stay (the value axis
   fits the values left), so the accessible view keeps every value. `highlight` draws a tint
   behind the filtered categories (`g[data-ok-chart-filter-layer] › [data-ok-chart-filter-band]`:
   bands, slice halos or cells) under the series. Both are computed by core `renderChart` (`filter`
   input), so React and HTML draw the same nodes; radar, Sankey and numeric-axis charts ignore filters.
5. **A Clear control and a polite status on every participant:** `div[data-ok-chart-filter]` after
   the plot holds `button[data-ok-chart-filter-clear]` ("Clear filter", `hidden` while the group has
   no filter) and a visually hidden `span[data-ok-chart-filter-status][role=status]`. Clearing from
   any chart clears the group and the source's selection (reported like a user's clear). Only the
   chart the user acted on announces ("Filter: Jan, Mar", "Filter cleared"), so one action is
   announced once. Texts are localizable (`clearFilter`, `filter`, `filterCleared`).
6. **Events:** HTML `ok:chart:filter` (detail `{ categories, own }`), React `onFilterChange`,
   instance `filter` and `clearFilter()`; ApexCharts' `crossFilter` / `filterChange` /
   `highlightFilterChanged` map to them. Groups stay per library copy (React with React, HTML with
   HTML), as in ADR-0031.

## Consequences
- Additive (minor): one option, a control group, an event, two instance members; charts without
  `crossfilter` render as before (no filter controls).
- Filters match by category position: charts of a group must share their categories' order.
- A chart that is both a source and a receiver shows another source's filter while keeping its
  own selection outline; only the latest filter applies.
- Range filters on numeric axes, filters across value ranges (Highlight Filter's value bins) and
  persistence of filters are not provided (recorded in the spec as deferred).
