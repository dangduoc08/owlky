import { Scrollbar } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { ScrollbarDocs } from "./scrollbar-docs.js";
import {
  files,
  horizontalGroups,
  layoutGroups,
  SCROLLBAR_CONTROLS,
  verticalGroups,
} from "./scrollbar-examples.js";

const controls = { ...SCROLLBAR_CONTROLS, target: Scrollbar };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/scrollbar/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const setup = htmlSetup(["scrollbar.css"]);

const meta = {
  title: "Components/Scrollbar",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: ScrollbarDocs,
      description: {
        component:
          "Scrollbar areas keep long content in a fixed frame, with a thin scrollbar that matches the theme. Other components scroll by wrapping their content in one.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Vertical: StoryObj = frameworkStory({
  html: snippetStory(snippets, "vertical", files("Vertical"), setup, SCROLLBAR_CONTROLS),
  react: reactGroupsStory(verticalGroups, controls),
});

export const Horizontal: StoryObj = frameworkStory({
  html: snippetStory(snippets, "horizontal", files("Horizontal"), setup, SCROLLBAR_CONTROLS),
  react: reactGroupsStory(horizontalGroups, controls),
});

export const Layout: StoryObj = frameworkStory({
  html: snippetStory(
    snippets,
    "layout",
    files("Layout"),
    htmlSetup(["alert.css", "scrollbar.css"]),
    SCROLLBAR_CONTROLS,
  ),
  react: reactGroupsStory(layoutGroups, controls),
});
