# ADR-0029: Chart phase 3 — several values per point, cell charts, sparklines and live updates

**Status:** Accepted (2026-11-08, auto-approved under `/component`). Extends ADR-0024 and ADR-0027;
nothing earlier is superseded.

## Context
Phase 3 of ADR-0027 adds box plots, heatmaps and treemaps (the reference), bubbles, range areas,
funnels / pyramids and slopes (ApexCharts types beyond it), sparklines, and a JavaScript data API.
The owner builds a developer-tools dashboard with live data: updates must be cheap and the data
table (the accessible view, and the HTML source) must stay in sync. Until now every point had one
value, the HTML runtime rebuilt the whole SVG on every draw, and it read the plot's width on every
draw (a forced layout after the previous draw's DOM writes).

## Decision
1. **Several values per point.** A point may carry a `range` (box plots: five sorted values; range
   areas: low and high) or a size `z` (bubbles). React takes ApexCharts' shapes (`{ x, y: [..] }`,
   `[x, y, z]`). The data table gives each value its own column under a **second header row**:
   the series header spans its columns (`th[scope=colgroup][colspan]`), each value column is
   `th[scope=col][data-ok-part="min|q1|median|q3|max|low|high|y|z"]`; single-value series and the
   x header span both rows. Tables of one value per series keep one header row (no change).
2. **Text x values name categories** when no `categories` are given (treemaps: each series lists
   its own labels; the table has one row per label and empty cells elsewhere).
3. **Types, not flags:** `funnel` and `slope` are chart types (ApexCharts' `isFunnel`,
   `isSlopeChart`); a pyramid is a funnel of growing values. Heatmap, treemap, funnel and slope draw
   every series the same way (no mixed charts); box plots, range areas and bubbles mix.
4. **Cell charts** (heatmap, treemap) are a fourth hit mode, `cell`: the cell under the pointer is
   active; arrow keys move to the nearest cell in their direction (2D, not reading order). Cell
   shades are a `fill-opacity` attribute on the series color, so themes and presets still apply;
   labels on cells switch between white and primary text at 0.6 opacity.
5. **Sparklines** are a flag (`sparkline`): no axes, grid or legend; the plot fills its container
   (`height: 100%`) with a least height from `height` (`--_ok-chart-height`, CSSOM in HTML, React
   `style`; 40px by default); the SVG is out of flow, so measuring the plot's height has no
   feedback loop. `height` now accepts 8px and up (other charts still draw at least 40px).
6. **JavaScript data API.** React: new `series` / `categories` props are the API. HTML instance:
   `updateSeries(series, categories?)` and `appendData(data, { categories?, limit? })` (ApexCharts'
   shapes, plus `limit` for sliding windows). Data set through the API is kept in memory and the
   runtime **rewrites the table in place** from the same table model React renders (rows and cells
   reused, the caption and first header's text kept), then drops its own mutation records. An edit
   of the table by the page makes the table the source again. In both implementations, updates
   keep the active category / point by position and hidden series by index.
7. **Cheap redraws.** The HTML runtime patches the SVG in place (same-tag elements keep their
   identity; only changed attributes and texts are written) and reads the plot size from its
   `ResizeObserver` instead of `clientWidth` on every draw. Measured in Chromium (300 sliding-window
   updates of a 2 × 60-point area chart, `appendData` end to end): about 3.5–3.9 ms per update
   before, about 1.4 ms after; patching alone is about 7 % faster than a rebuild when every point
   moves (a sliding window) and writes far less when few values change.

## Consequences
- Additive API: new types and options; `barHeight` has no fixed default in the schema any more
  (bars 40, funnels 80), `height` accepts smaller values.
- Part labels in tables and tooltips are English ("Minimum", "Q1", "Size"); localized labels and
  heatmap color ranges are deferred to phase 4.
- The CDN bundle and CSS budgets grow (`scripts/check-size.mjs`).
