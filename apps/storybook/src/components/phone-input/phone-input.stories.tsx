import { getRuntime, phoneInput } from "@owlky/html";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactElement } from "react";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { type GroupFiles, snippetStory } from "../shared/snippets.js";
import {
  PhoneAutoDemo,
  PhoneCountriesDemo,
  PhoneDefaultCountryDemo,
  PhoneDefaultValueDemo,
  PhoneFixedCountryDemo,
  PhoneFixedInternationalDemo,
  PhoneHideSelectDemo,
  PhoneImageFlagsDemo,
  PhoneValidationDemo,
} from "./phone-input-demos.js";
import demoSource from "./phone-input-demos.tsx?raw";
import { PhoneInputDocs } from "./phone-input-docs.js";
import { PHONE_SCRIPT_SOURCE, phoneScript } from "./phone-input-script.js";

// The phone input is opt-in (not in `components`): register it on the page's runtime, as
// `@owlky/html/phone` does.
getRuntime().register(phoneInput);

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/phone-input/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const CDN = "https://cdn.jsdelivr.net/npm/@owlky/html@0/dist";
const SETUP = [
  "<!-- Once per page (CDN): owlky.js loads the phone input when the page holds one. -->",
  `<link rel="stylesheet" href="${CDN}/owlky.css">`,
  `<script src="${CDN}/owlky.js" defer></script>`,
  "<!-- Image flags: with the CDN bundle the images load from flags/ next to owlky.js; elsewhere host @owlky/html/dist/flags and set data-ok-flags-path. -->",
  '<!-- npm: import "@owlky/styles/owlky.css" and "@owlky/html/auto", then "@owlky/html/phone". -->',
].join("\n");

const meta = {
  title: "Components/Phone input",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: PhoneInputDocs,
      description: {
        component:
          "A text field for phone numbers: a country select, formatting as you type and an international (E.164) value.",
      },
    },
  },
} satisfies Meta;
export default meta;

const story = (name: string, groups: [string, string, () => ReactElement][]): StoryObj => {
  const files: GroupFiles = groups.map(([title, file]) => [title, file]);
  const scripts = Object.fromEntries(
    groups.map(([, file]) => [file, { script: phoneScript, scriptSource: PHONE_SCRIPT_SOURCE }]),
  );
  return frameworkStory({
    html: snippetStory(snippets, name, files, SETUP, undefined, scripts),
    react: reactGroupsStory(
      groups.map(([title, , Demo]) => ({ title, content: <Demo /> })),
      undefined,
      demoSource,
    ),
  });
};

/** The reference's six fields: auto, default value, default country, fixed country, international, no select. */
export const PhoneInput: StoryObj = {
  ...story("phone-input", [
    ["Auto", "auto", PhoneAutoDemo],
    ["Default value", "default-value", PhoneDefaultValueDemo],
    ["Default country", "default-country", PhoneDefaultCountryDemo],
    ["Fixed country", "fixed-country", PhoneFixedCountryDemo],
    ["Fixed country + international", "fixed-international", PhoneFixedInternationalDemo],
    ["Fixed country + international + hideSelect", "hide-select", PhoneHideSelectDemo],
  ]),
  name: "Phone input",
};

/** Image flags (`flags="image"`): Circle Flags pictures instead of emoji, from a folder you host. */
export const ImageFlags: StoryObj = {
  ...story("phone-input", [["Image flags", "image-flags", PhoneImageFlagsDemo]]),
  name: "Image flags",
};

/** Validation in the helper text, and a short, ordered country list with a length limit. */
export const Validation: StoryObj = story("validation", [
  ["Validation", "invalid", PhoneValidationDemo],
  ["Countries", "countries", PhoneCountriesDemo],
]);
