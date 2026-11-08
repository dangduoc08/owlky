/**
 * Calendar systems (phase 4, ADR-0030): the year, month and day of a date in the Gregorian
 * calendar or in another calendar `Intl` knows (Persian / Jalali, Hijri, Buddhist, Indian). Values
 * stay native `Date` objects and ISO 8601 text (always Gregorian); only what the calendars show
 * (months, years, day numbers, field sections) follows the calendar system.
 *
 * The calendar comes from the locale's Unicode extension (`fa-IR-u-ca-persian`), as in `Intl`.
 * Without one, pickers use the Gregorian calendar even for locales whose default is another one
 * (`ar-SA`, `fa-IR`), as MUI X does without a Jalali / Hijri adapter.
 */

/** Calendar systems the pickers support: twelve months a year and years that only grow. */
export const pickerCalendars = [
  "gregory",
  "persian",
  "islamic-umalqura",
  "islamic-civil",
  "islamic-tbla",
  "buddhist",
  "indian",
] as const;
export type PickerCalendarId = (typeof pickerCalendars)[number];

/** Year, month and day arithmetic of one calendar system (months are 0-based). */
export interface PickerCalendarSystem {
  readonly id: PickerCalendarId;
  year(date: Date): number;
  month(date: Date): number;
  day(date: Date): number;
  /** A local date at midnight; `month` may overflow into other years, `day` must be ≥ 1. */
  make(year: number, month: number, day: number): Date;
  daysInMonth(year: number, month: number): number;
}

const DAY_MS = 86_400_000;

/** A local date at midnight from Gregorian parts (years below 100 too). */
function localDate(year: number, month: number, day: number): Date {
  const date = new Date(2000, 0, 1);
  date.setFullYear(year, month, day);
  return date;
}

export const gregorianCalendar: PickerCalendarSystem = {
  id: "gregory",
  year: (date) => date.getFullYear(),
  month: (date) => date.getMonth(),
  day: (date) => date.getDate(),
  make: localDate,
  daysInMonth: (year, month) => localDate(year, month + 1, 0).getDate(),
};

/** Days since 1970-01-01 of a local date's calendar day. */
const dayNumber = (date: Date) =>
  Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);

const fromDayNumber = (n: number) => {
  const utc = new Date(n * DAY_MS);
  return localDate(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate());
};

const CACHE_LIMIT = 4096;

/** A calendar system computed with `Intl.DateTimeFormat` (any calendar of `pickerCalendars`). */
function intlCalendar(id: Exclude<PickerCalendarId, "gregory">): PickerCalendarSystem {
  const format = new Intl.DateTimeFormat(`en-US-u-ca-${id}-nu-latn`, {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "UTC",
  });
  const parts = new Map<number, [number, number, number]>();
  const starts = new Map<number, number>();
  const partsOf = (n: number): [number, number, number] => {
    const known = parts.get(n);
    if (known) return known;
    let year = 0;
    let month = 0;
    let day = 0;
    for (const part of format.formatToParts(new Date(n * DAY_MS + DAY_MS / 2))) {
      if (part.type === "year") year = Number.parseInt(part.value, 10);
      else if (part.type === "month") month = Number.parseInt(part.value, 10) - 1;
      else if (part.type === "day") day = Number.parseInt(part.value, 10);
    }
    if (parts.size > CACHE_LIMIT) parts.clear();
    const result: [number, number, number] = [year, month, day];
    parts.set(n, result);
    return result;
  };
  // Mean month length: lunar calendars are shorter.
  const meanMonth = id.startsWith("islamic") ? 29.53 : 30.44;
  /** Day number of the first day of a month (`month` normalized into the year). */
  const monthStart = (year: number, month: number): number => {
    const key = year * 12 + month;
    const known = starts.get(key);
    if (known !== undefined) return known;
    const [y0, m0, d0] = partsOf(0);
    let guess = Math.round((key - (y0 * 12 + m0)) * meanMonth) - (d0 - 1);
    for (let i = 0; i < 32; i++) {
      const [y, m, d] = partsOf(guess);
      const diff = key - (y * 12 + m);
      if (diff === 0) {
        guess -= d - 1;
        break;
      }
      guess += Math.abs(diff) > 1 ? Math.round(diff * meanMonth) : diff > 0 ? 32 - d : -d;
    }
    if (starts.size > CACHE_LIMIT) starts.clear();
    starts.set(key, guess);
    return guess;
  };
  const normalize = (year: number, month: number): [number, number] => {
    const total = year * 12 + month;
    const y = Math.floor(total / 12);
    return [y, total - y * 12];
  };
  return {
    id,
    year: (date) => partsOf(dayNumber(date))[0],
    month: (date) => partsOf(dayNumber(date))[1],
    day: (date) => partsOf(dayNumber(date))[2],
    make(year, month, day) {
      const [y, m] = normalize(year, month);
      return fromDayNumber(monthStart(y, m) + day - 1);
    },
    daysInMonth(year, month) {
      const [y, m] = normalize(year, month);
      const [ny, nm] = normalize(y, m + 1);
      return monthStart(ny, nm) - monthStart(y, m);
    },
  };
}

const systems = new Map<PickerCalendarId, PickerCalendarSystem>([["gregory", gregorianCalendar]]);

/** The calendar system of an id (unknown ids: Gregorian). */
export function calendarSystem(id: unknown): PickerCalendarSystem {
  const known = pickerCalendars.includes(id as PickerCalendarId)
    ? (id as PickerCalendarId)
    : "gregory";
  let system = systems.get(known);
  if (!system) {
    system = intlCalendar(known as Exclude<PickerCalendarId, "gregory">);
    systems.set(known, system);
  }
  return system;
}

/** The supported calendar of a locale's `-u-ca-` extension, else `"gregory"`. */
export function localeCalendar(locale: string): PickerCalendarId {
  try {
    const calendar = new Intl.Locale(locale).calendar;
    return pickerCalendars.includes(calendar as PickerCalendarId)
      ? (calendar as PickerCalendarId)
      : "gregory";
  } catch {
    return "gregory";
  }
}

/** The calendar system of a locale (its `-u-ca-` extension, else Gregorian). */
export const pickerCalendar = (locale: string): PickerCalendarSystem =>
  calendarSystem(localeCalendar(locale));

/**
 * The locale with a calendar: `withCalendar("fa-IR", "persian")` → `"fa-IR-u-ca-persian"`.
 * An unknown calendar keeps the locale's own extension (or none).
 */
export function withCalendar(locale: string, calendar: unknown): string {
  if (!pickerCalendars.includes(calendar as PickerCalendarId)) return locale;
  try {
    return new Intl.Locale(locale, { calendar: calendar as string }).toString();
  } catch {
    return locale;
  }
}

/**
 * The locale for `Intl` date formats: the pickers' calendar made explicit, so a locale whose
 * default calendar isn't Gregorian (`ar-SA`) still formats Gregorian months unless it asks
 * for another calendar.
 */
export const intlLocale = (locale: string): string => withCalendar(locale, localeCalendar(locale));
