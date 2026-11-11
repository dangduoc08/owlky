---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
---

Data grid charts: the chart model takes `aggregation` (`sum`, `avg`, `count`, `min`, `max` or `median`) to merge the rows of each category without grouping, the `combo` type with `seriesTypes` (columns, lines or areas per value) and `secondaryValues` for a second value axis on the right. The chart panel offers **Combo** (locale key `chartTypeCombo`). The Charts integration story adds an aggregated combo chart; the chart snippets gain the Combo option. Core adds `gridChartAggregate`, `gridChartAggregations`, `gridComboSeriesTypes` and `gridChartTwoAxes`.
