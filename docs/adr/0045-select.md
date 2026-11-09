# ADR-0045: Select — a select-only combobox with roving focus; the native select stays

**Status:** Accepted (2026-11-09)

## Context
Four components waited for a listbox Select ("Pending integrations"): TablePagination's rows per
page, the Pagination story "Items", the Table story "Table pagination with API" and TextField's
non-native `select`. TextField already ships a native `<select>` (`select` prop, `<option>`
children) and TablePagination a styled native `<select>`; both APIs and DOMs are approved. The
Form control contract (form-control.md, batch B) fixed how a Select composes a FormControl and an
InputLabel without changing their DOM.

Upstream (MUI `Select`, React only) renders a `div[role=combobox]` that opens a `Menu` (a Popover
with a `MenuList` of `MenuItem`s, `role=listbox` / `option`) and moves focus onto the options
(roving `tabindex`, `MenuList` keyboard: arrows wrap, Home / End, typeahead); a hidden `input`
holds the value for forms; `native` swaps in a `NativeSelect`. WAI-ARIA APG describes the same
"select-only combobox" with focus kept on the combobox and `aria-activedescendant`, plus keys on
the closed combobox (Home / End / a character open on a matching option). Our Autocomplete uses
`aria-activedescendant` because its focus must stay in a text input.

## Decision
1. **Select-only combobox, MUI's roving focus.** The trigger is
   `div[data-ok-select-display][role=combobox][tabindex=0]` (`aria-haspopup=listbox`,
   `aria-expanded`, `aria-controls`); the list is `ul[data-ok-select-listbox][role=listbox]` in a
   Popover (`createPopoverController`, top layer, Menu's paper) and its options are MenuItems
   (`li[data-ok-menu-item][role=option][aria-selected]`). Opening moves focus onto the selected (or
   first) option, as MUI does; closing returns it to the trigger through the popover's focus
   restore (the trigger is the anchor). No `aria-activedescendant`: the Popover already handles
   initial focus and restore, Menu's styles (`:focus`, `:focus-visible`) apply as they are, and
   screen readers announce focused options natively. From APG we add the closed-trigger keys
   (Home, End, typeahead) — additions, not changes to MUI's behavior. Tab closes and keeps focus on
   the trigger (MUI prevents it).
2. **Behavior once in core.** `createSelectController(root, …)` handles the trigger's and the
   list's keys and clicks and reports intent (`onOpen(focus)`, `onClose(reason)`,
   `onPick(option)`); React (state) and the HTML runtime `select` (DOM state: `aria-selected`, the
   hidden input) own the value. Pure helpers (`selectKeyTarget`, `nextSelectValue`, …) reuse
   Menu's typeahead.
3. **The field box mirrors TextField, the label is FormControl's.** A standalone Select's root
   `div[data-ok-select][data-ok-variant]` draws the outlined / filled / standard box with
   TextField's values (its own private variables; TextField's DOM and CSS are untouched). The
   InputLabel is a FormLabel with `data-ok-input-label`; `select.css` floats it with `:has()` on
   the FormControl (focus, the hidden input's `:not(:placeholder-shown)`, a native select,
   `shrink`). React resolves variant / size / color / states from `useFormControl()` and writes
   them on the box, so HTML snippets (generated from React) carry the same attributes.
4. **Composition without a box.** A `[data-ok-select]` without `data-ok-variant` has no box of its
   own: TextField's control carries it for the listbox select (`selectProps.native: false`; the
   trigger is also `data-ok-text-field-input`, text-field.css adapts), and TablePagination's
   rows-per-page select is bare (table.css draws it). Same parts, same runtime.
5. **The native select stays.** `Select native` renders `select[data-ok-select-native]` in the
   same box (no JavaScript); TextField's `select` and TablePagination's rows per page stay native
   by default, and the listbox is opt-in (`selectProps={{ native: false }}`), so their DOM, API,
   tests and the data grid (which composes TablePagination) don't change. MUI's defaults are the
   listbox: recorded as a difference.
6. **React-only render functions.** `renderValue` is React-only; HTML covers what the demos need
   declaratively: chips from `<template data-ok-select-chip>`, an empty value from
   `<template data-ok-select-placeholder>` (with `data-ok-display-empty`), the options' texts
   joined with ", " otherwise, a checkbox inside an option following its state.

## Consequences
- One more runtime in the CDN bundle (about 1.5 kB) and about 1.3 kB of CSS; budgets raised.
- Values compare as strings (`10` and `"10"`); React returns the options' own values.
- A `div` trigger can't be labelled by `<label for>`: the InputLabel names it through `labelId`
  (`aria-labelledby`); TextField's label gets an `id` in the listbox case only.
- Switching TextField's or TablePagination's default to the listbox would be a breaking DOM change
  (a future major, with its own ADR).
