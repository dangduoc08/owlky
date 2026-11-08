import { dateCalendarOptions, timeClockOptions } from "@owlky/core";
import {
  DateCalendar,
  DateField,
  DatePicker,
  DateTimeField,
  DateTimePicker,
  DesktopDatePicker,
  DesktopDateTimePicker,
  DesktopTimePicker,
  DigitalClock,
  LocalizationProvider,
  MobileDatePicker,
  MobileDateTimePicker,
  MobileTimePicker,
  MonthCalendar,
  MultiSectionDigitalClock,
  StaticDatePicker,
  StaticDateTimePicker,
  StaticTimePicker,
  TimeClock,
  TimeField,
  TimePicker,
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
