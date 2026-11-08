"use client";

import type { TimeView } from "@owlky/core";
import { forwardRef } from "react";
import type { TimeValidationProps } from "../date-field/date-field.js";
import type { PickerTimeProps } from "../date-picker/date-picker.js";
import {
  type DateRangePickerProps,
  RangePickerBase,
} from "../date-range-picker/date-range-picker.js";

/** Calendar props a time range picker doesn't have. */
type DayOnly =
  | "minDate"
  | "maxDate"
  | "shouldDisableDate"
  | "shouldDisableMonth"
  | "shouldDisableYear"
  | "calendars"
  | "currentMonthCalendarPosition"
  | "disableDragEditing"
  | "disableAutoMonthSwitching"
  | "displayWeekNumber"
  | "fixedWeekNumber"
  | "showDaysOutsideCurrentMonth"
  | "disableHighlightToday"
  | "dayOfWeekFormatter"
  | "loading"
  | "renderLoading"
  | "onMonthChange"
  | "disablePast"
  | "disableFuture"
  | "minDateTime"
  | "maxDateTime";

/** Props of the time range pickers (MUI X `TimeRangePicker`, ADR-0028). */
export interface TimeRangePickerProps
  extends Omit<DateRangePickerProps, DayOnly>,
    TimeValidationProps,
    PickerTimeProps {
  /** Views of one end. Default `["hours", "minutes"]`. */
  views?: readonly TimeView[] | undefined;
}

/** TimeRangePicker — spec: specs/components/date-picker.md. Start and end times: digital clocks in a popover (pointer devices), the analog clock in a dialog (touch). */
export const TimeRangePicker = forwardRef<HTMLDivElement, TimeRangePickerProps>(
  function TimeRangePicker(props, ref) {
    return <RangePickerBase ref={ref} pickerVariant="responsive" valueType="time" {...props} />;
  },
);

/** DesktopTimeRangePicker — digital clocks in a popover. */
export const DesktopTimeRangePicker = forwardRef<HTMLDivElement, TimeRangePickerProps>(
  function DesktopTimeRangePicker(props, ref) {
    return <RangePickerBase ref={ref} pickerVariant="desktop" valueType="time" {...props} />;
  },
);

/** MobileTimeRangePicker — the analog clock in a dialog, with a toolbar and OK / Cancel. */
export const MobileTimeRangePicker = forwardRef<HTMLDivElement, TimeRangePickerProps>(
  function MobileTimeRangePicker(props, ref) {
    return <RangePickerBase ref={ref} pickerVariant="mobile" valueType="time" {...props} />;
  },
);
