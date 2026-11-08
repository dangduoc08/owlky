/**
 * Time model for the pickers (ADR-0022 phase 2, ADR-0026): time views, the 12 / 24-hour cycle,
 * default formats, time steps, validation (MUI's time errors), the options of the clock views and
 * the analog clock's geometry. Pure functions shared by React and the HTML runtimes.
 */
import { type DateRules, type DateValidationError, validateDate } from "./calendar.js";
import {
  type DateView,
  formatIsoDate,
  formatIsoDateTime,
  formatIsoTime,
  isSameDay,
  isValidDate,
  normalizeDateViews,
  parseIsoDate,
  parseIsoTime,
  pickerViews,
  setDateParts,
} from "./dates.js";
import { defaultDateFormat, meridiemNames } from "./format.js";

export const timeViews = ["hours", "minutes", "seconds"] as const;
/** A time view of a clock. */
export type TimeView = (typeof timeViews)[number];
/** A column of the multi-section digital clock (time views plus AM / PM). */
export type ClockSectionView = TimeView | "meridiem";
/** Any picker view (date time pickers move from date views to time views). */
export type PickerView = DateView | TimeView;

export const isTimeView = (view: unknown): view is TimeView => timeViews.includes(view as TimeView);

/** Sorted, unique time views (hours → minutes → seconds); default `["hours", "minutes"]`. */
export function normalizeTimeViews(views: readonly unknown[] | undefined): TimeView[] {
  const list = timeViews.filter((view) => views?.includes(view));
  return list.length > 0 ? list : ["hours", "minutes"];
}

/**
 * Date time views: the date views then the time views, each part sorted; default
 * `["year", "day", "hours", "minutes"]` (MUI). A part with no view is left out.
 */
export function normalizeDateTimeViews(views: readonly unknown[] | undefined): PickerView[] {
  const date = pickerViews.filter((view) => views?.includes(view));
  const time = timeViews.filter((view) => views?.includes(view));
  if (date.length === 0 && time.length === 0) return ["year", "day", "hours", "minutes"];
  return [...(date.length > 0 ? normalizeDateViews(date) : []), ...time];
}

/** The date views and the time views of a list. */
export const splitViews = (
  views: readonly PickerView[],
): { date: DateView[]; time: TimeView[] } => ({
  date: views.filter((v): v is DateView => !isTimeView(v)),
  time: views.filter(isTimeView),
});

/** The locale writes hours on a 12-hour clock (en-US: yes, vi-VN: no), from `Intl`. */
export function is12HourLocale(locale: string): boolean {
  const cycle = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hourCycle;
  return cycle === "h11" || cycle === "h12";
}

/** `ampm` when given, else the locale's clock. */
export const resolveAmpm = (ampm: boolean | undefined, locale: string): boolean =>
  typeof ampm === "boolean" ? ampm : is12HourLocale(locale);

/** MUI's default time format for the views: `hh:mm A`, `HH:mm`, `mm:ss`, `hh A`… */
export function defaultTimeFormat(views: readonly TimeView[], ampm: boolean): string {
  const parts: string[] = [];
  if (views.includes("hours")) parts.push(ampm ? "hh" : "HH");
  if (views.includes("minutes")) parts.push("mm");
  if (views.includes("seconds")) parts.push("ss");
  const text = parts.join(":");
  return ampm && views.includes("hours") ? `${text} A` : text;
}

/** Date format, a space, time format (`MM/DD/YYYY hh:mm A`; `DD hh A` for day and hours). */
export function defaultDateTimeFormat(
  views: readonly PickerView[],
  ampm: boolean,
  locale: string,
): string {
  const { date, time } = splitViews(views);
  const parts: string[] = [];
  if (date.length > 0) parts.push(defaultDateFormat(date, locale));
  if (time.length > 0) parts.push(defaultTimeFormat(time, ampm));
  return parts.join(" ");
}

/** Steps between the options of the digital clocks (MUI `timeSteps`). */
export interface TimeSteps {
  hours?: number | undefined;
  minutes?: number | undefined;
  seconds?: number | undefined;
}

const positiveInteger = (value: unknown, fallback: number, max: number): number =>
  typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= max
    ? value
    : fallback;

/** Steps with every unit set. */
export interface ResolvedTimeSteps {
  hours: number;
  minutes: number;
  seconds: number;
}

/** Steps as whole numbers (invalid → MUI's defaults: 1 hour, 5 minutes, 5 seconds). */
export const normalizeTimeSteps = (steps?: TimeSteps | null): ResolvedTimeSteps => ({
  hours: positiveInteger(steps?.hours, 1, 23),
  minutes: positiveInteger(steps?.minutes, 5, 60),
  seconds: positiveInteger(steps?.seconds, 5, 59),
});

/** Steps from an attribute: `"1 5 5"` (hours minutes seconds). */
export function parseTimeSteps(value: unknown): ResolvedTimeSteps {
  if (typeof value !== "string" || value.length > 32) return normalizeTimeSteps();
  const [hours, minutes, seconds] = value.trim().split(/\s+/).map(Number);
  return normalizeTimeSteps({ hours, minutes, seconds });
}

/** Steps written back as an attribute value. */
export const formatTimeSteps = (steps: ResolvedTimeSteps): string =>
  `${steps.hours} ${steps.minutes} ${steps.seconds}`;

/** MUI's default threshold: 24 options or fewer render one column (a digital clock). */
export const DEFAULT_SINGLE_COLUMN_THRESHOLD = 24;

/**
 * Desktop time views render one list (DigitalClock) instead of columns (MultiSectionDigitalClock)
 * when the views are hours and minutes only and a day holds at most `threshold` options.
 */
export function shouldRenderSingleColumn(
  views: readonly TimeView[],
  steps: ResolvedTimeSteps,
  threshold = DEFAULT_SINGLE_COLUMN_THRESHOLD,
): boolean {
  return (
    views.every((view) => view === "hours" || view === "minutes") &&
    (24 * 60) / (steps.hours * steps.minutes) <= threshold
  );
}

/** Time rules shared by time fields, clocks and pickers (MUI props). */
export interface TimeRules {
  /** Earliest valid time (the date part is ignored unless `disableIgnoringDatePartForTimeValidation`). */
  minTime?: Date | null | undefined;
  maxTime?: Date | null | undefined;
  /** Earliest / latest valid date and time (date time pickers). */
  minDateTime?: Date | null | undefined;
  maxDateTime?: Date | null | undefined;
  /** Minutes must be a multiple of this. */
  minutesStep?: number | undefined;
  disablePast?: boolean | undefined;
  disableFuture?: boolean | undefined;
  shouldDisableTime?: ((value: Date, view: TimeView) => boolean) | undefined;
  /** `minTime` / `maxTime` compare the whole date, not only the time of day. */
  disableIgnoringDatePartForTimeValidation?: boolean | undefined;
  /** "Now" (tests and stories can pin it). Default: now. */
  now?: Date | undefined;
}

export type TimeValidationError =
  | "invalidDate"
  | "minTime"
  | "maxTime"
  | "minutesStep"
  | "shouldDisableTime-hours"
  | "shouldDisableTime-minutes"
  | "shouldDisableTime-seconds"
  | "disablePast"
  | "disableFuture";

/** Any picker validation error (`onError`, `validationError`). */
export type PickerValidationError = DateValidationError | TimeValidationError;

const secondsOfDay = (date: Date) =>
  date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();

/** Negative when `a` is earlier than `b` (time of day, or the whole date). */
const compareTime = (a: Date, b: Date, wholeDate: boolean | undefined) =>
  wholeDate ? a.getTime() - b.getTime() : secondsOfDay(a) - secondsOfDay(b);

const nowOf = (rules: TimeRules) => rules.now ?? new Date();

/** Calls a consumer function; one that throws counts as "not disabled". */
const safeDisable = (rules: TimeRules, value: Date, view: TimeView): boolean => {
  try {
    return rules.shouldDisableTime?.(value, view) === true;
  } catch {
    return false;
  }
};

/** Why a time is invalid, or `null` (an empty value is valid). */
export function validateTime(value: Date | null, rules: TimeRules): TimeValidationError | null {
  if (value === null) return null;
  if (!isValidDate(value)) return "invalidDate";
  const whole = rules.disableIgnoringDatePartForTimeValidation;
  if (isValidDate(rules.minTime) && compareTime(value, rules.minTime, whole) < 0) return "minTime";
  if (isValidDate(rules.maxTime) && compareTime(value, rules.maxTime, whole) > 0) return "maxTime";
  if (isValidDate(rules.minDateTime) && value.getTime() < rules.minDateTime.getTime())
    return "minTime";
  if (isValidDate(rules.maxDateTime) && value.getTime() > rules.maxDateTime.getTime())
    return "maxTime";
  for (const view of timeViews)
    if (safeDisable(rules, value, view)) return `shouldDisableTime-${view}`;
  const step = positiveInteger(rules.minutesStep, 1, 59);
  if (value.getMinutes() % step !== 0) return "minutesStep";
  if (rules.disableFuture && value.getTime() > nowOf(rules).getTime()) return "disableFuture";
  if (rules.disablePast && value.getTime() < nowOf(rules).getTime()) return "disablePast";
  return null;
}

/**
 * Why a date and time is invalid, or `null`: the date rules first (`minDateTime` / `maxDateTime`
 * also limit the days), then the time rules.
 */
export function validateDateTime(
  value: Date | null,
  rules: DateRules & TimeRules,
): PickerValidationError | null {
  if (value === null) return null;
  if (!isValidDate(value)) return "invalidDate";
  const dateError = validateDate(value, {
    ...rules,
    minDate: rules.minDate ?? rules.minDateTime,
    maxDate: rules.maxDate ?? rules.maxDateTime,
    today: rules.today ?? rules.now,
    // Past / future are checked to the second below.
    disablePast: false,
    disableFuture: false,
  });
  if (dateError) return dateError;
  return validateTime(value, {
    ...rules,
    now: rules.now ?? rules.today,
    disableIgnoringDatePartForTimeValidation: undefined,
  });
}

/** Rules for one day of a date time picker: `minDateTime` limits times on its own day only. */
const intervalOutside = (start: Date, end: Date, rules: TimeRules): boolean => {
  const whole = rules.disableIgnoringDatePartForTimeValidation;
  if (isValidDate(rules.minTime) && compareTime(end, rules.minTime, whole) < 0) return true;
  if (isValidDate(rules.maxTime) && compareTime(start, rules.maxTime, whole) > 0) return true;
  if (isValidDate(rules.minDateTime) && end.getTime() < rules.minDateTime.getTime()) return true;
  if (isValidDate(rules.maxDateTime) && start.getTime() > rules.maxDateTime.getTime()) return true;
  if (rules.disablePast && end.getTime() < nowOf(rules).getTime()) return true;
  if (rules.disableFuture && start.getTime() > nowOf(rules).getTime()) return true;
  return false;
};

/** The hour of a day for a clock's hour number (12-hour clocks add the meridiem). */
export const toHours = (unit: number, ampm: boolean, pm: boolean): number =>
  ampm ? (unit % 12) + (pm ? 12 : 0) : unit;

/** A clock's number for the hours of a date (12-hour clocks: 1–12). */
export const hourUnit = (date: Date, ampm: boolean): number =>
  ampm ? date.getHours() % 12 || 12 : date.getHours();

/** A view's number for a date: hours (see `hourUnit`), minutes, seconds, meridiem (0 AM, 1 PM). */
export function timeUnit(date: Date, view: ClockSectionView, ampm: boolean): number {
  if (view === "hours") return hourUnit(date, ampm);
  if (view === "minutes") return date.getMinutes();
  if (view === "seconds") return date.getSeconds();
  return date.getHours() < 12 ? 0 : 1;
}

/** `date` with a view's number set (hours keep the meridiem on 12-hour clocks). */
export function setTimeUnit(date: Date, view: ClockSectionView, unit: number, ampm: boolean): Date {
  if (view === "hours")
    return setDateParts(date, { hours: toHours(unit, ampm, date.getHours() >= 12) });
  if (view === "minutes") return setDateParts(date, { minutes: unit });
  if (view === "seconds") return setDateParts(date, { seconds: unit });
  const hours = date.getHours() % 12;
  return setDateParts(date, { hours: unit === 1 ? hours + 12 : hours });
}

/**
 * A view's number can't be picked for `date`: the whole hour / minute is outside the limits,
 * `shouldDisableTime` refuses it, or minutes don't fit `minutesStep`.
 */
export function isTimeUnitDisabled(
  date: Date,
  view: ClockSectionView,
  unit: number,
  rules: TimeRules,
  ampm: boolean,
): boolean {
  let start: Date;
  let end: Date;
  if (view === "meridiem") {
    start = setDateParts(date, { hours: unit === 1 ? 12 : 0, minutes: 0, seconds: 0 });
    end = setDateParts(date, { hours: unit === 1 ? 23 : 11, minutes: 59, seconds: 59 });
    return intervalOutside(start, end, rules);
  }
  const at = setTimeUnit(date, view, unit, ampm);
  if (view === "hours") {
    start = setDateParts(at, { minutes: 0, seconds: 0 });
    end = setDateParts(at, { minutes: 59, seconds: 59 });
  } else if (view === "minutes") {
    start = setDateParts(at, { seconds: 0 });
    end = setDateParts(at, { seconds: 59 });
    if (unit % positiveInteger(rules.minutesStep, 1, 59) !== 0) return true;
  } else {
    start = at;
    end = at;
  }
  if (intervalOutside(start, end, rules)) return true;
  return safeDisable(rules, start, view);
}

const pad2 = (value: number) => String(value).padStart(2, "0");

/** An option of a clock view. */
export interface TimeOption {
  /** The view's number (hours as the clock shows them, 0 / 1 for AM / PM). */
  value: number;
  label: string;
  disabled: boolean;
  selected: boolean;
}

export interface TimeOptionsContext {
  ampm: boolean;
  /** Distance between options (hours, minutes or seconds). */
  step?: number | undefined;
  rules: TimeRules;
  locale: string;
  /** Leave disabled options out. */
  skipDisabled?: boolean | undefined;
}

/**
 * Options of one column of the multi-section digital clock: hours (12, 01 … 11 or 00 … 23),
 * minutes and seconds every `step`, or AM / PM. `value` marks the selected one; `reference`
 * (today) gives the date when there's no value.
 */
export function timeSectionOptions(
  view: ClockSectionView,
  value: Date | null,
  reference: Date,
  context: TimeOptionsContext,
): TimeOption[] {
  const base = isValidDate(value) ? value : reference;
  const selected = isValidDate(value) ? timeUnit(value, view, context.ampm) : undefined;
  let units: number[];
  let label: (unit: number) => string;
  if (view === "meridiem") {
    const names = meridiemNames(context.locale);
    units = [0, 1];
    label = (unit) => names[unit] as string;
  } else {
    const step = positiveInteger(context.step, 1, 60);
    if (view === "hours") {
      const hours = Array.from({ length: 24 }, (_, i) => i).filter((h) => h % step === 0);
      units = context.ampm
        ? [...new Set(hours.map((h) => h % 12 || 12))].sort((a, b) => (a % 12) - (b % 12))
        : hours;
    } else units = Array.from({ length: 60 }, (_, i) => i).filter((m) => m % step === 0);
    label = pad2;
  }
  const options = units.map((unit) => ({
    value: unit,
    label: label(unit),
    disabled: isTimeUnitDisabled(base, view, unit, context.rules, context.ampm),
    selected: unit === selected,
  }));
  return context.skipDisabled ? options.filter((o) => !o.disabled || o.selected) : options;
}

/** An option of the one-column digital clock. */
export interface DigitalClockOption {
  value: Date;
  label: string;
  disabled: boolean;
  selected: boolean;
}

/** MUI's default step of the digital clock, in minutes. */
export const DEFAULT_DIGITAL_CLOCK_STEP = 30;

/** Times of the day every `timeStep` minutes (`hh:mm A` or `HH:mm` labels). */
export function digitalClockItems(
  value: Date | null,
  reference: Date,
  context: TimeOptionsContext,
): DigitalClockOption[] {
  const base = isValidDate(value) ? value : reference;
  const step = positiveInteger(context.step, DEFAULT_DIGITAL_CLOCK_STEP, 1440);
  const names = meridiemNames(context.locale);
  const options: DigitalClockOption[] = [];
  for (let minutes = 0; minutes < 1440; minutes += step) {
    const at = setDateParts(base, {
      hours: Math.floor(minutes / 60),
      minutes: minutes % 60,
      seconds: 0,
    });
    const hours = at.getHours();
    const label = context.ampm
      ? `${pad2(hours % 12 || 12)}:${pad2(at.getMinutes())} ${names[hours < 12 ? 0 : 1]}`
      : `${pad2(hours)}:${pad2(at.getMinutes())}`;
    const selected =
      isValidDate(value) && value.getHours() === hours && value.getMinutes() === at.getMinutes();
    const disabled = validateTime(at, { ...context.rules, minutesStep: undefined }) !== null;
    if (context.skipDisabled && disabled && !selected) continue;
    options.push({ value: at, label, disabled, selected });
  }
  return options;
}

/** A number on the analog clock's face. */
export interface ClockNumber {
  /** The view's number (hours as the clock shows them). */
  value: number;
  label: string;
  /** 0 (top) … 11, clockwise. */
  position: number;
  /** 24-hour clocks: 00 and 13–23 sit on an inner ring. */
  inner: boolean;
}

/** The numbers of the clock's face: hours (1–12, or 00–23 on two rings), minutes / seconds every 5. */
export function clockNumbers(view: TimeView, ampm: boolean): ClockNumber[] {
  if (view === "hours") {
    const hours = ampm
      ? Array.from({ length: 12 }, (_, i) => i + 1)
      : Array.from({ length: 24 }, (_, i) => i);
    return hours.map((hour) => ({
      value: hour,
      label: hour === 0 ? "00" : String(hour),
      position: hour % 12,
      inner: !ampm && (hour === 0 || hour > 12),
    }));
  }
  return Array.from({ length: 12 }, (_, i) => ({
    value: i * 5,
    label: pad2(i * 5),
    position: i,
    inner: false,
  }));
}

/** The pointer's angle (degrees clockwise from 12) for a view's number. */
export const clockAngle = (view: TimeView, unit: number): number =>
  view === "hours" ? (unit % 12) * 30 : unit * 6;

/** The pointer points to the inner ring (24-hour clocks: 00 and 13–23). */
export const isInnerHour = (view: TimeView, unit: number, ampm: boolean): boolean =>
  view === "hours" && !ampm && (unit === 0 || unit > 12);

/**
 * The view's number at a point of the clock face: `dx` / `dy` from the center, `innerRadius` the
 * distance under which 24-hour clocks pick the inner ring. Minutes and seconds snap to `step`.
 */
export function clockValueFromPoint(
  view: TimeView,
  dx: number,
  dy: number,
  context: { ampm: boolean; step?: number | undefined; innerRadius: number },
): number {
  const degrees = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
  if (view === "hours") {
    const position = Math.round(degrees / 30) % 12;
    if (context.ampm) return position === 0 ? 12 : position;
    const inner = Math.hypot(dx, dy) < context.innerRadius;
    if (inner) return position === 0 ? 0 : position + 12;
    return position === 0 ? 12 : position;
  }
  const step = positiveInteger(context.step, 1, 59);
  const unit = Math.round(degrees / 6) % 60;
  return (Math.round(unit / step) * step) % 60;
}

/**
 * The view's number after a key: `delta` steps (wrapping), or `"min"` / `"max"` (Home / End).
 * 12-hour clocks count 1 … 12.
 */
export function stepTimeUnit(
  view: TimeView,
  unit: number,
  delta: number | "min" | "max",
  ampm: boolean,
): number {
  const twelve = view === "hours" && ampm;
  const min = twelve ? 1 : 0;
  const max = view === "hours" ? (ampm ? 12 : 23) : 59;
  if (delta === "min") return min;
  if (delta === "max") return max;
  const span = max - min + 1;
  return ((((unit - min + delta) % span) + span) % span) + min;
}

/** The time a field or toolbar shows for a date (`09:30 AM`), with the locale's AM / PM. */
export function formatTimeText(
  date: Date,
  views: readonly TimeView[],
  ampm: boolean,
  locale: string,
): string {
  const parts: string[] = [];
  if (views.includes("hours")) parts.push(pad2(hourUnit(date, ampm)));
  if (views.includes("minutes")) parts.push(pad2(date.getMinutes()));
  if (views.includes("seconds")) parts.push(pad2(date.getSeconds()));
  const text = parts.join(":");
  return ampm && views.includes("hours")
    ? `${text} ${meridiemNames(locale)[date.getHours() < 12 ? 0 : 1]}`
    : text;
}

/** What a picker's value holds (ADR-0026): `data-ok-value-type`, absent = `date`. */
export type PickerValueType = "date" | "time" | "date-time";

/** ISO 8601 text of a value: `YYYY-MM-DD`, `HH:mm:ss` or `YYYY-MM-DDTHH:mm:ss`. */
export const pickerValueIso = (value: Date, type: PickerValueType): string =>
  type === "time"
    ? formatIsoTime(value)
    : type === "date-time"
      ? formatIsoDateTime(value)
      : formatIsoDate(value);

/**
 * A value from ISO text: times (`HH:mm[:ss]`) take `reference`'s day; a full date and time is
 * accepted by every type. `null` for anything else.
 */
export const parsePickerValue = (text: unknown, reference: Date): Date | null =>
  parseIsoDate(text) ?? parseIsoTime(text, reference);

/** The validation of a value type. */
export function validatePickerValue(
  value: Date | null,
  type: PickerValueType,
  rules: DateRules & TimeRules,
): PickerValidationError | null {
  if (type === "time") return validateTime(value, rules);
  if (type === "date-time") return validateDateTime(value, rules);
  return validateDate(value, rules);
}

/** The views of a value type, sorted, with MUI's defaults. */
export function pickerViewsOf(
  views: readonly unknown[] | undefined,
  type: PickerValueType,
): PickerView[] {
  if (type === "time") return normalizeTimeViews(views);
  if (type === "date-time") return normalizeDateTimeViews(views);
  return normalizeDateViews(views);
}

/** The default field format of a value type. */
export function defaultPickerFormat(
  views: readonly PickerView[],
  type: PickerValueType,
  ampm: boolean,
  locale: string,
): string {
  if (type === "time") return defaultTimeFormat(views.filter(isTimeView), ampm);
  if (type === "date-time") return defaultDateTimeFormat(views, ampm, locale);
  return defaultDateFormat(views as DateView[], locale);
}

/**
 * The view a picker opens on: `openTo` when it's one of `views`, else MUI's default (the day, or
 * the last date view, for dates and date times; the first view for times).
 */
export function initialPickerView(
  views: readonly PickerView[],
  type: PickerValueType,
  openTo: unknown,
): PickerView {
  if (views.includes(openTo as PickerView)) return openTo as PickerView;
  const { date } = splitViews(views);
  if (date.length > 0 && type !== "time")
    return date.includes("day") ? "day" : (date.at(-1) as DateView);
  return views[0] as PickerView;
}

/** The view after `view` in `views`, or `null` on the last one. */
export const nextPickerView = (
  views: readonly PickerView[],
  view: PickerView,
): PickerView | null =>
  views.indexOf(view) === -1 ? null : (views[views.indexOf(view) + 1] ?? null);

/** Same calendar day, or both missing. */
export const isSamePickerDay = (a: Date | null, b: Date | null): boolean =>
  isValidDate(a) && isValidDate(b) ? isSameDay(a, b) : !isValidDate(a) && !isValidDate(b);

/** Default action bar of time and date time pickers: Cancel and OK everywhere (MUI v9). */
export const defaultTimePickerActions = (): ("cancel" | "accept")[] => ["cancel", "accept"];

/** Default action bar of mobile / static date time pickers: Cancel and Next / OK (MUI v9). */
export const defaultDateTimePickerActions = (
  mode: "desktop" | "mobile" | "static",
): ("cancel" | "accept" | "nextOrAccept")[] =>
  mode === "desktop" ? ["cancel", "accept"] : ["cancel", "nextOrAccept"];

const FOCUS_TARGETS =
  "[data-ok-picker-day], [data-ok-picker-month], [data-ok-picker-year], [data-ok-time-clock-options], [data-ok-digital-clock-item]";

/**
 * Focuses the first view of a picker layout: its calendar's current day / month / year, the
 * clock's listbox or the digital clock's current option; parts inside `[hidden]` are skipped.
 */
export function focusPickerView(root: Element): void {
  const visible = (element: Element) => !element.closest("[hidden]");
  const all = [...root.querySelectorAll<HTMLElement>(FOCUS_TARGETS)].filter(visible);
  const target =
    all.find((element) => element.getAttribute("tabindex") === "0") ??
    all.find((element) => !(element as HTMLButtonElement).disabled);
  target?.focus({ preventScroll: true });
}
