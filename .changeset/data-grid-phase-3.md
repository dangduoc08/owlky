---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

DataGrid phase 3: row virtualization for grids with a fixed height (`disableVirtualization` turns it off), server-side sorting, filtering and pagination (`sortingMode`, `filterMode`, `paginationMode`, `rowCount`), a loading overlay as a progress bar, a spinner or skeleton rows (`loading`, `loadingVariant`), infinite loading (`onRowsScrollEnd`, `scrollEndThreshold`; `ok:data-grid:scrollend` in HTML), and server data sources with a cache (`dataSource`, `dataSourceCache`, `onDataSourceError`; `setDataSource()` and `ok:data-grid:datasourceerror` in HTML). In HTML, `setRows(rows)` builds rows from a `<template data-ok-data-grid-row>`, as text only. Rows of a server page now report their position across pages in `aria-rowindex`.
