---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
"@owlky/styles": minor
---

Data grid fill handle (`cellSelectionFillHandle`, HTML `data-ok-cell-selection-fill-handle`): with cell selection, drag the square at the selection's corner to repeat its cells down, up, right or left, or press Ctrl / Cmd + D (fill down) or Ctrl / Cmd + R (fill right). Each changed row goes through `processRowUpdate` (HTML: the cancelable `ok:data-grid:fill`, then `ok:data-grid:edit` per row), and a fill is one undo step. Core: `gridFillSource`, `gridFillCells`, `gridFillWithin`, `gridFillSelection`, `createGridFillHandle`; `createGridCellSelection` ignores presses on the fill handle.
