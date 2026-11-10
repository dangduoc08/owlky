---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
"@owlky/styles": minor
"@owlky/mcp": minor
---

Data grid: `rowGroupingColumnMode="multiple"` (HTML `data-ok-row-grouping-column-mode`) shows one grouping column per grouped field, `__row_group_by_columns_group_<field>__`, named after the field; each group row names itself in its field's column, and sorting that column orders the field's groups by name. `groupingColDef` can be a function of `{ fields }`, called for each grouping column. Columns take `groupingValueGetter(value, row)`, which returns the value rows are grouped by (from `row[field]`); React writes it on each cell as `data-ok-grouping-value`, and the HTML runtime groups by that attribute or by a function given to `setGroupingValueGetter(field, getter)`. Core exports `gridGroupingField`, `gridGroupingFieldOf`, `isGridGroupingField` and `gridGroupingKey`. The Row grouping story adds Multiple grouping columns and Grouping value getter. Every grid root now carries `data-ok-row-grouping-column-mode="single"` by default.
