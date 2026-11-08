/**
 * Moment adapter (ADR-0030): `createMomentAdapter(moment)` with the consumer's own `moment`
 * (zones with `moment-timezone`). Jalali and Hijri builds (`moment-jalaali`, `moment-hijri`) pass
 * `calendar: "persian"` / `"islamic-umalqura"`: the pickers show that calendar through `Intl`.
 * Owlky imports nothing from Moment at run time (types only).
 */
import type { Moment } from "moment";
import type { ZonedDateAdapter } from "../pickers/adapter.js";

declare module "../pickers/adapter.js" {
  interface PickerValidDateLookup {
    moment: Moment;
  }
}

/** What the adapter needs from `moment` (`moment.tz` comes with `moment-timezone`). */
export interface MomentLibrary {
  (date?: Date): Moment;
  utc(date: Date): Moment;
  isMoment(value: unknown): value is Moment;
  invalid(): Moment;
}

interface ZonedMoment {
  tz?: () => string | undefined;
}

export function createMomentAdapter(
  moment: MomentLibrary,
  options: { calendar?: string } = {},
): ZonedDateAdapter<Moment> {
  const tz = (moment as unknown as { tz?: (date: Date, timezone: string) => Moment }).tz;
  return {
    lib: "moment",
    calendar: options.calendar,
    isDate: (value): value is Moment => moment.isMoment(value),
    toDate: (value) => (value.isValid() ? value.toDate() : new Date(Number.NaN)),
    fromDate(instant, timezone) {
      if (Number.isNaN(instant.getTime())) return moment.invalid();
      if (timezone === "UTC") return moment.utc(instant);
      if (timezone !== "system" && tz) return tz(instant, timezone);
      return moment(instant);
    },
    getTimezone(value) {
      const zone = (value as unknown as ZonedMoment).tz?.();
      if (zone) return zone;
      return value.isUTC() ? "UTC" : null;
    },
  };
}
