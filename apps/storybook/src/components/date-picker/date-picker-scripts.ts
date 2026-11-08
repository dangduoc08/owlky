import {
  type PickerLocaleText,
  pickersArSD,
  pickersDeDE,
  pickersFaIR,
  pickersFrFR,
  pickersJaJP,
} from "@owlky/core";
import { createDayjsAdapter } from "@owlky/core/adapters/dayjs";
import { getRuntime } from "@owlky/html";
import dayjs from "dayjs";

/** The instance methods phase 4 adds to the picker runtimes (ADR-0030). */
interface PickerScriptApi {
  setLocaleText(text: Partial<PickerLocaleText>): void;
  setDayRenderer(fn: ((day: HTMLButtonElement, date: Date) => void) | null): void;
  setDateAdapter(adapter: unknown): void;
}
const instanceIn = (row: HTMLElement, selector: string, name: string) =>
  getRuntime().get(row.querySelector(selector) as HTMLElement, name) as unknown as PickerScriptApi;

/** The demo's event days (the same as the React example's). */
const EVENT_DAYS = new Set([2, 9, 16, 23, 30]);

/** Custom day (HTML): a dot under the days with an event, on every month the calendar builds. */
export function eventDaysScript(row: HTMLElement) {
  const calendar = instanceIn(row, "[data-ok-date-calendar]", "date-calendar");
  calendar.setDayRenderer((day, date) => {
    if (day.hasAttribute("data-ok-outside") || !EVENT_DAYS.has(date.getDate())) return;
    const dot = document.createElement("span");
    dot.className = "sb-day-dot";
    dot.setAttribute("aria-hidden", "true");
    day.append(dot);
  });
  return () => calendar.setDayRenderer(null);
}

export const EVENT_DAYS_SCRIPT_SOURCE = `import { getRuntime } from "@owlky/html";

const calendar = getRuntime().get(document.getElementById("custom-day"), "date-calendar");
const events = new Set([2, 9, 16, 23, 30]);

// Runs for each day the calendar builds, on every month
calendar.setDayRenderer((day, date) => {
  if (day.hasAttribute("data-ok-outside") || !events.has(date.getDate())) return;
  const dot = document.createElement("span");
  dot.className = "day-dot";
  dot.setAttribute("aria-hidden", "true");
  day.append(dot);
});`;

/** Day.js (HTML): `picker.date` and `setDate()` speak Day.js once the adapter is set. */
export function dayjsScript(row: HTMLElement) {
  const picker = instanceIn(row, "[data-ok-date-picker]", "date-picker");
  picker.setDateAdapter(createDayjsAdapter(dayjs));
  return () => picker.setDateAdapter(null);
}

export const DAYJS_SCRIPT_SOURCE = `import { getRuntime } from "@owlky/html";
import { createDayjsAdapter } from "@owlky/core/adapters/dayjs";
import dayjs from "dayjs";

const picker = getRuntime().get(document.getElementById("lib-dayjs").closest("[data-ok-date-picker]"), "date-picker");
picker.setDateAdapter(createDayjsAdapter(dayjs));

picker.date; // a Day.js object, or null
picker.setDate(dayjs("2025-12-25"));`;

/** The runtimes whose roots take `setLocaleText` (pickers own their field and calendar). */
const LOCALIZED: [selector: string, name: string][] = [
  ["[data-ok-date-picker]", "date-picker"],
  ["[data-ok-date-range-picker]", "date-range-picker"],
  ["[data-ok-date-calendar]:not([data-ok-date-picker] *)", "date-calendar"],
  ["[data-ok-date-range-calendar]:not([data-ok-date-range-picker] *)", "date-range-calendar"],
  [
    "[data-ok-date-field]:not([data-ok-date-picker] *):not([data-ok-date-range-picker] *)",
    "date-field",
  ],
];

/**
 * Locale packs (HTML): English and Vietnamese are built in; other packs go to each instance's
 * `setLocaleText()`. `packs` maps a selector inside the row to its pack (`*` = every one).
 */
export const localeScript =
  (packs: Record<string, Partial<PickerLocaleText>>) => (row: HTMLElement) => {
    for (const [scope, pack] of Object.entries(packs)) {
      const target = scope === "*" ? null : row.querySelector(scope);
      for (const [selector, name] of LOCALIZED) {
        // `*`: every instance of the row; else the one that holds the scope's element.
        const elements = target
          ? [target.closest<HTMLElement>(selector)].filter((el) => el !== null)
          : [...row.querySelectorAll<HTMLElement>(selector)];
        for (const element of elements)
          (getRuntime().get(element, name) as unknown as PickerScriptApi).setLocaleText(pack);
      }
    }
    return undefined;
  };

export const LOCALE_SCRIPT_SOURCE = `import { getRuntime } from "@owlky/html";
import { pickersFrFR } from "@owlky/core";

// English and Vietnamese are built in: give each picker its pack
const picker = getRuntime().get(document.getElementById("dl-fr").closest("[data-ok-date-picker]"), "date-picker");
picker.setLocaleText(pickersFrFR);`;

export const PACK_SCRIPTS = {
  packs: localeScript({ "#dl-fr": pickersFrFR, "#dl-de": pickersDeDE, "#dl-ja": pickersJaJP }),
  jalali: localeScript({ "*": pickersFaIR }),
  hijri: localeScript({ "*": pickersArSD }),
  rtl: localeScript({ "*": pickersArSD }),
};
