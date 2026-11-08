# Data grid

Reference: Minimal UI kit "Data grid" page, sections Basic and Custom (content only). Upstream:
MUI X Data Grid, every tier (Community, Pro, Premium) — the owner's request; built in phases
(ADR-0020, phases per ADR-0021). This spec covers phases 1 to 6 (every phase). Created with
`/component`; phases 2 to 6 by Update.
Reference URL: https://minimals.cc/components/mui/data-grid

## Purpose
Rows of data in columns that people sort, search, filter, page, select, show / hide and export.
An ARIA grid on `div`s laid out with CSS grid. Core `data-grid.ts` holds the data model (sort,
filter, quick filter, selection, column template, CSV); core `createGridNavigation` the keyboard.
React keeps the state in props / state; the HTML runtime `data-grid` keeps it in the DOM (rows
moved and `hidden`).

## Anatomy
```
div[data-ok-data-grid][data-ok-density][data-ok-checkbox-selection]?[data-ok-disable-*]?[id]
  div[data-ok-data-grid-toolbar]                                            (showToolbar)
    div[data-ok-data-grid-quick-filter] › TextField (search)
    div[data-ok-data-grid-toolbar-actions] › Button × (Columns, Filters, Density, Export)
         [aria-haspopup][aria-controls="<id>-columns|filters|density|export"] (HTML: data-ok-popover-open)
         (toolbarVariant="icon": IconButton[aria-labelledby] + Tooltip#<id>-<panel>-tooltip)
    Popover#<id>-columns › div[data-ok-data-grid-panel][role=group] › FormControlLabel(Switch[data-ok-field])…
    Popover#<id>-filters › div[data-ok-data-grid-panel][role=group]
         › div[data-ok-data-grid-filter]… › IconButton[data-ok-data-grid-filter-remove],
           (rows 2+) TextField select #<id>-filter-logic-<n> (and / or; disabled after row 2),
           TextField select (column), TextField select (operator), TextField (value)
         › Button[data-ok-data-grid-filter-add]                              (not disableMultipleColumnsFiltering)
    Menu#<id>-density › MenuItem[data-ok-density][data-ok-selected]? ×3
    Menu#<id>-export › MenuItem[data-ok-data-grid-export=csv|print]
  div[role=grid][data-ok-data-grid-main][aria-label][aria-rowcount][aria-colcount][aria-multiselectable]?[aria-busy]?
      (--_ok-data-grid-columns: one track per shown column)
    div[role=rowgroup][data-ok-data-grid-header] › div[role=row][aria-rowindex=1]
      div[role=columnheader][data-ok-field=__check__][data-ok-data-grid-checkbox] › Checkbox (select all)
      div[role=columnheader][aria-colindex][data-ok-field][data-ok-type][data-ok-align][aria-sort]?
         [data-ok-width|min-width|max-width|flex]?[data-ok-hideable=false]?[data-ok-filterable=false]?
         [data-ok-searchable=false]?[aria-describedby → Tooltip#<id>-<field>-description]?
         [data-ok-format=number|currency|percent|date|datetime][data-ok-format-options='{…}']? (HTML only)
         [data-ok-resizable=false]?[data-ok-editable]?[data-ok-value-options='["…"]']?[data-ok-pinned]?[hidden]?
        span[data-ok-data-grid-header-title] · span[data-ok-data-grid-sort-icon] · IconButton[data-ok-data-grid-menu-button]
        · span[data-ok-data-grid-resize][aria-hidden]                         (resizable)
    div[role=rowgroup][data-ok-data-grid-body]   (--_ok-data-grid-before|after: spacers of the row window)
      div[role=row][aria-rowindex][data-ok-row-id][aria-selected]?[data-ok-editing]?[hidden]?
         [data-ok-selectable=false]?[data-ok-row-height=<px>|auto]?[data-ok-spacing-top|bottom=<px>]?
         [class]? (getRowClassName)
        (hidden: other pages / filtered out; data-ok-editing: row edit mode)
        div[role=gridcell][data-ok-data-grid-checkbox] › Checkbox
        div[role=gridcell][aria-colindex][data-ok-field][data-ok-align][data-ok-value]?[data-ok-text]?
           [data-ok-pinned]?[data-ok-editing]?[hidden]?   (editing: input|select[data-ok-data-grid-edit-input]
           [aria-invalid]? + span[data-ok-data-grid-edit-error][role=alert]?)
           [aria-colspan]? (covered cells: [hidden][data-ok-covered]) [aria-rowspan]? (covered:
           [data-ok-covered][aria-hidden=true], kept in place) [data-ok-editable=false]? [class]?
  template[data-ok-data-grid-row]                (HTML only: one row, copied by setRows / data sources)
  template[data-ok-data-grid-detail="<row id>"][data-ok-detail-height]? (HTML only: a panel's content)
  Popover#<id>-filters › template[data-ok-data-grid-any-of="<id>-filter-value"] › Autocomplete (HTML only)
  div[data-ok-data-grid-live][role=status]       (rowReordering: "Row moved to position n of m")
  Phase 5 inside the grid (role=treegrid with treeData):
    header › div[role=row][data-ok-data-grid-group-row] (one per group level) ›
      div[role=presentation][data-ok-data-grid-group-filler] | div[role=columnheader][data-ok-group-id]
      [aria-colindex][aria-colspan]?[data-ok-pinned][data-ok-pin-field]? (+ Tooltip for descriptions)
    special columns first: __reorder__ (IconButton[data-ok-data-grid-reorder-handle]), __check__,
      __detail_panel_toggle__ (IconButton[data-ok-data-grid-detail-toggle][aria-expanded][aria-controls]?),
      __tree_data_group__ (IconButton[data-ok-data-grid-tree-toggle] | span[data-ok-data-grid-tree-spacer],
      span[data-ok-data-grid-tree-label], span[data-ok-data-grid-tree-count]?; --_ok-data-grid-depth)
    rows: [aria-level][aria-posinset][aria-setsize][aria-expanded]?[data-ok-parent]?[aria-busy]? (tree),
      [data-ok-loading-row] (lazy placeholders: span[data-ok-data-grid-skeleton] cells),
      div[role=gridcell][data-ok-data-grid-list-cell][aria-colspan][hidden]? (listViewColumn)
    body › div[role=row][data-ok-data-grid-detail][data-ok-detail-for][id=<id>-<row id>-detail]
      › div[role=gridcell][data-ok-data-grid-detail-content][aria-colspan] (after its row)
    div[role=rowgroup][data-ok-data-grid-pinned-rows=top|bottom] › rows (sticky)
    cells after a column window spacer: [data-ok-col-start] (--_ok-data-grid-col-start)
  template[data-ok-data-grid-cell="<field>"]?    (HTML only: cell content, [data-ok-data-grid-value] slots)
  Phase 6:
    root [data-ok-row-grouping-model='["f"]']? [data-ok-aggregation-model='{"f":"sum"}']?
      [data-ok-pivot-model='{…}']? [data-ok-chart-model='{…}']? [data-ok-excel-options='{…}']? (JSON)
    rows grouped (role=treegrid): special column __row_group_by_columns_group__ (header
      [data-ok-width][data-ok-hide-descendant-count]?; data rows: an empty cell, --_ok-data-grid-depth)
      group rows: div[role=row][data-ok-row-id="auto-generated-row-<field>/<key>…"][data-ok-generated]
        [aria-level][aria-posinset][aria-setsize][aria-expanded]?[data-ok-parent]?
        › group cell (toggle | spacer, span[data-ok-data-grid-tree-label], span[data-ok-data-grid-tree-count]?)
        › one gridcell per column: the aggregated value as text (or empty)
      tree data: generated rows for missing parents (id auto-generated-row-<path…>, [data-ok-generated])
    header › span[data-ok-data-grid-aggregation-label] (after the title; not in the pivot)
    header columns [data-ok-groupable=false]? [data-ok-aggregable=false]?
    pinned bottom rowgroup › div[role=row][data-ok-row-id=auto-generated-group-footer-root]
      [data-ok-data-grid-aggregation-row] (the root's aggregated values)
    pivot: column group rows from the pivot's column keys; headers [data-ok-field="pivot:<keys…>/<field>/<fn>"]
      (title "<header> (<fn>)", sort icon, resize handle; no menu button); body: group rows only
    header › div[role=row][data-ok-data-grid-header-filters][aria-rowindex] (headerFilters)
      › div[role=presentation][data-ok-data-grid-group-filler][data-ok-pin-field] (special columns)
      › div[role=columnheader][data-ok-data-grid-header-filter][data-ok-filter-field][aria-label="<name> filter"]
        › TextField | TextField select | DatePicker (date) ; unfilterable: role=presentation filler
    cells with cellSelection: [aria-selected=true][data-ok-range-edge="top right bottom left"]?
    Menu#<id>-column-menu › MenuItem[data-ok-data-grid-action=group|aggregate-none|aggregate-<fn>][hidden]?[data-ok-selected]?
    Menu#<id>-export › MenuItem[data-ok-data-grid-export=excel]
    toolbar › Button (Pivot: pivot model given; Chart: chartsIntegration) › Popover#<id>-pivot | #<id>-charts
      › div[data-ok-data-grid-panel][data-ok-data-grid-form-panel][role=group]
        pivot: FormControlLabel(Switch[data-ok-data-grid-pivot-switch]),
          div[data-ok-data-grid-pivot-field][data-ok-field] › TextField select #<id>-pivot-<field> (none|rows|columns|values),
          TextField select #<id>-pivot-<field>-function
        charts: TextField select #<id>-chart-type, #<id>-chart-dimension, FormControlLabel(Switch[data-ok-data-grid-chart-value])
    div[data-ok-data-grid-chart][hidden]? › Chart#<id>-chart (HTML: figure › table[data-ok-chart-data], written by the grid)
    Popover#<id>-filters › template[data-ok-data-grid-date="<id>-filter-value"] › DatePicker (HTML only)
  div[data-ok-data-grid-loading][data-ok-variant][role=status][aria-label=Loading][hidden]?
    › LinearProgress | CircularProgress | span[data-ok-data-grid-skeleton] × 5
  div[data-ok-data-grid-overlay][role=status][hidden]?   ("No rows" / "No results found."; hidden while loading)
  Menu#<id>-column-menu › MenuItem[data-ok-data-grid-action=asc|desc|unsort|left|right|pin-left|pin-right|unpin|filter|hide|columns]
  div[data-ok-data-grid-footer] › TablePagination[data-ok-count]   (HTML: count written by the grid)
```
Every cell, and every control inside one, renders `tabindex="-1"`; the navigation controller moves
the single `tabindex="0"`.

## Options
<!-- options:data-grid (generated by `pnpm specs:options` from the schema in packages/core/src/anatomy/anatomy.ts) -->
Root: `data-ok-data-grid`. Unknown values fall back to the default.

| React | HTML | Kind | Values | Default | Description |
|---|---|---|---|---|---|
| `density` | `data-ok-density="…"` | style | `compact` `standard` `comfortable` | `standard` | Row height: `compact` 36px, `standard` 52px, `comfortable` 67px. |
| `checkboxSelection` | `data-ok-checkbox-selection` | flag | boolean | off | A first column of checkboxes selects rows. |
| `disableRowSelectionOnClick` | `data-ok-disable-row-selection-on-click` | flag | boolean | off | Clicking a row doesn't select it (only its checkbox does). |
| `disableColumnMenu` | `data-ok-disable-column-menu` | flag | boolean | off | No column menu in the headers. |
| `disableMultipleColumnsSorting` | `data-ok-disable-multiple-columns-sorting` | flag | boolean | off | Shift doesn't add columns to the sort. |
| `disableMultipleColumnsFiltering` | `data-ok-disable-multiple-columns-filtering` | flag | boolean | off | The filter panel keeps one filter (no Add filter). |
| `disableColumnResize` | `data-ok-disable-column-resize` | flag | boolean | off | Columns can't be resized. |
| `disableColumnReorder` | `data-ok-disable-column-reorder` | flag | boolean | off | Columns can't be moved. |
| `disableColumnPinning` | `data-ok-disable-column-pinning` | flag | boolean | off | Columns can't be pinned. |
| `editMode` | `data-ok-edit-mode="…"` | style | `cell` `row` | `cell` | Editable columns: edit one `cell` at a time, or every editable cell of a `row` together. |
| `disableVirtualization` | `data-ok-disable-virtualization` | flag | boolean | off | Render every row of the page, not only the visible ones. |
| `sortingMode` | `data-ok-sorting-mode="…"` | style | `client` `server` | `client` | `server`: the grid reports the sort model and shows the rows as given. |
| `filterMode` | `data-ok-filter-mode="…"` | style | `client` `server` | `client` | `server`: the grid reports the filter model and shows the rows as given. |
| `paginationMode` | `data-ok-pagination-mode="…"` | style | `client` `server` | `client` | `server`: the rows are the current page; `rowCount` is the total. |
| `rowCount` | `data-ok-row-count="…"` | number | number | — | Total rows on the server. |
| `loading` | `data-ok-loading` | flag | boolean | off | Data is loading: an overlay shows progress. |
| `loadingVariant` | `data-ok-loading-variant="…"` | style | `linear-progress` `circular-progress` `skeleton` | `linear-progress` | How loading shows: a bar, a spinner or placeholder rows. |
| `scrollEndThreshold` | `data-ok-scroll-end-threshold="…"` | number | number | `80` | Distance from the end of the rows (px) that reports the scroll end. |
| `disableMultipleRowSelection` | `data-ok-disable-multiple-row-selection` | flag | boolean | off | One row at a time: selecting a row clears the others (no select all). |
| `keepNonExistentRowsSelected` | `data-ok-keep-non-existent-rows-selected` | flag | boolean | off | Selected ids stay selected when their rows go away (server pages, new data). |
| `checkboxSelectionVisibleOnly` | `data-ok-checkbox-selection-visible-only` | flag | boolean | off | Select all selects the rows of the current page only. |
| `autosizeOnMount` | `data-ok-autosize-on-mount` | flag | boolean | off | Columns fit their content once the grid shows (resizable, non-flex columns). |
| `rowSpanning` | `data-ok-row-spanning` | flag | boolean | off | Neighbouring cells of a column with the same value merge into one tall cell. |
| `rowHeight` | `data-ok-row-height="…"` | number | number | — | Row height (px) before density. |
| `toolbarVariant` | `data-ok-toolbar-variant="…"` | style | `labeled` `icon` | `labeled` | Toolbar buttons with text, or icons with tooltips. |
| `quickFilterLogicOperator` | `data-ok-quick-filter-logic-operator="…"` | style | `and` `or` | `and` | Search words: every one must match (`and`), or any one (`or`). |
| `quickFilterExcludeHiddenColumns` | `data-ok-quick-filter-exclude-hidden-columns` | flag | boolean | off | The search skips hidden columns. |
| `ignoreDiacritics` | `data-ok-ignore-diacritics` | flag | boolean | off | Searches and filters ignore accents: "ha noi" finds "Hà Nội". |
| `treeData` | `data-ok-tree-data` | flag | boolean | off | Rows form a tree: a group column opens and closes their children. |
| `defaultGroupingExpansionDepth` | `data-ok-default-grouping-expansion-depth="…"` | number | number | `0` | Tree levels open at first (`-1`: all). |
| `rowReordering` | `data-ok-row-reordering` | flag | boolean | off | Rows move by dragging their handle, or Alt + Up / Down on it. |
| `listView` | `data-ok-list-view` | flag | boolean | off | Each row shows as one cell (a card) instead of columns. |
| `rowBufferPx` | `data-ok-row-buffer-px="…"` | number | number | `150` | Rows rendered above and below the visible ones, px. |
| `columnBufferPx` | `data-ok-column-buffer-px="…"` | number | number | `150` | Columns rendered left and right of the visible ones, px. |
| `lazyLoading` | `data-ok-lazy-loading` | flag | boolean | off | With a data source and a row count: rows load in chunks as they scroll into view. |
| `lazyLoadingRequestThrottleMs` | `data-ok-lazy-loading-request-throttle-ms="…"` | number | number | `500` | Least time between two lazy loading requests, ms. |
| `disableRowGrouping` | `data-ok-disable-row-grouping` | flag | boolean | off | Columns can't be grouped by (no Group by in the column menu). |
| `disableAggregation` | `data-ok-disable-aggregation` | flag | boolean | off | No aggregation (no Aggregation items in the column menu). |
| `aggregationRowsScope` | `data-ok-aggregation-rows-scope="…"` | style | `filtered` `all` | `filtered` | Rows aggregated: the `filtered` ones, or `all` of them. |
| `disablePivoting` | `data-ok-disable-pivoting` | flag | boolean | off | No pivot button in the toolbar. |
| `pivotActive` | `data-ok-pivot-active` | flag | boolean | off | The grid shows the pivot of its rows (`pivotModel`) instead of the rows. |
| `cellSelection` | `data-ok-cell-selection` | flag | boolean | off | Cells are selected in ranges: press, drag, Shift + click or Shift + arrows. |
| `disableClipboardPaste` | `data-ok-disable-clipboard-paste` | flag | boolean | off | Ctrl / Cmd + V doesn't paste into editable cells (copying still works). |
| `headerFilters` | `data-ok-header-filters` | flag | boolean | off | A row of filter fields under the column headers. |
| `chartsIntegration` | `data-ok-charts-integration` | flag | boolean | off | A chart of the grid's rows (or top-level groups) follows its filters, sorting and grouping. |
<!-- /options:data-grid -->

React props (MUI X names): `rows`, `columns` (`GridColDef`: `field`, `headerName`, `type`
string | number | date | dateTime | boolean | singleSelect | actions, `width` (100), `minWidth`
(50), `flex`, `align`, `headerAlign`, `sortable`, `filterable`, `hideable`, `valueOptions`,
`valueGetter(row)`, `valueFormatter(value, row)`, `renderCell(params)`), `getRowId` (`row.id`),
`rowSelectionModel` / `onRowSelectionModelChange(ids)`, `sortModel` / `onSortModelChange`,
`filterModel` / `onFilterModelChange` (`items` (one), `quickFilterValues`), `paginationModel` /
`onPaginationModelChange`, `pageSizeOptions` ([5, 10, 25]), `columnVisibilityModel` /
`onColumnVisibilityModelChange`, `density` / `onDensityChange`, `initialState`, `showToolbar`,
`disableColumnSorting`, `disableColumnFilter`, `disableColumnSelector`, `disableDensitySelector`,
`hideFooter`, `localeText`, `exportFileName`. Phase 2: `filterModel.logicOperator`,
`disableMultipleColumnsFiltering`, `resizable` (column), `disableColumnResize`,
`onColumnWidthChange(field, width)`, `initialState.columns.dimensions`, `columnOrder` /
`onColumnOrderChange(fields)` / `initialState.columns.orderedFields`, `disableColumnReorder`,
`pinnedColumns` / `onPinnedColumnsChange` / `initialState.pinnedColumns`, `disableColumnPinning`,
`editable` (column; not with `valueGetter` or `actions`), `editMode` (cell | row),
`processRowUpdate(newRow, oldRow)` (value or promise; rejection keeps the row),
`onProcessRowUpdateError`. Phase 3: `disableVirtualization`, `sortingMode` / `filterMode` /
`paginationMode` (client | server), `rowCount`, `loading`, `loadingVariant` (`slotProps.loadingOverlay.variant`),
`onRowsScrollEnd({ visibleRowsCount })`, `scrollEndThreshold` (80), `dataSource` (`getRows(params)`
→ `{ rows, rowCount? }`; implies every server mode), `dataSourceCache` (default: 50 requests per
source; `null` disables), `onDataSourceError(error)`. Phase 4: `disableMultipleRowSelection`, `isRowSelectable`,
`keepNonExistentRowsSelected`, `checkboxSelectionVisibleOnly`, `autosizeOnMount`, `autosizeOptions`
(`columns`, `includeHeaders`), column `colSpan` (number or per cell), `rowSpanning`, column
`description`, `renderHeader`, `maxWidth`, `rowHeight`, `getRowHeight` (px, `"auto"`, null),
`getEstimatedRowHeight`, `getRowClassName`, `getCellClassName`, `getRowSpacing`, `onRowClick`,
`onRowDoubleClick`, `onCellClick`, `onCellDoubleClick`, `onCellKeyDown`, `onColumnHeaderClick`,
`apiRef` / `useGridApiRef()` (`GridApi`: get/set models, `autosizeColumns`, `scrollToIndexes`,
`exportState`, `restoreState`, `getDataAsCsv`, `exportDataAsCsv`, `exportDataAsPrint`),
`isCellEditable`, column `valueParser` / `valueSetter` / `preProcessEditCellProps` (`{ error }`),
`onCellEditStart` / `onCellEditStop` / `onRowEditStart` / `onRowEditStop` (reasons), `isAnyOf`,
column `filterOperators`, `getApplyQuickFilterFn: null`, `quickFilterLogicOperator`,
`quickFilterExcludeHiddenColumns`, `ignoreDiacritics`, `csvOptions`, `printOptions`, locale packs
(`enUS`, `viVN`, `frFR`, `deDE`, `esES`, `jaJP`, `zhCN` from core), right-to-left layout. Beyond MUI
X: `toolbarVariant` (labeled | icon: the reference's icon-only toolbar). Phase 5: `treeData`,
`getTreeDataPath`, `groupingColDef` (`headerName`, `width`, `hideDescendantCount`),
`defaultGroupingExpansionDepth`, `isGroupExpandedByDefault`, `apiRef.setRowChildrenExpansion`;
server tree data (`dataSource.getChildrenCount`, `getGroupKey`, params `groupKeys`);
`getDetailPanelContent`, `getDetailPanelHeight`, `detailPanelExpandedRowIds` /
`onDetailPanelExpandedRowIdsChange`, `apiRef.toggleDetailPanel`; `rowReordering`,
`onRowOrderChange`; `pinnedRows`; `columnGroupingModel`; `listView`, `listViewColumn`;
`rowBufferPx`, `columnBufferPx`; `lazyLoading`, `lazyLoadingRequestThrottleMs` (params `start` /
`end`); `dataSource.updateRow`; `createGridDataSourceCache({ ttl, limit })`; `isAnyOf` values as
Autocomplete chips. Phase 6: `rowGroupingModel` / `onRowGroupingModelChange` /
`initialState.rowGrouping.model`, `disableRowGrouping`, column `groupable`; `aggregationModel` /
`onAggregationModelChange` / `initialState.aggregation.model`, `disableAggregation`,
`aggregationFunctions` (`{ apply(values, column), columnTypes? }`), `aggregationRowsScope`,
`getAggregationPosition` (groups `inline` | null, root `footer` | null), column `aggregable`,
`availableAggregationFunctions`; `pivotModel` / `onPivotModelChange`, `pivotActive` /
`onPivotActiveChange`, `initialState.pivoting` (`model`, `active`), `disablePivoting`, column
`pivotable`; `excelOptions` (`fileName`, `sheetName`, `fields`, `allColumns`, `includeHeaders`),
`apiRef.getDataAsExcel` / `exportDataAsExcel`; `cellSelection`, `cellSelectionModel` /
`onCellSelectionModelChange`; `disableClipboardPaste`, `onClipboardCopy`, `onClipboardPasteStart` /
`onClipboardPasteEnd`, `splitClipboardPastedText`, `clipboardCopyCellDelimiter`,
`ignoreValueFormatterDuringExport`; `headerFilters`; `chartsIntegration`, `chartModel` /
`onChartModelChange` / `initialState.chartsIntegration.model`; data source `groupFields`; `apiRef`
row grouping, aggregation, pivot, cell selection and chart setters. Beyond MUI X: Alt + Up / Down on a reorder handle (WCAG 2.5.7). Beyond MUI X (accessibility): Alt + Left / Right resizes, column menu
Move left / Move right. Renamed: `rowSelectionModel` is an id array (MUI v8:
`{ type, ids }`). Later phases: see ADR-0021 (tree data, master-detail, row reordering / pinning,
column groups, row grouping, aggregation, pivoting, Excel, clipboard, cell selection, header
filters, column virtualization, lazy loading of row chunks). Not applicable: `slots`, `slotProps`, `sx`, `classes`, license keys.
Deferred (roadmap): `rowGroupingColumnMode="multiple"`, `groupingValueGetter`, group footers
(`getAggregationPosition` → `footer` for groups), server-side aggregation, `getPivotDerivedColumns`
(year / quarter of dates), the pivot panel's drag and drop (selects instead), header filter operator
menus, the AI assistant (needs a language model service), `dateTime` filter values (DateTimePicker).
Renamed: the charts integration is one `chartModel` and a chart inside the grid (MUI X: a renderer
proxy and a context provider around the grid).

## Layout and tokens
Rows 52px (`--ok-spacing` × 13; compact 36px, comfortable 68px), header 56px (× 14) on
`--ok-bg-neutral`, `--ok-text-secondary`, subtitle2 weight; cells padding 10px, body2; rows
separated by a 1px dashed `--ok-divider`; hover `--ok-action-hover`; selected primary channel / 0.08
(hover 0.12); focused cell: 2px primary inset outline; header separators 1px `--ok-divider` (40%
height). Text cells truncate with an ellipsis; cells with elements lay them out in a row (8px gap).
Numbers align right. Toolbar padding 16px, quick filter up to 240px, wraps. Footer: dashed top
border, TablePagination at the end. Sort arrow 18px (descending turned); menu button shows on
header hover / focus / open, always with `hover: none`.

## Behavior
Header click / Enter / Space sorts (none → asc → desc → none; Shift adds the column, unless
`disableMultipleColumnsSorting`). Quick filter: every typed word must be in some filterable
column's text. Filter panel: one item; operators per type; `isEmpty` / `isNotEmpty` need no value;
filters and search reset the page. Pagination: TablePagination; rows of other pages are `hidden`.
Selection (checkboxSelection): row checkboxes, the header checkbox (all filtered rows; mixed state),
row click (not on controls; off with `disableRowSelectionOnClick`), Space, Ctrl / Cmd + A. Column
menu: sort asc / desc, unsort, filter (opens the filter panel on that column), hide, manage
columns (the last two need the toolbar). Columns panel: one switch per hideable column. Density
menu. Export: CSV (BOM, CRLF, header names, shown non-action columns, filtered and sorted rows;
`=`, `+`, `-`, `@`, tab and CR prefixed with `'`) and Print (core `printGridContent`: a hidden
iframe with copies of the page's style sheets and of the grid as shown; no markup strings).
Filters: rows combine with and (default) or or; removing the last row clears the filter.
Resizing: drag the end edge of a header (core `createGridColumnControls`) or Alt + arrows
(10px); widths at least `minWidth`; the release doesn't sort. Reordering: drag a header onto
another, or Move left / right. Pinning: Pin to left / right, Unpin; pinned cells are sticky
(`syncGridPinning` measures header widths into `--_ok-data-grid-pin`), the checkbox column joins
the left side. Editing: double click, Enter or F2 on an editable cell; text / number / date /
datetime-local inputs, a select for `singleSelect`, a checkbox for `boolean`; Enter commits, Escape
cancels, leaving the cell (row mode: the row) commits; focus returns to the cell. HTML shows the
committed value as text (no formatters) and fires `ok:data-grid:edit` (cancelable).
Virtualization (on unless `disableVirtualization`): once the main area is measured and scrolls
(bounded height), only the rows within the visible area ± 150px (`GRID_ROW_BUFFER`) are in the DOM;
padding on the body stands for the rest. The first render and SSR show every row. Grids that grow
with their rows don't virtualize. Server modes: the grid reports the model and shows the rows as
given; `rowCount` (HTML `data-ok-row-count`) is the pagination total. Loading: `loading` (HTML
`data-ok-loading`) shows the overlay and sets `aria-busy`. Infinite loading: within
`scrollEndThreshold` px of the end, `onRowsScrollEnd` / `ok:data-grid:scrollend` fire once per row
count. Data source: asked on mount and on every sort, filter and page change (`{ sortModel,
filterModel, paginationModel }`); responses are cached per request; a stale response is dropped;
loading shows meanwhile. HTML rows from data: `setRows(rows)` copies the row template and sets each
cell's text (or fills the cell template's value slots); never markup.
Phase 4. Selection: `disableMultipleRowSelection` selects one row at a time (no select all,
`aria-multiselectable` off; the header checkbox cell is named "Checkbox selection"); unselectable
rows have a disabled checkbox and ignore clicks; `checkboxSelectionVisibleOnly` limits select all to
the page; new rows drop the ids that went away unless `keepNonExistentRowsSelected` (not on mount).
Autosize: each rendered cell (and header, + 64px for its icons) measured at `width: max-content`,
clamped to min / max width; on mount again after `document.fonts.ready`; double click on a resize
handle. Spans: `colSpan` hides the covered cells (`grid-column: span`); `rowSpanning` merges
neighbouring cells of a column with the same text on the page (the first cell overflows the rows
below; the row keeps its height; the window starts at a span's first row); arrows up / down keep the
column and pass covered cells. Row heights: per-row px or `auto` (text wraps, measured after
render; the window uses per-row offsets), spacing as margins; `rowHeight` × density factor (0.7, 1,
1.3). Editing: `isCellEditable` / `data-ok-editable="false"`; a printable key on a focused editable
cell opens it with that character; `preProcessEditCellProps` (HTML: `ok:data-grid:validate`, a
listener sets `detail.error`) marks the field `aria-invalid` and shows the message; Enter and
leaving keep the cell open while it has an error, Escape cancels. Filters: `isAnyOf` takes a list
(the panel's field takes values separated by commas); custom operators replace the type's;
`ignoreDiacritics` folds accents (and đ). Export: CSV options; Print prints every filtered, sorted
row of every page (the toolbar, footer and checkboxes only when asked). Right to left: from
`direction`; left pins sit at the start (inline-start), Left / Right and Alt + Left / Right follow
the reading order, dragging a resize handle left widens.
Phase 5. Tree data: every row renders (children of closed rows `hidden`); Right / Left on a
parent's group cell opens / closes it (Left on a child goes to its parent); filters keep the
ancestors of matching rows; sorting orders siblings; HTML `ok:data-grid:expand` (cancelable,
`{ id, expanded }`). A path whose parents have no row gets generated parent rows (`auto-generated-row-<path>`). Detail panels: a
toggle column; the panel row follows its row (measured with it by virtualization); HTML builds it
from the row's template (`ok:data-grid:detailpanel`, cancelable). Row reordering: off while
sorted, filtered, tree or lazy; drag a handle (a line marks the drop) or Alt + Up / Down;
announced in the live region; HTML `ok:data-grid:roworder` (cancelable, `{ id, oldIndex,
targetIndex }`). Pinned rows: sticky rowgroups (under the header height the owner measures),
counted in `aria-rowindex` / `aria-rowcount`, not sorted, filtered, paged or selectable. Column
groups: one header row per level; neighbouring shown columns of a group share a cell (hidden or
moved columns split it); moves across groups are refused. List view: headers and column cells
`hidden`, the list cell shown. Column virtualization (fixed widths only; no spans, groups or list
view): template = specials + left pins + spacer + visible tracks + spacer + right pins; React
omits the other cells, HTML hides them. Lazy loading: rows are placeholders until their chunk (50
rows) loads; before the first measure only the first chunk renders. `updateRow` runs after an
accepted edit; its answer is shown, a failure brings the old values back.
Phase 6. Row grouping: one group per distinct cell text of each grouped field (nested in the model's
order); groups count their filtered rows; the column menu groups and ungroups; data rows keep the
group column empty. Sorting orders groups by key (sort on a grouped field or the group column), by
aggregated value (sort on an aggregated field), else by their first row. Aggregation: `sum` /
`avg` (2 decimals) / `min` / `max` (numbers and dates) / `size`; values left out when a row has
none (pivot buckets); groups show theirs inline, the footer row the filtered rows' (`all`: every
row); a function that doesn't fit the column type is ignored. Pivot: groups of the `rows` fields,
one column per distinct key tuple of the `columns` fields (sorted, `desc` per field) × value; column
groups name the keys; leaves never show; filters run on the data first; exports keep the data
columns and rows. Excel: core `gridToXlsx` (stored ZIP, inline strings, typed numbers, booleans and
dates, bold header, column widths); text never becomes a formula. Clipboard: Ctrl / Cmd + C copies
the selected cells (else selected rows, else the focused cell) as TSV; Ctrl / Cmd + V pastes into
editable cells from the selection's corner or the focused cell; one value fills the selection; each
row goes through `processRowUpdate` (HTML: `ok:data-grid:edit`, cancelable); the browser's own copy
/ paste runs on a short-lived text area (core `createGridClipboard`), no permission asked. Cell
selection: press, drag, Shift + press, Ctrl / Cmd + press (toggle) or drag (add), Shift + arrows,
Ctrl / Cmd + A (every cell of the page); core `createGridCellSelection` reports intent. Header
filters: one field per column (the type's first operator; booleans and singleSelect a select, dates
a DatePicker) sharing the filter model; Up / Down leave a field. Filter panel: `date` columns pick
their value with a DatePicker. Charts: categories are the top-level groups (their values aggregated
with the model's function, else `sum`) or the page's rows (`dimension` texts); series are number
fields; type `column` / `bar` (horizontal) / `line` / `area`. Navigation ignores grids inside cells
(a date picker's calendar) and leaves their tab stops alone.

## Keyboard
| Key | Action |
|---|---|
| Tab | Into / out of the grid (one stop) |
| Arrow keys | Move between cells (header included); controls inside cells take the focus |
| Home / End | First / last cell of the row (Ctrl: of the grid) |
| Page Up / Page Down | One screen of rows |
| Enter / Space (header) | Sort (Shift: add) |
| Ctrl / Cmd + Enter (header) | Column menu |
| Space (cell) | Toggle the row's selection |
| Ctrl / Cmd + A | Select / clear every row |
| Alt + ← / → (header) | Narrower / wider by 10px |
| Enter / F2 (editable cell) | Edit; in the field: Enter commits, Escape cancels |
| A character (editable cell) | Edit, starting with that character |
| Right to left | Left / Right and Alt + Left / Right follow the reading order |
| Shift + arrows (cellSelection) | Extend the cell range from the anchor |
| Ctrl / Cmd + C, Ctrl / Cmd + V (cell) | Copy (cells, rows or the focused cell) / paste into editable cells |
| Up / Down (header filter field) | Move to the cell above / below |

## Accessibility
`role=grid` named by `aria-label` / `aria-labelledby` (never the root), counts and indexes,
`aria-sort` on sortable headers (`none` until sorted), `aria-selected` on rows with selection,
`aria-multiselectable`. Checkboxes named "Select all rows" / "Select row"; menu buttons
"<header> column menu". The overlay is a `status`.

## Events / API
HTML: `ok:data-grid:sort | filter | selection | columns | density | order | pinned` (cancelable,
`{ model }`), `ok:data-grid:resize` (`{ field, width }`), `ok:data-grid:edit` (cancelable,
`{ id, row }`: the edited fields); instance `{ sortModel, filterModel, selection,
columnVisibilityModel, columnOrder, pinnedColumns, columnWidths, setSortModel, setFilterModel,
setSelection, setColumnVisibilityModel, setColumnOrder, setPinnedColumns, setColumnWidth,
toCsv(), exportCsv() }`.
`ok:data-grid:scrollend` (`{ visibleRowsCount }`), `ok:data-grid:datasourceerror` (`{ error }`);
instance `setRows(rows)`, `setDataSource(source | null)`. Phase 4: `ok:data-grid:rowclick` /
`rowdoubleclick` (`{ id }`), `cellclick` / `celldoubleclick` (`{ id, field, value }`),
`columnheaderclick` (`{ field }`), `editstart` / `editstop` (`{ id, field?, reason }`), `validate`
(`{ id, field, value, error? }`: set `error`); instance `print(options)`, `autosizeColumns(options)`,
`scrollToIndexes({ rowIndex, colIndex })`, `exportState()`, `restoreState(state)`,
`setFilterOperators(field, operators)`, `setValueFormatter(field, fn | null)`,
`setLocaleText(labels)` (the text the runtime writes; the markup is written in the page's
language), `toCsv(options)` / `exportCsv(options)`. Phase 5: `ok:data-grid:expand`,
`ok:data-grid:detailpanel`, `ok:data-grid:roworder`; instance `setRowChildrenExpansion(id,
open)`, `toggleDetailPanel(id)`; attributes `data-ok-csv-options` / `data-ok-print-options` (JSON,
known keys only; React writes them from `csvOptions` / `printOptions`).
Phase 6: `ok:data-grid:rowgrouping | aggregation | cellselection | chart` (cancelable, `{ model }`),
`ok:data-grid:pivot` (cancelable, `{ model, active }`), `ok:data-grid:clipboardcopy` (`{ data }`),
`ok:data-grid:clipboardpaste` (cancelable, `{ data }`: the pasted cells); instance
`rowGroupingModel`, `aggregationModel`, `pivotModel`, `pivotActive`, `cellSelectionModel`,
`chartModel` with `set…` (no events), `toExcel(options)`, `exportExcel(options)`.
Attributes: `data-ok-label-no-rows`, `data-ok-label-no-results`, `data-ok-export-file-name`.

## Responsive
The grid scrolls horizontally inside its main area (header sticky); the toolbar wraps; panels fit
the viewport (filter fields wrap to one column).

## Parity notes
React renders every filtered row (other pages `hidden`) and writes the template through `style`;
the HTML runtime writes it through CSSOM and keeps filtered-out rows `hidden` (parity skips hidden
rows and `style`). `data-ok-count` on the pagination is HTML-only (ignored). With virtualization
both render the same window (same measure). Row templates are HTML-only (`<template>` is skipped).
Phase 4: functions (`getRowHeight`, `isRowSelectable`, `colSpan`, `isCellEditable`, class names)
are React-only; React writes their result as attributes that HTML reads (`data-ok-row-height`,
`data-ok-selectable`, `aria-colspan`, `data-ok-editable`, `class`). HTML computes row spans itself.
`data-ok-format` and `setValueFormatter` are HTML-only (React has `valueFormatter`). `isAnyOf`
shows Autocomplete chips in both (HTML from the panel's template, with no suggestions).
Phase 5: React renders a detail panel only when open (HTML keeps templates); collapsed tree rows
render `hidden`; column-virtualized cells are left out in React and `hidden` in HTML (parity skips
both).
Phase 6: HTML builds group rows, the footer row and the pivot's headers itself from the rows in the
markup (the markup's generated group rows are dropped and built again; tree data keeps its
generated parents). The pivot story's HTML is the grid's data with `data-ok-pivot-active`.
React-only: `aggregationFunctions` (custom functions), `getAggregationPosition`,
`splitClipboardPastedText`, `clipboardCopyCellDelimiter`, `ignoreValueFormatterDuringExport`
(HTML: tab-separated, formatted text). The chart's SVG is the Chart runtime's (parity skips `<svg>`).
