import type { Meta, StoryObj } from "@storybook/react-vite";
import { reactGroupsStory } from "../../helpers/groups.js";
import { buttonGroupGroups, orientationGroups, sizeGroups } from "./button-group-examples.js";

const meta = { title: "React/Button/Button group" } satisfies Meta;
export default meta;

export const Contained: StoryObj = reactGroupsStory(buttonGroupGroups("contained"));
export const Outlined: StoryObj = reactGroupsStory(buttonGroupGroups("outlined"));
export const Text: StoryObj = reactGroupsStory(buttonGroupGroups("text"));
export const Soft: StoryObj = reactGroupsStory(buttonGroupGroups("soft"));
export const Sizes: StoryObj = reactGroupsStory(sizeGroups);
export const Orientation: StoryObj = reactGroupsStory(orientationGroups);
