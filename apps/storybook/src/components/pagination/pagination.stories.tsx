import { Pagination } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import itemsCode from "./items-demo.tsx?raw";
import { ITEMS_SCRIPT_SOURCE, itemsScript } from "./items-script.js";
import { PaginationDocs } from "./pagination-docs.js";
import {
  buttonGroups,
  files,
  iconGroups,
  itemsGroups,
  PAGINATION_CONTROLS,
  rangeGroups,
  SHAPE_FILES,
  shapeGroups,
  sizeGroups,
  tableGroups,
  VARIANT_FILES,
  variantGroups,
} from "./pagination-examples.js";
import tableCode from "./table-pagination-demo.tsx?raw";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/pagination/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const setup = htmlSetup(["pagination.css"], true);

const meta = {
  title: "Components/Pagination",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: PaginationDocs,
      description: {
        component:
          "Pagination lets people move through content split into pages, with the current page, nearby pages and previous and next buttons.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Shapes: StoryObj = frameworkStory({
  html: snippetStory(snippets, "shapes", SHAPE_FILES, setup),
  react: reactGroupsStory(shapeGroups),
});

export const Variants: StoryObj = frameworkStory({
  html: snippetStory(snippets, "variants", VARIANT_FILES, setup),
  react: reactGroupsStory(variantGroups),
});

export const Sizes: StoryObj = frameworkStory({
  html: snippetStory(snippets, "sizes", files("Sizes"), setup),
  react: reactGroupsStory(sizeGroups),
});

export const Buttons: StoryObj = frameworkStory({
  html: snippetStory(snippets, "buttons", files("Buttons"), setup),
  react: reactGroupsStory(buttonGroups),
});

export const Ranges: StoryObj = frameworkStory({
  html: snippetStory(snippets, "ranges", files("Ranges"), setup, PAGINATION_CONTROLS),
  react: reactGroupsStory(rangeGroups, {
    ...PAGINATION_CONTROLS,
    target: Pagination,
  }),
});

export const CustomIcons: StoryObj = frameworkStory({
  html: {
    ...snippetStory(snippets, "icons", files("Custom icons"), setup),
    name: "Custom icons",
  },
  react: { ...reactGroupsStory(iconGroups), name: "Custom icons" },
});

export const Table: StoryObj = frameworkStory({
  html: snippetStory(
    snippets,
    "table",
    files("Table"),
    htmlSetup(["icon-button.css", "table.css", "popover.css", "menu.css", "select.css"], true),
  ),
  react: reactGroupsStory(tableGroups, undefined, tableCode),
});

export const Items: StoryObj = frameworkStory({
  html: snippetStory(
    snippets,
    "items",
    files("Items"),
    htmlSetup(
      ["pagination.css", "paper.css", "form-control.css", "popover.css", "menu.css", "select.css"],
      true,
    ),
    undefined,
    { group: { script: itemsScript, scriptSource: ITEMS_SCRIPT_SOURCE } },
  ),
  react: reactGroupsStory(itemsGroups, undefined, itemsCode),
});
