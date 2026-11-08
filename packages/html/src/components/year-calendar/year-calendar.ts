import { listCalendar } from "../date-calendar/list-calendar.js";

/**
 * Year calendar (on its own) — spec: specs/components/date-picker.md
 *
 * Markup:  <div role="radiogroup" aria-label="Year" data-ok-year-calendar [data-ok-value="2025-05-25"]>
 *            <button role="radio" data-ok-picker-year data-ok-value="2025" aria-checked="true" tabindex="0">2025</button> …
 *          </div>
 * Events:  ok:year-calendar:change (cancelable, `{ value }`).
 */
export const yearCalendar = listCalendar("year");
