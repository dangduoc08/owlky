import { Pagination } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { reactGroupsStory } from "../../helpers/groups.js";
import {
  buttonGroups,
  iconGroups,
  PAGINATION_CONTROLS,
  rangeGroups,
  shapeGroups,
  sizeGroups,
  tableGroups,
  variantGroups,
} from "./pagination-examples.js";
import tableCode from "./table-pagination-demo.tsx?raw";

const meta = { title: "React/Pagination" } satisfies Meta;
export default meta;

export const Shapes: StoryObj = reactGroupsStory(shapeGroups);
export const Variants: StoryObj = reactGroupsStory(variantGroups);
export const Sizes: StoryObj = reactGroupsStory(sizeGroups);
export const Buttons: StoryObj = reactGroupsStory(buttonGroups);
export const Ranges: StoryObj = reactGroupsStory(rangeGroups, {
  ...PAGINATION_CONTROLS,
  target: Pagination,
});
export const CustomIcons: StoryObj = { ...reactGroupsStory(iconGroups), name: "Custom icons" };
export const Table: StoryObj = reactGroupsStory(tableGroups, undefined, tableCode);
