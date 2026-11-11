# ADR-0063: Data grid server-side pivoting through the data source

**Status:** Accepted (2026-11-11, auto-approved under the roadmap's autorun). Extends the data
source contract of ADR-0021 (phase 3, server-side grouping and aggregation of phase 6); nothing
is superseded.

## Context
Roadmap 4.18.93 (from the ApexGrid audit: `pivotCols` / `pivotResultFields`) asks for pivoting on
the server. Until now a pivoted grid with a data source pivoted the rows it had loaded, which is
wrong for paged or grouped server data. MUI X Premium has server-side pivoting: `getRows` receives
`pivotModel`, the response carries `pivotColumns` (a tree of `{ group, children }`, with an optional
`key`), the rows are grouped on the server by the pivot's row fields (as server-side row grouping,
`getGroupKey` / `getChildrenCount`), and each row holds its pivot values in fields named by the
column keys and the value field (MUI X's default `pivotingColDef` joins them with `>->`).

## Decision
1. **Contract (additive).** `GridGetRowsParams.pivotModel` (the pivot model, sent while the grid is
   pivoted with a data source, not lazy, not tree data), `GridGetRowsResponse.pivotColumns`
   (`GridGetRowsResponsePivotColumn { key?, group: string | row, children? }`). While pivoting, the
   requests carry `groupKeys` / `groupFields` = the pivot's visible row fields (server-side row
   grouping) and no `aggregationModel`; children load with the same `pivotModel`.
2. **Columns.** Core `gridServerPivot(pivotColumns, columns, model, labelOf)` walks the tree in its
   order: a leaf is a path of keys as deep as the model's column fields (`key`, else a string
   `group`, else the group row's value of that level's field). One column per path and visible
   value, laid out by the same `gridPivotLayout` as the client pivot (fields `pivot:<keys>/<field>/<fn>`,
   headers "<header> (<fn>)", one column group level per column field). No column fields: one column
   per value.
3. **Values.** A server row's value of a pivot column is its field `gridServerPivotField(keys,
   valueField)` (`2025>->Q1>->revenue`; no keys: the value field), read through
   `dataSource.getAggregatedValue(row, field)` when given. The server's rows are the groups (and
   their children); the grid neither filters, sorts nor aggregates them.
4. **Owners.** React computes the server pivot from the last response; HTML keeps each server row's
   data in memory (a `WeakMap`), builds pivot rows with DOM methods (group cell + one cell per pivot
   column, no row template needed) and asks the source again when the pivot model or the pivot's
   state changes.

## Consequences
- Grids with a data source that pivoted their loaded rows now ask the server (behavior change for
  release notes); sources that ignore `pivotModel` see grouped requests and show empty pivot
  columns.
- Not provided: the pivot's root totals row from the response's `aggregateRow`, client-formatted
  group headers through the column's formatter (the key text is shown), lazy loading while pivoting.
