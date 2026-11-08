"use client";

/**
 * Public date and time pickers (phase 4, ADR-0030): each component is its implementation wrapped
 * by `withPickerAdapter`, so it accepts the `LocalizationProvider`'s date adapter type and a
 * `timezone`. Implementations compose each other unwrapped (engine dates only).
 */
import type { PickerShortcut as CorePickerShortcut } from "@owlky/core";
import * as Calendar from "../date-calendar/date-calendar.js";
import * as Field from "../date-field/date-field.js";
import * as Picker from "../date-picker/date-picker.js";
import * as RangeCalendar from "../date-range-calendar/date-range-calendar.js";
import * as RangeField from "../date-range-field/date-range-field.js";
import * as RangePicker from "../date-range-picker/date-range-picker.js";
import * as DateTimeFieldModule from "../date-time-field/date-time-field.js";
import * as DateTimePickerModule from "../date-time-picker/date-time-picker.js";
import * as DateTimeRangePickerModule from "../date-time-range-picker/date-time-range-picker.js";
import * as DigitalClockModule from "../digital-clock/digital-clock.js";
import * as MultiSectionModule from "../multi-section-digital-clock/multi-section-digital-clock.js";
import * as TimeClockModule from "../time-clock/time-clock.js";
import * as TimeFieldModule from "../time-field/time-field.js";
import * as TimePickerModule from "../time-picker/time-picker.js";
import * as TimeRangePickerModule from "../time-range-picker/time-range-picker.js";
import { type AdaptDate, type AdaptedProps, withPickerAdapter } from "../utils/picker-adapter.js";

export type DateCalendarProps = AdaptedProps<Calendar.DateCalendarProps>;
export type MonthCalendarProps = AdaptedProps<Calendar.MonthCalendarProps>;
export type YearCalendarProps = AdaptedProps<Calendar.YearCalendarProps>;
export type DateFieldProps = AdaptedProps<Field.DateFieldProps>;
export type DatePickerProps = AdaptedProps<Picker.DatePickerProps>;
export type StaticDatePickerProps = AdaptedProps<Picker.StaticDatePickerProps>;
export type TimeFieldProps = AdaptedProps<TimeFieldModule.TimeFieldProps>;
export type DateTimeFieldProps = AdaptedProps<DateTimeFieldModule.DateTimeFieldProps>;
export type TimeClockProps = AdaptedProps<TimeClockModule.TimeClockProps>;
export type DigitalClockProps = AdaptedProps<DigitalClockModule.DigitalClockProps>;
export type MultiSectionDigitalClockProps =
  AdaptedProps<MultiSectionModule.MultiSectionDigitalClockProps>;
export type TimePickerProps = AdaptedProps<TimePickerModule.TimePickerProps>;
export type StaticTimePickerProps = AdaptedProps<TimePickerModule.StaticTimePickerProps>;
export type DateTimePickerProps = AdaptedProps<DateTimePickerModule.DateTimePickerProps>;
export type StaticDateTimePickerProps =
  AdaptedProps<DateTimePickerModule.StaticDateTimePickerProps>;
export type DateRangeCalendarProps = AdaptedProps<RangeCalendar.DateRangeCalendarProps>;
export type SingleInputRangeFieldProps = AdaptedProps<RangeField.SingleInputRangeFieldProps>;
export type SingleInputTimeRangeFieldProps =
  AdaptedProps<RangeField.SingleInputTimeRangeFieldProps>;
export type SingleInputDateTimeRangeFieldProps =
  AdaptedProps<RangeField.SingleInputDateTimeRangeFieldProps>;
export type MultiInputRangeFieldProps = AdaptedProps<RangeField.MultiInputRangeFieldProps>;
export type MultiInputTimeRangeFieldProps = AdaptedProps<RangeField.MultiInputTimeRangeFieldProps>;
export type MultiInputDateTimeRangeFieldProps =
  AdaptedProps<RangeField.MultiInputDateTimeRangeFieldProps>;
export type DateRangePickerProps = AdaptedProps<RangePicker.DateRangePickerProps>;
export type StaticDateRangePickerProps = AdaptedProps<RangePicker.StaticDateRangePickerProps>;
export type TimeRangePickerProps = AdaptedProps<TimeRangePickerModule.TimeRangePickerProps>;
export type DateTimeRangePickerProps =
  AdaptedProps<DateTimeRangePickerModule.DateTimeRangePickerProps>;

/** A range of public dates (`[start, end]`, either side `null`). */
export type DateRange = AdaptDate<RangeCalendar.DateRange>;
/** A shortcut chip of a date, time or date time picker. */
export type PickerShortcut = AdaptDate<readonly CorePickerShortcut[]>[number];
/** A shortcut chip of a range picker. */
export type RangeShortcut = AdaptDate<readonly RangePicker.RangeShortcut[]>[number];

export const DateCalendar = withPickerAdapter(Calendar.DateCalendar, "DateCalendar");
export const MonthCalendar = withPickerAdapter(Calendar.MonthCalendar, "MonthCalendar");
export const YearCalendar = withPickerAdapter(Calendar.YearCalendar, "YearCalendar");
export const DateField = withPickerAdapter(Field.DateField, "DateField");
export const DatePicker = withPickerAdapter(Picker.DatePicker, "DatePicker");
export const DesktopDatePicker = withPickerAdapter(Picker.DesktopDatePicker, "DesktopDatePicker");
export const MobileDatePicker = withPickerAdapter(Picker.MobileDatePicker, "MobileDatePicker");
export const StaticDatePicker = withPickerAdapter(Picker.StaticDatePicker, "StaticDatePicker");
export const TimeField = withPickerAdapter(TimeFieldModule.TimeField, "TimeField");
export const DateTimeField = withPickerAdapter(DateTimeFieldModule.DateTimeField, "DateTimeField");
export const TimeClock = withPickerAdapter(TimeClockModule.TimeClock, "TimeClock");
export const DigitalClock = withPickerAdapter(DigitalClockModule.DigitalClock, "DigitalClock");
export const MultiSectionDigitalClock = withPickerAdapter(
  MultiSectionModule.MultiSectionDigitalClock,
  "MultiSectionDigitalClock",
);
export const TimePicker = withPickerAdapter(TimePickerModule.TimePicker, "TimePicker");
export const DesktopTimePicker = withPickerAdapter(
  TimePickerModule.DesktopTimePicker,
  "DesktopTimePicker",
);
export const MobileTimePicker = withPickerAdapter(
  TimePickerModule.MobileTimePicker,
  "MobileTimePicker",
);
export const StaticTimePicker = withPickerAdapter(
  TimePickerModule.StaticTimePicker,
  "StaticTimePicker",
);
export const DateTimePicker = withPickerAdapter(
  DateTimePickerModule.DateTimePicker,
  "DateTimePicker",
);
export const DesktopDateTimePicker = withPickerAdapter(
  DateTimePickerModule.DesktopDateTimePicker,
  "DesktopDateTimePicker",
);
export const MobileDateTimePicker = withPickerAdapter(
  DateTimePickerModule.MobileDateTimePicker,
  "MobileDateTimePicker",
);
export const StaticDateTimePicker = withPickerAdapter(
  DateTimePickerModule.StaticDateTimePicker,
  "StaticDateTimePicker",
);
export const DateRangeCalendar = withPickerAdapter(
  RangeCalendar.DateRangeCalendar,
  "DateRangeCalendar",
);
export const SingleInputDateRangeField = withPickerAdapter(
  RangeField.SingleInputDateRangeField,
  "SingleInputDateRangeField",
);
export const SingleInputTimeRangeField = withPickerAdapter(
  RangeField.SingleInputTimeRangeField,
  "SingleInputTimeRangeField",
);
export const SingleInputDateTimeRangeField = withPickerAdapter(
  RangeField.SingleInputDateTimeRangeField,
  "SingleInputDateTimeRangeField",
);
export const MultiInputDateRangeField = withPickerAdapter(
  RangeField.MultiInputDateRangeField,
  "MultiInputDateRangeField",
);
export const MultiInputTimeRangeField = withPickerAdapter(
  RangeField.MultiInputTimeRangeField,
  "MultiInputTimeRangeField",
);
export const MultiInputDateTimeRangeField = withPickerAdapter(
  RangeField.MultiInputDateTimeRangeField,
  "MultiInputDateTimeRangeField",
);
export const DateRangePicker = withPickerAdapter(RangePicker.DateRangePicker, "DateRangePicker");
export const DesktopDateRangePicker = withPickerAdapter(
  RangePicker.DesktopDateRangePicker,
  "DesktopDateRangePicker",
);
export const MobileDateRangePicker = withPickerAdapter(
  RangePicker.MobileDateRangePicker,
  "MobileDateRangePicker",
);
export const StaticDateRangePicker = withPickerAdapter(
  RangePicker.StaticDateRangePicker,
  "StaticDateRangePicker",
);
export const TimeRangePicker = withPickerAdapter(
  TimeRangePickerModule.TimeRangePicker,
  "TimeRangePicker",
);
export const DesktopTimeRangePicker = withPickerAdapter(
  TimeRangePickerModule.DesktopTimeRangePicker,
  "DesktopTimeRangePicker",
);
export const MobileTimeRangePicker = withPickerAdapter(
  TimeRangePickerModule.MobileTimeRangePicker,
  "MobileTimeRangePicker",
);
export const DateTimeRangePicker = withPickerAdapter(
  DateTimeRangePickerModule.DateTimeRangePicker,
  "DateTimeRangePicker",
);
export const DesktopDateTimeRangePicker = withPickerAdapter(
  DateTimeRangePickerModule.DesktopDateTimeRangePicker,
  "DesktopDateTimeRangePicker",
);
export const MobileDateTimeRangePicker = withPickerAdapter(
  DateTimeRangePickerModule.MobileDateTimeRangePicker,
  "MobileDateTimeRangePicker",
);
