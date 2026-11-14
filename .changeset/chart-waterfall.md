---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Chart waterfall charts (ApexCharts `waterfall`). `type="waterfall"` draws each value as a step that floats from the running total before it to the total after it; points `{ isTotal: true }` and `{ isSubtotal: true }` draw the running total from zero (in HTML, a cell with `data-ok-sum="total"` or `"subtotal"` whose text is the total). Rising steps use `waterfallPositiveColor` (default `success`), falling steps `waterfallNegativeColor` (`error`), totals `waterfallTotalColor` (the series color) and subtotals `waterfallSubtotalColor` (the total color); a point's `color` wins. Dashed connectors (`line[data-ok-chart-connector]`) join each bar's end to the next bar unless `hideConnectors` (`data-ok-hide-connectors`) is set. Bars carry `data-ok-chart-step="up|down|total|subtotal"`. `horizontal` turns the chart, several series sit side by side, and the chart zooms like a column chart. Data labels and the tooltip show each change with its sign (core `chartSigned`), and the tooltip adds the running total (part label `total`, localizable). Core exports `chartSigned`, `isChartSum` and the `ChartSum` type; `ChartPoint` and `ChartMark` carry `sum`. New story: Waterfall.
