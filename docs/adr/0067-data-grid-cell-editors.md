# ADR-0067: Data grid cell editors are Owlky's InputBase, Select and Checkbox

**Status:** Accepted (2026-11-12, owner decision of 2026-11-12 on the "Pending integrations" row).
Extends ADR-0020 / 0021 (data grid editing, phase 2; custom editors and edit modes, 4.18.50) and
composes ADR-0045 (Select). Nothing is superseded.

## Context
MUI X edits cells with its own components: `GridEditInputCell` (an `InputBase`, `type="number"` for
number columns), `GridEditDateCell` (an `InputBase` with `type="date"` / `datetime-local`),
`GridEditSingleSelectCell` (a `Select`, open at the start in cell mode) and `GridEditBooleanCell`
(a `Checkbox`). Owlky's grid edited with native `input`, `select` and `input[type=checkbox]`
marked `data-ok-data-grid-edit-input` and styled by `data-grid.css` (`accent-color` for the
checkbox), a stand-in recorded in the roadmap since Select, Checkbox and InputBase exist. Composing
them changes the rendered markup of a cell being edited and the select's keyboard, so it is not an
additive integration.

## Decision
1. **Editors by column type** (React and the HTML runtime alike):
   - `string`, `number`, `date`, `dateTime`: an **InputBase** (`fullWidth`, no variant, so no box),
     `type` text / `number` / `date` / `datetime-local` (core `gridEditInputType`, unchanged);
   - `singleSelect`: a **bare listbox Select** (`div[data-ok-select]` without a variant, like
     TablePagination's: the grid draws the field), one `MenuItem` option per `valueOptions` entry;
   - `boolean`: a **Checkbox**, size `small`, color `primary`.
   `renderEditCell` and HTML `template[data-ok-data-grid-edit-cell]` editors are unchanged.
2. **Markup.** The control that takes the focus keeps `data-ok-data-grid-edit-input`: the
   InputBase's `input[data-ok-text-field-input]`, the Checkbox's `input[data-ok-checkbox-input]`,
   the Select's trigger `div[data-ok-select-display][role=combobox][tabindex=-1]`. It carries the
   name (`aria-label` "Edit <header>"), `aria-invalid` and `aria-describedby` (the error's id). Ids:
   `<grid id>-<row id>-<field>-edit` for the input or trigger (the Select's listbox and menu add
   `-listbox` / `-menu`). An invalid InputBase also gets `data-ok-error` on its root (TextField's
   `error`). The cell keeps `data-ok-editing` and `span[data-ok-data-grid-edit-error][role=alert]`.
   Parts that changed:

   | Before | After |
   |---|---|
   | `input[data-ok-data-grid-edit-input][type=text\|number\|date\|datetime-local]` | `div[data-ok-text-field][data-ok-input-base][data-ok-size=medium][data-ok-color=default][data-ok-full-width][data-ok-margin=none][data-ok-error]?` › `div[data-ok-text-field-control]` › `input[data-ok-text-field-input][data-ok-data-grid-edit-input][id][type]?[placeholder=" "]` |
   | `select[data-ok-data-grid-edit-input]` › `option` | `div[data-ok-select]` › `div[data-ok-select-display][data-ok-data-grid-edit-input][role=combobox][tabindex=-1][aria-expanded]`, `input[data-ok-select-input]`, `svg[data-ok-select-icon]`, `div[data-ok-popover][popover=manual]` › `ul[data-ok-select-listbox][role=listbox]` › `li[data-ok-menu-item][role=option][aria-selected][data-ok-value]` |
   | `input[data-ok-data-grid-edit-input][type=checkbox]` | `span[data-ok-checkbox][data-ok-color=primary][data-ok-size=small]` › `input[data-ok-checkbox-input][data-ok-data-grid-edit-input][type=checkbox]` + `span[data-ok-checkbox-icon]` × 3 |

3. **Number columns use InputBase `type="number"`, not NumberField.** MUI X edits numbers with an
   input; the column's `valueParser` (else `parseGridEditValue`) and `preProcessEditCellProps` own
   parsing and checks, while NumberField has a value model of its own (clamping and formatting on
   blur) that would compete with them; its two step buttons don't fit a 36–52px cell next to
   right-aligned numbers; and its keys (Page Up / Down, Home / End to the bounds) would add a third
   keyboard model inside the grid. The native number input already steps with Arrow Up / Down. A
   NumberField stays one `renderEditCell` away.
4. **Select keyboard (an editing change).** In cell mode the listbox opens when editing starts, on
   the selected option (MUI X `initialOpen`); in row mode it starts closed and the trigger takes
   the focus. In the listbox the Select's keys apply (arrows, Home, End, typeahead); Enter, Space
   or a click picks: in cell mode the pick saves the cell (as MUI X's `stopCellEditMode`: no edit
   stop event or reason), in row mode it sets the field and the focus goes back to the trigger.
   Escape, in the listbox or on the trigger, closes the list and cancels the edit. Tab in the list
   closes it (the Select). On the trigger, Enter saves (the grid takes it before the Select opens:
   core `createSelectController` now ignores a key press another handler prevented), Arrow Down /
   Up, Space, Alt + Arrow Down, Home, End and characters open the list. Leaving the cell (row
   mode: the row) saves, as before; the listbox lives in the top layer (`popover="manual"`) but
   inside the cell's DOM, so focus in it is focus in the cell.
5. **A nested listbox in the grid's keyboard.** Grid navigation ignores keys from a combobox and
   from inside a listbox (like the DatePicker's nested grid), and its focus target skips
   `aria-hidden` inputs (the Select's hidden form input). Copy, paste, undo / redo and the cell
   menu ignore keys from anything inside a cell being edited, not only from native fields.
6. **Checkbox and InputBase keys are unchanged:** Enter saves, Escape cancels, Space toggles the
   checkbox, a printable key starts editing text-like columns with that character.
7. **HTML.** The runtime builds the same markup with DOM methods. The Select composes the `select`
   runtime (`runtime.getOrCreate`, which composes the popover), so a page needs `owlky.js` (or the
   select and popover runtimes) for listbox editors; it reads the value from the Select's hidden
   input and saves a cell-mode pick on `ok:select:close` with reason `select`. InputBase and
   Checkbox need no runtime.
8. **Styles.** `data-grid.css` (loaded after `text-field.css`, `select.css` and `checkbox.css`)
   restyles the composed roots through parent selectors (`[data-ok-editing] > …`): each editor fills
   the cell, keeps the 2px inset primary outline (error color when invalid) and the cell's padding;
   the Checkbox is centered and no longer uses `accent-color`.

## Consequences
- Rendered markup of cells being edited changes in both packages: pre-0.1.0, a **major** changeset
  for `@owlky/core`, `@owlky/styles`, `@owlky/react` and `@owlky/html`.
- Migration: CSS that targeted `input[data-ok-data-grid-edit-input]` / `select[…]` should target
  `[data-ok-data-grid-edit-input]` (the focused control) or the composed roots (`[data-ok-editing] >
  [data-ok-text-field]`, `> [data-ok-select]`, `> [data-ok-checkbox]`). Tests that read
  `select.value` or `selectOption()` on a list editor open it (it is open at the start in cell
  mode) and pick an option by role (`option`, name = its text); tests that found the editor as
  `cell.querySelector("input")` still find InputBase's input and the Checkbox's input, but a list
  editor is a `combobox`, not a `select`.
- Listbox editors in HTML need the select runtime; without it the trigger shows the value and
  doesn't open (Enter and Escape still save and cancel).
- Not provided: MUI X's `GridEditSingleSelectCell` `onValueChange` and native-select slot props;
  `valueOptions` stay strings (labels = values).
