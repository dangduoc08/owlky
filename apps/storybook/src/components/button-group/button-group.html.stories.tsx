import type { Meta, StoryObj } from "@storybook/react-vite";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { BUTTON_GROUP_FILES, ORIENTATION_FILES, SIZE_FILES } from "./button-group-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/button-group/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const SETUP = htmlSetup(["button.css", "button-group.css"]);

const meta = { title: "HTML/Button/Button group" } satisfies Meta;
export default meta;

export const Contained: StoryObj = snippetStory(snippets, "contained", BUTTON_GROUP_FILES, SETUP);
export const Outlined: StoryObj = snippetStory(snippets, "outlined", BUTTON_GROUP_FILES, SETUP);
export const Text: StoryObj = snippetStory(snippets, "text", BUTTON_GROUP_FILES, SETUP);
export const Soft: StoryObj = snippetStory(snippets, "soft", BUTTON_GROUP_FILES, SETUP);
export const Sizes: StoryObj = snippetStory(snippets, "sizes", SIZE_FILES, SETUP);
export const Orientation: StoryObj = snippetStory(
  snippets,
  "orientation",
  ORIENTATION_FILES,
  SETUP,
);
