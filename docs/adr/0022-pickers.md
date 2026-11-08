# ADR-0022: Pickers — one picker engine in core, every MUI X tier, built in four phases

**Status:** Accepted (2026-11-08).

## Context
The reference's "Date pickers" page shows MUI X Date and Time Pickers (v9): date, time and date
time pickers in their desktop, mobile, static and field forms, and a date range dialog that
Minimal builds itself (the page points to MUI X Pro for real range pickers). The owner asked for
every feature, Community and Pro alike (2026-11-08). MUI X builds on a date library adapter
(Day.js, date-fns, Luxon, Moment); Owlky has no runtime dependency, and must keep its contract:
React and framework-free HTML with the same `data-ok-*` markup, behavior written once in core,
native first, WCAG 2.2 AA.

## Decision
1. **One picker engine in core** (`core/src/pickers/`): pure functions for dates (calendar math
   in local time, ISO 8601 in and out), formats split into sections, locale data from `Intl`,
   validation, the month grid and the year / month lists; controllers that report intent: the
   sectioned field (keys, typing, paste), the calendar grid and the month / year radio groups.
   React keeps the state in props and hooks; the HTML runtime keeps it in the DOM.
2. **No date library.** Values are native `Date` objects (React) and ISO strings (HTML). In
   phase 4, React's `LocalizationProvider` takes a `dateAdapter` that converts the consumer's date
   objects to and from `Date` (the components become generic over the date type then); adapters
   for Day.js, date-fns, Luxon and Moment are factories that receive the consumer's library
   (`createDayjsAdapter(dayjs)`), so Owlky imports none of them. Temporal isn't in the browser
   baseline (Safari 17).
3. **HTML values are ISO 8601** (`2025-05-25`, `09:30:00`, `2025-05-25T09:30`). A hidden
   `input[name]` carries the value for forms.
4. **The field is MUI's accessible DOM**, the reference's: a TextField whose input is a
   `role=group` of `role=spinbutton` sections (`contenteditable`, so phones show a keypad).
   The field is one tab stop; arrows move between sections. Without JavaScript the field shows
   its value and the hidden input submits it, but editing needs the runtime.
5. **Overlays are existing components:** desktop pickers open a Popover, mobile pickers a Dialog,
   static pickers render inline. Responsive pickers pick one with `desktopModeMediaQuery`
   (default `(pointer: fine)`) when they open; server rendering and snippets render the desktop
   form.
6. **The calendar is an ARIA grid of buttons** (`role=gridcell`); month and year views are radio
   groups (MUI). Snippets carry the first month; the HTML runtime builds other months with
   `createElement`.
7. **Every tier is free**: no license key and no watermark (as ADR-0020).
8. **Four phases**, each a normal `/component` review with the full test standard:

   | Phase | Scope (MUI X tier) |
   |---|---|
   | 1 | Engine, `LocalizationProvider` (locale, `localeText` en / vi); DateField, DateCalendar (day / month / year views), MonthCalendar, YearCalendar, DatePicker (responsive, desktop, mobile, static); validation, toolbar, action bar, shortcuts, week numbers, fixed week count, days outside the month, loading, landscape layout, clearable fields (Community) |
   | 2 | TimeField, TimeClock, DigitalClock, MultiSectionDigitalClock, TimePicker, DateTimeField, DateTimePicker (each responsive, desktop, mobile, static, with tabs for date time); time validation and steps (Community) |
   | 3 | DateRangeCalendar, DateRangePicker, single- and multi-input range fields, TimeRangePicker, DateTimeRangePicker, range shortcuts, drag editing (Pro) |
   | 4 | Time zones (UTC and IANA through `Intl`), `dateAdapter` (generic date types) and adapters for Day.js / date-fns / Luxon / Moment, other calendar systems through adapters, locale packs, right-to-left layout, view renderers and layout customization |

## Consequences
- Every phase ships React and HTML together; later phases extend the anatomy additively.
- Callbacks follow ADR-0015: `onOpen` / `onClose` / `onCancel` become `onOpenChange(open, reason)`;
  `slotProps` options the reference uses are flattened (`actions`, `shortcuts`, `clearable`, the
  TextField props).
- Functions (`shouldDisableDate`, `dayOfWeekFormatter`) are React props and HTML instance methods.
- The CDN bundle and the CSS grow with each phase: budgets are raised with a measured reason.
- Data grid filter values for `date` columns use the DatePicker from phase 1, `dateTime` columns
  the DateTimePicker from phase 2.
