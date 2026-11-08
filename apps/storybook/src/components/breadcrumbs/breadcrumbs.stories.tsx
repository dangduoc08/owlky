import { Breadcrumbs } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { BreadcrumbsDocs } from "./breadcrumbs-docs.js";
import {
  BREADCRUMBS_CONTROLS,
  BREADCRUMBS_FILES,
  breadcrumbsStories,
} from "./breadcrumbs-examples.js";

const controls: StoryControls = { ...BREADCRUMBS_CONTROLS, target: Breadcrumbs };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/breadcrumbs/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const story = (name: string, css: string[]): StoryObj =>
  frameworkStory({
    html: snippetStory(
      snippets,
      name,
      BREADCRUMBS_FILES[name] ?? [],
      htmlSetup(css, true),
      BREADCRUMBS_CONTROLS,
    ),
    react: reactGroupsStory(breadcrumbsStories[name] ?? [], controls),
  });

const meta = {
  title: "Components/Breadcrumbs",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: BreadcrumbsDocs,
      description: {
        component:
          "Breadcrumbs show where the current page sits in the site's hierarchy and link back to each level above it.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Text: StoryObj = story("text", ["breadcrumbs.css"]);

export const WithIcon: StoryObj = {
  ...story("with-icon", ["breadcrumbs.css"]),
  name: "With icon",
};

export const Customized: StoryObj = story("customized", ["breadcrumbs.css", "button.css"]);
