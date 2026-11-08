"use client";

import type { TimeValidationError, TimeView } from "@owlky/core";
import { forwardRef } from "react";
import {
  type DateFieldProps,
  type PickerChangeContext,
  PickerField,
  type PickerFieldProps,
  type TimeValidationProps,
} from "../date-field/date-field.js";

export interface TimeFieldProps
  extends Omit<
      DateFieldProps,
      | "views"
      | "onChange"
      | "onError"
      | "minDate"
      | "maxDate"
      | "shouldDisableDate"
      | "shouldDisableMonth"
      | "shouldDisableYear"
      | "disablePast"
      | "disableFuture"
    >,
    TimeValidationProps {
  /** Views whose default format to use when there's no `format`. Default `["hours", "minutes"]`. */
  views?: readonly TimeView[] | undefined;
  /** 12-hour clock with AM / PM. Default: from the locale. */
  ampm?: boolean | undefined;
  /** Called with the new value and why it's invalid (if it is). */
  onChange?:
    | ((value: Date | null, context: PickerChangeContext<TimeValidationError>) => void)
    | undefined;
  /** Called when the validation error changes. */
  onError?: ((error: TimeValidationError | null, value: Date | null) => void) | undefined;
  /** "Now" for `disablePast` / `disableFuture` (tests and demos). Default: now. */
  today?: Date | undefined;
}

/**
 * TimeField — spec: specs/components/date-picker.md. The sectioned field with time sections
 * (`hh:mm A` or `HH:mm` from the locale); the hidden input holds `HH:mm:ss`.
 */
export const TimeField = forwardRef<HTMLDivElement, TimeFieldProps>(function TimeField(props, ref) {
  return (
    <PickerField ref={ref} valueType="time" {...(props as Omit<PickerFieldProps, "valueType">)} />
  );
});
