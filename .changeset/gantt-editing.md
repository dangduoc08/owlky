---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Gantt phase 2 (editing): with `editable`, drag bars to move them, their edges to change dates and their progress handles to set progress, or press Enter on a row to edit from the keyboard. Changes are reported (`onTaskChange` in React, the cancelable `ok:gantt:taskchange` event in HTML, which then writes the table); a double click, a double tap or F2 asks for your own edit form (`onTaskEdit`, `ok:gantt:edit`, `updateTask()`). `taskDrag`, `taskResize` and `progressDrag` turn single gestures off.
