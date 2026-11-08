"use client";

import type { TimeValidationError, TimeView } from "@owlky/core";
import { forwardRef } from "react";
import type { PickerChangeContext, TimeValidationProps } from "../date-field/date-field.js";
import {
  type DatePickerProps,
  PickerBase,
  type PickerProps,
  type PickerTimeProps,
} from "../date-picker/date-picker.js";

/** Calendar props a time picker doesn't have. */
type DateOnlyProps =
  | "views"
  | "openTo"
  | "view"
  | "onViewChange"
  | "onChange"
  | "onError"
  | "minDate"
  | "maxDate"
  | "shouldDisableDate"
  | "shouldDisableMonth"
  | "shouldDisableYear"
  | "shortcuts"
  | "displayWeekNumber"
  | "fixedWeekNumber"
  | "showDaysOutsideCurrentMonth"
  | "disableHighlightToday"
  | "dayOfWeekFormatter"
  | "monthsPerRow"
  | "yearsPerRow"
  | "yearsOrder"
  | "loading"
  | "renderLoading"
  | "onMonthChange"
  | "onYearChange"
  | "disablePast"
  | "disableFuture";

export interface TimePickerProps
  extends Omit<DatePickerProps, DateOnlyProps>,
    TimeValidationProps,
    PickerTimeProps {
  /** Views. Default `["hours", "minutes"]`. */
  views?: readonly TimeView[] | undefined;
  /** The view the picker opens on. */
  openTo?: TimeView | undefined;
  /** Controlled view. */
  view?: TimeView | undefined;
  onViewChange?: ((view: TimeView) => void) | undefined;
  /** Called on every change (typing, picking), with the validation error. */
  onChange?:
    | ((value: Date | null, context: PickerChangeContext<TimeValidationError>) => void)
    | undefined;
  /** Called when the validation error changes. */
  onError?: ((error: TimeValidationError | null, value: Date | null) => void) | undefined;
}

/** TimePicker — spec: specs/components/date-picker.md. A time field with digital clocks in a popover (pointer devices) or an analog clock in a dialog (touch). */
export const TimePicker = forwardRef<HTMLDivElement, TimePickerProps>(
  function TimePicker(props, ref) {
    return (
      <PickerBase
        ref={ref}
        pickerVariant="responsive"
        valueType="time"
        {...(props as PickerProps)}
      />
    );
  },
);

/** DesktopTimePicker — digital clocks in a popover, with Cancel and OK. */
export const DesktopTimePicker = forwardRef<HTMLDivElement, TimePickerProps>(
  function DesktopTimePicker(props, ref) {
    return (
      <PickerBase ref={ref} pickerVariant="desktop" valueType="time" {...(props as PickerProps)} />
    );
  },
);

/** MobileTimePicker — the analog clock in a dialog, with a toolbar and Cancel / OK. */
export const MobileTimePicker = forwardRef<HTMLDivElement, TimePickerProps>(
  function MobileTimePicker(props, ref) {
    return (
      <PickerBase ref={ref} pickerVariant="mobile" valueType="time" {...(props as PickerProps)} />
    );
  },
);

export interface StaticTimePickerProps
  extends Omit<
    TimePickerProps,
    | "open"
    | "onOpenChange"
    | "desktopModeMediaQuery"
    | "keepOpenDuringFieldFocus"
    | "label"
    | "helperText"
    | "error"
    | "variant"
    | "size"
    | "fullWidth"
    | "required"
    | "name"
    | "inputRef"
    | "clearable"
    | "onClear"
    | "format"
    | "formatDensity"
    | "selectedSections"
    | "onSelectedSectionsChange"
  > {}

/** StaticTimePicker — the toolbar and the analog clock inline, without a field. */
export const StaticTimePicker = forwardRef<HTMLDivElement, StaticTimePickerProps>(
  function StaticTimePicker(props, ref) {
    return (
      <PickerBase ref={ref} pickerVariant="static" valueType="time" {...(props as PickerProps)} />
    );
  },
);
