import { Table } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { reactGroupsStory } from "../../helpers/groups.js";
import collapsibleCode from "./collapsible-demo.tsx?raw";
import groupingCode from "./grouping-demo.tsx?raw";
import paginationCode from "./pagination-demo.tsx?raw";
import sortingCode from "./sorting-demo.tsx?raw";
import {
  basicGroups,
  collapsibleGroups,
  groupingGroups,
  paginationGroups,
  sortingGroups,
  TABLE_CONTROLS,
} from "./table-examples.js";

const meta = { title: "React/Table" } satisfies Meta;
export default meta;

export const Basic: StoryObj = reactGroupsStory(basicGroups, { ...TABLE_CONTROLS, target: Table });

export const SortingSelecting: StoryObj = {
  ...reactGroupsStory(sortingGroups, undefined, sortingCode),
  name: "Sorting & selecting",
};

export const GroupingFixedHeader: StoryObj = {
  ...reactGroupsStory(groupingGroups, undefined, groupingCode),
  name: "Grouping & fixed header",
};

export const Collapsible: StoryObj = reactGroupsStory(
  collapsibleGroups,
  undefined,
  collapsibleCode,
);

export const PaginationWithApi: StoryObj = {
  ...reactGroupsStory(paginationGroups, undefined, paginationCode),
  name: "Pagination with API",
};
