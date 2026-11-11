"use client";

import {
  COUNTDOWN_PLACEHOLDER,
  type CountdownUnit,
  countdownAnnouncement,
  countdownAttributes,
  countdownCompleteLabel,
  countdownInitial,
  countdownLabels,
  countdownOptions,
  countdownParts,
  countdownShownUnits,
  countdownValueText,
  createCountdown,
  parseCountdownSeconds,
  parseCountdownTime,
  pick,
} from "@owlky/core";
import { forwardRef, type HTMLAttributes, useEffect, useRef, useState } from "react";

export interface CountdownProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** The time to count down to: a `Date`, an ISO string (with its offset, such as `Z`) or ms since the epoch. Wins over `seconds`. */
  date?: Date | string | number | undefined;
  /** Counts down from this many seconds (when there is no `date`). */
  seconds?: number | undefined;
  /** The time of the first render, so server and client markup agree; the clock then runs from it. Default: the current time once mounted. */
  now?: Date | string | number | undefined;
  /** The largest unit shown: larger ones fold into it. Default `"days"`. */
  largestUnit?: CountdownUnit | undefined;
  /** Stops the countdown (a pause control: WCAG 2.2.2). Seconds keep their time left; a date shows the real time left when it resumes. */
  paused?: boolean | undefined;
  /** The unit names. Default English plurals (`days`, `hours`, `minutes`, `seconds`). */
  labels?: Partial<Record<CountdownUnit, string>> | undefined;
  /** Announced to screen readers when the countdown ends. Default "Time's up". */
  completeLabel?: string | undefined;
  /** Called with the whole seconds left each time the shown value changes. */
  onTick?: ((remaining: number) => void) | undefined;
  /** Called once when the countdown reaches 0. */
  onComplete?: (() => void) | undefined;
}

/**
 * Countdown — spec: specs/components/motion.md. Days, hours, minutes and seconds left to a `date`,
 * or of a number of `seconds`. A polite live region announces the time left about once a minute
 * (not every second); change the `key` to start over.
 */
export const Countdown = forwardRef<HTMLSpanElement, CountdownProps>(function Countdown(
  {
    date,
    seconds,
    now,
    largestUnit,
    paused = false,
    labels,
    completeLabel,
    onTick,
    onComplete,
    ...props
  },
  ref,
) {
  const largest = pick(
    countdownOptions.options.largestUnit.values,
    largestUnit,
    countdownOptions.options.largestUnit.default,
  );
  const target = parseCountdownTime(date);
  const length = target === undefined ? parseCountdownSeconds(seconds) : undefined;
  const start = parseCountdownTime(now);
  const names = { ...countdownLabels, ...labels };
  const [remaining, setRemaining] = useState(() =>
    countdownInitial({ date: target, seconds: length, now: start }),
  );
  const [status, setStatus] = useState("");
  const counter = useRef<ReturnType<typeof createCountdown> | null>(null);
  // Callbacks and texts read at tick time, so a new function or label doesn't restart the count.
  const latest = useRef({ onTick, onComplete, largest, names, completeLabel });
  latest.current = { onTick, onComplete, largest, names, completeLabel };
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  useEffect(() => {
    let previous: number | undefined;
    const countdown = createCountdown({
      date: target,
      seconds: length ?? 0,
      now: start,
      paused: pausedRef.current,
      onTick(next) {
        if (previous !== undefined) {
          const { largest: unit, names: words, completeLabel: done } = latest.current;
          const text = countdownAnnouncement(previous, next, {
            largest: unit,
            labels: words,
            completeLabel: done ?? countdownCompleteLabel,
          });
          if (text !== undefined) setStatus(text);
        }
        previous = next;
        setRemaining(next);
        latest.current.onTick?.(next);
      },
      onComplete: () => latest.current.onComplete?.(),
    });
    counter.current = countdown;
    return () => {
      countdown.destroy();
      counter.current = null;
    };
  }, [target, length, start]);

  useEffect(() => {
    if (paused) counter.current?.pause();
    else counter.current?.resume();
  }, [paused]);

  const parts = remaining === undefined ? undefined : countdownParts(remaining, largest);
  return (
    <span
      ref={ref}
      role="timer"
      {...countdownAttributes({ seconds: length, largestUnit: largest, paused })}
      {...(target !== undefined && date !== undefined
        ? { "data-ok-date": date instanceof Date ? date.toISOString() : String(date) }
        : {})}
      {...(start !== undefined && now !== undefined
        ? { "data-ok-now": now instanceof Date ? now.toISOString() : String(now) }
        : {})}
      {...(completeLabel !== undefined ? { "data-ok-complete-label": completeLabel } : {})}
      data-ok-runtime="off"
      {...props}
    >
      {countdownShownUnits(largest).map((unit) => (
        <span key={unit} data-ok-countdown-unit={unit}>
          <span data-ok-countdown-value="">
            {parts ? countdownValueText(parts, unit, largest) : COUNTDOWN_PLACEHOLDER}
          </span>{" "}
          <span data-ok-countdown-label="">{names[unit]}</span>
        </span>
      ))}
      <span data-ok-countdown-status="" role="status">
        {status}
      </span>
    </span>
  );
});
