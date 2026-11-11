---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
---

Data grid: `exportState()` and `restoreState()` (and React's `initialState`) now hold the rows people work on: `rowSelection`, `detailPanel.expandedRowIds`, `pinnedRows` (row ids) and `rowOrder` (the manual order). `onStateChange` (React) and `ok:data-grid:statechange` (HTML) report the exported state once a change settles, never during a drag. Core adds `createGridStateWatcher`.
