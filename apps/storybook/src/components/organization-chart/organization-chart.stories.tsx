import { OrganizationChart } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { JSX } from "react";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { GroupChartDemo } from "./group-demo.js";
import groupSource from "./group-demo.tsx?raw";
import { OrganizationChartDocs } from "./organization-chart-docs.js";
import {
  ORGANIZATION_CHART_CONTROLS,
  ORGANIZATION_CHART_FILES,
  organizationChartStories,
} from "./organization-chart-examples.js";
import { StandardChartDemo } from "./standard-demo.js";
import standardSource from "./standard-demo.tsx?raw";

const controls: StoryControls = { ...ORGANIZATION_CHART_CONTROLS, target: OrganizationChart };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/organization-chart/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const CSS = ["typography.css", "scrollbar.css", "organization-chart.css"];
const WITH_CARDS = [
  "paper.css",
  "typography.css",
  "card.css",
  "scrollbar.css",
  "organization-chart.css",
  "avatar.css",
  "icon-button.css",
  "label.css",
  "list.css",
  "popover.css",
  "menu.css",
];

/** Stateless examples: the same Controls in both frameworks. */
const story = (name: string, label?: string): StoryObj => ({
  ...frameworkStory({
    html: snippetStory(
      snippets,
      name,
      ORGANIZATION_CHART_FILES[name] ?? [],
      htmlSetup(CSS, true),
      ORGANIZATION_CHART_CONTROLS,
    ),
    react: reactGroupsStory(organizationChartStories[name] ?? [], controls),
  }),
  ...(label ? { name: label } : {}),
});

/** Examples with menus keep state: the demo's source is the React code (no Controls). */
const demoStory = (name: string, title: string, demo: JSX.Element, source: string): StoryObj =>
  frameworkStory({
    html: snippetStory(snippets, name, [[title, "group"]], htmlSetup(WITH_CARDS, true)),
    react: reactGroupsStory([{ title, content: demo }], undefined, source),
  });

const meta = {
  title: "Components/Organization chart",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: OrganizationChartDocs,
      description: {
        component:
          "An organization chart shows a hierarchy, such as the people of a company, as a tree of nodes joined by lines.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Simple: StoryObj = story("simple");
export const Standard: StoryObj = demoStory(
  "standard",
  "Standard",
  <StandardChartDemo />,
  standardSource,
);
export const Group: StoryObj = demoStory("group", "Group", <GroupChartDemo />, groupSource);
export const Lines: StoryObj = story("lines");
