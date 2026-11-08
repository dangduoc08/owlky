import { dateCalendarOptions } from "@owlky/core";
import {
  DateCalendar,
  DateField,
  DatePicker,
  DesktopDatePicker,
  LocalizationProvider,
  MobileDatePicker,
  MonthCalendar,
  StaticDatePicker,
  YearCalendar,
} from "@owlky/react";
import type { ReactGroup } from "../../helpers/groups.js";
import type { GroupFiles } from "../shared/snippets.js";

/** The demos' date: Sunday 25 May 2025 (fixed, so screenshots don't change every day). */
const VALUE = new Date(2025, 4, 25);

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
  localization: [
    ["Vietnamese", "vietnamese"],
    ["Landscape", "landscape"],
  ],
};

/** Story Controls of the Calendars story, shared by React and HTML (ADR-0015). */
export const DATE_CALENDAR_CONTROLS = {
  schema: dateCalendarOptions,
  keys: ["displayWeekNumber", "showDaysOutsideCurrentMonth", "disableHighlightToday", "yearsOrder"],
} as const;
