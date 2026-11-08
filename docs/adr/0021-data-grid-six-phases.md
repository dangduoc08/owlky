# ADR-0021: Data grid — the backlog folded into six phases

**Status:** Accepted (2026-11-08). Supersedes decision 5 (the phase table) of ADR-0020; the rest of
ADR-0020 stands.

## Context
After phase 3, the MUI X features outside the five phases sat in a roadmap backlog with no plan.
The owner asked to put every backlog feature into a phase (2026-11-08). Most of them complete
what phases 1–3 shipped (selection, columns, rows, editing, filtering, events and API, export,
language), so they belong before the large new features of phases 4 and 5. The scale items
deferred from phase 3 fit the tree data phase, where rows also load per level.

## Decision
Six phases. Phases 1–3 are unchanged and done; the backlog becomes a new phase 4, and the former
phases 4 and 5 become 5 and 6 with the related backlog items:

| Phase | Scope (MUI X tier) |
|---|---|
| 1 | Columns, sorting (multi-sort: Pro), quick filter, filter panel, pagination, checkbox selection, column visibility, density, CSV export, column menu, keyboard navigation, toolbar (Community) — done |
| 2 | Multi filters and logic operators, column resizing, reordering and pinning (Pro), cell and row editing, print export — done |
| 3 | Row virtualization, server-side sorting / filtering / pagination, infinite loading, data source with cache (Pro), loading overlays, HTML rows API — done |
| 4 | Community and API completeness: single-row selection (`disableMultipleRowSelection`), `isRowSelectable`, `keepNonExistentRowsSelected`, `checkboxSelectionVisibleOnly`; column autosizing (`autosizeColumns`, double-click the resize edge), `colSpan` and `rowSpanning`, header `description` tooltips, `renderHeader`; row heights (`getRowHeight`, `"auto"`), `getRowClassName` / `getCellClassName`, `getRowSpacing`; edit validation (`preProcessEditCellProps`, error states), `valueParser` / `valueSetter`, start editing by typing, `onCellEditStart` / `onCellEditStop` / `onRowEditStop`, `isCellEditable`; the `isAnyOf` operator, custom filter operators, quick filter options; `onRowClick`, `onCellClick`, `onCellDoubleClick`, `onColumnHeaderClick`…, `apiRef`, `exportState` / `restoreState`; CSV options, print options and printing every filtered row; the icon-only toolbar, locale packs, right-to-left layout; HTML value formatters for edited and `setRows` cells |
| 5 | Tree data (with data source loading per level), master-detail panels, row reordering, row pinning, column groups, list view; column virtualization (`columnBufferPx`), lazy loading of row chunks (`lazyLoading`, `rowsLoadingMode`), `dataSource.updateRow`, cache time to live, `rowBufferPx` as an option (Pro) |
| 6 | Row grouping (also through the data source), aggregation, pivoting, Excel export, clipboard copy and paste, cell selection, header filters (Premium); charts integration and the AI assistant once a Chart component exists |

Date pickers in filter values wait for the Date pickers component ("Pending integrations"), not
for a phase.

## Consequences
- Phase 4 is the next `/component` Update; it is broad, so it may be split into reviews (4a, 4b)
  as phase 2 was, without a new ADR.
- No backlog list remains for the data grid: a new MUI X feature goes into a phase, or into
  "Pending integrations" when it needs a missing component.
- Same rules as ADR-0020: React and HTML together, additive anatomy, measured budget raises.
