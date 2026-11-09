import { Link } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { LinkDocs } from "./link-docs.js";
import {
  ACCESSIBILITY_FILES,
  accessibilityGroups,
  basicGroups,
  colorGroups,
  files,
  LINK_CONTROLS,
  underlineGroups,
} from "./link-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/link/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const setup = htmlSetup(["typography.css", "link.css"]);

const meta = {
  title: "Components/Link",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: LinkDocs,
      description: {
        component:
          "A link takes the reader to another page or place, in the theme's colors and type scale.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const BasicLinks: StoryObj = {
  ...frameworkStory({
    html: snippetStory(snippets, "basic", files("Basic links"), setup, LINK_CONTROLS),
    react: reactGroupsStory(basicGroups, { ...LINK_CONTROLS, target: Link }),
  }),
  name: "Basic links",
};

export const Underline: StoryObj = frameworkStory({
  html: snippetStory(snippets, "underline", files("Underline"), setup),
  react: reactGroupsStory(underlineGroups),
});

export const Colors: StoryObj = frameworkStory({
  html: snippetStory(snippets, "colors", files("Colors"), setup),
  react: reactGroupsStory(colorGroups),
});

export const Accessibility: StoryObj = frameworkStory({
  html: snippetStory(snippets, "accessibility", ACCESSIBILITY_FILES, setup),
  react: reactGroupsStory(accessibilityGroups),
});
