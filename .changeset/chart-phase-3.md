---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Chart (phase 3, ADR-0027 and ADR-0029): box plot, heatmap, treemap, bubble, range area, funnel (and pyramid) and slope charts, and sparklines (`sparkline`: no axes or legend, sized by their container). Box plots take `boxUpperColor` and `boxLowerColor`. Points can carry several values (box plots, range areas, bubble sizes); the data table then names each value in a second header row (`th[data-ok-part]`). Live data: React redraws from new `series`, and the HTML instance gains `updateSeries(series, categories?)` and `appendData(data, { categories, limit })`, which rewrite the data table in place. Updates keep the active category and the hidden series, and HTML redraws patch the SVG in place instead of rebuilding it. `height` now accepts 8px and up for sparklines.
