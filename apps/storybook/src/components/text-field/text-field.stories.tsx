import { TextField } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { type GroupFiles, htmlSetup, snippetStory } from "../shared/snippets.js";
import { CopyButtonDemo, CopyDoubleClickDemo } from "./copy-demo.js";
import copySource from "./copy-demo.tsx?raw";
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

const COPY_FILES: GroupFiles = [
  ["Copy button", "button"],
  ["Double click", "double-click"],
];

/** Copy to clipboard (roadmap 4.20): a copy button in the end adornment, copy on double click. */
export const CopyToClipboard: StoryObj = {
  ...frameworkStory({
    html: snippetStory(
      snippets,
      "copy-to-clipboard",
      COPY_FILES,
      htmlSetup(["typography.css", "text-field.css", "icon-button.css", "snackbar.css"], true),
    ),
    react: reactGroupsStory(
      [
        { title: "Copy button", content: <CopyButtonDemo /> },
        { title: "Double click", content: <CopyDoubleClickDemo /> },
      ],
      undefined,
      copySource,
    ),
  }),
  name: "Copy to clipboard",
};
