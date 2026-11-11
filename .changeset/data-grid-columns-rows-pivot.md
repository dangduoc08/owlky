---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
"@owlky/styles": minor
---

Data grid: `disableAutosize`, `keepColumnPositionIfDraggedOutside`, `pinnedColumnsSectionSeparator` / `pinnedRowsSectionSeparator` (default `border`; `shadow` and `border-and-shadow` add an elevation shadow), `isRowReorderable`, `isValidRowReorder`, tree data reordering with `setTreeDataPath` (rows move with their children; `onRowOrderChange` reports `oldParent` / `newParent`), `pivotingColDef`, `pivotPanelOpen` / `onPivotPanelOpenChange` and `virtualizeColumnsWithAutoRowHeight`. Behavior change: columns no longer virtualize while a row has an `"auto"` height, unless `virtualizeColumnsWithAutoRowHeight` (MUI X). HTML: `data-ok-disable-autosize`, `data-ok-keep-column-position-if-dragged-outside`, `data-ok-pinned-columns-section-separator`, `data-ok-pinned-rows-section-separator`, `data-ok-pivot-panel-open`, `data-ok-virtualize-columns-with-auto-row-height`, rows `data-ok-reorderable="false"`, tree rows reorder between parents (`ok:data-grid:roworder` adds `oldParentId` / `parentId`) and `setPivotingColDef(def)`. Core: `gridTreeRowMove`, `gridMovedTreePath`, type `GridRowDrop`; `createGridRowReorder` takes `canDrop` and reports where a row lands; `createGridColumnControls` takes `keepPositionOutside`.
