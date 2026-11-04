import type { Meta, StoryObj } from "@storybook/react-vite";
import { htmlGroupsStory } from "../../helpers/groups.js";
import { GROUP_FILES } from "./button-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/button/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const snippet = (variant: string, file: string) => {
  const html = Object.entries(snippets).find(([path]) => path.endsWith(`/${variant}-${file}.html`));
  if (!html) throw new Error(`Missing snippet ${variant}-${file}.html`);
  return html[1];
};

const variantStory = (variant: string): StoryObj =>
  htmlGroupsStory(GROUP_FILES.map(([title, file]) => ({ title, html: snippet(variant, file) })));

const meta = { title: "HTML/Button", tags: ["!autodocs"] } satisfies Meta;
export default meta;

export const Contained: StoryObj = variantStory("contained");
export const Outlined: StoryObj = variantStory("outlined");
export const Text: StoryObj = variantStory("text");
export const Soft: StoryObj = variantStory("soft");
