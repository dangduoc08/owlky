/**
 * Sectioned field values (ADR-0022): each section holds its text ("05", "May", "" when empty).
 * Pure rules for arrow keys, typing and reading a date back; the DOM side is
 * `createFieldController` (field-controller.ts).
 */
import { pickerCalendar } from "./calendar-system.js";
import { daysInMonth, invalidDate, isValidDate, setDateParts } from "./dates.js";
import { type FormatSection, formatSection, is12HourFormat, meridiemNames } from "./format.js";
import { monthNames, type PickerLocaleText, weekdayNames } from "./locale.js";

/** Texts of the sections for a value (`null` / invalid → all empty). */
export function sectionValues(
  value: Date | null,
  sections: readonly FormatSection[],
  locale: string,
): string[] {
  return sections.map((section) =>
    isValidDate(value) ? formatSection(value, section, locale) : "",
  );
}

/** The placeholder of a section ("MM", "DD", "YYYY"…). */
export function sectionPlaceholder(section: FormatSection, text: PickerLocaleText): string {
  switch (section.type) {
    case "year":
      return text.fieldYearPlaceholder(section.token);
    case "month":
      return text.fieldMonthPlaceholder(section.token, section.contentType);
    case "day":
      return text.fieldDayPlaceholder();
    case "weekDay":
      return text.fieldWeekDayPlaceholder();
    case "hours":
      return text.fieldHoursPlaceholder();
    case "minutes":
      return text.fieldMinutesPlaceholder();
    case "seconds":
      return text.fieldSecondsPlaceholder();
    case "meridiem":
      return text.fieldMeridiemPlaceholder();
  }
}

/** The name of a section (`aria-label`). */
export const sectionLabel = (section: FormatSection, text: PickerLocaleText): string =>
  text[section.type];

/** Letter choices of a letter section (month or week day names, AM / PM). */
function letterOptions(section: FormatSection, locale: string): string[] {
  if (section.type === "month")
    return monthNames(locale, section.token === "MMMM" ? "long" : "short");
  if (section.type === "weekDay")
    return weekdayNames(locale, section.token === "dddd" ? "long" : "short");
  const names = meridiemNames(locale);
  return section.token === "a" ? names.map((n) => n.toLowerCase()) : names;
}

interface Bounds {
  min: number;
  max: number;
}

/** Smallest and largest number of a digit section (days: of the field's month, else 31). */
function bounds(
  section: FormatSection,
  values: readonly string[],
  all: readonly FormatSection[],
  locale: string,
): Bounds {
  switch (section.type) {
    case "year":
      return section.token === "YY" ? { min: 0, max: 99 } : { min: 0, max: 9999 };
    case "month":
      return { min: 1, max: 12 };
    case "day": {
      // Range fields (ADR-0028): a day's month is the one of its own date (`part`).
      const own = all
        .map((s, i) => [s, values[i]] as const)
        .filter(([s]) => s.part === section.part);
      const parts = readParts(
        own.map(([, v]) => v as string),
        own.map(([s]) => s),
        locale,
      );
      const month = parts.month;
      if (month === undefined) return { min: 1, max: 31 };
      return { min: 1, max: daysInMonth(parts.year ?? 2000, month, pickerCalendar(locale)) };
    }
    case "hours":
      return section.token.startsWith("h") ? { min: 1, max: 12 } : { min: 0, max: 23 };
    default:
      return { min: 0, max: 59 };
  }
}

/** Numeric value of a section's text, or `undefined`. */
function numberOf(section: FormatSection, text: string, locale: string): number | undefined {
  if (text === "") return undefined;
  if (section.contentType === "letter") {
    const index = letterOptions(section, locale).indexOf(text);
    return index === -1 ? undefined : index;
  }
  const value = Number(text);
  return Number.isInteger(value) ? value : undefined;
}

/** Text of a digit section for a number (padded as the token says). */
function digitText(section: FormatSection, value: number): string {
  return section.pad > 0 ? String(value).padStart(section.pad, "0") : String(value);
}

/** The part of the reference date a section shows (ArrowUp on an empty section). */
function referenceText(section: FormatSection, reference: Date, locale: string): string {
  return formatSection(reference, section, locale);
}

/**
 * The text after ArrowUp (`delta` 1), ArrowDown (-1), PageUp (5) or PageDown (-5); `"min"` /
 * `"max"` for Home / End. Empty sections take the reference date's part first. Months, days and
 * times wrap; years don't.
 */
export function adjustSection(
  index: number,
  delta: number | "min" | "max",
  values: readonly string[],
  sections: readonly FormatSection[],
  locale: string,
  reference: Date,
): string {
  const section = sections[index] as FormatSection;
  const current = values[index] as string;
  if (section.contentType === "letter") {
    const options = letterOptions(section, locale);
    if (delta === "min") return options[0] as string;
    if (delta === "max") return options.at(-1) as string;
    if (current === "") return referenceText(section, reference, locale);
    const at = options.indexOf(current);
    const next = (((at + delta) % options.length) + options.length) % options.length;
    return options[next] as string;
  }
  const { min, max } = bounds(section, values, sections, locale);
  if (delta === "min") return digitText(section, min);
  if (delta === "max") return digitText(section, max);
  const value = numberOf(section, current, locale);
  if (value === undefined) return referenceText(section, reference, locale);
  if (section.type === "year")
    return digitText(section, Math.min(max, Math.max(min, value + delta)));
  const span = max - min + 1;
  const next = ((((value - min + delta) % span) + span) % span) + min;
  return digitText(section, next);
}

export interface TypedResult {
  /** The section's new text. */
  value: string;
  /** The query kept for the next key (digits or letters typed so far). */
  query: string;
  /** No other key could extend the value: move to the next section. */
  done: boolean;
}

/**
 * Applies a typed character. Digits build a number with the earlier `query` (a number too large
 * starts again from the new digit); letters pick the first name starting with the query. Returns
 * `null` when the key doesn't fit the section.
 */
export function typeInSection(
  index: number,
  key: string,
  query: string,
  values: readonly string[],
  sections: readonly FormatSection[],
  locale: string,
): TypedResult | null {
  const section = sections[index] as FormatSection;
  if (section.contentType === "letter") {
    const options = letterOptions(section, locale);
    if (section.type === "month" && /^\d$/.test(key)) {
      // Digits in a month name section pick the month by number (MUI).
      const typed = typeInSection(
        index,
        key,
        query,
        values,
        sections.map((s, i) =>
          i === index ? { ...s, contentType: "digit", pad: 2, token: "MM" } : s,
        ),
        locale,
      );
      // Always a result: the key is a digit.
      const { value, query: next, done } = typed as TypedResult;
      const month = Number(value);
      if (month < 1) return { value: values[index] as string, query: next, done: false };
      return { value: options[month - 1] as string, query: next, done };
    }
    if (!/^\p{L}$/u.test(key)) return null;
    const lower = (s: string) => s.toLocaleLowerCase(locale);
    const tryQuery = (q: string) => options.filter((option) => lower(option).startsWith(lower(q)));
    let next = query + key;
    let matches = tryQuery(next);
    if (matches.length === 0) {
      next = key;
      matches = tryQuery(next);
    }
    if (matches.length === 0) return null;
    return { value: matches[0] as string, query: next, done: matches.length === 1 };
  }
  if (!/^\d$/.test(key)) return null;
  const { min, max } = bounds(section, values, sections, locale);
  const maxLength = String(max).length;
  let next = query + key;
  if (Number(next) > max || next.length > maxLength) next = key;
  const value = Number(next);
  // A leading zero (or a number below the minimum) waits for the next digit.
  if (value < min) return { value: digitText(section, value), query: next, done: false };
  const done = value * 10 > max || next.length >= maxLength;
  const text =
    section.type === "year" && section.token === "YYYY"
      ? next.padStart(4, "0")
      : digitText(section, value);
  return { value: text, query: done ? "" : next, done };
}

interface Parts {
  year?: number | undefined;
  month?: number | undefined;
  day?: number | undefined;
  hours?: number | undefined;
  minutes?: number | undefined;
  seconds?: number | undefined;
  pm?: boolean | undefined;
}

/** Two-digit years: 69–99 → 1900s, 00–68 → 2000s (Day.js). */
const fullYear = (twoDigits: number) => (twoDigits > 68 ? 1900 : 2000) + twoDigits;

function readParts(
  values: readonly string[],
  sections: readonly FormatSection[],
  locale: string,
): Parts {
  const parts: Parts = {};
  sections.forEach((section, i) => {
    const text = values[i] as string;
    if (text === "") return;
    const value = numberOf(section, text, locale);
    if (value === undefined) return;
    if (section.type === "year") parts.year = section.token === "YY" ? fullYear(value) : value;
    else if (section.type === "month")
      parts.month = section.contentType === "letter" ? value : value - 1;
    else if (section.type === "day") parts.day = value;
    else if (section.type === "hours") parts.hours = value;
    else if (section.type === "minutes") parts.minutes = value;
    else if (section.type === "seconds") parts.seconds = value;
    else if (section.type === "meridiem") parts.pm = value === 1;
  });
  return parts;
}

/**
 * The value of the sections: `null` when every section is empty, an invalid date when some are
 * empty or the parts don't make a date (30 February); otherwise the reference date with the
 * shown parts replaced (a "month and year" field keeps the reference's day, clamped).
 */
export function sectionsToDate(
  values: readonly string[],
  sections: readonly FormatSection[],
  locale: string,
  reference: Date,
): Date | null {
  const editable = sections.filter((s) => s.type !== "weekDay");
  const editableValues = values.filter((_, i) => sections[i]?.type !== "weekDay");
  if (editableValues.every((v) => v === "")) return null;
  if (editableValues.some((v) => v === "")) return invalidDate();
  const parts = readParts(values, sections, locale);
  if (
    sections.some(
      (s, i) => values[i] !== "" && numberOf(s, values[i] as string, locale) === undefined,
    )
  )
    return invalidDate();
  const cal = pickerCalendar(locale);
  const year = parts.year ?? cal.year(reference);
  const month = parts.month ?? cal.month(reference);
  const day = parts.day ?? Math.min(cal.day(reference), daysInMonth(year, month, cal));
  if (day > daysInMonth(year, month, cal)) return invalidDate();
  let hours = parts.hours;
  if (hours !== undefined && is12HourFormat(editable)) {
    hours %= 12;
    if (parts.pm) hours += 12;
  }
  return setDateParts(
    reference,
    { year, month, day, hours, minutes: parts.minutes, seconds: parts.seconds },
    cal,
  );
}

/** `aria-valuenow`, `aria-valuemin` / `max` and `aria-valuetext` of a section. */
export function sectionAria(
  index: number,
  values: readonly string[],
  sections: readonly FormatSection[],
  locale: string,
  text: PickerLocaleText,
): { now?: number; min: number; max: number; valueText: string } {
  const section = sections[index] as FormatSection;
  const current = values[index] as string;
  if (section.contentType === "letter") {
    const options = letterOptions(section, locale);
    const at = options.indexOf(current);
    const fullMonth = section.type === "month" ? monthNames(locale, "long")[at] : undefined;
    return {
      ...(at === -1 ? {} : { now: section.type === "month" ? at + 1 : at }),
      min: section.type === "month" ? 1 : 0,
      max: section.type === "month" ? 12 : options.length - 1,
      valueText: at === -1 ? text.empty : (fullMonth ?? current),
    };
  }
  const { min, max } = bounds(section, values, sections, locale);
  const value = numberOf(section, current, locale);
  const fullMonth =
    section.type === "month" && value !== undefined
      ? monthNames(locale, "long")[value - 1]
      : undefined;
  return {
    ...(value === undefined ? {} : { now: value }),
    min,
    max,
    valueText: value === undefined ? text.empty : (fullMonth ?? current),
  };
}

/**
 * Pasted text in the field's format (`05/25/2025` for `MM/DD/YYYY`) → section texts, or `null`
 * when it doesn't fit. Values are taken by position between the separators and checked.
 */
export function parsePastedText(
  pasted: string,
  sections: readonly FormatSection[],
  locale: string,
): string[] | null {
  let rest = pasted.trim().slice(0, 128);
  const first = sections[0];
  if (first?.startSeparator && rest.startsWith(first.startSeparator))
    rest = rest.slice(first.startSeparator.length);
  const out: string[] = [];
  for (const [i, section] of sections.entries()) {
    const separator = section.endSeparator;
    const isLast = i === sections.length - 1;
    if (isLast && separator !== "" && rest.endsWith(separator))
      rest = rest.slice(0, -separator.length);
    const end = isLast ? rest.length : separator === "" ? -1 : rest.indexOf(separator);
    let chunk: string;
    if (end === -1) {
      // No separator: take the token's width of digits.
      const width = section.pad || 2;
      chunk = rest.slice(0, width);
      rest = rest.slice(width);
    } else {
      chunk = rest.slice(0, end);
      rest = rest.slice(end + separator.length);
    }
    if (section.contentType === "letter") {
      const match = letterOptions(section, locale).find(
        (option) => option.toLocaleLowerCase(locale) === chunk.trim().toLocaleLowerCase(locale),
      );
      if (!match) return null;
      out.push(match);
    } else {
      if (!/^\d+$/.test(chunk)) return null;
      const value = Number(chunk);
      const { min, max } = bounds(section, out, sections.slice(0, out.length + 1), locale);
      if (value < min || value > max) return null;
      out.push(digitText(section, value));
    }
  }
  return out;
}
