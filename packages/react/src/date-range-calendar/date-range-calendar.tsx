"use client";

import {
  addMonths,
  type CalendarController,
  type CalendarDay,
  calendarHeaderText,
  calendarWeeks,
  closestEnabledDate,
  createCalendarController,
  createRangeDragController,
  type DateRange,
  type DateRules,
  dateBounds,
  dateRangeCalendarAttributes,
  defaultDayOfWeekFormatter,
  firstDayOfWeek,
  formatIsoDate,
  formatIsoRange,
  initialRangeMonth,
  isDateDisabled,
  isSameDay,
  isSameMonth,
  isSameRange,
  isValidDate,
  monthsShowing,
  type PickerLocaleText,
  parseCalendarCount,
  previewRange,
  type RangeCalendarCount,
  type RangeDragController,
  type RangePosition,
  rangeAfterPick,
  rangeDayAttributes,
  rangeDayState,
  startOfDay,
  startOfMonth,
  visibleMonths,
  weekNumber,
  withDay,
} from "@owlky/core";
import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { PickerArrowIcon, type PickerSelectionState } from "../date-calendar/date-calendar.js";
import { type DateValidationProps, dateRules, ruleAttributes } from "../date-field/date-field.js";
import { IconButton } from "../icon-button/icon-button.js";
import { usePickerLocalization } from "../localization-provider/localization-provider.js";
import { useMergedRefs } from "../utils/refs.js";
import { useControllableState } from "../utils/use-controllable-state.js";

export type { DateRange, RangePosition };

export interface DateRangeCalendarProps
  extends DateValidationProps,
    Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Controlled range. */
  value?: DateRange | undefined;
  /** Uncontrolled initial range. */
  defaultValue?: DateRange | undefined;
  /** Called with the new range; `"finish"` once the end is picked (or a drag drops). */
  onChange?: ((value: DateRange, selectionState: PickerSelectionState) => void) | undefined;
  /** Controlled end the next pick edits. */
  rangePosition?: RangePosition | undefined;
  /** Uncontrolled initial position. Default `"start"`. */
  defaultRangePosition?: RangePosition | undefined;
  onRangePositionChange?: ((position: RangePosition) => void) | undefined;
  /** The ends a pick may edit. Default both. */
  availableRangePositions?: readonly RangePosition[] | undefined;
  /** Months side by side. Default 2. */
  calendars?: RangeCalendarCount | undefined;
  /** The calendar that shows the value's month (or this month). Default 1. */
  currentMonthCalendarPosition?: RangeCalendarCount | undefined;
  /** The ends can't be dragged to other days. */
  disableDragEditing?: boolean | undefined;
  /** Picking the start doesn't show the end's month. */
  disableAutoMonthSwitching?: boolean | undefined;
  /** The month shown when there's no value. Default: today. */
  referenceDate?: Date | undefined;
  /** "Today" (for tests and fixed demos). Default: now. */
  today?: Date | undefined;
  displayWeekNumber?: boolean | undefined;
  fixedWeekNumber?: number | undefined;
  /** Days of other months fill the first and last weeks (one calendar only, MUI). */
  showDaysOutsideCurrentMonth?: boolean | undefined;
  disableHighlightToday?: boolean | undefined;
  dayOfWeekFormatter?: ((date: Date) => string) | undefined;
  readOnly?: boolean | undefined;
  disabled?: boolean | undefined;
  loading?: boolean | undefined;
  renderLoading?: (() => ReactNode) | undefined;
  reduceAnimations?: boolean | undefined;
  /** Called when the first shown month changes. */
  onMonthChange?: ((month: Date) => void) | undefined;
  /** Focuses the current day on mount. */
  autoFocus?: boolean | undefined;
  localeText?: Partial<PickerLocaleText> | undefined;
}

/** What the controllers read and call, refreshed every render. */
interface Handlers {
  focused: Date;
  rules: DateRules;
  weekStart: number;
  disabled: boolean;
  readOnly: boolean;
  disableDragEditing: boolean;
  onFocusDate(date: Date): void;
  onSelectDate(date: Date): void;
  onMonthStep(delta: -1 | 1): void;
  onPreview(date: Date | null): void;
  onDrag(date: Date, position: RangePosition): void;
  onDrop(date: Date, position: RangePosition): void;
  onDragEnd(): void;
}

const EMPTY: DateRange = [null, null];
const validOf = (range: DateRange): DateRange => [
  isValidDate(range[0]) ? range[0] : null,
  isValidDate(range[1]) ? range[1] : null,
];

/** The day that gets `tabindex="0"`: `preferred` when shown and enabled, else the first enabled one. */
function focusAmong(months: Date[], preferred: Date, rules: DateRules): Date {
  if (months.some((m) => isSameMonth(m, preferred)) && !isDateDisabled(preferred, rules))
    return preferred;
  for (const month of months) {
    const found = closestEnabledDate(startOfMonth(month), rules);
    if (found && isSameMonth(found, month)) return found;
  }
  return startOfMonth(months[0] as Date);
}

/**
 * DateRangeCalendar — spec: specs/components/date-picker.md (ADR-0028). One to three month grids
 * side by side; a pick sets the start, then the end; the ends can be dragged. Core's
 * `createCalendarController` handles keys and presses, `createRangeDragController` the hover
 * preview and drags.
 */
export const DateRangeCalendar = forwardRef<HTMLDivElement, DateRangeCalendarProps>(
  function DateRangeCalendar(
    {
      value,
      defaultValue = EMPTY,
      onChange,
      rangePosition: positionProp,
      defaultRangePosition = "start",
      onRangePositionChange,
      availableRangePositions,
      calendars: calendarsProp,
      currentMonthCalendarPosition,
      disableDragEditing = false,
      disableAutoMonthSwitching,
      referenceDate,
      today: todayProp,
      displayWeekNumber,
      fixedWeekNumber,
      showDaysOutsideCurrentMonth,
      disableHighlightToday,
      dayOfWeekFormatter,
      readOnly = false,
      disabled = false,
      loading,
      renderLoading,
      reduceAnimations,
      onMonthChange,
      autoFocus,
      localeText: localeTextProp,
      minDate,
      maxDate,
      disablePast,
      disableFuture,
      shouldDisableDate,
      shouldDisableMonth,
      shouldDisableYear,
      id: idProp,
      ...props
    },
    ref,
  ) {
    const { locale, localeText, explicit } = usePickerLocalization(localeTextProp);
    const generated = useId();
    const id = idProp ?? generated;
    const calendars = parseCalendarCount(calendarsProp, 2);
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
    };

    const [current, setCurrent] = useControllableState<DateRange>({
      value,
      defaultValue,
      onChange: undefined,
    });
    const range = validOf(current);
    const [position, setPosition] = useControllableState<RangePosition>({
      value: positionProp,
      defaultValue: defaultRangePosition,
      onChange: onRangePositionChange,
    });
    const reference = () => {
      const [min, max] = dateBounds(rules);
      const base = referenceDate ?? today;
      return base.getTime() < min.getTime() ? min : base.getTime() > max.getTime() ? max : base;
    };
    const [first, setFirst] = useState(() =>
      initialRangeMonth(range, reference(), calendars, currentMonthCalendarPosition),
    );
    const months = visibleMonths(first, calendars);
    const [focused, setFocused] = useState(() =>
      focusAmong(months, range[position === "end" ? 1 : 0] ?? range[0] ?? today, rules),
    );
    const [hovered, setHovered] = useState<Date | null>(null);
    const [dragging, setDragging] = useState<{ date: Date; position: RangePosition } | null>(null);

    const showFirst = (next: Date) => {
      const month = startOfMonth(next);
      if (isSameMonth(month, first)) return;
      setFirst(month);
      onMonthChange?.(month);
    };
    const show = (date: Date) => showFirst(monthsShowing(date, first, calendars));

    // A new outside value whose edited end isn't shown moves the months to it: the start in the
    // first calendar, the end in the last one.
    const lastValue = useRef(range);
    if (!isSameRange(lastValue.current, range)) {
      lastValue.current = range;
      const editsEnd = position === "end" && range[1] !== null;
      const target = editsEnd ? range[1] : (range[0] ?? range[1]);
      if (target && !isSameMonth(monthsShowing(target, first, calendars), first)) {
        setFirst(
          editsEnd ? addMonths(startOfMonth(target), -(calendars - 1)) : startOfMonth(target),
        );
        setFocused(target);
      }
    }
    // Fewer calendars (a responsive picker moving into a dialog) keep the edited end in view.
    const lastCount = useRef(calendars);
    if (lastCount.current !== calendars) {
      lastCount.current = calendars;
      const target = range[position === "end" ? 1 : 0] ?? range[0] ?? focused;
      const next = monthsShowing(target, first, calendars);
      if (!isSameMonth(next, first)) setFirst(next);
    }

    const allowed = (next: RangePosition) =>
      !availableRangePositions || availableRangePositions.includes(next)
        ? next
        : (availableRangePositions[0] ?? next);

    const commit = (next: DateRange, state: PickerSelectionState) => {
      // Own picks move the months themselves (auto month switching).
      lastValue.current = validOf(next);
      setCurrent(next);
      onChange?.(next, state);
    };

    const latest = useRef<Handlers>(null as never);
    latest.current = {
      focused,
      rules,
      weekStart: firstDayOfWeek(locale),
      disabled,
      readOnly,
      disableDragEditing,
      onFocusDate: (date) => {
        show(date);
        setFocused(date);
      },
      onSelectDate: (date) => {
        if (drag.current?.consumeClick()) return;
        const editing = allowed(position);
        const side = range[editing === "start" ? 0 : 1];
        const day = withDay(
          date,
          side ?? range[0] ?? range[1],
          referenceDate ?? today,
          "date-time",
        );
        const result = rangeAfterPick(range, day, editing);
        setFocused(date);
        setHovered(null);
        const nextPosition = allowed(result.position);
        setPosition(nextPosition);
        // After the start, show the end's month (unless it's turned off).
        const end = result.range[1];
        if (editing === "start" && end && !disableAutoMonthSwitching) show(end);
        commit(
          result.range,
          editing === "end" && result.position === "start" ? "finish" : "partial",
        );
      },
      onMonthStep: (delta) => {
        const next = addMonths(first, delta);
        showFirst(next);
        setFocused(focusAmong(visibleMonths(next, calendars), addMonths(focused, delta), rules));
      },
      onPreview: (date) => setHovered(date),
      onDrag: (date, end) => setDragging({ date, position: end }),
      onDrop: (date, end) => {
        setDragging(null);
        setHovered(null);
        const side = range[end === "start" ? 0 : 1];
        const day = withDay(date, side, referenceDate ?? today, "date-time");
        const result = rangeAfterPick(range, day, end, true);
        setFocused(date);
        setPosition(allowed(result.position));
        commit(result.range, "finish");
      },
      onDragEnd: () => setDragging(null),
    };

    const rootRef = useRef<HTMLDivElement>(null);
    const mergedRef = useMergedRefs(ref, rootRef);
    const controllerRef = useRef<CalendarController | null>(null);
    const drag = useRef<RangeDragController | null>(null);
    useLayoutEffect(() => {
      const root = rootRef.current as HTMLElement;
      const controller = createCalendarController(root, {
        read: () => {
          const s = latest.current;
          return {
            focusedDate: s.focused,
            rules: s.rules,
            weekStart: s.weekStart,
            monthsPerRow: 3,
            yearsPerRow: 4,
            disabled: s.disabled,
            readOnly: s.readOnly,
          };
        },
        onFocusDate: (d) => latest.current.onFocusDate(d),
        onSelectDate: (d) => latest.current.onSelectDate(d),
        onMonthStep: (d) => latest.current.onMonthStep(d),
      });
      const dragController = createRangeDragController(root, {
        read: () => ({
          disabled: latest.current.disabled,
          readOnly: latest.current.readOnly,
          disableDragEditing: latest.current.disableDragEditing,
        }),
        onPreview: (d) => latest.current.onPreview(d),
        onDrag: (d, p) => latest.current.onDrag(d, p),
        onDrop: (d, p) => latest.current.onDrop(d, p),
        onDragEnd: () => latest.current.onDragEnd(),
      });
      controllerRef.current = controller;
      drag.current = dragController;
      return () => {
        controller.destroy();
        dragController.destroy();
      };
    }, []);
    useLayoutEffect(() => {
      controllerRef.current?.sync();
    });
    useEffect(() => {
      if (autoFocus) controllerRef.current?.focus();
    }, [autoFocus]);

    const weekStart = firstDayOfWeek(locale);
    const focusDay = focusAmong(months, focused, rules);
    const [min, max] = dateBounds(rules);
    const formatWeekday =
      dayOfWeekFormatter ?? ((date: Date) => defaultDayOfWeekFormatter(date, locale));
    const weekdayLong = new Intl.DateTimeFormat(locale, { weekday: "long" });
    const preview = dragging
      ? rangeAfterPick(range, dragging.date, dragging.position, true).range
      : previewRange(range, hovered, allowed(position));
    const outsideShown = showDaysOutsideCurrentMonth === true && calendars === 1;

    return (
      <div
        ref={mergedRef}
        id={id}
        {...dateRangeCalendarAttributes({
          calendars: calendarsProp === undefined ? undefined : calendars,
          currentMonthCalendarPosition,
          disableDragEditing,
          disableAutoMonthSwitching,
          disablePast,
          disableFuture,
          displayWeekNumber,
          fixedWeekNumber,
          showDaysOutsideCurrentMonth,
          disableHighlightToday,
          readOnly,
          loading,
          reduceAnimations,
        })}
        data-ok-range-position={position}
        data-ok-month={formatIsoDate(first).slice(0, 7)}
        {...(formatIsoRange(range, "date")
          ? { "data-ok-value": formatIsoRange(range, "date") }
          : {})}
        {...ruleAttributes({ minDate, maxDate })}
        {...(explicit ? { "data-ok-locale": locale } : {})}
        {...(disabled ? { "data-ok-disabled": "" } : {})}
        data-ok-runtime="off"
        {...props}
      >
        {months.map((month, index) => {
          const labelId = `${id}-label-${index}`;
          const weeks = calendarWeeks(month, weekStart, fixedWeekNumber);
          return (
            <div key={formatIsoDate(month)} data-ok-date-range-calendar-month="">
              <div data-ok-date-range-calendar-header="">
                {index === 0 && (
                  <IconButton
                    data-ok-date-calendar-prev=""
                    aria-label={localeText.previousMonth}
                    title={localeText.previousMonth}
                    disabled={disabled || month.getTime() <= startOfMonth(min).getTime()}
                  >
                    <PickerArrowIcon direction="left" />
                  </IconButton>
                )}
                <div data-ok-date-calendar-label="" id={labelId} aria-live="polite">
                  {calendarHeaderText(month, locale)}
                </div>
                {index === months.length - 1 && (
                  <IconButton
                    data-ok-date-calendar-next=""
                    aria-label={localeText.nextMonth}
                    title={localeText.nextMonth}
                    disabled={disabled || month.getTime() >= startOfMonth(max).getTime()}
                  >
                    <PickerArrowIcon direction="right" />
                  </IconButton>
                )}
              </div>
              <div
                role="grid"
                data-ok-day-calendar=""
                aria-labelledby={labelId}
                aria-multiselectable="true"
              >
                <div role="row" data-ok-day-calendar-header="">
                  {displayWeekNumber && (
                    <span role="columnheader" aria-label={localeText.calendarWeekNumberHeaderLabel}>
                      {localeText.calendarWeekNumberHeaderText}
                    </span>
                  )}
                  {(weeks[0] as CalendarDay[]).map(({ date }) => (
                    <span
                      key={date.getDay()}
                      role="columnheader"
                      aria-label={weekdayLong.format(date)}
                    >
                      {formatWeekday(date)}
                    </span>
                  ))}
                </div>
                {loading ? (
                  <div data-ok-date-calendar-loading="">
                    {renderLoading ? renderLoading() : localeText.loadingText}
                  </div>
                ) : (
                  <div role="rowgroup">
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
                          if (outside && !outsideShown)
                            return (
                              <span
                                key={formatIsoDate(date)}
                                role="gridcell"
                                data-ok-day-filler=""
                              />
                            );
                          const state = rangeDayState(date, range, preview);
                          return (
                            <button
                              key={formatIsoDate(date)}
                              type="button"
                              role="gridcell"
                              data-ok-picker-day=""
                              data-ok-date={formatIsoDate(date)}
                              aria-colindex={col + 1}
                              aria-selected={state.start || state.end || state.within}
                              {...(isSameDay(date, today)
                                ? { "aria-current": "date" as const }
                                : {})}
                              {...(isSameDay(date, today) && !disableHighlightToday
                                ? { "data-ok-today": "" }
                                : {})}
                              {...(outside ? { "data-ok-outside": "" } : {})}
                              {...rangeDayAttributes(state)}
                              disabled={disabled || isDateDisabled(date, rules)}
                              tabIndex={!outside && isSameDay(date, focusDay) ? 0 : -1}
                            >
                              {date.getDate()}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  },
);
