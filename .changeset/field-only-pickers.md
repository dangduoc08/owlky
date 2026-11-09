---
"@owlky/html": patch
---

Date pickers: the `date-picker` and `date-range-picker` runtimes set up field-only pickers (every view renderer `null`, no layout) instead of failing to initialize. Such pickers never open.
