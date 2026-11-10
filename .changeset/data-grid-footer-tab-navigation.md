---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
"@owlky/styles": minor
---

Data grid: footer and toolbar options and Tab navigation. `hideFooterPagination` (every row on one page, with "Total Rows: n" in the footer), `hideFooterRowCount`, `hideFooterSelectedRowCount`, `label` (names the grid and shows at the start of the toolbar) and `tabNavigation` (`none` · `content` · `header` · `all`: Tab moves between body cells, headers or both, then leaves the grid). The footer now shows "n rows selected" while rows are selected (MUI X). HTML: `data-ok-hide-footer-pagination`, `data-ok-hide-footer-row-count`, `data-ok-hide-footer-selected-row-count`, `data-ok-tab-navigation`; the grid writes both counts. Core: `gridFooterRowSelected`, `gridFooterRowCount`, type `GridTabNavigation`; locale keys `footerRowSelected`, `footerRowSelectedOne`, `footerTotalRows`, `footerTotalVisibleRows` in every pack.
