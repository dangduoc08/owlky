# Date pickers

Reference: Minimal UI kit "Date pickers" page (MUI X Date and Time Pickers), section Date (Basic,
Playground, Static mode); sections Time, Date & Time and Range come in phases 2 and 3 (ADR-0022)
(content only). Upstream: MUI X `DatePicker`, `DesktopDatePicker`, `MobileDatePicker`,
`StaticDatePicker`, `DateField`, `DateCalendar`, `MonthCalendar`, `YearCalendar`,
`LocalizationProvider` (v9, ADR-0015). Created with `/component` (phase 1 of 4).
Reference URL: https://minimals.cc/components/mui/date-pickers

## Purpose
Type a date in a sectioned field or pick it from a calendar: in a popover (pointer devices), a
dialog (touch) or inline. One engine in core (`core/src/pickers/`): dates in local time, ISO 8601,
formats split into sections, locale data from `Intl`, validation, the month grid, and controllers
that report intent (`createFieldController`, `createCalendarController`). React keeps state in
props / hooks; the HTML runtimes (`date-field`, `date-calendar`, `month-calendar`,
`year-calendar`, `date-picker`) keep it in the DOM. Every MUI X tier is free (ADR-0022).

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

## Options
<!-- options:date-picker (generated by `pnpm specs:options` from the schema in packages/core/src/anatomy/anatomy.ts) -->
Root: `data-ok-date-picker`. Unknown values fall back to the default.

| React | HTML | Kind | Values | Default | Description |
|---|---|---|---|---|---|
| `pickerVariant` | `data-ok-picker-variant="…"` | style | `responsive` `desktop` `mobile` `static` | `responsive` | `responsive` (desktop or mobile by `desktopModeMediaQuery`), `desktop` (popover), `mobile` (dialog), `static` (inline). React: the component (`DatePicker`, `DesktopDatePicker`, `MobileDatePicker`, `StaticDatePicker`). |
| `orientation` | `data-ok-orientation="…"` | style | `portrait` `landscape` | `portrait` | `landscape` puts the toolbar beside the calendar (mobile and static). |
| `closeOnSelect` | `data-ok-close-on-select="false"` turns it off | behavior | boolean | on | Picking a day closes the picker. Default: on for desktop, off for mobile (absent attribute). |
| `keepOpenDuringFieldFocus` | `data-ok-keep-open-during-field-focus` | flag | boolean | off | Desktop: the popover stays open while the field has focus (typing doesn't close it). |
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
| `value` | `data-ok-value` · event `ok:date-field:change` | state | — | — | Value as ISO 8601 (`value` / `defaultValue`). |
<!-- /options:date-field -->

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
- **Deferred:** `timezone`, `dateAdapter` / adapters, `viewRenderers`, layout slots (phase 4).
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

## Responsive behavior
Mobile first. Below 600px the layout is one column (toolbar, shortcuts as a wrapping row,
calendar, actions); from 600px shortcuts sit in a column beside the calendar, and
`orientation="landscape"` puts the toolbar on the left. Responsive pickers pick desktop or
mobile when they open (`(pointer: fine)` by default). The dialog paper never exceeds the screen
minus 32px; the calendar keeps 320px (fits 375px screens).

## States
`data-ok-shrink` (field has text), `data-ok-error` / `aria-invalid` (validation),
`data-ok-all-selected` (Ctrl / ⌘ + A), `data-ok-open` (picker), `aria-selected`,
`aria-checked`, `data-ok-today`, `data-ok-outside`, `disabled`, `:focus-visible`.

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

## Accessibility
Sections are spin buttons named by their part ("Month"), valued as text ("May"); the group is
named by the label and marked `aria-invalid`. The open button names the selected date. The grid is
named by its month; today has `aria-current="date"`; disabled days are `disabled`. Popover and
dialog are named "Select date"; focus goes to the current day on open and back to the button on
close. Brand-colored selections are exempt from `color-contrast` only (ADR-0014).

## Events / API
HTML: `ok:date-picker:change` (`{ value, validationError }`), `:accept` (`{ value }`), `:open` /
`:close` (`{ reason }`); `ok:date-field:change` (cancelable), `:clear`; `ok:date-calendar:change`
(cancelable, `{ value, selectionState }`), `:viewchange`, `:monthchange`, `:yearchange`;
`ok:month-calendar:change`, `ok:year-calendar:change` (cancelable). Instances: date-picker `{ value,
setValue, isOpen, open, close, setShortcuts, setShouldDisableDate / Month / Year, setLocaleText }`;
date-field `{ value, validationError, setValue, focus, setShouldDisable…, setLocaleText }`;
date-calendar `{ value, setValue, view, setView, month, focus, setShouldDisable…,
setDayOfWeekFormatter, setLocaleText }`. React: callbacks above.

## Parity notes
React renders `data-ok-runtime="off"`. The HTML runtime rebuilds other months with DOM methods and
patches the same month in place; snippets are generated from the React examples. A responsive
picker renders the mobile actions and toolbar hidden while it is in its desktop form.
