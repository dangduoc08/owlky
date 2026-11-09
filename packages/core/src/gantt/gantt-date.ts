/**
 * Gantt dates (ADR-0048): ISO days (`YYYY-MM-DD`) as UTC day numbers, so daylight saving and time
 * zones never move a bar. Text comes from `Intl.DateTimeFormat` in UTC.
 */

const DAY_MS = 86_400_000;
const ISO_DAY = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/;

/** A day number (days since 1970-01-01) from an ISO date or a `Date` (its local calendar day). */
export function ganttDay(value: unknown): number | undefined {
  if (value instanceof Date) {
    const time = value.getTime();
    if (Number.isNaN(time)) return undefined;
    return Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()) / DAY_MS;
  }
  if (typeof value !== "string" || value.length > 40) return undefined;
  const match = ISO_DAY.exec(value.trim());
  if (!match) return undefined;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return undefined;
  return date.getTime() / DAY_MS;
}

/** The ISO date (`YYYY-MM-DD`) of a day number. */
export const ganttIsoDay = (day: number): string =>
  new Date(day * DAY_MS).toISOString().slice(0, 10);

const utc = (day: number) => new Date(day * DAY_MS);
/** 0 = Sunday … 6 = Saturday. */
export const ganttWeekday = (day: number): number => utc(day).getUTCDay();
const dayOf = (year: number, month: number, date = 1) => Date.UTC(year, month, date) / DAY_MS;

/** Calendar units of the timeline header. */
export type GanttUnit = "day" | "week" | "month" | "quarter" | "half" | "year";

/** The first day of the unit that holds `day`. */
export function ganttUnitStart(unit: GanttUnit, day: number, weekStart = 1): number {
  const date = utc(day);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  switch (unit) {
    case "day":
      return day;
    case "week":
      return day - ((ganttWeekday(day) - weekStart + 7) % 7);
    case "month":
      return dayOf(year, month);
    case "quarter":
      return dayOf(year, month - (month % 3));
    case "half":
      return dayOf(year, month < 6 ? 0 : 6);
    default:
      return dayOf(year, 0);
  }
}

/** The first day of the unit after the one that starts on `start`. */
export function ganttUnitNext(unit: GanttUnit, start: number): number {
  const date = utc(start);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  switch (unit) {
    case "day":
      return start + 1;
    case "week":
      return start + 7;
    case "month":
      return dayOf(year, month + 1);
    case "quarter":
      return dayOf(year, month + 3);
    case "half":
      return dayOf(year, month + 6);
    default:
      return dayOf(year + 1, 0);
  }
}

const formats = new Map<string, Intl.DateTimeFormat>();
/** A cached UTC formatter (an unknown locale falls back to the default one). */
function formatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let format = formats.get(key);
  if (!format) {
    try {
      format = new Intl.DateTimeFormat(locale, { ...options, timeZone: "UTC" });
    } catch {
      format = new Intl.DateTimeFormat(undefined, { ...options, timeZone: "UTC" });
    }
    formats.set(key, format);
  }
  return format;
}

/** Formats a day number. */
export const ganttFormat = (day: number, locale: string, options: Intl.DateTimeFormatOptions) =>
  formatter(locale, options).format(utc(day));

/** The short date of the task list and the tooltip (`Mar 3, 2025`). */
export const ganttShortDate = (day: number, locale: string) =>
  ganttFormat(day, locale, { year: "numeric", month: "short", day: "numeric" });

/** The long date of accessible names (`March 3, 2025`). */
export const ganttLongDate = (day: number, locale: string) =>
  ganttFormat(day, locale, { year: "numeric", month: "long", day: "numeric" });

/** The label of a header cell of `unit` that starts on `day`. */
export function ganttUnitLabel(unit: GanttUnit, day: number, locale: string, top: boolean): string {
  const date = utc(day);
  switch (unit) {
    case "day":
      return String(date.getUTCDate());
    case "week":
      return ganttFormat(day, locale, { month: "short", day: "numeric" });
    case "month":
      return top
        ? ganttFormat(day, locale, { month: "long", year: "numeric" })
        : ganttFormat(day, locale, { month: "short" });
    case "quarter":
      return `Q${Math.floor(date.getUTCMonth() / 3) + 1}`;
    case "half":
      return `H${date.getUTCMonth() < 6 ? 1 : 2}`;
    default:
      return String(date.getUTCFullYear());
  }
}
