"use client";

import {
  createDigitalClockController,
  type DigitalClockController,
  digitalClockAttributes,
  digitalClockItems,
  formatIsoTime,
} from "@owlky/core";
import { forwardRef, type HTMLAttributes, useLayoutEffect, useRef } from "react";
import type { PickerSelectionState } from "../date-calendar/date-calendar.js";
import {
  type ClockBaseProps,
  clockRootAttributes,
  useClockState,
} from "../time-clock/time-clock.js";
import { useMergedRefs } from "../utils/refs.js";

export interface DigitalClockProps
  extends ClockBaseProps,
    Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** Called with the picked time (always `"finish"`: one list picks the whole time). */
  onChange?: ((value: Date | null, selectionState: PickerSelectionState) => void) | undefined;
  /** Minutes between two options. Default 30. */
  timeStep?: number | undefined;
  /** Options that can't be picked are left out. */
  skipDisabled?: boolean | undefined;
  /** Focuses the selected option on mount. */
  autoFocus?: boolean | undefined;
}

/** Imperative focus and scroll of the digital clocks (shared by both). */
export function useDigitalClockController(
  read: () => { disabled: boolean; readOnly: boolean },
  onSelect: (item: HTMLElement) => void,
  autoFocus: boolean | undefined,
) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const latest = useRef({ read, onSelect });
  latest.current = { read, onSelect };
  const controllerRef = useRef<DigitalClockController | null>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: `autoFocus` only counts on mount.
  useLayoutEffect(() => {
    const controller = createDigitalClockController(rootRef.current as HTMLElement, {
      read: () => latest.current.read(),
      onSelect: (item) => latest.current.onSelect(item),
    });
    controllerRef.current = controller;
    controller.scrollToSelected();
    if (autoFocus) controller.focusList(0);
    return () => controller.destroy();
  }, []);
  return { rootRef, controllerRef };
}

/**
 * DigitalClock — spec: specs/components/date-picker.md. One list of times every `timeStep`
 * minutes (a listbox of options with a roving `tabindex`); a press, Enter or Space picks one.
 */
export const DigitalClock = forwardRef<HTMLDivElement, DigitalClockProps>(
  function DigitalClock(props, ref) {
    const {
      value: _value,
      defaultValue: _defaultValue,
      onChange,
      timeStep,
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
      "aria-label": ariaLabel,
      ...rest
    } = props;
    const state = useClockState(props);
    const { localeText, ampm, valid, base, rules, locale } = state;
    const items = digitalClockItems(valid, base, {
      ampm,
      step: timeStep,
      rules,
      locale,
      skipDisabled,
    });
    const focusable = items.find((item) => item.selected) ?? items.find((item) => !item.disabled);
    const { rootRef } = useDigitalClockController(
      () => ({ disabled, readOnly }),
      (element) => {
        const item = items.find(
          (option) => formatIsoTime(option.value) === element.getAttribute("data-ok-value"),
        );
        if (!item) return;
        state.setCurrent(item.value);
        onChange?.(item.value, "finish");
      },
      autoFocus,
    );
    const mergedRef = useMergedRefs(ref, rootRef);

    return (
      <div
        ref={mergedRef}
        {...digitalClockAttributes({
          timeStep,
          skipDisabled,
          minutesStep,
          disablePast,
          disableFuture,
          readOnly,
        })}
        {...clockRootAttributes(props, state)}
        {...(disabled ? { "data-ok-disabled": "" } : {})}
        data-ok-runtime="off"
        {...rest}
      >
        <ul
          // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: a list of times is a listbox (MUI DigitalClock).
          role="listbox"
          data-ok-digital-clock-list=""
          aria-label={ariaLabel ?? localeText.timePickerToolbarTitle}
          aria-disabled={disabled || undefined}
          aria-readonly={readOnly || undefined}
        >
          {items.map((item) => (
            <li
              key={item.label}
              // biome-ignore lint/a11y/noNoninteractiveElementToInteractiveRole: listbox options are list items (MUI).
              role="option"
              data-ok-digital-clock-item=""
              data-ok-value={formatIsoTime(item.value)}
              tabIndex={item === focusable && !disabled ? 0 : -1}
              aria-selected={item.selected}
              aria-disabled={disabled || item.disabled || undefined}
            >
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    );
  },
);
