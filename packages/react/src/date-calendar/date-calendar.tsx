"use client";

import {
  addMonths,
  type CalendarController,
  type CalendarDay,
  calendarHeaderText,
  calendarWeeks,
  closestEnabledDate,
  createCalendarController,
  type DateRules,
  type DateView,
  dateBounds,
  dateCalendarAttributes,
  defaultDayOfWeekFormatter,
  firstDayOfWeek,
  formatCalendarMonth,
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
  type PickerCalendarSystem,
  type PickerLocaleText,
  type PickerValidDate,
  pickerCalendar,
  setDateParts,
  startOfDay,
  startOfMonth,
  weekNumber,
  yearRange,
} from "@owlky/core";
import {
  type ButtonHTMLAttributes,
  type ComponentType,
  type ForwardedRef,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { type DateValidationProps, dateRules, ruleAttributes } from "../date-field/date-field.js";
import { IconButton } from "../icon-button/icon-button.js";
import { usePickerLocalization } from "../localization-provider/localization-provider.js";
import { usePickerDateConverter } from "../utils/picker-adapter.js";
import { useMergedRefs } from "../utils/refs.js";
import { useControllableState } from "../utils/use-controllable-state.js";

/**
 * `"partial"`: a year or month (or an hour) was picked and another view follows; `"finish"`: the
 * last view; `"shallow"`: a clock drag still in progress (time views, ADR-0026).
 */
export type PickerSelectionState = "shallow" | "partial" | "finish";

const ICON = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

/** Chevron icons (decorative). */
export function PickerArrowIcon({ direction }: { direction: "left" | "right" | "down" }) {
  const d =
    direction === "left"
      ? "m15 6-6 6 6 6"
      : direction === "right"
        ? "m9 6 6 6-6 6"
        : "m6 9 6 6 6-6";
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" {...ICON}>
      <path d={d} />
    </svg>
  );
}

/** What a day of the calendar shows (the default `PickerDay`, or `slots.day`). */
export interface PickerDayOwnerState {
  /** The day (the date adapter's type). */
  day: PickerValidDate;
  selected: boolean;
  /** Today (ringed unless `disableHighlightToday`). */
  today: boolean;
  /** A day of the previous or next month (`showDaysOutsideCurrentMonth`). */
  outsideCurrentMonth: boolean;
  disabled: boolean;
}

/**
 * Props of a calendar day: the owner state plus the button's attributes (`data-ok-*`, ARIA,
 * `tabIndex`), which a custom day passes on to `PickerDay`.
 */
export interface PickerDayProps
  extends PickerDayOwnerState,
    Omit<ButtonHTMLAttributes<HTMLButtonElement>, "disabled"> {
  /** Content: the day number by default. */
  children?: ReactNode;
}

/**
 * PickerDay — the calendar's day button (MUI's `PickersDay`). Custom days (`slots.day`) render it
 * with extra content or attributes, such as a badge.
 */
export function PickerDay({
  day: _day,
  selected: _selected,
  today: _today,
  outsideCurrentMonth: _outside,
  children,
  ...button
}: PickerDayProps) {
  return (
    <button type="button" {...button}>
      {children}
    </button>
  );
}

/** Calendar parts that can be replaced (MUI X `slots`, phase 4). */
export interface DateCalendarSlots {
  /** The day button: render `PickerDay` with extra content (badges, highlights). */
  day?: ComponentType<PickerDayProps> | undefined;
  /** Icons of the header (decorative). */
  leftArrowIcon?: ComponentType | undefined;
  rightArrowIcon?: ComponentType | undefined;
  switchViewIcon?: ComponentType | undefined;
}

/** Props for the calendar's slots: an object, or a function of each day's owner state. */
export interface DateCalendarSlotProps {
  day?:
    | Partial<PickerDayProps>
    | ((ownerState: PickerDayOwnerState) => Partial<PickerDayProps>)
    | undefined;
}

export interface DateCalendarProps
  extends DateValidationProps,
    Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Controlled value. */
  value?: Date | null | undefined;
  /** Uncontrolled initial value. */
  defaultValue?: Date | null | undefined;
  /** Called with the new value; `selectionState` tells whether the last view was used. */
  onChange?: ((value: Date | null, selectionState: PickerSelectionState) => void) | undefined;
  /** Available views. Default `["year", "day"]`. */
  views?: readonly DateView[] | undefined;
  /** The view shown first. Default `"day"` (or the last view). */
  openTo?: DateView | undefined;
  /** Controlled view. */
  view?: DateView | undefined;
  /** Called when the view changes. */
  onViewChange?: ((view: DateView) => void) | undefined;
  /** The month shown when there's no value. Default: today. */
  referenceDate?: Date | undefined;
  /** "Today" (for tests and fixed demos). Default: now. */
  today?: Date | undefined;
  /** A week number column. */
  displayWeekNumber?: boolean | undefined;
  /** Always show this many weeks. */
  fixedWeekNumber?: number | undefined;
  /** Days of other months fill the first and last weeks. */
  showDaysOutsideCurrentMonth?: boolean | undefined;
  /** No ring around today. */
  disableHighlightToday?: boolean | undefined;
  /** Weekday header text. Default: the first letter of the short name. */
  dayOfWeekFormatter?: ((date: Date) => string) | undefined;
  /** Months per row. Default 3. */
  monthsPerRow?: 3 | 4 | undefined;
  /** Years per row. Default 4. */
  yearsPerRow?: 3 | 4 | undefined;
  /** Order of the year view. Default `"asc"`. */
  yearsOrder?: "asc" | "desc" | undefined;
  /** Days can be browsed but not picked. */
  readOnly?: boolean | undefined;
  /** Nothing can be changed or browsed. */
  disabled?: boolean | undefined;
  /** Shows the loading content instead of the days. */
  loading?: boolean | undefined;
  /** Loading content. Default "…". */
  renderLoading?: (() => ReactNode) | undefined;
  /** No month or view transitions. */
  reduceAnimations?: boolean | undefined;
  /** Called when another month is shown. */
  onMonthChange?: ((month: Date) => void) | undefined;
  /** Called when another year is shown. */
  onYearChange?: ((year: Date) => void) | undefined;
  /** Focuses the current day on mount. */
  autoFocus?: boolean | undefined;
  /** Text overrides. */
  localeText?: Partial<PickerLocaleText> | undefined;
  /** Replaced parts: the day button and the header icons (phase 4). */
  slots?: DateCalendarSlots | undefined;
  /** Props of the slots. */
  slotProps?: DateCalendarSlotProps | undefined;
}

interface Shared {
  locale: string;
  localeText: PickerLocaleText;
  rules: DateRules;
  disabled: boolean;
  readOnly: boolean;
  cal: PickerCalendarSystem;
}

/** The month view's buttons (also MonthCalendar). */
function MonthButtons({
  shared,
  year,
  selected,
  focused,
  perRow,
  labelledBy,
  rootProps,
}: {
  shared: Shared;
  year: number;
  selected: Date | null;
  focused: number;
  perRow: 3 | 4;
  labelledBy?: string | undefined;
  rootProps?: (HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> }) | undefined;
}) {
  const names = monthNames(shared.locale, "short");
  return (
    <div
      role="radiogroup"
      data-ok-month-calendar=""
      data-ok-months-per-row={String(perRow)}
      data-ok-year={year}
      {...(selected ? { "data-ok-value": formatIsoDate(selected) } : {})}
      aria-labelledby={labelledBy}
      {...rootProps}
    >
      {names.map((name, month) => {
        const { cal } = shared;
        const checked =
          selected !== null && cal.year(selected) === year && cal.month(selected) === month;
        const disabled =
          shared.disabled || isMonthDisabled(makeDate(year, month, 1, cal), shared.rules);
        return (
          <button
            key={name}
            type="button"
            role="radio"
            data-ok-picker-month=""
            data-ok-value={month}
            aria-checked={checked}
            disabled={disabled}
            tabIndex={month === focused ? 0 : -1}
          >
            {name}
          </button>
        );
      })}
    </div>
  );
}

/** The year view's buttons (also YearCalendar). */
function YearButtons({
  shared,
  selected,
  focused,
  perRow,
  order,
  labelledBy,
  rootProps,
}: {
  shared: Shared;
  selected: Date | null;
  focused: number;
  perRow: 3 | 4;
  order: "asc" | "desc";
  labelledBy?: string | undefined;
  rootProps?: (HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> }) | undefined;
}) {
  return (
    <div
      role="radiogroup"
      data-ok-year-calendar=""
      data-ok-years-per-row={String(perRow)}
      data-ok-years-order={order}
      {...(selected ? { "data-ok-value": formatIsoDate(selected) } : {})}
      aria-labelledby={labelledBy}
      {...rootProps}
    >
      {yearRange(shared.rules, order).map((year) => (
        <button
          key={year}
          type="button"
          role="radio"
          data-ok-picker-year=""
          data-ok-value={year}
          aria-checked={selected !== null && shared.cal.year(selected) === year}
          disabled={shared.disabled || isYearDisabled(year, shared.rules)}
          tabIndex={year === focused ? 0 : -1}
        >
          {year}
        </button>
      ))}
    </div>
  );
}

/** What the calendar controller reads and calls, refreshed every render. */
interface CalendarHandlers {
  focused: Date;
  rules: DateRules;
  weekStart: number;
  monthsPerRow: 3 | 4;
  yearsPerRow: 3 | 4;
  disabled: boolean;
  readOnly: boolean;
  onFocusDate(date: Date): void;
  onSelectDate(date: Date): void;
  onSelectMonth(month: number): void;
  onSelectYear(year: number): void;
  onMonthStep(delta: -1 | 1): void;
  onSwitchView(): void;
  onFocusMonth(month: number): void;
  onFocusYear(year: number): void;
}

/**
 * `data-ok-month`: `YYYY-MM` (Gregorian), or the ISO date of the month's first day in other
 * calendar systems (their months don't start on the 1st).
 */
export const calendarMonthAttribute = (month: Date, cal: PickerCalendarSystem): string =>
  formatCalendarMonth(month, cal);

/** The first enabled day of a month (or the month's first day). */
const focusInMonth = (month: Date, preferred: Date | null, rules: DateRules) => {
  const cal = rules.calendar;
  if (preferred && isSameMonth(preferred, month, cal) && !isDateDisabled(preferred, rules))
    return preferred;
  const found = closestEnabledDate(startOfMonth(month, cal), rules);
  return found && isSameMonth(found, month, cal) ? found : startOfMonth(month, cal);
};

/**
 * DateCalendar — spec: specs/components/date-picker.md. A month grid with a header, plus month and
 * year views; core's `createCalendarController` handles keys and presses.
 */
export const DateCalendar = forwardRef<HTMLDivElement, DateCalendarProps>(function DateCalendar(
  {
    value,
    defaultValue = null,
    onChange,
    views: viewsProp,
    openTo,
    view: viewProp,
    onViewChange,
    referenceDate,
    today: todayProp,
    displayWeekNumber,
    fixedWeekNumber,
    showDaysOutsideCurrentMonth,
    disableHighlightToday,
    dayOfWeekFormatter,
    monthsPerRow = 3,
    yearsPerRow = 4,
    yearsOrder = "asc",
    readOnly = false,
    disabled = false,
    loading,
    renderLoading,
    reduceAnimations,
    onMonthChange,
    onYearChange,
    autoFocus,
    localeText: localeTextProp,
    minDate,
    maxDate,
    disablePast,
    disableFuture,
    shouldDisableDate,
    shouldDisableMonth,
    shouldDisableYear,
    slots,
    slotProps,
    id: idProp,
    ...props
  },
  ref,
) {
  const { locale, localeText, explicit } = usePickerLocalization(localeTextProp);
  const cal = pickerCalendar(locale);
  const converter = usePickerDateConverter();
  const generated = useId();
  const id = idProp ?? generated;
  const labelId = `${id}-label`;
  const views = normalizeDateViews(viewsProp);
  const today = startOfDay(todayProp ?? new Date());
  const rules: DateRules = {
    ...dateRules({
      minDate,
      maxDate,
      disablePast,
      disableFuture,
      shouldDisableDate,
      shouldDisableMonth,
      shouldDisableYear,
    }),
    today,
    calendar: cal,
  };
  const shared: Shared = { locale, localeText, rules, disabled, readOnly, cal };

  const [current, setCurrent] = useControllableState<Date | null>({
    value,
    defaultValue,
    onChange: undefined,
  });
  const selected = isValidDate(current) ? current : null;
  const [view, setView] = useControllableState<DateView>({
    value: viewProp,
    defaultValue: initialView(views, openTo),
    onChange: onViewChange,
  });
  const reference = () => {
    const [min, max] = dateBounds(rules);
    const base = selected ?? referenceDate ?? today;
    return base.getTime() < min.getTime() ? min : base.getTime() > max.getTime() ? max : base;
  };
  const [month, setMonthState] = useState(() => startOfMonth(reference(), cal));
  const [focused, setFocused] = useState(() => focusInMonth(month, selected ?? today, rules));
  const [focusedYear, setFocusedYear] = useState(() => cal.year(selected ?? reference()));
  const [focusedMonth, setFocusedMonth] = useState(() => cal.month(selected ?? reference()));

  const showMonth = (next: Date) => {
    const first = startOfMonth(next, cal);
    if (isSameMonth(first, month, cal)) return;
    if (cal.year(first) !== cal.year(month)) onYearChange?.(makeDate(cal.year(first), 0, 1, cal));
    setMonthState(first);
    onMonthChange?.(first);
  };

  // A new value in another month shows that month (MUI).
  const lastSelected = useRef(selected);
  if (lastSelected.current?.getTime() !== selected?.getTime()) {
    lastSelected.current = selected;
    if (selected && !isSameMonth(selected, month, cal)) {
      setMonthState(startOfMonth(selected, cal));
      setFocused(selected);
    }
  }

  // Always reported, even for the same day: a picker closes on a "finish" pick.
  const select = (date: Date, state: PickerSelectionState) => {
    setCurrent(date);
    onChange?.(date, state);
  };
  const withTime = (date: Date) => {
    const base = selected ?? referenceDate;
    return base
      ? setDateParts(date, {
          hours: base.getHours(),
          minutes: base.getMinutes(),
          seconds: base.getSeconds(),
        })
      : date;
  };

  const goTo = (target: DateView | null) => {
    if (target) setView(target);
  };

  const latest = useRef<CalendarHandlers>(null as unknown as CalendarHandlers);
  latest.current = {
    focused,
    rules,
    weekStart: firstDayOfWeek(locale),
    monthsPerRow,
    yearsPerRow,
    disabled,
    readOnly,
    onFocusDate: (date) => {
      showMonth(date);
      setFocused(date);
    },
    onSelectDate: (date) => {
      const next = withTime(date);
      setFocused(date);
      showMonth(date);
      select(next, "finish");
    },
    onSelectMonth: (m) => {
      const year = cal.year(month);
      const day = setDateParts(selected ?? reference(), { year, month: m, day: 1 }, cal);
      const keep = selected ? Math.min(cal.day(selected), 28) : 1;
      let next = withTime(setDateParts(day, { day: keep }, cal));
      if (selected) {
        // Keep the day when the month has it.
        const candidate = makeDate(year, m, cal.day(selected), cal);
        if (cal.month(candidate) === m) next = withTime(candidate);
      }
      if (isDateDisabled(next, rules)) next = withTime(focusInMonth(next, null, rules));
      setFocusedMonth(m);
      showMonth(next);
      setFocused(next);
      const after = nextView(views, "month");
      select(next, after ? "partial" : "finish");
      goTo(after);
    },
    onSelectYear: (year) => {
      const base = selected ?? reference();
      let next = withTime(setDateParts(base, { year, day: Math.min(cal.day(base), 28) }, cal));
      const sameDay = makeDate(year, cal.month(base), cal.day(base), cal);
      if (cal.month(sameDay) === cal.month(base)) next = withTime(sameDay);
      if (isDateDisabled(next, rules)) {
        const found = closestEnabledDate(next, rules);
        if (found && cal.year(found) === year) next = withTime(found);
      }
      setFocusedYear(year);
      setFocusedMonth(cal.month(next));
      showMonth(next);
      setFocused(next);
      const after = nextView(views, "year");
      select(next, after ? "partial" : "finish");
      goTo(after);
    },
    onMonthStep: (delta) => {
      const next = addMonths(month, delta, cal);
      showMonth(next);
      setFocused(focusInMonth(next, addMonths(focused, delta, cal), rules));
    },
    onSwitchView: () => {
      if (view === "year")
        goTo(views.includes("day") ? "day" : (views.find((v) => v !== "year") ?? null));
      else {
        setFocusedYear(cal.year(month));
        goTo("year");
      }
    },
    onFocusMonth: (m) => setFocusedMonth(m),
    onFocusYear: (y) => setFocusedYear(y),
  };

  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRefs(ref, rootRef);
  const controllerRef = useRef<CalendarController | null>(null);
  useLayoutEffect(() => {
    const controller = createCalendarController(rootRef.current as HTMLElement, {
      read: () => {
        const s = latest.current;
        return {
          focusedDate: s.focused,
          rules: s.rules,
          weekStart: s.weekStart,
          monthsPerRow: s.monthsPerRow,
          yearsPerRow: s.yearsPerRow,
          disabled: s.disabled,
          readOnly: s.readOnly,
        };
      },
      onFocusDate: (d) => latest.current.onFocusDate(d),
      onSelectDate: (d) => latest.current.onSelectDate(d),
      onSelectMonth: (m) => latest.current.onSelectMonth(m),
      onSelectYear: (y) => latest.current.onSelectYear(y),
      onMonthStep: (d) => latest.current.onMonthStep(d),
      onSwitchView: () => latest.current.onSwitchView(),
      onFocusMonth: (m) => latest.current.onFocusMonth(m),
      onFocusYear: (y) => latest.current.onFocusYear(y),
    });
    controllerRef.current = controller;
    return () => controller.destroy();
  }, []);
  useLayoutEffect(() => {
    controllerRef.current?.sync();
  });
  useEffect(() => {
    if (autoFocus) controllerRef.current?.focus();
  }, [autoFocus]);

  const weekStart = firstDayOfWeek(locale);
  const weeks = calendarWeeks(month, weekStart, fixedWeekNumber, cal);
  const focusDay = focusInMonth(month, focused, rules);
  const [min, max] = dateBounds(rules);
  const prevDisabled =
    disabled || startOfMonth(month, cal).getTime() <= startOfMonth(min, cal).getTime();
  const nextDisabled =
    disabled || startOfMonth(month, cal).getTime() >= startOfMonth(max, cal).getTime();
  const Day = slots?.day ?? PickerDay;
  const LeftIcon = slots?.leftArrowIcon;
  const RightIcon = slots?.rightArrowIcon;
  const SwitchIcon = slots?.switchViewIcon;
  const canSwitch = views.includes("year") && views.length > 1;
  const formatWeekday =
    dayOfWeekFormatter ?? ((date: Date) => defaultDayOfWeekFormatter(date, locale));
  const weekdayLong = new Intl.DateTimeFormat(locale, { weekday: "long" });

  return (
    <div
      ref={mergedRef}
      id={id}
      {...dateCalendarAttributes({
        openTo,
        disablePast,
        disableFuture,
        displayWeekNumber,
        fixedWeekNumber,
        showDaysOutsideCurrentMonth,
        disableHighlightToday,
        monthsPerRow,
        yearsPerRow,
        yearsOrder,
        readOnly,
        loading,
        reduceAnimations,
      })}
      data-ok-view={view}
      data-ok-views={views.join(" ")}
      data-ok-month={calendarMonthAttribute(month, cal)}
      {...(selected ? { "data-ok-value": formatIsoDate(selected) } : {})}
      {...ruleAttributes({ minDate, maxDate })}
      {...(explicit ? { "data-ok-locale": locale } : {})}
      {...(disabled ? { "data-ok-disabled": "" } : {})}
      data-ok-runtime="off"
      {...props}
    >
      <div data-ok-date-calendar-header="">
        <div data-ok-date-calendar-label="" id={labelId} aria-live="polite">
          {calendarHeaderText(month, locale)}
        </div>
        {canSwitch && (
          <IconButton
            size="sm"
            data-ok-date-calendar-switch=""
            aria-label={localeText.calendarViewSwitchingButtonAriaLabel(view)}
            disabled={disabled}
          >
            {SwitchIcon ? <SwitchIcon /> : <PickerArrowIcon direction="down" />}
          </IconButton>
        )}
        {view === "day" && (
          <div data-ok-date-calendar-nav="">
            <IconButton
              data-ok-date-calendar-prev=""
              aria-label={localeText.previousMonth}
              title={localeText.previousMonth}
              disabled={prevDisabled}
            >
              {LeftIcon ? <LeftIcon /> : <PickerArrowIcon direction="left" />}
            </IconButton>
            <IconButton
              data-ok-date-calendar-next=""
              aria-label={localeText.nextMonth}
              title={localeText.nextMonth}
              disabled={nextDisabled}
            >
              {RightIcon ? <RightIcon /> : <PickerArrowIcon direction="right" />}
            </IconButton>
          </div>
        )}
      </div>
      {view === "day" && (
        <div role="grid" data-ok-day-calendar="" aria-labelledby={labelId}>
          <div role="row" data-ok-day-calendar-header="">
            {displayWeekNumber && (
              <span role="columnheader" aria-label={localeText.calendarWeekNumberHeaderLabel}>
                {localeText.calendarWeekNumberHeaderText}
              </span>
            )}
            {(weeks[0] as CalendarDay[]).map(({ date }) => (
              <span key={date.getDay()} role="columnheader" aria-label={weekdayLong.format(date)}>
                {formatWeekday(date)}
              </span>
            ))}
          </div>
          {loading ? (
            <div data-ok-date-calendar-loading="">
              {renderLoading ? renderLoading() : localeText.loadingText}
            </div>
          ) : (
            <div role="rowgroup" key={formatIsoDate(month)}>
              {weeks.map((week, row) => (
                <div
                  role="row"
                  aria-rowindex={row + 1}
                  key={formatIsoDate((week[0] as CalendarDay).date)}
                >
                  {displayWeekNumber && (
                    <span
                      role="rowheader"
                      aria-label={localeText.calendarWeekNumberAriaLabelText(
                        weekNumber((week[0] as CalendarDay).date, weekStart),
                      )}
                    >
                      {localeText.calendarWeekNumberText(
                        weekNumber((week[0] as CalendarDay).date, weekStart),
                      )}
                    </span>
                  )}
                  {week.map(({ date, outside }, col) => {
                    if (outside && !showDaysOutsideCurrentMonth)
                      return (
                        <span key={formatIsoDate(date)} role="gridcell" data-ok-day-filler="" />
                      );
                    const isSelected = selected !== null && isSameDay(date, selected);
                    const isToday = isSameDay(date, today);
                    const owner: PickerDayOwnerState = {
                      day: converter.fromEngine(date),
                      selected: isSelected,
                      today: isToday,
                      outsideCurrentMonth: outside,
                      disabled: disabled || isDateDisabled(date, rules),
                    };
                    const extra =
                      typeof slotProps?.day === "function" ? slotProps.day(owner) : slotProps?.day;
                    return (
                      <Day
                        key={formatIsoDate(date)}
                        role="gridcell"
                        data-ok-picker-day=""
                        data-ok-date={formatIsoDate(date)}
                        aria-colindex={col + 1}
                        aria-selected={isSelected}
                        {...(isToday ? { "aria-current": "date" as const } : {})}
                        {...(isToday && !disableHighlightToday ? { "data-ok-today": "" } : {})}
                        {...(outside ? { "data-ok-outside": "" } : {})}
                        {...owner}
                        tabIndex={!outside && isSameDay(date, focusDay) ? 0 : -1}
                        {...extra}
                      >
                        {extra?.children ?? cal.day(date)}
                      </Day>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {view === "month" && (
        <MonthButtons
          shared={shared}
          year={cal.year(month)}
          selected={selected}
          focused={focusedMonth}
          perRow={monthsPerRow}
          labelledBy={labelId}
        />
      )}
      {view === "year" && (
        <YearButtons
          shared={shared}
          selected={selected}
          focused={focusedYear}
          perRow={yearsPerRow}
          order={yearsOrder}
          labelledBy={labelId}
        />
      )}
    </div>
  );
});

interface ListCalendarProps
  extends DateValidationProps,
    Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  value?: Date | null | undefined;
  defaultValue?: Date | null | undefined;
  onChange?: ((value: Date) => void) | undefined;
  /** The year whose months are shown (MonthCalendar) or the focused year. Default: the value's, else today's. */
  referenceDate?: Date | undefined;
  today?: Date | undefined;
  disabled?: boolean | undefined;
  readOnly?: boolean | undefined;
  autoFocus?: boolean | undefined;
}

export interface MonthCalendarProps extends ListCalendarProps {
  /** Months per row. Default 3. */
  monthsPerRow?: 3 | 4 | undefined;
}

export interface YearCalendarProps extends ListCalendarProps {
  /** Years per row. Default 4. */
  yearsPerRow?: 3 | 4 | undefined;
  /** Order. Default `"asc"`. */
  yearsOrder?: "asc" | "desc" | undefined;
}

/** Shared state and controller of MonthCalendar / YearCalendar. */
function useListCalendar(
  kind: "month" | "year",
  props: ListCalendarProps & { perRow: 3 | 4 },
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { locale, localeText } = usePickerLocalization();
  const cal = pickerCalendar(locale);
  const today = startOfDay(props.today ?? new Date());
  const rules: DateRules = { ...dateRules(props), today, calendar: cal };
  const [current, setCurrent] = useControllableState<Date | null>({
    value: props.value,
    defaultValue: props.defaultValue ?? null,
    onChange: undefined,
  });
  const selected = isValidDate(current) ? current : null;
  const base = selected ?? props.referenceDate ?? today;
  const [focusedValue, setFocusedValue] = useState(
    kind === "month" ? cal.month(base) : cal.year(base),
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRefs(ref, rootRef);
  const latest = useRef<{
    base: Date;
    perRow: 3 | 4;
    disabled: boolean;
    readOnly: boolean;
    rules: DateRules;
    pick: (value: number) => void;
  }>(null as never);
  latest.current = {
    base,
    perRow: props.perRow,
    disabled: props.disabled === true,
    readOnly: props.readOnly === true,
    rules,
    pick: (v) => {
      const next =
        kind === "month"
          ? setDateParts(base, { month: v, day: Math.min(cal.day(base), 28) }, cal)
          : setDateParts(base, { year: v, day: Math.min(cal.day(base), 28) }, cal);
      setFocusedValue(v);
      setCurrent(next);
      props.onChange?.(next);
    },
  };
  const controllerRef = useRef<CalendarController | null>(null);
  useLayoutEffect(() => {
    const controller = createCalendarController(rootRef.current as HTMLElement, {
      read: () => ({
        focusedDate: latest.current.base,
        rules: latest.current.rules,
        weekStart: 0,
        monthsPerRow: latest.current.perRow,
        yearsPerRow: latest.current.perRow,
        disabled: latest.current.disabled,
        readOnly: latest.current.readOnly,
      }),
      onSelectMonth: (m) => latest.current.pick(m),
      onSelectYear: (y) => latest.current.pick(y),
      onFocusMonth: (m) => setFocusedValue(m),
      onFocusYear: (y) => setFocusedValue(y),
    });
    controllerRef.current = controller;
    return () => controller.destroy();
  }, []);
  useLayoutEffect(() => {
    controllerRef.current?.sync();
  });
  useEffect(() => {
    if (props.autoFocus) controllerRef.current?.focus();
  }, [props.autoFocus]);
  const shared: Shared = {
    locale,
    localeText,
    rules,
    disabled: props.disabled === true,
    readOnly: props.readOnly === true,
    cal,
  };
  return { shared, selected, base, focusedValue, mergedRef };
}

/** MonthCalendar — spec: specs/components/date-picker.md. The months of a year as radio buttons. */
export const MonthCalendar = forwardRef<HTMLDivElement, MonthCalendarProps>(function MonthCalendar(
  { monthsPerRow = 3, ...props },
  ref,
) {
  const { shared, selected, base, focusedValue, mergedRef } = useListCalendar(
    "month",
    { ...props, perRow: monthsPerRow },
    ref,
  );
  const {
    value,
    defaultValue,
    onChange,
    referenceDate,
    today,
    disabled,
    readOnly,
    autoFocus,
    minDate,
    maxDate,
    disablePast,
    disableFuture,
    shouldDisableDate,
    shouldDisableMonth,
    shouldDisableYear,
    ...rest
  } = props;
  return (
    <MonthButtons
      shared={shared}
      year={shared.cal.year(base)}
      selected={selected}
      focused={focusedValue}
      perRow={monthsPerRow}
      rootProps={{ ...rest, ref: mergedRef, ...{ "data-ok-runtime": "off" } }}
    />
  );
});

/** YearCalendar — spec: specs/components/date-picker.md. Years as radio buttons. */
export const YearCalendar = forwardRef<HTMLDivElement, YearCalendarProps>(function YearCalendar(
  { yearsPerRow = 4, yearsOrder = "asc", ...props },
  ref,
) {
  const { shared, selected, focusedValue, mergedRef } = useListCalendar(
    "year",
    { ...props, perRow: yearsPerRow },
    ref,
  );
  const {
    value,
    defaultValue,
    onChange,
    referenceDate,
    today,
    disabled,
    readOnly,
    autoFocus,
    minDate,
    maxDate,
    disablePast,
    disableFuture,
    shouldDisableDate,
    shouldDisableMonth,
    shouldDisableYear,
    ...rest
  } = props;
  return (
    <YearButtons
      shared={shared}
      selected={selected}
      focused={focusedValue}
      perRow={yearsPerRow}
      order={yearsOrder}
      rootProps={{ ...rest, ref: mergedRef, ...{ "data-ok-runtime": "off" } }}
    />
  );
});
