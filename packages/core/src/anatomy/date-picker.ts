import {
  behavior,
  type DataAttributes,
  defineOptions,
  flag,
  number,
  optionAttributes,
  state,
  style,
} from "../options/define.js";

// --- Date pickers (ADR-0022) -------------------------------------------------------------------

export const pickerVariantValues = ["responsive", "desktop", "mobile", "static"] as const;
export const pickerOrientationValues = ["portrait", "landscape"] as const;
export const pickerFormatDensities = ["dense", "spacious"] as const;
export const pickerYearsOrders = ["asc", "desc"] as const;
export const pickerPerRow = ["3", "4"] as const;
export const pickerOpenToViews = ["year", "month", "day"] as const;
export const pickerValueTypes = ["date", "time", "date-time"] as const;

const valueTypeOption = style(
  "data-ok-value-type",
  pickerValueTypes,
  "date",
  "What the value holds: `time` (TimeField, TimePicker family: ISO `HH:mm:ss`), `date-time` (DateTimeField, DateTimePicker family: ISO `YYYY-MM-DDTHH:mm:ss`); absent = a date. React: the component.",
  { optional: true },
);

/** Side of a field's clear or open button (MUI `clearButtonPosition`, `openPickerButtonPosition`). */
export const pickerButtonPositions = ["start", "end"] as const;
export type PickerButtonPosition = (typeof pickerButtonPositions)[number];

export const dateFieldOptions = defineOptions("date-field", "data-ok-date-field", {
  formatDensity: style(
    "data-ok-format-density",
    pickerFormatDensities,
    "dense",
    "`spacious` puts spaces around the separators (`05 / 25 / 2025`).",
  ),
  clearable: flag("data-ok-clearable", "A clear button at the end of the field."),
  clearButtonPosition: style(
    "data-ok-clear-button-position",
    pickerButtonPositions,
    "end",
    "Side of the clear button. HTML: put the button in the adornment on that side.",
    { optional: true },
  ),
  openPickerButtonPosition: style(
    "data-ok-open-picker-button-position",
    pickerButtonPositions,
    "end",
    "Pickers: side of the open button. HTML: put the button in the adornment on that side.",
    { optional: true },
  ),
  shouldRespectLeadingZeros: flag(
    "data-ok-should-respect-leading-zeros",
    "Digit sections keep the format's padding (`D` shows `5`); by default they show two digits (`05`).",
  ),
  readOnly: flag(
    "data-ok-read-only",
    "The value can't be changed (it can still be focused and copied).",
  ),
  valueType: valueTypeOption,
  range: flag(
    "data-ok-range",
    "Single input range field: the start and the end in one field, the value an ISO 8601 interval `start/end`. React: the component (`SingleInputDateRangeField`, `SingleInputTimeRangeField`, `SingleInputDateTimeRangeField`).",
  ),
  value: state("data-ok-value", "Value as ISO 8601 (`value` / `defaultValue`).", "change"),
});

export interface DateFieldAnatomyOptions {
  formatDensity?: (typeof pickerFormatDensities)[number] | undefined;
  clearable?: boolean | undefined;
  clearButtonPosition?: PickerButtonPosition | undefined;
  openPickerButtonPosition?: PickerButtonPosition | undefined;
  shouldRespectLeadingZeros?: boolean | undefined;
  readOnly?: boolean | undefined;
  valueType?: (typeof pickerValueTypes)[number] | undefined;
  range?: boolean | undefined;
}

/** `data-ok-*` attributes of a date field (on the TextField root). */
export const dateFieldAttributes = (options: DateFieldAnatomyOptions = {}): DataAttributes =>
  optionAttributes(dateFieldOptions, { ...options });

export const dateCalendarOptions = defineOptions("date-calendar", "data-ok-date-calendar", {
  openTo: style(
    "data-ok-open-to",
    pickerOpenToViews,
    "day",
    "The view shown first (one of `views`).",
    {
      optional: true,
    },
  ),
  disablePast: flag("data-ok-disable-past", "Days before today can't be picked."),
  disableFuture: flag("data-ok-disable-future", "Days after today can't be picked."),
  displayWeekNumber: flag("data-ok-display-week-number", "A week number column."),
  fixedWeekNumber: number(
    "data-ok-fixed-week-number",
    undefined,
    "Always show this many weeks (6 keeps the height the same every month).",
    { min: 1 },
  ),
  showDaysOutsideCurrentMonth: flag(
    "data-ok-show-days-outside-current-month",
    "Days of the previous and next months fill the first and last weeks.",
  ),
  disableHighlightToday: flag("data-ok-disable-highlight-today", "No ring around today."),
  monthsPerRow: style(
    "data-ok-months-per-row",
    pickerPerRow,
    "3",
    "Months per row in the month view.",
  ),
  yearsPerRow: style("data-ok-years-per-row", pickerPerRow, "4", "Years per row in the year view."),
  yearsOrder: style("data-ok-years-order", pickerYearsOrders, "asc", "Order of the year view."),
  readOnly: flag("data-ok-read-only", "Days can be browsed but not picked."),
  loading: flag("data-ok-loading", "Shows the loading text instead of the days (data on its way)."),
  reduceAnimations: flag("data-ok-reduce-animations", "No month or view transitions."),
  value: state(
    "aria-selected",
    "Selected day (`value` / `defaultValue`; HTML `data-ok-value`).",
    "change",
  ),
});

export interface DateCalendarAnatomyOptions {
  openTo?: (typeof pickerOpenToViews)[number] | undefined;
  disablePast?: boolean | undefined;
  disableFuture?: boolean | undefined;
  displayWeekNumber?: boolean | undefined;
  fixedWeekNumber?: number | undefined;
  showDaysOutsideCurrentMonth?: boolean | undefined;
  disableHighlightToday?: boolean | undefined;
  monthsPerRow?: 3 | 4 | (typeof pickerPerRow)[number] | undefined;
  yearsPerRow?: 3 | 4 | (typeof pickerPerRow)[number] | undefined;
  yearsOrder?: (typeof pickerYearsOrders)[number] | undefined;
  readOnly?: boolean | undefined;
  loading?: boolean | undefined;
  reduceAnimations?: boolean | undefined;
}

/** `data-ok-*` attributes of a date calendar root. */
export const dateCalendarAttributes = (options: DateCalendarAnatomyOptions = {}): DataAttributes =>
  optionAttributes(dateCalendarOptions, {
    ...options,
    monthsPerRow: options.monthsPerRow === undefined ? undefined : String(options.monthsPerRow),
    yearsPerRow: options.yearsPerRow === undefined ? undefined : String(options.yearsPerRow),
  });

/** The form a static picker shows (MUI X `displayStaticWrapperAs`). */
export const pickerStaticWrapperValues = ["mobile", "desktop"] as const;
export type PickerStaticWrapper = (typeof pickerStaticWrapperValues)[number];

export const datePickerOptions = defineOptions("date-picker", "data-ok-date-picker", {
  pickerVariant: style(
    "data-ok-picker-variant",
    pickerVariantValues,
    "responsive",
    "`responsive` (desktop or mobile by `desktopModeMediaQuery`), `desktop` (popover), `mobile` (dialog), `static` (inline). React: the component (`DatePicker`, `DesktopDatePicker`, `MobileDatePicker`, `StaticDatePicker`).",
  ),
  orientation: style(
    "data-ok-orientation",
    pickerOrientationValues,
    "portrait",
    "`landscape` puts the toolbar beside the calendar (mobile and static).",
  ),
  displayStaticWrapperAs: style(
    "data-ok-display-static-wrapper-as",
    pickerStaticWrapperValues,
    "mobile",
    "Static pickers: the form they show inline. `desktop`: no toolbar and no action bar by default, the desktop clocks (and two range calendars).",
    { optional: true },
  ),
  closeOnSelect: behavior(
    "data-ok-close-on-select",
    true,
    "Picking a day closes the picker. Default: on for desktop, off for mobile (absent attribute).",
  ),
  keepOpenDuringFieldFocus: flag(
    "data-ok-keep-open-during-field-focus",
    "Desktop: the popover stays open while the field has focus (typing doesn't close it).",
  ),
  valueType: valueTypeOption,
  open: state("data-ok-open", "Open state (`open` / `onOpenChange`).", "open"),
});

export interface DatePickerAnatomyOptions {
  pickerVariant?: (typeof pickerVariantValues)[number] | undefined;
  orientation?: (typeof pickerOrientationValues)[number] | undefined;
  displayStaticWrapperAs?: PickerStaticWrapper | undefined;
  keepOpenDuringFieldFocus?: boolean | undefined;
  valueType?: (typeof pickerValueTypes)[number] | undefined;
}

/** `data-ok-*` attributes of a date picker root. */
export const datePickerAttributes = (options: DatePickerAnatomyOptions = {}): DataAttributes =>
  optionAttributes(datePickerOptions, { ...options });

// Time views (ADR-0022 phase 2, ADR-0026). `data-ok-ampm` is always written by React (its
// default comes from the locale); HTML without it follows the locale too.
const ampmOption = behavior(
  "data-ok-ampm",
  true,
  "12-hour clock with AM / PM. Default: from the locale (en-US: on, vi-VN: off).",
);
const minutesStepOption = number("data-ok-minutes-step", 1, "Minutes must be a multiple of this.", {
  min: 1,
});
const timeRuleFlags = {
  disablePast: flag("data-ok-disable-past", "Times before now can't be picked."),
  disableFuture: flag("data-ok-disable-future", "Times after now can't be picked."),
  readOnly: flag("data-ok-read-only", "Times can be browsed but not picked."),
};

export const timeClockOptions = defineOptions("time-clock", "data-ok-time-clock", {
  ampm: ampmOption,
  ampmInClock: flag("data-ok-ampm-in-clock", "AM / PM buttons on the clock (12-hour clocks)."),
  showViewSwitcher: behavior(
    "data-ok-show-view-switcher",
    true,
    "Arrow buttons that switch between the views (MUI's default is off).",
  ),
  minutesStep: minutesStepOption,
  ...timeRuleFlags,
  value: state(
    "aria-selected",
    "Selected time (`value` / `defaultValue`; HTML `data-ok-value`).",
    "change",
  ),
});

export interface TimeClockAnatomyOptions {
  ampmInClock?: boolean | undefined;
  minutesStep?: number | undefined;
  disablePast?: boolean | undefined;
  disableFuture?: boolean | undefined;
  readOnly?: boolean | undefined;
}

/** `data-ok-*` attributes of a time clock root (`data-ok-ampm` is written by the component). */
export const timeClockAttributes = (options: TimeClockAnatomyOptions = {}): DataAttributes =>
  optionAttributes(timeClockOptions, { ...options });

export const digitalClockOptions = defineOptions("digital-clock", "data-ok-digital-clock", {
  ampm: ampmOption,
  timeStep: number("data-ok-time-step", 30, "Minutes between two options.", { min: 1 }),
  skipDisabled: flag("data-ok-skip-disabled", "Options that can't be picked are left out."),
  minutesStep: minutesStepOption,
  ...timeRuleFlags,
  value: state(
    "aria-selected",
    "Selected time (`value` / `defaultValue`; HTML `data-ok-value`).",
    "change",
  ),
});

export interface DigitalClockAnatomyOptions {
  timeStep?: number | undefined;
  skipDisabled?: boolean | undefined;
  minutesStep?: number | undefined;
  disablePast?: boolean | undefined;
  disableFuture?: boolean | undefined;
  readOnly?: boolean | undefined;
}

/** `data-ok-*` attributes of a digital clock root. */
export const digitalClockAttributes = (options: DigitalClockAnatomyOptions = {}): DataAttributes =>
  optionAttributes(digitalClockOptions, { ...options });

export const multiSectionDigitalClockOptions = defineOptions(
  "multi-section-digital-clock",
  "data-ok-multi-section-digital-clock",
  {
    ampm: ampmOption,
    skipDisabled: flag("data-ok-skip-disabled", "Options that can't be picked are left out."),
    minutesStep: minutesStepOption,
    ...timeRuleFlags,
    value: state(
      "aria-selected",
      "Selected time (`value` / `defaultValue`; HTML `data-ok-value`).",
      "change",
    ),
  },
);

export interface MultiSectionDigitalClockAnatomyOptions {
  skipDisabled?: boolean | undefined;
  minutesStep?: number | undefined;
  disablePast?: boolean | undefined;
  disableFuture?: boolean | undefined;
  readOnly?: boolean | undefined;
}

/** `data-ok-*` attributes of a multi-section digital clock root. */
export const multiSectionDigitalClockAttributes = (
  options: MultiSectionDigitalClockAnatomyOptions = {},
): DataAttributes => optionAttributes(multiSectionDigitalClockOptions, { ...options });

// Range pickers (ADR-0022 phase 3, ADR-0028).
export const pickerCalendarCounts = ["1", "2", "3"] as const;

export const dateRangeCalendarOptions = defineOptions(
  "date-range-calendar",
  "data-ok-date-range-calendar",
  {
    calendars: style(
      "data-ok-calendars",
      pickerCalendarCounts,
      "2",
      "Months shown side by side (range pickers: 2 in the popover, 1 in the dialog and inline).",
    ),
    currentMonthCalendarPosition: style(
      "data-ok-current-month-calendar-position",
      pickerCalendarCounts,
      "1",
      "The calendar that shows the value's month (or this month) first.",
    ),
    disableDragEditing: flag(
      "data-ok-disable-drag-editing",
      "The range's start and end can't be dragged to other days.",
    ),
    disableAutoMonthSwitching: flag(
      "data-ok-disable-auto-month-switching",
      "Picking the start doesn't show the end's month.",
    ),
    disablePast: flag("data-ok-disable-past", "Days before today can't be picked."),
    disableFuture: flag("data-ok-disable-future", "Days after today can't be picked."),
    displayWeekNumber: flag("data-ok-display-week-number", "A week number column."),
    fixedWeekNumber: number(
      "data-ok-fixed-week-number",
      undefined,
      "Always show this many weeks (6 keeps the height the same every month).",
      { min: 1 },
    ),
    showDaysOutsideCurrentMonth: flag(
      "data-ok-show-days-outside-current-month",
      "Days of the previous and next months fill the first and last weeks (one calendar only).",
    ),
    disableHighlightToday: flag("data-ok-disable-highlight-today", "No ring around today."),
    readOnly: flag("data-ok-read-only", "Days can be browsed but not picked."),
    loading: flag("data-ok-loading", "Shows the loading text instead of the days."),
    reduceAnimations: flag("data-ok-reduce-animations", "No month transitions."),
    rangePosition: state(
      "data-ok-range-position",
      "The end the next pick edits, `start` or `end` (`rangePosition` / `onRangePositionChange`).",
      "rangepositionchange",
    ),
    value: state(
      "data-ok-value",
      "Selected range as an ISO 8601 interval `start/end` (`value` / `defaultValue`).",
      "change",
    ),
  },
);

export interface DateRangeCalendarAnatomyOptions {
  calendars?: 1 | 2 | 3 | (typeof pickerCalendarCounts)[number] | undefined;
  currentMonthCalendarPosition?: 1 | 2 | 3 | (typeof pickerCalendarCounts)[number] | undefined;
  disableDragEditing?: boolean | undefined;
  disableAutoMonthSwitching?: boolean | undefined;
  disablePast?: boolean | undefined;
  disableFuture?: boolean | undefined;
  displayWeekNumber?: boolean | undefined;
  fixedWeekNumber?: number | undefined;
  showDaysOutsideCurrentMonth?: boolean | undefined;
  disableHighlightToday?: boolean | undefined;
  readOnly?: boolean | undefined;
  loading?: boolean | undefined;
  reduceAnimations?: boolean | undefined;
}

/** `data-ok-*` attributes of a date range calendar root. */
export const dateRangeCalendarAttributes = (
  options: DateRangeCalendarAnatomyOptions = {},
): DataAttributes =>
  optionAttributes(dateRangeCalendarOptions, {
    ...options,
    calendars: options.calendars === undefined ? undefined : String(options.calendars),
    currentMonthCalendarPosition:
      options.currentMonthCalendarPosition === undefined
        ? undefined
        : String(options.currentMonthCalendarPosition),
  });

export const dateRangePickerOptions = defineOptions(
  "date-range-picker",
  "data-ok-date-range-picker",
  {
    pickerVariant: style(
      "data-ok-picker-variant",
      pickerVariantValues,
      "responsive",
      "`responsive` (desktop or mobile by `desktopModeMediaQuery`), `desktop` (popover), `mobile` (dialog), `static` (inline). React: the component (`DateRangePicker`, `DesktopDateRangePicker`, `MobileDateRangePicker`, `StaticDateRangePicker`, and the time and date time range families).",
    ),
    calendars: style(
      "data-ok-calendars",
      pickerCalendarCounts,
      "2",
      "Months shown in the desktop popover (the dialog and inline forms show one).",
      { optional: true },
    ),
    displayStaticWrapperAs: style(
      "data-ok-display-static-wrapper-as",
      pickerStaticWrapperValues,
      "mobile",
      "Static pickers: the form they show inline. `desktop`: no toolbar and no action bar by default, the desktop clocks (and two range calendars).",
      { optional: true },
    ),

    closeOnSelect: behavior(
      "data-ok-close-on-select",
      true,
      "Picking the end closes the picker. Default: on for desktop date ranges, off otherwise (absent attribute).",
    ),
    disableDragEditing: flag(
      "data-ok-disable-drag-editing",
      "The range's start and end can't be dragged to other days.",
    ),
    valueType: valueTypeOption,
    open: state("data-ok-open", "Open state (`open` / `onOpenChange`).", "open"),
  },
);

export interface DateRangePickerAnatomyOptions {
  pickerVariant?: (typeof pickerVariantValues)[number] | undefined;
  displayStaticWrapperAs?: PickerStaticWrapper | undefined;
  calendars?: 1 | 2 | 3 | (typeof pickerCalendarCounts)[number] | undefined;
  disableDragEditing?: boolean | undefined;
  valueType?: (typeof pickerValueTypes)[number] | undefined;
}

/** `data-ok-*` attributes of a date range picker root. */
export const dateRangePickerAttributes = (
  options: DateRangePickerAnatomyOptions = {},
): DataAttributes =>
  optionAttributes(dateRangePickerOptions, {
    ...options,
    calendars: options.calendars === undefined ? undefined : String(options.calendars),
  });

/** Every component's option schema, for tooling (Storybook Controls, parity tests, docs). */
