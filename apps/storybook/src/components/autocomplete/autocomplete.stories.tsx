import { Autocomplete } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { AutocompleteDocs } from "./autocomplete-docs.js";
import {
  AUTOCOMPLETE_CONTROLS,
  AUTOCOMPLETE_FILES,
  autocompleteStories,
} from "./autocomplete-examples.js";
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
