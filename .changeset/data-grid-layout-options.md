---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
"@owlky/styles": minor
---

Data grid: layout options. `columnHeaderHeight`, `columnGroupHeaderHeight` and `headerFilterHeight` (px, scaled by the density), `showCellVerticalBorder`, `showColumnVerticalBorder`, `rowSpacingType` (`margin` · `border`: the `getRowSpacing` space inside the row), `autoHeight` (the grid grows with its rows) and `autoPageSize` (the page size fits the grid's height; no rows per page menu). HTML: the same options as `data-ok-*` attributes; the runtime writes the heights through CSSOM and fits the page with a ResizeObserver. Core: `gridHeaderHeightProperties`, `gridAutoPageSize`, type `GridHeaderHeights`.
