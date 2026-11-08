/**
 * Calendar model (ADR-0022): the weeks of a month, which dates / months / years can be picked,
 * and validation reasons (MUI's `onError` values).
 */
import {
  addDays,
  type DateView,
  dayDiff,
  isSameMonth,
  isValidDate,
  makeDate,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "./dates.js";

/** MUI's limits when none are given. */
export const DEFAULT_MIN_DATE = (): Date => makeDate(1900, 0, 1);
export const DEFAULT_MAX_DATE = (): Date => makeDate(2099, 11, 31);

/** Date limits and rules shared by calendars, fields and pickers. */
export interface DateRules {
  minDate?: Date | null | undefined;
  maxDate?: Date | null | undefined;
  disablePast?: boolean | undefined;
  disableFuture?: boolean | undefined;
  shouldDisableDate?: ((day: Date) => boolean) | undefined;
  shouldDisableMonth?: ((month: Date) => boolean) | undefined;
  shouldDisableYear?: ((year: Date) => boolean) | undefined;
  /** "Today" (tests and stories can pin it). Default: now. */
  today?: Date | undefined;
}

export type DateValidationError =
  | "invalidDate"
  | "minDate"
  | "maxDate"
  | "disablePast"
  | "disableFuture"
  | "shouldDisableDate"
  | "shouldDisableMonth"
  | "shouldDisableYear";

const lower = (rules: DateRules) =>
  startOfDay(isValidDate(rules.minDate) ? rules.minDate : DEFAULT_MIN_DATE());
const upper = (rules: DateRules) =>
  startOfDay(isValidDate(rules.maxDate) ? rules.maxDate : DEFAULT_MAX_DATE());
const todayOf = (rules: DateRules) => startOfDay(rules.today ?? new Date());

/** Why a value is invalid, or `null` (an empty value is valid). */
export function validateDate(value: Date | null, rules: DateRules): DateValidationError | null {
  if (value === null) return null;
  if (!isValidDate(value)) return "invalidDate";
  const day = startOfDay(value);
  if (rules.shouldDisableDate?.(day)) return "shouldDisableDate";
  if (rules.shouldDisableMonth?.(startOfMonth(day))) return "shouldDisableMonth";
  if (rules.shouldDisableYear?.(makeDate(day.getFullYear(), 0, 1))) return "shouldDisableYear";
  if (rules.disableFuture && dayDiff(day, todayOf(rules)) > 0) return "disableFuture";
  if (rules.disablePast && dayDiff(day, todayOf(rules)) < 0) return "disablePast";
  if (dayDiff(day, lower(rules)) < 0) return "minDate";
  if (dayDiff(day, upper(rules)) > 0) return "maxDate";
  return null;
}

/** A day can't be picked. */
export const isDateDisabled = (day: Date, rules: DateRules): boolean =>
  validateDate(day, rules) !== null;

/** Earliest and latest pickable days (limits, past / future). */
export function dateBounds(rules: DateRules): [Date, Date] {
  let min = lower(rules);
  let max = upper(rules);
  const today = todayOf(rules);
  if (rules.disablePast && dayDiff(today, min) > 0) min = today;
  if (rules.disableFuture && dayDiff(max, today) > 0) max = today;
  return [min, max];
}

/** A whole month can't be picked (outside the limits, or `shouldDisableMonth`). */
export function isMonthDisabled(month: Date, rules: DateRules): boolean {
  const first = startOfMonth(month);
  const [min, max] = dateBounds(rules);
  if (first.getFullYear() * 12 + first.getMonth() < min.getFullYear() * 12 + min.getMonth())
    return true;
  if (first.getFullYear() * 12 + first.getMonth() > max.getFullYear() * 12 + max.getMonth())
    return true;
  if (rules.shouldDisableYear?.(makeDate(first.getFullYear(), 0, 1))) return true;
  return rules.shouldDisableMonth?.(first) === true;
}

/** A whole year can't be picked (outside the limits, or `shouldDisableYear`). */
export function isYearDisabled(year: number, rules: DateRules): boolean {
  const [min, max] = dateBounds(rules);
  if (year < min.getFullYear() || year > max.getFullYear()) return true;
  return rules.shouldDisableYear?.(makeDate(year, 0, 1)) === true;
}

/** Years from the earliest to the latest limit (`desc`: newest first). */
export function yearRange(rules: DateRules, order: "asc" | "desc" = "asc"): number[] {
  const from = lower(rules).getFullYear();
  const to = upper(rules).getFullYear();
  const years = Array.from({ length: Math.max(0, to - from + 1) }, (_, i) => from + i);
  return order === "desc" ? years.reverse() : years;
}

export interface CalendarDay {
  date: Date;
  /** Outside the shown month. */
  outside: boolean;
}

/**
 * The weeks shown for a month: whole weeks from `weekStart`, plus extra weeks after the month to
 * reach `fixedWeekNumber` when given.
 */
export function calendarWeeks(
  month: Date,
  weekStart: number,
  fixedWeekNumber?: number | undefined,
): CalendarDay[][] {
  const first = startOfMonth(month);
  const target = Math.min(Math.max(Math.trunc(fixedWeekNumber ?? 0), 0), 12);
  let cursor = startOfWeek(first, weekStart);
  const weeks: CalendarDay[][] = [];
  do {
    const week: CalendarDay[] = [];
    for (let i = 0; i < 7; i++) {
      week.push({ date: cursor, outside: !isSameMonth(cursor, first) });
      cursor = addDays(cursor, 1);
    }
    weeks.push(week);
  } while (isSameMonth(cursor, first) || weeks.length < target);
  return weeks;
}

/**
 * The enabled day closest to `date`, searching forward and backward up to a year, inside the
 * limits; `null` when none.
 */
export function closestEnabledDate(date: Date, rules: DateRules): Date | null {
  const [min, max] = dateBounds(rules);
  let start = startOfDay(date);
  if (dayDiff(start, min) < 0) start = min;
  if (dayDiff(start, max) > 0) start = max;
  for (let i = 0; i <= 366; i++) {
    for (const candidate of [addDays(start, i), addDays(start, -i)]) {
      if (dayDiff(candidate, min) < 0 || dayDiff(candidate, max) > 0) continue;
      if (!isDateDisabled(candidate, rules)) return candidate;
    }
  }
  return null;
}

/**
 * The next enabled day from `from` stepping by `step` days (arrow keys), staying inside the
 * limits; `from` itself when there's none.
 */
export function stepEnabledDate(from: Date, step: number, rules: DateRules): Date {
  const [min, max] = dateBounds(rules);
  let cursor = addDays(from, step);
  for (let i = 0; i < 366; i++) {
    if (dayDiff(cursor, min) < 0 || dayDiff(cursor, max) > 0) return from;
    if (!isDateDisabled(cursor, rules)) return cursor;
    cursor = addDays(cursor, step);
  }
  return from;
}

/** The view after `view` in `views`, or `null` on the last one. */
export function nextView(views: readonly DateView[], view: DateView): DateView | null {
  const at = views.indexOf(view);
  return at === -1 || at === views.length - 1 ? null : (views[at + 1] as DateView);
}

/** The view a calendar opens on: `openTo` when it's one of `views`, else the last view. */
export const initialView = (views: readonly DateView[], openTo?: DateView): DateView =>
  openTo && views.includes(openTo)
    ? openTo
    : views.includes("day")
      ? "day"
      : (views.at(-1) as DateView);
