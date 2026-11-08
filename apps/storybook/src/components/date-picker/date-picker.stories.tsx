import { DateCalendar, DateRangeCalendar, TimeClock } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  frameworkStory,
  type HtmlGroup,
  reactGroupsStory,
  type StoryControls,
} from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { DatePickerDocs } from "./date-picker-docs.js";
import {
  DATE_CALENDAR_CONTROLS,
  DATE_PICKER_FILES,
  DATE_RANGE_CALENDAR_CONTROLS,
  datePickerStories,
  TIME_CLOCK_CONTROLS,
} from "./date-picker-examples.js";
import {
  DAYJS_SCRIPT_SOURCE,
  dayjsScript,
  EVENT_DAYS_SCRIPT_SOURCE,
  eventDaysScript,
  LOCALE_SCRIPT_SOURCE,
  PACK_SCRIPTS,
} from "./date-picker-scripts.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/date-picker/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const SETUP = htmlSetup(
  [
    "date-picker.css",
    "date-calendar.css",
    "date-field.css",
    "text-field.css",
    "icon-button.css",
    "button.css",
    "chip.css",
    "popover.css",
    "dialog.css",
    "time-clock.css",
    "digital-clock.css",
    "tabs.css",
    "date-range-calendar.css",
    "date-range-picker.css",
  ],
  true,
);

const story = (
  name: string,
  controls?: StoryControls & { target?: unknown },
  scripts: Record<string, Pick<HtmlGroup, "script" | "scriptSource">> = {},
) =>
  frameworkStory({
    html: snippetStory(snippets, name, DATE_PICKER_FILES[name] ?? [], SETUP, controls, scripts),
    react: reactGroupsStory(datePickerStories[name] ?? [], controls),
  });

const meta = {
  title: "Components/Date pickers",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: DatePickerDocs,
      description: {
        component:
          "Date pickers let people type a date in a field or pick it from a calendar, in a popover, a dialog or inline.",
      },
    },
  },
} satisfies Meta;
export default meta;

/** `Date` is a global: the export is `DateStory`, the sidebar label "Date". */
export const DateStory: StoryObj = { ...story("date"), name: "Date" };

/** The reference's Time section (phase 2, ADR-0026). */
export const Time: StoryObj = story("time");

/** The reference's Date & Time section. */
export const DateTime: StoryObj = { ...story("date-time"), name: "Date & Time" };

/** The reference's Range section (phase 3, ADR-0028): MUI X Pro's range pickers. */
export const Range: StoryObj = story("range");

export const RangeFields: StoryObj = { ...story("range-fields"), name: "Range fields" };

export const RangeCalendars: StoryObj = {
  ...story("range-calendars", { ...DATE_RANGE_CALENDAR_CONTROLS, target: DateRangeCalendar }),
  name: "Range calendars",
};

export const TimeRanges: StoryObj = { ...story("time-ranges"), name: "Time ranges" };

export const RangeShortcuts: StoryObj = { ...story("range-shortcuts"), name: "Range shortcuts" };

export const Calendars: StoryObj = story("calendars", {
  ...DATE_CALENDAR_CONTROLS,
  target: DateCalendar,
});

export const Clocks: StoryObj = story("clocks", { ...TIME_CLOCK_CONTROLS, target: TimeClock });

export const Validation: StoryObj = story("validation");

export const TimeValidation: StoryObj = { ...story("time-validation"), name: "Time validation" };

export const Shortcuts: StoryObj = story("shortcuts");

export const Localization: StoryObj = story("localization", undefined, {
  packs: { script: PACK_SCRIPTS.packs, scriptSource: LOCALE_SCRIPT_SOURCE },
});

/** Phase 4 (ADR-0030): values in another time zone (`timezone`, HTML `data-ok-timezone`). */
export const TimeZones: StoryObj = { ...story("time-zones"), name: "Time zones" };

/** Date library adapters: Day.js and Luxon values (the same markup). */
export const DateLibraries: StoryObj = {
  ...story("date-libraries", undefined, {
    dayjs: { script: dayjsScript, scriptSource: DAYJS_SCRIPT_SOURCE },
  }),
  name: "Date libraries",
};

/** Other calendar systems through `Intl`: Jalali, Hijri, Buddhist. */
export const CalendarSystems: StoryObj = {
  ...story("calendar-systems", undefined, {
    jalali: { script: PACK_SCRIPTS.jalali, scriptSource: LOCALE_SCRIPT_SOURCE },
    hijri: { script: PACK_SCRIPTS.hijri, scriptSource: LOCALE_SCRIPT_SOURCE },
  }),
  name: "Calendar systems",
};

export const RightToLeft: StoryObj = {
  ...story("right-to-left", undefined, {
    rtl: { script: PACK_SCRIPTS.rtl, scriptSource: LOCALE_SCRIPT_SOURCE },
  }),
  name: "Right to left",
};

/** Slots, slot props and view renderers (MUI X `slots` / `viewRenderers`). */
export const Customization: StoryObj = story("customization", undefined, {
  day: { script: eventDaysScript, scriptSource: EVENT_DAYS_SCRIPT_SOURCE },
});
