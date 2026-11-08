/**
 * Shared by the picker runtimes (date-field, date-calendar, month / year calendars, clocks,
 * date-picker): reading locale and rules from attributes, and building nodes without HTML strings.
 */
import {
  createDateConverter,
  type DateRange,
  type DateRules,
  DEFAULT_PICKER_LOCALE,
  is12HourLocale,
  isValidDate,
  localeCalendar,
  nowInTimezone,
  type PickerDateAdapter,
  type PickerLocaleText,
  type PickerTimezone,
  type PickerValueType,
  parseIsoDate,
  parseIsoRange,
  parsePickerValue,
  pickerCalendar,
  pickerLocaleText,
  safeLocale,
  safeTimezone,
  startOfDay,
  type TimeRules,
  type TimeView,
  withCalendar,
} from "@owlky/core";

/** `data-ok-value-type` (ADR-0026): `time`, `date-time`, else `date`. */
export const readValueType = (element: Element): PickerValueType => {
  const value = element.getAttribute("data-ok-value-type");
  return value === "time" || value === "date-time" ? value : "date";
};

/** The runtime of a desktop clock: a single list or one column per view. */
export const timeViewName = (element: Element): string =>
  element.hasAttribute("data-ok-digital-clock") ? "digital-clock" : "multi-section-digital-clock";

/** `data-ok-ampm="true" | "false"`, else the locale's clock. */
export const readAmpm = (element: Element, locale: string): boolean => {
  const value = element.getAttribute("data-ok-ampm");
  return value === "true" ? true : value === "false" ? false : is12HourLocale(locale);
};

/** Time functions set through instance methods. */
export interface TimeRuleFunctions {
  shouldDisableTime?: ((value: Date, view: TimeView) => boolean) | undefined;
}

/**
 * Time rules from `data-ok-min-time`, `-max-time` (times take `reference`'s day),
 * `-min-date-time`, `-max-date-time`, `-minutes-step`, `-disable-past`, `-disable-future` and
 * `-disable-ignoring-date-part-for-time-validation`.
 */
export function readTimeRules(
  element: Element,
  functions: TimeRuleFunctions,
  reference: Date,
): TimeRules {
  const time = (name: string) =>
    parsePickerValue(element.getAttribute(name), reference) ?? undefined;
  const step = Number(element.getAttribute("data-ok-minutes-step"));
  return {
    now: pickerNow(element),
    minTime: time("data-ok-min-time"),
    maxTime: time("data-ok-max-time"),
    minDateTime: parseIsoDate(element.getAttribute("data-ok-min-date-time")) ?? undefined,
    maxDateTime: parseIsoDate(element.getAttribute("data-ok-max-date-time")) ?? undefined,
    minutesStep: Number.isInteger(step) && step > 1 && step < 60 ? step : undefined,
    disablePast: element.hasAttribute("data-ok-disable-past"),
    disableFuture: element.hasAttribute("data-ok-disable-future"),
    disableIgnoringDatePartForTimeValidation: element.hasAttribute(
      "data-ok-disable-ignoring-date-part-for-time-validation",
    ),
    ...functions,
  };
}

/**
 * A value from an ISO date, time or date time string, a `Date` or `null` (times take `reference`'s
 * day; anything else: `undefined` = invalid input).
 */
export function toPickerDate(
  value: unknown,
  reference: Date,
  timezone: PickerTimezone = "system",
): Date | null | undefined {
  if (value === null || value === "") return null;
  if (value instanceof Date) return isValidDate(value) ? new Date(value.getTime()) : undefined;
  return parsePickerValue(value, reference, timezone) ?? undefined;
}

/**
 * The locale of the closest `data-ok-locale` (the element itself or an ancestor), with the
 * calendar of the closest `data-ok-calendar` when the locale names none (phase 4, ADR-0030).
 */
export const readLocale = (element: Element): string => {
  const value = element.closest("[data-ok-locale]")?.getAttribute("data-ok-locale");
  const locale = value == null ? DEFAULT_PICKER_LOCALE : safeLocale(value);
  const calendar = element.closest("[data-ok-calendar]")?.getAttribute("data-ok-calendar");
  return calendar && localeCalendar(locale) === "gregory" ? withCalendar(locale, calendar) : locale;
};

/** The zone of the closest `data-ok-timezone` (phase 4): `"UTC"`, an IANA name, else the system's. */
export const readTimezone = (element: Element): PickerTimezone =>
  safeTimezone(element.closest("[data-ok-timezone]")?.getAttribute("data-ok-timezone") ?? "system");

/** "Now" as the wall time of the element's zone. */
export const pickerNow = (element: Element): Date => nowInTimezone(readTimezone(element));

/** Today (midnight) in the element's zone. */
export const pickerToday = (element: Element): Date => startOfDay(pickerNow(element));

/** Built-in texts for the element's locale plus instance overrides. */
export const readLocaleText = (
  element: Element,
  overrides?: Partial<PickerLocaleText>,
): PickerLocaleText => pickerLocaleText(readLocale(element), overrides);

/** Functions set through instance methods (they have no attribute). */
export interface RuleFunctions {
  shouldDisableDate?: ((day: Date) => boolean) | undefined;
  shouldDisableMonth?: ((month: Date) => boolean) | undefined;
  shouldDisableYear?: ((year: Date) => boolean) | undefined;
}

/** Validation rules from `data-ok-min-date`, `-max-date`, `-disable-past`, `-disable-future`. */
export function readRules(element: Element, functions: RuleFunctions = {}): DateRules {
  return {
    calendar: pickerCalendar(readLocale(element)),
    minDate: parseIsoDate(element.getAttribute("data-ok-min-date")) ?? undefined,
    maxDate: parseIsoDate(element.getAttribute("data-ok-max-date")) ?? undefined,
    disablePast: element.hasAttribute("data-ok-disable-past"),
    disableFuture: element.hasAttribute("data-ok-disable-future"),
    ...functions,
  };
}

/** A function or `undefined` (instance methods accept untrusted input). */
export const asFunction = <F>(value: unknown): F | undefined =>
  typeof value === "function" ? (value as F) : undefined;

/** A date from an ISO string, a `Date` or `null` (anything else: `undefined` = invalid input). */
export function toDate(value: unknown): Date | null | undefined {
  if (value === null || value === "") return null;
  if (value instanceof Date) return isValidDate(value) ? new Date(value.getTime()) : undefined;
  return parseIsoDate(value) ?? undefined;
}

/** `createElement` with attributes and children (text or nodes). */
export function h(
  tag: string,
  attributes: Record<string, string | number | boolean | null | undefined> = {},
  children: (Node | string)[] = [],
): HTMLElement {
  const element = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) {
    if (value === false || value === null || value === undefined) continue;
    element.setAttribute(name, value === true ? "" : String(value));
  }
  element.append(...children);
  return element;
}

const SVG = "http://www.w3.org/2000/svg";

/** A decorative stroked icon (`d`: the path), the same SVG as the React components. */
export function strokeIcon(d: string): SVGSVGElement {
  const svg = document.createElementNS(SVG, "svg");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  const path = document.createElementNS(SVG, "path");
  path.setAttribute("d", d);
  svg.append(path);
  return svg;
}

export const ARROW_LEFT = "m15 6-6 6 6 6";
export const ARROW_RIGHT = "m9 6 6 6-6 6";

/**
 * Updates `current` in place to match `next` (same tags and child counts: attributes and texts are
 * patched; otherwise children are replaced). Keeps focus on nodes that stay, unlike a rebuild.
 */
export function morph(current: Element, next: Element): void {
  for (const attribute of [...current.attributes])
    if (!next.hasAttribute(attribute.name)) current.removeAttribute(attribute.name);
  for (const attribute of [...next.attributes])
    if (current.getAttribute(attribute.name) !== attribute.value)
      current.setAttribute(attribute.name, attribute.value);
  const before = [...current.childNodes];
  const after = [...next.childNodes];
  const same =
    before.length === after.length &&
    before.every((node, i) => {
      const other = after[i] as Node;
      return (
        node.nodeType === other.nodeType &&
        (!(node instanceof Element) || node.tagName === (other as Element).tagName)
      );
    });
  if (!same) {
    current.replaceChildren(...after);
    return;
  }
  before.forEach((node, i) => {
    const other = after[i] as Node;
    if (node instanceof Element) morph(node, other as Element);
    else if (node.textContent !== other.textContent) node.textContent = other.textContent;
  });
}

/** Instance methods for date libraries (phase 4, ADR-0030): `date`, `setDate`, `setDateAdapter`. */
export interface PickerDateApi<TValue = unknown> {
  /**
   * The value as the adapter's dates (`Date` instants without one): a date or `null`, or a
   * `[start, end]` range.
   */
  readonly date: TValue;
  /** Sets the value from the adapter's dates (or `Date` instants), without events. */
  setDate(value: TValue): void;
  /** The date library adapter, such as `createDayjsAdapter(dayjs)`; `null` = native `Date`. */
  setDateAdapter(adapter: PickerDateAdapter<unknown> | null): void;
}

const isAdapter = (value: unknown): value is PickerDateAdapter<unknown> =>
  typeof value === "object" &&
  value !== null &&
  typeof (value as PickerDateAdapter<unknown>).toDate === "function" &&
  typeof (value as PickerDateAdapter<unknown>).fromDate === "function" &&
  typeof (value as PickerDateAdapter<unknown>).isDate === "function";

/**
 * The adapter methods of a runtime: `read` gives the ISO value, `write` sets an engine value (a
 * wall-clock `Date`, a range or `null`).
 */
export function pickerDateApi(
  element: Element,
  read: () => string | null,
  write: (value: Date | DateRange | null) => void,
  range = false,
): {
  get(): unknown;
  set(value: unknown): void;
  setAdapter(adapter: unknown): void;
} {
  let adapter: PickerDateAdapter<unknown> | null = null;
  // HTML values are wall times of the element's zone (`data-ok-timezone`, else the system's).
  const zone = () => readTimezone(element);
  return {
    get() {
      const converter = createDateConverter(adapter, zone());
      const iso = read();
      const reference = pickerToday(element);
      if (range) return converter.fromEngine(parseIsoRange(iso ?? "/", reference) ?? [null, null]);
      return iso === null ? null : converter.fromEngine(parsePickerValue(iso, reference));
    },
    set(value) {
      const converter = createDateConverter(adapter, zone());
      const engine = converter.toEngine<Date | DateRange | null>(value);
      write(engine ?? null);
    },
    setAdapter(next) {
      adapter = isAdapter(next) ? next : null;
    },
  };
}

/**
 * New texts (`setLocaleText`, a locale pack) relabel the action bar's buttons; `nextOrAccept`
 * follows the view, so the picker sets it on each render.
 */
export function relabelActions(element: Element, text: PickerLocaleText): void {
  const labels: Record<string, string> = {
    accept: text.okButtonLabel,
    cancel: text.cancelButtonLabel,
    clear: text.clearButtonLabel,
    today: text.todayButtonLabel,
  };
  for (const button of element.querySelectorAll<HTMLElement>(
    "[data-ok-picker-actions] > [data-ok-picker-action]",
  )) {
    const label = labels[button.getAttribute("data-ok-picker-action") as string];
    if (label === undefined) continue;
    (button.querySelector("[data-ok-button-label]") ?? button).textContent = label;
  }
}
