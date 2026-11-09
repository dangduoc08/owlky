---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Gantt phase 3: `height` gives the chart a scroll area and renders only the rows in view (`disableVirtualization` renders them all), with row indexes and the keyboard covering the whole project. The toolbar gets a download button (`exportFormat`: `svg`, `png` or `csv`; `disableExport` removes it) that saves every row; HTML instances add `exportChart(format)` and core exports `exportGantt(root, layout, format)`.
