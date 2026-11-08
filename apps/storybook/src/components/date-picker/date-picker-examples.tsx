import {
  addDays,
  addMonths,
  dateCalendarOptions,
  dateRangeCalendarOptions,
  startOfMonth,
  startOfWeek,
  timeClockOptions,
} from "@owlky/core";
import {
  DateCalendar,
  DateField,
  DatePicker,
  type DateRange,
  DateRangeCalendar,
  DateRangePicker,
  DateTimeField,
  DateTimePicker,
  DateTimeRangePicker,
  DesktopDatePicker,
  DesktopDateRangePicker,
  DesktopDateTimePicker,
  DesktopTimePicker,
  DigitalClock,
  LocalizationProvider,
  MobileDatePicker,
  MobileDateRangePicker,
  MobileDateTimePicker,
  MobileDateTimeRangePicker,
  MobileTimePicker,
  MobileTimeRangePicker,
  MonthCalendar,
  MultiInputDateRangeField,
  MultiInputDateTimeRangeField,
  MultiInputTimeRangeField,
  MultiSectionDigitalClock,
  type RangeShortcut,
  SingleInputDateRangeField,
  SingleInputDateTimeRangeField,
  SingleInputTimeRangeField,
  StaticDatePicker,
  StaticDateRangePicker,
  StaticDateTimePicker,
  StaticTimePicker,
  TimeClock,
  TimeField,
  TimePicker,
  TimeRangePicker,
  YearCalendar,
} from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import type { GroupFiles } from "../shared/snippets.js";

/** The demos' date: Sunday 25 May 2025 (fixed, so screenshots don't change every day). */
const VALUE = new Date(2025, 4, 25);
/** The demos' time: 09:30 on the same day. */
const TIME = new Date(2025, 4, 25, 9, 30);
const at = (hours: number, minutes = 0) => new Date(2025, 4, 25, hours, minutes);

/** Shortcut chips with fixed dates (demo data). */
const SHORTCUTS = [
  { label: "Christmas 2025", getValue: () => new Date(2025, 11, 25) },
  { label: "New Year 2026", getValue: () => new Date(2026, 0, 1) },
  { label: "Mid-year 2026", getValue: () => new Date(2026, 5, 30) },
];

/** The demos' range: 20 to 25 May 2025 (the reference shows a start of 20 May 2025). */
const RANGE: DateRange = [new Date(2025, 4, 20), new Date(2025, 4, 25)];
/** A working day, 09:00 AM to 05:30 PM. */
const HOURS: DateRange = [at(9), at(17, 30)];
/** A two-day event with times. */
const EVENT: DateRange = [at(10), new Date(2025, 4, 27, 16)];

/**
 * Dashboard filter shortcuts, relative to the demos' "today" (Sunday 25 May 2025) so the stories
 * never change. Real apps compute them from `new Date()` (see the docs page).
 */
const DEMO_TODAY = VALUE;
const RANGE_SHORTCUTS: RangeShortcut[] = [
  {
    label: "This week",
    getValue: () => [startOfWeek(DEMO_TODAY, 0), addDays(startOfWeek(DEMO_TODAY, 0), 6)],
  },
  {
    label: "Last week",
    getValue: () => [
      addDays(startOfWeek(DEMO_TODAY, 0), -7),
      addDays(startOfWeek(DEMO_TODAY, 0), -1),
    ],
  },
  { label: "Last 7 days", getValue: () => [addDays(DEMO_TODAY, -6), DEMO_TODAY] },
  {
    label: "Current month",
    getValue: () => [startOfMonth(DEMO_TODAY), addDays(startOfMonth(addMonths(DEMO_TODAY, 1)), -1)],
  },
  {
    label: "Next month",
    getValue: () => [
      startOfMonth(addMonths(DEMO_TODAY, 1)),
      addDays(startOfMonth(addMonths(DEMO_TODAY, 2)), -1),
    ],
  },
  { label: "Reset", getValue: () => [null, null] },
];

/**
 * Story groups — the same examples as `packages/html/src/components/date-picker/examples/`. The
 * `div.sb-date-pickers` wrappers are story-only demo markup (a column, as on the reference page).
 */
export const datePickerStories: Record<string, ReactGroup[]> = {
  date: [
    {
      title: "Basic",
      content: (
        <div className="sb-date-pickers">
          <DatePicker id="dp-basic" label="Date picker" defaultValue={VALUE} />
          <DesktopDatePicker id="dp-desktop" label="Desktop date picker" defaultValue={VALUE} />
          <MobileDatePicker id="dp-mobile" label="Mobile date picker" defaultValue={VALUE} />
          <DateField id="dp-field" label="Date field" defaultValue={VALUE} />
        </div>
      ),
    },
    {
      title: "Playground",
      content: (
        <div className="sb-date-pickers">
          <DatePicker
            id="dp-ymd"
            label="Year, month and day"
            views={["year", "month", "day"]}
            defaultValue={VALUE}
          />
          <DatePicker
            id="dp-my"
            label="Month and year"
            views={["month", "year"]}
            defaultValue={VALUE}
          />
          <DatePicker id="dp-day" label="Day" views={["day"]} defaultValue={VALUE} />
        </div>
      ),
    },
    {
      title: "Static mode",
      content: <StaticDatePicker id="dp-static" defaultValue={VALUE} />,
    },
  ],
  calendars: [
    {
      title: "Date calendar",
      content: <DateCalendar id="dc-basic" defaultValue={VALUE} />,
    },
    {
      title: "Week numbers and other months",
      content: (
        <DateCalendar
          id="dc-weeks"
          defaultValue={VALUE}
          displayWeekNumber
          showDaysOutsideCurrentMonth
          fixedWeekNumber={6}
        />
      ),
    },
    {
      title: "Month and year calendars",
      content: (
        <div className="sb-date-pickers">
          <MonthCalendar aria-label="Month" defaultValue={VALUE} />
          <YearCalendar
            aria-label="Year"
            defaultValue={VALUE}
            minDate={new Date(2020, 0, 1)}
            maxDate={new Date(2031, 11, 31)}
          />
        </div>
      ),
    },
  ],
  validation: [
    {
      title: "Limits",
      content: (
        <DateCalendar
          id="dv-limits"
          defaultValue={VALUE}
          minDate={new Date(2025, 4, 10)}
          maxDate={new Date(2025, 5, 20)}
        />
      ),
    },
    {
      title: "Past and future",
      content: (
        <div className="sb-date-pickers">
          <DatePicker
            id="dv-past"
            label="Disable past"
            disablePast
            defaultValue={VALUE}
            helperText="The date is in the past"
          />
          <DatePicker id="dv-future" label="Disable future" disableFuture defaultValue={VALUE} />
        </div>
      ),
    },
    {
      title: "States",
      content: (
        <div className="sb-date-pickers">
          <DatePicker id="dv-disabled" label="Disabled" disabled defaultValue={VALUE} />
          <DatePicker id="dv-read-only" label="Read only" readOnly defaultValue={VALUE} />
          <DateField id="dv-clearable" label="Clearable" clearable defaultValue={VALUE} />
        </div>
      ),
    },
  ],
  shortcuts: [
    {
      title: "Shortcuts and actions",
      content: (
        <StaticDatePicker
          id="ds-shortcuts"
          defaultValue={VALUE}
          shortcuts={SHORTCUTS}
          actions={["clear", "today", "cancel", "accept"]}
        />
      ),
    },
  ],
  time: [
    {
      title: "Basic",
      content: (
        <div className="sb-date-pickers">
          <TimePicker id="tp-basic" label="Time picker" defaultValue={TIME} />
          <DesktopTimePicker id="tp-desktop" label="Desktop time picker" defaultValue={TIME} />
          <MobileTimePicker id="tp-mobile" label="Mobile time picker" defaultValue={TIME} />
          <TimeField id="tp-field" label="Time field" defaultValue={TIME} />
        </div>
      ),
    },
    {
      title: "Views playground",
      content: (
        <div className="sb-date-pickers">
          <TimePicker id="tp-12" label="12 hours" ampm defaultValue={TIME} />
          <TimePicker id="tp-24" label="24 hours" ampm={false} defaultValue={TIME} />
          <TimePicker
            id="tp-hms"
            label="Hours, minutes and seconds"
            views={["hours", "minutes", "seconds"]}
            defaultValue={TIME}
          />
          <TimePicker
            id="tp-ms"
            label="Minutes and seconds"
            views={["minutes", "seconds"]}
            defaultValue={TIME}
          />
          <TimePicker id="tp-h" label="Hours" views={["hours"]} defaultValue={TIME} />
        </div>
      ),
    },
    {
      title: "Static mode",
      content: (
        <div className="sb-date-pickers-static">
          <StaticTimePicker id="tp-static" defaultValue={TIME} />
          <StaticTimePicker
            id="tp-static-landscape"
            orientation="landscape"
            openTo="minutes"
            defaultValue={TIME}
          />
        </div>
      ),
    },
  ],
  "date-time": [
    {
      title: "Basic",
      content: (
        <div className="sb-date-pickers">
          <DateTimePicker id="dtp-basic" label="Date time picker" defaultValue={TIME} />
          <DesktopDateTimePicker
            id="dtp-desktop"
            label="Desktop date time picker"
            defaultValue={TIME}
          />
          <MobileDateTimePicker
            id="dtp-mobile"
            label="Mobile date time picker"
            defaultValue={TIME}
          />
          <DateTimeField id="dtp-field" label="Date time field" defaultValue={TIME} />
        </div>
      ),
    },
    {
      title: "Views playground",
      content: (
        <div className="sb-date-pickers">
          <DateTimePicker
            id="dtp-all"
            label="Year, month, day, hours, minutes and seconds"
            views={["year", "month", "day", "hours", "minutes", "seconds"]}
            defaultValue={TIME}
          />
          <DateTimePicker
            id="dtp-ydhms"
            label="Year, day, hours, minutes, seconds"
            views={["year", "day", "hours", "minutes", "seconds"]}
            defaultValue={TIME}
          />
          <DateTimePicker
            id="dtp-dh"
            label="Day, hours"
            views={["day", "hours"]}
            defaultValue={TIME}
          />
          <DateTimePicker id="dtp-disabled" label="Disabled" disabled defaultValue={TIME} />
          <DateTimePicker id="dtp-read-only" label="Read only" readOnly defaultValue={TIME} />
          <DateTimePicker
            id="dtp-error"
            label="Error"
            minDateTime={at(10)}
            defaultValue={TIME}
            helperText="Pick a time after 10:00 AM"
          />
        </div>
      ),
    },
    {
      title: "Static mode",
      content: (
        <div className="sb-date-pickers-static">
          <StaticDateTimePicker id="dtp-static" defaultValue={TIME} />
          <StaticDateTimePicker
            id="dtp-static-landscape"
            orientation="landscape"
            defaultValue={TIME}
          />
        </div>
      ),
    },
  ],
  clocks: [
    {
      title: "Time clock",
      content: <TimeClock id="tc-basic" defaultValue={TIME} />,
    },
    {
      title: "Digital clocks",
      content: (
        <div className="sb-date-pickers-row">
          <DigitalClock id="tc-digital" aria-label="Meeting time" defaultValue={TIME} />
          <MultiSectionDigitalClock
            id="tc-multi"
            aria-label="Alarm"
            views={["hours", "minutes", "seconds"]}
            defaultValue={TIME}
          />
        </div>
      ),
    },
  ],
  "time-validation": [
    {
      title: "Time limits and steps",
      content: (
        <div className="sb-date-pickers">
          <TimePicker
            id="tv-limits"
            label="Office hours"
            minTime={at(9)}
            maxTime={at(17, 30)}
            defaultValue={at(18)}
            helperText="Between 09:00 AM and 05:30 PM"
          />
          <TimePicker
            id="tv-step"
            label="Every quarter hour"
            minutesStep={15}
            timeSteps={{ minutes: 15 }}
            defaultValue={TIME}
          />
          <DateTimePicker
            id="tv-date-time"
            label="From 25 May, 10:00 AM"
            minDateTime={at(10)}
            maxDateTime={new Date(2025, 5, 30, 18)}
            defaultValue={at(11)}
          />
        </div>
      ),
    },
    {
      title: "Skip disabled",
      content: (
        <div className="sb-date-pickers-row">
          <DigitalClock
            id="tv-digital"
            aria-label="Appointment"
            minTime={at(9)}
            maxTime={at(17)}
            skipDisabled
            defaultValue={TIME}
          />
          <MultiSectionDigitalClock
            id="tv-multi"
            aria-label="Shift start"
            ampm={false}
            minTime={at(8)}
            maxTime={at(20)}
            timeSteps={{ minutes: 15 }}
            skipDisabled
            defaultValue={TIME}
          />
        </div>
      ),
    },
  ],
  range: [
    {
      title: "Input",
      content: (
        <div className="sb-date-ranges">
          <DateRangePicker id="dr-basic" label="Date range picker" defaultValue={RANGE} />
          <DateRangePicker
            id="dr-multi"
            multiInput
            startLabel="Start date"
            endLabel="End date"
            defaultValue={RANGE}
          />
          <MobileDateRangePicker
            id="dr-mobile"
            label="Mobile date range picker"
            defaultValue={RANGE}
          />
        </div>
      ),
    },
    {
      title: "Calendar",
      content: <DateRangeCalendar id="dr-calendar" defaultValue={RANGE} />,
    },
    {
      title: "Static mode",
      content: <StaticDateRangePicker id="dr-static" defaultValue={RANGE} />,
    },
  ],
  "range-fields": [
    {
      title: "Single input",
      content: (
        <div className="sb-date-ranges">
          <SingleInputDateRangeField id="rf-date" label="Date range" defaultValue={RANGE} />
          <SingleInputTimeRangeField id="rf-time" label="Time range" defaultValue={HOURS} />
          <SingleInputDateTimeRangeField
            id="rf-date-time"
            label="Date time range"
            defaultValue={EVENT}
            fullWidth
          />
        </div>
      ),
    },
    {
      title: "Multi input",
      content: (
        <div className="sb-date-ranges">
          <MultiInputDateRangeField id="rf-multi-date" defaultValue={RANGE} />
          <MultiInputTimeRangeField id="rf-multi-time" defaultValue={HOURS} />
          <MultiInputDateTimeRangeField id="rf-multi-date-time" defaultValue={EVENT} fullWidth />
        </div>
      ),
    },
  ],
  "range-calendars": [
    {
      title: "Three months and week numbers",
      content: (
        <DateRangeCalendar id="rc-three" calendars={3} displayWeekNumber defaultValue={RANGE} />
      ),
    },
    {
      title: "One month and days outside it",
      content: (
        <DateRangeCalendar
          id="rc-one"
          calendars={1}
          showDaysOutsideCurrentMonth
          fixedWeekNumber={6}
          defaultValue={RANGE}
        />
      ),
    },
  ],
  "time-ranges": [
    {
      title: "Time range",
      content: (
        <div className="sb-date-pickers">
          <TimeRangePicker id="tr-basic" label="Time range picker" defaultValue={HOURS} />
          <TimeRangePicker
            id="tr-multi"
            multiInput
            startLabel="Opens"
            endLabel="Closes"
            defaultValue={HOURS}
          />
          <MobileTimeRangePicker
            id="tr-mobile"
            label="Mobile time range picker"
            defaultValue={HOURS}
          />
        </div>
      ),
    },
    {
      title: "Date time range",
      content: (
        <div className="sb-date-ranges">
          <DateTimeRangePicker id="dtr-basic" label="Date time range picker" defaultValue={EVENT} />
          <MobileDateTimeRangePicker
            id="dtr-mobile"
            label="Mobile date time range picker"
            defaultValue={EVENT}
          />
        </div>
      ),
    },
  ],
  "range-shortcuts": [
    {
      title: "Dashboard filter",
      content: (
        <StaticDateRangePicker
          id="rs-filter"
          shortcuts={RANGE_SHORTCUTS}
          actions={[]}
          calendars={2}
          defaultValue={RANGE}
        />
      ),
    },
    {
      title: "Filter field",
      content: (
        <div className="sb-date-pickers">
          <DesktopDateRangePicker
            id="rs-field"
            label="Report period"
            shortcuts={RANGE_SHORTCUTS}
            clearable
            defaultValue={RANGE}
          />
        </div>
      ),
    },
  ],
  localization: [
    {
      title: "Vietnamese",
      content: (
        <LocalizationProvider adapterLocale="vi-VN">
          <div className="sb-date-pickers">
            <DatePicker id="dl-vi" label="Ngày sinh" defaultValue={VALUE} />
            <DateField
              id="dl-vi-field"
              label="Tháng và năm"
              format="MMMM YYYY"
              defaultValue={VALUE}
            />
          </div>
        </LocalizationProvider>
      ),
    },
    {
      title: "Landscape",
      content: (
        <LocalizationProvider adapterLocale="vi-VN">
          <StaticDatePicker
            id="dl-landscape"
            orientation="landscape"
            displayWeekNumber
            defaultValue={VALUE}
          />
        </LocalizationProvider>
      ),
    },
  ],
};

export const DATE_PICKER_FILES: Record<string, GroupFiles> = {
  date: [
    ["Basic", "basic"],
    ["Playground", "playground"],
    ["Static mode", "static"],
  ],
  calendars: [
    ["Date calendar", "basic"],
    ["Week numbers and other months", "weeks"],
    ["Month and year calendars", "lists"],
  ],
  validation: [
    ["Limits", "limits"],
    ["Past and future", "past-future"],
    ["States", "states"],
  ],
  shortcuts: [["Shortcuts and actions", "actions"]],
  time: [
    ["Basic", "basic"],
    ["Views playground", "playground"],
    ["Static mode", "static"],
  ],
  "date-time": [
    ["Basic", "basic"],
    ["Views playground", "playground"],
    ["Static mode", "static"],
  ],
  clocks: [
    ["Time clock", "time-clock"],
    ["Digital clocks", "digital"],
  ],
  "time-validation": [
    ["Time limits and steps", "limits"],
    ["Skip disabled", "skip-disabled"],
  ],
  range: [
    ["Input", "input"],
    ["Calendar", "calendar"],
    ["Static mode", "static"],
  ],
  "range-fields": [
    ["Single input", "single"],
    ["Multi input", "multi"],
  ],
  "range-calendars": [
    ["Three months and week numbers", "three"],
    ["One month and days outside it", "one"],
  ],
  "time-ranges": [
    ["Time range", "time"],
    ["Date time range", "date-time"],
  ],
  "range-shortcuts": [
    ["Dashboard filter", "filter"],
    ["Filter field", "field"],
  ],
  localization: [
    ["Vietnamese", "vietnamese"],
    ["Landscape", "landscape"],
  ],
};

/** Story Controls of the Clocks story (the time clock), shared by React and HTML (ADR-0015). */
export const TIME_CLOCK_CONTROLS = {
  schema: timeClockOptions,
  keys: ["readOnly"],
} as const;

/** Story Controls of the Calendars story, shared by React and HTML (ADR-0015). */
export const DATE_CALENDAR_CONTROLS = {
  schema: dateCalendarOptions,
  keys: ["displayWeekNumber", "showDaysOutsideCurrentMonth", "disableHighlightToday", "yearsOrder"],
} as const;

/** Story Controls of the Range calendars story, shared by React and HTML (ADR-0015). */
export const DATE_RANGE_CALENDAR_CONTROLS = {
  schema: dateRangeCalendarOptions,
  keys: ["disableDragEditing", "disableAutoMonthSwitching", "disableHighlightToday"],
} as const;
