/**
 * Luxon adapter (ADR-0030): `createLuxonAdapter(DateTime)` with the consumer's own Luxon
 * `DateTime` class. Luxon keeps zones itself (`DateTime.setZone`); Owlky imports nothing from it
 * at run time (types only).
 */
import type { DateTime } from "luxon";
import type { ZonedDateAdapter } from "../pickers/adapter.js";

declare module "../pickers/adapter.js" {
  interface PickerValidDateLookup {
    luxon: DateTime;
  }
}

/** What the adapter needs from Luxon's `DateTime` class. */
export interface LuxonDateTimeClass {
  fromJSDate(date: Date, options?: { zone?: string }): DateTime;
  isDateTime(value: unknown): value is DateTime;
  invalid(reason: string): DateTime;
}

export function createLuxonAdapter(
  DateTime: LuxonDateTimeClass,
  options: { calendar?: string } = {},
): ZonedDateAdapter<DateTime> {
  return {
    lib: "luxon",
    calendar: options.calendar,
    isDate: (value): value is DateTime => DateTime.isDateTime(value),
    toDate: (value) => (value.isValid ? value.toJSDate() : new Date(Number.NaN)),
    fromDate(instant, timezone) {
      if (Number.isNaN(instant.getTime())) return DateTime.invalid("Invalid date");
      return DateTime.fromJSDate(instant, { zone: timezone === "system" ? "local" : timezone });
    },
    getTimezone: (value) => (value.zone.type === "system" ? null : value.zoneName),
  };
}
