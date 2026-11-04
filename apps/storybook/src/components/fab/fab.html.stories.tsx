import type { Meta, StoryObj } from "@storybook/react-vite";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { FAB_ANIMATE_FILES, FAB_FILES } from "./fab-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/fab/examples/*.html",
  {
    query: "?raw",
    import: "default",
    eager: true,
  },
) as Record<string, string>;

const SETUP = htmlSetup(["fab.css"]);

const meta = { title: "HTML/Button/Fab" } satisfies Meta;
export default meta;

export const Default: StoryObj = snippetStory(snippets, "contained", FAB_FILES, SETUP);
export const Outlined: StoryObj = snippetStory(snippets, "outlined", FAB_FILES, SETUP);
export const Soft: StoryObj = snippetStory(snippets, "soft", FAB_FILES, SETUP);
export const WithAnimate: StoryObj = {
  ...snippetStory(snippets, "animate", FAB_ANIMATE_FILES, SETUP),
  name: "With animate",
};
