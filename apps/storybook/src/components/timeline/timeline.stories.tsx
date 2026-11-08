import { Timeline } from "@owlky/react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { frameworkStory, reactGroupsStory, type StoryControls } from "../../helpers/groups.js";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { TimelineDocs } from "./timeline-docs.js";
import { TIMELINE_CONTROLS, TIMELINE_FILES, timelineStories } from "./timeline-examples.js";

const controls: StoryControls = { ...TIMELINE_CONTROLS, target: Timeline };

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/timeline/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const SETUP = htmlSetup(["timeline.css"]);

const story = (name: string, label?: string): StoryObj => ({
  ...frameworkStory({
    html: snippetStory(snippets, name, TIMELINE_FILES[name] ?? [], SETUP, TIMELINE_CONTROLS),
    react: reactGroupsStory(timelineStories[name] ?? [], controls),
  }),
  ...(label ? { name: label } : {}),
});

const meta = {
  title: "Components/Timeline",
  tags: ["autodocs"],
  parameters: {
    docs: {
      page: TimelineDocs,
      description: {
        component: "A timeline shows a list of events in order, along a line.",
      },
    },
  },
} satisfies Meta;
export default meta;

export const Left: StoryObj = story("left");
export const Right: StoryObj = story("right");
export const Alternating: StoryObj = story("alternating");
export const Filled: StoryObj = story("filled");
export const Outlined: StoryObj = story("outlined");
export const Opposite: StoryObj = story("opposite", "Opposite content");
export const Customized: StoryObj = story("customized");
