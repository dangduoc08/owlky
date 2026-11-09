---
"@owlky/core": minor
"@owlky/styles": minor
"@owlky/react": minor
"@owlky/html": minor
---

Add Select and InputLabel: a select-only combobox whose listbox of MenuItems opens in a Popover (single and multiple values, chips, a placeholder, grouping, `autoWidth`, `displayEmpty`, controlled `open`), with the outlined, filled and standard looks of the Text field and the FormControl's states; `native` keeps the browser's `<select>`. FormControl gains `hiddenLabel`. TextField and TablePagination accept `selectProps={{ native: false }}` for a listbox Select (their native select stays the default). In HTML, the `select` runtime emits `ok:select:change`, `ok:select:open` and `ok:select:close`.
