"use client";

import {
  type ClockSectionView,
  formatTimeSteps,
  multiSectionDigitalClockAttributes,
  normalizeTimeSteps,
  normalizeTimeViews,
  setTimeUnit,
  type TimeSteps,
  type TimeView,
  timeSectionOptions,
} from "@owlky/core";
import { forwardRef, type HTMLAttributes, useLayoutEffect, useRef } from "react";
import type { PickerSelectionState } from "../date-calendar/date-calendar.js";
import { useDigitalClockController } from "../digital-clock/digital-clock.js";
import {
  type ClockBaseProps,
  clockRootAttributes,
  useClockState,
} from "../time-clock/time-clock.js";
import { useMergedRefs } from "../utils/refs.js";

export interface MultiSectionDigitalClockProps
  extends ClockBaseProps,
    Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Called with the new time: `"finish"` after the last column, `"partial"` before. */
  onChange?: ((value: Date | null, selectionState: PickerSelectionState) => void) | undefined;
  /** Columns in order (AM / PM is added on 12-hour clocks). Default `["hours", "minutes"]`. */
  views?: readonly TimeView[] | undefined;
  /** Steps between the options. Default `{ hours: 1, minutes: 5, seconds: 5 }`. */
  timeSteps?: TimeSteps | undefined;
  /** Options that can't be picked are left out. */
  skipDisabled?: boolean | undefined;
  /** Focuses the first column on mount. */
  autoFocus?: boolean | undefined;
}

/**
 * MultiSectionDigitalClock — spec: specs/components/date-picker.md. One list per time view (and
 * AM / PM); picking an option moves focus to the next list.
 */
export const MultiSectionDigitalClock = forwardRef<HTMLDivElement, MultiSectionDigitalClockProps>(
  function MultiSectionDigitalClock(props, ref) {
    const {
      value: _value,
      defaultValue: _defaultValue,
      onChange,
      views: viewsProp,
      timeSteps,
      skipDisabled,
      ampm: _ampm,
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
      ...rest
    } = props;
    const state = useClockState(props);
    const { localeText, ampm, valid, base, rules, locale } = state;
    const views = normalizeTimeViews(viewsProp);
    const steps = normalizeTimeSteps(timeSteps);
    const sections: ClockSectionView[] = [...views, ...(ampm ? (["meridiem"] as const) : [])];
    const lists = sections.map((section) =>
      timeSectionOptions(section, valid, base, {
        ampm,
        step: section === "meridiem" ? 1 : steps[section],
        rules,
        locale,
        skipDisabled,
      }),
    );
    const focusNext = useRef<number | null>(null);
    const { rootRef, controllerRef } = useDigitalClockController(
      () => ({ disabled, readOnly }),
      (element) => {
        const list = element.closest("[data-ok-digital-clock-section]");
        const at = sections.indexOf(
          list?.getAttribute("data-ok-digital-clock-section") as ClockSectionView,
        );
        const number = Number(element.getAttribute("data-ok-value"));
        const next = setTimeUnit(base, sections[at] as ClockSectionView, number, ampm);
        const last = at === sections.length - 1;
        state.setCurrent(next);
        onChange?.(next, last ? "finish" : "partial");
        if (!last) focusNext.current = at + 1;
      },
      autoFocus,
    );
    // After a pick: focus moves to the next column (MUI).
    useLayoutEffect(() => {
      if (focusNext.current === null) return;
      controllerRef.current?.focusList(focusNext.current);
      focusNext.current = null;
    });
    const mergedRef = useMergedRefs(ref, rootRef);

    return (
      // biome-ignore lint/a11y/useSemanticElements: a group of listboxes, not form fields (MUI).
      <div
        ref={mergedRef}
        role="group"
        {...multiSectionDigitalClockAttributes({
          skipDisabled,
          minutesStep,
          disablePast,
          disableFuture,
          readOnly,
        })}
        {...clockRootAttributes(props, state)}
        data-ok-views={views.join(" ")}
        data-ok-time-steps={formatTimeSteps(steps)}
        {...(disabled ? { "data-ok-disabled": "" } : {})}
        data-ok-runtime="off"
        {...rest}
      >
        {sections.map((section, index) => {
          const options = lists[index] as (typeof lists)[number];
          const focusable =
            options.find((option) => option.selected) ?? options.find((option) => !option.disabled);
          return (
            <ul
              key={section}
              // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: each column is a listbox (MUI MultiSectionDigitalClock).
              role="listbox"
              data-ok-digital-clock-section={section}
              aria-label={localeText.selectViewText(section)}
              aria-disabled={disabled || undefined}
              aria-readonly={readOnly || undefined}
            >
              {options.map((option) => (
                <li
                  key={option.value}
                  // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: listbox options are list items (MUI).
                  role="option"
                  data-ok-digital-clock-item=""
                  data-ok-value={option.value}
                  tabIndex={option === focusable && !disabled ? 0 : -1}
                  aria-selected={option.selected}
                  aria-disabled={disabled || option.disabled || undefined}
                >
                  {option.label}
                </li>
              ))}
            </ul>
          );
        })}
      </div>
    );
  },
);
