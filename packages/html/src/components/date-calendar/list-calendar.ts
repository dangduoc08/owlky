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
  pickerCalendar,
  setDateParts,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentDefinition, ComponentInstance, EventSpec } from "../../runtime/types.js";
import {
  asFunction,
  type PickerDateApi,
  pickerDateApi,
  pickerToday,
  type RuleFunctions,
  readLocale,
  readRules,
  toDate,
} from "./picker-dom.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface ListCalendarEvents {
  /** Before a month or a year is picked (`YYYY-MM-DD`, the first day). Call `preventDefault()` to refuse it. */
  change: EventSpec<{ value: string }, true>;
}

export interface ListCalendarInstance extends ComponentInstance, PickerDateApi {
  /** Selected date (ISO), or `null`. */
  readonly value: string | null;
  /** Sets the value without events (ISO string, `Date` or `null`). */
  setValue(value: string | Date | null): void;
  /** Disables the months for which the function returns `true` (`null`: none). */
  setShouldDisableMonth(fn: ((month: Date) => boolean) | null): void;
  /** Disables the years for which the function returns `true` (`null`: none). */
  setShouldDisableYear(fn: ((year: Date) => boolean) | null): void;
}

export function listCalendar(kind: "month" | "year"): ComponentDefinition<ListCalendarInstance> {
  const item = `[data-ok-picker-${kind}]`;
  return defineComponent<ListCalendarInstance, ListCalendarEvents>({
    name: `${kind}-calendar`,
    // Inside a date calendar, the date calendar runtime owns the list.
    selector: `[data-ok-${kind}-calendar]:not([data-ok-date-calendar] *)`,

    setup(element, { emit }) {
      const cal = pickerCalendar(readLocale(element));
      const functions: RuleFunctions = {};
      let value = parseIsoDate(element.getAttribute("data-ok-value"));
      const buttons = () => [...element.querySelectorAll<HTMLButtonElement>(item)];
      const base = () => value ?? pickerToday(element);
      const year = () => Number(element.getAttribute("data-ok-year")) || cal.year(base());
      let focused = Number(
        buttons()
          .find((b) => b.getAttribute("tabindex") === "0")
          ?.getAttribute("data-ok-value") ??
          (kind === "month" ? cal.month(base()) : cal.year(base())),
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
        const rules = { ...readRules(element, functions), today: pickerToday(element) };
        for (const button of buttons()) {
          const v = Number(button.getAttribute("data-ok-value"));
          const checked =
            value !== null &&
            (kind === "month"
              ? cal.year(value) === year() && cal.month(value) === v
              : cal.year(value) === v);
          button.setAttribute("aria-checked", String(checked));
          button.tabIndex = v === focused ? 0 : -1;
          // Rules set later (methods) can disable more; markup `disabled` stays as written.
          if (functions.shouldDisableMonth || functions.shouldDisableYear)
            button.disabled =
              kind === "month"
                ? isMonthDisabled(makeDate(year(), v, 1, cal), rules)
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
            ? setDateParts(from, { year: year(), month: v, day: Math.min(cal.day(from), 28) }, cal)
            : setDateParts(from, { year: v, day: Math.min(cal.day(from), 28) }, cal);
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
      const dates = pickerDateApi(
        element,
        () => (value ? formatIsoDate(value) : null),
        (next) => instance.setValue(next as Date | null),
      );
      const instance: ListCalendarInstance = {
        get value() {
          return value ? formatIsoDate(value) : null;
        },
        get date() {
          return dates.get();
        },
        setDate: dates.set,
        setDateAdapter: dates.setAdapter,
        setValue(next) {
          const date = toDate(next);
          if (date === undefined) return;
          value = date;
          if (date) focused = kind === "month" ? cal.month(date) : cal.year(date);
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
      return instance;
    },
  });
}
