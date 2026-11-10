---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
---

Data grid: custom sorting. Column `sortComparator` / `getSortComparator` and `sortingOrder`, grid `sortingOrder` and `multipleColumnsSortingMode` (`withModifierKey` | `always`). The column menu hides the sort items outside a column's cycle. HTML: `data-ok-sorting-order` (JSON, on the root or a header), `data-ok-multiple-columns-sorting-mode`, instance `setSortComparator(field, comparators)`. Core: `nextGridSort` takes a sort cycle, `sortGridRows` a comparator lookup, new `gridDirectedComparator`, `parseGridSortingOrder`, `GRID_SORTING_ORDER`.
