import { listCalendar } from "../date-calendar/list-calendar.js";

/**
 * Month calendar (on its own) — spec: specs/components/date-picker.md
 *
 * Markup:  <div role="radiogroup" aria-label="Month" data-ok-month-calendar data-ok-year="2025" [data-ok-value="2025-05-25"]>
 *            <button role="radio" data-ok-picker-month data-ok-value="0" aria-checked="false" tabindex="-1">Jan</button> …
 *          </div>
 * Events:  ok:month-calendar:change (cancelable, `{ value }`).
 */
export const monthCalendar = listCalendar("month");
