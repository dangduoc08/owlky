import { phoneInputOptions } from "@owlky/core";
import phoneInputApi from "@owlky/docs-content/api/phone-input.json" with { type: "json" };
import { apiReferenceSection } from "@owlky/docs-content/guide/api-data";
import { PhoneInput } from "@owlky/react";
import autoGroup from "../../../../../packages/html/src/components/phone-input/examples/phone-input-auto.html?raw";
import defaultCountryGroup from "../../../../../packages/html/src/components/phone-input/examples/phone-input-default-country.html?raw";
import fixedGroup from "../../../../../packages/html/src/components/phone-input/examples/phone-input-fixed-international.html?raw";
import imageFlagsGroup from "../../../../../packages/html/src/components/phone-input/examples/phone-input-image-flags.html?raw";
import validationGroup from "../../../../../packages/html/src/components/phone-input/examples/validation-invalid.html?raw";
import { CDN, GuideDocs, type GuideSection, Preview } from "../../helpers/guide.js";
import { KeyboardTable, OptionsTable, PropsTable } from "../../helpers/guide-tables.js";
import { snippetElement } from "../../helpers/snippet-markup.js";

/** A phone input's root element from a story snippet (without the demo's values). */
const field = (markup: string) => snippetElement(markup, "data-ok-phone-input");

export const phoneInputSections: GuideSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: `A phone input is a text field for phone numbers. A country select with flags sits at its start, the number is formatted as people type it, and the value is the number in international E.164 form, such as \`+61298765432\`. Typing a number that starts with \`+\` selects its country.

Pages without a phone input don't download the phone numbering data (about 35 kB compressed). On a CDN page, \`owlky.js\` loads the phone input when the page holds one. With a bundler, import \`@owlky/html/phone\` after \`@owlky/html/auto\`. In HTML, leave the country list empty: the script fills it. Without JavaScript, the field still works as a plain telephone input.`,
    html: `<!-- Load once per page: owlky.js loads the phone input when the page holds one -->
<link rel="stylesheet" href="${CDN}/owlky.css">
<script src="${CDN}/owlky.js" defer></script>

${field(autoGroup)}`,
    react: `import { PhoneInput } from "@owlky/react";
import { useState } from "react";

export function Contact() {
  const [phone, setPhone] = useState("");
  return (
    <PhoneInput
      id="phone-auto"
      label="Phone number"
      placeholder="Enter phone number"
      fullWidth
      value={phone}
      onChange={setPhone}
    />
  );
}`,
  },
  {
    id: "countries",
    title: "Choose the countries",
    body: `Set \`defaultCountry\` to the country most people use, such as \`DE\`: numbers typed without \`+\` are read as that country's, and people can still pick another country. Set \`country\` instead to accept one country only: the select is turned off and shows its flag.

Limit the list with \`countries\`, and put the most common ones first with \`countryOptionsOrder\`, where \`"..."\` stands for the other countries. The list starts with an International option unless \`addInternationalOption\` is off. Country names come from the browser in the language of \`locale\`, English by default. \`labels\` replaces any of them, and \`labels.country\` names the select for screen readers.`,
    html: field(defaultCountryGroup),
    react: `import { PhoneInput } from "@owlky/react";

export function Delivery() {
  return (
    <PhoneInput
      id="phone-default-country"
      label="Phone number"
      placeholder="Enter phone number"
      fullWidth
      defaultCountry="DE"
      countries={["DE", "AT", "CH", "FR", "GB"]}
      countryOptionsOrder={["DE", "AT", "CH"]}
    />
  );
}`,
  },
  {
    id: "international",
    title: "Show the international form",
    body: `By default, a number of the selected country shows in national form, such as \`(02) 9876 5432\`. Turn on \`international\` to show \`+61 2 9876 5432\` instead. With a fixed \`country\`, the calling code then stays in front of the number: deleting it puts it back. Turn off \`countryCallingCodeEditable\` for the same behavior with a country people can change. Add \`hideSelect\` to leave the select out, for example when the country is fixed.

Turn on \`limitMaxLength\` to refuse digits past the longest number of the country.`,
    html: field(fixedGroup),
    react: `import { PhoneInput } from "@owlky/react";

export function Office() {
  return (
    <PhoneInput
      id="phone-fixed-international"
      label="Phone number"
      placeholder="Enter phone number"
      fullWidth
      country="AU"
      international
      defaultValue="+61298765432"
    />
  );
}`,
  },
  {
    id: "flags",
    title: "Use image flags",
    body: `Flags are emoji by default, which cost no bytes. Windows shows flag emoji as two letters, so set \`flags="image"\` to draw round Circle Flags pictures instead. Each picture is a separate SVG file that loads only when its country scrolls into view.

The \`@owlky/html\` package ships the files in \`dist/flags/\`, one per lowercase country code (\`au.svg\`). Host that folder yourself and name it with \`flagsPath\`. A page that loads the CDN bundle finds the folder next to \`owlky.js\`, so it needs no path. Without a folder, the flags stay emoji.`,
    html: field(imageFlagsGroup),
    react: `import { PhoneInput } from "@owlky/react";

// Copy node_modules/@owlky/html/dist/flags to your public folder first.
export function Office() {
  return (
    <PhoneInput
      id="phone-image-flags"
      label="Phone number"
      placeholder="Enter phone number"
      fullWidth
      defaultCountry="AU"
      flags="image"
      flagsPath="/flags/"
    />
  );
}`,
  },
  {
    id: "values",
    title: "Read the values and validate",
    body: `The value is always E.164, which servers and phone APIs accept: store it, and send it back as \`value\` or \`defaultValue\`. The field reports the other forms with each change: \`national\`, \`international\`, the number's \`country\`, and whether it is \`valid\` (a possible length and leading digits for its country) or only \`possible\` (a possible length). An empty field has the value \`""\`.

Turn on \`validate\` to mark an invalid number for people: once they leave the field, a number that isn't valid shows the error colors, sets \`aria-invalid\` and replaces the helper text with \`invalidText\`. Validation uses compact numbering data, so check numbers again on your server with full data when they must be exact.`,
    html: `${field(validationGroup)}

<script type="module">
  // Read the value and its forms after each change.
  document.getElementById("phone-validation").closest("[data-ok-phone-input]")
    .addEventListener("ok:phone-input:change", (event) => {
      const { value, national, valid } = event.detail;
      console.log(value, national, valid);
    });
</script>`,
    react: `import { PhoneInput } from "@owlky/react";
import { useState } from "react";

export function Callback() {
  const [phone, setPhone] = useState("");
  const [national, setNational] = useState("");
  return (
    <>
      <PhoneInput
        id="phone-validation"
        label="Phone number"
        placeholder="Enter phone number"
        fullWidth
        defaultCountry="US"
        validate
        invalidText="Enter a valid phone number"
        helperText="We only call about your order"
        value={phone}
        onChange={(value, details) => {
          setPhone(value);
          setNational(details.national);
        }}
      />
      <p>{national}</p>
    </>
  );
}`,
  },
  {
    id: "options",
    title: "Options",
    body: "Every option works the same way in both versions: a prop in React, an attribute in HTML. The phone input also takes every text field option, such as `variant`, `size` and `helperText`.",
  },
  {
    id: "props",
    title: "Content and behavior",
    body: "These props set the value and the texts. Country names and other numbering data go to `createPhoneInput()` in HTML.",
  },
  {
    id: "events",
    title: "Events and methods",
    body: `- **\`ok:phone-input:change\`** fires on the root after the number changed, with \`detail.value\` (E.164, \`""\` when empty), \`national\`, \`international\`, \`country\`, \`valid\` and \`possible\`.
- **\`ok:phone-input:countrychange\`** fires after the selected country changed, with \`detail.country\` (\`undefined\` for International).
- **Instance:** \`runtime.get(element, "phone-input")\` returns \`{ value, setValue(value), country, setCountry(country), details }\`. The setters fire no events.
- **React:** \`onChange(value, details)\` and \`onCountryChange(country)\`. Use \`value\` to control the field, or \`defaultValue\` to let it keep its own state. The \`ref\` and every other prop, such as \`name\` or \`onBlur\`, go to the input.
- **HTML with other data:** \`createPhoneInput({ metadata, labels })\` returns a definition to register in a bundled app instead of importing \`@owlky/html/phone\`, for example with the libphonenumber-js \`max\` data for strict validation.`,
  },
  {
    id: "keyboard",
    title: "Keyboard",
    body: "The country select and the input are two stops in the Tab order. The select works like any Select: type the start of a country's name to move to it.",
  },
  {
    id: "accessibility",
    title: "Accessibility",
    body: `- The input is a telephone input named by its label, with \`autocomplete="tel"\` so browsers can fill in a saved number.
- The country select is a combobox named "Country" (\`labels.country\`). Flags are hidden from screen readers: the selected country's name and calling code are read as its value.
- Flags are emoji by default, so they need no images. Systems without flag emoji, such as Windows, show the two-letter country code instead. Image flags have empty \`alt\` text, because the country name is the text next to them.
- With \`validate\`, the error state is \`aria-invalid\` and the helper text says what is wrong. Errors appear only after people leave the field, not while they type.`,
  },
  apiReferenceSection(phoneInputApi),
];

const PREVIEWS = {
  flags: () => (
    <Preview>
      <PhoneInput
        label="Phone number"
        placeholder="Enter phone number"
        fullWidth
        defaultCountry="AU"
        flags="image"
        flagsPath="flags/"
      />
    </Preview>
  ),
  overview: () => (
    <Preview>
      <PhoneInput label="Phone number" placeholder="Enter phone number" />
    </Preview>
  ),
  countries: () => (
    <Preview>
      <PhoneInput
        label="Phone number"
        placeholder="Enter phone number"
        defaultCountry="DE"
        countries={["DE", "AT", "CH", "FR", "GB"]}
        countryOptionsOrder={["DE", "AT", "CH"]}
      />
    </Preview>
  ),
  international: () => (
    <Preview>
      <PhoneInput label="Phone number" country="AU" international defaultValue="+61298765432" />
    </Preview>
  ),
  values: () => (
    <Preview>
      <PhoneInput
        label="Phone number"
        placeholder="Enter phone number"
        defaultCountry="US"
        validate
        invalidText="Enter a valid phone number"
        helperText="We only call about your order"
      />
    </Preview>
  ),
  options: () => <OptionsTable schema={phoneInputOptions} />,
  props: () => (
    <PropsTable
      label="Phone input props"
      rows={[
        {
          react: "value / defaultValue",
          html: "value of the input (its text)",
          type: "string",
          description: 'The number in E.164 form, such as "+61298765432". Default `""`.',
        },
        {
          react: "onChange",
          html: "ok:phone-input:change",
          type: "(value, details) => void",
          description: "The new value with its national and international forms and checks.",
        },
        {
          react: "onCountryChange",
          html: "ok:phone-input:countrychange",
          type: "(country) => void",
          description: "The selected country changed (`undefined`: International).",
        },
        {
          react: "labels",
          html: "createPhoneInput({ labels })",
          type: "Record<string, string>",
          description:
            "Country names by code, `ZZ` (International) and `country` (the select's name).",
        },
        {
          react: "metadata",
          html: "createPhoneInput({ metadata })",
          type: "MetadataJson",
          description: "libphonenumber-js numbering data. Default `min`.",
        },
      ]}
    />
  ),
  keyboard: () => (
    <KeyboardTable
      rows={[
        ["Digits, +", "Type the number; it is formatted as you type"],
        [
          "Backspace, Delete",
          "Remove the digit before or after the cursor, skipping spaces and brackets",
        ],
        ["Tab", "Move between the country select and the input"],
        ["Arrow Down, Enter, Space", "On the country select: open the list"],
        ["Letters", "In the list: move to the country whose name starts with them"],
        ["Enter, Space", "In the list: choose the country; focus moves to the input"],
        ["Escape", "Close the list"],
      ]}
    />
  ),
};

/** Phone input docs page (ADR-0019). */
export function PhoneInputDocs() {
  return <GuideDocs sections={phoneInputSections} previews={PREVIEWS} />;
}
