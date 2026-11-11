---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
---

Data grid server options: `rowCount={-1}` (an unknown total), `estimatedRowCount`, `paginationMeta` / `onPaginationMetaChange` (a data source returns `pageInfo`), `onRowCountChange`, `dataSourceKeepPreviousData`, `dataSourceRevalidateMs`, `filterDebounceMs` / `columnFilterDebounceMs` (default 0), `disableChildrenFiltering` / `disableChildrenSorting`. Behavior change: while a data source loads, flat rows go away unless `dataSourceKeepPreviousData` is set (MUI X). HTML: `data-ok-row-count="-1"`, `data-ok-estimated-row-count`, `data-ok-has-next-page`, `data-ok-data-source-keep-previous-data`, `data-ok-data-source-revalidate-ms`, `data-ok-filter-debounce-ms`, `data-ok-column-filter-debounce-ms`, `data-ok-disable-children-filtering`, `data-ok-disable-children-sorting`, `ok:data-grid:rowcountchange`, `ok:data-grid:paginationmetachange` and `setDataSource(source, { cache })`. Core: `gridPaginationCount`, `gridUnknownCountPattern`, `createGridDebounce`, type `GridPaginationMeta`, `gridTreeRows` options `filterRootsOnly` and `sortRootsOnly`, locale keys `paginationCountAround` and `paginationCountMoreThan` in every pack.
