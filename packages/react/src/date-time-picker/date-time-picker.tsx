"use client";

import type { PickerValidationError, PickerView } from "@owlky/core";
import { forwardRef } from "react";
import type { DateTimeValidationProps, PickerChangeContext } from "../date-field/date-field.js";
import {
  type DatePickerProps,
  PickerBase,
  type PickerProps,
  type PickerTimeProps,
} from "../date-picker/date-picker.js";

export interface DateTimePickerProps
  extends Omit<
      DatePickerProps,
      "views" | "openTo" | "view" | "onViewChange" | "onChange" | "onError"
    >,
    DateTimeValidationProps,
    PickerTimeProps {
  /** Views. Default `["year", "day", "hours", "minutes"]`. */
  views?: readonly PickerView[] | undefined;
  /** The view the picker opens on. */
  openTo?: PickerView | undefined;
  /** Controlled view. */
  view?: PickerView | undefined;
  onViewChange?: ((view: PickerView) => void) | undefined;
  /** Called on every change (typing, picking), with the validation error. */
  onChange?:
    | ((value: Date | null, context: PickerChangeContext<PickerValidationError>) => void)
    | undefined;
  /** Called when the validation error changes. */
  onError?: ((error: PickerValidationError | null, value: Date | null) => void) | undefined;
}

/**
 * DateTimePicker — spec: specs/components/date-picker.md. A date time field with the calendar and
 * digital clocks side by side in a popover (pointer devices), or a dialog with a toolbar, date /
 * time tabs and the analog clock (touch).
 */
export const DateTimePicker = forwardRef<HTMLDivElement, DateTimePickerProps>(
  function DateTimePicker(props, ref) {
    return (
      <PickerBase
        ref={ref}
        pickerVariant="responsive"
        valueType="date-time"
        {...(props as PickerProps)}
      />
    );
  },
);

/** DesktopDateTimePicker — the calendar and digital clocks in a popover. */
export const DesktopDateTimePicker = forwardRef<HTMLDivElement, DateTimePickerProps>(
  function DesktopDateTimePicker(props, ref) {
    return (
      <PickerBase
        ref={ref}
        pickerVariant="desktop"
        valueType="date-time"
        {...(props as PickerProps)}
      />
    );
  },
);

/** MobileDateTimePicker — a dialog with a toolbar, date / time tabs, Cancel and Next / OK. */
export const MobileDateTimePicker = forwardRef<HTMLDivElement, DateTimePickerProps>(
  function MobileDateTimePicker(props, ref) {
    return (
      <PickerBase
        ref={ref}
        pickerVariant="mobile"
        valueType="date-time"
        {...(props as PickerProps)}
      />
    );
  },
);

export interface StaticDateTimePickerProps
  extends Omit<
    DateTimePickerProps,
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

/** StaticDateTimePicker — the toolbar, tabs and views inline, without a field. */
export const StaticDateTimePicker = forwardRef<HTMLDivElement, StaticDateTimePickerProps>(
  function StaticDateTimePicker(props, ref) {
    return (
      <PickerBase
        ref={ref}
        pickerVariant="static"
        valueType="date-time"
        {...(props as PickerProps)}
      />
    );
  },
);
