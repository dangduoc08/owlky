import {
  behavior,
  type DataAttributes,
  defineOptions,
  flag,
  native,
  optionAttributes,
  state,
} from "../options/define.js";

// --- Phone input (a text field with a country select, roadmap 4.25, ADR-0061) ------------------

/** A two-letter country code as written in markup (checked against the phone metadata later). */
const COUNTRY_CODE = /^[A-Za-z]{2}$/;
/** A list of country codes (`"AU,NZ"` or `["AU", "NZ"]`), as written in markup. */
const countryCodes = (list: unknown) =>
  (typeof list === "string" ? list.split(/[\s,]+/) : Array.isArray(list) ? list : [])
    .filter((code): code is string => typeof code === "string" && COUNTRY_CODE.test(code))
    .map((code) => code.toUpperCase());

export const phoneInputOptions = defineOptions("phone-input", "data-ok-phone-input", {
  country: state(
    "data-ok-country",
    "A fixed country, such as `AU`: the country select is turned off and numbers are read as this country's.",
  ),
  defaultCountry: state(
    "data-ok-default-country",
    "The country selected at first, such as `DE` (none: the number is typed in international form).",
  ),
  international: flag(
    "data-ok-international",
    "Show numbers in international form (`+61 2 9876 5432`) instead of national (`(02) 9876 5432`).",
  ),
  countryCallingCodeEditable: behavior(
    "data-ok-country-calling-code-editable",
    true,
    "International form with a selected country: the calling code can be changed (`false` keeps it).",
  ),
  hideSelect: flag("data-ok-hide-select", "No country select (the markup leaves it out)."),
  countries: state("data-ok-countries", "The countries offered, such as `AU,NZ` (all by default)."),
  countryOptionsOrder: state(
    "data-ok-country-options-order",
    "Countries listed first, such as `US,CA,...` (`...` places the others).",
  ),
  addInternationalOption: behavior(
    "data-ok-add-international-option",
    true,
    "An International option at the top of the country list (`false` leaves it out).",
  ),
  limitMaxLength: flag(
    "data-ok-limit-max-length",
    "Digits past the longest number of the country are refused.",
  ),
  focusInputOnCountrySelection: behavior(
    "data-ok-focus-input-on-country-selection",
    true,
    "Picking a country moves the focus to the input (`false` keeps it on the select).",
  ),
  locale: state("data-ok-locale", "Language of the country names, such as `fr` (default `en`)."),
  validate: flag(
    "data-ok-validate",
    "After the person leaves the field, an invalid number shows the error state and `invalidText`.",
  ),
  invalidText: state(
    "data-ok-invalid-text",
    "The helper text shown while the number is invalid (with `validate`).",
  ),
  disabled: native(
    "disabled",
    "Native `disabled` on the input; the country select is disabled too.",
    {
      children: ":scope > [data-ok-text-field-control] > [data-ok-text-field-input]",
    },
  ),
  value: state(
    "value",
    "The number as E.164 (`value` / `defaultValue` + `onChange(value, details)`); HTML: the input's text.",
    "change",
  ),
});

export interface PhoneInputAnatomyOptions {
  country?: string | undefined;
  defaultCountry?: string | undefined;
  international?: boolean | undefined;
  countryCallingCodeEditable?: boolean | undefined;
  hideSelect?: boolean | undefined;
  countries?: readonly string[] | undefined;
  countryOptionsOrder?: readonly string[] | undefined;
  addInternationalOption?: boolean | undefined;
  limitMaxLength?: boolean | undefined;
  focusInputOnCountrySelection?: boolean | undefined;
  locale?: string | undefined;
  validate?: boolean | undefined;
  invalidText?: string | undefined;
}

/**
 * `data-ok-*` attributes a phone input adds to its text field root: flags, behaviors turned off
 * (`"false"`), and the text options as written (codes are checked by the runtime).
 */
export function phoneInputAttributes(options: PhoneInputAnatomyOptions = {}): DataAttributes {
  const attributes = optionAttributes(phoneInputOptions, { ...options });
  const o = phoneInputOptions.options;
  const text = (attr: `data-ok-${string}`, value: string | undefined) => {
    if (value) attributes[attr] = value;
  };
  const code = (value: string | undefined) =>
    value && COUNTRY_CODE.test(value) ? value.toUpperCase() : undefined;
  text(o.country.attr as `data-ok-${string}`, code(options.country));
  text(o.defaultCountry.attr as `data-ok-${string}`, code(options.defaultCountry));
  text(
    o.countries.attr as `data-ok-${string}`,
    countryCodes(options.countries).join(",") || undefined,
  );
  text(
    o.countryOptionsOrder.attr as `data-ok-${string}`,
    (options.countryOptionsOrder ?? [])
      .filter((entry) => entry === "..." || COUNTRY_CODE.test(entry))
      .map((entry) => entry.toUpperCase())
      .join(",") || undefined,
  );
  for (const key of [
    "countryCallingCodeEditable",
    "addInternationalOption",
    "focusInputOnCountrySelection",
  ] as const)
    if (options[key] === false) attributes[o[key].attr] = "false";
  text(o.locale.attr as `data-ok-${string}`, options.locale);
  text(
    o.invalidText.attr as `data-ok-${string}`,
    options.validate ? options.invalidText : undefined,
  );
  return attributes;
}
