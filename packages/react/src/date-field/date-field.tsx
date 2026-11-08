"use client";

import {
  createFieldController,
  type DateRules,
  type DateValidationError,
  type DateView,
  dateFieldAttributes,
  defaultDateFormat,
  type FieldController,
  type FormatSection,
  formatIsoDate,
  isSamePickerValue,
  isValidDate,
  normalizeDateViews,
  type PickerLocaleText,
  parseFormat,
  type SelectionControlSize,
  sectionAria,
  sectionLabel,
  sectionPlaceholder,
  sectionsToDate,
  sectionValues,
  startOfDay,
  type TextFieldVariant,
  textFieldAttributes,
  validateDate,
} from "@owlky/core";
import {
  type CSSProperties,
  forwardRef,
  type HTMLAttributes,
  type ReactNode,
  type Ref,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { IconButton } from "../icon-button/icon-button.js";
import { usePickerLocalization } from "../localization-provider/localization-provider.js";
import { InputAdornment } from "../text-field/text-field.js";
import { useMergedRefs } from "../utils/refs.js";
import { useControllableState } from "../utils/use-controllable-state.js";

/** Value change details: why the new value is invalid, or `null`. */
export interface PickerChangeContext {
  validationError: DateValidationError | null;
}

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
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <path
        d="M18 6 6 18M6 6l12 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
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
  /** Called when the clear button empties the field. */
  onClear?: (() => void) | undefined;
  /** The value can't be changed. */
  readOnly?: boolean | undefined;
  disabled?: boolean | undefined;
  /** Empty sections take this date's parts on ArrowUp / ArrowDown. Default: today. */
  referenceDate?: Date | undefined;
  /** Focuses the first section on mount. */
  autoFocus?: boolean | undefined;
  /** The focused section (controlled), `null` when none. */
  selectedSections?: number | null | undefined;
  /** Called when another section gets focus. */
  onSelectedSectionsChange?: ((section: number | null) => void) | undefined;
  /** Text overrides for this field. */
  localeText?: Partial<PickerLocaleText> | undefined;
  /** TextField props. */
  label?: ReactNode;
  helperText?: ReactNode;
  /** Error colors; default: the value is invalid. */
  error?: boolean | undefined;
  variant?: TextFieldVariant | undefined;
  size?: SelectionControlSize | undefined;
  fullWidth?: boolean | undefined;
  required?: boolean | undefined;
  /** Form field name (a hidden input carries the ISO value). */
  name?: string | undefined;
  /** The hidden input. */
  inputRef?: Ref<HTMLInputElement> | undefined;
  /** Id of the sections group (other ids derive from it). */
  id?: string | undefined;
  /** More content at the end (a picker's open button). */
  endAdornment?: ReactNode;
}

/** Display text of a section: its value, or its placeholder. */
const display = (value: string | undefined, placeholder: string) => (value ? value : placeholder);

/**
 * DateField — spec: specs/components/date-picker.md. A TextField whose input is a group of
 * spinbutton sections (month, day, year…) edited with the keyboard; core's
 * `createFieldController` turns keys, typing and paste into new section texts.
 */
export const DateField = forwardRef<HTMLDivElement, DateFieldProps>(function DateField(
  {
    value,
    defaultValue = null,
    onChange,
    onError,
    format: formatProp,
    views,
    formatDensity,
    clearable,
    onClear,
    readOnly = false,
    disabled = false,
    referenceDate,
    autoFocus,
    selectedSections,
    onSelectedSectionsChange,
    localeText: localeTextProp,
    label,
    helperText,
    error: errorProp,
    variant,
    size,
    fullWidth,
    required,
    name,
    inputRef,
    id: idProp,
    endAdornment,
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
  const labelId = `${id}-label`;
  const helperId = helperText != null ? `${id}-helper-text` : undefined;
  const format = formatProp ?? defaultDateFormat(normalizeDateViews(views), locale);
  const sections = useMemo<FormatSection[]>(() => parseFormat(format), [format]);
  const rules = dateRules({
    minDate,
    maxDate,
    disablePast,
    disableFuture,
    shouldDisableDate,
    shouldDisableMonth,
    shouldDisableYear,
  });

  const [current, setCurrent] = useControllableState<Date | null>({
    value,
    defaultValue,
    onChange: undefined,
  });
  const [texts, setTexts] = useState<string[]>(() => sectionValues(current, sections, locale));
  // The value the texts stand for: a new outside value (or format) resets the texts.
  const shown = useRef<{ value: Date | null; format: string; locale: string }>({
    value: current,
    format,
    locale,
  });
  if (
    !isSamePickerValue(shown.current.value, current) ||
    shown.current.format !== format ||
    shown.current.locale !== locale
  ) {
    // An invalid value (partly filled) is what the texts already show: keep them, unless the
    // format or locale changed.
    const keep =
      !isValidDate(current) &&
      current !== null &&
      shown.current.format === format &&
      shown.current.locale === locale;
    shown.current = { value: current, format, locale };
    if (!keep) {
      const next = sectionValues(current, sections, locale);
      if (next.join("\u0000") !== texts.join("\u0000")) setTexts(next);
    }
  }

  const validationError = validateDate(current, rules);
  const lastError = useRef<DateValidationError | null>(validationError);
  useEffect(() => {
    if (lastError.current === validationError) return;
    lastError.current = validationError;
    onError?.(validationError, current);
  });

  const reference = () =>
    isValidDate(current) ? current : (referenceDate ?? startOfDay(new Date()));
  const placeholders = sections.map((s) => sectionPlaceholder(s, localeText));
  const [active, setActive] = useState(0);

  const groupRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<FieldController | null>(null);
  const latest = useRef<{
    sections: FormatSection[];
    texts: string[];
    placeholders: string[];
    locale: string;
    reference: () => Date;
    disabled: boolean;
    readOnly: boolean;
    commit: (next: string[]) => void;
    onSelectedSectionsChange: ((section: number | null) => void) | undefined;
  }>(null as never);
  const commit = (next: string[]) => {
    setTexts(next);
    const date = sectionsToDate(next, sections, locale, reference());
    shown.current = { value: date, format, locale };
    if (isSamePickerValue(date, current)) return;
    setCurrent(date);
    onChange?.(date, { validationError: validateDate(date, rules) });
  };
  latest.current = {
    sections,
    texts,
    placeholders,
    locale,
    reference,
    disabled,
    readOnly,
    commit,
    onSelectedSectionsChange,
  };

  useLayoutEffect(() => {
    const controller = createFieldController(groupRef.current as HTMLElement, {
      read: () => {
        const s = latest.current;
        return {
          sections: s.sections,
          values: s.texts,
          placeholders: s.placeholders,
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
    });
    controllerRef.current = controller;
    return () => controller.destroy();
  }, []);

  // After every render: keep the focused section's text selected.
  useLayoutEffect(() => {
    controllerRef.current?.sync();
  });

  useEffect(() => {
    if (autoFocus) controllerRef.current?.focusSection(0);
  }, [autoFocus]);

  useEffect(() => {
    if (typeof selectedSections === "number") controllerRef.current?.focusSection(selectedSections);
  }, [selectedSections]);

  const rootRef = useRef<HTMLDivElement>(null);
  const mergedRef = useMergedRefs(ref, rootRef);
  const filled = texts.some((text) => text !== "");
  const invalid = errorProp ?? validationError !== null;
  const attributes = textFieldAttributes({
    variant,
    size,
    error: invalid,
    fullWidth,
    shrink: filled,
  });
  const outlined = attributes["data-ok-variant"] === "outlined";
  const spacious = formatDensity === "spacious";
  const separator = (text: string) => (spacious && text.trim() !== "" ? ` ${text.trim()} ` : text);
  const editable = !disabled && !readOnly;
  const showClear = clearable === true && filled && !disabled && !readOnly;

  return (
    <div
      ref={mergedRef}
      {...attributes}
      {...dateFieldAttributes({ formatDensity, clearable, readOnly })}
      {...ruleAttributes({ minDate, maxDate, disablePast, disableFuture })}
      {...(isValidDate(current) ? { "data-ok-value": formatIsoDate(current) } : {})}
      {...(explicit ? { "data-ok-locale": locale } : {})}
      data-ok-format={format}
      data-ok-runtime="off"
      className={className}
      style={style as CSSProperties | undefined}
      {...props}
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
            const aria = sectionAria(index, texts, sections, locale, localeText);
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
                  aria-valuenow={aria.now}
                  aria-valuemin={aria.min}
                  aria-valuemax={aria.max}
                  aria-valuetext={aria.valueText}
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
          value={isValidDate(current) ? formatIsoDate(current) : ""}
          disabled={disabled}
        />
        {(clearable || endAdornment != null) && (
          <InputAdornment position="end">
            {clearable && (
              <IconButton
                data-ok-date-field-clear=""
                size="sm"
                aria-label={localeText.fieldClearLabel}
                hidden={!showClear || undefined}
                onClick={() => {
                  commit(sections.map(() => ""));
                  onClear?.();
                  controllerRef.current?.focusSection(0);
                }}
              >
                <ClearIcon />
              </IconButton>
            )}
            {endAdornment}
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
});
