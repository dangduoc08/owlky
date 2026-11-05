import { ButtonGroup } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { ButtonGroupDocs } from "./button-group-docs.js";
import {
  BUTTON_GROUP_CONTROLS,
  BUTTON_GROUP_FILES,
  buttonGroupGroups,
  ORIENTATION_FILES,
  orientationGroups,
  SIZE_FILES,
  sizeGroups,
} from "./button-group-examples.js";

const controls: StoryControls = { ...BUTTON_GROUP_CONTROLS, target: ButtonGroup };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/button-group/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const SETUP = htmlSetup(["button.css", "button-group.css"]);

const meta = {
  title: "Components/Button/Button group",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: ButtonGroupDocs,
      description: {
        component: "Button groups join related buttons into one control and share their style.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Contained: StoryObj = frameworkStory({
  html: snippetStory(snippets, "contained", BUTTON_GROUP_FILES, SETUP, BUTTON_GROUP_CONTROLS),
  react: reactGroupsStory(buttonGroupGroups("contained"), controls),
});

export const Outlined: StoryObj = frameworkStory({
  html: snippetStory(snippets, "outlined", BUTTON_GROUP_FILES, SETUP, BUTTON_GROUP_CONTROLS),
  react: reactGroupsStory(buttonGroupGroups("outlined"), controls),
});

export const Text: StoryObj = frameworkStory({
  html: snippetStory(snippets, "text", BUTTON_GROUP_FILES, SETUP, BUTTON_GROUP_CONTROLS),
  react: reactGroupsStory(buttonGroupGroups("text"), controls),
});

export const Soft: StoryObj = frameworkStory({
  html: snippetStory(snippets, "soft", BUTTON_GROUP_FILES, SETUP, BUTTON_GROUP_CONTROLS),
  react: reactGroupsStory(buttonGroupGroups("soft"), controls),
});

export const Sizes: StoryObj = frameworkStory({
  html: snippetStory(snippets, "sizes", SIZE_FILES, SETUP, BUTTON_GROUP_CONTROLS),
  react: reactGroupsStory(sizeGroups, controls),
});

export const Orientation: StoryObj = frameworkStory({
  html: snippetStory(snippets, "orientation", ORIENTATION_FILES, SETUP, BUTTON_GROUP_CONTROLS),
  react: reactGroupsStory(orientationGroups, controls),
});
