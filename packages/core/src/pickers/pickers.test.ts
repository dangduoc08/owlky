import { describe, expect, it } from "vitest";
import {
  calendarWeeks,
  closestEnabledDate,
  dateBounds,
  initialView,
  isDateDisabled,
  isMonthDisabled,
  isYearDisabled,
  nextView,
  stepEnabledDate,
  validateDate,
  yearRange,
} from "./calendar.js";
import {
  addDays,
  addMonths,
  addYears,
  dayDiff,
  daysInMonth,
  formatIsoDate,
  formatIsoDateTime,
  formatIsoTime,
  invalidDate,
  isSameDay,
  isValidDate,
  makeDate,
  normalizeDateViews,
  parseIsoDate,
  parseIsoTime,
  setDateParts,
  startOfWeek,
  weekNumber,
} from "./dates.js";
import {
  adjustSection,
  parsePastedText,
  sectionAria,
  sectionLabel,
  sectionPlaceholder,
  sectionsToDate,
  sectionValues,
  typeInSection,
} from "./field.js";
import {
  defaultDateFormat,
  escapeFormatLiteral,
  formatAccessibleDate,
  formatSection,
  formatWith,
  is12HourFormat,
  localeDateFormat,
  meridiemNames,
  parseFormat,
} from "./format.js";
import {
  defaultDayOfWeekFormatter,
  firstDayOfWeek,
  monthNames,
  pickerLocaleText,
  pickersEnUS,
  pickersViVN,
  safeLocale,
  weekdayNames,
} from "./locale.js";
import {
  calendarHeaderText,
  defaultCloseOnSelect,
  defaultPickerActions,
  isSamePickerValue,
  parsePickerActions,
  pickerToolbarText,
  resolvePickerMode,
  shortcutValue,
} from "./picker.js";

const d = (y: number, m: number, day: number) => makeDate(y, m - 1, day);
const iso = (date: Date | null) => (date && isValidDate(date) ? formatIsoDate(date) : String(date));

describe("dates", () => {
  it("builds dates, years below 100 included", () => {
    expect(makeDate(25, 0, 1).getFullYear()).toBe(25);
    expect(isValidDate(d(2025, 5, 25))).toBe(true);
    expect(isValidDate(invalidDate())).toBe(false);
    expect(isValidDate("2025-05-25")).toBe(false);
  });

  it("adds days, months (clamped) and years", () => {
    expect(iso(addDays(d(2025, 2, 28), 1))).toBe("2025-03-01");
    expect(iso(addMonths(d(2025, 1, 31), 1))).toBe("2025-02-28");
    expect(iso(addMonths(d(2024, 1, 31), 1))).toBe("2024-02-29");
    expect(iso(addMonths(d(2025, 1, 15), -1))).toBe("2024-12-15");
    expect(iso(addYears(d(2024, 2, 29), 1))).toBe("2025-02-28");
    expect(daysInMonth(2024, 1)).toBe(29);
  });

  it("compares and diffs across daylight saving changes", () => {
    expect(dayDiff(d(2025, 4, 1), d(2025, 3, 1))).toBe(31);
    expect(isSameDay(setDateParts(d(2025, 5, 25), { hours: 23 }), d(2025, 5, 25))).toBe(true);
  });

  it("finds the start of the week and week numbers", () => {
    expect(iso(startOfWeek(d(2025, 5, 25), 0))).toBe("2025-05-25");
    expect(iso(startOfWeek(d(2025, 5, 25), 1))).toBe("2025-05-19");
    // ISO: 2025-01-01 is in week 1; 2027-01-01 (Friday) is in week 53 of 2026.
    expect(weekNumber(d(2025, 1, 1), 1)).toBe(1);
    expect(weekNumber(d(2027, 1, 1), 1)).toBe(53);
    // US: the week holding 1 January is week 1.
    expect(weekNumber(d(2025, 1, 1), 0)).toBe(1);
    expect(weekNumber(d(2025, 5, 25), 0)).toBe(22);
    expect(weekNumber(d(2024, 12, 31), 0)).toBe(1);
  });

  it("formats and parses ISO 8601 strictly", () => {
    const value = setDateParts(d(2025, 5, 25), { hours: 9, minutes: 30, seconds: 5 });
    expect(formatIsoDate(value)).toBe("2025-05-25");
    expect(formatIsoTime(value)).toBe("09:30:05");
    expect(formatIsoDateTime(value)).toBe("2025-05-25T09:30:05");
    expect(formatIsoDate(makeDate(-5, 0, 1))).toBe("-0005-01-01");
    expect(iso(parseIsoDate("2025-05-25"))).toBe("2025-05-25");
    expect(parseIsoDate("2025-05-25T09:30")?.getHours()).toBe(9);
    expect(parseIsoDate("2025-05-25 09:30:05.123")?.getSeconds()).toBe(5);
    for (const bad of [
      "2025-02-30",
      "2025-13-01",
      "2025-00-10",
      "2025-05-25T24:00",
      "25-05-2025",
      "",
      '"><img onerror=x>',
      "2".repeat(40),
      20250525,
      null,
    ])
      expect(parseIsoDate(bad)).toBeNull();
    expect(parseIsoTime("09:30", d(2025, 5, 25))?.getMinutes()).toBe(30);
    expect(parseIsoTime("25:00", d(2025, 5, 25))).toBeNull();
    expect(parseIsoTime("x", d(2025, 5, 25))).toBeNull();
    expect(parseIsoTime(5, d(2025, 5, 25))).toBeNull();
  });

  it("normalizes views to calendar order, defaulting to year + day", () => {
    expect(normalizeDateViews(["day", "year", "bogus"])).toEqual(["year", "day"]);
    expect(normalizeDateViews(["month", "year"])).toEqual(["year", "month"]);
    expect(normalizeDateViews([])).toEqual(["year", "day"]);
    expect(normalizeDateViews(undefined)).toEqual(["year", "day"]);
  });
});

describe("locale", () => {
  it("validates locales", () => {
    expect(safeLocale("vi-VN")).toBe("vi-VN");
    expect(safeLocale("not a locale!")).toBe("en-US");
    expect(safeLocale("")).toBe("en-US");
    expect(safeLocale(42)).toBe("en-US");
    expect(safeLocale("x".repeat(40))).toBe("en-US");
  });

  it("knows the first day of the week (same table in every browser)", () => {
    expect(firstDayOfWeek("en-US")).toBe(0);
    expect(firstDayOfWeek("en")).toBe(0);
    expect(firstDayOfWeek("vi-VN")).toBe(1);
    expect(firstDayOfWeek("fr")).toBe(1);
    expect(firstDayOfWeek("ar-EG")).toBe(6);
    expect(firstDayOfWeek("dv-MV")).toBe(5);
    expect(firstDayOfWeek("zz")).toBe(1);
  });

  it("names months and weekdays", () => {
    expect(monthNames("en-US", "long")[4]).toBe("May");
    expect(monthNames("en-US", "short")[0]).toBe("Jan");
    expect(weekdayNames("en-US", "long")[0]).toBe("Sunday");
    expect(weekdayNames("en-US", "narrow")[1]).toBe("M");
    expect(defaultDayOfWeekFormatter(d(2025, 5, 25), "en-US")).toBe("S");
  });

  it("merges locale texts safely", () => {
    expect(pickerLocaleText("vi-VN")).toBe(pickersViVN);
    expect(pickerLocaleText("en-GB")).toBe(pickersEnUS);
    const merged = pickerLocaleText(
      "en-US",
      JSON.parse('{"__proto__":{"x":1},"okButtonLabel":"Done","cancelButtonLabel":5}'),
    );
    expect(merged.okButtonLabel).toBe("Done");
    expect(merged.cancelButtonLabel).toBe("Cancel");
    expect(({} as Record<string, unknown>)["x"]).toBeUndefined();
    expect(pickersEnUS.openDatePickerDialogue(null)).toBe("Choose date");
    expect(pickersEnUS.openDatePickerDialogue("May 25, 2025")).toBe(
      "Choose date, selected date is May 25, 2025",
    );
    expect(pickersEnUS.calendarViewSwitchingButtonAriaLabel("year")).toMatch(/year view is open/);
    expect(pickersEnUS.calendarViewSwitchingButtonAriaLabel("day")).toMatch(
      /calendar view is open/,
    );
    expect(pickersViVN.calendarViewSwitchingButtonAriaLabel("year")).toMatch(/năm/);
    expect(pickersViVN.calendarViewSwitchingButtonAriaLabel("day")).toMatch(/lịch/);
    expect(pickersViVN.openDatePickerDialogue(null)).toBe("Chọn ngày");
    expect(pickersViVN.openDatePickerDialogue("x")).toMatch(/x$/);
    for (const pack of [pickersEnUS, pickersViVN]) {
      expect(pack.calendarWeekNumberAriaLabelText(3)).toMatch(/3/);
      expect(pack.calendarWeekNumberText(3)).toBe("3");
    }
  });
});

describe("format", () => {
  it("splits formats into sections with separators and escapes", () => {
    const sections = parseFormat("[Day ]DD/MM/YYYY[!]");
    expect(sections.map((s) => s.token)).toEqual(["DD", "MM", "YYYY"]);
    expect(sections[0]?.startSeparator).toBe("Day ");
    expect(sections[0]?.endSeparator).toBe("/");
    expect(sections[2]?.endSeparator).toBe("!");
    expect(parseFormat("[unterminated")).toEqual([]);
    expect(parseFormat("ddd, MMM D h:mm:ss A").map((s) => s.type)).toEqual([
      "weekDay",
      "month",
      "day",
      "hours",
      "minutes",
      "seconds",
      "meridiem",
    ]);
    expect(parseFormat("x".repeat(300))).toEqual([]);
  });

  it("knows 12-hour formats", () => {
    expect(is12HourFormat(parseFormat("hh:mm"))).toBe(true);
    expect(is12HourFormat(parseFormat("HH:mm"))).toBe(false);
  });

  it("derives the locale's date pattern and defaults per views", () => {
    expect(localeDateFormat("en-US")).toBe("MM/DD/YYYY");
    expect(localeDateFormat("vi-VN")).toBe("DD/MM/YYYY");
    expect(localeDateFormat("de-DE")).toBe("DD.MM.YYYY");
    expect(defaultDateFormat(["year", "month", "day"], "en-US")).toBe("MM/DD/YYYY");
    expect(defaultDateFormat(["year", "month"], "en-US")).toBe("MMMM YYYY");
    expect(defaultDateFormat(["day"], "en-US")).toBe("DD");
    expect(defaultDateFormat(["year"], "en-US")).toBe("YYYY");
    expect(defaultDateFormat(["month"], "en-US")).toBe("MMMM");
    expect(defaultDateFormat(["month", "day"], "en-US")).toBe("MMMM D");
  });

  it("formats every token", () => {
    const value = setDateParts(d(2025, 5, 4), { hours: 21, minutes: 7, seconds: 3 });
    expect(formatWith(value, "YYYY YY M MM MMM MMMM D DD ddd dddd", "en-US")).toBe(
      "2025 25 5 05 May May 4 04 Sun Sunday",
    );
    expect(formatWith(value, "H HH h hh m mm s ss A a", "en-US")).toBe(
      "21 21 9 09 7 07 3 03 PM pm",
    );
    expect(formatWith(setDateParts(value, { hours: 0 }), "h A", "en-US")).toBe("12 AM");
    expect(meridiemNames("en-US")).toEqual(["AM", "PM"]);
    expect(formatAccessibleDate(value, "en-US")).toBe("May 4, 2025");
    const section = parseFormat("YYYY")[0];
    expect(section && formatSection(makeDate(5, 0, 1), section, "en-US")).toBe("0005");
  });
});

describe("field values", () => {
  const sections = parseFormat("MM/DD/YYYY");
  const ref = d(2026, 11, 8);

  it("formats a value into sections, empty when null / invalid", () => {
    expect(sectionValues(d(2025, 5, 25), sections, "en-US")).toEqual(["05", "25", "2025"]);
    expect(sectionValues(null, sections, "en-US")).toEqual(["", "", ""]);
    expect(sectionValues(invalidDate(), sections, "en-US")).toEqual(["", "", ""]);
  });

  it("names sections and their placeholders", () => {
    const all = parseFormat("YYYY MM MMMM DD ddd dddd HH mm ss A");
    expect(all.map((s) => sectionPlaceholder(s, pickersEnUS))).toEqual([
      "YYYY",
      "MM",
      "MMMM",
      "DD",
      "EEEE",
      "EEEE",
      "hh",
      "mm",
      "ss",
      "aa",
    ]);
    expect(all.map((s) => sectionPlaceholder(s, pickersViVN)).slice(0, 4)).toEqual([
      "NNNN",
      "MM",
      "MMMM",
      "NN",
    ]);
    expect(sectionLabel(sections[0] as never, pickersEnUS)).toBe("Month");
  });

  it("adjusts with arrows: wraps months and days, clamps years, empty takes the reference", () => {
    const values = ["05", "31", "2025"];
    expect(adjustSection(0, 1, values, sections, "en-US", ref)).toBe("06");
    expect(adjustSection(0, -5, ["03", "", ""], sections, "en-US", ref)).toBe("10");
    expect(adjustSection(1, 1, values, sections, "en-US", ref)).toBe("01");
    expect(adjustSection(1, 1, ["02", "28", "2024"], sections, "en-US", ref)).toBe("29");
    expect(adjustSection(2, 5, ["", "", "9998"], sections, "en-US", ref)).toBe("9999");
    expect(adjustSection(0, 1, ["", "", ""], sections, "en-US", ref)).toBe("11");
    expect(adjustSection(1, "max", ["04", "", ""], sections, "en-US", ref)).toBe("30");
    expect(adjustSection(1, "min", values, sections, "en-US", ref)).toBe("01");
    const letters = parseFormat("MMM A");
    expect(adjustSection(0, 1, ["Dec", ""], letters, "en-US", ref)).toBe("Jan");
    expect(adjustSection(0, -1, ["Jan", ""], letters, "en-US", ref)).toBe("Dec");
    expect(adjustSection(0, 1, ["", ""], letters, "en-US", ref)).toBe("Nov");
    expect(adjustSection(1, 1, ["", "AM"], letters, "en-US", ref)).toBe("PM");
    expect(adjustSection(0, "min", ["", ""], letters, "en-US", ref)).toBe("Jan");
    expect(adjustSection(0, "max", ["", ""], letters, "en-US", ref)).toBe("Dec");
  });

  it("types digits: builds numbers, restarts when too large, moves on when complete", () => {
    expect(typeInSection(0, "1", "", ["", "", ""], sections, "en-US")).toEqual({
      value: "01",
      query: "1",
      done: false,
    });
    expect(typeInSection(0, "2", "1", ["01", "", ""], sections, "en-US")).toEqual({
      value: "12",
      query: "",
      done: true,
    });
    expect(typeInSection(0, "5", "", ["", "", ""], sections, "en-US")).toEqual({
      value: "05",
      query: "",
      done: true,
    });
    expect(typeInSection(0, "3", "1", ["01", "", ""], sections, "en-US")).toEqual({
      value: "03",
      query: "",
      done: true,
    });
    expect(typeInSection(0, "0", "", ["", "", ""], sections, "en-US")).toEqual({
      value: "00",
      query: "0",
      done: false,
    });
    expect(typeInSection(2, "2", "", ["", "", ""], sections, "en-US")).toEqual({
      value: "0002",
      query: "2",
      done: false,
    });
    expect(typeInSection(2, "5", "202", ["", "", "0202"], sections, "en-US")).toEqual({
      value: "2025",
      query: "",
      done: true,
    });
    expect(typeInSection(1, "3", "", ["02", "", ""], sections, "en-US")).toEqual({
      value: "03",
      query: "",
      done: true,
    });
    expect(typeInSection(0, "x", "", ["", "", ""], sections, "en-US")).toBeNull();
    const short = parseFormat("M/D");
    expect(typeInSection(0, "9", "", ["", ""], short, "en-US")).toEqual({
      value: "9",
      query: "",
      done: true,
    });
  });

  it("types letters into name sections, and digits into month names", () => {
    const letters = parseFormat("MMMM A");
    expect(typeInSection(0, "j", "", ["", ""], letters, "en-US")).toEqual({
      value: "January",
      query: "j",
      done: false,
    });
    expect(typeInSection(0, "u", "j", ["", ""], letters, "en-US")).toEqual({
      value: "June",
      query: "ju",
      done: false,
    });
    expect(typeInSection(0, "l", "ju", ["", ""], letters, "en-US")).toEqual({
      value: "July",
      query: "jul",
      done: true,
    });
    expect(typeInSection(0, "d", "zz", ["", ""], letters, "en-US")).toEqual({
      value: "December",
      query: "d",
      done: true,
    });
    expect(typeInSection(0, "q", "", ["", ""], letters, "en-US")).toBeNull();
    expect(typeInSection(0, "!", "", ["", ""], letters, "en-US")).toBeNull();
    expect(typeInSection(0, "5", "", ["", ""], letters, "en-US")).toEqual({
      value: "May",
      query: "",
      done: true,
    });
    expect(typeInSection(0, "0", "", ["", ""], letters, "en-US")?.done).toBe(false);
    expect(typeInSection(1, "p", "", ["", ""], letters, "en-US")?.value).toBe("PM");
  });

  it("reads sections back into a date", () => {
    expect(sectionsToDate(["", "", ""], sections, "en-US", ref)).toBeNull();
    expect(isValidDate(sectionsToDate(["05", "", "2025"], sections, "en-US", ref))).toBe(false);
    expect(iso(sectionsToDate(["05", "25", "2025"], sections, "en-US", ref))).toBe("2025-05-25");
    expect(isValidDate(sectionsToDate(["02", "30", "2025"], sections, "en-US", ref))).toBe(false);
    const monthYear = parseFormat("MMMM YYYY");
    expect(iso(sectionsToDate(["February", "2025"], monthYear, "en-US", d(2026, 1, 31)))).toBe(
      "2025-02-28",
    );
    expect(isValidDate(sectionsToDate(["Smarch", "2025"], monthYear, "en-US", ref))).toBe(false);
    const time = parseFormat("YY-MM-DD hh:mm:ss A");
    const value = sectionsToDate(["99", "01", "02", "12", "05", "06", "AM"], time, "en-US", ref);
    expect(value && formatIsoDateTime(value)).toBe("1999-01-02T00:05:06");
    expect(
      sectionsToDate(["25", "01", "02", "01", "00", "00", "PM"], time, "en-US", ref)?.getHours(),
    ).toBe(13);
    const weekday = parseFormat("ddd DD");
    expect(iso(sectionsToDate(["Sun", "05"], weekday, "en-US", d(2025, 5, 1)))).toBe("2025-05-05");
  });

  it("describes sections for assistive technology", () => {
    expect(sectionAria(0, ["05", "", ""], sections, "en-US", pickersEnUS)).toEqual({
      now: 5,
      min: 1,
      max: 12,
      valueText: "May",
    });
    expect(sectionAria(1, ["", "", ""], sections, "en-US", pickersEnUS)).toEqual({
      min: 1,
      max: 31,
      valueText: "Empty",
    });
    expect(sectionAria(2, ["", "", "2025"], sections, "en-US", pickersEnUS).valueText).toBe("2025");
    const letters = parseFormat("MMM A");
    expect(sectionAria(0, ["May", ""], letters, "en-US", pickersEnUS)).toEqual({
      now: 5,
      min: 1,
      max: 12,
      valueText: "May",
    });
    expect(sectionAria(1, ["", "PM"], letters, "en-US", pickersEnUS)).toEqual({
      now: 1,
      min: 0,
      max: 1,
      valueText: "PM",
    });
    expect(sectionAria(1, ["", ""], letters, "en-US", pickersEnUS).valueText).toBe("Empty");
  });

  it("parses pasted values in the field's format", () => {
    expect(parsePastedText("05/25/2025", sections, "en-US")).toEqual(["05", "25", "2025"]);
    expect(parsePastedText(" 5/1/2025 ", sections, "en-US")).toEqual(["05", "01", "2025"]);
    expect(parsePastedText("13/01/2025", sections, "en-US")).toBeNull();
    expect(parsePastedText("ab/01/2025", sections, "en-US")).toBeNull();
    expect(parsePastedText("May 2025", parseFormat("MMMM YYYY"), "en-US")).toEqual(["May", "2025"]);
    expect(parsePastedText("Smarch 2025", parseFormat("MMMM YYYY"), "en-US")).toBeNull();
    expect(parsePastedText("[2025]", parseFormat("[[]YYYY]"), "en-US")).toEqual(["2025"]);
    expect(parsePastedText("0525", parseFormat("MMDD"), "en-US")).toEqual(["05", "25"]);
  });
});

describe("calendar", () => {
  const today = d(2025, 5, 20);

  it("validates against limits and rules, in MUI's order", () => {
    expect(validateDate(null, {})).toBeNull();
    expect(validateDate(invalidDate(), {})).toBe("invalidDate");
    expect(validateDate(d(1899, 12, 31), {})).toBe("minDate");
    expect(validateDate(d(2100, 1, 1), {})).toBe("maxDate");
    expect(validateDate(d(2025, 5, 1), { minDate: d(2025, 5, 2) })).toBe("minDate");
    expect(validateDate(d(2025, 5, 3), { maxDate: d(2025, 5, 2) })).toBe("maxDate");
    expect(validateDate(d(2025, 5, 19), { disablePast: true, today })).toBe("disablePast");
    expect(validateDate(d(2025, 5, 21), { disableFuture: true, today })).toBe("disableFuture");
    expect(validateDate(d(2025, 5, 24), { shouldDisableDate: (x) => x.getDay() === 6 })).toBe(
      "shouldDisableDate",
    );
    expect(validateDate(d(2025, 5, 24), { shouldDisableMonth: (x) => x.getMonth() === 4 })).toBe(
      "shouldDisableMonth",
    );
    expect(
      validateDate(d(2025, 5, 24), { shouldDisableYear: (x) => x.getFullYear() === 2025 }),
    ).toBe("shouldDisableYear");
    expect(isDateDisabled(d(2025, 5, 20), { disablePast: true, today })).toBe(false);
  });

  it("bounds months and years", () => {
    expect(dateBounds({ disablePast: true, disableFuture: true, today }).map(iso)).toEqual([
      "2025-05-20",
      "2025-05-20",
    ]);
    expect(isMonthDisabled(d(2025, 4, 1), { disablePast: true, today })).toBe(true);
    expect(isMonthDisabled(d(2025, 6, 1), { disableFuture: true, today })).toBe(true);
    expect(isMonthDisabled(d(2025, 5, 1), { disablePast: true, today })).toBe(false);
    expect(isMonthDisabled(d(2025, 5, 1), { shouldDisableMonth: () => true })).toBe(true);
    expect(isMonthDisabled(d(2025, 5, 1), { shouldDisableYear: () => true })).toBe(true);
    expect(isYearDisabled(2024, { disablePast: true, today })).toBe(true);
    expect(isYearDisabled(2026, { disableFuture: true, today })).toBe(true);
    expect(isYearDisabled(2025, { shouldDisableYear: (x) => x.getFullYear() === 2025 })).toBe(true);
    expect(isYearDisabled(2025, {})).toBe(false);
    expect(yearRange({ minDate: d(2020, 1, 1), maxDate: d(2022, 1, 1) })).toEqual([
      2020, 2021, 2022,
    ]);
    expect(yearRange({ minDate: d(2020, 1, 1), maxDate: d(2022, 1, 1) }, "desc")).toEqual([
      2022, 2021, 2020,
    ]);
    expect(yearRange({}).length).toBe(200);
    expect(yearRange({ minDate: d(2022, 1, 1), maxDate: d(2020, 1, 1) })).toEqual([]);
  });

  it("lays out whole weeks, and fixed week counts", () => {
    const may = calendarWeeks(d(2025, 5, 1), 0);
    expect(may).toHaveLength(5);
    expect(iso(may[0]?.[0]?.date ?? null)).toBe("2025-04-27");
    expect(may[0]?.[0]?.outside).toBe(true);
    expect(may[0]?.[4]?.outside).toBe(false);
    expect(calendarWeeks(d(2025, 5, 1), 0, 6)).toHaveLength(6);
    expect(calendarWeeks(d(2026, 2, 1), 0)).toHaveLength(4);
    expect(calendarWeeks(d(2025, 5, 1), 1)[0]?.[0]?.date.getDay()).toBe(1);
    expect(calendarWeeks(d(2025, 5, 1), 0, 99)).toHaveLength(12);
  });

  it("finds enabled days", () => {
    const weekdays = { shouldDisableDate: (x: Date) => x.getDay() === 0 || x.getDay() === 6 };
    expect(iso(closestEnabledDate(d(2025, 5, 24), weekdays))).toBe("2025-05-23");
    expect(iso(closestEnabledDate(d(1800, 1, 1), {}))).toBe("1900-01-01");
    expect(iso(closestEnabledDate(d(2200, 1, 1), {}))).toBe("2099-12-31");
    expect(closestEnabledDate(d(2025, 5, 24), { shouldDisableDate: () => true })).toBeNull();
    expect(iso(stepEnabledDate(d(2025, 5, 23), 1, weekdays))).toBe("2025-05-26");
    expect(iso(stepEnabledDate(d(2099, 12, 31), 1, {}))).toBe("2099-12-31");
    expect(iso(stepEnabledDate(d(2025, 5, 23), 1, { shouldDisableDate: () => true }))).toBe(
      "2025-05-23",
    );
  });

  it("walks views", () => {
    expect(nextView(["year", "day"], "year")).toBe("day");
    expect(nextView(["year", "day"], "day")).toBeNull();
    expect(nextView(["day"], "month")).toBeNull();
    expect(initialView(["year", "day"])).toBe("day");
    expect(initialView(["year", "month"])).toBe("month");
    expect(initialView(["year", "day"], "year")).toBe("year");
    expect(initialView(["day"], "year")).toBe("day");
  });
});

describe("picker helpers", () => {
  it("resolves desktop or mobile", () => {
    const view = (matches: boolean) =>
      ({ matchMedia: () => ({ matches }) }) as unknown as Window & typeof globalThis;
    expect(resolvePickerMode("desktop", undefined, view(false))).toBe("desktop");
    expect(resolvePickerMode("static", undefined, view(false))).toBe("static");
    expect(resolvePickerMode("mobile", undefined, view(true))).toBe("mobile");
    expect(resolvePickerMode("responsive", undefined, view(true))).toBe("desktop");
    expect(resolvePickerMode("responsive", "@media (min-width: 9999px)", view(false))).toBe(
      "mobile",
    );
    expect(resolvePickerMode("responsive", undefined, null)).toBe("desktop");
    const broken = {
      matchMedia: () => {
        throw new Error("bad");
      },
    } as unknown as Window & typeof globalThis;
    expect(resolvePickerMode("responsive", "((", broken)).toBe("desktop");
  });

  it("knows default actions, close-on-select and parses actions", () => {
    expect(defaultPickerActions("desktop")).toEqual([]);
    expect(defaultPickerActions("mobile")).toEqual(["cancel", "accept"]);
    expect(defaultCloseOnSelect("desktop")).toBe(true);
    expect(defaultCloseOnSelect("mobile")).toBe(false);
    expect(parsePickerActions("clear  today today bogus")).toEqual(["clear", "today"]);
    expect(parsePickerActions(["accept", 3])).toEqual(["accept"]);
    expect(parsePickerActions(5)).toEqual([]);
    expect(parsePickerActions(null)).toBeUndefined();
  });

  it("evaluates shortcuts defensively", () => {
    expect(iso(shortcutValue({ label: "a", getValue: () => d(2025, 1, 1) }, {}) ?? null)).toBe(
      "2025-01-01",
    );
    expect(shortcutValue({ label: "a", getValue: () => null }, {})).toBeNull();
    expect(
      shortcutValue(
        {
          label: "a",
          getValue: () => {
            throw new Error("x");
          },
        },
        {},
      ),
    ).toBeUndefined();
    expect(shortcutValue({ label: "a", getValue: () => "x" as never }, {})).toBeUndefined();
    expect(
      shortcutValue(
        { label: "a", getValue: ({ isValid }) => (isValid(d(1800, 1, 1)) ? d(1800, 1, 1) : null) },
        {},
      ),
    ).toBeNull();
  });

  it("formats toolbar and header texts and compares values", () => {
    expect(pickerToolbarText(d(2025, 5, 25), "en-US", "––")).toBe("Sun, May 25");
    expect(pickerToolbarText(null, "en-US", "––")).toBe("––");
    expect(calendarHeaderText(d(2025, 5, 25), "en-US")).toBe("May 2025");
    expect(isSamePickerValue(null, null)).toBe(true);
    expect(isSamePickerValue(null, d(2025, 1, 1))).toBe(false);
    expect(isSamePickerValue(invalidDate(), invalidDate())).toBe(true);
    expect(isSamePickerValue(invalidDate(), d(2025, 1, 1))).toBe(false);
    expect(isSamePickerValue(d(2025, 1, 1), d(2025, 1, 1))).toBe(true);
  });
});

describe("more branches", () => {
  const ref = makeDate(2026, 10, 8);
  it("adjusts week days, lowercase meridiems, two-digit years, hours and minutes", () => {
    const all = parseFormat("dddd a YY hh HH mm");
    const values = ["", "", "", "", "", ""];
    expect(adjustSection(0, 1, ["Sunday", "", "", "", "", ""], all, "en-US", ref)).toBe("Monday");
    expect(adjustSection(1, 1, ["", "am", "", "", "", ""], all, "en-US", ref)).toBe("pm");
    expect(adjustSection(2, "max", values, all, "en-US", ref)).toBe("99");
    expect(adjustSection(3, "min", values, all, "en-US", ref)).toBe("01");
    expect(adjustSection(3, "max", values, all, "en-US", ref)).toBe("12");
    expect(adjustSection(4, "max", values, all, "en-US", ref)).toBe("23");
    expect(adjustSection(5, -1, ["", "", "", "", "", "00"], all, "en-US", ref)).toBe("59");
  });

  it("rejects digit sections that aren't numbers", () => {
    const sections = parseFormat("MM/DD/YYYY");
    expect(isValidDate(sectionsToDate(["x", "01", "2025"], sections, "en-US", ref))).toBe(false);
  });

  it("pastes formats without separators, and escapes letters in locale patterns", () => {
    // "M" isn't padded: "05" becomes "5".
    expect(parsePastedText("0525", parseFormat("MD"), "en-US")).toEqual(["5", "25"]);
    expect(escapeFormatLiteral(" de ")).toBe(" [d][e] ");
    expect(parseFormat(`DD${escapeFormatLiteral(" de ")}MM`).map((s) => s.token)).toEqual([
      "DD",
      "MM",
    ]);
  });

  it("skips candidates outside the limits when looking for an enabled day", () => {
    const rules = {
      shouldDisableDate: (day: Date) =>
        day.getFullYear() === 1900 && day.getMonth() === 0 && day.getDate() < 6,
    };
    expect(iso(closestEnabledDate(d(1900, 1, 2), rules))).toBe("1900-01-06");
  });
});
