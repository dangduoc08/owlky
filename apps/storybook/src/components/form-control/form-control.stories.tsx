import { FormControl } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { FormControlDocs } from "./form-control-docs.js";
import {
  FORM_CONTROL_CONTROLS,
  FORM_CONTROL_FILES,
  formControlStories,
} from "./form-control-examples.js";

const controls = { ...FORM_CONTROL_CONTROLS, target: FormControl };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/form-control/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

/** Every stylesheet the examples use (the controls and their labels). */
const CSS = ["form-control-label.css", "form-control.css"];

const story = (name: string, controlsCss: string[]): StoryObj =>
  frameworkStory({
    html: snippetStory(
      snippets,
      name,
      FORM_CONTROL_FILES[name] ?? [],
      htmlSetup([...controlsCss, ...CSS]),
      FORM_CONTROL_CONTROLS,
    ),
    react: reactGroupsStory(formControlStories[name] ?? [], controls),
  });

const meta = {
  title: "Components/Form control",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: FormControlDocs,
      description: {
        component:
          "A form control groups a control with its label and helper text, and shares their states.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Radios: StoryObj = { ...story("radios", ["radio.css"]), name: "Radio group" };
export const Checkboxes: StoryObj = {
  ...story("checkboxes", ["checkbox.css"]),
  name: "Checkbox group",
};
export const Switches: StoryObj = { ...story("switches", ["switch.css"]), name: "Switch group" };
export const ShowError: StoryObj = { ...story("show-error", ["radio.css"]), name: "Show error" };
export const States: StoryObj = story("states", ["checkbox.css", "radio.css", "switch.css"]);
export const Standalone: StoryObj = {
  ...story("standalone", ["switch.css"]),
  name: "Standalone control",
};
