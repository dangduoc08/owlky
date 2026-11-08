import {
  dateCalendarOptions,
  dateFieldOptions,
  datePickerOptions,
  dateRangeCalendarOptions,
  dateRangePickerOptions,
  digitalClockOptions,
  multiSectionDigitalClockOptions,
  timeClockOptions,
} from "@owlky/core";
import {
  DateField,
  DatePicker,
  DateRangePicker,
  LocalizationProvider,
  StaticDatePicker,
  StaticDateRangePicker,
  StaticDateTimePicker,
  TimeField,
  TimePicker,
  TimeRangePicker,
} from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

const VALUE = new Date(2025, 4, 25);
const TIME = new Date(2025, 4, 25, 9, 30);
const RANGE: [Date, Date] = [new Date(2025, 4, 20), new Date(2025, 4, 25)];

export const datePickerSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "Date pickers let people type a date, a time or both, or pick them from a calendar and clocks. The field splits the value into sections, such as month, day, year, hours and minutes. People edit each section with the keyboard, and screen readers announce it as a spin button. The calendar and the clocks open in a popover on devices with a mouse, and in a dialog on touch screens. A static picker shows them inline. The pickers are built from components you already know: a **TextField**, **IconButtons**, **Buttons**, **Chips**, **Tabs**, a **Popover** and a **Dialog**.",
    html: `<!-- Load once per page: the styles and the runtime -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

<!-- Copy the full markup from the "Date" story's code panel. Its parts: -->
<div data-ok-date-picker data-ok-picker-variant="responsive" data-ok-orientation="portrait">
  <div data-ok-text-field … data-ok-date-field data-ok-format="MM/DD/YYYY" data-ok-value="2025-05-25">
    …label, the spinbutton sections, a hidden input and the open button…
  </div>
  <div popover="manual" data-ok-popover data-ok-date-picker-paper role="dialog" aria-label="Select date" …>
    <div data-ok-picker-layout>…toolbar, calendar and actions…</div>
  </div>
  <dialog data-ok-dialog data-ok-date-picker-dialog aria-label="Select date" …>
    <div data-ok-dialog-paper></div>
  </dialog>
</div>`,
    react: `import { DatePicker } from "@owlky/react";

export function BirthdayField() {
  return <DatePicker label="Birthday" defaultValue={new Date(2025, 4, 25)} />;
}`,
  },
  {
    id: "values",
    title: "Read and write values",
    body: `In React, a value is a \`Date\` or \`null\`. While the field is only partly filled, the value is an invalid date, and \`onChange\` reports \`validationError: "invalidDate"\`. In HTML, values are ISO 8601 strings, such as \`2025-05-25\`, in \`data-ok-value\` and in the events.

Set \`name\` to submit the value with a form. A hidden input carries the ISO date, so the server always gets the same format, whatever the locale shows.`,
    react: `import { DatePicker } from "@owlky/react";
import { useState } from "react";

export function DueDate() {
  const [value, setValue] = useState<Date | null>(null);
  return (
    <DatePicker
      label="Due date"
      name="due"
      value={value}
      onChange={(next, { validationError }) => {
        if (validationError === null) setValue(next);
      }}
    />
  );
}`,
  },
  {
    id: "forms",
    title: "Choose desktop, mobile or static",
    body: `- **\`DatePicker\`:** a popover on devices with a precise pointer and a dialog on touch screens. It decides when it opens, with \`desktopModeMediaQuery\` (default \`@media (pointer: fine)\`).
- **\`DesktopDatePicker\`:** always a popover. Picking a day closes it.
- **\`MobileDatePicker\`:** always a dialog, with a toolbar and **Cancel** and **OK** buttons.
- **\`StaticDatePicker\`:** the toolbar, the calendar and the buttons inline, without a field.
- **\`DateField\`** and **\`DateCalendar\`:** the field or the calendar on their own.

In HTML, \`data-ok-picker-variant\` picks the form: \`responsive\`, \`desktop\`, \`mobile\` or \`static\`.`,
    react: `<DesktopDatePicker label="Start" />
<MobileDatePicker label="End" />
<StaticDatePicker defaultValue={new Date(2025, 4, 25)} />`,
  },
  {
    id: "views",
    title: "Pick years, months and days",
    body: `\`views\` sets what people pick, from \`year\`, \`month\` and \`day\`. The default is \`["year", "day"]\`. The header's switch button opens the year view, and picking a year moves on to the next view. \`openTo\` sets the first view. The field's format follows the views: \`["month", "year"]\` shows "May 2025", and \`["day"]\` shows "25". Set \`format\` with Day.js tokens, such as \`DD/MM/YYYY\`, to choose another one. Text in square brackets is literal.`,
    react: `<DatePicker label="Month and year" views={["month", "year"]} />
<DatePicker label="Day" views={["day"]} />
<DateField label="Date" format="DD.MM.YYYY" />`,
  },
  {
    id: "calendar",
    title: "Change the calendar",
    body: "`displayWeekNumber` adds a week number column. `showDaysOutsideCurrentMonth` fills the first and last weeks with days of the other months. `fixedWeekNumber={6}` keeps six rows, so the height never changes. `monthsPerRow`, `yearsPerRow` and `yearsOrder` lay out the month and year views. `MonthCalendar` and `YearCalendar` show those views on their own.",
  },
  {
    id: "actions",
    title: "Add actions and shortcuts",
    body: `\`actions\` sets the buttons under the calendar: \`clear\`, \`today\`, \`cancel\`, \`accept\` and \`nextOrAccept\`. Desktop pickers have none by default, because picking a day accepts it. \`shortcuts\` adds chips that set a value and close the picker. Each shortcut has a \`label\` and a \`getValue\` function. In HTML, give each shortcut chip a fixed \`data-ok-value\`, or call \`setShortcuts()\` on the instance for computed dates.`,
    react: `<StaticDatePicker
  actions={["clear", "today", "cancel", "accept"]}
  shortcuts={[
    { label: "Christmas", getValue: () => new Date(2025, 11, 25) },
    { label: "New Year", getValue: () => new Date(2026, 0, 1) },
  ]}
/>`,
  },
  {
    id: "validation",
    title: "Validate dates",
    body: `\`minDate\` and \`maxDate\` limit the range (by default, 1 January 1900 to 31 December 2099). \`disablePast\` and \`disableFuture\` compare with today. \`shouldDisableDate\`, \`shouldDisableMonth\` and \`shouldDisableYear\` disable more dates with a function. In HTML, set these functions with the instance methods of the same name, because functions have no attribute. The calendar disables the days people can't pick. The field shows an error when its value breaks a rule, and \`onError\` (HTML: \`validationError\` in the events) tells you which rule.`,
    react: `<DatePicker
  label="Appointment"
  minDate={new Date(2025, 4, 10)}
  maxDate={new Date(2025, 5, 20)}
  shouldDisableDate={(day) => day.getDay() === 0 || day.getDay() === 6}
  onError={(error) => console.warn(error)}
/>`,
  },
  {
    id: "time",
    title: "Pick a time",
    body: `\`TimePicker\` edits a time. On devices with a mouse it opens digital clocks: one column per view, plus AM and PM. On touch screens it opens a dialog with an analog clock: press or drag the hand, and the release moves on to the minutes. \`DesktopTimePicker\`, \`MobileTimePicker\` and \`StaticTimePicker\` always use one form. \`TimeField\`, \`TimeClock\`, \`DigitalClock\` and \`MultiSectionDigitalClock\` work on their own too.

- **\`ampm\`:** a 12-hour clock with AM and PM. The default follows the locale: English uses 12 hours, Vietnamese uses 24 hours.
- **\`views\`:** what people pick, from \`hours\`, \`minutes\` and \`seconds\`. The default is \`["hours", "minutes"]\`, and the field's format follows the views.
- **\`timeSteps\`:** the distance between the digital clock's options, such as \`{ minutes: 15 }\`. When a day holds 24 options or fewer, the desktop form shows one list instead of columns.

Time pickers stay open after a pick, so people can change every part. **OK** accepts the time and **Cancel** restores the one from opening. In HTML, the value is an ISO time, such as \`09:30:00\`.`,
    html: `<!-- Copy the full markup from the "Time" story's code panel. Its root: -->
<div data-ok-date-picker data-ok-picker-variant="responsive" data-ok-value-type="time">
  <div data-ok-text-field … data-ok-date-field data-ok-value-type="time" data-ok-format="hh:mm A" data-ok-value="09:30:00">
    …the hours, minutes and AM/PM sections…
  </div>
  …the popover with the digital clocks, the dialog with the analog clock…
</div>`,
    react: `import { TimePicker } from "@owlky/react";

export function Alarm() {
  return (
    <TimePicker
      label="Alarm"
      views={["hours", "minutes", "seconds"]}
      timeSteps={{ minutes: 1, seconds: 15 }}
    />
  );
}`,
  },
  {
    id: "date-time",
    title: "Pick a date and time",
    body: `\`DateTimePicker\` edits a date and a time in one field. On devices with a mouse, the popover shows the calendar beside the digital clocks, and a picked day keeps the time. On touch screens, the dialog shows a toolbar, **date** and **time** tabs, the calendar and then the analog clock. **Next** moves to the next view, and **OK** accepts the value on the last one. \`views\` mixes date and time views, such as \`["day", "hours"]\`. In HTML, the value is an ISO date and time, such as \`2025-05-25T09:30:00\`.`,
    react: `<DateTimePicker label="Meeting" />
<MobileDateTimePicker label="Departure" views={["year", "day", "hours", "minutes"]} />
<StaticDateTimePicker orientation="landscape" />`,
  },
  {
    id: "time-validation",
    title: "Validate times",
    body: `\`minTime\` and \`maxTime\` limit the time of day. The date part doesn't count, unless you set \`disableIgnoringDatePartForTimeValidation\`. Date time pickers also take \`minDateTime\` and \`maxDateTime\`. \`minutesStep\` accepts only multiples of a number of minutes. \`shouldDisableTime(value, view)\` disables more times with a function. In HTML, call \`setShouldDisableTime()\` on the instance. \`disablePast\` and \`disableFuture\` compare with the current time. The clocks disable the options that break a rule, and \`skipDisabled\` leaves them out of the digital clocks.`,
    react: `<TimePicker
  label="Office hours"
  minTime={new Date(2025, 4, 25, 9)}
  maxTime={new Date(2025, 4, 25, 17, 30)}
  minutesStep={15}
  timeSteps={{ minutes: 15 }}
  skipDisabled
/>`,
  },
  {
    id: "range",
    title: "Pick a date range",
    body: `\`DateRangePicker\` edits a start and an end date. On devices with a mouse it opens two months side by side in a popover. On touch screens it opens a dialog with one month and a toolbar that shows both ends. The first pick sets the start, the second one sets the end, and a day before the start starts again. While you move the pointer, a dashed outline previews the range. Drag the start or the end to another day to move it, with a mouse or a finger. \`DesktopDateRangePicker\`, \`MobileDateRangePicker\` and \`StaticDateRangePicker\` always use one form, and \`DateRangeCalendar\` works on its own.

- **\`multiInput\`:** two fields, the start and the end, instead of one. Each field's button opens the picker on its end.
- **\`calendars\`:** the number of months in the popover, from 1 to 3. The dialog and the inline form show one month unless you set it.
- **\`rangePosition\`:** the end the next pick edits, \`start\` or \`end\`. Read it with \`onRangePositionChange\`, or set it to edit one end.
- **\`disableDragEditing\`** and **\`disableAutoMonthSwitching\`:** turn off dragging the ends, and the jump to the end's month after a new start.

The value is a pair, \`[start, end]\`, and either side can be empty. An end before the start is invalid: both sides report \`invalidRange\`. In HTML, the value is an ISO 8601 interval, such as \`2025-05-20/2025-05-25\`, and the hidden input of a single field submits it.`,
    html: `<!-- Copy the full markup from the "Range" story's code panel. Its root: -->
<div data-ok-date-range-picker data-ok-picker-variant="responsive">
  <div data-ok-text-field … data-ok-date-field data-ok-range data-ok-format="MM/DD/YYYY" data-ok-value="2025-05-20/2025-05-25">
    …the start's and the end's sections, a hidden input and the open button…
  </div>
  …the popover with two months, the dialog with the toolbar and one month…
</div>`,
    react: `import { DateRangePicker, type DateRange } from "@owlky/react";
import { useState } from "react";

export function StayDates() {
  const [stay, setStay] = useState<DateRange>([null, null]);
  return (
    <DateRangePicker
      multiInput
      startLabel="Check-in"
      endLabel="Check-out"
      disablePast
      value={stay}
      onChange={(value) => setStay(value)}
    />
  );
}`,
  },
  {
    id: "range-shortcuts",
    title: "Filter a dashboard by date range",
    body: `Range shortcuts set both ends with one press, such as **Last 7 days** or **Current month**. Each shortcut has a \`label\` and a \`getValue\` function that returns the range. Compute the dates when the function runs, so the shortcuts stay right on the next day. \`getValue\` receives \`isValid(range)\`, which tells whether a range passes the picker's rules. Shortcuts that return an invalid range are disabled. A shortcut accepts its range and closes the picker. In HTML, each chip carries its range in \`data-ok-value\`, or you set functions with \`setShortcuts()\` on the instance.`,
    html: `<!-- Chips with fixed ranges; an empty interval ("/") resets the filter -->
<ul data-ok-picker-shortcuts aria-label="Shortcuts">
  <li><span data-ok-chip … data-ok-picker-shortcut data-ok-value="2025-05-19/2025-05-25">…Last 7 days…</span></li>
  <li><span data-ok-chip … data-ok-picker-shortcut data-ok-value="/">…Reset…</span></li>
</ul>

<script type="module">
  // Shortcuts computed from today, set on the picker's instance (Owlky is the CDN runtime).
  const picker = Owlky.get(document.querySelector("#report [data-ok-date-range-picker]"), "date-range-picker");
  const day = (offset) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + offset); return d; };
  picker.setShortcuts([
    { label: "Last 7 days", getValue: () => [day(-6), day(0)] },
    { label: "Reset", getValue: () => [null, null] },
  ]);
</script>`,
    react: `import { DateRangePicker, type RangeShortcut } from "@owlky/react";

/** A day relative to today, at midnight. */
const day = (offset: number) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date;
};

const SHORTCUTS: RangeShortcut[] = [
  { label: "Last 7 days", getValue: () => [day(-6), day(0)] },
  { label: "Last 30 days", getValue: () => [day(-29), day(0)] },
  {
    label: "This month",
    getValue: () => {
      const first = day(0);
      first.setDate(1);
      return [first, day(0)];
    },
  },
  { label: "Reset", getValue: () => [null, null] },
];

export function ReportPeriod() {
  return <DateRangePicker label="Report period" shortcuts={SHORTCUTS} disableFuture />;
}`,
  },
  {
    id: "time-range",
    title: "Pick a time or date time range",
    body: `\`TimeRangePicker\` edits a start and an end time, and \`DateTimeRangePicker\` a start and an end date with times. **Start** and **End** tabs pick the edited end. On devices with a mouse, the popover shows digital clocks, beside one month for date times. On touch screens, the dialog shows the analog clock, after the calendar for date times. Finishing the start's last view moves on to the end. **OK** accepts the range and **Cancel** restores the one from opening. The fields work on their own as \`SingleInputTimeRangeField\`, \`MultiInputTimeRangeField\`, \`SingleInputDateTimeRangeField\` and \`MultiInputDateTimeRangeField\`. In HTML, the value is an interval of ISO times, such as \`09:00:00/17:30:00\`.`,
    react: `<TimeRangePicker label="Opening hours" minutesStep={15} timeSteps={{ minutes: 15 }} />
<DateTimeRangePicker label="Event" disablePast />
<MultiInputDateRangeField startLabel="From" endLabel="To" />`,
  },
  {
    id: "localization",
    title: "Translate and localize",
    body: `\`LocalizationProvider\` sets the locale of the pickers inside, with \`adapterLocale\`. The locale decides the field's section order, the month and weekday names and the first day of the week. Owlky includes English and Vietnamese texts. Pass \`localeText\` to translate other texts or change a few. In HTML, set \`data-ok-locale\` on the picker or on any ancestor, such as \`<html>\`.`,
    html: `<!-- Every picker inside uses Vietnamese names and the day/month/year order -->
<section data-ok-locale="vi-VN">
  …date pickers…
</section>`,
    react: `import { DatePicker, LocalizationProvider } from "@owlky/react";

export function VietnameseForm() {
  return (
    <LocalizationProvider adapterLocale="vi-VN" localeText={{ okButtonLabel: "Xong" }}>
      <DatePicker label="Ngày sinh" />
    </LocalizationProvider>
  );
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. Values that aren't listed fall back to the default. Pickers pass the field and calendar options on to their field and calendar.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set values, rules and texts. They aren't options, because HTML writes them as markup or sets them with instance methods.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:date-picker:change\`** fires on every change with \`detail.value\` (ISO or \`null\`) and \`detail.validationError\`. **\`ok:date-picker:accept\`** fires when a value is accepted.
- **\`ok:date-picker:open\`** and **\`ok:date-picker:close\`** fire with \`detail.reason\`, such as \`button\`, \`escape\`, \`select\` or \`cancel\`.
- **\`ok:date-field:change\`** and **\`ok:date-calendar:change\`** (cancelable) fire for a field or a calendar on its own. The calendar also fires \`viewchange\`, \`monthchange\` and \`yearchange\`.
- **\`ok:time-clock:change\`**, **\`ok:digital-clock:change\`** and **\`ok:multi-section-digital-clock:change\`** (cancelable) fire for a clock on its own, with \`detail.value\` (an ISO time) and \`detail.selectionState\`: \`shallow\` while dragging the hand, \`partial\` when another view follows, \`finish\` on the last one. The analog clock also fires \`ok:time-clock:viewchange\`.
- **\`ok:date-range-picker:change\`** fires with \`detail.value\` (an ISO interval or \`null\`) and \`detail.validationError\`, the \`[start, end]\` errors. It also fires \`accept\`, \`open\`, \`close\` and \`rangepositionchange\` (\`detail.rangePosition\`). **\`ok:date-range-calendar:change\`** and **\`ok:multi-input-range-field:change\`** (cancelable) fire for a range calendar or a multi input field on its own.
- **Instance:** \`runtime.get(element, "date-picker")\` returns \`{ value, setValue(value), isOpen, open(), close(), setShortcuts(list), setShouldDisableDate(fn), setShouldDisableTime(fn), setLocaleText(text) }\`. \`setValue\` doesn't fire events. A range picker's instance (\`"date-range-picker"\`) adds \`rangePosition\`, \`setRangePosition(position)\` and \`open(position)\`; its \`setValue\` takes an ISO interval or a \`[start, end]\` pair.
- **React:** \`onChange(value, { validationError })\`, \`onAccept(value)\`, \`onError(error, value)\`, \`onOpenChange(open, reason)\`, \`onViewChange(view)\`, \`onMonthChange(month)\` and \`onYearChange(year)\`. The clocks call \`onChange(value, selectionState)\`. Range pickers call \`onChange(range, { validationError: [start, end] })\`, \`onError(errors, range)\` and \`onRangePositionChange(position)\`.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "The field is one tab stop. The calendar is one tab stop too: the arrow keys move through the days, also across the months of a range calendar. The analog clock is one tab stop, and each digital clock column is one more. A multi input range field has two tab stops, one per field.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Give the field a \`label\`: it names the group of sections. Each section is a spin button with its name ("Month") and its value as text ("May").
- The open button's name says the selected date ("Choose date, selected date is May 25, 2025").
- The calendar is a grid named by its month. Today is marked with \`aria-current="date"\`, and disabled days can't be focused.
- The popover and the dialog are named "Select date". Escape closes them and returns focus to the open button.
- Days are 36px wide. The selected day uses white text on the primary color.
- The analog clock is a list box named by its view and the time ("Select hours. Selected time is 09:30 AM"). Each number has a name, such as "9 hours". Focus stays on the list box while the arrow keys move the hand.
- Each digital clock column is a list box named by its view ("Select minutes"). Time pickers' open buttons say the time ("Choose time, selected time is 09:30 AM"), and the date and time tabs are named "pick date" and "pick time".
- A range calendar's grids allow several selected days: every day of the range is selected, and the two ends are filled with the primary color. The open button of a single range field says the range ("Choose range, selected range is May 20, 2025 – May 25, 2025"). The dialog is named "Select date range".
- Dragging the ends is an extra: the keyboard picks the start and the end with Enter, and the toolbar or the **Start** and **End** tabs choose the edited end.`,
  },
];

const PREVIEWS = {
  overview: () => (
    <Preview>
      <div className="sb-date-pickers">
        <DatePicker id="docs-date" label="Birthday" defaultValue={VALUE} />
      </div>
    </Preview>
  ),
  views: () => (
    <Preview>
      <div className="sb-date-pickers">
        <DatePicker
          id="docs-month-year"
          label="Month and year"
          views={["month", "year"]}
          defaultValue={VALUE}
        />
        <DateField id="docs-format" label="Date" format="DD.MM.YYYY" defaultValue={VALUE} />
      </div>
    </Preview>
  ),
  actions: () => (
    <Preview>
      <StaticDatePicker
        id="docs-actions"
        defaultValue={VALUE}
        actions={["clear", "today", "cancel", "accept"]}
        shortcuts={[
          { label: "Christmas", getValue: () => new Date(2025, 11, 25) },
          { label: "New Year", getValue: () => new Date(2026, 0, 1) },
        ]}
      />
    </Preview>
  ),
  time: () => (
    <Preview>
      <div className="sb-date-pickers">
        <TimePicker
          id="docs-time"
          label="Alarm"
          views={["hours", "minutes", "seconds"]}
          defaultValue={TIME}
        />
        <TimeField id="docs-time-24" label="24 hours" ampm={false} defaultValue={TIME} />
      </div>
    </Preview>
  ),
  "date-time": () => (
    <Preview>
      <StaticDateTimePicker id="docs-date-time" defaultValue={TIME} />
    </Preview>
  ),
  range: () => (
    <Preview>
      <div className="sb-date-ranges">
        <DateRangePicker id="docs-range" label="Stay" defaultValue={RANGE} />
        <DateRangePicker
          id="docs-range-multi"
          multiInput
          startLabel="Check-in"
          endLabel="Check-out"
          defaultValue={RANGE}
        />
      </div>
    </Preview>
  ),
  "range-shortcuts": () => (
    <Preview>
      <StaticDateRangePicker
        id="docs-range-shortcuts"
        defaultValue={RANGE}
        actions={[]}
        shortcuts={[
          {
            label: "Week of 19 May",
            getValue: () => [new Date(2025, 4, 19), new Date(2025, 4, 25)],
          },
          { label: "June 2025", getValue: () => [new Date(2025, 5, 1), new Date(2025, 5, 30)] },
          { label: "Reset", getValue: () => [null, null] },
        ]}
      />
    </Preview>
  ),
  "time-range": () => (
    <Preview>
      <div className="sb-date-pickers">
        <TimeRangePicker
          id="docs-time-range"
          label="Opening hours"
          defaultValue={[new Date(2025, 4, 25, 9), new Date(2025, 4, 25, 17, 30)]}
        />
      </div>
    </Preview>
  ),
  localization: () => (
    <Preview>
      <LocalizationProvider adapterLocale="vi-VN">
        <div className="sb-date-pickers">
          <DatePicker id="docs-vi" label="Ngày sinh" defaultValue={VALUE} />
        </div>
      </LocalizationProvider>
    </Preview>
  ),
  options: () => (
    <>
      <OptionsTable schema={datePickerOptions} />
      <OptionsTable schema={dateCalendarOptions} />
      <OptionsTable schema={dateFieldOptions} />
      <OptionsTable schema={timeClockOptions} />
      <OptionsTable schema={digitalClockOptions} />
      <OptionsTable schema={multiSectionDigitalClockOptions} />
      <OptionsTable schema={dateRangePickerOptions} />
      <OptionsTable schema={dateRangeCalendarOptions} />
    </>
  ),
  props: () => (
    <PropsTable
      label="Date picker content props"
      rows={[
        {
          react: "value / defaultValue / onChange",
          html: "data-ok-value · ok:date-picker:change",
          type: "Date | null (HTML: ISO string)",
          description: "The date.",
        },
        {
          react: "views / openTo / view / onViewChange",
          html: "data-ok-views, data-ok-open-to on the calendar",
          type: '("year" | "month" | "day")[]',
          description: "What people pick, and the first view.",
        },
        {
          react: "format / formatDensity",
          html: "data-ok-format, data-ok-format-density on the field",
          type: "string",
          description: "Sections of the field (Day.js tokens).",
        },
        {
          react: "minDate / maxDate / disablePast / disableFuture",
          html: "data-ok-min-date / -max-date (ISO), data-ok-disable-past / -future",
          type: "Date · boolean",
          description: "Limits of valid dates.",
        },
        {
          react: "shouldDisableDate / shouldDisableMonth / shouldDisableYear",
          html: "setShouldDisableDate(fn) … instance methods",
          type: "(date: Date) => boolean",
          description: "Dates that can't be picked.",
        },
        {
          react: "ampm / views (time) / timeSteps / thresholdToRenderTimeInASingleColumn",
          html: "data-ok-ampm, data-ok-views, data-ok-time-steps on the clocks",
          type: 'boolean · ("hours" | "minutes" | "seconds")[] · { hours, minutes, seconds }',
          description: "The hour cycle, the time views and the digital clock's steps.",
        },
        {
          react: "minTime / maxTime / minDateTime / maxDateTime / minutesStep",
          html: "data-ok-min-time / -max-time (ISO times), data-ok-min-date-time / -max-date-time, data-ok-minutes-step",
          type: "Date · number",
          description: "Limits of valid times.",
        },
        {
          react: "shouldDisableTime",
          html: "setShouldDisableTime(fn) instance method",
          type: '(value: Date, view: "hours" | "minutes" | "seconds") => boolean',
          description: "Times that can't be picked.",
        },
        {
          react: "actions",
          html: "data-ok-actions + button[data-ok-picker-action]",
          type: '("clear" | "today" | "cancel" | "accept" | "nextOrAccept")[]',
          description: "Buttons under the calendar.",
        },
        {
          react: "shortcuts",
          html: "ul[data-ok-picker-shortcuts] chips with data-ok-value · setShortcuts(list)",
          type: "{ label, getValue }[]",
          description: "Chips that set a value.",
        },
        {
          react: "open / onOpenChange / onAccept",
          html: "data-ok-open · ok:date-picker:open / close / accept",
          type: "boolean",
          description: "Whether the calendar shows, and accepted values.",
        },
        {
          react: "label / helperText / error / variant / size / name",
          html: "TextField markup",
          type: "—",
          description: "The field, as on a TextField.",
        },
        {
          react: "value / defaultValue / onChange (range pickers)",
          html: "data-ok-value (ISO interval) · ok:date-range-picker:change",
          type: "[Date | null, Date | null] (HTML: start/end)",
          description: "The range.",
        },
        {
          react: "rangePosition / defaultRangePosition / onRangePositionChange",
          html: "data-ok-range-position on the range calendar · rangepositionchange",
          type: '"start" | "end"',
          description: "The end the next pick edits.",
        },
        {
          react: "multiInput / startLabel / endLabel",
          html: "a multi input range field instead of a single one",
          type: "boolean · ReactNode",
          description: "Two fields, the start and the end.",
        },
        {
          react: "shortcuts (range pickers)",
          html: 'chips with data-ok-value="start/end" · setShortcuts(list)',
          type: "{ label, getValue }[] returning [start, end]",
          description: "Chips that set a range.",
        },
        {
          react: "localeText (also on LocalizationProvider)",
          html: "data-ok-locale · setLocaleText(text)",
          type: "Partial<PickerLocaleText>",
          description: "Texts and names (translate them here).",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Left arrow / Right arrow (field)", "Moves to the previous / next section."],
        [
          "Up arrow / Down arrow (field)",
          "Adds or removes 1 in the section. An empty section takes today's value.",
        ],
        ["Page Up / Page Down (field)", "Adds or removes 5."],
        ["Home / End (field)", "Sets the section's smallest / largest value."],
        [
          "Digits and letters (field)",
          "Type the value. The next section gets focus when the value is complete.",
        ],
        [
          "Backspace / Delete (field)",
          "Empties the section, or every section after Ctrl + A (⌘ + A).",
        ],
        [
          "Arrow keys (calendar)",
          "Move to the previous / next day, or the same day of the previous / next week.",
        ],
        ["Home / End (calendar)", "Moves to the first / last day of the week."],
        ["Page Up / Page Down (calendar)", "Moves to the previous / next month. With Shift: year."],
        ["Enter / Space (calendar)", "Picks the focused day, month or year."],
        [
          "Up arrow / Down arrow (analog clock)",
          "Moves the hand by 1 (minutes: by minutesStep), skipping times that can't be picked.",
        ],
        ["Page Up / Page Down (analog clock)", "Moves the hand by 5."],
        ["Home / End (analog clock)", "Moves the hand to the smallest / largest number."],
        ["Enter (analog clock)", "Keeps the number and moves to the next view."],
        ["Up arrow / Down arrow (digital clock)", "Moves to the previous / next option."],
        ["Enter / Space (digital clock)", "Picks the focused option and moves to the next column."],
        [
          "Enter / Space (range calendar)",
          "Picks the start, then the end. A day before the start starts the range again.",
        ],
        ["Escape", "Closes the popover or the dialog."],
      ]}
    />
  ),
};

/** Date pickers docs page (ADR-0019). */
export function DatePickerDocs() {
  return <GuideDocs sections={datePickerSections} previews={PREVIEWS} />;
}
