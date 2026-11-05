import { Table } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import collapsibleCode from "./collapsible-demo.tsx?raw";
import groupingCode from "./grouping-demo.tsx?raw";
import paginationCode from "./pagination-demo.tsx?raw";
import sortingCode from "./sorting-demo.tsx?raw";
import { TableDocs } from "./table-docs.js";
import {
  basicGroups,
  collapsibleGroups,
  files,
  groupingGroups,
  paginationGroups,
  sortingGroups,
  TABLE_CONTROLS,
} from "./table-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/table/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const setup = htmlSetup(["icon-button.css", "scrollbar.css", "table.css"], true);

const meta = {
  title: "Components/Table",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: TableDocs,
      description: {
        component:
          "Tables show data in rows and columns, with sortable columns, row selection, expandable rows and pagination.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Basic: StoryObj = frameworkStory({
  html: snippetStory(
    snippets,
    "basic",
    files("Basic"),
    htmlSetup(["scrollbar.css", "table.css"]),
    TABLE_CONTROLS,
  ),
  react: reactGroupsStory(basicGroups, { ...TABLE_CONTROLS, target: Table }),
});

export const SortingSelecting: StoryObj = frameworkStory({
  html: {
    ...snippetStory(snippets, "sorting", files("Sorting & selecting"), setup),
    name: "Sorting & selecting",
  },
  react: {
    ...reactGroupsStory(sortingGroups, undefined, sortingCode),
    name: "Sorting & selecting",
  },
});

export const GroupingFixedHeader: StoryObj = frameworkStory({
  html: {
    ...snippetStory(snippets, "grouping", files("Grouping & fixed header"), setup),
    name: "Grouping & fixed header",
  },
  react: {
    ...reactGroupsStory(groupingGroups, undefined, groupingCode),
    name: "Grouping & fixed header",
  },
});

export const Collapsible: StoryObj = frameworkStory({
  html: snippetStory(snippets, "collapsible", files("Collapsible"), setup),
  react: reactGroupsStory(collapsibleGroups, undefined, collapsibleCode),
});

export const PaginationWithApi: StoryObj = frameworkStory({
  html: {
    ...snippetStory(
      snippets,
      "pagination",
      files("Pagination with API"),
      htmlSetup(["scrollbar.css", "table.css", "pagination.css"], true),
    ),
    name: "Pagination with API",
  },
  react: {
    ...reactGroupsStory(paginationGroups, undefined, paginationCode),
    name: "Pagination with API",
  },
});
