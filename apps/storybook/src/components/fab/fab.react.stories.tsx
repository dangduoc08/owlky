import type { Meta, StoryObj } from "@storybook/react-vite";
import { reactGroupsStory } from "../../helpers/groups.js";
import { animateGroups, fabGroups } from "./fab-examples.js";

const meta = { title: "React/Button/Fab" } satisfies Meta;
export default meta;

export const Default: StoryObj = reactGroupsStory(fabGroups("contained"));
export const Outlined: StoryObj = reactGroupsStory(fabGroups("outlined"));
export const Soft: StoryObj = reactGroupsStory(fabGroups("soft"));
export const WithAnimate: StoryObj = { ...reactGroupsStory(animateGroups), name: "With animate" };
