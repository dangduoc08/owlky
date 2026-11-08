# ADR-0024: Chart — one SVG chart engine in core, written by us, built in four phases

**Status:** Accepted (2026-11-08).

## Context
The reference's "Chart" page shows 18 ApexCharts demos: line, area, five kinds of columns and bars,
mixed, scatter, pie, donut, radial bar, radar, two gauges, box plot, heatmap and treemap. ApexCharts
is framework-free JavaScript (`react-apexcharts` wraps it), but its license is not MIT: it is free
only below a revenue threshold of 2 million USD, and a commercial license is required above. Owlky
is MIT, has no runtime dependency for charts, and must keep its contract: React and framework-free
HTML with the same `data-ok-*` markup, behavior written once in core, strict CSP (no `innerHTML`,
no style strings), WCAG 2.2 AA. The owner chose to write our own HTML side (2026-11-08).

## Decision
1. **One chart engine in core** (`core/src/chart/`), written by us, no dependency: data model
   (series, categories, colors), nice scales, label thinning, paths (smooth curves with horizontal
   tangents, steps, bars rounded at the value end), layout to a tree of SVG nodes
   (`renderChart` → `ChartNode`), the hit model (pointer, keyboard) and the tooltip content.
   ApexCharts is a behavior and API reference only; no code is copied.
2. **Both implementations draw the same nodes.** React maps them to elements, the HTML runtime
   builds them with `createElementNS` and `setAttribute` (text with `textContent`). Text widths are
   estimated per glyph class, never measured, so the server, React and HTML lay out identically.
3. **HTML data is a `<table>`.** The runtime reads it and draws the chart next to it. Without
   JavaScript the table stays visible; with it, the table is visually hidden and remains the
   accessible view of the data. React renders the same table from its props. The runtime redraws
   when the table, an option attribute or the size changes.
4. **Colors are palette names** (`info`, `primary-dark`) from an allowlist, mapped to tokens in
   CSS, so charts follow themes, presets and dark mode. No new tokens.
5. **Accessibility:** the plot is a focusable `role=group` with `aria-roledescription="chart"`;
   the SVG is `aria-hidden`; arrow keys move a tooltip that is a `role=status` region; legend
   buttons use `aria-pressed`.
6. **Four phases**, each a normal `/component` review with the full test standard:

   | Phase | Scope |
   |---|---|
   | 1 | Engine, legend, tooltip, keyboard, data table; Line, Area, Column single / multiple / stacked / negative, Bar, Mixed, Scatter |
   | 2 | Pie, Donut, Radial bar, Radar, Semi circle gauge, Stroked gauge; data labels |
   | 3 | BoxPlot, Heatmap, Treemap |
   | 4 | ApexCharts features beyond the reference: animations (honoring reduced motion), zoom and pan, annotations, brush charts, export (SVG, PNG, CSV), candlestick, range bars, timelines, polar area, a JavaScript data API |

## Consequences
- Every phase ships React and HTML together; later phases extend the anatomy additively.
- The CDN bundle grows by about 10 kB (gzip) in phase 1; budgets are raised with a measured reason.
- Estimated text widths can differ a little from the rendered font: layouts keep margins, and the
  responsive tests check that no label is clipped or overlaps.
- Data grid phase 6 ("charts integration") can build on this engine.
