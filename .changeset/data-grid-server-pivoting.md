---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
---

Data grid: server-side pivoting (ADR-0063, MUI X names). A pivoted grid with a data source sends `pivotModel` in `getRows()` params, groups by the pivot's row fields through `groupKeys` / `groupFields`, and builds its columns from the response's `pivotColumns`; rows hold the values in `<keys>>-><field>` fields (read through `getAggregatedValue` when given). Behavior change: a data source grid no longer pivots only the rows it has loaded. Core adds `gridServerPivot`, `gridServerPivotField`, `gridPivotLayout` and the `GridGetRowsResponsePivotColumn` type.
