import { ButtonGroup } from "@minimal-tailwind/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import {
  BUTTON_GROUP_CONTROLS,
  buttonGroupGroups,
  orientationGroups,
  sizeGroups,
} from "./button-group-examples.js";

const controls: StoryControls = { ...BUTTON_GROUP_CONTROLS, target: ButtonGroup };

const meta = { title: "React/Button/Button group" } satisfies Meta;
export default meta;

export const Contained: StoryObj = reactGroupsStory(buttonGroupGroups("contained"), controls);
export const Outlined: StoryObj = reactGroupsStory(buttonGroupGroups("outlined"), controls);
export const Text: StoryObj = reactGroupsStory(buttonGroupGroups("text"), controls);
export const Soft: StoryObj = reactGroupsStory(buttonGroupGroups("soft"), controls);
export const Sizes: StoryObj = reactGroupsStory(sizeGroups, controls);
export const Orientation: StoryObj = reactGroupsStory(orientationGroups, controls);
