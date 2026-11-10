---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
---

Data grid: undo and redo of edits. Ctrl / Cmd + Z undoes the last saved cell or row edit, or paste (one step), and Ctrl / Cmd + Shift + Z or Ctrl / Cmd + Y redo it; each goes through `processRowUpdate` (HTML: a cancelable `ok:data-grid:edit`). `historyStackSize` (30 by default, `0` turns it off; HTML `data-ok-history-stack-size`), `onUndo` / `onRedo` (HTML `ok:data-grid:undo` / `redo`), `apiRef.current.history` (HTML instance `history`) with `undo`, `redo`, `clear`, `canUndo`, `canRedo`. With `showToolbar`, the toolbar of a grid with editable columns now starts with Undo and Redo buttons (`showHistoryControls={false}` hides them; HTML: `button[data-ok-data-grid-history]` in the markup). New locale keys `toolbarUndo`, `toolbarRedo`. Fix: the HTML runtime passes the values from before an edit as `updateRow`'s `previousRow`. Core: `createGridHistoryStack`, `createGridHistoryKeys`, `gridHistoryRow`, `gridChangedFields`, `gridSameValue`.
