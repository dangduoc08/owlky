---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Data grid: the active range chart outlines the cells it draws (`data-ok-chart-range`, categories and series in their own colors) and shows a handle at the range's corner (`data-ok-data-grid-chart-handle`); dragging it resizes the range over rows and number columns, and Escape puts it back. From the keyboard, Alt + Shift + F1 makes the active range chart draw the selected cells (locale key `chartsRangeUpdated`). Core adds `gridChartRangeMarks`, `gridResizeChartRange`, `createGridChartRangeHandle` and the cell selection's `onRangeChartUpdate`.
