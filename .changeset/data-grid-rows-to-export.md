---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
---

Data grid: choose the rows to export. `csvOptions`, `excelOptions` and `printOptions` (and the HTML `toCsv`, `exportCsv`, `toExcel`, `exportExcel` and `print` options) take MUI X's `getRowsToExport(params)`, with the grid's `apiRef` and the filtered, all, page and selected row ids, and the shortcut `source`: `filtered` (the default), `selected`, `page` or `all`. HTML reads `source` from `data-ok-csv-options`, `data-ok-excel-options` and `data-ok-print-options`. Core adds `gridRowsToExport`, `parseGridExportSource` and the print layout's `rowIds`.
