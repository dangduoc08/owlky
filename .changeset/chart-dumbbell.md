---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
"@owlky/mcp": minor
---

Chart dumbbell charts (ApexCharts `rangeBar` with `plotOptions.bar.isDumbbell`, and the `dumbbell` type). `type="dumbbell"` takes two values per point in `y`, kept in the order given (start, end), and draws them as a start ring and an end disc joined by a line (`line[data-ok-chart-dumbbell-line]`, `circle[data-ok-chart-dumbbell="start|end"]`), so the direction never relies on color. `dumbbellColors` (`[[start, end], …]`; HTML `data-ok-dumbbell-colors="start end; …"`) colors the ends per series, `markerSize` sizes them (default 6), and `horizontal` turns the chart. The table has Start and End columns (`th[data-ok-part="start|end"]`, renamed with `localeText`), the tooltip lists both ends in their colors, data labels sit outside the markers, the value axis leaves a tenth of the span on both sides, and clicks, the keyboard and zoom work as for columns. Core exports `parseChartDumbbellColors` and `chartDumbbellColorsText`; `ChartMark` carries `ends`. New story: Dumbbell.
