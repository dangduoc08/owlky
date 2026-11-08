# Chart

Reference: Minimal UI kit "Chart" page (content only). Phase 1 of ADR-0024 covers its sections Line,
Area, Column single, Column multiple, Column stacked, Column negative, Bar, Mixed and Scatter;
phase 2 adds Pie, Donut, Radial bar, Radar, Semi circle gauge and Stroked gauge (and data labels).
Phase 3 (ADR-0027, ADR-0029) adds the reference's BoxPlot, Heatmap and Treemap, and ApexCharts types
beyond it: Bubble, Range area, Funnel (and pyramid), Slope, Sparklines, plus a JavaScript data API
(`updateSeries`, `appendData`). Upstream: ApexCharts (`react-apexcharts`, ADR-0015). Created with `/component`.
Reference URL: https://minimals.cc/components/extra/chart
HTML source: written by us (ApexCharts' framework-free core is not MIT: the owner chose to write our
own, 2026-11-08; ADR-0024)

## Purpose
Show values as lines, areas, columns, bars, points, pie / donut slices, radial bars (rings,
gauges), a radar, box plots, heatmap or treemap cells, bubbles, range bands, funnels or slopes —
full size or as sparklines — with a legend that hides series, a tooltip
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
  div[data-ok-chart-legend]                              (absent: one series, legend "none")
    button[type=button][data-ok-chart-legend-item][data-ok-color][aria-pressed]
      span[data-ok-chart-legend-marker] + text
  div[data-ok-chart-plot][role=group][aria-roledescription=chart][aria-label][tabindex=0]
    svg[data-ok-chart-svg][aria-hidden][focusable=false][width][height][viewBox]
      defs › linearGradient[id][data-ok-color] › stop[data-ok-chart-stop]×2   (gradient areas)
      g[data-ok-chart-grid] › line[data-ok-chart-grid-line]
      text[data-ok-chart-axis-title]?                    (yTitle, rotated)
      g[data-ok-chart-axis=x] › text[data-ok-chart-tick][data-ok-major]?
      g[data-ok-chart-axis=y] › text[data-ok-chart-tick]
      g[data-ok-chart-crosshair] › rect[data-ok-chart-band] | line[data-ok-chart-crosshair-line]
      g[data-ok-chart-series-group]                      (areas, bars, lines, scatter: in that order)
        g[data-ok-chart-series][data-ok-type][data-ok-color][data-ok-index]
          path[data-ok-chart-area][fill=url(#…)]? · path[data-ok-chart-line] ·
          path[data-ok-chart-bar][data-ok-color]? · circle[data-ok-chart-marker][data-ok-color]?
      g[data-ok-chart-data-labels]?                      (dataLabels; only when a label fits)
        text[data-ok-chart-data-label="inside|outside"]  (inside slices / bars: white; outside: above points)
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
    data labels may also be text[data-ok-chart-data-label="plain"] (primary text on faint cells)
    div[data-ok-chart-tooltip][role=status][hidden]?
      div[data-ok-chart-tooltip-title] + div[data-ok-chart-tooltip-rows]
        div[data-ok-chart-tooltip-row] › span[data-ok-chart-tooltip-marker][data-ok-color] + span + span[data-ok-chart-tooltip-value]
  table[data-ok-chart-data]                              (HTML: the source; visually hidden once drawn)
    caption (the chart's name)
    thead › tr › th[scope=col] (x label) + th[scope=col][data-ok-type]?[data-ok-color]? (one per series)
      Series of several values per point (box plot, range area, bubble): two header rows —
      tr › th[scope=col][rowspan=2] (x label) + th[scope=colgroup][colspan=n] (the series) |
           th[scope=col][rowspan=2] (single-value series)
      tr › th[scope=col][data-ok-part="min|q1|median|q3|max|low|high|y|z"] (one per value)
    tbody › tr › th[scope=row][data-ok-value]? + td[data-ok-value]?[data-ok-color]? (one per x value)
```
Colors: `data-ok-color` = `<palette>` or `<palette>-<lighter|light|main|dark|darker>` (allowlist).
Default series order: `primary-dark`, `warning`, `info`, `error`, `success`, `warning-dark`,
`success-darker`, `info-dark`, `info-darker`.

Geometry (core, shared): smooth curves keep horizontal tangents at every point (control points at
35 % of each segment); bars are rounded (4px) at the value end only, and only at the end of a stack;
value ticks about every 48px (vertical) or 200px (horizontal) on nice steps (1, 2, 2.5, 5 × 10ⁿ);
x labels are thinned to whole steps (every n categories, or whole days / months / years for dates)
so they never overlap. Label widths are estimated per glyph class, not measured, so the server,
React and HTML lay out identically.

Polar geometry (core `chart-polar.ts`): angles in degrees clockwise from 12 o'clock; the chart is
centered in the SVG, radius = half the smaller side - 4px. Donut hole 72 % of the radius. Radial
bars: ring thickness 19 % of the radius for one ring, thinner for more (gap 66 % of a ring), the
outermost ring first; the track is `trackWidth` % as thick; a ring is full at `yMax` (default 100).
Pie and donut slices share `endAngle - startAngle` (at most one turn) by value; zero, negative and
hidden values get no slice. Radar: radius leaves room for the widest category label; 2–6 value
rings on a nice scale from 0.

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
| `type` | `data-ok-type="…"` | style | `line` `area` `bar` `scatter` `pie` `donut` `radialBar` `radar` `boxPlot` `heatmap` `treemap` `bubble` `rangeArea` `funnel` `slope` | `line` | Chart type: `line`, `area`, `bar` (columns; rows with `horizontal`), `scatter`, `pie`, `donut`, `radialBar`, `radar`, `boxPlot`, `heatmap`, `treemap`, `bubble`, `rangeArea`, `funnel` or `slope`. Series may override it in line, area, bar, scatter, box plot, bubble and range area charts (mixed charts). |
| `xType` | `data-ok-x-type="…"` | style | `category` `datetime` `numeric` | `category` | X axis: `category` labels, `datetime` (ISO 8601 dates) or `numeric` values (scatter). |
| `curve` | `data-ok-curve="…"` | style | `smooth` `straight` `stepline` | `smooth` | Line shape: `smooth`, `straight` or `stepline`. |
| `legend` | `data-ok-legend="…"` | style | `top` `right` `bottom` `none` | `top` | Legend position: `top`, `right`, `bottom` or `none` (never shown for a single series). |
| `fill` | `data-ok-fill="…"` | style | `gradient` `solid` | `gradient` | Area fill: a fading `gradient` or a `solid` tint. |
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
| `total` | `data-ok-total="…"` | number | number | — | Donut and radial bar center: the total shown under `totalLabel` (default the sum; radial bars the average). |
| `sparkline` | `data-ok-sparkline` | flag | boolean | off | No axes, grid or legend: the chart fills its container (cards, table cells). Its height is the container's, at least `height` (default 40px). |
| `boxUpperColor` | `data-ok-box-upper-color="…"` | style | `primary` `primary-lighter` `primary-light` `primary-main` `primary-dark` `primary-darker` `secondary` `secondary-lighter` `secondary-light` `secondary-main` `secondary-dark` `secondary-darker` `info` `info-lighter` `info-light` `info-main` `info-dark` `info-darker` `success` `success-lighter` `success-light` `success-main` `success-dark` `success-darker` `warning` `warning-lighter` `warning-light` `warning-main` `warning-dark` `warning-darker` `error` `error-lighter` `error-light` `error-main` `error-dark` `error-darker` | — | Box plots: color of the box above the median (default the series color). |
| `boxLowerColor` | `data-ok-box-lower-color="…"` | style | `primary` `primary-lighter` `primary-light` `primary-main` `primary-dark` `primary-darker` `secondary` `secondary-lighter` `secondary-light` `secondary-main` `secondary-dark` `secondary-darker` `info` `info-lighter` `info-light` `info-main` `info-dark` `info-darker` `success` `success-lighter` `success-light` `success-main` `success-dark` `success-darker` `warning` `warning-lighter` `warning-light` `warning-main` `warning-dark` `warning-darker` `error` `error-lighter` `error-light` `error-main` `error-dark` `error-darker` | — | Box plots: color of the box below the median (default a lighter tone of the series color). |
| `hiddenSeries` | `aria-pressed` · event `ok:chart:toggle` | state | — | — | Indexes of the series hidden through the legend (`aria-pressed="false"` on their buttons); categories in pie, donut and radial bar charts. |
<!-- /options:chart -->

Text attributes (React prop ↔ HTML attribute, written by React too): `yTitle` ↔
`data-ok-y-title`, `valuePrefix` ↔ `data-ok-value-prefix`, `valueSuffix` ↔ `data-ok-value-suffix`,
`locale` ↔ `data-ok-locale` (default `en-US`). Always set as text (`textContent`), never markup.

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
- Legend click toggles the series (React `onHiddenSeriesChange`, HTML cancelable `ok:chart:toggle`).
- HTML redraws when the table (structure, text, attributes), an option attribute or the size changes.
  Redraws patch the SVG in place (same-tag elements keep their identity; only changed attributes
  and text are written) and read the size from the `ResizeObserver`, never forcing a layout.
- Data updates (React: new `series` / `categories` props; HTML: `updateSeries`, `appendData`, or
  table edits) keep the active category or point by position and the hidden series by index;
  an active item that no longer exists shows no tooltip. HTML API updates rewrite the data table in
  place (rows and cells reused; the caption and the first header's text kept), so the accessible
  view always matches the drawing.
- No entry animation (phase 4 adds animations, with `prefers-reduced-motion`).
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
| Home / End | First / last (cells: top-left / bottom-right) |
| Escape | Hides the tooltip |

## Accessibility
- The plot is `role=group` + `aria-roledescription=chart`, named by `label` / the caption. The SVG is
  `aria-hidden`: the data table (visually hidden, never `display: none`) is the accessible view and
  keeps hidden series.
- The tooltip is `role=status`: values reached with the keyboard are announced.
- Legend buttons: `aria-pressed`; hidden series show a hollow marker and crossed-out text (not color
  alone); targets at least 24 × 24px.
- Axis labels use `--ok-text-secondary` (AA in light and dark); the reference's lighter grey is
  under 4.5:1 (ADR-0014). Center labels too (the reference paints a gauge's name in the
  disabled grey or the series color).
- Data labels inside slices and bars are white on the brand color (ADR-0014, like Button fills);
  they sit in the `aria-hidden` SVG, and the table carries every value. Cell labels are white on
  strong shades and primary text on faint ones (the paper shows through), in both themes.
- Tables of several values per point use a second header row (`colgroup` / `col` scopes), so
  screen readers announce "Scores, Q1" for each cell.
- Sparklines keep the tooltip, the keyboard and the data table; only the axes and legend go.

## Events / API
- HTML: `ok:chart:toggle` (cancelable, detail `{ index, hidden, hiddenSeries }`),
  `ok:chart:active` (detail `{ active: { kind: "index", index } | { kind: "mark", mark } | null }`).
- Instance: `{ hiddenSeries, setHiddenSeries(list), active, setActive(active), setFormatters(f),
  refresh(), updateSeries(series, categories?), appendData(data, { categories?, limit? }) }`;
  methods emit no events. `updateSeries` replaces the data (the current categories unless given);
  `appendData([{ data: [...] }, …])` appends points per series in order, `categories` adds theirs,
  `limit` keeps the last n (a sliding window). `refresh()` reads the table again.
- React: `onHiddenSeriesChange(hidden)`, `onActiveChange(active)`; `hiddenSeries` (controlled) /
  `defaultHiddenSeries`; `ref` → the `figure`.

## API mapping (ADR-0015, upstream `react-apexcharts` + Minimal's `Chart` / `useChart`)
| Upstream | Owlky |
|---|---|
| `type` (`line`, `area`, `bar`, `scatter`, `pie`, `donut`, `radialBar`, `radar`, `boxPlot`, `heatmap`, `treemap`, `bubble`, `rangeArea`) | kept |
| `plotOptions.bar.isFunnel` (+ ascending data for pyramids) | renamed: `type="funnel"` |
| `plotOptions.line.isSlopeChart` | renamed: `type="slope"` |
| `chart.sparkline.enabled` | renamed `sparkline` |
| `plotOptions.boxPlot.colors.upper` / `.lower` | renamed `boxUpperColor`, `boxLowerColor` |
| `plotOptions.bubble.zScaling` / `minBubbleRadius` / `maxBubbleRadius` / `minZ` / `maxZ` | not applicable: radius by √z from 4px to a tenth of the plot (fixed by the design) |
| `plotOptions.heatmap.colorScale.ranges`, `.enableShades`, `.shadeIntensity`; `plotOptions.treemap.distributed`, `.enableShades` | shades always on; `distributed` → point `color`; color ranges deferred to phase 4 |
| `updateSeries(newSeries)`, `appendData(newData)` | kept (HTML instance; React: new props), plus `appendData` options `categories` and `limit`; `appendSeries`, `updateOptions`: not applicable (HTML: add a table column / set attributes) |
| `toggleSeries`, `resetSeries` | renamed `setHiddenSeries(list)` |
| `series: number[]` + `labels` (pie, donut, radialBar) | renamed: `series[0].data` + `categories` (one data model for every type) |
| `options.dataLabels.enabled` | renamed `dataLabels` (formatter / style: deferred to phase 4) |
| `options.plotOptions.pie.startAngle` / `.endAngle`, `options.plotOptions.radialBar.startAngle` / `.endAngle` | renamed `startAngle`, `endAngle` |
| `options.plotOptions.pie.donut.labels.total.label` / `.formatter`, `options.plotOptions.radialBar.dataLabels.total` | renamed `totalLabel`, `total` |
| `options.plotOptions.radialBar.track.strokeWidth` | renamed `trackWidth` (%) |
| `options.stroke.dashArray` | renamed `dashArray` (lines, radar, radial bars) |
| `options.plotOptions.pie.donut.size`, `.radialBar.hollow.size`, `.radar.polygons` | not applicable: fixed by the design (72 % hole, ring sizes from the radius, divider web) |
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
| `options.chart.animations`, `zoom`, `toolbar`, `annotations`, `brush`, `options.chart.id` | deferred to phase 4 |
| `options.theme`, `options.chart.fontFamily`, `sx` | not applicable: tokens and `data-ok-theme` |

## Parity notes
- Parity doesn't walk into `<svg>`: `e2e/tests/chart.spec.ts` compares the SVG trees (gradient ids
  normalized). Ids differ by design (React `useId`, HTML element id or a counter).
- React renders the data table from props; HTML authors write it (snippets are generated from the
  same example data, `apps/storybook/src/components/chart/chart-data.ts`).
- Scatter tables: one row per x value, and one more row per extra point of a series at the same x.
- Circular charts write `data-ok-color` on every value cell (slice colors), React and HTML alike.
- Sparklines: React sets `--_ok-chart-height` in the plot's `style`, HTML through CSSOM (parity
  ignores `style`).
- Story "Live data": React keeps the points in state, the HTML page script calls `appendData` /
  `updateSeries`; both start from the same data and add the same points, so they stay identical.
