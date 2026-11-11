"use client";

import {
  type DateValidationError,
  type DateView,
  datePickerAttributes,
  defaultCloseOnSelect,
  defaultDateTimePickerActions,
  defaultPickerActions,
  defaultTimePickerActions,
  type FieldApi,
  type FieldSelectedSections,
  focusCalendar,
  focusPickerView,
  formatAccessibleDate,
  formatIsoDate,
  formatTimeText,
  initialPickerView,
  isSamePickerValue,
  isTimeView,
  isValidDate,
  nextPickerView,
  normalizeTimeSteps,
  type PickerAction,
  type PickerButtonPosition,
  type PickerLocaleText,
  type PickerOpenReason,
  type PickerOrientation,
  type PickerShortcut,
  type PickerStaticWrapper,
  type PickerValidationError,
  type PickerValueType,
  type PickerVariant,
  type PickerView,
  pickerToolbarText,
  pickerViewsOf,
  resolveAmpm,
  resolvePickerMode,
  type SelectionControlColor,
  type SelectionControlSize,
  scrollDigitalClocks,
  setDateParts,
  shortcutValue,
  shouldRenderSingleColumn,
  splitViews,
  startOfDay,
  type TextFieldMargin,
  type TextFieldVariant,
  type TimeSteps,
  type TimeView,
  validatePickerValue,
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
import { DateCalendar, type PickerSelectionState } from "../date-calendar/date-calendar.js";
import {
  type DateTimeValidationProps,
  type DateValidationProps,
  dateRules,
  type PickerChangeContext,
  PickerField,
  timeRules,
} from "../date-field/date-field.js";
import { Dialog } from "../dialog/dialog.js";
import { DigitalClock } from "../digital-clock/digital-clock.js";
import { IconButton } from "../icon-button/icon-button.js";
import { usePickerLocalization } from "../localization-provider/localization-provider.js";
import { MultiSectionDigitalClock } from "../multi-section-digital-clock/multi-section-digital-clock.js";
import { Popover } from "../popover/popover.js";
import { Tab, Tabs } from "../tabs/tabs.js";
import { TimeClock } from "../time-clock/time-clock.js";
import { usePickerDateConverter } from "../utils/picker-adapter.js";
import { useControllableState } from "../utils/use-controllable-state.js";
import {
  PickerActionBar,
  PickerContext,
  type PickerContextValue,
  PickerLayout,
  type PickerShortcutItem,
  PickerShortcuts,
  type PickerSlotProps,
  type PickerSlots,
} from "./picker-layout.js";
import { ClockIcon, TimeToolbar } from "./picker-toolbar.js";
import {
  BUILT_IN_RENDERERS,
  type PickerViewRenderer,
  type PickerViewRendererProps,
  type PickerViewRenderers,
} from "./view-renderers.js";

/** Calendar icon of the open button (decorative). */
function CalendarIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M7 2a1 1 0 0 1 1 1v1h8V3a1 1 0 1 1 2 0v1h1a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h1V3a1 1 0 0 1 1-1Zm13 8H4v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9Zm-4 5a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0v-1a1 1 0 0 1 1-1Z"
      />
    </svg>
  );
}

export interface DatePickerProps
  extends DateValidationProps,
    Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue" | "onError"> {
  /** Controlled value. */
  value?: Date | null | undefined;
  /** Uncontrolled initial value. */
  defaultValue?: Date | null | undefined;
  /** Called on every change (typing, picking), with the validation error. */
  onChange?: ((value: Date | null, context: PickerChangeContext) => void) | undefined;
  /** Called when a value is accepted (OK, a pick that closes, a shortcut, closing on desktop). */
  onAccept?: ((value: Date | null) => void) | undefined;
  /** Called when the validation error changes. */
  onError?: ((error: DateValidationError | null, value: Date | null) => void) | undefined;
  /** Controlled open state. */
  open?: boolean | undefined;
  /** Called when the picker asks to open or close, with the reason. */
  onOpenChange?: ((open: boolean, reason: PickerOpenReason) => void) | undefined;
  /** Views. Default `["year", "day"]`. */
  views?: readonly DateView[] | undefined;
  /** The view the picker opens on. */
  openTo?: DateView | undefined;
  /** Controlled view. */
  view?: DateView | undefined;
  /** Called when the view changes. */
  onViewChange?: ((view: DateView) => void) | undefined;
  /** Field format (Day.js tokens). Default: from the views and the locale. */
  format?: string | undefined;
  formatDensity?: "dense" | "spacious" | undefined;
  /** Picking a day closes the picker. Default: desktop only. */
  closeOnSelect?: boolean | undefined;
  /** Action bar buttons. Default: none on desktop, `["cancel", "accept"]` elsewhere. */
  actions?: readonly PickerAction[] | undefined;
  /** Shortcut chips beside the calendar. */
  shortcuts?: readonly PickerShortcut[] | undefined;
  /** Toolbar beside (landscape) or above (portrait) the calendar. Default `"portrait"`. */
  orientation?: PickerOrientation | undefined;
  /**
   * Static pickers: the form shown inline. `"desktop"` has no toolbar or action bar by default and
   * shows the digital clocks. Default `"mobile"`.
   */
  displayStaticWrapperAs?: PickerStaticWrapper | undefined;
  /** Media query that picks the desktop form. Default `"@media (pointer: fine)"`. */
  desktopModeMediaQuery?: string | undefined;
  /** Desktop: the popover stays open while the field has focus. */
  keepOpenDuringFieldFocus?: boolean | undefined;
  /** Calendar props. */
  referenceDate?: Date | undefined;
  /** The date treated as today (the default is the current date). */
  today?: Date | undefined;
  displayWeekNumber?: boolean | undefined;
  fixedWeekNumber?: number | undefined;
  showDaysOutsideCurrentMonth?: boolean | undefined;
  disableHighlightToday?: boolean | undefined;
  /** Formats the weekday headings of the calendar. */
  dayOfWeekFormatter?: ((date: Date) => string) | undefined;
  monthsPerRow?: 3 | 4 | undefined;
  yearsPerRow?: 3 | 4 | undefined;
  yearsOrder?: "asc" | "desc" | undefined;
  loading?: boolean | undefined;
  /** Renders the calendar while `loading` is on. */
  renderLoading?: (() => ReactNode) | undefined;
  reduceAnimations?: boolean | undefined;
  /** Called when the calendar shows another month. */
  onMonthChange?: ((month: Date) => void) | undefined;
  /** Called when the calendar shows another year. */
  onYearChange?: ((year: Date) => void) | undefined;
  /** Field props. */
  clearable?: boolean | undefined;
  /** Side of the clear button. Default `"end"`. */
  clearButtonPosition?: PickerButtonPosition | undefined;
  /** Side of the button that opens the picker. Default `"end"`. */
  openPickerButtonPosition?: PickerButtonPosition | undefined;
  /** Called when the clear button empties the field. */
  onClear?: (() => void) | undefined;
  /**
   * Digit sections keep the format's padding (`D` shows `5`). Default `false`: they always show
   * two digits (`05`).
   */
  shouldRespectLeadingZeros?: boolean | undefined;
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
  /** The field API: `getSections`, `getActiveSectionIndex`, `setSelectedSections`, `focusField`, `isFieldFocused`. */
  fieldRef?: Ref<FieldApi> | undefined;
  /** An `InputAdornment` with `position="start"`, before the field's sections. */
  startAdornment?: ReactNode;
  /** An `InputAdornment` with `position="end"`, after the field's sections (before the buttons). */
  endAdornment?: ReactNode;
  /** The field's label. */
  label?: ReactNode;
  /** Text under the field, such as a hint or an error message. */
  helperText?: ReactNode;
  /** Shows the field in the error state. */
  error?: boolean | undefined;
  /** The field's variant: `outlined`, `filled` or `standard`. */
  variant?: TextFieldVariant | undefined;
  /** The field's size. */
  size?: SelectionControlSize | undefined;
  /** The field's focus color; `default` is the text color. Default `"default"`. */
  color?: SelectionControlColor | undefined;
  /** The field's vertical margin. Default `"none"`. */
  margin?: TextFieldMargin | undefined;
  /** Hide the field's label visually (it still names the field). */
  hiddenLabel?: boolean | undefined;
  /** Show the field's focus colors even when it doesn't have focus. */
  focused?: boolean | undefined;
  /** Stretches the field to the container's width. */
  fullWidth?: boolean | undefined;
  /** Marks the field as required (an asterisk on the label). */
  required?: boolean | undefined;
  /** The name of the hidden input that carries the value in a form. */
  name?: string | undefined;
  /** A ref to the hidden input that carries the value. */
  inputRef?: Ref<HTMLInputElement> | undefined;
  /** Text overrides. */
  localeText?: Partial<PickerLocaleText> | undefined;
  /** Id of the field (other ids derive from it). */
  id?: string | undefined;
  /**
   * Replaced parts (phase 4): `layout`, `toolbar`, `actionBar`, `shortcuts`, `day`, the arrow
   * and open icons. Custom parts read the picker through `usePickerContext()`.
   */
  slots?: PickerSlots | undefined;
  /** Props of the slots: `toolbar.hidden`, `tabs.hidden`, `day` (object or function), `layout`. */
  slotProps?: PickerSlotProps | undefined;
  /**
   * What each view shows (`renderTimeViewClock`, a function of yours), or `null` to leave the
   * view out; every view `null` leaves only the field.
   */
  viewRenderers?: PickerViewRenderers | undefined;
}

/** Time view props of time and date time pickers (MUI, ADR-0026). */
export interface PickerTimeProps {
  /** 12-hour clock with AM / PM. Default: from the locale. */
  ampm?: boolean | undefined;
  /** Steps between the options of the digital clocks. Default `{ hours: 1, minutes: 5, seconds: 5 }`. */
  timeSteps?: TimeSteps | undefined;
  /** Desktop: up to this many options a day render one list (DigitalClock). Default 24. */
  thresholdToRenderTimeInASingleColumn?: number | undefined;
  /** Digital clocks leave out the options that can't be picked. */
  skipDisabled?: boolean | undefined;
}

/** Every prop of the picker family (internal): date, time and date time pickers. */
export interface PickerBaseProps
  extends Omit<
      DatePickerProps,
      "views" | "openTo" | "view" | "onViewChange" | "onChange" | "onError"
    >,
    DateTimeValidationProps,
    PickerTimeProps {
  pickerVariant: PickerVariant;
  valueType?: PickerValueType | undefined;
  views?: readonly PickerView[] | undefined;
  openTo?: PickerView | undefined;
  view?: PickerView | undefined;
  onViewChange?: ((view: PickerView) => void) | undefined;
  onChange?:
    | ((value: Date | null, context: PickerChangeContext<PickerValidationError>) => void)
    | undefined;
  onError?: ((error: PickerValidationError | null, value: Date | null) => void) | undefined;
}

/** The picker family's body: field + popover / dialog, or the static layout. */
export const PickerBase = forwardRef<HTMLDivElement, PickerBaseProps>(function PickerBase(
  {
    pickerVariant,
    valueType = "date",
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
    defaultValue = null,
    onChange,
    onAccept,
    onError,
    open: openProp,
    onOpenChange,
    views: viewsProp,
    openTo,
    view: viewProp,
    onViewChange,
    format,
    formatDensity,
    closeOnSelect,
    actions: actionsProp,
    shortcuts,
    orientation,
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
    monthsPerRow,
    yearsPerRow,
    yearsOrder,
    loading,
    renderLoading,
    reduceAnimations,
    onMonthChange,
    onYearChange,
    clearable,
    clearButtonPosition,
    openPickerButtonPosition,
    onClear,
    shouldRespectLeadingZeros,
    readOnly,
    disabled,
    autoFocus,
    selectedSections,
    onSelectedSectionsChange,
    fieldRef,
    startAdornment,
    endAdornment,
    label,
    helperText,
    error,
    variant,
    size,
    color,
    margin,
    hiddenLabel,
    focused,
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
  const views = pickerViewsOf(viewsProp, valueType);
  const { date: dateViews, time: timeViews } = splitViews(views);
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
  const isStatic = pickerVariant === "static";

  const [current, setCurrent] = useControllableState<Date | null>({
    value,
    defaultValue,
    onChange: undefined,
  });
  const [open, setOpen] = useControllableState<boolean>({
    value: openProp,
    defaultValue: false,
    onChange: undefined,
  });
  const [view, setView] = useControllableState<PickerView>({
    value: viewProp,
    defaultValue: initialPickerView(views, valueType, openTo),
    onChange: onViewChange,
  });
  const [mode, setMode] = useState<"desktop" | "mobile" | "static">(
    isStatic ? "static" : pickerVariant === "mobile" ? "mobile" : "desktop",
  );
  // A static picker shown as desktop lays out the desktop form inline (MUI X).
  const staticDesktop = isStatic && displayStaticWrapperAs === "desktop";
  const form = staticDesktop ? "desktop" : mode;
  const desktopVariant = pickerVariant === "desktop" || staticDesktop;
  const valueOnOpen = useRef<Date | null>(current);
  const lastAccepted = useRef<Date | null>(current);

  const change = (next: Date | null) => {
    if (isSamePickerValue(next, current)) return;
    setCurrent(next);
    onChange?.(next, { validationError: validatePickerValue(next, valueType, rules) });
  };
  const accept = (next: Date | null) => {
    // Static pickers have no "open": Cancel goes back to the last accepted value.
    if (isStatic) valueOnOpen.current = next;
    if (isSamePickerValue(next, lastAccepted.current)) return;
    lastAccepted.current = next;
    onAccept?.(next);
  };
  const close = (reason: PickerOpenReason) => {
    if (!open || isStatic) return;
    setOpen(false);
    onOpenChange?.(false, reason);
  };
  const openPicker = (reason: PickerOpenReason) => {
    // Only the open button opens (it is disabled for disabled and read-only pickers).
    const nextMode = resolvePickerMode(pickerVariant, desktopModeMediaQuery, window);
    setMode(nextMode as "desktop" | "mobile");
    valueOnOpen.current = current;
    setView(initialPickerView(views, valueType, openTo));
    setOpen(true);
    onOpenChange?.(true, reason);
  };

  // Time and date time pickers never close on a pick by default (MUI).
  const effectiveCloseOnSelect = closeOnSelect ?? (isDate ? defaultCloseOnSelect(form) : false);
  // Responsive pickers render the buttons of both forms and hide the other form's.
  let actionList: readonly PickerAction[];
  let actionsShown: readonly PickerAction[];
  if (actionsProp) {
    actionList = actionsProp;
    actionsShown = actionsProp;
  } else if (isDate) {
    actionList = desktopVariant ? [] : ["cancel", "accept"];
    actionsShown = defaultPickerActions(form);
  } else if (isDateTime) {
    actionList =
      pickerVariant === "responsive"
        ? ["cancel", "accept", "nextOrAccept"]
        : defaultDateTimePickerActions(desktopVariant ? "desktop" : "mobile");
    actionsShown = defaultDateTimePickerActions(form);
  } else {
    actionList = defaultTimePickerActions();
    actionsShown = actionList;
  }

  /** The last view of a part finished: move on, or close. */
  const finish = (next: Date | null) => {
    if (isStatic) {
      // Static pickers never close; `closeOnSelect` makes a pick accept the value.
      if (closeOnSelect) accept(next);
      return;
    }
    if (effectiveCloseOnSelect) {
      accept(next);
      close("select");
    }
  };

  const onCalendarChange = (next: Date | null, state: PickerSelectionState) => {
    change(next);
    if (state !== "finish") return;
    // Date time pickers go on to the time (mobile and static forms; desktop shows both).
    if (isDateTime && timeViews.length > 0) {
      if (form !== "desktop") setView(timeViews[0] as TimeView);
      return;
    }
    finish(next);
  };
  const onTimeChange = (next: Date | null, state: PickerSelectionState) => {
    change(next);
    if (state === "finish") finish(next);
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
        change(null);
        accept(null);
        close("clear");
        break;
      case "today": {
        const base = isValidDate(current) ? current : null;
        const now = startOfDay(today ?? new Date());
        const next = base
          ? setDateParts(now, {
              hours: base.getHours(),
              minutes: base.getMinutes(),
              seconds: base.getSeconds(),
            })
          : now;
        change(next);
        accept(next);
        close("today");
        break;
      }
      case "nextOrAccept": {
        const after = nextPickerView(views, view);
        if (after) setView(after);
        else {
          accept(current);
          close("accept");
        }
        break;
      }
    }
  };

  // Dismissing: desktop keeps (accepts) the value, mobile restores it (MUI).
  const dismiss = (reason: PickerOpenReason) => {
    if (mode === "mobile") change(valueOnOpen.current);
    else accept(current);
    close(reason);
  };

  // Focus the first view when the picker opens, and the open button when it closes (unless focus
  // already moved elsewhere, such as into the field).
  const layoutRef = useRef<HTMLDivElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
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
        openButtonRef.current?.focus();
    }
    wasOpen.current = open;
  }, [open, isStatic, isDate]);

  const fieldRootRef = useRef<HTMLDivElement>(null);
  const anchor = () =>
    (fieldRootRef.current as HTMLElement).querySelector("[data-ok-text-field-control]");
  const toolbarId = `${id}-toolbar`;

  const valid = isValidDate(current) ? current : null;
  const base = valid ?? referenceDate ?? startOfDay(today ?? new Date());
  const showToolbar = !desktopVariant;
  const desktopForm = form === "desktop";
  const toolbarHidden = desktopForm;
  const title = isDate
    ? localeText.datePickerToolbarTitle
    : isDateTime
      ? localeText.dateTimePickerToolbarTitle
      : localeText.timePickerToolbarTitle;
  const timeView: TimeView = isTimeView(view) ? view : ((timeViews[0] ?? "hours") as TimeView);
  const dateView: DateView = isTimeView(view)
    ? dateViews.includes("day")
      ? "day"
      : (dateViews.at(-1) as DateView)
    : view;
  const singleColumn = shouldRenderSingleColumn(
    timeViews,
    steps,
    thresholdToRenderTimeInASingleColumn,
  );
  const clockProps = {
    value: valid,
    ampm,
    referenceDate: base,
    today,
    readOnly,
    disabled,
    localeText: localeTextProp,
    ...timeValidation,
  };
  const hasDesktopClock =
    !isDate && pickerVariant !== "mobile" && (pickerVariant !== "static" || staticDesktop);
  const hasTimeClock = !isDate && !desktopVariant;
  // View renderers: `null` leaves a view out; a function replaces the view's default.
  const renderers = viewRenderers ?? {};
  const shownDateViews = dateViews.filter((v) => renderers[v] !== null);
  const shownTimeViews = timeViews.filter((v) => renderers[v] !== null);
  const fieldOnly = shownDateViews.length === 0 && shownTimeViews.length === 0;
  const calendarProps = {
    id: `${id}-calendar`,
    value: valid,
    onChange: onCalendarChange,
    views: dateViews,
    openTo: openTo && !isTimeView(openTo) ? openTo : undefined,
    view: dateView,
    onViewChange: setView,
    referenceDate,
    today,
    displayWeekNumber,
    fixedWeekNumber,
    showDaysOutsideCurrentMonth,
    disableHighlightToday,
    dayOfWeekFormatter,
    monthsPerRow,
    yearsPerRow,
    yearsOrder,
    loading,
    renderLoading,
    reduceAnimations,
    onMonthChange,
    onYearChange,
    readOnly,
    disabled,
    localeText: localeTextProp,
    ...(slots?.day || slots?.leftArrowIcon || slots?.rightArrowIcon || slots?.switchViewIcon
      ? {
          slots: {
            day: slots.day,
            leftArrowIcon: slots.leftArrowIcon,
            rightArrowIcon: slots.rightArrowIcon,
            switchViewIcon: slots.switchViewIcon,
          },
        }
      : {}),
    ...(slotProps?.day ? { slotProps: { day: slotProps.day } } : {}),
    ...(isDateTime && !desktopForm && isTimeView(view) ? { hidden: true } : {}),
    ...validation,
  };
  const dateHidden = isDateTime && !desktopForm && isTimeView(view);
  const timeHidden = isDateTime && !desktopForm && !isTimeView(view);
  const rendererProps = (kind: "date" | "time"): PickerViewRendererProps => ({
    id,
    hidden: kind === "date" ? dateHidden : timeHidden,
    view: kind === "date" ? dateView : timeView,
    views: kind === "date" ? dateViews : timeViews,
    onViewChange: setView,
    value: valid,
    onChange: kind === "date" ? onCalendarChange : onTimeChange,
    calendarProps,
    clockProps,
    timeSteps: steps,
    skipDisabled,
  });
  // Built-in renderers hide themselves; other renderers get a wrapper that does.
  const place = (renderer: PickerViewRenderer, kind: "date" | "time") =>
    BUILT_IN_RENDERERS.has(renderer) ? (
      renderer(rendererProps(kind))
    ) : (
      <div data-ok-picker-view="" hidden={(kind === "date" ? dateHidden : timeHidden) || undefined}>
        {renderer(rendererProps(kind))}
      </div>
    );
  const customDate = renderers[dateView];
  const calendar =
    shownDateViews.length === 0 ? null : customDate ? (
      place(customDate, "date")
    ) : (
      <DateCalendar {...calendarProps} />
    );
  const customTime = shownTimeViews.length > 0 ? renderers[timeView] : undefined;
  const clocks = customTime
    ? place(customTime, "time")
    : shownTimeViews.length > 0 && (
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
              hidden={desktopForm || timeHidden || undefined}
              {...clockProps}
            />
          )}
        </>
      );

  const toolbarText = isDate
    ? pickerToolbarText(valid, locale, localeText.toolbarEmptyText)
    : valid
      ? formatTimeText(valid, timeViews, ampm, locale)
      : localeText.toolbarEmptyText;
  const toolbarOff = slotProps?.toolbar?.hidden === true;
  const CustomToolbar = slots?.toolbar;
  const toolbar =
    !showToolbar || toolbarOff ? null : CustomToolbar ? (
      <CustomToolbar
        {...slotProps?.toolbar}
        value={converter.fromEngine(valid)}
        view={view}
        views={views}
        onViewChange={setView}
        hidden={toolbarHidden}
        title={title}
        text={toolbarText}
        orientation={orientation ?? "portrait"}
      />
    ) : isDate ? (
      <div data-ok-picker-toolbar="" hidden={toolbarHidden || undefined}>
        <span data-ok-picker-toolbar-overline="" id={toolbarId}>
          {localeText.datePickerToolbarTitle}
        </span>
        <span data-ok-picker-toolbar-title="">{toolbarText}</span>
      </div>
    ) : (
      <TimeToolbar
        id={id}
        title={title}
        value={valid}
        base={base}
        views={views}
        view={view}
        ampm={ampm}
        withDate={isDateTime && dateViews.length > 0}
        locale={locale}
        localeText={localeText}
        hidden={toolbarHidden}
        disabled={disabled === true}
        readOnly={readOnly === true}
        onViewChange={setView}
        onMeridiemChange={(next) => change(next)}
      />
    );
  const tabs = isDateTime &&
    showToolbar &&
    slotProps?.tabs?.hidden !== true &&
    shownDateViews.length > 0 &&
    shownTimeViews.length > 0 && (
      <Tabs
        data-ok-picker-tabs=""
        variant="fullWidth"
        value={isTimeView(view) ? "time" : "date"}
        onChange={(tab) => setView(tab === "time" ? (timeViews[0] as TimeView) : dateView)}
        hidden={toolbarHidden || undefined}
      >
        <Tab value="date" icon={<CalendarIcon />} aria-label={localeText.dateTableLabel} />
        <Tab value="time" icon={<ClockIcon />} aria-label={localeText.timeTableLabel} />
      </Tabs>
    );
  const shortcutItems: PickerShortcutItem[] = (shortcuts ?? []).map((shortcut) => {
    const target = shortcutValue(shortcut, rules);
    const usable = target !== undefined && validatePickerValue(target, valueType, rules) === null;
    return {
      label: shortcut.label,
      id: shortcut.id,
      iso: target ? formatIsoDate(target) : null,
      disabled: !usable || disabled === true || readOnly === true,
    };
  });
  const applyShortcut = (index: number) => {
    const next = shortcutValue(shortcuts?.[index] as PickerShortcut, rules);
    if (next === undefined) return;
    change(next);
    accept(next);
    close("shortcut");
  };
  const ShortcutsSlot = slots?.shortcuts ?? PickerShortcuts;
  const shortcutsNode = shortcutItems.length > 0 && (
    <ShortcutsSlot
      items={shortcutItems}
      onShortcut={applyShortcut}
      label={localeText.shortcutsLabel}
    />
  );
  const ActionBarSlot = slots?.actionBar ?? PickerActionBar;
  const hasNextStep = nextPickerView(views, view) !== null;
  const actionBar = (
    <ActionBarSlot
      actions={actionList}
      shownActions={actionsShown}
      onAction={runAction}
      disabled={disabled === true}
      readOnly={readOnly === true}
      localeText={localeText}
      hasNextStep={hasNextStep}
    />
  );
  const Layout = slots?.layout ?? PickerLayout;
  const layout = (
    <Layout
      toolbar={toolbar}
      tabs={tabs || null}
      shortcuts={shortcutsNode || null}
      content={
        <>
          {calendar}
          {clocks}
        </>
      }
      actionBar={actionBar}
      orientation={orientation ?? "portrait"}
      rootRef={layoutRef}
      {...slotProps?.layout}
    />
  );
  const pickerContext: PickerContextValue = {
    value: converter.fromEngine(valid),
    setValue: (next, options) => {
      const engine = converter.toEngine(next) as unknown as Date | null;
      change(engine);
      if (options?.accept) accept(engine);
    },
    open: open && !isStatic,
    setOpen: (next) => (next ? openPicker("api") : close("api")),
    view,
    views,
    setView,
    variant: form,
    orientation: orientation ?? "portrait",
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
    hasNextStep,
  };

  const openLabel =
    valueType === "time"
      ? localeText.openTimePickerDialogue(
          valid ? formatTimeText(valid, timeViews, ampm, locale) : null,
        )
      : localeText.openDatePickerDialogue(
          valid
            ? isDateTime
              ? `${formatAccessibleDate(valid, locale)} ${formatTimeText(valid, timeViews, ampm, locale)}`
              : formatAccessibleDate(valid, locale)
            : null,
        );
  const hasPopover = !fieldOnly && (pickerVariant === "desktop" || pickerVariant === "responsive");
  const hasDialog = !fieldOnly && (pickerVariant === "mobile" || pickerVariant === "responsive");
  const OpenIcon = slots?.openPickerIcon;

  return (
    <div
      ref={ref}
      {...datePickerAttributes({
        pickerVariant,
        orientation,
        displayStaticWrapperAs: isStatic ? displayStaticWrapperAs : undefined,
        keepOpenDuringFieldFocus,
        valueType: isDate ? undefined : valueType,
      })}
      {...(closeOnSelect !== undefined ? { "data-ok-close-on-select": String(closeOnSelect) } : {})}
      {...(actionsProp ? { "data-ok-actions": actionsProp.join(" ") } : {})}
      {...(!isDate && openTo && views.includes(openTo) ? { "data-ok-open-to": openTo } : {})}
      {...(desktopModeMediaQuery
        ? { "data-ok-desktop-mode-media-query": desktopModeMediaQuery }
        : {})}
      {...(open && !isStatic ? { "data-ok-open": "" } : {})}
      {...(explicit ? { "data-ok-locale": locale } : {})}
      data-ok-runtime="off"
      {...props}
    >
      <PickerContext.Provider value={pickerContext}>
        {!isStatic && (
          <PickerField
            ref={fieldRootRef}
            valueType={valueType}
            id={id}
            value={current}
            onChange={(next) => change(next)}
            onError={onError}
            format={format}
            views={views}
            ampm={ampmProp}
            today={today}
            formatDensity={formatDensity}
            clearable={clearable}
            clearButtonPosition={clearButtonPosition}
            openPickerButtonPosition={openPickerButtonPosition}
            onClear={onClear}
            shouldRespectLeadingZeros={shouldRespectLeadingZeros}
            readOnly={readOnly}
            disabled={disabled}
            referenceDate={referenceDate}
            autoFocus={autoFocus}
            selectedSections={selectedSections}
            onSelectedSectionsChange={onSelectedSectionsChange}
            fieldRef={fieldRef}
            startAdornment={startAdornment}
            endAdornment={endAdornment}
            localeText={localeTextProp}
            label={label}
            helperText={helperText}
            error={error}
            variant={variant}
            size={size}
            color={color}
            margin={margin}
            hiddenLabel={hiddenLabel}
            focused={focused}
            fullWidth={fullWidth}
            required={required}
            name={name}
            inputRef={inputRef}
            {...validation}
            {...(isDate ? {} : timeValidation)}
            openButton={
              !fieldOnly && (
                <IconButton
                  ref={openButtonRef}
                  data-ok-date-picker-open=""
                  edge={openPickerButtonPosition === "start" ? "start" : "end"}
                  aria-label={openLabel}
                  aria-haspopup="dialog"
                  disabled={disabled || readOnly}
                  onClick={() => (open ? dismiss("button") : openPicker("button"))}
                >
                  {OpenIcon ? (
                    <OpenIcon />
                  ) : valueType === "time" ? (
                    <ClockIcon />
                  ) : (
                    <CalendarIcon />
                  )}
                </IconButton>
              )
            }
            onFocus={(event) => {
              // The open button toggles on its own click.
              if ((event.target as Element).closest("[data-ok-date-picker-open]")) return;
              if (open && mode === "desktop" && !keepOpenDuringFieldFocus) dismiss("clickaway");
            }}
          />
        )}
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
                // A press on the field keeps the picker open: check where focus went.
                setTimeout(() => {
                  if (!fieldRootRef.current?.contains(document.activeElement)) dismiss("clickaway");
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
            onOpenChange={(_next, reason) => dismiss(reason === "escape" ? "escape" : "clickaway")}
          >
            {mode === "mobile" && layout}
          </Dialog>
        )}
        {isStatic && layout}
      </PickerContext.Provider>
    </div>
  );
});

/** DatePicker — spec: specs/components/date-picker.md. A date field with a calendar in a popover (pointer devices) or a dialog (touch). */
export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  function DatePicker(props, ref) {
    return <PickerBase ref={ref} pickerVariant="responsive" {...(props as PickerProps)} />;
  },
);

/** DesktopDatePicker — the calendar in a popover. */
export const DesktopDatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  function DesktopDatePicker(props, ref) {
    return <PickerBase ref={ref} pickerVariant="desktop" {...(props as PickerProps)} />;
  },
);

/** MobileDatePicker — the calendar in a dialog, with a toolbar and OK / Cancel. */
export const MobileDatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  function MobileDatePicker(props, ref) {
    return <PickerBase ref={ref} pickerVariant="mobile" {...(props as PickerProps)} />;
  },
);

/** Props of a picker family member: the base without the variant (internal). */
export type PickerProps = Omit<PickerBaseProps, "pickerVariant">;

export interface StaticDatePickerProps
  extends Omit<
    DatePickerProps,
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
    | "clearButtonPosition"
    | "openPickerButtonPosition"
    | "onClear"
    | "shouldRespectLeadingZeros"
    | "format"
    | "formatDensity"
    | "selectedSections"
    | "onSelectedSectionsChange"
    | "fieldRef"
    | "startAdornment"
    | "endAdornment"
    | "color"
    | "margin"
    | "hiddenLabel"
    | "focused"
  > {}

/** StaticDatePicker — the picker's layout inline, without a field. */
export const StaticDatePicker = forwardRef<HTMLDivElement, StaticDatePickerProps>(
  function StaticDatePicker(props, ref) {
    return <PickerBase ref={ref} pickerVariant="static" {...(props as PickerProps)} />;
  },
);
