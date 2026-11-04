import { DrawerContent } from "@minimal-tailwind/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { reactGroupsStory } from "../../helpers/groups.js";
import { anchorGroups, DRAWER_CONTROLS, variantGroups } from "./drawer-examples.js";

const meta = { title: "React/Drawer" } satisfies Meta;
export default meta;

export const Anchor: StoryObj = reactGroupsStory(anchorGroups, {
  ...DRAWER_CONTROLS,
  target: DrawerContent,
});

export const Variants: StoryObj = {
  ...reactGroupsStory(variantGroups),
  name: "Persistent & permanent",
};
