---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
"@owlky/styles": minor
"@owlky/mcp": patch
---

Data grid: a cell menu and nested filter groups (ADR-0057). With `contextMenu` (HTML `data-ok-context-menu`), a right click on a cell opens a menu at the pointer, and Shift + F10 or the Menu key opens it at the focused cell: **Copy**, **Paste** (editable columns; the browser may ask to read the clipboard, and a refused read is announced), **Export** (CSV, Excel, Print), **Chart from selection** (with `cellSelection` and `chartsIntegration`) and **Pin column** (Pin to left, Pin to right, Unpin). The focus goes back to the cell when the menu closes, and a right click outside the selected cells selects that cell. React's `getContextMenuItems(params)` returns the items of each cell (built-in names, `"separator"` and your own `{ name, label, onClick, disabled }` items); in HTML, add items to the menu's markup or in the cancelable `ok:data-grid:contextmenu` event, and `ok:data-grid:contextmenuselect` reports each choice. The filter model now nests groups (`groups`: `{ items, logicOperator, groups }`, up to eight levels, plain JSON that `exportState` / `restoreState` keep), and `filterGroups` (HTML `data-ok-filter-groups`) adds **Add group** buttons to the filter panel, with a named group per box and its own And / Or. Behavior change: filters without a value no longer count, so an empty filter row no longer lets every row through an Or. Core: `createGridContextMenu`, `gridDefaultContextMenuItems`, `gridContextMenuEntries`, `GridFilterGroup`, `gridFilterItemActive`, `gridFilterGroupAt`, `updateGridFilterGroup`, `sanitizeGridFilterGroup`; `createGridClipboard` returns `copy(text)` and `paste()`; nine locale keys in every pack.
