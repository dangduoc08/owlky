/**
 * Field formats (ADR-0022): a format string becomes sections (year, month, day, …) separated by
 * literal text. Tokens follow Day.js, MUI's default adapter; text in `[…]` is literal.
 *
 * | Token | Section | Example |
 * |---|---|---|
 * | `YYYY` / `YY` | year | 2025 / 25 |
 * | `M` / `MM` / `MMM` / `MMMM` | month | 5 / 05 / May / May |
 * | `D` / `DD` | day | 5 / 05 |
 * | `ddd` / `dddd` | week day | Sun / Sunday |
 * | `H` / `HH` / `h` / `hh` | hours (24 / 12) | 9 / 09 |
 * | `m` / `mm`, `s` / `ss` | minutes, seconds | 30 |
 * | `A` / `a` | meridiem | AM / am |
 */
import type { DateView } from "./dates.js";
import { formatDate, monthNames, weekdayNames } from "./locale.js";

export const sectionTypes = [
  "year",
  "month",
  "day",
  "weekDay",
  "hours",
  "minutes",
  "seconds",
  "meridiem",
] as const;
export type SectionType = (typeof sectionTypes)[number];

export interface FormatSection {
  type: SectionType;
  /** The token, such as `MM`. */
  token: string;
  /** Digits, or letters (month and week day names, meridiem). */
  contentType: "digit" | "letter";
  /** Digit sections: the length the value is padded to (0 = no padding). */
  pad: number;
  /** Text before the first section (only on the first section). */
  startSeparator: string;
  /** Text after the section. */
  endSeparator: string;
  /** Range fields (ADR-0028): 0 for the start date's sections, 1 for the end's. */
  part?: 0 | 1 | undefined;
}

/** Longest tokens first, so `MMMM` wins over `MM`. */
const TOKENS: readonly [token: string, type: SectionType, letter: boolean, pad: number][] = [
  ["YYYY", "year", false, 4],
  ["YY", "year", false, 2],
  ["MMMM", "month", true, 0],
  ["MMM", "month", true, 0],
  ["MM", "month", false, 2],
  ["M", "month", false, 0],
  ["DD", "day", false, 2],
  ["D", "day", false, 0],
  ["dddd", "weekDay", true, 0],
  ["ddd", "weekDay", true, 0],
  ["HH", "hours", false, 2],
  ["H", "hours", false, 0],
  ["hh", "hours", false, 2],
  ["h", "hours", false, 0],
  ["mm", "minutes", false, 2],
  ["m", "minutes", false, 0],
  ["ss", "seconds", false, 2],
  ["s", "seconds", false, 0],
  ["A", "meridiem", true, 0],
  ["a", "meridiem", true, 0],
];

/** Sections of a format string (at most 256 characters; longer formats are cut). */
export function parseFormat(format: string): FormatSection[] {
  const text = format.slice(0, 256);
  const sections: FormatSection[] = [];
  let literal = "";
  let i = 0;
  while (i < text.length) {
    if (text[i] === "[") {
      const end = text.indexOf("]", i + 1);
      const stop = end === -1 ? text.length : end;
      literal += text.slice(i + 1, stop);
      i = stop + 1;
      continue;
    }
    const match = TOKENS.find(([token]) => text.startsWith(token, i));
    if (!match) {
      literal += text[i];
      i += 1;
      continue;
    }
    const [token, type, letter, pad] = match;
    const last = sections.at(-1);
    if (last) last.endSeparator = literal;
    sections.push({
      type,
      token,
      contentType: letter ? "letter" : "digit",
      pad,
      startSeparator: last ? "" : literal,
      endSeparator: "",
    });
    literal = "";
    i += token.length;
  }
  const last = sections.at(-1);
  if (last) last.endSeparator = literal;
  return sections;
}

/** A 12-hour clock in this format (`h` / `hh` or a meridiem). */
export const is12HourFormat = (sections: readonly FormatSection[]): boolean =>
  sections.some((s) => s.type === "meridiem" || s.token === "h" || s.token === "hh");

/**
 * The locale's numeric date pattern (`MM/DD/YYYY` in en-US, `DD/MM/YYYY` in vi-VN), from
 * `Intl.DateTimeFormat#formatToParts`.
 */
export function localeDateFormat(locale: string): string {
  const parts = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(2023, 10, 22));
  return parts
    .map((part) => {
      if (part.type === "year") return "YYYY";
      if (part.type === "month") return "MM";
      if (part.type === "day") return "DD";
      // Literal text, with `[` / `]` escaped away (they never appear in Intl output).
      return escapeFormatLiteral(part.value);
    })
    .join("");
}

/** Literal text for a format: ASCII letters (they could read as tokens) wrapped in `[…]`. */
export const escapeFormatLiteral = (text: string): string =>
  text.replace(/[A-Za-z]/g, (c) => `[${c}]`);

/** The default field format for a set of date views (MUI's defaults). */
export function defaultDateFormat(views: readonly DateView[], locale: string): string {
  const has = (view: DateView) => views.includes(view);
  if (has("year") && has("month") && !has("day")) return "MMMM YYYY";
  if (views.length === 1) return has("year") ? "YYYY" : has("month") ? "MMMM" : "DD";
  if (has("month") && has("day") && !has("year")) return "MMMM D";
  return localeDateFormat(locale);
}

/** The text of one section for a date. */
export function formatSection(date: Date, section: FormatSection, locale: string): string {
  const { token } = section;
  const digits = (value: number) =>
    section.pad > 0 ? String(value).padStart(section.pad, "0") : String(value);
  switch (section.type) {
    case "year":
      return token === "YY"
        ? String(date.getFullYear() % 100).padStart(2, "0")
        : String(date.getFullYear()).padStart(4, "0");
    case "month":
      if (token === "MMMM") return monthNames(locale, "long")[date.getMonth()] as string;
      if (token === "MMM") return monthNames(locale, "short")[date.getMonth()] as string;
      return digits(date.getMonth() + 1);
    case "day":
      return digits(date.getDate());
    case "weekDay":
      return weekdayNames(locale, token === "dddd" ? "long" : "short")[date.getDay()] as string;
    case "hours": {
      const hours = date.getHours();
      return digits(token.startsWith("h") ? hours % 12 || 12 : hours);
    }
    case "minutes":
      return digits(date.getMinutes());
    case "seconds":
      return digits(date.getSeconds());
    case "meridiem": {
      const text = meridiemNames(locale)[date.getHours() < 12 ? 0 : 1] as string;
      return token === "a" ? text.toLowerCase() : text;
    }
  }
}

/** The text of a whole format for a date (no placeholders: a valid date). */
export function formatWith(date: Date, format: string, locale: string): string {
  return parseFormat(format)
    .map((s) => s.startSeparator + formatSection(date, s, locale) + s.endSeparator)
    .join("");
}

/** AM / PM names of a locale (from `Intl`; en-US: "AM", "PM"). */
export function meridiemNames(locale: string): [string, string] {
  const name = (hours: number) =>
    (
      new Intl.DateTimeFormat(locale, { hour: "numeric", hour12: true, timeZone: "UTC" })
        .formatToParts(new Date(Date.UTC(2023, 0, 1, hours)))
        // `hour12` output always has a day period.
        .find((part) => part.type === "dayPeriod") as Intl.DateTimeFormatPart
    ).value;
  return [name(9), name(21)];
}

/** Accessible date text, such as "May 25, 2025" in en-US. */
export const formatAccessibleDate = (date: Date, locale: string): string =>
  formatDate(date, locale, { year: "numeric", month: "long", day: "numeric" });
