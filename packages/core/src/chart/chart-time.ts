/*
 * Time value axes (ADR-0031, phase 4): timelines draw dates along their value axis. Ticks fall on
 * whole minutes, hours, days, months or years (UTC, so the server and every browser agree).
 */

export type TimeUnit = "minute" | "hour" | "day" | "month" | "year";

const MINUTE = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;

/** The unit that best labels a span of time. */
export function timeUnit(min: number, max: number): TimeUnit {
  const span = Math.abs(max - min);
  if (span <= 3 * HOUR) return "minute";
  if (span <= 3 * DAY) return "hour";
  if (span <= 120 * DAY) return "day";
  if (span <= 5 * 365 * DAY) return "month";
  return "year";
}

const STEPS: Record<TimeUnit, readonly number[]> = {
  minute: [1, 2, 5, 10, 15, 30],
  hour: [1, 2, 3, 6, 12],
  day: [1, 2, 7, 14],
  month: [1, 2, 3, 6],
  year: [1, 2, 5, 10, 20, 50, 100],
};

const monthIndex = (time: number) => {
  const date = new Date(time);
  return date.getUTCFullYear() * 12 + date.getUTCMonth();
};
const fromMonth = (index: number) => Date.UTC(Math.floor(index / 12), index % 12, 1);

/** Ticks on whole units in `[min, max]`, at most `count` of them (at least the ends' unit). */
export function timeTicks(min: number, max: number, count: number, unit: TimeUnit): number[] {
  const most = Math.max(2, Math.round(count));
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);
  const list = (step: number): number[] => {
    const out: number[] = [];
    if (unit === "month" || unit === "year") {
      const months = unit === "year" ? step * 12 : step;
      let index = Math.ceil(monthIndex(lo) / months) * months;
      if (fromMonth(index) < lo) index += months;
      for (let i = 0; i < 1000; i++, index += months) {
        const time = fromMonth(index);
        if (time > hi) break;
        out.push(time);
      }
      return out;
    }
    const size = (unit === "minute" ? MINUTE : unit === "hour" ? HOUR : DAY) * step;
    // Weeks start on Mondays (5 January 1970 was one).
    const origin = unit === "day" && step % 7 === 0 ? 4 * DAY : 0;
    for (
      let time = Math.ceil((lo - origin) / size) * size + origin, i = 0;
      time <= hi && i < 1000;
      i++
    ) {
      out.push(time);
      time += size;
    }
    return out;
  };
  const steps = STEPS[unit];
  for (const step of steps) {
    const ticks = list(step);
    if (ticks.length <= most) return ticks;
  }
  // Very long spans: thin the largest step's ticks.
  const ticks = list(steps.at(-1) as number);
  const every = Math.ceil(ticks.length / most);
  return ticks.filter((_, i) => i % every === 0);
}

const pad = (n: number) => String(n).padStart(2, "0");

/** A tick label: "14:30" (a new day: "02 Jan"), "02 Jan", "Jan '26" (a new year: "2026"), "2026". */
export function timeTickLabel(
  time: number,
  unit: TimeUnit,
  months: readonly string[],
): { text: string; major: boolean } {
  const date = new Date(time);
  const month = months[date.getUTCMonth()] as string;
  const day = `${pad(date.getUTCDate())} ${month}`;
  if (unit === "minute" || unit === "hour") {
    return date.getUTCHours() === 0 && date.getUTCMinutes() === 0
      ? { text: day, major: true }
      : { text: `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`, major: false };
  }
  if (unit === "day") return { text: day, major: date.getUTCDate() === 1 };
  if (unit === "month")
    return date.getUTCMonth() === 0
      ? { text: String(date.getUTCFullYear()), major: true }
      : { text: `${month} '${pad(date.getUTCFullYear() % 100)}`, major: false };
  return { text: String(date.getUTCFullYear()), major: false };
}

/** A date value in tooltips and tables: "02 Jan 2026", with the time for short spans. */
export function timeValueLabel(time: number, unit: TimeUnit, months: readonly string[]): string {
  const date = new Date(time);
  const day = `${pad(date.getUTCDate())} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
  return unit === "minute" || unit === "hour"
    ? `${day} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
    : day;
}
