# ADR-0026: Time pickers — one field and picker anatomy for every value type, clocks as listboxes

**Status:** Accepted (2026-11-08). Extends ADR-0022 (phase 2).

## Context
Phase 2 of the pickers (ADR-0022) adds MUI X's time and date time components: TimeField,
TimeClock, DigitalClock, MultiSectionDigitalClock, TimePicker and DateTimePicker in their
responsive, desktop, mobile and static forms. They share most of the date picker: the sectioned
field, the popover / dialog / inline lifecycle, the toolbar and the action bar. MUI v9 renders
digital clocks on desktop (one list, or one column per view) and the analog clock on touch, with
a toolbar and date / time tabs. The HTML side must show the same markup as React without a style
attribute (strict CSP), and the analog clock must work with a keyboard and a screen reader.

## Decision
1. **One field and one picker anatomy, a value type.** TimeField and DateTimeField render the
   DateField markup; the TimePicker and DateTimePicker families render the DatePicker markup.
   `data-ok-value-type="time" | "date-time"` on the root (absent = a date) sets the ISO text
   (`HH:mm:ss`, `YYYY-MM-DDTHH:mm:ss`), the default format and the validation. The HTML
   `date-field` and `date-picker` runtimes serve every type; no new field or picker runtime.
2. **Time engine in core** (`core/src/pickers/time.ts`): time views, the locale's hour cycle
   (`Intl` `hourCycle`), MUI's default formats, `timeSteps`, time validation (`minTime`,
   `maxTime`, `minDateTime`, `maxDateTime`, `minutesStep`, `shouldDisableTime`, past / future,
   `disableIgnoringDatePartForTimeValidation`), the options of each clock and the analog clock's
   geometry. Controllers report intent: `createTimeClockController` (press, drag, keys) and
   `createDigitalClockController` (roving focus, pick).
3. **The analog clock is a listbox** (MUI): `role=listbox` with `aria-activedescendant`, numbers
   are `role=option`; the face takes pointer presses and drags (`touch-action: none`). Numbers are
   placed by CSS from `data-ok-position` with `sin()` / `cos()` (no style attribute); the
   pointer's angle is the private `--_ok-clock-angle` (React style, HTML CSSOM).
4. **Digital clocks are listboxes of options** with a roving `tabindex`; arrows move focus,
   Enter / Space / a press pick. A multi-section clock is a `role=group` of one listbox per view
   (and AM / PM).
5. **Forms follow MUI v9:** desktop time pickers show a DigitalClock when a day holds at most
   `thresholdToRenderTimeInASingleColumn` options, else a MultiSectionDigitalClock; desktop date
   time pickers show the calendar and the digital clock side by side. Mobile and static forms show
   the toolbar, date / time **Tabs** (the library component) and the analog clock. Time and date
   time pickers never close on a pick by default and show Cancel and OK (Next on mobile date time
   pickers). A responsive picker renders the views of both forms and hides the other form's
   (`hidden`), so the HTML layout can move between the popover and the dialog.
6. **HTML clocks speak times:** clock events carry `HH:mm:ss`; the picker merges the time into
   its value (and the calendar's day into a date time value).

## Consequences
- The field and picker APIs grow additively (`valueType` in the schemas, optional; the date
  markup is unchanged: phase 1 snippets regenerate identically).
- `PickerSelectionState` gains `"shallow"` (a clock drag in progress).
- The CDN bundle and the CSS grow (budgets raised with the measured size).
- Time zones, `dateAdapter` and view renderers stay in phase 4; range pickers in phase 3.
