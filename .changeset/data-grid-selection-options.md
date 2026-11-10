---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
"@owlky/styles": minor
---

Data grid: selection options. `rowSelection={false}` turns row selection off, `rowSelectionPropagation` (`{ parents, descendants }`, both on by default as in MUI X v8) makes a selection reach parents and children of tree data and the rows of a group (group rows get a checkbox; mixed parents show an indeterminate checkbox), and `checkboxColDef` sets the checkbox column's width, header label and class names. Behavior change: selecting a tree data parent now selects its children, and selecting all children selects the parent; pass `rowSelectionPropagation={{ parents: false, descendants: false }}` for the old behavior. HTML: `data-ok-row-selection="false"`, `data-ok-row-selection-propagation` (JSON). Core: `propagateGridSelection`, `gridDescendantSelection`, `gridSelectableDescendants`, types `GridSelectionTree`, `GridRowSelectionPropagation`. The tree count on a selected row keeps its contrast.
