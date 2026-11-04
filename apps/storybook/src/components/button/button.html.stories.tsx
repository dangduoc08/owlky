import type { Meta, StoryObj } from "@storybook/react-vite";
import { htmlSetup, snippetStory } from "../shared/snippets.js";
import { GROUP_FILES } from "./button-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/button/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const SETUP = htmlSetup(["button.css"]);
const story = (variant: string) => snippetStory(snippets, variant, GROUP_FILES, SETUP);

const meta = { title: "HTML/Button/Button" } satisfies Meta;
export default meta;

export const Contained: StoryObj = story("contained");
export const Outlined: StoryObj = story("outlined");
export const Text: StoryObj = story("text");
export const Soft: StoryObj = story("soft");
