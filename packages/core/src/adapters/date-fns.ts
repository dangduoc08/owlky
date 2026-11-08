/**
 * date-fns adapter (ADR-0030): date-fns works on native `Date`, so the adapter only adds time
 * zones, through the consumer's `TZDate` from `@date-fns/tz` (`createDateFnsAdapter({ TZDate })`).
 * For the Jalali calendar of `date-fns-jalali`, pass `calendar: "persian"`. Owlky imports neither
 * package.
 */
import type { ZonedDateAdapter } from "../pickers/adapter.js";

/** `TZDate` from `@date-fns/tz`: a `Date` that carries its zone. */
export type TZDateConstructor = new (
  time: number,
  timeZone?: string,
) => Date & { readonly timeZone?: string | undefined };

export function createDateFnsAdapter(
  options: { TZDate?: TZDateConstructor; calendar?: string } = {},
): ZonedDateAdapter<Date> {
  const { TZDate } = options;
  return {
    lib: "date-fns",
    calendar: options.calendar,
    isDate: (value): value is Date => value instanceof Date,
    toDate: (value) => new Date(value.getTime()),
    fromDate(instant, timezone) {
      if (TZDate && timezone !== "system" && !Number.isNaN(instant.getTime()))
        return new TZDate(instant.getTime(), timezone);
      return new Date(instant.getTime());
    },
    getTimezone: (value) => (value as { timeZone?: string }).timeZone ?? null,
  };
}
