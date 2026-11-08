/**
 * Calendar math for the pickers (ADR-0022): native `Date` in local time, ISO 8601 in and out.
 * Every function returns a new `Date` and never mutates its argument. Year / month arithmetic
 * takes an optional calendar system (phase 4, ADR-0030; Gregorian by default).
 */
import { gregorianCalendar, type PickerCalendarSystem } from "./calendar-system.js";

export const pickerViews = ["year", "month", "day"] as const;
/** A date view of a calendar. */
export type DateView = (typeof pickerViews)[number];

const DAY_MS = 86_400_000;

/** A valid `Date` (not `Invalid Date`, not another object). */
export const isValidDate = (value: unknown): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime());

/** An invalid date: the value of a partly filled field. */
export const invalidDate = (): Date => new Date(Number.NaN);

/** A local date at midnight; `year` can be below 100 (unlike `new Date(y, m, d)`). */
export function makeDate(
  year: number,
  month: number,
  day: number,
  cal: PickerCalendarSystem = gregorianCalendar,
): Date {
  if (cal !== gregorianCalendar) {
    // Other calendars: `day` may overflow like `Date` does.
    const first = cal.make(year, month, 1);
    return day === 1 ? first : addDays(first, day - 1);
  }
  const date = new Date(2000, 0, 1);
  date.setFullYear(year, month, day);
  return date;
}

/** Same date and time, another year / month / day / time (`undefined` keeps the part). */
export function setDateParts(
  date: Date,
  parts: {
    year?: number | undefined;
    month?: number | undefined;
    day?: number | undefined;
    hours?: number | undefined;
    minutes?: number | undefined;
    seconds?: number | undefined;
  },
  cal: PickerCalendarSystem = gregorianCalendar,
): Date {
  const next = new Date(date.getTime());
  if (
    cal !== gregorianCalendar &&
    (parts.year !== undefined || parts.month !== undefined || parts.day !== undefined)
  ) {
    const day = makeDate(
      parts.year ?? cal.year(date),
      parts.month ?? cal.month(date),
      parts.day ?? cal.day(date),
      cal,
    );
    next.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
    return setDateParts(next, { ...parts, year: undefined, month: undefined, day: undefined });
  }
  next.setFullYear(
    parts.year ?? date.getFullYear(),
    parts.month ?? date.getMonth(),
    parts.day ?? date.getDate(),
  );
  next.setHours(
    parts.hours ?? date.getHours(),
    parts.minutes ?? date.getMinutes(),
    parts.seconds ?? date.getSeconds(),
    date.getMilliseconds(),
  );
  return next;
}

export const startOfDay = (date: Date): Date =>
  makeDate(date.getFullYear(), date.getMonth(), date.getDate());

export const startOfMonth = (date: Date, cal: PickerCalendarSystem = gregorianCalendar): Date =>
  makeDate(cal.year(date), cal.month(date), 1, cal);

export const daysInMonth = (
  year: number,
  month: number,
  cal: PickerCalendarSystem = gregorianCalendar,
): number => cal.daysInMonth(year, month);

/** `date` plus `days` calendar days (keeps the time; safe across daylight saving changes). */
export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

/** `date` plus `months`, clamping the day (31 Jan + 1 month = 28 or 29 Feb). */
export function addMonths(
  date: Date,
  months: number,
  cal: PickerCalendarSystem = gregorianCalendar,
): Date {
  const total = cal.year(date) * 12 + cal.month(date) + months;
  const year = Math.floor(total / 12);
  const month = total - year * 12;
  return setDateParts(
    date,
    { year, month, day: Math.min(cal.day(date), cal.daysInMonth(year, month)) },
    cal,
  );
}

export const addYears = (
  date: Date,
  years: number,
  cal: PickerCalendarSystem = gregorianCalendar,
): Date => addMonths(date, years * 12, cal);

export const isSameYear = (
  a: Date,
  b: Date,
  cal: PickerCalendarSystem = gregorianCalendar,
): boolean => cal.year(a) === cal.year(b);

export const isSameMonth = (
  a: Date,
  b: Date,
  cal: PickerCalendarSystem = gregorianCalendar,
): boolean => isSameYear(a, b, cal) && cal.month(a) === cal.month(b);

/** Months from `b`'s month to `a`'s (positive when `a` is later). */
export const monthDiff = (
  a: Date,
  b: Date,
  cal: PickerCalendarSystem = gregorianCalendar,
): number => (cal.year(a) - cal.year(b)) * 12 + cal.month(a) - cal.month(b);

export const isSameDay = (a: Date, b: Date): boolean =>
  isSameMonth(a, b) && a.getDate() === b.getDate();

/** Whole calendar days from `b` to `a` (positive when `a` is later). */
export const dayDiff = (a: Date, b: Date): number =>
  Math.round(
    (Date.UTC(a.getFullYear(), a.getMonth(), a.getDate()) -
      Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())) /
      DAY_MS,
  );

/** The first day of `date`'s week; `weekStart` 0 = Sunday … 6 = Saturday. */
export const startOfWeek = (date: Date, weekStart: number): Date =>
  addDays(startOfDay(date), -((date.getDay() - weekStart + 7) % 7));

/**
 * Week number: ISO 8601 when weeks start on Monday, otherwise the week holding 1 January is
 * week 1 (the US convention).
 */
export function weekNumber(date: Date, weekStart: number): number {
  const start = startOfWeek(date, weekStart);
  if (weekStart === 1) {
    // ISO: the week holding the year's first Thursday is week 1.
    const thursday = addDays(start, 3);
    const first = startOfWeek(makeDate(thursday.getFullYear(), 0, 4), 1);
    return Math.floor(dayDiff(start, first) / 7) + 1;
  }
  const end = addDays(start, 6);
  const first = startOfWeek(makeDate(end.getFullYear(), 0, 1), weekStart);
  return Math.floor(dayDiff(start, first) / 7) + 1;
}

const pad = (value: number, length: number) => String(Math.abs(value)).padStart(length, "0");

/** `YYYY-MM-DD` of a valid date (local time). */
export const formatIsoDate = (date: Date): string =>
  `${date.getFullYear() < 0 ? "-" : ""}${pad(date.getFullYear(), 4)}-${pad(date.getMonth() + 1, 2)}-${pad(date.getDate(), 2)}`;

/** `HH:mm:ss` of a valid date (local time). */
export const formatIsoTime = (date: Date): string =>
  `${pad(date.getHours(), 2)}:${pad(date.getMinutes(), 2)}:${pad(date.getSeconds(), 2)}`;

/** `YYYY-MM-DDTHH:mm:ss` of a valid date (local time, no offset). */
export const formatIsoDateTime = (date: Date): string =>
  `${formatIsoDate(date)}T${formatIsoTime(date)}`;

const ISO = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?)?$/;
const ISO_TIME = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,3})?)?$/;

/**
 * A local date from `YYYY-MM-DD`, optionally with `THH:mm[:ss]`, or `null` for anything else
 * (wrong shape, out-of-range parts such as 2025-02-30, offsets, more than 32 characters).
 */
export function parseIsoDate(text: unknown): Date | null {
  if (typeof text !== "string" || text.length > 32) return null;
  const match = ISO.exec(text.trim());
  if (!match) return null;
  const [year, month, day, hours = 0, minutes = 0, seconds = 0] = match
    .slice(1)
    .map((part) => (part === undefined ? undefined : Number(part))) as number[];
  if (
    (month as number) < 1 ||
    (month as number) > 12 ||
    (day as number) < 1 ||
    (day as number) > daysInMonth(year as number, (month as number) - 1) ||
    hours > 23 ||
    minutes > 59 ||
    seconds > 59
  )
    return null;
  const date = makeDate(year as number, (month as number) - 1, day as number);
  date.setHours(hours, minutes, seconds, 0);
  return date;
}

/** A time `HH:mm[:ss]` on `reference`'s day, or `null`. */
export function parseIsoTime(text: unknown, reference: Date): Date | null {
  if (typeof text !== "string" || text.length > 16) return null;
  const match = ISO_TIME.exec(text.trim());
  if (!match) return null;
  const [hours, minutes, seconds = 0] = match
    .slice(1)
    .map((part) => (part === undefined ? undefined : Number(part))) as number[];
  if ((hours as number) > 23 || (minutes as number) > 59 || seconds > 59) return null;
  return setDateParts(reference, { hours, minutes, seconds });
}

/** Sorted, unique views in calendar order (year → month → day); unknown names are dropped. */
export const normalizeDateViews = (views: readonly unknown[] | undefined): DateView[] => {
  const list = pickerViews.filter((view) => views?.includes(view));
  return list.length > 0 ? list : ["year", "day"];
};

/**
 * A shown month as text (`data-ok-month`, `monthchange`): `YYYY-MM` in the Gregorian calendar,
 * else the ISO date of the month's first day (other calendars' months don't start on the 1st).
 */
export const formatCalendarMonth = (
  month: Date,
  cal: PickerCalendarSystem = gregorianCalendar,
): string =>
  cal === gregorianCalendar
    ? formatIsoDate(month).slice(0, 7)
    : formatIsoDate(startOfMonth(month, cal));

/** The month of `formatCalendarMonth` text (`YYYY-MM` or an ISO date), or `null`. */
export const parseCalendarMonth = (
  text: unknown,
  cal: PickerCalendarSystem = gregorianCalendar,
): Date | null => {
  if (typeof text !== "string") return null;
  const date = parseIsoDate(/^\d{4}-\d{2}$/.test(text) ? `${text}-01` : text);
  return date ? startOfMonth(date, cal) : null;
};
