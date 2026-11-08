"use client";

import type { PickerView } from "@owlky/core";
import { forwardRef } from "react";
import type { PickerTimeProps } from "../date-picker/date-picker.js";
import {
  type DateRangePickerProps,
  RangePickerBase,
} from "../date-range-picker/date-range-picker.js";

/** Props of the date time range pickers (MUI X `DateTimeRangePicker`, ADR-0028). */
export interface DateTimeRangePickerProps
  extends Omit<DateRangePickerProps, "calendars">,
    PickerTimeProps {
  /** Views of one end. Default `["day", "hours", "minutes"]`. */
  views?: readonly PickerView[] | undefined;
}

/** DateTimeRangePicker — spec: specs/components/date-picker.md. Start and end date times: a calendar beside digital clocks in a popover (pointer devices), the calendar then the clock in a dialog (touch). */
export const DateTimeRangePicker = forwardRef<HTMLDivElement, DateTimeRangePickerProps>(
  function DateTimeRangePicker(props, ref) {
    return (
      <RangePickerBase ref={ref} pickerVariant="responsive" valueType="date-time" {...props} />
    );
  },
);

/** DesktopDateTimeRangePicker — the calendar and the clocks in a popover. */
export const DesktopDateTimeRangePicker = forwardRef<HTMLDivElement, DateTimeRangePickerProps>(
  function DesktopDateTimeRangePicker(props, ref) {
    return <RangePickerBase ref={ref} pickerVariant="desktop" valueType="date-time" {...props} />;
  },
);

/** MobileDateTimeRangePicker — the calendar then the analog clock in a dialog. */
export const MobileDateTimeRangePicker = forwardRef<HTMLDivElement, DateTimeRangePickerProps>(
  function MobileDateTimeRangePicker(props, ref) {
    return <RangePickerBase ref={ref} pickerVariant="mobile" valueType="date-time" {...props} />;
  },
);
