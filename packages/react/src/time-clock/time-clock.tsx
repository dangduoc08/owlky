"use client";

import {
  clockAngle,
  clockNumbers,
  createTimeClockController,
  formatIsoTime,
  formatTimeText,
  isInnerHour,
  isTimeUnitDisabled,
  isValidDate,
  meridiemNames,
  normalizeTimeViews,
  type PickerLocaleText,
  resolveAmpm,
  setTimeUnit,
  startOfDay,
  type TimeClockController,
  type TimeRules,
  type TimeView,
  timeClockAttributes,
  timeUnit,
} from "@owlky/core";
import {
  type CSSProperties,
  forwardRef,
  type HTMLAttributes,
  useId,
  useLayoutEffect,
  useRef,
} from "react";
import { PickerArrowIcon, type PickerSelectionState } from "../date-calendar/date-calendar.js";
import {
  type TimeValidationProps,
  timeRuleAttributes,
  timeRules,
} from "../date-field/date-field.js";
import { IconButton } from "../icon-button/icon-button.js";
import { usePickerLocalization } from "../localization-provider/localization-provider.js";
import { useControllableState } from "../utils/use-controllable-state.js";

/** Props shared by the clock views (TimeClock, DigitalClock, MultiSectionDigitalClock). */
export interface ClockBaseProps extends TimeValidationProps {
  /** Controlled value. */
  value?: Date | null | undefined;
  /** Uncontrolled initial value. */
  defaultValue?: Date | null | undefined;
  /** 12-hour clock with AM / PM. Default: from the locale. */
  ampm?: boolean | undefined;
  /** The date new times start from when there's no value. Default: today at midnight. */
  referenceDate?: Date | undefined;
  /** "Now" for `disablePast` / `disableFuture` (tests and demos). Default: now. */
  today?: Date | undefined;
  /** Earliest / latest date and time (date time pickers). */
  minDateTime?: Date | undefined;
  maxDateTime?: Date | undefined;
  readOnly?: boolean | undefined;
  disabled?: boolean | undefined;
  /** Text overrides. */
  localeText?: Partial<PickerLocaleText> | undefined;
}

/** Shared state of the clock views: value, locale, rules, the base date of new times. */
export function useClockState(props: ClockBaseProps) {
  const { locale, localeText, explicit } = usePickerLocalization(props.localeText);
  const ampm = resolveAmpm(props.ampm, locale);
  const [current, setCurrent] = useControllableState<Date | null>({
    value: props.value,
    defaultValue: props.defaultValue ?? null,
    onChange: undefined,
  });
  const valid = isValidDate(current) ? current : null;
  const base = valid ?? props.referenceDate ?? startOfDay(props.today ?? new Date());
  const rules: TimeRules = timeRules(props, props.today);
  return { locale, localeText, explicit, ampm, current, setCurrent, valid, base, rules };
}

/** Root attributes shared by the clock views: hour cycle, value, rules, locale. */
export const clockRootAttributes = (
  props: ClockBaseProps,
  state: { ampm: boolean; valid: Date | null; explicit: boolean; locale: string },
): Record<string, string> => ({
  "data-ok-ampm": String(state.ampm),
  ...(state.valid ? { "data-ok-value": formatIsoTime(state.valid) } : {}),
  ...timeRuleAttributes({ ...props, minutesStep: undefined }),
  ...(state.explicit ? { "data-ok-locale": state.locale } : {}),
});

export interface TimeClockProps
  extends ClockBaseProps,
    Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Called with the new time and how far the selection is (`shallow` while dragging). */
  onChange?: ((value: Date | null, selectionState: PickerSelectionState) => void) | undefined;
  /** Views in order. Default `["hours", "minutes"]`. */
  views?: readonly TimeView[] | undefined;
  /** The view shown first. */
  openTo?: TimeView | undefined;
  /** Controlled view. */
  view?: TimeView | undefined;
  onViewChange?: ((view: TimeView) => void) | undefined;
  /** AM / PM buttons on the clock (12-hour clocks). */
  ampmInClock?: boolean | undefined;
  /** Focuses the clock on mount. */
  autoFocus?: boolean | undefined;
}

/**
 * TimeClock — spec: specs/components/date-picker.md. An analog clock: the face is a listbox of
 * numbers (`aria-activedescendant`); a press or a drag picks the number under the pointer, arrows
 * step it, Enter goes to the next view. Core's `createTimeClockController` reports the numbers.
 */
export const TimeClock = forwardRef<HTMLDivElement, TimeClockProps>(function TimeClock(props, ref) {
  const {
    value: _value,
    defaultValue: _defaultValue,
    onChange,
    views: viewsProp,
    openTo,
    view: viewProp,
    onViewChange,
    ampm: _ampm,
    ampmInClock,
    referenceDate: _referenceDate,
    today: _today,
    minTime: _minTime,
    maxTime: _maxTime,
    minDateTime: _minDateTime,
    maxDateTime: _maxDateTime,
    minutesStep,
    shouldDisableTime: _shouldDisableTime,
    disableIgnoringDatePartForTimeValidation: _ignore,
    disablePast,
    disableFuture,
    readOnly = false,
    disabled = false,
    localeText: _localeText,
    autoFocus,
    id: idProp,
    style,
    ...rest
  } = props;
  const state = useClockState(props);
  const { localeText, ampm, valid, base, rules, locale } = state;
  const generated = useId();
  const id = idProp ?? generated;
  const views = normalizeTimeViews(viewsProp);
  const [view, setView] = useControllableState<TimeView>({
    value: viewProp,
    defaultValue: openTo && views.includes(openTo) ? openTo : (views[0] as TimeView),
    onChange: onViewChange,
  });
  const shown = views.includes(view) ? view : (views[0] as TimeView);
  const at = views.indexOf(shown);
  const step = Math.max(1, Math.trunc(minutesStep ?? 1));
  const unit = valid ? timeUnit(valid, shown, ampm) : null;
  const pm = base.getHours() >= 12;

  const commit = (next: Date, selection: PickerSelectionState) => {
    state.setCurrent(next);
    onChange?.(next, selection);
  };
  const pick = (number: number, finish: boolean) => {
    const next = setTimeUnit(base, shown, number, ampm);
    if (!finish) {
      commit(next, "shallow");
      return;
    }
    const after = views[at + 1];
    commit(next, after ? "partial" : "finish");
    if (after) setView(after);
  };

  const isDisabled = (number: number) => isTimeUnitDisabled(base, shown, number, rules, ampm);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const latest = useRef({ shown, unit, ampm, step, disabled, readOnly, isDisabled, pick });
  latest.current = { shown, unit, ampm, step, disabled, readOnly, isDisabled, pick };
  const controllerRef = useRef<TimeClockController | null>(null);
  useLayoutEffect(() => {
    const controller = createTimeClockController(rootRef.current as HTMLElement, {
      read: () => {
        const s = latest.current;
        return {
          view: s.shown,
          unit: s.unit,
          ampm: s.ampm,
          step: s.shown === "hours" ? 1 : s.step,
          disabled: s.disabled,
          readOnly: s.readOnly,
          isDisabled: s.isDisabled,
        };
      },
      onChange: (number, finish) => latest.current.pick(number, finish),
    });
    controllerRef.current = controller;
    return () => controller.destroy();
  }, []);
  useLayoutEffect(() => {
    if (autoFocus)
      rootRef.current?.querySelector<HTMLElement>("[data-ok-time-clock-options]")?.focus();
  }, [autoFocus]);

  const numbers = clockNumbers(shown, ampm);
  const timeText = valid ? formatTimeText(valid, views, ampm, locale) : null;
  const optionId = (n: number) => `${id}-${shown}-${n}`;
  const selected = numbers.find((n) => n.value === unit);
  const numberText = (label: string) =>
    shown === "hours"
      ? localeText.hoursClockNumberText(label)
      : shown === "minutes"
        ? localeText.minutesClockNumberText(label)
        : localeText.secondsClockNumberText(label);
  const meridiem = meridiemNames(locale);
  const setRef = (element: HTMLDivElement | null) => {
    rootRef.current = element;
    if (typeof ref === "function") ref(element);
    else if (ref) ref.current = element;
  };

  return (
    <div
      ref={setRef}
      id={id}
      {...timeClockAttributes({ ampmInClock, minutesStep, disablePast, disableFuture, readOnly })}
      {...clockRootAttributes(props, state)}
      data-ok-view={shown}
      data-ok-views={views.join(" ")}
      {...(disabled ? { "data-ok-disabled": "" } : {})}
      data-ok-runtime="off"
      style={style}
      {...rest}
    >
      <div data-ok-time-clock-dial="">
        <span data-ok-time-clock-pin="" />
        {/* Always rendered (hidden without a value) so the HTML runtime patches it in place. */}
        <span
          data-ok-time-clock-pointer=""
          hidden={unit === null || undefined}
          {...(unit !== null && isInnerHour(shown, unit, ampm) ? { "data-ok-inner": "" } : {})}
          {...(unit !== null && shown !== "hours" && unit % 5 !== 0
            ? { "data-ok-between": "" }
            : {})}
          style={
            unit === null
              ? undefined
              : ({ "--_ok-clock-angle": `${clockAngle(shown, unit)}deg` } as CSSProperties)
          }
        />
        <div
          role="listbox"
          data-ok-time-clock-options=""
          tabIndex={disabled ? -1 : 0}
          aria-label={localeText.clockLabelText(shown, timeText)}
          aria-activedescendant={selected ? optionId(selected.value) : undefined}
          aria-disabled={disabled || undefined}
          aria-readonly={readOnly || undefined}
        >
          {numbers.map((number) => {
            const off = disabled || isDisabled(number.value);
            return (
              // biome-ignore lint/a11y/useFocusableInteractive: focus stays on the listbox (aria-activedescendant), as MUI's clock does.
              <span
                key={number.value}
                id={optionId(number.value)}
                role="option"
                data-ok-time-clock-number=""
                data-ok-position={number.position}
                {...(number.inner ? { "data-ok-inner": "" } : {})}
                data-ok-value={number.value}
                aria-label={numberText(number.label)}
                aria-selected={number.value === unit || undefined}
                aria-disabled={off || undefined}
              >
                {number.label}
              </span>
            );
          })}
        </div>
      </div>
      {ampmInClock && ampm && (
        <div data-ok-time-clock-meridiems="">
          {(["am", "pm"] as const).map((name, index) => (
            <button
              key={name}
              type="button"
              data-ok-time-clock-meridiem={name}
              aria-pressed={valid ? pm === (index === 1) : false}
              disabled={
                disabled || readOnly || isTimeUnitDisabled(base, "meridiem", index, rules, ampm)
              }
              onClick={() => commit(setTimeUnit(base, "meridiem", index, ampm), "partial")}
            >
              {meridiem[index]}
            </button>
          ))}
        </div>
      )}
      <div data-ok-time-clock-nav="">
        <IconButton
          data-ok-time-clock-prev=""
          size="sm"
          aria-label={localeText.openPreviousView}
          title={localeText.openPreviousView}
          disabled={at <= 0}
          onClick={() => setView(views[at - 1] as TimeView)}
        >
          <PickerArrowIcon direction="left" />
        </IconButton>
        <IconButton
          data-ok-time-clock-next=""
          size="sm"
          aria-label={localeText.openNextView}
          title={localeText.openNextView}
          disabled={at >= views.length - 1}
          onClick={() => setView(views[at + 1] as TimeView)}
        >
          <PickerArrowIcon direction="right" />
        </IconButton>
      </div>
    </div>
  );
});
