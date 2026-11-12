---
"@owlky/core": major
"@owlky/styles": major
"@owlky/react": major
"@owlky/html": major
---

Data grid: cells now edit with Owlky's own components instead of native fields. Text, number and date columns use an InputBase, `singleSelect` columns use a Select, and `boolean` columns use a small Checkbox. This changes the markup of a cell being edited, so it is a breaking change. Owlky hasn't published 0.1.0 yet, so it ships with the first release.

- **Select editor:** in cell editing, its list opens when editing starts, and picking an option saves the cell. In row editing, the list starts closed: picking an option sets the field, and Enter saves the row. Escape cancels in both, and Enter on the closed field saves.
- **Number columns** keep a native number input inside the InputBase.
- **Migration:** CSS or tests that looked for `input[data-ok-data-grid-edit-input]` or `select[data-ok-data-grid-edit-input]` should use `[data-ok-data-grid-edit-input]`, the field that has the focus. For a list editor, that field is a `combobox`: pick an option by its role (`option`) instead of calling `selectOption()` on a `<select>`. In HTML, list editors need the select and popover runtimes, which `owlky.js` includes.
- The Select controller in `@owlky/core` now ignores a key press that another handler already prevented.
