---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Chart (phase 4, ADR-0027 and ADR-0031; Chart is complete): candlestick, range bar, timeline and polar area charts, and horizontal box plots. Zoom and pan the x axis (`zoom`: mouse drag, pinch, Ctrl + wheel, `+` `-` `0` and Shift + arrows; React `zoomRange` / `defaultZoomRange` / `onZoomRangeChange`, HTML `zoomRange`, `setZoomRange` and `ok:chart:zoom`); a zoom that reaches the newest point follows live data. A `toolbar` with zoom buttons and SVG, PNG and CSV downloads (`exportChart`, only during a user gesture). Synchronized charts (`group`) and brush charts (`brushTarget`). Annotations (React `annotations`, HTML `ul[data-ok-chart-annotations]`). Opt-in `animations` that respect reduced motion. Data label formatters (`dataLabelFormatter`, HTML `setFormatters({ dataLabel })`) and badges (`dataLabelBackground`), `legendValues`, `donutSize`, heatmap and treemap `colorRanges`, `candleUpColor` / `candleDownColor`, and localized texts (`localeText`; HTML reads part labels from the table and `setLocaleText`). The visually hidden data table no longer adds its height to the page's scroll height.
