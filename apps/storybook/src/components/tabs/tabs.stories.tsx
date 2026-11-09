import { Tabs } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { TabsDocs } from "./tabs-docs.js";
import { TABS_CONTROLS, TABS_FILES, tabsStories } from "./tabs-examples.js";
import { TextDemo } from "./text-demo.js";
import textSource from "./text-demo.tsx?raw";
import { VerticalDemo } from "./vertical-demo.js";
import verticalSource from "./vertical-demo.tsx?raw";

const controls: StoryControls = { ...TABS_CONTROLS, target: Tabs };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/tabs/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const SETUP = htmlSetup(["tabs.css", "typography.css"], true);

/** A story whose examples have no state: the same Controls in both frameworks. */
const story = (name: string): StoryObj =>
  frameworkStory({
    html: snippetStory(snippets, name, TABS_FILES[name] ?? [], SETUP, TABS_CONTROLS),
    react: reactGroupsStory(tabsStories[name] ?? [], controls),
  });

const meta = {
  title: "Components/Tabs",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: TabsDocs,
      description: {
        component:
          "Tabs organize related content into views and let you switch between them without leaving the page.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Text: StoryObj = frameworkStory({
  html: snippetStory(snippets, "text", TABS_FILES["text"] ?? [], SETUP),
  react: reactGroupsStory([{ title: "Text", content: <TextDemo /> }], undefined, textSource),
});

export const Icon: StoryObj = story("icon");

export const Colors: StoryObj = story("colors");

export const Scrollable: StoryObj = story("scrollable");

export const Vertical: StoryObj = frameworkStory({
  html: snippetStory(snippets, "vertical", TABS_FILES["vertical"] ?? [], SETUP),
  react: reactGroupsStory(
    [{ title: "Vertical", content: <VerticalDemo /> }],
    undefined,
    verticalSource,
  ),
});

export const Custom: StoryObj = story("custom");
