/*
 * Countdown (the reference's Utilities "Countdown"): the time left to a date, or of a number of
 * seconds, split into days / hours / minutes / seconds. Shared by React and the HTML runtime: the
 * owner writes the values and the announcements it is given. Spec: specs/components/motion.md.
 */

export const countdownUnits = ["days", "hours", "minutes", "seconds"] as const;
export type CountdownUnit = (typeof countdownUnits)[number];

const SECONDS: Record<CountdownUnit, number> = {
  days: 86400,
  hours: 3600,
  minutes: 60,
  seconds: 1,
};

/** The default unit labels (plural English; pass your own for other languages). */
export const countdownLabels: Readonly<Record<CountdownUnit, string>> = {
  days: "days",
  hours: "hours",
  minutes: "minutes",
  seconds: "seconds",
};

/** The default text announced when the countdown ends. */
export const countdownCompleteLabel = "Time's up";

/** The text a value shows before a date countdown without `now` mounts. */
export const COUNTDOWN_PLACEHOLDER = "--";

/** The units shown, from `largest` down to seconds. */
export const countdownShownUnits = (largest: CountdownUnit): CountdownUnit[] =>
  countdownUnits.slice(countdownUnits.indexOf(largest));

/** `remaining` whole seconds split from `largest` down (a larger unit folds into `largest`). */
export function countdownParts(
  remaining: number,
  largest: CountdownUnit = "days",
): Record<CountdownUnit, number> {
  let rest = Math.max(0, Math.floor(remaining));
  const parts = { days: 0, hours: 0, minutes: 0, seconds: 0 };
  for (const unit of countdownShownUnits(largest)) {
    parts[unit] = Math.floor(rest / SECONDS[unit]);
    rest -= parts[unit] * SECONDS[unit];
  }
  return parts;
}

/** The text of one unit: the largest one as is, the others with two digits (`05`). */
export const countdownValueText = (
  parts: Record<CountdownUnit, number>,
  unit: CountdownUnit,
  largest: CountdownUnit,
): string => (unit === largest ? String(parts[unit]) : String(parts[unit]).padStart(2, "0"));

/** The time left in words, non-zero units only ("2 hours, 15 minutes"); `""` at 0. */
export function countdownText(
  remaining: number,
  largest: CountdownUnit = "days",
  labels: Readonly<Record<CountdownUnit, string>> = countdownLabels,
): string {
  const parts = countdownParts(remaining, largest);
  return countdownShownUnits(largest)
    .filter((unit) => parts[unit] > 0)
    .map((unit) => `${parts[unit]} ${labels[unit]}`)
    .join(", ");
}

/**
 * The announcement step `remaining` falls in: whole hours while an hour or more is left, whole
 * minutes while a minute or more is left, then 60–31, 30–11, 10–1 seconds, and the end. An owner
 * announces when the step changes, so a screen reader hears the countdown about once a minute
 * instead of every second.
 */
export function countdownStep(remaining: number): string {
  const left = Math.max(0, Math.ceil(remaining));
  if (left >= 3600) return `h${Math.floor(left / 3600)}`;
  if (left >= 60) return `m${Math.floor(left / 60)}`;
  if (left > 30) return "s60";
  if (left > 10) return "s30";
  return left > 0 ? "s10" : "end";
}

/**
 * The live region's next text when the time left moves from `previous` to `remaining`, or
 * `undefined` to keep the current one (same step).
 */
export function countdownAnnouncement(
  previous: number,
  remaining: number,
  options: {
    largest?: CountdownUnit;
    labels?: Readonly<Record<CountdownUnit, string>>;
    completeLabel?: string;
  } = {},
): string | undefined {
  const step = countdownStep(remaining);
  if (step === countdownStep(previous)) return undefined;
  if (step === "end") return options.completeLabel ?? countdownCompleteLabel;
  return countdownText(remaining, options.largest, options.labels);
}

/** A time in ms since the epoch from a `Date`, an epoch number or a date string; else `undefined`. */
export function parseCountdownTime(value: unknown): number | undefined {
  let time: number;
  if (value instanceof Date) time = value.getTime();
  else if (typeof value === "number") time = value;
  else if (typeof value === "string" && value.trim() !== "" && value.length <= 64)
    time = /^-?\d+$/.test(value.trim()) ? Number(value) : Date.parse(value);
  else return undefined;
  return Number.isFinite(time) ? time : undefined;
}

/** A valid `seconds` value (finite, at least 0), else `undefined`. */
export function parseCountdownSeconds(value: unknown): number | undefined {
  const seconds = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  return typeof seconds === "number" && Number.isFinite(seconds) && seconds >= 0
    ? seconds
    : undefined;
}

/**
 * Whole seconds left at the first render, so server and client agree: the seconds of a seconds
 * countdown, the time from `now` to `date` for a date countdown, `undefined` when that needs the
 * clock (a date without `now`: the owner renders placeholders until it mounts).
 */
export function countdownInitial(options: {
  date?: number | undefined;
  seconds?: number | undefined;
  now?: number | undefined;
}): number | undefined {
  if (options.date !== undefined)
    return options.now === undefined
      ? undefined
      : Math.max(0, Math.ceil((options.date - options.now) / 1000));
  return options.seconds === undefined ? undefined : Math.ceil(options.seconds);
}

export interface CountdownOptions {
  /** Target time, ms since the epoch (wins over `seconds`). */
  date?: number | undefined;
  /** Length of a seconds countdown. */
  seconds?: number | undefined;
  /** The clock's time at creation (ms since the epoch); the clock then runs from it. */
  now?: number | undefined;
  /** Starts paused. */
  paused?: boolean | undefined;
  /** Whole seconds left, at creation and each time the value changes. */
  onTick(remaining: number): void;
  /** Called once when the time left reaches 0. */
  onComplete?: (() => void) | undefined;
}

export interface Countdown {
  /** Whole seconds left. */
  readonly remaining: number;
  readonly paused: boolean;
  pause(): void;
  resume(): void;
  /** Starts over from the full time (seconds) or the date, running. */
  restart(): void;
  destroy(): void;
}

/**
 * Runs a countdown: one timer per change of the shown value (aligned to the next whole second).
 * With `paused`, a seconds countdown keeps its time left; a date countdown keeps its last value and
 * shows the real time left when it resumes.
 */
export function createCountdown(options: CountdownOptions): Countdown {
  const offset = options.now === undefined ? 0 : options.now - Date.now();
  const clock = () => Date.now() + offset;
  const seconds = Math.max(0, options.seconds ?? 0) * 1000;
  let paused = options.paused === true;
  let left = seconds; // ms left of a seconds countdown while paused
  let end = options.date ?? clock() + seconds; // when it reaches 0 while running
  let shown = -1;
  let completed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const ms = () => (paused && options.date === undefined ? left : Math.max(0, end - clock()));

  const tick = () => {
    clearTimeout(timer);
    timer = undefined;
    const rest = ms();
    const whole = Math.ceil(rest / 1000);
    if (whole !== shown) {
      shown = whole;
      options.onTick(whole);
    }
    if (whole === 0) {
      if (!completed) {
        completed = true;
        options.onComplete?.();
      }
      return;
    }
    if (!paused) timer = setTimeout(tick, rest % 1000 || 1000);
  };

  tick();
  return {
    get remaining() {
      return shown;
    },
    get paused() {
      return paused;
    },
    pause() {
      if (paused) return;
      left = ms();
      paused = true;
      clearTimeout(timer);
      timer = undefined;
    },
    resume() {
      if (!paused) return;
      paused = false;
      if (options.date === undefined) end = clock() + left;
      tick();
    },
    restart() {
      paused = false;
      completed = false;
      left = seconds;
      end = options.date ?? clock() + seconds;
      tick();
    },
    destroy() {
      clearTimeout(timer);
      timer = undefined;
    },
  };
}
