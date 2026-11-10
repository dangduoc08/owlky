---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Data grid: custom editors and controlled edit modes. Column `renderEditCell` (with `api.setEditCellValue`) and `renderHeaderFilter` (with `applyFilterChanges`); `cellModesModel` / `onCellModesModelChange` and `rowModesModel` / `onRowModesModelChange`; `apiRef` `setEditCellValue`, `getCellModesModel`, `getRowModesModel`, `startCellEditMode`, `stopCellEditMode`, `startRowEditMode`, `stopRowEditMode`. HTML: `template[data-ok-data-grid-edit-cell="<field>"]` editors, `data-ok-filter-operator` on custom header filter fields, instance `cellModesModel`, `rowModesModel`, `setCellModesModel`, `setRowModesModel`, `setEditCellValue`, cancelable `ok:data-grid:cellmodes` / `ok:data-grid:rowmodes`. Controls hidden inside cells (`hidden`) now stay hidden. Core: `gridEditTarget`, `gridEditModes`, `gridEditModeOf`, `sanitizeGridCellModes`, `sanitizeGridRowModes`.
