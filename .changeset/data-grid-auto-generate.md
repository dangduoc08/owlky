---
"@owlky/core": minor
"@owlky/react": minor
"@owlky/html": minor
"@owlky/mcp": patch
---

Data grid: generated columns (ApexGrid `autoGenerate`, ADR-0057). In React, `columns` is now optional: left out (or empty with the new `autoGenerate`), the grid makes one column per field of the rows, typed `number`, `boolean`, `date`, `dateTime` or `string` from the values, with headers from the field names ("releaseDate" → "Release date", "id" → "ID"); given columns always win. In HTML, a grid with `data-ok-auto-generate` and no columns builds its headers, rows, row template and panel lists from a `table[data-ok-data-grid-data]` inside it when the page loads (cell text: "42" is a number, "true" a boolean; `th[data-ok-field]` names a column yourself), then removes the table. Core: `gridAutoColumns`, `gridInferColumnType`, `gridHeaderName`, `gridAutoValue`, `GRID_AUTO_SAMPLE`.
