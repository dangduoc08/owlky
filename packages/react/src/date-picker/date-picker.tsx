"use client";

import {
  type DateValidationError,
  type DateView,
  datePickerAttributes,
  defaultCloseOnSelect,
  defaultPickerActions,
  focusCalendar,
  formatAccessibleDate,
  formatIsoDate,
  initialView,
  isSamePickerValue,
  isValidDate,
  nextView,
  normalizeDateViews,
  type PickerAction,
  type PickerLocaleText,
  type PickerOpenReason,
  type PickerOrientation,
  type PickerShortcut,
  type PickerVariant,
  pickerToolbarText,
  resolvePickerMode,
  type SelectionControlSize,
  setDateParts,
  shortcutValue,
  startOfDay,
  type TextFieldVariant,
  validateDate,
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
import { Button } from "../button/button.js";
import { Chip } from "../chip/chip.js";
import { DateCalendar, type PickerSelectionState } from "../date-calendar/date-calendar.js";
import {
  DateField,
  type DateValidationProps,
  dateRules,
  type PickerChangeContext,
} from "../date-field/date-field.js";
import { Dialog } from "../dialog/dialog.js";
import { IconButton } from "../icon-button/icon-button.js";
import { usePickerLocalization } from "../localization-provider/localization-provider.js";
import { Popover } from "../popover/popover.js";
import { useControllableState } from "../utils/use-controllable-state.js";

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
  /** Media query that picks the desktop form. Default `"@media (pointer: fine)"`. */
  desktopModeMediaQuery?: string | undefined;
  /** Desktop: the popover stays open while the field has focus. */
  keepOpenDuringFieldFocus?: boolean | undefined;
  /** Calendar props. */
  referenceDate?: Date | undefined;
  today?: Date | undefined;
  displayWeekNumber?: boolean | undefined;
  fixedWeekNumber?: number | undefined;
  showDaysOutsideCurrentMonth?: boolean | undefined;
  disableHighlightToday?: boolean | undefined;
  dayOfWeekFormatter?: ((date: Date) => string) | undefined;
  monthsPerRow?: 3 | 4 | undefined;
  yearsPerRow?: 3 | 4 | undefined;
  yearsOrder?: "asc" | "desc" | undefined;
  loading?: boolean | undefined;
  renderLoading?: (() => ReactNode) | undefined;
  reduceAnimations?: boolean | undefined;
  onMonthChange?: ((month: Date) => void) | undefined;
  onYearChange?: ((year: Date) => void) | undefined;
  /** Field props. */
  clearable?: boolean | undefined;
  onClear?: (() => void) | undefined;
  readOnly?: boolean | undefined;
  disabled?: boolean | undefined;
  autoFocus?: boolean | undefined;
  selectedSections?: number | null | undefined;
  onSelectedSectionsChange?: ((section: number | null) => void) | undefined;
  label?: ReactNode;
  helperText?: ReactNode;
  error?: boolean | undefined;
  variant?: TextFieldVariant | undefined;
  size?: SelectionControlSize | undefined;
  fullWidth?: boolean | undefined;
  required?: boolean | undefined;
  name?: string | undefined;
  inputRef?: Ref<HTMLInputElement> | undefined;
  /** Text overrides. */
  localeText?: Partial<PickerLocaleText> | undefined;
  /** Id of the field (other ids derive from it). */
  id?: string | undefined;
}

interface PickerVariantProps extends DatePickerProps {
  pickerVariant: PickerVariant;
}

/** The DatePicker family's body: field + popover / dialog, or the static layout. */
const PickerBase = forwardRef<HTMLDivElement, PickerVariantProps>(function PickerBase(
  {
    pickerVariant,
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
    onClear,
    readOnly,
    disabled,
    autoFocus,
    selectedSections,
    onSelectedSectionsChange,
    label,
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
    ...props
  },
  ref,
) {
  const { locale, localeText, explicit } = usePickerLocalization(localeTextProp);
  const generated = useId();
  const id = idProp ?? generated;
  const views = normalizeDateViews(viewsProp);
  const validation = {
    minDate,
    maxDate,
    disablePast,
    disableFuture,
    shouldDisableDate,
    shouldDisableMonth,
    shouldDisableYear,
  };
  const rules = { ...dateRules(validation), today: today ? startOfDay(today) : undefined };
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
  const [view, setView] = useControllableState<DateView>({
    value: viewProp,
    defaultValue: initialView(views, openTo),
    onChange: onViewChange,
  });
  const [mode, setMode] = useState<"desktop" | "mobile" | "static">(
    isStatic ? "static" : pickerVariant === "mobile" ? "mobile" : "desktop",
  );
  const valueOnOpen = useRef<Date | null>(current);
  const lastAccepted = useRef<Date | null>(current);

  const change = (next: Date | null) => {
    if (isSamePickerValue(next, current)) return;
    setCurrent(next);
    onChange?.(next, { validationError: validateDate(next, rules) });
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
    setView(initialView(views, openTo));
    setOpen(true);
    onOpenChange?.(true, reason);
  };

  const effectiveCloseOnSelect = closeOnSelect ?? defaultCloseOnSelect(mode);
  // Responsive pickers render the mobile buttons and hide them in the desktop form.
  const actionList: readonly PickerAction[] =
    actionsProp ?? (pickerVariant === "desktop" ? [] : ["cancel", "accept"]);
  const actionsShown = actionsProp ?? defaultPickerActions(mode);

  const onCalendarChange = (next: Date | null, state: PickerSelectionState) => {
    change(next);
    if (state !== "finish") return;
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
        const after = nextView(views, view);
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

  // Focus the calendar when the picker opens, and the open button when it closes (unless focus
  // already moved elsewhere, such as into the field).
  const layoutRef = useRef<HTMLDivElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !isStatic && layoutRef.current) focusCalendar(layoutRef.current);
    if (!open && wasOpen.current) {
      const active = document.activeElement;
      if (active === null || active === document.body || layoutRef.current?.contains(active))
        openButtonRef.current?.focus();
    }
    wasOpen.current = open;
  }, [open, isStatic]);

  const fieldRootRef = useRef<HTMLDivElement>(null);
  const anchor = () =>
    (fieldRootRef.current as HTMLElement).querySelector("[data-ok-text-field-control]");
  const toolbarId = `${id}-toolbar`;

  const valid = isValidDate(current) ? current : null;
  const showToolbar = pickerVariant !== "desktop";
  const toolbarHidden = mode === "desktop";
  const layout = (
    <div ref={layoutRef} data-ok-picker-layout="" data-ok-orientation={orientation ?? "portrait"}>
      {showToolbar && (
        <div data-ok-picker-toolbar="" hidden={toolbarHidden || undefined}>
          <span data-ok-picker-toolbar-overline="" id={toolbarId}>
            {localeText.datePickerToolbarTitle}
          </span>
          <span data-ok-picker-toolbar-title="">
            {pickerToolbarText(valid, locale, localeText.toolbarEmptyText)}
          </span>
        </div>
      )}
      {shortcuts && shortcuts.length > 0 && (
        <ul data-ok-picker-shortcuts="" aria-label={localeText.shortcutsLabel}>
          {shortcuts.map((shortcut) => {
            const target = shortcutValue(shortcut, rules);
            const usable = target !== undefined && validateDate(target, rules) === null;
            return (
              <li key={shortcut.id ?? shortcut.label}>
                <Chip
                  label={shortcut.label}
                  data-ok-picker-shortcut=""
                  {...(target ? { "data-ok-value": formatIsoDate(target) } : {})}
                  disabled={!usable || disabled || readOnly}
                  onClick={() => {
                    const next = shortcutValue(shortcut, rules);
                    if (next === undefined) return;
                    change(next);
                    accept(next);
                    close("shortcut");
                  }}
                />
              </li>
            );
          })}
        </ul>
      )}
      <div data-ok-picker-content="">
        <DateCalendar
          id={`${id}-calendar`}
          value={valid}
          onChange={onCalendarChange}
          views={views}
          openTo={openTo}
          view={view}
          onViewChange={setView}
          referenceDate={referenceDate}
          today={today}
          displayWeekNumber={displayWeekNumber}
          fixedWeekNumber={fixedWeekNumber}
          showDaysOutsideCurrentMonth={showDaysOutsideCurrentMonth}
          disableHighlightToday={disableHighlightToday}
          dayOfWeekFormatter={dayOfWeekFormatter}
          monthsPerRow={monthsPerRow}
          yearsPerRow={yearsPerRow}
          yearsOrder={yearsOrder}
          loading={loading}
          renderLoading={renderLoading}
          reduceAnimations={reduceAnimations}
          onMonthChange={onMonthChange}
          onYearChange={onYearChange}
          readOnly={readOnly}
          disabled={disabled}
          localeText={localeTextProp}
          {...validation}
        />
      </div>
      {actionList.length > 0 && (
        <div data-ok-picker-actions="" hidden={actionsShown.length === 0 || undefined}>
          {actionList.map((action) => (
            <Button
              key={action}
              data-ok-picker-action={action}
              variant={action === "accept" || action === "nextOrAccept" ? "contained" : "text"}
              color="inherit"
              hidden={!actionsShown.includes(action) || undefined}
              disabled={disabled || (readOnly && action !== "cancel")}
              onClick={() => runAction(action)}
            >
              {action === "accept"
                ? localeText.okButtonLabel
                : action === "cancel"
                  ? localeText.cancelButtonLabel
                  : action === "clear"
                    ? localeText.clearButtonLabel
                    : action === "today"
                      ? localeText.todayButtonLabel
                      : nextView(views, view)
                        ? localeText.nextStepButtonLabel
                        : localeText.okButtonLabel}
            </Button>
          ))}
        </div>
      )}
    </div>
  );

  const openLabel = localeText.openDatePickerDialogue(
    valid ? formatAccessibleDate(valid, locale) : null,
  );
  const hasPopover = pickerVariant === "desktop" || pickerVariant === "responsive";
  const hasDialog = pickerVariant === "mobile" || pickerVariant === "responsive";

  return (
    <div
      ref={ref}
      {...datePickerAttributes({ pickerVariant, orientation, keepOpenDuringFieldFocus })}
      {...(closeOnSelect !== undefined ? { "data-ok-close-on-select": String(closeOnSelect) } : {})}
      {...(actionsProp ? { "data-ok-actions": actionsProp.join(" ") } : {})}
      {...(desktopModeMediaQuery
        ? { "data-ok-desktop-mode-media-query": desktopModeMediaQuery }
        : {})}
      {...(open && !isStatic ? { "data-ok-open": "" } : {})}
      {...(explicit ? { "data-ok-locale": locale } : {})}
      data-ok-runtime="off"
      {...props}
    >
      {!isStatic && (
        <DateField
          ref={fieldRootRef}
          id={id}
          value={current}
          onChange={(next) => change(next)}
          onError={onError}
          format={format}
          views={views}
          formatDensity={formatDensity}
          clearable={clearable}
          onClear={onClear}
          readOnly={readOnly}
          disabled={disabled}
          referenceDate={referenceDate}
          autoFocus={autoFocus}
          selectedSections={selectedSections}
          onSelectedSectionsChange={onSelectedSectionsChange}
          localeText={localeTextProp}
          label={label}
          helperText={helperText}
          error={error}
          variant={variant}
          size={size}
          fullWidth={fullWidth}
          required={required}
          name={name}
          inputRef={inputRef}
          {...validation}
          endAdornment={
            <IconButton
              ref={openButtonRef}
              data-ok-date-picker-open=""
              edge="end"
              aria-label={openLabel}
              aria-haspopup="dialog"
              disabled={disabled || readOnly}
              onClick={() => (open ? dismiss("button") : openPicker("button"))}
            >
              <CalendarIcon />
            </IconButton>
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
          aria-label={localeText.datePickerToolbarTitle}
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
          aria-label={localeText.datePickerToolbarTitle}
          data-ok-date-picker-dialog=""
          maxWidth="xs"
          onOpenChange={(_next, reason) => dismiss(reason === "escape" ? "escape" : "clickaway")}
        >
          {mode === "mobile" && layout}
        </Dialog>
      )}
      {isStatic && layout}
    </div>
  );
});

/** DatePicker — spec: specs/components/date-picker.md. A date field with a calendar in a popover (pointer devices) or a dialog (touch). */
export const DatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  function DatePicker(props, ref) {
    return <PickerBase ref={ref} pickerVariant="responsive" {...props} />;
  },
);

/** DesktopDatePicker — the calendar in a popover. */
export const DesktopDatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  function DesktopDatePicker(props, ref) {
    return <PickerBase ref={ref} pickerVariant="desktop" {...props} />;
  },
);

/** MobileDatePicker — the calendar in a dialog, with a toolbar and OK / Cancel. */
export const MobileDatePicker = forwardRef<HTMLDivElement, DatePickerProps>(
  function MobileDatePicker(props, ref) {
    return <PickerBase ref={ref} pickerVariant="mobile" {...props} />;
  },
);

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
    | "onClear"
    | "format"
    | "formatDensity"
    | "selectedSections"
    | "onSelectedSectionsChange"
  > {}

/** StaticDatePicker — the picker's layout inline, without a field. */
export const StaticDatePicker = forwardRef<HTMLDivElement, StaticDatePickerProps>(
  function StaticDatePicker(props, ref) {
    return <PickerBase ref={ref} pickerVariant="static" {...props} />;
  },
);
