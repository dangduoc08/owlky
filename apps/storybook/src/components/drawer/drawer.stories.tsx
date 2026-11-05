import { DrawerContent } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { DrawerDocs } from "./drawer-docs.js";
import {
  ANCHOR_FILES,
  anchorGroups,
  DRAWER_CONTROLS,
  VARIANT_FILES,
  variantGroups,
} from "./drawer-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/drawer/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const meta = {
  title: "Components/Drawer",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: DrawerDocs,
      description: {
        component:
          "Drawers are panels that slide in from an edge of the screen, for navigation, filters or details. They open as a modal or sit next to the page.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Anchor: StoryObj = frameworkStory({
  html: snippetStory(
    snippets,
    "anchor",
    ANCHOR_FILES,
    htmlSetup(["button.css", "scrollbar.css", "drawer.css"], true),
    DRAWER_CONTROLS,
  ),
  react: reactGroupsStory(anchorGroups, {
    ...DRAWER_CONTROLS,
    target: DrawerContent,
  }),
});

export const Variants: StoryObj = frameworkStory({
  html: {
    ...snippetStory(
      snippets,
      "variants",
      VARIANT_FILES,
      htmlSetup(["button.css", "scrollbar.css", "drawer.css"], true),
    ),
    name: "Persistent & permanent",
  },
  react: {
    ...reactGroupsStory(variantGroups),
    name: "Persistent & permanent",
  },
});
