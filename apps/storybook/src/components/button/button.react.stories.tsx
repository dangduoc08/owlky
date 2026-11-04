import { Button } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { BUTTON_CONTROLS, buttonGroups } from "./button-examples.js";

const controls: StoryControls = { ...BUTTON_CONTROLS, target: Button };

const meta = { title: "React/Button/Button" } satisfies Meta;
export default meta;

export const Contained: StoryObj = reactGroupsStory(buttonGroups("contained"), controls);
export const Outlined: StoryObj = reactGroupsStory(buttonGroups("outlined"), controls);
export const Text: StoryObj = reactGroupsStory(buttonGroups("text"), controls);
export const Soft: StoryObj = reactGroupsStory(buttonGroups("soft"), controls);
