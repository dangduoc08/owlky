# Chart

Reference: Minimal UI kit "Chart" page (content only). Phase 1 of ADR-0024 covers its sections Line,
Area, Column single, Column multiple, Column stacked, Column negative, Bar, Mixed and Scatter;
phase 2 adds Pie, Donut, Radial bar, Radar, Semi circle gauge and Stroked gauge (and data labels).
Phase 3 (ADR-0027, ADR-0029) adds the reference's BoxPlot, Heatmap and Treemap, and ApexCharts types
beyond it: Bubble, Range area, Funnel (and pyramid), Slope, Sparklines, plus a JavaScript data API
(`updateSeries`, `appendData`). Phase 4 (ADR-0027, ADR-0031) completes the ApexCharts catalog:
Candlestick, Range bar, Timeline, Polar area; zoom and pan, synchronized charts, brush charts,
annotations, animations, export (SVG, PNG, CSV) and a toolbar; data label formatters and badges, a
legend with values, the donut hole size, heatmap color ranges, horizontal box plots and localized
texts. ADR-0047 adds the commercial add-ons' features (behavior and option names only): Sankey
charts (ApexSankey, phase 2.1) and stock charts (ApexStock, phase 2.2: indicators, panes, a
navigator). Roadmap 4.18.21 adds ApexCharts v8's waterfall and dumbbell charts; 4.18.19 a crossfilter
between the charts of a group (ADR-0054). Roadmap 4.18.7 adds tree charts (ApexTree layouts in the
SVG engine, ADR-0058) and 4.18.21 the sunburst and the icicle on the same hierarchy model, then
streamgraphs, violins, beeswarms, waffles and unit charts (the rest of ApexCharts v8's types). Upstream: ApexCharts (`react-apexcharts`, ADR-0015), ApexSankey, ApexStock
and ApexTree.
Created with `/component`.
Reference URL: https://minimals.cc/components/extra/chart
HTML source: written by us (ApexCharts' framework-free core is not MIT: the owner chose to write our
own, 2026-11-08; ADR-0024)

## Purpose
Show values as lines, areas, columns, bars, points, pie / donut slices, radial bars (rings,
gauges), a radar, box plots, heatmap or treemap cells, bubbles, range bands, funnels, slopes,
bands of a stream, density curves, swarms of dots or marks of a unit chart — full size or as sparklines — with a legend that hides series, a tooltip
for the pointer, touch and keyboard, and the data as a table. The SVG is drawn by one layout engine
in core (`renderChart`), so React and HTML render the same markup.

## Anatomy
```
figure[data-ok-chart][data-ok-type][data-ok-x-type][data-ok-curve][data-ok-legend][data-ok-fill]
      [data-ok-stacked]?[data-ok-horizontal]?[data-ok-height]?[data-ok-marker-size]?
      [data-ok-column-width]?[data-ok-bar-height]?[data-ok-y-min]?[data-ok-y-max]?
      [data-ok-y-title]?[data-ok-value-prefix]?[data-ok-value-suffix]?[data-ok-locale]?
      [data-ok-data-labels]?[data-ok-start-angle]?[data-ok-end-angle]?[data-ok-dash-array]?
      [data-ok-track-width]?[data-ok-total]?[data-ok-total-label]?
      [data-ok-ready]?                                   (set once the chart is drawn)
  div[data-ok-chart-toolbar][role=group][aria-label]?   (toolbar; first child)
    button[type=button][data-ok-chart-tool="zoomIn|zoomOut|reset|pan"][aria-label][title][aria-pressed]?[disabled]?
      › svg[data-ok-chart-tool-icon][aria-hidden] › path       (zoom tools: with zoom on an x axis)
    button[type=button][data-ok-chart-tool="svg|png|csv"][aria-label][title] › "SVG" | "PNG" | "CSV"
    span[data-ok-chart-status][role=status]                 (visually hidden; announces failed downloads)
  div[data-ok-chart-legend]                              (absent: one series unless showForSingleSeries, legend "none")
    button[type=button][data-ok-chart-legend-item][data-ok-color][aria-pressed]
      | span[data-ok-chart-legend-item][data-ok-color]   (disableLegendToggle, 4.18.64)
      span[data-ok-chart-legend-marker][data-ok-shape]?[data-ok-pattern]? + text + span[data-ok-chart-legend-value]? (legendValues)
  div[data-ok-chart-plot][role=group][aria-roledescription=chart][aria-label][tabindex=0]
    svg[data-ok-chart-svg][aria-hidden][focusable=false][width][height][viewBox]
      defs › linearGradient[id][data-ok-color] › stop[data-ok-chart-stop]×2   (gradient areas)
      g[data-ok-chart-grid] › rect[data-ok-chart-stripe="row|column"][fill-opacity][data-ok-color]?* (4.18.64)
        + line[data-ok-chart-grid-line]                  (grid: horizontal, vertical, both or none)
      text[data-ok-chart-axis-title]*                    (yTitle / yaxis[].title, rotated: -90° left, 90° opposite)
      text[data-ok-chart-axis-title=x]?                  (xTitle, under the x labels)
      g[data-ok-chart-axis=x] › text[data-ok-chart-tick][data-ok-major]?
      g[data-ok-chart-axis=y][data-ok-index]?[data-ok-opposite]? › text[data-ok-chart-tick]
                                                         (one per drawn value axis; data-ok-index with several)
      g[data-ok-chart-background-bars]?                  (4.18.61: backgroundBars / backgroundBarColors)
        rect[data-ok-chart-background-bar][rx][data-ok-color]?[fill-opacity]? (one per bar slot)
      g[data-ok-chart-crosshair] › rect[data-ok-chart-band] | line[data-ok-chart-crosshair-line]
      g[data-ok-chart-series-group]                      (areas, bars, lines, scatter: in that order)
        g[data-ok-chart-series][data-ok-type][data-ok-color][data-ok-index]
          path[data-ok-chart-area][fill=url(#…)]? · path[data-ok-chart-line] ·
          path[data-ok-chart-bar][data-ok-color]? · circle[data-ok-chart-marker][data-ok-color]?
      g[data-ok-chart-data-labels]?                      (dataLabels; only when a label fits)
        text[data-ok-chart-data-label="inside|outside"]  (inside slices / bars: white; outside: above points)
        text[data-ok-chart-data-label="total"]           (stackTotals: past each stack's end, 4.18.61)
      Non-color cues (4.18.62): defs › pattern[id][patternUnits=userSpaceOnUse][width=8][height=8]
        [data-ok-chart-pattern="slantedLines|squares|circles|horizontalLines|verticalLines"][data-ok-color]
        › rect[data-ok-chart-pattern-tint][fill-opacity] + path | circle[data-ok-chart-pattern-mark]
        (bars, areas and slices then carry fill=url(#…)); markers may be
        path[data-ok-chart-marker][data-ok-shape="square|triangle|diamond|cross|plus|star"][data-ok-color]?
        (hover markers too); lines path[data-ok-chart-line][stroke-width]?[stroke-dasharray]?
      g[data-ok-chart-filter-layer]?                     (crossfilter highlight, 4.18.19; before the crosshair,
        › rect | path[data-ok-chart-filter-band]          or the series group of cells: bands, slice halos, cell frames)
      g[data-ok-chart-selected]?                         (selected points, 4.18.60; before the active group)
        circle | rect | path[data-ok-chart-selected-mark] (ring around points, frame around blocks
                                                          and cells, outline of slices and rings)
      g[data-ok-chart-active] › circle[data-ok-chart-active-marker][data-ok-color]
      g[data-ok-chart-center]?                           (donut / radial bar center)
        text[data-ok-chart-center-label] · text[data-ok-chart-center-value]
    Polar charts (phase 2) draw no axes groups except radar's, and these series shapes:
      pie, donut:  g[data-ok-chart-series] › path[data-ok-chart-slice][data-ok-color]
                   crosshair › path[data-ok-chart-active-slice][data-ok-color] (a halo behind the slice)
      radialBar:   defs › linearGradient[id] › stop[data-ok-chart-stop][data-ok-color]×2 (lighter → color)
                   g[data-ok-chart-series][data-ok-dashed]? › (path[data-ok-chart-track][stroke-width] +
                     path[data-ok-chart-radial][data-ok-color][stroke-width][stroke=url(#…)]?[stroke-dasharray]?)×n
      radar:       g[data-ok-chart-grid] › path[data-ok-chart-web] (value rings) + line[data-ok-chart-web] (spokes)
                   g[data-ok-chart-axis=x] › text[data-ok-chart-tick] (category labels around the web)
                   g[data-ok-chart-axis=y] › text[data-ok-chart-tick] (values along the top spoke)
                   g[data-ok-chart-series][data-ok-type=radar] › path[data-ok-chart-area] + path[data-ok-chart-line] (closed)
    Phase 3 series shapes (ADR-0029):
      boxPlot:     g[data-ok-chart-series] › (line[data-ok-chart-whisker]×4 + rect[data-ok-chart-box="upper|lower"][data-ok-color])×n
                   (whiskers min→Q1, Q3→max and two caps; boxes Q3→median and median→Q1)
      rangeArea:   g[data-ok-chart-series] › path[data-ok-chart-area] (closed band) + path[data-ok-chart-line]×2 (high, low edges)
      bubble:      g[data-ok-chart-series] › circle[data-ok-chart-bubble][data-ok-color]?
      heatmap:     g[data-ok-chart-axis=x|y] (categories | series names), no grid;
                   g[data-ok-chart-series] › rect[data-ok-chart-cell][fill-opacity][rx][data-ok-color]? (one row per series)
      treemap:     no axes; g[data-ok-chart-series] › rect[data-ok-chart-cell][fill-opacity]…;
                   labels › text[data-ok-chart-cell-label="inside|plain"] (category names);
                   g[data-ok-chart-tags] › rect[data-ok-chart-tag] + text[data-ok-chart-tag-label] (several series)
      funnel:      g[data-ok-chart-axis=y] (categories) › g[data-ok-chart-series] › rect[data-ok-chart-bar][rx][data-ok-color]? (centered)
      slope:       g[data-ok-chart-grid] › line[data-ok-chart-grid-line] (one vertical per category), g[data-ok-chart-axis=x];
                   g[data-ok-chart-series] › path[data-ok-chart-line] (straight) + circle[data-ok-chart-marker];
                   labels › text[data-ok-chart-data-label=outside] (values beside the first / last points)
      active cell: g[data-ok-chart-active] › rect[data-ok-chart-active-cell] (heatmap, treemap)
      sparkline:   [data-ok-sparkline] roots draw no grid or axes groups and no legend
    Phase 4 shapes and overlays (ADR-0031):
      candlestick: g[data-ok-chart-series] › (line[data-ok-chart-wick][data-ok-color] + rect[data-ok-chart-candle="up|down"][data-ok-color])×n
      rangeBar, timeline: g[data-ok-chart-series] › rect[data-ok-chart-bar][rx][data-ok-color]? (timelines: horizontal, a date axis)
      polarArea:   g[data-ok-chart-grid] › path[data-ok-chart-web] (rings); g[data-ok-chart-series] › path[data-ok-chart-slice][data-ok-color];
                   g[data-ok-chart-axis=y] › text[data-ok-chart-tick] (last, over the slices)
      annotations: g[data-ok-chart-annotation-layer] (before the data labels) ›
                     g[data-ok-chart-annotation="x|y|point"][data-ok-color] ›
                       line[data-ok-chart-annotation-line] | rect[data-ok-chart-annotation-band] | circle[data-ok-chart-annotation-marker]
                       + rect[data-ok-chart-annotation-tag] + text[data-ok-chart-annotation-label]
                     g[data-ok-chart-annotation=text][data-ok-color] › text[data-ok-chart-annotation-text][text-anchor] (4.18.65)
      x axis (4.18.65): text[data-ok-chart-tick][transform=rotate(…)] (xLabelRotate), text[data-ok-chart-axis-group] + line[data-ok-chart-axis-group-tick]
                        inside g[data-ok-chart-axis=x] (xaxisGroups)
      forecast (4.18.65): path[data-ok-chart-line][data-ok-chart-forecast][stroke-dasharray], path[data-ok-chart-area][data-ok-chart-forecast][fill-opacity],
                          path[data-ok-chart-bar][data-ok-chart-forecast][fill-opacity]
      no data (4.18.65): text[data-ok-chart-no-data] (last child of the SVG, only when `noDataText` is set and nothing is drawn)
      selection:   g[data-ok-chart-brush] (before the active group) › rect[data-ok-chart-selection] + rect[data-ok-chart-handle]×2 (brush charts)
      badges:      g[data-ok-chart-data-labels] › (rect[data-ok-chart-data-label-badge] + text[data-ok-chart-data-label=outside])×n
    Sankey (ADR-0047; root [data-ok-orientation]?[data-ok-node-width]?[data-ok-whitespace]?
      [data-ok-edge-opacity]?[data-ok-axis-titles]?):
      defs › linearGradient[id][gradientUnits=userSpaceOnUse] › stop[data-ok-chart-stop][data-ok-color]×2 (gradient links)
      g[data-ok-chart-axis=titles]? › text[data-ok-chart-axis-title] (axisTitles)
      g[data-ok-chart-series][data-ok-type=sankey] › path[data-ok-chart-link][fill-opacity|stroke-opacity]
        ([fill=url(#…)] | [data-ok-color]; loops of cycles: [data-ok-back][stroke-width][stroke-dasharray])
        + rect[data-ok-chart-node][data-ok-color]
      g[data-ok-chart-active] › path[data-ok-chart-active-link] + rect[data-ok-chart-active-cell] (node outline)
      g[data-ok-chart-data-labels] › text[data-ok-chart-node-label] (after the active group)
    Stock (ADR-0047; root [data-ok-indicators]?[data-ok-navigator]?[data-ok-pane-height]?):
      g[data-ok-chart-crosshair] (first: the band behind every pane)
      g[data-ok-chart-pane="0|n"][transform=translate(0 y)]? › line[data-ok-chart-guide]* + the pane's
        layout (grid, axes, series; series keep their global data-ok-index); x labels: last pane only
      line[data-ok-chart-pane-divider] (between panes)
      g[data-ok-chart-navigator] › rect[data-ok-chart-navigator-frame] + g[transform] › (sparkline of
        the price) + g[data-ok-chart-brush] › rect[data-ok-chart-selection] + rect[data-ok-chart-handle]×2
      g[data-ok-chart-active]; g[data-ok-chart-pane-titles] › text[data-ok-chart-pane-title]
    Waterfall (4.18.21; root [data-ok-waterfall-positive-color]?[data-ok-waterfall-negative-color]?
      [data-ok-waterfall-total-color]?[data-ok-waterfall-subtotal-color]?[data-ok-hide-connectors]?):
      g[data-ok-chart-series][data-ok-type=waterfall] › line[data-ok-chart-connector]* (unless hideConnectors)
        + rect[data-ok-chart-bar][data-ok-chart-step="up|down|total|subtotal"][data-ok-color][rx]×n
    Dumbbell (4.18.21; root [data-ok-dumbbell-colors]?):
      g[data-ok-chart-series][data-ok-type=dumbbell] › (line[data-ok-chart-dumbbell-line] +
        circle[data-ok-chart-dumbbell=start][data-ok-color]? + circle[data-ok-chart-dumbbell=end][data-ok-color]?)×n
      (drawn with the points group, after bars and lines)
    Tree (ADR-0058; root [data-ok-direction]?[data-ok-layout-type]?[data-ok-edge-style]?
      [data-ok-enable-expand-collapse]?[data-ok-collapsed-nodes]?):
      g[data-ok-chart-series][data-ok-type=tree] › path[data-ok-chart-tree-link][data-ok-color]×(n − roots)
        + circle[data-ok-chart-tree-node][data-ok-color][data-ok-collapsed]?×n (preorder)
      g[data-ok-chart-active] › path[data-ok-chart-active-path][data-ok-color]* (root → node) + circle[data-ok-chart-active-node]
      g[data-ok-chart-data-labels] › text[data-ok-chart-node-label][transform=rotate(…)]? (radial leaves)
    Sunburst (ADR-0058; root [data-ok-inner-size]?[data-ok-spacing]?[data-ok-leaf]?[data-ok-tint]?
      [data-ok-start-angle]?[data-ok-end-angle]?[data-ok-disable-zoom-on-click]?[data-ok-drill-node]?):
      g[data-ok-chart-series][data-ok-type=sunburst] › path[data-ok-chart-arc][fill-opacity][stroke-width][data-ok-color]×n
        (preorder; the drilled node first, as the center disc)
      g[data-ok-chart-data-labels] › text[data-ok-chart-partition-label="inside|plain"][transform=rotate(…)]? (before the active group)
      g[data-ok-chart-active] › path[data-ok-chart-active-node] (the arc's outline)
    Icicle (ADR-0058; root [data-ok-direction]?[data-ok-spacing]?[data-ok-leaf]?[data-ok-tint]?
      [data-ok-zoom-type]?[data-ok-disable-zoom-on-click]?[data-ok-drill-node]?):
      g[data-ok-chart-series][data-ok-type=geo] › path[data-ok-chart-region="<id>"][data-ok-color|data-ok-no-data][fill-opacity]?×n
                                                   (before the series: g[data-ok-chart-geo-background] › path[data-ok-chart-sphere]? + path[data-ok-chart-graticule]?)
      g[data-ok-chart-series][data-ok-type=icicle] › rect[data-ok-chart-icicle-cell][rx=2][fill-opacity][stroke-width][data-ok-color]×n
      g[data-ok-chart-data-labels] › text[data-ok-chart-partition-label="inside|plain"] (centered, never rotated)
      g[data-ok-chart-active] › rect[data-ok-chart-active-node] (1px inside the cell)
    Streamgraph (4.18.21; root [data-ok-stream-offset]?[data-ok-stream-order]?[data-ok-hide-stream-labels]?
      [data-ok-stream-label-min-width]?[data-ok-stream-hover-opacity]?):
      g[data-ok-chart-grid] + g[data-ok-chart-axis] as for line charts (grid and y axis off unless asked);
      g[data-ok-chart-series][data-ok-type=streamgraph][data-ok-color][data-ok-index] › path[data-ok-chart-stream-band][fill=url(#…)]?
      (bottom to top in the stacking order); labels › text[data-ok-chart-data-label="inside|plain"] (series names)
      active, tooltip="point": rect[data-ok-chart-stream-veil][fill-opacity] + path[data-ok-chart-stream-band][data-ok-color]
    Violin (4.18.21; root [data-ok-violin-normalize]?[data-ok-violin-side]?[data-ok-bandwidth-scale]?
      [data-ok-kde-bandwidth]?[data-ok-kde-resolution]?[data-ok-violin-box]?[data-ok-violin-whiskers]?
      [data-ok-hide-violin-points]?[data-ok-violin-point-size]?[data-ok-violin-jitter]?
      [data-ok-unconstrained-violin-points]?[data-ok-violin-max-points]?):
      g[data-ok-chart-series][data-ok-type=violin] › (path[data-ok-chart-violin][fill=url(#…)]?
      + line[data-ok-chart-violin-whisker]×2 + rect[data-ok-chart-violin-box] + line[data-ok-chart-violin-median] (violinBox)
      + (circle | path)[data-ok-chart-violin-point]*)×n
    Beeswarm (4.18.21; root [data-ok-beeswarm-spread]?[data-ok-orientation]?[data-ok-marker-size]?):
      g[data-ok-chart-grid] + g[data-ok-chart-axis] (lanes = series names; the value axis horizontal by default);
      g[data-ok-chart-series][data-ok-type=beeswarm][data-ok-index] › (circle | path)[data-ok-chart-bee][data-ok-color]?[data-ok-shape]?×n
    Waffle (4.18.21; root [data-ok-total]?[data-ok-columns]?[data-ok-fill-from]?[data-ok-split]?[data-ok-tile-columns]?
      [data-ok-split-max]?[data-ok-track-color]?[data-ok-unit-value]?[data-ok-max-units]?[data-ok-cell-radius]?):
      g[data-ok-chart-series][data-ok-type=waffle] › g[data-ok-chart-unit-group][data-ok-color][data-ok-index]×n ›
      rect[data-ok-chart-unit-cell][rx] | (circle | path)[data-ok-chart-unit-cell][data-ok-shape]? (colorBlindMode)
      split tiles: + rect[data-ok-chart-unit-track][data-ok-color]? (empty cells);
      labels › text[data-ok-chart-unit-title]; active › path[data-ok-chart-active-node] (one path around the category's marks)
    Unit (4.18.21; root [data-ok-unit-layout]?[data-ok-cluster-labels]?[data-ok-disable-sort-by-group]?[data-ok-arc-rows]?
      [data-ok-inner-size]?[data-ok-start-angle]?[data-ok-end-angle]?, and the waffle's options):
      as Waffle, with g[data-ok-chart-series][data-ok-type=unit]; marks are circle | path[data-ok-chart-unit-cell][data-ok-shape]?
      (`grid` layout squares: rect, `markerShape="square"`); labels › text[data-ok-chart-unit-title] (clusterLabels)
    data labels may also be text[data-ok-chart-data-label="plain"] (primary text on faint cells)
    div[data-ok-chart-tooltip][role=status][hidden]?     (tooltip="none": visually hidden, 4.18.63)
      div[data-ok-chart-tooltip-title] + div[data-ok-chart-tooltip-state]? ("Selected", localeText `selected`)
        + div[data-ok-chart-tooltip-rows]
        div[data-ok-chart-tooltip-row] › span[data-ok-chart-tooltip-marker][data-ok-color][data-ok-shape]?[data-ok-pattern]? + span + span[data-ok-chart-tooltip-value]
  div[data-ok-chart-drill]                               (sunburst and icicle charts unless disableZoomOnClick; before the plot)
    button[type=button][data-ok-chart-drill-up][hidden]? › "Back" (localeText `drillUp`; hidden while not drilled)
    span[data-ok-chart-drill-path][role=status] › the drilled path ("Storage › Backups"; empty at the top)
  div[data-ok-chart-filter]                              (crossfilter, 4.18.19: charts with data-ok-crossfilter)
    button[type=button][data-ok-chart-filter-clear][hidden]? › "Clear filter" (hidden while the group has no filter)
    span[data-ok-chart-filter-status][role=status]       (visually hidden; announces this chart's filter changes)
  table[data-ok-chart-data]                              (HTML: the source; visually hidden once drawn)
  template[data-ok-chart-tooltip]?                       (HTML: custom tooltip content, 4.18.63; React: tooltipContent)
    [data-ok-chart-tooltip-slot="title|state|row|name|value|marker"] (text slots; row repeated per value,
      marker gets data-ok-color / data-ok-shape / data-ok-pattern; state removed unless selected)
    caption (the chart's name)
    thead › tr › th[scope=col] (x label) + th[scope=col][data-ok-type]?[data-ok-color]?[data-ok-y-axis]? (one per series;
      data-ok-y-axis: its value axis when the chart has several; series cues, 4.18.62:
      [data-ok-marker-shape]?[data-ok-fill-pattern]?[data-ok-stroke-width]?[data-ok-dash-array]?)
      Series of several values per point (box plot, range area, bubble): two header rows —
      tr › th[scope=col][rowspan=2] (x label) + th[scope=colgroup][colspan=n] (the series) |
           th[scope=col][rowspan=2] (single-value series)
      tr › th[scope=col][data-ok-part="min|q1|median|q3|max|low|high|y|z"] (one per value)
    tbody › tr › th[scope=row][data-ok-value]? + td[data-ok-value]?[data-ok-color]? (one per x value)
      Candles: th[data-ok-part="open|high|low|close"]; range bars and timelines: "start|end"
      (timeline cells: the date as text, ISO 8601 in data-ok-value)
    Stock: the price series gets a th[data-ok-part="volume"] column after its values when a point has
      `v`; indicator columns th[data-ok-indicator="sma|…"][data-ok-color] (rowspan 2) are written by
      React and the runtime and skipped when the table is read (volume bars have none)
    Waterfall: one cell per point, the change; total and subtotal cells td[data-ok-sum="total|subtotal"]
      show the running total as text (read back as `isTotal` / `isSubtotal`: the text isn't input)
    Sankey: thead › tr › th[scope=col][data-ok-part="source|target|y"]×3; one row per link:
      tbody › tr › th[scope=row][data-ok-value]?[data-ok-color] (source title; id when it differs)
        + td[data-ok-value]?[data-ok-color] (target) + td[data-ok-value]?[data-ok-color]? (value; own link color)
    Geo (ADR-0059): thead › tr › th[scope=col][data-ok-part="name|y"]; tbody › tr › th[scope=row][data-ok-value]?[data-ok-label]?[data-ok-cell="col,row"]? + td[data-ok-value]?
    Tree, sunburst, icicle: thead › tr › th[scope=col][data-ok-part="name|parent|y"] (y only when a node has a value);
      one row per node in preorder: tbody › tr › th[scope=row][data-ok-value]? (id when it differs
      from the name)[data-ok-color]? (where a color starts: own, or the palette on roots and a single root's children) + td[data-ok-value]? (the parent's name, its id
      when it differs; empty for roots) + td[data-ok-value]? (value; parents: the sum)
    Violin: thead › tr › th[scope=col][rowspan=2] + th[scope=colgroup][colspan=6]; second row th[data-ok-part="count|min|q1|median|q3|max"];
      one row per category: tbody › tr › th[scope=row] + td[data-ok-samples] (the count; observations) | td[data-ok-density] (empty; value:weight pairs) + td×5 (the summary, never read back)
  ul[data-ok-chart-annotations]?                         (after the table; visually hidden once drawn)
    li[data-ok-annotation="x|y|point|text"][data-ok-x]?[data-ok-x2]?[data-ok-y]?[data-ok-y2]?[data-ok-color]?[data-ok-text-anchor]? › label text
Root text attributes (phase 4): [data-ok-group]? [data-ok-brush-target]? [data-ok-color-ranges]?
```
Colors: `data-ok-color` = `<palette>` or `<palette>-<lighter|light|main|dark|darker>` (allowlist).
Default series order: `primary-dark`, `warning`, `info`, `error`, `success`, `warning-dark`,
`success-darker`, `info-dark`, `info-darker`.

Geometry (core, shared): smooth curves keep horizontal tangents at every point (control points at
35 % of each segment); bars are rounded (4px) at the value end only, and only at the end of a stack;
value ticks about every 48px (vertical) or 200px (horizontal) on nice steps (1, 2, 2.5, 5 × 10ⁿ);
x labels are thinned to whole steps (every n categories, or whole days / months / years for dates)
so they never overlap; dates with gaps (trading days) also drop a label that would come within 8px of the one before it. Label widths are estimated per glyph class, not measured, so the server,
React and HTML lay out identically.

Value axes (core `chart-axes.ts`, 4.18.59): `yaxis` as one object sets the value axis' scale
(`logarithmic` with `logBase`, default 10: ticks at whole powers of the base, values ≤ 0 aren't
drawn and log axes never stack; `reversed`: the highest value at the bottom, or the left for
horizontal bars; `tickAmount`: exactly that many intervals on the smallest nice step that covers
the data, evenly divided when `min` and `max` are both fixed; `min` / `max`, `title`, `show`).
As a list (vertical charts with an x axis), each series is drawn on one axis: its own `yAxis`
(HTML: its column header's `data-ok-y-axis`), else the first axis naming it in `seriesName`, else
the axis at its position when that axis names no series, else the first. Axes are drawn when
`show` isn't `false` and one of their series is visible: left ones from the plot outward,
`opposite` ones on the right (labels start-anchored), each `labels + 14px` wide plus `22px` with a
title (titles rotated -90° on the left, 90° on the right; the outermost left title at x = 12).
Grid lines follow the primary axis (the first drawn); the other linear axes take its number of
intervals, so their labels sit on its grid lines. Stacks are per axis. Stock charts keep the
axes in the price pane; every pane gets the widest left and right edges. `xTitle` adds 20px under
the x labels (`dy 0.71em` at the labels' line + 20px), centered on the plot.

Stacks and bars (4.18.61): `stackType: "100%"` (stacked charts) turns each category's stacked
values into shares of their absolute sum per value axis: the axis runs to 100 (ticks `"<n>%"`, no
prefix, suffix or formatter), data labels print the share (one decimal, `dataLabelFormatter` gets
the share), tooltips and the table keep the values. `stackOnlyBar`: only bar series stack; lines
and areas keep their values. `stackTotals`: stacked bar charts print each stack's sum
(`valueFormatter(sum, -1)`) 12px past its end (vertical; positives above, negatives below) or 6px
(horizontal, start / end anchored). `dataLabelPosition` moves bar labels from the middle to the
value end (`top`) or the base (`bottom`), 4px plus half a label inside. `colorRanges` color the bars
whose value they hold (from ≤ value ≤ to, first range wins; a point's own `color` wins). Background
bars: one rect per bar slot (stacked: per category) across the plot, `backgroundBarRadius` (default
4, at most half the slot), colors from `backgroundBarColors` by category index (else a 12 % grey),
`fill-opacity` from `backgroundBarOpacity` (an attribute: CSS never sets it); drawn before the
crosshair group.

Non-color cues (core `chart-cues.ts`, 4.18.62, WCAG 1.4.1): `withChartCues` resolves per series
its marker `shape` (series `markerShape`, else `markerShape`, else with `colorBlindMode` the n-th of
circle, square, triangle, diamond, cross, plus, star; only where markers are drawn: scatter, or
lines and areas with `markerSize` or `colorBlindMode`, which draws 4px markers), its `pattern`
(bars and areas: series `fillPattern`, else `fillPattern`, else with `fill="pattern"` or
`colorBlindMode` the n-th of slantedLines, squares, circles, horizontalLines, verticalLines; slices
of pie, donut and polar area charts take it by category), its dash (series `dashArray`, else
`dashArray`, else with `colorBlindMode` solid, `6 4`, `2 3`, `8 3 2 3`, `12 4`) and its line width
(series `strokeWidth`, else `strokeWidth`; CSS 2.5px without). Shapes: squares 0.9r, triangles and
diamonds about 1.2r, stars 1.3r / 0.55r, crosses and pluses as strokes. Patterns: one 8px
`userSpaceOnUse` tile per pattern and color (`<prefix>-pattern-<style>-<color>`), a 0.24 tint and
marks of the color; a pattern replaces an area's gradient. `discreteMarkers` draw a marker on one
point of a line, area or scatter series (radius `size`, default the series' size and at least 5;
`color`, `shape`), whatever its markers; `dataPointIndex` as in the selection. Legend and tooltip
markers repeat the shape (`clip-path`) or the pattern (CSS gradients). Stock charts ignore cues.

Polar geometry (core `chart-polar.ts`): angles in degrees clockwise from 12 o'clock; the chart is
centered in the SVG, radius = half the smaller side - 4px. Donut hole 72 % of the radius. Radial
bars: ring thickness 19 % of the radius for one ring, thinner for more (gap 66 % of a ring), the
outermost ring first; the track is `trackWidth` % as thick; a ring is full at `yMax` (default 100).
Pie and donut slices share `endAngle - startAngle` (at most one turn) by value; zero, negative and
hidden values get no slice. Radar: radius leaves room for the widest category label; 2–6 value
rings on a nice scale from 0.

Sankey geometry (core `chart-sankey.ts`, ADR-0047):
- Data: links (`edges`: `source`, `target`, `value` > 0, optional `color`) between node ids; nodes
  (`id`, `title`, `color`) only name and color them; nodes in order of first use; self links,
  non-positive and non-numeric values are dropped; parallel links stay separate.
- Ranks: a depth-first search marks back links (cycles); longest path from the sources over the
  others; nodes without forward links out go to the last rank. Node size: `max(in, out) × scale`,
  one scale for every rank: the fullest rank leaves `whitespace` (default 0.18) of the space as
  gaps; cycles reserve room below for their loops.
- Order: ranks stacked by first use and centered, then 6 rounds of relaxation (toward the
  value-weighted center of the neighbors, along the flow and back, alpha 0.9^round) with collisions
  resolved after each rank. Link ends are sorted by the other end's center (back links last).
- Links: bands between two cubic curves (control points at the middle depth); `fill` `gradient`
  (default) = a `userSpaceOnUse` gradient from the source to the target color (same colors: solid),
  `solid` or own `color` = flat; `fill-opacity` = `edgeOpacity` (default 0.4; an attribute, CSS never
  sets it). Back links: stroked loops (width = value), dashes from the layout (`stroke-dasharray`
  scaled to the width), under the diagram, past the end nodes (room reserved).
- `orientation: vertical` swaps the axes (ranks as rows); labels centered on their node, after the
  first row and before the others, kept inside the width. Horizontal labels: after first-rank
  nodes, before the others, cut with an ellipsis to the space between ranks (estimated widths;
  the first gap is shared by two ranks), left out under 26px.
- `axisTitles`: one per rank above the columns (vertical: beside the rows, a left margin).
  `dataLabels`: the node's value after its title.

Stock geometry (core `chart-stock.ts`, `chart-indicators.ts`, ADR-0047):
- Applies when `indicators` or `navigator` is set on a category / date chart that isn't horizontal,
  a sparkline, scatter, bubble or a whole type. The first series is the price (candles: open, high,
  low, close; others: the value), with an optional volume per point (`v`).
- Indicators (warm-up values `null`): `sma`, `ema` (seeded with the first SMA), `bollinger` (SMA ±
  `stdDev` population deviations, a range area), `vwap` (cumulative, typical price), `donchian`
  (highest high / lowest low), `keltner` (EMA ± `multiplier` × ATR) on pane 0; `volume` (bars
  colored by the candle, `success` / `error`; no table column), `rsi` (Wilder; 0–100, guides 30 /
  70), `macd` (histogram bars by sign, MACD and signal lines), `stochastic` (%K, %D; 0–100, guides
  20 / 80), `atr` (Wilder), `cci` (guides ±100), `pvt` each in a new pane, in order. Defaults:
  period 20 (SMA, EMA, Bollinger, Donchian, Keltner, CCI), 14 (RSI, stochastic, ATR); stdDev 2;
  MACD 12 / 26 / 9; Keltner ATR 10, ×2; %D 3. Periods 1–500, factors (0, 10]; values rounded to 4
  decimals. Colors: own, else warning, info, secondary, success-dark, error-light, info-dark by
  position.
- Panes: pane 0 `height` px, others `paneHeight` px (default 120, min 60) after a 10px gap with a
  divider; all laid out by `layoutChart` with a common `plotLeft` (the widest value labels),
  `banded`, `fitZoom` (scale from the points in the zoom window), labels on the last pane only;
  pane 0 fits its scale (`zeroBased: false`); oscillator ticks are plain numbers (volume compact,
  "1.2M"); values of panes > 0 are plain numbers (no prefix / suffix).
- Navigator: 12px under the panes, 48px tall, the price's line over the whole axis (a sparkline),
  its own axis map (`layout.navigator`), the zoom (or the whole axis) as a brush selection.

Waterfall geometry (core `chart-model.ts` running totals, `layoutChart`, 4.18.21):
- Data: each value is a step; `{ isTotal: true }` / `{ isSubtotal: true }` points (their `y` is
  ignored) show the running total so far. `chartData` keeps the step in `y` and writes
  `range = [before, after]` (sums: `[0, total]`, `y` = the total), in x order; gaps (`null`) add
  nothing and break the connectors. A whole type: every series is a waterfall, side by side in its
  band slot like range bars; `horizontal` turns it. The value scale includes zero.
- Bars: from `before` to `after`, `rx` = min(4, half the thickness, half the length), at least 1px
  long. Colors: the point's `color`, else `waterfallTotalColor` (default the series color) for
  totals, `waterfallSubtotalColor` (default the total color) for subtotals,
  `waterfallPositiveColor` (`success`) for steps that don't lower the total, `waterfallNegativeColor`
  (`error`) for the others; always written on the bar (`data-ok-color`).
- Connectors: a line at the running total from each bar's far edge to the next drawn bar's near
  edge (CSS: 1px secondary text, dashes 3), before the bars; `hideConnectors` drops them.
- Data labels (inside, where they fit): steps signed (`+85`, core `chartSigned`), sums plain.
  Tooltip rows: steps `series: +85` and `Total: <after>` (part label `total`, localizable;
  "Series (Total)" with several waterfall series); sums one row with the total. Marks are blocks
  (band highlight, no hover marker; clicks select the bar).
- The legend lists the series (none for one series): the step colors are explained by the signed
  values in the tooltip, the labels and the table, so color is never the only cue.

Dumbbell geometry (core `layoutChart`, 4.18.21):
- Data: two values per point in `y`, kept in the order given (start, end; never sorted), table
  columns `th[data-ok-part="start|end"]` under the series (part labels `start` / `end`, localizable:
  "Before" / "After"). A whole type; every series is drawn in its band slot; `horizontal` turns it.
- The value scale fits the data plus a tenth of its span on both sides (never below zero for
  positive data), so markers and labels stay in the plot.
- Each point: a line between the two values (CSS: the series color at 0.48, 4px, round caps),
  a start ring (paper fill, 3px stroke) and an end disc (paper ring), radius `markerSize`
  (default 6, at least 2). `dumbbellColors` (`[[start, end], …]`; HTML
  `data-ok-dumbbell-colors="start end; …"`, core `parseChartDumbbellColors`, one color colors
  both ends) gives pair n to series n, later series the first pair; a point's `color` colors
  both ends. Start ring vs end disc tells the direction without color.
- Data labels: outside, the higher value above (right of) its marker, the lower below (left of)
  it; one label when both are equal. Tooltip rows `Start` / `End` ("Series (Start)" with several
  dumbbell series), each with its marker's color. Marks are blocks (the bounding box of the line
  and the markers: band highlight, click selection, frame outline); zoom works as for columns.

Tree geometry (core `chart-hierarchy.ts`, `chart-tree.ts`, ADR-0058):
- Data: `hierarchy` (one node or a list of roots; `{ id?, name?, value?, color?, children? }`,
  ApexCharts' `x` / `y` accepted for `name` / `value`); at most 5000 nodes and 64 levels; ids
  default to the name, repeats get `-2`, `-3`…; negative or non-numeric values are none. Values:
  leaves their own (0 without, or 1 each when no node has one), parents the sum of their children.
  Colors: own (the subtree inherits it); else the roots — or the children of a single root — take
  `colors` then the chart palette in order; else the parent's. HTML reads the nodes table
  (`readChartHierarchyTable`): a parent must come before its children, an unknown parent makes a
  root.
- Layout: a sentinel root above the roots; `layoutType: tree` (default) = Buchheim–Jünger–Leipert
  tidy tree (Reingold–Tilford in linear time), separation 1 between siblings and 2 between cousins
  (radial: divided by the depth); `cluster` = dendrogram (leaves one separation apart in preorder,
  parents at their children's mean, leaves on the last level). Collapsed nodes' subtrees are left
  out of the layout.
- `direction`: `top` (default) / `bottom` — breadth across the width (margins: half the widest
  label, at most 15%), levels down / up, labels under / over the node, cut to the space to the
  nearest node of the level; `left` / `right` — levels across the width (room for the roots' labels
  before, at most 20%, the leaves' after, at most 30%), labels after leaves and before parents,
  left out when the level's nodes are under 12px apart; `radial` — breadth over `startAngle` →
  `endAngle` (default a full turn, a gap of one leaf spacing between the last and the first leaf),
  levels as radii, leaf labels outward (rotated, cut to the margin), parent labels above the node.
- `edgeStyle`: `orthogonal` (default; radial: out along the parent's angle, around the middle
  circle, out to the child; from the center, straight to the middle circle), `curved` (cubics
  through the middle depth), `straight`. Nodes are circles of `markerSize` (default 5, 2–20).
  `dataLabels`: the value after the name (when values are given).

Sunburst geometry (core `chart-partition.ts`, ADR-0058):
- Spans: the roots share `startAngle` → `endAngle` (default a full turn) by value, each node its
  parent's span by value (ApexCharts `partition: "normalize"`); nodes of value 0 are not drawn.
  The rings fill the SVG (a part of a turn is fitted by its bounding box), radius 2px inside it.
- Rings: an `innerSize` hole (default 15%, 0–90), then one ring per level to the deepest drawn;
  `leaf: extend` (default) stretches leaves to the edge, `stop` ends them at their ring. Arcs are
  `slicePath` shapes with a paper stroke of `spacing` px (default 1, at most 8; an attribute, CSS
  never sets it) and `fill-opacity` = max(0.3, 1 − `tint` × levels below where the color starts)
  (default tint 0.14; an attribute).
- Drill (`drillNode`, a node with children; others are ignored): the node is a center disc (radius
  max(hole, 15%)) and its subtree fills the rings. `up` is its parent's id (`null` for a root).
- Labels (12px, estimated): on the center disc across it; on arcs of at least 8° along the radius
  (room: the ring's thickness − 8px) or along the ring (room: the chord whose sagitta stays inside
  the ring), whichever is larger, upright; left out without room for two characters and an
  ellipsis; white on shades from 0.6, primary text below. `dataLabels`: the value after the name.

Icicle geometry (core `chart-icicle.ts` on `chart-partition.ts`, ADR-0058):
- Spans as for sunbursts, along the breadth (the width for `top` / `bottom`, the height for `left`
  / `right`; `radial` draws from the top); one band per level, `depth extent / levels` thick, the
  roots on the first band. `leaf: stop` (the icicle default) ends shallow leaves at their band,
  `extend` reaches the far edge. Cells: `rx` 2, the same paper stroke (`spacing`) and tint as arcs.
- Drill: `zoomType: value` (default) draws the drilled node's ancestors and the node as full bands
  (an ancestor's press zooms out to it, the node's own zooms out one level), its subtree below;
  `both` makes the node the first band.
- Labels (12px, estimated): centered in cells at least 30px long and a line + 6px tall, cut with an
  ellipsis; tones as for arcs. `dataLabels`: the value after the name.

Geo charts (core `chart-geo.ts`, ADR-0059): `type="geo"`, no tile style, no MapLibre.
- `geometry` (GeoJSON `FeatureCollection` / feature / list; `Polygon` and `MultiPolygon` only) and
  `regions: { id, name?, label?, value? }[]`, joined by `joinBy` (feature property; default the feature's
  `id`, then its `id` / `iso_a2` / `name` property). Limits: 2000 regions, 400 000 coordinates. HTML:
  the table (`th` name, `data-ok-value` id, `data-ok-label` tile text, `data-ok-cell="col,row"`, `td`
  value) and `data-ok-geometry="<id of a script[type=application/json]>"` or `setGeometry()`.
- Projections: `equalEarth` (default; Šavrič et al. 2018), `mercator`, `equirectangular`. Rings are not
  resampled. `sphere` draws the projected globe and fits it; `graticule`: 30° lines. Without
  `sphere` the fit is the features' box (8px padding).
- `mapScale` (the Map's) classifies `value`s: `scaleMethod`, `scaleClasses` (default 5),
  `scaleThresholds`; `colors`: one color → its five shades, several → a ramp (default `primary`
  shades). Each class is a `data-ok-color`; a region with no value is `data-ok-no-data`
  (`--ok-bg-neutral`, tooltip "No data", `localeText.noData`).
- Legend: one item per class (range text), `hidden` / `hiddenSeries` are class indexes and mute regions
  (`fill-opacity` 0.18 attribute). No null class item.
- Keyboard: layout mode `cell` (arrows to the nearest region center, Home / End top-left / bottom-right,
  `mark.px/py` = biggest ring's centroid); hit test even-odd on the rings (`mark.geo`); selection
  outlines the region; tooltip title is the name, one row with `localeText.y`.
- `geoLayout="hex"`: pointy-top hexagons in an odd-r offset grid at `hexCells` (`{ id, col, row }`;
  a hex map needs no geometry) or, without them, placed from the centroids (fills outward from
  the middle). `dataLabels`: the `label` / name when it fits the shape's box (white from the upper
  half of the classes).
- Not built: `orthographic` and rotation, pan and zoom, shape ↔ hex morph, bubbles / markers on
  `geo`, a null legend item, label collision.

Streamgraph geometry (core `chart-stream.ts`, drawn on `layoutChart`'s axes, 4.18.21):
- Data: series as for a line chart, joined on x (a missing value counts as zero, negatives are floored
  at zero); numeric x values become category labels in order of first use. A whole type.
- Order bottom to top: `inside-out` sorts by the index of each series' peak and alternates onto the
  lighter side (the earliest peaks in the middle), `inverse`, `none`.
- Baseline per column: `wiggle` (Byron and Wattenberg's weighted slope, re-centered on the stream's own
  extent), `silhouette` (`-total / 2`), `zero`, `expand` (each column 0 to 100).
- The bands are ranges in `layoutChart`, so slots, zoom and annotations work; the value scale fits the
  edges (no zero). Grid and value axis are off unless asked (`grid`, `yaxis.show`).
- Labels: the series name at the thickest column whose neighbors still hold a line of text and at
  least `streamLabelMinWidth` px (default 24), `plain` on `-lighter` / `-light` colors, else `inside`.
- Keyboard and pointer: `index` mode by x value (crosshair, a marker per band); the tooltip lists each
  band's supplied value top down, then `Total` (not with `expand`). `tooltip="point"`: one band per
  mark, a `fill-opacity` veil over the plot fades the others (`streamHoverOpacity`, default 0.35; at 1
  the veil is off).
- Cues: `fill="pattern"` / `colorBlindMode` fill bands with patterns; names on the bands.

Violin geometry (core `chart-stats.ts`, `chart-violin.ts` on `layoutChart`'s axes, 4.18.21):
- Data: `y` = observations, or `{ density: [[value, weight]], points: [...] }`; point-level `points` also
  works. `chartData` keeps `y` = median, `range` = the five numbers and `point.violin` (at most 20 000
  observations). A whole type (no mixed charts); numeric x values are labels in order of first use.
- Curve: the given `density` (sorted), or a Gaussian KDE (bandwidth `kdeBandwidth` or Silverman's
  `0.9 · min(sd, IQR / 1.34) · n^(−1/5)`), `kdeResolution` (64, 4–256) values from three bandwidths
  below the minimum to three above the maximum; the value scale spans the curve.
- Width: `violinNormalize` `individual` (each violin's own peak) or `group`; half-width = slot / 2 ·
  `bandwidthScale`. `violinSide` draws half a violin (`left`/`top` negative, `right`/`bottom` positive).
- Box (`violinBox`): the quartiles in a 15% (at least 4px) wide box, a median line and whiskers
  (`minmax` or Tukey's 1.5 × IQR). Dots: jittered by a golden ratio sequence, so renders agree;
  `violinMaxPoints` (3000) thins evenly; `unconstrainedViolinPoints` lets them leave the outline.
- Tooltip: the five numbers and `Count` (`Series (Part)` with several series). Index mode, a band
  highlight; marks are blocks (`box`), so clicks select them.

Beeswarm geometry (core `chart-beeswarm.ts` on `layoutChart`'s axes, 4.18.21):
- Data: one series per lane, one value per observation (`null`: none); observations are named by
  `categories` or `{ x, y }` points, else numbered from 1. One table row per observation. A whole type.
- Lanes are the band scale: `layoutChart` gets one category per visible series and a point that spans
  its values; the value axis is horizontal by default (`orientation="vertical"` turns it). Hidden lanes
  reflow.
- Swarm: dots sorted by value, each pushed from the center only as far as the dots within a
  diameter along the axis allow (smallest offset). Without `markerSize` the radius starts at 5 and
  shrinks (at least 2) to fit the lane (90 % of the band); what still overflows is squeezed.
- `jitter`: a golden ratio sequence across the lane. Both are deterministic.
- `point` mode: one tooltip per dot (name, series, value), keyboard in reading order, Enter / click selects.
- Cues: `colorBlindMode` / `markerShape` shapes per lane, lane labels; a point's `color` wins.

Waffle geometry (core `chart-unit.ts`, 4.18.21):
- Data like pie: one series, one value per category (the legend lists and hides categories, `data-ok-color`
  on every table cell). `total` shares that many cells by the largest remainder, so they always add up;
  without it a value is `value / unitValue` cells, scaled down above `maxUnits` (5000).
- Grid: `columns` (10) per row, rows from the cell count, pitch from the box (at most 48px), gap `spacing`
  or 12% (at least 2px), cells filled row by row from `fillFrom` (`bottom` default), in category order.
  Cells are squares (`cellRadius`, 2), or a shape per category with `colorBlindMode` / `markerShape`.
- `split`: one tile per category: `total` cells (default 100), `value / splitMax` (default the largest)
  of them filled, the rest `data-ok-chart-unit-track`; `tileColumns` per row, the name under each tile.
- Mode `unit`: a category is one item (slots = visible categories; arrows, Home, End); the pointer finds
  the category of the mark under it; the highlight is one `path` around its marks; `Enter` / clicks select it.

Unit geometry (core `chart-unit-layouts.ts` on `layoutUnit`, 4.18.21):
- `grouped`: a hexagonal blob per category, in equal columns; the pitch fits the largest blob (at most 48px,
  a mark radius of 42% of the pitch or `markerSize`), `spacing` opens the lattice; `packed`: one blob, marks in
  distance order, the smallest group first (the center), unless `disableSortByGroup`; `columns`: rows of dots from
  the bottom, the same number across every column so heights compare; `grid`: the waffle lattice; `arc`:
  concentric rows between `innerSize` (40%) and the outer radius, over `startAngle` to `endAngle` (-90 to 90),
  seats shared by the rows' capacity and filled in angle order by category; `arcRows` (default the fewest that fit).
- `clusterLabels`: names under `grouped` clusters and `columns`.
- Mode `unit` as for waffles: a category is one tooltip, keyboard and selection item.

Phase 3 geometry (core `chart-layout.ts`, `chart-cells.ts`, `chart-shapes.ts`):
- Value scales start at 0 unless a box plot, range area, bubble or sparkline series fits them to
  the data (bars and areas next to them keep 0).
- Box plots: boxes `columnWidth` % of a category, side by side per box series; caps a quarter of a
  box wide. Upper box `boxUpperColor` (default the series color), lower `boxLowerColor` (default
  its lighter tone).
- Bubbles: radius 4px to a tenth of the plot's smaller side (at least 8px), by √(|z| / largest |z|).
- Heatmap and treemap cells: 3px gaps; `fill-opacity` from 0.12 (heatmap) or 0.48 (treemap) at the
  smallest visible value to 1 at the largest. Labels on cells are white from 0.6 up, primary text
  below (`plain`). Treemaps are squarified (Bruls et al.): series boxes by their totals, then
  cells by value, largest first; names 14px when they fit; series tags with several series.
- Funnel: the first visible series, bars centered, as long as their share of the largest value,
  `barHeight` % of a category thick (default 80).
- Slope: straight lines through each category (usually two), the scale fits the data, values
  beside the first and last points; markers `markerSize` (default 4).
- Sparklines: no axes or grid; 3px padding (1px for bars) for strokes and markers.

## Options
<!-- options:chart (generated by `pnpm specs:options` from the schema in packages/core/src/anatomy/anatomy.ts) -->
Root: `data-ok-chart`. Unknown values fall back to the default.

| React | HTML | Kind | Values | Default | Description |
|---|---|---|---|---|---|
| `type` | `data-ok-type="…"` | style | `line` `area` `bar` `scatter` `pie` `donut` `radialBar` `radar` `boxPlot` `heatmap` `treemap` `bubble` `rangeArea` `funnel` `slope` `candlestick` `rangeBar` `timeline` `polarArea` `sankey` `waterfall` `dumbbell` `tree` `sunburst` `icicle` `geo` `streamgraph` `violin` `beeswarm` `waffle` `unit` | `line` | Chart type: `line`, `area`, `bar` (columns; rows with `horizontal`), `scatter`, `pie`, `donut`, `radialBar`, `radar`, `boxPlot`, `heatmap`, `treemap`, `bubble`, `rangeArea`, `funnel`, `slope`, `candlestick`, `rangeBar`, `timeline`, `polarArea`, `sankey` (links between nodes: `nodes` and `edges` in React, one table row per link in HTML), `waterfall` (each value a step from the running total; `isTotal` / `isSubtotal` points show the total), `dumbbell` (a start and an end value per category: two markers joined by a line), `tree` (a hierarchy: `hierarchy` in React, one table row per node with its parent in HTML), `sunburst` (the same hierarchy as rings, each node an arc sized by its value), `icicle` (the same hierarchy as bands, each node a cell sized by its value), `streamgraph` (stacked bands around a moving baseline, with a total per x value), `violin` (the distribution of observations per category as a mirrored density curve), `beeswarm` (each observation a dot in its series' lane, along the value axis), `waffle` (a grid of cells, each category filling a share), `unit` (each value as a number of marks, in blobs, columns or an arc) or `geo` (regions of GeoJSON geometry or hex tiles, colored by value classes, no map tiles: `geometry` and `regions` in React, a table of regions and `data-ok-geometry` or `setGeometry()` in HTML). Series may override it in line, area, bar, scatter, box plot, bubble, range area and candlestick charts (mixed charts). |
| `xType` | `data-ok-x-type="…"` | style | `category` `datetime` `numeric` | `category` | X axis: `category` labels, `datetime` (ISO 8601 dates) or `numeric` values (scatter). |
| `curve` | `data-ok-curve="…"` | style | `smooth` `straight` `stepline` | `smooth` | Line shape: `smooth`, `straight` or `stepline`. |
| `legend` | `data-ok-legend="…"` | style | `top` `right` `bottom` `none` | `top` | Legend position: `top`, `right`, `bottom` or `none` (never shown for a single series). |
| `fill` | `data-ok-fill="…"` | style | `gradient` `solid` `pattern` | `gradient` | Area fill: a fading `gradient`, a `solid` tint or a `pattern` (bars, areas and slices too; a different pattern per series unless `fillPattern` is set). |
| `stacked` | `data-ok-stacked` | flag | boolean | off | Stacks the series on each other (bars, lines, areas). |
| `horizontal` | `data-ok-horizontal` | flag | boolean | off | Bars run left to right, categories down the side. |
| `height` | `data-ok-height="…"` | number | number | `320` | Height of the plot in px (at least 40, sparklines 8). |
| `markerSize` | `data-ok-marker-size="…"` | number | number | — | Marker radius of line and area points in px (default none; scatter points 5). |
| `columnWidth` | `data-ok-column-width="…"` | number | number | `40` | Column width in % of a category. |
| `barHeight` | `data-ok-bar-height="…"` | number | number | — | Horizontal bar thickness in % of a category (default 40; funnels 80). |
| `yMin` | `data-ok-y-min="…"` | number | number | — | Lowest value on the value axis (default from the data). |
| `yMax` | `data-ok-y-max="…"` | number | number | — | Highest value on the value axis (default from the data); radial bars: the value of a full ring (default 100). |
| `dataLabels` | `data-ok-data-labels` | flag | boolean | off | Prints the values on the chart: percentages on pie and donut slices, values in bars and above points. |
| `startAngle` | `data-ok-start-angle="…"` | number | number | `0` | Pie, donut and radial bar: where the slices or rings start, in degrees clockwise from 12 o'clock. |
| `endAngle` | `data-ok-end-angle="…"` | number | number | `360` | Pie, donut and radial bar: where they end (at most one turn after `startAngle`). |
| `dashArray` | `data-ok-dash-array="…"` | number | number | — | Dash length of lines and radial bars in px (default solid). |
| `trackWidth` | `data-ok-track-width="…"` | number | number | `50` | Radial bar track thickness in % of the bar. |
| `total` | `data-ok-total="…"` | number | number | — | Donut and radial bar center: the total shown under `totalLabel` (default the sum; radial bars the average). Waffle charts: the cells shared out between the categories (`100` for a percentage waffle; default one cell per unit); split waffles: the cells of each tile (default 100). |
| `sparkline` | `data-ok-sparkline` | flag | boolean | off | No axes, grid or legend: the chart fills its container (cards, table cells). Its height is the container's, at least `height` (default 40px). |
| `boxUpperColor` | `data-ok-box-upper-color="…"` | style | `primary` `primary-lighter` `primary-light` `primary-main` `primary-dark` `primary-darker` `secondary` `secondary-lighter` `secondary-light` `secondary-main` `secondary-dark` `secondary-darker` `info` `info-lighter` `info-light` `info-main` `info-dark` `info-darker` `success` `success-lighter` `success-light` `success-main` `success-dark` `success-darker` `warning` `warning-lighter` `warning-light` `warning-main` `warning-dark` `warning-darker` `error` `error-lighter` `error-light` `error-main` `error-dark` `error-darker` | — | Box plots: color of the box above the median (default the series color). |
| `boxLowerColor` | `data-ok-box-lower-color="…"` | style | `primary` `primary-lighter` `primary-light` `primary-main` `primary-dark` `primary-darker` `secondary` `secondary-lighter` `secondary-light` `secondary-main` `secondary-dark` `secondary-darker` `info` `info-lighter` `info-light` `info-main` `info-dark` `info-darker` `success` `success-lighter` `success-light` `success-main` `success-dark` `success-darker` `warning` `warning-lighter` `warning-light` `warning-main` `warning-dark` `warning-darker` `error` `error-lighter` `error-light` `error-main` `error-dark` `error-darker` | — | Box plots: color of the box below the median (default a lighter tone of the series color). |
| `candleUpColor` | `data-ok-candle-up-color="…"` | style | `primary` `primary-lighter` `primary-light` `primary-main` `primary-dark` `primary-darker` `secondary` `secondary-lighter` `secondary-light` `secondary-main` `secondary-dark` `secondary-darker` `info` `info-lighter` `info-light` `info-main` `info-dark` `info-darker` `success` `success-lighter` `success-light` `success-main` `success-dark` `success-darker` `warning` `warning-lighter` `warning-light` `warning-main` `warning-dark` `warning-darker` `error` `error-lighter` `error-light` `error-main` `error-dark` `error-darker` | — | Candlesticks: color of rising candles (default `success`). |
| `candleDownColor` | `data-ok-candle-down-color="…"` | style | `primary` `primary-lighter` `primary-light` `primary-main` `primary-dark` `primary-darker` `secondary` `secondary-lighter` `secondary-light` `secondary-main` `secondary-dark` `secondary-darker` `info` `info-lighter` `info-light` `info-main` `info-dark` `info-darker` `success` `success-lighter` `success-light` `success-main` `success-dark` `success-darker` `warning` `warning-lighter` `warning-light` `warning-main` `warning-dark` `warning-darker` `error` `error-lighter` `error-light` `error-main` `error-dark` `error-darker` | — | Candlesticks: color of falling candles (default `error`). |
| `donutSize` | `data-ok-donut-size="…"` | number | number | — | Donut hole in % of the radius (10 to 95; default 72). |
| `dataLabelBackground` | `data-ok-data-label-background` | flag | boolean | off | Data labels above points sit on a badge (a paper box with a border). |
| `legendValues` | `data-ok-legend-values` | flag | boolean | off | Legend items show a value: the slice's or ring's, or the series' last one. |
| `zoom` | `data-ok-zoom` | flag | boolean | off | Zoom and pan the x axis: drag to select (mouse), pinch or drag (touch), Ctrl + wheel, keys `+` `-` `0` and Shift + arrows. |
| `toolbar` | `data-ok-toolbar` | flag | boolean | off | A toolbar with zoom buttons (with `zoom`) and downloads (SVG, PNG, CSV). |
| `animations` | `data-ok-animations` | flag | boolean | off | Series grow in when first drawn and move to new values on updates (never with reduced motion). |
| `orientation` | `data-ok-orientation="…"` | style | `horizontal` `vertical` | — | Sankey charts: the flow runs left to right (`horizontal`, the default) or top to bottom (`vertical`). Beeswarm charts: the value axis runs left to right (`horizontal`, the default) or upward (`vertical`). |
| `nodeWidth` | `data-ok-node-width="…"` | number | number | `20` | Sankey charts: node thickness along the flow in px. |
| `whitespace` | `data-ok-whitespace="…"` | number | number | `0.18` | Sankey charts: share of the fullest rank left between its nodes (0 to 0.9). |
| `edgeOpacity` | `data-ok-edge-opacity="…"` | number | number | `0.4` | Sankey charts: link opacity (0 to 1). |
| `navigator` | `data-ok-navigator` | flag | boolean | off | Stock charts: a navigator under the chart, the whole price line with the zoom as a brush (zooms like `zoom`). |
| `paneHeight` | `data-ok-pane-height="…"` | number | number | `120` | Stock charts: height in px of each indicator pane (volume, RSI, MACD…) under the price. |
| `allowMultipleDataPointsSelection` | `data-ok-allow-multiple-data-points-selection` | flag | boolean | off | Clicks and Enter or Space add points to the selection instead of replacing it. |
| `stackType` | `data-ok-stack-type="…"` | style | `normal` `100%` | — | Stacked charts: `normal` stacks the values, `100%` stacks each category's values as shares of their total (the value axis runs to 100%). |
| `stackOnlyBar` | `data-ok-stack-only-bar` | flag | boolean | off | Stacked mixed charts: only the bar series stack; lines and areas keep their own values. |
| `stackTotals` | `data-ok-stack-totals` | flag | boolean | off | Stacked bars: prints the total of each stack past its end. |
| `dataLabelPosition` | `data-ok-data-label-position="…"` | style | `center` `top` `bottom` | — | Bars: where data labels sit inside the bar: `center`, `top` (by the value end) or `bottom` (by the base). |
| `backgroundBars` | `data-ok-background-bars` | flag | boolean | off | Bars: a grey track the height of the plot behind each bar. |
| `backgroundBarOpacity` | `data-ok-background-bar-opacity="…"` | number | number | — | Bars: opacity of the tracks behind the bars (0 to 1; default 1). |
| `backgroundBarRadius` | `data-ok-background-bar-radius="…"` | number | number | — | Bars: corner radius of the tracks in px (default 4). |
| `markerShape` | `data-ok-marker-shape="…"` | style | `circle` `square` `triangle` `diamond` `cross` `plus` `star` | — | Shape of the markers of every series: `circle`, `square`, `triangle`, `diamond`, `cross`, `plus` or `star` (series may set their own). |
| `fillPattern` | `data-ok-fill-pattern="…"` | style | `slantedLines` `squares` `circles` `horizontalLines` `verticalLines` | — | Pattern of every bar, area and slice: `slantedLines`, `squares`, `circles`, `horizontalLines` or `verticalLines` (turns patterns on; series may set their own). |
| `strokeWidth` | `data-ok-stroke-width="…"` | number | number | — | Line width of every series in px (default 2.5; series may set their own). |
| `colorBlindMode` | `data-ok-color-blind-mode` | flag | boolean | off | Series differ by more than their color: a different marker shape (lines get markers), pattern and dash per series. |
| `tooltip` | `data-ok-tooltip-mode="…"` | style | `shared` `point` `none` | — | Tooltip: `shared` lists every series of the category, `point` only the value under the pointer (or the keyboard), `none` shows none (the values are still announced). |
| `tooltipFixed` | `data-ok-tooltip-fixed="…"` | style | `topLeft` `topRight` `bottomLeft` `bottomRight` | — | The tooltip stays in a corner of the plot: `topLeft`, `topRight`, `bottomLeft` or `bottomRight` (default beside the value). |
| `legendAlign` | `data-ok-legend-align="…"` | style | `left` `center` `right` | — | Legend items line up `left`, `center` or `right` (default right above the plot, centered below it and around circular charts). |
| `showForSingleSeries` | `data-ok-show-for-single-series` | flag | boolean | off | Shows the legend for a single series too. |
| `disableLegendToggle` | `data-ok-disable-legend-toggle` | flag | boolean | off | Legend items are plain labels: clicks don't hide series. |
| `grid` | `data-ok-grid="…"` | style | `y` `x` `both` `none` | — | Grid lines: `y` horizontal (along the value ticks, or between the bars of horizontal bar charts), `x` vertical, `both` or `none`. |
| `gridRowOpacity` | `data-ok-grid-row-opacity="…"` | number | number | — | Opacity of the row stripes (0 to 1; default 0.5). |
| `gridColumnOpacity` | `data-ok-grid-column-opacity="…"` | number | number | — | Opacity of the column stripes (0 to 1; default 0.5). |
| `waterfallPositiveColor` | `data-ok-waterfall-positive-color="…"` | style | `primary` `primary-lighter` `primary-light` `primary-main` `primary-dark` `primary-darker` `secondary` `secondary-lighter` `secondary-light` `secondary-main` `secondary-dark` `secondary-darker` `info` `info-lighter` `info-light` `info-main` `info-dark` `info-darker` `success` `success-lighter` `success-light` `success-main` `success-dark` `success-darker` `warning` `warning-lighter` `warning-light` `warning-main` `warning-dark` `warning-darker` `error` `error-lighter` `error-light` `error-main` `error-dark` `error-darker` | — | Waterfall charts: color of the steps that raise the total (default `success`). |
| `waterfallNegativeColor` | `data-ok-waterfall-negative-color="…"` | style | `primary` `primary-lighter` `primary-light` `primary-main` `primary-dark` `primary-darker` `secondary` `secondary-lighter` `secondary-light` `secondary-main` `secondary-dark` `secondary-darker` `info` `info-lighter` `info-light` `info-main` `info-dark` `info-darker` `success` `success-lighter` `success-light` `success-main` `success-dark` `success-darker` `warning` `warning-lighter` `warning-light` `warning-main` `warning-dark` `warning-darker` `error` `error-lighter` `error-light` `error-main` `error-dark` `error-darker` | — | Waterfall charts: color of the steps that lower the total (default `error`). |
| `waterfallTotalColor` | `data-ok-waterfall-total-color="…"` | style | `primary` `primary-lighter` `primary-light` `primary-main` `primary-dark` `primary-darker` `secondary` `secondary-lighter` `secondary-light` `secondary-main` `secondary-dark` `secondary-darker` `info` `info-lighter` `info-light` `info-main` `info-dark` `info-darker` `success` `success-lighter` `success-light` `success-main` `success-dark` `success-darker` `warning` `warning-lighter` `warning-light` `warning-main` `warning-dark` `warning-darker` `error` `error-lighter` `error-light` `error-main` `error-dark` `error-darker` | — | Waterfall charts: color of the total bars (default the series color). |
| `waterfallSubtotalColor` | `data-ok-waterfall-subtotal-color="…"` | style | `primary` `primary-lighter` `primary-light` `primary-main` `primary-dark` `primary-darker` `secondary` `secondary-lighter` `secondary-light` `secondary-main` `secondary-dark` `secondary-darker` `info` `info-lighter` `info-light` `info-main` `info-dark` `info-darker` `success` `success-lighter` `success-light` `success-main` `success-dark` `success-darker` `warning` `warning-lighter` `warning-light` `warning-main` `warning-dark` `warning-darker` `error` `error-lighter` `error-light` `error-main` `error-dark` `error-darker` | — | Waterfall charts: color of the subtotal bars (default the total color). |
| `hideConnectors` | `data-ok-hide-connectors` | flag | boolean | off | Waterfall charts: no dashed lines from the end of each bar to the next one. |
| `streamOffset` | `data-ok-stream-offset="…"` | style | `wiggle` `silhouette` `zero` `expand` | — | Streamgraphs: the baseline: `wiggle` (bands as flat as the data allows, the default), `silhouette` (centered on one line), `zero` (a stacked area) or `expand` (each x value fills the chart). |
| `streamOrder` | `data-ok-stream-order="…"` | style | `inside-out` `inverse` `none` | — | Streamgraphs: the stacking order: `inside-out` (series that peak first in the middle, the default), `inverse` or `none` (the series order). |
| `hideStreamLabels` | `data-ok-hide-stream-labels` | flag | boolean | off | Streamgraphs: no series names on the bands. |
| `streamLabelMinWidth` | `data-ok-stream-label-min-width="…"` | number | number | — | Streamgraphs: bands thinner than this many pixels get no name (default 24). |
| `unitLayout` | `data-ok-unit-layout="…"` | style | `grouped` `packed` `columns` `grid` `arc` | — | Unit charts: where the marks go: `grouped` (a blob per category, the default), `packed` (one blob), `columns` (stacked dots), `grid` (the waffle lattice) or `arc` (rows of seats). |
| `clusterLabels` | `data-ok-cluster-labels` | flag | boolean | off | Unit charts: category names under each cluster or column (grouped and columns layouts). |
| `disableSortByGroup` | `data-ok-disable-sort-by-group` | flag | boolean | off | Packed unit charts: keep the given order instead of the smallest group in the middle. |
| `arcRows` | `data-ok-arc-rows="…"` | number | number | — | Arc unit charts: the concentric rows (default the fewest that seat everyone). Use `innerSize` for the inner radius (default 40) and `startAngle` / `endAngle` for the sweep (default -90 to 90). |
| `columns` | `data-ok-columns="…"` | number | number | — | Waffle charts: cells per row (default 10). |
| `fillFrom` | `data-ok-fill-from="…"` | style | `bottom` `top` | — | Waffle charts: the row where the cells start filling: `bottom` (the default) or `top`. |
| `split` | `data-ok-split` | flag | boolean | off | Waffle charts: one mini waffle per category, filled to its value. |
| `tileColumns` | `data-ok-tile-columns="…"` | number | number | — | Split waffles: tiles per row (default about a square of tiles). |
| `splitMax` | `data-ok-split-max="…"` | number | number | — | Split waffles: the value a full tile stands for (default the largest value). |
| `trackColor` | `data-ok-track-color="…"` | style | `primary` `primary-lighter` `primary-light` `primary-main` `primary-dark` `primary-darker` `secondary` `secondary-lighter` `secondary-light` `secondary-main` `secondary-dark` `secondary-darker` `info` `info-lighter` `info-light` `info-main` `info-dark` `info-darker` `success` `success-lighter` `success-light` `success-main` `success-dark` `success-darker` `warning` `warning-lighter` `warning-light` `warning-main` `warning-dark` `warning-darker` `error` `error-lighter` `error-light` `error-main` `error-dark` `error-darker` | — | Split waffles: the color of the empty cells (default a neutral grey). |
| `unitValue` | `data-ok-unit-value="…"` | number | number | — | Waffle and unit charts: how many units of value one mark stands for (default 1). |
| `maxUnits` | `data-ok-max-units="…"` | number | number | — | Waffle and unit charts: the most marks drawn; counts scale down above it (default 5000). |
| `cellRadius` | `data-ok-cell-radius="…"` | number | number | — | Waffle charts: the corner radius of square cells in pixels (default 2). |
| `beeswarmSpread` | `data-ok-beeswarm-spread="…"` | style | `swarm` `jitter` | — | Beeswarm charts: dots push apart just enough not to overlap (`swarm`, the default) or spread across the lane by a fixed sequence (`jitter`). |
| `violinNormalize` | `data-ok-violin-normalize="…"` | style | `individual` `group` | — | Violins: each violin fills its slot (`individual`, the default) or all share one density scale (`group`). |
| `violinSide` | `data-ok-violin-side="…"` | style | `both` `left` `right` `top` `bottom` | — | Violins: symmetric (`both`, the default) or half a violin: `left`, `right`, `top` or `bottom`. |
| `bandwidthScale` | `data-ok-bandwidth-scale="…"` | number | number | — | Violins: multiplies the drawn half-width (default 1). This is not the statistical bandwidth (`kdeBandwidth`). |
| `kdeBandwidth` | `data-ok-kde-bandwidth="…"` | number | number | — | Violins: the kernel width of the density estimate, in value units (default Silverman's rule of thumb). |
| `kdeResolution` | `data-ok-kde-resolution="…"` | number | number | — | Violins: how many density samples each violin uses (4 to 256; default 64). |
| `violinBox` | `data-ok-violin-box` | flag | boolean | off | Violins: a five-number box beside the density. |
| `violinWhiskers` | `data-ok-violin-whiskers="…"` | style | `minmax` `tukey` | — | Violins with a box: the whiskers end at the data's extremes (`minmax`, the default) or at Tukey's 1.5 × IQR fences (`tukey`). |
| `hideViolinPoints` | `data-ok-hide-violin-points` | flag | boolean | off | Violins: no dots for the observations. |
| `violinPointSize` | `data-ok-violin-point-size="…"` | number | number | — | Violins: the radius of the observation dots in pixels (default 2.5). |
| `violinJitter` | `data-ok-violin-jitter="…"` | number | number | — | Violins: how far the dots spread, as a share of the half-width (0 to 1; default 0.5). |
| `unconstrainedViolinPoints` | `data-ok-unconstrained-violin-points` | flag | boolean | off | Violins: the dots may leave the density outline. |
| `violinMaxPoints` | `data-ok-violin-max-points="…"` | number | number | — | Violins: the most dots drawn per violin; extra observations are thinned evenly (default 3000). |
| `streamHoverOpacity` | `data-ok-stream-hover-opacity="…"` | number | number | — | Streamgraphs with `tooltip="point"`: the opacity of the bands that are not active (0 to 1; default 0.35). |
| `direction` | `data-ok-direction="…"` | style | `top` `bottom` `left` `right` `radial` | — | Tree and icicle charts: where the root sits, `top` (the default), `bottom`, `left` or `right`, or `radial` (trees: the root in the center, levels as rings). |
| `layoutType` | `data-ok-layout-type="…"` | style | `tree` `cluster` | — | Tree charts: `tree` (a tidy tree, the default) or `cluster` (a dendrogram: every leaf on the last level). |
| `edgeStyle` | `data-ok-edge-style="…"` | style | `orthogonal` `curved` `straight` | — | Tree charts: links with right angles (`orthogonal`, the default), `curved` or `straight`. |
| `enableExpandCollapse` | `data-ok-enable-expand-collapse` | flag | boolean | off | Tree charts: a click, Enter or Space on a node with children hides or shows them. |
| `innerSize` | `data-ok-inner-size="…"` | number | number | — | Sunburst charts: the hole in the center, in % of the radius (0 to 90; default 15). Unit charts with the `arc` layout: the inner radius in % of the outer (default 40). |
| `spacing` | `data-ok-spacing="…"` | number | number | — | Sunburst and icicle charts: the gap between arcs or cells in px (default 1). |
| `leaf` | `data-ok-leaf="…"` | style | `extend` `stop` | — | Sunburst and icicle charts: branches that end before the deepest level `extend` to the edge or `stop` at their level (default `extend` on sunbursts, `stop` on icicles). |
| `tint` | `data-ok-tint="…"` | number | number | — | Sunburst and icicle charts: how much paler each level is than the level its color starts at (0 to 1; default 0.14). |
| `disableZoomOnClick` | `data-ok-disable-zoom-on-click` | flag | boolean | off | Sunburst and icicle charts: a click, Enter or Space on a node doesn't zoom into it. |
| `zoomType` | `data-ok-zoom-type="…"` | style | `value` `both` | — | Icicle charts: a branch zoomed into keeps its ancestors as full bands above it (`value`, the default) or becomes the top level (`both`). |
| `projection` | `data-ok-projection="…"` | style | `equalEarth` `mercator` `equirectangular` | — | Geo charts: `equalEarth` (equal areas, the default), `mercator` (straight rhumb lines) or `equirectangular`. |
| `geoLayout` | `data-ok-geo-layout="…"` | style | `geographic` `hex` | — | Geo charts: real boundaries (`geographic`, the default) or equal hex tiles (`hex`). |
| `scaleMethod` | `data-ok-scale-method="…"` | style | `quantile` `equalInterval` `jenks` `threshold` | — | Geo charts: how values are split into classes: `quantile` (the default), `equalInterval`, `jenks` (natural breaks) or `threshold` (your own `scaleThresholds`). |
| `xMin` | `data-ok-x-min="…"` | number | number | — | The first x position shown when nothing has zoomed the chart: a category index, a timestamp in milliseconds (date axes) or an x value (numeric axes). |
| `xMax` | `data-ok-x-max="…"` | number | number | — | The last x position shown when nothing has zoomed the chart (see `xMin`). |
| `xRange` | `data-ok-x-range="…"` | number | number | — | Shows the last so many x units, ending at `xMax` or the last x value (a sliding window for live data). |
| `xLabelRotate` | `data-ok-x-label-rotate="…"` | number | number | — | X labels turn by this many degrees (-90 to 90) when they don't fit flat. Without it, labels that don't fit are left out. |
| `xLabelRotateAlways` | `data-ok-x-label-rotate-always` | flag | boolean | off | X labels turn by `xLabelRotate` even when they fit flat. |
| `rangeBarGroupRows` | `data-ok-range-bar-group-rows` | flag | boolean | off | Range bars and timelines: the series share one lane per category, so bars of different series line up in a row. |
| `disableRangeBarOverlap` | `data-ok-disable-range-bar-overlap` | flag | boolean | off | Range bars and timelines: bars that overlap in time go to lanes of their own instead of being drawn over each other. |
| `hideZeroBarsWhenGrouped` | `data-ok-hide-zero-bars-when-grouped` | flag | boolean | off | Grouped columns: zero and empty bars take no slot, so the other bars of a category close up around its center. |
| `dataReducer` | `data-ok-data-reducer` | flag | boolean | off | Long lines and areas draw only the points that shape them (Largest Triangle Three Buckets); the table, the tooltip and the keyboard keep every point. |
| `dataReducerTargetPoints` | `data-ok-data-reducer-target-points="…"` | number | number | — | Points kept per series when reducing (default 250). |
| `dataReducerThreshold` | `data-ok-data-reducer-threshold="…"` | number | number | — | A series with more visible points than this is reduced (default 500). |
| `forecastCount` | `data-ok-forecast-count="…"` | number | number | — | How many points at the end of each line, area or bar series are a forecast: lines are dashed, areas and bars faint. |
| `forecastDashArray` | `data-ok-forecast-dash-array="…"` | number | number | — | Forecast line dashes in px (default 4). |
| `forecastStrokeWidth` | `data-ok-forecast-stroke-width="…"` | number | number | — | Forecast line width in px (default the series' width). |
| `forecastFillOpacity` | `data-ok-forecast-fill-opacity="…"` | number | number | — | Opacity of forecast areas and bars (0 to 1; default 0.5). |
| `noDataAlign` | `data-ok-no-data-align="…"` | style | `left` `center` `right` | — | Where the `noDataText` message sits across the plot: `left`, `center` (the default) or `right`. |
| `noDataVerticalAlign` | `data-ok-no-data-vertical-align="…"` | style | `top` `middle` `bottom` | — | Where the `noDataText` message sits down the plot: `top`, `middle` (the default) or `bottom`. |
| `scaleClasses` | `data-ok-scale-classes="…"` | number | number | `5` | Geo charts: how many value classes (at most the colors available). |
| `sphere` | `data-ok-sphere` | flag | boolean | off | Geo charts: the outline of the globe behind the regions. |
| `graticule` | `data-ok-graticule` | flag | boolean | off | Geo charts: lines of longitude and latitude every 30 degrees. |
| `crossfilter` | `data-ok-crossfilter="…"` | style | `filter` `highlight` | — | Charts of a `group`: a selection (click, Enter or Space) or a brush in this chart filters the group, and this chart shows the group's filter as a `filter` (only the filtered categories keep their values) or a `highlight` (a tint behind them). |
| `hiddenSeries` | `aria-pressed` · event `ok:chart:toggle` | state | — | — | Indexes of the series hidden through the legend (`aria-pressed="false"` on their buttons); categories in pie, donut and radial bar charts. |
| `selectedDataPoints` | `instance.selectedDataPoints` · event `ok:chart:select` | state | — | — | The selected points, `{ seriesIndex, dataPointIndex }[]`: a click selects the point, slice or cell under the pointer, Enter or Space the active one. |
| `zoomRange` | `instance.zoomRange` · event `ok:chart:zoom` | state | — | — | The visible window of the x axis, `{ min, max }` (category indexes or x values), or `null`. |
<!-- /options:chart -->

Text attributes (React prop ↔ HTML attribute, written by React too): `yTitle` ↔
`data-ok-y-title`, `xTitle` ↔ `data-ok-x-title`, `yaxis` ↔ `data-ok-yaxis` (core `chartYAxesText` /
`parseChartYAxes`: axes separated by `;`, each the words `opposite`, `logarithmic`, `reversed`,
`hidden`, `log-base <n>`, `tick-amount <n>`, `min <n>`, `max <n>`, then `title <text>`; series
names stay out of it: each series column carries its axis, `th[data-ok-y-axis="<n>"]`), `valuePrefix` ↔ `data-ok-value-prefix`, `valueSuffix` ↔ `data-ok-value-suffix`,
`locale` ↔ `data-ok-locale` (default `en-US`), `backgroundBarColors` ↔
`data-ok-background-bar-colors` (palette names separated by spaces), `discreteMarkers` ↔
`data-ok-discrete-markers` (`"<series> <point> [color] [shape] [size]; …"`, core
`chartDiscreteMarkersText` / `parseChartDiscreteMarkers`), `customLegendItems` ↔
`data-ok-custom-legend-items` (`; `-separated), `gridRowColors` / `gridColumnColors` ↔
`data-ok-grid-row-colors` / `data-ok-grid-column-colors` (space-separated: palette names, `grey`,
`transparent`; core `parseChartStripeColors`), `dumbbellColors` ↔ `data-ok-dumbbell-colors`
(`"start end; …"`, core `chartDumbbellColorsText` / `parseChartDumbbellColors`), `group` ↔ `data-ok-group`, `brushTarget` ↔
`data-ok-brush-target`, `colorRanges` ↔ `data-ok-color-ranges` (`"from to color [name]; …"`, core
`chartTextAttributes` / `parseChartColorRanges`). Always set as text (`textContent`), never markup.

Phase 4 content (ADR-0031): `annotations` (`{ axis: "x" | "y" | "point", x?, x2?, y?, y2?, label?,
color? }[]`) ↔ `ul[data-ok-chart-annotations] › li` (x: a category label, an ISO date between date
categories, or a number; invalid entries dropped); `dataLabelFormatter(value, series, index)` ↔
`setFormatters({ dataLabel })` (pie / donut get the percentage); `localeText` (part labels, tool
names, `toolbar`, `exportFailed`) ↔ the part headers of the table + `setLocaleText(text)`.

`totalLabel` ↔ `data-ok-total-label` (donut / radial bar center; no total without it).

Content: `label` ↔ `caption`; `series` (`{ name, data, type?, color? }[]`; values are numbers,
`null` gaps, `[x, y]` pairs, `[x, y, z]` triples (bubbles) or `{ x, y, z, color }`; box plots give
`y` five values (minimum, Q1, median, Q3, maximum), range areas two (low, high), sorted on read;
without `categories`, a text `x` names the point's category (treemaps)) ↔ table columns (series of
several values: one column per value under a second header row, `th[data-ok-part]`); `categories` ↔ row headers
(dates: ISO 8601 in `data-ok-value`); `colors` ↔ `data-ok-color` on column headers; `xLabel` ↔ the
first column header; `valueFormatter(value, series)` / `labelFormatter(x)` ↔
`instance.setFormatters({ value, label })` (axis ticks get `series` -1).

Pie, donut and radial bar charts draw the **first series**, one slice or ring per category; the
legend lists the categories and `hiddenSeries` holds category indexes. Slice colors: the point's
`color`, else `colors[i]`, else the default order — written on every cell (`data-ok-color`), so
HTML tables carry them. Polar charts ignore series `type` (no mixed charts), `stacked` and
`horizontal`. Radial bar values print with a `%` suffix unless `valueSuffix` is set. Center: a
donut with `totalLabel` shows the sum of the visible slices (or `total`); a single radial ring
shows its value and its category; several rings with `totalLabel` show their average (or
`total`). An explicit `total` prints as a plain number in the locale.

Heatmaps, treemaps, funnels and slopes draw every series the same way (series `type` is ignored);
box plots, range areas and bubbles mix with line, area, bar and scatter series. Funnels draw the
first visible series (a pyramid is a funnel of growing values, colored per point). Tooltips: box
plots list the five values, range areas `low – high`, bubbles the value and a "Size" row.

## States
- `aria-pressed` on legend buttons: `false` = the series is hidden (left out of the scale; it stays
  in the table).
- Active category / point: crosshair line (lines, areas; radar: the category's spoke) or band
  (bars) under the series, bigger markers over them, tooltip visible (`hidden` removed). Pie and
  donut: a 6px halo of the slice's color behind it; radial bars: the tooltip only; heatmap and
  treemap cells: a 2px primary-text outline; bubbles: a disc 2px larger. Position via CSSOM:
  `--_ok-chart-tip-x|y` on the tooltip (never a style string).
- `data-ok-ready` on the root once drawn: the data table becomes visually hidden.

## Behavior
- Size: the SVG is drawn at the plot's width (`ResizeObserver`), `height` px tall; the first render
  (server, before measuring) uses 640px and the viewBox scales it. Sparklines: the plot fills the
  root (`height: 100%`), at least `--_ok-chart-height` (`height` px through CSSOM / React `style`,
  default 40px); the SVG is out of flow and drawn at the plot's measured height.
- Pointer: the nearest category (index charts), the nearest point within 24px or inside its bubble
  (scatter, bubble), the cell under the pointer (heatmap, treemap), the slice
  or ring (its whole track) under the pointer with 8px of slack (circular charts), or the nearest
  category axis by angle within the web + 24px (radar) is active;
  a mouse leaving the plot clears it; touch keeps it until the next tap.
- Tooltips (4.18.63): `tooltip="point"` turns an index chart's layout (not radars) into `point`
  mode: the block under the pointer (2px of slack), else the nearest point within 24px; one row;
  blocks show their category's band, points their marker; arrows move mark by mark (left to right,
  then top to bottom); Enter / Space select that mark alone. `tooltip="none"` keeps the status
  visually hidden (keyboard values announced) and the hover highlight. `tooltipFixed` places the
  tooltip 8px inside a corner of the plot area (`chartTooltipFixed` + `placeChartTooltip(…, fixed)`).
  Custom content: core `chartTooltipContext(layout, tooltip, active)`; React renders
  `tooltipContent(context)` in the tooltip instead of its parts, the HTML runtime clones
  `template[data-ok-chart-tooltip]` (direct child of the root) on each change.
- Legend (4.18.64): `legendAlign` lines items up (CSS), `showForSingleSeries` shows one item,
  `customLegendItems` renames items (item n is series n), `disableLegendToggle` makes them labels.
  Grid (core `layoutChart`): row positions (horizontal lines) and column positions (vertical) per
  layout; stripes (`rect[data-ok-chart-stripe]`, CSS fill grey or the palette color, `fill-opacity`
  an attribute) between consecutive positions before the lines; transparent entries draw nothing.
- Legend click toggles the series (React `onHiddenSeriesChange`, HTML cancelable `ok:chart:toggle`).
- Selection (4.18.60, core `chart-select.ts`): a click on the plot selects the mark under it —
  the block (bar, box, candle, range bar, funnel bar; 2px slack), the slice or ring, the cell, or
  the nearest point within 16px (index charts) or the scatter / bubble rules of the pointer —
  and a click on the selected mark clears it; empty space does nothing. Enter or Space on the
  focused plot toggles the active item: a category's points together (every visible series), a
  slice, ring, cell or point alone; when all of them are selected they clear, otherwise they are
  selected. Without `allowMultipleDataPointsSelection` a selection replaces the previous one; with
  it, points add up. A point is `{ seriesIndex, dataPointIndex }`: the category index (circular
  charts: the slice), or on numeric axes the position among the series' points with a value. Not
  after a drag that moved 4px or more (`createChartGestures().moved`), never on brush charts, not
  on Sankey charts. The selection is kept by index across data updates and legend toggles (points
  that aren't drawn show no outline). Each toggled point fires one `ok:chart:select` / one
  `onDataPointSelection` call after the change. The tooltip of an item with a selected point shows
  a "Selected" line. Methods (`setSelectedDataPoints`, `toggleDataPointSelection`) fire no event.
  Selected outlines: `g[data-ok-chart-selected]` before `g[data-ok-chart-active]` (rings: hover
  radius + 3px; frames: 2px outside, `rx 4`; slices: the slice with 4px more outer radius).
- HTML redraws when the table (structure, text, attributes), an option attribute or the size changes.
  Redraws patch the SVG in place (same-tag elements keep their identity; only changed attributes
  and text are written) and read the size from the `ResizeObserver`, never forcing a layout.
- Data updates (React: new `series` / `categories` props; HTML: `updateSeries`, `appendData`, or
  table edits) keep the active category or point by position and the hidden series by index;
  an active item that no longer exists shows no tooltip. HTML API updates rewrite the data table in
  place (rows and cells reused; the caption and the first header's text kept), so the accessible
  view always matches the drawing.
- Animations (`animations`, opt-in): CSS only. On first draw the series group reveals from the
  left (`clip-path`) or grows from the center (polar charts); later updates transition `d`, `x`,
  `y`, `width`, `height`, `cx`, `cy`, `r` where the engine animates them (elements keep their
  identity). Nothing moves under `prefers-reduced-motion: reduce`.
- Zoom (`zoom`, vertical charts with an x axis: line, area, column, scatter, bubble, box plot,
  candlestick, range area, range bar, mixed): a window of category indexes (whole numbers, at least
  two categories) or x values (numeric axes); the value axis keeps the whole data's scale. Mouse drag
  selects (a `selection` preview), Ctrl / ⌘ + wheel zooms around the pointer, touch drags pan a
  zoomed chart, two fingers pinch, the pan tool makes every drag pan. Keys: `+` / `=`, `-`, `0`,
  Shift + Left / Right. Escape hides the tooltip, then resets. Gestures: core
  `createChartGestures` (reports ranges; owns no state). An uncontrolled zoom is kept with the axis
  it was set on: a range that reached the last x value follows new points (live tails).
- Crossfilter (4.18.19, ADR-0054; core `chart-filter.ts`, the registry of `linkChart`): charts of
  a `group` with `crossfilter` share one filter, a set of category indexes. Sources: the chart's
  own selection changed by a click, Enter or Space (`chartFilterCategories`: the unique
  `dataPointIndex` of the selected points; numeric axes and Sankey charts are no sources) and a
  brush chart's own brush (`chartBrushCategories`: the whole categories in the range; the whole
  axis clears). One filter per group, kept with its source: a new one replaces it, a source that
  empties its selection clears only its own, a source that unlinks takes it along, a chart that
  links late gets it, a chart that links again republishes its selection. Members are told
  `{ categories, own }` or `null`. Receivers draw it (`renderChart` `crossfilter` + `filter`):
  `filter` lays out the data with the other categories as gaps (circular charts: those slices
  hidden; the legend keeps its state) and fits the value axis to what is left; `highlight` adds
  `g[data-ok-chart-filter-layer]` (primary at 0.12: the slot's band, a slice's halo of +6px, a
  cell's frame of +2px). The source draws its selection, not the filter. Legend, table, categories,
  keyboard slots and zoom extent keep the whole data. Radar, Sankey and numeric-axis charts draw no
  filter. The **Clear filter** button (shown on every participant while the group is filtered)
  clears the group and the source's selection (`select` events / `onDataPointSelection` with
  `selected: false`). Only the chart acted on writes its status: `"<filter>: North, West"` (up to
  20 names, then `(+n)`) or `"Filter cleared"`; texts `clearFilter`, `filter`, `filterCleared`
  (`localeText` / `setLocaleText`). Methods (`setSelectedDataPoints`, `toggleDataPointSelection`)
  don't publish filters. HTML: `ok:chart:filter` (detail `{ categories, own }`), instance `filter`,
  `clearFilter()`; React: `onFilterChange(categories, own)`. Without the filter, the controls box is
  out of the flow (no grid gap) but rendered, so its status announces.
- Groups (`group`): charts share the active category (by index) and the zoom; changes received from
  the group fire no `ok:chart:active` and don't spread again. Brush charts (`brushTarget`): a
  selection with handles over the whole axis (or the target's zoom); a drag inside moves it, its
  edges resize it, elsewhere a new one is drawn; it zooms the target and its group. Links: core
  `linkChart` (a module-scoped registry: React links with React, the HTML runtime with itself).
- Export (`toolbar` buttons, `exportChart`): SVG (computed paints inlined, the paper as
  background), PNG (that SVG on a 2× canvas), CSV (the data table: combined headers "Series
  (Part)", raw `data-ok-value`s, a BOM; text starting with `= + - @` is prefixed with `'`). Only
  during a user gesture (`navigator.userActivation`); failures are announced in the toolbar status.
- Sankey charts (layout mode `flow`): the pointer picks the node under it (3px slack), else the
  topmost link band (loops of cycles only by keyboard); the active node draws its links again at
  0.72 opacity (`path[data-ok-chart-active-link]`) and an outline; an active link draws itself
  again. Tooltip: node title + Incoming / Outgoing totals (rows only when > 0); link
  "Source → Target" + Value. No legend, no zoom. HTML reads the links table
  (`readChartSankeyTable`).
- Hierarchy charts (layout mode `tree`, ADR-0058): the pointer picks the topmost node shape under
  it (tree circles: 4px of slack). The active node draws the links from its root again in its
  color (`path[data-ok-chart-active-path]`) and a ring. Tooltip: the path (`Root › … › Node`),
  then Value (when values are given), Level and Children (Collapsed when hidden). No legend, no
  zoom, no selection. `enableExpandCollapse`: a click, Enter or Space on a node with children hides
  or shows them (HTML `ok:chart:expand`, cancelable; React `onCollapsedNodesChange`); the node stays
  active. The state is `data-ok-collapsed-nodes` on the root (`;`-separated ids, written by React
  and the runtime; authors may set it).
- Sunburst and icicle drill (ADR-0058, ApexCharts `zoomOnClick`): a click, Enter or Space on an
  arc or cell with children zooms into it; on the center disc (the icicle's drilled band) it zooms
  out one level, on an icicle ancestor band out to that ancestor; Escape (before hiding the
  tooltip) and **Back** zoom out one level too; the acted-on node stays active; at the top,
  **Back** hides and the focus moves to the plot. The state is `data-ok-drill-node` on the root
  (written by React and the runtime; authors may set it). HTML `ok:chart:drill` (cancelable,
  before the change); React `drillNode` / `defaultDrillNode` / `onDrillNodeChange`.
  `disableZoomOnClick` removes the controls and the drill keys (a set `drillNode` still shows).
  The drill row keeps its height while hidden, so the plot never moves under the pointer.
- Stock charts: one tooltip per date lists every visible series of every pane (OHLC, volume, each
  indicator); the crosshair band runs through all panes; the legend toggles indicators. A press in
  the navigator (±4px) works like a brush on the zoom: inside the window moves it, its edges (8px)
  resize it, elsewhere (or anywhere while unzoomed) draws a new one; it commits as a `user` zoom.
  `navigator` turns the zoom gestures and keys on (like `zoom`). HTML: the runtime rewrites the
  table after each draw when it has indicator columns (in place; its own mutations are taken back),
  so computed values never become input; `updateSeries` / `appendData` keep the indicators.
- Runtime needed: yes (`chart`). Without JavaScript the table stays visible.

## Responsive
- The chart fills its container; text never scales (redrawn at the measured width).
- Below 600px a `right` legend sits below the plot (`legend: right` keeps the attribute).
- Labels thin out as the width shrinks; nothing overflows the page at 320px.
- Polar charts fit the smaller side of the plot: on phones the circle shrinks with the width; a radar keeps room for its category labels.

## Keyboard
| Key | Action |
|---|---|
| Tab | Focuses the plot (one tab stop); keyboard focus shows the first category / point |
| Right / Down arrow | Next category (or point, scatter; slice or ring, circular charts; hidden slices are skipped) |
| Left / Up arrow | Previous category (or point) |
| Arrows (heatmap, treemap) | The nearest cell in the arrow's direction |
| Arrows (Sankey) | Next / previous node or link, rank by rank (a rank's nodes top to bottom, then the links leaving it) |
| Arrows (tree) | Toward the leaves: the first child; toward the root: the parent; across: the next / previous node drawn on the level (crossing parents). Top trees: Down / Up, Right / Left; bottom: Up / Down; left: Right / Left, Down / Up; right: Left / Right; radial: Right / Left out and in, Down / Up across |
| Home / End | First / last (cells: top-left / bottom-right; trees: the first root / the last node) |
| Enter / Space | Selects the active category's points, slice, ring, cell or point; pressed again, clears them (not on Sankey, hierarchy or brush charts). Trees with `enableExpandCollapse`: hides or shows the node's children |
| Arrows (sunburst) | Right / Left: the first child / the parent; Down / Up: the next / previous arc drawn on the ring |
| Enter / Space (sunburst) | Zooms into the active arc's branch; on the center disc, zooms out one level |
| Arrows (icicle) | Away from the root: the first child; toward it: the parent; the other two: the next / previous cell drawn on the band (top: Down / Up, Right / Left; bottom: Up / Down; left: Right / Left, Down / Up; right: Left / Right) |
| Enter / Space (icicle) | Zooms into the active cell's branch; on the drilled band, out one level; on an ancestor band, out to it |
| Escape | Sunbursts and icicles: zooms out one level first. Hides the tooltip; pressed again, resets the zoom (zoom and brush charts) |
| `+` / `=`, `-` | Zoom in / out around the middle (zoom and brush charts) |
| Shift + Left / Right | Pans the zoomed range by one category (a tenth on numeric axes) |
| `0` | Resets the zoom |

## Accessibility
- The plot is `role=group` + `aria-roledescription=chart`, named by `label` / the caption. The SVG is
  `aria-hidden`: the data table (visually hidden, never `display: none`) is the accessible view and
  keeps hidden series.
- The tooltip is `role=status`: values reached with the keyboard are announced.
- Selection (4.18.60): points aren't focusable elements (the plot is one tab stop over an
  `aria-hidden` SVG, keyboard model of ADR-0024), so neither `aria-selected` nor `aria-pressed`
  applies: the selected state is announced by the tooltip's status ("Selected", localizable), and
  drawn as an outline in the primary text color (not color alone). Enter / Space make it
  reachable without a pointer.
- Crossfilter (4.18.19): filters are set by the same click and Enter / Space as the selection (no
  drag needed, WCAG 2.5.7); the chart acted on announces the filter in its own polite status (one
  announcement per action); **Clear filter** is a native button (32px target); filtered charts keep
  every value in their data table; the highlight tint is behind the series and never the only cue
  of the source (its selection outline).
- Legend buttons: `aria-pressed`; hidden series show a hollow marker and crossed-out text (not color
  alone); targets at least 24 × 24px.
- Non-color cues (4.18.62, WCAG 1.4.1): marker shapes, patterns and dashes tell series apart without
  color; `colorBlindMode` turns all three on, and legend and tooltip markers repeat them.
- Axis labels use `--ok-text-secondary` (AA in light and dark); the reference's lighter grey is
  under 4.5:1 (ADR-0014). Center labels too (the reference paints a gauge's name in the
  disabled grey or the series color).
- Data labels inside slices and bars are white on the brand color (ADR-0014, like Button fills);
  they sit in the `aria-hidden` SVG, and the table carries every value. Cell labels are white on
  strong shades and primary text on faint ones (the paper shows through), in both themes.
- Tables of several values per point use a second header row (`colgroup` / `col` scopes), so
  screen readers announce "Scores, Q1" for each cell.
- Sparklines keep the tooltip, the keyboard and the data table; only the axes and legend go.
- Phase 4: toolbar buttons are named (`aria-label`, localizable; downloads show the format as text,
  which is part of the name), 32px targets, `aria-pressed` on the pan tool, `disabled` zoom-out /
  reset while unzoomed; a visually hidden `role=status` announces failed downloads. Annotations are
  a visually hidden list after the table. Zoom and brush work from the keyboard (no drag needed,
  WCAG 2.5.7). Annotation tags and candles are brand colors in the `aria-hidden` SVG (ADR-0014).
- Stock charts: every indicator value is a table column (`th[data-ok-indicator]`, named like the
  legend) and a tooltip row reachable by keyboard; the navigator has keyboard equivalents (zoom keys,
  WCAG 2.5.7); pane titles sit on a paper halo.
- Sankey tables have one row per link: the source is the row header, then target and value
  (`th[data-ok-part="source|target|y"]`, localizable as From / To / Value); node labels sit on a
  paper halo over the links; cut labels keep their whole name in the tooltip and the table.
- Tree tables have one row per node with its parent (`th[data-ok-part="name|parent|y"]`,
  localizable as Name / Parent / Value), so the hierarchy reads without the drawing; the tooltip
  announces the path, the level and the children (collapsed or not); collapsed nodes are hollow
  (not color alone); expanding needs no pointer (Enter / Space).
- Sunburst and icicle drill needs no pointer (Enter / Space, Escape, a native **Back** button of 32px); the
  drilled path is a visible polite status; the table keeps every node while zoomed.
- Visually hidden tables are anchored at the bottom of the root and grow upward, so long tables never
  add page scroll (they did before phase 4: the page grew by the table's height).

## Events / API
- HTML: `ok:chart:filter` (detail `{ categories: number[] | null, own }`, after the group's crossfilter
  changed as this chart sees it), `ok:chart:select` (detail `{ seriesIndex, dataPointIndex, selected, selectedDataPoints }`,
  after the change, one per toggled point), `ok:chart:toggle` (cancelable, detail `{ index, hidden, hiddenSeries }`),
  `ok:chart:active` (detail `{ active: { kind: "index", index } | { kind: "mark", mark } | null }`),
  `ok:chart:zoom` (detail `{ range: { min, max } | null, reason: "user" | "group" | "brush" }`;
  cancelable for `user`), `ok:chart:expand` (tree charts, cancelable, detail
  `{ id, expanded, collapsedNodes }`, before the change), `ok:chart:drill` (sunburst and icicle charts,
  cancelable, detail `{ id: string | null, path: string[] }`, before the change).
- Instance: `{ hiddenSeries, setHiddenSeries(list), active, setActive(active), setFormatters(f),
  refresh(), updateSeries(series, categories?), appendData(data, { categories?, limit? }),
  zoomRange, setZoomRange(range), exportChart(format), setLocaleText(text), selectedDataPoints,
  setSelectedDataPoints(list), toggleDataPointSelection(seriesIndex, dataPointIndex), filter,
  clearFilter(), collapsedNodes, setCollapsedNodes(ids), drillNode, setDrillNode(id) }`;
  methods emit no events. `updateSeries` replaces the data (the current categories unless given);
  `appendData([{ data: [...] }, …])` appends points per series in order, `categories` adds theirs,
  `limit` keeps the last n (a sliding window). `refresh()` reads the table again.
- React: `collapsedNodes` (controlled) / `defaultCollapsedNodes` / `onCollapsedNodesChange(ids)`
  (tree charts); `drillNode` (controlled) / `defaultDrillNode` / `onDrillNodeChange(id)` (sunburst
  and icicle charts); `crossfilter`, `onFilterChange(categories, own)`; `onDataPointSelection(detail)`, `selectedDataPoints` (controlled) /
  `defaultSelectedDataPoints`; `onHiddenSeriesChange(hidden)`, `onActiveChange(active)`; `hiddenSeries` (controlled) /
  `defaultHiddenSeries`; `zoomRange` / `defaultZoomRange` / `onZoomRangeChange(range, reason)` (also
  for group and brush changes, so controlled charts follow); `ref` → the `figure` (core
  `exportChart(figure, format)` for your own buttons).

## API mapping (ADR-0015, upstream `react-apexcharts` + Minimal's `Chart` / `useChart`)
| Upstream | Owlky |
|---|---|
| `type` (`line`, `area`, `bar`, `scatter`, `pie`, `donut`, `radialBar`, `radar`, `boxPlot`, `heatmap`, `treemap`, `bubble`, `rangeArea`) | kept |
| `plotOptions.bar.isFunnel` (+ ascending data for pyramids) | renamed: `type="funnel"` |
| `plotOptions.line.isSlopeChart` | renamed: `type="slope"` |
| `chart.sparkline.enabled` | renamed `sparkline` |
| `plotOptions.boxPlot.colors.upper` / `.lower` | renamed `boxUpperColor`, `boxLowerColor` |
| `plotOptions.bubble.zScaling` / `minBubbleRadius` / `maxBubbleRadius` / `minZ` / `maxZ` | not applicable: radius by √z from 4px to a tenth of the plot (fixed by the design) |
| `plotOptions.heatmap.colorScale.ranges`, `.enableShades`, `.shadeIntensity`; `plotOptions.treemap.distributed`, `.enableShades` | `colorRanges` (heatmaps and treemaps; full strength); shades always on otherwise; `distributed` → point `color` |
| `candlestick`, `plotOptions.candlestick.colors.upward` / `.downward` | kept `candlestick`; renamed `candleUpColor`, `candleDownColor` |
| `rangeBar` (+ `plotOptions.bar.horizontal`) | kept; timelines (rangeBar + datetime) renamed `type="timeline"` |
| `polarArea` | kept |
| `chart.zoom.enabled` / `.type: "x"` / `allowMouseWheelZoom: "auto"` / `resetControl` | renamed `zoom` (x only; Ctrl + wheel; Escape and `0` reset); `zoom.type` y / xy, `autoScaleYaxis`, `zoomedArea`: not applicable (fixed by the design) |
| `chart.toolbar.show` / `.tools` / `.export` | renamed `toolbar` (zoom tools with `zoom`, downloads always); custom tools: not applicable |
| `chart.group`, `chart.id` | renamed `group`; the id is the element `id` |
| `chart.brush.enabled` / `.target`, `chart.selection` | renamed `brushTarget` (the target's id); the selection is the target's zoom |
| `annotations.xaxis` / `.yaxis` / `.points` (`x`, `x2`, `y`, `y2`, `label.text`, `borderColor`) | renamed `annotations` (`axis`, `x`, `x2`, `y`, `y2`, `label`, `color`); `addXaxisAnnotation`… : not applicable (React: new props; HTML: edit the list) |
| `chart.animations.enabled` / `.dynamicAnimation` | renamed `animations` (entry + updates; reduced motion off) |
| `dataLabels.formatter`, `dataLabels.background.enabled` | renamed `dataLabelFormatter` (HTML `setFormatters({ dataLabel })`), `dataLabelBackground` |
| `legend.formatter` (series values) | renamed `legendValues` |
| `exportToSVG` / `dataURI` / CSV export | renamed `exportChart(format)` (instance; core function for React) |
| `zoomX(min, max)`, `resetSeries` (zoom) | renamed `setZoomRange(range)` |
| `updateSeries(newSeries)`, `appendData(newData)` | kept (HTML instance; React: new props), plus `appendData` options `categories` and `limit`; `appendSeries`, `updateOptions`: not applicable (HTML: add a table column / set attributes) |
| `toggleSeries`, `resetSeries` | renamed `setHiddenSeries(list)` |
| `series: number[]` + `labels` (pie, donut, radialBar) | renamed: `series[0].data` + `categories` (one data model for every type) |
| `options.dataLabels.enabled` | renamed `dataLabels` |
| `options.plotOptions.pie.startAngle` / `.endAngle`, `options.plotOptions.radialBar.startAngle` / `.endAngle` | renamed `startAngle`, `endAngle` |
| `options.plotOptions.pie.donut.labels.total.label` / `.formatter`, `options.plotOptions.radialBar.dataLabels.total` | renamed `totalLabel`, `total` |
| `options.plotOptions.radialBar.track.strokeWidth` | renamed `trackWidth` (%) |
| `options.stroke.dashArray` | renamed `dashArray` (lines, radar, radial bars) |
| `options.plotOptions.pie.donut.size` | renamed `donutSize` (%, 10–95, default 72) |
| `.radialBar.hollow.size`, `.radar.polygons` | not applicable: fixed by the design (ring sizes from the radius, divider web) |
| `series` | kept |
| `height` | kept (px) |
| `width` | not applicable: the chart takes its container's width |
| `options.chart.stacked` | renamed `stacked` |
| `options.plotOptions.bar.horizontal` / `.columnWidth` / `.barHeight` | renamed `horizontal`, `columnWidth`, `barHeight` (%) |
| `options.stroke.curve` | renamed `curve` |
| `options.legend.show` / `.position` | renamed `legend` (`none` hides it) |
| `options.markers.size` | renamed `markerSize` |
| `options.fill.type` | renamed `fill` (`gradient` · `solid`) |
| `options.colors` | renamed `colors` (palette names, not CSS colors) |
| `options.xaxis.categories` / `.type` | renamed `categories`, `xType` |
| `options.yaxis.min` / `.max` / `.title.text` | renamed `yMin`, `yMax`, `yTitle` |
| `options.yaxis.labels.formatter`, `options.tooltip.y.formatter` | renamed `valueFormatter` (+ `valuePrefix` / `valueSuffix`) |
| `options.xaxis.labels.formatter` | renamed `labelFormatter` |
| `options.chart.events.legendClick` / `dataPointMouseEnter` | `onHiddenSeriesChange`, `onActiveChange` |
| `options.theme`, `options.chart.fontFamily`, `sx` | not applicable: tokens and `data-ok-theme` |
| ApexStock `series[0].data` `{ x, y: [o, h, l, c], v }` | kept (`v` → the volume column) |
| ApexStock `plotOptions.stockChart.indicators` (keys `"moving average"`, `"exponential moving average"`, `"bollinger bands"`, `"vwap"`, `"donchian channels"`, `"keltner channels"`, `"volumes"`, `"rsi"`, `"macd"`, `"stochastic oscillator"`, `"atr"`, `"commodity channel index"`, `"price volume trend"`; `period`, `stdDev`…) | renamed `indicators` (`sma`, `ema`, `bollinger`, `vwap`, `donchian`, `keltner`, `volume`, `rsi`, `macd`, `stochastic`, `atr`, `cci`, `pvt`; same parameter names) |
| ApexStock `panes[key].heightRatio` | renamed `paneHeight` (px, every pane) |
| ApexStock `getVisibleRange` / `setVisibleRange`, `rangeChange` | renamed `zoomRange` / `setZoomRange`, `ok:chart:zoom` (ADR-0031) |
| ApexStock `legend` (on-chart data readout), `crosshairMove` | the tooltip readout of every pane; `onActiveChange` / `ok:chart:active` |
| ApexStock `calculate*` helpers | renamed `smaValues`, `emaValues`, `rsiValues`, `macdValues`, `stochasticValues`, `atrValues`, `cciValues`, `vwapValues`, `pvtValues` (core) |
| ApexStock fibonacci, linear regression, Ichimoku, ADX, Chaikin, TSI, accelerator, %b / width, std dev, drawdown indicators; drawings, price lines, event markers, comparison, price scale modes, `aggregateOHLC`, heikin-ashi / renko, `getState` | not built (ADR-0047 §10) |
| ApexSankey `render({ nodes, edges })`: `nodes[].id` / `.title` / `.color`, `edges[].source` / `.target` / `.value` | renamed `type="sankey"` + `nodes`, `edges` (colors are palette names); `edges[].type` (parallel edge key): not applicable (parallel links always stay separate) |
| ApexSankey `orientation`, `nodeWidth`, `whitespace`, `edgeOpacity`, `axisTitles` | kept |
| ApexSankey `edgeGradientFill` | renamed `fill` (`gradient` default · `solid`) |
| ApexSankey `nodePalette` | renamed `colors` |
| ApexSankey `enableTooltip`, `highlightConnectedPath`, `nodeTooltipTemplate`, `tooltipTemplate` | always on (tooltip and one-hop highlight); templates: not applicable (`valueFormatter`, part labels) |
| ApexSankey `spacing`, `viewPortWidth` / `viewPortHeight`, `width`, `nodeBorderWidth` / `nodeBorderColor`, `edgeGap`, `fontSize` / `fontFamily` / `fontColor`, `theme`, `tooltipTheme` | not applicable: fixed by the design and tokens |
| ApexSankey `type: "chord"`, `particleFlow`, `draggableNodes`, `buildAlluvialData`, `collapseGroups`, `compare`, plugins, `onNodeClick` / pinned path highlight, `update` morphs | not built (ADR-0047 §5); alluvial diagrams are Sankey data with `axisTitles` |
| ApexTree `render(data)`: `{ id, name, children, options }` | renamed `type="tree"` + `hierarchy` (`{ id, name, value, color, children }`, one root or several); node `options` (box styles): not applicable (tokens) |
| ApexTree `direction` (`top`, `bottom`, `left`, `right`, `radial`), `layoutType` (`tree`, `cluster`), `edgeStyle` (`orthogonal`, `curved`, `straight`) | kept (ADR-0058) |
| ApexTree `enableExpandCollapse`, `expandCollapseOnNodeClick` | `enableExpandCollapse` (a click, Enter or Space toggles); the click is always on (the node is the toggle) |
| ApexTree `expandAll` / `collapseAll` / `expandToDepth`, collapse events | `collapsedNodes` (React controlled / HTML `setCollapsedNodes`, `data-ok-collapsed-nodes`), `ok:chart:expand` / `onCollapsedNodesChange` |
| ApexTree `highlightOnHover` | always on: the active node's path from the root |
| ApexTree `nodeWidth` / `nodeHeight` / `nodeTemplate` / `nodeStyle` / `borderWidth` / `borderColor` / `borderRadius`, `fontSize` / `fontFamily` / `fontColor`, `edgeColor` / `edgeColorHover` / `edgeWidth`, `siblingSpacing` / `childrenSpacing`, `paddingX` / `paddingY`, `width` / `height` | not applicable: circles of `markerSize` with text labels (cards are the Organization chart's, ADR-0036); spacing fits the SVG; colors and widths from tokens; `height` kept |
| ApexTree `externalLabel` (`collisionStrategy`) | always: labels beside the nodes, cut or left out when there is no room (the tooltip and the table keep them) |
| ApexTree `enableToolbar`, `fitScreen`, `zoom`, `changeLayout`, `groupLeafNodes`, `autoNodeHeight`, `edgeColorMode`, `enableAnimation`, search, `locale.direction` | not built (ADR-0058): the chart fits its SVG (no zoom); `direction` changes the layout; leaf groups, node line colors and search are Organization chart features (4.18.3–4.18.6) |

## Upstream API mapping

Completes "API mapping" above (its rows are kept / renamed as written there). Upstream:
ApexCharts options (apexcharts.com/docs/options/chart, /xaxis, /yaxis, /tooltip, /legend,
/markers, /grid, /stroke, /fill, /states, /annotations, /title, /nodata, /responsive, /theme,
/forecastdatapoints, /plotoptions/bar, /chart/events, /docs/methods, checked 2026-11-09).
Option areas not covered by the table above:

| Upstream | Owlky | Status | Note |
|---|---|---|---|
| `chart.type: "waterfall"` (ApexCharts 7.1+) | `type="waterfall"` | kept (4.18.21) | a whole type (every series is a waterfall); `plotOptions.bar.horizontal` → `horizontal` |
| waterfall datum `isTotal`, `isSubtotal` (no `y`) | point `{ isTotal: true }` / `{ isSubtotal: true }` · HTML `td[data-ok-sum="total|subtotal"]` | kept (4.18.21) | the cell's text is the computed total (the accessible view), never read back |
| waterfall datum `fillColor` | point `color` | renamed (4.18.21) | |
| `plotOptions.waterfall.colors.positive` / `.negative` / `.total` / `.subtotal` | `waterfallPositiveColor` (default `success`), `waterfallNegativeColor` (`error`), `waterfallTotalColor` (the series color), `waterfallSubtotalColor` (the total color) | renamed (4.18.21) | palette names (tokens), not CSS colors |
| `plotOptions.waterfall.connectors.show` | `hideConnectors` (`data-ok-hide-connectors`) | renamed (4.18.21) | on by default as upstream; a flag that turns them off |
| `plotOptions.waterfall.connectors.color` / `.strokeWidth` / `.strokeDashArray` | — | not applicable | fixed by the design: 1px secondary text, dashes of 3px |
| `rangeBar` + `plotOptions.bar.isDumbbell`; `chart.type: "dumbbell"` (ApexCharts 7.1+) | `type="dumbbell"` (two values per point in `y`) | renamed (4.18.21) | one type for both upstream forms; `horizontal` as `plotOptions.bar.horizontal` |
| `plotOptions.bar.dumbbellColors` (`[[start, end], …]`) | `dumbbellColors` (palette names; HTML `data-ok-dumbbell-colors="start end; …"`) | kept (4.18.21) | pair n for series n, later series the first pair; CSS colors: not applicable (tokens) |
| `markers.size` on dumbbells | `markerSize` (default 6) | renamed (4.18.21) | |
| dumbbell line style (`stroke.width`, `stroke.colors`), `plotOptions.bar.dumbbell.*` styling | — | not applicable | fixed by the design: the series color at 0.48, 4px; start ring, end disc |
| `chart.type: "sunburst"` (ApexCharts 8, `apexcharts/sunburst`) | `type="sunburst"` | kept (4.18.21, ADR-0058) | |
| sunburst `series[0].data` `{ x, y, children, color }`, `drilldown.series` adapter | `hierarchy` (`{ name, value, children, color }`; `x` / `y` accepted) · HTML one row per node with its parent | renamed (ADR-0058) | the drilldown adapter: not applicable (nest the data) |
| `plotOptions.sunburst.innerSize` (`'15%'` or px), `startAngle`, `endAngle`, `spacing`, `leaf` (`extend` · `stop`), `tint` | `innerSize` (%), `startAngle`, `endAngle`, `spacing` (px), `leaf`, `tint` | kept | pixel `innerSize`: not applicable (a share of the radius) |
| `plotOptions.sunburst.zoomOnClick` (default `true`), breadcrumb, a click on the center to zoom out | `disableZoomOnClick` (zoom on by default); `drillNode` / `ok:chart:drill`; **Back** + the path (`data-ok-chart-drill`); Escape | renamed (ADR-0058) | `drilldown.breadcrumb` `formatter` / `position` / offsets: not built |
| `plotOptions.sunburst.partition` (`normalize` · `strict`) | always `normalize` | not built: `strict` | parents are the sum of their children |
| `plotOptions.sunburst.borderRadius`, `offsetX` / `offsetY`, `dataLabels.style.*`, `stroke` | — | not applicable | fixed by the design and tokens; labels follow `dataLabels` (values) and the 8° minimum (`minAngleToShow`) |
| `plotOptions.sunburst.dataLabels.show` | always on (names where they fit); `dataLabels` adds the values | renamed | |
| `chart.type: "icicle"` (ApexCharts 8, `apexcharts/icicle`) | `type="icicle"` | kept (4.18.21, ADR-0058) | same data as the sunburst (`hierarchy`) |
| `plotOptions.icicle.direction` (`down` · `up` · `right` · `left`, the growth) | `direction` (`top` · `bottom` · `left` · `right`, the root's side, as trees) | renamed (ADR-0058) | `down` → `top`, `up` → `bottom`, `right` → `left`, `left` → `right` |
| `plotOptions.icicle.zoomType` (`value` · `both`), `zoomOnClick`, `leaf` (default `stop`), `spacing` | `zoomType`, `disableZoomOnClick`, `leaf`, `spacing` | kept / renamed | |
| `plotOptions.icicle.sort` (`name`), `maxDepth`, `levelSize`, `dataLabels.rotate` / `.align` / `.minSizeToShow` | — | not built (ADR-0058 §10) | data order is kept; every level is drawn, bands share the depth; labels are flat and centered, from 30px |
| `chart.type: "streamgraph"` (ApexCharts 7.1+, 8: `apexcharts/features/streamgraph`) | `type="streamgraph"` | kept (4.18.21) | a whole type; a numeric x axis is labels |
| `plotOptions.streamgraph.offset` (`wiggle` · `silhouette` · `zero` · `expand`) | `streamOffset` (`data-ok-stream-offset`, optional) | renamed (4.18.21) | default `wiggle` |
| `plotOptions.streamgraph.order` (`inside-out` · `inverse` · `none`) | `streamOrder` (`data-ok-stream-order`, optional) | renamed (4.18.21) | default `inside-out` |
| `plotOptions.streamgraph.labels.show` | `hideStreamLabels` (`data-ok-hide-stream-labels`) | renamed (4.18.21) | on by default as upstream |
| `plotOptions.streamgraph.labels.minWidth` | `streamLabelMinWidth` (`data-ok-stream-label-min-width`) | renamed (4.18.21) | default 24 |
| `plotOptions.streamgraph.labels.minFontSize`, `.maxFontSize`, `.style.*` (auto font size) | — | not applicable | fixed by the design (the type scale); names are drawn where the estimated width fits |
| `plotOptions.streamgraph.hover.show`, `.opacity` | `streamHoverOpacity` (`data-ok-stream-hover-opacity`) | renamed (4.18.21) | 0.35; with `tooltip="point"` only (a veil over the plot); `1` is `hover.show: false`. The default tooltip stays per x value (crosshair, shared rows, keyboard) |
| streamgraph `yaxis.show` false by default | `yaxis={{ show: true }}` · `data-ok-yaxis` | kept (4.18.21) | the grid is off with it (`grid` turns it on) |
| streamgraph `stroke.curve: "monotoneCubic"` | `curve` (`smooth` by default: horizontal tangents, no overshoot) | renamed (4.18.21) | |
| `chart.type: "violin"` (ApexCharts 7.1+, 8: `apexcharts/violin`) | `type="violin"` | kept (4.18.21) | a whole type |
| violin data: flat `y` list, `y: { density, points }`, point `points` | same | kept (4.18.21) | HTML: `td[data-ok-samples]` / `td[data-ok-density]`, the summary cells are the accessible view |
| `plotOptions.violin.normalize`, `.side`, `.bandwidthScale` | `violinNormalize`, `violinSide`, `bandwidthScale` | renamed (4.18.21) | |
| `plotOptions.violin.kde.bandwidth`, `.resolution` | `kdeBandwidth`, `kdeResolution` | renamed (4.18.21) | |
| `plotOptions.violin.box.show`, `.whiskers` | `violinBox`, `violinWhiskers` | renamed (4.18.21) | `.width`, `.strokeWidth`, `.fillColor`, `.capWidth`: fixed by the design |
| `plotOptions.violin.points.show`, `.size`, `.jitter`, `.constrainToViolin`, `.maxPoints` | `hideViolinPoints`, `violinPointSize`, `violinJitter`, `unconstrainedViolinPoints`, `violinMaxPoints` | renamed (4.18.21) | `.shape` follows `markerShape` / `colorBlindMode` |
| `plotOptions.violin.points.position`, `.laneWidth` (raincloud lanes), `.opacity`, `.fillColor`, `.strokeColor`, `.strokeWidth`, `.colorScale` | — | not built | no raincloud lane; dots use the series color and tokens |
| `plotOptions.bar.distributed` (colors per category) | point `color` | renamed (4.18.21) | |
| `plotOptions.unit.layout: "scatter"` with `scatter.y: "lanes"` (`apexcharts/unit`) | `type="beeswarm"` | renamed (4.18.21) | one series per lane |
| `plotOptions.unit.scatter.spread` (`swarm` · `jitter`) | `beeswarmSpread` (`data-ok-beeswarm-spread`, optional) | renamed (4.18.21) | default `swarm` |
| `plotOptions.unit.scatter.orientation` | `orientation` (`data-ok-orientation`) | kept (4.18.21) | default `horizontal`, the value axis |
| `plotOptions.unit.size` | `markerSize` | renamed (4.18.21) | default auto (fits the lane) |
| beeswarm datum `value`, `name` / `label`, `fillColor` | `y`, `x` (or `categories`), `color` | renamed (4.18.21) | |
| `plotOptions.unit.scatter.xMin` / `.xMax`, `.xTitle`, `.xFormatter`, `.tickAmount`, `.gridlines` | `yMin` / `yMax`, `yTitle`, `valueFormatter`, `yaxis.tickAmount`, `grid` | renamed (4.18.21) | |
| `plotOptions.unit.scatter.y: "value"` (2D), `.sizeField`, `.sizeRange`, `.laneLabelWidth`, `.yMin` … | — | not applicable | 2D and sized dots are `scatter` and `bubble` charts; labels are sized by the estimated text |
| `chart.type: "waffle"` (`apexcharts/unit`, Premium; ours) | `type="waffle"` | kept (4.18.21) | a preset of the grid layout with square cells, as upstream |
| `plotOptions.unit.grid.columns`, `.total`, `.fillFrom` | `columns`, `total`, `fillFrom` | renamed (4.18.21) | `total` also keeps its donut meaning |
| `plotOptions.unit.grid.split`, `.tileColumns`, `.max`, `.trackColor` | `split`, `tileColumns`, `splitMax`, `trackColor` | renamed (4.18.21) | |
| `plotOptions.unit.shape` (`circle` · `square`, also `pictogram`, `image`), `size`, `spacing`, `borderRadius`, `unitValue`, `maxUnits` | `markerShape`, `markerSize`, `spacing` (px), `cellRadius`, `unitValue`, `maxUnits` | renamed (4.18.21) | no `pictogram` / `image` marks (not built) |
| `chart.type: "unit"` (`apexcharts/unit`, Premium; ours) | `type="unit"` | kept (4.18.21) | one series, one value per category |
| `plotOptions.unit.layout` (`grouped` · `packed` · `columns` · `grid` · `arc`) | `unitLayout` (`data-ok-unit-layout`, optional) | renamed (4.18.21) | `scatter` lanes → `type="beeswarm"`; 2D `scatter` → `scatter` / `bubble` charts; `custom` / `positions` (a callback) not built: HTML has no function, and parity needs marks from data |
| `plotOptions.unit.sortByGroup` (packed) | `disableSortByGroup` | renamed (4.18.21) | on by default |
| `plotOptions.unit.clusterLabels.show` (`grouped`, `columns`) | `clusterLabels` | renamed (4.18.21) | under the cluster; `.curved`, `.external`, `.position`, `.formatter`, styles not built |
| `plotOptions.unit.arc.startAngle` / `.endAngle`, `.innerRadiusRatio`, `.rows` | `startAngle` / `endAngle`, `innerSize` (%), `arcRows` | renamed (4.18.21) | |
| `plotOptions.unit.columns.size`, `sizeByValue` | `markerSize` | renamed / not built (4.18.21) | no sizes by value |
| `plotOptions.unit.gather.*`, `transition`, `beatChange`, `ApexCharts.registerUnitLayout` / `registerUnitMark` / `registerRowSource` | — | not built | no marks moving between layouts: the chart redraws; a callback API has no HTML form |
| `plotOptions.unit.shape: "pictogram"` / `"image"`, `pictogram.*`, `image.*`, `tooltip.formatter` | — | not built | shapes are `markerShape` (and `colorBlindMode`); glyph paths and images are deferred; tooltips are per category (a dot-level `#i of n` isn't a keyboard item) |
| `chart.type: "tree"` (ApexTree layouts) | `type="tree"` | kept (4.18.7, ADR-0058) | see "API mapping" (ApexTree rows) |
| `chart.stackType` (`"normal"`, `"100%"`), `chart.stackOnlyBar` | `stackType` (`data-ok-stack-type`, optional), `stackOnlyBar` (`data-ok-stack-only-bar`) | kept (4.18.61) | `stackOnlyBar` is off by default (ApexCharts: on), so stacked lines keep stacking as before |
| `chart.events` `dataPointMouseEnter` / `Leave`, `mouseMove`, `mouseLeave`, `legendClick`, `beforeZoom`, `zoomed`, `beforeResetZoom`, `scrolled`, `brushScrolled`, `selection` | `onActiveChange`, `onHiddenSeriesChange`, `onZoomRangeChange` · `ok:chart:active`, `-toggle`, `-zoom` (cancelable) | renamed | |
| `chart.events.dataPointSelection` (`seriesIndex`, `dataPointIndex`, `w.globals.selectedDataPoints`) | React `onDataPointSelection(detail)` · HTML `ok:chart:select` (detail `{ seriesIndex, dataPointIndex, selected, selectedDataPoints }`) | renamed (4.18.60) | by click (block, slice, cell or the nearest point) and by Enter / Space on the active item; one call per toggled point |
| method `toggleDataPointSelection(seriesIndex, dataPointIndex)` | HTML instance `toggleDataPointSelection`, `selectedDataPoints`, `setSelectedDataPoints(list)`; React: controlled `selectedDataPoints` / `defaultSelectedDataPoints` + core `toggleChartSelection(selected, points, multiple)` | renamed (4.18.60) | React has no chart instance (`ref` is the `figure`) |
| `chart.events` `click` (any click), `markerClick`, `xAxisLabelClick` | — | deferred | axis labels are in the `aria-hidden` SVG (the table's row headers are their accessible view); a label selection needs focusable labels first |
| `chart.events` `animationEnd`, `beforeMount`, `mounted`, `updated`, `keyDown`, `keyUp` | — | not applicable | lifecycle: React effects / runtime setup; DOM key events |
| `chart.events` `crossFilter`, `filterChange`, `highlightFilterChanged` | HTML `ok:chart:filter` (detail `{ categories, own }`) · React `onFilterChange(categories, own)` · instance `filter`, `clearFilter()` | renamed (4.18.19, ADR-0054) | one event for both modes |
| `chart.events` `annotationDragged` / `Edited` / `Created` / `Styled` / `Deleted`, `measured` | — | deferred (4.18.20) | |
| drilldown: `drillDown` / `drillUp` / `drillToRoot` / `clearDrilldownCache`, events `drillDownStart` / `End` / `Error`, `drillUp` | — | deferred | category → child series, with a back control |
| trellis / small multiples: `ApexCharts.trellis`, `rowSeries`, `getPanels`, `getPanel`, `promotePanel`, `restorePanels` | — | deferred | one chart per category on shared axes |
| `beatChange`, `ApexCharts.registerUnitLayout` / `registerUnitMark` / `registerRowSource`, `registerTheme`, `refreshTokens`, `exec` | — | not applicable / not built (4.18.21) | `beatChange` and the register methods are callback APIs with no HTML form; themes are tokens; `exec`: the element instance |
| `states.active.allowMultipleDataPointsSelection` | `allowMultipleDataPointsSelection` (`data-ok-allow-multiple-data-points-selection`) | kept (4.18.60) | |
| `states.active` (the selected look), `.filter`, `states.hover.filter`, `plotOptions.pie.expandOnClick` | the outline `[data-ok-chart-selected-mark]` | renamed (4.18.60) | fixed by the design: a 2px primary-text outline (not color alone); filters not applicable |
| `chart.brush.targets` (several targets) | `brushTarget` (one id or a list; HTML ids separated by spaces in `data-ok-brush-target`) | kept (4.18.65) | the selection zooms every target and their groups; the first target found gives the initial selection |
| `chart.brush.autoScaleYaxis` | — | not applicable | zoom is x only |
| `chart.selection` (preselected range, fill, stroke) | the target's zoom | renamed | style fixed by the design |
| crossfilter (Premium Linked Views / Highlight Filter): a click or brush in one chart filters the others | `crossfilter: "filter" \| "highlight"` (`data-ok-crossfilter`, optional) on charts of a `group` | renamed (4.18.19, ADR-0054) | Linked Views → `filter`, Highlight Filter → `highlight`; sources: the selection (click, Enter, Space) and brushes; categories by position; a **Clear filter** button and a polite status |
| crossfilter on value ranges (Highlight Filter bins), numeric x ranges, filter persistence, filters across React and HTML charts | — | deferred / not applicable | ranges of values and numeric axes: a later row; groups are per library copy (ADR-0031) |
| measure tool (`toolbar.tools.measure`), draggable annotations | — | deferred (4.18.20) | |
| `chart.accessibility` (`description`, keyboard navigation, announcements) | always on: `caption` (`label`), the data table, keyboard slots, live text | kept | |
| `chart.locales`, `chart.defaultLocale` | `locale` (Intl) + `localeText` | renamed | |
| `chart.dataReducer` (`enabled`, `targetPoints`, `threshold`) | `dataReducer`, `dataReducerTargetPoints` (250), `dataReducerThreshold` (500) (`data-ok-data-reducer*`) | renamed (4.18.66) | lines and areas (core `chart-reducer.ts`, LTTB per run between gaps on the zoomed window, so zooming shows detail); only the drawing: the table, the marks (tooltip, keyboard, selection) and the value scale keep every point; the markers and data labels of dropped points are not drawn |
| `chart.dataReducer.algorithm` | always LTTB | not applicable | the only algorithm upstream |
| bucket aggregation of range and candlestick series | — | not built | those series keep their points |
| `chart.print`, `chart.perspectives`, `chart.license`, `chart.nonce`, `chart.injectStyleSheet`, `chart.redrawOn*Resize`, `chart.parentHeightOffset`, `chart.offsetX` / `Y`, `chart.width`, `chart.foreColor`, `chart.background`, `chart.dropShadow`, `theme` | — | not applicable | CSS / tokens / ResizeObserver; perspectives: app code (roadmap 2.4 notes) |
| `yaxis` (one object or an array), `.seriesName` (string or list), `.opposite`, `.logarithmic`, `.logBase`, `.reversed`, `.tickAmount`, `.min`, `.max`, `.show` | `yaxis` (same names; HTML `data-ok-yaxis` text, series' axes on `th[data-ok-y-axis]`) | kept (4.18.59) | several axes on vertical charts with an x axis; one axis: its options apply to the value axis (horizontal bars too); sparklines and timelines ignore them |
| `yaxis.title.text` | `yaxis[].title` (axis 0 falls back to `yTitle`) | renamed (4.18.59) | |
| `yaxis.alignZero`, `.stepSize`, `.forceNiceScale`, `.decimalsInFloat`, `.floating`, `.labels.formatter` (per axis), `.axisBorder` / `.axisTicks` / `.crosshairs` per axis | — | deferred | ticks are always nice (`tickAmount` keeps nice steps when it can); per-axis formatters with the tooltip / custom content row |
| `xaxis.title.text` | `xTitle` (drawn under the x labels; also the table's first header unless `xLabel`) | renamed (4.18.59) | |
| `xaxis.min` / `.max` / `.range` | `xMin`, `xMax`, `xRange` (`data-ok-x-min`, `-max`, `-range`) | renamed (4.18.65) | the window shown when nothing has zoomed the chart; on vertical charts with an x axis (as zoom); category axes: 0-based indexes (ApexCharts: 1-based positions), date axes: timestamps in ms, numeric axes: x values, may lie beyond the data; zoom and reset work on top |
| `xaxis.tickAmount`, `.stepSize`, `.tickPlacement`, `.decimalsInFloat` | — | deferred | a tick count on the x axis |
| `xaxis.group.groups` (`title`, `cols`) | `xaxisGroups` (`{ title, cols }`; HTML `data-ok-xaxis-groups="4 2024; 4 2025"`) | renamed (4.18.65) | a second row; the group is part of each row header's accessible name; category and date axes on vertical charts; `xaxis.group.style`: not applicable (tokens) |
| `xaxis.labels.rotate`, `.rotateAlways` | `xLabelRotate`, `xLabelRotateAlways` (`data-ok-x-label-rotate`, `data-ok-x-label-rotate-always`) | renamed (4.18.65) | opt-in (ApexCharts: `-45` by default), so existing charts keep their labels; the need to rotate uses an estimated plot width; rotated labels are cut to a third of the chart's height |
| `xaxis.labels.hideOverlappingLabels`, `.trim` | always on | kept | labels that don't fit are left out; rotated ones are cut with an ellipsis |
| `xaxis.labels.datetimeFormatter`, `.format`, `.datetimeUTC` | `labelFormatter`, `locale` | renamed | |
| `xaxis.crosshairs`, `yaxis.crosshairs`, `xaxis.tooltip` | the hover crosshair | kept | style fixed by the design |
| axis `style` / `cssClass` / `offsetX` / `offsetY`, `axisBorder`, `axisTicks` | — | not applicable | tokens / CSS |
| `grid.show`, `grid.xaxis.lines.show`, `grid.yaxis.lines.show` | `grid` (`data-ok-grid`, optional): `y` (default), `x`, `both`, `none` | renamed (4.18.64) | by drawn direction: `y` = horizontal lines (value ticks; between the bars of horizontal bar charts), `x` = vertical lines (x ticks, band edges or category positions; value ticks of horizontal bars) |
| `grid.row.colors` / `.opacity`, `grid.column.colors` / `.opacity` | `gridRowColors` / `gridColumnColors` (palette names, `grey`, `transparent`; HTML `data-ok-grid-row-colors` / `data-ok-grid-column-colors` text), `gridRowOpacity` / `gridColumnOpacity` (default 0.5) | renamed (4.18.64) | stripes between the horizontal / vertical grid positions, colors in turn from the top / left; CSS colors: not applicable (tokens) |
| `grid.padding` | — | not applicable | the layout reserves its own room |
| `grid.borderColor`, `.strokeDashArray`, `.position` | — | not applicable | tokens |
| `tooltip.enabled`, `tooltip.shared` (+ `.intersect`) | `tooltip` (`data-ok-tooltip-mode`, optional): `shared` (default), `point`, `none` | renamed (4.18.63) | `none` keeps a visually hidden status, so keyboard values are still announced; `point` = shared off with intersect (the block under the pointer, else the nearest point within 24px) |
| `tooltip.fixed.enabled` / `.position` (`topLeft`, `topRight`, `bottomLeft`, `bottomRight`) | `tooltipFixed` (`data-ok-tooltip-fixed`, optional) | renamed (4.18.63) | 8px inside that corner of the plot area; `fixed.offsetX` / `Y`: not applicable |
| `tooltip.custom({ series, seriesIndex, dataPointIndex, w })` | React `tooltipContent(context)` (a node) · HTML `template[data-ok-chart-tooltip]` with `[data-ok-chart-tooltip-slot]` | renamed (4.18.63) | context `{ title, rows, selected, points, active }`; the runtime clones the template and fills slots with `textContent` (never markup) |
| `tooltip.followCursor`, `.inverseOrder`, `.hideEmptySeries` | — | deferred | follow the pointer; reversed rows; leaving out empty series |
| `tooltip.x.formatter`, `.y.title.formatter`, `.z.title` / `.z.formatter` | `valueFormatter`, `labelFormatter`, `localeText` (`z`) | renamed | series names: custom content |
| `tooltip.theme`, `.style`, `.fillSeriesColor`, `.marker`, `.onDatasetHover` | — | not applicable | tokens; series highlight always on |
| `legend.horizontalAlign` (`left`, `center`, `right`) | `legendAlign` (`data-ok-legend-align`, optional) | renamed (4.18.64) | top and bottom legends (right legends stay a column) |
| `legend.showForSingleSeries` | `showForSingleSeries` (`data-ok-show-for-single-series`) | kept (4.18.64) | |
| `legend.onItemClick.toggleDataSeries: false` | `disableLegendToggle` (`data-ok-disable-legend-toggle`) | renamed (4.18.64) | items become `span` labels (no `aria-pressed`, no click) |
| `legend.customLegendItems` | `customLegendItems` (HTML `data-ok-custom-legend-items`, `; `-separated) | kept (4.18.64) | item n stands for series (slice) n: its color, hidden state and toggle; extra items take the default colors |
| `legend.inverseOrder`, `.showForNullSeries`, `.showForZeroSeries`, `.onItemHover.highlightDataSeries`, `.clusterGroupedSeries` | — | deferred | |
| `legend.markers.shape`, `.fontSize` / `.offset*` / `.itemMargin` / `.labels.colors`, `.floating`, `.width` / `.height`, `.tooltipHoverFormatter` | — | not applicable | design / CSS |
| `markers.shape` (one or a list per series: `circle`, `square`, `triangle`, `diamond`, `cross`, `plus`, `star`) | `markerShape` (`data-ok-marker-shape`, optional) + series `markerShape` (`th[data-ok-marker-shape]`) | renamed (4.18.62) | ApexCharts' list → the series field; `rect`, `line`, `sparkle`: not built (square, star cover them) |
| `markers.discrete` (`seriesIndex`, `dataPointIndex`, `fillColor`, `size`, `shape`) | `discreteMarkers` (`color`, `size`, `shape`; HTML `data-ok-discrete-markers` text) | renamed (4.18.62) | `strokeColor`: not applicable (the paper ring); also on series without markers |
| `markers.hover.size`, `.showNullDataPoints`, `.strokeWidth` | — | not applicable | hover size fixed by the design; gaps break the line |
| `markers.colors` / `.strokeColors` / `.fillOpacity` / `.offset*`, `largeDatasetThreshold`, `onClick` / `onDblClick` | — | not applicable | series colors; selection event above |
| `stroke.width` (one or a list), `stroke.dashArray` (one or a list) | `strokeWidth` (`data-ok-stroke-width`), `dashArray` + series `strokeWidth` / `dashArray` (`th[data-ok-stroke-width]`, `th[data-ok-dash-array]`) | renamed (4.18.62) | lines and areas; lists → the series fields |
| `stroke.lineCap`, `.colors`, `stroke.fill` | — | not applicable | design / series colors |
| `fill.type: "pattern"`, `fill.pattern.style` (`verticalLines`, `horizontalLines`, `slantedLines`, `squares`, `circles`; one or a list) | `fill="pattern"`, `fillPattern` (`data-ok-fill-pattern`, optional) + series `fillPattern` (`th[data-ok-fill-pattern]`) | renamed (4.18.62) | bars, areas, pie / donut / polar slices; without `fillPattern` each series (slice) gets the next pattern; `pattern.width` / `.height` / `.strokeWidth`: fixed by the design (8px tiles) |
| `fill.type: "image"`, `fill.gradient.*`, `fill.opacity`, `fill.colors` | — | not applicable | design / tokens; `colors` |
| `plotOptions.bar.borderRadius`, `.borderRadiusApplication`, `.borderRadiusWhenStacked` | fixed radius | not applicable | design |
| `plotOptions.bar.distributed` | point `color` | renamed | |
| `plotOptions.bar.colors.ranges` (`from`, `to`, `color`) | `colorRanges` (heatmaps, treemaps and bars) | renamed (4.18.61) | a bar's own point `color` wins over its range |
| `plotOptions.bar.colors.backgroundBarColors` / `.backgroundBarOpacity` / `.backgroundBarRadius` | `backgroundBars` (grey tracks), `backgroundBarColors` (palette names; HTML `data-ok-background-bar-colors`), `backgroundBarOpacity`, `backgroundBarRadius` | kept (4.18.61) | one track per bar slot, colors per category in turn; radius default 4 (ApexCharts 0: Owlky bars are rounded) |
| `plotOptions.bar.dataLabels.total.enabled` | `stackTotals` (`data-ok-stack-totals`) | renamed (4.18.61) | `total.formatter` → `valueFormatter` (series -1); `total.style` / `offset*`: not applicable |
| `plotOptions.bar.dataLabels.position` (`top`, `center`, `bottom`) | `dataLabelPosition` (`data-ok-data-label-position`, optional) | renamed (4.18.61) | inside the bar; `top` = by the value end |
| `plotOptions.bar.dataLabels.orientation`, `.maxItems`, `.hideOverflowingLabels` | — | not applicable | labels are always horizontal and only drawn where they fit |
| `plotOptions.bar.rangeBarGroupRows` | `rangeBarGroupRows` (`data-ok-range-bar-group-rows`) | kept (4.18.67) | the series share one lane per category; in HTML a table row is repeated for each bar of a category |
| `plotOptions.bar.rangeBarOverlap` (default `true`) | `disableRangeBarOverlap` (`data-ok-disable-range-bar-overlap`) | renamed (4.18.67) | a flag that turns overlap off: bars that overlap in time go to lanes of their own (interval partitioning), inside a series' slot or a shared row |
| `plotOptions.bar.hideZeroBarsWhenGrouped` | `hideZeroBarsWhenGrouped` (`data-ok-hide-zero-bars-when-grouped`) | kept (4.18.67) | grouped columns (not stacked): zero and empty bars take no slot, the others close up around the category's center |
| `plotOptions.bar.isFunnel3d` | — | not applicable | |
| `forecastDataPoints` (`count`, `fillOpacity`, `strokeWidth`, `dashArray`) | `forecastCount`, `forecastFillOpacity`, `forecastStrokeWidth`, `forecastDashArray` (`data-ok-forecast-*`) | renamed (4.18.65) | lines, areas and bars; tooltip rows `Series (Forecast)` and `aria-label` on the table cells, so the dash isn't the only cue (part label `forecast`) |
| `title.text` (`align`, `floating`, `style`…) | `label` → `caption` | renamed | style not applicable (tokens); a subtitle: compose a Card header |
| `noData.text`, `.align`, `.verticalAlign` | `noDataText` (`data-ok-no-data-text`), `noDataAlign`, `noDataVerticalAlign` | renamed (4.18.65) | `text[data-ok-chart-no-data]` over the plot when no series has a value; the message joins the plot's `aria-label`; `style`: not applicable (tokens) |
| `responsive` (`breakpoint`, `options` overrides) | — | not applicable | container width drives the layout; options per breakpoint are app code |
| `theme.palette`, `.mode`, `.tokens`, `.follow`, `.name`, `.designSystem` | `colors` (palette names), `data-ok-theme` | renamed | |
| `theme.monochrome` | — | not applicable | shades of one palette color: `colors` |
| `theme.accessibility.colorBlindMode` (`deuteranopia`, `protanopia`, `tritanopia`, `highContrast`) | `colorBlindMode` flag (`data-ok-color-blind-mode`) | renamed (4.18.62) | no palette swap (colors are tokens): each series gets a distinct marker shape (lines get 4px markers), pattern and dash instead, so color is never the only cue (WCAG 1.4.1) |
| `annotations.texts` (`x`, `y`, `text`, `textAnchor`) | `annotations` with `axis: "text"` (`label`, `textAnchor`; HTML `li[data-ok-annotation=text][data-ok-text-anchor]`) | renamed (4.18.65) | `x`, `y` are data coordinates (ApexCharts: px), since the chart redraws at its container's width; font and box styles: not applicable (tokens) |
| annotation points `click` / `mouseEnter` / `mouseLeave` / `tooltip`, `yAxisIndex` | — | deferred | interactive point annotations |
| `annotations.images`, points `image` / `customSVG`, label `style` / `offset*`, `fillColor` / `borderColor` | — | not applicable | design / tokens |
| methods `render`, `updateOptions`, `appendSeries`, `add*Annotation` / `removeAnnotation` / `clearAnnotations`, `destroy`, `highlightSeries`, `showSeries` / `hideSeries`, `dataURI`, `setLocale`, `getRadialScales` | instance API above | renamed | see the table above; `setLocale` → `setLocaleText`; `destroy` = runtime `stop()` / unmount; `getRadialScales` not applicable |

## Parity notes
- Parity doesn't walk into `<svg>`: `e2e/tests/chart.spec.ts` compares the SVG trees (gradient ids
  normalized). Ids differ by design (React `useId`, HTML element id or a counter).
- React renders the data table from props; HTML authors write it (snippets are generated from the
  same example data, `apps/storybook/src/components/chart/chart-data.ts`).
- Scatter tables: one row per x value, and one more row per extra point of a series at the same x.
- Circular charts write `data-ok-color` on every value cell (slice colors), React and HTML alike.
- Sparklines: React sets `--_ok-chart-height` in the plot's `style`, HTML through CSSOM (parity
  ignores `style`).
- Phase 4 stories: Candlestick, Range bar, Timeline, Polar area, Zoom and export, Synchronized, Brush,
  Annotations, Data labels, Donut with values, Heatmap color ranges, Horizontal box plot, Localized
  labels, Animations. Synchronized and Brush charts carry fixed `id`s (the same in React and HTML).
  The toolbar, legend values and the annotation list are rendered by React and built by the runtime
  (the list is authored HTML); `zoomRange` is state (no attribute).
- Sankey stories (ADR-0047): Sankey, Vertical Sankey, Cycles, Alluvial, Link and node options.
  Gradient ids are normalized by the SVG comparison like the others.
- Stock stories (ADR-0047): Stock chart, Overlays, Oscillators, Large dataset. Snippets hold the
  computed indicator columns (generated by React's `renderChart`); the runtime rewrites them to the
  same text.
- Stack and bar stories (4.18.61): Column stacked 100%, Stack totals, Column data labels, Column
  range colors.
- Cue stories (4.18.62): Marker shapes, Dashed lines, Pattern fills, Color blind mode.
- Tooltip stories (4.18.63): Tooltip options; Custom tooltip (a React demo with `?raw` source and
  the HTML template; no Controls; the tooltip is hidden at rest, so parity compares the same markup).
- Legend and grid stories (4.18.64): Legend options, Grid lines and stripes.
- Dumbbell story (4.18.21): Dumbbell (page load before and after with data labels and renamed
  parts; a horizontal pay gap with `dumbbellColors`).
- Tree story (4.18.7, ADR-0058): Tree (a tidy top tree with values, data labels and
  expand / collapse; a radial dendrogram with curved links; a left tree with curved links and a
  node collapsed by default — `data-ok-collapsed-nodes` on the HTML root).
- Sunburst story (4.18.21, ADR-0058): Sunburst (cloud spend with drill; a half circle with data
  labels, a 40% hole, `leaf="stop"` and own colors, without zoom on click). React renders the drill
  row; the runtime builds the same markup.
- Icicle story (4.18.21, ADR-0058): Icicle (page load steps from the top with drill and
  `zoomType="value"`; store visits from the left with `leaf="extend"`, `zoomType="both"` and data
  labels).
- Crossfilter story (4.18.19): Crossfilter (a highlight column chart with several selections, a
  filtered column chart and a filtered donut in one group). At rest every chart renders its
  filter controls with the button hidden and an empty status, in both frameworks.
- Waterfall story (4.18.21): Waterfall (a vertical cash flow with a subtotal, a total, data labels
  and a prefix; a horizontal headcount change with own colors).
- Streamgraph story (4.18.21): Streamgraph (listening time by genre with the wiggle baseline; a 100%
  per-quarter stream with a straight curve, one tooltip per band and patterns).
- Violin story (4.18.21): Violin (observations with box and dots; a horizontal two-series half-violin
  of precomputed curves with one density scale and patterns).
- Beeswarm story (4.18.21): Beeswarm (salaries by department, swarm; response times, vertical jitter with shapes).
- Waffle story (4.18.21): Waffle (a percentage waffle; split tiles with shapes per category).
- Unit story (4.18.21): Unit (grouped with cluster labels; seats on an arc; stacked columns; packed marks of 1,000 with shapes).
- Story "Live data": React keeps the points in state, the HTML page script calls `appendData` /
  `updateSeries`; both start from the same data and add the same points, so they stay identical.
