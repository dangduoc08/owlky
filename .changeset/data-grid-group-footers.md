---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
"@owlky/mcp": minor
---

Data grid: group footers and server-side aggregation. `getAggregationPosition` can return `"footer"` for a group: its aggregated values move to a footer row after the group's last shown row (`auto-generated-group-footer-<group id>`, shown while the group is open), and `null` hides them; the function now also receives `groupingField` and `groupingKey`, and is ignored while pivoting (MUI X). In HTML, `data-ok-aggregation-position` holds the positions by level as JSON (`root` and each grouped field), and React writes it. With a data source, `getRows()` receives `aggregationModel`, the response's `aggregateRow` fills the footer row, and `dataSource.getAggregatedValue(row, field)` reads the values of server parents and of `aggregateRow`; a new aggregation asks the server again. Core exports `gridGroupFooterId`, `gridWithGroupFooters`, `parseGridAggregationPositions` and `gridAggregationPositionOf`. New stories: Row grouping › Group footers and Server-side aggregation.
