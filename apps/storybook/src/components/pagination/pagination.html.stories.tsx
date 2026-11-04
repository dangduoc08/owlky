import type { Meta, StoryObj } from "@storybook/react-vite";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { files, PAGINATION_CONTROLS, SHAPE_FILES, VARIANT_FILES } from "./pagination-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/pagination/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const meta = { title: "HTML/Pagination" } satisfies Meta;
export default meta;

const setup = htmlSetup(["pagination.css"], true);

export const Shapes: StoryObj = snippetStory(snippets, "shapes", SHAPE_FILES, setup);
export const Variants: StoryObj = snippetStory(snippets, "variants", VARIANT_FILES, setup);
export const Sizes: StoryObj = snippetStory(snippets, "sizes", files("Sizes"), setup);
export const Buttons: StoryObj = snippetStory(snippets, "buttons", files("Buttons"), setup);
export const Ranges: StoryObj = snippetStory(
  snippets,
  "ranges",
  files("Ranges"),
  setup,
  PAGINATION_CONTROLS,
);
export const CustomIcons: StoryObj = {
  ...snippetStory(snippets, "icons", files("Custom icons"), setup),
  name: "Custom icons",
};
export const Table: StoryObj = snippetStory(
  snippets,
  "table",
  files("Table"),
  htmlSetup(["icon-button.css", "table.css"], true),
);
