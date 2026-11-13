import maxMetadata from "libphonenumber-js/max/metadata";
import { describe, expect, it } from "vitest";
import {
  phoneFlagFolder,
  phoneFlagSource,
  phoneInputAttributes,
  phoneInputOptions,
} from "../anatomy/anatomy.js";
import {
  isValidPhoneValue,
  phoneCallingCode,
  phoneCountry,
  phoneCountryDigits,
  phoneCountryList,
  phoneCountryOfValue,
  phoneCountryOptions,
  phoneDigitsFromValue,
  phoneFlag,
  phoneInputChange,
  phoneInputSettings,
  phoneInputView,
  phoneMetadata,
  phoneValueDetails,
  readPhoneInputSettings,
} from "./phone.js";

const auto = phoneInputSettings();
const au = phoneInputSettings({ defaultCountry: "AU" });
const fixed = phoneInputSettings({ country: "AU" });
const fixedIntl = phoneInputSettings({ country: "AU", international: true });

describe("phone input anatomy", () => {
  it("writes flags, turned-off behaviors and text options as written", () => {
    expect(phoneInputAttributes()).toEqual({ "data-ok-phone-input": "" });
    expect(
      phoneInputAttributes({
        country: "au",
        defaultCountry: "de",
        international: true,
        countryCallingCodeEditable: false,
        hideSelect: true,
        countries: ["au", "NZ", "bad", "x"],
        countryOptionsOrder: ["us", "...", "|", "<b>"],
        addInternationalOption: false,
        limitMaxLength: true,
        focusInputOnCountrySelection: false,
        locale: "fr",
        validate: true,
        invalidText: "Enter a valid number",
      }),
    ).toEqual({
      "data-ok-phone-input": "",
      "data-ok-country": "AU",
      "data-ok-default-country": "DE",
      "data-ok-international": "",
      "data-ok-country-calling-code-editable": "false",
      "data-ok-hide-select": "",
      "data-ok-countries": "AU,NZ",
      "data-ok-country-options-order": "US,...",
      "data-ok-add-international-option": "false",
      "data-ok-limit-max-length": "",
      "data-ok-focus-input-on-country-selection": "false",
      "data-ok-locale": "fr",
      "data-ok-validate": "",
      "data-ok-invalid-text": "Enter a valid number",
    });
    // Invalid codes and an invalid text without `validate` are left out.
    expect(phoneInputAttributes({ country: "AUS", countries: [], invalidText: "Wrong" })).toEqual({
      "data-ok-phone-input": "",
    });
    expect(phoneInputOptions.root).toBe("data-ok-phone-input");
  });
});

describe("phone input settings", () => {
  it("checks countries against the metadata", () => {
    expect(phoneCountry("au")).toBe("AU");
    expect(phoneCountry(" vn ")).toBe("VN");
    expect(phoneCountry("XX")).toBeUndefined();
    expect(phoneCountry("AUS")).toBeUndefined();
    expect(phoneCountry(42)).toBeUndefined();
    expect(phoneCountryList("au, nz XX")).toEqual(["AU", "NZ"]);
    expect(phoneCountryList(["VN", "vn"])).toEqual(["VN"]);
    expect(phoneCountryList("XX")).toBeUndefined();
    expect(phoneCountryList(null)).toBeUndefined();
  });

  it("defaults, and drops countries outside the list", () => {
    expect(auto).toEqual({
      country: undefined,
      defaultCountry: undefined,
      international: false,
      countryCallingCodeEditable: true,
      limitMaxLength: false,
      countries: undefined,
      metadata: phoneMetadata,
    });
    const limited = phoneInputSettings({
      countries: ["NZ"],
      country: "AU",
      defaultCountry: "nz",
      metadata: maxMetadata,
    });
    expect(limited.country).toBeUndefined();
    expect(limited.defaultCountry).toBe("NZ");
    expect(limited.metadata).toBe(maxMetadata);
  });

  it("reads the root's attributes", () => {
    const root = document.createElement("div");
    for (const [name, value] of Object.entries({
      "data-ok-country": "au",
      "data-ok-default-country": "DE",
      "data-ok-international": "",
      "data-ok-country-calling-code-editable": "false",
      "data-ok-limit-max-length": "",
      "data-ok-countries": "AU,DE",
    }))
      root.setAttribute(name, value);
    expect(readPhoneInputSettings(root)).toMatchObject({
      country: "AU",
      defaultCountry: "DE",
      international: true,
      countryCallingCodeEditable: false,
      limitMaxLength: true,
      countries: ["AU", "DE"],
    });
    expect(readPhoneInputSettings(document.createElement("div"))).toEqual(auto);
  });
});

describe("phone input model", () => {
  it("formats digits as you type, with the E.164 value", () => {
    expect(phoneInputView("0298765432", "AU", au)).toEqual({
      text: "(02) 9876 5432",
      value: "+61298765432",
      detected: "AU",
      callingCode: undefined,
    });
    expect(phoneInputView("+61298765432", undefined, auto).text).toBe("+61 2 9876 5432");
    // The national prefix alone and a bare `+` have no number yet.
    expect(phoneInputView("0", "AU", au).value).toBe("");
    expect(phoneInputView("+", undefined, auto).value).toBe("");
    expect(phoneInputView("", undefined, auto).text).toBe("");
  });

  it("shows a value nationally under its own country, else internationally", () => {
    expect(phoneDigitsFromValue("+61298765432", "AU", au)).toBe("0298765432");
    expect(phoneDigitsFromValue("+61298765432", "VN", au)).toBe("+61298765432");
    expect(phoneDigitsFromValue("+61298765432", "AU", fixedIntl)).toBe("+61298765432");
    expect(phoneDigitsFromValue("", "AU", au)).toBe("");
    expect(phoneDigitsFromValue(undefined, undefined, auto)).toBe("");
    expect(phoneDigitsFromValue("nonsense", "AU", au)).toBe("");
    // A locked calling code shows even without a number.
    expect(phoneDigitsFromValue("", "AU", fixedIntl)).toBe("+61");
  });

  it("finds the country of a value", () => {
    expect(phoneCountryOfValue("+61298765432", undefined, auto)).toBe("AU");
    expect(phoneCountryOfValue("+61298765432", "DE", auto)).toBe("AU");
    expect(phoneCountryOfValue("", "DE", auto)).toBe("DE");
    expect(phoneCountryOfValue("+84912345678", undefined, fixed)).toBe("AU");
    // A shared calling code: the number's own country, else the fallback that shares it.
    expect(phoneCountryOfValue("+12133734253", "CA", auto)).toBe("US");
    expect(phoneCountryOfValue("+1999", "CA", auto)).toBe("CA");
    // A country outside the list isn't selected.
    const nz = phoneInputSettings({ countries: ["NZ"] });
    expect(phoneCountryOfValue("+61298765432", undefined, nz)).toBeUndefined();
    expect(
      phoneCountryOfValue("+12133734253", "US", phoneInputSettings({ countries: ["US"] })),
    ).toBe("US");
  });

  it("starts an international number when no country is selected", () => {
    const typed = phoneInputChange("8", 1, undefined, auto);
    expect(typed).toMatchObject({
      text: "+8",
      digits: "+8",
      value: "",
      country: undefined,
      caret: 2,
    });
    const vn = phoneInputChange("+84912345678", 12, undefined, auto);
    expect(vn).toMatchObject({ text: "+84 912 345 678", value: "+84912345678", country: "VN" });
    expect(vn.caret).toBe(vn.text.length);
  });

  it("selects the country of the calling code, or International for a shared one", () => {
    expect(phoneInputChange("+1", 2, "AU", auto).country).toBeUndefined();
    expect(phoneInputChange("+1", 2, "CA", auto).country).toBe("CA");
    expect(phoneInputChange("+", 1, "AU", auto).country).toBe("AU");
    // A detected country outside the list: International.
    expect(
      phoneInputChange("+61298765432", 12, undefined, phoneInputSettings({ countries: ["NZ"] }))
        .country,
    ).toBeUndefined();
  });

  it("reads national digits as the selected country's and keeps the caret after its digit", () => {
    const typed = phoneInputChange("0298765432", 3, "AU", au);
    expect(typed).toMatchObject({ text: "(02) 9876 5432", value: "+61298765432", country: "AU" });
    // Three digits before the caret: "(02) 9|876 5432".
    expect(typed.caret).toBe(6);
    expect(phoneInputChange("(02) 9876 5432abc", 0, "AU", au).caret).toBe(1);
    expect(phoneInputChange("", 0, "AU", au)).toMatchObject({ text: "", caret: 0, value: "" });
  });

  it("keeps a fixed country: national form, pasted numbers of that country, others lose the +", () => {
    expect(phoneInputChange("+61298765432", 12, "AU", fixed)).toMatchObject({
      text: "(02) 9876 5432",
      country: "AU",
    });
    expect(phoneInputChange("+61", 3, "AU", fixed).text).toBe("");
    expect(phoneInputChange("+8491", 5, "AU", fixed).digits).toBe("8491");
    expect(phoneInputChange("+84912345678", 3, "AU", fixed).country).toBe("AU");
  });

  it("keeps a locked calling code in front", () => {
    expect(phoneInputChange("+61 2 9876 543", 14, "AU", fixedIntl).text).toBe("+61 2 9876 543");
    expect(phoneInputChange("+6", 2, "AU", fixedIntl)).toMatchObject({ text: "+61", caret: 3 });
    expect(phoneInputChange("", 0, "AU", fixedIntl).text).toBe("+61");
    expect(phoneInputChange("29", 2, "AU", fixedIntl).text).toBe("+61 2 9");
    // A deleted digit of the code comes back; what follows stays.
    expect(phoneInputChange("+6 2 9876", 2, "AU", fixedIntl).text).toBe("+61 2 9876");
    const locked = phoneInputSettings({ international: true, countryCallingCodeEditable: false });
    expect(phoneInputChange("+44", 3, "AU", locked).text).toBe("+61 44");
    // Editable: the code can change, and the country follows it.
    const editable = phoneInputSettings({ international: true });
    expect(phoneInputChange("+84", 3, "AU", editable).country).toBe("VN");
  });

  it("refuses digits past the longest number with limitMaxLength", () => {
    const limited = phoneInputSettings({ defaultCountry: "US", limitMaxLength: true });
    const typed = phoneInputChange("21337342539", 11, "US", limited);
    expect(typed.value).toBe("+12133734253");
    expect(typed.caret).toBe(typed.text.length);
    // Without the limit the extra digit stays.
    expect(phoneInputChange("21337342539", 11, "US", phoneInputSettings()).digits).toBe(
      "21337342539",
    );
  });

  it("rewrites the digits for a picked country", () => {
    // International: national digits become the previous country's number.
    expect(phoneCountryDigits("0298765432", "AU", undefined, au)).toBe("+61298765432");
    expect(phoneCountryDigits("+849", "VN", undefined, au)).toBe("+849");
    expect(phoneCountryDigits("", "AU", undefined, au)).toBe("");
    // National form: national digits stay; international ones of the new country turn national.
    expect(phoneCountryDigits("0298765432", "AU", "NZ", au)).toBe("0298765432");
    expect(phoneCountryDigits("+84912345678", undefined, "VN", au)).toBe("0912345678");
    expect(phoneCountryDigits("+84", undefined, "VN", au)).toBe("");
    expect(phoneCountryDigits("+61298765432", "AU", "VN", au)).toBe("");
    // International form: the calling code changes.
    const intl = phoneInputSettings({ international: true });
    expect(phoneCountryDigits("+61298765432", "AU", "NZ", intl)).toBe("+64298765432");
    expect(phoneCountryDigits("+64298", undefined, "NZ", intl)).toBe("+64298");
    expect(phoneCountryDigits("+44", undefined, "NZ", intl)).toBe("+64");
    expect(phoneCountryDigits("298", "AU", "NZ", intl)).toBe("+64298");
    expect(phoneCountryDigits("", "AU", "NZ", intl)).toBe("");
    const locked = phoneInputSettings({ international: true, countryCallingCodeEditable: false });
    expect(phoneCountryDigits("", "AU", "NZ", locked)).toBe("+64");
  });

  it("describes a value", () => {
    expect(phoneValueDetails("+61298765432")).toEqual({
      value: "+61298765432",
      national: "(02) 9876 5432",
      international: "+61 2 9876 5432",
      country: "AU",
      valid: true,
      possible: true,
    });
    expect(phoneValueDetails("+612")).toEqual({
      value: "+612",
      national: "",
      international: "+61 2",
      country: undefined,
      valid: false,
      possible: false,
    });
    expect(phoneValueDetails("")).toMatchObject({ international: "", valid: false });
    expect(isValidPhoneValue("+61298765432")).toBe(true);
    expect(isValidPhoneValue("+6129876")).toBe(false);
    expect(isValidPhoneValue("")).toBe(false);
    expect(phoneCallingCode("VN")).toBe("84");
  });

  it("draws flags as regional indicator emoji", () => {
    expect(phoneFlag("au")).toBe("🇦🇺");
    expect(phoneFlag("VN")).toBe("🇻🇳");
  });
});

describe("country options", () => {
  it("lists every country by name, with its calling code and flag", () => {
    const all = phoneCountryOptions();
    expect(all.length).toBeGreaterThan(200);
    expect(all[0]?.name.localeCompare(all[1]?.name as string)).toBeLessThan(0);
    expect(all.find((option) => option.code === "AU")).toEqual({
      code: "AU",
      name: "Australia",
      callingCode: "61",
      flag: "🇦🇺",
    });
  });

  it("takes a list, labels, a locale and an order", () => {
    const options = phoneCountryOptions({
      countries: ["VN", "AU", "DE"],
      labels: { DE: "Deutschland" },
      locale: "fr",
      order: ["vn", "...", "AU", "XX", "VN"],
    });
    expect(options.map((option) => option.code)).toEqual(["VN", "DE", "AU"]);
    expect(options.map((option) => option.name)).toEqual(["Viêt Nam", "Deutschland", "Australie"]);
    // Without "...", the others follow the listed ones; an empty order keeps the sort.
    expect(
      phoneCountryOptions({ countries: ["AU", "DE", "VN"], order: ["VN"] }).map((o) => o.code),
    ).toEqual(["VN", "AU", "DE"]);
    expect(phoneCountryOptions({ countries: ["DE", "AU"], order: [] }).map((o) => o.code)).toEqual([
      "AU",
      "DE",
    ]);
  });

  it("falls back to English for an invalid locale, and to the code without a name", () => {
    const options = phoneCountryOptions({ countries: ["AU"], locale: "not a locale!" });
    expect(options[0]?.name).toBe("Australia");
    // A code the metadata doesn't know is dropped.
    expect(phoneCountryOptions({ countries: ["XX" as "AU", "AU"] }).map((o) => o.code)).toEqual([
      "AU",
    ]);
    // A code without a display name (non-geographic "001"-style entries don't exist here): the code.
    expect(phoneCountryOptions({ countries: ["AC"] })[0]?.name).toMatch(/Ascension|AC/);
  });
});

describe("flag images", () => {
  it("builds a URL from a folder and a two-letter code", () => {
    expect(phoneFlagSource("/flags", "AU")).toBe("/flags/au.svg");
    expect(phoneFlagSource("https://cdn.example/f/", "vn")).toBe("https://cdn.example/f/vn.svg");
    expect(phoneFlagSource("flags/", "A1")).toBeUndefined();
    expect(phoneFlagSource("flags/", "AUS")).toBeUndefined();
    expect(phoneFlagSource(undefined, "AU")).toBeUndefined();
  });

  it("refuses unsafe folders", () => {
    for (const path of [
      "javascript:alert(1)/",
      "data:image/svg+xml,x",
      '/x" onerror="y',
      "/a b/",
      "/a<b/",
      "",
      "  ",
    ])
      expect(phoneFlagFolder(path)).toBeUndefined();
    expect(phoneFlagFolder("../flags")).toBe("../flags/");
    expect(phoneFlagFolder("https://cdn.test:8080/f/")).toBe("https://cdn.test:8080/f/");
  });

  it("writes the attributes only for image flags with a safe folder", () => {
    expect(phoneInputAttributes({ flags: "image", flagsPath: "/f" })).toMatchObject({
      "data-ok-flags": "image",
      "data-ok-flags-path": "/f/",
    });
    const emoji = phoneInputAttributes({ flags: "emoji", flagsPath: "/f" });
    expect(emoji["data-ok-flags"]).toBe("emoji");
    expect(phoneInputAttributes()).not.toHaveProperty("data-ok-flags");
    expect(emoji).not.toHaveProperty("data-ok-flags-path");
    expect(phoneInputAttributes({ flags: "image", flagsPath: "javascript:x" })).not.toHaveProperty(
      "data-ok-flags-path",
    );
  });
});
