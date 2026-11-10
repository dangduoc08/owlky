"use client";

import {
  type DateRange,
  dateFieldAttributes,
  defaultPickerFormat,
  formatIsoRange,
  isSameRange,
  isValidDate,
  type PickerLocaleText,
  type PickerValueType,
  type PickerView,
  pickerViewsOf,
  type RangeValidationError,
  rangeError,
  rangeFieldSections,
  rangeSectionValues,
  resolveAmpm,
  type SelectionControlSize,
  sectionAria,
  sectionsToRange,
  startOfDay,
  type TextFieldVariant,
  type TimeView,
  validateRange,
} from "@owlky/core";
import {
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type DateTimeValidationProps,
  type DateValidationProps,
  dateRules,
  PickerField,
  ruleAttributes,
  SectionedTextField,
  type TimeValidationProps,
  timeRuleAttributes,
  timeRules,
  useSectionedField,
} from "../date-field/date-field.js";
import { usePickerLocalization } from "../localization-provider/localization-provider.js";
import { useMergedRefs } from "../utils/refs.js";
import { useControllableState } from "../utils/use-controllable-state.js";

/** Errors of a range: `[start, end]` (MUI). */
export type RangeErrors = [RangeValidationError | null, RangeValidationError | null];

/** Range change details: each side's error (`invalidRange` on both when the end comes first). */
export interface RangeChangeContext {
  validationError: RangeErrors;
}

/** Props every range field shares (MUI's range field props). */
export interface RangeFieldProps
  extends DateValidationProps,
    Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue" | "onError"> {
  /** Controlled range (`null` sides: empty; invalid dates: partly typed). */
  value?: DateRange | undefined;
  /** Uncontrolled initial range. */
  defaultValue?: DateRange | undefined;
  /** Called with the new range and each side's error. */
  onChange?: ((value: DateRange, context: RangeChangeContext) => void) | undefined;
  /** Called when the errors change. */
  onError?: ((error: RangeErrors, value: DateRange) => void) | undefined;
  /** The format of one date (Day.js tokens). Default: from the views and the locale. */
  format?: string | undefined;
  formatDensity?: "dense" | "spacious" | undefined;
  readOnly?: boolean | undefined;
  /** Turns the field off. */
  disabled?: boolean | undefined;
  /** Empty sections take this date's parts on ArrowUp / ArrowDown. Default: today. */
  referenceDate?: Date | undefined;
  /** Focuses the field when it mounts. */
  autoFocus?: boolean | undefined;
  /** "Today" (tests and fixed demos): empty sections start from it. Default: now. */
  today?: Date | undefined;
  /** Replaces the text of the labels and buttons, such as for another language. */
  localeText?: Partial<PickerLocaleText> | undefined;
  /** Text under the field, such as a hint or an error message. */
  helperText?: ReactNode;
  /** Error colors; default: the range is invalid. */
  error?: boolean | undefined;
  /** The field's variant: `outlined`, `filled` or `standard`. */
  variant?: TextFieldVariant | undefined;
  /** The field's size. */
  size?: SelectionControlSize | undefined;
  /** Stretches the field to the container's width. */
  fullWidth?: boolean | undefined;
  /** Marks the field as required (an asterisk on the label). */
  required?: boolean | undefined;
  /** Id of the field (other ids derive from it). */
  id?: string | undefined;
}

/** A single field holding both dates. */
export interface SingleInputRangeFieldProps extends RangeFieldProps {
  /** The field's label. */
  label?: ReactNode;
  clearable?: boolean | undefined;
  /** Called when the clear button empties the field. */
  onClear?: (() => void) | undefined;
  /** The selected section of the field (its index, `null`: none), controlled. */
  selectedSections?: number | null | undefined;
  /** Called when the selected section changes. */
  onSelectedSectionsChange?: ((section: number | null) => void) | undefined;
  /** Form field name: a hidden input carries the ISO interval `start/end`. */
  name?: string | undefined;
  /** A ref to the hidden input that carries the value. */
  inputRef?: Ref<HTMLInputElement> | undefined;
}

/** Two fields, the start and the end. */
export interface MultiInputRangeFieldProps extends RangeFieldProps {
  /** Label of the start field. Default `localeText.start`. */
  startLabel?: ReactNode;
  /** Label of the end field. Default `localeText.end`. */
  endLabel?: ReactNode;
}

/** Time props of time and date time range fields. */
export interface RangeTimeFieldProps extends TimeValidationProps {
  /** 12-hour clock in the default format. Default: from the locale. */
  ampm?: boolean | undefined;
}

/** Internal: every value type, plus the picker's extras. */
interface RangeFieldInternals extends DateTimeValidationProps, RangeTimeFieldProps {
  valueType: PickerValueType;
  views?: readonly PickerView[] | undefined;
  /** A picker's open button(s): one for a single field, start and end for multi input fields. */
  adornments?: readonly ReactNode[] | undefined;
  /** Multi input: called when a field gets focus (pickers edit that end). */
  onFieldFocus?: ((position: "start" | "end") => void) | undefined;
}

const EMPTY: DateRange = [null, null];

/** The value type's rules and the field format (shared by both range fields). */
function useRangeRules(props: RangeFieldInternals & RangeFieldProps) {
  const { locale, localeText, explicit } = usePickerLocalization(props.localeText);
  const ampm = resolveAmpm(props.ampm, locale);
  const format =
    props.format ??
    defaultPickerFormat(pickerViewsOf(props.views, props.valueType), props.valueType, ampm, locale);
  const timeProps = {
    minTime: props.minTime,
    maxTime: props.maxTime,
    minDateTime: props.minDateTime,
    maxDateTime: props.maxDateTime,
    minutesStep: props.minutesStep,
    shouldDisableTime: props.shouldDisableTime,
    disableIgnoringDatePartForTimeValidation: props.disableIgnoringDatePartForTimeValidation,
    disablePast: props.disablePast,
    disableFuture: props.disableFuture,
  };
  const rules = {
    ...dateRules(props),
    ...timeRules(timeProps, props.today),
    ...(props.today ? { today: startOfDay(props.today) } : {}),
  };
  const validate = (range: DateRange): RangeErrors => validateRange(range, props.valueType, rules);
  return { locale, localeText, explicit, format, timeProps, validate };
}

/** Reports `onError` after renders where the errors changed. */
function useErrorReport(
  errors: RangeErrors,
  value: DateRange,
  onError: RangeFieldProps["onError"],
) {
  const last = useRef(errors);
  useEffect(() => {
    if (last.current[0] === errors[0] && last.current[1] === errors[1]) return;
    last.current = errors;
    onError?.(errors, value);
  });
}

/** The single input range field of every value type (internal). */
export const SingleInputRangeField = forwardRef<
  HTMLDivElement,
  SingleInputRangeFieldProps & RangeFieldInternals
>(function SingleInputRangeField(props, ref) {
  const {
    valueType,
    views,
    today,
    adornments,
    onFieldFocus,
    ampm,
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
    onError,
    format: formatProp,
    formatDensity,
    readOnly = false,
    disabled = false,
    referenceDate,
    autoFocus,
    localeText: localeTextProp,
    helperText,
    error,
    variant,
    size,
    fullWidth,
    required,
    id: idProp,
    label,
    clearable,
    onClear,
    selectedSections,
    onSelectedSectionsChange,
    name,
    inputRef,
    minDate,
    maxDate,
    disablePast,
    disableFuture,
    shouldDisableDate,
    shouldDisableMonth,
    shouldDisableYear,
    className,
    style,
    ...rest
  } = props;
  const { locale, localeText, explicit, format, timeProps, validate } = useRangeRules(props);
  const generated = useId();
  const id = idProp ?? generated;
  const { sections, count } = useMemo(() => rangeFieldSections(format), [format]);

  const [current, setCurrent] = useControllableState<DateRange>({
    value,
    defaultValue,
    onChange: undefined,
  });
  const [texts, setTexts] = useState<string[]>(() =>
    rangeSectionValues(current, sections, count, locale),
  );
  // The range the texts stand for: a new outside value (or format) resets the texts, except the
  // texts of a partly typed side (an invalid date shows what was typed).
  const shown = useRef({ value: current, format, locale });
  if (
    !isSameRange(shown.current.value, current) ||
    shown.current.format !== format ||
    shown.current.locale !== locale
  ) {
    const sameFormat = shown.current.format === format && shown.current.locale === locale;
    shown.current = { value: current, format, locale };
    const next = rangeSectionValues(current, sections, count, locale);
    const keep = (side: 0 | 1) =>
      sameFormat && current[side] !== null && !isValidDate(current[side]);
    const merged = next.map((text, i) => (keep(i < count ? 0 : 1) ? (texts[i] as string) : text));
    if (merged.join("\u0000") !== texts.join("\u0000")) setTexts(merged);
  }

  const errors = validate(current);
  useErrorReport(errors, current, onError);

  const fallback = () => referenceDate ?? startOfDay(today ?? new Date());
  const references = (): [Date, Date] => {
    const start = isValidDate(current[0]) ? current[0] : fallback();
    return [start, isValidDate(current[1]) ? current[1] : start];
  };
  const commit = (next: string[]) => {
    setTexts(next);
    const range = sectionsToRange(next, sections, count, locale, references());
    shown.current = { value: range, format, locale };
    if (isSameRange(range, current)) return;
    setCurrent(range);
    onChange?.(range, { validationError: validate(range) });
  };
  const { groupRef, controllerRef, active } = useSectionedField({
    sections,
    texts,
    localeText,
    locale,
    reference: () => references()[0],
    disabled,
    readOnly,
    commit,
    autoFocus,
    selectedSections,
    onSelectedSectionsChange,
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRefs(ref, rootRef);
  const iso = formatIsoRange(current, valueType);

  return (
    <SectionedTextField
      rootRef={mergedRef}
      rootAttributes={{
        ...dateFieldAttributes({
          formatDensity,
          clearable,
          readOnly,
          valueType: valueType === "date" ? undefined : valueType,
          range: true,
        }),
        ...ruleAttributes({ minDate, maxDate, disablePast, disableFuture }),
        ...(valueType === "date" ? {} : timeRuleAttributes(timeProps)),
        ...(iso ? { "data-ok-value": iso } : {}),
        ...(explicit ? { "data-ok-locale": locale } : {}),
        "data-ok-format": format,
      }}
      className={className}
      style={style}
      rest={rest}
      id={id}
      label={label}
      required={required}
      helperText={helperText}
      invalid={error ?? rangeError(errors) !== null}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      formatDensity={formatDensity}
      disabled={disabled}
      readOnly={readOnly}
      sections={sections}
      texts={texts}
      aria={(index) => {
        const part = index < count ? 0 : count;
        return sectionAria(
          index - part,
          texts.slice(part, part + count),
          sections.slice(part, part + count),
          locale,
          localeText,
        );
      }}
      localeText={localeText}
      groupRef={groupRef}
      active={active}
      hiddenValue={iso}
      name={name}
      inputRef={inputRef}
      clearable={clearable}
      onClear={() => {
        commit(sections.map(() => ""));
        onClear?.();
        controllerRef.current?.focusSection(0);
      }}
      endAdornment={adornments?.[0]}
    />
  );
});

/** The multi input range field of every value type (internal). */
export const MultiInputRangeField = forwardRef<
  HTMLDivElement,
  MultiInputRangeFieldProps & RangeFieldInternals
>(function MultiInputRangeField(props, ref) {
  const {
    valueType,
    views,
    today,
    adornments,
    onFieldFocus,
    ampm,
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
    onError,
    format: formatProp,
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
    id: idProp,
    startLabel,
    endLabel,
    minDate,
    maxDate,
    disablePast,
    disableFuture,
    shouldDisableDate,
    shouldDisableMonth,
    shouldDisableYear,
    ...rest
  } = props;
  const { locale, localeText, explicit, format, validate } = useRangeRules(props);
  const generated = useId();
  const id = idProp ?? generated;
  const [current, setCurrent] = useControllableState<DateRange>({
    value,
    defaultValue,
    onChange: undefined,
  });
  const errors = validate(current);
  useErrorReport(errors, current, onError);
  const iso = formatIsoRange(current, valueType);

  const change = (side: 0 | 1, date: Date | null) => {
    // Fields report real changes only.
    const next: DateRange = side === 0 ? [date, current[1]] : [current[0], date];
    setCurrent(next);
    onChange?.(next, { validationError: validate(next) });
  };
  const field = (side: 0 | 1) => (
    <PickerField
      id={`${id}-${side === 0 ? "start" : "end"}`}
      valueType={valueType}
      value={current[side]}
      onChange={(date) => change(side, date)}
      label={side === 0 ? (startLabel ?? localeText.start) : (endLabel ?? localeText.end)}
      error={error ?? errors[side] !== null}
      format={format}
      views={views}
      ampm={ampm}
      today={today}
      formatDensity={formatDensity}
      readOnly={readOnly}
      disabled={disabled}
      referenceDate={side === 1 && isValidDate(current[0]) ? current[0] : referenceDate}
      autoFocus={side === 0 ? autoFocus : undefined}
      localeText={localeTextProp}
      variant={variant}
      size={size}
      required={required}
      minDate={minDate}
      maxDate={maxDate}
      disablePast={disablePast}
      disableFuture={disableFuture}
      shouldDisableDate={shouldDisableDate}
      shouldDisableMonth={shouldDisableMonth}
      shouldDisableYear={shouldDisableYear}
      minTime={minTime}
      maxTime={maxTime}
      minDateTime={minDateTime}
      maxDateTime={maxDateTime}
      minutesStep={minutesStep}
      shouldDisableTime={shouldDisableTime}
      disableIgnoringDatePartForTimeValidation={disableIgnoringDatePartForTimeValidation}
      endAdornment={adornments?.[side]}
      onFocus={() => onFieldFocus?.(side === 0 ? "start" : "end")}
    />
  );

  return (
    // biome-ignore lint/a11y/useSemanticElements: a group of two fields, not a form fieldset (no legend).
    <div
      ref={ref}
      role="group"
      data-ok-multi-input-range-field=""
      {...(valueType === "date" ? {} : { "data-ok-value-type": valueType })}
      {...(iso ? { "data-ok-value": iso } : {})}
      {...(fullWidth ? { "data-ok-full-width": "" } : {})}
      {...(explicit ? { "data-ok-locale": locale } : {})}
      data-ok-runtime="off"
      {...rest}
    >
      {field(0)}
      <span data-ok-multi-input-range-field-separator="" aria-hidden="true">
        –
      </span>
      {field(1)}
      {helperText != null && (
        <div data-ok-text-field-helper="" data-ok-multi-input-range-field-helper="">
          {helperText}
        </div>
      )}
    </div>
  );
});

/** SingleInputDateRangeField — spec: specs/components/date-picker.md. Both dates in one field. */
export const SingleInputDateRangeField = forwardRef<HTMLDivElement, SingleInputRangeFieldProps>(
  function SingleInputDateRangeField(props, ref) {
    return <SingleInputRangeField ref={ref} valueType="date" {...props} />;
  },
);

/** Time range field props: time rules instead of day rules. */
type DayOnly =
  | "minDate"
  | "maxDate"
  | "shouldDisableDate"
  | "shouldDisableMonth"
  | "shouldDisableYear";

export interface SingleInputTimeRangeFieldProps
  extends Omit<SingleInputRangeFieldProps, DayOnly>,
    RangeTimeFieldProps {
  /** The time sections the fields show (`hours`, `minutes`, `seconds`). */
  views?: readonly TimeView[] | undefined;
}

/** SingleInputTimeRangeField — both times in one field. */
export const SingleInputTimeRangeField = forwardRef<HTMLDivElement, SingleInputTimeRangeFieldProps>(
  function SingleInputTimeRangeField(props, ref) {
    return <SingleInputRangeField ref={ref} valueType="time" {...props} />;
  },
);

export interface SingleInputDateTimeRangeFieldProps
  extends SingleInputRangeFieldProps,
    RangeTimeFieldProps {
  /** The earliest date and time that can be picked. */
  minDateTime?: Date | undefined;
  /** The latest date and time that can be picked. */
  maxDateTime?: Date | undefined;
  /** The date and time sections the fields show. */
  views?: readonly PickerView[] | undefined;
}

/** SingleInputDateTimeRangeField — both date times in one field. */
export const SingleInputDateTimeRangeField = forwardRef<
  HTMLDivElement,
  SingleInputDateTimeRangeFieldProps
>(function SingleInputDateTimeRangeField(props, ref) {
  return <SingleInputRangeField ref={ref} valueType="date-time" {...props} />;
});

/** MultiInputDateRangeField — the start and the end in two fields. */
export const MultiInputDateRangeField = forwardRef<HTMLDivElement, MultiInputRangeFieldProps>(
  function MultiInputDateRangeField(props, ref) {
    return <MultiInputRangeField ref={ref} valueType="date" {...props} />;
  },
);

export interface MultiInputTimeRangeFieldProps
  extends Omit<MultiInputRangeFieldProps, DayOnly>,
    RangeTimeFieldProps {
  /** The time sections the field shows (`hours`, `minutes`, `seconds`). */
  views?: readonly TimeView[] | undefined;
}

/** MultiInputTimeRangeField — the start and the end time in two fields. */
export const MultiInputTimeRangeField = forwardRef<HTMLDivElement, MultiInputTimeRangeFieldProps>(
  function MultiInputTimeRangeField(props, ref) {
    return <MultiInputRangeField ref={ref} valueType="time" {...props} />;
  },
);

export interface MultiInputDateTimeRangeFieldProps
  extends MultiInputRangeFieldProps,
    RangeTimeFieldProps {
  /** The earliest date and time that can be picked. */
  minDateTime?: Date | undefined;
  /** The latest date and time that can be picked. */
  maxDateTime?: Date | undefined;
  /** The date and time sections the field shows. */
  views?: readonly PickerView[] | undefined;
}

/** MultiInputDateTimeRangeField — the start and the end date time in two fields. */
export const MultiInputDateTimeRangeField = forwardRef<
  HTMLDivElement,
  MultiInputDateTimeRangeFieldProps
>(function MultiInputDateTimeRangeField(props, ref) {
  return <MultiInputRangeField ref={ref} valueType="date-time" {...props} />;
});
