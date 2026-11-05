import { Button } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { ButtonDocs } from "./button-docs.js";
import { BUTTON_CONTROLS, buttonGroups, GROUP_FILES } from "./button-examples.js";

const controls: StoryControls = { ...BUTTON_CONTROLS, target: Button };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/button/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const SETUP = htmlSetup(["button.css"]);

const story = (variant: string) =>
  snippetStory(snippets, variant, GROUP_FILES, SETUP, BUTTON_CONTROLS);

const meta = {
  title: "Components/Button/Button",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: ButtonDocs,
      description: {
        component:
          "Buttons start actions, such as saving or opening a dialog, and can also act as links. Choose how much a button stands out with its variant, and what it means with its color.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Contained: StoryObj = frameworkStory({
  html: story("contained"),
  react: reactGroupsStory(buttonGroups("contained"), controls),
});

export const Outlined: StoryObj = frameworkStory({
  html: story("outlined"),
  react: reactGroupsStory(buttonGroups("outlined"), controls),
});

export const Text: StoryObj = frameworkStory({
  html: story("text"),
  react: reactGroupsStory(buttonGroups("text"), controls),
});

export const Soft: StoryObj = frameworkStory({
  html: story("soft"),
  react: reactGroupsStory(buttonGroups("soft"), controls),
});
