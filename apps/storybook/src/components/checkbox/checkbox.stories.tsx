import { Checkbox } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import {
  MULTIPLE_COLOR_SCRIPT_SOURCE,
  multipleColorScript,
} from "../shared/color-picker-scripts.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { CheckboxDocs } from "./checkbox-docs.js";
import {
  basicGroups,
  CHECKBOX_CONTROLS,
  COLOR_FILES,
  colorGroups,
  customIconGroups,
  files,
  indeterminateGroups,
  placementGroups,
  sizeGroups,
} from "./checkbox-examples.js";
import { ColorPickerDemo } from "./color-picker-demo.js";
import colorPickerSource from "./color-picker-demo.tsx?raw";
import demoSource from "./indeterminate-demo.tsx?raw";

const controls = { ...CHECKBOX_CONTROLS, target: Checkbox };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/checkbox/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

// The runtime keeps the mixed state in step and drives parent checkboxes (aria-controls).
const setup = htmlSetup(["checkbox.css"], true);
const labelled = htmlSetup(["checkbox.css", "form-control-label.css"], true);

const meta = {
  title: "Components/Checkbox",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: CheckboxDocs,
      description: {
        component:
          "Checkboxes let people pick any number of options, or turn one setting on and off in a form.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Basic: StoryObj = frameworkStory({
  html: snippetStory(snippets, "basic", files("Basic"), setup, CHECKBOX_CONTROLS),
  react: reactGroupsStory(basicGroups, controls),
});

export const Sizes: StoryObj = frameworkStory({
  html: snippetStory(snippets, "sizes", files("Sizes"), labelled, CHECKBOX_CONTROLS),
  react: reactGroupsStory(sizeGroups, controls),
});

export const CustomIcons: StoryObj = frameworkStory({
  html: snippetStory(snippets, "custom-icons", files("Custom icons"), labelled, CHECKBOX_CONTROLS),
  react: reactGroupsStory(customIconGroups, controls),
});

export const Placement: StoryObj = frameworkStory({
  html: snippetStory(snippets, "placement", files("Placement"), labelled, CHECKBOX_CONTROLS),
  react: reactGroupsStory(placementGroups, controls),
});

export const Colors: StoryObj = frameworkStory({
  html: snippetStory(snippets, "colors", COLOR_FILES, labelled, CHECKBOX_CONTROLS),
  react: reactGroupsStory(colorGroups, controls),
});

export const Indeterminate: StoryObj = frameworkStory({
  html: snippetStory(snippets, "indeterminate", files("Indeterminate"), labelled),
  react: reactGroupsStory(indeterminateGroups, undefined, demoSource),
});

export const ColorPicker: StoryObj = {
  ...frameworkStory({
    html: snippetStory(
      snippets,
      "color-picker",
      [["Multiple", "group"]],
      htmlSetup(["checkbox.css", "form-control.css", "typography.css"], true),
      undefined,
      { group: { script: multipleColorScript, scriptSource: MULTIPLE_COLOR_SCRIPT_SOURCE } },
    ),
    react: reactGroupsStory(
      [{ title: "Multiple", content: <ColorPickerDemo /> }],
      undefined,
      colorPickerSource,
    ),
  }),
  name: "Color picker",
};
