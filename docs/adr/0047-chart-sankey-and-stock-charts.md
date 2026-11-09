# ADR-0047: Chart: Sankey and stock charts

**Status:** Accepted (2026-11-09, auto-approved under the owner's standing instruction). Extends
ADR-0024, ADR-0027, ADR-0029 and ADR-0031; nothing earlier is superseded.

## Context
ApexCharts sells two add-ons that Owlky's Chart doesn't cover: ApexSankey (flow diagrams) and
ApexStock (financial charts: indicators, panes, a crosshair readout). Both are commercial: Owlky takes
their behavior and option names only (ADR-0015), never their code, data or images, and keeps its one
SVG engine in core (ADR-0024). The contract stays: React and HTML draw the same nodes from
`renderChart`, the HTML data is a `<table>`, text widths are estimated, colors and shadows come from
tokens, strict CSP, no `innerHTML`, no new runtime dependency, WCAG 2.2 AA.

## Decision

### Sankey (phase 2.1)
1. **A `sankey` chart type** whose data is links, not series: React `edges` (`source`, `target`,
   `value`, optional `color`) and `nodes` (`id`, `title`, `color`; optional, ApexSankey's shape); a node
   without links is not drawn. The HTML data table has one row per link: the source as the row header,
   then target and value (`th[data-ok-part="source|target|y"]`); node ids that differ from their titles
   and node colors are cell attributes (`data-ok-value`, `data-ok-color`). The same table is the
   accessible view (the SVG stays `aria-hidden`). Parallel links are drawn separately (never merged).
2. **Our own layout** (`chart-sankey.ts`): ranks by longest path from the sources after cycles are
   broken (a DFS marks back links), sinks justified to the last column; node heights by
   `max(in, out)`, one value scale for every column; the vertical order relaxed over a few
   iterations toward the weighted center of each node's neighbors, then collisions resolved; links
   sorted at both ends by the other end's position. Links are filled bands between two cubic curves
   (hit tests use the same curves). Back links of cycles are dashed loops under the diagram.
   `orientation: "vertical"` lays out the same model with ranks as rows.
3. **Options from ApexSankey:** `orientation`, `nodeWidth`, `whitespace` (share of the space between
   nodes), `edgeOpacity`, `axisTitles` (one title per rank; HTML `data-ok-axis-titles="A; B"`), and the
   existing `fill` (`gradient`: a gradient from the source to the target color, ApexSankey's
   `edgeGradientFill`; `solid`: the source color), `colors` (node palette) and `dataLabels` (values
   beside node names). Node colors are palette tokens like every chart color.
4. **Interaction:** a new layout mode, `flow`: the pointer picks the node, else the topmost link
   under it; arrow keys walk nodes and links in reading order (rank by rank). The active node shows
   its links highlighted and a tooltip with its incoming and outgoing totals; an active link shows
   source → target and its value. Labels are localizable through the part labels (`source`,
   `target`, `incoming`, `outgoing`).
5. **Not built:** chord and circular projections, particle flow, draggable nodes, drill-down, the
   comparison split view, the theme pack (themes come from Owlky's tokens) and node pinning on click.
   They need either new interaction components or a second projection engine; candidates for a later
   phase.

### Stock charts (phase 2.2)
6. **Stock features are options of a time chart, not a new type.** A candlestick (or line, area or
   column) chart whose first series is the price gets `indicators`, `navigator` and `paneHeight`.
   Volume is data: a point's `v` (`{ x, y: [open, high, low, close], v }`, ApexStock's shape),
   written as a `volume` part column of the price series.
7. **Indicators are computed in core** (`chart-indicators.ts`, pure functions, exported as
   `chartIndicatorValues`): overlays on the price pane (`sma`, `ema`, `bollinger`, `vwap`, `donchian`,
   `keltner`) and oscillators in their own pane (`volume`, `rsi`, `macd`, `stochastic`, `atr`, `cci`,
   `pvt`). They become generated series: listed in the legend (toggle to hide), the tooltip and the
   data table (`th[data-ok-indicator]`), so every indicator value is reachable from the keyboard and
   the table. The HTML runtime skips those columns when it reads the table and rewrites them after
   each draw (computed values never become input). HTML: `data-ok-indicators="sma 20; bollinger 20
   2; rsi 14"` (type, then numeric parameters, then an optional color; an allowlist).
8. **Panes share one x axis inside one SVG** (`chart-stock.ts`): each pane is laid out by
   `layoutChart` with a forced common left edge and banding, the value scale fitted to the visible
   window (`fitZoom`), and only the last pane prints x labels. Marks keep their global series
   index, so the tooltip is one readout of the active date across all panes (open, high, low, close,
   volume, every indicator) under a crosshair through every pane. Zoom (ADR-0031) applies to all
   panes at once.
9. **The navigator is a brush inside the chart:** a sparkline of the closing price over the whole
   axis, with the zoom drawn as a brush selection (`chartSelectionNodes`). `createChartGestures`
   takes the layout's `navigator` region: a press there resizes, moves or redraws the zoom window;
   elsewhere it zooms as before. Keyboard zoom keys stay the alternative (WCAG 2.5.7).
10. **Not built:** drawing tools (trend lines, Fibonacci, measurements: an editing UI with
    keyboard alternatives, a feature of its own), comparison mode, price scale modes, event
    markers, price lines, streaming aggregation helpers and period buttons (ApexStock has none:
    its range comes from zoom and `setVisibleRange`, which `zoomRange` already covers).

## Consequences
- Additive API (minor): one chart type, new props, options and parts; no default changes.
- The core bundle grows (layout and indicator math); budgets are raised in `scripts/check-size.mjs`
  only if the measured bundle needs it, with this ADR as the reason.
- Stock panes reuse the cartesian layout, so they inherit its limits: no logarithmic scale, the
  value axis on the left.
- Sankey layouts are deterministic (no randomness, no measuring), so server, React and HTML agree.
