"use client";

import {
  calendarLinear,
  type DateRange,
  dateRangePickerAttributes,
  defaultRangeCalendars,
  type FieldSelectedSections,
  focusCalendar,
  focusPickerView,
  formatAccessibleDate,
  formatIsoRange,
  formatTimeText,
  initialPickerView,
  isSameRange,
  isTimeView,
  isValidDate,
  normalizeTimeSteps,
  type PickerAction,
  type PickerLocaleText,
  type PickerOpenReason,
  type PickerStaticWrapper,
  type PickerValueType,
  type PickerVariant,
  type PickerView,
  pickerViewsOf,
  type RangeCalendarCount,
  type RangePosition,
  type RangeShortcut,
  rangeAccessibleText,
  rangeError,
  rangeShortcutValue,
  rangeToolbarText,
  resolveAmpm,
  resolvePickerMode,
  type SelectionControlSize,
  scrollDigitalClocks,
  shouldRenderSingleColumn,
  splitViews,
  startOfDay,
  type TextFieldVariant,
  type TimeView,
  validateRange,
  withDay,
} from "@owlky/core";
import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type { PickerSelectionState } from "../date-calendar/date-calendar.js";
import { type DateTimeValidationProps, dateRules, timeRules } from "../date-field/date-field.js";
import type { PickerTimeProps } from "../date-picker/date-picker.js";
import {
  PickerActionBar,
  PickerContext,
  type PickerContextValue,
  PickerLayout,
  type PickerShortcutItem,
  PickerShortcuts,
  type PickerSlotProps,
  type PickerSlots,
} from "../date-picker/picker-layout.js";
import { ClockIcon } from "../date-picker/picker-toolbar.js";
import type { PickerViewRenderers } from "../date-picker/view-renderers.js";
import { DateRangeCalendar } from "../date-range-calendar/date-range-calendar.js";
import {
  MultiInputRangeField,
  type RangeChangeContext,
  type RangeErrors,
  SingleInputRangeField,
} from "../date-range-field/date-range-field.js";
import { Dialog } from "../dialog/dialog.js";
import { DigitalClock } from "../digital-clock/digital-clock.js";
import { IconButton } from "../icon-button/icon-button.js";
import { usePickerLocalization } from "../localization-provider/localization-provider.js";
import { MultiSectionDigitalClock } from "../multi-section-digital-clock/multi-section-digital-clock.js";
import { Popover } from "../popover/popover.js";
import { Tab, Tabs } from "../tabs/tabs.js";
import { TimeClock } from "../time-clock/time-clock.js";
import { Icon } from "../utils/icon.js";
import { usePickerDateConverter } from "../utils/picker-adapter.js";
import { useControllableState } from "../utils/use-controllable-state.js";

export type { RangeShortcut };

/** Calendar icon of the open buttons (decorative; the DatePicker's). */
function CalendarIcon() {
  return <Icon icon={calendarLinear} />;
}

/** Props of the date range pickers (MUI X `DateRangePicker`, ADR-0028). */
export interface DateRangePickerProps
  extends DateTimeValidationProps,
    Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue" | "onError"> {
  /** Controlled range. */
  value?: DateRange | undefined;
  /** Uncontrolled initial range. */
  defaultValue?: DateRange | undefined;
  /** Called on every change (typing, picking), with each side's error. */
  onChange?: ((value: DateRange, context: RangeChangeContext) => void) | undefined;
  /** Called when a range is accepted (OK, the end pick that closes, a shortcut, closing on desktop). */
  onAccept?: ((value: DateRange) => void) | undefined;
  /** Called when the errors change. */
  onError?: ((error: RangeErrors, value: DateRange) => void) | undefined;
  /** Controlled open state. */
  open?: boolean | undefined;
  /** Called when the picker asks to open or close, with the reason. */
  onOpenChange?: ((open: boolean, reason: PickerOpenReason) => void) | undefined;
  /** Controlled end the next pick edits. */
  rangePosition?: RangePosition | undefined;
  /** Uncontrolled initial position. Default `"start"`. */
  defaultRangePosition?: RangePosition | undefined;
  /** Called when the end being edited (`start` or `end`) changes. */
  onRangePositionChange?: ((position: RangePosition) => void) | undefined;
  /** Months in the desktop popover. Default 2 (the dialog and inline forms show 1). */
  calendars?: RangeCalendarCount | undefined;
  currentMonthCalendarPosition?: RangeCalendarCount | undefined;
  /** The ends can't be dragged to other days. */
  disableDragEditing?: boolean | undefined;
  /** Picking the start doesn't show the end's month. */
  disableAutoMonthSwitching?: boolean | undefined;
  /** Two fields (start and end) instead of one (MUI `slots.field`). */
  multiInput?: boolean | undefined;
  /** Single input: the field's label. */
  label?: ReactNode;
  /** Multi input: the start field's label. Default `localeText.start`. */
  startLabel?: ReactNode;
  /** Multi input: the end field's label. Default `localeText.end`. */
  endLabel?: ReactNode;
  /** Field format of one date (Day.js tokens). */
  format?: string | undefined;
  formatDensity?: "dense" | "spacious" | undefined;
  /** Picking the end closes the picker. Default: desktop date ranges only. */
  closeOnSelect?: boolean | undefined;
  /** Action bar buttons. Default: none on desktop date ranges, `["cancel", "accept"]` elsewhere. */
  actions?: readonly PickerAction[] | undefined;
  /** Shortcut chips beside the calendar ("Last 7 days"…). */
  shortcuts?: readonly RangeShortcut[] | undefined;
  /**
   * Static pickers: the form shown inline. `"desktop"` has no toolbar or action bar by default,
   * shows two calendars and the digital clocks. Default `"mobile"`.
   */
  displayStaticWrapperAs?: PickerStaticWrapper | undefined;
  /** Media query that picks the desktop form. Default `"@media (pointer: fine)"`. */
  desktopModeMediaQuery?: string | undefined;
  /** Desktop: the popover stays open while a field has focus. */
  keepOpenDuringFieldFocus?: boolean | undefined;
  /** The date the calendar shows and the sections start from while there is no value. */
  referenceDate?: Date | undefined;
  /** The date treated as today (the default is the current date). */
  today?: Date | undefined;
  displayWeekNumber?: boolean | undefined;
  fixedWeekNumber?: number | undefined;
  showDaysOutsideCurrentMonth?: boolean | undefined;
  disableHighlightToday?: boolean | undefined;
  /** Formats the weekday headings of the calendar. */
  dayOfWeekFormatter?: ((date: Date) => string) | undefined;
  loading?: boolean | undefined;
  /** Renders the calendar while `loading` is on. */
  renderLoading?: (() => ReactNode) | undefined;
  reduceAnimations?: boolean | undefined;
  /** Called when the calendar shows another month. */
  onMonthChange?: ((month: Date) => void) | undefined;
  /** Single input: a clear button. */
  clearable?: boolean | undefined;
  /** Single input: text between the start and the end dates. Default `"–"`. */
  dateSeparator?: string | undefined;
  /** Called when the clear button empties the field. */
  onClear?: (() => void) | undefined;
  readOnly?: boolean | undefined;
  /** Turns the field off. */
  disabled?: boolean | undefined;
  /** Focuses the field when it mounts. */
  autoFocus?: boolean | undefined;
  /**
   * The selected section of the field (controlled): its index, the first section of a type
   * (`"day"`), every section (`"all"`), or `null` for none.
   */
  selectedSections?: FieldSelectedSections | undefined;
  /** Called when the selected section changes (its index, or `"all"`). */
  onSelectedSectionsChange?: ((section: FieldSelectedSections) => void) | undefined;
  /** Text under the field, such as a hint or an error message. */
  helperText?: ReactNode;
  /** Shows the field in the error state. */
  error?: boolean | undefined;
  /** The field's variant: `outlined`, `filled` or `standard`. */
  variant?: TextFieldVariant | undefined;
  /** The field's size. */
  size?: SelectionControlSize | undefined;
  /** Stretches the field to the container's width. */
  fullWidth?: boolean | undefined;
  /** Marks the field as required (an asterisk on the label). */
  required?: boolean | undefined;
  /** Single input: a hidden input carries the ISO interval `start/end`. */
  name?: string | undefined;
  /** A ref to the hidden input that carries the value. */
  inputRef?: Ref<HTMLInputElement> | undefined;
  /** Replaces the text of the labels and buttons, such as for another language. */
  localeText?: Partial<PickerLocaleText> | undefined;
  /** Id of the field (other ids derive from it). */
  id?: string | undefined;
  /** Replaced parts (phase 4): `layout`, `toolbar`, `actionBar`, `shortcuts`, `day`, icons. */
  slots?: Omit<PickerSlots<DateRange>, "switchViewIcon"> | undefined;
  /** Props of the slots: `toolbar.hidden`, `tabs.hidden`, `day`, `layout`. */
  slotProps?: PickerSlotProps | undefined;
  /** `null` leaves a view out of the picker; every view `null` leaves only the field. */
  viewRenderers?: Partial<Record<keyof PickerViewRenderers, null>> | undefined;
}

/** Every prop of the range picker family (internal): date, time and date time ranges. */
export interface RangePickerBaseProps extends DateRangePickerProps, PickerTimeProps {
  pickerVariant: PickerVariant;
  valueType?: PickerValueType | undefined;
  /** Time and date time ranges: the views of one end. */
  views?: readonly PickerView[] | undefined;
}

const EMPTY: DateRange = [null, null];
const sideOf = (position: RangePosition): 0 | 1 => (position === "start" ? 0 : 1);

/** The range picker family's body: field(s) + popover / dialog, or the static layout. */
export const RangePickerBase = forwardRef<HTMLDivElement, RangePickerBaseProps>(
  function RangePickerBase(
    {
      pickerVariant,
      valueType = "date",
      views: viewsProp,
      ampm: ampmProp,
      timeSteps,
      thresholdToRenderTimeInASingleColumn,
      skipDisabled,
      minTime,
      maxTime,
      minDateTime,
      maxDateTime,
      minutesStep,
      shouldDisableTime,
      disableIgnoringDatePartForTimeValidation,
      value,
      defaultValue = EMPTY,
      onChange,
      onAccept,
      onError,
      open: openProp,
      onOpenChange,
      rangePosition: positionProp,
      defaultRangePosition = "start",
      onRangePositionChange,
      calendars: calendarsProp,
      currentMonthCalendarPosition,
      disableDragEditing,
      disableAutoMonthSwitching,
      multiInput,
      label,
      startLabel,
      endLabel,
      format,
      formatDensity,
      closeOnSelect,
      actions: actionsProp,
      shortcuts,
      displayStaticWrapperAs,
      desktopModeMediaQuery,
      keepOpenDuringFieldFocus,
      referenceDate,
      today,
      displayWeekNumber,
      fixedWeekNumber,
      showDaysOutsideCurrentMonth,
      disableHighlightToday,
      dayOfWeekFormatter,
      loading,
      renderLoading,
      reduceAnimations,
      onMonthChange,
      clearable,
      dateSeparator,
      onClear,
      readOnly,
      disabled,
      autoFocus,
      selectedSections,
      onSelectedSectionsChange,
      helperText,
      error,
      variant,
      size,
      fullWidth,
      required,
      name,
      inputRef,
      localeText: localeTextProp,
      id: idProp,
      minDate,
      maxDate,
      disablePast,
      disableFuture,
      shouldDisableDate,
      shouldDisableMonth,
      shouldDisableYear,
      slots,
      slotProps,
      viewRenderers,
      ...props
    },
    ref,
  ) {
    const { locale, localeText, explicit } = usePickerLocalization(localeTextProp);
    const converter = usePickerDateConverter();
    const generated = useId();
    const id = idProp ?? generated;
    const isDate = valueType === "date";
    const isDateTime = valueType === "date-time";
    const isStatic = pickerVariant === "static";
    const views = isDate ? (["day"] as PickerView[]) : pickerViewsOf(viewsProp, valueType);
    const { time: timeViews } = splitViews(views);
    const ampm = resolveAmpm(ampmProp, locale);
    const steps = normalizeTimeSteps(timeSteps);
    const validation = {
      minDate,
      maxDate,
      disablePast,
      disableFuture,
      shouldDisableDate,
      shouldDisableMonth,
      shouldDisableYear,
    };
    const timeValidation = {
      minTime,
      maxTime,
      minDateTime,
      maxDateTime,
      minutesStep,
      shouldDisableTime,
      disableIgnoringDatePartForTimeValidation,
      disablePast,
      disableFuture,
    };
    const rules = {
      ...dateRules(validation),
      ...(isDate ? {} : timeRules(timeValidation, today)),
      today: today ? startOfDay(today) : undefined,
    };

    const [current, setCurrent] = useControllableState<DateRange>({
      value,
      defaultValue,
      onChange: undefined,
    });
    const [open, setOpen] = useControllableState<boolean>({
      value: openProp,
      defaultValue: false,
      onChange: undefined,
    });
    const [position, setPosition] = useControllableState<RangePosition>({
      value: positionProp,
      defaultValue: defaultRangePosition,
      onChange: onRangePositionChange,
    });
    const firstView = initialPickerView(views, valueType, undefined);
    const [view, setView] = useState<PickerView>(firstView);
    const [mode, setMode] = useState<"desktop" | "mobile" | "static">(
      isStatic ? "static" : pickerVariant === "mobile" ? "mobile" : "desktop",
    );
    // A static picker shown as desktop lays out the desktop form inline (MUI X).
    const staticDesktop = isStatic && displayStaticWrapperAs === "desktop";
    const form = staticDesktop ? "desktop" : mode;
    const desktopVariant = pickerVariant === "desktop" || staticDesktop;
    const valueOnOpen = useRef<DateRange>(current);
    const lastAccepted = useRef<DateRange>(current);

    const change = (next: DateRange) => {
      if (isSameRange(next, current)) return;
      setCurrent(next);
      onChange?.(next, { validationError: validateRange(next, valueType, rules) });
    };
    const accept = (next: DateRange) => {
      if (isStatic) valueOnOpen.current = next;
      if (isSameRange(next, lastAccepted.current)) return;
      lastAccepted.current = next;
      onAccept?.(next);
    };
    const close = (reason: PickerOpenReason) => {
      if (!open || isStatic) return;
      setOpen(false);
      onOpenChange?.(false, reason);
    };
    const openPicker = (reason: PickerOpenReason, at: RangePosition) => {
      const nextMode = resolvePickerMode(pickerVariant, desktopModeMediaQuery, window);
      setMode(nextMode as "desktop" | "mobile");
      valueOnOpen.current = current;
      setPosition(at);
      setView(firstView);
      setOpen(true);
      onOpenChange?.(true, reason);
    };

    // Date ranges close on the end pick on desktop; time ranges never by default (MUI).
    const effectiveCloseOnSelect = closeOnSelect ?? (isDate && form === "desktop");
    let actionList: readonly PickerAction[];
    let actionsShown: readonly PickerAction[];
    if (actionsProp) {
      actionList = actionsProp;
      actionsShown = actionsProp;
    } else if (isDate) {
      actionList = desktopVariant ? [] : ["cancel", "accept"];
      actionsShown = form === "desktop" ? [] : ["cancel", "accept"];
    } else {
      actionList = ["cancel", "accept"];
      actionsShown = actionList;
    }

    /** The last view of the end finished: accept and close when picks close the picker. */
    const finish = (next: DateRange) => {
      if (isStatic) {
        if (closeOnSelect) accept(next);
        return;
      }
      if (effectiveCloseOnSelect) {
        accept(next);
        close("select");
      }
    };

    const valid: DateRange = [
      isValidDate(current[0]) ? current[0] : null,
      isValidDate(current[1]) ? current[1] : null,
    ];
    const base = startOfDay(today ?? new Date());
    const fallback = referenceDate ?? base;

    const onCalendarChange = (next: DateRange, state: PickerSelectionState) => {
      change(next);
      if (isDateTime) {
        // Date time ranges go on to the time of the same end (mobile and static forms).
        if (form !== "desktop" && timeViews.length > 0) setView(timeViews[0] as TimeView);
        return;
      }
      if (state === "finish") finish(next);
    };
    /** A clock changed the time of the edited end. */
    const onTimeChange = (value: Date | null, state: PickerSelectionState) => {
      // Clocks always report a time.
      const date = value as Date;
      const side = sideOf(position);
      const next: DateRange = side === 0 ? [date, current[1]] : [current[0], date];
      change(next);
      if (state !== "finish") return;
      if (position === "start") {
        setPosition("end");
        setView(firstView);
      } else finish(next);
    };

    const runAction = (action: PickerAction) => {
      switch (action) {
        case "accept":
          accept(current);
          close("accept");
          break;
        case "cancel":
          change(valueOnOpen.current);
          close("cancel");
          break;
        case "clear":
          change(EMPTY);
          accept(EMPTY);
          close("clear");
          break;
        case "today": {
          const next: DateRange = [
            withDay(base, valid[0], fallback, valueType),
            withDay(base, valid[1], fallback, valueType),
          ];
          change(next);
          accept(next);
          close("today");
          break;
        }
        case "nextOrAccept": {
          if (position === "start") {
            setPosition("end");
            setView(firstView);
          } else {
            accept(current);
            close("accept");
          }
          break;
        }
      }
    };

    const dismiss = (reason: PickerOpenReason) => {
      if (mode === "mobile") change(valueOnOpen.current);
      else accept(current);
      close(reason);
    };

    const layoutRef = useRef<HTMLDivElement>(null);
    const openButtons = useRef<(HTMLButtonElement | null)[]>([]);
    const wasOpen = useRef(false);
    const openedFrom = useRef<0 | 1>(0);
    useEffect(() => {
      if (open && !isStatic && layoutRef.current) {
        if (isDate) focusCalendar(layoutRef.current);
        else {
          scrollDigitalClocks(layoutRef.current);
          focusPickerView(layoutRef.current);
        }
      }
      if (!open && wasOpen.current) {
        const active = document.activeElement;
        if (active === null || active === document.body || layoutRef.current?.contains(active))
          openButtons.current[openedFrom.current]?.focus();
      }
      wasOpen.current = open;
    }, [open, isStatic, isDate]);

    const fieldRootRef = useRef<HTMLDivElement>(null);
    const anchor = () =>
      (fieldRootRef.current as HTMLElement).querySelector(
        multiInput ? "[data-ok-date-field]" : "[data-ok-text-field-control]",
      ) as Element;
    const desktopForm = form === "desktop";
    const showToolbar = !desktopVariant;
    const title = isDate
      ? localeText.dateRangePickerToolbarTitle
      : isDateTime
        ? localeText.dateTimeRangePickerToolbarTitle
        : localeText.timeRangePickerToolbarTitle;
    const sideText = (date: Date | null, empty: string) => {
      if (!date) return empty;
      if (isDate) return rangeToolbarText(date, locale, empty);
      const time = formatTimeText(date, timeViews, ampm, locale);
      return isDateTime ? `${rangeToolbarText(date, locale, empty)} ${time}` : time;
    };
    const calendarCount: RangeCalendarCount = isDateTime
      ? 1
      : desktopForm
        ? (calendarsProp ?? defaultRangeCalendars("desktop"))
        : isStatic
          ? (calendarsProp ?? defaultRangeCalendars("static"))
          : 1;
    const timeView: TimeView = isTimeView(view) ? view : ((timeViews[0] ?? "hours") as TimeView);
    const singleColumn = shouldRenderSingleColumn(
      timeViews,
      steps,
      thresholdToRenderTimeInASingleColumn,
    );
    const edited = valid[sideOf(position)];
    const clockProps = {
      value: edited,
      ampm,
      referenceDate: edited ?? valid[0] ?? fallback,
      today,
      readOnly,
      disabled,
      localeText: localeTextProp,
      ...timeValidation,
    };
    const hasDesktopClock =
      !isDate && pickerVariant !== "mobile" && (pickerVariant !== "static" || staticDesktop);
    const hasTimeClock = !isDate && !desktopVariant;
    const shortcutsEnabled = !disabled && !readOnly;

    // View renderers: `null` leaves views out; every view `null` leaves only the field.
    const shownViews = views.filter((v) => viewRenderers?.[v] !== null);
    const fieldOnly = shownViews.length === 0;
    const showCalendar = valueType !== "time" && shownViews.some((v) => !isTimeView(v));
    const showClocks = !isDate && shownViews.some((v) => isTimeView(v));
    const CustomToolbar = slots?.toolbar;
    const toolbar =
      !showToolbar || slotProps?.toolbar?.hidden === true ? null : CustomToolbar ? (
        <CustomToolbar
          {...slotProps?.toolbar}
          value={converter.fromEngine(valid)}
          view={view}
          views={views}
          onViewChange={setView}
          hidden={desktopForm}
          title={title}
          text={`${sideText(valid[0], localeText.start)} – ${sideText(valid[1], localeText.end)}`}
          orientation="portrait"
        />
      ) : (
        <div data-ok-picker-toolbar="" data-ok-range-toolbar="" hidden={desktopForm || undefined}>
          <span data-ok-picker-toolbar-overline="" id={`${id}-toolbar`}>
            {title}
          </span>
          <div data-ok-picker-toolbar-content="">
            {(["start", "end"] as const).map((end, index) => (
              <span key={end} data-ok-picker-toolbar-part="">
                {index > 0 && (
                  <span data-ok-picker-toolbar-separator="" aria-hidden="true">
                    –
                  </span>
                )}
                <button
                  type="button"
                  data-ok-picker-toolbar-button=""
                  data-ok-range-position={end}
                  {...(position === end ? { "data-ok-selected": "" } : {})}
                  aria-pressed={position === end}
                  disabled={disabled}
                  onClick={() => {
                    setPosition(end);
                    setView(firstView);
                  }}
                >
                  {sideText(
                    valid[index] as Date | null,
                    end === "start" ? localeText.start : localeText.end,
                  )}
                </button>
              </span>
            ))}
          </div>
        </div>
      );
    const tabs =
      !isDate && slotProps?.tabs?.hidden !== true ? (
        <Tabs
          data-ok-picker-tabs=""
          data-ok-picker-range-tabs=""
          variant="fullWidth"
          value={position}
          onChange={(tab) => {
            setPosition(tab as RangePosition);
            setView(firstView);
          }}
        >
          <Tab value="start" label={localeText.start} />
          <Tab value="end" label={localeText.end} />
        </Tabs>
      ) : null;
    const shortcutTargets = (shortcuts ?? []).map((shortcut) =>
      rangeShortcutValue(shortcut, valueType, rules),
    );
    const shortcutItems: PickerShortcutItem[] = (shortcuts ?? []).map((shortcut, index) => {
      const target = shortcutTargets[index];
      const usable =
        target !== undefined && rangeError(validateRange(target, valueType, rules)) === null;
      const iso = target ? formatIsoRange(target, valueType) : "";
      return {
        label: shortcut.label,
        id: shortcut.id,
        iso: target ? iso || "/" : null,
        disabled: !usable || !shortcutsEnabled,
      };
    });
    const applyShortcut = (index: number) => {
      const next = shortcutTargets[index];
      if (next === undefined) return;
      change(next);
      accept(next);
      close("shortcut");
    };
    const ShortcutsSlot = slots?.shortcuts ?? PickerShortcuts;
    const ActionBarSlot = slots?.actionBar ?? PickerActionBar;
    const Layout = slots?.layout ?? PickerLayout;
    const layout = (
      <Layout
        toolbar={toolbar}
        tabs={tabs}
        shortcuts={
          shortcutItems.length > 0 ? (
            <ShortcutsSlot
              items={shortcutItems}
              onShortcut={applyShortcut}
              label={localeText.shortcutsLabel}
            />
          ) : null
        }
        content={
          <>
            {showCalendar && (
              <DateRangeCalendar
                id={`${id}-calendar`}
                value={valid}
                onChange={onCalendarChange}
                rangePosition={position}
                onRangePositionChange={isDateTime ? undefined : setPosition}
                availableRangePositions={isDateTime ? [position] : undefined}
                calendars={calendarCount}
                currentMonthCalendarPosition={currentMonthCalendarPosition}
                disableDragEditing={disableDragEditing}
                disableAutoMonthSwitching={disableAutoMonthSwitching}
                referenceDate={referenceDate}
                today={today}
                displayWeekNumber={displayWeekNumber}
                fixedWeekNumber={fixedWeekNumber}
                showDaysOutsideCurrentMonth={showDaysOutsideCurrentMonth}
                disableHighlightToday={disableHighlightToday}
                dayOfWeekFormatter={dayOfWeekFormatter}
                loading={loading}
                renderLoading={renderLoading}
                reduceAnimations={reduceAnimations}
                onMonthChange={onMonthChange}
                readOnly={readOnly}
                disabled={disabled}
                localeText={localeTextProp}
                {...(isDateTime && !desktopForm && isTimeView(view) ? { hidden: true } : {})}
                {...(slots?.day || slots?.leftArrowIcon || slots?.rightArrowIcon
                  ? {
                      slots: {
                        day: slots.day,
                        leftArrowIcon: slots.leftArrowIcon,
                        rightArrowIcon: slots.rightArrowIcon,
                      },
                    }
                  : {})}
                {...(slotProps?.day ? { slotProps: { day: slotProps.day } } : {})}
                {...validation}
              />
            )}
            {showClocks && (
              <>
                {hasDesktopClock &&
                  (singleColumn ? (
                    <DigitalClock
                      id={`${id}-digital-clock`}
                      timeStep={steps.minutes * steps.hours}
                      skipDisabled={skipDisabled}
                      onChange={onTimeChange}
                      hidden={!desktopForm || undefined}
                      {...clockProps}
                    />
                  ) : (
                    <MultiSectionDigitalClock
                      id={`${id}-digital-clock`}
                      views={timeViews}
                      timeSteps={steps}
                      skipDisabled={skipDisabled}
                      onChange={onTimeChange}
                      hidden={!desktopForm || undefined}
                      {...clockProps}
                    />
                  ))}
                {hasTimeClock && (
                  <TimeClock
                    id={`${id}-clock`}
                    views={timeViews}
                    view={timeView}
                    onViewChange={setView}
                    onChange={onTimeChange}
                    hidden={desktopForm || (isDateTime && !isTimeView(view)) || undefined}
                    {...clockProps}
                  />
                )}
              </>
            )}
          </>
        }
        actionBar={
          <ActionBarSlot
            actions={actionList}
            shownActions={actionsShown}
            onAction={runAction}
            disabled={disabled === true}
            readOnly={readOnly === true}
            localeText={localeText}
            hasNextStep={position === "start"}
          />
        }
        orientation="portrait"
        rootRef={layoutRef}
        {...slotProps?.layout}
      />
    );
    const pickerContext: PickerContextValue<DateRange> = {
      value: converter.fromEngine(valid),
      setValue: (next, options) => {
        const engine = converter.toEngine(next) as unknown as DateRange;
        change(engine);
        if (options?.accept) accept(engine);
      },
      open: open && !isStatic,
      setOpen: (next) => (next ? openPicker("api", position) : close("api")),
      view,
      views,
      setView,
      variant: form,
      orientation: "portrait",
      valueType,
      disabled: disabled === true,
      readOnly: readOnly === true,
      locale,
      localeText,
      acceptValueChanges: () => runAction("accept"),
      cancelValueChanges: () => runAction("cancel"),
      clearValue: () => runAction("clear"),
      setValueToToday: () => runAction("today"),
      goToNextStep: () => runAction("nextOrAccept"),
      hasNextStep: position === "start",
      rangePosition: position,
      setRangePosition: setPosition,
    };

    const textOf = (date: Date) =>
      valueType === "time"
        ? formatTimeText(date, timeViews, ampm, locale)
        : isDateTime
          ? `${formatAccessibleDate(date, locale)} ${formatTimeText(date, timeViews, ampm, locale)}`
          : formatAccessibleDate(date, locale);
    const OpenIcon = slots?.openPickerIcon;
    const openButton = (side: 0 | 1 | null) => {
      if (fieldOnly) return null;
      const at: RangePosition = side === 1 ? "end" : "start";
      const name =
        side === null
          ? localeText.openRangePickerDialogue(rangeAccessibleText(valid, textOf))
          : valueType === "time"
            ? localeText.openTimePickerDialogue(valid[side] ? textOf(valid[side]) : null)
            : localeText.openDatePickerDialogue(valid[side] ? textOf(valid[side]) : null);
      return (
        <IconButton
          ref={(node: HTMLButtonElement | null) => {
            openButtons.current[side ?? 0] = node;
          }}
          data-ok-date-picker-open=""
          {...(side === null ? {} : { "data-ok-range-position": at })}
          edge="end"
          aria-label={name}
          aria-haspopup="dialog"
          disabled={disabled || readOnly}
          onClick={() => {
            openedFrom.current = side ?? 0;
            if (open) dismiss("button");
            else openPicker("button", at);
          }}
        >
          {OpenIcon ? <OpenIcon /> : valueType === "time" ? <ClockIcon /> : <CalendarIcon />}
        </IconButton>
      );
    };
    const fieldShared = {
      valueType,
      value: current,
      onChange: (next: DateRange) => change(next),
      onError,
      format,
      views: isDate ? undefined : views,
      ampm: ampmProp,
      today,
      formatDensity,
      readOnly,
      disabled,
      referenceDate,
      autoFocus,
      localeText: localeTextProp,
      helperText,
      error,
      variant,
      size,
      fullWidth,
      required,
      ...validation,
      ...(isDate ? {} : timeValidation),
      onFocus: (event: { target: EventTarget }) => {
        if ((event.target as Element).closest("[data-ok-date-picker-open]")) return;
        if (open && mode === "desktop" && !keepOpenDuringFieldFocus) dismiss("clickaway");
      },
    };
    const hasPopover =
      !fieldOnly && (pickerVariant === "desktop" || pickerVariant === "responsive");
    const hasDialog = !fieldOnly && (pickerVariant === "mobile" || pickerVariant === "responsive");

    return (
      <div
        ref={ref}
        {...dateRangePickerAttributes({
          pickerVariant,
          calendars: calendarsProp,
          displayStaticWrapperAs: isStatic ? displayStaticWrapperAs : undefined,
          disableDragEditing,
          valueType: isDate ? undefined : valueType,
        })}
        {...(closeOnSelect !== undefined
          ? { "data-ok-close-on-select": String(closeOnSelect) }
          : {})}
        {...(keepOpenDuringFieldFocus ? { "data-ok-keep-open-during-field-focus": "" } : {})}
        {...(actionsProp ? { "data-ok-actions": actionsProp.join(" ") } : {})}
        {...(desktopModeMediaQuery
          ? { "data-ok-desktop-mode-media-query": desktopModeMediaQuery }
          : {})}
        {...(open && !isStatic ? { "data-ok-open": "" } : {})}
        {...(explicit ? { "data-ok-locale": locale } : {})}
        data-ok-runtime="off"
        {...props}
      >
        <PickerContext.Provider value={pickerContext}>
          {!isStatic &&
            (multiInput ? (
              <MultiInputRangeField
                ref={fieldRootRef}
                id={id}
                startLabel={startLabel}
                endLabel={endLabel}
                adornments={[openButton(0), openButton(1)]}
                onFieldFocus={(end) => {
                  if (open && mode === "desktop" && keepOpenDuringFieldFocus) setPosition(end);
                }}
                {...fieldShared}
              />
            ) : (
              <SingleInputRangeField
                ref={fieldRootRef}
                id={id}
                label={label}
                clearable={clearable}
                dateSeparator={dateSeparator}
                onClear={onClear}
                selectedSections={selectedSections}
                onSelectedSectionsChange={onSelectedSectionsChange}
                name={name}
                inputRef={inputRef}
                adornments={[openButton(null)]}
                {...fieldShared}
              />
            ))}
          {hasPopover && (
            <Popover
              open={open && mode === "desktop"}
              anchorEl={anchor}
              placement="bottom-start"
              disableAutoFocus
              role="dialog"
              aria-label={title}
              data-ok-date-picker-paper=""
              onOpenChange={(_next, reason) => {
                if (reason === "backdrop" && keepOpenDuringFieldFocus) {
                  setTimeout(() => {
                    if (!fieldRootRef.current?.contains(document.activeElement))
                      dismiss("clickaway");
                  });
                  return;
                }
                dismiss(reason === "escape" ? "escape" : "clickaway");
              }}
            >
              {mode === "desktop" && layout}
            </Popover>
          )}
          {hasDialog && (
            <Dialog
              open={open && mode === "mobile"}
              aria-label={title}
              data-ok-date-picker-dialog=""
              maxWidth="xs"
              onOpenChange={(_next, reason) =>
                dismiss(reason === "escape" ? "escape" : "clickaway")
              }
            >
              {mode === "mobile" && layout}
            </Dialog>
          )}
          {isStatic && layout}
        </PickerContext.Provider>
      </div>
    );
  },
);

/** Props of a range picker family member: the base without the variant (internal). */
export type RangePickerProps = Omit<RangePickerBaseProps, "pickerVariant">;

/** DateRangePicker — spec: specs/components/date-picker.md. A range field with two calendars in a popover (pointer devices) or one in a dialog (touch). */
export const DateRangePicker = forwardRef<HTMLDivElement, DateRangePickerProps>(
  function DateRangePicker(props, ref) {
    return <RangePickerBase ref={ref} pickerVariant="responsive" {...props} />;
  },
);

/** DesktopDateRangePicker — the calendars in a popover. */
export const DesktopDateRangePicker = forwardRef<HTMLDivElement, DateRangePickerProps>(
  function DesktopDateRangePicker(props, ref) {
    return <RangePickerBase ref={ref} pickerVariant="desktop" {...props} />;
  },
);

/** MobileDateRangePicker — one calendar in a dialog, with a toolbar and OK / Cancel. */
export const MobileDateRangePicker = forwardRef<HTMLDivElement, DateRangePickerProps>(
  function MobileDateRangePicker(props, ref) {
    return <RangePickerBase ref={ref} pickerVariant="mobile" {...props} />;
  },
);

export interface StaticDateRangePickerProps
  extends Omit<
    DateRangePickerProps,
    | "open"
    | "onOpenChange"
    | "desktopModeMediaQuery"
    | "keepOpenDuringFieldFocus"
    | "multiInput"
    | "label"
    | "startLabel"
    | "endLabel"
    | "helperText"
    | "error"
    | "variant"
    | "size"
    | "fullWidth"
    | "required"
    | "name"
    | "inputRef"
    | "clearable"
    | "dateSeparator"
    | "onClear"
    | "format"
    | "formatDensity"
    | "selectedSections"
    | "onSelectedSectionsChange"
  > {}

/** StaticDateRangePicker — the picker's layout inline, without a field. */
export const StaticDateRangePicker = forwardRef<HTMLDivElement, StaticDateRangePickerProps>(
  function StaticDateRangePicker(props, ref) {
    return <RangePickerBase ref={ref} pickerVariant="static" {...props} />;
  },
);
