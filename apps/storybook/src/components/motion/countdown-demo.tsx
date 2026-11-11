import { Button, Countdown, ToggleButton } from "@owlky/react";
import { useState } from "react";

/** A countdown to a date, with a pause control (WCAG 2.2.2). `now` keeps the first render fixed. */
export function CountdownDateDemo() {
  const [paused, setPaused] = useState(false);
  return (
    <div className="sb-countdown">
      <Countdown
        id="launch-countdown"
        aria-label="Time until the launch"
        date="2027-01-01T00:00:00Z"
        now="2026-11-09T09:30:15Z"
        paused={paused}
      />
      <ToggleButton
        size="sm"
        aria-label="Pause the countdown"
        aria-controls="launch-countdown"
        selected={paused}
        onChange={setPaused}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24">
          <path
            d="M8 5v14M16 5v14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </ToggleButton>
    </div>
  );
}

/** A countdown of 10 seconds that the Start button runs (again). */
export function CountdownSecondsDemo() {
  const [run, setRun] = useState(0);
  return (
    <div className="sb-countdown">
      <Countdown
        key={run}
        id="code-countdown"
        aria-label="Time left to enter the code"
        seconds={10}
        largestUnit="seconds"
        paused={run === 0}
      />
      <Button variant="contained" aria-controls="code-countdown" onClick={() => setRun(run + 1)}>
        Start
      </Button>
    </div>
  );
}
