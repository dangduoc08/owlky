# ADR-0031: Chart phase 4 — zoom, linked charts, annotations, export and the last chart types

**Status:** Accepted (2026-11-08, auto-approved under `/component`). Extends ADR-0024, ADR-0027 and
ADR-0029; nothing earlier is superseded. Completes the Chart component.

## Context
Phase 4 of ADR-0027 adds what ApexCharts has beyond the reference page: synchronized charts, zoom and
pan, brush charts, annotations, animations, export (SVG, PNG, CSV), Candlestick, Range bar,
Timeline and Polar area, plus data label formatters and styles, the donut hole size and a legend
with values; phase 3 deferred localized part labels, heatmap color ranges and horizontal box plots.
The owner's developer-tools dashboard has live data: zoom, brush and sync must keep working while
`updateSeries` / `appendData` (or new React props) change the data. The contract stays: one SVG
engine in core, React and HTML draw the same nodes, the HTML data is a `<table>`, strict CSP, no
`innerHTML`, WCAG 2.2 AA.

## Decision
1. **New types in the shared layout.** `candlestick` (four values per point in ApexCharts' order:
   open, high, low, close; not sorted; rising and falling colors `candleUpColor` /
   `candleDownColor`), `rangeBar` (start and end; `horizontal` turns it), `timeline` (a type, not a
   flag: horizontal range bars whose values are dates, on a time axis of whole minutes, hours,
   days, months or years; weeks start on Mondays) and `polarArea` (a circular type: equal angles,
   radius by value on value rings). Their values get table columns under the second header row
   (`th[data-ok-part="open|high|low|close|start|end"]`); timeline cells write ISO 8601 in
   `data-ok-value`. Box plots also turn horizontal.
2. **Zoom is a window of the x axis**, not a transform: category indexes (category and date axes,
   whole numbers, at least two categories) or x values (numeric axes). The layout draws only the
   window and keeps the value scale of the whole data. Only vertical charts with an x axis zoom
   (`layout.x`, an axis map, also serves brushes and annotations). The zoom is state (React
   `zoomRange` / `defaultZoomRange` / `onZoomRangeChange(range, reason)`, HTML `zoomRange`,
   `setZoomRange`, `ok:chart:zoom`), never an attribute. An uncontrolled zoom is stored with the
   axis extent it was set on: a range that reached the last x value follows new points, so a zoomed
   live tail keeps showing the newest data; other ranges keep their position.
3. **One gesture controller in core** (`createChartGestures`): mouse drags select (a selection
   preview drawn by the layout), touch drags pan a zoomed chart, two fingers pinch, the pan tool
   makes every drag pan, Ctrl / ⌘ + wheel zooms (a plain wheel scrolls the page). It reads the
   owner's state through callbacks and reports ranges. Keys (`+`, `-`, `0`, Shift + arrows,
   Escape twice) are pure (`chartZoomKey`), so zoom never needs a drag (WCAG 2.5.7).
4. **Linked charts through a module-scoped registry** (`linkChart`): `group` shares the active
   category and the zoom; `brushTarget` names the `id` of the chart a brush chart zooms. No global
   slot (ADR-0007): React charts link with React charts, HTML ones with HTML ones. Received changes
   are applied without spreading again; zoom changes report their `reason` (`user`, `group`,
   `brush`) so controlled React charts follow; only `user` events are cancelable in HTML.
5. **Annotations are content.** React takes `annotations`; HTML authors list them after the table in
   `ul[data-ok-chart-annotations] › li[data-ok-annotation][data-ok-x|x2|y|y2][data-ok-color]` with
   the label as text. React renders the same list; it is visually hidden once drawn and stays the
   accessible view of the drawn annotations (the SVG is `aria-hidden`).
6. **Export reads the drawn SVG** (`exportChart(figure, format)`, shared): computed paints are
   copied onto a clone (so the file looks like the page in any theme or preset), PNG draws that
   file on a 2× canvas, CSV comes from the data table (raw `data-ok-value`s; text a spreadsheet
   would run as a formula gets a leading `'`). Downloads only during a user gesture
   (`navigator.userActivation`); failures are announced in the toolbar's status region.
7. **The toolbar comes from core** (`chartToolbar`: items and their static path icons), so React
   and HTML render the same buttons; names are localizable with `localeText` (React) /
   `setLocaleText` (HTML), which also carries the part labels (HTML reads them from the table's part
   headers and keeps them across API updates).
8. **Animations are CSS only** and opt-in (`animations`): an entry reveal or grow on first draw,
   and transitions of geometry properties on updates where the engine animates them (elements keep
   their identity in both implementations). Nothing moves under reduced motion. Off by default:
   live dashboards and parity screenshots stay still.
9. **Smaller options:** `dataLabelFormatter(value, series, index)` (HTML `setFormatters({ dataLabel
   })`), `dataLabelBackground` (badges behind labels above points), `legendValues`, `donutSize`
   (10–95 %), `colorRanges` (heatmaps and treemaps; HTML `data-ok-color-ranges="from to color
   [name]; …"`).

## Consequences
- Additive API (minor): new types, options, props, events and methods; no default changes.
- The CDN bundle grows by about 9 kB (gzip) and the CSS by about 0.5 kB; budgets are raised in
  `scripts/check-size.mjs` with this reason.
- Horizontal charts, polar charts, cells, funnels and slopes don't zoom; y / xy zoom and per-zoom
  y autoscaling are not provided (the value axis stays stable while panning).
- Linked charts can't span React and HTML on one page (separate registries by design).
- The visually hidden data table now grows upward from the root's bottom, so long tables no longer
  extend the page's scroll height.
