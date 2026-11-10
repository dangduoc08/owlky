---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
"@owlky/styles": minor
"@owlky/mcp": minor
---

Data grid pivoting: derived fields and a drag and drop panel. By default every `date` column gives the pivot a year field (`<field>-year`) and a quarter field (`<field>-quarter`, `Q1`–`Q4`), named "<header> (Year)" and "<header> (Quarter)" (MUI X); `getPivotDerivedColumns` replaces them (`null`: none), and the HTML runtime takes a function through `setPivotDerivedColumns(getter)`. The pivot panel now has four sections (Not used, Rows, Columns, Values) in the model's order: drag a field by its handle to another section or place (core `createGridPivotDrag`), or use its place select and its Move up / Move down buttons, which keep the focus (WCAG 2.5.7). New labels: `pivotYearColumnHeaderName`, `pivotQuarterColumnHeaderName`, `pivotDragToRows`, `pivotDragToColumns`, `pivotDragToValues`, `pivotMoveUp`, `pivotMoveDown` (every locale pack). Core exports `gridPivotDerivedColumns`, `gridPivotSections`, `moveGridPivotField` and `createGridPivotDrag`. The Pivoting story adds Derived columns. Behavior change: date columns now show two more fields in the pivot panel.
