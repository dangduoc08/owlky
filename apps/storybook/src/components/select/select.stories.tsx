import { Select } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import demosSource from "./select-demos.tsx?raw";
import { SelectDocs } from "./select-docs.js";
import { SELECT_CONTROLS, SELECT_FILES, selectStories } from "./select-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/select/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

/** Every stylesheet the examples use (the menu's paper and items, labels, chips, checkboxes). */
const CSS = [
  "form-control.css",
  "popover.css",
  "menu.css",
  "list.css",
  "chip.css",
  "checkbox.css",
  "button.css",
  "dialog.css",
  "select.css",
];
const setup = htmlSetup(CSS, true);
const controls = { ...SELECT_CONTROLS, target: Select };

/** A story of uncontrolled examples, with Controls. */
const story = (name: string, label?: string): StoryObj => {
  const built = frameworkStory({
    html: snippetStory(snippets, name, SELECT_FILES[name] ?? [], setup, SELECT_CONTROLS),
    react: reactGroupsStory(selectStories[name] ?? [], controls),
  });
  return label ? { ...built, name: label } : built;
};

/** A story of stateful demos: the Code panel shows their source, no Controls. */
const demo = (name: string, label?: string): StoryObj => {
  const built = frameworkStory({
    html: snippetStory(snippets, name, SELECT_FILES[name] ?? [], setup),
    react: reactGroupsStory(selectStories[name] ?? [], undefined, demosSource),
  });
  return label ? { ...built, name: label } : built;
};

const meta = {
  title: "Components/Select",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: SelectDocs,
      description: {
        component: "Selects let people choose one or more options from a list.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Basic: StoryObj = story("basic", "Basic select");
export const Variants: StoryObj = story("variants");
export const LabelsHelperText: StoryObj = story("helper", "Labels and helper text");
export const AutoWidth: StoryObj = story("auto-width", "Auto width");
export const SmallSize: StoryObj = story("small", "Small size");
export const OtherProps: StoryObj = story("other", "Other props");
export const NativeSelect: StoryObj = story("native", "Native select");
export const MultipleDefault: StoryObj = story("multiple", "Multiple");
export const SelectionIndicators: StoryObj = demo("checkmarks", "Selection indicators");
export const Chips: StoryObj = story("chip", "Chip");
export const Placeholder: StoryObj = story("placeholder");
export const MultipleNative: StoryObj = story("native-multiple", "Multiple native");
export const OpenState: StoryObj = demo("open", "Controlling the open state");
export const WithDialog: StoryObj = demo("dialog", "With a dialog");
export const Grouping: StoryObj = story("grouping");
