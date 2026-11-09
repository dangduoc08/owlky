import { Typography } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { TypographyDocs } from "./typography-docs.js";
import {
  alignmentGroups,
  colorGroups,
  files,
  semanticGroups,
  TYPOGRAPHY_CONTROLS,
  themeKeysGroups,
  usageGroups,
} from "./typography-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/typography/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const setup = htmlSetup(["typography.css"]);

const meta = {
  title: "Components/Typography",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: TypographyDocs,
      description: {
        component:
          "Typography sets text in one step of the type scale, such as a heading, body text or a caption.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Usage: StoryObj = frameworkStory({
  html: snippetStory(snippets, "usage", files("Usage"), setup, TYPOGRAPHY_CONTROLS),
  react: reactGroupsStory(usageGroups, { ...TYPOGRAPHY_CONTROLS, target: Typography }),
});

export const ThemeKeys: StoryObj = {
  ...frameworkStory({
    html: snippetStory(snippets, "theme-keys", files("Theme keys"), htmlSetup([])),
    react: reactGroupsStory(themeKeysGroups),
  }),
  name: "Theme keys",
};

export const SemanticElement: StoryObj = {
  ...frameworkStory({
    html: snippetStory(snippets, "semantic-element", files("Changing the semantic element"), setup),
    react: reactGroupsStory(semanticGroups),
  }),
  name: "Changing the semantic element",
};

export const Colors: StoryObj = frameworkStory({
  html: snippetStory(snippets, "colors", files("Colors"), setup),
  react: reactGroupsStory(colorGroups),
});

export const Alignment: StoryObj = {
  ...frameworkStory({
    html: snippetStory(
      snippets,
      "alignment",
      [
        ["Align", "align"],
        ["No wrap", "no-wrap"],
      ],
      setup,
    ),
    react: reactGroupsStory(alignmentGroups),
  }),
  name: "Alignment and wrapping",
};
