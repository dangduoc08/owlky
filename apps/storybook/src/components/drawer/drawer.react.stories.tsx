import type { Meta, StoryObj } from "@storybook/react-vite";
import { reactGroupsStory } from "../../helpers/groups.js";
import { anchorGroups } from "./drawer-examples.js";

const meta = { title: "React/Drawer" } satisfies Meta;
export default meta;

export const Anchor: StoryObj = reactGroupsStory(anchorGroups);
