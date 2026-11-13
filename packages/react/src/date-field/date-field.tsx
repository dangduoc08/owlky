"use client";

import {
  closeLinear,
  createFieldApi,
  createFieldController,
  type DateRules,
  type DateValidationError,
  type DateView,
  dateFieldAttributes,
  defaultPickerFormat,
  type FieldApi,
  type FieldController,
  type FieldSelectedSections,
  type FormatSection,
  fieldSections,
  formatIsoDate,
  formatIsoDateTime,
  formatIsoTime,
  isSamePickerValue,
  isValidDate,
  type PickerButtonPosition,
  type PickerLocaleText,
  type PickerValidationError,
  type PickerValueType,
  type PickerView,
  pickerValueIso,
  pickerViewsOf,
  resolveAmpm,
  resolveSelectedSection,
  type SelectionControlColor,
  type SelectionControlSize,
  sectionAria,
  sectionLabel,
  sectionPlaceholder,
  sectionsToDate,
  sectionValues,
  startOfDay,
  type TextFieldMargin,
  type TextFieldVariant,
  type TimeRules,
  type TimeView,
  textFieldAttributes,
  validatePickerValue,
} from "@owlky/core";
import {
  type CSSProperties,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { IconButton } from "../icon-button/icon-button.js";
import { usePickerLocalization } from "../localization-provider/localization-provider.js";
import { InputAdornment } from "../text-field/text-field.js";
import { Icon } from "../utils/icon.js";
import { useMergedRefs } from "../utils/refs.js";
import { useControllableState } from "../utils/use-controllable-state.js";

/** Value change details: why the new value is invalid, or `null`. */
export interface PickerChangeContext<E extends PickerValidationError = DateValidationError> {
  validationError: E | null;
}

/** Time rules shared by time fields, clocks and pickers (MUI props, ADR-0026). */
export interface TimeValidationProps {
  /** Earliest valid time (only the time of day counts, unless `disableIgnoringDatePartForTimeValidation`). */
  minTime?: Date | undefined;
  /** Latest valid time. */
  maxTime?: Date | undefined;
  /** Minutes must be a multiple of this. Default 1. */
  minutesStep?: number | undefined;
  /** Times that can't be picked, per view. */
  shouldDisableTime?: ((value: Date, view: TimeView) => boolean) | undefined;
  /** `minTime` / `maxTime` compare the whole date. */
  disableIgnoringDatePartForTimeValidation?: boolean | undefined;
  /** Times before now are invalid. */
  disablePast?: boolean | undefined;
  /** Times after now are invalid. */
  disableFuture?: boolean | undefined;
}

/** Date time rules (MUI props): the date and time rules plus whole date time limits. */
export interface DateTimeValidationProps extends DateValidationProps, TimeValidationProps {
  /** Earliest valid date and time. */
  minDateTime?: Date | undefined;
  /** Latest valid date and time. */
  maxDateTime?: Date | undefined;
}

/** The time rules object core expects, from the props; `now` pins "now". */
export const timeRules = (
  props: TimeValidationProps & { minDateTime?: Date | undefined; maxDateTime?: Date | undefined },
  now?: Date,
): TimeRules => ({
  minTime: props.minTime,
  maxTime: props.maxTime,
  minDateTime: props.minDateTime,
  maxDateTime: props.maxDateTime,
  minutesStep: props.minutesStep,
  shouldDisableTime: props.shouldDisableTime,
  disableIgnoringDatePartForTimeValidation: props.disableIgnoringDatePartForTimeValidation,
  disablePast: props.disablePast,
  disableFuture: props.disableFuture,
  now,
});

/** HTML parity: the declarative time rules as attributes. */
export const timeRuleAttributes = (
  props: TimeValidationProps & { minDateTime?: Date | undefined; maxDateTime?: Date | undefined },
): Record<string, string> => ({
  ...(isValidDate(props.minTime) ? { "data-ok-min-time": formatIsoTime(props.minTime) } : {}),
  ...(isValidDate(props.maxTime) ? { "data-ok-max-time": formatIsoTime(props.maxTime) } : {}),
  ...(isValidDate(props.minDateTime)
    ? { "data-ok-min-date-time": formatIsoDateTime(props.minDateTime) }
    : {}),
  ...(isValidDate(props.maxDateTime)
    ? { "data-ok-max-date-time": formatIsoDateTime(props.maxDateTime) }
    : {}),
  ...(props.minutesStep !== undefined && props.minutesStep > 1
    ? { "data-ok-minutes-step": String(Math.trunc(props.minutesStep)) }
    : {}),
  ...(props.disableIgnoringDatePartForTimeValidation
    ? { "data-ok-disable-ignoring-date-part-for-time-validation": "" }
    : {}),
});

/** What a picker's value holds (ADR-0026). */
export type { PickerValueType };

/** ISO 8601 text of a value. */
export const isoOf = pickerValueIso;

/** Date rules shared by fields, calendars and pickers (MUI props). */
export interface DateValidationProps {
  /** Earliest valid day. Default 1 January 1900. */
  minDate?: Date | undefined;
  /** Latest valid day. Default 31 December 2099. */
  maxDate?: Date | undefined;
  /** Days before today are invalid. */
  disablePast?: boolean | undefined;
  /** Days after today are invalid. */
  disableFuture?: boolean | undefined;
  /** Days that can't be picked. */
  shouldDisableDate?: ((day: Date) => boolean) | undefined;
  /** Months that can't be picked (gets the first day of the month). */
  shouldDisableMonth?: ((month: Date) => boolean) | undefined;
  /** Years that can't be picked (gets 1 January). */
  shouldDisableYear?: ((year: Date) => boolean) | undefined;
}

/** The rules object core expects, from the props. */
export const dateRules = (props: DateValidationProps): DateRules => ({
  minDate: props.minDate,
  maxDate: props.maxDate,
  disablePast: props.disablePast,
  disableFuture: props.disableFuture,
  shouldDisableDate: props.shouldDisableDate,
  shouldDisableMonth: props.shouldDisableMonth,
  shouldDisableYear: props.shouldDisableYear,
});

/** HTML parity: the declarative rules as attributes (functions have no attribute). */
export const ruleAttributes = (props: DateValidationProps): Record<string, string> => ({
  ...(props.minDate && isValidDate(props.minDate)
    ? { "data-ok-min-date": formatIsoDate(props.minDate) }
    : {}),
  ...(props.maxDate && isValidDate(props.maxDate)
    ? { "data-ok-max-date": formatIsoDate(props.maxDate) }
    : {}),
  ...(props.disablePast ? { "data-ok-disable-past": "" } : {}),
  ...(props.disableFuture ? { "data-ok-disable-future": "" } : {}),
});

/** Clear icon (decorative). */
function ClearIcon() {
  return <Icon icon={closeLinear} />;
}

export interface DateFieldProps
  extends DateValidationProps,
    Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue" | "onError"> {
  /** Controlled value (`null`: empty; an invalid date: partly filled). */
  value?: Date | null | undefined;
  /** Uncontrolled initial value. */
  defaultValue?: Date | null | undefined;
  /** Called with the new value and why it's invalid (if it is). */
  onChange?: ((value: Date | null, context: PickerChangeContext) => void) | undefined;
  /** Called when the validation error changes. */
  onError?: ((error: DateValidationError | null, value: Date | null) => void) | undefined;
  /** Sections and their order (Day.js tokens). Default: from `views` and the locale. */
  format?: string | undefined;
  /** Views whose default format to use when there's no `format`. Default `["year", "day"]`. */
  views?: readonly DateView[] | undefined;
  /** `spacious` puts spaces around the separators. Default `"dense"`. */
  formatDensity?: "dense" | "spacious" | undefined;
  /** A clear button at the end. */
  clearable?: boolean | undefined;
  /** Side of the clear button. Default `"end"`. */
  clearButtonPosition?: PickerButtonPosition | undefined;
  /** Called when the clear button empties the field. */
  onClear?: (() => void) | undefined;
  /**
   * Digit sections keep the format's padding (`D` shows `5`). Default `false`: they always show
   * two digits (`05`).
   */
  shouldRespectLeadingZeros?: boolean | undefined;
  /** The value can't be changed. */
  readOnly?: boolean | undefined;
  /** Turns the field off. */
  disabled?: boolean | undefined;
  /** Empty sections take this date's parts on ArrowUp / ArrowDown. Default: today. */
  referenceDate?: Date | undefined;
  /** Focuses the first section on mount. */
  autoFocus?: boolean | undefined;
  /**
   * The selected section (controlled): its index, the first section of a type (`"day"`), every
   * section (`"all"`), or `null` for none.
   */
  selectedSections?: FieldSelectedSections | undefined;
  /** Called when another section gets focus (its index), or every section is selected (`"all"`). */
  onSelectedSectionsChange?: ((section: FieldSelectedSections) => void) | undefined;
  /** The field API: `getSections`, `getActiveSectionIndex`, `setSelectedSections`, `focusField`, `isFieldFocused`. */
  fieldRef?: Ref<FieldApi> | undefined;
  /** Text overrides for this field. */
  localeText?: Partial<PickerLocaleText> | undefined;
  /** TextField props. */
  label?: ReactNode;
  /** Text under the field, such as a hint or an error message. */
  helperText?: ReactNode;
  /** Error colors; default: the value is invalid. */
  error?: boolean | undefined;
  /** The field's variant: `outlined`, `filled` or `standard`. */
  variant?: TextFieldVariant | undefined;
  /** The field's size. */
  size?: SelectionControlSize | undefined;
  /** Focus color; `default` is the text color. Default `"default"`. */
  color?: SelectionControlColor | undefined;
  /** Vertical margin. Default `"none"`. */
  margin?: TextFieldMargin | undefined;
  /** Hide the label visually (it still names the field); the field is laid out as without one. */
  hiddenLabel?: boolean | undefined;
  /** Show the focus colors even when the field doesn't have focus. */
  focused?: boolean | undefined;
  /** Stretches the field to the container's width. */
  fullWidth?: boolean | undefined;
  /** Marks the field as required (an asterisk on the label). */
  required?: boolean | undefined;
  /** Form field name (a hidden input carries the ISO value). */
  name?: string | undefined;
  /** The hidden input. */
  inputRef?: Ref<HTMLInputElement> | undefined;
  /** Id of the sections group (other ids derive from it). */
  id?: string | undefined;
  /** An `InputAdornment` with `position="start"`, before the sections. */
  startAdornment?: ReactNode;
  /** An `InputAdornment` with `position="end"`, after the sections (before the buttons). */
  endAdornment?: ReactNode;
}

/** Display text of a section: its value, or its placeholder. */
const display = (value: string | undefined, placeholder: string) => (value ? value : placeholder);

/** Props of the field shared by DateField, TimeField and DateTimeField (internal). */
export interface PickerFieldProps
  extends Omit<DateFieldProps, "views" | "onChange" | "onError">,
    DateTimeValidationProps {
  valueType: PickerValueType;
  views?: readonly PickerView[] | undefined;
  /** 12-hour clock in the default format. Default: from the locale. */
  ampm?: boolean | undefined;
  /** "Now" for `disablePast` / `disableFuture` on times (tests and demos). */
  today?: Date | undefined;
  onChange?:
    | ((value: Date | null, context: PickerChangeContext<PickerValidationError>) => void)
    | undefined;
  onError?: ((error: PickerValidationError | null, value: Date | null) => void) | undefined;
  /** A picker's open button (internal). */
  openButton?: ReactNode;
  /** Side of the open button. Default `"end"`. */
  openPickerButtonPosition?: PickerButtonPosition | undefined;
}

/**
 * DateField — spec: specs/components/date-picker.md. A TextField whose input is a group of
 * spinbutton sections (month, day, year…) edited with the keyboard; core's
 * `createFieldController` turns keys, typing and paste into new section texts.
 */
export const DateField = forwardRef<HTMLDivElement, DateFieldProps>(function DateField(props, ref) {
  return (
    <PickerField ref={ref} valueType="date" {...(props as Omit<PickerFieldProps, "valueType">)} />
  );
});

/** The sectioned field of every value type (DateField, TimeField, DateTimeField). */
export const PickerField = forwardRef<HTMLDivElement, PickerFieldProps>(function PickerField(
  {
    valueType,
    ampm: ampmProp,
    today,
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
    onError,
    format: formatProp,
    views,
    formatDensity,
    clearable,
    clearButtonPosition,
    openPickerButtonPosition,
    onClear,
    shouldRespectLeadingZeros,
    readOnly = false,
    disabled = false,
    referenceDate,
    autoFocus,
    selectedSections,
    onSelectedSectionsChange,
    fieldRef,
    localeText: localeTextProp,
    label,
    helperText,
    error: errorProp,
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
    id: idProp,
    startAdornment,
    endAdornment,
    openButton,
    minDate,
    maxDate,
    disablePast,
    disableFuture,
    shouldDisableDate,
    shouldDisableMonth,
    shouldDisableYear,
    className,
    style,
    ...props
  },
  ref,
) {
  const { locale, localeText, explicit } = usePickerLocalization(localeTextProp);
  const generated = useId();
  const id = idProp ?? generated;
  const ampm = resolveAmpm(ampmProp, locale);
  const format =
    formatProp ?? defaultPickerFormat(pickerViewsOf(views, valueType), valueType, ampm, locale);
  const sections = useMemo<FormatSection[]>(
    () => fieldSections(format, shouldRespectLeadingZeros),
    [format, shouldRespectLeadingZeros],
  );
  const timeProps = {
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
    ...dateRules({
      minDate,
      maxDate,
      disablePast,
      disableFuture,
      shouldDisableDate,
      shouldDisableMonth,
      shouldDisableYear,
    }),
    ...timeRules(timeProps, today),
    ...(today ? { today: startOfDay(today) } : {}),
  };
  const validate = (date: Date | null) => validatePickerValue(date, valueType, rules);

  const [current, setCurrent] = useControllableState<Date | null>({
    value,
    defaultValue,
    onChange: undefined,
  });
  const [texts, setTexts] = useState<string[]>(() => sectionValues(current, sections, locale));
  // The value the texts stand for: a new outside value (or format) resets the texts.
  const shown = useRef<{ value: Date | null; format: string; locale: string }>({
    value: current,
    format: `${format}\u0000${shouldRespectLeadingZeros === true}`,
    locale,
  });
  // The texts depend on the format and on the padding of its digit sections.
  const layout = `${format}\u0000${shouldRespectLeadingZeros === true}`;
  if (
    !isSamePickerValue(shown.current.value, current) ||
    shown.current.format !== layout ||
    shown.current.locale !== locale
  ) {
    // An invalid value (partly filled) is what the texts already show: keep them, unless the
    // format or locale changed.
    const keep =
      !isValidDate(current) &&
      current !== null &&
      shown.current.format === layout &&
      shown.current.locale === locale;
    shown.current = { value: current, format: layout, locale };
    if (!keep) {
      const next = sectionValues(current, sections, locale);
      if (next.join("\u0000") !== texts.join("\u0000")) setTexts(next);
    }
  }

  const validationError = validate(current);
  const lastError = useRef<PickerValidationError | null>(validationError);
  useEffect(() => {
    if (lastError.current === validationError) return;
    lastError.current = validationError;
    onError?.(validationError, current);
  });

  const reference = () =>
    isValidDate(current) ? current : (referenceDate ?? startOfDay(new Date()));
  const commit = (next: string[]) => {
    setTexts(next);
    const date = sectionsToDate(next, sections, locale, reference());
    shown.current = { value: date, format: layout, locale };
    if (isSamePickerValue(date, current)) return;
    setCurrent(date);
    onChange?.(date, { validationError: validate(date) });
  };
  const { groupRef, controllerRef, active } = useSectionedField({
    sections,
    texts,
    localeText,
    locale,
    reference,
    disabled,
    readOnly,
    commit,
    autoFocus,
    selectedSections,
    onSelectedSectionsChange,
    fieldRef,
  });

  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRefs(ref, rootRef);

  return (
    <SectionedTextField
      rootRef={mergedRef}
      rootAttributes={{
        ...dateFieldAttributes({
          formatDensity,
          clearable,
          clearButtonPosition,
          openPickerButtonPosition,
          shouldRespectLeadingZeros,
          readOnly,
          valueType: valueType === "date" ? undefined : valueType,
        }),
        ...ruleAttributes({ minDate, maxDate, disablePast, disableFuture }),
        ...(valueType === "date" ? {} : timeRuleAttributes(timeProps)),
        ...(isValidDate(current) ? { "data-ok-value": isoOf(current, valueType) } : {}),
        ...(explicit ? { "data-ok-locale": locale } : {}),
        "data-ok-format": format,
      }}
      className={className}
      style={style}
      rest={props}
      id={id}
      label={label}
      required={required}
      helperText={helperText}
      invalid={errorProp ?? validationError !== null}
      variant={variant}
      size={size}
      color={color}
      margin={margin}
      hiddenLabel={hiddenLabel}
      focused={focused}
      fullWidth={fullWidth}
      formatDensity={formatDensity}
      disabled={disabled}
      readOnly={readOnly}
      sections={sections}
      texts={texts}
      aria={(index) => sectionAria(index, texts, sections, locale, localeText)}
      localeText={localeText}
      groupRef={groupRef}
      active={active}
      hiddenValue={isValidDate(current) ? isoOf(current, valueType) : ""}
      name={name}
      inputRef={inputRef}
      clearable={clearable}
      onClear={() => {
        commit(sections.map(() => ""));
        onClear?.();
        controllerRef.current?.focusSection(0);
      }}
      clearButtonPosition={clearButtonPosition}
      openPickerButtonPosition={openPickerButtonPosition}
      startAdornment={startAdornment}
      endAdornment={endAdornment}
      openButton={openButton}
    />
  );
});

/** What `useSectionedField` needs (internal: date, time, date time and range fields). */
export interface SectionedFieldOptions {
  sections: FormatSection[];
  texts: string[];
  localeText: PickerLocaleText;
  locale: string;
  reference: () => Date;
  disabled: boolean;
  readOnly: boolean;
  /** New texts from a key, a paste or a clear. */
  commit: (next: string[]) => void;
  autoFocus?: boolean | undefined;
  selectedSections?: FieldSelectedSections | undefined;
  onSelectedSectionsChange?: ((section: FieldSelectedSections) => void) | undefined;
  fieldRef?: Ref<FieldApi> | undefined;
}

/** Core's field controller on the sections group, refreshed every render (internal). */
export function useSectionedField(options: SectionedFieldOptions) {
  const [active, setActive] = useState(0);
  const groupRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<FieldController | null>(null);
  const latest = useRef<SectionedFieldOptions>(options);
  latest.current = options;

  useLayoutEffect(() => {
    const controller = createFieldController(groupRef.current as HTMLElement, {
      read: () => {
        const s = latest.current;
        return {
          sections: s.sections,
          values: s.texts,
          placeholders: s.sections.map((section) => sectionPlaceholder(section, s.localeText)),
          locale: s.locale,
          reference: s.reference(),
          disabled: s.disabled,
          readOnly: s.readOnly,
        };
      },
      onValuesChange: (next) => latest.current.commit(next),
      onActiveSectionChange: (index) => {
        setActive(index);
        latest.current.onSelectedSectionsChange?.(index);
      },
      onSelectAll: () => latest.current.onSelectedSectionsChange?.("all"),
    });
    controllerRef.current = controller;
    return () => controller.destroy();
  }, []);

  // The field API reads the controller and the latest texts when it is called.
  useImperativeHandle(options.fieldRef, (): FieldApi => {
    const api = () =>
      controllerRef.current
        ? createFieldApi(controllerRef.current, () => {
            const s = latest.current;
            return {
              sections: s.sections,
              values: s.texts,
              placeholders: s.sections.map((section) => sectionPlaceholder(section, s.localeText)),
            };
          })
        : null;
    return {
      getSections: () => api()?.getSections() ?? [],
      getActiveSectionIndex: () => api()?.getActiveSectionIndex() ?? null,
      setSelectedSections: (selected) => api()?.setSelectedSections(selected),
      focusField: (selected) => api()?.focusField(selected),
      isFieldFocused: () => api()?.isFieldFocused() ?? false,
    };
  }, []);

  // After every render: keep the focused section's text selected.
  useLayoutEffect(() => {
    controllerRef.current?.sync();
  });

  const { autoFocus, selectedSections } = options;
  useEffect(() => {
    if (autoFocus) controllerRef.current?.focusSection(0);
  }, [autoFocus]);

  useEffect(() => {
    const target = resolveSelectedSection(selectedSections, latest.current.sections);
    if (target === "all") controllerRef.current?.selectAll();
    else if (typeof target === "number") controllerRef.current?.focusSection(target);
  }, [selectedSections]);

  return { groupRef, controllerRef, active };
}

/** The TextField of a sectioned field (internal): the same DOM for every field kind. */
export function SectionedTextField({
  rootRef,
  rootAttributes,
  className,
  style,
  rest,
  id,
  label,
  required,
  helperText,
  invalid,
  variant,
  size,
  color,
  margin,
  hiddenLabel,
  focused,
  fullWidth,
  formatDensity,
  disabled,
  readOnly,
  sections,
  texts,
  aria,
  localeText,
  groupRef,
  active,
  hiddenValue,
  name,
  inputRef,
  clearable,
  clearButtonPosition,
  openPickerButtonPosition,
  onClear,
  startAdornment,
  endAdornment,
  openButton,
}: {
  rootRef: Ref<HTMLDivElement>;
  rootAttributes: Record<string, string>;
  className?: string | undefined;
  style?: CSSProperties | undefined;
  rest: HTMLAttributes<HTMLDivElement>;
  id: string;
  label?: ReactNode;
  required?: boolean | undefined;
  helperText?: ReactNode;
  invalid: boolean;
  variant?: TextFieldVariant | undefined;
  size?: SelectionControlSize | undefined;
  color?: SelectionControlColor | undefined;
  margin?: TextFieldMargin | undefined;
  hiddenLabel?: boolean | undefined;
  focused?: boolean | undefined;
  fullWidth?: boolean | undefined;
  formatDensity?: "dense" | "spacious" | undefined;
  disabled: boolean;
  readOnly: boolean;
  sections: readonly FormatSection[];
  texts: readonly string[];
  aria: (index: number) => { now?: number; min: number; max: number; valueText: string };
  localeText: PickerLocaleText;
  groupRef: Ref<HTMLDivElement>;
  active: number;
  hiddenValue: string;
  name?: string | undefined;
  inputRef?: Ref<HTMLInputElement> | undefined;
  clearable?: boolean | undefined;
  clearButtonPosition?: PickerButtonPosition | undefined;
  openPickerButtonPosition?: PickerButtonPosition | undefined;
  onClear: () => void;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  /** A picker's open button. */
  openButton?: ReactNode;
}) {
  const labelId = `${id}-label`;
  const helperId = helperText != null ? `${id}-helper-text` : undefined;
  const placeholders = sections.map((s) => sectionPlaceholder(s, localeText));
  const filled = texts.some((text) => text !== "");
  const attributes = textFieldAttributes({
    variant,
    size,
    color,
    margin,
    error: invalid,
    fullWidth,
    shrink: filled,
    hiddenLabel,
    focused,
  });
  const outlined = attributes["data-ok-variant"] === "outlined";
  const spacious = formatDensity === "spacious";
  const separator = (text: string) => (spacious && text.trim() !== "" ? ` ${text.trim()} ` : text);
  const editable = !disabled && !readOnly;
  const showClear = clearable === true && filled && !disabled && !readOnly;
  const clearButton = clearable && (
    <IconButton
      data-ok-date-field-clear=""
      size="sm"
      aria-label={localeText.fieldClearLabel}
      hidden={!showClear || undefined}
      onClick={onClear}
    >
      <ClearIcon />
    </IconButton>
  );
  const clearAtStart = clearButtonPosition === "start";
  const openAtStart = openPickerButtonPosition === "start";
  // `false` (a picker without views) still renders the end adornment, as before.
  const hasOpen = openButton != null;

  return (
    <div
      ref={rootRef}
      {...attributes}
      {...rootAttributes}
      data-ok-runtime="off"
      className={className}
      style={style}
      {...rest}
    >
      {label != null && (
        // The group isn't labelable: `for` names it for tools; presses go through the label (no
        // pointer events) to the group, which focuses its first empty section.
        <label data-ok-text-field-label="" id={labelId} htmlFor={id}>
          {label}
          {required ? (
            <span data-ok-text-field-asterisk="" aria-hidden="true">
              {" *"}
            </span>
          ) : null}
        </label>
      )}
      <div data-ok-text-field-control="">
        {((clearable && clearAtStart) || (hasOpen && openAtStart)) && (
          <InputAdornment position="start">
            {openAtStart && openButton}
            {clearAtStart && clearButton}
          </InputAdornment>
        )}
        {startAdornment}
        <div
          ref={groupRef}
          id={id}
          role="group"
          data-ok-text-field-input=""
          data-ok-date-field-sections=""
          aria-labelledby={label != null ? labelId : undefined}
          aria-describedby={helperId}
          aria-invalid={invalid || undefined}
          aria-disabled={disabled || undefined}
        >
          {sections.map((section, index) => {
            const values = aria(index);
            return (
              // biome-ignore lint/suspicious/noArrayIndexKey: sections are positions in a fixed format.
              <span key={`${section.token}-${index}`} data-ok-date-field-section="">
                {section.startSeparator !== "" && (
                  <span data-ok-date-field-separator="start">
                    {separator(section.startSeparator)}
                  </span>
                )}
                <span
                  data-ok-date-field-content=""
                  data-ok-section={section.type}
                  role="spinbutton"
                  aria-label={sectionLabel(section, localeText)}
                  aria-valuenow={values.now}
                  aria-valuemin={values.min}
                  aria-valuemax={values.max}
                  aria-valuetext={values.valueText}
                  aria-readonly={readOnly || undefined}
                  aria-disabled={disabled || undefined}
                  tabIndex={disabled ? -1 : index === active ? 0 : -1}
                  contentEditable={editable}
                  suppressContentEditableWarning
                  inputMode={section.contentType === "digit" ? "numeric" : "text"}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  enterKeyHint={index === sections.length - 1 ? "done" : "next"}
                >
                  {display(texts[index], placeholders[index] as string)}
                </span>
                {section.endSeparator !== "" && (
                  <span data-ok-date-field-separator="">{separator(section.endSeparator)}</span>
                )}
              </span>
            );
          })}
        </div>
        <input
          ref={inputRef}
          type="hidden"
          data-ok-date-field-input=""
          name={name}
          value={hiddenValue}
          disabled={disabled}
        />
        {endAdornment}
        {((clearable && !clearAtStart) || (hasOpen && !openAtStart)) && (
          <InputAdornment position="end">
            {!clearAtStart && clearButton}
            {!openAtStart && openButton}
          </InputAdornment>
        )}
        {outlined && (
          <fieldset data-ok-text-field-outline="" aria-hidden="true">
            {label != null && (
              <legend>
                <span>
                  {label}
                  {required ? " *" : null}
                </span>
              </legend>
            )}
          </fieldset>
        )}
      </div>
      {helperText != null && (
        <div data-ok-text-field-helper="" id={helperId}>
          {helperText}
        </div>
      )}
    </div>
  );
}
