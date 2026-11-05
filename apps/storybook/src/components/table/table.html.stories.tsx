import type { Meta, StoryObj } from "@storybook/react-vite";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { files, TABLE_CONTROLS } from "./table-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/table/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const meta = { title: "HTML/Table" } satisfies Meta;
export default meta;

const setup = htmlSetup(["icon-button.css", "table.css"], true);

export const Basic: StoryObj = snippetStory(
  snippets,
  "basic",
  files("Basic"),
  htmlSetup(["table.css"]),
  TABLE_CONTROLS,
);

export const SortingSelecting: StoryObj = {
  ...snippetStory(snippets, "sorting", files("Sorting & selecting"), setup),
  name: "Sorting & selecting",
};

export const GroupingFixedHeader: StoryObj = {
  ...snippetStory(snippets, "grouping", files("Grouping & fixed header"), setup),
  name: "Grouping & fixed header",
};

export const Collapsible: StoryObj = snippetStory(
  snippets,
  "collapsible",
  files("Collapsible"),
  setup,
);

export const PaginationWithApi: StoryObj = {
  ...snippetStory(
    snippets,
    "pagination",
    files("Pagination with API"),
    htmlSetup(["table.css", "pagination.css"], true),
  ),
  name: "Pagination with API",
};
