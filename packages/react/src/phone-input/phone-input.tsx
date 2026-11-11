"use client";

import { phoneInputAttributes, selectBehaviorAttributes } from "@owlky/core";
import {
  createPhoneInputController,
  type PhoneCountry,
  type PhoneInputLabels,
  type PhoneInputSettings,
  type PhoneMetadata,
  type PhoneValueDetails,
  phoneCountryDigits,
  phoneCountryOfValue,
  phoneCountryOptions,
  phoneDigitsFromValue,
  phoneInputChange,
  phoneInputSettings,
  phoneInputView,
  phoneValueDetails,
} from "@owlky/core/phone";
import { forwardRef, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ListItemIcon, ListItemText } from "../list/list.js";
import { MenuItem } from "../menu/menu.js";
import { SelectRoot } from "../select/select.js";
import { InputAdornment, type TextFieldProps, useFieldMarkup } from "../text-field/text-field.js";
import { useMergedRefs } from "../utils/refs.js";

export type { PhoneCountry, PhoneInputLabels, PhoneMetadata };
/** What `onChange` reports with the value: its national and international forms and checks. */
export type PhoneInputChangeDetails = PhoneValueDetails;

/** The International option's icon (decorative, same SVG as the HTML runtime builds). */
function GlobeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export interface PhoneInputProps
  extends Omit<
    TextFieldProps,
    | "value"
    | "defaultValue"
    | "onChange"
    | "multiline"
    | "rows"
    | "minRows"
    | "maxRows"
    | "select"
    | "selectProps"
    | "children"
    | "type"
    | "inputComponent"
    | "startAdornment"
  > {
  /** Controlled value in international form without spaces, such as `"+61298765432"` (`""` = empty). */
  value?: string | undefined;
  /** Uncontrolled initial value, such as `"+61298765432"`. Default `""`. */
  defaultValue?: string | undefined;
  /**
   * Called with the new value, such as `"+61298765432"` (`""` when there is no number), and its details: `national`,
   * `international`, `country`, `valid` and `possible`.
   */
  onChange?: ((value: string, details: PhoneInputChangeDetails) => void) | undefined;
  /** A fixed country, such as `"AU"`: the country select is turned off and numbers are read as this country's. */
  country?: string | undefined;
  /** The country selected at first, such as `"DE"`. Without it, the number is typed in international form. */
  defaultCountry?: string | undefined;
  /** Called when the selected country changes (`undefined`: International). */
  onCountryChange?: ((country: PhoneCountry | undefined) => void) | undefined;
  /** Show numbers in international form (`+61 2 9876 5432`) instead of national (`(02) 9876 5432`). */
  international?: boolean | undefined;
  /** International form with a selected country: the calling code can be changed. Default `true`. */
  countryCallingCodeEditable?: boolean | undefined;
  /** Leave the country select out. */
  hideSelect?: boolean | undefined;
  /** The countries offered, such as `["AU", "NZ"]`. Default: every country. */
  countries?: readonly string[] | undefined;
  /** Countries listed first, such as `["US", "CA", "..."]` (`"..."` places the others). */
  countryOptionsOrder?: readonly string[] | undefined;
  /** An International option at the top of the country list. Default `true`. */
  addInternationalOption?: boolean | undefined;
  /** Refuse digits past the longest number of the country. */
  limitMaxLength?: boolean | undefined;
  /** Picking a country moves the focus to the input. Default `true`. */
  focusInputOnCountrySelection?: boolean | undefined;
  /** Country names and other texts: `{ AU: "Australie", ZZ: "International", country: "Country" }`. */
  labels?: PhoneInputLabels | undefined;
  /** Language of the country names (`Intl.DisplayNames`), such as `"fr"`. Default `"en"`. */
  locale?: string | undefined;
  /** Phone metadata from libphonenumber-js (`min`, `mobile` or `max`). Default: `min`. */
  metadata?: PhoneMetadata | undefined;
  /** After the person leaves the field, an invalid number shows the error state and `invalidText`. */
  validate?: boolean | undefined;
  /** The helper text shown while the number is invalid (with `validate`). */
  invalidText?: string | undefined;
}

interface PhoneState {
  /** What the person typed, without formatting (a leading `+` for international form). */
  digits: string;
  country: PhoneCountry | undefined;
  /** The E.164 value of the digits. */
  value: string;
  /** The value the digits were last derived from (a `value` prop as written). */
  source: string;
  /** The settings they were derived with. */
  key: string;
}

/** The digits and country shown for a value. */
function stateOf(
  value: string,
  fallback: PhoneCountry | undefined,
  settings: PhoneInputSettings,
  key: string,
): PhoneState {
  const country = phoneCountryOfValue(value, fallback, settings);
  const digits = phoneDigitsFromValue(value, country, settings);
  const own = phoneInputView(digits, country, settings).value;
  return { digits, country, value: own, source: value, key };
}

/**
 * PhoneInput — spec: specs/components/phone-input.md (ADR-0061). A text field for phone numbers:
 * a country select in the start adornment (a Select of MenuItems with flags), formatting as you
 * type and the value in international form. Every TextField prop works; `ref` and the remaining props go to the
 * input.
 */
export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput(
  {
    value: valueProp,
    defaultValue = "",
    onChange,
    country,
    defaultCountry,
    onCountryChange,
    international,
    countryCallingCodeEditable,
    hideSelect,
    countries,
    countryOptionsOrder,
    addInternationalOption = true,
    limitMaxLength,
    focusInputOnCountrySelection = true,
    labels,
    locale,
    metadata,
    validate,
    invalidText,
    id,
    disabled,
    readOnly,
    error,
    helperText,
    onBlur,
    ...props
  },
  ref,
) {
  const generated = useId();
  const inputId = id ?? generated;
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergedRefs(inputRef, ref);
  const countryKey = countries?.join(",");
  const settings = useMemo(
    () =>
      phoneInputSettings({
        country,
        defaultCountry,
        international,
        countryCallingCodeEditable,
        limitMaxLength,
        countries: countryKey,
        metadata,
      }),
    [
      country,
      defaultCountry,
      international,
      countryCallingCodeEditable,
      limitMaxLength,
      countryKey,
      metadata,
    ],
  );
  // A new value from outside, a fixed country or another form derives the digits again.
  const key = `${settings.country}|${settings.international}|${settings.countryCallingCodeEditable}`;
  const [state, setState] = useState<PhoneState>(() =>
    stateOf(valueProp ?? defaultValue, settings.defaultCountry, settings, key),
  );
  let current = state;
  const outside =
    valueProp !== undefined && valueProp !== state.value && valueProp !== state.source;
  if (outside || state.key !== key) {
    const fallback = state.country ?? settings.defaultCountry;
    current = stateOf(valueProp ?? state.value, fallback, settings, key);
    setState(current);
  }
  const selected = settings.country ?? current.country;
  const view = phoneInputView(current.digits, selected, settings);
  const [touched, setTouched] = useState(false);
  const caret = useRef<number | null>(null);
  const focusInput = useRef(false);

  const latest = useRef({ current, settings, onChange, onCountryChange });
  latest.current = { current, settings, onChange, onCountryChange };

  /** Stores new digits and reports what changed. */
  const apply = (digits: string, nextCountry: PhoneCountry | undefined, value: string) => {
    const { current: was, onChange: change, onCountryChange: countryChange } = latest.current;
    setState({ digits, country: nextCountry, value, source: value, key: was.key });
    if (nextCountry !== was.country) countryChange?.(nextCountry);
    if (value !== was.value)
      change?.(value, phoneValueDetails(value, latest.current.settings.metadata));
  };

  const typed = (text: string, at: number) => {
    const { current: was, settings: now } = latest.current;
    const result = phoneInputChange(text, at, was.country, now);
    caret.current = result.caret;
    apply(result.digits, result.country, result.value);
  };
  const typedRef = useRef(typed);
  typedRef.current = typed;

  useEffect(() => {
    const controller = createPhoneInputController(
      inputRef.current as HTMLInputElement,
      { onInput: (text, at) => typedRef.current(text, at) },
      // Typing is reported from `onChange` below (React restores a controlled input's text).
      { input: false },
    );
    return () => controller.destroy();
  }, []);

  // After each render that came from typing: the caret goes after the same digit.
  useLayoutEffect(() => {
    const input = inputRef.current;
    if (caret.current === null || !input) return;
    const at = caret.current;
    caret.current = null;
    if ((input.getRootNode() as Document).activeElement === input) input.setSelectionRange(at, at);
  });
  useEffect(() => {
    if (!focusInput.current) return;
    focusInput.current = false;
    inputRef.current?.focus();
  });

  const pickCountry = (picked: string) => {
    const { current: was, settings: now } = latest.current;
    const next = picked === "" ? undefined : (picked as PhoneCountry);
    const digits = phoneCountryDigits(was.digits, was.country, next, now);
    apply(digits, next, phoneInputView(digits, next, now).value);
    if (focusInputOnCountrySelection) {
      // Before the list closes: the popover then leaves the focus where it is.
      inputRef.current?.focus();
      focusInput.current = true;
    }
  };

  const options = useMemo(
    () =>
      phoneCountryOptions({
        countries: settings.countries,
        order: countryOptionsOrder,
        locale,
        labels,
        metadata: settings.metadata,
      }),
    [settings, countryOptionsOrder, locale, labels],
  );
  const invalid =
    validate === true &&
    touched &&
    view.value !== "" &&
    !phoneValueDetails(view.value, settings.metadata).valid;
  const helper =
    validate === true && invalidText !== undefined
      ? invalid
        ? invalidText
        : (helperText ?? "")
      : helperText;
  const inert = disabled === true || readOnly === true || settings.country !== undefined;
  const select = hideSelect ? undefined : (
    <InputAdornment position="start" component="div" data-ok-phone-input-country="">
      <SelectRoot
        host="select"
        rootProps={selectBehaviorAttributes({ displayEmpty: true })}
        rootRef={null}
        triggerId={`${inputId}-country`}
        error={false}
        disabled={inert}
        required={false}
        readOnly={false}
        triggerAria={{ "aria-label": labels?.country ?? "Country" }}
        value={selected ?? ""}
        onChange={(next) => pickCountry(String(next))}
        displayEmpty
      >
        {addInternationalOption && settings.country === undefined && (
          <MenuItem value="">
            <ListItemIcon data-ok-phone-input-flag="" aria-hidden="true">
              <GlobeIcon />
            </ListItemIcon>
            <ListItemText primary={labels?.ZZ ?? "International"} />
          </MenuItem>
        )}
        {options.map((option) => (
          <MenuItem key={option.code} value={option.code}>
            <ListItemIcon data-ok-phone-input-flag="" aria-hidden="true">
              {option.flag}
            </ListItemIcon>
            <ListItemText
              primary={option.name}
              secondary={`${option.code} (+${option.callingCode})`}
            />
          </MenuItem>
        ))}
      </SelectRoot>
    </InputAdornment>
  );

  return useFieldMarkup(
    {
      autoComplete: "tel",
      ...props,
      id: inputId,
      type: "tel",
      disabled,
      readOnly,
      error: error === true || invalid,
      helperText: helper,
      value: view.text,
      onChange(text: string) {
        typed(text, inputRef.current?.selectionStart ?? text.length);
      },
      onBlur(event) {
        setTouched(true);
        onBlur?.(event);
      },
      startAdornment: select,
    },
    mergedRef,
    undefined,
    {
      attributes: phoneInputAttributes({
        country: settings.country,
        defaultCountry: settings.defaultCountry,
        international,
        countryCallingCodeEditable,
        hideSelect,
        countries: settings.countries,
        countryOptionsOrder,
        addInternationalOption,
        limitMaxLength,
        focusInputOnCountrySelection,
        locale,
        validate,
        invalidText,
      }),
    },
  );
});
