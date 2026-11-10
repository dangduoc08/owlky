/**
 * Range model (ADR-0028, phase 3 of ADR-0022): a value is a `[start, end]` pair of dates (either
 * side may be empty). Pure rules shared by the range calendar, the range fields and the range
 * pickers: ISO 8601 intervals (`2025-05-20/2025-05-25`), what a pick does (MUI's
 * `calculateRangeChange`), the highlight and preview of each day, validation (`invalidRange`),
 * the shown months, the field's sections and the shortcuts.
 */
import type { DateRules } from "./calendar.js";
import { gregorianCalendar, type PickerCalendarSystem } from "./calendar-system.js";
import {
  addMonths,
  dayDiff,
  isValidDate,
  monthDiff,
  setDateParts,
  startOfDay,
  startOfMonth,
} from "./dates.js";
import { sectionsToDate, sectionValues } from "./field.js";
import { type FormatSection, fieldSections } from "./format.js";
import { formatDate } from "./locale.js";
import {
  type PickerValidationError,
  type PickerValueType,
  parsePickerValue,
  pickerValueIso,
  type TimeRules,
  validatePickerValue,
} from "./time.js";
import type { PickerTimezone } from "./timezone.js";

/** A range value: start and end (`null` = empty, an invalid date = partly typed). */
export type DateRange = [Date | null, Date | null];

export const rangePositions = ["start", "end"] as const;
/** The end of the range a pick edits. */
export type RangePosition = (typeof rangePositions)[number];

/** Between the two dates of a single input range field (MUI). */
export const RANGE_SEPARATOR = " – ";

/** The number of months a range calendar shows: 1, 2 or 3 (MUI). */
export const rangeCalendarCounts = [1, 2, 3] as const;
export type RangeCalendarCount = (typeof rangeCalendarCounts)[number];

const valid = (date: Date | null | undefined): date is Date => isValidDate(date);

/** A calendar count from a prop or an attribute (invalid → `fallback`). */
export function parseCalendarCount(
  value: unknown,
  fallback: RangeCalendarCount,
): RangeCalendarCount {
  const n = Number(value);
  return n === 1 || n === 2 || n === 3 ? n : fallback;
}

/** `start` or `end` from a prop or an attribute (anything else → `fallback`). */
export const parseRangePosition = (
  value: unknown,
  fallback: RangePosition = "start",
): RangePosition => (value === "start" || value === "end" ? value : fallback);

/**
 * A range from an ISO 8601 interval `start/end` (either side may be empty: `2025-05-20/`).
 * Times take `reference`'s day. `null` for anything else (no slash, a bad side, over 80 chars).
 */
export function parseIsoRange(
  text: unknown,
  reference: Date,
  timezone: PickerTimezone = "system",
): DateRange | null {
  if (typeof text !== "string" || text.length > 80) return null;
  const parts = text.split("/");
  if (parts.length !== 2) return null;
  const side = (part: string) => {
    if (part.trim() === "") return null;
    return parsePickerValue(part, reference, timezone) ?? undefined;
  };
  const start = side(parts[0] as string);
  const end = side(parts[1] as string);
  if (start === undefined || end === undefined) return null;
  return [start, end];
}

/** ISO 8601 interval of a range (`""` when both sides are empty or invalid). */
export function formatIsoRange(range: DateRange, type: PickerValueType): string {
  const side = (date: Date | null) => (valid(date) ? pickerValueIso(date, type) : "");
  const start = side(range[0]);
  const end = side(range[1]);
  return start === "" && end === "" ? "" : `${start}/${end}`;
}

const sameSide = (a: Date | null, b: Date | null) => {
  if (a === null || b === null) return a === b;
  if (!valid(a) || !valid(b)) return !valid(a) && !valid(b);
  return a.getTime() === b.getTime();
};

/** Same start and same end (empty sides equal, invalid sides equal). */
export const isSameRange = (a: DateRange, b: DateRange): boolean =>
  sameSide(a[0], b[0]) && sameSide(a[1], b[1]);

/** Days from `a` to `b` are in order (`a` on or before `b`). */
const ordered = (a: Date, b: Date, byDay: boolean) =>
  byDay ? dayDiff(b, a) >= 0 : b.getTime() >= a.getTime();

/**
 * What picking `day` at `position` makes of `range` (MUI's `calculateRangeChange`): the start
 * position sets the start (a day after the end starts a new range); the end position sets the end
 * (a day before the start starts a new range). `allowFlip` (dragging an end past the other) swaps
 * the ends instead. Returns the new range and the position to edit next.
 */
export function rangeAfterPick(
  range: DateRange,
  day: Date,
  position: RangePosition,
  allowFlip = false,
): { range: DateRange; position: RangePosition } {
  const [start, end] = range;
  if (position === "start") {
    if (valid(end) && !ordered(day, end, true))
      return allowFlip
        ? { range: [end, day], position: "end" }
        : { range: [day, null], position: "end" };
    return { range: [day, end], position: "end" };
  }
  if (valid(start) && !ordered(start, day, true))
    return allowFlip
      ? { range: [day, start], position: "start" }
      : { range: [day, null], position: "end" };
  return { range: [start, day], position: "start" };
}

/**
 * The range a hovered day previews: from the start to the hovered day (end position), or from the
 * hovered day to the end (start position); `null` when nothing is previewed.
 */
export function previewRange(
  range: DateRange,
  hovered: Date | null,
  position: RangePosition,
): DateRange | null {
  if (!valid(hovered)) return null;
  const [start, end] = range;
  if (position === "end" && valid(start) && ordered(start, hovered, true)) return [start, hovered];
  if (position === "start" && valid(end) && ordered(hovered, end, true)) return [hovered, end];
  return null;
}

/** How a day relates to the range and its preview (both inclusive). */
export interface RangeDayState {
  start: boolean;
  end: boolean;
  /** Between the start and the end (inclusive). */
  within: boolean;
  previewStart: boolean;
  previewEnd: boolean;
  /** Inside the preview (inclusive). */
  inPreview: boolean;
}

const sameDay = (a: Date | null, b: Date) => valid(a) && dayDiff(a, b) === 0;
const between = (day: Date, from: Date | null, to: Date | null) =>
  valid(from) && valid(to) && dayDiff(day, from) >= 0 && dayDiff(to, day) >= 0;

/** A day's place in the range and in the hovered (or dragged) preview. */
export function rangeDayState(
  day: Date,
  range: DateRange,
  preview?: DateRange | null,
): RangeDayState {
  const [start, end] = range;
  const [ps, pe] = preview ?? [null, null];
  return {
    start: sameDay(start, day),
    end: sameDay(end, day),
    within: between(day, start, end),
    previewStart: sameDay(ps, day),
    previewEnd: sameDay(pe, day),
    inPreview: between(day, ps, pe),
  };
}

/**
 * The `data-ok-*` attributes of a range day (React and the HTML runtime write the same):
 * `data-ok-range-start`, `-range-end`, `-in-range`, `-preview-start`, `-preview-end`,
 * `-in-preview` (empty strings; absent when false).
 */
export function rangeDayAttributes(state: RangeDayState): Record<string, string> {
  const out: Record<string, string> = {};
  if (state.start) out["data-ok-range-start"] = "";
  if (state.end) out["data-ok-range-end"] = "";
  if (state.within) out["data-ok-in-range"] = "";
  if (state.previewStart) out["data-ok-preview-start"] = "";
  if (state.previewEnd) out["data-ok-preview-end"] = "";
  if (state.inPreview) out["data-ok-in-preview"] = "";
  return out;
}

/** MUI's range errors: each side's own error, or `invalidRange` on both when the end comes first. */
export type RangeValidationError = PickerValidationError | "invalidRange";

/**
 * Validates each side with the value type's rules, then the order: `[startError, endError]`
 * (`null` = valid). Dates compare by day; times and date times by the instant.
 */
export function validateRange(
  range: DateRange,
  type: PickerValueType,
  rules: DateRules & TimeRules,
): [RangeValidationError | null, RangeValidationError | null] {
  const [start, end] = range;
  const errors: [RangeValidationError | null, RangeValidationError | null] = [
    validatePickerValue(start, type, rules),
    validatePickerValue(end, type, rules),
  ];
  if (errors[0] === null && errors[1] === null && valid(start) && valid(end)) {
    if (!ordered(start, end, type === "date")) return ["invalidRange", "invalidRange"];
  }
  return errors;
}

/** The first error of a range (`onError`, `validationError`), or `null`. */
export const rangeError = (
  errors: readonly [RangeValidationError | null, RangeValidationError | null],
): RangeValidationError | null => errors[0] ?? errors[1];

/** The default number of calendars: two on desktop, one in a dialog or inline (MUI). */
export const defaultRangeCalendars = (mode: "desktop" | "mobile" | "static"): RangeCalendarCount =>
  mode === "desktop" ? 2 : 1;

/**
 * The first shown month: the start (else the end, else `today`) placed at
 * `currentMonthCalendarPosition` (1-based) among `calendars` months.
 */
export function initialRangeMonth(
  range: DateRange,
  today: Date,
  calendars: RangeCalendarCount,
  currentMonthCalendarPosition = 1,
  cal: PickerCalendarSystem = gregorianCalendar,
): Date {
  const [start, end] = range;
  const base = valid(start) ? start : valid(end) ? end : today;
  const at = Math.min(Math.max(Math.trunc(currentMonthCalendarPosition) || 1, 1), calendars);
  return startOfMonth(addMonths(startOfMonth(base, cal), -(at - 1), cal), cal);
}

/** The months shown from `first`. */
export const visibleMonths = (
  first: Date,
  calendars: RangeCalendarCount,
  cal: PickerCalendarSystem = gregorianCalendar,
): Date[] =>
  Array.from({ length: calendars }, (_, i) => addMonths(startOfMonth(first, cal), i, cal));

/**
 * The first month that shows `date`: unchanged when `date` is visible; otherwise `date`'s month
 * goes to the first calendar (dates before) or the last one (dates after).
 */
export function monthsShowing(
  date: Date,
  first: Date,
  calendars: RangeCalendarCount,
  cal: PickerCalendarSystem = gregorianCalendar,
): Date {
  const from = startOfMonth(first, cal);
  const target = startOfMonth(date, cal);
  const index = monthDiff(target, from, cal);
  if (index >= 0 && index < calendars) return from;
  return index < 0 ? target : addMonths(target, -(calendars - 1), cal);
}

/**
 * The sections of a single input range field: the format twice, joined by " – ", each section
 * marked with its `part` (0 start, 1 end); `count` is the number of sections of one date.
 */
export function rangeFieldSections(
  format: string,
  respectLeadingZeros = false,
): { sections: FormatSection[]; count: number } {
  const one = fieldSections(format, respectLeadingZeros);
  const start = one.map((s) => ({ ...s, part: 0 as const }));
  const end = fieldSections(format, respectLeadingZeros).map((s) => ({ ...s, part: 1 as const }));
  const last = start.at(-1);
  const first = end[0];
  if (last && first) {
    // " – " joins the dates; a format that starts with a literal keeps it before the end date.
    last.endSeparator = `${last.endSeparator}${RANGE_SEPARATOR}${first.startSeparator}`;
    first.startSeparator = "";
  }
  return { sections: [...start, ...end], count: one.length };
}

/** Section texts of a range (start's sections, then the end's). */
export function rangeSectionValues(
  range: DateRange,
  sections: readonly FormatSection[],
  count: number,
  locale: string,
): string[] {
  return [
    ...sectionValues(range[0], sections.slice(0, count), locale),
    ...sectionValues(range[1], sections.slice(count), locale),
  ];
}

/** A range from the section texts (each side as `sectionsToDate` reads it). */
export function sectionsToRange(
  values: readonly string[],
  sections: readonly FormatSection[],
  count: number,
  locale: string,
  references: readonly [Date, Date],
): DateRange {
  return [
    sectionsToDate(values.slice(0, count), sections.slice(0, count), locale, references[0]),
    sectionsToDate(values.slice(count), sections.slice(count), locale, references[1]),
  ];
}

/** A shortcut of a range picker ("Last 7 days"…). */
export interface RangeShortcut {
  label: string;
  /** The range it sets; `isValid` tells whether a range passes the picker's rules. */
  getValue: (context: { isValid: (value: DateRange) => boolean }) => DateRange;
  /** Stable key (default: the label). */
  id?: string | undefined;
}

/** A shortcut's range, or `undefined` when it throws or returns something else. */
export function rangeShortcutValue(
  shortcut: RangeShortcut,
  type: PickerValueType,
  rules: DateRules & TimeRules,
): DateRange | undefined {
  const isValid = (value: DateRange) => rangeError(validateRange(value, type, rules)) === null;
  try {
    const value = shortcut.getValue({ isValid });
    if (!Array.isArray(value) || value.length !== 2) return undefined;
    const ok = (d: unknown) => d === null || isValidDate(d);
    return ok(value[0]) && ok(value[1]) ? [value[0], value[1]] : undefined;
  } catch {
    return undefined;
  }
}

/**
 * The day a pick sets on a side that may hold a time: date pickers take the day; date time
 * pickers keep the side's time (or `reference`'s).
 */
export function withDay(
  day: Date,
  side: Date | null,
  reference: Date,
  type: PickerValueType,
): Date {
  if (type === "date") return startOfDay(day);
  const base = valid(side) ? side : reference;
  return setDateParts(base, {
    year: day.getFullYear(),
    month: day.getMonth(),
    day: day.getDate(),
  });
}

/** A range toolbar side: "May 20" (the locale's short month and day), else `empty`. */
export const rangeToolbarText = (date: Date | null, locale: string, empty: string): string =>
  valid(date) ? formatDate(date, locale, { month: "short", day: "numeric" }) : empty;

/** The range shown in text: "May 20, 2025 – May 25, 2025" (the open button's name). */
export function rangeAccessibleText(
  range: DateRange,
  format: (date: Date) => string,
): string | null {
  const [start, end] = range;
  if (!valid(start) && !valid(end)) return null;
  return `${valid(start) ? format(start) : ""}${RANGE_SEPARATOR}${valid(end) ? format(end) : ""}`;
}
