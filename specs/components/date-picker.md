# Date pickers

Reference: Minimal UI kit "Date pickers" page (MUI X Date and Time Pickers), sections Date (Basic,
Playground, Static mode), Time and Date & Time (Basic, Views playground, Static mode); section
Range comes in phase 3 (ADR-0022) (content only). Upstream: MUI X `DatePicker`,
`DesktopDatePicker`, `MobileDatePicker`, `StaticDatePicker`, `DateField`, `DateCalendar`,
`MonthCalendar`, `YearCalendar`, `LocalizationProvider`; `TimeField`, `TimeClock`, `DigitalClock`,
`MultiSectionDigitalClock`, `TimePicker` (desktop, mobile, static), `DateTimeField`,
`DateTimePicker` (desktop, mobile, static) (v9, ADR-0015). Created with `/component` (phase 1 of
4); phase 2 (time and date time, ADR-0026) with `/component` Update.
Reference URL: https://minimals.cc/components/mui/date-pickers

## Purpose
Type a date, a time or both in a sectioned field, or pick them from a calendar and clocks: in a
popover (pointer devices), a dialog (touch) or inline. One engine in core (`core/src/pickers/`):
dates in local time, ISO 8601, formats split into sections, locale data from `Intl`, validation,
the month grid, the time model (`time.ts`), and controllers that report intent
(`createFieldController`, `createCalendarController`, `createTimeClockController`,
`createDigitalClockController`). React keeps state in props / hooks; the HTML runtimes
(`date-field`, `date-calendar`, `month-calendar`, `year-calendar`, `time-clock`, `digital-clock`,
`multi-section-digital-clock`, `date-picker`) keep it in the DOM. Every MUI X tier is free
(ADR-0022). Time and date time fields and pickers are the same anatomy with
`data-ok-value-type="time" | "date-time"` (ADR-0026).

## Anatomy
```
div[data-ok-date-picker][data-ok-picker-variant][data-ok-orientation][data-ok-open]?
    [data-ok-actions]?[data-ok-close-on-select]?[data-ok-desktop-mode-media-query]?[data-ok-locale]?
  div[data-ok-text-field][data-ok-date-field][data-ok-format][data-ok-format-density][data-ok-value]?
      [data-ok-shrink]?[data-ok-error]?[data-ok-clearable]?[data-ok-read-only]?
      [data-ok-min-date]?[data-ok-max-date]?[data-ok-disable-past]?[data-ok-disable-future]?   (TextField; not static)
    label[data-ok-text-field-label][id=<id>-label]?
    div[data-ok-text-field-control]
      div[id][role=group][data-ok-text-field-input][data-ok-date-field-sections][aria-labelledby]
          [aria-invalid]?[data-ok-all-selected]?
        span[data-ok-date-field-section]
          span[data-ok-date-field-separator="start"]?
          span[data-ok-date-field-content][data-ok-section][role=spinbutton][aria-label][aria-valuenow]?
              [aria-valuemin][aria-valuemax][aria-valuetext][tabindex][contenteditable][inputmode]…
          span[data-ok-date-field-separator]?
      input[type=hidden][data-ok-date-field-input][name]?[value=ISO][disabled]?
      span[data-ok-text-field-adornment=end]?
        button[data-ok-icon-button][data-ok-date-field-clear][hidden]?            (clearable)
        button[data-ok-icon-button][data-ok-date-picker-open][aria-label][aria-haspopup=dialog]   (pickers)
      fieldset[data-ok-text-field-outline] (outlined)
  div[popover=manual][data-ok-popover][data-ok-placement=bottom-start][data-ok-disable-auto-focus]
      [role=dialog][aria-label][data-ok-date-picker-paper]                         (desktop, responsive)
  dialog[data-ok-dialog][data-ok-max-width=xs][aria-label][data-ok-date-picker-dialog]
    div[data-ok-dialog-paper]                                                     (mobile, responsive)
  div[data-ok-picker-layout][data-ok-orientation]                                 (in the popover, the dialog paper, or inline)
    div[data-ok-picker-toolbar][hidden]? › span[data-ok-picker-toolbar-overline][id] + span[data-ok-picker-toolbar-title]
    ul[data-ok-picker-shortcuts][aria-label]? › li › span[data-ok-chip][data-ok-picker-shortcut][data-ok-value]? › button[data-ok-chip-action]
    div[data-ok-picker-content]
      div[id][data-ok-date-calendar][data-ok-view][data-ok-views][data-ok-month][data-ok-value]?…
        div[data-ok-date-calendar-header]
          div[data-ok-date-calendar-label][id=<id>-label][aria-live=polite]
          button[data-ok-icon-button][data-ok-date-calendar-switch][aria-label]?   (views include year)
          div[data-ok-date-calendar-nav] › button[data-ok-date-calendar-prev] + button[data-ok-date-calendar-next]   (day view)
        div[role=grid][data-ok-day-calendar][aria-labelledby]                      (day view)
          div[role=row][data-ok-day-calendar-header] › span[role=columnheader][aria-label]…
          div[role=rowgroup] › div[role=row][aria-rowindex]
            span[role=rowheader][aria-label]?                                     (displayWeekNumber)
            button[role=gridcell][data-ok-picker-day][data-ok-date][aria-colindex][aria-selected]
                [aria-current=date]?[data-ok-today]?[data-ok-outside]?[disabled]?[tabindex]
            | span[role=gridcell][data-ok-day-filler]                             (outside days, hidden)
          | div[data-ok-date-calendar-loading]                                    (loading)
        | div[role=radiogroup][data-ok-month-calendar][data-ok-year] › button[role=radio][data-ok-picker-month][data-ok-value][aria-checked]
        | div[role=radiogroup][data-ok-year-calendar] › button[role=radio][data-ok-picker-year][data-ok-value][aria-checked]
    div[data-ok-picker-actions][hidden]? › button[data-ok-button][data-ok-picker-action][hidden]?…
```
MonthCalendar / YearCalendar on their own are the radio group above as the root. React renders
`data-ok-runtime="off"` on every root.

Time views (ADR-0026) — in `div[data-ok-picker-content]`, or on their own:
```
div[id][data-ok-time-clock][data-ok-ampm][data-ok-view][data-ok-views][data-ok-value]?[data-ok-ampm-in-clock]?
    [data-ok-minutes-step]?[data-ok-min-time]?[data-ok-max-time]?[data-ok-read-only]?[data-ok-disabled]?[hidden]?
  div[data-ok-time-clock-dial]
    span[data-ok-time-clock-pin]
    span[data-ok-time-clock-pointer][data-ok-inner]?[data-ok-between]?[hidden]?          (--_ok-clock-angle)
    div[role=listbox][data-ok-time-clock-options][tabindex][aria-label][aria-activedescendant]?
      span[role=option][id][data-ok-time-clock-number][data-ok-position=0…11][data-ok-inner]?[data-ok-value]
          [aria-label][aria-selected]?[aria-disabled]?
  div[data-ok-time-clock-meridiems]? › button[data-ok-time-clock-meridiem=am|pm][aria-pressed]   (ampmInClock)
  div[data-ok-time-clock-nav] › button[data-ok-icon-button][data-ok-time-clock-prev] + button[…-next]
div[data-ok-digital-clock][data-ok-ampm][data-ok-time-step][data-ok-value]?[data-ok-skip-disabled]?…
  ul[role=listbox][data-ok-digital-clock-list][aria-label]
    li[role=option][data-ok-digital-clock-item][data-ok-value=HH:mm:ss][tabindex][aria-selected][aria-disabled]?
div[role=group][data-ok-multi-section-digital-clock][data-ok-ampm][data-ok-views][data-ok-time-steps][data-ok-value]?…
  ul[role=listbox][data-ok-digital-clock-section=hours|minutes|seconds|meridiem][aria-label]
    li[role=option][data-ok-digital-clock-item][data-ok-value][tabindex][aria-selected][aria-disabled]?
```
Time and date time pickers: `div[data-ok-date-picker][data-ok-value-type][data-ok-open-to]?` with a
field `[data-ok-value-type]`; the toolbar is `span[data-ok-picker-toolbar-overline]` +
`div[data-ok-picker-toolbar-content] › div[data-ok-picker-toolbar-date]? ›
button[data-ok-picker-toolbar-button][data-ok-view=year|day…][data-ok-selected]?` +
`div[data-ok-picker-toolbar-time] › span[data-ok-picker-toolbar-part] › (span[data-ok-picker-toolbar-separator])?
button[data-ok-picker-toolbar-button][data-ok-view=hours|minutes|seconds]` +
`div[data-ok-picker-toolbar-ampm]? › button[data-ok-picker-toolbar-meridiem=am|pm][aria-pressed]`;
date time pickers add `div[data-ok-tabs][data-ok-picker-tabs]` (the Tabs component, `fullWidth`,
icon tabs `value="date" | "time"`). The content holds the calendar (date views), the desktop
digital clock (`DigitalClock` or `MultiSectionDigitalClock`, desktop and responsive) and the
`TimeClock` (mobile, static and responsive); the views of the other form are `hidden`.

## Options
<!-- options:date-picker (generated by `pnpm specs:options` from the schema in packages/core/src/anatomy/anatomy.ts) -->
Root: `data-ok-date-picker`. Unknown values fall back to the default.

| React | HTML | Kind | Values | Default | Description |
|---|---|---|---|---|---|
| `pickerVariant` | `data-ok-picker-variant="…"` | style | `responsive` `desktop` `mobile` `static` | `responsive` | `responsive` (desktop or mobile by `desktopModeMediaQuery`), `desktop` (popover), `mobile` (dialog), `static` (inline). React: the component (`DatePicker`, `DesktopDatePicker`, `MobileDatePicker`, `StaticDatePicker`). |
| `orientation` | `data-ok-orientation="…"` | style | `portrait` `landscape` | `portrait` | `landscape` puts the toolbar beside the calendar (mobile and static). |
| `closeOnSelect` | `data-ok-close-on-select="false"` turns it off | behavior | boolean | on | Picking a day closes the picker. Default: on for desktop, off for mobile (absent attribute). |
| `keepOpenDuringFieldFocus` | `data-ok-keep-open-during-field-focus` | flag | boolean | off | Desktop: the popover stays open while the field has focus (typing doesn't close it). |
| `valueType` | `data-ok-value-type="…"` | style | `date` `time` `date-time` | — | What the value holds (ADR-0026): `time` (TimeField, TimePicker family: ISO `HH:mm:ss`), `date-time` (DateTimeField, DateTimePicker family: ISO `YYYY-MM-DDTHH:mm:ss`); absent = a date. React: the component. |
| `open` | `data-ok-open` · event `ok:date-picker:open` | state | — | — | Open state (`open` / `onOpenChange`). |
<!-- /options:date-picker -->

<!-- options:date-calendar (generated by `pnpm specs:options` from the schema in packages/core/src/anatomy/anatomy.ts) -->
Root: `data-ok-date-calendar`. Unknown values fall back to the default.

| React | HTML | Kind | Values | Default | Description |
|---|---|---|---|---|---|
| `openTo` | `data-ok-open-to="…"` | style | `year` `month` `day` | — | The view shown first (one of `views`). |
| `disablePast` | `data-ok-disable-past` | flag | boolean | off | Days before today can't be picked. |
| `disableFuture` | `data-ok-disable-future` | flag | boolean | off | Days after today can't be picked. |
| `displayWeekNumber` | `data-ok-display-week-number` | flag | boolean | off | A week number column. |
| `fixedWeekNumber` | `data-ok-fixed-week-number="…"` | number | number | — | Always show this many weeks (6 keeps the height the same every month). |
| `showDaysOutsideCurrentMonth` | `data-ok-show-days-outside-current-month` | flag | boolean | off | Days of the previous and next months fill the first and last weeks. |
| `disableHighlightToday` | `data-ok-disable-highlight-today` | flag | boolean | off | No ring around today. |
| `monthsPerRow` | `data-ok-months-per-row="…"` | style | `3` `4` | `3` | Months per row in the month view. |
| `yearsPerRow` | `data-ok-years-per-row="…"` | style | `3` `4` | `4` | Years per row in the year view. |
| `yearsOrder` | `data-ok-years-order="…"` | style | `asc` `desc` | `asc` | Order of the year view. |
| `readOnly` | `data-ok-read-only` | flag | boolean | off | Days can be browsed but not picked. |
| `loading` | `data-ok-loading` | flag | boolean | off | Shows the loading text instead of the days (data on its way). |
| `reduceAnimations` | `data-ok-reduce-animations` | flag | boolean | off | No month or view transitions. |
| `value` | `aria-selected` · event `ok:date-calendar:change` | state | — | — | Selected day (`value` / `defaultValue`; HTML `data-ok-value`). |
<!-- /options:date-calendar -->

<!-- options:date-field (generated by `pnpm specs:options` from the schema in packages/core/src/anatomy/anatomy.ts) -->
Root: `data-ok-date-field`. Unknown values fall back to the default.

| React | HTML | Kind | Values | Default | Description |
|---|---|---|---|---|---|
| `formatDensity` | `data-ok-format-density="…"` | style | `dense` `spacious` | `dense` | `spacious` puts spaces around the separators (`05 / 25 / 2025`). |
| `clearable` | `data-ok-clearable` | flag | boolean | off | A clear button at the end of the field. |
| `readOnly` | `data-ok-read-only` | flag | boolean | off | The value can't be changed (it can still be focused and copied). |
| `valueType` | `data-ok-value-type="…"` | style | `date` `time` `date-time` | — | What the value holds (ADR-0026): `time` (TimeField, TimePicker family: ISO `HH:mm:ss`), `date-time` (DateTimeField, DateTimePicker family: ISO `YYYY-MM-DDTHH:mm:ss`); absent = a date. React: the component. |
| `value` | `data-ok-value` · event `ok:date-field:change` | state | — | — | Value as ISO 8601 (`value` / `defaultValue`). |
<!-- /options:date-field -->

<!-- options:time-clock (generated by `pnpm specs:options` from the schema in packages/core/src/anatomy/anatomy.ts) -->
Root: `data-ok-time-clock`. Unknown values fall back to the default.

| React | HTML | Kind | Values | Default | Description |
|---|---|---|---|---|---|
| `ampm` | `data-ok-ampm="false"` turns it off | behavior | boolean | on | 12-hour clock with AM / PM. Default: from the locale (en-US: on, vi-VN: off). |
| `ampmInClock` | `data-ok-ampm-in-clock` | flag | boolean | off | AM / PM buttons on the clock (12-hour clocks). |
| `minutesStep` | `data-ok-minutes-step="…"` | number | number | `1` | Minutes must be a multiple of this. |
| `disablePast` | `data-ok-disable-past` | flag | boolean | off | Times before now can't be picked. |
| `disableFuture` | `data-ok-disable-future` | flag | boolean | off | Times after now can't be picked. |
| `readOnly` | `data-ok-read-only` | flag | boolean | off | Times can be browsed but not picked. |
| `value` | `aria-selected` · event `ok:time-clock:change` | state | — | — | Selected time (`value` / `defaultValue`; HTML `data-ok-value`). |
<!-- /options:time-clock -->

<!-- options:digital-clock (generated by `pnpm specs:options` from the schema in packages/core/src/anatomy/anatomy.ts) -->
Root: `data-ok-digital-clock`. Unknown values fall back to the default.

| React | HTML | Kind | Values | Default | Description |
|---|---|---|---|---|---|
| `ampm` | `data-ok-ampm="false"` turns it off | behavior | boolean | on | 12-hour clock with AM / PM. Default: from the locale (en-US: on, vi-VN: off). |
| `timeStep` | `data-ok-time-step="…"` | number | number | `30` | Minutes between two options. |
| `skipDisabled` | `data-ok-skip-disabled` | flag | boolean | off | Options that can't be picked are left out. |
| `minutesStep` | `data-ok-minutes-step="…"` | number | number | `1` | Minutes must be a multiple of this. |
| `disablePast` | `data-ok-disable-past` | flag | boolean | off | Times before now can't be picked. |
| `disableFuture` | `data-ok-disable-future` | flag | boolean | off | Times after now can't be picked. |
| `readOnly` | `data-ok-read-only` | flag | boolean | off | Times can be browsed but not picked. |
| `value` | `aria-selected` · event `ok:digital-clock:change` | state | — | — | Selected time (`value` / `defaultValue`; HTML `data-ok-value`). |
<!-- /options:digital-clock -->

<!-- options:multi-section-digital-clock (generated by `pnpm specs:options` from the schema in packages/core/src/anatomy/anatomy.ts) -->
Root: `data-ok-multi-section-digital-clock`. Unknown values fall back to the default.

| React | HTML | Kind | Values | Default | Description |
|---|---|---|---|---|---|
| `ampm` | `data-ok-ampm="false"` turns it off | behavior | boolean | on | 12-hour clock with AM / PM. Default: from the locale (en-US: on, vi-VN: off). |
| `skipDisabled` | `data-ok-skip-disabled` | flag | boolean | off | Options that can't be picked are left out. |
| `minutesStep` | `data-ok-minutes-step="…"` | number | number | `1` | Minutes must be a multiple of this. |
| `disablePast` | `data-ok-disable-past` | flag | boolean | off | Times before now can't be picked. |
| `disableFuture` | `data-ok-disable-future` | flag | boolean | off | Times after now can't be picked. |
| `readOnly` | `data-ok-read-only` | flag | boolean | off | Times can be browsed but not picked. |
| `value` | `aria-selected` · event `ok:multi-section-digital-clock:change` | state | — | — | Selected time (`value` / `defaultValue`; HTML `data-ok-value`). |
<!-- /options:multi-section-digital-clock -->

Time attributes (strings, ADR-0026): `data-ok-value` on clocks (`HH:mm:ss`), `data-ok-min-time`,
`data-ok-max-time` (ISO times), `data-ok-min-date-time`, `data-ok-max-date-time` (ISO date
times), `data-ok-disable-ignoring-date-part-for-time-validation`, `data-ok-views` (`hours minutes
seconds`), `data-ok-view`, `data-ok-time-steps` (`"1 5 5"`: hours minutes seconds),
`data-ok-open-to` (time and date time pickers). Fields and pickers also take `data-ok-minutes-step`.

Other attributes (strings, not in the schema): `data-ok-value`, `data-ok-min-date`,
`data-ok-max-date` (ISO 8601), `data-ok-format` (Day.js tokens), `data-ok-views` (`year month
day`), `data-ok-month` (`YYYY-MM`, the shown month), `data-ok-actions` (`clear today cancel
accept nextOrAccept`), `data-ok-desktop-mode-media-query`, `data-ok-locale` (on the element or an
ancestor), `data-ok-disabled` (calendar). Invalid values fall back to the default.

### API mapping (MUI X, ADR-0015)
- **Kept:** `value` / `defaultValue`, `onChange` (`(value, { validationError })`), `onAccept`,
  `onError`, `open`, `views`, `openTo`, `view` / `onViewChange`, `format`, `formatDensity`,
  `minDate`, `maxDate`, `disablePast`, `disableFuture`, `shouldDisableDate` / `Month` / `Year`,
  `closeOnSelect`, `desktopModeMediaQuery`, `keepOpenDuringFieldFocus`, `reduceAnimations`,
  `displayWeekNumber`, `fixedWeekNumber`, `showDaysOutsideCurrentMonth`,
  `disableHighlightToday`, `dayOfWeekFormatter`, `monthsPerRow`, `yearsPerRow`, `yearsOrder`,
  `orientation`, `loading`, `renderLoading`, `onMonthChange`, `onYearChange`, `referenceDate`,
  `autoFocus`, `selectedSections` / `onSelectedSectionsChange` (section index), `readOnly`,
  `disabled`, `label`, `name`, `inputRef` (the hidden input), `localeText`;
  `LocalizationProvider` `adapterLocale`, `localeText`.
- **Renamed:** `onOpen` / `onClose` / `onCancel` → `onOpenChange(open, reason)` (reasons `button`,
  `escape`, `clickaway`, `accept`, `cancel`, `select`, `clear`, `today`, `shortcut`, `api`);
  `slotProps.actionBar.actions` → `actions`; `slotProps.shortcuts.items` → `shortcuts`;
  `slotProps.field.clearable` / `onClear` → `clearable` / `onClear`; `slotProps.textField` →
  the TextField props (`helperText`, `error`, `variant`, `size`, `fullWidth`, `required`).
- **Beyond MUI:** `today` (React: pins "today" for demos and tests); `aria-current="date"` on
  today; HTML `data-ok-locale`; a hidden ISO input for forms.
- **Kept (phase 2):** `ampm`, `ampmInClock`, `minTime`, `maxTime`, `minDateTime`,
  `maxDateTime`, `minutesStep`, `shouldDisableTime`, `disableIgnoringDatePartForTimeValidation`,
  `timeSteps`, `timeStep` (DigitalClock), `thresholdToRenderTimeInASingleColumn`, `skipDisabled`,
  time `views` / `openTo` / `view` / `onViewChange`; `onChange(value, selectionState)` of the
  clocks (`"shallow"` while dragging, `"partial"`, `"finish"`); `localeText` keys
  `timePickerToolbarTitle`, `dateTimePickerToolbarTitle`, `openTimePickerDialogue`,
  `openPreviousView`, `openNextView`, `clockLabelText`, `hours/minutes/secondsClockNumberText`,
  `selectViewText`, `dateTableLabel`, `timeTableLabel`.
- **Defaults (MUI v9, as the reference shows):** time and date time pickers don't close on a
  pick; their action bar is Cancel + OK (mobile and static date time: Cancel + Next / OK).
- **Deferred:** `timezone`, `dateAdapter` / adapters, `viewRenderers`, layout slots (phase 4);
  `slotProps.tabs.hidden` (the tabs always show in the mobile and static date time forms).
- **Not applicable:** `slots`, other `slotProps`, `sx`, `className` of parts, transitions,
  `disableOpenPicker` (deprecated), `enableAccessibleFieldDOMStructure` (always on).

## Layout and tokens
Field: a TextField (outlined 56px); sections are `inline-flex`, tabular numbers, the focused one
on `rgb(primary / 0.24)`; empty sections show the placeholder in `--ok-text-disabled`; all
sections hide while the label rests in the box. Calendar: 320px (`--ok-spacing * 80`) × 336px,
header 12px / 4px margins, 24px / 12px padding, label `--ok-font-size-xl` medium; days 36px
(`--ok-spacing * 9`) with 2px gaps (rows 40px), six rows high (240px); weekday headers caption in
`--ok-text-secondary`; days caption `--ok-text-primary` (outside days `--ok-text-secondary`);
selected `--ok-palette-primary-main` / contrast text, medium weight, hover / focus
`--ok-palette-primary-dark`; today a 1px `--ok-text-secondary` ring; hover `--ok-action-hover`;
focus ring 2px primary. Month / year buttons 72 × 36px, `--ok-radius-full`, semibold
`--ok-font-size-xl`; year view scrolls at 280px. Popover paper: `--ok-radius-lg`, opaque paper,
no padding. Toolbar: 16px / 24px padding, overline + h4. Actions: 16px padding, 12px gap.
Time clock (ADR-0026): a 320px view, 220px face (`--ok-spacing * 55`) on `--ok-bg-neutral`,
numbers 36px on a 91px ring (24-hour clocks: an inner ring at 65 %, body2), a 6px pin and a 2px
pointer in `--ok-palette-primary-main` with a 36px thumb under the selected number (a 12px ring
between two numbers), arrows 12px from the top right. Digital clocks: lists scroll at 232px
(`--ok-spacing * 58`; 336px beside a calendar), columns 56px with `--ok-divider` between them,
options 48 × 38px pills (8px padding, `--ok-radius-sm`, body2), the selected one primary with
semibold contrast text. Time toolbar: 16px padding, h3 time buttons and separators in
`--ok-text-secondary` (the open view in `--ok-text-primary`), subtitle1 AM / PM; date time
toolbars add the year (subtitle1) and the day (h4). A divider sits above the action bar when a
digital clock shows.

## Responsive behavior
Mobile first. Below 600px the layout is one column (toolbar, shortcuts as a wrapping row,
calendar, actions); from 600px shortcuts sit in a column beside the calendar, and
`orientation="landscape"` puts the toolbar on the left. Responsive pickers pick desktop or
mobile when they open (`(pointer: fine)` by default). The dialog paper never exceeds the screen
minus 32px; the calendar keeps 320px (fits 375px screens). Time pickers: from 600px a landscape
toolbar stacks the date, the time and a row of AM / PM; date time pickers put the tabs above the
content beside it. The desktop date time popover is the calendar plus the clock columns (about
490px wide).

## States
`data-ok-shrink` (field has text), `data-ok-error` / `aria-invalid` (validation),
`data-ok-all-selected` (Ctrl / ⌘ + A), `data-ok-open` (picker), `aria-selected`,
`aria-checked`, `data-ok-today`, `data-ok-outside`, `disabled`, `:focus-visible`. Clocks:
`aria-selected` / `aria-disabled` on options, `aria-pressed` on AM / PM, `data-ok-selected` on the
toolbar's open view, `data-ok-inner` / `data-ok-between` on the pointer, `data-ok-view`.

## Behavior
- **Field:** sections from the format; ←/→ move, ↑/↓ ±1 (empty: today's part), Page ±5, Home /
  End min / max, digits and letters type (a complete section moves on; queries last 5s), Backspace
  / Delete empty the section (or all after select-all), paste fills every section when it matches
  the format. Partly filled = an invalid date (`validationError: "invalidDate"`). The browser never
  edits the text (`beforeinput` is canceled; IME text is restored).
- **Calendar:** picking a day reports `"finish"`; picking a year or month reports `"partial"` and
  moves to the next view (the value keeps its day when the month has it, else the closest enabled
  day). The header switch toggles the year view; arrows step months (disabled past the limits).
- **Pickers:** the open button opens; desktop closes on a pick (`closeOnSelect`), mobile and static
  don't. Dismiss (Escape, outside press, focus in the field unless `keepOpenDuringFieldFocus`):
  desktop accepts, mobile restores the value from opening. Actions: accept, cancel (restore),
  clear, today, nextOrAccept. Shortcuts set, accept and close.
- **Time clock:** a press or a drag picks the number under the pointer (`"shallow"` while
  dragging); the release finishes the view and moves to the next one (`"partial"`), the last view
  reports `"finish"`. Minutes and seconds snap to `minutesStep`; 24-hour clocks pick the inner
  ring under 74 / 220 of the face. Numbers outside the limits are `aria-disabled` and skipped.
- **Digital clocks:** a pick in a column moves focus to the next column; the last column (or the
  one list) reports `"finish"`. Lists scroll their selected option to the top when they appear.
- **Time and date time pickers:** desktop shows a DigitalClock when a day holds at most
  `thresholdToRenderTimeInASingleColumn` options (`24 × 60 / (hours step × minutes step)`, views
  hours and minutes only), else a MultiSectionDigitalClock (plus AM / PM); desktop date time shows
  the calendar beside the columns, and a picked day keeps the time. Mobile and static show the
  toolbar (its time buttons open their view, AM / PM change the meridiem) and the TimeClock; date
  time adds the date / time tabs and moves to the hours after the day. They don't close on a pick
  unless `closeOnSelect`.

## Keyboard
| Key | Field | Calendar |
|---|---|---|
| ← / → | Previous / next section | Previous / next day |
| ↑ / ↓ | ±1 | Same day of the previous / next week |
| Page Up / Down | ±5 | Previous / next month (Shift: year) |
| Home / End | Smallest / largest value | First / last day of the week |
| Digits / letters | Type | — |
| Backspace / Delete | Empty the section (all after Ctrl / ⌘ + A) | — |
| Enter / Space | — | Pick |
| Escape | — | Close the picker |

| Key | Time clock (listbox) | Digital clocks |
|---|---|---|
| ↑ / ↓ | ±1 (minutes: ±`minutesStep`), skipping disabled numbers | Previous / next option (wraps) |
| Page Up / Down | ±5 | 5 options up / down |
| Home / End | Smallest / largest number | First / last option |
| Enter | Finish the view (next view) | Pick |
| Space | — | Pick |

## Accessibility
Sections are spin buttons named by their part ("Month"), valued as text ("May"); the group is
named by the label and marked `aria-invalid`. The open button names the selected date. The grid is
named by its month; today has `aria-current="date"`; disabled days are `disabled`. Popover and
dialog are named "Select date"; focus goes to the current day on open and back to the button on
close. Brand-colored selections are exempt from `color-contrast` only (ADR-0014). The time clock
is a listbox named "Select hours. Selected time is 09:30 AM" whose options are named "9 hours";
focus stays on the listbox (`aria-activedescendant`). Digital clock columns are listboxes named
"Select hours"; the multi-section clock is a named group. Time pickers' open button names the
time ("Choose time, selected time is 09:30 AM"); dialogs are named "Select time" / "Select date &
time"; the date time tabs are named "pick date" / "pick time".

## Events / API
HTML: `ok:date-picker:change` (`{ value, validationError }`), `:accept` (`{ value }`), `:open` /
`:close` (`{ reason }`); `ok:date-field:change` (cancelable), `:clear`; `ok:date-calendar:change`
(cancelable, `{ value, selectionState }`), `:viewchange`, `:monthchange`, `:yearchange`;
`ok:month-calendar:change`, `ok:year-calendar:change` (cancelable). Instances: date-picker `{ value,
setValue, isOpen, open, close, setShortcuts, setShouldDisableDate / Month / Year, setLocaleText }`;
date-field `{ value, validationError, setValue, focus, setShouldDisable…, setLocaleText }`;
date-calendar `{ value, setValue, view, setView, month, focus, setShouldDisable…,
setDayOfWeekFormatter, setLocaleText }`. React: callbacks above.
Phase 2: `ok:time-clock:change` (cancelable, `{ value: "HH:mm:ss", selectionState }`),
`:viewchange` (`{ view }`); `ok:digital-clock:change`, `ok:multi-section-digital-clock:change`
(cancelable, `{ value, selectionState }`). Instances: time-clock `{ value, setValue, view,
setView, setShouldDisableTime, setLocaleText }`; digital clocks `{ value, setValue,
setShouldDisableTime, setLocaleText }`; date-field and date-picker add `setShouldDisableTime`.
Values are ISO by type (`HH:mm:ss`, `YYYY-MM-DDTHH:mm:ss`).

## Parity notes
React renders `data-ok-runtime="off"`. The HTML runtime rebuilds other months with DOM methods and
patches the same month in place; snippets are generated from the React examples. A responsive
picker renders the mobile actions and toolbar hidden while it is in its desktop form; responsive
time and date time pickers also render both forms' views (digital clock, tabs, time clock) and
hide the other form's. The clock pointer's angle is a private property (parity ignores `style`).
