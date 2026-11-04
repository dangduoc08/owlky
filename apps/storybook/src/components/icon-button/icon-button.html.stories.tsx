import type { Meta, StoryObj } from "@storybook/react-vite";
import { snippetStory } from "../shared/snippets.js";
import { ICON_BUTTON_FILES } from "./icon-button-examples.js";

const snippets = import.meta.glob(
  "../../../../../packages/html/src/components/icon-button/examples/*.html",
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const story = (name: string) => snippetStory(snippets, name, ICON_BUTTON_FILES[name] ?? []);

const meta = { title: "HTML/Icon button", tags: ["!autodocs"] } satisfies Meta;
export default meta;

export const Base: StoryObj = story("base");
export const Colors: StoryObj = story("colors");
export const Sizes: StoryObj = story("sizes");
export const WithAnimate: StoryObj = { ...story("animate"), name: "With animate" };
