# ADR-0020: Data grid — one grid engine in core, every MUI X tier, built in phases

**Status:** Accepted (2026-11-08)

## Context
The reference's "Data grid" page shows MUI X Data Grid (Basic and Custom sections): a toolbar
(columns, filters, export, quick search, density), checkbox selection, sorting, column menus,
custom cells and pagination. The owner asked for every feature of MUI X, free (Community) and paid
(Pro, Premium) tiers alike. MUI X is far larger than any Owlky component so far, and Owlky must
keep its contract: React and framework-free HTML with the same `data-ok-*` markup, behavior written
once in core, no runtime dependency, native first, WCAG 2.2 AA.

## Decision
1. **One grid engine in core** (`core/src/data-grid/`): pure functions for the data model (sort,
   filter, quick filter, pagination, selection, column sizing and visibility, CSV) and controllers
   that report intent (keyboard navigation, resizing). React keeps the state in props / hooks; the
   HTML runtime keeps it in the DOM. No tier gating: every feature is free in Owlky.
2. **ARIA grid on `div`s** (`role="grid"`, `rowgroup`, `row`, `columnheader`, `gridcell`,
   `aria-rowcount` / `aria-colcount` / `aria-rowindex` / `aria-colindex`, `aria-sort`,
   `aria-selected`), laid out with CSS grid (`--_ok-data-grid-columns`, written by the owner) so
   pinning, virtualization and spanning can come later without changing the anatomy. The Table
   component stays the choice for static tables (`<table>`).
3. **HTML data lives in the markup.** Rows are rendered by the page (server or snippet); a cell may
   carry its raw value in `data-ok-value` (sort and filter read it, else the text). The runtime
   sorts by moving rows, filters and pages with `hidden` (parity skips hidden rows, as for Table).
   Large data sets get a JavaScript API with row templates in the virtualization phase.
4. **Composition:** the toolbar, menus and panels are existing components (TextField, Button,
   IconButton, Menu, Popover, Switch, Checkbox, TablePagination) rendered by the grid; one column
   menu and one panel per grid, re-anchored to the trigger (no markup per column).
5. **Phases**, each a normal `/component` review with the full test standard:

   | Phase | Scope (MUI X tier) |
   |---|---|
   | 1 | Columns (types, width / flex / min width, alignment, formatters, custom cells), sorting (multi-sort with Shift: Pro), quick filter, filter panel (one filter: Community), pagination, checkbox selection, column visibility, density, CSV export, column menu, keyboard navigation, toolbar (Community) |
   | 2 | Multi filters and logic operators (Pro), column resizing and reordering (Pro), column pinning (Pro), cell and row editing (Community), print export |
   | 3 | Row and column virtualization (Community / Pro), infinite loading and lazy loading, server-side data source (Pro) |
   | 4 | Tree data, master-detail panels, row reordering, row pinning, column groups (Pro) |
   | 5 | Row grouping, aggregation, pivoting, Excel export, clipboard copy and paste, cell selection, header filters (Premium) |

## Consequences
- Every phase ships React and HTML together; later phases extend the anatomy additively.
- The HTML version is practical for small and medium data sets until phase 3.
- Bundle size grows with each phase: budgets are raised with a measured reason each time.
- CSV export neutralizes spreadsheet formulas (cells starting with `=`, `+`, `-`, `@`, tab or
  carriage return get a leading `'`): exported data may come from users.
