import { ToggleButton } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { TOGGLE_CONTROLS, toggleStories } from "./toggle-button-examples.js";

const controls: StoryControls = { ...TOGGLE_CONTROLS, target: ToggleButton };

const story = (name: string, label?: string): StoryObj => ({
  ...reactGroupsStory(toggleStories[name] ?? [], controls),
  ...(label ? { name: label } : {}),
});

const meta = { title: "React/Button/Toggle button" } satisfies Meta;
export default meta;

export const Exclusive: StoryObj = story("exclusive", "Exclusive selection");
export const Multiple: StoryObj = story("multiple", "Multiple selection");
export const Sizes: StoryObj = story("sizes");
export const Disabled: StoryObj = story("disabled");
export const Colors: StoryObj = story("colors");
export const Vertical: StoryObj = story("vertical", "Vertical & standalone");
