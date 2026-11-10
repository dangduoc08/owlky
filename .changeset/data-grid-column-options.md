---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
"@owlky/styles": minor
---

Data grid: per-column options. `cellClassName`, `headerClassName`, `hideSortIcons`, `disableColumnMenu`, `disableReorder` (the column keeps its place), `disableExport` (out of CSV, Excel and print), `pinnable`, `rowSpanValueGetter`, `pastedValueParser`, `rowHeader` (cells with `role="rowheader"`) and `display: "flex"`. HTML: header `data-ok-disable-reorder`, `data-ok-disable-export`, `data-ok-pinnable="false"`, cell `data-ok-display="flex"`, `data-ok-row-span-value`, instance `setPastedValueParser(field, parser)`. Core: `GridColumn` takes the new opt-outs, `moveGridColumn` takes locked fields, new `gridLockedFields`, `gridExportColumns` leaves out `disableExport` columns; navigation, cell selection and editing treat row header cells like grid cells.
