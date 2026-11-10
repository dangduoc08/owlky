---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
"@owlky/styles": minor
---

Data grid: set filters. A column with `filterVariant: "set"` filters with a checklist of its values (a search, "Select all" with a mixed state, one checkbox per value) on the `isAnyOf` model, in the filter panel and as a header filter (a button with a summary that opens the checklist). HTML: `data-ok-filter-variant="set"` on the header. Core: `gridSetFilterValues`, `gridSetFilterSearch`, `toggleGridSetFilterValues`, `gridSetFilterSummary`, `isGridSetFilter`, `gridFilterOperators(type, variant)`; locale keys `setFilterSearch`, `setFilterSelectAll`, `setFilterValues`, `setFilterSelected` in every pack.
