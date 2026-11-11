import {
  type Countdown,
  type CountdownUnit,
  countdownAnnouncement,
  countdownCompleteLabel,
  countdownLabels,
  countdownOptions,
  countdownParts,
  countdownUnits,
  countdownValueText,
  createCountdown,
  parseCountdownSeconds,
  parseCountdownTime,
  readNumber,
  readStyle,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec, Runtime } from "../../runtime/types.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface CountdownEvents {
  /** The shown value changed: `remaining` is the whole seconds left (also fired at setup). */
  tick: EventSpec<{ remaining: number }>;
  /** The countdown reached 0 (once per run; a date in the past completes at setup). */
  complete: EventSpec;
}

export interface CountdownInstance extends ComponentInstance {
  /** Whole seconds left. */
  readonly remaining: number;
  /** `true` while `data-ok-paused` is set. */
  readonly paused: boolean;
  /** Stops the countdown (sets `data-ok-paused`). */
  pause(): void;
  /** Runs it again (removes `data-ok-paused`). */
  resume(): void;
  /** Starts over from the full time (seconds) or the date, running. */
  restart(): void;
}

const { seconds, largestUnit, paused: pausedOption } = countdownOptions.options;
const PAUSED = pausedOption.attr;
const TOGGLE = "data-ok-countdown-toggle";
const RESTART = "data-ok-countdown-restart";
/** Attributes that start the countdown over. */
const RESTARTS = ["data-ok-date", seconds.attr, "data-ok-now"];

/** The countdown a trigger names, mounted if needed. */
const targetOf = (trigger: Element, attribute: string, runtime: Runtime) => {
  const id = trigger.getAttribute(attribute);
  const target = id ? (trigger.getRootNode() as Document | ShadowRoot).getElementById(id) : null;
  return target?.hasAttribute("data-ok-countdown")
    ? runtime.getOrCreate<CountdownInstance>(target, "countdown")
    : undefined;
};

/**
 * Countdown — spec: specs/components/motion.md
 *
 * Markup:  <span id="launch" data-ok-countdown role="timer" data-ok-largest-unit="days"
 *                data-ok-date="2026-12-31T00:00:00Z" [data-ok-seconds="60"] [data-ok-now]
 *                [data-ok-paused] [data-ok-complete-label="Time's up"]>
 *            <span data-ok-countdown-unit="days"><span data-ok-countdown-value>--</span>
 *              <span data-ok-countdown-label>days</span></span> … hours, minutes, seconds
 *            <span data-ok-countdown-status role="status"></span>
 *          </span>
 * Behavior: core `createCountdown` runs the clock; the runtime writes each unit's value and, on
 *          the announcement cadence, the status text. `data-ok-paused` pauses it; a new date,
 *          seconds or now starts over.
 * Triggers: [data-ok-countdown-toggle="<id>"] pauses / resumes (mirrors `aria-pressed`),
 *          [data-ok-countdown-restart="<id>"] starts over, running.
 * Events:  ok:countdown:tick ({ remaining }), ok:countdown:complete.
 */
export const countdown = defineComponent<CountdownInstance, CountdownEvents>({
  name: "countdown",
  selector: "[data-ok-countdown]",

  setup(element, { emit }) {
    const status = element.querySelector<HTMLElement>(":scope > [data-ok-countdown-status]");
    const values = new Map<CountdownUnit, HTMLElement>();
    const labels: Record<CountdownUnit, string> = { ...countdownLabels };
    for (const unit of element.querySelectorAll<HTMLElement>(":scope > [data-ok-countdown-unit]")) {
      const name = unit.getAttribute("data-ok-countdown-unit") as CountdownUnit;
      if (!countdownUnits.includes(name)) continue;
      const value = unit.querySelector<HTMLElement>("[data-ok-countdown-value]");
      if (value) values.set(name, value);
      const label = unit.querySelector("[data-ok-countdown-label]")?.textContent?.trim();
      if (label) labels[name] = label;
    }

    let counter: Countdown;
    const start = () => {
      const largest = readStyle(element, largestUnit);
      const date = parseCountdownTime(element.getAttribute("data-ok-date"));
      let previous: number | undefined;
      counter = createCountdown({
        date,
        seconds:
          date === undefined
            ? (parseCountdownSeconds(readNumber(element, seconds)) ?? 0)
            : undefined,
        now: parseCountdownTime(element.getAttribute("data-ok-now")),
        paused: element.hasAttribute(PAUSED),
        onTick(remaining) {
          const parts = countdownParts(remaining, largest);
          for (const [unit, value] of values)
            value.textContent = countdownValueText(parts, unit, largest);
          if (previous !== undefined && status) {
            const text = countdownAnnouncement(previous, remaining, {
              largest,
              labels,
              completeLabel:
                element.getAttribute("data-ok-complete-label") ?? countdownCompleteLabel,
            });
            if (text !== undefined) status.textContent = text;
          }
          previous = remaining;
          emit("tick", { remaining });
        },
        onComplete: () => emit("complete"),
      });
    };
    start();

    const syncTriggers = () => {
      if (!element.id) return;
      const root = element.getRootNode() as Document | ShadowRoot;
      for (const trigger of root.querySelectorAll(`[${TOGGLE}]`))
        if (trigger.getAttribute(TOGGLE) === element.id)
          trigger.setAttribute("aria-pressed", String(element.hasAttribute(PAUSED)));
    };
    syncTriggers();

    const observer = new MutationObserver((records) => {
      if (records.some((record) => RESTARTS.includes(record.attributeName as string))) {
        counter.destroy();
        start();
      } else if (element.hasAttribute(PAUSED)) counter.pause();
      else counter.resume();
      syncTriggers();
    });
    observer.observe(element, { attributes: true, attributeFilter: [PAUSED, ...RESTARTS] });

    return {
      get remaining() {
        return counter.remaining;
      },
      get paused() {
        return element.hasAttribute(PAUSED);
      },
      pause() {
        element.setAttribute(PAUSED, "");
      },
      resume() {
        element.removeAttribute(PAUSED);
      },
      restart() {
        element.removeAttribute(PAUSED);
        counter.restart();
      },
      destroy() {
        observer.disconnect();
        counter.destroy();
      },
    };
  },

  delegate: [
    {
      event: "click",
      selector: `[${TOGGLE}]`,
      handle(trigger, _event, runtime) {
        const instance = targetOf(trigger, TOGGLE, runtime);
        if (!instance) return;
        if (instance.paused) instance.resume();
        else instance.pause();
      },
    },
    {
      event: "click",
      selector: `[${RESTART}]`,
      handle(trigger, _event, runtime) {
        targetOf(trigger, RESTART, runtime)?.restart();
      },
    },
  ],
});
