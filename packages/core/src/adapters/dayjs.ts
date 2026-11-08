/**
 * Day.js adapter (ADR-0030): `createDayjsAdapter(dayjs)` with the consumer's own `dayjs`. Time
 * zones need Day.js's `utc` and `timezone` plugins (`dayjs.extend(utc)`); without them values
 * stay local. Owlky imports nothing from Day.js at run time (types only).
 */
import type { Dayjs } from "dayjs";
import type { ZonedDateAdapter } from "../pickers/adapter.js";

declare module "../pickers/adapter.js" {
  interface PickerValidDateLookup {
    dayjs: Dayjs;
  }
}

/** What the adapter needs from `dayjs` (the default export; plugins optional). */
export interface DayjsLibrary {
  (date?: Date | number): Dayjs;
  isDayjs(value: unknown): value is Dayjs;
}

interface ZonedDayjs {
  tz?: (timezone: string) => Dayjs;
  isUTC?: () => boolean;
  $x?: { $timezone?: string };
}

export function createDayjsAdapter(
  dayjs: DayjsLibrary,
  options: { calendar?: string } = {},
): ZonedDateAdapter<Dayjs> {
  const utc = (dayjs as unknown as { utc?: (date: Date) => Dayjs }).utc;
  return {
    lib: "dayjs",
    calendar: options.calendar,
    isDate: (value): value is Dayjs => dayjs.isDayjs(value),
    toDate: (value) => (value.isValid() ? value.toDate() : new Date(Number.NaN)),
    fromDate(instant, timezone) {
      if (Number.isNaN(instant.getTime())) return dayjs(Number.NaN);
      if (timezone === "UTC" && utc) return utc(instant);
      const local = dayjs(instant);
      const zoned = local as unknown as ZonedDayjs;
      if (timezone !== "system" && timezone !== "UTC" && zoned.tz) return zoned.tz(timezone);
      return local;
    },
    getTimezone(value) {
      const zoned = value as unknown as ZonedDayjs;
      if (zoned.$x?.$timezone) return zoned.$x.$timezone;
      return zoned.isUTC?.() ? "UTC" : null;
    },
  };
}
