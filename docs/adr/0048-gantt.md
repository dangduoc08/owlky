# ADR-0048: Gantt — one treegrid with a timeline column, laid out by core, built in three phases

**Status:** Accepted (2026-11-09; auto-approved under the owner's standing instruction to run the
approved plan, `docs/roadmap-components.md` item 2.3)

## Context
ApexGantt is ApexCharts' commercial project-timeline product (Premium plan): a task list on the
left, a timeline on the right, time scales from minutes to years, summary tasks, milestones,
dependencies (FS, SS, FF, SF with lag), baselines, a critical path, working calendars, drag to
move / resize / set progress, selection, tooltips, virtualization and export. Owlky needs the same
capability under its own contract: React and framework-free HTML with the same `data-ok-*` markup,
behavior written once in core and reporting intent (ADR-0004), one option schema (ADR-0015), no
`innerHTML` or style strings (strict CSP), WCAG 2.2 AA, no new runtime dependency. ApexGantt is a
behavior and API reference only: no code, demo data, images or text are copied.

## Decision
1. **One treegrid, two panes by CSS.** The Gantt is a single `role="treegrid"` whose rows carry
   the task-list cells (name, start, end, duration, progress) **and** a timeline cell with the
   task's bar. One scroll container scrolls both ways; the task-list cells and the header are
   `position: sticky`, so the list and the timeline always share rows, row heights and vertical
   scroll, with no scroll syncing. We don't compose the Data grid: its engine (virtualization,
   column layout, editing, its own keyboard model and runtime-owned rows) would have to be bent to
   host a timeline column and to share its row window, and a Gantt needs none of its toolbar,
   filtering or pagination. A lighter grid written for the Gantt keeps the markup small and the
   two panes in one row element.
2. **Rows and bars are HTML; the background and the arrows are one SVG.** Core
   `renderGantt(model, view)` returns a tree of nodes (tag, attributes, private style properties,
   text), like Chart's `ChartNode`. React maps it to elements, the HTML runtime builds and patches
   it with DOM methods (`createElement(NS)`, `setAttribute`, `textContent`, CSSOM for the
   `--_ok-gantt-*` positions). Both implementations draw the same nodes, so the anatomy is equal
   by construction and the parity test compares it. Bars are HTML elements because they need
   accessible names, focus and pointer hit testing; the grid lines, non-working days, today line,
   project boundary and dependency arrows are decorative paths in one `aria-hidden` SVG behind the
   rows (dependencies are also stated in each bar's accessible description). Dates are written
   with `Intl.DateTimeFormat` in UTC on day numbers, never measured, so server, React and HTML
   render the same text.
3. **Dates are ISO days.** Tasks carry `start` and `end` as `YYYY-MM-DD` (the end day is included,
   a milestone has a start only); core turns them into UTC day numbers, so daylight saving and
   time zones can't move a bar. React also accepts `Date` objects (their local calendar day).
   The pickers' adapters (ADR-0030) aren't needed: public values are ISO strings. Sub-day
   scheduling (hours, minutes) is deferred.
4. **Scales come from the zoom.** `pixelsPerDay` is the zoom; `view` names the presets (`day` 36,
   `week` 16, `month` 5, `quarter` 1.6, `year` 0.5). The header has two tiers picked from the
   density: month over days, month over weeks (week start from `weekStart`), year over months,
   year over quarters, year over halves. Zoom buttons multiply or divide by 1.4 between 0.25 and
   120. The range starts one bottom unit before the first task and ends one after the last.
   Non-working days (`workingWeekdays`, `holidays`) are shaded at day and week density; a today
   line marks `today` (default the current day; stories pass a fixed date).
5. **Tasks:** bars with progress (a hard-stop gradient, no extra element), summary bars for
   parents (dates and duration-weighted progress rolled up from the children), milestones
   (diamonds), baselines (a thin bar under the actual one), palette colors per task, labels
   `right` · `inside` · `left` · `auto` (the width is estimated with Chart's glyph widths).
   Parents collapse and expand (`aria-expanded`). Dependencies `FS` · `SS` · `FF` · `SF` with a
   lag in days are routed as orthogonal arrows with rounded corners; the critical path is computed
   in core (backward pass over the dependencies, zero total float).
6. **Interaction reports intent.** One core controller `createGanttController(root, callbacks)`
   handles keyboard focus (rows, roving `tabindex`), expand / collapse, selection, the tooltip,
   zoom and, in phase 2, editing. It never changes the data: React keeps tasks, expanded rows,
   selection and zoom in props or state; the HTML runtime keeps them in the data table and on the
   root, fires a cancelable `ok:gantt:before…` event, applies the change and fires `ok:gantt:…`.
7. **Editing (phase 2).** Pointer: drag a bar to move it, its edges to change start or end, its
   progress handle to set progress; the bar previews through CSSOM and the change is reported on
   release. Keyboard (WCAG 2.1.1 and 2.5.7): Enter starts editing the focused row's bar, arrows
   move it a day, Shift + arrows change its end, Page Up / Page Down change progress, Enter
   commits and Escape cancels. A double click, a double tap or F2 asks the owner to edit the task
   (`onTaskEdit`, `ok:gantt:edit`), the single-pointer path to the same changes (stories compose a
   Dialog with date pickers).
8. **HTML data is a `<table>`.** `table[data-ok-gantt-data]` lists the tasks: rows carry
   `data-ok-task-id`, `data-ok-parent-id`, `data-ok-type`, `data-ok-color`, `data-ok-collapsed`;
   header cells name their field (`data-ok-gantt-field`: `name`, `start`, `end`, `progress`,
   `dependency`, `baseline-start`, `baseline-end`); cells may keep raw values in `data-ok-value`.
   Without JavaScript the table is the Gantt. With it, the runtime builds the treegrid next to the
   table and hides the table (the treegrid is the accessible view). React renders the same table
   from its `tasks`.
9. **Phases**, each a commit with the full test standard: (1) read-only Gantt — scales, zoom,
   bars, summary tasks, milestones, baselines, critical path, tree, dependencies, non-working
   days, today line, selection, tooltips, keyboard; (2) editing by pointer and keyboard; (3) row
   virtualization for large projects and export (SVG, PNG through a canvas, CSV) without a new
   dependency. Undo, split tasks, grouping, sorting and filtering, custom column renderers, a
   context menu, drawing tasks and links by drag, right to left and sub-day scales are deferred
   (roadmap rows).

## Consequences
- One new component family (`Gantt`), additive everywhere else; no new runtime dependency.
- The CDN bundle and the CSS grow (budgets raised with the measured reason).
- Without JavaScript the HTML Gantt is a plain table of tasks.
- A wide timeline on a phone scrolls horizontally inside the Gantt; below 600px the task list
  keeps only the name column.
