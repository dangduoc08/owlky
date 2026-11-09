import { Divider } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { DividerDocs } from "./divider-docs.js";
import {
  childrenGroups,
  DIVIDER_CONTROLS,
  files,
  flexItemGroups,
  iconGroups,
  orientationGroups,
  variantGroups,
} from "./divider-examples.js";

const controls = { ...DIVIDER_CONTROLS, target: Divider };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/divider/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const setup = htmlSetup(["typography.css", "divider.css"]);
const story = (
  name: string,
  title: string,
  groups: Parameters<typeof reactGroupsStory>[0],
  css = setup,
  withControls = true,
) =>
  frameworkStory({
    html: snippetStory(
      snippets,
      name,
      files(title),
      css,
      withControls ? DIVIDER_CONTROLS : undefined,
    ),
    react: reactGroupsStory(groups, withControls ? controls : undefined),
  });

const meta = {
  title: "Components/Divider",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: DividerDocs,
      description: {
        component: "Dividers are thin lines that group content in lists and layouts.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Variants: StoryObj = story(
  "variants",
  "Variants",
  variantGroups,
  htmlSetup(["paper.css", "divider.css", "list.css"]),
);
export const Orientation: StoryObj = story(
  "orientation",
  "Orientation",
  orientationGroups,
  setup,
  false,
);
export const FlexItem: StoryObj = {
  ...story("flex-item", "Flex item", flexItemGroups, setup, false),
  name: "Flex item",
};
export const WithChildren: StoryObj = {
  ...story(
    "with-children",
    "With children",
    childrenGroups,
    htmlSetup(["typography.css", "divider.css", "chip.css"]),
    false,
  ),
  name: "With children",
};
export const IconGrouping: StoryObj = {
  ...story(
    "icon-grouping",
    "Icon grouping",
    iconGroups,
    htmlSetup(["paper.css", "card.css", "divider.css", "icon-button.css"]),
    false,
  ),
  name: "Icon grouping",
};
