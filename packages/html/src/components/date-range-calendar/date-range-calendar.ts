import {
  addMonths,
  type CalendarDay,
  calendarHeaderText,
  calendarWeeks,
  closestEnabledDate,
  createCalendarController,
  createFocusedViewTracker,
  createRangeDragController,
  type DateRange,
  type DateRules,
  dateBounds,
  dateRangeCalendarOptions,
  defaultDayOfWeekFormatter,
  firstDayOfWeek,
  focusPickerViewPart,
  formatCalendarMonth,
  formatIsoDate,
  formatIsoRange,
  type IconData,
  initialRangeMonth,
  isDateDisabled,
  isSameDay,
  isSameMonth,
  isValidDate,
  monthsShowing,
  type PickerLocaleText,
  type PickerTimezone,
  parseCalendarCount,
  parseCalendarMonth,
  parseIsoRange,
  parseRangePosition,
  pickerCalendar,
  previewRange,
  type RangeCalendarCount,
  type RangePosition,
  rangeAfterPick,
  rangeDayAttributes,
  rangeDayState,
  readNumber,
  startOfMonth,
  visibleMonths,
  weekNumber,
} from "@owlky/core";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";
import type { PickerDayRenderer } from "../date-calendar/date-calendar.js";
import {
  ARROW_LEFT,
  ARROW_RIGHT,
  asFunction,
  h,
  morph,
  type PickerDateApi,
  pickerDateApi,
  pickerIcon,
  pickerToday,
  type RuleFunctions,
  readLocale,
  readLocaleText,
  readRules,
  readTimezone,
} from "../date-calendar/picker-dom.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface DateRangeCalendarEvents {
  /** After a view took the focus (`hasFocus` `true`) or lost it. */
  focusedviewchange: EventSpec<{ view: "day"; hasFocus: boolean }>;
  /** Before a day sets one end of the range (`start/end`). Call `preventDefault()` to refuse it. */
  change: EventSpec<{ value: string; selectionState: "partial" | "finish" }, true>;
  /** After the end being edited changed. */
  rangepositionchange: EventSpec<{ rangePosition: RangePosition }>;
  /** After another first month is shown (`YYYY-MM`). */
  monthchange: EventSpec<{ month: string }>;
}

export interface DateRangeCalendarInstance extends ComponentInstance, PickerDateApi {
  /** The view that holds the focus, or `null`. */
  readonly focusedView: "day" | null;
  /** Moves the focus into a view, when it is shown. */
  setFocusedView(view: "day"): void;
  /** The range as an ISO 8601 interval (`2025-05-20/2025-05-25`), or `null` when empty. */
  readonly value: string | null;
  /** Sets the range (ISO interval, `[start, end]` or `null`) and shows it, without events. */
  setValue(value: string | readonly (Date | string | null)[] | null): void;
  /** The end the next pick edits. */
  readonly rangePosition: RangePosition;
  /** Sets the end the next pick changes (`start` or `end`). */
  setRangePosition(position: RangePosition): void;
  /** The ends a pick may edit (`null`: both). */
  setAvailableRangePositions(positions: readonly RangePosition[] | null): void;
  /** Months side by side (1–3). */
  readonly calendars: RangeCalendarCount;
  /** Shows this many months side by side (1 to 3). */
  setCalendars(count: number): void;
  /** The first shown month (`YYYY-MM`). */
  readonly month: string;
  /** Focuses the current day. */
  focus(): void;
  /** Disables the days for which the function returns `true` (`null`: none). */
  setShouldDisableDate(fn: ((day: Date) => boolean) | null): void;
  /** Disables the months for which the function returns `true` (`null`: none). */
  setShouldDisableMonth(fn: ((month: Date) => boolean) | null): void;
  /** Disables the years for which the function returns `true` (`null`: none). */
  setShouldDisableYear(fn: ((year: Date) => boolean) | null): void;
  /** Formats the weekday headings (`null`: the default). */
  setDayOfWeekFormatter(fn: ((date: Date) => string) | null): void;
  /** Replaces the text of the labels and buttons, such as for another language. */
  setLocaleText(text: Partial<PickerLocaleText>): void;
  /** Decorates each day button (phase 4); `null` removes the renderer. */
  setDayRenderer(fn: PickerDayRenderer | null): void;
}

const o = dateRangeCalendarOptions.options;
const EMPTY: DateRange = [null, null];

/** A range from an ISO interval or a `[start, end]` pair (anything else: `undefined`). */
export function toRange(
  value: unknown,
  reference: Date,
  timezone: PickerTimezone = "system",
): DateRange | undefined {
  if (value === null || value === "") return EMPTY;
  if (typeof value === "string") return parseIsoRange(value, reference, timezone) ?? undefined;
  if (!Array.isArray(value) || value.length !== 2) return undefined;
  const side = (v: unknown) => {
    if (v === null || v === "") return null;
    if (v instanceof Date) return isValidDate(v) ? new Date(v.getTime()) : undefined;
    return parseIsoRange(`${String(v)}/`, reference, timezone)?.[0] ?? undefined;
  };
  const start = side(value[0]);
  const end = side(value[1]);
  return start === undefined || end === undefined ? undefined : [start, end];
}

/**
 * Date range calendar — spec: specs/components/date-picker.md (ADR-0028)
 *
 * Markup:  <div id="r" data-ok-date-range-calendar data-ok-calendars="2" data-ok-range-position="start"
 *               data-ok-month="2025-05" [data-ok-value="2025-05-20/2025-05-25"] [data-ok-min-date] …>
 *            <div data-ok-date-range-calendar-month>
 *              <div data-ok-date-range-calendar-header><button data-ok-date-calendar-prev …></button>
 *                <div data-ok-date-calendar-label id="r-label-0" aria-live="polite">May 2025</div></div>
 *              <div role="grid" data-ok-day-calendar aria-labelledby="r-label-0" aria-multiselectable="true">…</div>
 *            </div> …one per month (the last one holds button[data-ok-date-calendar-next])…
 *          </div>
 * Behavior: core `createCalendarController` handles keys and presses, `createRangeDragController`
 *          the hover preview and drags; this runtime rebuilds the months with DOM methods.
 * Events:  ok:date-range-calendar:change (cancelable, `{ value, selectionState }`),
 *          :rangepositionchange `{ rangePosition }`, :monthchange `{ month }`.
 */
export const dateRangeCalendar = defineComponent<
  DateRangeCalendarInstance,
  DateRangeCalendarEvents
>({
  name: "date-range-calendar",
  selector: "[data-ok-date-range-calendar]",

  setup(element, { emit }) {
    const focus = createFocusedViewTracker(element, (view, hasFocus) =>
      emit("focusedviewchange", { view: view as "day", hasFocus }),
    );
    const locale = readLocale(element);
    const cal = pickerCalendar(locale);
    let dayRenderer: PickerDayRenderer | undefined;
    let overrides: Partial<PickerLocaleText> | undefined;
    let text = readLocaleText(element);
    const functions: RuleFunctions = {};
    let weekdayFormatter: ((date: Date) => string) | undefined;
    let available: readonly RangePosition[] | null = null;
    const has = (spec: { attr: string }) => element.hasAttribute(spec.attr);
    const id = element.id;
    const isDisabled = () => element.hasAttribute("data-ok-disabled");
    const today = () => pickerToday(element);
    const rules = (): DateRules => ({ ...readRules(element, functions), today: today() });

    let calendars = parseCalendarCount(element.getAttribute(o.calendars.attr), 2);
    let value: DateRange =
      parseIsoRange(element.getAttribute("data-ok-value"), today(), readTimezone(element)) ?? EMPTY;
    let position = parseRangePosition(element.getAttribute(o.rangePosition.attr));
    const clamp = (date: Date) => {
      const [min, max] = dateBounds(rules());
      return date.getTime() < min.getTime() ? min : date.getTime() > max.getTime() ? max : date;
    };
    const shownMonth = parseCalendarMonth(element.getAttribute("data-ok-month"), cal);
    let first =
      shownMonth ??
      initialRangeMonth(
        value,
        clamp(today()),
        calendars,
        Number(element.getAttribute(o.currentMonthCalendarPosition.attr) ?? 1),
        cal,
      );
    const focusAmong = (months: Date[], preferred: Date) => {
      if (months.some((m) => isSameMonth(m, preferred, cal)) && !isDateDisabled(preferred, rules()))
        return preferred;
      for (const month of months) {
        const found = closestEnabledDate(startOfMonth(month, cal), rules());
        if (found && isSameMonth(found, month, cal)) return found;
      }
      return startOfMonth(months[0] as Date, cal);
    };
    let focused = focusAmong(
      visibleMonths(first, calendars, cal),
      value[position === "end" ? 1 : 0] ?? value[0] ?? today(),
    );
    let hovered: Date | null = null;
    let dragging: { date: Date; position: RangePosition } | null = null;

    const allowed = (next: RangePosition) =>
      !available || available.includes(next) ? next : (available[0] ?? next);

    const navButton = (kind: "prev" | "next", name: string, icon: IconData) =>
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
        [pickerIcon(icon)],
      );

    const monthBlock = (month: Date, index: number, months: Date[]) => {
      const r = rules();
      const [min, max] = dateBounds(r);
      const labelId = id ? `${id}-label-${index}` : null;
      const weekStart = firstDayOfWeek(locale);
      const weeks = calendarWeeks(
        month,
        weekStart,
        readNumber(element, o.fixedWeekNumber) as number | undefined,
        cal,
      );
      const now = today();
      const outsideShown = has(o.showDaysOutsideCurrentMonth) && calendars === 1;
      const weekNumbers = has(o.displayWeekNumber);
      const focusDay = focusAmong(months, focused);
      const long = new Intl.DateTimeFormat(locale, { weekday: "long" });
      const formatWeekday =
        weekdayFormatter ?? ((date: Date) => defaultDayOfWeekFormatter(date, locale));
      const preview = dragging
        ? rangeAfterPick(value, dragging.date, dragging.position, true).range
        : previewRange(value, hovered, allowed(position));
      const prev = navButton("prev", text.previousMonth, ARROW_LEFT);
      (prev as HTMLButtonElement).disabled =
        isDisabled() || month.getTime() <= startOfMonth(min, cal).getTime();
      const next = navButton("next", text.nextMonth, ARROW_RIGHT);
      (next as HTMLButtonElement).disabled =
        isDisabled() || month.getTime() >= startOfMonth(max, cal).getTime();
      const header = h("div", { "data-ok-date-range-calendar-header": true }, [
        ...(index === 0 ? [prev] : []),
        h("div", { "data-ok-date-calendar-label": true, id: labelId, "aria-live": "polite" }, [
          calendarHeaderText(month, locale),
        ]),
        ...(index === months.length - 1 ? [next] : []),
      ]);
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
                ...week.map(({ date, outside }, col) => {
                  if (outside && !outsideShown)
                    return h("span", { role: "gridcell", "data-ok-day-filler": true });
                  const state = rangeDayState(date, value, preview);
                  const button = h(
                    "button",
                    {
                      type: "button",
                      role: "gridcell",
                      "data-ok-picker-day": true,
                      "data-ok-date": formatIsoDate(date),
                      "aria-colindex": col + 1,
                      "aria-selected": String(state.start || state.end || state.within),
                      "aria-current": isSameDay(date, now) ? "date" : null,
                      "data-ok-today": isSameDay(date, now) && !has(o.disableHighlightToday),
                      "data-ok-outside": outside,
                      ...rangeDayAttributes(state),
                      disabled: isDisabled() || isDateDisabled(date, r),
                      tabindex: !outside && isSameDay(date, focusDay) ? 0 : -1,
                    },
                    [String(cal.day(date))],
                  );
                  try {
                    dayRenderer?.(button as HTMLButtonElement, new Date(date.getTime()));
                  } catch {
                    // A failing renderer leaves the plain day.
                  }
                  return button;
                }),
              ]),
            ),
          );
      const grid = h(
        "div",
        {
          role: "grid",
          "data-ok-day-calendar": true,
          "aria-labelledby": labelId,
          "aria-multiselectable": "true",
        },
        [head, body],
      );
      return h("div", { "data-ok-date-range-calendar-month": true }, [header, grid]);
    };

    // The snippet already shows the first months: the first render patches them in place.
    let lastRendered = `${formatIsoDate(first)}:${calendars}:${has(o.loading)}`;
    const render = () => {
      const months = visibleMonths(first, calendars, cal);
      element.setAttribute(o.calendars.attr, String(calendars));
      element.setAttribute(o.rangePosition.attr, position);
      element.setAttribute("data-ok-month", formatCalendarMonth(first, cal));
      const iso = formatIsoRange(value, "date");
      if (iso) element.setAttribute("data-ok-value", iso);
      else element.removeAttribute("data-ok-value");
      const blocks = months.map((month, i) => monthBlock(month, i, months));
      const old = [...element.querySelectorAll(":scope > [data-ok-date-range-calendar-month]")];
      // The same months: patch in place (focus stays, the fade-in doesn't replay).
      const key = `${formatIsoDate(first)}:${calendars}:${has(o.loading)}`;
      if (key === lastRendered && old.length === blocks.length)
        old.forEach((block, i) => {
          morph(block, blocks[i] as Element);
        });
      else element.replaceChildren(...blocks);
      lastRendered = key;
      controller.sync();
    };

    const showFirst = (next: Date) => {
      const month = startOfMonth(next, cal);
      if (isSameMonth(month, first, cal)) return;
      first = month;
      emit("monthchange", { month: formatCalendarMonth(month, cal) });
    };
    const show = (date: Date) => showFirst(monthsShowing(date, first, calendars, cal));
    const setPosition = (next: RangePosition) => {
      if (next === position) return;
      position = next;
      emit("rangepositionchange", { rangePosition: next });
    };
    const select = (next: DateRange, selectionState: "partial" | "finish") => {
      if (
        !emit(
          "change",
          { value: formatIsoRange(next, "date"), selectionState },
          { cancelable: true },
        )
      )
        return false;
      value = next;
      return true;
    };

    const controller = createCalendarController(element, {
      read: () => ({
        focusedDate: focused,
        rules: rules(),
        weekStart: firstDayOfWeek(locale),
        monthsPerRow: 3,
        yearsPerRow: 4,
        disabled: isDisabled(),
        readOnly: has(o.readOnly),
      }),
      onFocusDate: (date) => {
        show(date);
        focused = date;
        render();
      },
      onSelectDate: (date) => {
        if (drag.consumeClick()) return;
        const editing = allowed(position);
        const result = rangeAfterPick(value, date, editing);
        focused = date;
        hovered = null;
        const finish = editing === "end" && result.position === "start";
        if (select(result.range, finish ? "finish" : "partial")) {
          setPosition(allowed(result.position));
          const end = result.range[1];
          if (editing === "start" && end && !has(o.disableAutoMonthSwitching)) show(end);
        }
        render();
      },
      onMonthStep: (delta) => {
        const next = addMonths(first, delta, cal);
        showFirst(next);
        focused = focusAmong(visibleMonths(next, calendars, cal), addMonths(focused, delta, cal));
        render();
      },
    });
    const drag = createRangeDragController(element, {
      read: () => ({
        disabled: isDisabled(),
        readOnly: has(o.readOnly),
        disableDragEditing: has(o.disableDragEditing),
      }),
      onPreview: (date) => {
        hovered = date;
        render();
      },
      onDrag: (date, end) => {
        dragging = { date, position: end };
        render();
      },
      onDrop: (date, end) => {
        dragging = null;
        hovered = null;
        const result = rangeAfterPick(value, date, end, true);
        focused = date;
        if (select(result.range, "finish")) setPosition(allowed(result.position));
        render();
      },
      onDragEnd: () => {
        dragging = null;
        render();
      },
    });

    render();
    const dates = pickerDateApi(
      element,
      () => formatIsoRange(value, "date") || null,
      (next) => instance.setValue(next as DateRange),
      true,
    );
    const instance: DateRangeCalendarInstance = {
      get value() {
        return formatIsoRange(value, "date") || null;
      },
      get date() {
        return dates.get();
      },
      setDate: dates.set,
      setDateAdapter: dates.setAdapter,
      setDayRenderer(fn) {
        dayRenderer = asFunction(fn);
        lastRendered = "";
        render();
      },
      setValue(next) {
        const range = toRange(next, today(), readTimezone(element));
        if (range === undefined) return;
        value = range;
        // A hidden edited end comes into view: the start in the first calendar, the end in the last.
        const editsEnd = position === "end" && range[1] !== null;
        const target = editsEnd ? range[1] : (range[0] ?? range[1]);
        if (target && !isSameMonth(monthsShowing(target, first, calendars, cal), first, cal)) {
          showFirst(
            editsEnd
              ? addMonths(startOfMonth(target, cal), -(calendars - 1), cal)
              : startOfMonth(target, cal),
          );
          focused = target;
        }
        render();
      },
      get rangePosition() {
        return position;
      },
      setRangePosition(next) {
        position = parseRangePosition(next, position);
        render();
      },
      setAvailableRangePositions(list) {
        available = Array.isArray(list) ? list.filter((p) => p === "start" || p === "end") : null;
        render();
      },
      get calendars() {
        return calendars;
      },
      setCalendars(count) {
        const next = parseCalendarCount(count, calendars);
        if (next === calendars) return;
        calendars = next;
        const target = value[position === "end" ? 1 : 0] ?? value[0] ?? focused;
        first = monthsShowing(target, first, calendars, cal);
        render();
      },
      get month() {
        return formatCalendarMonth(first, cal);
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
        lastRendered = "";
        render();
      },
      get focusedView() {
        return focus.view as "day" | null;
      },
      setFocusedView(view) {
        focusPickerViewPart(element, view);
      },
      destroy() {
        controller.destroy();
        focus.destroy();
        drag.destroy();
      },
    };
    return instance;
  },
});
