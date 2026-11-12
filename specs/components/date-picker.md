# Date pickers

Reference: Minimal UI kit "Date pickers" page (MUI X Date and Time Pickers), sections Date (Basic,
Playground, Static mode), Time and Date & Time (Basic, Views playground, Static mode) and Range
(Input, Calendar: a start / end dialog the reference builds itself and points to MUI X Pro for)
(content only). Upstream: MUI X `DatePicker`,
`DesktopDatePicker`, `MobileDatePicker`, `StaticDatePicker`, `DateField`, `DateCalendar`,
`MonthCalendar`, `YearCalendar`, `LocalizationProvider`; `TimeField`, `TimeClock`, `DigitalClock`,
`MultiSectionDigitalClock`, `TimePicker` (desktop, mobile, static), `DateTimeField`,
`DateTimePicker` (desktop, mobile, static); Pro: `DateRangeCalendar`, `DateRangePicker` (desktop,
mobile, static), `TimeRangePicker`, `DateTimeRangePicker` (desktop, mobile), the single and multi
input range fields of each value type (v9, ADR-0015). Created with `/component` (phase 1 of 4);
phase 2 (time and date time, ADR-0026), phase 3 (ranges, ADR-0028) and phase 4 (time zones, date
adapters, calendar systems, locale packs, right to left, slots and view renderers, ADR-0030) with
`/component` Update. Complete: every MUI X Community and Pro feature.
Reference URL: https://minimals.cc/components/mui/date-pickers

## Purpose
Type a date, a time or both in a sectioned field, or pick them from a calendar and clocks: in a
popover (pointer devices), a dialog (touch) or inline. One engine in core (`core/src/pickers/`):
dates in local time, ISO 8601, formats split into sections, locale data from `Intl`, validation,
the month grid, the time model (`time.ts`), and controllers that report intent
(`createFieldController`, `createCalendarController`, `createTimeClockController`,
`createDigitalClockController`, `createRangeDragController`; the range model in `range.ts`). React
keeps state in props / hooks; the HTML runtimes (`date-field`, `date-calendar`, `month-calendar`,
`year-calendar`, `time-clock`, `digital-clock`, `multi-section-digital-clock`, `date-picker`,
`date-range-calendar`, `multi-input-range-field`, `date-range-picker`) keep it in the DOM. Range
values are `[start, end]` pairs (React) and ISO 8601 intervals `start/end` (HTML, ADR-0028). Every MUI X tier is free
(ADR-0022). Time and date time fields and pickers are the same anatomy with
`data-ok-value-type="time" | "date-time"` (ADR-0026).

## Anatomy
```
div[data-ok-date-picker][data-ok-picker-variant][data-ok-orientation][data-ok-open]?[data-ok-display-static-wrapper-as]? (static)
    [data-ok-actions]?[data-ok-close-on-select]?[data-ok-desktop-mode-media-query]?[data-ok-locale]?
  div[data-ok-text-field][data-ok-date-field][data-ok-format][data-ok-format-density][data-ok-value]?
      [data-ok-shrink]?[data-ok-error]?[data-ok-clearable]?[data-ok-read-only]?[data-ok-date-separator]? (range)
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
    div[data-ok-dialog-paper][data-ok-paper]                                                     (mobile, responsive)
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
div[id][data-ok-time-clock][data-ok-ampm][data-ok-view][data-ok-views][data-ok-value]?[data-ok-ampm-in-clock]?[data-ok-show-view-switcher="false"]?
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
Range components (ADR-0028):
```
div[id][data-ok-date-range-calendar][data-ok-calendars][data-ok-current-month-calendar-position]
    [data-ok-range-position][data-ok-month][data-ok-value=start/end]?[data-ok-disable-drag-editing]?…
  div[data-ok-date-range-calendar-month]                                   (1–3)
    div[data-ok-date-range-calendar-header]
      button[data-ok-icon-button][data-ok-date-calendar-prev]?             (first month)
      div[data-ok-date-calendar-label][id=<id>-label-<n>][aria-live=polite]
      button[data-ok-icon-button][data-ok-date-calendar-next]?             (last month)
    div[role=grid][data-ok-day-calendar][aria-labelledby][aria-multiselectable=true]   (the day grid above)
      … button[data-ok-picker-day][aria-selected][data-ok-range-start]?[data-ok-range-end]?[data-ok-in-range]?
          [data-ok-preview-start]?[data-ok-preview-end]?[data-ok-in-preview]?
div[data-ok-text-field][data-ok-date-field][data-ok-range][data-ok-value=start/end]?…   (single input range field:
    the sections of both dates, " – " between them; input[type=hidden] carries the interval)
div[role=group][data-ok-multi-input-range-field][data-ok-value-type]?[data-ok-value]?[data-ok-full-width]?
  div[data-ok-date-field] (start) + span[data-ok-multi-input-range-field-separator][aria-hidden] + div[data-ok-date-field] (end)
  div[data-ok-text-field-helper][data-ok-multi-input-range-field-helper]?
div[data-ok-date-range-picker][data-ok-picker-variant][data-ok-calendars]?[data-ok-value-type]?[data-ok-open]?…
  single input range field | multi input range field   (open buttons: button[data-ok-date-picker-open][data-ok-range-position]? )
  popover / dialog / inline as the date picker, holding div[data-ok-picker-layout]:
    div[data-ok-picker-toolbar][data-ok-range-toolbar]? › overline + div[data-ok-picker-toolbar-content] ›
        span[data-ok-picker-toolbar-part] › (span[data-ok-picker-toolbar-separator])? button[data-ok-picker-toolbar-button][data-ok-range-position][aria-pressed]
    div[data-ok-tabs][data-ok-picker-tabs][data-ok-picker-range-tabs]?     (time and date time ranges: Start / End)
    ul[data-ok-picker-shortcuts]? › … span[data-ok-chip][data-ok-picker-shortcut][data-ok-value=start/end]
    div[data-ok-picker-content] › date range calendar? + digital clock (desktop)? + time clock (mobile / static)?
    div[data-ok-picker-actions]?
```

Phase 4 (ADR-0030) adds no part: `data-ok-timezone` (`UTC` or an IANA name) and
`data-ok-calendar` (`persian`, `islamic-umalqura`, `islamic-civil`, `islamic-tbla`, `buddhist`,
`indian`) sit on any root or ancestor, as `data-ok-locale` does (the locale's `-u-ca-` extension
names the calendar too). A view from a custom renderer is wrapped in `div[data-ok-picker-view]`
(`hidden` in the other tab); the built-in renderers render their view directly. A picker whose
views are all `null` has no open button, popover or dialog. Custom slots keep the hooks:
`[data-ok-picker-actions] › [data-ok-picker-action]`, `[data-ok-picker-toolbar-title]`,
`[data-ok-picker-shortcut][data-ok-value]`.

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
| `displayStaticWrapperAs` | `data-ok-display-static-wrapper-as="…"` | style | `mobile` `desktop` | — | Static pickers: the form they show inline. `desktop`: no toolbar and no action bar by default, the desktop clocks (and two range calendars). |
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
| `clearButtonPosition` | `data-ok-clear-button-position="…"` | style | `start` `end` | — | Side of the clear button. HTML: put the button in the adornment on that side. |
| `openPickerButtonPosition` | `data-ok-open-picker-button-position="…"` | style | `start` `end` | — | Pickers: side of the open button. HTML: put the button in the adornment on that side. |
| `shouldRespectLeadingZeros` | `data-ok-should-respect-leading-zeros` | flag | boolean | off | Digit sections keep the format's padding (`D` shows `5`); by default they show two digits (`05`). |
| `readOnly` | `data-ok-read-only` | flag | boolean | off | The value can't be changed (it can still be focused and copied). |
| `valueType` | `data-ok-value-type="…"` | style | `date` `time` `date-time` | — | What the value holds (ADR-0026): `time` (TimeField, TimePicker family: ISO `HH:mm:ss`), `date-time` (DateTimeField, DateTimePicker family: ISO `YYYY-MM-DDTHH:mm:ss`); absent = a date. React: the component. |
| `range` | `data-ok-range` | flag | boolean | off | Single input range field (ADR-0028): the start and the end in one field, the value an ISO 8601 interval `start/end`. React: the component (`SingleInputDateRangeField`, `SingleInputTimeRangeField`, `SingleInputDateTimeRangeField`). |
| `value` | `data-ok-value` · event `ok:date-field:change` | state | — | — | Value as ISO 8601 (`value` / `defaultValue`). |
<!-- /options:date-field -->

<!-- options:time-clock (generated by `pnpm specs:options` from the schema in packages/core/src/anatomy/anatomy.ts) -->
Root: `data-ok-time-clock`. Unknown values fall back to the default.

| React | HTML | Kind | Values | Default | Description |
|---|---|---|---|---|---|
| `ampm` | `data-ok-ampm="false"` turns it off | behavior | boolean | on | 12-hour clock with AM / PM. Default: from the locale (en-US: on, vi-VN: off). |
| `ampmInClock` | `data-ok-ampm-in-clock` | flag | boolean | off | AM / PM buttons on the clock (12-hour clocks). |
| `showViewSwitcher` | `data-ok-show-view-switcher="false"` turns it off | behavior | boolean | on | Arrow buttons that switch between the views (MUI's default is off). |
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

<!-- options:date-range-picker (generated by `pnpm specs:options` from the schema in packages/core/src/anatomy/anatomy.ts) -->
Root: `data-ok-date-range-picker`. Unknown values fall back to the default.

| React | HTML | Kind | Values | Default | Description |
|---|---|---|---|---|---|
| `pickerVariant` | `data-ok-picker-variant="…"` | style | `responsive` `desktop` `mobile` `static` | `responsive` | `responsive` (desktop or mobile by `desktopModeMediaQuery`), `desktop` (popover), `mobile` (dialog), `static` (inline). React: the component (`DateRangePicker`, `DesktopDateRangePicker`, `MobileDateRangePicker`, `StaticDateRangePicker`, and the time and date time range families). |
| `calendars` | `data-ok-calendars="…"` | style | `1` `2` `3` | — | Months shown in the desktop popover (the dialog and inline forms show one). |
| `displayStaticWrapperAs` | `data-ok-display-static-wrapper-as="…"` | style | `mobile` `desktop` | — | Static pickers: the form they show inline. `desktop`: no toolbar and no action bar by default, the desktop clocks (and two range calendars). |
| `closeOnSelect` | `data-ok-close-on-select="false"` turns it off | behavior | boolean | on | Picking the end closes the picker. Default: on for desktop date ranges, off otherwise (absent attribute). |
| `disableDragEditing` | `data-ok-disable-drag-editing` | flag | boolean | off | The range's start and end can't be dragged to other days. |
| `valueType` | `data-ok-value-type="…"` | style | `date` `time` `date-time` | — | What the value holds (ADR-0026): `time` (TimeField, TimePicker family: ISO `HH:mm:ss`), `date-time` (DateTimeField, DateTimePicker family: ISO `YYYY-MM-DDTHH:mm:ss`); absent = a date. React: the component. |
| `open` | `data-ok-open` · event `ok:date-range-picker:open` | state | — | — | Open state (`open` / `onOpenChange`). |
<!-- /options:date-range-picker -->

<!-- options:date-range-calendar (generated by `pnpm specs:options` from the schema in packages/core/src/anatomy/anatomy.ts) -->
Root: `data-ok-date-range-calendar`. Unknown values fall back to the default.

| React | HTML | Kind | Values | Default | Description |
|---|---|---|---|---|---|
| `calendars` | `data-ok-calendars="…"` | style | `1` `2` `3` | `2` | Months shown side by side (range pickers: 2 in the popover, 1 in the dialog and inline). |
| `currentMonthCalendarPosition` | `data-ok-current-month-calendar-position="…"` | style | `1` `2` `3` | `1` | The calendar that shows the value's month (or this month) first. |
| `disableDragEditing` | `data-ok-disable-drag-editing` | flag | boolean | off | The range's start and end can't be dragged to other days. |
| `disableAutoMonthSwitching` | `data-ok-disable-auto-month-switching` | flag | boolean | off | Picking the start doesn't show the end's month. |
| `disablePast` | `data-ok-disable-past` | flag | boolean | off | Days before today can't be picked. |
| `disableFuture` | `data-ok-disable-future` | flag | boolean | off | Days after today can't be picked. |
| `displayWeekNumber` | `data-ok-display-week-number` | flag | boolean | off | A week number column. |
| `fixedWeekNumber` | `data-ok-fixed-week-number="…"` | number | number | — | Always show this many weeks (6 keeps the height the same every month). |
| `showDaysOutsideCurrentMonth` | `data-ok-show-days-outside-current-month` | flag | boolean | off | Days of the previous and next months fill the first and last weeks (one calendar only). |
| `disableHighlightToday` | `data-ok-disable-highlight-today` | flag | boolean | off | No ring around today. |
| `readOnly` | `data-ok-read-only` | flag | boolean | off | Days can be browsed but not picked. |
| `loading` | `data-ok-loading` | flag | boolean | off | Shows the loading text instead of the days. |
| `reduceAnimations` | `data-ok-reduce-animations` | flag | boolean | off | No month transitions. |
| `rangePosition` | `data-ok-range-position` · event `ok:date-range-calendar:rangepositionchange` | state | — | — | The end the next pick edits, `start` or `end` (`rangePosition` / `onRangePositionChange`). |
| `value` | `data-ok-value` · event `ok:date-range-calendar:change` | state | — | — | Selected range as an ISO 8601 interval `start/end` (`value` / `defaultValue`). |
<!-- /options:date-range-calendar -->

Time attributes (strings, ADR-0026): `data-ok-value` on clocks (`HH:mm:ss`), `data-ok-min-time`,
`data-ok-max-time` (ISO times), `data-ok-min-date-time`, `data-ok-max-date-time` (ISO date
times), `data-ok-disable-ignoring-date-part-for-time-validation`, `data-ok-views` (`hours minutes
seconds`), `data-ok-view`, `data-ok-time-steps` (`"1 5 5"`: hours minutes seconds),
`data-ok-open-to` (time and date time pickers). Fields and pickers also take `data-ok-minutes-step`.

Phase 4 attributes (strings, not in the schema): `data-ok-timezone` (closest ancestor; values in
the markup are that zone's wall times, ISO input may carry an offset), `data-ok-calendar`
(closest ancestor; ignored when the locale names a calendar). `data-ok-month` is `YYYY-MM` in the
Gregorian calendar, else the ISO date of the shown month's first day; month buttons' and year
buttons' `data-ok-value` are the calendar's month index and year.

Other attributes (strings, not in the schema): `data-ok-value`, `data-ok-min-date`,
`data-ok-max-date` (ISO 8601), `data-ok-format` (Day.js tokens), `data-ok-views` (`year month
day`), `data-ok-month` (`YYYY-MM`, the shown month), `data-ok-actions` (`clear today cancel
accept nextOrAccept`), `data-ok-desktop-mode-media-query`, `data-ok-locale` (on the element or an
ancestor), `data-ok-disabled` (calendar). Invalid values fall back to the default.

API mapping: see "Upstream API mapping" below.

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

Range calendar (ADR-0028): months 320px wide side by side, `--ok-divider` between them, the
month centered between the outer arrows; the range is a band behind the days in
`rgb(primary / 0.12)` (the days' `::before`, rounded at the ends of each week and month), the
start and the end filled like a selected day, a 1px dashed `--ok-text-disabled` outline over the
hovered or dragged preview. Range toolbar: h5 ends with an en dash. Multi input field: the two
TextFields stacked with a 16px gap, in a row with a dash from 600px.

Phase 4 tokens: none new (the RTL arrows mirror with `scale: -1 1`; logical insets).

## Responsive behavior
Mobile first. Below 600px the layout is one column (toolbar, shortcuts as a wrapping row,
calendar, actions); from 600px shortcuts sit in a column beside the calendar, and
`orientation="landscape"` puts the toolbar on the left. Responsive pickers pick desktop or
mobile when they open (`(pointer: fine)` by default). The dialog paper never exceeds the screen
minus 32px; the calendar keeps 320px (fits 375px screens). Time pickers: from 600px a landscape
toolbar stacks the date, the time and a row of AM / PM; date time pickers put the tabs above the
content beside it. The desktop date time popover is the calendar plus the clock columns (about
490px wide). Range calendars wrap their months below each other when the space is narrower than
the months (a popover is at most the screen minus 32px); the dialog shows one month. Multi input
fields stack below 600px and never clip their text (the row wraps).

## States
`data-ok-shrink` (field has text), `data-ok-error` / `aria-invalid` (validation),
`data-ok-all-selected` (Ctrl / ⌘ + A), `data-ok-open` (picker), `aria-selected`,
`aria-checked`, `data-ok-today`, `data-ok-outside`, `disabled`, `:focus-visible`. Clocks:
`aria-selected` / `aria-disabled` on options, `aria-pressed` on AM / PM, `data-ok-selected` on the
toolbar's open view, `data-ok-inner` / `data-ok-between` on the pointer, `data-ok-view`. Ranges:
`data-ok-range-start`, `data-ok-range-end`, `data-ok-in-range`, `data-ok-preview-*`,
`data-ok-range-position`, `aria-pressed` on the toolbar ends, `data-ok-error` on both fields of an
`invalidRange`.

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

- **Range calendar (ADR-0028):** the start position sets the start (a day after the end starts a
  new range) and moves to the end; the end position sets the end (a day before the start starts a
  new range) and reports `"finish"`. A hovered day (mouse) previews the range; pressing and
  dragging the start or the end (mouse or touch, `touch-action: none` on the ends) moves it, past
  the other end too (the ends swap); the click that ends a drag isn't a pick. After a new start,
  the end's month shows unless `disableAutoMonthSwitching`. Keys move across the months.
- **Range pickers:** desktop date ranges close when the end is picked (`closeOnSelect`); mobile
  and static show the toolbar (its ends choose the edited end) and Cancel / OK. Time and date time
  ranges show Start / End tabs; finishing the start's last view moves to the end, the end's last
  view finishes (they never close on a pick by default). Date time ranges pick the day (keeping
  the end's time) and then the time of the same end. Multi input fields open on the end of the
  pressed button. Range shortcuts set, accept and close; an empty interval resets.
- **Range validation:** each side's own error, or `invalidRange` on both when the end comes
  before the start (dates by day, times and date times by the instant). Partly typed sides are
  invalid dates.
- **Time zones (ADR-0030):** values are converted at the component's edge: the field, the
  calendar and the clocks show and edit the zone's wall time; callbacks get instants (in the
  value's zone with an adapter). "Today" and "now" (`disablePast`, highlights) are the zone's.
  `"default"` reads the value's zone, else the system's. A wall time the system zone skips moves
  by the gap.
- **Calendar systems:** months, years, day numbers and field sections follow the calendar;
  values stay ISO (Gregorian). Without a calendar the pickers are Gregorian, also for locales
  whose default isn't (`ar-SA`).
- **Right to left:** ← / → follow the reading direction in fields (sections) and calendars
  (days); month and clock arrows mirror; the clock face doesn't.

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
close. Brand-colored selections are exempt from `color-contrast` only (ADR-0014). Range grids are
`aria-multiselectable`: every day of the range is `aria-selected`; the band keeps the neutral text
(AA). The single range field's open button names the range ("Choose range, selected range is May
20, 2025 – May 25, 2025"); multi input buttons name their date; range dialogs are named "Select
date range" / "Select time range" / "Select date time range". Dragging has a keyboard
alternative (Enter on the start and on the end; the toolbar ends or the tabs pick the edited end). The time clock
is a listbox named "Select hours. Selected time is 09:30 AM" whose options are named "9 hours";
focus stays on the listbox (`aria-activedescendant`). Digital clock columns are listboxes named
"Select hours"; the multi-section clock is a named group. Time pickers' open button names the
time ("Choose time, selected time is 09:30 AM"); dialogs are named "Select time" / "Select date &
time"; the date time tabs are named "pick date" / "pick time".

## Events / API
HTML: `ok:date-picker:change` (`{ value, validationError }`), `:accept` (`{ value }`), `:open` /
`:close` (`{ reason }`); `ok:date-field:change` (cancelable), `:clear`; `ok:date-calendar:change`
(cancelable, `{ value, selectionState }`), `:viewchange`, `:monthchange`, `:yearchange`;
`ok:month-calendar:change`, `ok:year-calendar:change` (cancelable). Every calendar and clock (4.18.30): `ok:<name>:focusedviewchange` (`{ view, hasFocus }`), instance
`focusedView`, `setFocusedView(view)`; React `focusedView`, `onFocusedViewChange(view, hasFocus)`.
Instances: date-picker `{ value,
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
Phase 4 (ADR-0030): every picker, field, calendar and clock instance adds `date` (the adapter's
dates, or `Date` instants; ranges `[start, end]`), `setDate(value)` and
`setDateAdapter(adapter | null)`; date-calendar, date-range-calendar, date-picker and
date-range-picker add `setDayRenderer((button, date) => void | null)` (runs on each built day,
errors ignored); `setLocaleText` also relabels the action bar. `setValue` takes ISO text with an
offset. React: `usePickerContext()` in custom slots, `usePickerDateConverter()`.
Phase 3 (ADR-0028): `ok:date-range-picker:change` (`{ value: "start/end" | null, validationError:
[start, end] }`), `:accept`, `:open` / `:close` (`{ reason }`), `:rangepositionchange`
(`{ rangePosition }`); `ok:date-range-calendar:change` (cancelable, `{ value, selectionState }`),
`:rangepositionchange`, `:monthchange`; `ok:multi-input-range-field:change` (cancelable; canceling
cancels the field's change); range `ok:date-field:change` reports `validationError: [start, end]`.
Instances: date-range-picker `{ value, setValue, rangePosition, setRangePosition, isOpen,
open(position?), close, setShortcuts, setShouldDisableDate, setShouldDisableTime, setLocaleText }`;
date-range-calendar `{ value, setValue, rangePosition, setRangePosition,
setAvailableRangePositions, calendars, setCalendars, month, focus, setShouldDisable…,
setDayOfWeekFormatter, setLocaleText }`; multi-input-range-field `{ value, validationError,
setValue }`; date-field adds `setError(error | null)`. React: `onChange(range, { validationError
})`, `onError(errors, range)`, `onRangePositionChange(position)`.

## Upstream API mapping
Upstream: MUI X Date and Time Pickers v9 (Community + Pro), mui.com/x/api/date-pickers/.
Applies to every picker, field, calendar and clock that has the prop upstream.

| Upstream | Owlky | Status | Note |
|---|---|---|---|
| `value` / `defaultValue`, `onChange(value, { validationError })`, `onAccept`, `onError` | same | kept | ranges `[start, end]`; error `invalidRange` |
| `onOpen` / `onClose` / `onCancel` | `onOpenChange(open, reason)` | renamed | reasons `button` · `escape` · `clickaway` · `accept` · `cancel` · `select` · `clear` · `today` · `shortcut` · `api` |
| `open`, `views`, `openTo`, `view` / `onViewChange` | same | kept | date and time views |
| `format`, `formatDensity`, `referenceDate`, `autoFocus`, `readOnly`, `disabled`, `label`, `name`, `inputRef`, `localeText` | same | kept | `inputRef` = the hidden input |
| `selectedSections` / `onSelectedSectionsChange` | same | kept | 4.18.29: a section index, a section type (its first section), `"all"` or `null` (`FieldSelectedSections`); the callback reports the focused section's index, or `"all"` on select-all (Ctrl / ⌘ + A). HTML: instance `setSelectedSections` |
| `minDate`, `maxDate`, `disablePast`, `disableFuture`, `shouldDisableDate` / `Month` / `Year` | same | kept | |
| `closeOnSelect`, `desktopModeMediaQuery`, `keepOpenDuringFieldFocus`, `reduceAnimations`, `orientation`, `loading`, `renderLoading` | same | kept | time / date time: no close on pick, Cancel + OK (MUI v9, reference) |
| `displayWeekNumber`, `fixedWeekNumber`, `showDaysOutsideCurrentMonth`, `disableHighlightToday`, `dayOfWeekFormatter`, `monthsPerRow`, `yearsPerRow`, `yearsOrder`, `onMonthChange`, `onYearChange` | same | kept | |
| `ampm`, `ampmInClock`, `minTime`, `maxTime`, `minDateTime`, `maxDateTime`, `minutesStep`, `shouldDisableTime`, `disableIgnoringDatePartForTimeValidation`, `timeSteps`, `timeStep`, `thresholdToRenderTimeInASingleColumn`, `skipDisabled` | same | kept | clocks' `onChange(value, selectionState)` |
| Pro: `calendars`, `currentMonthCalendarPosition`, `rangePosition` / `defaultRangePosition` / `onRangePositionChange`, `availableRangePositions`, `disableDragEditing`, `disableAutoMonthSwitching`, range `shortcuts` | same | kept | |
| `timezone` | same | kept | `"default"` · `"system"` · `"UTC"` · IANA |
| `viewRenderers` (`renderDateViewCalendar`, `renderTimeViewClock`, `renderDigitalClockTimeView`, `renderMultiSectionDigitalClockTimeView`, `null`) | same | kept | range pickers: `null` only |
| `slots` `layout`, `toolbar`, `actionBar`, `shortcuts`, `day`, `openPickerIcon`, `leftArrowIcon`, `rightArrowIcon`, `switchViewIcon`; `slotProps` `toolbar.hidden`, `tabs.hidden`, `day`, `layout` | same | kept | |
| `slotProps.actionBar.actions`, `slotProps.shortcuts.items` | `actions`, `shortcuts` | renamed | |
| `slotProps.field.clearable` / `onClear`; fields `clearable`, `onClear` | `clearable`, `onClear` | renamed | |
| `slotProps.textField` | TextField props `helperText`, `error`, `variant`, `size`, `fullWidth`, `required`, `color`, `margin`, `hiddenLabel`, `focused` | renamed | 4.18.29 added `color` / `margin` / `hiddenLabel` / `focused` (`data-ok-color`, `data-ok-margin`, `data-ok-hidden-label`, `data-ok-focused` on the TextField root; an empty field shows its sections when focused, with a hidden label or a start adornment) |
| range `slots.field` (multi input) / per-end `slotProps.textField` | `multiInput`, `startLabel` / `endLabel` | renamed | |
| `usePickerContext()` | same | kept | ranges add `rangePosition` / `setRangePosition` |
| `PickersDay`, `PickersLayout`, `PickersActionBar`, `PickersShortcuts` | `PickerDay`, `PickerLayout` (+ `PickerLayoutRoot`, `PickerLayoutContent`), `PickerActionBar`, `PickerShortcuts` | renamed | |
| locale packs (`frFR`…) | `pickersFrFR`, `pickersDeDE`, `pickersEsES`, `pickersJaJP`, `pickersZhCN`, `pickersFaIR`, `pickersArSD` | renamed | |
| LocalizationProvider `adapterLocale`, `localeText`, `dateAdapter`; `PickerValidDate` | same | kept | |
| adapter classes (`AdapterDayjs`…), `dateLibInstance` | `createDayjsAdapter(dayjs)`, `createDateFnsAdapter({ TZDate })`, `createLuxonAdapter(DateTime)`, `createMomentAdapter(moment)` | renamed | the library is the factory's argument |
| Jalali / Hijri adapters | adapter `calendar`, `LocalizationProvider calendar`, locale `-u-ca-` | renamed | any `Intl` calendar |
| fields `clearButtonPosition`, `openPickerButtonPosition` | same | kept | 4.18.29: `start` puts the button in a start adornment (open button first, `edge="start"`); `data-ok-clear-button-position` / `data-ok-open-picker-button-position` on the field root mark it, HTML markup places the button. Fields, single input range fields (clear), single-value pickers; range pickers keep their buttons at the end (deferred) |
| fields `startAdornment` / `endAdornment` | same | kept | 4.18.29: an `InputAdornment` around the sections; the end one comes before the buttons' adornment. Fields, single input range fields, single-value pickers |
| fields `shouldRespectLeadingZeros` | same | kept | 4.18.29: default `false` as in MUI: digit sections without padding (`D`, `M`, `H`, `h`, `m`, `s`) show two digits (`fieldSections`); `data-ok-should-respect-leading-zeros` keeps the format's padding. Behavior change: such formats used to keep their padding |
| fields `fieldRef` (field API) | same | kept | 4.18.29: `getSections` (type, format token, content type, value, placeholder, separators), `getActiveSectionIndex`, `setSelectedSections`, `focusField`, `isFieldFocused` (core `createFieldApi`); HTML: the same methods on the `date-field` instance (pickers: the field's instance). Fields, single input range fields, single-value pickers |
| fields TextField props `color`, `margin`, `hiddenLabel`, `focused` | same | kept | 4.18.29, see `slotProps.textField`. Multi input range fields and range pickers: deferred (each end is a field of its own) |
| single input range fields `dateSeparator` | same | kept | 4.18.30: default `"–"`, shown between spaces (core `rangeFieldSections(format, zeros, separator)`); HTML `data-ok-date-separator` on the field (the markup writes the same text); range pickers pass it to their single input field (MUI `slotProps.field.dateSeparator`). The open button's name keeps " – " |
| calendars / clocks `focusedView` / `onFocusedViewChange` | same | kept | 4.18.30: DateCalendar (`year` · `month` · `day`), DateRangeCalendar (`day`), TimeClock (its views), DigitalClock (`hours`), MultiSectionDigitalClock (its columns, `meridiem` too). Core `createFocusedViewTracker` (focusin / focusout, checked again after the owner's renders) and `focusPickerViewPart` (a new `focusedView`, or a new shown view equal to it, moves the focus into that view's tab stop when it is shown). HTML: event `focusedviewchange` (`{ view, hasFocus }`) on each root, instance `focusedView` / `setFocusedView(view)` |
| TimeClock `showViewSwitcher` | same | kept | 4.18.30: default `true` (Owlky has always shown the arrows, as the reference; MUI's default is off). `false` = `data-ok-show-view-switcher="false"`: CSS hides `[data-ok-time-clock-nav]` (the markup keeps it, parity) |
| static pickers `displayStaticWrapperAs` | same | kept | 4.18.30: `mobile` (default) · `desktop` = `data-ok-display-static-wrapper-as` on static date, time, date time and date range pickers. Desktop: no toolbar or tabs, desktop default actions (none for dates), the desktop clocks (DigitalClock / MultiSectionDigitalClock instead of the TimeClock), date time pickers keep the calendar beside the clocks after a day pick, range pickers show the desktop calendar count (2). `usePickerContext().variant` is `desktop` |
| `dateFormats` | — | not applicable | `format` per picker |
| `disableOpenPicker` (deprecated) | `viewRenderers` with `null` | not applicable | |
| `enableAccessibleFieldDOMStructure` | — | not applicable | always the accessible structure |
| other `slots` (`textField`, `field`, `popper`, `dialog`, `desktopPaper`, `mobilePaper`, `desktopTrapFocus`, transitions), `sx`, `classes`, `className` of parts | TextField props, Popover, Dialog | not applicable | ADR-0015 |

Beyond MUI: `today` (React: pins "today"), `aria-current="date"`, HTML `data-ok-locale` /
`data-ok-timezone` / `data-ok-calendar`, a hidden ISO input for forms, ISO 8601 intervals in HTML,
open buttons on range fields (`openRangePickerDialogue`), Start / End tabs on every time range form,
calendar systems through `Intl` for any adapter, HTML instance `date` / `setDate` /
`setDateAdapter` / `setDayRenderer`.

## Parity notes
React renders `data-ok-runtime="off"`. The HTML runtime rebuilds other months with DOM methods and
patches the same month in place; snippets are generated from the React examples. A responsive
picker renders the mobile actions and toolbar hidden while it is in its desktop form; responsive
time and date time pickers also render both forms' views (digital clock, tabs, time clock) and
hide the other form's. The clock pointer's angle is a private property (parity ignores `style`).
Range snippets are generated from the React examples too; the HTML range calendar rebuilds its
months with DOM methods and patches the same months in place. Phase 4 snippets too (custom days
get their dots from the story's page script, `setDayRenderer`); React writes `data-ok-timezone`
on zoned roots.
