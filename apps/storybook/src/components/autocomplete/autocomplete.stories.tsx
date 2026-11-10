import { Autocomplete } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { LoadOnOpenDemo } from "./async-demo.js";
import asyncSource from "./async-demo.tsx?raw";
import { AutocompleteDocs } from "./autocomplete-docs.js";
import {
  AUTOCOMPLETE_CONTROLS,
  AUTOCOMPLETE_FILES,
  autocompleteStories,
} from "./autocomplete-examples.js";
import {
  LOAD_ON_OPEN_SCRIPT_SOURCE,
  loadOnOpenScript,
  VIRTUALIZATION_SCRIPT_SOURCE,
  virtualizationScript,
} from "./autocomplete-scripts.js";
import { OutputDemo, VariantsDemo } from "./country-demo.js";
import countrySource from "./country-demo.tsx?raw";

const controls: StoryControls = { ...AUTOCOMPLETE_CONTROLS, target: Autocomplete };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/autocomplete/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const SETUP = htmlSetup(
  [
    "autocomplete.css",
    "text-field.css",
    "chip.css",
    "icon-button.css",
    "popover.css",
    "checkbox.css",
    "label.css",
    "typography.css",
  ],
  true,
);
const SETUP_LIST = htmlSetup(
  ["autocomplete.css", "text-field.css", "chip.css", "icon-button.css", "popover.css", "list.css"],
  true,
);

const meta = {
  title: "Components/Autocomplete",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: AutocompleteDocs,
      description: {
        component:
          "An autocomplete is a text field with a list of suggestions to pick from as you type.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Playground: StoryObj = frameworkStory({
  html: snippetStory(
    snippets,
    "playground",
    AUTOCOMPLETE_FILES["playground"] ?? [],
    SETUP,
    AUTOCOMPLETE_CONTROLS,
  ),
  react: reactGroupsStory(autocompleteStories["playground"] ?? [], controls),
});

export const Country: StoryObj = {
  ...frameworkStory({
    html: snippetStory(snippets, "country", AUTOCOMPLETE_FILES["country"] ?? [], SETUP),
    react: reactGroupsStory(
      [
        { title: "Output label", content: <OutputDemo output="label" /> },
        { title: "Output code", content: <OutputDemo output="code" /> },
        { title: "Variants", content: <VariantsDemo /> },
      ],
      undefined,
      countrySource,
    ),
  }),
  name: "Country select",
};

const GROUPED_CODE = `import { Autocomplete } from "@owlky/react";

const fruits = ["Apple", "Apricot", "Banana", "Blueberry", "Cherry", "Grape", "Kiwi", "Lemon", "Mango", "Orange", "Peach", "Pear"];

export function Grouped() {
  // Sort the options by the same key as groupBy, or a heading shows twice
  return (
    <Autocomplete
      id="ac-grouped"
      label="With categories"
      options={fruits}
      groupBy={(option) => option.label.charAt(0)}
    />
  );
}`;

export const Grouped: StoryObj = frameworkStory({
  html: snippetStory(snippets, "grouped", AUTOCOMPLETE_FILES["grouped"] ?? [], SETUP_LIST),
  react: reactGroupsStory(autocompleteStories["grouped"] ?? [], undefined, GROUPED_CODE),
});

export const Asynchronous: StoryObj = {
  ...frameworkStory({
    html: snippetStory(snippets, "async", AUTOCOMPLETE_FILES["async"] ?? [], SETUP, undefined, {
      "load-on-open": { script: loadOnOpenScript, scriptSource: LOAD_ON_OPEN_SCRIPT_SOURCE },
    }),
    react: reactGroupsStory(
      [{ title: "Load on open", content: <LoadOnOpenDemo /> }],
      undefined,
      asyncSource,
    ),
  }),
  name: "Asynchronous requests",
};

const SINGLE_CODE = `import { Autocomplete, Chip } from "@owlky/react";

const fruits = ["Apple", "Banana", "Cherry", "Mango"];

export function SingleValue() {
  return (
    <Autocomplete
      id="ac-single-chip"
      label="Fruit"
      options={fruits}
      defaultValue="Mango"
      renderValue={(value, getItemProps) => (
        <Chip size="small" variant="soft" label={value} {...getItemProps({ index: 0 })} />
      )}
    />
  );
}`;

export const SingleValue: StoryObj = {
  ...frameworkStory({
    html: snippetStory(snippets, "single", AUTOCOMPLETE_FILES["single"] ?? [], SETUP),
    react: reactGroupsStory(autocompleteStories["single"] ?? [], undefined, SINGLE_CODE),
  }),
  name: "Single value rendering",
};

const VIRTUALIZATION_CODE = `import { Autocomplete } from "@owlky/react";

const options = Array.from({ length: 10000 }, (_, index) => \`Option \${index + 1}\`);

export function Virtualized() {
  // The list draws only the options in view
  return <Autocomplete id="ac-virtual" label="10,000 options" virtualize options={options} />;
}`;

export const Virtualization: StoryObj = frameworkStory({
  html: snippetStory(
    snippets,
    "virtualization",
    AUTOCOMPLETE_FILES["virtualization"] ?? [],
    SETUP,
    undefined,
    {
      list: { script: virtualizationScript, scriptSource: VIRTUALIZATION_SCRIPT_SOURCE },
    },
  ),
  react: reactGroupsStory(
    autocompleteStories["virtualization"] ?? [],
    undefined,
    VIRTUALIZATION_CODE,
  ),
});
