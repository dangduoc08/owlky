import { Fab } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { animateGroups, FAB_CONTROLS, fabGroups } from "./fab-examples.js";

const controls: StoryControls = { ...FAB_CONTROLS, target: Fab };

const meta = { title: "React/Button/Fab" } satisfies Meta;
export default meta;

export const Default: StoryObj = reactGroupsStory(fabGroups("contained"), controls);
export const Outlined: StoryObj = reactGroupsStory(fabGroups("outlined"), controls);
export const Soft: StoryObj = reactGroupsStory(fabGroups("soft"), controls);
export const WithAnimate: StoryObj = {
  ...reactGroupsStory(animateGroups, controls),
  name: "With animate",
};
