---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Tree view: the rest of MUI X's Tree View API.

- Drag and drop (`itemsReordering`, `isItemReorderable`, `canMoveItemToNewPosition`, `onItemPositionChange`; HTML `data-ok-items-reordering`, `data-ok-reorderable="false"`, cancelable `ok:tree-view:move` + `positionchange`), with a keyboard alternative: Ctrl / ⌘ + Shift + arrows.
- Label editing (`isItemEditable`, `onItemLabelChange`; F2 or double click, Enter saves, Escape cancels; HTML `data-ok-editable`, cancelable `ok:tree-view:labelchange`).
- Lazy loading (`dataSource` with `getChildrenCount` / `getTreeItems`, loading and error states, retry on expand; HTML `setDataSource()`, `data-ok-lazy`).
- `selectionPropagation` (HTML `data-ok-selection-propagation`), `onItemSelectionToggle`, `onItemClick`, `onItemFocus` (HTML `selectiontoggle`, `itemclick`, `itemfocus`), `isItemDisabled`, `isItemSelectionDisabled` / TreeItem `disableSelection`, `disabledItemsFocusable`, `getItemId` / `getItemLabel` / `getItemChildren`, `itemChildrenIndentation`.
- `apiRef` (`useTreeViewApiRef`) and HTML instance methods: `expandAll`, `collapseAll`, `expandToDepth`, `expandSubtree`, `focusItem`, `selectItem`, `setItemExpansion`, `getItem`, `getItemTree`, `getItemOrderedChildrenIds`, `setEditedItem`, `updateItemLabel`; a search `highlight` that marks matching items and their ancestors.
- Behavior change: disabled items are now skipped by the arrow keys, Home / End and typeahead (MUI's default); set `disabledItemsFocusable` to keep them in the focus order.
- New stories "Drag and drop", "Label editing" and "Selection propagation". Virtualization stays deferred (it needs an ADR).
