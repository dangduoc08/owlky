---
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Data grid: `dateTime` columns pick their filter value with the DateTimePicker, in the filter panel and in the header filters (the value is `YYYY-MM-DDTHH:mm:ss`, local time). In HTML, add a `template[data-ok-data-grid-date-time]` with a DateTimePicker to the filter panel, as for date columns. Fixed: while the grid scrolls, pinned cells, row-spanning cells and controls inside cells (checkboxes, switches, ratings) no longer paint over the header, and scrolling rows stay under the pinned rows.
