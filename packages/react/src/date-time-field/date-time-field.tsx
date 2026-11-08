"use client";

import type { PickerValidationError, PickerView } from "@owlky/core";
import { forwardRef } from "react";
import {
  type DateFieldProps,
  type DateTimeValidationProps,
  type PickerChangeContext,
  PickerField,
  type PickerFieldProps,
} from "../date-field/date-field.js";

export interface DateTimeFieldProps
  extends Omit<DateFieldProps, "views" | "onChange" | "onError">,
    DateTimeValidationProps {
  /** Views whose default format to use when there's no `format`. Default `["year", "day", "hours", "minutes"]`. */
  views?: readonly PickerView[] | undefined;
  /** 12-hour clock with AM / PM. Default: from the locale. */
  ampm?: boolean | undefined;
  /** Called with the new value and why it's invalid (if it is). */
  onChange?:
    | ((value: Date | null, context: PickerChangeContext<PickerValidationError>) => void)
    | undefined;
  /** Called when the validation error changes. */
  onError?: ((error: PickerValidationError | null, value: Date | null) => void) | undefined;
  /** "Today" and "now" for the past / future rules (tests and demos). Default: now. */
  today?: Date | undefined;
}

/**
 * DateTimeField — spec: specs/components/date-picker.md. The sectioned field with date and time
 * sections (`MM/DD/YYYY hh:mm A` in en-US); the hidden input holds `YYYY-MM-DDTHH:mm:ss`.
 */
export const DateTimeField = forwardRef<HTMLDivElement, DateTimeFieldProps>(
  function DateTimeField(props, ref) {
    return (
      <PickerField
        ref={ref}
        valueType="date-time"
        {...(props as Omit<PickerFieldProps, "valueType">)}
      />
    );
  },
);
