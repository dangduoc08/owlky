import { createIcon, globalLinear, phoneInputOptions, readBehavior } from "@owlky/core";
import {
  createPhoneInputController,
  type PhoneCountry,
  type PhoneInputLabels,
  type PhoneMetadata,
  type PhoneValueDetails,
  phoneCountry,
  phoneCountryDigits,
  phoneCountryOfValue,
  phoneCountryOptions,
  phoneDigitsFromValue,
  phoneFlagSource,
  phoneInputChange,
  phoneInputView,
  phoneMetadata,
  phoneValueDetails,
  readPhoneInputSettings,
  writePhoneInput,
} from "@owlky/core/phone";
import { defineComponent } from "../../runtime/define.js";
import type { ComponentInstance, EventSpec } from "../../runtime/types.js";
import type { SelectInstance } from "../select/select.js";

/** Events of this component (`ok:<name>:<event>` on the root). */
export interface PhoneInputEvents {
  /**
   * After the number changed: `value` (international form such as `+61298765432`, `""` when there is no number), `national`,
   * `international`, `country`, `valid` and `possible`.
   */
  change: EventSpec<PhoneValueDetails>;
  /** After the selected country changed (`country` is `undefined` for International). */
  countrychange: EventSpec<{ country: PhoneCountry | undefined }>;
}

export interface PhoneInputInstance extends ComponentInstance {
  /** The number in international form without spaces, such as `+61298765432` (`""` when there is none). */
  readonly value: string;
  /** Sets the number (such as `+61298765432`) without emitting events; its country is selected. */
  setValue(value: string): void;
  /** The selected country (`undefined`: International). */
  readonly country: PhoneCountry | undefined;
  /** Selects a country (`undefined`: International) without emitting events, as a pick would. */
  setCountry(country: string | undefined): void;
  /** The number's national and international forms and checks. */
  readonly details: PhoneValueDetails;
}

/** Options only JavaScript can give: `createPhoneInput({ … })`. */
export interface CreatePhoneInputOptions {
  /** Phone metadata from libphonenumber-js (`min`, `mobile` or `max`). Default: `min`. */
  metadata?: PhoneMetadata | undefined;
  /** Country names and the International option's text: `{ AU: "Australie", ZZ: "International" }`. */
  labels?: PhoneInputLabels | undefined;
}

const CONTROL = ":scope > [data-ok-text-field-control]";
const INPUT = `${CONTROL} > input[data-ok-text-field-input]`;
const SELECT = `${CONTROL} > [data-ok-phone-input-country] > [data-ok-select]`;
const o = phoneInputOptions.options;
/** Root attributes that change how digits are read: the digits are derived again. */
const SETTINGS = [
  o.country.attr,
  o.defaultCountry.attr,
  o.international.attr,
  o.countryCallingCodeEditable.attr,
  o.limitMaxLength.attr,
  o.countries.attr,
];

const set = (element: Element, attributes: Record<string, string>) => {
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, value);
};

/** The globe of the International option, as React renders it. */
function globe(document: Document): SVGSVGElement {
  return createIcon(globalLinear, {}, document);
}

let defaultFlags: string | undefined;

/** The folder of the flag images for roots that name none (the CDN module sets it). */
export const setPhoneFlagsPath = (folder: string | undefined) => {
  defaultFlags = folder;
};

/** A flag: the image of image mode (decorative, lazy), else the emoji. */
function flagNode(document: Document, code: string, emoji: string, root: Element): Node {
  const src =
    root.getAttribute("data-ok-flags") === "image" &&
    phoneFlagSource(root.getAttribute("data-ok-flags-path") ?? defaultFlags, code);
  if (!src) return document.createTextNode(emoji);
  const image = document.createElement("img");
  set(image, {
    "data-ok-phone-input-flag-image": "",
    src,
    alt: "",
    loading: "lazy",
    decoding: "async",
  });
  return image;
}

/** One country option: a MenuItem with a ListItemIcon (the flag) and a ListItemText. */
function option(
  document: Document,
  value: string,
  flag: Node,
  primary: string,
  secondary?: string,
): HTMLLIElement {
  const item = document.createElement("li");
  set(item, {
    role: "option",
    tabindex: "-1",
    "data-ok-menu-item": "",
    "aria-selected": "false",
    "data-ok-value": value,
  });
  const icon = document.createElement("span");
  set(icon, {
    "data-ok-list-item-icon": "",
    "data-ok-phone-input-flag": "",
    "aria-hidden": "true",
  });
  icon.append(flag);
  const text = document.createElement("span");
  text.setAttribute("data-ok-list-item-text", "");
  const lines: [string, string | undefined][] = [
    ["data-ok-list-item-text-primary", primary],
    ["data-ok-list-item-text-secondary", secondary],
  ];
  for (const [part, content] of lines) {
    if (content === undefined) continue;
    const line = document.createElement("span");
    line.setAttribute(part, "");
    line.textContent = content;
    text.append(line);
  }
  item.append(icon, text);
  return item;
}

/**
 * Phone input — spec: specs/components/phone-input.md (ADR-0061). Opt-in: import
 * `@owlky/html/phone` (it holds the phone metadata); on a CDN page, `owlky.js` loads it (ADR-0068).
 * `createPhoneInput({ metadata, labels })` uses other metadata or country names.
 *
 * Markup:  <div data-ok-text-field data-ok-variant="outlined" … data-ok-phone-input data-ok-default-country="AU">
 *            <label data-ok-text-field-label for="phone">Phone number</label>
 *            <div data-ok-text-field-control>
 *              <div data-ok-text-field-adornment="start" data-ok-phone-input-country>
 *                <div data-ok-select data-ok-display-empty> (a Select: trigger `aria-label="Country"`,
 *                  hidden input, icon, popover with an empty `ul[data-ok-select-listbox]`) </div>
 *              </div>
 *              <input id="phone" data-ok-text-field-input type="tel" autocomplete="tel" placeholder=" ">
 *              <fieldset data-ok-text-field-outline aria-hidden="true">…</fieldset>
 *            </div>
 *          </div>
 * Behavior: fills the listbox with the countries (DOM methods), formats what is typed (core
 *          controller and model), selects the country of an international number and keeps the
 *          Select's value; a pick rewrites the number for that country. With `data-ok-validate`,
 *          leaving the field with an invalid number sets `data-ok-error` and shows
 *          `data-ok-invalid-text` in the helper text.
 * Events:  ok:phone-input:change (the value's details), ok:phone-input:countrychange (`{ country }`).
 */
export const createPhoneInput = (setup: CreatePhoneInputOptions = {}) =>
  defineComponent<PhoneInputInstance, PhoneInputEvents>({
    name: "phone-input",
    selector: "[data-ok-phone-input]",

    setup(element, { emit, runtime, signal }) {
      const metadata = setup.metadata ?? phoneMetadata;
      const input = element.querySelector<HTMLInputElement>(INPUT);
      const empty: PhoneInputInstance = {
        value: "",
        setValue() {},
        country: undefined,
        setCountry() {},
        details: phoneValueDetails("", metadata),
      };
      if (!input) return empty;
      const document = element.ownerDocument;
      const selectRoot = element.querySelector<HTMLElement>(SELECT);
      const listbox = selectRoot?.querySelector<HTMLElement>("[data-ok-select-listbox]") ?? null;
      const hiddenInput = selectRoot?.querySelector<HTMLInputElement>(
        ":scope > [data-ok-select-input]",
      );
      let settings = readPhoneInputSettings(element, metadata);

      // The country list (left empty in the markup: the runtime holds the metadata).
      if (listbox && !listbox.querySelector('[role="option"]')) {
        const order = element.getAttribute(o.countryOptionsOrder.attr)?.split(/[\s,]+/);
        const items: HTMLLIElement[] = [];
        if (readBehavior(element, o.addInternationalOption) && !settings.country)
          items.push(option(document, "", globe(document), setup.labels?.ZZ ?? "International"));
        for (const country of phoneCountryOptions({
          countries: settings.countries,
          order,
          locale: element.getAttribute(o.locale.attr) ?? undefined,
          labels: setup.labels,
          metadata,
        }))
          items.push(
            option(
              document,
              country.code,
              flagNode(document, country.code, country.flag, element),
              country.name,
              `${country.code} (+${country.callingCode})`,
            ),
          );
        listbox.append(...items);
      }
      const select = () =>
        selectRoot ? runtime.getOrCreate<SelectInstance>(selectRoot, "select") : undefined;

      // The selected country: fixed, else the Select's value, else the default one.
      const initial = phoneInputChange(
        input.value,
        input.value.length,
        settings.country ??
          (hiddenInput ? phoneCountry(hiddenInput.value, metadata) : settings.defaultCountry),
        settings,
      );
      let digits = initial.digits;
      let country = initial.country;
      let touched = false;
      const view = () => phoneInputView(digits, settings.country ?? country, settings);
      let value = initial.value;

      // Validation: the error state and the helper text it shows (the original text is kept).
      const helper = element.querySelector<HTMLElement>(":scope > [data-ok-text-field-helper]");
      const helperNodes = helper ? [...helper.childNodes] : [];
      let errorSet = false;
      let showingInvalid = false;
      const validate = () => {
        const invalid =
          element.hasAttribute(o.validate.attr) &&
          touched &&
          value !== "" &&
          !phoneValueDetails(value, metadata).valid;
        if (invalid && !element.hasAttribute("data-ok-error")) {
          element.setAttribute("data-ok-error", "");
          errorSet = true;
        } else if (!invalid && errorSet) {
          element.removeAttribute("data-ok-error");
          errorSet = false;
        }
        const text = element.getAttribute(o.invalidText.attr);
        if (!helper || text === null || invalid === showingInvalid) return;
        showingInvalid = invalid;
        if (invalid) helper.replaceChildren(text);
        else helper.replaceChildren(...helperNodes);
      };

      /** Writes the text and the Select's value. */
      const render = (caret?: number) => {
        const { text } = view();
        writePhoneInput(input, text, caret ?? text.length);
        const instance = select();
        const selected = settings.country ?? country ?? "";
        // The option of the value is marked too, International ("") included (as React does).
        const marked = listbox?.querySelector(`[role="option"][aria-selected="true"]`);
        const current = marked?.getAttribute("data-ok-value") === selected;
        if (instance && (instance.value !== selected || !current)) instance.setValue(selected);
        validate();
      };

      /** Stores new digits and reports what changed. */
      const apply = (next: string, nextCountry: PhoneCountry | undefined, caret?: number) => {
        const was = { value, country };
        digits = next;
        country = nextCountry;
        value = view().value;
        render(caret);
        if (country !== was.country) emit("countrychange", { country });
        if (value !== was.value) emit("change", phoneValueDetails(value, metadata));
      };

      const controller = createPhoneInputController(input, {
        onInput(text, caret) {
          const result = phoneInputChange(text, caret, country, settings);
          apply(result.digits, result.country, result.caret);
        },
      });

      // A pick in the country select (its own change event, before it closes).
      selectRoot?.addEventListener(
        "ok:select:change",
        (event) => {
          if (event.target !== selectRoot) return;
          const picked = (event as CustomEvent<{ value: string }>).detail.value;
          const next = phoneCountry(picked, metadata);
          apply(phoneCountryDigits(digits, country, next, settings), next);
          // Before the list closes: the popover then leaves the focus where it is.
          if (readBehavior(element, o.focusInputOnCountrySelection)) input.focus();
        },
        { signal },
      );
      input.addEventListener(
        "focusout",
        () => {
          touched = true;
          validate();
        },
        { signal },
      );

      // Settings on the root, and the input's disabled / read-only state (the select follows it).
      const observer = new MutationObserver((records) => {
        if (records.some((record) => record.target === element)) {
          settings = readPhoneInputSettings(element, metadata);
          const kept = settings.country ?? country ?? settings.defaultCountry;
          country = settings.country ?? kept;
          digits = phoneDigitsFromValue(value, country, settings);
          value = view().value;
          render();
        }
        if (hiddenInput) {
          const off = input.disabled || input.readOnly || settings.country !== undefined;
          if (hiddenInput.disabled !== off) hiddenInput.disabled = off;
        }
      });
      observer.observe(element, { attributes: true, attributeFilter: SETTINGS });
      observer.observe(input, { attributes: true, attributeFilter: ["disabled", "readonly"] });

      render();

      return {
        get value() {
          return value;
        },
        setValue(next) {
          country = phoneCountryOfValue(next, country, settings);
          digits = phoneDigitsFromValue(next, settings.country ?? country, settings);
          value = view().value;
          render();
        },
        get country() {
          return settings.country ?? country;
        },
        setCountry(next) {
          if (settings.country) return;
          const code = phoneCountry(next, metadata);
          digits = phoneCountryDigits(digits, country, code, settings);
          country = code;
          value = view().value;
          render();
        },
        get details() {
          return phoneValueDetails(value, metadata);
        },
        destroy() {
          controller.destroy();
          observer.disconnect();
        },
      };
    },
  });

/** The phone input with the default (`min`) metadata, registered by `@owlky/html/phone`. */
export const phoneInput = createPhoneInput();
