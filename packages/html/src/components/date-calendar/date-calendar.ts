import {
  addMonths,
  type CalendarDay,
  calendarHeaderText,
  calendarWeeks,
  closestEnabledDate,
  createCalendarController,
  type DateRules,
  type DateView,
  dateBounds,
  dateCalendarOptions,
  defaultDayOfWeekFormatter,
  firstDayOfWeek,
  formatIsoDate,
  initialView,
  isDateDisabled,
  isMonthDisabled,
  isSameDay,
  isSameMonth,
  isValidDate,
  isYearDisabled,
  makeDate,
  monthNames,
  nextView,
  normalizeDateViews,
  type PickerLocaleText,
  parseIsoDate,
  readNumber,
  readStyle,
  setDateParts,
  startOfDay,
  startOfMonth,
  weekNumber,
  yearRange,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance } from "../../runtime/types.js";
import {
  ARROW_LEFT,
  ARROW_RIGHT,
  asFunction,
  h,
  morph,
  type RuleFunctions,
  readLocale,
  readLocaleText,
  readRules,
  strokeIcon,
  toDate,
} from "./picker-dom.js";

export interface DateCalendarInstance extends ComponentInstance {
  /** Selected day (ISO), or `null`. */
  readonly value: string | null;
  /** Sets the value (ISO string, `Date` or `null`) and shows its month, without events. */
  setValue(value: string | Date | null): void;
  readonly view: DateView;
  setView(view: DateView): void;
  /** The shown month (`YYYY-MM`). */
  readonly month: string;
  /** Focuses the current day (or month / year). */
  focus(): void;
  setShouldDisableDate(fn: ((day: Date) => boolean) | null): void;
  setShouldDisableMonth(fn: ((month: Date) => boolean) | null): void;
  setShouldDisableYear(fn: ((year: Date) => boolean) | null): void;
  /** Weekday header text (default: first letter of the short name). */
  setDayOfWeekFormatter(fn: ((date: Date) => string) | null): void;
  setLocaleText(text: Partial<PickerLocaleText>): void;
}

const o = dateCalendarOptions.options;

/**
 * Date calendar — spec: specs/components/date-picker.md
 *
 * Markup:  <div id="c" data-ok-date-calendar data-ok-view="day" data-ok-views="year day" data-ok-month="2025-05"
 *               [data-ok-value="2025-05-25"] [data-ok-min-date] [data-ok-max-date] [data-ok-disable-past] …>
 *            <div data-ok-date-calendar-header><div data-ok-date-calendar-label id="c-label" aria-live="polite">May 2025</div>
 *              <button data-ok-icon-button data-ok-date-calendar-switch …></button>
 *              <div data-ok-date-calendar-nav><button data-ok-date-calendar-prev …></button><button data-ok-date-calendar-next …></button></div></div>
 *            <div role="grid" data-ok-day-calendar aria-labelledby="c-label">…weeks of button[data-ok-picker-day][data-ok-date]…</div>
 *          </div>
 * Behavior: core `createCalendarController` handles keys and presses; this runtime rebuilds the
 *          view (days, months or years) with DOM methods.
 * Events:  ok:date-calendar:change (cancelable, `{ value, selectionState }`), :viewchange `{ view }`,
 *          :monthchange `{ month }`, :yearchange `{ year }`.
 */
export const dateCalendar = defineComponent<DateCalendarInstance>({
  name: "date-calendar",
  selector: "[data-ok-date-calendar]",

  setup(element, { emit }) {
    const locale = readLocale(element);
    let overrides: Partial<PickerLocaleText> | undefined;
    let text = readLocaleText(element);
    const functions: RuleFunctions = {};
    let weekdayFormatter: ((date: Date) => string) | undefined;
    const has = (spec: { attr: string }) => element.hasAttribute(spec.attr);
    const views = normalizeDateViews(element.getAttribute("data-ok-views")?.split(/\s+/));
    const id = element.id;
    const labelId = id ? `${id}-label` : "";
    const header = element.querySelector<HTMLElement>(
      "[data-ok-date-calendar-header]",
    ) as HTMLElement;
    const label = header.querySelector<HTMLElement>("[data-ok-date-calendar-label]") as HTMLElement;
    const switcher = header.querySelector<HTMLElement>("[data-ok-date-calendar-switch]");
    let nav = header.querySelector<HTMLElement>("[data-ok-date-calendar-nav]");
    const isDisabled = () => element.hasAttribute("data-ok-disabled");
    const rules = (): DateRules => ({
      ...readRules(element, functions),
      today: startOfDay(new Date()),
    });

    let value: Date | null = parseIsoDate(element.getAttribute("data-ok-value"));
    const viewAttr = element.getAttribute("data-ok-view") as DateView | null;
    let view: DateView =
      viewAttr && views.includes(viewAttr)
        ? viewAttr
        : initialView(views, readStyle(element, o.openTo));
    const initialMonth = parseIsoDate(`${element.getAttribute("data-ok-month")}-01`);
    const clampToLimits = (date: Date) => {
      const [min, max] = dateBounds(rules());
      return date.getTime() < min.getTime() ? min : date.getTime() > max.getTime() ? max : date;
    };
    let month = startOfMonth(initialMonth ?? clampToLimits(value ?? startOfDay(new Date())));
    const focusInMonth = (target: Date, preferred: Date | null) => {
      if (preferred && isSameMonth(preferred, target) && !isDateDisabled(preferred, rules()))
        return preferred;
      const found = closestEnabledDate(startOfMonth(target), rules());
      return found && isSameMonth(found, target) ? found : startOfMonth(target);
    };
    let focused = focusInMonth(month, value ?? startOfDay(new Date()));
    let focusedYear = (value ?? month).getFullYear();
    let focusedMonth = (value ?? month).getMonth();

    const perRow = (spec: typeof o.monthsPerRow) => Number(readStyle(element, spec)) as 3 | 4;

    const buildNav = () =>
      h("div", { "data-ok-date-calendar-nav": true }, [
        navButton("prev", text.previousMonth, ARROW_LEFT),
        navButton("next", text.nextMonth, ARROW_RIGHT),
      ]);
    const navButton = (kind: "prev" | "next", name: string, d: string) =>
      h(
        "button",
        {
          type: "button",
          "data-ok-icon-button": true,
          "data-ok-color": "default",
          "data-ok-size": "md",
          [`data-ok-date-calendar-${kind}`]: true,
          "aria-label": name,
          title: name,
        },
        [strokeIcon(d)],
      );

    const dayGrid = () => {
      const r = rules();
      const weekStart = firstDayOfWeek(locale);
      const weeks = calendarWeeks(
        month,
        weekStart,
        readNumber(element, o.fixedWeekNumber) as number | undefined,
      );
      const today = startOfDay(new Date());
      const showOutside = has(o.showDaysOutsideCurrentMonth);
      const weekNumbers = has(o.displayWeekNumber);
      const focusDay = focusInMonth(month, focused);
      const long = new Intl.DateTimeFormat(locale, { weekday: "long" });
      const formatWeekday =
        weekdayFormatter ?? ((date: Date) => defaultDayOfWeekFormatter(date, locale));
      const head = h("div", { role: "row", "data-ok-day-calendar-header": true }, [
        ...(weekNumbers
          ? [
              h(
                "span",
                { role: "columnheader", "aria-label": text.calendarWeekNumberHeaderLabel },
                [text.calendarWeekNumberHeaderText],
              ),
            ]
          : []),
        ...(weeks[0] as CalendarDay[]).map(({ date }) =>
          h("span", { role: "columnheader", "aria-label": long.format(date) }, [
            formatWeekday(date),
          ]),
        ),
      ]);
      const body = has(o.loading)
        ? h("div", { "data-ok-date-calendar-loading": true }, [text.loadingText])
        : h(
            "div",
            { role: "rowgroup" },
            weeks.map((week, row) =>
              h("div", { role: "row", "aria-rowindex": row + 1 }, [
                ...(weekNumbers
                  ? [
                      h(
                        "span",
                        {
                          role: "rowheader",
                          "aria-label": text.calendarWeekNumberAriaLabelText(
                            weekNumber((week[0] as CalendarDay).date, weekStart),
                          ),
                        },
                        [
                          text.calendarWeekNumberText(
                            weekNumber((week[0] as CalendarDay).date, weekStart),
                          ),
                        ],
                      ),
                    ]
                  : []),
                ...week.map(({ date, outside }, col) =>
                  outside && !showOutside
                    ? h("span", { role: "gridcell", "data-ok-day-filler": true })
                    : h(
                        "button",
                        {
                          type: "button",
                          role: "gridcell",
                          "data-ok-picker-day": true,
                          "data-ok-date": formatIsoDate(date),
                          "aria-colindex": col + 1,
                          "aria-selected": String(
                            value !== null && isValidDate(value) && isSameDay(date, value),
                          ),
                          "aria-current": isSameDay(date, today) ? "date" : null,
                          "data-ok-today": isSameDay(date, today) && !has(o.disableHighlightToday),
                          "data-ok-outside": outside,
                          disabled: isDisabled() || isDateDisabled(date, r),
                          tabindex: !outside && isSameDay(date, focusDay) ? 0 : -1,
                        },
                        [String(date.getDate())],
                      ),
                ),
              ]),
            ),
          );
      return h(
        "div",
        { role: "grid", "data-ok-day-calendar": true, "aria-labelledby": labelId || null },
        [head, body],
      );
    };

    const monthGroup = () =>
      h(
        "div",
        {
          role: "radiogroup",
          "data-ok-month-calendar": true,
          "data-ok-months-per-row": String(perRow(o.monthsPerRow)),
          "data-ok-year": month.getFullYear(),
          "data-ok-value": value && isValidDate(value) ? formatIsoDate(value) : null,
          "aria-labelledby": labelId || null,
        },
        monthNames(locale, "short").map((name, m) =>
          h(
            "button",
            {
              type: "button",
              role: "radio",
              "data-ok-picker-month": true,
              "data-ok-value": m,
              "aria-checked": String(
                value !== null &&
                  isValidDate(value) &&
                  value.getFullYear() === month.getFullYear() &&
                  value.getMonth() === m,
              ),
              disabled:
                isDisabled() || isMonthDisabled(makeDate(month.getFullYear(), m, 1), rules()),
              tabindex: m === focusedMonth ? 0 : -1,
            },
            [name],
          ),
        ),
      );

    const yearGroup = () =>
      h(
        "div",
        {
          role: "radiogroup",
          "data-ok-year-calendar": true,
          "data-ok-years-per-row": String(perRow(o.yearsPerRow)),
          "data-ok-years-order": readStyle(element, o.yearsOrder),
          "data-ok-value": value && isValidDate(value) ? formatIsoDate(value) : null,
          "aria-labelledby": labelId || null,
        },
        yearRange(rules(), readStyle(element, o.yearsOrder)).map((year) =>
          h(
            "button",
            {
              type: "button",
              role: "radio",
              "data-ok-picker-year": true,
              "data-ok-value": year,
              "aria-checked": String(
                value !== null && isValidDate(value) && value.getFullYear() === year,
              ),
              disabled: isDisabled() || isYearDisabled(year, rules()),
              tabindex: year === focusedYear ? 0 : -1,
            },
            [String(year)],
          ),
        ),
      );

    let lastRendered = `${view}:${formatIsoDate(month)}:${has(o.loading)}`;
    const render = () => {
      element.setAttribute("data-ok-view", view);
      element.setAttribute("data-ok-month", formatIsoDate(month).slice(0, 7));
      if (value && isValidDate(value)) element.setAttribute("data-ok-value", formatIsoDate(value));
      else element.removeAttribute("data-ok-value");
      label.textContent = calendarHeaderText(month, locale);
      switcher?.setAttribute("aria-label", text.calendarViewSwitchingButtonAriaLabel(view));
      if (view === "day") {
        if (!nav) nav = buildNav();
        if (!nav.isConnected) header.append(nav);
        const [min, max] = dateBounds(rules());
        const prev = nav.querySelector<HTMLButtonElement>("[data-ok-date-calendar-prev]");
        const next = nav.querySelector<HTMLButtonElement>("[data-ok-date-calendar-next]");
        if (prev) prev.disabled = isDisabled() || month.getTime() <= startOfMonth(min).getTime();
        if (next) next.disabled = isDisabled() || month.getTime() >= startOfMonth(max).getTime();
      } else nav?.remove();
      const body = view === "day" ? dayGrid() : view === "month" ? monthGroup() : yearGroup();
      const old = element.querySelector(
        ":scope > [data-ok-day-calendar], :scope > [data-ok-month-calendar], :scope > [data-ok-year-calendar]",
      );
      // The same view and month: patch in place (focus stays, the fade-in doesn't replay).
      const key = `${view}:${formatIsoDate(month)}:${has(o.loading)}`;
      if (old && key === lastRendered) morph(old, body);
      else if (old) old.replaceWith(body);
      else element.append(body);
      lastRendered = key;
      controller.sync();
    };

    const showMonth = (next: Date) => {
      const first = startOfMonth(next);
      if (isSameMonth(first, month)) return;
      const yearChanged = first.getFullYear() !== month.getFullYear();
      month = first;
      if (yearChanged) emit("yearchange", { year: first.getFullYear() });
      emit("monthchange", { month: formatIsoDate(first).slice(0, 7) });
    };
    const setView = (next: DateView | null) => {
      if (!next || next === view || !views.includes(next)) return;
      view = next;
      emit("viewchange", { view });
    };
    const withTime = (date: Date) =>
      value && isValidDate(value)
        ? setDateParts(date, {
            hours: value.getHours(),
            minutes: value.getMinutes(),
            seconds: value.getSeconds(),
          })
        : date;
    const select = (date: Date, selectionState: "partial" | "finish") => {
      if (!emit("change", { value: formatIsoDate(date), selectionState }, { cancelable: true }))
        return false;
      value = date;
      return true;
    };

    const controller = createCalendarController(element, {
      read: () => ({
        focusedDate: focused,
        rules: rules(),
        weekStart: firstDayOfWeek(locale),
        monthsPerRow: perRow(o.monthsPerRow),
        yearsPerRow: perRow(o.yearsPerRow),
        disabled: isDisabled(),
        readOnly: has(o.readOnly),
      }),
      onFocusDate: (date) => {
        showMonth(date);
        focused = date;
        render();
      },
      onSelectDate: (date) => {
        focused = date;
        showMonth(date);
        select(withTime(date), "finish");
        render();
      },
      onSelectMonth: (m) => {
        const year = month.getFullYear();
        const day = value && isValidDate(value) ? value.getDate() : 1;
        let next = makeDate(year, m, day);
        if (next.getMonth() !== m) next = makeDate(year, m + 1, 0);
        next = withTime(next);
        if (isDateDisabled(next, rules())) next = withTime(focusInMonth(next, null));
        focusedMonth = m;
        showMonth(next);
        focused = next;
        const after = nextView(views, "month");
        if (select(next, after ? "partial" : "finish")) setView(after);
        render();
      },
      onSelectYear: (year) => {
        const base = value && isValidDate(value) ? value : clampToLimits(startOfDay(new Date()));
        let next = makeDate(year, base.getMonth(), base.getDate());
        if (next.getMonth() !== base.getMonth()) next = makeDate(year, base.getMonth() + 1, 0);
        next = withTime(next);
        if (isDateDisabled(next, rules())) {
          const found = closestEnabledDate(next, rules());
          if (found && found.getFullYear() === year) next = withTime(found);
        }
        focusedYear = year;
        focusedMonth = next.getMonth();
        showMonth(next);
        focused = next;
        const after = nextView(views, "year");
        if (select(next, after ? "partial" : "finish")) setView(after);
        render();
      },
      onMonthStep: (delta) => {
        const next = addMonths(month, delta);
        showMonth(next);
        focused = focusInMonth(next, addMonths(focused, delta));
        render();
      },
      onSwitchView: () => {
        if (view === "year")
          setView(views.includes("day") ? "day" : (views.find((v) => v !== "year") ?? null));
        else {
          focusedYear = month.getFullYear();
          setView("year");
        }
        render();
      },
      onFocusMonth: (m) => {
        focusedMonth = m;
        render();
      },
      onFocusYear: (y) => {
        focusedYear = y;
        render();
      },
    });

    render();
    return {
      get value() {
        return value && isValidDate(value) ? formatIsoDate(value) : null;
      },
      setValue(next) {
        const date = toDate(next);
        if (date === undefined) return;
        value = date;
        if (date) {
          showMonth(date);
          focused = date;
          focusedYear = date.getFullYear();
          focusedMonth = date.getMonth();
        }
        render();
      },
      get view() {
        return view;
      },
      setView(next) {
        setView(next);
        render();
      },
      get month() {
        return formatIsoDate(month).slice(0, 7);
      },
      focus() {
        controller.focus();
      },
      setShouldDisableDate(fn) {
        functions.shouldDisableDate = asFunction(fn);
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
      setDayOfWeekFormatter(fn) {
        weekdayFormatter = asFunction(fn);
        render();
      },
      setLocaleText(next) {
        overrides = { ...overrides, ...next };
        text = readLocaleText(element, overrides);
        nav
          ?.querySelector("[data-ok-date-calendar-prev]")
          ?.setAttribute("aria-label", text.previousMonth);
        nav
          ?.querySelector("[data-ok-date-calendar-next]")
          ?.setAttribute("aria-label", text.nextMonth);
        render();
      },
      destroy() {
        controller.destroy();
      },
    };
  },
});
