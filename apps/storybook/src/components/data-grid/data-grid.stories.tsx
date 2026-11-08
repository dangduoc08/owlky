import { DataGrid } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { DataGridDocs } from "./data-grid-docs.js";
import { DATA_GRID_CONTROLS, DATA_GRID_FILES, dataGridStories } from "./data-grid-examples.js";
import {
  LARGE_SCRIPT_SOURCE,
  LAZY_SCRIPT_SOURCE,
  largeScript,
  lazyScript,
  SERVER_SCRIPT_SOURCE,
  serverScript,
  VALIDATION_SCRIPT_SOURCE,
  validationScript,
} from "./data-grid-scripts.js";
import { LargeDemo } from "./large-demo.js";
import largeSource from "./large-demo.tsx?raw";
import { LazyDemo } from "./lazy-demo.js";
import lazySource from "./lazy-demo.tsx?raw";
import { ServerDemo } from "./server-demo.js";
import serverSource from "./server-demo.tsx?raw";

const controls: StoryControls = { ...DATA_GRID_CONTROLS, target: DataGrid };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/data-grid/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const SETUP = htmlSetup(
  [
    "button.css",
    "icon-button.css",
    "checkbox.css",
    "switch.css",
    "form-control-label.css",
    "text-field.css",
    "popover.css",
    "menu.css",
    "table.css",
    "avatar.css",
    "label.css",
    "rating.css",
    "linear-progress.css",
    "tooltip.css",
    "autocomplete.css",
    "chip.css",
    "circular-progress.css",
    "data-grid.css",
  ],
  true,
);

const story = (name: string): StoryObj =>
  frameworkStory({
    html: snippetStory(snippets, name, DATA_GRID_FILES[name] ?? [], SETUP, DATA_GRID_CONTROLS),
    react: reactGroupsStory(dataGridStories[name] ?? [], controls),
  });

const meta = {
  title: "Components/DataGrid",
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      page: DataGridDocs,
      description: {
        component:
          "A data grid shows rows of data in columns that people can sort, filter, search, select and export.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Basic: StoryObj = story("basic");
export const Custom: StoryObj = story("custom");
export const Advanced: StoryObj = story("advanced");
export const Layout: StoryObj = { ...story("layout"), name: "Layout" };
export const Validation: StoryObj = {
  ...frameworkStory({
    html: snippetStory(
      snippets,
      "validation",
      DATA_GRID_FILES["validation"] ?? [],
      SETUP,
      DATA_GRID_CONTROLS,
      {
        group: { script: validationScript, scriptSource: VALIDATION_SCRIPT_SOURCE },
      },
    ),
    react: reactGroupsStory(dataGridStories["validation"] ?? [], controls),
  }),
  name: "Validation",
};
export const Large: StoryObj = {
  ...frameworkStory({
    html: snippetStory(snippets, "large", [["Large dataset", "group"]], SETUP, undefined, {
      group: { script: largeScript, scriptSource: LARGE_SCRIPT_SOURCE },
    }),
    react: reactGroupsStory(
      [{ title: "Large dataset", content: <LargeDemo /> }],
      undefined,
      largeSource,
    ),
  }),
  name: "Large dataset",
};
export const Server: StoryObj = {
  ...frameworkStory({
    html: snippetStory(snippets, "server", [["Server side", "group"]], SETUP, undefined, {
      group: { script: serverScript, scriptSource: SERVER_SCRIPT_SOURCE },
    }),
    react: reactGroupsStory(
      [{ title: "Server side", content: <ServerDemo /> }],
      undefined,
      serverSource,
    ),
  }),
  name: "Server side",
};

export const TreeData: StoryObj = { ...story("tree"), name: "Tree data" };
export const MasterDetail: StoryObj = { ...story("detail"), name: "Master detail" };
export const Ordering: StoryObj = { ...story("ordering"), name: "Row ordering and pinning" };
export const ColumnGroups: StoryObj = { ...story("groups"), name: "Column groups" };
export const ListView: StoryObj = { ...story("list"), name: "List view" };
export const LazyLoading: StoryObj = {
  ...frameworkStory({
    html: snippetStory(snippets, "lazy", [["Lazy loading", "group"]], SETUP, undefined, {
      group: { script: lazyScript, scriptSource: LAZY_SCRIPT_SOURCE },
    }),
    react: reactGroupsStory(
      [{ title: "Lazy loading", content: <LazyDemo /> }],
      undefined,
      lazySource,
    ),
  }),
  name: "Lazy loading",
};
