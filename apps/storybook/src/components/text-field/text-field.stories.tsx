import { TextField } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { TextFieldDocs } from "./text-field-docs.js";
import { GROUP_FILES, TEXT_FIELD_CONTROLS, variantGroups } from "./text-field-examples.js";

const controls = { ...TEXT_FIELD_CONTROLS, target: TextField };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/text-field/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

// The runtime is needed for growing textareas, the password button and the listbox selects.
const setup = htmlSetup(
  [
    "text-field.css",
    "button.css",
    "icon-button.css",
    "form-control.css",
    "popover.css",
    "menu.css",
    "select.css",
  ],
  true,
);

const story = (variant: "outlined" | "filled" | "standard") =>
  frameworkStory({
    html: snippetStory(snippets, variant, GROUP_FILES, setup, TEXT_FIELD_CONTROLS),
    react: reactGroupsStory(variantGroups(variant), controls),
  });

const meta = {
  title: "Components/Text field",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: TextFieldDocs,
      description: {
        component:
          "Text fields let people enter and edit text in a form: one line, several lines or a choice from a list.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Outlined: StoryObj = story("outlined");
export const Filled: StoryObj = story("filled");
export const Standard: StoryObj = story("standard");
