/**
 * Time zones (phase 4, ADR-0030), with `Intl` only. The engine computes in local time, so a
 * value in another zone is converted at the component's edge: `toWallClock` gives a local `Date`
 * whose fields are the zone's wall time (what the field and the calendar show), `fromWallClock`
 * turns it back into the instant. `"default"` and `"system"` mean no conversion.
 *
 * Wall times the system zone skips (a daylight saving gap of the computer, not of the picker's
 * zone) can't be held by a local `Date`: they move by the gap.
 */
import { isValidDate } from "./dates.js";

/** MUI X's `timezone`: the value's zone (`"default"`), the computer's, `"UTC"` or an IANA name. */
export type PickerTimezone = "default" | "system" | "UTC" | (string & {});

const IANA = /^[A-Za-z][A-Za-z0-9_+\-/]{0,63}$/;
const formats = new Map<string, Intl.DateTimeFormat>();

/** The zone's formatter (`h23` parts), or `null` when `Intl` doesn't know the zone. */
function zoneFormat(timezone: string): Intl.DateTimeFormat | null {
  const known = formats.get(timezone);
  if (known) return known;
  try {
    const format = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      era: "short",
    });
    if (formats.size > 64) formats.clear();
    formats.set(timezone, format);
    return format;
  } catch {
    return null;
  }
}

/**
 * A time zone from untrusted input: `"default"`, `"system"`, `"UTC"` or an IANA name `Intl`
 * knows (as written); anything else is `"default"`.
 */
export function safeTimezone(value: unknown): PickerTimezone {
  if (value === "default" || value === "system" || value === "UTC") return value;
  if (typeof value !== "string" || !IANA.test(value)) return "default";
  const format = zoneFormat(value);
  // The name as written: engines canonicalize differently (Asia/Saigon vs. Asia/Ho_Chi_Minh).
  return format ? value : "default";
}

/** The zone converts values: not `"default"` / `"system"`. */
export const isZonedTimezone = (timezone: PickerTimezone | null | undefined): timezone is string =>
  typeof timezone === "string" && timezone !== "default" && timezone !== "system";

/** The computer's IANA zone (`"system"` resolved), for labels. */
export const systemTimezone = (): string => new Intl.DateTimeFormat().resolvedOptions().timeZone;

/** The wall time of an instant in a zone, as UTC milliseconds of those fields. */
function wallMs(instant: number, timezone: string): number {
  const format = zoneFormat(timezone) as Intl.DateTimeFormat;
  const at = { year: 0, month: 1, day: 1, hour: 0, minute: 0, second: 0 };
  let bc = false;
  for (const part of format.formatToParts(new Date(instant))) {
    if (part.type === "era") bc = /^B/i.test(part.value);
    else if (part.type in at) at[part.type as keyof typeof at] = Number.parseInt(part.value, 10);
  }
  const date = new Date(0);
  date.setUTCFullYear(bc ? 1 - at.year : at.year, at.month - 1, at.day);
  date.setUTCHours(at.hour, at.minute, at.second, new Date(instant).getUTCMilliseconds());
  return date.getTime();
}

/** Minutes the zone is ahead of UTC at an instant (`-240` for New York in summer). */
export function timezoneOffset(instant: Date, timezone: PickerTimezone): number {
  if (!isValidDate(instant)) return 0;
  if (!isZonedTimezone(timezone)) return -instant.getTimezoneOffset();
  if (!zoneFormat(timezone)) return 0;
  return Math.round((wallMs(instant.getTime(), timezone) - instant.getTime()) / 60_000);
}

/** A local `Date` whose fields are the zone's wall time at `instant` (invalid stays invalid). */
export function toWallClock(instant: Date, timezone: PickerTimezone): Date {
  if (!isValidDate(instant) || !isZonedTimezone(timezone) || !zoneFormat(timezone))
    return new Date(instant.getTime());
  const fields = new Date(wallMs(instant.getTime(), timezone));
  const wall = new Date(2000, 0, 1);
  wall.setFullYear(fields.getUTCFullYear(), fields.getUTCMonth(), fields.getUTCDate());
  wall.setHours(
    fields.getUTCHours(),
    fields.getUTCMinutes(),
    fields.getUTCSeconds(),
    fields.getUTCMilliseconds(),
  );
  return wall;
}

/**
 * The instant whose wall time in the zone is `wall`'s local fields. In a gap (spring forward)
 * the later offset wins; in an overlap (fall back) the earlier instant.
 */
export function fromWallClock(wall: Date, timezone: PickerTimezone): Date {
  if (!isValidDate(wall) || !isZonedTimezone(timezone) || !zoneFormat(timezone))
    return new Date(wall.getTime());
  const fields = new Date(0);
  fields.setUTCFullYear(wall.getFullYear(), wall.getMonth(), wall.getDate());
  fields.setUTCHours(wall.getHours(), wall.getMinutes(), wall.getSeconds(), wall.getMilliseconds());
  const target = fields.getTime();
  const first = target - (wallMs(target, timezone) - target);
  const second = target - (wallMs(first, timezone) - first);
  const valid = [first, second].filter((instant) => wallMs(instant, timezone) === target);
  return new Date(valid.length > 0 ? Math.min(...valid) : Math.max(first, second));
}

/** "Now" as the zone's wall time. */
export const nowInTimezone = (timezone: PickerTimezone): Date => toWallClock(new Date(), timezone);

/** `Z` for UTC, else `+HH:MM` / `-HH:MM`. */
export function formatIsoOffset(minutes: number, timezone?: PickerTimezone): string {
  if (timezone === "UTC") return "Z";
  const sign = minutes < 0 ? "-" : "+";
  const abs = Math.abs(minutes);
  return `${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

const OFFSET = /(?:[Zz]|([+-])(\d{2}):?(\d{2}))$/;

/**
 * An ISO date time with an offset (`…Z`, `…+07:00`) as the zone's wall time; text without an
 * offset is already a wall time (`parse` reads it). `null` for anything else.
 */
export function parseIsoInZone(
  text: unknown,
  timezone: PickerTimezone,
  parse: (text: string) => Date | null,
): Date | null {
  if (typeof text !== "string" || text.length > 40) return null;
  const trimmed = text.trim();
  const match = OFFSET.exec(trimmed);
  // A time alone (`09:30:00`) has no offset to read.
  if (!match || !/T|\d \d/.test(trimmed)) return parse(trimmed);
  const local = parse(trimmed.slice(0, match.index));
  if (!local) return null;
  const minutes = match[1]
    ? (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3]))
    : 0;
  if (Math.abs(minutes) > 18 * 60) return null;
  const fields = new Date(0);
  fields.setUTCFullYear(local.getFullYear(), local.getMonth(), local.getDate());
  fields.setUTCHours(local.getHours(), local.getMinutes(), local.getSeconds(), 0);
  const instant = new Date(fields.getTime() - minutes * 60_000);
  return isZonedTimezone(timezone) ? toWallClock(instant, timezone) : instant;
}
