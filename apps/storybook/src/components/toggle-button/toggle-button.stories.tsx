import { ToggleButton } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { ToggleButtonDocs } from "./toggle-button-docs.js";
import { TOGGLE_CONTROLS, TOGGLE_FILES, toggleStories } from "./toggle-button-examples.js";

const controls: StoryControls = { ...TOGGLE_CONTROLS, target: ToggleButton };

const reactStory = (name: string, label?: string): StoryObj => ({
  ...reactGroupsStory(toggleStories[name] ?? [], controls),
  ...(label ? { name: label } : {}),
});

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/toggle-button/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const SETUP = htmlSetup(["toggle-button.css"], true);

const htmlStory = (name: string, label?: string): StoryObj => ({
  ...snippetStory(snippets, name, TOGGLE_FILES[name] ?? [], SETUP, TOGGLE_CONTROLS),
  ...(label ? { name: label } : {}),
});

const meta = {
  title: "Components/Button/Toggle button",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: ToggleButtonDocs,
      description: {
        component:
          "Toggle buttons stay pressed until pressed again. Use them alone, or in a group to pick one option or several.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Exclusive: StoryObj = frameworkStory({
  html: htmlStory("exclusive", "Exclusive selection"),
  react: reactStory("exclusive", "Exclusive selection"),
});

export const Multiple: StoryObj = frameworkStory({
  html: htmlStory("multiple", "Multiple selection"),
  react: reactStory("multiple", "Multiple selection"),
});

export const Sizes: StoryObj = frameworkStory({
  html: htmlStory("sizes"),
  react: reactStory("sizes"),
});

export const Disabled: StoryObj = frameworkStory({
  html: htmlStory("disabled"),
  react: reactStory("disabled"),
});

export const Colors: StoryObj = frameworkStory({
  html: htmlStory("colors"),
  react: reactStory("colors"),
});

export const Vertical: StoryObj = frameworkStory({
  html: htmlStory("vertical", "Vertical & standalone"),
  react: reactStory("vertical", "Vertical & standalone"),
});
