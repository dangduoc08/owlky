---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

DataGrid phase 4: single-row selection, unselectable rows and select all on the current page; column autosizing; cells that span columns (`colSpan`) and rows (`rowSpanning`); header descriptions; row heights (`rowHeight`, `getRowHeight` with `"auto"`) and spacing; row and cell classes; click and key events; `apiRef` with `exportState()` and `restoreState()`; edit validation (`preProcessEditCellProps`, `ok:data-grid:validate` in HTML), typing to edit and edit events; the `isAnyOf` operator, custom filter operators, search options and accent-insensitive search (`ignoreDiacritics`); CSV and print options; an icon toolbar (`toolbarVariant`); locale packs (`viVN`, `frFR`, `deDE`, `esES`, `jaJP`, `zhCN`) and right-to-left layout; value formats for HTML columns. Print now prints every filtered row of every page, without the toolbar and footer. TablePagination reads `data-ok-label-displayed-rows` for its range text in other languages.
