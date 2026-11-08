import { describe, expect, it } from "vitest";
import { createDateConverter, nativeDateAdapter, resolveTimezone } from "./adapter.js";
import {
  calendarWeeks,
  isMonthDisabled,
  isYearDisabled,
  validateDate,
  yearRange,
} from "./calendar.js";
import {
  calendarSystem,
  gregorianCalendar,
  intlLocale,
  localeCalendar,
  pickerCalendar,
  pickerCalendars,
  withCalendar,
} from "./calendar-system.js";
import {
  addMonths,
  addYears,
  daysInMonth,
  formatCalendarMonth,
  formatIsoDate,
  isSameMonth,
  isSameYear,
  makeDate,
  monthDiff,
  parseCalendarMonth,
  parseIsoDate,
  setDateParts,
  startOfMonth,
} from "./dates.js";
import { sectionAria, sectionsToDate, sectionValues } from "./field.js";
import { formatSection, formatWith, localeDateFormat, parseFormat } from "./format.js";
import { formatDate, monthNames, pickerLocaleText, pickersEnUS } from "./locale.js";
import * as packs from "./locales.js";
import { initialRangeMonth, monthsShowing, visibleMonths } from "./range.js";
import {
  formatIsoOffset,
  fromWallClock,
  isZonedTimezone,
  nowInTimezone,
  parseIsoInZone,
  safeTimezone,
  systemTimezone,
  timezoneOffset,
  toWallClock,
} from "./timezone.js";

const persian = calendarSystem("persian");
const FA = "fa-IR-u-ca-persian";
const iso = (date: Date) => formatIsoDate(date);

describe("calendar systems (ADR-0030)", () => {
  it("reads and builds Persian, Hijri and other dates", () => {
    const day = makeDate(2025, 4, 25);
    expect([persian.year(day), persian.month(day), persian.day(day)]).toEqual([1404, 2, 4]);
    expect(iso(persian.make(1404, 2, 4))).toBe("2025-05-25");
    expect(iso(persian.make(1404, 12, 1))).toBe("2026-03-21");
    expect(iso(persian.make(1405, -1, 1))).toBe(iso(persian.make(1404, 11, 1)));
    expect(persian.daysInMonth(1404, 0)).toBe(31);
    expect(persian.daysInMonth(1404, 11)).toBe(29);
    for (const id of pickerCalendars) {
      const cal = calendarSystem(id);
      const back = cal.make(cal.year(day), cal.month(day), cal.day(day));
      expect(iso(back)).toBe("2025-05-25");
      expect(cal.daysInMonth(cal.year(day), cal.month(day))).toBeGreaterThanOrEqual(29);
    }
    expect(calendarSystem("islamic-umalqura").year(day)).toBe(1446);
    expect(calendarSystem("hebrew")).toBe(gregorianCalendar);
    expect(calendarSystem("persian")).toBe(persian);
  });

  it("walks every day of decades without drift (and refills its caches)", () => {
    const cal = calendarSystem("islamic-civil");
    let day = makeDate(2000, 0, 1);
    for (let i = 0; i < 6000; i++) {
      expect(cal.make(cal.year(day), cal.month(day), cal.day(day)).getTime()).toBe(day.getTime());
      day = makeDate(day.getFullYear(), day.getMonth(), day.getDate() + 1);
    }
    let months = 0;
    for (let year = 1100; year < 1500; year++)
      for (let month = 0; month < 12; month++) months += cal.daysInMonth(year, month) > 0 ? 1 : 0;
    expect(months).toBe(4800);
  });

  it("takes the calendar from the locale's extension", () => {
    expect(localeCalendar(FA)).toBe("persian");
    expect(localeCalendar("fa-IR")).toBe("gregory");
    expect(localeCalendar("ar-SA-u-ca-hebrew")).toBe("gregory");
    expect(localeCalendar("")).toBe("gregory");
    expect(pickerCalendar(FA)).toBe(persian);
    expect(withCalendar("fa-IR", "persian")).toBe(FA);
    expect(withCalendar("fa-IR", "hebrew")).toBe("fa-IR");
    expect(withCalendar("not a locale", "persian")).toBe("not a locale");
    expect(intlLocale("ar-SA")).toBe("ar-SA-u-ca-gregory");
    expect(intlLocale(FA)).toBe(FA);
  });

  it("does calendar arithmetic in the calendar", () => {
    const day = makeDate(2025, 4, 25);
    expect(iso(startOfMonth(day, persian))).toBe("2025-05-22");
    expect(iso(makeDate(1404, 2, 1, persian))).toBe("2025-05-22");
    expect(iso(makeDate(1404, 2, 10, persian))).toBe("2025-05-31");
    expect(iso(addMonths(day, 1, persian))).toBe("2025-06-25");
    expect(iso(addMonths(makeDate(1404, 5, 31, persian), 1, persian))).toBe(
      iso(makeDate(1404, 6, 30, persian)),
    );
    expect(iso(addYears(day, -1, persian))).toBe("2024-05-24");
    expect(isSameMonth(makeDate(2025, 4, 21), day, persian)).toBe(false);
    expect(isSameMonth(makeDate(2025, 4, 21), day)).toBe(true);
    expect(isSameYear(makeDate(2025, 2, 20), makeDate(2025, 2, 21), persian)).toBe(false);
    expect(monthDiff(day, makeDate(2024, 4, 25), persian)).toBe(12);
    expect(daysInMonth(1404, 2, persian)).toBe(31);
    const at = new Date(2025, 4, 25, 9, 30);
    const moved = setDateParts(at, { month: 0, hours: 10 }, persian);
    expect([iso(moved), moved.getHours(), moved.getMinutes()]).toEqual(["2025-03-24", 10, 30]);
    expect(setDateParts(at, { minutes: 5 }, persian).getMinutes()).toBe(5);
  });

  it("validates and lays out months and years of the calendar", () => {
    const rules = {
      calendar: persian,
      minDate: makeDate(2025, 0, 1),
      maxDate: makeDate(2030, 0, 1),
      shouldDisableMonth: (month: Date) => persian.month(month) === 6,
      shouldDisableYear: (year: Date) => persian.year(year) === 1406,
    };
    expect(validateDate(makeDate(1404, 6, 3, persian), rules)).toBe("shouldDisableMonth");
    expect(validateDate(makeDate(1406, 0, 3, persian), rules)).toBe("shouldDisableYear");
    expect(isMonthDisabled(makeDate(1403, 8, 1, persian), rules)).toBe(true);
    expect(isMonthDisabled(makeDate(1403, 10, 1, persian), rules)).toBe(false);
    expect(isMonthDisabled(makeDate(1409, 0, 1, persian), rules)).toBe(true);
    expect(isMonthDisabled(makeDate(1406, 3, 1, persian), rules)).toBe(true);
    expect(isYearDisabled(1403, rules)).toBe(false);
    expect(isYearDisabled(1402, rules)).toBe(true);
    expect(isYearDisabled(1406, rules)).toBe(true);
    expect(yearRange(rules)).toEqual([1403, 1404, 1405, 1406, 1407, 1408]);
    const weeks = calendarWeeks(makeDate(2025, 4, 25), 6, 6, persian);
    expect(weeks).toHaveLength(6);
    const inside = weeks.flat().filter((d) => !d.outside);
    expect(inside).toHaveLength(31);
    expect(iso((inside[0] as { date: Date }).date)).toBe("2025-05-22");
  });

  it("names months, formats and fields in the calendar", () => {
    expect(monthNames("en-US-u-ca-persian", "long")[0]).toBe("Farvardin");
    expect(monthNames("en-US", "short")[4]).toBe("May");
    expect(formatDate(makeDate(2025, 4, 25), "ar-SA-u-nu-latn", { year: "numeric" })).toBe("2025");
    expect(localeDateFormat("en-US-u-ca-persian")).toBe("MM/DD/YYYY");
    const sections = parseFormat("YYYY/MM/DD MMMM");
    const day = makeDate(2025, 4, 25);
    expect(formatWith(day, "YYYY/MM/DD", "en-US-u-ca-persian")).toBe("1404/03/04");
    expect(formatSection(day, sections[3] as never, "en-US-u-ca-persian")).toBe("Khordad");
    const values = sectionValues(day, sections, "en-US-u-ca-persian");
    expect(values).toEqual(["1404", "03", "04", "Khordad"]);
    const text = pickerLocaleText("en-US");
    expect(sectionAria(2, values, sections, "en-US-u-ca-persian", text).max).toBe(31);
    expect(sectionAria(2, ["1404", "12", "", ""], sections, "en-US-u-ca-persian", text).max).toBe(
      29,
    );
    const parsed = sectionsToDate(
      ["1404", "03", "04", "Khordad"],
      sections,
      "en-US-u-ca-persian",
      makeDate(2026, 0, 1),
    );
    expect(iso(parsed as Date)).toBe("2025-05-25");
    expect(
      Number.isNaN(
        (
          sectionsToDate(
            ["1404", "12", "30", "Esfand"],
            sections,
            "en-US-u-ca-persian",
            day,
          ) as Date
        ).getTime(),
      ),
    ).toBe(true);
  });

  it("writes and reads shown months", () => {
    expect(formatCalendarMonth(makeDate(2025, 4, 25))).toBe("2025-05");
    expect(formatCalendarMonth(makeDate(2025, 4, 25), persian)).toBe("2025-05-22");
    expect(iso(parseCalendarMonth("2025-05") as Date)).toBe("2025-05-01");
    expect(iso(parseCalendarMonth("2025-05-25", persian) as Date)).toBe("2025-05-22");
    expect(parseCalendarMonth("May")).toBeNull();
    expect(parseCalendarMonth(null)).toBeNull();
  });

  it("shows range months in the calendar", () => {
    const first = initialRangeMonth([makeDate(2025, 4, 25), null], new Date(), 2, 2, persian);
    expect(iso(first)).toBe("2025-04-21");
    expect(visibleMonths(first, 2, persian).map(iso)).toEqual(["2025-04-21", "2025-05-22"]);
    expect(iso(monthsShowing(makeDate(2025, 5, 25), first, 2, persian))).toBe("2025-05-22");
    expect(iso(monthsShowing(makeDate(2025, 4, 1), first, 2, persian))).toBe("2025-04-21");
    expect(iso(monthsShowing(makeDate(2025, 2, 1), first, 2, persian))).toBe("2025-02-19");
  });
});

describe("time zones (ADR-0030)", () => {
  it("accepts only known zones", () => {
    expect(safeTimezone("default")).toBe("default");
    expect(safeTimezone("system")).toBe("system");
    expect(safeTimezone("UTC")).toBe("UTC");
    expect(safeTimezone("America/New_York")).toBe("America/New_York");
    expect(safeTimezone("Mars/Olympus")).toBe("default");
    expect(safeTimezone('"><img onerror=x>')).toBe("default");
    expect(safeTimezone(42)).toBe("default");
    expect(isZonedTimezone("UTC")).toBe(true);
    expect(isZonedTimezone("system")).toBe(false);
    expect(isZonedTimezone(undefined)).toBe(false);
    expect(systemTimezone()).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
    // More zones than the formatter cache holds.
    for (const zone of Intl.supportedValuesOf("timeZone").slice(0, 80))
      expect(safeTimezone(zone)).not.toBe("default");
  });

  it("converts instants to wall times and back", () => {
    const instant = new Date(Date.UTC(2025, 4, 25, 13, 30, 15, 250));
    const wall = toWallClock(instant, "America/New_York");
    expect([wall.getFullYear(), wall.getMonth(), wall.getDate(), wall.getHours()]).toEqual([
      2025, 4, 25, 9,
    ]);
    expect([wall.getMinutes(), wall.getSeconds(), wall.getMilliseconds()]).toEqual([30, 15, 250]);
    expect(fromWallClock(wall, "America/New_York").getTime()).toBe(instant.getTime());
    expect(toWallClock(instant, "UTC").getHours()).toBe(13);
    expect(toWallClock(instant, "Asia/Ho_Chi_Minh").getHours()).toBe(20);
    expect(timezoneOffset(instant, "America/New_York")).toBe(-240);
    expect(timezoneOffset(instant, "system")).toBe(-instant.getTimezoneOffset());
    expect(timezoneOffset(instant, "Mars/Olympus")).toBe(0);
    expect(timezoneOffset(new Date(Number.NaN), "UTC")).toBe(0);
    // Unconverted: copies.
    expect(toWallClock(instant, "system")).not.toBe(instant);
    expect(fromWallClock(wall, "default").getTime()).toBe(wall.getTime());
    expect(Number.isNaN(toWallClock(new Date(Number.NaN), "UTC").getTime())).toBe(true);
    // Years before the common era.
    const ancient = new Date(0);
    ancient.setUTCFullYear(-50, 0, 1);
    expect(toWallClock(ancient, "UTC").getFullYear()).toBe(-50);
    expect(nowInTimezone("UTC").getTime()).toBeGreaterThan(0);
  });

  it("resolves daylight saving gaps forward and overlaps to the earlier instant", () => {
    const gap = new Date(2025, 2, 9, 2, 30);
    // 02:30 doesn't exist in New York that night: 03:30 EDT (07:30Z).
    if (gap.getHours() === 2)
      expect(fromWallClock(gap, "America/New_York").toISOString()).toBe("2025-03-09T07:30:00.000Z");
    const overlap = new Date(2025, 10, 2, 1, 30);
    if (overlap.getHours() === 1)
      expect(fromWallClock(overlap, "America/New_York").toISOString()).toBe(
        "2025-11-02T05:30:00.000Z",
      );
  });

  it("formats offsets and reads ISO text with one", () => {
    expect(formatIsoOffset(0, "UTC")).toBe("Z");
    expect(formatIsoOffset(-240)).toBe("-04:00");
    expect(formatIsoOffset(330)).toBe("+05:30");
    const read = (text: unknown, zone = "America/New_York") =>
      parseIsoInZone(text, zone, parseIsoDate);
    const wall = read("2025-05-25T13:30:00Z") as Date;
    expect([wall.getHours(), wall.getMinutes()]).toEqual([9, 30]);
    expect((read("2025-05-25T20:30:00+07:00") as Date).getHours()).toBe(9);
    expect((read("2025-05-25T09:30:00") as Date).getHours()).toBe(9);
    expect((read("2025-05-25") as Date).getDate()).toBe(25);
    expect(read("09:30:00")).toBeNull();
    expect(read("2025-02-30T09:30:00Z")).toBeNull();
    expect(read("2025-05-25T09:30:00+19:00")).toBeNull();
    expect(read(5)).toBeNull();
    expect(read("x".repeat(50))).toBeNull();
    const instant = read("2025-05-25T13:30:00Z", "system") as Date;
    expect(instant.getTime()).toBe(Date.UTC(2025, 4, 25, 13, 30));
  });
});

describe("date adapters (ADR-0030)", () => {
  it("resolves the zone from the prop, then the value", () => {
    const zoned = {
      lib: "test",
      isDate: (v: unknown): v is { zone: string | null } => typeof v === "object" && v !== null,
      toDate: () => new Date(0),
      fromDate: () => ({ zone: null }),
      getTimezone: (v: { zone: string | null }) => v.zone,
    };
    expect(resolveTimezone("UTC", zoned, [])).toBe("UTC");
    expect(resolveTimezone(undefined, null, [new Date()])).toBe("system");
    expect(
      resolveTimezone("default", zoned, [null, [{ zone: null }, { zone: "Asia/Tokyo" }]]),
    ).toBe("Asia/Tokyo");
    expect(resolveTimezone("default", zoned, [{ zone: "Mars/Olympus" }])).toBe("system");
    expect(resolveTimezone("default", zoned, ["text"])).toBe("system");
  });

  it("converts public dates to engine wall times and back", () => {
    const native = createDateConverter(null, "default");
    const day = new Date(2025, 4, 25);
    expect(native.timezone).toBe("system");
    expect(native.toEngine(day)).not.toBe(day);
    expect(native.toEngine<Date>(day).getTime()).toBe(day.getTime());
    expect(native.toEngine<Date[]>([day, null])[1]).toBeNull();
    expect(native.toEngine("text")).toBe("text");
    expect(native.fromEngine(undefined)).toBeUndefined();
    expect(native.fromEngine({ x: 1 })).toEqual({ x: 1 });
    const utc = createDateConverter(nativeDateAdapter, "UTC");
    const instant = new Date(Date.UTC(2025, 4, 25, 9, 30));
    const wall = utc.toEngine<Date>(instant);
    expect(wall.getHours()).toBe(9);
    expect(utc.fromEngine<Date[]>([wall])[0]?.getTime()).toBe(instant.getTime());
    expect(Number.isNaN(utc.fromEngine<Date>(new Date(Number.NaN)).getTime())).toBe(true);
    const boxed = {
      lib: "box",
      isDate: (v: unknown): v is { at: Date } => typeof v === "object" && v !== null && "at" in v,
      toDate: (v: { at: Date }) => v.at,
      fromDate: (at: Date) => ({ at }),
    };
    const box = createDateConverter(boxed, "UTC");
    expect(box.toEngine<Date>({ at: instant }).getHours()).toBe(9);
    expect(Number.isNaN(box.toEngine<Date>({ at: new Date(Number.NaN) }).getTime())).toBe(true);
    expect(box.toEngine({ other: 1 })).toEqual({ other: 1 });
    expect(box.fromEngine<{ at: Date }>(wall).at.getTime()).toBe(instant.getTime());
    expect(nativeDateAdapter.isDate(day)).toBe(true);
    expect(nativeDateAdapter.toDate(day)).not.toBe(day);
  });
});

describe("locale packs (ADR-0030)", () => {
  it("fills every key of the English texts with the same kinds", () => {
    const keys = Object.keys(pickersEnUS) as (keyof typeof pickersEnUS)[];
    for (const [name, pack] of Object.entries(packs)) {
      for (const key of keys) {
        expect(typeof pack[key], `${name}.${key}`).toBe(typeof pickersEnUS[key]);
        const value = pack[key] as unknown;
        if (typeof value !== "function") continue;
        const fn = value as (...args: unknown[]) => unknown;
        // Every function returns text for each kind of argument it takes.
        const calls: unknown[][] = key.startsWith("field")
          ? [
              ["YYYY", "letter"],
              ["MM", "digit"],
            ]
          : key === "clockLabelText"
            ? [
                ["hours", null],
                ["minutes", "09:30"],
              ]
            : key === "selectViewText"
              ? [["hours"], ["meridiem"]]
              : key === "calendarViewSwitchingButtonAriaLabel"
                ? [["year"], ["day"]]
                : key.startsWith("open")
                  ? [[null], ["May 25, 2025"]]
                  : [[3]];
        for (const args of calls) expect(typeof fn(...args), `${name}.${key}`).toBe("string");
      }
    }
    expect(packs.pickersFrFR.cancelButtonLabel).toBe("Annuler");
    expect(packs.pickersJaJP.fieldYearPlaceholder("YYYY")).toBe("年");
  });
});
