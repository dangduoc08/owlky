import { dateCalendarOptions, dateFieldOptions, datePickerOptions } from "@owlky/core";
import { DateField, DatePicker, LocalizationProvider, StaticDatePicker } from "@owlky/react";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";

const VALUE = new Date(2025, 4, 25);

export const datePickerSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: "Date pickers let people type a date or pick it from a calendar. The field splits the date into sections, such as month, day and year. People edit each section with the keyboard, and screen readers announce it as a spin button. The calendar opens in a popover on devices with a mouse, and in a dialog on touch screens. A static picker shows the calendar inline. The pickers are built from components you already know: a **TextField**, **IconButtons**, **Buttons**, **Chips**, a **Popover** and a **Dialog**.",
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
- **Instance:** \`runtime.get(element, "date-picker")\` returns \`{ value, setValue(value), isOpen, open(), close(), setShortcuts(list), setShouldDisableDate(fn), setLocaleText(text) }\`. \`setValue\` doesn't fire events.
- **React:** \`onChange(value, { validationError })\`, \`onAccept(value)\`, \`onError(error, value)\`, \`onOpenChange(open, reason)\`, \`onViewChange(view)\`, \`onMonthChange(month)\` and \`onYearChange(year)\`.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "The field is one tab stop. The calendar is one tab stop too: the arrow keys move through the days.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- Give the field a \`label\`: it names the group of sections. Each section is a spin button with its name ("Month") and its value as text ("May").
- The open button's name says the selected date ("Choose date, selected date is May 25, 2025").
- The calendar is a grid named by its month. Today is marked with \`aria-current="date"\`, and disabled days can't be focused.
- The popover and the dialog are named "Select date". Escape closes them and returns focus to the open button.
- Days are 36px wide. The selected day uses white text on the primary color.`,
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
        ["Escape", "Closes the popover or the dialog."],
      ]}
    />
  ),
};

/** Date pickers docs page (ADR-0019). */
export function DatePickerDocs() {
  return <GuideDocs sections={datePickerSections} previews={PREVIEWS} />;
}
