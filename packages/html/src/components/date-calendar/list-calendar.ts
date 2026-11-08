/**
 * MonthCalendar / YearCalendar on their own (outside a date calendar): a radio group of buttons.
 * One definition per folder (`month-calendar`, `year-calendar`); this factory is shared.
 */
import {
  createCalendarController,
  formatIsoDate,
  isMonthDisabled,
  isYearDisabled,
  makeDate,
  parseIsoDate,
  setDateParts,
  startOfDay,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentDefinition, ComponentInstance } from "../../runtime/types.js";
import { asFunction, type RuleFunctions, readRules, toDate } from "./picker-dom.js";

export interface ListCalendarInstance extends ComponentInstance {
  /** Selected date (ISO), or `null`. */
  readonly value: string | null;
  /** Sets the value without events (ISO string, `Date` or `null`). */
  setValue(value: string | Date | null): void;
  setShouldDisableMonth(fn: ((month: Date) => boolean) | null): void;
  setShouldDisableYear(fn: ((year: Date) => boolean) | null): void;
}

export function listCalendar(kind: "month" | "year"): ComponentDefinition<ListCalendarInstance> {
  const item = `[data-ok-picker-${kind}]`;
  return defineComponent<ListCalendarInstance>({
    name: `${kind}-calendar`,
    // Inside a date calendar, the date calendar runtime owns the list.
    selector: `[data-ok-${kind}-calendar]:not([data-ok-date-calendar] *)`,

    setup(element, { emit }) {
      const functions: RuleFunctions = {};
      let value = parseIsoDate(element.getAttribute("data-ok-value"));
      const buttons = () => [...element.querySelectorAll<HTMLButtonElement>(item)];
      const base = () => value ?? startOfDay(new Date());
      const year = () => Number(element.getAttribute("data-ok-year")) || base().getFullYear();
      let focused = Number(
        buttons()
          .find((b) => b.getAttribute("tabindex") === "0")
          ?.getAttribute("data-ok-value") ??
          (kind === "month" ? base().getMonth() : base().getFullYear()),
      );
      const perRow = () =>
        Number(element.getAttribute(`data-ok-${kind}s-per-row`)) === (kind === "month" ? 4 : 3)
          ? kind === "month"
            ? 4
            : 3
          : kind === "month"
            ? 3
            : 4;

      const render = () => {
        const rules = { ...readRules(element, functions), today: startOfDay(new Date()) };
        for (const button of buttons()) {
          const v = Number(button.getAttribute("data-ok-value"));
          const checked =
            value !== null &&
            (kind === "month"
              ? value.getFullYear() === year() && value.getMonth() === v
              : value.getFullYear() === v);
          button.setAttribute("aria-checked", String(checked));
          button.tabIndex = v === focused ? 0 : -1;
          // Rules set later (methods) can disable more; markup `disabled` stays as written.
          if (functions.shouldDisableMonth || functions.shouldDisableYear)
            button.disabled =
              kind === "month"
                ? isMonthDisabled(makeDate(year(), v, 1), rules)
                : isYearDisabled(v, rules);
        }
        if (value) element.setAttribute("data-ok-value", formatIsoDate(value));
        else element.removeAttribute("data-ok-value");
        controller.sync();
      };

      const pick = (v: number) => {
        const from = base();
        const next =
          kind === "month"
            ? setDateParts(from, { year: year(), month: v, day: Math.min(from.getDate(), 28) })
            : setDateParts(from, { year: v, day: Math.min(from.getDate(), 28) });
        focused = v;
        if (emit("change", { value: formatIsoDate(next) }, { cancelable: true })) value = next;
        render();
      };

      const controller = createCalendarController(element, {
        read: () => ({
          focusedDate: base(),
          rules: readRules(element, functions),
          weekStart: 0,
          monthsPerRow: perRow(),
          yearsPerRow: perRow(),
          disabled: false,
          readOnly: element.hasAttribute("data-ok-read-only"),
        }),
        onSelectMonth: pick,
        onSelectYear: pick,
        onFocusMonth: (m) => {
          focused = m;
          render();
        },
        onFocusYear: (y) => {
          focused = y;
          render();
        },
      });

      render();
      return {
        get value() {
          return value ? formatIsoDate(value) : null;
        },
        setValue(next) {
          const date = toDate(next);
          if (date === undefined) return;
          value = date;
          if (date) focused = kind === "month" ? date.getMonth() : date.getFullYear();
          render();
        },
        setShouldDisableMonth(fn) {
          functions.shouldDisableMonth = asFunction(fn);
          render();
        },
        setShouldDisableYear(fn) {
          functions.shouldDisableYear = asFunction(fn);
          render();
        },
        destroy() {
          controller.destroy();
        },
      };
    },
  });
}
