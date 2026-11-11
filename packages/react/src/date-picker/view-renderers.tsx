"use client";

import type { PickerView, ResolvedTimeSteps } from "@owlky/core";
import type { ReactNode } from "react";
import {
  DateCalendar,
  type DateCalendarProps,
  type PickerSelectionState,
} from "../date-calendar/date-calendar.js";
import { DigitalClock } from "../digital-clock/digital-clock.js";
import { MultiSectionDigitalClock } from "../multi-section-digital-clock/multi-section-digital-clock.js";
import { TimeClock, type TimeClockProps } from "../time-clock/time-clock.js";

/**
 * View renderers (phase 4, ADR-0030; MUI X `viewRenderers`): what a picker shows for each view.
 * `null` leaves a view out of the picker (the field still edits it); every view `null` leaves
 * only the field. Values are the engine's `Date`s (wall time in the picker's zone).
 */
export interface PickerViewRendererProps {
  /** The picker's id: views derive their ids from it. */
  id: string;
  /** The view is out of sight in this form (the date or the time of a date time dialog). */
  hidden: boolean;
  /** The current view and the views of its kind (date or time). */
  view: PickerView;
  views: readonly PickerView[];
  onViewChange(view: PickerView): void;
  value: Date | null;
  onChange(value: Date | null, selectionState: PickerSelectionState): void;
  /** Everything the picker passes to its calendar (validation, week numbers, slots…). */
  calendarProps: DateCalendarProps;
  /** Everything the picker passes to its clocks (value, validation, `ampm`, limits…). */
  clockProps: Omit<
    TimeClockProps,
    "views" | "view" | "onViewChange" | "onChange" | "focusedView" | "onFocusedViewChange"
  >;
  timeSteps: ResolvedTimeSteps;
  skipDisabled?: boolean | undefined;
}

export type PickerViewRenderer = (props: PickerViewRendererProps) => ReactNode;
/** One renderer per view; `null` hides the view. */
export type PickerViewRenderers = Partial<Record<PickerView, PickerViewRenderer | null>>;

/** The calendar (day, month and year views): the default for date views. */
export const renderDateViewCalendar: PickerViewRenderer = ({ calendarProps, hidden }) => (
  <DateCalendar {...calendarProps} hidden={hidden || undefined} />
);

/** The analog clock: the default on touch screens, or on desktop by choice (MUI X). */
export const renderTimeViewClock: PickerViewRenderer = ({
  id,
  views,
  view,
  onViewChange,
  onChange,
  clockProps,
  hidden,
}) => (
  <TimeClock
    id={`${id}-clock`}
    hidden={hidden || undefined}
    views={views as TimeClockProps["views"]}
    view={view as TimeClockProps["view"]}
    onViewChange={onViewChange as TimeClockProps["onViewChange"]}
    onChange={onChange}
    {...clockProps}
  />
);

/** One list of times (the desktop default when a day holds few options). */
export const renderDigitalClockTimeView: PickerViewRenderer = ({
  id,
  onChange,
  clockProps,
  timeSteps,
  skipDisabled,
  hidden,
}) => (
  <DigitalClock
    id={`${id}-digital-clock`}
    hidden={hidden || undefined}
    timeStep={timeSteps.minutes * timeSteps.hours}
    skipDisabled={skipDisabled}
    onChange={onChange}
    {...clockProps}
  />
);

/** One column per view (the desktop default with many options). */
export const renderMultiSectionDigitalClockTimeView: PickerViewRenderer = ({
  id,
  views,
  onChange,
  clockProps,
  timeSteps,
  skipDisabled,
  hidden,
}) => (
  <MultiSectionDigitalClock
    id={`${id}-digital-clock`}
    hidden={hidden || undefined}
    views={views as TimeClockProps["views"]}
    timeSteps={timeSteps}
    skipDisabled={skipDisabled}
    onChange={onChange}
    {...clockProps}
  />
);

/** The renderers above hide themselves (`hidden`); other renderers get a wrapper. */
export const BUILT_IN_RENDERERS: ReadonlySet<PickerViewRenderer> = new Set([
  renderDateViewCalendar,
  renderTimeViewClock,
  renderDigitalClockTimeView,
  renderMultiSectionDigitalClockTimeView,
]);
