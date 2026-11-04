import type { Meta, StoryObj } from "@storybook/react-vite";
import { snippetStory } from "../shared/snippets.js";
import { FAB_ANIMATE_FILES, FAB_FILES } from "./fab-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/fab/examples/*.html",
  {
    query: "?raw",
    import: "default",
    eager: true,
  },
) as Record<string, string>;

const meta = { title: "HTML/Fab", tags: ["!autodocs"] } satisfies Meta;
export default meta;

export const Default: StoryObj = snippetStory(snippets, "contained", FAB_FILES);
export const Outlined: StoryObj = snippetStory(snippets, "outlined", FAB_FILES);
export const Soft: StoryObj = snippetStory(snippets, "soft", FAB_FILES);
export const WithAnimate: StoryObj = {
  ...snippetStory(snippets, "animate", FAB_ANIMATE_FILES),
  name: "With animate",
};
