import type { Meta, StoryObj } from "@storybook/react-vite";
import { reactGroupsStory } from "../../helpers/groups.js";
import { buttonGroups } from "./button-examples.js";

const meta = { title: "React/Button/Button" } satisfies Meta;
export default meta;

export const Contained: StoryObj = reactGroupsStory(buttonGroups("contained"));
export const Outlined: StoryObj = reactGroupsStory(buttonGroups("outlined"));
export const Text: StoryObj = reactGroupsStory(buttonGroups("text"));
export const Soft: StoryObj = reactGroupsStory(buttonGroups("soft"));
