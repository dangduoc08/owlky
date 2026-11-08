/**
 * Calendar controller (ADR-0022): keys and presses on a date calendar — the day grid, the month
 * and year radio groups and the header buttons. It reports intent (focus this date, select that
 * month, show the next month); the owner renders, then calls `sync()` to move focus to the
 * element it rendered with `tabindex="0"`.
 *
 * Markup it reads: `button[data-ok-picker-day][data-ok-date]`,
 * `button[data-ok-picker-month][data-ok-value]`, `button[data-ok-picker-year][data-ok-value]`,
 * `[data-ok-date-calendar-prev]`, `[data-ok-date-calendar-next]`, `[data-ok-date-calendar-switch]`.
 */

import { type DateRules, dateBounds, isDateDisabled, stepEnabledDate } from "./calendar.js";
import { addMonths, addYears, parseIsoDate, startOfWeek } from "./dates.js";

export interface CalendarControllerState {
  /** The day with `tabindex="0"` in the day view. */
  focusedDate: Date;
  rules: DateRules;
  /** 0 = Sunday … 6 = Saturday. */
  weekStart: number;
  monthsPerRow: number;
  yearsPerRow: number;
  disabled: boolean;
  readOnly: boolean;
}

export interface CalendarControllerOptions {
  read(): CalendarControllerState;
  /** Day view (date calendars; month / year calendars on their own leave them out). */
  onFocusDate?(date: Date): void;
  onSelectDate?(date: Date): void;
  /** Month / year views (range calendars have only days and leave them out). */
  onSelectMonth?(month: number): void;
  onSelectYear?(year: number): void;
  /** Previous (-1) / next (1) month. */
  onMonthStep?(delta: -1 | 1): void;
  /** The header's view switch button. */
  onSwitchView?(): void;
  /** Arrow keys in the month / year lists (render `tabindex="0"` on it). */
  onFocusMonth?(month: number): void;
  onFocusYear?(year: number): void;
}

export interface CalendarController {
  /** After a render: moves focus to the view's `tabindex="0"` element if a key asked for it. */
  sync(): void;
  /** Focuses the view's `tabindex="0"` element now (pickers on open). */
  focus(): void;
  destroy(): void;
}

const VIEW_ITEM = "[data-ok-picker-day], [data-ok-picker-month], [data-ok-picker-year]";

/**
 * Focuses a calendar's current item: the day, month or year rendered with `tabindex="0"`, else
 * the first enabled one (pickers call it when they open).
 */
export function focusCalendar(root: Element): void {
  const target =
    root.querySelector<HTMLElement>(`:is(${VIEW_ITEM})[tabindex="0"]`) ??
    root.querySelector<HTMLElement>(`:is(${VIEW_ITEM}):not(:disabled)`);
  target?.focus();
  if (target && !target.matches("[data-ok-picker-day]"))
    target.scrollIntoView?.({ block: "nearest" });
}

export function createCalendarController(
  root: HTMLElement,
  options: CalendarControllerOptions,
): CalendarController {
  const controller = new AbortController();
  const { signal } = controller;
  let pending = false;

  const focusCurrent = () => focusCalendar(root);

  /** The next enabled item of a radio group (DOM order), `step` items away. */
  const moveInGroup = (item: HTMLElement, selector: string, step: number) => {
    const items = [...root.querySelectorAll<HTMLElement>(selector)];
    let at = items.indexOf(item) + step;
    while (at >= 0 && at < items.length) {
      const candidate = items[at] as HTMLElement;
      if (!(candidate as HTMLButtonElement).disabled) return candidate;
      at += Math.sign(step);
    }
    return null;
  };

  const dayKey = (event: KeyboardEvent, day: HTMLElement) => {
    const state = options.read();
    const current = parseIsoDate(day.getAttribute("data-ok-date"));
    if (!current) return;
    const rtl = getComputedStyle(root).direction === "rtl";
    let next: Date | null = null;
    switch (event.key) {
      case "ArrowLeft":
        next = stepEnabledDate(current, rtl ? 1 : -1, state.rules);
        break;
      case "ArrowRight":
        next = stepEnabledDate(current, rtl ? -1 : 1, state.rules);
        break;
      case "ArrowUp":
        next = stepEnabledDate(current, -7, state.rules);
        break;
      case "ArrowDown":
        next = stepEnabledDate(current, 7, state.rules);
        break;
      case "Home":
        next = startOfWeek(current, state.weekStart);
        break;
      case "End":
        next = startOfWeek(current, state.weekStart);
        next.setDate(next.getDate() + 6);
        break;
      case "PageUp":
        next = event.shiftKey
          ? addYears(current, -1, state.rules.calendar)
          : addMonths(current, -1, state.rules.calendar);
        break;
      case "PageDown":
        next = event.shiftKey
          ? addYears(current, 1, state.rules.calendar)
          : addMonths(current, 1, state.rules.calendar);
        break;
      default:
        return;
    }
    event.preventDefault();
    const [min, max] = dateBounds(state.rules);
    if (next.getTime() < min.getTime()) next = min;
    if (next.getTime() > max.getTime()) next = max;
    // Home / End / Page keys may land on a disabled day: step on to an enabled one.
    if (isDateDisabled(next, state.rules)) {
      const forward = stepEnabledDate(next, 1, state.rules);
      next =
        forward.getTime() !== next.getTime() ? forward : stepEnabledDate(next, -1, state.rules);
    }
    pending = true;
    options.onFocusDate?.(next);
  };

  const groupKey = (event: KeyboardEvent, item: HTMLElement, kind: "month" | "year") => {
    const state = options.read();
    const perRow = kind === "month" ? state.monthsPerRow : state.yearsPerRow;
    const selector = kind === "month" ? "[data-ok-picker-month]" : "[data-ok-picker-year]";
    const rtl = getComputedStyle(root).direction === "rtl";
    const steps: Record<string, number> = {
      ArrowLeft: rtl ? 1 : -1,
      ArrowRight: rtl ? -1 : 1,
      ArrowUp: -perRow,
      ArrowDown: perRow,
    };
    let target: HTMLElement | null | undefined;
    if (event.key in steps) target = moveInGroup(item, selector, steps[event.key] as number);
    else if (event.key === "Home")
      target = root.querySelector<HTMLElement>(`${selector}:not(:disabled)`);
    else if (event.key === "End")
      target = [...root.querySelectorAll<HTMLElement>(`${selector}:not(:disabled)`)].at(-1);
    else return;
    event.preventDefault();
    if (!target) return;
    const value = Number(target.getAttribute("data-ok-value"));
    pending = true;
    if (kind === "month") options.onFocusMonth?.(value);
    else options.onFocusYear?.(value);
  };

  root.addEventListener(
    "keydown",
    (event) => {
      if (event.defaultPrevented || options.read().disabled) return;
      const item = (event.target as Element).closest<HTMLElement>(VIEW_ITEM);
      if (!item || !root.contains(item)) return;
      if (item.hasAttribute("data-ok-picker-day")) dayKey(event, item);
      else groupKey(event, item, item.hasAttribute("data-ok-picker-month") ? "month" : "year");
    },
    { signal },
  );

  root.addEventListener(
    "click",
    (event) => {
      const target = event.target as Element;
      const state = options.read();
      if (state.disabled) return;
      if (target.closest("[data-ok-date-calendar-prev]")) return options.onMonthStep?.(-1);
      if (target.closest("[data-ok-date-calendar-next]")) return options.onMonthStep?.(1);
      if (target.closest("[data-ok-date-calendar-switch]")) return options.onSwitchView?.();
      const item = target.closest<HTMLButtonElement>(VIEW_ITEM);
      if (!item || item.disabled || !root.contains(item) || state.readOnly) return;
      if (item.hasAttribute("data-ok-picker-day")) {
        const date = parseIsoDate(item.getAttribute("data-ok-date"));
        if (date) options.onSelectDate?.(date);
      } else {
        const value = Number(item.getAttribute("data-ok-value"));
        pending = true;
        if (item.hasAttribute("data-ok-picker-month")) options.onSelectMonth?.(value);
        else options.onSelectYear?.(value);
      }
    },
    { signal },
  );

  // A day focused by a press (or by the browser) becomes the focused date.
  root.addEventListener(
    "focusin",
    (event) => {
      const day = (event.target as Element).closest<HTMLElement>("[data-ok-picker-day]");
      if (!day || day.getAttribute("tabindex") === "0") return;
      const date = parseIsoDate(day.getAttribute("data-ok-date"));
      if (date) options.onFocusDate?.(date);
    },
    { signal },
  );

  return {
    sync() {
      if (!pending) return;
      pending = false;
      focusCurrent();
    },
    focus: focusCurrent,
    destroy() {
      controller.abort();
    },
  };
}
