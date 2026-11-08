/**
 * Locale data for the pickers (ADR-0022): names and formats from `Intl`, the first day of the
 * week from a fixed table (the same in every browser: `Intl.Locale#getWeekInfo` isn't in
 * Firefox), and the picker texts (`localeText`) in English and Vietnamese.
 */
import type { DateView } from "./dates.js";
import type { ClockSectionView, TimeView } from "./time.js";

export const DEFAULT_PICKER_LOCALE = "en-US";

/** A locale `Intl` accepts, else the default (attributes are untrusted). */
export function safeLocale(locale: unknown): string {
  if (typeof locale !== "string" || locale.length === 0 || locale.length > 35)
    return DEFAULT_PICKER_LOCALE;
  try {
    return Intl.getCanonicalLocales(locale)[0] as string;
  } catch {
    return DEFAULT_PICKER_LOCALE;
  }
}

const SUNDAY = new Set(
  "AG AS BD BR BS BT BW BZ CA CN CO DM DO ET GT GU HK HN ID IL IN JM JP KE KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW".split(
    " ",
  ),
);
const SATURDAY = new Set("AE AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY".split(" "));
const FRIDAY = new Set(["MV"]);

/** The region of a locale, guessing the likely one when it has none (`en` → `US`). */
function regionOf(locale: string): string {
  try {
    const parsed = new Intl.Locale(locale);
    return parsed.region ?? parsed.maximize().region ?? "";
  } catch {
    return "";
  }
}

/** First day of the week for a locale: 0 = Sunday … 6 = Saturday (CLDR week data). */
export function firstDayOfWeek(locale: string): number {
  const region = regionOf(locale);
  if (SUNDAY.has(region)) return 0;
  if (SATURDAY.has(region)) return 6;
  if (FRIDAY.has(region)) return 5;
  return 1;
}

const UTC_DAY = (month: number, day: number) => new Date(Date.UTC(2023, month, day, 12));

/** Month names from January: `long` ("January"), `short` ("Jan"). */
export function monthNames(locale: string, width: "long" | "short"): string[] {
  const format = new Intl.DateTimeFormat(locale, { month: width, timeZone: "UTC" });
  return Array.from({ length: 12 }, (_, month) => format.format(UTC_DAY(month, 1)));
}

/** Weekday names from Sunday: `long` ("Sunday"), `short` ("Sun"), `narrow` ("S"). */
export function weekdayNames(locale: string, width: "long" | "short" | "narrow"): string[] {
  const format = new Intl.DateTimeFormat(locale, { weekday: width, timeZone: "UTC" });
  // 1 January 2023 was a Sunday.
  return Array.from({ length: 7 }, (_, day) => format.format(UTC_DAY(0, 1 + day)));
}

/** Formats a date with `Intl` options (local time). */
export const formatDate = (
  date: Date,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string => new Intl.DateTimeFormat(locale, options).format(date);

/**
 * Default weekday header: the locale's narrow name, uppercased ("S", "M" in English; "CN", "T2"
 * in Vietnamese). MUI takes the first letter of the short name, which makes Vietnamese days all "T".
 */
export const defaultDayOfWeekFormatter = (date: Date, locale: string): string =>
  formatDate(date, locale, { weekday: "narrow" }).toLocaleUpperCase(locale);

/** Picker texts. Functions build texts with values (MUI's `localeText` keys). */
export interface PickerLocaleText {
  previousMonth: string;
  nextMonth: string;
  /** Name of the header button that switches between the year view and the others. */
  calendarViewSwitchingButtonAriaLabel: (view: DateView) => string;
  /** Name of the open button: `value` is the formatted value, or `null` when empty. */
  openDatePickerDialogue: (value: string | null) => string;
  datePickerToolbarTitle: string;
  cancelButtonLabel: string;
  okButtonLabel: string;
  clearButtonLabel: string;
  todayButtonLabel: string;
  nextStepButtonLabel: string;
  fieldClearLabel: string;
  /** Section placeholders: `format` is the token (`YYYY`, `MMM`…). */
  fieldYearPlaceholder: (format: string) => string;
  fieldMonthPlaceholder: (format: string, contentType: "digit" | "letter") => string;
  fieldDayPlaceholder: () => string;
  fieldWeekDayPlaceholder: () => string;
  fieldHoursPlaceholder: () => string;
  fieldMinutesPlaceholder: () => string;
  fieldSecondsPlaceholder: () => string;
  fieldMeridiemPlaceholder: () => string;
  /** Section names (`aria-label` of the spinbuttons). */
  year: string;
  month: string;
  day: string;
  weekDay: string;
  hours: string;
  minutes: string;
  seconds: string;
  meridiem: string;
  /** `aria-valuetext` of an empty section. */
  empty: string;
  calendarWeekNumberHeaderLabel: string;
  calendarWeekNumberHeaderText: string;
  calendarWeekNumberAriaLabelText: (week: number) => string;
  calendarWeekNumberText: (week: number) => string;
  /** Name of the shortcuts list (not in MUI: its list has no name). */
  shortcutsLabel: string;
  /** Toolbar title when there's no value. */
  toolbarEmptyText: string;
  /** Loading text of the calendar. */
  loadingText: string;
  /** Time pickers (phase 2). */
  timePickerToolbarTitle: string;
  dateTimePickerToolbarTitle: string;
  /** Name of a time picker's open button: `value` is the formatted time, or `null`. */
  openTimePickerDialogue: (value: string | null) => string;
  /** The clock's previous / next view buttons. */
  openPreviousView: string;
  openNextView: string;
  /** Name of the clock's listbox: `time` is the formatted value, or `null`. */
  clockLabelText: (view: TimeView, time: string | null) => string;
  hoursClockNumberText: (hours: string) => string;
  minutesClockNumberText: (minutes: string) => string;
  secondsClockNumberText: (seconds: string) => string;
  /** Name of a digital clock column. */
  selectViewText: (view: ClockSectionView) => string;
  /** Names of the date time picker's tabs. */
  dateTableLabel: string;
  timeTableLabel: string;
  /** Range pickers (phase 3, ADR-0028): the two ends, as tabs and toolbar placeholders. */
  start: string;
  end: string;
  /** Labels of the multi-input range fields. */
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  dateRangePickerToolbarTitle: string;
  timeRangePickerToolbarTitle: string;
  dateTimeRangePickerToolbarTitle: string;
  /** Name of a range picker's open button: `value` is the formatted range, or `null`. */
  openRangePickerDialogue: (value: string | null) => string;
}

export const pickersEnUS: PickerLocaleText = {
  previousMonth: "Previous month",
  nextMonth: "Next month",
  calendarViewSwitchingButtonAriaLabel: (view) =>
    view === "year"
      ? "year view is open, switch to calendar view"
      : "calendar view is open, switch to year view",
  openDatePickerDialogue: (value) =>
    value ? `Choose date, selected date is ${value}` : "Choose date",
  datePickerToolbarTitle: "Select date",
  cancelButtonLabel: "Cancel",
  okButtonLabel: "OK",
  clearButtonLabel: "Clear",
  todayButtonLabel: "Today",
  nextStepButtonLabel: "Next",
  fieldClearLabel: "Clear",
  fieldYearPlaceholder: (format) => "Y".repeat(format.length),
  fieldMonthPlaceholder: (format, contentType) => (contentType === "letter" ? format : "MM"),
  fieldDayPlaceholder: () => "DD",
  fieldWeekDayPlaceholder: () => "EEEE",
  fieldHoursPlaceholder: () => "hh",
  fieldMinutesPlaceholder: () => "mm",
  fieldSecondsPlaceholder: () => "ss",
  fieldMeridiemPlaceholder: () => "aa",
  year: "Year",
  month: "Month",
  day: "Day",
  weekDay: "Week day",
  hours: "Hours",
  minutes: "Minutes",
  seconds: "Seconds",
  meridiem: "Meridiem",
  empty: "Empty",
  calendarWeekNumberHeaderLabel: "Week number",
  calendarWeekNumberHeaderText: "#",
  calendarWeekNumberAriaLabelText: (week) => `Week ${week}`,
  calendarWeekNumberText: (week) => `${week}`,
  shortcutsLabel: "Shortcuts",
  toolbarEmptyText: "––",
  loadingText: "…",
  timePickerToolbarTitle: "Select time",
  dateTimePickerToolbarTitle: "Select date & time",
  openTimePickerDialogue: (value) =>
    value ? `Choose time, selected time is ${value}` : "Choose time",
  openPreviousView: "Open previous view",
  openNextView: "Open next view",
  clockLabelText: (view, time) =>
    `Select ${view}. ${time ? `Selected time is ${time}` : "No time selected"}`,
  hoursClockNumberText: (hours) => `${hours} hours`,
  minutesClockNumberText: (minutes) => `${minutes} minutes`,
  secondsClockNumberText: (seconds) => `${seconds} seconds`,
  selectViewText: (view) => `Select ${view}`,
  dateTableLabel: "pick date",
  timeTableLabel: "pick time",
  start: "Start",
  end: "End",
  startDate: "Start date",
  startTime: "Start time",
  endDate: "End date",
  endTime: "End time",
  dateRangePickerToolbarTitle: "Select date range",
  timeRangePickerToolbarTitle: "Select time range",
  dateTimeRangePickerToolbarTitle: "Select date time range",
  openRangePickerDialogue: (value) =>
    value ? `Choose range, selected range is ${value}` : "Choose range",
};

const VI_VIEWS: Record<ClockSectionView, string> = {
  hours: "giờ",
  minutes: "phút",
  seconds: "giây",
  meridiem: "buổi",
};

export const pickersViVN: PickerLocaleText = {
  previousMonth: "Tháng trước",
  nextMonth: "Tháng sau",
  calendarViewSwitchingButtonAriaLabel: (view) =>
    view === "year"
      ? "đang xem theo năm, chuyển sang xem theo lịch"
      : "đang xem theo lịch, chuyển sang xem theo năm",
  openDatePickerDialogue: (value) => (value ? `Chọn ngày, ngày đã chọn là ${value}` : "Chọn ngày"),
  datePickerToolbarTitle: "Chọn ngày",
  cancelButtonLabel: "Hủy",
  okButtonLabel: "OK",
  clearButtonLabel: "Xóa",
  todayButtonLabel: "Hôm nay",
  nextStepButtonLabel: "Tiếp theo",
  fieldClearLabel: "Xóa giá trị",
  fieldYearPlaceholder: (format) => "N".repeat(format.length),
  fieldMonthPlaceholder: (_format, contentType) => (contentType === "letter" ? "MMMM" : "MM"),
  fieldDayPlaceholder: () => "NN",
  fieldWeekDayPlaceholder: () => "TT",
  fieldHoursPlaceholder: () => "hh",
  fieldMinutesPlaceholder: () => "mm",
  fieldSecondsPlaceholder: () => "ss",
  fieldMeridiemPlaceholder: () => "aa",
  year: "Năm",
  month: "Tháng",
  day: "Ngày",
  weekDay: "Thứ",
  hours: "Giờ",
  minutes: "Phút",
  seconds: "Giây",
  meridiem: "Buổi",
  empty: "Trống",
  calendarWeekNumberHeaderLabel: "Số tuần",
  calendarWeekNumberHeaderText: "#",
  calendarWeekNumberAriaLabelText: (week) => `Tuần ${week}`,
  calendarWeekNumberText: (week) => `${week}`,
  shortcutsLabel: "Lối tắt",
  toolbarEmptyText: "––",
  loadingText: "…",
  timePickerToolbarTitle: "Chọn giờ",
  dateTimePickerToolbarTitle: "Chọn ngày và giờ",
  openTimePickerDialogue: (value) => (value ? `Chọn giờ, giờ đã chọn là ${value}` : "Chọn giờ"),
  openPreviousView: "Mở chế độ xem trước",
  openNextView: "Mở chế độ xem sau",
  clockLabelText: (view, time) =>
    `Chọn ${VI_VIEWS[view]}. ${time ? `Giờ đã chọn là ${time}` : "Chưa chọn giờ"}`,
  hoursClockNumberText: (hours) => `${hours} giờ`,
  minutesClockNumberText: (minutes) => `${minutes} phút`,
  secondsClockNumberText: (seconds) => `${seconds} giây`,
  selectViewText: (view) => `Chọn ${VI_VIEWS[view]}`,
  dateTableLabel: "chọn ngày",
  timeTableLabel: "chọn giờ",
  start: "Bắt đầu",
  end: "Kết thúc",
  startDate: "Ngày bắt đầu",
  startTime: "Giờ bắt đầu",
  endDate: "Ngày kết thúc",
  endTime: "Giờ kết thúc",
  dateRangePickerToolbarTitle: "Chọn khoảng ngày",
  timeRangePickerToolbarTitle: "Chọn khoảng giờ",
  dateTimeRangePickerToolbarTitle: "Chọn khoảng ngày và giờ",
  openRangePickerDialogue: (value) =>
    value ? `Chọn khoảng, khoảng đã chọn là ${value}` : "Chọn khoảng",
};

/** Built-in texts for a locale (by language), English otherwise; `overrides` win. */
export function pickerLocaleText(
  locale: string,
  overrides?: Partial<PickerLocaleText>,
): PickerLocaleText {
  const base = locale.toLowerCase().startsWith("vi") ? pickersViVN : pickersEnUS;
  if (!overrides) return base;
  const merged = { ...base };
  for (const key of Object.keys(base) as (keyof PickerLocaleText)[]) {
    const value = overrides[key];
    // Only known keys with a value of the same kind (prototype keys and junk are ignored).
    if (Object.hasOwn(overrides, key) && typeof value === typeof base[key])
      (merged as Record<string, unknown>)[key] = value;
  }
  return merged;
}
