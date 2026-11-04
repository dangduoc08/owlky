import type { Meta, StoryObj } from "@storybook/react-vite";
import { reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import {
  SORTABLE_CONTROLS,
  SortableDemo,
  sortableCode,
  sortableGroups,
} from "./sortable-examples.js";

const controls: StoryControls = { ...SORTABLE_CONTROLS, target: SortableDemo };

const meta = { title: "React/Sortable" } satisfies Meta;
export default meta;

export const Grid: StoryObj = reactGroupsStory(
  sortableGroups("grid", "Grid"),
  controls,
  sortableCode("grid", "Grid"),
);
export const Vertical: StoryObj = reactGroupsStory(
  sortableGroups("vertical", "Vertical"),
  controls,
  sortableCode("vertical", "Vertical"),
);
export const Horizontal: StoryObj = reactGroupsStory(
  sortableGroups("horizontal", "Horizontal"),
  controls,
  sortableCode("horizontal", "Horizontal"),
);
