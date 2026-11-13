---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
"@owlky/styles": minor
---

Chart stacks and bars (ApexCharts `chart.stackType`, `chart.stackOnlyBar`, `plotOptions.bar.dataLabels.total` / `.position`, `plotOptions.bar.colors.ranges` / `.backgroundBarColors` / `-Opacity` / `-Radius`): `stackType="100%"` stacks each category's values as shares of their total on a value axis to 100% (data labels print the shares; the tooltip and the table keep the values). `stackOnlyBar` stacks only the bar series of a mixed chart. `stackTotals` prints each stack's total past its end. `dataLabelPosition` (`center`, `top`, `bottom`) moves bar labels to the value end or the base. `colorRanges` now also colors bars by the range that holds their value (a point's own color wins). `backgroundBars` draws a grey track behind each bar; `backgroundBarColors` (HTML `data-ok-background-bar-colors`), `backgroundBarOpacity` and `backgroundBarRadius` style the tracks. HTML attributes: `data-ok-stack-type`, `data-ok-stack-only-bar`, `data-ok-stack-totals`, `data-ok-data-label-position`, `data-ok-background-bars`, `data-ok-background-bar-opacity`, `data-ok-background-bar-radius`. Core exports `chartStackTypes`, `chartDataLabelPositions` and `parseChartColors`. New stories: Column stacked 100%, Stack totals, Column data labels and Column range colors. Charts without these options draw exactly as before.
