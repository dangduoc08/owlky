/**
 * Date adapters (phase 4, ADR-0030): the pickers compute with native `Date`; an adapter converts
 * the consumer's date objects (Day.js, date-fns, Luxon, Moment…) to and from it, and reads their
 * time zone. Adapters for those libraries are opt-in entry points (`@owlky/core/adapters/dayjs`…)
 * that receive the consumer's own library, so Owlky imports none of them.
 */
import { isValidDate } from "./dates.js";
import {
  fromWallClock,
  isZonedTimezone,
  type PickerTimezone,
  safeTimezone,
  toWallClock,
} from "./timezone.js";

/**
 * Date types the pickers accept. Adapter entry points add their library's type
 * (`declare module "@owlky/core" { interface PickerValidDateLookup { dayjs: Dayjs } }`).
 */
export interface PickerValidDateLookup {
  native: Date;
}
/** A date of any registered type (`Date` unless an adapter adds its own). */
export type PickerValidDate = PickerValidDateLookup[keyof PickerValidDateLookup];

/** Converts one date library's objects to and from native `Date` instants. */
export interface PickerDateAdapter<TDate = PickerValidDate> {
  /** The library's name (`"dayjs"`, `"date-fns"`, `"luxon"`, `"moment"`, `"native"`). */
  readonly lib: string;
  /** The value is one of the library's dates (valid or not). */
  isDate(value: unknown): value is TDate;
  /** The instant of a date (an invalid date gives an invalid `Date`). */
  toDate(value: TDate): Date;
  /**
   * A library date at `instant`, in `timezone` (`"system"`, `"UTC"` or an IANA name) when the
   * library supports zones; an invalid `Date` gives an invalid library date.
   */
  fromDate(instant: Date, timezone: string): TDate;
  /** The zone the value carries (`"UTC"`, an IANA name), or `null` (local / unknown). */
  getTimezone?(value: TDate): string | null;
  /** A calendar system the adapter implies (Jalali / Hijri adapters), as `Intl` ids. */
  readonly calendar?: string | undefined;
}

/** An adapter that reads the zone of its values (every library adapter). */
export type ZonedDateAdapter<TDate> = PickerDateAdapter<TDate> & {
  getTimezone(value: TDate): string | null;
};

/** Native `Date` values (the default): instants in the computer's zone. */
export const nativeDateAdapter: PickerDateAdapter<Date> = {
  lib: "native",
  isDate: (value): value is Date => value instanceof Date,
  toDate: (value) => new Date(value.getTime()),
  fromDate: (instant) => new Date(instant.getTime()),
};

/** The zone a component works in: its `timezone`, or the value's (`"default"`), else the system's. */
export function resolveTimezone(
  timezone: unknown,
  adapter: PickerDateAdapter<unknown> | null | undefined,
  values: readonly unknown[],
): PickerTimezone {
  const zone = safeTimezone(timezone ?? "default");
  if (zone !== "default") return zone;
  if (adapter?.getTimezone) {
    for (const value of values.flat()) {
      if (value == null || !adapter.isDate(value)) continue;
      const own = adapter.getTimezone(value);
      if (own) return safeTimezone(own) === "default" ? "system" : safeTimezone(own);
    }
  }
  return "system";
}

/** Converts between a component's public dates and the engine's local wall-clock `Date`s. */
export interface PickerDateConverter {
  readonly timezone: PickerTimezone;
  /** Public date (or range, `null`, `undefined`) → engine `Date`. Unknown objects pass through. */
  toEngine<T = Date | null>(value: unknown): T;
  /** Engine `Date` (or range…) → public date in the value's zone. */
  fromEngine<T = unknown>(value: unknown): T;
}

/**
 * A converter for an adapter and a zone. With the native adapter and no zone conversion it is
 * the identity on dates (new objects only where the engine expects copies).
 */
export function createDateConverter(
  adapter: PickerDateAdapter<unknown> | null | undefined,
  timezone: PickerTimezone,
): PickerDateConverter {
  const lib = adapter ?? (nativeDateAdapter as PickerDateAdapter<unknown>);
  const zone = isZonedTimezone(timezone) ? timezone : "system";
  const toEngine = (value: unknown): unknown => {
    if (value == null) return value;
    if (Array.isArray(value)) return value.map(toEngine);
    if (value instanceof Date && lib === nativeDateAdapter) return toWallClock(value, zone);
    if (!lib.isDate(value)) return value;
    const instant = lib.toDate(value);
    return isValidDate(instant) ? toWallClock(instant, zone) : instant;
  };
  const fromEngine = (value: unknown): unknown => {
    if (value == null) return value;
    if (Array.isArray(value)) return value.map(fromEngine);
    if (!(value instanceof Date)) return value;
    return lib.fromDate(isValidDate(value) ? fromWallClock(value, zone) : value, zone);
  };
  return {
    timezone: zone,
    toEngine: toEngine as <T>(value: unknown) => T,
    fromEngine: fromEngine as <T>(value: unknown) => T,
  };
}
