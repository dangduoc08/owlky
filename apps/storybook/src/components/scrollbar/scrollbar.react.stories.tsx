import { Scrollbar } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { reactGroupsStory } from "../../helpers/groups.js";
import {
  horizontalGroups,
  layoutGroups,
  SCROLLBAR_CONTROLS,
  verticalGroups,
} from "./scrollbar-examples.js";

const meta = { title: "React/Scrollbar" } satisfies Meta;
export default meta;

const controls = { ...SCROLLBAR_CONTROLS, target: Scrollbar };

export const Vertical: StoryObj = reactGroupsStory(verticalGroups, controls);
export const Horizontal: StoryObj = reactGroupsStory(horizontalGroups, controls);
export const Layout: StoryObj = reactGroupsStory(layoutGroups, controls);
