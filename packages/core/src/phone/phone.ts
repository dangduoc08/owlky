/*
 * Phone input (roadmap 4.25, ADR-0061) — spec: specs/components/phone-input.md. The model shared
 * by React's `PhoneInput` and the HTML `phone-input` runtime: libphonenumber-js formats as you
 * type, detects the country of an international number and checks it. Pure functions: owners
 * keep the state (the selected country and the typed "digits") and write the input's text.
 *
 * "Digits" are what the person typed without formatting: digits, with a leading `+` for a number
 * in international form (react-phone-number-input's `phoneDigits`). The value is E.164
 * (`+61298765432`) or `""`.
 */
import {
  AsYouType,
  type CountryCode,
  getCountries,
  getCountryCallingCode,
  isPossiblePhoneNumber,
  isValidPhoneNumber,
  type MetadataJson,
  parseIncompletePhoneNumber,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
} from "libphonenumber-js/core";
import minMetadata from "libphonenumber-js/min/metadata";
import { phoneInputOptions } from "../anatomy/anatomy.js";
import { readBehavior } from "../options/define.js";

/** Phone metadata (libphonenumber-js `min`, `mobile` or `max` JSON). Default: `min`. */
export type PhoneMetadata = MetadataJson;
/** A two-letter country code (ISO 3166-1 alpha-2), such as `"AU"`. */
export type PhoneCountry = CountryCode;

/** The settings a phone input works with (from React's props or the root's attributes). */
export interface PhoneInputSettings {
  /** A fixed country: the select is turned off and numbers are read as this country's. */
  readonly country: PhoneCountry | undefined;
  /** The country selected at first (and for national numbers typed with nothing selected). */
  readonly defaultCountry: PhoneCountry | undefined;
  /** Numbers are shown in international form (`+61 2 9876 5432`). */
  readonly international: boolean;
  /** International form with a country: the calling code can be changed. */
  readonly countryCallingCodeEditable: boolean;
  /** Digits beyond the longest number of the country are refused. */
  readonly limitMaxLength: boolean;
  /** The countries offered (all when undefined). */
  readonly countries: readonly PhoneCountry[] | undefined;
  readonly metadata: PhoneMetadata;
}

/** Options of `phoneInputSettings` (React props; strings are checked against the metadata). */
export interface PhoneInputSettingsOptions {
  country?: string | undefined;
  defaultCountry?: string | undefined;
  international?: boolean | undefined;
  countryCallingCodeEditable?: boolean | undefined;
  limitMaxLength?: boolean | undefined;
  /** An array, or a comma or space separated string (markup). */
  countries?: readonly string[] | string | undefined;
  metadata?: PhoneMetadata | undefined;
}

/** The default metadata: libphonenumber-js `min` (ADR-0061). */
export const phoneMetadata: PhoneMetadata = minMetadata;

/** `code` (any case) when the metadata knows it, otherwise `undefined`. */
export function phoneCountry(
  code: unknown,
  metadata: PhoneMetadata = minMetadata,
): PhoneCountry | undefined {
  if (typeof code !== "string" || !/^[a-z]{2}$/i.test(code.trim())) return undefined;
  const upper = code.trim().toUpperCase() as PhoneCountry;
  return getCountries(metadata).includes(upper) ? upper : undefined;
}

/** A list of country codes (an array, or a comma or space separated string), known ones only. */
export function phoneCountryList(
  list: unknown,
  metadata: PhoneMetadata = minMetadata,
): PhoneCountry[] | undefined {
  const items =
    typeof list === "string" ? list.split(/[\s,]+/) : Array.isArray(list) ? list : undefined;
  if (!items) return undefined;
  const codes = items
    .map((item) => phoneCountry(item, metadata))
    .filter((code): code is PhoneCountry => code !== undefined);
  return codes.length > 0 ? [...new Set(codes)] : undefined;
}

/** Settings from option values; unknown countries are dropped. */
export function phoneInputSettings(options: PhoneInputSettingsOptions = {}): PhoneInputSettings {
  const metadata = options.metadata ?? minMetadata;
  const countries = phoneCountryList(options.countries, metadata);
  const allowed = (code: PhoneCountry | undefined) =>
    code !== undefined && (countries === undefined || countries.includes(code)) ? code : undefined;
  return {
    country: allowed(phoneCountry(options.country, metadata)),
    defaultCountry: allowed(phoneCountry(options.defaultCountry, metadata)),
    international: options.international === true,
    countryCallingCodeEditable: options.countryCallingCodeEditable !== false,
    limitMaxLength: options.limitMaxLength === true,
    countries,
    metadata,
  };
}

const {
  country: countryOption,
  defaultCountry,
  international,
  countryCallingCodeEditable,
  limitMaxLength,
  countries: countriesOption,
} = phoneInputOptions.options;

/** Settings from a phone input root's attributes (HTML, and React's rendered markup). */
export function readPhoneInputSettings(
  root: Element,
  metadata: PhoneMetadata = minMetadata,
): PhoneInputSettings {
  return phoneInputSettings({
    country: root.getAttribute(countryOption.attr) ?? undefined,
    defaultCountry: root.getAttribute(defaultCountry.attr) ?? undefined,
    international: root.hasAttribute(international.attr),
    countryCallingCodeEditable: readBehavior(root, countryCallingCodeEditable),
    limitMaxLength: root.hasAttribute(limitMaxLength.attr),
    countries: root.getAttribute(countriesOption.attr) ?? undefined,
    metadata,
  });
}

/** `+<calling code>` of a country. */
const plusCode = (country: PhoneCountry, metadata: PhoneMetadata) =>
  `+${getCountryCallingCode(country, metadata)}`;

/** The calling code of international digits isn't the country's own to change. */
const lockedCode = (country: PhoneCountry | undefined, settings: PhoneInputSettings) =>
  country !== undefined &&
  settings.international &&
  (settings.country !== undefined || !settings.countryCallingCodeEditable);

/** What a phone input shows for some digits under a country. */
export interface PhoneInputView {
  /** The formatted text of the input. */
  readonly text: string;
  /** E.164 (`+61298765432`), or `""` while there is no national number. */
  readonly value: string;
  /** The country libphonenumber reads from international digits (if one matches). */
  readonly detected: PhoneCountry | undefined;
  /** The calling code of international digits (`"61"`). */
  readonly callingCode: string | undefined;
}

/** Formats `digits` as you type (national digits are read as `country`'s). */
export function phoneInputView(
  digits: string,
  country: PhoneCountry | undefined,
  settings: PhoneInputSettings,
): PhoneInputView {
  const typing = new AsYouType(country, settings.metadata);
  const text = typing.input(digits);
  const number = typing.getNumber();
  return {
    text,
    value: number?.nationalNumber ? number.number : "",
    detected: typing.getCountry(),
    callingCode: typing.getCallingCode(),
  };
}

/** The digits a value is shown with under `country` (national form when it is that country's). */
export function phoneDigitsFromValue(
  value: string | undefined,
  country: PhoneCountry | undefined,
  settings: PhoneInputSettings,
): string {
  const number = value ? parsePhoneNumberFromString(value, settings.metadata) : undefined;
  if (!number)
    return lockedCode(country, settings)
      ? plusCode(country as PhoneCountry, settings.metadata)
      : "";
  if (
    country !== undefined &&
    !settings.international &&
    number.countryCallingCode === getCountryCallingCode(country, settings.metadata)
  )
    return parseIncompletePhoneNumber(number.formatNational());
  return number.number;
}

/** The country to select for a value: its own when allowed, otherwise `fallback`. */
export function phoneCountryOfValue(
  value: string | undefined,
  fallback: PhoneCountry | undefined,
  settings: PhoneInputSettings,
): PhoneCountry | undefined {
  if (settings.country) return settings.country;
  const number = value ? parsePhoneNumberFromString(value, settings.metadata) : undefined;
  if (!number) return fallback;
  const code = number.countryCallingCode;
  // A shared calling code (+1, +7, +44…) keeps the fallback when it is one of them.
  if (fallback !== undefined && getCountryCallingCode(fallback, settings.metadata) === code)
    return number.country && number.country !== fallback && allowedCountry(number.country, settings)
      ? number.country
      : fallback;
  return allowedCountry(number.country, settings);
}

const allowedCountry = (code: PhoneCountry | undefined, settings: PhoneInputSettings) =>
  code !== undefined && (settings.countries === undefined || settings.countries.includes(code))
    ? code
    : undefined;

/** Meaningful characters (digits and a leading `+`) of a text before an index. */
const meaningful = (text: string) => parseIncompletePhoneNumber(text).length;

/** The index in `text` after its `count`-th meaningful character. */
function caretAfter(text: string, count: number): number {
  if (count <= 0) {
    const first = text.search(/[+\d]/);
    return first === -1 ? text.length : first;
  }
  let seen = 0;
  let index = 0;
  while (index < text.length && seen < count) {
    if (/[+\d]/.test(text[index] as string)) seen++;
    index++;
  }
  return index;
}

/** The result of a change typed in the input. */
export interface PhoneInputChange extends PhoneInputView {
  /** The digits after the change (the owner's state). */
  readonly digits: string;
  /** The selected country after the change. */
  readonly country: PhoneCountry | undefined;
  /** Where the caret goes in `text`. */
  readonly caret: number;
}

/**
 * What the input becomes when its text changes to `text` with the caret at `caret`: the digits
 * (a `+` is added when no country is selected, a locked calling code stays), the country
 * (international digits select theirs unless the country is fixed), the formatted text and the
 * caret after the same digit.
 */
export function phoneInputChange(
  text: string,
  caret: number,
  current: PhoneCountry | undefined,
  settings: PhoneInputSettings,
): PhoneInputChange {
  const { metadata } = settings;
  let digits = parseIncompletePhoneNumber(text);
  let count = meaningful(text.slice(0, caret));
  const country = settings.country ?? current;
  if (digits !== "" && !digits.startsWith("+")) {
    if (country === undefined || lockedCode(country, settings)) {
      // Nothing selected (or a locked international code): the digits are international.
      digits = `+${digits}`;
      count++;
    }
  } else if (digits.startsWith("+") && settings.country !== undefined && !settings.international) {
    // A fixed country in national form: a pasted international number of that country is
    // shown nationally; other international digits lose their `+`.
    const own = plusCode(settings.country, metadata);
    const value = phoneInputView(digits, settings.country, settings).value;
    const national = digits.startsWith(own)
      ? value
        ? phoneDigitsFromValue(value, settings.country, settings)
        : ""
      : digits.slice(1);
    count = Math.max(0, count - (digits.length - national.length));
    digits = national;
  }
  if (lockedCode(country, settings)) {
    const code = plusCode(country as PhoneCountry, metadata);
    if (!digits.startsWith(code)) {
      // A deleted or replaced part of the calling code comes back; what follows it stays.
      let common = 0;
      while (common < code.length && digits[common] === code[common]) common++;
      digits = `${code}${digits.slice(common)}`;
      count = Math.max(count + code.length - common, code.length);
    }
  }
  let view = phoneInputView(digits, country, settings);
  if (settings.limitMaxLength) {
    // Refuse the digits typed past the longest number: drop them before the caret.
    while (
      view.value !== "" &&
      validatePhoneNumberLength(view.value, metadata) === "TOO_LONG" &&
      count > 0
    ) {
      digits = digits.slice(0, count - 1) + digits.slice(count);
      count--;
      view = phoneInputView(digits, country, settings);
    }
  }
  let next = country;
  if (settings.country === undefined && digits.startsWith("+")) {
    const detected = allowedCountry(view.detected, settings);
    if (detected !== undefined) next = detected;
    else if (view.callingCode !== undefined)
      next =
        country !== undefined && getCountryCallingCode(country, metadata) === view.callingCode
          ? country
          : undefined;
    if (next !== country) view = phoneInputView(digits, next, settings);
  }
  return { ...view, digits, country: next, caret: caretAfter(view.text, count) };
}

/** The digits after the person picks another country (`undefined`: International). */
export function phoneCountryDigits(
  digits: string,
  previous: PhoneCountry | undefined,
  next: PhoneCountry | undefined,
  settings: PhoneInputSettings,
): string {
  const { metadata } = settings;
  if (next === undefined) {
    // International: national digits become the previous country's international number.
    if (digits === "" || digits.startsWith("+")) return digits;
    return phoneInputView(digits, previous, settings).value;
  }
  const code = plusCode(next, metadata);
  if (settings.international) {
    if (digits === "") return lockedCode(next, settings) ? code : "";
    if (!digits.startsWith("+")) return `${code}${digits}`;
    const old = previous ? plusCode(previous, metadata) : undefined;
    if (old !== undefined && digits.startsWith(old)) return `${code}${digits.slice(old.length)}`;
    return digits.startsWith(code) ? digits : code;
  }
  if (!digits.startsWith("+")) return digits;
  // International digits of the new country are shown nationally; others are cleared.
  if (!digits.startsWith(code)) return "";
  const value = phoneInputView(digits, next, settings).value;
  return value ? phoneDigitsFromValue(value, next, settings) : "";
}

/** A value's forms and checks (`onChange` details, `ok:phone-input:change`). */
export interface PhoneValueDetails {
  /** International form without spaces, such as `+61298765432` (`""` when empty). */
  readonly value: string;
  /** National form, such as `(02) 9876 5432` (`""` when it can't be read). */
  readonly national: string;
  /** International form, such as `+61 2 9876 5432`. */
  readonly international: string;
  /** The number's country, if one matches. */
  readonly country: PhoneCountry | undefined;
  /** The number has a valid length and leading digits for its country (per the metadata). */
  readonly valid: boolean;
  /** The number has a possible length (digits not checked). */
  readonly possible: boolean;
}

/** The forms and checks of an E.164 value. */
export function phoneValueDetails(
  value: string,
  metadata: PhoneMetadata = minMetadata,
): PhoneValueDetails {
  const number = value ? parsePhoneNumberFromString(value, metadata) : undefined;
  if (!number)
    return {
      value,
      national: "",
      international: value ? new AsYouType(undefined, metadata).input(value) : "",
      country: undefined,
      valid: false,
      possible: false,
    };
  return {
    value,
    national: number.formatNational(),
    international: number.formatInternational(),
    country: number.country,
    valid: isValidPhoneNumber(value, metadata),
    possible: isPossiblePhoneNumber(value, metadata),
  };
}

/** Whether a value is a valid phone number (per the metadata: length and leading digits). */
export const isValidPhoneValue = (value: string, metadata: PhoneMetadata = minMetadata) =>
  value !== "" && isValidPhoneNumber(value, metadata);

/** The calling code of a country (`"61"`). */
export const phoneCallingCode = (country: PhoneCountry, metadata: PhoneMetadata = minMetadata) =>
  getCountryCallingCode(country, metadata) as string;

/** A country's flag as an emoji (two regional indicator symbols). */
export const phoneFlag = (country: string) =>
  String.fromCodePoint(
    ...[...country.toUpperCase()].map((letter) => 0x1f1e6 + letter.charCodeAt(0) - 65),
  );

/** Texts of a phone input (react-phone-number-input's `labels`): country names by code, and more. */
export type PhoneInputLabels = Readonly<Record<string, string>> & {
  /** The International option. Default `"International"`. */
  readonly ZZ?: string;
  /** The accessible name of the country select. Default `"Country"`. */
  readonly country?: string;
};

/** One option of the country select. */
export interface PhoneCountryOption {
  readonly code: PhoneCountry;
  /** The country's name in the locale (or from `labels`). */
  readonly name: string;
  readonly callingCode: string;
  readonly flag: string;
}

/** Options of `phoneCountryOptions`. */
export interface PhoneCountryOptionsOptions {
  /** The countries offered (all by default). */
  countries?: readonly PhoneCountry[] | undefined;
  /** Codes shown first, in order; `"..."` places the others (default: after the listed ones). */
  order?: readonly string[] | undefined;
  /** Language of the names (`Intl.DisplayNames`). Default `"en"`. */
  locale?: string | undefined;
  labels?: PhoneInputLabels | undefined;
  metadata?: PhoneMetadata | undefined;
}

/** A display names reader for a locale (`en` when the locale is invalid or unsupported). */
function regionNames(locale: string): (code: string) => string | undefined {
  let names: Intl.DisplayNames;
  try {
    names = new Intl.DisplayNames([locale], { type: "region", fallback: "none" });
  } catch {
    names = new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });
  }
  return (code) => names.of(code);
}

/** The country select's options, sorted by name in the locale, `order` first. */
export function phoneCountryOptions(
  options: PhoneCountryOptionsOptions = {},
): PhoneCountryOption[] {
  const metadata = options.metadata ?? minMetadata;
  const locale = options.locale || "en";
  const name = regionNames(locale);
  let collator: Intl.Collator;
  try {
    collator = new Intl.Collator(locale);
  } catch {
    collator = new Intl.Collator("en");
  }
  const list = (options.countries ?? getCountries(metadata))
    .filter((code) => phoneCountry(code, metadata) !== undefined)
    .map((code) => ({
      code,
      name: options.labels?.[code] ?? name(code) ?? code,
      callingCode: getCountryCallingCode(code, metadata) as string,
      flag: phoneFlag(code),
    }))
    .sort((a, b) => collator.compare(a.name, b.name));
  const order = options.order;
  if (!order || order.length === 0) return list;
  const first: PhoneCountryOption[] = [];
  const last: PhoneCountryOption[] = [];
  // Codes after `"..."` go after the other countries.
  let after = false;
  for (const entry of order) {
    if (entry === "...") {
      after = true;
      continue;
    }
    const option = list.find((item) => item.code === entry.toUpperCase());
    if (option && !first.includes(option) && !last.includes(option))
      (after ? last : first).push(option);
  }
  const others = list.filter((item) => !first.includes(item) && !last.includes(item));
  return [...first, ...others, ...last];
}
