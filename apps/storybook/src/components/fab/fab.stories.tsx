import { Fab } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { FabDocs } from "./fab-docs.js";
import {
  animateGroups,
  FAB_ANIMATE_FILES,
  FAB_CONTROLS,
  FAB_FILES,
  fabGroups,
} from "./fab-examples.js";

const controls: StoryControls = { ...FAB_CONTROLS, target: Fab };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/fab/examples/*.html",
  {
    query: "?raw",
    import: "default",
    eager: true,
  },
) as Record<string, string>;

const SETUP = htmlSetup(["fab.css"]);

const meta = {
  title: "Components/Button/Fab",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: FabDocs,
      description: {
        component:
          "A floating action button holds the most important action of a screen. It is round with an icon, or extended with an icon and a label.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Default: StoryObj = frameworkStory({
  html: snippetStory(snippets, "contained", FAB_FILES, SETUP, FAB_CONTROLS),
  react: reactGroupsStory(fabGroups("contained"), controls),
});

export const Outlined: StoryObj = frameworkStory({
  html: snippetStory(snippets, "outlined", FAB_FILES, SETUP, FAB_CONTROLS),
  react: reactGroupsStory(fabGroups("outlined"), controls),
});

export const Soft: StoryObj = frameworkStory({
  html: snippetStory(snippets, "soft", FAB_FILES, SETUP, FAB_CONTROLS),
  react: reactGroupsStory(fabGroups("soft"), controls),
});

export const WithAnimate: StoryObj = frameworkStory({
  html: {
    ...snippetStory(snippets, "animate", FAB_ANIMATE_FILES, SETUP, FAB_CONTROLS),
    name: "With animate",
  },
  react: {
    ...reactGroupsStory(animateGroups, controls),
    name: "With animate",
  },
});
