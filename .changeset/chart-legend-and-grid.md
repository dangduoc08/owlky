---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
"@owlky/styles": minor
"@owlky/mcp": minor
---

Chart legend and grid options (ApexCharts `legend.horizontalAlign`, `.showForSingleSeries`, `.onItemClick.toggleDataSeries`, `.customLegendItems`, `grid.xaxis.lines.show` / `grid.yaxis.lines.show`, `grid.row` / `grid.column` colors and opacity): `legendAlign` (`left`, `center`, `right`) lines legend items up; `showForSingleSeries` shows the legend of a single series; `disableLegendToggle` turns legend items into labels (`span`, no `aria-pressed`); `customLegendItems` renames the items (item n stands for series n). `grid` draws horizontal lines (`y`, the default), vertical lines (`x`), `both` or `none`; `gridRowColors` / `gridColumnColors` draw stripes between grid positions with colors in turn (palette names, `grey`, `transparent`), at `gridRowOpacity` / `gridColumnOpacity` (default 0.5). HTML attributes: `data-ok-legend-align`, `data-ok-show-for-single-series`, `data-ok-disable-legend-toggle`, `data-ok-custom-legend-items`, `data-ok-grid`, `data-ok-grid-row-colors`, `data-ok-grid-column-colors`, `data-ok-grid-row-opacity`, `data-ok-grid-column-opacity`. Core exports `chartGrids`, `chartLegendAligns` and `parseChartStripeColors`. New stories: Legend options and Grid lines and stripes. Charts without these options draw exactly as before.
