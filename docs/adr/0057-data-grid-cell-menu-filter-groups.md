# ADR-0057: Data grid cell menu, nested filter groups and generated columns

**Status:** Accepted (2026-11-10, auto-approved under the roadmap's autorun). Extends ADR-0020 /
0021 (data grid) and ADR-0055 (range charts); builds on the Menu's submenus (roadmap 4.5) and the
Popover's `anchorPosition` (4.7). Nothing is superseded.

## Context
The owner decided that ApexGrid must be complete in Owlky (roadmap 4.18.13–14). ApexGrid (and AG
Grid) have a context menu on cells and an advanced filter builder (nested AND / OR groups that save
as JSON); ApexGrid's `autoGenerate` builds the columns from the data. MUI X has none of the three:
its filter model is one flat list of items with one `logicOperator`, and a cell menu is left to
`slotProps.cell.onContextMenu`. Every existing snippet must stay byte-identical, so new markup can't
appear in grids that don't ask for it.

## Decision
1. **Cell menu (`contextMenu`, HTML `data-ok-context-menu`).** An opt-in flag renders
   `Menu#<id>-context-menu` (`data-ok-anchor-reference="anchorPosition"`, list named "Cell
   actions") and the grid's live region. Core `createGridContextMenu` opens it from a right click
   (at the pointer), Shift + F10 or the Menu key (at the focused cell's lower start corner); it
   focuses the cell first, so the Popover gives the focus back to it when the menu closes, and it
   swallows the browser's own `contextmenu` that some systems send after the key. Fields being
   edited, headers, special and generated rows, `actions` columns and grids inside cells keep the
   browser's menu. A right click outside the selected cells selects that cell (spreadsheets).
2. **Items (AG Grid's names, kebab-case).** Core `gridDefaultContextMenuItems` gives Copy, Paste
   (editable columns, paste on), a separator, Export (submenu: CSV, Excel, Print), Chart from
   selection (`cellSelection` + `chartsIntegration`, ADR-0055), a separator, Pin column (submenu:
   Pin to left, Pin to right, Unpin; disabled for `pinnable: false`); `gridContextMenuEntries`
   turns `"separator"` into the line under the item before it (`divider`, a submenu trigger's
   `data-ok-show-divider`). Items are `[data-ok-data-grid-context-action=<name>]`. Copy and Paste
   from a menu can't use the keyboard path (no key press): core `createGridClipboard` gains
   `copy(text)` (Clipboard API, else the copy command in the press) and `paste()`
   (`navigator.clipboard.readText()`, which the browser may ask about); a refused read is announced
   ("Press Ctrl + V (Cmd + V on a Mac) to paste").
3. **Extensible.** React: `getContextMenuItems(params)` returns built-in names, `"separator"` and
   `{ name, label, onClick, disabled }` items for the cell (`params`: `id`, `field`, `row`,
   `value`, `colDef`, `defaultItems`); at rest the menu holds the default items, so the server
   markup and the HTML snippet match. HTML: the menu is markup, so authors add items to it, and the
   cancelable `ok:data-grid:contextmenu` (`{ id, field, value, menu }`) lets a listener add, hide or
   disable items per cell or keep the browser's menu; `ok:data-grid:contextmenuselect` (`{ action,
   id, field }`, cancelable: skips a built-in action) reports every choice. Custom submenus aren't
   offered (React items are flat).
4. **Nested filter groups.** `GridFilterModel` extends `GridFilterGroup { items, logicOperator?,
   groups? }`: groups nest (at most `GRID_FILTER_MAX_DEPTH` = 8 levels, also when restored by
   `sanitizeGridState` / `sanitizeGridFilterGroup`), each combines its items and groups with its own
   And / Or, and the model stays plain JSON. `filterGridRows` leaves out items without a value
   (`gridFilterItemActive`) at every level, as MUI X does — a behavior change at the top level: an
   empty row no longer lets every row through an Or. Server modes get the groups in `filterModel`.
5. **Filter panel.** The opt-in `filterGroups` flag adds **Add group** buttons
   (`[data-ok-data-grid-filter-add-group]`, also hidden by `disableMultipleColumnsFiltering`); a
   model's groups always render. A group is `div[data-ok-data-grid-filter-group][role=group]`
   named "Filter group 1.2", with a header (remove button, then from its second place in its parent
   the parent's And / Or select, as rows have), its rows, nested groups, and its own Add filter /
   Add group buttons. Ids follow the path (`-g0-g1`, rows `-g0-<n>`), so labels stay unique. HTML
   keeps the panel as the state (as before): the runtime reads the whole tree, builds groups from
   copies of the panel's first row and buttons, and renames ids after every change. Every control
   is native (Tab, Space, Enter); groups are named for screen readers.

6. **Generated columns (roadmap 4.18.14, ApexGrid `autoGenerate`).** Core `gridAutoColumns` makes one
   column per field of the first 200 rows, typed by `gridInferColumnType` (number, boolean, date,
   date time, string) and named by `gridHeaderName`; they share the width (`flex: 1`, `minWidth:
   120`). React: `columns` becomes optional; left out (or empty with `autoGenerate`) the grid
   generates and writes `data-ok-auto-generate`. HTML grids are their markup, so the data comes the
   way the Chart's and the Gantt's do: a `table[data-ok-data-grid-data]` the runtime reads as text
   (`fromText`) at setup, before anything reads the columns, building headers, rows, a row template
   and the panels' lists with DOM methods in React's markup, then removing the table. The story's
   HTML is that empty grid plus the table, so pixel and DOM parity test the generation itself. Late
   data (fetched JSON) isn't generated in HTML: the columns are read once (`setRows` fills
   generated columns).

## Consequences
- The menu works by keyboard (WCAG 2.1.1) and offers pointer-free paths to copy, paste, export,
  chart and pin. Paste from the menu depends on the browser's clipboard permission; Ctrl / Cmd + V
  stays the reliable path and is announced.
- Header filters, cross-filtering and the column menu's Filter item work on the top-level items;
  groups are only edited in the panel and by code.
- Not done: custom submenus, a menu on column headers (the column menu covers them), MUI X
  `onCellContextMenu`-style events in React (use `getContextMenuItems`).
