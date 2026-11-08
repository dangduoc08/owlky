# ADR-0028: Range pickers — a range model in core, ISO intervals, one range calendar and runtime

**Status:** Accepted (2026-11-08). Extends ADR-0022 (phase 3) and ADR-0026.

## Context
Phase 3 of the pickers (ADR-0022) adds MUI X Pro's range components: DateRangeCalendar, the
DateRangePicker family (responsive, desktop, mobile, static), TimeRangePicker and
DateTimeRangePicker (responsive, desktop, mobile), single and multi input range fields of each
value type, range shortcuts and drag editing of the range's ends. The reference's Range section is
a start / end dialog Minimal builds itself, pointing to MUI X Pro. The owner will use them for
dashboard date-range filters, so shortcuts ("Last 7 days"), the keyboard and touch matter. The
HTML side needs the same markup as React, with values that a form can submit.

## Decision
1. **A range model in core** (`core/src/pickers/range.ts`): a value is `[start, end]` (either
   side may be empty, a partly typed side is an invalid date). Pure functions: what a pick does
   (MUI's `calculateRangeChange`, with swapped ends while dragging), the hover / drag preview, each
   day's state as `data-ok-*` attributes (`range-start`, `range-end`, `in-range`, `preview-*`),
   validation (each side's error, then `invalidRange` on both), the shown months, the single input
   field's sections and range shortcuts. `createRangeDragController` reports hover and drag intent
   (pointer events, `elementFromPoint` under a captured pointer, so touch works); keys and presses
   stay with `createCalendarController`.
2. **HTML values are ISO 8601 intervals**, `start/end` with an empty side allowed
   (`2025-05-20/`, `/` = empty): `data-ok-value`, the hidden input of a single input field and
   shortcut chips. Events carry the interval and `validationError: [start, end]`.
3. **Reuse the phase 1–2 anatomy.** The single input range field is the DateField anatomy with
   `data-ok-range`: the format twice, joined by " – ", each section knowing its side (`part`), so
   the `date-field` runtime and React's sectioned field serve it (React extracts the field's
   TextField into a shared internal component, DOM unchanged). The multi input field is a group of
   two DateFields; its runtime only validates the order. The range calendar renders the
   DateCalendar's day grid per month (`data-ok-day-calendar`, `data-ok-picker-day`), so its CSS adds
   only the months and the band. The range picker reuses the date picker's layout, toolbar,
   shortcuts, actions, Popover and Dialog, and the phase 2 clocks.
4. **One range picker runtime** (`date-range-picker`) for every value type, as the date picker
   (ADR-0026): time and date time ranges add Start / End **Tabs** (on every form: one field can't
   tell which end is edited), the desktop digital clock and the mobile analog clock edit the chosen
   end; a date time range pins its one-month calendar to that end (`availableRangePositions`).
5. **Forms follow MUI:** two months in the desktop popover, one in the dialog and inline (unless
   `calendars`); desktop date ranges close on the end pick; time and date time ranges never close
   on a pick and show Cancel / OK; the start's last view moves on to the end.

## Consequences
- The APIs grow additively: new components, `data-ok-range` on fields, `setError` on the
  date-field instance, `part` on format sections, optional month / year callbacks in the calendar
  controller, new `localeText` keys (English and Vietnamese).
- The CDN bundle (about 6.6 kB) and the CSS (about 1 kB) grow: budgets raised with the measured
  size.
- Range time zones, `dateAdapter` and view renderers stay in phase 4 with the rest.
