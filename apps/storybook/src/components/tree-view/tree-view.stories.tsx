import { SimpleTreeView } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { TreeViewDocs } from "./tree-view-docs.js";
import { TREE_VIEW_CONTROLS, TREE_VIEW_FILES, treeViewStories } from "./tree-view-examples.js";

const controls: StoryControls = { ...TREE_VIEW_CONTROLS, target: SimpleTreeView };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/tree-view/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const SETUP = htmlSetup(["tree-view.css", "checkbox.css"], true);

const story = (name: string, label: string): StoryObj => ({
  ...frameworkStory({
    html: snippetStory(snippets, name, TREE_VIEW_FILES[name] ?? [], SETUP, TREE_VIEW_CONTROLS),
    react: reactGroupsStory(treeViewStories[name] ?? [], controls),
  }),
  name: label,
});

const meta = {
  title: "Components/Tree view",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: TreeViewDocs,
      description: {
        component:
          "A tree view shows nested items, such as folders, that people expand and select.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Simple: StoryObj = story("simple", "Simple tree view");
export const Rich: StoryObj = story("rich", "Rich tree view");
export const CustomIcons: StoryObj = story("custom-icons", "Custom icons");
export const Checkbox: StoryObj = story("checkbox", "Checkbox selection");
export const CustomStyling: StoryObj = story("custom-styling", "Custom styling");
